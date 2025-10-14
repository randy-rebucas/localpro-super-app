// Email service for sending notifications
// This is a placeholder implementation - integrate with your preferred email service

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@localpro.com';
    this.apiKey = process.env.SENDGRID_API_KEY;
  }

  /**
   * Send welcome email to new user
   * @param {string} to - Recipient email
   * @param {string} firstName - User's first name
   * @returns {Promise<object>} Send result
   */
  async sendWelcomeEmail(to, firstName) {
    const subject = 'Welcome to LocalPro Super App!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">Welcome to LocalPro Super App!</h1>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining LocalPro Super App! We're excited to have you on board.</p>
        <p>With LocalPro, you can:</p>
        <ul>
          <li>Find and book local services (cleaning, plumbing, electrical, moving)</li>
          <li>Order supplies and materials with subscription kits</li>
          <li>Access training courses and certifications</li>
          <li>Apply for salary advances and micro-loans</li>
          <li>Rent tools and vehicles</li>
          <li>And much more!</li>
        </ul>
        <p>Get started by exploring our marketplace or completing your profile.</p>
        <p>Best regards,<br>The LocalPro Team</p>
      </div>
    `;

    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send booking confirmation email
   * @param {string} to - Recipient email
   * @param {object} booking - Booking details
   * @returns {Promise<object>} Send result
   */
  async sendBookingConfirmation(to, booking) {
    const subject = 'Booking Confirmation - LocalPro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">Booking Confirmed!</h1>
        <p>Your booking has been confirmed. Here are the details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Service:</strong> ${booking.service.title}</p>
          <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
          <p><strong>Duration:</strong> ${booking.duration} hours</p>
          <p><strong>Total Amount:</strong> $${booking.pricing.totalAmount}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${booking.address.city}</p>
        </div>
        <p>We'll send you a reminder before your scheduled service.</p>
        <p>Best regards,<br>The LocalPro Team</p>
      </div>
    `;

    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send order confirmation email
   * @param {string} to - Recipient email
   * @param {object} order - Order details
   * @returns {Promise<object>} Send result
   */
  async sendOrderConfirmation(to, order) {
    const subject = 'Order Confirmation - LocalPro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">Order Confirmed!</h1>
        <p>Thank you for your order. Here are the details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order._id}</p>
          <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Shipping Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
        </div>
        <p>We'll notify you when your order ships.</p>
        <p>Best regards,<br>The LocalPro Team</p>
      </div>
    `;

    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send loan approval email
   * @param {string} to - Recipient email
   * @param {object} loan - Loan details
   * @returns {Promise<object>} Send result
   */
  async sendLoanApproval(to, loan) {
    const subject = 'Loan Approved - LocalPro Finance';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #27ae60;">Congratulations! Your loan has been approved.</h1>
        <p>We're pleased to inform you that your loan application has been approved.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Loan Details</h3>
          <p><strong>Loan Type:</strong> ${loan.type}</p>
          <p><strong>Approved Amount:</strong> $${loan.amount.approved}</p>
          <p><strong>Interest Rate:</strong> ${loan.term.interestRate}% per annum</p>
          <p><strong>Term:</strong> ${loan.term.duration} months</p>
          <p><strong>Monthly Payment:</strong> $${loan.term.monthlyPayment || 'TBD'}</p>
        </div>
        <p>You will receive the disbursement within 2-3 business days.</p>
        <p>Best regards,<br>The LocalPro Finance Team</p>
      </div>
    `;

    return await this.sendEmail(to, subject, html);
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
      // This is a placeholder implementation
      // Replace with your actual email service integration (SendGrid, Mailgun, etc.)
      
      console.log(`Sending email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html.substring(0, 100)}...`);

      // Simulate email sending
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
