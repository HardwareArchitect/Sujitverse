import mimetypes
import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, status, Request,
)
from fastapi.responses import StreamingResponse, Response

from app.deps import get_current_user
from app.models import User
from app.paths import resolve, ensure_user_root, relative_to_root, user_root
from app.schemas import FileEntry, DirListing

router = APIRouter(prefix="/files", tags=["files"])

CHUNK = 1024 * 1024  # 1 MiB


def _entry(p: Path, username: str) -> FileEntry:
    st = p.stat()
    return FileEntry(
        name=p.name,
        path=relative_to_root(username, p),
        is_dir=p.is_dir(),
        size_bytes=st.st_size if p.is_file() else 0,
        modified_at=st.st_mtime,
        mime_type=mimetypes.guess_type(p.name)[0] if p.is_file() else None,
    )


def _list_dir(target: Path, username: str) -> DirListing:
    entries = []
    for child in sorted(target.iterdir(), key=lambda c: (not c.is_dir(), c.name.lower())):
        # Skip dotfiles for now; revisit if anyone complains
        if child.name.startswith("."):
            continue
        entries.append(_entry(child, username))
    return DirListing(path=relative_to_root(username, target), entries=entries)


@router.get("/", response_model=DirListing)
def list_root(user: User = Depends(get_current_user)):
    root = ensure_user_root(user.username)
    return _list_dir(root, user.username)


@router.post("/mkdir")
def make_dir(rel_path: str, user: User = Depends(get_current_user)):
    target = resolve(user.username, rel_path)
    if target.exists():
        raise HTTPException(status.HTTP_409_CONFLICT, "Already exists")
    target.mkdir(parents=True, exist_ok=False)
    return {"created": relative_to_root(user.username, target)}


@router.post("/upload")
async def upload(
    rel_path: str,
    upload_file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload a file to rel_path/<filename> under the user's root.

    rel_path is a folder (use "" or "/" for the user's root). The filename
    comes from upload_file.filename and is sanitized.
    """
    if upload_file.filename is None or "/" in upload_file.filename or upload_file.filename in (".", ".."):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid filename")
    parent = resolve(user.username, rel_path) if rel_path else ensure_user_root(user.username)
    if not parent.exists() or not parent.is_dir():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent folder not found")
    target = resolve(user.username, str(Path(rel_path) / upload_file.filename) if rel_path else upload_file.filename)
    if target.exists():
        raise HTTPException(status.HTTP_409_CONFLICT, "File already exists")
    # Stream to disk
    with target.open("wb") as out:
        while True:
            chunk = await upload_file.read(CHUNK)
            if not chunk:
                break
            out.write(chunk)
    os.chmod(target, 0o660)
    return {"uploaded": relative_to_root(user.username, target), "size": target.stat().st_size}


def _stream_file(path: Path, start: int, end: int):
    """Yield bytes from path[start..end] inclusive, in CHUNK pieces."""
    remaining = end - start + 1
    with path.open("rb") as f:
        f.seek(start)
        while remaining > 0:
            data = f.read(min(CHUNK, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data


@router.get("/download/{rel_path:path}")
def download(rel_path: str, request: Request, user: User = Depends(get_current_user)):
    target = resolve(user.username, rel_path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    file_size = target.stat().st_size
    mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"

    range_header = request.headers.get("range") or request.headers.get("Range")
    if range_header and range_header.startswith("bytes="):
        try:
            spec = range_header[len("bytes="):]
            start_s, end_s = spec.split("-", 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else file_size - 1
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Bad Range header")
        if start > end or end >= file_size:
            return Response(
                status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                headers={"Content-Range": f"bytes */{file_size}"},
            )
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
            "Content-Disposition": f'inline; filename="{target.name}"',
        }
        return StreamingResponse(_stream_file(target, start, end),
                                 status_code=status.HTTP_206_PARTIAL_CONTENT,
                                 media_type=mime, headers=headers)

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Disposition": f'inline; filename="{target.name}"',
    }
    return StreamingResponse(_stream_file(target, 0, file_size - 1),
                             media_type=mime, headers=headers)


@router.get("/list/{rel_path:path}", response_model=DirListing)
def list_path(rel_path: str, user: User = Depends(get_current_user)):
    target = resolve(user.username, rel_path)
    if not target.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if not target.is_dir():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Not a directory; use /files/download/")
    return _list_dir(target, user.username)


@router.delete("/{rel_path:path}")
def delete(rel_path: str, user: User = Depends(get_current_user)):
    target = resolve(user.username, rel_path)
    if not target.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if target == user_root(user.username).resolve():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete root")
    if target.is_dir():
        try:
            target.rmdir()  # only succeeds if empty
        except OSError:
            raise HTTPException(status.HTTP_409_CONFLICT, "Folder not empty")
    else:
        target.unlink()
    return {"deleted": rel_path}
