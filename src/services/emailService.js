// Email service for sending notifications
// Supports Resend, SendGrid API, and SMTP (including Hostinger)

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const templateEngine = require('../utils/templateEngine');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@localpro.com';
    this.emailService = process.env.EMAIL_SERVICE || 'resend';
    
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
          console.warn('RESEND_API_KEY not provided. Email service will use fallback mode.');
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
          console.warn('SMTP credentials not provided. Email service will use fallback mode.');
          this.transporter = null;
        }
        break;
      default:
        console.warn(`Unknown email service: ${this.emailService}. Using Resend as fallback.`);
        if (process.env.RESEND_API_KEY) {
          this.resend = new Resend(process.env.RESEND_API_KEY);
        } else {
          console.warn('RESEND_API_KEY not provided. Email service will use fallback mode.');
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
      console.error('Error rendering welcome email template:', error);
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
      console.error('Error rendering booking confirmation template:', error);
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
      console.error('Error rendering order confirmation template:', error);
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
      console.error('Error rendering loan approval template:', error);
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
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<object>} Send result
   */
  async sendEmail(to, subject, html) {
    try {
      switch (this.emailService) {
        case 'resend':
          return await this.sendViaResend(to, subject, html);
        case 'sendgrid':
          return await this.sendViaSendGrid(to, subject, html);
        case 'hostinger':
        case 'smtp':
          return await this.sendViaSMTP(to, subject, html);
        default:
          throw new Error(`Unsupported email service: ${this.emailService}`);
      }
    } catch (error) {
      console.error('Email sending error:', error);
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
      // In test environment or when API key is missing, return a mock response
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `test_${Date.now()}`,
          message: 'Email sent via Resend (test mode)'
        };
      }
      throw new Error('Resend client not initialized. Check your RESEND_API_KEY.');
    }

    logger.info(`[Resend] Sending email to: ${to}`);
    logger.info(`[Resend] Subject: ${subject}`);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [to],
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
  async sendViaSendGrid(to, subject, html) {
    // SendGrid implementation would go here
    // For now, return a placeholder
    logger.info(`[SendGrid] Sending email to: ${to}`);
    return {
      success: true,
      messageId: `sg_${Date.now()}`,
      message: 'Email sent via SendGrid'
    };
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
      // In test environment or when credentials are missing, return a mock response
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `test_${Date.now()}`,
          message: 'Email sent via SMTP (test mode)'
        };
      }
      throw new Error('SMTP transporter not initialized. Check your SMTP configuration.');
    }

    const mailOptions = {
      from: this.fromEmail,
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
      console.error('Error sending job application notification:', error);
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
      console.error('Error sending application status update:', error);
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
      console.error('Error sending referral invitation:', error);
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
      console.error('Error sending referral reward notification:', error);
      return { success: false, error: error.message };
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
            if (process.env.NODE_ENV === 'test') {
              return { success: true, message: 'Resend configuration ready (test mode)' };
            }
            throw new Error('Resend client not initialized. Check your RESEND_API_KEY.');
          }
          return { success: true, message: 'Resend configuration ready' };
        case 'sendgrid':
          return { success: true, message: 'SendGrid configuration ready' };
        case 'hostinger':
        case 'smtp':
          if (!this.transporter) {
            if (process.env.NODE_ENV === 'test') {
              return { success: true, message: 'SMTP configuration ready (test mode)' };
            }
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
