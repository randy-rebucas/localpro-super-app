# Supplier Use Cases

## Overview
This document describes the primary use cases for suppliers in the LocalPro Super App.

## Role Definition
**Supplier**: Users who supply materials, equipment, and products to other users on the platform.

## Use Cases

### UC-SU-001: Create Supply Listing
**Description**: Supplier creates product listing

**Actors**: Supplier

**Preconditions**: Supplier is authenticated and verified

**Main Flow**:
1. Supplier creates supply via `/api/supplies`
2. Supplier adds product details (name, description, category)
3. Supplier sets pricing and stock
4. Supplier uploads product images via `/api/supplies/:id/images`
5. Product becomes visible to customers

**Related Endpoints**:
- `POST /api/supplies`
- `POST /api/supplies/:id/images`
- `GET /api/supplies/my-supplies`

---

### UC-SU-002: Manage Supply Listings
**Description**: Supplier manages product listings

**Actors**: Supplier

**Main Flow**:
1. Supplier views products via `/api/supplies/my-supplies`
2. Supplier updates product via `/api/supplies/:id`
3. Supplier manages inventory (stock levels)
4. Supplier updates pricing
5. Supplier deletes products if needed

**Related Endpoints**:
- `GET /api/supplies/my-supplies`
- `PUT /api/supplies/:id`
- `DELETE /api/supplies/:id`

---

### UC-SU-003: Manage Orders
**Description**: Supplier processes customer orders

**Actors**: Supplier

**Main Flow**:
1. Supplier views orders via `/api/supplies/my-orders`
2. Supplier confirms order
3. Supplier updates order status via `/api/supplies/:id/orders/:orderId/status`
4. Supplier ships order
5. Supplier marks as delivered

**Related Endpoints**:
- `GET /api/supplies/my-orders`
- `PUT /api/supplies/:id/orders/:orderId/status`

---

### UC-SU-004: Financial Management
**Description**: Supplier manages earnings and finances

**Actors**: Supplier

**Main Flow**:
1. Supplier views earnings via `/api/finance/earnings`
2. Supplier views transactions via `/api/finance/transactions`
3. Supplier requests withdrawal via `/api/finance/withdraw`
4. Supplier tracks order payments

**Related Endpoints**:
- `GET /api/finance/overview`
- `GET /api/finance/earnings`
- `POST /api/finance/withdraw`

---

## Summary
Suppliers manage product listings, process orders, and handle financial operations. Similar to providers but focused on product supply rather than services.

