#

## React Integration

- **useLicense Hook**: Validate a license key from any React component using the provided hook.
  ```js
  import { useLicense } from 'license-management-sdk/react/useLicense';
  const { isValid, loading, error, meta } = useLicense('LICENSE-KEY', { endpoint: '/api/validate-license' });
  if (!isValid && !loading) return <div>License required: {error}</div>;
  ```
- **Usage**: Place the hook in your component to check license status and show/hide UI accordingly.

## Next.js Integration

- **withLicense HOC**: Wrap Next.js pages/components to enforce license validation on SSR or client.
  ```js
  import { withLicense } from 'license-management-sdk/next/withLicense';
  const getLicenseKey = ctx => ctx.req?.headers['x-license-key'] || null;
  export default withLicense(getLicenseKey, { endpoint: '/api/validate-license' })(MyPage);
  ```
- **Usage**: Use in `pages/` or custom app to protect routes.

## Angular Integration

- **LicenseInterceptor**: Add the HTTP interceptor to automatically attach license keys and handle license errors.
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
- **Usage**: Store the license key in localStorage or another provider. The interceptor will attach it to outgoing requests and handle 403 errors.

## Customization

- You can adapt the provided helpers for other frameworks (Vue, Svelte, etc.) using the same remote validation API pattern.
# License Management SDK – Feature Details

## License Types & Scopes
- **type**: Accepts 'trial', 'full', or 'subscription'. Used to restrict features or access based on license type.
- **scope**: Accepts 'user', 'device', or 'org'. Used to bind a license to a specific user, device, or organization.
- **Usage**: Pass `type` and `scope` in validation or middleware options. Example:
  ```js
  licenseMiddleware({ type: 'trial', scope: 'user' })
  ```

## JWT/Signed License Support
- **validateLicenseJWT(token, options)**: Validates a JWT license. Requires `secretOrPublicKey`.
- **generateLicense(payload, { sign, secretOrPrivateKey })**: Generates a signed JWT license.
- **inspectLicense(license, { secretOrPublicKey })**: Decodes or verifies a JWT license.
- **Algorithms**: Supports HS256 (default) and RS256.
- **Example**:
  ```js
  const token = generateLicense({ type: 'full' }, { sign: true, secretOrPrivateKey: 'secret' });
  const result = validateLicenseJWT(token, { secretOrPublicKey: 'secret' });
  ```

## Revocation List (Remote API)
- **validateLicense(..., { revocation })**: Checks if a license is revoked by calling a remote endpoint before other checks.
- **isLicenseRevokedRemote(licenseKey, { endpoint })**: Directly checks revocation status.
- **revokeLicenseRemote(licenseKey, { endpoint })**: Remotely revokes a license.
- **API Contract**: Endpoint should accept POST with `{ licenseKey }` and return `{ revoked: true/false }`.

## Admin Utilities
- **generateLicense**: Create plain or signed licenses.
- **revokeLicenseRemote**: Revoke a license via remote API.
- **inspectLicense**: Decode or verify license data.
- **Example**:
  ```js
  const license = generateLicense({ type: 'trial', expiry: '2026-12-31' });
  const jwtLicense = generateLicense({ type: 'full' }, { sign: true, secretOrPrivateKey: 'secret' });
  await revokeLicenseRemote('LICENSE-KEY', { endpoint: 'https://...' });
  const info = inspectLicense(jwtLicense, { secretOrPublicKey: 'secret' });
  ```

## Middleware Integration
- **Express**: `licenseMiddleware(options)`
- **Koa**: `koaLicenseMiddleware(options)`
- **Options**: All validation options, plus `logger` and `locale` for logging and localization.
- **Example**:
  ```js
  app.use(licenseMiddleware({ type: 'subscription', locale: 'fr', logger: console.log }));
  ```

## Localization
- **locale**: Set to 'en', 'es', 'fr', etc. for error messages.
- **Custom Messages**: Extend the `messages` object in middleware for more languages.

## Logging
- **logger**: Pass a function to receive validation events and results.
- **Example**:
  ```js
  app.use(licenseMiddleware({ logger: (info) => { /* log info */ } }));
  ```

## Advanced Usage
- **Combining Features**: All options can be combined for advanced scenarios (e.g., JWT + revocation + localization).
- **Example**:
  ```js
  app.use(licenseMiddleware({
    type: 'full',
    remote: { endpoint: 'https://...' },
    revocation: { endpoint: 'https://...' },
    locale: 'es',
    logger: (info) => console.log(info)
  }));
  ```
