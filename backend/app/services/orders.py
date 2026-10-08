from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models import Option, OptionGroup, Order, OrderEvent, Package, Payment, Service, Settlement
from app.models.enums import (
    TAILOR_FLOW,
    MeasurementMethod,
    OptionGroupKind,
    OrderStatus,
    PaymentStatus,
    Role,
)
from app.schemas.order import (
    CustomizationOut,
    OrderCreate,
    OrderDetail,
    OrderDraft,
    OrderListItem,
    PartyOut,
    Quote,
    QuoteLine,
)

VISIT_SLOTS = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00", "18:00-19:00"]
MAX_ADVANCE_DAYS = 60
CURRENCY = "INR"


def bad_request(message: str) -> HTTPException:
    return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, message)


@dataclass
class PricedDraft:
    service: Service
    package: Package
    customizations: list[dict]
    quote: Quote


def load_service(db: Session, service_id: int) -> Service:
    service = db.scalar(
        select(Service)
        .where(Service.id == service_id, Service.is_active.is_(True))
        .options(
            selectinload(Service.packages),
            selectinload(Service.option_groups).selectinload(OptionGroup.options),
        )
    )
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    return service


def price_draft(db: Session, draft: OrderDraft, today: date | None = None) -> PricedDraft:
    """Validate a booking draft against the catalogue and compute its price server-side."""
    settings = get_settings()
    service = load_service(db, draft.service_id)
    package = next((p for p in service.packages if p.id == draft.package_id), None)
    if package is None:
        raise bad_request("Package does not belong to this service")

    customizations: list[dict] = []
    lines = [QuoteLine(label=f"{service.name} – {package.name}", amount=package.base_price)]
    customization_total = 0

    for group in service.option_groups:
        if group.kind == OptionGroupKind.CHOICE:
            chosen_key = draft.selections.get(group.key)
            if chosen_key is None:
                raise bad_request(f"Choose a {group.label}")
            option: Option | None = next((o for o in group.options if o.key == chosen_key), None)
            if option is None:
                raise bad_request(f"Unknown option for {group.label}")
            price, value_key, value_label = option.price_delta, option.key, option.label
        else:
            on = draft.toggles.get(group.key, group.default_on)
            price = group.toggle_price if on else 0
            value_key, value_label = ("yes", "Yes") if on else ("no", "No")

        customizations.append(
            {
                "group_key": group.key,
                "group_label": group.label,
                "value_key": value_key,
                "value_label": value_label,
                "price": price,
            }
        )
        if price:
            lines.append(QuoteLine(label=group.label, detail=value_label, amount=price))
            customization_total += price

    unknown = (set(draft.selections) | set(draft.toggles)) - {g.key for g in service.option_groups}
    if unknown:
        raise bad_request(f"Unknown customisation: {', '.join(sorted(unknown))}")

    visit_fee = 0
    if draft.measurement_method == MeasurementMethod.VISIT:
        today = today or date.today()
        assert draft.visit_date is not None
        if draft.visit_date < today or draft.visit_date > today + timedelta(days=MAX_ADVANCE_DAYS):
            raise bad_request("Choose a visit date within the next 60 days")
        if draft.visit_slot not in VISIT_SLOTS:
            raise bad_request("Choose a valid time slot")
        visit_fee = settings.visit_fee
        if visit_fee:
            lines.append(QuoteLine(label="Measurement visit", amount=visit_fee))
    elif draft.measurements:
        allowed = {f["key"] for f in service.measurement_fields}
        if set(draft.measurements) - allowed:
            raise bad_request("Unknown measurement field")

    quote = Quote(
        currency=CURRENCY,
        lines=lines,
        package_price=package.base_price,
        customization_price=customization_total,
        visit_fee=visit_fee,
        total=package.base_price + customization_total + visit_fee,
    )
    return PricedDraft(service=service, package=package, customizations=customizations, quote=quote)


def add_event(order: Order, new_status: OrderStatus, actor: Role, note: str | None = None) -> None:
    order.status = new_status
    order.events.append(OrderEvent(status=new_status, actor_role=actor, note=note))


def create_order(db: Session, customer_id: int, payload: OrderCreate) -> Order:
    priced = price_draft(db, payload)
    c = payload.contact
    is_visit = payload.measurement_method == MeasurementMethod.VISIT
    order = Order(
        customer_id=customer_id,
        service_id=priced.service.id,
        package_id=priced.package.id,
        customizations=priced.customizations,
        measurement_method=payload.measurement_method,
        measurement_unit=None if is_visit else payload.measurement_unit,
        measurements=None if is_visit else payload.measurements,
        visit_date=payload.visit_date if is_visit else None,
        visit_slot=payload.visit_slot if is_visit else None,
        contact_name=c.name.strip(),
        contact_phone=c.phone,
        contact_email=str(c.email),
        address=c.address.strip(),
        city=c.city.strip(),
        postal_code=c.postal_code.strip(),
        country_code=c.country_code,
        notes=payload.notes,
        currency=priced.quote.currency,
        package_price=priced.quote.package_price,
        customization_price=priced.quote.customization_price,
        visit_fee=priced.quote.visit_fee,
        total=priced.quote.total,
    )
    add_event(order, OrderStatus.PLACED, Role.CUSTOMER)
    order.payment = Payment(amount=order.total, currency=order.currency)
    db.add(order)
    db.commit()
    return get_order(db, order.id)


ORDER_LOADS = (
    selectinload(Order.service),
    selectinload(Order.package),
    selectinload(Order.customer),
    selectinload(Order.tailor),
    selectinload(Order.executive),
    selectinload(Order.events),
    selectinload(Order.payment),
    selectinload(Order.settlement),
)


def get_order(db: Session, order_id: int) -> Order:
    # populate_existing refreshes relationships changed via FK columns earlier in this session.
    order = db.scalar(
        select(Order).where(Order.id == order_id).options(*ORDER_LOADS).execution_options(populate_existing=True)
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


def to_list_item(order: Order) -> OrderListItem:
    return OrderListItem(
        id=order.id,
        status=order.status,
        service_name=order.service.name,
        package_name=order.package.name,
        customer_name=order.contact_name,
        city=order.city,
        total=order.total,
        currency=order.currency,
        measurement_method=order.measurement_method,
        visit_date=order.visit_date,
        visit_slot=order.visit_slot,
        tailor=PartyOut(id=order.tailor.id, name=order.tailor.shop_name) if order.tailor else None,
        executive=(
            PartyOut(id=order.executive.id, name=order.executive.name, phone=order.executive.phone)
            if order.executive
            else None
        ),
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def to_detail(order: Order) -> OrderDetail:
    labels = {f["key"]: f["label"] for f in order.service.measurement_fields}
    return OrderDetail(
        **to_list_item(order).model_dump(),
        customizations=[CustomizationOut(**c) for c in order.customizations],
        measurement_unit=order.measurement_unit,
        measurements=order.measurements,
        measurement_labels=labels,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        contact_email=order.contact_email,
        address=order.address,
        postal_code=order.postal_code,
        country_code=order.country_code,
        notes=order.notes,
        package_price=order.package_price,
        customization_price=order.customization_price,
        visit_fee=order.visit_fee,
        events=order.events,
        payment=order.payment,
        settlement=order.settlement,
    )


# ---------- status transitions ----------


def _complete_delivery(order: Order) -> None:
    """Delivery collects the customer's payment and queues the tailor's payout."""
    now = datetime.now(timezone.utc)
    if order.payment and order.payment.status == PaymentStatus.PENDING:
        order.payment.status = PaymentStatus.PAID
        order.payment.paid_at = now
    if order.settlement is None and order.tailor_id is not None:
        commission = round(order.total * get_settings().commission_percent / 100)
        order.settlement = Settlement(
            tailor_id=order.tailor_id, gross=order.total, commission=commission, net=order.total - commission
        )


def assign_tailor(order: Order, tailor_id: int) -> None:
    if order.status not in (OrderStatus.PLACED, OrderStatus.ASSIGNED):
        raise bad_request("Only unaccepted orders can be (re)assigned")
    order.tailor_id = tailor_id
    add_event(order, OrderStatus.ASSIGNED, Role.ADMIN)


def tailor_accept(order: Order) -> None:
    if order.status != OrderStatus.ASSIGNED:
        raise bad_request("This order is no longer awaiting acceptance")
    add_event(order, OrderStatus.ACCEPTED, Role.TAILOR)


def tailor_decline(order: Order, reason: str | None) -> None:
    if order.status != OrderStatus.ASSIGNED:
        raise bad_request("This order is no longer awaiting acceptance")
    order.tailor_id = None
    add_event(order, OrderStatus.PLACED, Role.TAILOR, f"Declined by tailor{': ' + reason if reason else ''}")


def tailor_advance(order: Order, target: OrderStatus, note: str | None) -> None:
    if order.status not in TAILOR_FLOW or order.status == OrderStatus.DELIVERED:
        raise bad_request("This order cannot be updated")
    expected = TAILOR_FLOW[TAILOR_FLOW.index(order.status) + 1]
    if target != expected:
        raise bad_request(f"Next status must be {expected.value}")
    add_event(order, target, Role.TAILOR, note)
    if target == OrderStatus.DELIVERED:
        _complete_delivery(order)


def admin_set_status(order: Order, target: OrderStatus, note: str | None) -> None:
    if order.status == target:
        raise bad_request("Order already has this status")
    if order.status in (OrderStatus.DELIVERED, OrderStatus.CANCELLED):
        raise bad_request("Closed orders cannot be changed")
    if target == OrderStatus.PLACED:
        order.tailor_id = None
    elif target != OrderStatus.CANCELLED and order.tailor_id is None:
        raise bad_request("Assign a vendor before moving the order forward")
    add_event(order, target, Role.ADMIN, note)
    if target == OrderStatus.DELIVERED:
        _complete_delivery(order)
    if target == OrderStatus.CANCELLED and order.payment and order.payment.status == PaymentStatus.PENDING:
        order.payment.status = PaymentStatus.VOID


def customer_cancel(order: Order) -> None:
    if order.status not in (OrderStatus.PLACED, OrderStatus.ASSIGNED):
        raise bad_request("This order can no longer be cancelled. Please contact support.")
    order.tailor_id = None
    add_event(order, OrderStatus.CANCELLED, Role.CUSTOMER)
    if order.payment and order.payment.status == PaymentStatus.PENDING:
        order.payment.status = PaymentStatus.VOID
