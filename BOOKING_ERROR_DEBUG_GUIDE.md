# 🔍 Booking Creation Error - Debug Guide

## Error Context
```
{
  "serviceId": "6925524813fca6eaba97fe64",
  "providerId": "691c5e67d2d77a123ad8bfeb",
  "formData": {
    "bookingDate": "2025-12-28",
    "bookingTime": "02:51",
    "duration": 1,
    "paymentMethod": "paypal"
  },
  "errorMessage": "Failed to create booking"
}
```

## ✅ Fixes Applied

### 1. **Improved Date Parsing**
- Fixed timezone issues with date/time combination
- Added proper time format validation (HH:MM)
- Added 5-minute buffer for clock synchronization
- Better error messages for invalid date formats

### 2. **Enhanced Error Handling**
- More specific error messages for different failure scenarios
- Better logging with full error context
- Validation error handling for Mongoose
- Transaction error handling

### 3. **Service Validation**
- Added pricing validation
- Better provider matching validation
- Enhanced logging for service lookup failures

## 🔍 Debugging Steps

### Step 1: Check Server Logs
Look for the detailed error log that should now include:
```javascript
{
  serviceId: "6925524813fca6eaba97fe64",
  providerId: "691c5e67d2d77a123ad8bfeb",
  formData: {...},
  errorMessage: "...",
  errorName: "...",
  errorStack: "...",
  errorCode: "...",
  userId: "..."
}
```

### Step 2: Verify Service Exists
```bash
# Check if service exists in database
db.services.findOne({ _id: ObjectId("6925524813fca6eaba97fe64") })
```

**Check:**
- ✅ Service exists
- ✅ `isActive: true`
- ✅ `provider` matches `691c5e67d2d77a123ad8bfeb`
- ✅ `pricing.basePrice` exists and is a number

### Step 3: Verify Date/Time Format
The booking date/time should be:
- **Date:** `2025-12-28` (YYYY-MM-DD format) ✅
- **Time:** `02:51` (HH:MM format) ✅
- **Combined:** `2025-12-28T02:51:00` (will be created automatically)

**Potential Issues:**
- ⚠️ If server timezone is different, the date might be parsed incorrectly
- ⚠️ If the date is in the past (relative to server time), validation will fail

### Step 4: Check for Conflicting Bookings
```javascript
// Check if there's a conflicting booking
db.bookings.findOne({
  service: ObjectId("6925524813fca6eaba97fe64"),
  bookingDate: {
    $gte: ISODate("2025-12-28T01:51:00Z"), // 1 hour before
    $lte: ISODate("2025-12-28T03:51:00Z")  // 1 hour after (duration = 1)
  },
  status: { $in: ["pending", "confirmed", "in_progress"] }
})
```

### Step 5: Verify User Authentication
- ✅ User is authenticated (`req.user.id` exists)
- ✅ User has permission to create bookings

### Step 6: Check Database Connection
- ✅ MongoDB connection is active
- ✅ Transaction support is enabled (for replica sets)

## 🐛 Common Issues & Solutions

### Issue 1: "Service not found"
**Cause:** Service ID doesn't exist or is invalid
**Solution:**
- Verify service ID is correct
- Check if service was deleted
- Ensure ObjectId format is valid

### Issue 2: "Service is not available"
**Cause:** Service `isActive` is `false`
**Solution:**
```javascript
// Activate the service
db.services.updateOne(
  { _id: ObjectId("6925524813fca6eaba97fe64") },
  { $set: { isActive: true } }
)
```

### Issue 3: "Service provider does not match"
**Cause:** `providerId` in request doesn't match service's provider
**Solution:**
- Remove `providerId` from request (it will use service's provider automatically)
- Or ensure `providerId` matches the service's provider

### Issue 4: "Booking date must be at least 5 minutes in the future"
**Cause:** Date/time is in the past or too close to current time
**Solution:**
- Ensure booking date is in the future
- Account for timezone differences
- Add buffer time (at least 5 minutes)

### Issue 5: "Service already booked for this time slot"
**Cause:** Another booking exists for the same time
**Solution:**
- Check existing bookings
- Choose a different time slot
- Cancel conflicting booking if needed

### Issue 6: "Service pricing information is missing"
**Cause:** Service doesn't have `pricing.basePrice`
**Solution:**
```javascript
// Add pricing to service
db.services.updateOne(
  { _id: ObjectId("6925524813fca6eaba97fe64") },
  { 
    $set: { 
      "pricing.basePrice": 50,
      "pricing.currency": "USD",
      "pricing.type": "hourly"
    } 
  }
)
```

### Issue 7: Mongoose Validation Error
**Cause:** Booking data doesn't match schema requirements
**Solution:**
- Check all required fields are present
- Verify data types match schema
- Check enum values are valid

### Issue 8: Transaction Error
**Cause:** Database transaction failed
**Solution:**
- Check MongoDB replica set configuration
- Verify database connection
- Check for concurrent modifications

## 📊 Testing the Fix

### Test Case 1: Valid Booking
```bash
curl -X POST http://localhost:4000/api/marketplace/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "6925524813fca6eaba97fe64",
    "formData": {
      "bookingDate": "2025-12-28",
      "bookingTime": "14:00",
      "duration": 2,
      "paymentMethod": "paypal"
    }
  }'
```

### Test Case 2: Invalid Date
```bash
curl -X POST http://localhost:4000/api/marketplace/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "6925524813fca6eaba97fe64",
    "formData": {
      "bookingDate": "2020-01-01",
      "bookingTime": "10:00",
      "duration": 1,
      "paymentMethod": "paypal"
    }
  }'
```
**Expected:** Error: "Booking date must be at least 5 minutes in the future"

### Test Case 3: Missing Service
```bash
curl -X POST http://localhost:4000/api/marketplace/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "000000000000000000000000",
    "formData": {
      "bookingDate": "2025-12-28",
      "bookingTime": "14:00",
      "duration": 1,
      "paymentMethod": "paypal"
    }
  }'
```
**Expected:** Error: "Service not found"

## 🔧 Quick Fixes

### Fix 1: Check Service Status
```javascript
// In MongoDB shell or via API
GET /api/marketplace/services/6925524813fca6eaba97fe64
```

### Fix 2: Verify Date Format
Ensure the date is in the future relative to server time:
```javascript
// Current server time
new Date()

// Booking time should be after this
new Date("2025-12-28T02:51:00")
```

### Fix 3: Check Provider Match
```javascript
// Get service and check provider
const service = await Service.findById("6925524813fca6eaba97fe64");
console.log("Service Provider:", service.provider.toString());
console.log("Request Provider:", "691c5e67d2d77a123ad8bfeb");
```

## 📝 Next Steps

1. **Check Server Logs** - Look for the enhanced error messages
2. **Verify Service** - Ensure service exists and is active
3. **Test Date Parsing** - Verify date/time is parsed correctly
4. **Check Conflicts** - Look for conflicting bookings
5. **Review Error Response** - The error response should now be more specific

## 🆘 Still Having Issues?

If the error persists after these fixes:

1. **Enable Debug Logging:**
   ```env
   LOG_LEVEL=debug
   ```

2. **Check Full Error Stack:**
   - Look in server logs for the complete error stack trace
   - Check for any database connection issues
   - Verify transaction support

3. **Test with Minimal Data:**
   ```json
   {
     "serviceId": "6925524813fca6eaba97fe64",
     "formData": {
       "bookingDate": "2025-12-28",
       "bookingTime": "14:00",
       "duration": 1
     }
   }
   ```

4. **Check Database Indexes:**
   ```javascript
   // Ensure indexes exist
   db.bookings.getIndexes()
   db.services.getIndexes()
   ```

---

**Updated:** December 23, 2025  
**Status:** Enhanced error handling and validation applied

