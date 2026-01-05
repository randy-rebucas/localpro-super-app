const express = require('express');
const { auth } = require('../middleware/auth');
const {
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
} = require('../controllers/quoteInvoiceController');

const router = express.Router();

/**
 * @swagger
 * /api/quotes/from-template/{templateId}:
 *   post:
 *     summary: Create quote from template
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/from-template/:templateId', auth, createQuoteFromTemplate);

/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Create custom quote
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, createQuote);

/**
 * @swagger
 * /api/quotes/job/{jobId}:
 *   get:
 *     summary: Get quotes for job
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/job/:jobId', auth, getQuotesByJob);

/**
 * @swagger
 * /api/quotes/{id}:
 *   get:
 *     summary: Get quote by ID
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, getQuote);

/**
 * @swagger
 * /api/quotes/{id}/send:
 *   post:
 *     summary: Send quote to client
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/send', auth, sendQuote);

/**
 * @swagger
 * /api/quotes/{id}/approve:
 *   post:
 *     summary: Approve quote with digital signature
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/approve', auth, approveQuote);

/**
 * @swagger
 * /api/quotes/{id}/reject:
 *   post:
 *     summary: Reject quote
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reject', auth, rejectQuote);

/**
 * @swagger
 * /api/quotes/templates:
 *   post:
 *     summary: Create quote template
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/templates', auth, createQuoteTemplate);

/**
 * @swagger
 * /api/quotes/templates:
 *   get:
 *     summary: Get quote templates
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/templates', auth, getQuoteTemplates);

/**
 * @swagger
 * /api/invoices/from-quote/{quoteId}:
 *   post:
 *     summary: Generate invoice from quote
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/from-quote/:quoteId', auth, generateInvoiceFromQuote);

/**
 * @swagger
 * /api/invoices/from-job/{jobId}:
 *   post:
 *     summary: Generate invoice from job data
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/from-job/:jobId', auth, generateInvoiceFromJob);

/**
 * @swagger
 * /api/invoices/job/{jobId}:
 *   get:
 *     summary: Get invoices for job
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/job/:jobId', auth, getInvoicesByJob);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, getInvoice);

/**
 * @swagger
 * /api/invoices/{id}/send:
 *   post:
 *     summary: Send invoice
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/send', auth, sendInvoice);

/**
 * @swagger
 * /api/invoices/{id}/mark-paid:
 *   put:
 *     summary: Mark invoice as paid
 *     tags: [Quotes & Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/mark-paid', auth, markInvoicePaid);

module.exports = router;
