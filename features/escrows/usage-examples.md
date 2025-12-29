# Escrow Usage Examples

## Overview

This document provides practical examples of how to use the Escrow API endpoints in real-world scenarios. Examples include common patterns, error handling, and best practices for implementing secure payment escrow functionality.

## 🚀 Getting Started

### Basic Setup

```javascript
// API Base URL
const API_BASE = 'http://localhost:5000/api/escrows';

// Authentication header
const authHeader = {
  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  'Content-Type': 'application/json'
};
```

## 📋 Client-Side Examples

### 1. Create Escrow (Hold Payment)

```javascript
// Client initiates payment for a booking
async function createEscrow(bookingId, providerId, amount, currency = 'USD') {
  try {
    const response = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        bookingId,
        providerId,
        amount: amount * 100, // Convert to cents
        currency,
        holdProvider: 'xendit' // or 'paymongo', 'stripe', 'paypal'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Escrow created:', data.data);
      console.log('Status:', data.data.status); // Should be 'FUNDS_HELD'
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating escrow:', error);
    throw error;
  }
}

// Usage
const escrow = await createEscrow(
  '64f1a2b3c4d5e6f7g8h9i0j1',
  '64f1a2b3c4d5e6f7g8h9i0j2',
  500.00,
  'USD'
);
```

### 2. Approve and Capture Payment

```javascript
// Client approves work and captures payment
async function capturePayment(escrowId) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}/capture`, {
      method: 'POST',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Payment captured:', data.data);
      console.log('New status:', data.data.status); // Should be 'IN_PROGRESS'
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw error;
  }
}

// Usage
const result = await capturePayment('550e8400-e29b-41d4-a716-446655440000');
```

### 3. Request Refund

```javascript
// Client requests refund
async function requestRefund(escrowId, reason) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}/refund`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        reason
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Refund initiated:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
}

// Usage
await requestRefund(
  '550e8400-e29b-41d4-a716-446655440000',
  'Service not completed as agreed'
);
```

### 4. Initiate Dispute

```javascript
// Client initiates dispute with evidence
async function initiateDispute(escrowId, reason, evidenceFiles) {
  try {
    // Upload evidence files first (to Cloudinary or similar)
    const evidence = await Promise.all(
      evidenceFiles.map(async (file) => {
        const uploadResult = await uploadToCloudinary(file);
        return {
          type: file.type, // 'photo', 'video', 'document'
          url: uploadResult.secure_url,
          uploadedAt: new Date().toISOString()
        };
      })
    );
    
    const response = await fetch(`${API_BASE}/${escrowId}/dispute`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        reason,
        evidence
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Dispute raised:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error initiating dispute:', error);
    throw error;
  }
}

// Usage
await initiateDispute(
  '550e8400-e29b-41d4-a716-446655440000',
  'Work quality does not meet standards',
  [photoFile1, photoFile2]
);
```

### 5. Get My Escrows

```javascript
// Get all escrows for current user with filtering
async function getMyEscrows(filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.status && { status: filters.status }),
      ...(filters.bookingId && { bookingId: filters.bookingId })
    });
    
    const response = await fetch(`${API_BASE}?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('My escrows:', data.data);
      console.log('Pagination:', data.pagination);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching escrows:', error);
    throw error;
  }
}

// Usage - Get all pending escrows
const pendingEscrows = await getMyEscrows({ status: 'FUNDS_HELD' });

// Usage - Get completed escrows
const completedEscrows = await getMyEscrows({ status: 'COMPLETE' });
```

### 6. Get Escrow Details

```javascript
// Get detailed escrow information
async function getEscrowDetails(escrowId) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Escrow details:', data.data.escrow);
      console.log('Payout info:', data.data.payout);
      console.log('Transactions:', data.data.transactions);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching escrow details:', error);
    throw error;
  }
}

// Usage
const details = await getEscrowDetails('550e8400-e29b-41d4-a716-446655440000');
```

### 7. Get Transaction History

```javascript
// Get audit log of all transactions
async function getTransactionHistory(escrowId, page = 1, limit = 50) {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit
    });
    
    const response = await fetch(`${API_BASE}/${escrowId}/transactions?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Transaction history:', data.data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

// Usage
const history = await getTransactionHistory('550e8400-e29b-41d4-a716-446655440000');
```

## 🔧 Provider-Side Examples

### 1. Upload Proof of Work

```javascript
// Provider uploads proof of completed work
async function uploadProofOfWork(escrowId, documents, notes) {
  try {
    // Upload documents to Cloudinary first
    const uploadedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const uploadResult = await uploadToCloudinary(doc.file);
        return {
          type: doc.type, // 'photo', 'video', 'document'
          url: uploadResult.secure_url,
          uploadedAt: new Date().toISOString(),
          metadata: {
            fileSize: doc.file.size,
            mimeType: doc.file.type
          }
        };
      })
    );
    
    const response = await fetch(`${API_BASE}/${escrowId}/proof-of-work`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        documents: uploadedDocuments,
        notes
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Proof of work uploaded:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error uploading proof of work:', error);
    throw error;
  }
}

// Usage
await uploadProofOfWork(
  '550e8400-e29b-41d4-a716-446655440000',
  [
    { type: 'photo', file: beforePhoto },
    { type: 'photo', file: afterPhoto },
    { type: 'video', file: completionVideo }
  ],
  'Work completed as requested. All plumbing issues resolved.'
);
```

### 2. Request Payout

```javascript
// Provider requests payout after client approval
async function requestPayout(escrowId) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}/payout`, {
      method: 'POST',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Payout initiated:', data.data.payout);
      console.log('Status:', data.data.payout.status); // Should be 'PROCESSING'
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error requesting payout:', error);
    throw error;
  }
}

// Usage
const payout = await requestPayout('550e8400-e29b-41d4-a716-446655440000');
```

### 3. Get Payout Details

```javascript
// Provider checks payout status
async function getPayoutDetails(escrowId) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}/payout`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Payout details:', data.data);
      console.log('Status:', data.data.status);
      console.log('Completed at:', data.data.completedAt);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching payout details:', error);
    throw error;
  }
}

// Usage
const payoutDetails = await getPayoutDetails('550e8400-e29b-41d4-a716-446655440000');
```

## 👨‍💼 Admin Examples

### 1. Get All Escrows (Admin)

```javascript
// Admin gets all escrows with filtering
async function getAllEscrows(filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.status && { status: filters.status }),
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.providerId && { providerId: filters.providerId })
    });
    
    const response = await fetch(`${API_BASE}/admin/all?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'X-Admin-Token': localStorage.getItem('admin_token')
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('All escrows:', data.data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching all escrows:', error);
    throw error;
  }
}

// Usage - Get all disputes
const disputes = await getAllEscrows({ status: 'DISPUTE' });
```

### 2. Get Escrow Statistics

```javascript
// Admin gets escrow statistics
async function getEscrowStatistics(startDate, endDate) {
  try {
    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const response = await fetch(`${API_BASE}/admin/stats?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'X-Admin-Token': localStorage.getItem('admin_token')
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Statistics:', data.data);
      console.log('By status:', data.data.byStatus);
      console.log('Total volume:', data.data.totalVolume);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

// Usage
const stats = await getEscrowStatistics(
  new Date('2024-12-01'),
  new Date('2024-12-31')
);
```

### 3. Resolve Dispute

```javascript
// Admin resolves a dispute
async function resolveDispute(escrowId, decision, notes) {
  try {
    const response = await fetch(`${API_BASE}/${escrowId}/dispute/resolve`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'X-Admin-Token': localStorage.getItem('admin_token')
      },
      body: JSON.stringify({
        decision, // 'REFUND_CLIENT', 'PAYOUT_PROVIDER', 'SPLIT'
        notes
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Dispute resolved:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error resolving dispute:', error);
    throw error;
  }
}

// Usage - Refund client
await resolveDispute(
  '550e8400-e29b-41d4-a716-446655440000',
  'REFUND_CLIENT',
  'Provider did not complete work as specified'
);

// Usage - Pay provider
await resolveDispute(
  '550e8400-e29b-41d4-a716-446655440000',
  'PAYOUT_PROVIDER',
  'Provider completed work satisfactorily'
);
```

## 🔄 Complete Workflow Examples

### Full Escrow Cycle (Client Side)

```javascript
// Complete workflow from client perspective
async function completeEscrowCycle(bookingId, providerId, amount) {
  try {
    // Step 1: Create escrow and hold payment
    console.log('Step 1: Creating escrow...');
    const escrow = await createEscrow(bookingId, providerId, amount);
    console.log('Escrow created with status:', escrow.status);
    
    // Step 2: Wait for provider to upload proof of work
    // (This would typically be handled by polling or webhooks)
    console.log('Step 2: Waiting for provider to complete work...');
    
    // Step 3: Review proof of work (in real app, show UI)
    const escrowDetails = await getEscrowDetails(escrow.id);
    const proofOfWork = escrowDetails.escrow.proofOfWork;
    
    if (proofOfWork && proofOfWork.uploadedAt) {
      console.log('Proof of work received:', proofOfWork);
      
      // Step 4: Approve and capture payment
      console.log('Step 4: Approving and capturing payment...');
      const result = await capturePayment(escrow.id);
      console.log('Payment captured. Status:', result.status);
      
      return result;
    } else {
      console.log('Proof of work not yet uploaded');
      return escrow;
    }
  } catch (error) {
    console.error('Error in escrow cycle:', error);
    throw error;
  }
}
```

### Full Escrow Cycle (Provider Side)

```javascript
// Complete workflow from provider perspective
async function completeProviderWorkflow(escrowId, workDocuments, notes) {
  try {
    // Step 1: Upload proof of work
    console.log('Step 1: Uploading proof of work...');
    const proofResult = await uploadProofOfWork(escrowId, workDocuments, notes);
    console.log('Proof uploaded:', proofResult);
    
    // Step 2: Wait for client approval
    // (This would typically be handled by polling or webhooks)
    console.log('Step 2: Waiting for client approval...');
    
    // Step 3: Check escrow status
    const escrowDetails = await getEscrowDetails(escrowId);
    const status = escrowDetails.escrow.status;
    
    if (status === 'IN_PROGRESS' || status === 'COMPLETE') {
      // Step 4: Request payout
      console.log('Step 3: Requesting payout...');
      const payout = await requestPayout(escrowId);
      console.log('Payout initiated:', payout.payout.status);
      
      // Step 5: Monitor payout status
      const checkPayoutStatus = setInterval(async () => {
        const payoutDetails = await getPayoutDetails(escrowId);
        if (payoutDetails.status === 'COMPLETED') {
          console.log('Payout completed!');
          clearInterval(checkPayoutStatus);
        } else if (payoutDetails.status === 'FAILED') {
          console.error('Payout failed:', payoutDetails.failureReason);
          clearInterval(checkPayoutStatus);
        }
      }, 5000); // Check every 5 seconds
      
      return payout;
    } else {
      console.log('Escrow status:', status);
      return escrowDetails;
    }
  } catch (error) {
    console.error('Error in provider workflow:', error);
    throw error;
  }
}
```

## 🎣 Webhook Integration Examples

### Handle Payment Gateway Webhook

```javascript
// Server-side webhook handler
app.post('/webhooks/payments', async (req, res) => {
  try {
    const provider = req.query.provider; // 'xendit', 'paymongo', etc.
    const signature = req.headers['x-signature'];
    const payload = req.body;
    
    // Verify webhook signature
    if (!verifyWebhookSignature(provider, signature, payload)) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
    
    // Process webhook based on event type
    const event = payload.event || payload.type;
    
    switch (event) {
      case 'authorization_success':
      case 'payment.authorized':
        // Payment hold successful
        await handlePaymentHoldSuccess(payload.data);
        break;
        
      case 'authorization_failed':
      case 'payment.failed':
        // Payment hold failed
        await handlePaymentHoldFailed(payload.data);
        break;
        
      case 'capture_success':
      case 'payment.captured':
        // Payment captured
        await handlePaymentCaptureSuccess(payload.data);
        break;
        
      default:
        console.log('Unknown webhook event:', event);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, message: 'Processing failed' });
  }
});

// Helper functions
async function handlePaymentHoldSuccess(data) {
  const escrow = await Escrow.findOne({ providerHoldId: data.id });
  if (escrow) {
    escrow.status = 'FUNDS_HELD';
    await escrow.save();
    
    // Log transaction
    await EscrowTransaction.create({
      escrowId: escrow._id,
      transactionType: 'HOLD',
      amount: escrow.amount,
      currency: escrow.currency,
      status: 'SUCCESS',
      gateway: {
        provider: escrow.holdProvider,
        transactionId: data.id
      }
    });
  }
}

async function handlePaymentCaptureSuccess(data) {
  const escrow = await Escrow.findOne({ providerHoldId: data.authorization_id });
  if (escrow) {
    escrow.status = 'IN_PROGRESS';
    await escrow.save();
    
    // Log transaction
    await EscrowTransaction.create({
      escrowId: escrow._id,
      transactionType: 'CAPTURE',
      amount: escrow.amount,
      currency: escrow.currency,
      status: 'SUCCESS',
      gateway: {
        provider: escrow.holdProvider,
        transactionId: data.id
      }
    });
  }
}
```

### Handle Payout Webhook

```javascript
// Server-side payout webhook handler
app.post('/webhooks/disbursements', async (req, res) => {
  try {
    const provider = req.query.provider;
    const signature = req.headers['x-signature'];
    const payload = req.body;
    
    // Verify signature
    if (!verifyWebhookSignature(provider, signature, payload)) {
      return res.status(401).json({ success: false });
    }
    
    const event = payload.event || payload.type;
    
    switch (event) {
      case 'disbursement_succeeded':
      case 'payout.completed':
        await handlePayoutSuccess(payload.data);
        break;
        
      case 'disbursement_failed':
      case 'payout.failed':
        await handlePayoutFailed(payload.data);
        break;
        
      default:
        console.log('Unknown payout event:', event);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payout webhook error:', error);
    res.status(500).json({ success: false });
  }
});

async function handlePayoutSuccess(data) {
  const payout = await Payout.findOne({ gatewayPayoutId: data.id });
  if (payout) {
    payout.status = 'COMPLETED';
    payout.completedAt = new Date();
    await payout.save();
    
    // Update escrow status
    const escrow = await Escrow.findById(payout.escrowId);
    escrow.status = 'PAYOUT_COMPLETED';
    await escrow.save();
    
    // Log transaction
    await EscrowTransaction.create({
      escrowId: escrow._id,
      transactionType: 'PAYOUT',
      amount: payout.amount,
      currency: payout.currency,
      status: 'SUCCESS',
      gateway: {
        provider: payout.payoutProvider,
        transactionId: data.id
      }
    });
    
    // Notify provider
    await sendEmailNotification(payout.providerId, 'payout_completed', {
      amount: payout.amount,
      currency: payout.currency
    });
  }
}
```

## ⚠️ Error Handling Examples

### Comprehensive Error Handling

```javascript
// Wrapper function with error handling
async function safeEscrowOperation(operation, ...args) {
  try {
    return await operation(...args);
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // API error response
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Validation error:', data.message);
          throw new Error(`Invalid request: ${data.message}`);
          
        case 401:
          console.error('Authentication error');
          // Redirect to login
          window.location.href = '/login';
          throw new Error('Please log in again');
          
        case 403:
          console.error('Authorization error:', data.message);
          throw new Error('You do not have permission to perform this action');
          
        case 404:
          console.error('Resource not found:', data.message);
          throw new Error('Escrow not found');
          
        case 409:
          console.error('Conflict:', data.message);
          throw new Error(data.message);
          
        case 500:
          console.error('Server error:', data.message);
          throw new Error('Server error. Please try again later.');
          
        default:
          throw new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      console.error('Error:', error.message);
      throw error;
    }
  }
}

// Usage
try {
  const escrow = await safeEscrowOperation(createEscrow, bookingId, providerId, amount);
  console.log('Success:', escrow);
} catch (error) {
  // Show user-friendly error message
  alert(error.message);
}
```

## 🔐 React Hook Example

```javascript
import { useState, useCallback } from 'react';

const useEscrow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const createEscrow = useCallback(async (bookingId, providerId, amount, currency) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          bookingId,
          providerId,
          amount: amount * 100,
          currency,
          holdProvider: 'xendit'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const capturePayment = useCallback(async (escrowId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/${escrowId}/capture`, {
        method: 'POST',
        headers: authHeader
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    error,
    createEscrow,
    capturePayment
  };
};

// Usage in component
function EscrowComponent() {
  const { loading, error, createEscrow, capturePayment } = useEscrow();
  
  const handleCreate = async () => {
    try {
      const escrow = await createEscrow(bookingId, providerId, 500, 'USD');
      console.log('Escrow created:', escrow);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleCreate}>Create Escrow</button>
    </div>
  );
}
```

## 📱 React Native Example

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EscrowScreen = ({ route }) => {
  const { bookingId, providerId, amount } = route.params;
  const [loading, setLoading] = useState(false);
  
  const createEscrow = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          providerId,
          amount: amount * 100,
          currency: 'USD',
          holdProvider: 'xendit'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Escrow created successfully');
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View>
      <TouchableOpacity onPress={createEscrow} disabled={loading}>
        <Text>{loading ? 'Creating...' : 'Create Escrow'}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

These examples demonstrate comprehensive usage patterns for the Escrow API across different scenarios, platforms, and use cases. They show how to implement secure payment escrow functionality with proper error handling, webhook integration, and user experience considerations.

