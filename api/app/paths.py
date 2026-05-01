"""Path resolution with strict containment checks + user provisioning."""
import os
import grp
from pathlib import Path
from fastapi import HTTPException, status

from app.config import settings


def user_root(username: str) -> Path:
    return Path(settings.files_root) / username / "data"


def ensure_user_root(username: str) -> Path:
    """Idempotent: create user_root if missing with correct perms.

    Layout matches what we set up manually for the first user:
      /srv/sujitverse/files/<user>/         root:sujitverse 2775
        data/                               sujitverse:sftpusers 2770
    """
    base = Path(settings.files_root)
    user_dir = base / username
    data_dir = user_dir / "data"

    if not user_dir.exists():
        user_dir.mkdir(mode=0o2775, exist_ok=True)
    if not data_dir.exists():
        data_dir.mkdir(mode=0o2770, exist_ok=True)
        # Set group to sftpusers so SFTP users in that group can also read/write
        try:
            sftpusers_gid = grp.getgrnam("sftpusers").gr_gid
            os.chown(data_dir, os.geteuid(), sftpusers_gid)
            # Re-apply mode after chown (chown clears setgid on some kernels)
            os.chmod(data_dir, 0o2770)
        except (KeyError, PermissionError):
            # If sftpusers doesn't exist or we can't chown, leave at default group.
            pass

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
