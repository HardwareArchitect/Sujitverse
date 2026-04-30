from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.deps import require_admin, get_current_user
from app.models import User, RefreshToken
from app.schemas import (
    UserCreate, UserOut, LoginRequest,
    TokenPair, RefreshRequest, AccessTokenOnly,
)
from app.security import (
    hash_password, verify_password,
    create_access_token, new_refresh_token, hash_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    body: UserCreate,
    session: Session = Depends(get_session),
    _admin: User = Depends(require_admin),
):
    existing = session.exec(select(User).where(User.username == body.username)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        is_admin=body.is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == body.username)).first()
    if not user or not user.is_active or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    access = create_access_token(subject=user.username, is_admin=user.is_admin)
    raw, digest, expires_at = new_refresh_token()
    session.add(RefreshToken(user_id=user.id, token_hash=digest, expires_at=expires_at))
    session.commit()
    return TokenPair(access_token=access, refresh_token=raw)


@router.post("/refresh", response_model=AccessTokenOnly)
def refresh(body: RefreshRequest, session: Session = Depends(get_session)):
    digest = hash_refresh_token(body.refresh_token)
    token = session.exec(select(RefreshToken).where(RefreshToken.token_hash == digest)).first()
    if not token or token.revoked:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    if token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")
    user = session.get(User, token.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User inactive")
    return AccessTokenOnly(access_token=create_access_token(subject=user.username, is_admin=user.is_admin))


@router.post("/logout", status_code=204)
def logout(body: RefreshRequest, session: Session = Depends(get_session)):
    digest = hash_refresh_token(body.refresh_token)
    token = session.exec(select(RefreshToken).where(RefreshToken.token_hash == digest)).first()
    if token and not token.revoked:
        token.revoked = True
        session.add(token)
        session.commit()
    return


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
