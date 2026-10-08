from enum import StrEnum


class Role(StrEnum):
    CUSTOMER = "customer"
    TAILOR = "tailor"
    ADMIN = "admin"


class TailorStatus(StrEnum):
    DRAFT = "draft"  # registering, not yet submitted
    PENDING = "pending"  # submitted, awaiting admin verification
    APPROVED = "approved"
    REJECTED = "rejected"


class OrderStatus(StrEnum):
    PLACED = "placed"  # booked by customer, awaiting vendor assignment
    ASSIGNED = "assigned"  # admin assigned a tailor, awaiting tailor acceptance
    ACCEPTED = "accepted"
    MEASUREMENT_DONE = "measurement_done"
    STITCHING = "stitching"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class MeasurementMethod(StrEnum):
    SELF = "self"
    VISIT = "visit"


class OptionGroupKind(StrEnum):
    CHOICE = "choice"
    TOGGLE = "toggle"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    VOID = "void"  # order cancelled before anything was collected


class SettlementStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"


class KycDocType(StrEnum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    BUSINESS_PROOF = "business_proof"
    BANK_DETAILS = "bank_details"


# Linear progression a tailor walks an accepted order through.
TAILOR_FLOW: list[OrderStatus] = [
    OrderStatus.ACCEPTED,
    OrderStatus.MEASUREMENT_DONE,
    OrderStatus.STITCHING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
]

ACTIVE_STATUSES = {
    OrderStatus.ACCEPTED,
    OrderStatus.MEASUREMENT_DONE,
    OrderStatus.STITCHING,
    OrderStatus.READY,
}
