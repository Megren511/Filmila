const nodemailer = require('nodemailer');
const EmailLog = require('../models/emailLog.model');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log email
      await EmailLog.create({
        recipient: to,
        subject,
        messageId: info.messageId,
        status: 'sent'
      });

      return info;
    } catch (error) {
      console.error('Email sending error:', error);

      // Log failed attempt
      await EmailLog.create({
        recipient: to,
        subject,
        error: error.message,
        status: 'failed'
      });

      throw error;
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const html = `
      <h1>Welcome to Filmila!</h1>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          background-color: #4A5568;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 16px 0;
        ">Verify Email</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account on Filmila, please ignore this email.</p>
    `;

    return this.sendEmail(email, 'Verify Your Filmila Account', html);
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const html = `
      <h1>Reset Your Password</h1>
      <p>You requested to reset your password. Click the link below to create a new password:</p>
      <p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background-color: #4A5568;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 16px 0;
        ">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `;

    return this.sendEmail(email, 'Reset Your Filmila Password', html);
  }

  async sendWelcomeEmail(email, name) {
    const html = `
      <h1>Welcome to Filmila, ${name}!</h1>
      <p>We're excited to have you join our community of filmmakers and film enthusiasts.</p>
      <h2>Getting Started</h2>
      <ul>
        <li>Browse our collection of unique short films</li>
        <li>Support filmmakers through our pay-per-view model</li>
        <li>Connect with other film enthusiasts</li>
        <li>Track your favorite films and filmmakers</li>
      </ul>
      <p>
        <a href="${process.env.FRONTEND_URL}/explore" style="
          display: inline-block;
          background-color: #4A5568;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 16px 0;
        ">Start Exploring</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;

    return this.sendEmail(email, 'Welcome to Filmila!', html);
  }

  async sendLoginNotificationEmail(email, deviceInfo, location) {
    const html = `
      <h1>New Login Detected</h1>
      <p>We detected a new login to your Filmila account:</p>
      <ul>
        <li>Device: ${deviceInfo}</li>
        <li>Location: ${location}</li>
        <li>Time: ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this wasn't you, please secure your account immediately:</p>
      <p>
        <a href="${process.env.FRONTEND_URL}/account/security" style="
          display: inline-block;
          background-color: #E53E3E;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 16px 0;
        ">Secure Account</a>
      </p>
    `;

    return this.sendEmail(email, 'New Login to Your Filmila Account', html);
  }
}

module.exports = new EmailService();
