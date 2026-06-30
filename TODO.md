# Project TODO

## Backend
- [ ] Remove committed `.env` from repo history and rotate credentials
- [ ] Move secrets to environment or a secrets manager (GH Secrets / Vault)
- [ ] Read `SECRET_KEY` from env and rotate current key
- [ ] Set `DEBUG` via env (ensure `False` in production)
- [ ] Fix JWT header tuple (`AUTH_HEADER_TYPES = ('Bearer',)`) in `backend/backend/settings.py`
- [ ] Configure `ALLOWED_HOSTS` for production
- [ ] Add `STATIC_ROOT` and `collectstatic` step; update Docker build/pipeline
- [ ] Move `MEDIA` to S3/Blob or shared storage; update `MEDIA_URL`
- [ ] Replace `runserver` with Gunicorn/uvicorn in `backend/Dockerfile`
- [ ] Add entrypoint: run migrations, collectstatic, create admin if needed
- [ ] Add container healthchecks and restart policies
- [ ] Add Celery (or RQ) + Redis broker; create worker image and tasks for email/notifications
- [ ] Implement proper email sending (SMTP / transactional provider) and password-reset emails
- [ ] Implement payments (`CAMPAY`) with secure creds, webhook signature verification, retries and reconciliation tests
- [ ] Add rate limiting / throttling and security middlewares
- [ ] Add structured logging, Sentry (error reporting) and basic metrics
- [ ] Create DB backup/restore and migration rollback strategy
- [ ] Add unit and integration tests for critical flows (auth, bookings, payments)
- [ ] Add API docs (OpenAPI / Swagger)

## Frontend
- [ ] Decide SSR vs SPA; remove unused SSR config or implement full SSR build/run
- [ ] If SSR: update `frontend/Dockerfile`, CI and `nginx.conf` to serve server bundle
- [ ] Add runtime configuration for API base URL and feature flags (do not bake secrets)
- [ ] Ensure `nginx.conf` serves SPA fallback, caching, gzip, and security headers
- [ ] Secure token storage and refresh strategy on client (avoid XSS/CSRF pitfalls)
- [ ] Add E2E tests (Cypress or Playwright) for booking and payment flows
- [ ] Increase unit test coverage and run tests in CI (headless browsers for CI)
- [ ] Add ESLint, TypeScript strictness and Prettier; enforce in CI
- [ ] Perform bundle analysis, enable lazy-loading, and optimize images/assets
- [ ] Run accessibility audit and fix critical issues
- [ ] Add runtime health checks and user-facing error handling

## CI / CD / Ops
- [ ] Ensure GitHub Actions use secrets and only push images from protected branches
- [ ] Update CI to run lint, tests, and build for both frontend and backend
- [ ] Add image tagging and immutable releases in CI/CD
- [ ] Add Dependabot, vulnerability scanning, and scheduled dependency updates
- [ ] Add staging environment and deploy pipeline (test before production)
- [ ] Add monitoring, alerts, and uptime checks
- [ ] Document deployment steps and rollback runbook

## Documentation
- [ ] Expand `README.md` with local dev, docker-compose, and production deploy instructions
- [ ] Add `ENV_VARS.md` listing required env vars and example `.env.example`
- [ ] Add API documentation link and usage examples for frontend/backend teams
- [ ] Add LICENSE and privacy/terms if applicable

---

Start by tackling the top Backend items (secrets, DEBUG/SECRET_KEY, JWT fix, Dockerfile entrypoint). Good luck!

