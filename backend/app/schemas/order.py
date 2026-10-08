from datetime import date

from pydantic import EmailStr, Field, model_validator

from app.models.enums import MeasurementMethod, OrderStatus, PaymentStatus, Role, SettlementStatus
from app.schemas.common import ApiModel, UtcDateTime


class ContactIn(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r"^\d{6,15}$")
    email: EmailStr
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=3, max_length=20)
    country_code: str = Field(default="IN", min_length=2, max_length=2)


class OrderDraft(ApiModel):
    """Everything the customer chose in the booking flow. Used for quotes and order creation."""

    service_id: int
    package_id: int
    # choice groups: group_key -> option_key
    selections: dict[str, str] = Field(default_factory=dict)
    # toggle groups: group_key -> on/off
    toggles: dict[str, bool] = Field(default_factory=dict)
    measurement_method: MeasurementMethod
    measurement_unit: str | None = Field(default=None, pattern=r"^(cm|in)$")
    measurements: dict[str, float] | None = None
    visit_date: date | None = None
    visit_slot: str | None = None

    @model_validator(mode="after")
    def check_measurement(self) -> "OrderDraft":
        if self.measurement_method == MeasurementMethod.VISIT:
            if not self.visit_date or not self.visit_slot:
                raise ValueError("Visit date and time slot are required for a measurement visit")
        else:
            if not self.measurement_unit:
                raise ValueError("Measurement unit is required")
            if self.measurements and any(v <= 0 or v > 400 for v in self.measurements.values()):
                raise ValueError("Measurements must be positive numbers")
        return self


class OrderCreate(OrderDraft):
    contact: ContactIn
    notes: str | None = Field(default=None, max_length=1000)


class QuoteLine(ApiModel):
    label: str
    detail: str | None = None
    amount: int


class Quote(ApiModel):
    currency: str
    lines: list[QuoteLine]
    package_price: int
    customization_price: int
    visit_fee: int
    total: int


class CustomizationOut(ApiModel):
    group_key: str
    group_label: str
    value_key: str
    value_label: str
    price: int


class OrderEventOut(ApiModel):
    status: OrderStatus
    actor_role: Role
    note: str | None
    created_at: UtcDateTime


class PartyOut(ApiModel):
    id: int
    name: str
    phone: str | None = None


class PaymentOut(ApiModel):
    amount: int
    method: str
    status: PaymentStatus
    paid_at: UtcDateTime | None


class SettlementOut(ApiModel):
    id: int
    order_id: int
    gross: int
    commission: int
    net: int
    status: SettlementStatus
    reference: str | None
    paid_at: UtcDateTime | None
    created_at: UtcDateTime


class OrderListItem(ApiModel):
    id: int
    status: OrderStatus
    service_name: str
    package_name: str
    customer_name: str
    city: str
    total: int
    currency: str
    measurement_method: MeasurementMethod
    visit_date: date | None
    visit_slot: str | None
    tailor: PartyOut | None
    executive: PartyOut | None
    created_at: UtcDateTime
    updated_at: UtcDateTime


class OrderDetail(OrderListItem):
    customizations: list[CustomizationOut]
    measurement_unit: str | None
    measurements: dict[str, float] | None
    measurement_labels: dict[str, str]
    contact_name: str
    contact_phone: str
    contact_email: str
    address: str
    postal_code: str
    country_code: str
    notes: str | None
    package_price: int
    customization_price: int
    visit_fee: int
    events: list[OrderEventOut]
    payment: PaymentOut | None
    settlement: SettlementOut | None


class TrackEventOut(ApiModel):
    status: OrderStatus
    created_at: UtcDateTime


class TrackResult(ApiModel):
    """Public tracking view: progress only, no contact details, prices or notes."""

    id: int
    status: OrderStatus
    service_name: str
    package_name: str
    city: str
    measurement_method: MeasurementMethod
    visit_date: date | None
    visit_slot: str | None
    tailor_name: str | None
    events: list[TrackEventOut]
    created_at: UtcDateTime


class MeasurementValue(ApiModel):
    key: str
    label: str
    value: float


class SavedMeasurement(ApiModel):
    order_id: int
    service_name: str
    unit: str
    values: list[MeasurementValue]
    created_at: UtcDateTime
