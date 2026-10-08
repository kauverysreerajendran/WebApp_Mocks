import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("OTP_DEV_MODE", "true")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.local")
os.environ.setdefault("ADMIN_PASSWORD", "admin-pass")

from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_admin, seed_catalog, seed_executives  # noqa: E402


@pytest.fixture()
def db_session(tmp_path) -> Iterator[sessionmaker[Session]]:
    get_settings().upload_dir = tmp_path
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as db:
        seed_catalog(db)
        seed_admin(db)
        seed_executives(db)
    yield factory
    engine.dispose()


@pytest.fixture()
def client(db_session: sessionmaker[Session]) -> Iterator[TestClient]:
    def override() -> Iterator[Session]:
        with db_session() as db:
            yield db

    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def otp_login(client: TestClient, portal: str, phone: str, name: str | None = None) -> dict[str, str]:
    res = client.post(f"/api/v1/auth/{portal}/otp/request", json={"phone": phone})
    assert res.status_code == 200, res.text
    code = res.json()["devCode"]
    res = client.post(f"/api/v1/auth/{portal}/otp/verify", json={"phone": phone, "code": code, "name": name})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}


def admin_login(client: TestClient) -> dict[str, str]:
    res = client.post("/api/v1/auth/admin/login", json={"email": "admin@test.local", "password": "admin-pass"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}
