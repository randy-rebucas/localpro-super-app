## Usage Examples: Referrals

Validate a Referral Code

```bash
curl -X POST /api/referrals/validate \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"ABCD1234"}'
```

Track Referral Click

```bash
curl -X POST /api/referrals/track \
  -H "Content-Type: application/json" \
  -d '{
    "referralCode":"ABCD1234",
    "trackingData": {
      "source":"social_media",
      "utmSource":"twitter",
      "utmMedium":"social",
      "utmCampaign":"spring"
    }
  }'
```

Send Invitations (Email)

```bash
curl -X POST /api/referrals/invite \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emails":["friend@example.com"],
    "message":"Join me on LocalPro and get a bonus!",
    "method":"email"
  }'
```

Get My Referrals

```bash
curl -H "Authorization: Bearer <token>" \
  "/api/referrals/me?timeRange=30&page=1&limit=10"
```

Process Referral Completion (Admin)

```bash
curl -X POST /api/referrals/process \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "referralId":"64f...",
    "triggerAction": {
      "type":"booking",
      "referenceId":"64a...",
      "referenceType":"Booking",
      "amount": 120,
      "currency":"USD"
    }
  }'
```


