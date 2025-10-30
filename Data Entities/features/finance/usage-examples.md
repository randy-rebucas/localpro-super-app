# Finance Usage Examples

## Request withdrawal
```javascript
await fetch('/api/finance/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ amount: 250, paymentMethod: 'bank_transfer', accountDetails: { bankName: 'ABC', accountNumber: '****1234' } })
});
```

## Add expense
```javascript
await fetch('/api/finance/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ amount: 45.5, category: 'supplies', description: 'Cleaning cloths' })
});
```

## Apply for loan (shape)
```javascript
await fetch('/api/finance/loans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    type: 'micro_loan',
    amount: { requested: 1500, currency: 'USD' },
    purpose: 'Purchase equipment',
    term: { duration: 12, interestRate: 12, repaymentFrequency: 'monthly' },
    application: { documents: [{ type: 'bank_statement', url: 'https://...' }] }
  })
});
```
