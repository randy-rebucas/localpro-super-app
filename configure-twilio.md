# 🔧 Twilio Configuration Guide

## Current Issue
❌ **Authentication Error** - Your Twilio credentials are missing or incorrect.

---

## ✅ Step-by-Step Fix

### Step 1: Get Your Twilio Credentials

#### A. Account SID and Auth Token
1. Go to: **https://console.twilio.com**
2. Login to your account
3. On the dashboard, you'll see:
   - **Account SID** (starts with `AC`) - Copy this
   - **Auth Token** (hidden) - Click "Show" and copy

#### B. Create Verify Service
1. Go to: **https://console.twilio.com/us1/develop/verify/services**
2. Click **"Create new Service"** button
3. Enter name: `LocalPro Verification`
4. Click **"Create"**
5. Copy the **Service SID** (starts with `VA`)

#### C. Get Phone Number (Optional)
1. Go to: **https://console.twilio.com/us1/develop/phone-numbers/manage/incoming**
2. Copy one of your active phone numbers (format: +1234567890)

---

### Step 2: Update Your .env File

Open your `.env` file and find the Twilio section.

**Remove any duplicate entries** and ensure you have only these lines:

```bash
# Twilio SMS Verification Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Replace with your actual values from Step 1!**

---

### Step 3: Test Your Configuration

After saving your .env file:

```bash
# Test Twilio setup
node setup-twilio.js
```

**Expected Success Output:**
```
✅ Twilio client initialized successfully
✅ Verify Service found and active
✅ Verification code sent successfully
```

---

### Step 4: Restart Your Server

```bash
# Stop current server (Ctrl+C)

# Start again
npm run dev
```

Look for this message in the logs:
```
✅ Twilio client initialized successfully
```

---

## 🐛 Common Issues

### Issue 1: "Authenticate" Error
**Cause:** Wrong Account SID or Auth Token

**Fix:**
- Double-check you copied the correct values
- Make sure there are no extra spaces
- Auth Token is case-sensitive
- If you regenerated your Auth Token in Twilio Console, use the new one

### Issue 2: "Service not found or inactive"
**Cause:** Wrong Verify Service SID or service not created

**Fix:**
- Make sure you created a Verify Service (not a Messaging Service)
- Copy the correct Service SID (starts with VA)
- Verify the service is active in Twilio Console

### Issue 3: Trial Account Limitations
**Cause:** Twilio trial accounts can only send to verified numbers

**Fix:**
- Option A: Verify your test phone numbers in Twilio Console
- Option B: Upgrade to a paid account ($20 credit minimum)

---

## 🧪 Testing with Real Phone Numbers

After configuration is working:

```bash
# Test sending verification code
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

**Note:** Replace `+1234567890` with a real phone number you can access.

For **trial accounts**, this must be a verified number.

---

## 💡 Development Alternative

If you don't have Twilio or want to skip SMS for now:

### Option 1: Use Test Mode (Mock SMS)
In your `.env`:
```bash
TWILIO_TEST_MODE=true
```

This will:
- ✅ Skip real SMS sending
- ✅ Accept any 6-digit code for verification
- ✅ Allow development without Twilio account

### Option 2: Use Email OTP Instead
Configure email service in `.env`:
```bash
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

Then use email authentication endpoints.

---

## 📋 Checklist

Before running `setup-twilio.js` again:

- [ ] I have a Twilio account (free trial is fine)
- [ ] I copied Account SID (starts with AC)
- [ ] I copied Auth Token (32 characters)
- [ ] I created a Verify Service in Twilio Console
- [ ] I copied Verify Service SID (starts with VA)
- [ ] I removed duplicate entries from .env
- [ ] I saved my .env file with correct values
- [ ] No extra spaces or quotes in values

---

## 🆘 Need More Help?

### Check Twilio Dashboard Logs
1. Go to: https://console.twilio.com/us1/monitor/logs/debugger
2. See detailed error messages from Twilio API

### Contact Support
- **Twilio Support:** For account-related issues
- **Project Team:** For application-specific issues

---

**Last Updated:** January 7, 2026
