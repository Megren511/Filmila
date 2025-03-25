require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('Email service:', process.env.EMAIL_SERVICE);
    console.log('Email user:', process.env.EMAIL_USER);
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('Created transporter, verifying...');
    await transporter.verify();
    console.log('Transporter verified successfully');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Filmila Email Test',
      html: '<h1>Test Email</h1><p>This is a test email from Filmila.</p>'
    });

    console.log('Test email sent successfully:', info);
    process.exit(0);
  } catch (error) {
    console.error('Email test failed:', error);
    process.exit(1);
  }
}

testEmail();
