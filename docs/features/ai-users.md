# AI Users Feature Documentation

## Overview
The AI Users feature provides AI-powered tools to help users enhance their profiles and personal branding on the platform.

## Base Path
`/api/ai/users`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/bio-generator` | Generate professional bio using AI | AUTHENTICATED |

## Request/Response Examples

### Generate User Bio
```http
POST /api/ai/users/bio-generator
Authorization: Bearer <token>
Content-Type: application/json

{
  "profession": "Electrician",
  "experience": 10,
  "skills": ["Residential wiring", "Commercial installations", "Solar panels"],
  "certifications": ["Licensed Electrician", "OSHA Certified"],
  "personality": "professional",
  "length": "medium"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "bio": "Licensed electrician with over 10 years of experience in residential and commercial electrical systems. Specializing in modern wiring solutions, commercial installations, and renewable energy with expertise in solar panel systems. OSHA certified professional committed to safety and quality workmanship. Available for projects of all sizes.",
    "suggestions": [
      "Consider adding specific notable projects",
      "Include service area information",
      "Mention availability and response time"
    ]
  }
}
```

## Bio Generator Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| profession | String | Yes | User's profession/role |
| experience | Number | No | Years of experience |
| skills | Array | No | Key skills/specializations |
| certifications | Array | No | Professional certifications |
| personality | String | No | Tone: professional, friendly, casual |
| length | String | No | short, medium, long |

## Personality Options

- `professional` - Formal, business-like tone (default)
- `friendly` - Warm, approachable tone
- `casual` - Relaxed, conversational tone

## Length Options

- `short` - 1-2 sentences (50-100 characters)
- `medium` - 2-3 sentences (100-200 characters) (default)
- `long` - 3-5 sentences (200-400 characters)

## Use Cases

1. **New Provider Onboarding**:
   - Provider creates profile
   - AI generates professional bio
   - Provider reviews and customizes

2. **Profile Enhancement**:
   - Existing user wants to improve bio
   - AI generates suggestions
   - User updates profile

3. **Multi-Language Support**:
   - Bio generated in preferred language
   - Localized for target market

## AI-Generated Content Guidelines

- Generated bios are suggestions only
- Users should review and personalize
- Factual claims should be verified
- Content respects platform guidelines

## Rate Limiting

- Maximum 10 bio generations per hour per user
- Prevents abuse of AI resources

## Related Features
- Authentication (Profile management)
- Providers (Provider profiles)
- User Management
- AI Marketplace (Other AI tools)

