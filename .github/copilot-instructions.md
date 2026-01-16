
# Copilot Instructions for LocalPro Super App

## Project Overview
- **Monorepo**: Organized by feature and service boundaries. Main logic in `features/` and `src/`, with documentation in `docs/`.
- **API-centric**: All business logic and endpoints are in `src/` and `features/`. Data models and payloads are documented in `docs/`.
- **Integrations**: External services include PayMongo, PayMaya, Twilio, and others. Integration scripts: `setup-paymaya-config.js`, `setup-twilio.js`, and see `docs/` for integration details.

## Architecture & Patterns
- **Feature isolation**: Each domain (e.g., jobs, analytics, bookings) is in its own folder under `features/` or `src/`.
- **API payloads**: Follow schemas in `docs/` (e.g., `CREATE_JOB_PAYLOAD.md`, `API_RESPONSE_FORMATS.md`).
- **ObjectId validation**: Custom logic for MongoDB ObjectIds—see `fix-objectid-validation.js` and `OBJECTID_VALIDATION_GUIDE.md`.
- **Environment config**: Use `.env.example` and `env.production`. Validate with `scripts/env-check.js` or `scripts/verify-setup.js`.
- **Setup**: Use `scripts/setup-app.js` or `scripts/setup-install.js` for initial project setup.

## Developer Workflows
- **Install dependencies**: Use `pnpm install` (see `pnpm-workspace.yaml`).
- **Run app**: `npm start` (prod), `npm run dev` (dev, uses nodemon). For full setup, use `npm run setup` or `npm run setup:install`.
- **Testing**: Tests in `src/__tests__/`:
  - All: `npm test`
  - Watch: `npm run test:watch`
  - Unit: `npm run test:unit`
  - Integration: `npm run test:integration`
  - CI: `npm run test:ci`
- **Linting**: `npm run lint` (see `eslint.config.mjs`).
- **Coverage**: Output in `coverage/`.
- **Database**: Reset with `npm run setup:reset`. Seed with `npm run seed:categories` or `npm run seed:job-categories`.
- **Monitoring**: `npm run setup:monitoring` sets up monitoring integrations.

## Conventions & Tips
- **Feature-first**: New features go in their own subfolders under `features/`.
- **Scripts**: Use provided scripts in `scripts/` for setup, seeding, and validation—avoid manual steps.
- **Docs**: Update `docs/` when changing API contracts or models. Reference sample payloads for new endpoints.
- **Reports**: Integration and automation reports are in root and `docs/` (e.g., `PAYMONGO_INTEGRATION_REPORT.txt`).

## Key Files & Directories
- `features/` — Main business logic, by domain
- `src/` — Core source, including controllers, models, middleware, and tests
- `docs/` — API, payload, and architecture docs
- `scripts/` — Setup, seeding, and integration scripts
- `env.*` — Environment config
- `coverage/` — Test coverage output

---
If conventions or documentation are unclear, ask for clarification or check the relevant file in `docs/`.
