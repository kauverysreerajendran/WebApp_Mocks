"""Import every model so Base.metadata is complete (Alembic autogenerate, create_all in tests)."""

from app.models.catalog import Option, OptionGroup, Package, Service
from app.models.order import Order, OrderEvent, Payment, Settlement
from app.models.tailor import Executive, KycDocument, Tailor, TailorPrice
from app.models.user import OtpCode, User

__all__ = [
    "Executive",
    "KycDocument",
    "Option",
    "OptionGroup",
    "Order",
    "OrderEvent",
    "OtpCode",
    "Package",
    "Payment",
    "Service",
    "Settlement",
    "Tailor",
    "TailorPrice",
    "User",
]
