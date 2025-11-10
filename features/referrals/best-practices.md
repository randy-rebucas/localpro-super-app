## Best Practices: Referrals

- Security and Abuse Prevention
  - Rate-limit validate/track endpoints; throttle invitations
  - Verify user ownership before processing completions/rewards
  - Prevent self-referrals and circular referral chains
  - Sanitize UTM/tracking inputs

- Data Integrity
  - Use `findActiveByCode` to ensure pending and non-expired
  - Drive status transitions via controller/service; keep `completedAt/rewardedAt` consistent
  - For percentage rewards, respect `maxAmount`

- Analytics
  - Increment `analytics.clickCount` on track; compute `conversionRate` on completion
  - Use indexes for reporting (status, timelines, referralType)

- User Experience
  - Provide shareable links (web/app) and prefilled messages
  - Expose clear stats (completed, pending, rewards total)

- Operations
  - Separate processing step for rewards to allow reconciliation
  - Support admin analytics: trends by day/month, types breakdown, conversion rate


