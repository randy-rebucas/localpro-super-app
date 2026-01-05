/**
 * Quote & Invoice Service
 * 
 * Handles quotes, estimates, invoices, and digital signatures
 * References: Quote, QuoteTemplate, Invoice, Job
 */

const Quote = require('../models/Quote');
const QuoteTemplate = require('../models/QuoteTemplate');
const Invoice = require('../models/Invoice');
const Job = require('../models/Job');
const NotificationService = require('./notificationService');
const logger = require('../config/logger');

class QuoteInvoiceService {
  /**
   * Create quote from template
   */
  async createQuoteFromTemplate(jobId, providerId, templateId, customizations = {}) {
    try {
      const job = await Job.findById(jobId).populate('employer');
      if (!job) {
        throw new Error('Job not found');
      }

      const template = await QuoteTemplate.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const quoteNumber = await Quote.generateQuoteNumber();

      const quote = new Quote({
        job: jobId,
        provider: providerId,
        client: job.employer._id,
        quoteNumber: quoteNumber,
        template: templateId,
        title: customizations.title || template.name,
        description: customizations.description || template.description,
        items: customizations.items || template.items,
        labor: customizations.labor || template.labor,
        materials: customizations.materials || template.materials,
        tax: customizations.tax || template.tax,
        discount: customizations.discount || template.discount,
        currency: customizations.currency || template.currency,
        notes: customizations.notes || template.notes,
        terms: customizations.terms || template.terms,
        validityDays: customizations.validityDays || template.validityDays,
        status: 'draft'
      });

      await quote.calculateTotals();
      await quote.save();

      return quote;
    } catch (error) {
      logger.error('Error creating quote from template:', error);
      throw error;
    }
  }

  /**
   * Create custom quote
   */
  async createQuote(quoteData) {
    try {
      const quoteNumber = await Quote.generateQuoteNumber();
      const quote = new Quote({
        ...quoteData,
        quoteNumber: quoteNumber
      });

      await quote.calculateTotals();
      await quote.save();

      return quote;
    } catch (error) {
      logger.error('Error creating quote:', error);
      throw error;
    }
  }

  /**
   * Send quote to client
   */
  async sendQuote(quoteId, providerId) {
    try {
      const quote = await Quote.findById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.provider.toString() !== providerId) {
        throw new Error('Not authorized to send this quote');
      }

      quote.status = 'sent';
      quote.sentAt = new Date();
      await quote.save();

      // Send notification to client
      await NotificationService.sendNotification({
        userId: quote.client,
        type: 'quote_received',
        title: 'New Quote Received',
        message: `You have received a new quote: ${quote.title}`,
        data: { jobId: quote.job, quoteId: quote._id },
        priority: 'high'
      });

      return quote;
    } catch (error) {
      logger.error('Error sending quote:', error);
      throw error;
    }
  }

  /**
   * Approve quote with digital signature
   */
  async approveQuote(quoteId, clientId, digitalSignature = null, ipAddress = null, userAgent = null) {
    try {
      const quote = await Quote.findById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.client.toString() !== clientId) {
        throw new Error('Not authorized to approve this quote');
      }

      await quote.approve(clientId, digitalSignature, ipAddress, userAgent);

      // Send notification to provider
      await NotificationService.sendNotification({
        userId: quote.provider,
        type: 'quote_approved',
        title: 'Quote Approved',
        message: `Your quote has been approved: ${quote.title}`,
        data: { jobId: quote.job, quoteId: quote._id },
        priority: 'high'
      });

      return quote;
    } catch (error) {
      logger.error('Error approving quote:', error);
      throw error;
    }
  }

  /**
   * Reject quote
   */
  async rejectQuote(quoteId, clientId, rejectionReason) {
    try {
      const quote = await Quote.findById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.client.toString() !== clientId) {
        throw new Error('Not authorized to reject this quote');
      }

      await quote.reject(rejectionReason);

      // Send notification to provider
      await NotificationService.sendNotification({
        userId: quote.provider,
        type: 'quote_rejected',
        title: 'Quote Rejected',
        message: `Your quote has been rejected: ${quote.title}`,
        data: { jobId: quote.job, quoteId: quote._id, reason: rejectionReason },
        priority: 'medium'
      });

      return quote;
    } catch (error) {
      logger.error('Error rejecting quote:', error);
      throw error;
    }
  }

  /**
   * Generate invoice from quote
   */
  async generateInvoiceFromQuote(quoteId, jobData = {}) {
    try {
      const quote = await Quote.findById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.status !== 'approved') {
        throw new Error('Can only generate invoice from approved quotes');
      }

      const invoice = await Invoice.createFromQuote(quote, jobData);

      // Send notification to client
      await NotificationService.sendNotification({
        userId: invoice.client,
        type: 'invoice_generated',
        title: 'Invoice Generated',
        message: `An invoice has been generated for job: ${invoice.invoiceNumber}`,
        data: { jobId: invoice.job, invoiceId: invoice._id },
        priority: 'high'
      });

      return invoice;
    } catch (error) {
      logger.error('Error generating invoice from quote:', error);
      throw error;
    }
  }

  /**
   * Generate invoice from job data
   */
  async generateInvoiceFromJob(jobId, providerId, invoiceData) {
    try {
      const job = await Job.findById(jobId).populate('employer');
      if (!job) {
        throw new Error('Job not found');
      }

      const invoiceNumber = await Invoice.generateInvoiceNumber();

      const invoice = new Invoice({
        job: jobId,
        provider: providerId,
        client: job.employer._id,
        invoiceNumber: invoiceNumber,
        ...invoiceData,
        status: 'draft'
      });

      await invoice.calculateTotals();
      await invoice.save();

      return invoice;
    } catch (error) {
      logger.error('Error generating invoice from job:', error);
      throw error;
    }
  }

  /**
   * Send invoice
   */
  async sendInvoice(invoiceId, providerId) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.provider.toString() !== providerId) {
        throw new Error('Not authorized to send this invoice');
      }

      invoice.status = 'sent';
      invoice.sentAt = new Date();
      await invoice.save();

      // Send notification to client
      await NotificationService.sendNotification({
        userId: invoice.client,
        type: 'invoice_received',
        title: 'Invoice Received',
        message: `You have received an invoice: ${invoice.invoiceNumber}`,
        data: { jobId: invoice.job, invoiceId: invoice._id },
        priority: 'high'
      });

      return invoice;
    } catch (error) {
      logger.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId, paymentMethod, transactionId = null, reference = null) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      await invoice.markAsPaid(paymentMethod, transactionId, reference);

      // Send notification to provider
      await NotificationService.sendNotification({
        userId: invoice.provider,
        type: 'invoice_paid',
        title: 'Invoice Paid',
        message: `Invoice ${invoice.invoiceNumber} has been paid`,
        data: { jobId: invoice.job, invoiceId: invoice._id },
        priority: 'high'
      });

      return invoice;
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      throw error;
    }
  }
}

module.exports = new QuoteInvoiceService();
