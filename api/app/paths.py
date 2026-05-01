"""Path resolution with strict containment checks + user provisioning."""
import os
import grp
import stat
from pathlib import Path
from fastapi import HTTPException, status

from app.config import settings


def user_root(username: str) -> Path:
    return Path(settings.files_root) / username / "data"


def _safe_chmod(path: Path, mode: int) -> None:
    """chmod that survives systemd RestrictSUIDSGID: try the desired mode,
    fall back to one without setuid/setgid bits if EPERM."""
    try:
        os.chmod(path, mode)
    except PermissionError:
        os.chmod(path, mode & ~(stat.S_ISUID | stat.S_ISGID))


def ensure_user_root(username: str) -> Path:
    """Idempotent: create user_root if missing.

    Parent /srv/sujitverse/files/ already has setgid + group=sujitverse,
    so new dirs inherit the group correctly without us needing S_ISGID here.
    """
    base = Path(settings.files_root)
    user_dir = base / username
    data_dir = user_dir / "data"

    if not user_dir.exists():
        user_dir.mkdir(mode=0o775, exist_ok=True)
        _safe_chmod(user_dir, 0o2775)

    if not data_dir.exists():
        data_dir.mkdir(mode=0o770, exist_ok=True)
        # Try to set group to sftpusers so SFTP users can also read/write.
        # Failure is non-fatal — group still inherits from parent.
        try:
            sftpusers_gid = grp.getgrnam("sftpusers").gr_gid
            os.chown(data_dir, -1, sftpusers_gid)
        except (KeyError, PermissionError):
            pass
        _safe_chmod(data_dir, 0o2770)

    return data_dir


def resolve(username: str, rel: str) -> Path:
    if rel.startswith("/") or "\x00" in rel:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid path")
    root = ensure_user_root(username).resolve(strict=True)
    candidate = (root / rel).resolve(strict=False)
    try:
        candidate.relative_to(root)
    except ValueError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Path outside user root")
    return candidate


def relative_to_root(username: str, abs_path: Path) -> str:
    return str(abs_path.relative_to(user_root(username).resolve()))


RESERVED_USERNAMES = {
    "admin", "administrator", "root", "system", "api", "support",
    "help", "info", "www", "mail", "postmaster", "webmaster",
    "_shared", "shared", "public", "anon", "anonymous",
}


def is_reserved_username(name: str) -> bool:
    return name.lower() in RESERVED_USERNAMES
