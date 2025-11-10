# App Settings API Endpoints

Base path: `/api/settings`

## Public
### GET `/` or `/app/public`
Returns a public subset for client bootstrap.
Response: `{ success, data: { general{ appName, appVersion, maintenanceMode }, business{ companyName, supportChannels }, features, uploads{...}, payments{ defaultCurrency, supportedCurrencies, minimumPayout } } }`

### GET `/app/health`
Response: `{ success, data: { status, version, environment, maintenanceMode, features:{ [k]:enabled }, timestamp } }`

## Admin (require auth role: admin)
### GET `/app`
Get full app settings.

### PUT `/app`
Body: partial updates across categories; validated per-field.
Response: `{ success, message: 'App settings updated successfully', data }`

### PUT `/app/:category`
Path: `category` in ['general','business','features','uploads','payments','security','notifications','integrations','analytics']
Body: partial updates for that category.
Response: `{ success, message: '<category> settings updated successfully', data: <category> }`

### POST `/app/features/toggle`
Body: `{ feature: string, enabled: boolean }` where feature is under `features.*` (e.g., 'marketplace','academy','jobBoard','referrals','payments','analytics').
Response: `{ success, message, data:{ feature, enabled } }`

## Validation
- Extensive validators cover enums, ranges, formats (ISO8601, HH:mm), and array membership.
- Non-admin requests receive 403.
