from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.deps import AdminUser, DbSession
from app.models import Executive, Order, Payment, Settlement, Tailor
from app.models.enums import (
    ACTIVE_STATUSES,
    KycDocType,
    MeasurementMethod,
    OrderStatus,
    PaymentStatus,
    SettlementStatus,
    TailorStatus,
)
from app.schemas.admin import (
    AdminStats,
    AdminStatusUpdate,
    AssignExecutiveIn,
    AssignTailorIn,
    ExecutiveIn,
    ExecutiveOut,
    PaymentRow,
    PaymentsOverview,
    SettlementRow,
    SettlementUpdate,
    TailorListItem,
    TailorOption,
    VerificationDecision,
)
from app.schemas.order import OrderDetail, OrderListItem
from app.schemas.tailor import TailorProfile
from app.services import orders as order_service
from app.services import tailors as tailor_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def stats(_: AdminUser, db: DbSession) -> AdminStats:
    counts = dict(db.execute(select(Order.status, func.count()).group_by(Order.status)).all())
    revenue = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == PaymentStatus.PAID)
    )
    pending_settlements = db.scalar(
        select(func.coalesce(func.sum(Settlement.net), 0)).where(Settlement.status != SettlementStatus.PAID)
    )
    pending_verifications = db.scalar(select(func.count()).where(Tailor.status == TailorStatus.PENDING))
    return AdminStats(
        total_orders=sum(counts.values()),
        unassigned_orders=counts.get(OrderStatus.PLACED, 0),
        active_orders=sum(counts.get(s, 0) for s in ACTIVE_STATUSES) + counts.get(OrderStatus.ASSIGNED, 0),
        pending_verifications=pending_verifications or 0,
        revenue=int(revenue or 0),
        pending_settlements=int(pending_settlements or 0),
        currency=order_service.CURRENCY,
    )


# ---------- orders ----------


@router.get("/orders", response_model=list[OrderListItem])
def list_orders(
    _: AdminUser,
    db: DbSession,
    status_filter: Annotated[OrderStatus | None, Query(alias="status")] = None,
    q: str | None = None,
    unassigned: bool = False,
    visits_only: Annotated[bool, Query(alias="visitsOnly")] = False,
    open_only: Annotated[bool, Query(alias="openOnly")] = False,
) -> list[OrderListItem]:
    query = select(Order).order_by(Order.created_at.desc()).options(*order_service.ORDER_LOADS)
    if status_filter:
        query = query.where(Order.status == status_filter)
    if unassigned:
        query = query.where(Order.status.in_([OrderStatus.PLACED, OrderStatus.ASSIGNED]))
    if visits_only:
        query = query.where(Order.measurement_method == MeasurementMethod.VISIT)
    if open_only:
        query = query.where(Order.status.not_in([OrderStatus.DELIVERED, OrderStatus.CANCELLED]))
    if q and (term := q.strip().lstrip("#")):
        like = f"%{term}%"
        conditions = [Order.contact_name.ilike(like), Order.contact_phone.ilike(like), Order.city.ilike(like)]
        if term.isdigit():
            conditions.append(Order.id == int(term))
        query = query.where(or_(*conditions))
    return [order_service.to_list_item(o) for o in db.scalars(query).all()]


@router.get("/orders/{order_id}", response_model=OrderDetail)
def get_order(order_id: int, _: AdminUser, db: DbSession) -> OrderDetail:
    return order_service.to_detail(order_service.get_order(db, order_id))


@router.get("/orders/{order_id}/tailor-options", response_model=list[TailorOption])
def tailor_options(order_id: int, _: AdminUser, db: DbSession) -> list[TailorOption]:
    order = order_service.get_order(db, order_id)
    tailors = db.scalars(
        select(Tailor)
        .where(Tailor.status == TailorStatus.APPROVED)
        .options(selectinload(Tailor.user), selectinload(Tailor.prices))
    ).all()
    counts = tailor_service.order_counts(db, [t.id for t in tailors])
    options = []
    for t in tailors:
        price = next((p.price for p in t.prices if p.package_id == order.package_id), None)
        active, completed = counts.get(t.id, (0, 0))
        options.append(
            TailorOption(
                **_tailor_item_fields(t, active, completed),
                quoted_price=price,
                same_city=t.city.strip().lower() == order.city.strip().lower(),
            )
        )
    # Same city first, then least busy.
    return sorted(options, key=lambda o: (not o.same_city, o.active_orders))


@router.post("/orders/{order_id}/assign-tailor", response_model=OrderDetail)
def assign_tailor(order_id: int, body: AssignTailorIn, _: AdminUser, db: DbSession) -> OrderDetail:
    order = order_service.get_order(db, order_id)
    tailor = db.get(Tailor, body.tailor_id)
    if tailor is None or tailor.status != TailorStatus.APPROVED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Choose an approved tailor")
    order_service.assign_tailor(order, tailor.id)
    db.commit()
    return order_service.to_detail(order_service.get_order(db, order_id))


@router.post("/orders/{order_id}/assign-executive", response_model=OrderDetail)
def assign_executive(order_id: int, body: AssignExecutiveIn, _: AdminUser, db: DbSession) -> OrderDetail:
    order = order_service.get_order(db, order_id)
    executive = db.get(Executive, body.executive_id)
    if executive is None or not executive.is_active:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Choose an active executive")
    if order.status in (OrderStatus.DELIVERED, OrderStatus.CANCELLED):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Order is closed")
    order.executive_id = executive.id
    db.commit()
    return order_service.to_detail(order_service.get_order(db, order_id))


@router.post("/orders/{order_id}/status", response_model=OrderDetail)
def set_status(order_id: int, body: AdminStatusUpdate, _: AdminUser, db: DbSession) -> OrderDetail:
    order = order_service.get_order(db, order_id)
    order_service.admin_set_status(order, body.status, body.note)
    db.commit()
    return order_service.to_detail(order_service.get_order(db, order_id))


# ---------- tailors / verification ----------


def _tailor_item_fields(t: Tailor, active: int, completed: int) -> dict:
    return {
        "id": t.id,
        "status": t.status,
        "shop_name": t.shop_name,
        "owner_name": t.owner_name,
        "phone": t.user.phone,
        "city": t.city,
        "submitted_at": t.submitted_at,
        "active_orders": active,
        "completed_orders": completed,
        "working_days": t.working_days,
        "open_time": t.open_time,
        "close_time": t.close_time,
    }


@router.get("/tailors", response_model=list[TailorListItem])
def list_tailors(
    _: AdminUser, db: DbSession, status_filter: Annotated[TailorStatus | None, Query(alias="status")] = None
) -> list[TailorListItem]:
    query = select(Tailor).options(selectinload(Tailor.user)).order_by(Tailor.submitted_at.desc().nulls_last())
    query = query.where(Tailor.status == status_filter) if status_filter else query.where(Tailor.status != TailorStatus.DRAFT)
    tailors = db.scalars(query).all()
    counts = tailor_service.order_counts(db, [t.id for t in tailors])
    return [TailorListItem(**_tailor_item_fields(t, *counts.get(t.id, (0, 0)))) for t in tailors]


def _get_tailor(db: DbSession, tailor_id: int) -> Tailor:
    tailor = db.get(Tailor, tailor_id)
    if tailor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tailor not found")
    return tailor


class AdminTailorDetail(TailorProfile):
    bank_account_number: str | None


@router.get("/tailors/{tailor_id}", response_model=AdminTailorDetail)
def get_tailor(tailor_id: int, _: AdminUser, db: DbSession) -> AdminTailorDetail:
    tailor = _get_tailor(db, tailor_id)
    return AdminTailorDetail(
        **tailor_service.to_profile(tailor).model_dump(), bank_account_number=tailor.bank_account_number
    )


@router.get("/tailors/{tailor_id}/documents/{doc_type}/file")
def tailor_document(tailor_id: int, doc_type: KycDocType, _: AdminUser, db: DbSession) -> FileResponse:
    tailor = _get_tailor(db, tailor_id)
    doc = next((d for d in tailor.documents if d.doc_type == doc_type), None)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not uploaded")
    return FileResponse(doc.stored_path, media_type=doc.content_type, filename=doc.file_name)


@router.post("/tailors/{tailor_id}/verify", response_model=TailorListItem)
def verify_tailor(tailor_id: int, body: VerificationDecision, _: AdminUser, db: DbSession) -> TailorListItem:
    tailor = _get_tailor(db, tailor_id)
    if tailor.status != TailorStatus.PENDING:
        raise HTTPException(status.HTTP_409_CONFLICT, "This application is not awaiting review")
    if not body.approve and not (body.reason and body.reason.strip()):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Give a reason for rejection")
    tailor.status = TailorStatus.APPROVED if body.approve else TailorStatus.REJECTED
    tailor.rejection_reason = None if body.approve else body.reason.strip()
    tailor.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return TailorListItem(**_tailor_item_fields(tailor, 0, 0))


# ---------- executives ----------


def _executive_out(db: DbSession, executives: list[Executive]) -> list[ExecutiveOut]:
    open_visits = dict(
        db.execute(
            select(Order.executive_id, func.count())
            .where(Order.executive_id.is_not(None), Order.status.not_in([OrderStatus.DELIVERED, OrderStatus.CANCELLED]))
            .group_by(Order.executive_id)
        ).all()
    )
    return [
        ExecutiveOut(
            id=e.id, name=e.name, phone=e.phone, area=e.area, is_active=e.is_active, open_visits=open_visits.get(e.id, 0)
        )
        for e in executives
    ]


@router.get("/executives", response_model=list[ExecutiveOut])
def list_executives(_: AdminUser, db: DbSession) -> list[ExecutiveOut]:
    return _executive_out(db, list(db.scalars(select(Executive).order_by(Executive.name)).all()))


@router.post("/executives", response_model=ExecutiveOut, status_code=status.HTTP_201_CREATED)
def create_executive(body: ExecutiveIn, _: AdminUser, db: DbSession) -> ExecutiveOut:
    executive = Executive(**body.model_dump())
    db.add(executive)
    db.commit()
    return _executive_out(db, [executive])[0]


@router.put("/executives/{executive_id}", response_model=ExecutiveOut)
def update_executive(executive_id: int, body: ExecutiveIn, _: AdminUser, db: DbSession) -> ExecutiveOut:
    executive = db.get(Executive, executive_id)
    if executive is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Executive not found")
    for field, value in body.model_dump().items():
        setattr(executive, field, value)
    db.commit()
    return _executive_out(db, [executive])[0]


# ---------- payments ----------


@router.get("/payments", response_model=PaymentsOverview)
def payments(_: AdminUser, db: DbSession) -> PaymentsOverview:
    pays = db.scalars(
        select(Payment).order_by(Payment.created_at.desc()).options(selectinload(Payment.order))
    ).all()
    settlements = db.scalars(
        select(Settlement).order_by(Settlement.created_at.desc()).options(selectinload(Settlement.tailor))
    ).all()
    return PaymentsOverview(
        currency=order_service.CURRENCY,
        collected=sum(p.amount for p in pays if p.status == PaymentStatus.PAID),
        outstanding=sum(p.amount for p in pays if p.status == PaymentStatus.PENDING),
        commission_earned=sum(s.commission for s in settlements),
        settled_to_tailors=sum(s.net for s in settlements if s.status == SettlementStatus.PAID),
        payments=[
            PaymentRow(
                order_id=p.order_id,
                customer_name=p.order.contact_name,
                amount=p.amount,
                currency=p.currency,
                method=p.method,
                status=p.status,
                paid_at=p.paid_at,
                created_at=p.created_at,
            )
            for p in pays
        ],
        settlements=[_settlement_row(s) for s in settlements],
    )


def _settlement_row(s: Settlement) -> SettlementRow:
    return SettlementRow(
        id=s.id,
        order_id=s.order_id,
        tailor_id=s.tailor_id,
        shop_name=s.tailor.shop_name,
        gross=s.gross,
        commission=s.commission,
        net=s.net,
        status=s.status,
        reference=s.reference,
        paid_at=s.paid_at,
        created_at=s.created_at,
    )


@router.put("/settlements/{settlement_id}", response_model=SettlementRow)
def update_settlement(settlement_id: int, body: SettlementUpdate, _: AdminUser, db: DbSession) -> SettlementRow:
    settlement = db.get(Settlement, settlement_id)
    if settlement is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Settlement not found")
    if settlement.status == SettlementStatus.PAID:
        raise HTTPException(status.HTTP_409_CONFLICT, "Settlement already paid")
    if body.status == SettlementStatus.PAID and not (body.reference and body.reference.strip()):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter the payment reference")
    settlement.status = body.status
    settlement.reference = body.reference.strip() if body.reference else settlement.reference
    if body.status == SettlementStatus.PAID:
        settlement.paid_at = datetime.now(timezone.utc)
    db.commit()
    return _settlement_row(settlement)
