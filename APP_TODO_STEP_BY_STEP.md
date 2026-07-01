# Application Step-by-Step TODO

This file converts the domain roadmap into a concrete implementation sequence for the car-rental app.

## 1. Booking and Availability
- [ ] Add a strict booking state machine and document valid transitions.
- [ ] Harden booking creation to prevent overlapping bookings.
- [ ] Add database locking or serialized availability checks in `backend/bookings/views.py`.
- [ ] Add tests for concurrent booking requests on the same car and dates.
- [ ] Add booking expiration logic for unconfirmed pending requests.
- [ ] Add explicit check-in/check-out and manual booking completion flows.
- [ ] Add no-show / late check-in handling logic.

## 2. Pricing and Fees
- [ ] Implement base pricing, seasonal pricing, and special pricing rules.
- [ ] Add support for cleaning fees, service fees, and security deposits.
- [ ] Add discount / coupon models and validation logic.
- [ ] Add tax calculation and invoice generation for completed bookings.

## 3. Payments and Reconciliation
- [ ] Complete CamPay integration with real credentials in settings.
- [ ] Implement payment hold/authorization vs capture flows.
- [ ] Add refund support and webhook-driven status updates.
- [ ] Harden webhook handling with signature verification and idempotency.
- [ ] Add payout request, approval, and processing flows for owners.
- [ ] Add reconciliation records and reports for owner payouts.
- [ ] Add retry handling for failed payments and payouts.

## 4. Owner and Guest Workflows
- [ ] Implement owner onboarding, verification, and approval workflow.
- [ ] Add owner dashboard for bookings, earnings, schedule, and payouts.
- [ ] Add guest verification options (email, SMS, ID upload).
- [ ] Add booking receipts, pickup/dropoff instructions, and policy summaries.
- [ ] Add review/rating model and guest review workflow.

## 5. Messaging, Claims, and Verification
- [ ] Add guest-owner messaging / conversation model and APIs.
- [ ] Add damage claim and maintenance record models and workflows.
- [ ] Add verification document / KYC upload model and manager review flow.
- [ ] Add moderation workflows for new listings and media.

## 6. Media, Search, and UX
- [ ] Move photo uploads to S3 or another object store and serve via CDN.
- [ ] Generate and store image thumbnails and optimized assets.
- [ ] Add location-based search and filter by availability, price, rating.
- [ ] Add map search and geolocation support.
- [ ] Add search result ranking for availability, price, and ratings.

## 7. Admin and Reporting
- [ ] Add management dashboards for bookings, payouts, disputes, and users.
- [ ] Add manual refund and adjustment tools with audit trail.
- [ ] Add reporting for bookings, revenue, occupancy, and cancellations.
- [ ] Add alerts for fraud, failed payments, and business anomalies.

## 8. Production Hardening
- [ ] Remove `.env` from source control and move secrets to environment variables.
- [ ] Set `DEBUG=False` in production and tighten `ALLOWED_HOSTS`.
- [ ] Fix Django JWT config and upgrade the backend container to Gunicorn/uvicorn.
- [ ] Add static file collection and media storage configuration.
- [ ] Add background workers for email, webhook processing, and payouts.
- [ ] Add rate limiting, security headers, and HTTPS enforcement.

## 9. Tests and CI
- [ ] Add unit tests for booking logic, pricing, and availability.
- [ ] Add integration tests for payment flows and webhooks.
- [ ] Add end-to-end tests for search → book → pay → complete.
- [ ] Add CI steps for backend and frontend builds, linting, and tests.
- [ ] Add load testing for peak booking and search performance.

## 10. Documentation
- [ ] Update `README.md` with local dev and deployment instructions.
- [ ] Add an environment variables checklist (`.env.example`).
- [ ] Add API documentation for core endpoints.
- [ ] Add runbooks for deploy, rollback, and incident response.

---

Use this file as your execution checklist. Work from the top down: start with booking availability and payment stability, then add owner/guest workflows, and finally harden production and tests.
