const nodemailer = require('nodemailer');
const { Pool } = require('pg');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.templates = {
      verification: {
        subject: 'Verify your Filmila account',
        html: (token) => `
          <h1>Welcome to Filmila!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${process.env.APP_URL}/verify-email/${token}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      },
      passwordReset: {
        subject: 'Reset your Filmila password',
        html: (token) => `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.APP_URL}/reset-password/${token}">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      }
    };
  }

  async sendVerificationEmail(email, token) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: this.templates.verification.subject,
        html: this.templates.verification.html(token)
      });

      await this.logEmailSent('verification', email);
    } catch (error) {
      console.error('Verification email error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, token) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: this.templates.passwordReset.subject,
        html: this.templates.passwordReset.html(token)
      });

      await this.logEmailSent('password_reset', email);
    } catch (error) {
      console.error('Password reset email error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async logEmailSent(type, email) {
    const query = `
      INSERT INTO email_logs (type, recipient, sent_at)
      VALUES ($1, $2, NOW())
    `;
    await this.pool.query(query, [type, email]);
  }

  async checkEmailLimit(email, type, timeWindow = '1 hour') {
    const query = `
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE recipient = $1
        AND type = $2
        AND sent_at > NOW() - $3::interval
    `;
    
    const result = await this.pool.query(query, [email, type, timeWindow]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new EmailService();
