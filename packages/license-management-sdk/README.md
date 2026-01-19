## Frontend Integrations

### React Hook
```js
import { useLicense } from 'license-management-sdk/react/useLicense';
const { isValid, loading, error, meta } = useLicense('LICENSE-KEY', { endpoint: '/api/validate-license' });
if (!isValid && !loading) return <div>License required: {error}</div>;
```

### Next.js HOC
```js
import { withLicense } from 'license-management-sdk/next/withLicense';
const getLicenseKey = ctx => ctx.req?.headers['x-license-key'] || null;
export default withLicense(getLicenseKey, { endpoint: '/api/validate-license' })(MyPage);
```

### Angular HTTP Interceptor
```ts
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LicenseInterceptor } from 'license-management-sdk/angular/license.interceptor';
@NgModule({
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: LicenseInterceptor, multi: true }
	]
})
export class AppModule {}
```

# License Management SDK

A feature-rich SDK for license validation, management, and middleware integration (Express, Koa).

## Features
- License validation utility (local, remote, JWT/signed)
- Express & Koa middleware for protecting routes
- License types & scopes (trial, full, subscription, user/device/org)
- Revocation list support (remote API)
- Admin utilities (generate, revoke, inspect)
- Logging and localization support

## Usage

### Local Validation Middleware
```js
const { licenseMiddleware } = require('license-management-sdk');
app.use(licenseMiddleware({ expiry: '2099-12-31', issuer: 'LocalPro', type: 'trial', scope: 'user' }));
```

### Remote Validation Middleware
```js
const { licenseMiddleware } = require('license-management-sdk');
app.use(licenseMiddleware({
	remote: {
		endpoint: 'https://your-license-server.com/validate',
		method: 'POST',
		headers: { 'Authorization': 'Bearer TOKEN' }
	}
}));
```

### With Logging
```js
app.use(licenseMiddleware({
	logger: (info) => console.log('License event:', info)
}));
```

### With Localization
```js
app.use(licenseMiddleware({ locale: 'es' })); // Spanish error messages
```

### Koa Middleware
```js
const Koa = require('koa');
const { koaLicenseMiddleware } = require('license-management-sdk');
const app = new Koa();
app.use(koaLicenseMiddleware({ type: 'subscription', scope: 'org' }));
```

### JWT/Signed License Validation
```js
const { validateLicenseJWT } = require('license-management-sdk');
const token = 'YOUR.JWT.LICENSE.TOKEN';
const secret = 'your-secret-or-public-key';
const result = validateLicenseJWT(token, { secretOrPublicKey: secret });
console.log(result);
```

### Revocation List (Remote API)
```js
const { validateLicense } = require('license-management-sdk');
const result = await validateLicense('LICENSE-KEY', {
	revocation: { endpoint: 'https://your-license-server.com/revoked' }
});
console.log(result);
```

### Admin Utilities
```js
const { generateLicense, revokeLicenseRemote, inspectLicense } = require('license-management-sdk');
// Generate unsigned license
const license = generateLicense({ type: 'full', scope: 'user', expiry: '2099-12-31' });
// Generate signed license (JWT)
const jwtLicense = generateLicense({ type: 'full', scope: 'user' }, { sign: true, secretOrPrivateKey: 'secret' });
// Revoke license via remote API
await revokeLicenseRemote('LICENSE-KEY', { endpoint: 'https://your-license-server.com/revoke' });
// Inspect license
const info = inspectLicense(jwtLicense, { secretOrPublicKey: 'secret' });
```
