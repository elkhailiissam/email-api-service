const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const emailFetchService = require('../services/emailFetchService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html, options } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: to, subject, and either text or html'
      });
    }

    if (!isValidEmail(to)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format for recipient'
      });
    }

    if (!emailService.isEmailServiceAvailable()) {
      return res.status(503).json({
        status: 'error',
        message: 'Email service is currently unavailable'
      });
    }

    const result = await emailService.sendEmail(to, subject, text, html, options);

    res.json({
      status: 'success',
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send email'
    });
  }
});

router.post('/send-contact', async (req, res) => {
  try {
    const { name, email, message, messageId } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, email, and message'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    if (!emailService.isEmailServiceAvailable()) {
      return res.status(503).json({
        status: 'error',
        message: 'Email service is currently unavailable'
      });
    }

    const contact = { name, email, message, messageId };
    const adminResult = await emailService.sendContactNotification(contact);
    const userResult = await emailService.sendContactAutoResponse(contact);

    res.json({
      status: 'success',
      message: 'Contact form processed successfully',
      notificationSent: !!adminResult,
      autoResponseSent: !!userResult,
      messageId: adminResult?.messageId || userResult?.messageId
    });
  } catch (error) {
    console.error('Error processing contact form:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process contact form'
    });
  }
});

router.post('/fetch', async (_req, res) => {
  try {
    if (!emailService.isEmailServiceAvailable()) {
      return res.status(503).json({
        status: 'error',
        message: 'Email service is currently unavailable'
      });
    }

    const emails = await emailFetchService.fetchEmails();

    res.json({
      status: 'success',
      message: 'Emails fetched successfully',
      count: emails.length,
      emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch emails'
    });
  }
});

router.post('/test', async (_req, res) => {
  try {
    const result = await emailService.testEmailConfig();

    if (result) {
      return res.json({
        status: 'success',
        message: 'Test email sent successfully'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Email configuration test failed'
    });
  } catch (error) {
    console.error('Error testing email config:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Email configuration test failed'
    });
  }
});

router.get('/status', (_req, res) => {
  res.json({
    status: 'success',
    emailServiceAvailable: emailService.isEmailServiceAvailable(),
    message: 'Email service status'
  });
});

module.exports = router;
