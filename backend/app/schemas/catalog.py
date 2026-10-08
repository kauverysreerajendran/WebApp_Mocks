from app.models.enums import OptionGroupKind
from app.schemas.common import ApiModel


class OptionOut(ApiModel):
    key: str
    label: str
    image_url: str | None
    price_delta: int


class OptionGroupOut(ApiModel):
    key: str
    label: str
    kind: OptionGroupKind
    toggle_price: int
    default_on: bool
    options: list[OptionOut]


class PackageOut(ApiModel):
    id: int
    slug: str
    name: str
    description: str
    base_price: int


class MeasurementField(ApiModel):
    key: str
    label: str


class ServiceSummary(ApiModel):
    id: int
    slug: str
    name: str
    category: str
    description: str
    image_url: str | None
    is_popular: bool
    promo_title: str | None
    starting_price: int
    packages: list[PackageOut]


class ServiceDetail(ServiceSummary):
    option_groups: list[OptionGroupOut]
    measurement_fields: list[MeasurementField]


class BookingMeta(ApiModel):
    visit_slots: list[str]
    visit_fee: int
    currency: str
    max_advance_days: int
