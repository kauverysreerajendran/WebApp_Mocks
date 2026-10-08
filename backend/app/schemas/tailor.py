from pydantic import EmailStr, Field, field_validator, model_validator

from app.models.enums import KycDocType, OrderStatus, TailorStatus
from app.schemas.common import ApiModel, UtcDateTime
from app.schemas.order import OrderListItem, SettlementOut

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
TimeHHMM = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


class BasicDetailsIn(ApiModel):
    shop_name: str = Field(min_length=2, max_length=160)
    owner_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=3, max_length=20)


class BankDetailsIn(ApiModel):
    bank_account_name: str = Field(min_length=2, max_length=120)
    bank_account_number: str = Field(pattern=r"^\d{6,20}$")
    bank_ifsc: str = Field(pattern=r"^[A-Za-z]{4}0[A-Za-z0-9]{6}$")

    @field_validator("bank_ifsc")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.upper()


class AvailabilityIn(ApiModel):
    working_days: list[str]
    open_time: str = TimeHHMM
    close_time: str = TimeHHMM
    break_start: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    break_end: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @field_validator("working_days")
    @classmethod
    def valid_days(cls, days: list[str]) -> list[str]:
        cleaned = [d for d in WEEKDAYS if d in set(days)]
        if not cleaned:
            raise ValueError("Select at least one working day")
        if len(cleaned) != len(set(days)):
            raise ValueError("Unknown weekday")
        return cleaned

    @model_validator(mode="after")
    def check_hours(self) -> "AvailabilityIn":
        if self.open_time >= self.close_time:
            raise ValueError("Closing time must be after opening time")
        if (self.break_start is None) != (self.break_end is None):
            raise ValueError("Give both break start and end, or neither")
        if self.break_start and self.break_end:
            if self.break_start >= self.break_end:
                raise ValueError("Break end must be after break start")
            if self.break_start < self.open_time or self.break_end > self.close_time:
                raise ValueError("Break must fall within working hours")
        return self


class KycDocumentOut(ApiModel):
    id: int
    doc_type: KycDocType
    file_name: str
    content_type: str
    size_bytes: int
    uploaded_at: UtcDateTime


class TailorProfile(ApiModel):
    id: int
    status: TailorStatus
    rejection_reason: str | None
    submitted_at: UtcDateTime | None
    reviewed_at: UtcDateTime | None
    phone: str | None
    shop_name: str
    owner_name: str
    email: str | None
    address: str
    city: str
    postal_code: str
    country_code: str
    bank_account_name: str | None
    bank_account_number_masked: str | None
    bank_ifsc: str | None
    working_days: list[str]
    open_time: str
    close_time: str
    break_start: str | None = None
    break_end: str | None = None
    documents: list[KycDocumentOut]
    missing_steps: list[str]


class DashboardSummary(ApiModel):
    new_orders: int
    active_orders: int
    completed_orders: int
    earnings: int
    currency: str
    recent_orders: list[OrderListItem]
    unread_notifications: int


class TailorStatusUpdate(ApiModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=500)


class DeclineIn(ApiModel):
    reason: str | None = Field(default=None, max_length=500)


class PriceRow(ApiModel):
    package_id: int
    service_name: str
    package_name: str
    platform_price: int
    my_price: int | None


class PriceUpdate(ApiModel):
    package_id: int
    price: int = Field(ge=0, le=1_000_000)


class Wallet(ApiModel):
    currency: str
    available_balance: int  # pending + processing settlements
    total_paid_out: int
    lifetime_earnings: int
    commission_percent: float
    settlements: list[SettlementOut]
