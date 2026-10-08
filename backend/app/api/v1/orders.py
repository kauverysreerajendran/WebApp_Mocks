from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import CustomerUser, DbSession
from app.models import Order
from app.models.enums import MeasurementMethod
from app.schemas.order import MeasurementValue, OrderCreate, OrderDetail, OrderListItem, SavedMeasurement, TrackResult
from app.services import orders as order_service

router = APIRouter(prefix="/orders", tags=["customer orders"])


def _own_order(db: DbSession, order_id: int, user: CustomerUser) -> Order:
    order = order_service.get_order(db, order_id)
    if order.customer_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.post("", response_model=OrderDetail, status_code=status.HTTP_201_CREATED)
def place_order(body: OrderCreate, user: CustomerUser, db: DbSession) -> OrderDetail:
    order = order_service.create_order(db, user.id, body)
    # Remember the contact details for next time.
    c = body.contact
    if not user.address:
        user.name = user.name or c.name
        user.email = user.email or str(c.email)
        user.address, user.city, user.postal_code = c.address, c.city, c.postal_code
        db.commit()
    return order_service.to_detail(order)


@router.get("", response_model=list[OrderListItem])
def my_orders(user: CustomerUser, db: DbSession) -> list[OrderListItem]:
    orders = db.scalars(
        select(Order)
        .where(Order.customer_id == user.id)
        .order_by(Order.created_at.desc())
        .options(*order_service.ORDER_LOADS)
    ).all()
    return [order_service.to_list_item(o) for o in orders]


@router.get("/measurements", response_model=list[SavedMeasurement])
def my_measurements(user: CustomerUser, db: DbSession) -> list[SavedMeasurement]:
    """Latest self-entered measurements per service, for reuse."""
    orders = db.scalars(
        select(Order)
        .where(Order.customer_id == user.id, Order.measurement_method == MeasurementMethod.SELF)
        .order_by(Order.created_at.desc())
        .options(*order_service.ORDER_LOADS)
    ).all()
    seen: set[int] = set()
    result: list[SavedMeasurement] = []
    for o in orders:
        if o.service_id in seen or not o.measurements:
            continue
        seen.add(o.service_id)
        labels = {f["key"]: f["label"] for f in o.service.measurement_fields}
        result.append(
            SavedMeasurement(
                order_id=o.id,
                service_name=o.service.name,
                unit=o.measurement_unit or "",
                values=[MeasurementValue(key=k, label=labels.get(k, k), value=v) for k, v in o.measurements.items()],
                created_at=o.created_at,
            )
        )
    return result


@router.get("/track/{order_id}", response_model=TrackResult)
def track_order(
    order_id: int, db: DbSession, phone: str = Query(min_length=6, max_length=20, pattern=r"^\d+$")
) -> TrackResult:
    """Public lookup by order number + the phone used at booking. Same 404 for either mismatch."""
    order = db.get(Order, order_id)
    if order is None or phone not in (order.contact_phone, order.customer.phone):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No order matches that number and phone")
    order = order_service.get_order(db, order_id)
    return TrackResult(
        id=order.id,
        status=order.status,
        service_name=order.service.name,
        package_name=order.package.name,
        city=order.city,
        measurement_method=order.measurement_method,
        visit_date=order.visit_date,
        visit_slot=order.visit_slot,
        tailor_name=order.tailor.shop_name if order.tailor else None,
        events=order.events,
        created_at=order.created_at,
    )


@router.get("/{order_id}", response_model=OrderDetail)
def my_order(order_id: int, user: CustomerUser, db: DbSession) -> OrderDetail:
    return order_service.to_detail(_own_order(db, order_id, user))


@router.post("/{order_id}/cancel", response_model=OrderDetail)
def cancel_order(order_id: int, user: CustomerUser, db: DbSession) -> OrderDetail:
    order = _own_order(db, order_id, user)
    order_service.customer_cancel(order)
    db.commit()
    return order_service.to_detail(order)
