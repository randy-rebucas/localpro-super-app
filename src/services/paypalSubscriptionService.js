const axios = require('axios');
const crypto = require('crypto');
const logger = require('../config/logger');

class PayPalSubscriptionService {
  constructor() {
    this.baseURL = process.env.PAYPAL_MODE === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token for PayPal API
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseURL}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('PayPal access token error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token');
    }
  }

  /**
   * Make authenticated request to PayPal API
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      const token = await this.getAccessToken();
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'PayPal-Request-Id': crypto.randomUUID()
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayPal API request error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a product for subscriptions
   */
  async createProduct(productData) {
    const product = {
      name: productData.name,
      description: productData.description,
      type: 'SERVICE',
      category: 'SOFTWARE',
      image_url: productData.imageUrl || '',
      home_url: productData.homeUrl || process.env.FRONTEND_URL
    };

    return await this.makeRequest('POST', '/v1/catalogs/products', product);
  }

  /**
   * Create a billing plan for subscriptions
   */
  async createBillingPlan(planData) {
    try {
      // First create a product if not provided
      let productId = planData.productId;
      if (!productId) {
        const productResult = await this.createProduct({
          name: planData.name,
          description: planData.description
        });
        
        if (!productResult.success) {
          return productResult;
        }
        productId = productResult.data.id;
      }

      const billingPlan = {
        product_id: productId,
        name: planData.name,
        description: planData.description,
        status: 'ACTIVE',
        billing_cycles: [{
          frequency: {
            interval_unit: planData.frequency, // DAY, WEEK, MONTH, YEAR
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 means infinite
          pricing_scheme: {
            fixed_price: {
              value: planData.price.toFixed(2),
              currency_code: planData.currency
            }
          }
        }],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: planData.currency
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: '0',
          inclusive: false
        }
      };

      return await this.makeRequest('POST', '/v1/billing/plans', billingPlan);
    } catch (error) {
      console.error('Create billing plan error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const subscription = {
        plan_id: subscriptionData.planId,
        subscriber: {
          name: {
            given_name: subscriptionData.subscriber.firstName,
            surname: subscriptionData.subscriber.lastName
          },
          email_address: subscriptionData.subscriber.email
        },
        custom_id: subscriptionData.customId,
        application_context: {
          brand_name: 'LocalPro Super App',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            paypal_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.FRONTEND_URL}/subscription/success`,
          cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
        }
      };

      return await this.makeRequest('POST', '/v1/billing/subscriptions', subscription);
    } catch (error) {
      console.error('Create subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    return await this.makeRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Activate a subscription
   */
  async activateSubscription(subscriptionId) {
    const activationData = {
      reason: 'Subscription activated by user'
    };
    return await this.makeRequest('POST', `/v1/billing/subscriptions/${subscriptionId}/activate`, activationData);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
    const cancellationData = {
      reason: reason
    };
    return await this.makeRequest('POST', `/v1/billing/subscriptions/${subscriptionId}/cancel`, cancellationData);
  }

  /**
   * Suspend a subscription
   */
  async suspendSubscription(subscriptionId, reason = 'Subscription suspended') {
    const suspensionData = {
      reason: reason
    };
    return await this.makeRequest('POST', `/v1/billing/subscriptions/${subscriptionId}/suspend`, suspensionData);
  }

  /**
   * Reactivate a suspended subscription
   */
  async reactivateSubscription(subscriptionId) {
    const reactivationData = {
      reason: 'Subscription reactivated by user'
    };
    return await this.makeRequest('POST', `/v1/billing/subscriptions/${subscriptionId}/activate`, reactivationData);
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    const patches = [];
    
    if (updateData.planId) {
      patches.push({
        op: 'replace',
        path: '/plan_id',
        value: updateData.planId
      });
    }

    if (updateData.subscriber) {
      patches.push({
        op: 'replace',
        path: '/subscriber',
        value: updateData.subscriber
      });
    }

    return await this.makeRequest('PATCH', `/v1/billing/subscriptions/${subscriptionId}`, patches);
  }

  /**
   * Get subscription transactions
   */
  async getSubscriptionTransactions(subscriptionId, startTime, endTime) {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    
    const queryString = params.toString();
    const endpoint = `/v1/billing/subscriptions/${subscriptionId}/transactions${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest('GET', endpoint);
  }

  /**
   * Capture authorized payment
   */
  async captureAuthorizedPayment(authorizationId, amount, currency = 'USD') {
    const captureData = {
      amount: {
        currency_code: currency,
        value: amount.toFixed(2)
      },
      is_final_capture: true
    };

    return await this.makeRequest('POST', `/v1/payments/authorization/${authorizationId}/capture`, captureData);
  }

  /**
   * Refund a captured payment
   */
  async refundCapturedPayment(captureId, amount = null, currency = 'USD') {
    const refundData = {
      amount: amount ? {
        currency_code: currency,
        value: amount.toFixed(2)
      } : undefined
    };

    return await this.makeRequest('POST', `/v1/payments/capture/${captureId}/refund`, refundData);
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(headers, body, webhookId) {
    try {
      const authAlgo = headers['paypal-auth-algo'];
      const transmissionId = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const transmissionTime = headers['paypal-transmission-time'];

      if (!authAlgo || !transmissionId || !certId || !transmissionSig || !transmissionTime) {
        return false;
      }

      const verificationData = {
        auth_algo: authAlgo,
        cert_id: certId,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body
      };

      const result = await this.makeRequest('POST', '/v1/notifications/verify-webhook-signature', verificationData);
      return result.success && result.data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event) {
    try {
      const eventType = event.event_type;
      const resource = event.resource;

      logger.info(`Processing PayPal webhook event: ${eventType}`);

      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          return await this.handleSubscriptionActivated(resource);
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          return await this.handleSubscriptionCancelled(resource);
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          return await this.handleSubscriptionSuspended(resource);
        case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
          return await this.handleSubscriptionPaymentCompleted(resource);
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          return await this.handleSubscriptionPaymentFailed(resource);
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          return await this.handleSubscriptionExpired(resource);
        default:
          logger.info(`Unhandled PayPal webhook event: ${eventType}`);
          return { success: true, message: 'Event not handled' };
      }
    } catch (error) {
      console.error('PayPal webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle subscription activated webhook
   */
  async handleSubscriptionActivated(resource) {
    logger.info('Subscription activated:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription cancelled webhook
   */
  async handleSubscriptionCancelled(resource) {
    logger.info('Subscription cancelled:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription suspended webhook
   */
  async handleSubscriptionSuspended(resource) {
    logger.info('Subscription suspended:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription payment completed webhook
   */
  async handleSubscriptionPaymentCompleted(resource) {
    logger.info('Subscription payment completed:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription payment failed webhook
   */
  async handleSubscriptionPaymentFailed(resource) {
    logger.info('Subscription payment failed:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription expired webhook
   */
  async handleSubscriptionExpired(resource) {
    logger.info('Subscription expired:', resource.id);
    return { success: true };
  }
}

module.exports = new PayPalSubscriptionService();
