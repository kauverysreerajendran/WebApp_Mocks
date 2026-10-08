from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import DbSession
from app.models import OptionGroup, Service
from app.schemas.catalog import BookingMeta, ServiceDetail, ServiceSummary
from app.schemas.order import OrderDraft, Quote
from app.services.orders import CURRENCY, MAX_ADVANCE_DAYS, VISIT_SLOTS, price_draft

router = APIRouter(tags=["catalog"])


def _summary_fields(service: Service) -> dict:
    return {
        "id": service.id,
        "slug": service.slug,
        "name": service.name,
        "category": service.category,
        "description": service.description,
        "image_url": service.image_url,
        "is_popular": service.is_popular,
        "promo_title": service.promo_title,
        "starting_price": min((p.base_price for p in service.packages), default=0),
        "packages": service.packages,
    }


def _summary(service: Service) -> ServiceSummary:
    return ServiceSummary(**_summary_fields(service))


@router.get("/services", response_model=list[ServiceSummary])
def list_services(db: DbSession) -> list[ServiceSummary]:
    services = db.scalars(
        select(Service)
        .where(Service.is_active.is_(True))
        .order_by(Service.sort_order)
        .options(selectinload(Service.packages))
    ).all()
    return [_summary(s) for s in services]


@router.get("/services/{slug}", response_model=ServiceDetail)
def get_service(slug: str, db: DbSession) -> ServiceDetail:
    service = db.scalar(
        select(Service)
        .where(Service.slug == slug, Service.is_active.is_(True))
        .options(
            selectinload(Service.packages),
            selectinload(Service.option_groups).selectinload(OptionGroup.options),
        )
    )
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    return ServiceDetail(
        **_summary_fields(service),
        option_groups=service.option_groups,
        measurement_fields=service.measurement_fields,
    )


@router.get("/booking/meta", response_model=BookingMeta)
def booking_meta() -> BookingMeta:
    return BookingMeta(
        visit_slots=VISIT_SLOTS,
        visit_fee=get_settings().visit_fee,
        currency=CURRENCY,
        max_advance_days=MAX_ADVANCE_DAYS,
    )


@router.post("/orders/quote", response_model=Quote)
def quote(draft: OrderDraft, db: DbSession) -> Quote:
    return price_draft(db, draft).quote
