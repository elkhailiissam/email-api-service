const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const COMPANY_NAME = process.env.COMPANY_NAME || 'Your Company';

const CONN_TIMEOUT = parseInt(process.env.EMAIL_CONN_TIMEOUT || '10000', 10);
const GREETING_TIMEOUT = parseInt(process.env.EMAIL_GREETING_TIMEOUT || '10000', 10);
const SOCKET_TIMEOUT = parseInt(process.env.EMAIL_SOCKET_TIMEOUT || '15000', 10);

if (!EMAIL_USER || !EMAIL_PASSWORD || !EMAIL_HOST) {
  throw new Error('EMAIL_USER, EMAIL_PASSWORD, and EMAIL_HOST environment variables must be set');
}

function createTransport() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
    connectionTimeout: CONN_TIMEOUT,
    greetingTimeout: GREETING_TIMEOUT,
    socketTimeout: SOCKET_TIMEOUT
  });
}

let transporter = null;
function getTransporter() {
  if (!transporter) transporter = createTransport();
  return transporter;
}

function generateMessageId() {
  const domain = EMAIL_USER.split('@')[1] || 'mail.local';
  return `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}>`;
}

async function validateEmailConfig() {
  try {
    await Promise.race([
      getTransporter().verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), CONN_TIMEOUT))
    ]);
    return true;
  } catch (error) {
    console.error('Email config validation failed:', error.message);
    return false;
  }
}

async function testEmailConfig() {
  try {
    await Promise.race([
      getTransporter().sendMail({
        from: `"${COMPANY_NAME}" <${EMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `Test Email - ${COMPANY_NAME}`,
        text: 'This is a test email to verify the SMTP configuration.',
        html: '<p>This is a test email to verify the SMTP configuration.</p>'
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout')), SOCKET_TIMEOUT))
    ]);
    return true;
  } catch (error) {
    console.error('Test email failed:', error.message);
    return false;
  }
}

async function sendEmail(to, subject, text, html, options = {}) {
  const messageId = options.messageId || generateMessageId();
  const mailOptions = {
    from: `"${COMPANY_NAME}" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    messageId
  };

  if (options.inReplyTo) mailOptions.inReplyTo = options.inReplyTo;
  if (options.references) mailOptions.references = options.references;

  try {
    return await Promise.race([
      getTransporter().sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout')), SOCKET_TIMEOUT))
    ]);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw new Error('Failed to send email', { cause: error });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendContactNotification(contact) {
  const timestamp = contact.createdAt || new Date().toISOString();
  const subject = 'New Contact Form Submission';
  const text = `New contact form submission:\n\nName: ${contact.name}\nEmail: ${contact.email}\nMessage: ${contact.message}\nTimestamp: ${timestamp}`;
  const html = [
    '<h2>New Contact Form Submission</h2>',
    `<p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>`,
    `<p><strong>Message:</strong> ${escapeHtml(contact.message)}</p>`,
    `<p><strong>Timestamp:</strong> ${timestamp}</p>`
  ].join('');

  try {
    return await sendEmail(ADMIN_EMAIL, subject, text, html, {
      messageId: contact.messageId || generateMessageId()
    });
  } catch (error) {
    console.error('Failed to send contact notification:', error.message);
    return null;
  }
}

async function sendContactAutoResponse(contact) {
  const messageId = generateMessageId();
  const subject = `Thank you for contacting ${COMPANY_NAME}`;
  const name = escapeHtml(contact.name);
  const company = escapeHtml(COMPANY_NAME);
  const text = `Dear ${contact.name},\n\nThank you for contacting ${COMPANY_NAME}. We have received your message and will get back to you as soon as possible.\n\nYour message:\n${contact.message}\n\nBest regards,\n${COMPANY_NAME} Team`;
  const html = [
    `<h2>Thank you for contacting ${company}</h2>`,
    `<p>Dear ${name},</p>`,
    `<p>Thank you for contacting ${company}. We have received your message and will get back to you as soon as possible.</p>`,
    `<p><strong>Your message:</strong><br>${escapeHtml(contact.message)}</p>`,
    `<p>Best regards,<br>${company} Team</p>`
  ].join('');

  const options = { messageId };
  if (contact.messageId) options.references = contact.messageId;

  try {
    return await sendEmail(contact.email, subject, text, html, options);
  } catch (error) {
    console.error('Failed to send auto-response:', error.message);
    return null;
  }
}

let emailServiceAvailable = false;
validateEmailConfig().then(valid => { emailServiceAvailable = valid; });
const isEmailServiceAvailable = () => emailServiceAvailable;

module.exports = {
  sendEmail,
  sendContactNotification,
  sendContactAutoResponse,
  testEmailConfig,
  validateEmailConfig,
  isEmailServiceAvailable
};
