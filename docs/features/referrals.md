# Referrals Feature Documentation

## Overview
The Referrals feature enables users to refer others to the platform and earn rewards for successful referrals.

## Base Path
`/api/referrals`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/validate` | Validate referral code | code |
| POST | `/track` | Track referral click | code, source |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/leaderboard` | Get referral leaderboard | PUBLIC |
| GET | `/me` | Get my referrals | AUTHENTICATED |
| GET | `/stats` | Get referral stats | AUTHENTICATED |
| GET | `/links` | Get referral links | AUTHENTICATED |
| GET | `/rewards` | Get referral rewards | AUTHENTICATED |
| POST | `/invite` | Send referral invitation | AUTHENTICATED |
| PUT | `/preferences` | Update referral preferences | AUTHENTICATED |
| POST | `/process` | Process referral completion | **admin** |
| GET | `/analytics` | Get referral analytics | **admin** |

## Request/Response Examples

### Validate Referral Code
```http
POST /api/referrals/validate
Content-Type: application/json

{
  "code": "REF123456"
}
```

### Send Referral Invitation
```http
POST /api/referrals/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "friend@example.com",
  "message": "Join LocalPro and get rewards!"
}
```

## Referral Flow

1. **Referral Generation**:
   - User generates referral code/link
   - User shares with others
   - Referral tracked

2. **Referral Conversion**:
   - New user signs up with code
   - User completes actions (booking, etc.)
   - Referral marked as successful

3. **Reward Distribution**:
   - Rewards calculated
   - Rewards credited to referrer
   - Rewards tracked

## Related Features
- Authentication (User registration)
- Finance (Reward payments)
- Analytics

