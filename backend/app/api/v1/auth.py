from typing import Literal

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.deps import CurrentUser, CustomerUser, DbSession
from app.core.security import create_access_token
from app.models.enums import Role
from app.schemas.auth import (
    AdminLogin,
    OtpRequest,
    OtpRequestResult,
    OtpVerify,
    ProfileUpdate,
    TokenResponse,
    UserOut,
)
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

Portal = Literal["customer", "tailor"]


@router.post("/{portal}/otp/request", response_model=OtpRequestResult)
def request_otp(portal: Portal, body: OtpRequest, db: DbSession) -> OtpRequestResult:
    settings = get_settings()
    code = auth_service.request_otp(db, Role(portal), body.phone)
    return OtpRequestResult(
        sent=True,
        expires_in=settings.otp_ttl_seconds,
        dev_code=code if settings.otp_dev_mode else None,
    )


@router.post("/{portal}/otp/verify", response_model=TokenResponse)
def verify_otp(portal: Portal, body: OtpVerify, db: DbSession) -> TokenResponse:
    role = Role(portal)
    auth_service.verify_otp(db, role, body.phone, body.code)
    user = auth_service.get_or_create_phone_user(db, role, body.phone, body.country_code, body.name)
    return TokenResponse(access_token=create_access_token(user.id, role), user=UserOut.model_validate(user))


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(body: AdminLogin, db: DbSession) -> TokenResponse:
    user = auth_service.authenticate_admin(db, body.email, body.password)
    return TokenResponse(access_token=create_access_token(user.id, Role.ADMIN), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)


@router.put("/me", response_model=UserOut)
def update_me(body: ProfileUpdate, user: CustomerUser, db: DbSession) -> UserOut:
    for field, value in body.model_dump().items():
        setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    return UserOut.model_validate(user)
