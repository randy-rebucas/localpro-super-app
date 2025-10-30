# Finance API Endpoints

Base path: `/api/finance` (auth required)

## Overview & Analytics
- GET `/overview` — user financial overview
- GET `/transactions` — paginated transactions
- GET `/earnings` — earnings summary
- GET `/expenses` — expenses summary
- GET `/reports` — financial reports

## Expenses
- POST `/expenses` — add expense

## Withdrawals
- POST `/withdraw` — request withdrawal
- PUT `/withdrawals/:withdrawalId/process` — process withdrawal (Admin)

## Tax & Reports
- GET `/tax-documents` — tax docs listing
- GET `/reports` — financial reports

## Wallet
- PUT `/wallet/settings` — update wallet settings

---

## Loans (suggested endpoints)
- GET `/loans` — list user loans
- POST `/loans` — apply for loan (micro/business/equipment)
- GET `/loans/:id` — loan details
- PUT `/loans/:id` — update loan (admin/underwriting)
- POST `/loans/:id/approve` — approve loan (Admin)
- POST `/loans/:id/disburse` — disburse loan (Admin)
- POST `/loans/:id/repayments` — add repayment

## Salary Advance (suggested endpoints)
- GET `/salary-advance` — list requests (user/employer scope)
- POST `/salary-advance` — request advance
- POST `/salary-advance/:id/approve` — approve (Employer/Admin)
- POST `/salary-advance/:id/disburse` — disburse
- POST `/salary-advance/:id/repay` — mark repaid / payroll deduction

## Transactions
- GET `/transactions` — list (supports filters: type, status, direction, date range)

## Responses
- Lists: `{ success, count, total, page, pages, data: [...] }`
- Mutations: `{ success, message, data? }`
- Detail: `{ success, data }`

## Errors
- 400 validation errors
- 403 unauthorized for role/resource
- 404 not found
- 500 server error
