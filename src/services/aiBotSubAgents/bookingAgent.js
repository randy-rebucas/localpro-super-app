/**
 * Booking Sub-Agent
 * 
 * Handles booking-related operations: creation, updates, cancellations, scheduling
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');

class BookingAgent extends BaseSubAgent {
  constructor() {
    super('booking_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Booking agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      switch (event.type) {
        case 'booking_created':
          return await this.handleBookingCreated(interaction, event, actions, workflows);
        
        case 'booking_updated':
          return await this.handleBookingUpdated(interaction, event, actions, workflows);
        
        case 'booking_cancelled':
          return await this.handleBookingCancelled(interaction, event, actions, workflows);
        
        default:
          return await this.handleGenericBookingEvent(interaction, event, actions, workflows);
      }
    } catch (error) {
      logger.error('Booking agent processing failed', {
        eventId: interaction.eventId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        actions: []
      };
    }
  }

  async handleBookingCreated(interaction, event, actions, workflows) {
    const bookingId = event.data?.bookingId || event.context?.bookingId;
    
    if (!bookingId) {
      return {
        success: false,
        error: 'Booking ID required',
        actions: []
      };
    }

    // Trigger booking reminders workflow
    workflows.push({
      name: 'booking-reminders',
      workflowId: 'booking-reminders',
      data: {
        bookingId,
        eventType: 'booking_created',
        timestamp: new Date().toISOString()
      }
    });

    actions.push({
      action: 'trigger_booking_reminders',
      result: { success: true, bookingId }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Booking created and reminders scheduled',
        bookingId
      }
    };
  }

  async handleBookingUpdated(interaction, event, actions, workflows) {
    const bookingId = event.data?.bookingId || event.context?.bookingId;
    const status = event.data?.status;

    if (!bookingId) {
      return {
        success: false,
        error: 'Booking ID required',
        actions: []
      };
    }

    // If booking is confirmed, trigger confirmation workflow
    if (status === 'confirmed') {
      workflows.push({
        name: 'booking-reminders',
        workflowId: 'booking-reminders',
        data: {
          bookingId,
          eventType: 'booking_confirmed',
          status: 'confirmed'
        }
      });
    }

    actions.push({
      action: 'update_booking_status',
      result: { success: true, bookingId, status }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Booking updated',
        bookingId,
        status
      }
    };
  }

  async handleBookingCancelled(interaction, event, actions, workflows) {
    const bookingId = event.data?.bookingId || event.context?.bookingId;

    if (!bookingId) {
      return {
        success: false,
        error: 'Booking ID required',
        actions: []
      };
    }

    // Handle cancellation - may need to process refunds, notify parties, etc.
    actions.push({
      action: 'process_booking_cancellation',
      result: { success: true, bookingId }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Booking cancellation processed',
        bookingId
      }
    };
  }

  async handleGenericBookingEvent(interaction, event, actions, workflows) {
    actions.push({
      action: 'log_booking_event',
      result: { success: true, eventType: event.type }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Booking event processed',
        eventType: event.type
      }
    };
  }

  async shouldEscalate(event, _intentResult) {
    // Escalate high-value cancellations or disputes
    if (event.type === 'booking_cancelled' && event.data?.totalAmount > 1000) {
      return {
        required: true,
        reason: 'High-value booking cancellation requires review',
        priority: 'medium'
      };
    }

    return { required: false };
  }
}

module.exports = BookingAgent;
