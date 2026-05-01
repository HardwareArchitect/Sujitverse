from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.deps import require_admin, get_current_user
from app.models import User, RefreshToken, Invite
from app.paths import is_reserved_username, ensure_user_root
from app.ratelimit import login_limiter, signup_limiter, client_ip
from app.schemas import (
    UserCreate, UserOut, LoginRequest,
    TokenPair, RefreshRequest, AccessTokenOnly, SignupRequest,
)
from app.security import (
    hash_password, verify_password,
    create_access_token, new_refresh_token, hash_refresh_token,
    hash_invite_code,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_count(session: Session) -> int:
    return len(session.exec(select(User)).all())


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    body: UserCreate,
    session: Session = Depends(get_session),
    _admin: User = Depends(require_admin),
):
    if is_reserved_username(body.username):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reserved username")
    existing = session.exec(select(User).where(User.username == body.username)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    if _user_count(session) >= settings.max_users:
        raise HTTPException(status.HTTP_409_CONFLICT, "User cap reached")
    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        is_admin=body.is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    ensure_user_root(user.username)
    return user


@router.post("/signup", response_model=TokenPair, status_code=201)
def signup(
    body: SignupRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    """Public signup with single-use invite code. Rate-limited by IP."""
    signup_limiter.check(client_ip(request))

    if is_reserved_username(body.username):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reserved username")

    # Look up the invite by hash
    digest = hash_invite_code(body.invite_code)
    invite = session.exec(select(Invite).where(Invite.code_hash == digest)).first()
    if not invite or invite.revoked or invite.used_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or used invite code")
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invite expired")

    # Username availability + cap (atomic-ish under SQLite single-writer)
    if session.exec(select(User).where(User.username == body.username)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
    if _user_count(session) >= settings.max_users:
        raise HTTPException(status.HTTP_409_CONFLICT, "User cap reached. Contact admin.")

    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        is_admin=False,
    )
    session.add(user)
    session.flush()  # assign user.id
    ensure_user_root(user.username)

    invite.used_at = datetime.now(timezone.utc)
    invite.used_by_user_id = user.id
    session.add(invite)

    access = create_access_token(subject=user.username, is_admin=user.is_admin)
    raw, refresh_digest, expires_at = new_refresh_token()
    session.add(RefreshToken(user_id=user.id, token_hash=refresh_digest, expires_at=expires_at))
    session.commit()

    return TokenPair(access_token=access, refresh_token=raw)


@router.post("/login", response_model=TokenPair)
def login(
    body: LoginRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    login_limiter.check(client_ip(request))

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
