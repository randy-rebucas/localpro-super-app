# Referral System Documentation

## Overview

The Referral System is a comprehensive reward-based referral platform integrated into the LocalPro Super App. It allows users to refer others and earn rewards for successful referrals across all platform features including service bookings, purchases, course enrollments, and more.

## Features

### For Referrers
- **Referral Code Generation**: Unique referral codes for each user
- **Multiple Sharing Options**: Email, SMS, social media, direct links, QR codes
- **Reward Tracking**: Real-time tracking of referral rewards and earnings
- **Analytics Dashboard**: Comprehensive statistics and performance metrics
- **Tier System**: Bronze, Silver, Gold, and Platinum referral tiers
- **Leaderboard**: Compete with other users for top referrer status

### For Referees
- **Welcome Bonuses**: Automatic rewards for new users
- **First-Action Rewards**: Additional rewards for completing first actions
- **Discount Codes**: Special discounts for referred users
- **Subscription Extensions**: Free subscription days for premium features

### For Administrators
- **Analytics Dashboard**: Platform-wide referral performance metrics
- **Reward Management**: Configure and manage reward structures
- **Fraud Prevention**: Built-in validation and verification systems
- **Campaign Management**: Track referral campaigns and performance

## API Endpoints

### Public Endpoints

#### Validate Referral Code
```
POST /api/referrals/validate
```
**Request Body:**
```json
{
  "referralCode": "AB123456"
}
```

#### Track Referral Click
```
POST /api/referrals/track
```
**Request Body:**
```json
{
  "referralCode": "AB123456",
  "trackingData": {
    "source": "email",
    "campaign": "summer2024",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### Get Referral Leaderboard
```
GET /api/referrals/leaderboard?limit=10&timeRange=30
```

### Protected Endpoints (Authentication Required)

#### Get My Referrals
```
GET /api/referrals/me?timeRange=30&page=1&limit=10
```

#### Get Referral Statistics
```
GET /api/referrals/stats?timeRange=30
```

#### Get Referral Links
```
GET /api/referrals/links
```

#### Get Referral Rewards History
```
GET /api/referrals/rewards?page=1&limit=10&status=processed
```

#### Send Referral Invitations
```
POST /api/referrals/invite
```
**Request Body:**
```json
{
  "emails": ["friend1@example.com", "friend2@example.com"],
  "phoneNumbers": ["+1234567890"],
  "message": "Join me on LocalPro!",
  "method": "email"
}
```

#### Update Referral Preferences
```
PUT /api/referrals/preferences
```
**Request Body:**
```json
{
  "autoShare": true,
  "shareOnSocial": false,
  "emailNotifications": true,
  "smsNotifications": false
}
```

### Admin Endpoints

#### Process Referral Completion
```
POST /api/referrals/process
```
**Request Body:**
```json
{
  "referralId": "64a1b2c3d4e5f6789abcdef0",
  "triggerAction": {
    "type": "booking",
    "referenceId": "64a1b2c3d4e5f6789abcdef1",
    "referenceType": "Service",
    "amount": 150.00,
    "currency": "USD",
    "completedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Referral Analytics
```
GET /api/referrals/analytics?timeRange=30&groupBy=day
```

## Data Models

### Referral Schema

```javascript
{
  referrer: ObjectId,              // User who made the referral
  referee: ObjectId,               // User who was referred
  referralCode: String,            // Unique referral code
  status: String,                  // pending, completed, expired, cancelled
  referralType: String,            // Type of referral action
  triggerAction: {                 // Action that triggered completion
    type: String,                  // booking, purchase, enrollment, etc.
    referenceId: ObjectId,         // ID of the triggering action
    referenceType: String,         // Type of the reference
    amount: Number,                // Amount involved
    currency: String,              // Currency code
    completedAt: Date              // When action was completed
  },
  reward: {                        // Reward configuration
    type: String,                  // credit, discount, cash, points, subscription_days
    amount: Number,                // Reward amount
    currency: String,              // Currency
    description: String,           // Reward description
    isPercentage: Boolean,         // Whether amount is percentage
    maxAmount: Number,             // Maximum reward for percentage
    subscriptionDays: Number,      // Days for subscription rewards
    discountCode: String,          // Generated discount code
    discountType: String           // percentage or fixed_amount
  },
  tracking: {                      // Tracking information
    source: String,                // How referral was shared
    campaign: String,              // Campaign identifier
    medium: String,                // Medium (facebook, twitter, etc.)
    utmSource: String,             // UTM source
    utmMedium: String,             // UTM medium
    utmCampaign: String,           // UTM campaign
    ipAddress: String,             // IP address
    userAgent: String,             // User agent
    referrerUrl: String            // Referring URL
  },
  timeline: {                      // Timeline tracking
    referredAt: Date,              // When referral was made
    signupAt: Date,                // When referee signed up
    firstActionAt: Date,           // When first action was taken
    completedAt: Date,             // When referral was completed
    rewardedAt: Date,              // When rewards were processed
    expiresAt: Date                // When referral expires
  },
  rewardDistribution: {            // Reward distribution
    referrerReward: {              // Reward for referrer
      amount: Number,
      currency: String,
      type: String,
      status: String,              // pending, processed, paid, failed
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    },
    refereeReward: {               // Reward for referee
      amount: Number,
      currency: String,
      type: String,
      status: String,
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    }
  },
  analytics: {                     // Analytics data
    clickCount: Number,            // Number of clicks
    conversionRate: Number,        // Conversion rate
    totalValue: Number,            // Total value generated
    lifetimeValue: Number          // Lifetime value
  }
}
```

### User Referral Fields

```javascript
{
  referral: {
    referralCode: String,          // User's unique referral code
    referredBy: ObjectId,          // Who referred this user
    referralSource: String,        // How user was referred
    referralStats: {
      totalReferrals: Number,      // Total referrals made
      successfulReferrals: Number, // Successful referrals
      totalRewardsEarned: Number,  // Total rewards earned
      totalRewardsPaid: Number,    // Total rewards paid out
      lastReferralAt: Date,        // Last referral date
      referralTier: String         // bronze, silver, gold, platinum
    },
    referralPreferences: {
      autoShare: Boolean,          // Auto-share on actions
      shareOnSocial: Boolean,      // Share on social media
      emailNotifications: Boolean, // Email notifications
      smsNotifications: Boolean    // SMS notifications
    }
  }
}
```

## Reward Types and Configurations

### Signup Rewards
- **Referrer**: $10 credit
- **Referee**: $5 credit

### Service Booking Rewards
- **Referrer**: 10% of booking amount (max $50)
- **Referee**: 15% discount on first booking

### Supplies Purchase Rewards
- **Referrer**: 5% of purchase amount (max $25)
- **Referee**: 10% discount on first purchase

### Course Enrollment Rewards
- **Referrer**: $20 credit
- **Referee**: 20% discount on course enrollment

### Loan Application Rewards
- **Referrer**: $25 credit
- **Referee**: $15 credit

### Rental Booking Rewards
- **Referrer**: 8% of rental amount (max $30)
- **Referee**: 12% discount on first rental

### Subscription Upgrade Rewards
- **Referrer**: 30 days free subscription
- **Referee**: 15 days free subscription

## Referral Tiers

### Bronze Tier (0-4 successful referrals)
- Standard reward rates
- Basic analytics
- Email support

### Silver Tier (5-19 successful referrals)
- 10% bonus on all rewards
- Advanced analytics
- Priority email support
- Custom referral links

### Gold Tier (20-49 successful referrals)
- 20% bonus on all rewards
- Premium analytics dashboard
- Phone support
- Exclusive referral campaigns
- Early access to new features

### Platinum Tier (50+ successful referrals)
- 30% bonus on all rewards
- VIP analytics dashboard
- Dedicated account manager
- Custom reward structures
- Platform partnership opportunities

## Integration Points

### Automatic Referral Processing

The referral system automatically processes referrals when users complete specific actions:

#### Service Bookings
```javascript
// In marketplaceController.js - createBooking function
if (booking.client.referral.referredBy) {
  await ReferralService.processReferralCompletion(
    referralId,
    {
      type: 'booking',
      referenceId: booking._id,
      referenceType: 'Booking',
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      completedAt: new Date()
    }
  );
}
```

#### Supplies Orders
```javascript
// In suppliesController.js - createOrder function
if (order.user.referral.referredBy) {
  await ReferralService.processReferralCompletion(
    referralId,
    {
      type: 'purchase',
      referenceId: order._id,
      referenceType: 'Order',
      amount: order.totalAmount,
      currency: order.currency,
      completedAt: new Date()
    }
  );
}
```

#### Course Enrollments
```javascript
// In academyController.js - enrollInCourse function
if (enrollment.user.referral.referredBy) {
  await ReferralService.processReferralCompletion(
    referralId,
    {
      type: 'enrollment',
      referenceId: enrollment._id,
      referenceType: 'Enrollment',
      amount: course.price,
      currency: course.currency,
      completedAt: new Date()
    }
  );
}
```

## Email Notifications

### Referral Invitation Email
- Personalized invitation from referrer
- Platform benefits and features
- Special bonus information
- Direct signup link

### Reward Notification Email
- Reward amount and type
- How to use the reward
- Referral statistics
- Encouragement to refer more

## Security and Fraud Prevention

### Validation Mechanisms
- **Unique Referral Codes**: Each user gets a unique code
- **Expiration Dates**: Referrals expire after 90 days
- **One-Time Use**: Each referral can only be used once
- **IP Tracking**: Track referral sources and patterns
- **User Verification**: Verify referrer and referee identities

### Anti-Fraud Measures
- **Duplicate Detection**: Prevent self-referrals and duplicate accounts
- **Rate Limiting**: Limit referral creation frequency
- **Manual Review**: Flag suspicious referral patterns
- **Audit Trail**: Complete tracking of all referral activities

## Analytics and Reporting

### User Analytics
- Total referrals made
- Successful referrals
- Conversion rates
- Reward earnings
- Referral tier status

### Platform Analytics
- Overall referral performance
- Top referrers
- Most effective referral types
- Geographic distribution
- Time-based trends

### Campaign Analytics
- Campaign performance
- Source effectiveness
- ROI tracking
- User acquisition costs

## Best Practices

### For Users
1. **Share Authentically**: Only refer people who would genuinely benefit
2. **Use Multiple Channels**: Share via email, social media, and direct links
3. **Personalize Messages**: Add personal touches to referral invitations
4. **Follow Up**: Check on referred users and offer help
5. **Track Performance**: Monitor your referral statistics regularly

### For Administrators
1. **Monitor Performance**: Regularly review referral analytics
2. **Adjust Rewards**: Optimize reward structures based on performance
3. **Prevent Fraud**: Implement and monitor fraud prevention measures
4. **Engage Top Referrers**: Recognize and reward top performers
5. **A/B Test Campaigns**: Test different referral strategies

## Future Enhancements

### Planned Features
- **Social Media Integration**: Direct sharing to social platforms
- **Gamification**: Points, badges, and achievements
- **Referral Contests**: Time-limited competitions
- **Custom Landing Pages**: Personalized referral pages
- **Advanced Analytics**: Machine learning insights
- **Mobile App Integration**: Native mobile sharing
- **API for Partners**: Third-party integration capabilities

### Integration Opportunities
- **CRM Systems**: Customer relationship management
- **Marketing Automation**: Automated referral campaigns
- **Social Media APIs**: Enhanced social sharing
- **Analytics Platforms**: Advanced reporting integration
- **Payment Processors**: Automated reward distribution

## Getting Started

### For Developers

1. **Environment Setup**: Ensure referral system is enabled
2. **Database Migration**: Run migrations to create referral collections
3. **Integration**: Add referral processing to existing controllers
4. **Testing**: Test referral flows and reward distribution
5. **Monitoring**: Set up analytics and monitoring

### For Users

1. **Generate Code**: Get your unique referral code
2. **Share Links**: Use provided sharing options
3. **Track Progress**: Monitor your referral dashboard
4. **Earn Rewards**: Receive rewards for successful referrals
5. **Level Up**: Progress through referral tiers

### For Administrators

1. **Configure Rewards**: Set up reward structures
2. **Monitor Performance**: Use analytics dashboard
3. **Manage Campaigns**: Create and track campaigns
4. **Prevent Fraud**: Implement security measures
5. **Optimize Results**: Adjust based on performance data

## Support and Documentation

For additional support and documentation:
- API Documentation: Available at `/api` endpoint
- Email Support: Contact support team for assistance
- Community Forum: Join the LocalPro community for tips
- Video Tutorials: Available in the academy module

## Version History

- **v1.0.0** - Initial release with basic referral functionality
- **v1.1.0** - Added tier system and advanced analytics
- **v1.2.0** - Integrated email notifications and fraud prevention
- **v1.3.0** - Added leaderboard and social sharing features
- **v1.4.0** - Enhanced mobile integration and API improvements

---

*This documentation is maintained by the LocalPro development team. For updates and changes, please refer to the latest version.*
