## Usage Examples: Providers

Create Provider Profile (client upgrading to provider)

```bash
curl -X POST /api/providers/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerType": "individual",
    "professionalInfo": {
      "specialties": [
        {
          "category": "cleaning",
          "subcategories": ["deep_clean"],
          "experience": 3,
          "skills": ["steam_cleaner"],
          "hourlyRate": 35,
          "serviceAreas": [{"city":"Austin","state":"TX","radius":20}]
        }
      ],
      "languages": ["en"],
      "emergencyServices": true
    }
  }'
```

Update Profile

```bash
curl -X PUT /api/providers/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {"communicationPreferences": {"preferredContactMethod": "sms"}},
    "settings": {"allowDirectBooking": false}
  }'
```

Advance Onboarding Step

```bash
curl -X PUT /api/providers/onboarding/step \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "step": "verification",
    "data": {"identityVerified": true}
  }'
```

Upload Insurance Documents

```bash
curl -X POST /api/providers/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "documentType=insurance" \
  -F "documents=@policy.pdf"
```

List Providers (public)

```bash
curl "/api/providers?category=cleaning&city=Austin&state=TX&minRating=4&featured=true&page=1&limit=10&sortBy=performance.rating&sortOrder=desc"
```


