# Facility Care API Endpoints

Note: Endpoints inferred from repository mappings and collections. Align with your actual routes if different.

## Services
- GET `/api/facility-care` — list services (filters: category, area, provider, isActive, page, limit)
- GET `/api/facility-care/:id` — service details
- POST `/api/facility-care` — create service (provider)
- PUT `/api/facility-care/:id` — update service (provider)
- POST `/api/facility-care/:id/images` — upload images
- DELETE `/api/facility-care/:id/images/:imageId` — delete image
- GET `/api/facility-care/my-services` — provider’s services
- GET `/api/facility-care/nearby` — nearby services by location
- POST `/api/facility-care/:id/reviews` — add review

## Contracts
- GET `/api/facility-care/contracts` — list user contracts (as client/provider)
- POST `/api/facility-care/contracts` — create contract
- GET `/api/facility-care/contracts/:id` — contract details
- PUT `/api/facility-care/contracts/:id` — update contract
- PUT `/api/facility-care/contracts/:id/status` — update status (activate/suspend/terminate)
- POST `/api/facility-care/contracts/:id/documents` — upload contract document
- DELETE `/api/facility-care/contracts/:id/documents/:docId` — delete document

## Subscriptions
- GET `/api/facility-care/subscriptions` — list user subscriptions
- POST `/api/facility-care/subscriptions` — create subscription for a service (optionally linked to contract)
- GET `/api/facility-care/subscriptions/:id` — subscription details
- PUT `/api/facility-care/subscriptions/:id` — update plan/schedule/preferences
- PUT `/api/facility-care/subscriptions/:id/status` — pause/cancel/resume
- GET `/api/facility-care/subscriptions/:id/history` — service history
- GET `/api/facility-care/subscriptions/:id/payments` — payment history

## Common Responses
- Paginated lists: `{ success, count, total, page, pages, data: [...] }`
- Single resource: `{ success, data: {...} }`
- Action: `{ success, message, data? }`

## Errors
- 400 validation errors
- 403 unauthorized for role/resource
- 404 not found
- 500 server error
