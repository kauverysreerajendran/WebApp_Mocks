from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Tailor, User
from app.models.enums import Role, TailorStatus

DbSession = Annotated[Session, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", {"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise unauthorized
    decoded = decode_access_token(credentials.credentials)
    if decoded is None:
        raise unauthorized
    user_id, role = decoded
    user = db.get(User, user_id)
    if user is None or user.role != role:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(role: Role):
    def dependency(user: CurrentUser) -> User:
        if user.role != role:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed for this account")
        return user

    return dependency


CustomerUser = Annotated[User, Depends(require_role(Role.CUSTOMER))]
TailorUser = Annotated[User, Depends(require_role(Role.TAILOR))]
AdminUser = Annotated[User, Depends(require_role(Role.ADMIN))]


def get_current_tailor(user: TailorUser, db: DbSession) -> Tailor:
    tailor = db.scalar(select(Tailor).where(Tailor.user_id == user.id))
    if tailor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tailor profile not found")
    return tailor


CurrentTailor = Annotated[Tailor, Depends(get_current_tailor)]


def get_approved_tailor(tailor: CurrentTailor) -> Tailor:
    # Tailors can use the portal as soon as they submit their profile; admin verification happens
    # in the background (only approved tailors are offered for order assignment).
    if tailor.status == TailorStatus.DRAFT:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Complete and submit your profile first")
    return tailor


ApprovedTailor = Annotated[Tailor, Depends(get_approved_tailor)]
