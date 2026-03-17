/**
 * Email API Service - Client Integration Example
 *
 * Shows how to call the API from any Node.js application.
 * Replace API_URL and API_KEY with your deployed values.
 */

const API_URL = process.env.EMAIL_API_URL || 'http://localhost:3001';
const API_KEY = process.env.EMAIL_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { Authorization: `Bearer ${API_KEY}` })
};

async function sendEmail(to, subject, text, html = null) {
  const res = await fetch(`${API_URL}/api/email/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ to, subject, text, html })
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message);
  return data;
}

async function sendContactForm({ name, email, message }) {
  const res = await fetch(`${API_URL}/api/email/send-contact`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, message })
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message);
  return data;
}

async function fetchEmails() {
  const res = await fetch(`${API_URL}/api/email/fetch`, {
    method: 'POST',
    headers
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message);
  return data.emails;
}

async function checkStatus() {
  const res = await fetch(`${API_URL}/api/email/status`, { headers });
  const data = await res.json();
  return data.emailServiceAvailable;
}

module.exports = { sendEmail, sendContactForm, fetchEmails, checkStatus };
