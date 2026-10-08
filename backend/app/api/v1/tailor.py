from typing import Literal

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import ApprovedTailor, CurrentTailor, DbSession
from app.models import Order, Package, Service, Settlement, TailorPrice
from app.models.enums import ACTIVE_STATUSES, KycDocType, OrderStatus, SettlementStatus
from app.schemas.order import OrderDetail, OrderListItem, SettlementOut
from app.schemas.tailor import (
    AvailabilityIn,
    BankDetailsIn,
    BasicDetailsIn,
    DashboardSummary,
    DeclineIn,
    PriceRow,
    PriceUpdate,
    TailorProfile,
    TailorStatusUpdate,
    Wallet,
)
from app.services import orders as order_service
from app.services import tailors as tailor_service

router = APIRouter(prefix="/tailor", tags=["tailor"])

# ---------- onboarding ----------


@router.get("/me", response_model=TailorProfile)
def get_profile(tailor: CurrentTailor) -> TailorProfile:
    return tailor_service.to_profile(tailor)


@router.put("/me/details", response_model=TailorProfile)
def update_details(body: BasicDetailsIn, tailor: CurrentTailor, db: DbSession) -> TailorProfile:
    tailor_service.ensure_editable(tailor)
    for field, value in body.model_dump().items():
        setattr(tailor, field, value.strip() if isinstance(value, str) else value)
    tailor.user.name = tailor.owner_name
    db.commit()
    return tailor_service.to_profile(tailor)


@router.put("/me/bank", response_model=TailorProfile)
def update_bank(body: BankDetailsIn, tailor: CurrentTailor, db: DbSession) -> TailorProfile:
    tailor_service.ensure_editable(tailor)
    tailor.bank_account_name = body.bank_account_name.strip()
    tailor.bank_account_number = body.bank_account_number
    tailor.bank_ifsc = body.bank_ifsc
    db.commit()
    return tailor_service.to_profile(tailor)


@router.put("/me/availability", response_model=TailorProfile)
def update_availability(body: AvailabilityIn, tailor: CurrentTailor, db: DbSession) -> TailorProfile:
    # Availability stays editable after approval (Calendar & Availability screen).
    tailor.working_days = body.working_days
    tailor.open_time = body.open_time
    tailor.close_time = body.close_time
    tailor.break_start, tailor.break_end = body.break_start, body.break_end
    db.commit()
    return tailor_service.to_profile(tailor)


@router.post("/me/documents/{doc_type}", response_model=TailorProfile)
async def upload_document(doc_type: KycDocType, file: UploadFile, tailor: CurrentTailor, db: DbSession) -> TailorProfile:
    tailor_service.ensure_editable(tailor)
    await tailor_service.save_document(db, tailor, doc_type, file)
    return tailor_service.to_profile(tailor)


@router.get("/me/documents/{doc_type}/file")
def download_document(doc_type: KycDocType, tailor: CurrentTailor) -> FileResponse:
    doc = next((d for d in tailor.documents if d.doc_type == doc_type), None)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not uploaded")
    return FileResponse(doc.stored_path, media_type=doc.content_type, filename=doc.file_name)


@router.post("/me/submit", response_model=TailorProfile)
def submit(tailor: CurrentTailor, db: DbSession) -> TailorProfile:
    tailor_service.submit_for_review(tailor)
    db.commit()
    return tailor_service.to_profile(tailor)


# ---------- dashboard & orders (approved tailors) ----------

OrderTab = Literal["new", "active", "completed", "all"]
TAB_STATUSES: dict[str, set[OrderStatus]] = {
    "new": {OrderStatus.ASSIGNED},
    "active": set(ACTIVE_STATUSES),
    "completed": {OrderStatus.DELIVERED},
}


def _tailor_orders(db: DbSession, tailor_id: int, statuses: set[OrderStatus] | None, limit: int | None = None):
    query = (
        select(Order)
        .where(Order.tailor_id == tailor_id)
        .order_by(Order.created_at.desc())
        .options(*order_service.ORDER_LOADS)
    )
    if statuses:
        query = query.where(Order.status.in_(statuses))
    if limit:
        query = query.limit(limit)
    return db.scalars(query).all()


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(tailor: ApprovedTailor, db: DbSession) -> DashboardSummary:
    counts = dict(
        db.execute(
            select(Order.status, func.count()).where(Order.tailor_id == tailor.id).group_by(Order.status)
        ).all()
    )
    earnings = db.scalar(select(func.coalesce(func.sum(Settlement.net), 0)).where(Settlement.tailor_id == tailor.id))
    new_orders = counts.get(OrderStatus.ASSIGNED, 0)
    return DashboardSummary(
        new_orders=new_orders,
        active_orders=sum(counts.get(s, 0) for s in ACTIVE_STATUSES),
        completed_orders=counts.get(OrderStatus.DELIVERED, 0),
        earnings=int(earnings or 0),
        currency=order_service.CURRENCY,
        recent_orders=[order_service.to_list_item(o) for o in _tailor_orders(db, tailor.id, None, limit=5)],
        unread_notifications=new_orders,
    )


@router.get("/orders", response_model=list[OrderListItem])
def list_orders(tailor: ApprovedTailor, db: DbSession, tab: OrderTab = "all") -> list[OrderListItem]:
    return [order_service.to_list_item(o) for o in _tailor_orders(db, tailor.id, TAB_STATUSES.get(tab))]


def _tailor_order(db: DbSession, order_id: int, tailor_id: int) -> Order:
    order = order_service.get_order(db, order_id)
    if order.tailor_id != tailor_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.get("/orders/{order_id}", response_model=OrderDetail)
def get_order(order_id: int, tailor: ApprovedTailor, db: DbSession) -> OrderDetail:
    return order_service.to_detail(_tailor_order(db, order_id, tailor.id))


@router.post("/orders/{order_id}/accept", response_model=OrderDetail)
def accept_order(order_id: int, tailor: ApprovedTailor, db: DbSession) -> OrderDetail:
    order = _tailor_order(db, order_id, tailor.id)
    order_service.tailor_accept(order)
    db.commit()
    return order_service.to_detail(order)


@router.post("/orders/{order_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_order(order_id: int, body: DeclineIn, tailor: ApprovedTailor, db: DbSession) -> None:
    order = _tailor_order(db, order_id, tailor.id)
    order_service.tailor_decline(order, body.reason)
    db.commit()


@router.post("/orders/{order_id}/status", response_model=OrderDetail)
def update_status(order_id: int, body: TailorStatusUpdate, tailor: ApprovedTailor, db: DbSession) -> OrderDetail:
    order = _tailor_order(db, order_id, tailor.id)
    order_service.tailor_advance(order, body.status, body.note)
    db.commit()
    return order_service.to_detail(order_service.get_order(db, order.id))


# ---------- pricing ----------


@router.get("/pricing", response_model=list[PriceRow])
def get_pricing(tailor: ApprovedTailor, db: DbSession) -> list[PriceRow]:
    packages = db.scalars(
        select(Package)
        .join(Service)
        .where(Service.is_active.is_(True))
        .order_by(Service.sort_order, Package.sort_order)
        .options(selectinload(Package.service))
    ).all()
    mine = {p.package_id: p.price for p in tailor.prices}
    return [
        PriceRow(
            package_id=p.id,
            service_name=p.service.name,
            package_name=p.name,
            platform_price=p.base_price,
            my_price=mine.get(p.id),
        )
        for p in packages
    ]


@router.put("/pricing", response_model=list[PriceRow])
def update_pricing(body: list[PriceUpdate], tailor: ApprovedTailor, db: DbSession) -> list[PriceRow]:
    valid_ids = set(db.scalars(select(Package.id)).all())
    existing = {p.package_id: p for p in tailor.prices}
    for item in body:
        if item.package_id not in valid_ids:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Unknown package {item.package_id}")
        if item.package_id in existing:
            existing[item.package_id].price = item.price
        else:
            tailor.prices.append(TailorPrice(package_id=item.package_id, price=item.price))
    db.commit()
    return get_pricing(tailor, db)


# ---------- wallet ----------


@router.get("/wallet", response_model=Wallet)
def wallet(tailor: ApprovedTailor, db: DbSession) -> Wallet:
    settlements = db.scalars(
        select(Settlement).where(Settlement.tailor_id == tailor.id).order_by(Settlement.created_at.desc())
    ).all()
    paid = sum(s.net for s in settlements if s.status == SettlementStatus.PAID)
    lifetime = sum(s.net for s in settlements)
    return Wallet(
        currency=order_service.CURRENCY,
        available_balance=lifetime - paid,
        total_paid_out=paid,
        lifetime_earnings=lifetime,
        commission_percent=get_settings().commission_percent,
        settlements=[SettlementOut.model_validate(s) for s in settlements],
    )
