const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const OPERATION_TIMEOUT = 60000;

const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_IMAP_PORT || '993', 10),
  tls: process.env.EMAIL_IMAP_SECURE !== 'false',
  tlsOptions: { rejectUnauthorized: false },
  connTimeout: parseInt(process.env.EMAIL_CONN_TIMEOUT || '10000', 10),
  authTimeout: parseInt(process.env.EMAIL_AUTH_TIMEOUT || '10000', 10)
};

function extractEmailAddress(email) {
  if (!email) return null;
  if (typeof email === 'object') {
    if (email.value && email.value.length > 0 && email.value[0].address) {
      return email.value[0].address.toLowerCase();
    }
    if (email.text) email = email.text;
  }
  const match = String(email).match(/<(.+)>/);
  return (match ? match[1] : String(email)).trim().toLowerCase();
}

function extractOriginalMessageId(references, inReplyTo) {
  if (inReplyTo) return Array.isArray(inReplyTo) ? inReplyTo[0] : String(inReplyTo);
  if (!references) return null;
  const refs = Array.isArray(references) ? references : String(references).split(/\s+/);
  return refs.length > 0 ? refs[0] : null;
}

function stripQuotedContent(content) {
  if (!content) return content;

  const markers = [
    /On [A-Za-z]{3}, [A-Za-z]{3} \d+, \d{4}(,| at) \d+:\d+ (AM|PM)/i,
    /On \d{4}-\d{2}-\d{2} \d+:\d+/i,
    /On \d{1,2}\/\d{1,2}\/\d{2,4}.* wrote:/i,
    /On .* wrote:/i,
    /^>.*/m
  ];

  for (const marker of markers) {
    const parts = content.split(marker);
    if (parts.length > 1) return parts[0].trim();
  }

  const lines = content.split('\n');
  const freshLines = [];
  let inQuote = false;

  for (const line of lines) {
    if (line.trim().startsWith('>') || line.includes('wrote:')) {
      inQuote = true;
      continue;
    }
    if (!inQuote) freshLines.push(line);
  }

  return inQuote && freshLines.length > 0
    ? freshLines.join('\n').trim()
    : content.trim();
}

function htmlToPlainText(html) {
  return html
    .replace(/<div>(.*?)<\/div>/gi, '$1\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>(?!\n)/gi, '\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

async function processEmail(mail) {
  try {
    const parsed = await simpleParser(mail);
    const from = extractEmailAddress(parsed.from);

    if (!from || from === imapConfig.user?.toLowerCase()) return null;

    let content = '';
    let rawHtml = null;

    if (parsed.html) {
      rawHtml = parsed.html;
      content = htmlToPlainText(parsed.html);
    } else if (parsed.text) {
      content = parsed.text;
    }

    if (parsed.inReplyTo || parsed.references) {
      content = stripQuotedContent(content);
    }

    return {
      from,
      subject: parsed.subject || 'No Subject',
      content,
      rawHtml,
      messageId: parsed.messageId,
      originalMessageId: extractOriginalMessageId(parsed.references, parsed.inReplyTo),
      timestamp: (parsed.date || new Date()).toISOString()
    };
  } catch (error) {
    console.error('Failed to process email:', error.message);
    return null;
  }
}

function fetchEmails() {
  return new Promise((resolve) => {
    if (!imapConfig.user || !imapConfig.password) return resolve([]);

    const imap = new Imap(imapConfig);
    const emails = [];

    const timeout = setTimeout(() => {
      try { imap.end(); } catch { /* connection already closed */ }
      resolve(emails);
    }, OPERATION_TIMEOUT);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          clearTimeout(timeout);
          imap.end();
          return resolve(emails);
        }

        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results || results.length === 0) {
            clearTimeout(timeout);
            imap.end();
            return resolve(emails);
          }

          const fetcher = imap.fetch(results, { bodies: '' });

          fetcher.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
            });
            msg.once('end', async () => {
              const email = await processEmail(buffer);
              if (email) emails.push(email);
            });
          });

          fetcher.once('end', () => {
            clearTimeout(timeout);
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err.message);
      clearTimeout(timeout);
      try { imap.end(); } catch { /* already closed */ }
      resolve(emails);
    });

    imap.connect();
  });
}

module.exports = { fetchEmails };
