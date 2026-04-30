from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=64)
    hashed_password: str
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token_hash: str = Field(unique=True, index=True)
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FileMeta(SQLModel, table=True):
    """Metadata cache. Filesystem is source of truth; this is an index."""
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_username: str = Field(index=True, max_length=64)
    relative_path: str = Field(index=True)
    size_bytes: int
    mime_type: Optional[str] = None
    sha256: Optional[str] = None
    has_thumbnail: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
