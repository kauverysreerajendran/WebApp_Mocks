# Assumptions for client review

The client brief (`Website Usecase&Workflows.docx`) leaves these points open. Each was built on the assumption below. Please confirm or correct them.

## Brand & content

| # | Area | Assumption |
|---|------|------------|
| B1 | Brand | The brief shows "LOGO" only. The placeholder name is **TailorTrack**, set in one place: `frontend/src/i18n/en.ts` → `brand`. |
| B2 | Visual style | Premium editorial look in the style of the Envato "Printress" theme: charcoal, crimson and amber, Playfair Display + Rubik. This is original work; no theme code or assets are used. |
| B3 | Photography | Placeholder photos are free-licence Unsplash images, loaded from Unsplash. Replace them with brand photography in `frontend/src/config/media.ts`. |
| B4 | Contact details | The phone number, email and support hours shown are placeholders (`contactPage` in `en.ts`). |
| B5 | Contact form | The contact form validates and confirms on screen, but messages are not yet stored or emailed. |

## Customer booking (Mockups 1–10)

| # | Area | Assumption |
|---|------|------------|
| C1 | Catalogue | Packages and design options for Kurti, Men's Wear, Saree Services and Alterations are invented; the brief only details Blouse. Edit them in `backend/app/seed_data.py`. |
| C2 | Option prices | Each design option and Lining / Piping / Padding can add to the price (e.g. Sweetheart neck +₹100). Lining, Piping and Padding default to "Yes", as in the mock-up. |
| C3 | Measurements | "I Have Measurements" asks for service-specific fields (blouse: bust, waist, shoulder, armhole, sleeve length, blouse length) in cm or inches. |
| C4 | Visit slots | Measurement visits can be booked up to 60 days ahead in 2-hour slots between 09:00 and 19:00. The visit is free (`VISIT_FEE=0`). |
| C5 | Login | Customers browse and build a booking without an account. They verify their mobile number by OTP at "Confirm Booking". |
| C6 | Payment | Pay on delivery only. No payment gateway is integrated yet. |
| C7 | Cancellation | Customers can cancel until a tailor accepts the order. |
| C8 | Pricing Summary, Confirmation and Customer Dashboard | These screens are named in the brief but not detailed, so their content was designed. |

## Tailor portal

| # | Area | Assumption |
|---|------|------------|
| T1 | Onboarding | Existing and new tailors both use phone + OTP. New numbers go through Basic Details → KYC & Documents → Availability → Review & submit. |
| T2 | KYC | Aadhaar, PAN, Shop/Business proof and Bank details are uploaded as JPG/PNG/PDF (max 5 MB). Bank account number and IFSC are also captured, for settlements. |
| T3 | Rejection | Admin must give a reason. The tailor sees it and can edit and resubmit. |
| T4 | Status stages | Accepted → Measurement Done → Stitching → Ready → Delivered. Tailors can only move one step forward. |
| T5 | Pricing Management | A tailor's per-package rate is shown to admin when assigning orders. The customer price stays the platform price. |
| T6 | Earnings | A tailor earns the order total minus a 15% platform fee (`COMMISSION_PERCENT`). |
| T7 | Due date | Orders don't store a due date yet. The portal shows an estimate: 7 days after the measurement visit (or the order date). |
| T8 | Portal stages | Tailor screens group statuses as New → Accepted → In Progress (Measurement Done, Stitching) → Ready for Pickup → Completed. |
| T9 | Estimated completion | The date picked on Update Status is saved in the status note shown on the order timeline. |
| T10 | Customer images | The reference shows customer photos on Order Details. Customers can't upload photos yet, so the chosen design options are shown instead. |
| T11 | Registration | New tailors register with name, mobile, email and terms, then verify by OTP. There is no password (the reference shows one). |
| T12 | Advance paid | Payment is on delivery, so "Advance Paid" is ₹0 until the order is delivered and paid. |

## Admin console

| # | Area | Assumption |
|---|------|------------|
| A1 | Login | Email + password. The account comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |
| A2 | Assign Vendor | Admin picks the tailor. Tailors in the same city are listed first, then the least busy. |
| A3 | Assign Executive | Executives are field staff for measurement visits and deliveries, managed on the Executives page. |
| A4 | Update Status | Admin can override any open order's status. Every change is recorded on the order timeline. |
| A5 | View Payments | Shows customer payments and tailor settlements (pending → processing → paid, with a UTR reference). |

## Markets

| # | Area | Assumption |
|---|------|------------|
| M1 | Countries | India is the default market (INR, "Pincode", Aadhaar/PAN). UAE, UK and US are configured in `frontend/src/config/countries.ts` to show multi-country readiness. Their rules are placeholders. |
