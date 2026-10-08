# TailorTrack — custom tailoring aggregator

A full-stack web app for a doorstep tailoring business, built from the client brief
`Website Usecase&Workflows.docx`. It has three portals:

| Portal | URL | Who |
|--------|-----|-----|
| Customer website | `/` | Customers book a service, customise the design, schedule a measurement visit and track orders |
| Tailor portal (mobile-first) | `/tailor` | Tailors register with KYC, wait for approval, then accept and process orders and track earnings |
| Admin console | `/admin` | Operations team: view orders, assign vendor/executive, update status, payments, tailor verification |

| Folder | Stack |
|--------|-------|
| `frontend/` | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4 |
| `backend/` | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (SQLite also works for local dev and tests) |

## Run it locally

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL (PostgreSQL) and JWT_SECRET
python -m alembic upgrade head
python -m app.seed --demo      # catalogue, admin, executives + demo tailors/orders
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Create the database first if it doesn't exist (`createdb tailortrack`, or via pgAdmin).
For a quick start without PostgreSQL, set `DATABASE_URL=sqlite:///./dev.db`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000.

### Demo accounts (after `--demo` seed)

| Portal | Sign in with |
|--------|--------------|
| Admin | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env` |
| Tailor (approved) | mobile `9000000001` (Lakshmi Tailors) or `9000000002` |
| Tailor (pending verification) | mobile `9000000003` (Kavya Boutique) |
| Customer | mobile `9100000001` – `9100000004`, or any new number |

Customer and tailor logins use a one-time code. With `OTP_DEV_MODE=true` (development only), the code is shown on screen instead of being sent by SMS.

## Order lifecycle

`placed → assigned (admin picks a tailor) → accepted (tailor) → measurement_done → stitching → ready → delivered`

- A tailor can decline an assigned order; it goes back to the admin's Assign Vendor queue.
- Customers can cancel while an order is `placed` or `assigned`.
- On delivery the customer's pay-on-delivery payment is marked paid, and a settlement (order total minus `COMMISSION_PERCENT`) is queued for the tailor. Admin marks it processing or paid (with a UTR reference) in View Payments.

## Quality checks

```bash
cd backend && python -m pytest          # end-to-end API tests
cd frontend && npm run lint && npm run typecheck && npm run build
```

## Frontend conventions

- **Design tokens** live only in `src/app/globals.css` (`@theme`). The default Tailwind palette is cleared, so hard-coded colours don't compile.
- **Copy**: all user-facing text is in `src/i18n/en.ts`.
- **Money and dates** go through `formatMoney`, `formatDate` and `formatTime` in `src/lib/format.ts`.
- **Markets**: currency, phone rules, postal label and KYC documents come from `src/config/countries.ts`.
- **Photography**: every image URL is in `src/config/media.ts`, so brand photos can replace the placeholders in one place.
- **API access**: typed client in `src/lib/api/` (`endpoints.ts`, `types.ts`) and the `useApi` / `useAction` hooks in `src/lib/hooks/useApi.ts`.

See [ASSUMPTIONS.md](ASSUMPTIONS.md) for the items that need client confirmation.
