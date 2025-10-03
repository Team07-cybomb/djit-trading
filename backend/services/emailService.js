const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(mailOptions) {
    try {
      const result = await this.transporter.sendMail({
        from: `"TradeMaster Pro" <${process.env.EMAIL_USER}>`,
        ...mailOptions
      });
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendWelcomeEmail({ to, userName }) {
    const subject = 'Welcome to TradeMaster Pro!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome to TradeMaster Pro, ${userName}! 🎉</h2>
        <p>We're excited to have you on board. Your account has been successfully created.</p>
        <p>Start your trading journey by exploring our courses:</p>
        <ul>
          <li>Beginner-friendly courses to get you started</li>
          <li>Advanced strategies for experienced traders</li>
          <li>Live trading sessions with experts</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <br>
        <p>Happy Trading!<br>The TradeMaster Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendPaymentConfirmation({ to, userName, courseName, amount, paymentDate }) {
    const subject = 'Payment Confirmation - TradeMaster Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Payment Confirmed! ✅</h2>
        <p>Dear ${userName},</p>
        <p>Your payment for the course <strong>"${courseName}"</strong> has been successfully processed.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount Paid:</strong> ₹${amount}</p>
          <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
          <p><strong>Course:</strong> ${courseName}</p>
        </div>
        <p>You can now access the course from your dashboard. Start learning immediately!</p>
        <br>
        <p>Happy Learning!<br>The TradeMaster Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendRefundConfirmation({ to, userName, courseName, amount, refundDate }) {
    const subject = 'Refund Processed - TradeMaster Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Refund Processed</h2>
        <p>Dear ${userName},</p>
        <p>Your refund for the course <strong>"${courseName}"</strong> has been processed successfully.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Refund Amount:</strong> ₹${amount}</p>
          <p><strong>Refund Date:</strong> ${new Date(refundDate).toLocaleDateString()}</p>
          <p><strong>Course:</strong> ${courseName}</p>
        </div>
        <p>The amount should reflect in your account within 5-7 business days.</p>
        <br>
        <p>Best Regards,<br>The TradeMaster Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendCourseCompletion({ to, userName, courseName, completionDate }) {
    const subject = 'Course Completion - TradeMaster Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9b59b6;">Congratulations! 🎓</h2>
        <p>Dear ${userName},</p>
        <p>Congratulations on successfully completing the course <strong>"${courseName}"</strong>!</p>
        <p>Your certificate is now available for download from your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; display: inline-block;">
            <h3 style="margin: 0;">Certificate of Completion</h3>
            <p style="margin: 10px 0 0 0;">${courseName}</p>
          </div>
        </div>
        <p>Keep up the great work and continue your learning journey with our other advanced courses!</p>
        <br>
        <p>Best Regards,<br>The TradeMaster Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendNewsletter({ to, subject, content }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">${subject}</h2>
        <div>${content}</div>
        <br>
        <hr>
        <p style="color: #7f8c8d; font-size: 12px;">
          You're receiving this email because you subscribed to TradeMaster Pro newsletter.<br>
          <a href="${process.env.CLIENT_URL}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }
}

module.exports = new EmailService();