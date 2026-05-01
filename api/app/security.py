from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import secrets

import bcrypt
from jose import jwt, JWTError

from app.config import settings

ALGORITHM = "HS256"
# bcrypt's hard limit. Anything beyond this is silently truncated by
# every bcrypt impl, so we explicitly truncate the byte representation.
_BCRYPT_MAX_BYTES = 72


def _prep(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prep(password), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(*, subject: str, is_admin: bool) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "adm": is_admin,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
        "typ": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("typ") != "access":
        return None
    return payload


def new_refresh_token() -> tuple[str, str, datetime]:
    raw = secrets.token_urlsafe(48)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return raw, digest, expires_at


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def create_file_token(*, username: str, rel_path: str, ttl_seconds: int = 300) -> str:
    """Short-lived token granting read access to one specific file path."""
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "pth": rel_path,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl_seconds)).timestamp()),
        "typ": "file",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_file_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("typ") != "file":
        return None
    return payload


def new_invite_code() -> tuple[str, str]:
    """Returns (raw_code, sha256_hash). The raw code is shown once and never stored."""
    raw = secrets.token_urlsafe(16)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return raw, digest


def hash_invite_code(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
