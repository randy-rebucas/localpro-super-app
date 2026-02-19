// Email service for sending notifications
// Supports Resend, SendGrid API, and SMTP (including Hostinger)
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const templateEngine = require('../utils/templateEngine');
const logger = require('../config/logger');


class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@localpro.com';
    this.emailService = process.env.EMAIL_SERVICE || 'resend';
    
    // For SMTP, use SMTP_USER as from address if available (to match authenticated user)
    // This prevents "Sender address rejected: not owned by user" errors
    if (this.emailService === 'smtp' || this.emailService === 'hostinger') {
      if (process.env.SMTP_USER) {
        this.fromEmail = process.env.SMTP_USER;
      }
    }
    
    // Initialize email service based on configuration
    this.initializeEmailService();
  }

  /**
   * Initialize email service based on configuration
   */
  initializeEmailService() {
    switch (this.emailService) {
      case 'resend':
        if (process.env.RESEND_API_KEY) {
          this.resend = new Resend(process.env.RESEND_API_KEY);
        } else {
          logger.warn('RESEND_API_KEY not provided. Email service will use fallback mode.');
          this.resend = null;
        }
        break;
      case 'sendgrid':
        // SendGrid will be handled in sendViaSendGrid method
        break;
      case 'hostinger':
      case 'smtp':
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            },
            tls: {
              rejectUnauthorized: false // For development, set to true in production
            }
          });
        } else {
          logger.warn('SMTP credentials not provided. Email service will use fallback mode.');
          this.transporter = null;
        }
        break;
      default:
        logger.warn(`Unknown email service: ${this.emailService}. Using Resend as fallback.`);
        if (process.env.RESEND_API_KEY) {
          this.resend = new Resend(process.env.RESEND_API_KEY);
        } else {
          logger.warn('RESEND_API_KEY not provided. Email service will use fallback mode.');
          this.resend = null;
        }
    }
  }

  /**
   * Send welcome email to new user
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @returns {Promise<object>} Send result
   */
  async sendWelcomeEmail(to, firstName) {
    const subject = 'Welcome to LocalPro Super App!';
    
    try {
      const html = templateEngine.render('welcome', {
        firstName: firstName,
        subject: subject
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering welcome email template:', error);
      // Fallback to simple HTML
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome to LocalPro Super App!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for joining LocalPro Super App! We're excited to have you on board.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Send booking confirmation email
   * @param {string} to - Recipient email
   * @param {object} booking - Booking details
   * @returns {Promise<object>} Send result
   */
  async sendBookingConfirmation(to, booking) {
    const subject = 'Booking Confirmation - LocalPro';
    
    try {
      const html = templateEngine.render('booking-confirmation', {
        clientName: booking.client?.firstName || 'Valued Customer',
        serviceTitle: booking.service?.title || 'Service',
        serviceCategory: booking.service?.category || 'General',
        bookingDate: new Date(booking.bookingDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        bookingTime: new Date(booking.bookingDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: booking.duration || 1,
        totalAmount: booking.pricing?.totalAmount || 0,
        status: booking.status || 'confirmed',
        address: {
          street: booking.address?.street || '',
          city: booking.address?.city || '',
          state: booking.address?.state || '',
          zipCode: booking.address?.zipCode || '',
          country: booking.address?.country || ''
        },
        specialInstructions: booking.specialInstructions || '',
        providerName: booking.provider?.firstName + ' ' + booking.provider?.lastName || 'Service Provider',
        providerInitials: (booking.provider?.firstName?.[0] || 'P') + (booking.provider?.lastName?.[0] || 'P'),
        providerRating: booking.provider?.rating || '5.0',
        providerReviewCount: booking.provider?.reviewCount || '0',
        providerPhone: booking.provider?.phoneNumber || '',
        bookingId: booking._id || booking.id || '',
        subject: subject
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering booking confirmation template:', error);
      // Fallback to simple HTML
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Booking Confirmed!</h1>
          <p>Your booking has been confirmed. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Service:</strong> ${booking.service?.title || 'Service'}</p>
            <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> ${booking.duration || 1} hours</p>
            <p><strong>Total Amount:</strong> $${booking.pricing?.totalAmount || 0}</p>
          </div>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Send order confirmation email
   * @param {string} to - Recipient email
   * @param {object} order - Order details
   * @returns {Promise<object>} Send result
   */
  async sendOrderConfirmation(to, order) {
    const subject = 'Order Confirmation - LocalPro';
    
    try {
      const html = templateEngine.render('order-confirmation', {
        customerName: order.customer?.firstName || 'Valued Customer',
        orderNumber: order._id || order.id || '',
        orderDate: new Date(order.createdAt || new Date()).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        isSubscription: order.isSubscription || false,
        status: order.status || 'confirmed',
        totalAmount: order.totalAmount || 0,
        items: order.items?.map(item => ({
          productName: item.product?.name || 'Product',
          quantity: item.quantity || 1,
          itemTotal: (item.price || 0) * (item.quantity || 1),
          productImage: item.product?.images?.[0]?.url || ''
        })) || [],
        subscriptionDetails: order.subscriptionDetails ? {
          frequency: order.subscriptionDetails.frequency || 'monthly',
          nextDelivery: new Date(order.subscriptionDetails.nextDelivery || new Date()).toLocaleDateString(),
          isActive: order.subscriptionDetails.isActive || false
        } : null,
        subscriptionKit: order.subscriptionKit ? {
          name: order.subscriptionKit.name || 'Subscription Kit'
        } : null,
        shippingAddress: {
          name: order.shippingAddress?.name || order.customer?.firstName + ' ' + order.customer?.lastName || 'Customer',
          street: order.shippingAddress?.street || '',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          zipCode: order.shippingAddress?.zipCode || '',
          country: order.shippingAddress?.country || ''
        },
        estimatedDelivery: order.estimatedDelivery || '',
        orderId: order._id || order.id || '',
        subject: subject
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering order confirmation template:', error);
      // Fallback to simple HTML
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Order Confirmed!</h1>
          <p>Thank you for your order. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order._id || order.id || ''}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount || 0}</p>
            <p><strong>Status:</strong> ${order.status || 'confirmed'}</p>
          </div>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Send loan approval email
   * @param {string} to - Recipient email
   * @param {object} loan - Loan details
   * @returns {Promise<object>} Send result
   */
  async sendLoanApproval(to, loan) {
    const subject = 'Loan Approved - LocalPro Finance';
    
    try {
      const html = templateEngine.render('loan-approval', {
        borrowerName: loan.borrower?.firstName || 'Valued Customer',
        loanType: loan.type || 'Personal Loan',
        approvedAmount: loan.amount?.approved || 0,
        interestRate: loan.term?.interestRate || 0,
        loanDuration: loan.term?.duration || 12,
        monthlyPayment: loan.term?.monthlyPayment || 0,
        firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        loanPurpose: loan.purpose || 'General purpose',
        conditions: loan.approval?.conditions || [],
        paymentMethod: loan.paymentMethod || 'Bank Transfer',
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getDate(),
        lateFee: 25,
        loanId: loan._id || loan.id || '',
        notes: loan.approval?.notes || '',
        subject: subject
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering loan approval template:', error);
      // Fallback to simple HTML
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #27ae60;">Congratulations! Your loan has been approved.</h1>
          <p>We're pleased to inform you that your loan application has been approved.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Loan Details</h3>
            <p><strong>Loan Type:</strong> ${loan.type || 'Personal Loan'}</p>
            <p><strong>Approved Amount:</strong> $${loan.amount?.approved || 0}</p>
            <p><strong>Interest Rate:</strong> ${loan.term?.interestRate || 0}% per annum</p>
            <p><strong>Term:</strong> ${loan.term?.duration || 12} months</p>
          </div>
          <p>You will receive the disbursement within 2-3 business days.</p>
          <p>Best regards,<br>The LocalPro Finance Team</p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Generic email sending method
   * Supports two calling patterns:
   * 1. sendEmail(to, subject, html) - Direct HTML content
   * 2. sendEmail({ to, subject, template, data }) - Template-based
   * @param {string|object} toOrOptions - Recipient email (string) or options object
   * @param {string} subject - Email subject (if first param is string)
   * @param {string} html - Email HTML content (if first param is string)
   * @returns {Promise<object>} Send result
   */
  async sendEmail(toOrOptions, subject, html) {
    try {
      let to, finalSubject, finalHtml;

      // Detect calling pattern: object vs separate parameters
      if (typeof toOrOptions === 'object' && toOrOptions !== null && !Array.isArray(toOrOptions)) {
        // Pattern 2: sendEmail({ to, subject, template, data })
        const options = toOrOptions;
        to = options.to;
        finalSubject = options.subject;

        // If template is provided, render it; otherwise use html if provided
        if (options.template) {
          try {
            finalHtml = templateEngine.render(options.template, options.data || {});
          } catch (templateError) {
            logger.error(`Error rendering template '${options.template}':`, templateError);
            throw new Error(`Failed to render email template '${options.template}': ${templateError.message}`);
          }
        } else if (options.html) {
          finalHtml = options.html;
        } else {
          throw new Error('Either template or html must be provided');
        }
      } else {
        // Pattern 1: sendEmail(to, subject, html)
        to = toOrOptions;
        finalSubject = subject;
        finalHtml = html;
      }

      // Validate email address
      if (!to || typeof to !== 'string' || !to.trim()) {
        throw new Error('Invalid email address: recipient email is required and must be a string');
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedTo = to.trim();
      if (!emailRegex.test(normalizedTo)) {
        throw new Error(`Invalid email format: ${normalizedTo}`);
      }

      // Validate subject
      if (!finalSubject || typeof finalSubject !== 'string' || !finalSubject.trim()) {
        throw new Error('Email subject is required and must be a string');
      }

      // Validate HTML content
      if (!finalHtml || typeof finalHtml !== 'string') {
        throw new Error('Email HTML content is required and must be a string');
      }

      switch (this.emailService) {
        case 'resend':
          return await this.sendViaResend(normalizedTo, finalSubject.trim(), finalHtml);
        case 'sendgrid':
          return await this.sendViaSendGrid(normalizedTo, finalSubject.trim(), finalHtml);
        case 'hostinger':
        case 'smtp':
          return await this.sendViaSMTP(normalizedTo, finalSubject.trim(), finalHtml);
        default:
          throw new Error(`Unsupported email service: ${this.emailService}`);
      }
    } catch (error) {
      logger.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email via Resend API
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<object>} Send result
   */
  async sendViaResend(to, subject, html) {
    if (!this.resend) {
      throw new Error('Resend client not initialized. Check your RESEND_API_KEY.');
    }

    // Ensure 'to' is a valid string (should already be validated in sendEmail)
    if (!to || typeof to !== 'string') {
      throw new Error('Recipient email must be a valid string');
    }

    logger.info(`[Resend] Sending email to: ${to}`);
    logger.info(`[Resend] Subject: ${subject}`);

    // Resend accepts either a string or array of strings for 'to'
    // Using string directly as it's more efficient for single recipient
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: to, // Use string directly instead of array
      subject: subject,
      html: html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return {
      success: true,
      messageId: data.id,
      message: 'Email sent via Resend'
    };
  }

  /**
   * Send email via SendGrid API
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<object>} Send result
   */
  async sendViaSendGrid(_to, _subject, _html) {
    // SendGrid integration
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: _to,
      from: this.fromEmail,
      subject: _subject,
      html: _html,
    };
    try {
      const response = await sgMail.send(msg);
      return { success: true, messageId: response[0]?.headers['x-message-id'] || null, message: 'Email sent via SendGrid' };
    } catch (error) {
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  /**
   * Send email via SMTP (Hostinger, Gmail, etc.)
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<object>} Send result
   */
  async sendViaSMTP(to, subject, html) {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized. Check your SMTP configuration.');
    }

    // Use SMTP_USER as from address to match authenticated user
    // This prevents "Sender address rejected: not owned by user" errors
    // If FROM_EMAIL is different, use it as display name: "Display Name <email@domain.com>"
    const fromAddress = process.env.SMTP_USER || this.fromEmail;
    const fromEmail = this.fromEmail !== fromAddress 
      ? `LocalPro <${fromAddress}>` 
      : fromAddress;

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    };

    logger.info(`[SMTP] Sending email to: ${to}`);
    logger.info(`[SMTP] Subject: ${subject}`);

    const result = await this.transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email sent via SMTP'
    };
  }

  /**
   * Send job application notification to employer
   * @param {string} to - Employer email
   * @param {object} data - Application data
   * @returns {Promise<object>} Send result
   */
  async sendJobApplicationNotification(to, data) {
    try {
      const subject = `New Job Application - ${data.jobTitle}`;
      
      const templateData = {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/employer/dashboard`,
        website_url: process.env.FRONTEND_URL,
        support_url: `${process.env.FRONTEND_URL}/support`,
        privacy_url: `${process.env.FRONTEND_URL}/privacy`,
        terms_url: `${process.env.FRONTEND_URL}/terms`,
        facebook_url: process.env.FACEBOOK_URL || '#',
        twitter_url: process.env.TWITTER_URL || '#',
        linkedin_url: process.env.LINKEDIN_URL || '#',
        instagram_url: process.env.INSTAGRAM_URL || '#',
        current_year: new Date().getFullYear()
      };

      const html = await templateEngine.renderTemplate(
        'job-application-notification',
        templateData
      );

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error sending job application notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application status update to applicant
   * @param {string} to - Applicant email
   * @param {object} data - Status update data
   * @returns {Promise<object>} Send result
   */
  async sendApplicationStatusUpdate(to, data) {
    try {
      const subject = `Application Update - ${data.jobTitle}`;
      
      const templateData = {
        ...data,
        applicantName: data.applicantName || 'Applicant',
        jobs_url: `${process.env.FRONTEND_URL}/jobs`,
        website_url: process.env.FRONTEND_URL,
        support_url: `${process.env.FRONTEND_URL}/support`,
        privacy_url: `${process.env.FRONTEND_URL}/privacy`,
        terms_url: `${process.env.FRONTEND_URL}/terms`,
        facebook_url: process.env.FACEBOOK_URL || '#',
        twitter_url: process.env.TWITTER_URL || '#',
        linkedin_url: process.env.LINKEDIN_URL || '#',
        instagram_url: process.env.INSTAGRAM_URL || '#',
        current_year: new Date().getFullYear()
      };

      const html = await templateEngine.renderTemplate(
        'application-status-update',
        templateData
      );

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error sending application status update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send referral invitation email
   * @param {string} to - Recipient email
   * @param {object} data - Referral invitation data
   * @returns {Promise<object>} Send result
   */
  async sendReferralInvitation(to, data) {
    try {
      const subject = `${data.referrerName} invited you to join LocalPro!`;
      
      const templateData = {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
        website_url: process.env.FRONTEND_URL,
        support_url: `${process.env.FRONTEND_URL}/support`,
        privacy_url: `${process.env.FRONTEND_URL}/privacy`,
        terms_url: `${process.env.FRONTEND_URL}/terms`,
        facebook_url: process.env.FACEBOOK_URL || '#',
        twitter_url: process.env.TWITTER_URL || '#',
        linkedin_url: process.env.LINKEDIN_URL || '#',
        instagram_url: process.env.INSTAGRAM_URL || '#',
        current_year: new Date().getFullYear()
      };

      const html = await templateEngine.renderTemplate(
        'referral-invitation',
        templateData
      );

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error sending referral invitation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send referral reward notification email
   * @param {string} to - Recipient email
   * @param {object} data - Reward notification data
   * @returns {Promise<object>} Send result
   */
  async sendReferralRewardNotification(to, data) {
    try {
      const subject = `🎉 You earned $${data.rewardAmount} from your referral!`;
      
      const templateData = {
        ...data,
        dashboard_url: `${process.env.FRONTEND_URL}/referrals`,
        website_url: process.env.FRONTEND_URL,
        support_url: `${process.env.FRONTEND_URL}/support`,
        privacy_url: `${process.env.FRONTEND_URL}/privacy`,
        terms_url: `${process.env.FRONTEND_URL}/terms`,
        facebook_url: process.env.FACEBOOK_URL || '#',
        twitter_url: process.env.TWITTER_URL || '#',
        linkedin_url: process.env.LINKEDIN_URL || '#',
        instagram_url: process.env.INSTAGRAM_URL || '#',
        current_year: new Date().getFullYear()
      };

      const html = await templateEngine.renderTemplate(
        'referral-reward-notification',
        templateData
      );

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error sending referral reward notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email OTP (One-Time Password) for authentication
   * @param {string} to - Recipient email
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} firstName - User's first name (optional)
   * @returns {Promise<object>} Send result
   */
  async sendEmailOTP(to, otpCode, firstName = 'User') {
    const subject = 'Your LocalPro Verification Code';
    
    try {
      // Try to use template engine first
      const html = await templateEngine.renderTemplate('email-otp', {
        firstName,
        otpCode,
        subject,
        expiresIn: '10 minutes'
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering email OTP template:', error);
      // Fallback to simple HTML
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Verification Code</h1>
            <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
              Hi ${firstName},
            </p>
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              Your verification code is:
            </p>
            <div style="background-color: #ffffff; border: 2px solid #3498db; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h1 style="color: #3498db; font-size: 48px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${otpCode}
              </h1>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 30px;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #888; font-size: 14px; margin-top: 10px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} LocalPro Super App. All rights reserved.
          </p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Send password reset email with temporary password
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} tempPassword - Temporary password
   * @returns {Promise<object>} Send result
   */
  async sendPasswordResetEmail(to, firstName, tempPassword) {
    const subject = 'Your Password Has Been Reset - LocalPro';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset</h1>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Hi ${firstName},
          </p>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Your password has been reset by an administrator. Please use the following temporary password to log in:
          </p>
          <div style="background-color: #ffffff; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #555; font-size: 14px; margin-bottom: 10px;">Temporary Password:</p>
            <h2 style="color: #e74c3c; font-size: 24px; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">
              ${tempPassword}
            </h2>
          </div>
          <p style="color: #e74c3c; font-size: 14px; margin-top: 20px; font-weight: bold;">
            ⚠️ Please change this password immediately after logging in for security.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, please contact support immediately.
          </p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send account activated notification email
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @returns {Promise<object>} Send result
   */
  async sendAccountActivatedEmail(to, firstName) {
    const subject = 'Account Activated - LocalPro';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
          <h1 style="color: #27ae60; margin-bottom: 20px;">Account Activated</h1>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Hi ${firstName},
          </p>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Great news! Your LocalPro Super App account has been activated.
          </p>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            You can now access all features and services on our platform.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://localpro.com'}/login" 
               style="background-color: #27ae60; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Log In to Your Account
            </a>
          </div>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send account deactivated notification email
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} reason - Deactivation reason (optional)
   * @returns {Promise<object>} Send result
   */
  async sendAccountDeactivatedEmail(to, firstName, reason) {
    const subject = 'Account Deactivated - LocalPro';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
          <h1 style="color: #e74c3c; margin-bottom: 20px;">Account Deactivated</h1>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Hi ${firstName},
          </p>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Your LocalPro Super App account has been deactivated.
          </p>
          ${reason ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            If you believe this is an error or would like to reactivate your account, please contact our support team.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 10px;">
            <a href="${process.env.FRONTEND_URL || 'https://localpro.com'}/support" style="color: #3498db;">Contact Support</a>
          </p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send account banned notification email
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} reason - Ban reason
   * @returns {Promise<object>} Send result
   */
  async sendAccountBannedEmail(to, firstName, reason) {
    const subject = 'Account Banned - LocalPro';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
          <h1 style="color: #e74c3c; margin-bottom: 20px;">Account Banned</h1>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Hi ${firstName},
          </p>
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
            Your account has been banned from LocalPro Super App.
          </p>
          ${reason ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    `;
    
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send templated email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} template - Template name
   * @param {object} data - Template data
   * @returns {Promise<object>} Send result
   */
  async sendTemplatedEmail(to, subject, template, data = {}) {
    try {
      const html = await templateEngine.renderTemplate(template, data);
      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Error rendering email template:', error);
      // Fallback to plain message if template fails
      const fallbackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>${data.message || 'Please check the email content.'}</p>
        </div>
      `;
      return await this.sendEmail(to, subject, fallbackHtml);
    }
  }

  /**
   * Test email configuration
   * @returns {Promise<object>} Test result
   */
  async testConnection() {
    try {
      switch (this.emailService) {
        case 'resend':
          if (!this.resend) {
            throw new Error('Resend client not initialized. Check your RESEND_API_KEY.');
          }
          return { success: true, message: 'Resend configuration ready' };
        case 'sendgrid':
          return { success: true, message: 'SendGrid configuration ready' };
        case 'hostinger':
        case 'smtp':
          if (!this.transporter) {
            throw new Error('SMTP transporter not initialized. Check your SMTP configuration.');
          }
          await this.transporter.verify();
          return { success: true, message: 'SMTP connection verified' };
        default:
          throw new Error(`Unknown email service: ${this.emailService}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
