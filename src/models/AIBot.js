const mongoose = require('mongoose');

const aiBotInteractionSchema = new mongoose.Schema({
  // Event Information
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'api_request',
      'app_action',
      'pos_transaction',
      'payment_event',
      'gps_location',
      'crm_update',
      'booking_created',
      'booking_updated',
      'booking_cancelled',
      'payment_received',
      'payment_failed',
      'provider_registered',
      'provider_verified',
      'escrow_created',
      'escrow_dispute',
      'support_request',
      'user_activity',
      'system_alert',
      'other'
    ],
    index: true
  },
  eventSource: {
    type: String,
    required: true,
    enum: ['api', 'app', 'pos', 'payments', 'gps', 'crm', 'system', 'webhook', 'n8n'],
    index: true
  },
  
  // Intent Classification
  intent: {
    type: String,
    required: true,
    enum: [
      'booking_management',
      'payment_processing',
      'provider_operations',
      'escrow_management',
      'support_request',
      'user_onboarding',
      'verification',
      'dispute_resolution',
      'analytics_reporting',
      'system_maintenance',
      'marketing_campaign',
      'notification_delivery',
      'data_sync',
      'audit_review',
      'other'
    ],
    index: true
  },
  intentConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  
  // Sub-Agent Assignment
  assignedSubAgent: {
    type: String,
    enum: [
      'provider_agent',
      'booking_agent',
      'payment_agent',
      'escrow_agent',
      'support_agent',
      'operations_agent',
      'audit_agent',
      'marketing_agent',
      'analytics_agent'
    ],
    index: true
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'escalated', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Event Data
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // AI Decision Making
  aiAnalysis: {
    classification: String,
    reasoning: String,
    recommendedActions: [{
      action: String,
      priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      estimatedTime: Number, // in seconds
      requiresHuman: Boolean
    }],
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  
  // Actions Taken
  actionsTaken: [{
    action: String,
    subAgent: String,
    timestamp: Date,
    result: {
      success: Boolean,
      data: mongoose.Schema.Types.Mixed,
      error: String
    },
    n8nWorkflowId: String,
    n8nExecutionId: String
  }],
  
  // n8n Workflow Execution
  n8nWorkflows: [{
    workflowId: String,
    workflowName: String,
    executionId: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed', 'cancelled']
    },
    triggeredAt: Date,
    completedAt: Date,
    result: mongoose.Schema.Types.Mixed,
    error: String
  }],
  
  // Escalation
  escalated: {
    type: Boolean,
    default: false,
    index: true
  },
  escalationReason: String,
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  escalationResolved: {
    type: Boolean,
    default: false
  },
  escalationResolvedAt: Date,
  
  // Context
  context: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      index: true
    },
    escrowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      index: true
    },
    paymentId: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Performance Metrics
  processingTime: Number, // in milliseconds
  totalCost: Number, // AI API cost if applicable
  
  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
aiBotInteractionSchema.index({ status: 1, createdAt: -1 });
aiBotInteractionSchema.index({ assignedSubAgent: 1, status: 1 });
aiBotInteractionSchema.index({ escalated: 1, escalationResolved: 1 });
aiBotInteractionSchema.index({ 'context.userId': 1, createdAt: -1 });
aiBotInteractionSchema.index({ 'context.bookingId': 1 });
aiBotInteractionSchema.index({ eventType: 1, eventSource: 1, createdAt: -1 });

module.exports = mongoose.model('AIBotInteraction', aiBotInteractionSchema);
