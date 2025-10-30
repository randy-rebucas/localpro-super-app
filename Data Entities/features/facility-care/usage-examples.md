# Facility Care Usage Examples

## List services
```javascript
const qs = new URLSearchParams({ category: 'janitorial', page: 1, limit: 20 });
const res = await fetch(`/api/facility-care?${qs}`);
const { data } = await res.json();
```

## Create contract
```javascript
await fetch('/api/facility-care/contracts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    serviceId,
    facility: {
      name: 'ABC Corporate Office',
      address: { street: '789 Business Blvd', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      size: { area: 5000, unit: 'sqft' },
      type: 'office'
    },
    contractDetails: {
      startDate: '2025-02-01', endDate: '2025-12-31', duration: 11, frequency: 'weekly',
      scope: ['Office cleaning','Restroom maintenance','Trash removal'],
      specialRequirements: ['Eco-friendly products']
    },
    pricing: { basePrice: 500, frequency: 'monthly', totalAmount: 5500, currency: 'USD' },
    payment: { terms: 'net_30', method: 'bank_transfer', autoPay: true }
  })
});
```

## Create subscription
```javascript
await fetch('/api/facility-care/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    service: serviceId,
    contract: contractId,
    subscriptionType: 'janitorial',
    plan: { name: 'Standard Weekly', features: ['3x week'], frequency: 'weekly', price: 500, currency: 'USD' },
    schedule: { startDate: '2025-02-05' },
    payment: { method: 'bank_transfer', autoPay: true },
    preferences: { preferredTime: '08:00', contactMethod: 'email', specialInstructions: 'Front desk check-in' }
  })
});
```

## Update subscription status
```javascript
await fetch(`/api/facility-care/subscriptions/${subscriptionId}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ status: 'paused' })
});
```
