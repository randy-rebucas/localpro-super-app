

# Copilot Instructions for LocalPro Super App

## Project Architecture
- **Monorepo Structure**: Organized by feature/service boundaries. Main logic in `features/` and `src/`. Documentation in `docs/`.
- **API-Centric Design**: All business logic and endpoints live in `src/` and `features/`. Data models and payload schemas are documented in `docs/`.
- **Integrations**: External services (PayMongo, PayMaya, Twilio, etc.) are integrated via scripts in `scripts/` (e.g., `setup-paymaya-config.js`, `setup-twilio.js`). See `docs/` for integration details and sample payloads.

## Key Patterns & Conventions
- **Feature Isolation**: Each domain (jobs, analytics, bookings, etc.) is in its own folder under `features/` or `src/`.
- **API Payloads**: Strictly follow schemas in `docs/` (e.g., `CREATE_JOB_PAYLOAD.md`, `API_RESPONSE_FORMATS.md`).
- **MongoDB ObjectId Validation**: Uses custom logic—see `fix-objectid-validation.js` and `OBJECTID_VALIDATION_GUIDE.md`.
- **Environment Config**: Use `.env.example` and `env.production`. Validate with `scripts/env-check.js` or `scripts/verify-setup.js`.
- **Setup**: Always use `scripts/setup-app.js` or `scripts/setup-install.js` for initial setup. Avoid manual configuration.

## Developer Workflows
- **Install Dependencies**: Use `pnpm install` (see `pnpm-workspace.yaml`).
- **Run Application**:
  - Production: `npm start`
  - Development: `npm run dev` (uses nodemon)
  - Full setup: `npm run setup` or `npm run setup:install`
- **Testing** (see `src/__tests__/`):
  - All tests: `npm test`
  - Watch mode: `npm run test:watch`
  - Unit: `npm run test:unit`
  - Integration: `npm run test:integration`
  - CI: `npm run test:ci`
- **Linting**: `npm run lint` (see `eslint.config.mjs`).
- **Coverage**: Output in `coverage/`.
- **Database**:
  - Reset: `npm run setup:reset`
  - Seed: `npm run seed:categories` or `npm run seed:job-categories`
- **Monitoring**: `npm run setup:monitoring` for monitoring integrations.

## Project-Specific Practices
- **Feature-First**: New features go in their own subfolders under `features/`.
- **Scripts**: Use scripts in `scripts/` for setup, seeding, and validation—do not perform manual steps.
- **Documentation**: Update `docs/` when changing API contracts or models. Reference sample payloads for new endpoints.
- **Integration Reports**: Found in root and `docs/` (e.g., `PAYMONGO_INTEGRATION_REPORT.txt`).

## Key Files & Directories
- `features/` — Main business logic, by domain
- `src/` — Core source: controllers, models, middleware, tests
- `docs/` — API, payload, and architecture docs
- `scripts/` — Setup, seeding, and integration scripts
- `env.*` — Environment config
- `coverage/` — Test coverage output

---
If conventions or documentation are unclear, ask for clarification or check the relevant file in `docs/`.
