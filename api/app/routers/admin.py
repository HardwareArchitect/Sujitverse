from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.deps import require_admin
from app.models import Invite, User
from app.schemas import InviteCreate, InviteOut
from app.security import new_invite_code, hash_invite_code

router = APIRouter(prefix="/admin", tags=["admin"])


def _status_of(inv: Invite) -> str:
    if inv.revoked:
        return "revoked"
    if inv.used_at is not None:
        return "used"
    if inv.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return "expired"
    return "active"


def _to_out(inv: Invite, session: Session, raw_code: str | None = None) -> InviteOut:
    used_username = None
    if inv.used_by_user_id:
        u = session.get(User, inv.used_by_user_id)
        if u:
            used_username = u.username
    return InviteOut(
        id=inv.id,
        code=raw_code,
        created_at=inv.created_at.replace(tzinfo=timezone.utc).timestamp(),
        expires_at=inv.expires_at.replace(tzinfo=timezone.utc).timestamp(),
        used_at=inv.used_at.replace(tzinfo=timezone.utc).timestamp() if inv.used_at else None,
        used_by_username=used_username,
        revoked=inv.revoked,
        status=_status_of(inv),
    )


@router.post("/invites", response_model=InviteOut, status_code=201)
def create_invite(
    body: InviteCreate,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    # Cap check is informational here; the real cap is enforced at signup time.
    raw, digest = new_invite_code()
    expires_at = datetime.now(timezone.utc) + timedelta(days=body.expires_in_days)
    inv = Invite(
        code_hash=digest,
        created_by_user_id=admin.id,
        expires_at=expires_at,
    )
    session.add(inv)
    session.commit()
    session.refresh(inv)
    return _to_out(inv, session, raw_code=raw)


@router.get("/invites", response_model=list[InviteOut])
def list_invites(
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    invites = session.exec(select(Invite).order_by(Invite.created_at.desc())).all()
    return [_to_out(i, session) for i in invites]


@router.delete("/invites/{invite_id}", status_code=204)
def revoke_invite(
    invite_id: int,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    inv = session.get(Invite, invite_id)
    if not inv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite not found")
    if inv.used_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Already used; cannot revoke")
    inv.revoked = True
    session.add(inv)
    session.commit()


@router.get("/stats")
def stats(
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user_count = session.exec(select(User)).all()
    return {
        "user_count": len(user_count),
        "max_users": settings.max_users,
        "remaining_slots": max(0, settings.max_users - len(user_count)),
    }
