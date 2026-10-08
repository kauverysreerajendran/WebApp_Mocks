"""Seed the database.

    python -m app.seed            # catalogue + admin + executives (idempotent)
    python -m app.seed --demo     # also demo tailors, customers and orders
"""

import argparse
import base64
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_secret
from app.db.session import SessionLocal
from app.models import Executive, KycDocument, Option, OptionGroup, Package, Service, Tailor, TailorPrice, User
from app.models.enums import KycDocType, MeasurementMethod, OptionGroupKind, OrderStatus, Role, TailorStatus
from app.schemas.order import ContactIn, OrderCreate
from app.seed_data import CATALOG, EXECUTIVES
from app.services import orders as order_service

# 1x1 PNG used as a stand-in KYC scan for demo tailors.
PLACEHOLDER_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
)


def seed_catalog(db: Session) -> None:
    for s_order, spec in enumerate(CATALOG):
        if db.scalar(select(Service).where(Service.slug == spec["slug"])):
            continue
        service = Service(
            slug=spec["slug"],
            name=spec["name"],
            category=spec["category"],
            promo_title=spec["promo_title"],
            is_popular=spec["is_popular"],
            description=spec["description"],
            measurement_fields=spec["measurement_fields"],
            sort_order=s_order,
        )
        for p_order, (slug, name, desc, price) in enumerate(spec["packages"]):
            service.packages.append(Package(slug=slug, name=name, description=desc, base_price=price, sort_order=p_order))
        for g_order, g in enumerate(spec["groups"]):
            group = OptionGroup(
                key=g["key"],
                label=g["label"],
                kind=OptionGroupKind(g["kind"]),
                toggle_price=g.get("toggle_price", 0),
                default_on=g.get("default_on", False),
                sort_order=g_order,
            )
            for o_order, o in enumerate(g.get("options", [])):
                group.options.append(Option(key=o["key"], label=o["label"], price_delta=o["price_delta"], sort_order=o_order))
            service.option_groups.append(group)
        db.add(service)
    db.commit()


def seed_admin(db: Session) -> None:
    settings = get_settings()
    email = settings.admin_email.lower()
    if db.scalar(select(User).where(User.role == Role.ADMIN, User.email == email)):
        return
    db.add(User(role=Role.ADMIN, name="Platform Admin", email=email, password_hash=hash_secret(settings.admin_password)))
    db.commit()


def seed_executives(db: Session) -> None:
    if db.scalar(select(Executive).limit(1)):
        return
    db.add_all(Executive(name=n, phone=p, area=a) for n, p, a in EXECUTIVES)
    db.commit()


# ---------------- demo data ----------------


def _make_tailor(db: Session, phone: str, shop: str, owner: str, city: str, postal: str, status: TailorStatus) -> Tailor:
    user = User(role=Role.TAILOR, phone=phone, name=owner)
    db.add(user)
    db.flush()
    now = datetime.now(timezone.utc)
    tailor = Tailor(
        user_id=user.id,
        status=status,
        shop_name=shop,
        owner_name=owner,
        email=f"{shop.split()[0].lower()}@example.com",
        address="12, Main Bazaar Street",
        city=city,
        postal_code=postal,
        bank_account_name=owner,
        bank_account_number="50100234567890",
        bank_ifsc="HDFC0001234",
        submitted_at=now - timedelta(days=10),
        reviewed_at=now - timedelta(days=9) if status == TailorStatus.APPROVED else None,
    )
    db.add(tailor)
    db.flush()
    folder = get_settings().upload_dir / "kyc" / str(tailor.id)
    folder.mkdir(parents=True, exist_ok=True)
    for doc in KycDocType:
        path = folder / f"{doc.value}-demo.png"
        path.write_bytes(PLACEHOLDER_PNG)
        tailor.documents.append(
            KycDocument(
                doc_type=doc,
                file_name=f"{doc.value}.png",
                stored_path=str(path),
                content_type="image/png",
                size_bytes=len(PLACEHOLDER_PNG),
            )
        )
    db.commit()
    return tailor


def _customer(db: Session, phone: str, name: str) -> User:
    user = User(role=Role.CUSTOMER, phone=phone, name=name, email=f"{name.split()[0].lower()}@example.com")
    db.add(user)
    db.commit()
    return user


def seed_demo(db: Session) -> None:
    if db.scalar(select(Tailor).limit(1)):
        print("Demo data already present – skipped.")
        return

    lakshmi = _make_tailor(db, "9000000001", "Lakshmi Tailors", "Lakshmi R", "Chennai", "600017", TailorStatus.APPROVED)
    elegant = _make_tailor(db, "9000000002", "Elegant Stitches", "Meena S", "Coimbatore", "641002", TailorStatus.APPROVED)
    _make_tailor(db, "9000000003", "Kavya Boutique", "Kavya N", "Chennai", "600040", TailorStatus.PENDING)

    blouse = db.scalar(select(Service).where(Service.slug == "blouse-stitching"))
    kurti = db.scalar(select(Service).where(Service.slug == "kurti-kurta"))
    alterations = db.scalar(select(Service).where(Service.slug == "alterations"))
    assert blouse and kurti and alterations

    for pkg in blouse.packages:
        db.add(TailorPrice(tailor_id=lakshmi.id, package_id=pkg.id, price=pkg.base_price - 50))
    db.commit()

    customers = [
        _customer(db, "9100000001", "Priya Sharma"),
        _customer(db, "9100000002", "Ananya Rao"),
        _customer(db, "9100000003", "Meera Krishnan"),
        _customer(db, "9100000004", "Divya Patel"),
    ]

    def draft(service: Service, pkg_index: int, visit: bool, customer: User, city: str = "Chennai") -> OrderCreate:
        selections = {g.key: g.options[0].key for g in service.option_groups if g.kind == OptionGroupKind.CHOICE}
        fields = {f["key"]: 30.0 + i * 2 for i, f in enumerate(service.measurement_fields)}
        return OrderCreate(
            service_id=service.id,
            package_id=service.packages[pkg_index].id,
            selections=selections,
            measurement_method=MeasurementMethod.VISIT if visit else MeasurementMethod.SELF,
            measurement_unit=None if visit else "in",
            measurements=None if visit else fields,
            visit_date=date.today() + timedelta(days=2) if visit else None,
            visit_slot="11:00-13:00" if visit else None,
            contact=ContactIn(
                name=customer.name,
                phone=customer.phone or "",
                email=customer.email or "customer@example.com",
                address="45, Lake View Road, Mylapore",
                city=city,
                postal_code="600004",
            ),
        )

    # (service, package, visit?, customer, tailor, final status, days ago)
    plan = [
        (blouse, 1, False, 0, lakshmi, OrderStatus.DELIVERED, 30),
        (kurti, 0, False, 1, lakshmi, OrderStatus.DELIVERED, 24),
        (blouse, 0, True, 2, lakshmi, OrderStatus.DELIVERED, 18),
        (alterations, 0, False, 3, lakshmi, OrderStatus.DELIVERED, 12),
        (blouse, 1, False, 1, lakshmi, OrderStatus.STITCHING, 6),
        (kurti, 1, True, 0, lakshmi, OrderStatus.MEASUREMENT_DONE, 5),
        (blouse, 0, False, 2, lakshmi, OrderStatus.READY, 4),
        (blouse, 1, True, 3, lakshmi, OrderStatus.ACCEPTED, 3),
        (blouse, 1, False, 0, lakshmi, OrderStatus.ASSIGNED, 1),
        (kurti, 0, True, 1, lakshmi, OrderStatus.ASSIGNED, 1),
        (blouse, 0, False, 2, elegant, OrderStatus.STITCHING, 7),
        (alterations, 1, False, 3, None, OrderStatus.PLACED, 0),
        (blouse, 1, True, 0, None, OrderStatus.PLACED, 0),
    ]
    flow = [OrderStatus.ACCEPTED, OrderStatus.MEASUREMENT_DONE, OrderStatus.STITCHING, OrderStatus.READY, OrderStatus.DELIVERED]
    executives = db.scalars(select(Executive)).all()

    for idx, (service, pkg, visit, cust, tailor, final, days_ago) in enumerate(plan):
        customer = customers[cust]
        order = order_service.create_order(db, customer.id, draft(service, pkg, visit, customer))
        if tailor:
            order_service.assign_tailor(order, tailor.id)
            if final != OrderStatus.ASSIGNED:
                order_service.tailor_accept(order)
                for step in flow[1 : flow.index(final) + 1]:
                    order_service.tailor_advance(order, step, None)
        if visit and executives:
            order.executive_id = executives[idx % len(executives)].id
        created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=idx)
        order.created_at = created
        for i, event in enumerate(order.events):
            event.created_at = created + timedelta(hours=6 * i)
        db.commit()

    print("Demo data created.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo", action="store_true", help="add demo tailors, customers and orders")
    args = parser.parse_args()
    with SessionLocal() as db:
        seed_catalog(db)
        seed_admin(db)
        seed_executives(db)
        if args.demo:
            seed_demo(db)
    print("Seed complete.")


if __name__ == "__main__":
    main()
