# Phone Number Uniqueness Policy

## Overview
Mobile phone numbers serve as the primary unique identifier for users across the LocalPro Super App system. This document outlines how phone number uniqueness is enforced across all features.

## Core Principle
**The `phoneNumber` field in the User model is unique and required.** This ensures that:
- Each user account is uniquely identified by their phone number
- Phone numbers cannot be duplicated across user accounts
- Phone verification and authentication rely on this unique identifier

## Implementation

### Database Level
- **User Model**: `phoneNumber` has `unique: true` constraint at the MongoDB schema level
- **Index**: Unique index automatically created on `phoneNumber` field
- **Enforcement**: MongoDB prevents duplicate phone numbers at the database level

### Application Level

#### Validation Middleware
Located in `src/middleware/phoneValidation.js`:
- `validatePhoneUniqueness()`: Validates phone number uniqueness before creating/updating records
- `validatePhoneOwnership()`: Ensures phone numbers in verification requests match the authenticated user's phone

#### Controllers
All controllers that handle phone numbers validate uniqueness:
- **Auth Controller**: Checks uniqueness during registration/login
- **User Management Controller**: Validates uniqueness when creating/updating users
- **Trust Verification Controller**: Ensures verification phone numbers match user's unique phoneNumber
- **Registration Controller**: Validates uniqueness during early registration

#### Models

**User Model** (`src/models/User.js`)
- `phoneNumber`: Unique, required, trimmed
- Primary identifier for all user operations

**TrustVerification Model** (`src/models/TrustVerification.js`)
- `personalInfo.phoneNumber`: Automatically synced with user's unique phoneNumber via pre-save hook
- Ensures verification requests always reference the correct unique phone number

**ProviderBusinessInfo Model** (`src/models/ProviderBusinessInfo.js`)
- `businessPhone`: Business contact phone (NOT required to be unique)
- Can be the same as owner's personal phoneNumber

**Agency Model** (`src/models/Agency.js`)
- `contact.phone`: Agency contact phone (NOT required to be unique)
- Can be the same as owner's personal phoneNumber

**Job Model** (`src/models/Job.js`)
- `applicationProcess.contactPhone`: Employer contact phone (NOT required to be unique)
- Used for job application contact purposes only

## Verification System

### Phone Verification Flow
1. User provides phone number during registration
2. System validates phone number format and uniqueness
3. Verification code sent to phone number
4. Upon verification, phone number is stored as unique identifier
5. All subsequent operations reference this unique phone number

### Trust Verification
- Verification requests automatically use the user's unique phoneNumber
- Pre-save hook in TrustVerification model ensures `personalInfo.phoneNumber` matches user's unique phoneNumber
- Controllers validate phone ownership before processing verification requests

## Validation Rules

### Format Validation
Phone numbers must follow international format: `+[country code][number]`
- Pattern: `/^\+[1-9]\d{4,14}$/`
- Example: `+1234567890`, `+639171234567`

### Uniqueness Validation
- Checked before user creation
- Checked before user phone number updates
- Enforced at database level via unique index
- Validated in controllers before database operations

## Error Handling

### Common Error Codes
- `PHONE_NUMBER_ALREADY_EXISTS`: Phone number is already registered
- `PHONE_NUMBER_MISMATCH`: Phone number in request doesn't match user's registered phone
- `INVALID_PHONE_FORMAT`: Phone number doesn't match required format
- `MISSING_PHONE_NUMBER`: Phone number is required but not provided

## Best Practices

1. **Always use User's phoneNumber**: When referencing phone numbers in verification or other features, always use the user's unique phoneNumber from the User model
2. **Validate before operations**: Use validation middleware before creating/updating records with phone numbers
3. **Normalize phone numbers**: Trim whitespace and normalize format before comparison
4. **Business phones are different**: Business contact phones (Agency, ProviderBusinessInfo) don't need to be unique - they're just contact information

## Related Documentation
- [Data Models Documentation](./DATA_MODELS.md)
- [Jobs Feature Documentation](./features/jobs.md)
- [User Validation Utilities](../src/utils/validation.js)

