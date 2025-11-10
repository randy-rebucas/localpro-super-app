# Facility Care Best Practices

## Services
- Normalize pricing types; document unit semantics (per_sqft vs per_visit).
- Validate availability schedule (HH:mm, day enum) and service areas.

## Contracts
- Require contract date consistency: `startDate < endDate`, `duration` matches dates.
- Compute `totalAmount` server-side to avoid tampering; store currency.
- Track KPIs in `performance.kpis` and review delivery quarterly.
- Use documents for contract/invoice/report assets; store URLs not files.

## Subscriptions
- Enforce schedule updates on each completion (set nextService).
- Auto-pay with retries; record payment history with transactionId.
- Allow pause/resume; compute prorations externally if needed.
- Maintain service history entries with status and provider.

## Indexing & Performance
- Index status and dates for dashboards and reminders.
- Paginate lists; lean for read endpoints.

## Security & Access
- Only client and provider should access/modify their contracts/subscriptions.
- Validate service ownership when creating contracts/subscriptions.
