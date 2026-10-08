from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def _as_utc(value: datetime) -> datetime:
    # SQLite returns naive datetimes (stored as UTC); make the offset explicit for clients.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


UtcDateTime = Annotated[datetime, AfterValidator(_as_utc)]


class ApiModel(BaseModel):
    """camelCase on the wire, snake_case in Python; readable from ORM objects."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Message(ApiModel):
    detail: str
