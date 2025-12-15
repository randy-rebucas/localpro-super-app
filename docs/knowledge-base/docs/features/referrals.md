# Referrals Feature

## Overview

The Referrals feature provides a comprehensive referral program that rewards users for referring new users to the platform.

## Key Features

- **Referral Codes** - Unique referral codes for users
- **Referral Tracking** - Track referrals and signups
- **Rewards System** - Reward points/credits for referrals
- **Referral Statistics** - Track referral performance
- **Referral History** - Complete referral log

## API Endpoints

### Get Referral Code

```
GET /api/referrals/code
```

### Get Referral Stats

```
GET /api/referrals/stats
```

### Get Referral History

```
GET /api/referrals/history
Query Parameters:
  - page?: number
  - limit?: number
```

## Referral Flow

```
1. User gets referral code
2. User shares code with friends
3. Friend signs up using code
4. Friend completes first action
5. Both users receive rewards
```

## Rewards

Rewards can be:
- Platform credits
- Discount vouchers
- Cash rewards
- Subscription benefits

## Related Features

- [User Management](../api/endpoints.md#users) - User accounts
- [Finance](./payments.md) - Reward processing

