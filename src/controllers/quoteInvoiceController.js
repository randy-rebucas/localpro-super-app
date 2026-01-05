const QuoteInvoiceService = require('../services/quoteInvoiceService');
const Quote = require('../models/Quote');
const QuoteTemplate = require('../models/QuoteTemplate');
const Invoice = require('../models/Invoice');
const logger = require('../config/logger');
const { 
  validateObjectId
} = require('../utils/controllerValidation');
const { 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError
} = require('../utils/responseHelper');

// @desc    Create quote from template
// @route   POST /api/quotes/from-template/:templateId
// @access  Private
const createQuoteFromTemplate = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { templateId } = req.params;
    const { jobId, ...customizations } = req.body;

    if (!validateObjectId(templateId).isValid) {
      return sendValidationError(res, ['Invalid template ID']);
    }

    if (!jobId || !validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Valid jobId is required']);
    }

    const quote = await QuoteInvoiceService.createQuoteFromTemplate(jobId, providerId, templateId, customizations);

    return sendSuccess(res, quote, 'Quote created from template successfully', 201);
  } catch (error) {
    logger.error('Error creating quote from template:', error);
    if (error.message.includes('not found')) {
      return sendNotFoundError(res, error.message);
    }
    return sendServerError(res, 'Failed to create quote from template');
  }
};

// @desc    Create custom quote
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res) => {
  try {
    const providerId = req.user.id;
    const quoteData = {
      ...req.body,
      provider: providerId
    };

    if (!quoteData.job || !validateObjectId(quoteData.job).isValid) {
      return sendValidationError(res, ['Valid job ID is required']);
    }

    const quote = await QuoteInvoiceService.createQuote(quoteData);

    return sendSuccess(res, quote, 'Quote created successfully', 201);
  } catch (error) {
    logger.error('Error creating quote:', error);
    return sendServerError(res, 'Failed to create quote');
  }
};

// @desc    Get quotes for job
// @route   GET /api/quotes/job/:jobId
// @access  Private
const getQuotesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const quotes = await Quote.findByJob(jobId);

    return sendSuccess(res, quotes);
  } catch (error) {
    logger.error('Error getting quotes:', error);
    return sendServerError(res, 'Failed to get quotes');
  }
};

// @desc    Get quote by ID
// @route   GET /api/quotes/:id
// @access  Private
const getQuote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid quote ID']);
    }

    const quote = await Quote.findById(id);

    if (!quote) {
      return sendNotFoundError(res, 'Quote not found');
    }

    return sendSuccess(res, quote);
  } catch (error) {
    logger.error('Error getting quote:', error);
    return sendServerError(res, 'Failed to get quote');
  }
};

// @desc    Send quote
// @route   POST /api/quotes/:id/send
// @access  Private
const sendQuote = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid quote ID']);
    }

    const quote = await QuoteInvoiceService.sendQuote(id, providerId);

    return sendSuccess(res, quote, 'Quote sent successfully');
  } catch (error) {
    logger.error('Error sending quote:', error);
    if (error.message.includes('Not authorized')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to send quote');
  }
};

// @desc    Approve quote
// @route   POST /api/quotes/:id/approve
// @access  Private
const approveQuote = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;
    const { digitalSignature } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid quote ID']);
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const quote = await QuoteInvoiceService.approveQuote(id, clientId, digitalSignature, ipAddress, userAgent);

    return sendSuccess(res, quote, 'Quote approved successfully');
  } catch (error) {
    logger.error('Error approving quote:', error);
    if (error.message.includes('Not authorized')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to approve quote');
  }
};

// @desc    Reject quote
// @route   POST /api/quotes/:id/reject
// @access  Private
const rejectQuote = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid quote ID']);
    }

    if (!rejectionReason) {
      return sendValidationError(res, ['rejectionReason is required']);
    }

    const quote = await QuoteInvoiceService.rejectQuote(id, clientId, rejectionReason);

    return sendSuccess(res, quote, 'Quote rejected');
  } catch (error) {
    logger.error('Error rejecting quote:', error);
    if (error.message.includes('Not authorized')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to reject quote');
  }
};

// @desc    Create quote template
// @route   POST /api/quotes/templates
// @access  Private
const createQuoteTemplate = async (req, res) => {
  try {
    const providerId = req.user.id;
    const templateData = {
      ...req.body,
      provider: providerId
    };

    const template = new QuoteTemplate(templateData);
    await template.calculateTotals();
    await template.save();

    return sendSuccess(res, template, 'Quote template created successfully', 201);
  } catch (error) {
    logger.error('Error creating quote template:', error);
    return sendServerError(res, 'Failed to create quote template');
  }
};

// @desc    Get quote templates
// @route   GET /api/quotes/templates
// @access  Private
const getQuoteTemplates = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { serviceType } = req.query;

    let templates;
    if (serviceType) {
      templates = await QuoteTemplate.findByServiceType(serviceType);
    } else {
      templates = await QuoteTemplate.findByProvider(providerId);
    }

    return sendSuccess(res, templates);
  } catch (error) {
    logger.error('Error getting quote templates:', error);
    return sendServerError(res, 'Failed to get quote templates');
  }
};

// @desc    Generate invoice from quote
// @route   POST /api/invoices/from-quote/:quoteId
// @access  Private
const generateInvoiceFromQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const jobData = req.body;

    if (!validateObjectId(quoteId).isValid) {
      return sendValidationError(res, ['Invalid quote ID']);
    }

    const invoice = await QuoteInvoiceService.generateInvoiceFromQuote(quoteId, jobData);

    return sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (error) {
    logger.error('Error generating invoice:', error);
    if (error.message.includes('not found') || error.message.includes('only generate')) {
      return sendValidationError(res, [error.message]);
    }
    return sendServerError(res, 'Failed to generate invoice');
  }
};

// @desc    Generate invoice from job
// @route   POST /api/invoices/from-job/:jobId
// @access  Private
const generateInvoiceFromJob = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.params;
    const invoiceData = req.body;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const invoice = await QuoteInvoiceService.generateInvoiceFromJob(jobId, providerId, invoiceData);

    return sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (error) {
    logger.error('Error generating invoice:', error);
    return sendServerError(res, 'Failed to generate invoice');
  }
};

// @desc    Get invoices for job
// @route   GET /api/invoices/job/:jobId
// @access  Private
const getInvoicesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!validateObjectId(jobId).isValid) {
      return sendValidationError(res, ['Invalid job ID']);
    }

    const invoices = await Invoice.findByJob(jobId);

    return sendSuccess(res, invoices);
  } catch (error) {
    logger.error('Error getting invoices:', error);
    return sendServerError(res, 'Failed to get invoices');
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid invoice ID']);
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return sendNotFoundError(res, 'Invoice not found');
    }

    return sendSuccess(res, invoice);
  } catch (error) {
    logger.error('Error getting invoice:', error);
    return sendServerError(res, 'Failed to get invoice');
  }
};

// @desc    Send invoice
// @route   POST /api/invoices/:id/send
// @access  Private
const sendInvoice = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid invoice ID']);
    }

    const invoice = await QuoteInvoiceService.sendInvoice(id, providerId);

    return sendSuccess(res, invoice, 'Invoice sent successfully');
  } catch (error) {
    logger.error('Error sending invoice:', error);
    return sendServerError(res, 'Failed to send invoice');
  }
};

// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/mark-paid
// @access  Private
const markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, reference } = req.body;

    if (!validateObjectId(id).isValid) {
      return sendValidationError(res, ['Invalid invoice ID']);
    }

    if (!paymentMethod) {
      return sendValidationError(res, ['paymentMethod is required']);
    }

    const invoice = await QuoteInvoiceService.markInvoicePaid(id, paymentMethod, transactionId, reference);

    return sendSuccess(res, invoice, 'Invoice marked as paid successfully');
  } catch (error) {
    logger.error('Error marking invoice as paid:', error);
    return sendServerError(res, 'Failed to mark invoice as paid');
  }
};

module.exports = {
  createQuoteFromTemplate,
  createQuote,
  getQuotesByJob,
  getQuote,
  sendQuote,
  approveQuote,
  rejectQuote,
  createQuoteTemplate,
  getQuoteTemplates,
  generateInvoiceFromQuote,
  generateInvoiceFromJob,
  getInvoicesByJob,
  getInvoice,
  sendInvoice,
  markInvoicePaid
};
