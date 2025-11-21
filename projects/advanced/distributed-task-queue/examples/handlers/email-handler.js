/**
 * Email Handler
 * Example task handler for sending emails
 */

async function execute(payload, context) {
  const { to, subject, body } = payload;

  context.log(`Sending email to ${to}`);
  context.progress(10);

  // Validate inputs
  if (!to || !subject || !body) {
    throw new Error('Missing required fields: to, subject, body');
  }

  // Simulate email validation
  await sleep(500);
  context.progress(30);

  // Simulate connecting to email service
  context.log('Connecting to email service...');
  await sleep(1000);
  context.progress(50);

  // Simulate sending email
  context.log('Sending email...');
  await sleep(2000);
  context.progress(80);

  // Simulate verification
  context.log('Verifying delivery...');
  await sleep(500);
  context.progress(100);

  return {
    messageId: `msg-${Date.now()}`,
    to,
    subject,
    sentAt: new Date().toISOString(),
    status: 'sent'
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { execute };
