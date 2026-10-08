from pydantic import EmailStr, Field

from app.models.enums import Role
from app.schemas.common import ApiModel

PhoneDigits = Field(pattern=r"^\d{6,15}$")


class OtpRequest(ApiModel):
    phone: str = PhoneDigits
    country_code: str = Field(default="IN", min_length=2, max_length=2)


class OtpRequestResult(ApiModel):
    sent: bool
    expires_in: int
    # Only populated when OTP_DEV_MODE is on (no SMS provider configured).
    dev_code: str | None = None


class OtpVerify(OtpRequest):
    code: str = Field(pattern=r"^\d{6}$")
    name: str | None = Field(default=None, max_length=120)


class AdminLogin(ApiModel):
    # Plain string: login only matches an existing account, so no deliverability check.
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1)


class UserOut(ApiModel):
    id: int
    role: Role
    name: str
    phone: str | None
    country_code: str
    email: str | None
    address: str | None
    city: str | None
    postal_code: str | None


class TokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=20)
