/**
 * LocalPro Super App AI Bot Service
 * 
 * This is the core controller/orchestrator that acts as an AI Operating System.
 * It listens to events, classifies intent, dispatches to sub-agents, and executes workflows.
 * 
 * Philosophy: AI Bot is COO + Ops Manager + Support Lead + Dispatcher + Auditor
 */

const AIService = require('./aiService');
const logger = require('../config/logger');
const AIBotInteraction = require('../models/AIBot');
const { v4: uuidv4 } = require('uuid');

// Import sub-agents
const ProviderAgent = require('./aiBotSubAgents/providerAgent');
const BookingAgent = require('./aiBotSubAgents/bookingAgent');
const PaymentAgent = require('./aiBotSubAgents/paymentAgent');
const EscrowAgent = require('./aiBotSubAgents/escrowAgent');
const SupportAgent = require('./aiBotSubAgents/supportAgent');
const OperationsAgent = require('./aiBotSubAgents/operationsAgent');
const AuditAgent = require('./aiBotSubAgents/auditAgent');
const MarketingAgent = require('./aiBotSubAgents/marketingAgent');
const AnalyticsAgent = require('./aiBotSubAgents/analyticsAgent');

// Import n8n integration
const n8nService = require('./n8nService');

class AIBotService {
  constructor() {
    this.isInitialized = false;
    this.subAgents = {
      provider_agent: new ProviderAgent(),
      booking_agent: new BookingAgent(),
      payment_agent: new PaymentAgent(),
      escrow_agent: new EscrowAgent(),
      support_agent: new SupportAgent(),
      operations_agent: new OperationsAgent(),
      audit_agent: new AuditAgent(),
      marketing_agent: new MarketingAgent(),
      analytics_agent: new AnalyticsAgent()
    };
    
    // Intent to sub-agent mapping
    this.intentMapping = {
      'booking_management': 'booking_agent',
      'payment_processing': 'payment_agent',
      'provider_operations': 'provider_agent',
      'escrow_management': 'escrow_agent',
      'support_request': 'support_agent',
      'user_onboarding': 'provider_agent',
      'verification': 'provider_agent',
      'dispute_resolution': 'escrow_agent',
      'analytics_reporting': 'analytics_agent',
      'system_maintenance': 'operations_agent',
      'marketing_campaign': 'marketing_agent',
      'notification_delivery': 'operations_agent',
      'data_sync': 'operations_agent',
      'audit_review': 'audit_agent'
    };
  }

  /**
   * Initialize the AI Bot service
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('AI Bot service already initialized');
      return;
    }

    try {
      logger.info('🤖 Initializing LocalPro Super App AI Bot...');
      
      // Initialize all sub-agents
      for (const [, agent] of Object.entries(this.subAgents)) {
        if (agent.initialize) {
          await agent.initialize();
        }
      }
      
      this.isInitialized = true;
      logger.info('✅ AI Bot service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize AI Bot service', { error: error.message });
      throw error;
    }
  }

  /**
   * Main entry point: Process an event
   * This is the controller that orchestrates everything
   */
  async processEvent(event) {
    const startTime = Date.now();
    const eventId = uuidv4();
    
    try {
      logger.info('🤖 AI Bot processing event', {
        eventId,
        eventType: event.type,
        eventSource: event.source
      });

      // Create interaction record
      const interaction = new AIBotInteraction({
        eventId,
        eventType: event.type,
        eventSource: event.source,
        eventData: event.data,
        context: event.context || {},
        status: 'processing'
      });

      // Step 1: Classify Intent
      const intentResult = await this.classifyIntent(event);
      interaction.intent = intentResult.intent;
      interaction.intentConfidence = intentResult.confidence;
      interaction.aiAnalysis = {
        classification: intentResult.intent,
        reasoning: intentResult.reasoning,
        recommendedActions: intentResult.recommendedActions || [],
        riskLevel: intentResult.riskLevel || 'low'
      };

      // Step 2: Assign to Sub-Agent
      const subAgentName = this.intentMapping[intentResult.intent] || 'operations_agent';
      interaction.assignedSubAgent = subAgentName;
      const subAgent = this.subAgents[subAgentName];

      if (!subAgent) {
        throw new Error(`Sub-agent ${subAgentName} not found`);
      }

      // Step 3: Check if escalation is needed
      const requiresEscalation = await this.shouldEscalate(event, intentResult);
      
      if (requiresEscalation.required) {
        interaction.escalated = true;
        interaction.escalationReason = requiresEscalation.reason;
        interaction.status = 'escalated';
        await interaction.save();
        
        await this.escalateToHuman(interaction, requiresEscalation);
        return {
          success: true,
          eventId,
          status: 'escalated',
          escalationReason: requiresEscalation.reason
        };
      }

      // Step 4: Process with Sub-Agent
      const subAgentResult = await subAgent.process(interaction, event);
      
      // Step 5: Execute n8n Workflows if needed
      if (subAgentResult.workflows && subAgentResult.workflows.length > 0) {
        const workflowResults = await this.executeWorkflows(
          interaction,
          subAgentResult.workflows
        );
        interaction.n8nWorkflows = workflowResults;
      }

      // Step 6: Record actions taken
      if (subAgentResult.actions) {
        interaction.actionsTaken = subAgentResult.actions.map(action => ({
          action: action.action,
          subAgent: subAgentName,
          timestamp: new Date(),
          result: action.result,
          n8nWorkflowId: action.n8nWorkflowId,
          n8nExecutionId: action.n8nExecutionId
        }));
      }

      // Step 7: Update status
      interaction.status = subAgentResult.success ? 'completed' : 'failed';
      interaction.processingTime = Date.now() - startTime;
      interaction.completedAt = new Date();
      
      await interaction.save();

      logger.info('✅ AI Bot event processed', {
        eventId,
        intent: intentResult.intent,
        subAgent: subAgentName,
        status: interaction.status,
        processingTime: interaction.processingTime
      });

      return {
        success: subAgentResult.success,
        eventId,
        intent: intentResult.intent,
        subAgent: subAgentName,
        actions: subAgentResult.actions || [],
        workflows: subAgentResult.workflows || [],
        result: subAgentResult.result
      };
    } catch (error) {
      logger.error('❌ AI Bot event processing failed', {
        eventId,
        error: error.message,
        stack: error.stack
      });

      // Update interaction with error
      try {
        const interaction = await AIBotInteraction.findOne({ eventId });
        if (interaction) {
          interaction.status = 'failed';
          interaction.processingTime = Date.now() - startTime;
          await interaction.save();
        }
      } catch (saveError) {
        logger.error('Failed to save error state', { error: saveError.message });
      }

      // Escalate on critical errors
      if (error.critical || error.message.includes('critical')) {
        await this.escalateToHuman(null, {
          required: true,
          reason: `Critical error: ${error.message}`,
          priority: 'critical'
        });
      }

      throw error;
    }
  }

  /**
   * Classify intent using AI
   */
  async classifyIntent(event) {
    const systemPrompt = `You are an intent classification system for LocalPro Super App, a B2B2C marketplace platform.
    
    Your role is to analyze events and classify their intent. Consider:
    - Event type and source
    - Event data and context
    - User roles and relationships
    - Business rules and workflows
    
    Available intents:
    - booking_management: Booking creation, updates, cancellations, scheduling
    - payment_processing: Payment events, transactions, refunds, disputes
    - provider_operations: Provider registration, verification, onboarding, management
    - escrow_management: Escrow creation, releases, disputes, settlements
    - support_request: Customer support, help requests, issues
    - user_onboarding: New user registration, profile setup, welcome flows
    - verification: Identity verification, document verification, badge earning
    - dispute_resolution: Disputes, conflicts, mediation
    - analytics_reporting: Analytics, reports, insights, dashboards
    - system_maintenance: System operations, maintenance, monitoring
    - marketing_campaign: Marketing, campaigns, promotions, notifications
    - notification_delivery: Sending notifications, alerts, reminders
    - data_sync: Data synchronization, updates, imports
    - audit_review: Audit logs, compliance, security reviews
    - other: Anything that doesn't fit above categories
    
    Return JSON with:
    - intent: string (one of the above)
    - confidence: number (0-1)
    - reasoning: string (brief explanation)
    - recommendedActions: array of { action: string, priority: string, estimatedTime: number, requiresHuman: boolean }
    - riskLevel: string (low, medium, high, critical)`;

    const prompt = `Event Type: ${event.type}
Event Source: ${event.source}
Event Data: ${JSON.stringify(event.data, null, 2)}
Context: ${JSON.stringify(event.context || {}, null, 2)}

Classify the intent and provide recommendations.`;

    try {
      const response = await AIService.makeAICall(prompt, systemPrompt, {
        temperature: 0.3,
        max_tokens: 1000
      });

      let parsed;
      try {
        const content = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Fallback classification based on event type
        parsed = this.fallbackIntentClassification(event);
        logger.warn('AI intent classification parse failed, using fallback', {
          error: parseError.message,
          fallbackIntent: parsed.intent
        });
      }

      return {
        intent: parsed.intent || 'other',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Classification based on event type',
        recommendedActions: parsed.recommendedActions || [],
        riskLevel: parsed.riskLevel || 'low'
      };
    } catch (error) {
      logger.error('Intent classification failed', { error: error.message });
      return this.fallbackIntentClassification(event);
    }
  }

  /**
   * Fallback intent classification when AI fails
   */
  fallbackIntentClassification(event) {
    const typeMap = {
      'booking_created': 'booking_management',
      'booking_updated': 'booking_management',
      'booking_cancelled': 'booking_management',
      'payment_received': 'payment_processing',
      'payment_failed': 'payment_processing',
      'provider_registered': 'provider_operations',
      'provider_verified': 'provider_operations',
      'escrow_created': 'escrow_management',
      'escrow_dispute': 'escrow_management',
      'support_request': 'support_request',
      'user_activity': 'user_onboarding'
    };

    return {
      intent: typeMap[event.type] || 'other',
      confidence: 0.6,
      reasoning: 'Fallback classification based on event type',
      recommendedActions: [],
      riskLevel: 'low'
    };
  }

  /**
   * Determine if event should be escalated to humans
   */
  async shouldEscalate(event, intentResult) {
    // Critical risk level always escalates
    if (intentResult.riskLevel === 'critical') {
      return {
        required: true,
        reason: 'Critical risk level detected',
        priority: 'critical'
      };
    }

    // Check if any recommended action requires human
    if (intentResult.recommendedActions) {
      const requiresHuman = intentResult.recommendedActions.some(
        action => action.requiresHuman === true
      );
      
      if (requiresHuman) {
        return {
          required: true,
          reason: 'AI recommended actions require human intervention',
          priority: 'high'
        };
      }
    }

    // Check sub-agent escalation rules
    const subAgentName = this.intentMapping[intentResult.intent];
    if (subAgentName && this.subAgents[subAgentName]) {
      const escalationCheck = await this.subAgents[subAgentName].shouldEscalate(event, intentResult);
      if (escalationCheck) {
        return escalationCheck;
      }
    }

    return { required: false };
  }

  /**
   * Escalate to human
   */
  async escalateToHuman(interaction, escalationInfo) {
    try {
      logger.warn('🚨 Escalating to human', {
        eventId: interaction?.eventId,
        reason: escalationInfo.reason,
        priority: escalationInfo.priority || 'medium'
      });

      // Create escalation record
      if (interaction) {
        interaction.escalated = true;
        interaction.escalationReason = escalationInfo.reason;
        interaction.status = 'escalated';
        await interaction.save();
      }

      // Trigger n8n workflow for human escalation
      await n8nService.triggerWorkflow('human-escalation', {
        eventId: interaction?.eventId,
        reason: escalationInfo.reason,
        priority: escalationInfo.priority || 'medium',
        eventData: interaction?.eventData,
        context: interaction?.context
      });

      // Send notification to admins
      // This would integrate with your notification service
      // await notificationService.sendAdminAlert(...);

    } catch (error) {
      logger.error('Failed to escalate to human', { error: error.message });
    }
  }

  /**
   * Execute n8n workflows
   */
  async executeWorkflows(interaction, workflows) {
    const results = [];

    for (const workflow of workflows) {
      try {
        const result = await n8nService.triggerWorkflow(
          workflow.workflowId || workflow.name,
          {
            ...workflow.data,
            eventId: interaction.eventId,
            interactionId: interaction._id
          }
        );

        results.push({
          workflowId: workflow.workflowId || workflow.name,
          workflowName: workflow.name,
          executionId: result.executionId,
          status: result.success ? 'success' : 'failed',
          triggeredAt: new Date(),
          completedAt: result.completedAt ? new Date(result.completedAt) : new Date(),
          result: result.data,
          error: result.error
        });
      } catch (error) {
        logger.error('Workflow execution failed', {
          workflow: workflow.name,
          error: error.message
        });

        results.push({
          workflowId: workflow.workflowId || workflow.name,
          workflowName: workflow.name,
          status: 'failed',
          triggeredAt: new Date(),
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get interaction history
   */
  async getInteractionHistory(filters = {}) {
    try {
      const query = {};
      
      if (filters.userId) query['context.userId'] = filters.userId;
      if (filters.bookingId) query['context.bookingId'] = filters.bookingId;
      if (filters.status) query.status = filters.status;
      if (filters.intent) query.intent = filters.intent;
      if (filters.subAgent) query.assignedSubAgent = filters.subAgent;
      if (filters.escalated !== undefined) query.escalated = filters.escalated;
      if (filters.eventType) query.eventType = filters.eventType;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const interactions = await AIBotInteraction.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .populate('context.userId', 'firstName lastName email')
        .populate('context.bookingId')
        .populate('escalatedTo', 'firstName lastName email');

      const total = await AIBotInteraction.countDocuments(query);

      return {
        interactions,
        total,
        page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
        totalPages: Math.ceil(total / (filters.limit || 50))
      };
    } catch (error) {
      logger.error('Failed to get interaction history', { error: error.message });
      throw error;
    }
  }

  /**
   * Get interaction by ID
   */
  async getInteractionById(eventId) {
    try {
      const interaction = await AIBotInteraction.findOne({ eventId })
        .populate('context.userId', 'firstName lastName email')
        .populate('context.bookingId')
        .populate('context.providerId')
        .populate('context.escrowId')
        .populate('escalatedTo', 'firstName lastName email');

      return interaction;
    } catch (error) {
      logger.error('Failed to get interaction', { eventId, error: error.message });
      throw error;
    }
  }

  /**
   * Get analytics and insights
   */
  async getAnalytics(timeRange = '7d') {
    try {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const [
        totalEvents,
        byIntent,
        byStatus,
        bySubAgent,
        escalated,
        avgProcessingTime,
        topWorkflows
      ] = await Promise.all([
        AIBotInteraction.countDocuments({ createdAt: { $gte: startDate } }),
        AIBotInteraction.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$intent', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AIBotInteraction.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        AIBotInteraction.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$assignedSubAgent', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AIBotInteraction.countDocuments({
          createdAt: { $gte: startDate },
          escalated: true
        }),
        AIBotInteraction.aggregate([
          { $match: { createdAt: { $gte: startDate }, processingTime: { $exists: true } } },
          { $group: { _id: null, avg: { $avg: '$processingTime' } } }
        ]),
        AIBotInteraction.aggregate([
          { $match: { createdAt: { $gte: startDate }, 'n8nWorkflows.workflowName': { $exists: true } } },
          { $unwind: '$n8nWorkflows' },
          { $group: { _id: '$n8nWorkflows.workflowName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        timeRange,
        totalEvents,
        byIntent: byIntent.map(item => ({ intent: item._id, count: item.count })),
        byStatus: byStatus.map(item => ({ status: item._id, count: item.count })),
        bySubAgent: bySubAgent.map(item => ({ subAgent: item._id, count: item.count })),
        escalated: {
          count: escalated,
          percentage: totalEvents > 0 ? (escalated / totalEvents * 100).toFixed(2) : 0
        },
        avgProcessingTime: avgProcessingTime[0]?.avg || 0,
        topWorkflows: topWorkflows.map(item => ({ workflow: item._id, count: item.count }))
      };
    } catch (error) {
      logger.error('Failed to get analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Assign escalated interaction to an admin
   */
  async assignEscalation(eventId, adminId) {
    try {
      const interaction = await AIBotInteraction.findOne({ eventId });
      
      if (!interaction) {
        throw new Error('Interaction not found');
      }

      if (!interaction.escalated) {
        throw new Error('Interaction is not escalated');
      }

      interaction.escalatedTo = adminId;
      await interaction.save();

      logger.info('Escalation assigned', { eventId, adminId });

      return {
        success: true,
        interaction
      };
    } catch (error) {
      logger.error('Failed to assign escalation', { eventId, adminId, error: error.message });
      throw error;
    }
  }

  /**
   * Resolve an escalated interaction
   */
  async resolveEscalation(eventId, adminId, resolution) {
    try {
      const interaction = await AIBotInteraction.findOne({ eventId });
      
      if (!interaction) {
        throw new Error('Interaction not found');
      }

      if (!interaction.escalated) {
        throw new Error('Interaction is not escalated');
      }

      interaction.escalationResolved = true;
      interaction.escalationResolvedAt = new Date();
      interaction.status = 'completed';
      
      // Add resolution notes to context metadata
      if (!interaction.context.metadata) {
        interaction.context.metadata = {};
      }
      interaction.context.metadata.resolution = {
        resolvedBy: adminId,
        resolvedAt: new Date(),
        notes: resolution
      };

      await interaction.save();

      logger.info('Escalation resolved', { eventId, adminId });

      return {
        success: true,
        interaction
      };
    } catch (error) {
      logger.error('Failed to resolve escalation', { eventId, adminId, error: error.message });
      throw error;
    }
  }

  /**
   * Get escalated interactions
   */
  async getEscalatedInteractions(filters = {}) {
    try {
      const query = {
        escalated: true,
        escalationResolved: filters.resolved === true ? true : filters.resolved === false ? false : { $exists: true }
      };

      if (filters.adminId) {
        query.escalatedTo = filters.adminId;
      }

      if (filters.priority) {
        // Priority is stored in aiAnalysis.riskLevel
        query['aiAnalysis.riskLevel'] = filters.priority;
      }

      if (filters.dateFrom || filters.dateTo) {
        query.escalatedAt = {};
        if (filters.dateFrom) query.escalatedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.escalatedAt.$lte = new Date(filters.dateTo);
      }

      const interactions = await AIBotInteraction.find(query)
        .sort({ escalatedAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .populate('context.userId', 'firstName lastName email')
        .populate('context.bookingId')
        .populate('escalatedTo', 'firstName lastName email');

      const total = await AIBotInteraction.countDocuments(query);

      return {
        interactions,
        total,
        page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
        totalPages: Math.ceil(total / (filters.limit || 50))
      };
    } catch (error) {
      logger.error('Failed to get escalated interactions', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AIBotService();
