from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=8, max_length=128)
    is_admin: bool = False


class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    is_active: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenOnly(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FileEntry(BaseModel):
    name: str
    path: str          # relative to user's root
    is_dir: bool
    size_bytes: int
    modified_at: float  # unix timestamp
    mime_type: str | None = None


class DirListing(BaseModel):
    path: str
    entries: list[FileEntry]
