import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import KycDocument, Order, Tailor
from app.models.enums import ACTIVE_STATUSES, KycDocType, OrderStatus, TailorStatus
from app.schemas.tailor import KycDocumentOut, TailorProfile

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "application/pdf": ".pdf"}
# KYC documents are optional for now: tailors can submit without them and upload later.
# Add doc types here to make them mandatory again.
REQUIRED_DOCS: list[KycDocType] = []
# Bank details are optional too; admin collects them before the first settlement. Set True to require them.
REQUIRE_BANK = False


def mask_account(number: str | None) -> str | None:
    return f"•••• {number[-4:]}" if number else None


def missing_steps(tailor: Tailor) -> list[str]:
    """Onboarding steps still incomplete — drives the registration wizard and submit guard."""
    steps: list[str] = []
    if not (tailor.shop_name and tailor.owner_name and tailor.address and tailor.city and tailor.postal_code):
        steps.append("details")
    uploaded = {d.doc_type for d in tailor.documents}
    if any(doc not in uploaded for doc in REQUIRED_DOCS) or (REQUIRE_BANK and not tailor.bank_account_number):
        steps.append("kyc")
    if not tailor.working_days:
        steps.append("availability")
    return steps


def to_profile(tailor: Tailor) -> TailorProfile:
    return TailorProfile(
        id=tailor.id,
        status=tailor.status,
        rejection_reason=tailor.rejection_reason,
        submitted_at=tailor.submitted_at,
        reviewed_at=tailor.reviewed_at,
        phone=tailor.user.phone,
        shop_name=tailor.shop_name,
        owner_name=tailor.owner_name,
        email=tailor.email,
        address=tailor.address,
        city=tailor.city,
        postal_code=tailor.postal_code,
        country_code=tailor.country_code,
        bank_account_name=tailor.bank_account_name,
        bank_account_number_masked=mask_account(tailor.bank_account_number),
        bank_ifsc=tailor.bank_ifsc,
        working_days=tailor.working_days,
        open_time=tailor.open_time,
        close_time=tailor.close_time,
        break_start=tailor.break_start,
        break_end=tailor.break_end,
        documents=[KycDocumentOut.model_validate(d) for d in tailor.documents],
        missing_steps=missing_steps(tailor),
    )


def ensure_editable(tailor: Tailor) -> None:
    if tailor.status == TailorStatus.PENDING:
        raise HTTPException(status.HTTP_409_CONFLICT, "Your application is under review and can't be edited")


def submit_for_review(tailor: Tailor) -> None:
    if tailor.status not in (TailorStatus.DRAFT, TailorStatus.REJECTED):
        raise HTTPException(status.HTTP_409_CONFLICT, "Application already submitted")
    # Tailors may skip any onboarding step and submit straight away; anything still missing is
    # listed in `missing_steps` for the admin's verification review and can be completed later.
    tailor.status = TailorStatus.PENDING
    tailor.rejection_reason = None
    tailor.submitted_at = datetime.now(timezone.utc)


async def save_document(db: Session, tailor: Tailor, doc_type: KycDocType, file: UploadFile) -> KycDocument:
    settings = get_settings()
    ext = ALLOWED_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Upload a JPG, PNG or PDF file")
    data = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File must be under {settings.max_upload_mb} MB")
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "File is empty")

    folder = settings.upload_dir / "kyc" / str(tailor.id)
    folder.mkdir(parents=True, exist_ok=True)
    stored = folder / f"{doc_type.value}-{uuid.uuid4().hex}{ext}"
    stored.write_bytes(data)

    existing = next((d for d in tailor.documents if d.doc_type == doc_type), None)
    if existing:
        Path(existing.stored_path).unlink(missing_ok=True)
        doc = existing
    else:
        doc = KycDocument(tailor_id=tailor.id, doc_type=doc_type)
        tailor.documents.append(doc)
    doc.file_name = (file.filename or stored.name)[:255]
    doc.stored_path = str(stored)
    doc.content_type = file.content_type or "application/octet-stream"
    doc.size_bytes = len(data)
    doc.uploaded_at = datetime.now(timezone.utc)
    db.commit()
    return doc


def order_counts(db: Session, tailor_ids: list[int]) -> dict[int, tuple[int, int]]:
    """tailor_id -> (active, completed)"""
    if not tailor_ids:
        return {}
    rows = db.execute(
        select(Order.tailor_id, Order.status, func.count())
        .where(Order.tailor_id.in_(tailor_ids))
        .group_by(Order.tailor_id, Order.status)
    ).all()
    counts: dict[int, list[int]] = {tid: [0, 0] for tid in tailor_ids}
    for tid, st, n in rows:
        if st in ACTIVE_STATUSES:
            counts[tid][0] += n
        elif st == OrderStatus.DELIVERED:
            counts[tid][1] += n
    return {k: (v[0], v[1]) for k, v in counts.items()}
