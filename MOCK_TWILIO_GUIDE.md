# 🧪 Mock Twilio Service Guide

## Overview

The Mock Twilio Service provides a complete simulation of Twilio's Verify API for development and testing, without requiring real Twilio credentials or making actual API calls.

**Perfect for:**
- 🚀 Local development
- 🧪 Unit and integration testing
- 🔄 CI/CD pipelines
- 💰 Cost-free testing (no SMS charges)
- 🌐 Offline development

---

## Features

✅ **Full API Compatibility** - Drop-in replacement for real Twilio service  
✅ **No External Calls** - Works completely offline  
✅ **Accepts Any Valid Code** - Any 6-digit code works for verification  
✅ **Comprehensive Logging** - All operations logged for debugging  
✅ **Zero Cost** - No Twilio account or credits needed  
✅ **Validation Testing** - Tests phone number and code format validation  
✅ **Easy Toggle** - Switch between mock and real with one env variable

---

## Quick Start

### 1. Enable Test Mode

Add to your `.env` file:

```bash
# Enable Mock Twilio (Test Mode)
TWILIO_TEST_MODE=true
```

That's it! No Twilio credentials needed.

### 2. Restart Your Server

```bash
npm run dev
```

You should see:
```
🧪 TWILIO_TEST_MODE enabled - Using mock Twilio service
🧪 Mock Twilio Service initialized (TEST MODE)
```

### 3. Use Normally

Your authentication will work exactly as before, but:
- No real SMS messages are sent
- Any 6-digit code will be accepted for verification
- All operations are logged for debugging

---

## Testing

### Run the Test Suite

```bash
node test-mock-twilio.js
```

**Expected Output:**
```
🧪 ====================================
   Mock Twilio Service Test
====================================

✅ Send verification code: PASSED
✅ Verify code: PASSED
✅ Invalid code rejection: PASSED
✅ Send SMS: PASSED
✅ Invalid phone rejection: PASSED
✅ Service status retrieved

====================================
✅ All mock Twilio tests completed!
====================================
```

### Manual Testing via API

#### Send Verification Code

```bash
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "isNewUser": true
}
```

**Check logs** - you'll see the mock code that was "sent":
```
🧪 [MOCK] Verification code sent
  phoneNumber: +1234***
  mockCode: 789012
  note: In test mode, ANY 6-digit code will work for verification
```

#### Verify Code (Use Any 6-Digit Code)

```bash
curl -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "phoneNumber": "+1234567890",
    "role": "user"
  }
}
```

---

## How It Works

### Architecture

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
         ├─── TWILIO_TEST_MODE=true ?
         │
         ├─── YES ──► Mock Twilio Service
         │              • No API calls
         │              • Accepts any code
         │              • Logs operations
         │
         └─── NO ───► Real Twilio Service
                       • Makes real API calls
                       • Sends actual SMS
                       • Requires credentials
```

### Mock Service Features

1. **Send Verification Code**
   - Validates phone number format
   - Generates random 6-digit code (for logging only)
   - Returns success without API call
   - Logs operation for debugging

2. **Verify Code**
   - Validates phone number format
   - Checks if code is 6 digits
   - **Accepts ANY valid 6-digit code**
   - Returns success

3. **Send SMS**
   - Validates phone number
   - Logs message preview
   - Returns success without sending

---

## API Reference

### TwilioServiceMock Methods

#### `sendVerificationCode(phoneNumber)`

Simulates sending a verification code.

**Parameters:**
- `phoneNumber` (string) - Phone number in E.164 format (+1234567890)

**Returns:**
```javascript
{
  success: true,
  sid: 'SM...',      // Mock SID
  status: 'pending',
  mock: true         // Indicates mock service
}
```

**Example:**
```javascript
const result = await TwilioService.sendVerificationCode('+1234567890');
if (result.success) {
  console.log('Code sent!', result.sid);
}
```

---

#### `verifyCode(phoneNumber, code)`

Verifies a code (accepts any 6-digit code).

**Parameters:**
- `phoneNumber` (string) - Phone number in E.164 format
- `code` (string) - 6-digit verification code

**Returns:**
```javascript
{
  success: true,
  status: 'approved',
  valid: true,
  mock: true
}
```

**Example:**
```javascript
const result = await TwilioService.verifyCode('+1234567890', '123456');
if (result.success) {
  console.log('Code verified!');
}
```

---

#### `sendSMS(to, message)`

Simulates sending an SMS message.

**Parameters:**
- `to` (string) - Recipient phone number
- `message` (string) - Message content

**Returns:**
```javascript
{
  success: true,
  sid: 'SM...',
  status: 'queued',
  mock: true
}
```

**Example:**
```javascript
const result = await TwilioService.sendSMS('+1234567890', 'Hello!');
```

---

#### `getStatus()`

Returns current service status (mock only).

**Returns:**
```javascript
{
  isTestMode: true,
  isMockService: true,
  sentCodesCount: 3,
  message: 'Mock Twilio service is active...'
}
```

---

#### `getSentCodes()`

Returns all sent codes for debugging (mock only).

**Returns:**
```javascript
{
  '+1234***': {
    code: '789012',
    status: 'approved',
    timestamp: '2026-01-07T14:30:00.000Z'
  }
}
```

⚠️ **Warning:** Never expose this endpoint in production!

---

#### `clearCodes()`

Clears all stored verification codes.

---

## Validation Rules

The mock service validates inputs just like the real Twilio service:

### Phone Number Validation

✅ **Valid:**
- `+1234567890` (E.164 format)
- `+447123456789` (UK)
- `+639171234567` (Philippines)

❌ **Invalid:**
- `1234567890` (missing +)
- `(123) 456-7890` (formatted)
- `+1-234-567-8900` (dashes)

### Verification Code Validation

✅ **Valid:**
- Any 6-digit code: `123456`, `000000`, `999999`

❌ **Invalid:**
- Less than 6 digits: `12345`
- More than 6 digits: `1234567`
- Non-numeric: `12345a`, `abcdef`

---

## Configuration

### Environment Variables

```bash
# Enable/Disable Mock Service
TWILIO_TEST_MODE=true          # Use mock service
TWILIO_TEST_MODE=false         # Use real Twilio (requires credentials)

# If using real Twilio (TWILIO_TEST_MODE=false or not set):
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=xxxx...
TWILIO_VERIFY_SERVICE_SID=VAxxxx...
TWILIO_PHONE_NUMBER=+1234567890
```

### Switching Between Mock and Real

**Development (Local):**
```bash
TWILIO_TEST_MODE=true
```

**Staging:**
```bash
TWILIO_TEST_MODE=true  # or false with real credentials
```

**Production:**
```bash
TWILIO_TEST_MODE=false
TWILIO_ACCOUNT_SID=your_real_sid
TWILIO_AUTH_TOKEN=your_real_token
TWILIO_VERIFY_SERVICE_SID=your_real_service_sid
```

---

## Use Cases

### 1. Local Development

```bash
# .env.local
TWILIO_TEST_MODE=true
NODE_ENV=development
```

**Benefits:**
- Develop without Twilio account
- No internet required
- Instant "SMS" delivery
- Zero costs

### 2. Automated Testing

```javascript
// test/auth.test.js
describe('Authentication', () => {
  beforeAll(() => {
    process.env.TWILIO_TEST_MODE = 'true';
  });

  it('should send verification code', async () => {
    const response = await request(app)
      .post('/api/auth/send-code')
      .send({ phoneNumber: '+1234567890' });
    
    expect(response.body.success).toBe(true);
  });

  it('should verify any 6-digit code', async () => {
    const response = await request(app)
      .post('/api/auth/verify-code')
      .send({ 
        phoneNumber: '+1234567890',
        code: '123456'  // Any 6-digit code works!
      });
    
    expect(response.body.success).toBe(true);
  });
});
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/test.yml
env:
  TWILIO_TEST_MODE: true
  NODE_ENV: test

steps:
  - name: Run tests
    run: npm test
```

### 4. Demo/Staging Environment

Perfect for demos where you don't want to send real SMS:

```bash
# .env.staging
TWILIO_TEST_MODE=true
```

Users can "verify" with any 6-digit code like `111111`.

---

## Logging

The mock service provides detailed logs:

### Success Logs

```
🧪 Mock Twilio Service initialized (TEST MODE)
🧪 [MOCK] Verification code sent
  phoneNumber: +1234***
  mockCode: 789012
  note: In test mode, ANY 6-digit code will work for verification

🧪 [MOCK] Code verified successfully
  phoneNumber: +1234***
  providedCode: 123456
  note: In test mode, all valid 6-digit codes are accepted
```

### Error Logs

```
🧪 [MOCK] Verification error: Invalid phone number format
🧪 [MOCK] SMS error: Message cannot be empty
```

---

## Comparison: Mock vs Real

| Feature | Mock Service | Real Twilio |
|---------|-------------|-------------|
| **SMS Sent** | No (simulated) | Yes |
| **API Calls** | None | Yes |
| **Credentials Required** | No | Yes |
| **Costs** | Free | Pay per SMS |
| **Internet Required** | No | Yes |
| **Verification Codes** | Any 6-digit code | Only sent code |
| **Phone Validation** | Yes | Yes |
| **Code Format Validation** | Yes | Yes |
| **Logging** | Detailed | Standard |
| **Response Format** | Same | Same |

---

## Best Practices

### ✅ DO

- Use mock service for local development
- Use mock service for automated testing
- Use mock service in CI/CD pipelines
- Log operations for debugging
- Test validation logic with mock service
- Switch to real Twilio for staging/production

### ❌ DON'T

- Use mock service in production
- Expose getSentCodes() in production
- Rely on mock service for actual user verification
- Skip testing with real Twilio before production

---

## Troubleshooting

### Mock Service Not Being Used

**Symptom:** Still getting Twilio authentication errors

**Fix:**
1. Check `.env`: `TWILIO_TEST_MODE=true`
2. Restart server
3. Check logs for: `🧪 TWILIO_TEST_MODE enabled`

### Verification Still Failing

**Symptom:** Codes rejected even in test mode

**Fix:**
1. Verify code is exactly 6 digits
2. Check phone number format (+country code)
3. Check logs for specific error message

### Want to See Mock Codes

**Solution:**
```javascript
// In development only!
const status = TwilioService.getStatus();
console.log('Sent codes:', TwilioService.getSentCodes());
```

---

## Migration Guide

### From Real Twilio to Mock

1. Add to `.env`:
   ```bash
   TWILIO_TEST_MODE=true
   ```

2. Remove (or comment out) Twilio credentials:
   ```bash
   # TWILIO_ACCOUNT_SID=...
   # TWILIO_AUTH_TOKEN=...
   # TWILIO_VERIFY_SERVICE_SID=...
   ```

3. Restart server

### From Mock to Real Twilio

1. Update `.env`:
   ```bash
   TWILIO_TEST_MODE=false
   TWILIO_ACCOUNT_SID=ACxxxx...
   TWILIO_AUTH_TOKEN=xxxx...
   TWILIO_VERIFY_SERVICE_SID=VAxxxx...
   ```

2. Test with setup script:
   ```bash
   node setup-twilio.js
   ```

3. Restart server

---

## Security Notes

### Mock Service

- ✅ Safe for development
- ✅ Safe for testing
- ⚠️ **NEVER use in production**
- ⚠️ **NEVER expose getSentCodes() publicly**

### Production Checklist

- [ ] `TWILIO_TEST_MODE=false` or not set
- [ ] Real Twilio credentials configured
- [ ] Tested with real phone numbers
- [ ] getSentCodes() not exposed in API
- [ ] Proper rate limiting enabled

---

## Support

### Issues with Mock Service

1. Check logs for detailed error messages
2. Run test script: `node test-mock-twilio.js`
3. Verify environment variables
4. Check phone number format

### Switching to Production

1. Follow [configure-twilio.md](configure-twilio.md)
2. Test with real Twilio account
3. Update environment variables
4. Restart server

---

## Related Documentation

- [configure-twilio.md](configure-twilio.md) - Real Twilio setup guide
- [AUTOMATIONS_DOCUMENTATION.md](AUTOMATIONS_DOCUMENTATION.md) - Automated services
- [CLIENT_MOBILE_APP_DOCUMENTATION.md](CLIENT_MOBILE_APP_DOCUMENTATION.md) - Authentication API

---

**Created:** January 7, 2026  
**Last Updated:** January 7, 2026
