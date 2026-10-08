from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, utcnow
from app.models.enums import KycDocType, TailorStatus
from app.models.user import User, enum_col

DEFAULT_WORKING_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"]


class Tailor(TimestampMixin, Base):
    __tablename__ = "tailors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    status: Mapped[TailorStatus] = mapped_column(enum_col(TailorStatus), default=TailorStatus.DRAFT, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Basic details
    shop_name: Mapped[str] = mapped_column(String(160), default="")
    owner_name: Mapped[str] = mapped_column(String(120), default="")
    email: Mapped[str | None] = mapped_column(String(254))
    address: Mapped[str] = mapped_column(String(500), default="")
    city: Mapped[str] = mapped_column(String(120), default="")
    postal_code: Mapped[str] = mapped_column(String(20), default="")
    country_code: Mapped[str] = mapped_column(String(2), default="IN")

    # Bank details (for payment settlement)
    bank_account_name: Mapped[str | None] = mapped_column(String(120))
    bank_account_number: Mapped[str | None] = mapped_column(String(34))
    bank_ifsc: Mapped[str | None] = mapped_column(String(20))

    # Availability
    working_days: Mapped[list[str]] = mapped_column(JSON, default=lambda: list(DEFAULT_WORKING_DAYS))
    open_time: Mapped[str] = mapped_column(String(5), default="09:00")
    close_time: Mapped[str] = mapped_column(String(5), default="19:00")
    # Optional daily break, e.g. lunch (Calendar & Availability screen).
    break_start: Mapped[str | None] = mapped_column(String(5))
    break_end: Mapped[str | None] = mapped_column(String(5))

    user: Mapped[User] = relationship()
    documents: Mapped[list["KycDocument"]] = relationship(back_populates="tailor", cascade="all, delete-orphan")
    prices: Mapped[list["TailorPrice"]] = relationship(back_populates="tailor", cascade="all, delete-orphan")


class KycDocument(Base):
    __tablename__ = "kyc_documents"
    __table_args__ = (UniqueConstraint("tailor_id", "doc_type", name="uq_kyc_documents_tailor_doc"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tailor_id: Mapped[int] = mapped_column(ForeignKey("tailors.id", ondelete="CASCADE"), index=True)
    doc_type: Mapped[KycDocType] = mapped_column(enum_col(KycDocType))
    file_name: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tailor: Mapped[Tailor] = relationship(back_populates="documents")


class TailorPrice(Base):
    """A tailor's own price for a package (Pricing Management)."""

    __tablename__ = "tailor_prices"
    __table_args__ = (UniqueConstraint("tailor_id", "package_id", name="uq_tailor_prices_tailor_package"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tailor_id: Mapped[int] = mapped_column(ForeignKey("tailors.id", ondelete="CASCADE"), index=True)
    package_id: Mapped[int] = mapped_column(ForeignKey("packages.id", ondelete="CASCADE"))
    price: Mapped[int] = mapped_column(Integer)

    tailor: Mapped[Tailor] = relationship(back_populates="prices")


class Executive(TimestampMixin, Base):
    """Field executive who visits customers for measurements / pickups."""

    __tablename__ = "executives"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    area: Mapped[str] = mapped_column(String(120), default="")
    is_active: Mapped[bool] = mapped_column(default=True)
