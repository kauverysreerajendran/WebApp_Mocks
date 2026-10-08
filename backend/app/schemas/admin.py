from pydantic import Field

from app.models.enums import OrderStatus, PaymentStatus, SettlementStatus, TailorStatus
from app.schemas.common import ApiModel, UtcDateTime


class AdminStats(ApiModel):
    total_orders: int
    unassigned_orders: int
    active_orders: int
    pending_verifications: int
    revenue: int
    pending_settlements: int
    currency: str


class TailorListItem(ApiModel):
    id: int
    status: TailorStatus
    shop_name: str
    owner_name: str
    phone: str | None
    city: str
    submitted_at: UtcDateTime | None
    active_orders: int
    completed_orders: int
    working_days: list[str]
    open_time: str
    close_time: str


class TailorOption(TailorListItem):
    """Tailor shown in the Assign Vendor picker, with their own rate for the order's package."""

    quoted_price: int | None
    same_city: bool


class VerificationDecision(ApiModel):
    approve: bool
    reason: str | None = Field(default=None, max_length=1000)


class AssignTailorIn(ApiModel):
    tailor_id: int


class AssignExecutiveIn(ApiModel):
    executive_id: int


class AdminStatusUpdate(ApiModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=500)


class ExecutiveIn(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r"^\d{6,15}$")
    area: str = Field(default="", max_length=120)
    is_active: bool = True


class ExecutiveOut(ApiModel):
    id: int
    name: str
    phone: str
    area: str
    is_active: bool
    open_visits: int


class PaymentRow(ApiModel):
    order_id: int
    customer_name: str
    amount: int
    currency: str
    method: str
    status: PaymentStatus
    paid_at: UtcDateTime | None
    created_at: UtcDateTime


class SettlementRow(ApiModel):
    id: int
    order_id: int
    tailor_id: int
    shop_name: str
    gross: int
    commission: int
    net: int
    status: SettlementStatus
    reference: str | None
    paid_at: UtcDateTime | None
    created_at: UtcDateTime


class SettlementUpdate(ApiModel):
    status: SettlementStatus
    reference: str | None = Field(default=None, max_length=80)


class PaymentsOverview(ApiModel):
    currency: str
    collected: int
    outstanding: int
    commission_earned: int
    settled_to_tailors: int
    payments: list[PaymentRow]
    settlements: list[SettlementRow]
