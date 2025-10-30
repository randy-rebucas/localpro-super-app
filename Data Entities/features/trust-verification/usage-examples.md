## Usage Examples: Trust & Verification

Create Verification Request

```bash
curl -X POST /api/trust-verification/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "identity",
    "documents": [
      {"type":"government_id","url":"https://.../id-front.jpg"},
      {"type":"government_id","url":"https://.../id-back.jpg"}
    ],
    "additionalInfo": "Driver license ID XYZ"
  }'
```

Upload Documents

```bash
curl -X POST /api/trust-verification/requests/64f.../documents \
  -H "Authorization: Bearer <token>" \
  -F "files=@id-front.jpg" -F "files=@id-back.jpg"
```

Review Request (Admin)

```bash
curl -X PUT /api/trust-verification/requests/64f.../review \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","trustScore":85,"adminNotes":"All good"}'
```

Get Verified Users

```bash
curl "/api/trust-verification/verified-users?minTrustScore=70&page=1&limit=20"
```


