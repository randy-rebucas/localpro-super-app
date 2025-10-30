## API Endpoints: Referrals

Backed by `src/routes/referrals.js` and `src/controllers/referralController.js`.

Public

- POST /api/referrals/validate
  - Body: { referralCode }
  - Validates an active, non-expired referral code

- POST /api/referrals/track
  - Body: { referralCode, trackingData }
  - Records a click/visit for analytics (UTM, source, etc.)

- GET /api/referrals/leaderboard
  - Query: limit, timeRange
  - Returns top referrers for time window

Protected (auth required)

- GET /api/referrals/me
  - Query: timeRange, page, limit
  - Returns stats, links, and paginated list of user's referrals

- GET /api/referrals/stats
  - Query: timeRange
  - Returns aggregated counts and totals for the user

- GET /api/referrals/links
  - Returns user referral links and share options

- GET /api/referrals/rewards
  - Query: page, limit, status?
  - Returns completed referrals involving the user, with totals and pagination

- POST /api/referrals/invite
  - Body: { emails[]?, phoneNumbers[]?, message?, method: 'email'|'sms' }
  - Sends referral invitations via email or SMS

- PUT /api/referrals/preferences
  - Body: { autoShare?, shareOnSocial?, emailNotifications?, smsNotifications? }
  - Updates user's referral preferences on their `User` record

Admin

- POST /api/referrals/process
  - Body: { referralId, triggerAction }
  - Marks referral completed and processes rewards (internal/system)

- GET /api/referrals/analytics
  - Query: timeRange, groupBy ('day'|'month')
  - Returns trends, referral types, conversion rate, summary

Notes

- Controller integrates `ReferralService` and `EmailService`; SMS sending is a stub for future Twilio integration.
- Sensitive data exposure is limited; responses focus on referral details and aggregates.


