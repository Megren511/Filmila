require('dotenv').config();
const Mailjet = require('node-mailjet');

async function testMailjet() {
  try {
    console.log('Testing Mailjet configuration...');
    console.log('API Key:', process.env.MAILJET_API_KEY ? 'Set' : 'Not set');
    console.log('Secret Key:', process.env.MAILJET_SECRET_KEY ? 'Set' : 'Not set');
    console.log('From Email:', process.env.MAILJET_FROM_EMAIL);

    const mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    });

    console.log('Sending test email...');
    const request = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          To: [
            {
              Email: process.env.MAILJET_FROM_EMAIL,
              Name: 'Test User'
            }
          ],
          Subject: 'Filmila Mailjet Test',
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Test Email</h1>
              <p>This is a test email from Filmila using Mailjet.</p>
              <p>If you received this email, the Mailjet configuration is working correctly.</p>
            </div>
          `
        }
      ]
    });

    console.log('Test email sent successfully:', request.body);
    process.exit(0);
  } catch (error) {
    console.error('Mailjet test failed:', error);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    process.exit(1);
  }
}

testMailjet();
