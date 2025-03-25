require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function testSendGrid() {
  try {
    console.log('Testing SendGrid configuration...');
    console.log('API Key:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
    console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.SENDGRID_FROM_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Filmila SendGrid Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Test Email</h1>
          <p>This is a test email from Filmila using SendGrid.</p>
          <p>If you received this email, the SendGrid configuration is working correctly.</p>
        </div>
      `
    };

    console.log('Sending test email...');
    const response = await sgMail.send(msg);
    console.log('Test email sent successfully:', response[0].statusCode);
    process.exit(0);
  } catch (error) {
    console.error('SendGrid test failed:', error);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    process.exit(1);
  }
}

testSendGrid();
