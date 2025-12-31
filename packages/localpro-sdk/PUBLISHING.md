# Publishing Guide for @localpro/sdk

This guide explains how to publish the @localpro/sdk package to npm.

## Prerequisites

1. An npm account (create one at https://www.npmjs.com/signup if needed)
2. Access to the `@localpro` organization on npm (for private packages), OR
3. Plan to publish as a public package (using `--access public`)

## Authentication Setup

### Step 1: Login to npm

Run the following command in your terminal:

```bash
npm login
```

You'll be prompted for:
- **Username**: Your npm username
- **Password**: Your npm password (hidden input)
- **Email**: Your npm account email
- **One-Time Password (OTP)**: If you have 2FA enabled, enter the code from your authenticator app

### Step 2: Verify Authentication

Verify you're logged in:

```bash
npm whoami
```

This should display your npm username.

### Step 3: (Optional) Get Your Auth Token

If you need to configure authentication via `.npmrc` or for CI/CD:

```bash
npm config get //registry.npmjs.org/:_authToken
```

**Note**: Never commit your auth token to version control. Use environment variables or secrets in CI/CD.

## Publishing Options

### Option A: Publish as Public Package (Recommended for open-source)

Since `@localpro/sdk` is a scoped package, it's private by default. To publish it publicly:

```bash
npm run publish:public
```

Or manually:
```bash
npm publish --access public
```

### Option B: Publish as Private Package (Requires @localpro org membership)

If you have access to the `@localpro` organization on npm:

```bash
npm publish
```

**Note**: You must be a member of the `@localpro` organization on npm to publish private scoped packages.

### Option C: Automated Version Bumping

We've included scripts to automatically bump the version and publish:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run publish:patch

# Minor version (1.0.0 -> 1.1.0)
npm run publish:minor

# Major version (1.0.0 -> 2.0.0)
npm run publish:major
```

These scripts will:
1. Update the version in `package.json`
2. Create a git tag
3. Publish to npm

## Publishing Steps

1. **Navigate to the package directory**:
   ```bash
   cd packages/localpro-sdk
   ```

2. **Ensure you're logged in**:
   ```bash
   npm whoami
   ```

3. **Update version if needed** (if not using automated scripts):
   ```bash
   npm version patch|minor|major
   ```

4. **Publish**:
   ```bash
   npm run publish:public
   ```

## Verifying Your Publish

After publishing, verify your package is available:

```bash
npm view @localpro/sdk
```

Or check on npmjs.com:
https://www.npmjs.com/package/@localpro/sdk

## Troubleshooting

### Error: "You need to authorize this machine using `npm adduser`"

**Solution**: Run `npm login` (or `npm adduser` - they're the same command)

### Error: "You cannot publish over the previously published versions"

**Solution**: Bump the version first using `npm version patch|minor|major` or use the automated scripts

### Error: "You do not have permission to publish '@localpro/sdk'"

**Solutions**:
- If publishing as private: You need to be added to the `@localpro` organization on npm
- If publishing as public: Use `npm run publish:public` or `npm publish --access public`

### Error: "Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages"

**This is a requirement from npm**: You MUST enable 2FA or use a granular access token to publish packages.

#### Option 1: Enable Two-Factor Authentication (Recommended)

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/auth
2. Click "Enable 2FA" or "Edit Two-Factor Authentication"
3. Choose your preferred method:
   - **Authorization-only (recommended)**: 2FA only required for sensitive operations (like publishing)
   - **Authorization and writes**: 2FA required for all write operations
4. Follow the setup instructions (you'll need an authenticator app like Google Authenticator, Authy, or 1Password)
5. Save the backup codes in a safe place
6. After enabling 2FA, log out and log back in:
   ```bash
   npm logout
   npm login
   ```
   You'll be prompted for your OTP (one-time password) from your authenticator app

#### Option 2: Use a Granular Access Token (For Automation/CI/CD)

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Choose "Granular Access Token"
4. Configure the token:
   - **Token name**: e.g., "SDK Publishing Token"
   - **Expiration**: Choose your preferred expiration (or never expires for automation)
   - **Access**: Select "Read and write" packages
   - **Packages**: Select `@localpro/sdk` (or leave blank for all packages)
   - **Bypass 2FA**: ✅ **Enable this checkbox** (this is required for publishing)
5. Click "Generate Token"
6. **Copy the token immediately** (you won't see it again!)
7. Use the token to authenticate:
   ```bash
   npm logout
   npm login --auth-type=legacy
   ```
   When prompted:
   - Username: Your npm username
   - Password: **Paste the token here** (not your actual password)
   - Email: Your npm email

### Error: "403 Forbidden - Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages"

**This is the exact error you're seeing!** npm requires 2FA to be enabled for all package publishing. Follow one of the solutions above:

1. **Enable 2FA** (Option 1 above) - Recommended for security
2. **Create a Granular Access Token with Bypass 2FA** (Option 2 above) - Better for automation

After completing either option, log out and log back in:
```bash
npm logout
npm login
```

Then try publishing again:
```bash
npm run publish:public
```

## CI/CD Publishing

For automated publishing in CI/CD pipelines:

1. Create an automation token on npm
2. Store it as a secret in your CI/CD system
3. Use it in your pipeline:
   ```bash
   echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
   npm publish --access public
   ```

## Additional Resources

- [npm Publishing Documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm Scoped Packages](https://docs.npmjs.com/about-scoped-packages)
- [npm Authentication](https://docs.npmjs.com/about-authentication)
