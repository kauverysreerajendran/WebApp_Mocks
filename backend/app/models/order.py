from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Identity, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, utcnow
from app.models.catalog import Package, Service
from app.models.enums import MeasurementMethod, OrderStatus, PaymentStatus, Role, SettlementStatus
from app.models.tailor import Executive, Tailor
from app.models.user import User, enum_col


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    # Customer-facing order numbers start at #1251 (matches the client mock-ups).
    id: Mapped[int] = mapped_column(Identity(start=1251), primary_key=True)
    status: Mapped[OrderStatus] = mapped_column(enum_col(OrderStatus), default=OrderStatus.PLACED, index=True)

    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    package_id: Mapped[int] = mapped_column(ForeignKey("packages.id"))
    tailor_id: Mapped[int | None] = mapped_column(ForeignKey("tailors.id"), index=True)
    executive_id: Mapped[int | None] = mapped_column(ForeignKey("executives.id"), index=True)

    # Snapshot of chosen options: [{group_key, group_label, value_key, value_label, price}]
    customizations: Mapped[list[dict]] = mapped_column(JSON, default=list)

    measurement_method: Mapped[MeasurementMethod] = mapped_column(enum_col(MeasurementMethod))
    measurement_unit: Mapped[str | None] = mapped_column(String(4))
    measurements: Mapped[dict | None] = mapped_column(JSON)
    visit_date: Mapped[date | None] = mapped_column(Date)
    visit_slot: Mapped[str | None] = mapped_column(String(20))

    contact_name: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(20))
    contact_email: Mapped[str] = mapped_column(String(254))
    address: Mapped[str] = mapped_column(String(500))
    city: Mapped[str] = mapped_column(String(120))
    postal_code: Mapped[str] = mapped_column(String(20))
    country_code: Mapped[str] = mapped_column(String(2), default="IN")
    notes: Mapped[str | None] = mapped_column(Text)

    currency: Mapped[str] = mapped_column(String(3), default="INR")
    package_price: Mapped[int] = mapped_column(Integer)
    customization_price: Mapped[int] = mapped_column(Integer, default=0)
    visit_fee: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)

    customer: Mapped[User] = relationship(foreign_keys=[customer_id])
    service: Mapped[Service] = relationship()
    package: Mapped[Package] = relationship()
    tailor: Mapped[Tailor | None] = relationship()
    executive: Mapped[Executive | None] = relationship()
    events: Mapped[list["OrderEvent"]] = relationship(
        back_populates="order", order_by="OrderEvent.created_at", cascade="all, delete-orphan"
    )
    payment: Mapped["Payment | None"] = relationship(back_populates="order", uselist=False)
    settlement: Mapped["Settlement | None"] = relationship(back_populates="order", uselist=False)


class OrderEvent(Base):
    """Status timeline entry."""

    __tablename__ = "order_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    status: Mapped[OrderStatus] = mapped_column(enum_col(OrderStatus))
    actor_role: Mapped[Role] = mapped_column(enum_col(Role))
    note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="events")


class Payment(TimestampMixin, Base):
    """Customer payment for an order. Collected on delivery until a gateway is integrated."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True)
    amount: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    method: Mapped[str] = mapped_column(String(30), default="pay_on_delivery")
    status: Mapped[PaymentStatus] = mapped_column(enum_col(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order: Mapped[Order] = relationship(back_populates="payment")


class Settlement(TimestampMixin, Base):
    """Payout owed to a tailor for a delivered order."""

    __tablename__ = "settlements"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True)
    tailor_id: Mapped[int] = mapped_column(ForeignKey("tailors.id"), index=True)
    gross: Mapped[int] = mapped_column(Integer)
    commission: Mapped[int] = mapped_column(Integer)
    net: Mapped[int] = mapped_column(Integer)
    status: Mapped[SettlementStatus] = mapped_column(
        enum_col(SettlementStatus), default=SettlementStatus.PENDING, index=True
    )
    reference: Mapped[str | None] = mapped_column(String(80))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order: Mapped[Order] = relationship(back_populates="settlement")
    tailor: Mapped[Tailor] = relationship()
