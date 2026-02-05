# Copilot Instructions for LocalPro Super App

## Big Picture Architecture
- Monorepo with feature/service boundaries: API code in src/ and features/, SDK in packages/localpro-sdk, docs in docs/.
- Express API with Mongoose models, controllers, middleware, and routes under src/; entrypoint is src/server.js.
- Integrations (Twilio, PayPal, PayMaya, Cloudinary, Maps, email) are wired via scripts/ setup and service modules in src/services.
- API contracts and payload shapes are documented in docs/ (use as source of truth when changing endpoints).

## Critical Workflows
- Install deps: pnpm install (repo uses pnpm-workspace.yaml).
- Setup: npm run setup (uses scripts/setup-app.js) or npm run setup:install.
- Dev server: npm run dev (nodemon). Production: npm start.
- Env: copy env.example to .env; env.production is reference for deploy. Validate with scripts/env-check.js or scripts/verify-setup.js.
- Tests: npm test, npm run test:unit, npm run test:integration, npm run test:watch; coverage output in coverage/.

## Project-Specific Conventions
- Feature-first: each domain (jobs, academy, ads, agencies, etc.) lives in its own folder under features/ or src/.
- Payload schemas and response formats must follow docs/ (e.g., API_REFERENCE.md, DATABASE_SCHEMA.md).
- ObjectId validation uses custom logic; follow scripts/ and docs guidance (see fix-objectid-validation.js and OBJECTID_VALIDATION_GUIDE.md).
- Setup, seeding, and monitoring must use scripts/ (e.g., setup-*.js, seed-*.js); avoid manual DB changes.

## Integration & Tooling Notes
- Twilio dev mode: if credentials are missing, SMS verification accepts any 6-digit code (per README).
- Postman collections live in postman/; use LocalPro-Environment and role-based collections for API testing.
- SDK is in packages/localpro-sdk; keep API changes in sync with SDK docs when relevant.

## Key Locations
- src/controllers, src/models, src/routes, src/services, src/middleware
- features/<domain> for domain-specific logic
- docs/ for API and schema references
- scripts/ for setup, migrations, and seeding

If anything in docs/ conflicts with implementation, flag it and ask before changing behavior.
