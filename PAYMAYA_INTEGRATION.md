# PayMaya Integration Documentation

## Overview

This document provides comprehensive information about the PayMaya payment integration in the LocalPro Super App. PayMaya (now Maya) is a leading digital payment platform in the Philippines, offering secure and convenient payment solutions for businesses and consumers.

## Table of Contents

1. [Features](#features)
2. [Setup and Configuration](#setup-and-configuration)
3. [API Endpoints](#api-endpoints)
4. [Integration Methods](#integration-methods)
5. [Webhook Handling](#webhook-handling)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

## Features

### Supported Payment Methods
- **Checkout API**: Redirect customers to PayMaya-hosted payment page
- **Payment Vault API**: Tokenized payments and card vaulting
- **Invoice API**: Generate payment links for one-time payments

### Key Capabilities
- Secure payment processing with PCI-DSS compliance
- Support for PHP currency (primary currency for Philippines)
- Webhook notifications for payment status updates
- Multiple payment methods (cards, e-wallets, bank transfers)
- 3D Secure authentication support
- Real-time payment status tracking

## Setup and Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# PayMaya Configuration
PAYMAYA_PUBLIC_KEY=your-paymaya-public-key
PAYMAYA_SECRET_KEY=your-paymaya-secret-key
PAYMAYA_MODE=sandbox
PAYMAYA_WEBHOOK_SECRET=your-paymaya-webhook-secret
```

### 2. PayMaya Account Setup

1. **Register for PayMaya Business Account**
   - Visit [Maya Business Manager](https://business.maya.ph/)
   - Complete the registration process
   - Verify your business information

2. **Get API Credentials**
   - Navigate to the API section in your dashboard
   - Generate your public and secret keys
   - Configure webhook endpoints

3. **Configure Webhooks**
   - Set webhook URL: `https://yourdomain.com/api/paymaya/webhook`
   - Select events: `CHECKOUT_SUCCESS`, `CHECKOUT_FAILURE`, `PAYMENT_SUCCESS`, `PAYMENT_FAILURE`, `INVOICE_PAID`, `INVOICE_EXPIRED`

## API Endpoints

### Checkout API

#### Create Checkout Session
```http
POST /api/paymaya/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalAmount": 1000.00,
  "currency": "PHP",
  "description": "Service payment",
  "referenceId": "ORDER-12345",
  "buyer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+639171234567"
  },
  "items": [
    {
      "name": "Cleaning Service",
      "code": "CLEAN-001",
      "description": "House cleaning service",
      "quantity": 1,
      "totalAmount": {
        "amount": "1000.00",
        "currency": "PHP"
      }
    }
  ],
  "redirectUrl": {
    "success": "https://yourdomain.com/payment/success",
    "failure": "https://yourdomain.com/payment/failure",
    "cancel": "https://yourdomain.com/payment/cancel"
  }
}
```

#### Get Checkout Details
```http
GET /api/paymaya/checkout/{checkoutId}
Authorization: Bearer <token>
```

### Payment Vault API

#### Create Payment
```http
POST /api/paymaya/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "vaultId": "vault-12345",
  "amount": 1000.00,
  "currency": "PHP",
  "referenceId": "PAYMENT-12345",
  "buyer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "description": "Subscription payment"
}
```

#### Get Payment Details
```http
GET /api/paymaya/payment/{paymentId}
Authorization: Bearer <token>
```

### Invoice API

#### Create Invoice
```http
POST /api/paymaya/invoice
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000.00,
  "currency": "PHP",
  "description": "Service invoice",
  "referenceId": "INVOICE-12345",
  "buyer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "redirectUrl": {
    "success": "https://yourdomain.com/payment/success",
    "failure": "https://yourdomain.com/payment/failure",
    "cancel": "https://yourdomain.com/payment/cancel"
  }
}
```

#### Get Invoice Details
```http
GET /api/paymaya/invoice/{invoiceId}
Authorization: Bearer <token>
```

### Webhook Endpoint

```http
POST /api/paymaya/webhook
Content-Type: application/json

{
  "eventType": "CHECKOUT_SUCCESS",
  "data": {
    "checkoutId": "checkout-12345",
    "requestReferenceNumber": "ORDER-12345",
    "status": "SUCCESS"
  }
}
```

### Admin Endpoints

#### Validate Configuration
```http
GET /api/paymaya/config/validate
Authorization: Bearer <admin-token>
```

#### Get Webhook Events
```http
GET /api/paymaya/webhook/events
Authorization: Bearer <admin-token>
```

## Integration Methods

### 1. Checkout Flow (Recommended for E-commerce)

```javascript
// Frontend integration example
const createPayMayaCheckout = async (orderData) => {
  try {
    const response = await fetch('/api/paymaya/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        totalAmount: orderData.total,
        currency: 'PHP',
        description: orderData.description,
        referenceId: orderData.id,
        buyer: {
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          email: orderData.customer.email,
          phone: orderData.customer.phone
        },
        items: orderData.items,
        redirectUrl: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          cancel: `${window.location.origin}/payment/cancel`
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Redirect to PayMaya checkout page
      window.location.href = result.data.checkoutUrl;
    } else {
      console.error('Checkout creation failed:', result.error);
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
  }
};
```

### 2. Payment Vault Flow (For Tokenized Payments)

```javascript
// For recurring payments or saved cards
const createPayMayaPayment = async (vaultId, amount, referenceId) => {
  try {
    const response = await fetch('/api/paymaya/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        vaultId: vaultId,
        amount: amount,
        currency: 'PHP',
        referenceId: referenceId,
        buyer: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};
```

### 3. Invoice Flow (For Payment Links)

```javascript
// Generate payment link for customers
const createPayMayaInvoice = async (invoiceData) => {
  try {
    const response = await fetch('/api/paymaya/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        amount: invoiceData.amount,
        currency: 'PHP',
        description: invoiceData.description,
        referenceId: invoiceData.id,
        buyer: invoiceData.customer,
        redirectUrl: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          cancel: `${window.location.origin}/payment/cancel`
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Send invoice link to customer via email/SMS
      return result.data.invoiceUrl;
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
  }
};
```

## Webhook Handling

### Supported Webhook Events

| Event Type | Description | Action |
|------------|-------------|---------|
| `CHECKOUT_SUCCESS` | Checkout completed successfully | Update order status to completed |
| `CHECKOUT_FAILURE` | Checkout failed | Update order status to failed |
| `PAYMENT_SUCCESS` | Payment processed successfully | Update payment status to completed |
| `PAYMENT_FAILURE` | Payment failed | Update payment status to failed |
| `INVOICE_PAID` | Invoice paid | Update invoice status to paid |
| `INVOICE_EXPIRED` | Invoice expired | Update invoice status to expired |

### Webhook Processing

The webhook handler automatically:
1. Verifies the webhook signature for security
2. Processes the event based on type
3. Updates the corresponding database records
4. Logs the event for audit purposes

### Webhook Security

```javascript
// Webhook signature verification
const verifyWebhookSignature = (headers, body, secret) => {
  const signature = headers['x-paymaya-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
};
```

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_AMOUNT` | Amount is invalid or below minimum | Ensure amount is greater than 0.01 |
| `INVALID_CURRENCY` | Currency not supported | Use 'PHP' as currency |
| `MISSING_BUYER_INFO` | Required buyer information missing | Provide firstName, lastName, and email |
| `INVALID_REFERENCE` | Reference ID already exists | Use unique reference IDs |
| `PAYMENT_FAILED` | Payment processing failed | Check payment method and retry |

### Error Response Format

```json
{
  "success": false,
  "message": "Payment creation failed",
  "error": "INVALID_AMOUNT",
  "details": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be greater than 0.01 PHP"
  }
}
```

## Testing

### Sandbox Environment

1. **Set Environment**: `PAYMAYA_MODE=sandbox`
2. **Use Test Credentials**: Get sandbox keys from PayMaya dashboard
3. **Test Cards**: Use PayMaya test card numbers
4. **Test Webhooks**: Use ngrok or similar tool for local testing

### Test Card Numbers

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4123456789012345 | 123 | 12/25 |
| Mastercard | 5123456789012345 | 123 | 12/25 |
| JCB | 3528000000000007 | 123 | 12/25 |

### Testing Checklist

- [ ] Create checkout session
- [ ] Process successful payment
- [ ] Handle payment failure
- [ ] Test webhook notifications
- [ ] Verify signature validation
- [ ] Test invoice creation
- [ ] Validate error handling

## Security

### Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS Only**: Use HTTPS for all API communications
4. **Input Validation**: Validate all input data
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Logging**: Log all payment activities for audit

### PCI Compliance

PayMaya is PCI-DSS certified, which means:
- Card data is handled securely
- No sensitive data is stored on your servers
- All transactions are encrypted
- Regular security audits are performed

## Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events
**Symptoms**: Webhooks not being called
**Solutions**:
- Check webhook URL is accessible
- Verify webhook secret configuration
- Check PayMaya dashboard for webhook status
- Test webhook endpoint manually

#### 2. Payment Failures
**Symptoms**: Payments failing consistently
**Solutions**:
- Verify API credentials
- Check amount format (must be string with 2 decimal places)
- Ensure currency is 'PHP'
- Check buyer information completeness

#### 3. Signature Verification Failures
**Symptoms**: Webhook signature verification failing
**Solutions**:
- Verify webhook secret matches PayMaya dashboard
- Check request body format
- Ensure proper encoding of request body

#### 4. Checkout Redirect Issues
**Symptoms**: Checkout page not loading
**Solutions**:
- Verify checkout URL format
- Check redirect URLs are accessible
- Ensure proper HTTPS configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs for:
- API requests and responses
- Webhook processing
- Error details
- Signature verification

### Support

For additional support:
1. Check PayMaya documentation: [developers.maya.ph](https://developers.maya.ph)
2. Contact PayMaya support through your business dashboard
3. Review API logs for detailed error information
4. Test with sandbox environment first

## Integration Examples

### Marketplace Service Payment

```javascript
// Example: Pay for a marketplace service
const payForService = async (bookingId, serviceData) => {
  const checkoutData = {
    totalAmount: serviceData.totalAmount,
    currency: 'PHP',
    description: `Payment for ${serviceData.serviceName}`,
    referenceId: `BOOKING-${bookingId}`,
    buyer: {
      firstName: serviceData.customer.firstName,
      lastName: serviceData.customer.lastName,
      email: serviceData.customer.email,
      phone: serviceData.customer.phone
    },
    items: [{
      name: serviceData.serviceName,
      code: serviceData.serviceId,
      description: serviceData.description,
      quantity: 1,
      totalAmount: {
        amount: serviceData.totalAmount.toFixed(2),
        currency: 'PHP'
      }
    }],
    redirectUrl: {
      success: `${process.env.FRONTEND_URL}/booking/${bookingId}/success`,
      failure: `${process.env.FRONTEND_URL}/booking/${bookingId}/failed`,
      cancel: `${process.env.FRONTEND_URL}/booking/${bookingId}/cancelled`
    }
  };

  return await PayMayaService.createCheckout(checkoutData);
};
```

### Subscription Payment

```javascript
// Example: Pay for LocalPro Plus subscription
const payForSubscription = async (subscriptionId, userData) => {
  const paymentData = {
    vaultId: userData.paymayaVaultId, // If user has saved payment method
    amount: subscriptionData.monthlyPrice,
    currency: 'PHP',
    referenceId: `SUBSCRIPTION-${subscriptionId}`,
    buyer: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    },
    description: `LocalPro Plus subscription - ${subscriptionData.planName}`
  };

  return await PayMayaService.createPayment(paymentData);
};
```

### Supplies Order Payment

```javascript
// Example: Pay for supplies order
const payForSupplies = async (orderId, orderData) => {
  const invoiceData = {
    amount: orderData.totalAmount,
    currency: 'PHP',
    description: `Supplies order #${orderId}`,
    referenceId: `ORDER-${orderId}`,
    buyer: {
      firstName: orderData.customer.firstName,
      lastName: orderData.customer.lastName,
      email: orderData.customer.email
    },
    items: orderData.items.map(item => ({
      name: item.productName,
      code: item.productId,
      description: item.description,
      quantity: item.quantity,
      totalAmount: {
        amount: (item.price * item.quantity).toFixed(2),
        currency: 'PHP'
      }
    })),
    redirectUrl: {
      success: `${process.env.FRONTEND_URL}/order/${orderId}/success`,
      failure: `${process.env.FRONTEND_URL}/order/${orderId}/failed`,
      cancel: `${process.env.FRONTEND_URL}/order/${orderId}/cancelled`
    }
  };

  return await PayMayaService.createInvoice(invoiceData);
};
```

## Conclusion

The PayMaya integration provides a comprehensive payment solution for the LocalPro Super App, supporting multiple payment flows and ensuring secure transactions. Follow the setup instructions, implement the appropriate integration method for your use case, and always test thoroughly in the sandbox environment before going live.

For any questions or issues, refer to the troubleshooting section or contact PayMaya support through your business dashboard.
