# Supplies Feature Reference

Browse, manage, and order supply products. Covers full supplier CRUD, image management, order workflow, reviews, AI-powered description generation, and admin statistics.

---

## 1. Architecture Overview

```
features/supplies/
  controllers/
    suppliesController.js         — 19 thin handlers; delegates to service layer
  routes/
    supplies.js                   — Express router; public + auth+suppliesLimiter protected
  services/
    suppliesService.js            — product CRUD, image management, geolocation, categories
    orderService.js               — order creation, status updates, email notification
    reviewService.js              — review add, aggregation
    statisticsService.js          — aggregated admin stats
    descriptionService.js         — AI-powered description generation
    automatedSuppliesFulfillmentService.js   — background fulfillment worker
    automatedSuppliesReorderReminderService.js — background reorder reminder worker
  repositories/
    suppliesRepository.js         — Mongoose query wrappers for Supply model
    orderRepository.js            — order subdocument queries
    reviewRepository.js           — review subdocument queries
  models/
    Supplies.js                   — main Product model (embeds orders, reviews, images)
    StockHistory.js               — stock change audit trail
    ProductReview.js              — standalone review snapshot (optional denormalization)
  validators/
    suppliesValidator.js          — Joi/manual field validation
  errors/
    SuppliesErrors.js             — AppError, NotFoundError, ForbiddenError, ValidationError
```

**Data-flow summary:**  
Public routes bypass auth entirely. Protected routes pass through JWT `auth` then `suppliesLimiter`. The controller's `handleError` helper routes `AppError` subclasses to their defined `statusCode` and passes all other errors to `sendServerError()` (which logs via `logger.error` internally with a structured code). The service layer owns all business logic; the controller only parses request/response.

---

## 2. Configuration

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Validates Bearer token on protected routes |
| `CLOUDINARY_*` | Yes | Required for `POST /:id/images` uploads |
| `GOOGLE_MAPS_API_KEY` | No | Used by `geocodeAddress` in `suppliesService`; degrades gracefully |
| `OPENAI_API_KEY` / AI config | No | Required for `POST /generate-description`; returns error if missing |

---

## 3. Rate Limiting

| Limiter | Window | Max | Applied to |
|---|---|---|---|
| `suppliesLimiter` | 1 min | 60 req | All protected `/api/supplies/*` routes (after `router.use(auth)`) |

Public browse routes (`GET /`, `GET /categories`, `GET /featured`, `GET /nearby`, `GET /:id`) are only subject to the global `generalLimiter`.

---

## 4. Endpoints

### 4.1 List Supplies (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies` |
| **Auth** | None |

**Query params:** `search`, `category`, `location`, `minPrice`, `maxPrice`, `page` (default 1), `limit` (default 10), `sortBy` (default `createdAt`), `sortOrder` (default `desc`)

**Success 200:** `{ success, supplies, total, page, pages, count }`

---

### 4.2 Get Categories (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/categories` |
| **Auth** | None |

---

### 4.3 Get Featured Supplies (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/featured` |
| **Auth** | None |
| **Query** | `limit` |

---

### 4.4 Get Nearby Supplies (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/nearby` |
| **Auth** | None |

**Query params:** `lat` (required), `lng` (required), `radius`, `page`, `limit`

---

### 4.5 Get Supply by ID (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/:id` |
| **Auth** | None |

Route regex `/:id([a-fA-F0-9]{24})` enforces ObjectId format at the router level. The alias `GET /products/:id` also hits this handler with ObjectId validation in the controller.

**Query params:** `includeOrders`, `includeReviews`, `includeRelated`, `includeStatistics` (all boolean strings, defaults `true`)

**Success 200:** Full supply detail with reviews, related items, and optional statistics.

---

### 4.6 Generate Description (AI, Supplier/Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/supplies/generate-description` |
| **Auth** | supplier, admin |

**Request body:** `{ "name": "DeWalt drill bit set", "category": "tools", ... }`  
**Success 200:** `{ success, message, data: { description }, usage }`

---

### 4.7 Create Supply (Supplier/Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/supplies` |
| **Auth** | supplier, admin |

**Request body:**
```json
{
  "name": "Heavy-duty drill bit set",
  "title": "Optional title override",
  "description": "...",
  "price": 1250,
  "category": "tools",
  "inventory": { "quantity": 50 },
  "location": { "street": "123 Main", "city": "Manila" }
}
```
**Success 201:** Created supply product.

---

### 4.8 Update Supply (Supplier/Admin)
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/supplies/:id` |
| **Auth** | supplier (owner), admin |

**Error 400:** Invalid ObjectId  
**Error 403:** Not the owner

---

### 4.9 Patch Supply (Supplier/Admin)
| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/supplies/:id` |
| **Auth** | supplier (owner), admin |

Supports partial update with deep-merge for nested objects (`pricing`, `inventory`).

---

### 4.10 Delete Supply (Supplier/Admin)
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/supplies/:id` |
| **Auth** | supplier (owner), admin |

---

### 4.11 Upload Images (Supplier/Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/supplies/:id/images` |
| **Auth** | supplier (owner), admin |
| **Content-Type** | `multipart/form-data` |
| **Field** | `images` (max 5 files) |

Uses the `uploaders.supplies` Cloudinary multer uploader.

---

### 4.12 Delete Image (Supplier/Admin)
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/supplies/:id/images/:imageId` |
| **Auth** | supplier (owner), admin |

**Error 400:** Invalid ObjectId for `id` or `imageId`

---

### 4.13 Order Supply (Authenticated)
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/supplies/:id/order` |
| **Auth** | Any authenticated user |

**Request body:** `{ "quantity": 2, "deliveryAddress": { "street": "...", "city": "..." }, "specialInstructions"?, "contactInfo"? }`  
**Error 400:** Missing quantity or address, insufficient stock, supply inactive  
**Success 201:** Created order record.

---

### 4.14 Update Order Status (Authenticated)
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/supplies/:id/orders/:orderId/status` |
| **Auth** | supplier (owner) or admin |

**Request body:** `{ "status": "processing" }`  
**Error 400:** Invalid ObjectId for `id` or `orderId`

---

### 4.15 Add Review (Authenticated)
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/supplies/:id/reviews` |
| **Auth** | Any authenticated user |

**Request body:** `{ "rating": 5, "comment": "Great product!" }`  
**Error 400:** Missing rating or comment, invalid ObjectId

---

### 4.16 Get My Supplies (Supplier)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/my-supplies` |
| **Auth** | Any authenticated user |

**Query params:** `status`, `page`, `limit`

---

### 4.17 Get My Orders (Authenticated)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/my-orders` |
| **Auth** | Any authenticated user |

**Query params:** `status`, `page`, `limit`

---

### 4.18 Get Statistics (Admin only)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/supplies/statistics` |
| **Auth** | admin |

**Success 200:** Aggregated stats object from `statisticsService.getStatistics()`.

---

## 5. v2 Fix Log

| # | Issue | Root Cause | Fix Applied |
|---|---|---|---|
| 1 | No rate limiting on any protected route | Routes file missing limiter | Added `suppliesLimiter` (60 req/min) and `router.use(suppliesLimiter)` after `router.use(auth)` |
| 2 | `handleError` used raw `res.status(500).json({...})` | `sendServerError` not imported | Replaced with `sendServerError(res, error, fallbackMessage)` — retains per-error logging via internal logger |
| 3 | Missing `isValidObjectId` on 9 handlers | No guards before service calls | Added ObjectId guards to `getSupply`, `updateSupply`, `patchSupply`, `deleteSupply`, `uploadImages`, `deleteImage` (+ `imageId`), `orderSupply`, `updateOrderStatus` (+ `orderId`), `addReview` |
| 4 | SDK missing `getStatistics()` method | Endpoint existed but SDK never exposed it | Added `getStatistics()` with JSDoc and `@throws LocalProAuthorizationError` note |
| 5 | SDK had no class-level JSDoc or usage example | Never written | Added full class JSDoc block with `@example` showing list, create, order, updateOrderStatus, addReview, getStatistics |

---

## 6. Service-Layer Architecture

The controller is intentionally thin. All business logic lives in the service layer:

| Service | Responsibility |
|---|---|
| `suppliesService` | CRUD, image management, geolocation, category listing, nearby search, featured listing |
| `orderService` | Order creation (validates stock, calculates cost, embeds order, emails supplier), status updates |
| `reviewService` | Review validation, insertion, rating aggregation |
| `statisticsService` | Aggregate pipeline for admin dashboard stats |
| `descriptionService` | AI description generation via LLM API |
| `automatedSuppliesFulfillmentService` | Background worker — auto-processes pending orders |
| `automatedSuppliesReorderReminderService` | Background worker — alerts suppliers when stock is low |

Error types from `errors/SuppliesErrors.js`:
- `NotFoundError` → 404
- `ForbiddenError` → 403
- `ValidationError` → 400
- `AppError` (base) → `statusCode` defined per instance

---

## 7. SDK Method Reference

All methods are on `client.supplies`.

### 7.1 Public Browse

| Method | Params | Returns |
|---|---|---|
| `list(filters?)` | `{ search, category, location, minPrice, maxPrice, page, limit, sortBy, sortOrder }` | Paginated supplies |
| `getById(supplyId)` | supplyId required | Full supply detail |
| `getCategories()` | — | Category list |
| `getFeatured(filters?)` | `{ limit? }` | Featured supply list |
| `getNearby(locationData)` | `lat` + `lng` required | Nearby supplies |

### 7.2 Supplier CRUD

| Method | Params | Returns |
|---|---|---|
| `create(supplyData)` | `name` + `price` required | Created supply |
| `update(supplyId, data)` | supplyId required | Updated supply |
| `patch(supplyId, data)` | supplyId required | Partially updated supply |
| `delete(supplyId)` | supplyId required | `{ message }` |
| `getMySupplies(filters?)` | `{ status, page, limit }` | Supplier's own products |

### 7.3 Images

| Method | Params | Returns |
|---|---|---|
| `uploadImages(supplyId, formData)` | both required | Uploaded image records |
| `deleteImage(supplyId, imageId)` | both required | `{ message }` |

### 7.4 Orders

| Method | Params | Returns |
|---|---|---|
| `order(supplyId, orderData)` | `quantity` required | Created order |
| `updateOrderStatus(supplyId, orderId, statusData)` | `status` required | Updated order |
| `getMyOrders(filters?)` | `{ status, page, limit }` | Buyer's order list |

### 7.5 Reviews & Admin

| Method | Params | Returns |
|---|---|---|
| `addReview(supplyId, reviewData)` | `rating` + `comment` required | Created review |
| `getStatistics()` | — | Aggregated admin stats |
| `generateDescription(descriptionData)` | `name` required | AI-generated description + `usage` |

---

## 8. Usage Examples

```javascript
const client = new LocalPro({ apiKey, apiSecret });

// Browse
const page1 = await client.supplies.list({ category: 'tools', page: 1, limit: 20 });
const categories = await client.supplies.getCategories();
const nearby = await client.supplies.getNearby({ lat: 14.5995, lng: 120.9842, radius: 10 });

// Supplier: create and manage a product
const product = await client.supplies.create({ name: 'Drill bit set', price: 1250, category: 'tools' });
await client.supplies.uploadImages(product.data._id, formData);
await client.supplies.patch(product.data._id, { 'inventory.quantity': 45 });

// AI description
const desc = await client.supplies.generateDescription({ name: 'Drill bit set', category: 'tools' });

// Order flow
const order = await client.supplies.order(product.data._id, {
  quantity: 2,
  deliveryAddress: { street: '123 Main St', city: 'Manila', zipCode: '1000' }
});
await client.supplies.updateOrderStatus(product.data._id, order.data._id, { status: 'processing' });

// Review
await client.supplies.addReview(product.data._id, { rating: 5, comment: 'Great quality!' });

// Admin stats
const stats = await client.supplies.getStatistics();
```
