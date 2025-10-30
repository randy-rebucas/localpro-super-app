# App Settings Data Entities

## AppSettings

### general
- appName, appVersion, environment['development','staging','production']
- maintenanceMode { enabled, message, estimatedEndTime }
- forceUpdate { enabled, minVersion, message }

### business
- companyName, companyEmail, companyPhone
- companyAddress { street, city, state, zipCode, country }
- businessHours { timezone, schedule[{ day, startTime, endTime, isOpen }] }
- supportChannels { email{enabled,address}, phone{enabled,number}, chat{enabled,hours{start,end}} }

### features
- marketplace { enabled, allowNewProviders, requireVerification }
- academy { enabled, allowNewCourses, requireInstructorVerification }
- jobBoard { enabled, allowNewJobs, requireCompanyVerification }
- referrals { enabled, rewardAmount, maxReferralsPerUser }
- payments { paypal.enabled, paymaya.enabled, gcash.enabled, bankTransfer.enabled }
- analytics { enabled, trackUserBehavior, trackPerformance }

### security
- passwordPolicy { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxLoginAttempts, lockoutDuration(min) }
- sessionSettings { maxSessionDuration(h), allowMultipleSessions, maxConcurrentSessions }
- dataProtection { encryptSensitiveData, dataRetentionPeriod(days), allowDataExport, allowDataDeletion }

### uploads
- maxFileSize(bytes), allowedImageTypes[], allowedDocumentTypes[]
- maxImagesPerUpload
- imageCompression { enabled, quality }

### notifications
- email { enabled, provider['nodemailer','sendgrid','mailgun','ses'], fromEmail, fromName }
- sms { enabled, provider['twilio','vonage','aws_sns'], fromNumber }
- push { enabled, provider['firebase','onesignal','pusher'] }

### payments
- defaultCurrency['PHP','USD','EUR','GBP','JPY','KRW','CNY']
- supportedCurrencies[]
- transactionFees { percentage, fixed }
- minimumPayout
- payoutSchedule { frequency['daily','weekly','monthly'], dayOfWeek(0-6), dayOfMonth(1-31) }

### analytics
- googleAnalytics { enabled, trackingId }
- mixpanel { enabled, projectToken }
- customAnalytics { enabled, retentionPeriod(days) }

### integrations
- googleMaps { enabled, apiKey, defaultZoom }
- cloudinary { enabled, cloudName, apiKey, apiSecret }
- socialLogin { google{enabled,clientId}, facebook{enabled,appId} }

### Indexes
- {'general.environment': 1}

### Methods
- getSetting(path: dotted)
- setSetting(path: dotted, value)
- updateSettings(updatesObject)

### Statics
- getCurrentSettings(): ensures singleton document
- updateAppSettings(updates)
