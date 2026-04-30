"""Path resolution with strict containment checks.

Every public function takes a username and a user-supplied relative path,
resolves it under the user's data root, and refuses to return anything
outside that root.
"""
import os
from pathlib import Path
from fastapi import HTTPException, status

from app.config import settings


def user_root(username: str) -> Path:
    return Path(settings.files_root) / username / "data"


def ensure_user_root(username: str) -> Path:
    root = user_root(username)
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve(username: str, rel: str) -> Path:
    """Join rel under user_root, resolve, and assert containment.

    Raises 400 on traversal attempts or absolute paths. Does NOT require
    the target to exist yet (used by upload too).
    """
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
