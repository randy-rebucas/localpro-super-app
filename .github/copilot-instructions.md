# Copilot Instructions for LocalPro Super App

## Project Overview
- **Monorepo structure**: Multiple features and services organized under `features/`, `src/`, and `docs/`.
- **API-centric**: Main business logic and endpoints are in `src/` and `features/` subfolders. Data models and payload formats are documented in `docs/`.
- **Integrations**: Key external services include PayMongo, PayMaya, Twilio, and various payment/reporting systems. See `setup-paymaya-config.js`, `setup-twilio.js`, and `PAYMONGO_IMPLEMENTATION_*` docs.

## Architecture & Patterns
- **Service boundaries**: Each feature (e.g., jobs, bookings, analytics) is isolated in its own folder under `features/` and/or `src/`.
- **Payload conventions**: API payloads and responses follow schemas documented in `docs/` (e.g., `CREATE_JOB_PAYLOAD.md`, `API_RESPONSE_FORMATS.md`).
- **ObjectId validation**: Custom validation logic for MongoDB ObjectIds; see `fix-objectid-validation.js` and `OBJECTID_VALIDATION_GUIDE.md`.
- **Environment config**: Use `.env.example` and `env.production` for environment variables. Scripts like `setup-app.js` and `verify-setup.js` validate config.

## Developer Workflows
- **Install dependencies**: Use `pnpm install` (see `pnpm-workspace.yaml`).
- **Run the app**: Use `setup-app.js` or `setup-install.js` for initial setup. Custom scripts exist for health checks (`healthcheck.js`), database resets (`reset-database.js`), and monitoring (`setup-monitoring.js`).
- **Testing**: Tests are organized in `src/__tests__`:
  - Run all tests: `npm test`
  - Watch mode: `npm run test:watch`
  - Unit: `npm run test:unit`
  - Integration: `npm run test:integration`
  - CI: `npm run test:ci`
- **Linting**: Use ESLint config in `eslint.config.mjs`.
- **Coverage**: Output in `coverage/`.

## Conventions & Tips
- **Feature-first organization**: Add new features in their own subfolders under `features/`.
- **Documentation**: Always update relevant docs in `docs/` when changing API contracts or data models.
- **Scripts**: Prefer using provided setup and validation scripts over manual steps.
- **Payloads**: Reference sample payloads in `docs/` and `features/` for new API endpoints.
- **Reports**: Automated reports and integration summaries are in root and `docs/` (e.g., `PAYMONGO_INTEGRATION_REPORT.txt`).

## Key Files & Directories
- `features/` — Main business logic, organized by domain
- `src/` — Core source code, including tests
- `docs/` — API, payload, and architecture documentation
- `setup-*.js` — Setup and integration scripts
- `env.*` — Environment configuration
- `coverage/` — Test coverage output

---
For questions about unclear conventions or missing documentation, ask for clarification or reference the relevant `docs/` file.
