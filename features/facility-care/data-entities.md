# Facility Care Data Entities

## FacilityCareService
- name: string (required)
- description: string (required)
- category: ['janitorial','landscaping','pest_control','maintenance','security']
- provider: ObjectId(User)
- pricing: { type:['hourly','monthly','per_sqft','per_visit','contract'], basePrice:number, currency:'USD' default }
- serviceArea: [string] (zip codes/cities)
- availability: { schedule:[{ day, startTime, endTime, isAvailable }], timezone }
- features: [string]
- requirements: [string]
- images: [string]
- isActive: boolean
- rating: { average (0..5), count }
- timestamps

Indexes: category, provider, serviceArea, isActive

## Contract
- client: ObjectId(User)
- provider: ObjectId(User)
- service: ObjectId(FacilityCareService)
- facility: { name, address{ street, city, state, zipCode, country }, size{ area, unit='sqft' }, type:['office','retail','warehouse','residential','industrial','healthcare','educational'] }
- contractDetails: { startDate, endDate, duration(months), frequency:['daily','weekly','bi-weekly','monthly','quarterly','as_needed'], scope:[string], specialRequirements:[string] }
- pricing: { basePrice, frequency:['monthly','quarterly','annually'], additionalFees[{ description, amount, frequency }], totalAmount, currency }
- payment: { terms:['net_15','net_30','net_60','due_on_receipt'], method, autoPay }
- status: ['draft','pending','active','suspended','completed','terminated']
- performance: { serviceLevel:['standard','premium','custom'], kpis[{ metric, target, actual, unit }] }
- documents: [{ type:['contract','invoice','report','certificate','other'], name, url, uploadedAt }]
- reviews: [{ date, rating(1..5), comment, reviewer:UserId }]
- timestamps

Indexes: client, provider, status, contractDetails.startDate, contractDetails.endDate

## Subscription
- client: ObjectId(User)
- service: ObjectId(FacilityCareService)
- contract: ObjectId(Contract)
- subscriptionType: ['janitorial','landscaping','pest_control','maintenance','comprehensive']
- plan: { name, features:[string], frequency:['weekly','bi-weekly','monthly','quarterly'], price, currency }
- schedule: { startDate, nextService?, lastService?, serviceHistory[{ scheduledDate, actualDate, status:['scheduled','completed','cancelled','rescheduled'], notes, provider:UserId }] }
- status: ['active','paused','cancelled','expired']
- payment: { method, autoPay, lastPayment?, nextPayment?, paymentHistory[{ date, amount, status:['pending','paid','failed'], transactionId }] }
- preferences: { preferredTime, contactMethod, specialInstructions }
- timestamps

Indexes: client, service, status, schedule.nextService
