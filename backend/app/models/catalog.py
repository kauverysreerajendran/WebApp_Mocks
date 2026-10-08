from sqlalchemy import JSON, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OptionGroupKind
from app.models.user import enum_col


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_popular: Mapped[bool] = mapped_column(default=False)
    # Marketing title used on the home page "Popular Services" cards, e.g. "Designer Blouse"
    promo_title: Mapped[str | None] = mapped_column(String(120))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    # Measurement inputs the customer fills in: [{"key": "bust", "label": "Bust"}]
    measurement_fields: Mapped[list[dict]] = mapped_column(JSON, default=list)

    packages: Mapped[list["Package"]] = relationship(
        back_populates="service", order_by="Package.sort_order", cascade="all, delete-orphan"
    )
    option_groups: Mapped[list["OptionGroup"]] = relationship(
        back_populates="service", order_by="OptionGroup.sort_order", cascade="all, delete-orphan"
    )


class Package(Base):
    __tablename__ = "packages"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(300), default="")
    base_price: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    service: Mapped[Service] = relationship(back_populates="packages")


class OptionGroup(Base):
    """A customisation dimension, e.g. 'Sleeve Type' (choice) or 'Lining' (toggle)."""

    __tablename__ = "option_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(60))
    label: Mapped[str] = mapped_column(String(120))
    kind: Mapped[OptionGroupKind] = mapped_column(enum_col(OptionGroupKind))
    # Price added when a toggle is switched on
    toggle_price: Mapped[int] = mapped_column(Integer, default=0)
    default_on: Mapped[bool] = mapped_column(default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    service: Mapped[Service] = relationship(back_populates="option_groups")
    options: Mapped[list["Option"]] = relationship(
        back_populates="group", order_by="Option.sort_order", cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("option_groups.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(60))
    label: Mapped[str] = mapped_column(String(120))
    image_url: Mapped[str | None] = mapped_column(String(500))
    price_delta: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    group: Mapped[OptionGroup] = relationship(back_populates="options")
