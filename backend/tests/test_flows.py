from datetime import date, timedelta

from fastapi.testclient import TestClient

from tests.conftest import admin_login, otp_login

API = "/api/v1"


def blouse_draft(client: TestClient, visit: bool = False) -> dict:
    service = client.get(f"{API}/services/blouse-stitching").json()
    selections = {
        g["key"]: g["options"][0]["key"] for g in service["optionGroups"] if g["kind"] == "choice"
    }
    draft = {
        "serviceId": service["id"],
        "packageId": service["packages"][1]["id"],
        "selections": selections,
        "toggles": {"lining": True, "piping": False, "padding": True},
        "measurementMethod": "visit" if visit else "self",
    }
    if visit:
        draft |= {"visitDate": (date.today() + timedelta(days=1)).isoformat(), "visitSlot": "11:00-13:00"}
    else:
        draft |= {"measurementUnit": "in", "measurements": {"bust": 34, "waist": 30}}
    return draft


CONTACT = {
    "name": "Priya Sharma",
    "phone": "9123456789",
    "email": "priya@example.com",
    "address": "45 Lake View Road",
    "city": "Chennai",
    "postalCode": "600004",
}


def register_tailor(client: TestClient, phone: str = "9000011111") -> dict[str, str]:
    h = otp_login(client, "tailor", phone)
    assert client.get(f"{API}/tailor/me", headers=h).json()["status"] == "draft"
    res = client.put(
        f"{API}/tailor/me/details",
        headers=h,
        json={
            "shopName": "Lakshmi Tailors",
            "ownerName": "Lakshmi R",
            "email": "lakshmi@example.com",
            "address": "12 Main Bazaar",
            "city": "Chennai",
            "postalCode": "600017",
        },
    )
    assert res.status_code == 200, res.text
    res = client.put(
        f"{API}/tailor/me/bank",
        headers=h,
        json={"bankAccountName": "Lakshmi R", "bankAccountNumber": "50100234567890", "bankIfsc": "hdfc0001234"},
    )
    assert res.json()["bankIfsc"] == "HDFC0001234"
    for doc in ("aadhaar", "pan", "business_proof", "bank_details"):
        res = client.post(
            f"{API}/tailor/me/documents/{doc}", headers=h, files={"file": (f"{doc}.png", b"\x89PNG data", "image/png")}
        )
        assert res.status_code == 200, res.text
    res = client.put(
        f"{API}/tailor/me/availability",
        headers=h,
        json={"workingDays": ["mon", "tue", "wed", "thu", "fri", "sat"], "openTime": "09:00", "closeTime": "19:00"},
    )
    assert res.json()["missingSteps"] == []
    return h


def test_catalog_and_quote(client: TestClient) -> None:
    services = client.get(f"{API}/services").json()
    assert [s["name"] for s in services][:2] == ["Blouse Stitching", "Kurti / Kurta"]
    blouse = next(s for s in services if s["slug"] == "blouse-stitching")
    assert blouse["startingPrice"] == 499 and blouse["promoTitle"] == "Designer Blouse"

    quote = client.post(f"{API}/orders/quote", json=blouse_draft(client)).json()
    # designer 799 + sweetheart 100 + deep dori 150 + princess 150 + elbow 0 + lining 100 + padding 80
    assert quote["total"] == 799 + 100 + 150 + 150 + 100 + 80


def test_quote_validation(client: TestClient) -> None:
    draft = blouse_draft(client)
    draft["selections"].pop("front_neck")
    res = client.post(f"{API}/orders/quote", json=draft)
    assert res.status_code == 422 and "Front Neck" in res.json()["detail"]

    visit = blouse_draft(client, visit=True)
    visit["visitDate"] = (date.today() - timedelta(days=1)).isoformat()
    assert client.post(f"{API}/orders/quote", json=visit).status_code == 422


def test_end_to_end(client: TestClient) -> None:
    # Customer books
    cust = otp_login(client, "customer", "9123456789", "Priya Sharma")
    res = client.post(f"{API}/orders", headers=cust, json=blouse_draft(client, visit=True) | {"contact": CONTACT})
    assert res.status_code == 201, res.text
    order = res.json()
    assert order["id"] >= 1 and order["status"] == "placed" and order["payment"]["status"] == "pending"
    assert client.get(f"{API}/orders", headers=cust).json()[0]["id"] == order["id"]

    # Tailor onboards; dashboard locked until approval
    tailor = register_tailor(client)
    assert client.get(f"{API}/tailor/dashboard", headers=tailor).status_code == 403
    assert client.post(f"{API}/tailor/me/submit", headers=tailor).json()["status"] == "pending"

    admin = admin_login(client)
    pending = client.get(f"{API}/admin/tailors", headers=admin, params={"status": "pending"}).json()
    assert len(pending) == 1
    tailor_id = pending[0]["id"]
    assert client.get(f"{API}/admin/tailors/{tailor_id}/documents/pan/file", headers=admin).status_code == 200
    assert (
        client.post(f"{API}/admin/tailors/{tailor_id}/verify", headers=admin, json={"approve": False}).status_code
        == 422
    )
    res = client.post(f"{API}/admin/tailors/{tailor_id}/verify", headers=admin, json={"approve": True})
    assert res.json()["status"] == "approved"
    assert client.get(f"{API}/tailor/dashboard", headers=tailor).status_code == 200

    # Admin assigns vendor + executive
    options = client.get(f"{API}/admin/orders/{order['id']}/tailor-options", headers=admin).json()
    assert options[0]["sameCity"] is True
    res = client.post(f"{API}/admin/orders/{order['id']}/assign-tailor", headers=admin, json={"tailorId": tailor_id})
    assert res.json()["status"] == "assigned"
    exec_id = client.get(f"{API}/admin/executives", headers=admin).json()[0]["id"]
    res = client.post(
        f"{API}/admin/orders/{order['id']}/assign-executive", headers=admin, json={"executiveId": exec_id}
    )
    assert res.json()["executive"]["id"] == exec_id

    # Tailor processes the order
    dash = client.get(f"{API}/tailor/dashboard", headers=tailor).json()
    assert dash["newOrders"] == 1
    assert [o["id"] for o in client.get(f"{API}/tailor/orders?tab=new", headers=tailor).json()] == [order["id"]]
    assert client.post(f"{API}/tailor/orders/{order['id']}/accept", headers=tailor).json()["status"] == "accepted"
    skip = client.post(f"{API}/tailor/orders/{order['id']}/status", headers=tailor, json={"status": "ready"})
    assert skip.status_code == 422
    for st in ("measurement_done", "stitching", "ready", "delivered"):
        res = client.post(f"{API}/tailor/orders/{order['id']}/status", headers=tailor, json={"status": st})
        assert res.status_code == 200, res.text
    final = res.json()
    assert final["payment"]["status"] == "paid"
    assert final["settlement"]["net"] == final["total"] - round(final["total"] * 0.15)
    assert [e["status"] for e in final["events"]][-1] == "delivered"

    wallet = client.get(f"{API}/tailor/wallet", headers=tailor).json()
    assert wallet["availableBalance"] == final["settlement"]["net"]

    # Admin settles payout
    payments = client.get(f"{API}/admin/payments", headers=admin).json()
    assert payments["collected"] == final["total"]
    sid = payments["settlements"][0]["id"]
    assert client.put(f"{API}/admin/settlements/{sid}", headers=admin, json={"status": "paid"}).status_code == 422
    res = client.put(f"{API}/admin/settlements/{sid}", headers=admin, json={"status": "paid", "reference": "UTR123"})
    assert res.json()["status"] == "paid"
    assert client.get(f"{API}/tailor/wallet", headers=tailor).json()["availableBalance"] == 0

    # Customer sees the full timeline
    detail = client.get(f"{API}/orders/{order['id']}", headers=cust).json()
    assert detail["status"] == "delivered" and len(detail["events"]) == 7


def test_decline_and_cancel(client: TestClient) -> None:
    cust = otp_login(client, "customer", "9123456789")
    order = client.post(f"{API}/orders", headers=cust, json=blouse_draft(client) | {"contact": CONTACT}).json()
    tailor = register_tailor(client)
    client.post(f"{API}/tailor/me/submit", headers=tailor)
    admin = admin_login(client)
    tid = client.get(f"{API}/admin/tailors", headers=admin).json()[0]["id"]
    client.post(f"{API}/admin/tailors/{tid}/verify", headers=admin, json={"approve": True})
    client.post(f"{API}/admin/orders/{order['id']}/assign-tailor", headers=admin, json={"tailorId": tid})

    res = client.post(f"{API}/tailor/orders/{order['id']}/decline", headers=tailor, json={"reason": "Fully booked"})
    assert res.status_code == 204
    detail = client.get(f"{API}/admin/orders/{order['id']}", headers=admin).json()
    assert detail["status"] == "placed" and detail["tailor"] is None

    res = client.post(f"{API}/orders/{order['id']}/cancel", headers=cust)
    assert res.json()["status"] == "cancelled" and res.json()["payment"]["status"] == "void"
    assert client.post(f"{API}/admin/orders/{order['id']}/status", headers=admin, json={"status": "placed"}).status_code == 422


def test_rejection_and_resubmit(client: TestClient) -> None:
    tailor = register_tailor(client)
    client.post(f"{API}/tailor/me/submit", headers=tailor)
    # Locked while under review
    res = client.put(f"{API}/tailor/me/bank", headers=tailor, json={"bankAccountName": "X Y", "bankAccountNumber": "12345678", "bankIfsc": "HDFC0001234"})
    assert res.status_code == 409
    admin = admin_login(client)
    tid = client.get(f"{API}/admin/tailors", headers=admin).json()[0]["id"]
    client.post(f"{API}/admin/tailors/{tid}/verify", headers=admin, json={"approve": False, "reason": "PAN unreadable"})
    me = client.get(f"{API}/tailor/me", headers=tailor).json()
    assert me["status"] == "rejected" and me["rejectionReason"] == "PAN unreadable"
    assert client.post(f"{API}/tailor/me/submit", headers=tailor).json()["status"] == "pending"


def test_auth_guards(client: TestClient) -> None:
    assert client.get(f"{API}/orders").status_code == 401
    cust = otp_login(client, "customer", "9123456789")
    assert client.get(f"{API}/admin/orders", headers=cust).status_code == 403
    res = client.post(f"{API}/auth/customer/otp/verify", json={"phone": "9999999999", "code": "000000"})
    assert res.status_code == 400
    bad = client.post(f"{API}/auth/admin/login", json={"email": "admin@test.local", "password": "nope"})
    assert bad.status_code == 401


def test_public_tracking(client: TestClient) -> None:
    h = otp_login(client, "customer", "9123456789", "Priya")
    order = client.post(f"{API}/orders", headers=h, json=blouse_draft(client) | {"contact": CONTACT}).json()

    res = client.get(f"{API}/orders/track/{order['id']}", params={"phone": "9123456789"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "placed" and body["serviceName"] == "Blouse Stitching"
    assert [e["status"] for e in body["events"]] == ["placed"]
    assert "contactPhone" not in body and "total" not in body and "address" not in body

    assert client.get(f"{API}/orders/track/{order['id']}", params={"phone": "9000000000"}).status_code == 404
    assert client.get(f"{API}/orders/track/999999", params={"phone": "9123456789"}).status_code == 404


def test_documents_and_bank_optional_for_submission(client: TestClient) -> None:
    res = client.post(f"{API}/auth/tailor/otp/request", json={"phone": "9000000777", "countryCode": "IN"})
    code = res.json()["devCode"]
    token = client.post(
        f"{API}/auth/tailor/otp/verify", json={"phone": "9000000777", "countryCode": "IN", "code": code}
    ).json()["accessToken"]
    h = {"Authorization": f"Bearer {token}"}
    client.put(
        f"{API}/tailor/me/details",
        headers=h,
        json={
            "shopName": "No Docs Tailors",
            "ownerName": "Test Owner",
            "email": "nodocs@example.com",
            "address": "1 Test Street",
            "city": "Chennai",
            "postalCode": "600001",
        },
    )
    # Neither KYC documents nor bank details are needed to submit.
    assert client.get(f"{API}/tailor/me", headers=h).json()["missingSteps"] == []
    assert client.post(f"{API}/tailor/me/submit", headers=h).json()["status"] == "pending"
    # Submitted tailors reach their dashboard before admin verification.
    assert client.get(f"{API}/tailor/dashboard", headers=h).status_code == 200


def test_tailor_can_skip_every_step_and_submit(client: TestClient) -> None:
    res = client.post(f"{API}/auth/tailor/otp/request", json={"phone": "9000000666", "countryCode": "IN"})
    token = client.post(
        f"{API}/auth/tailor/otp/verify",
        json={"phone": "9000000666", "countryCode": "IN", "code": res.json()["devCode"]},
    ).json()["accessToken"]
    h = {"Authorization": f"Bearer {token}"}
    assert "details" in client.get(f"{API}/tailor/me", headers=h).json()["missingSteps"]
    assert client.post(f"{API}/tailor/me/submit", headers=h).json()["status"] == "pending"
    assert client.get(f"{API}/tailor/dashboard", headers=h).status_code == 200
