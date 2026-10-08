from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import generate_otp, hash_secret, verify_secret
from app.models import OtpCode, Tailor, User
from app.models.enums import Role


def _aware(dt: datetime) -> datetime:
    # SQLite drops tzinfo; Postgres keeps it. Normalise for comparison.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def request_otp(db: Session, role: Role, phone: str) -> str:
    """Create a fresh OTP for (role, phone), invalidating earlier ones. Returns the plain code."""
    settings = get_settings()
    db.execute(
        update(OtpCode)
        .where(OtpCode.role == role, OtpCode.phone == phone, OtpCode.consumed.is_(False))
        .values(consumed=True)
    )
    code = generate_otp()
    db.add(
        OtpCode(
            role=role,
            phone=phone,
            code_hash=hash_secret(code),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.otp_ttl_seconds),
        )
    )
    db.commit()
    # Integration point: send `code` via the SMS provider here when OTP_DEV_MODE is off.
    return code


def verify_otp(db: Session, role: Role, phone: str, code: str) -> None:
    settings = get_settings()
    otp = db.scalar(
        select(OtpCode)
        .where(OtpCode.role == role, OtpCode.phone == phone, OtpCode.consumed.is_(False))
        .order_by(OtpCode.id.desc())
    )
    invalid = HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")
    if otp is None or _aware(otp.expires_at) < datetime.now(timezone.utc):
        raise invalid
    if otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Request a new code.")
    if not verify_secret(code, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise invalid
    otp.consumed = True
    db.commit()


def get_or_create_phone_user(db: Session, role: Role, phone: str, country_code: str, name: str | None) -> User:
    user = db.scalar(select(User).where(User.role == role, User.phone == phone))
    if user is None:
        user = User(role=role, phone=phone, country_code=country_code, name=(name or "").strip())
        db.add(user)
        db.flush()
        if role == Role.TAILOR:
            db.add(Tailor(user_id=user.id, country_code=country_code))
        db.commit()
    elif name and not user.name:
        user.name = name.strip()
        db.commit()
    return user


def authenticate_admin(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.role == Role.ADMIN, User.email == email.lower()))
    if user is None or not user.password_hash or not verify_secret(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return user
