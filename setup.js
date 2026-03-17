#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Email API Service Setup\n');
console.log('This will create a .env file with your email configuration.\n');

const questions = [
  { name: 'EMAIL_HOST', prompt: 'SMTP host (e.g., smtp.gmail.com): ', fallback: 'smtp.gmail.com' },
  { name: 'EMAIL_PORT', prompt: 'SMTP port (587 or 465): ', fallback: '587' },
  { name: 'EMAIL_USER', prompt: 'Email address: ', fallback: '' },
  { name: 'EMAIL_PASSWORD', prompt: 'Email password or app password: ', fallback: '' },
  { name: 'EMAIL_SECURE', prompt: 'Use secure connection? (true/false): ', fallback: 'false' },
  { name: 'ADMIN_EMAIL', prompt: 'Admin email for notifications: ', fallback: '' },
  { name: 'COMPANY_NAME', prompt: 'Company name: ', fallback: 'Your Company' },
  { name: 'API_KEY', prompt: 'API key (press enter to auto-generate): ', fallback: '' }
];

const values = {};

function ask(index) {
  if (index >= questions.length) {
    writeEnvFile();
    return;
  }

  const q = questions[index];
  rl.question(q.prompt, (answer) => {
    if (q.name === 'API_KEY' && !answer) {
      values[q.name] = Math.random().toString(36).substring(2) + Date.now().toString(36);
    } else {
      values[q.name] = answer || q.fallback;
    }
    ask(index + 1);
  });
}

function writeEnvFile() {
  const content = `PORT=3001
EMAIL_HOST=${values.EMAIL_HOST}
EMAIL_PORT=${values.EMAIL_PORT}
EMAIL_USER=${values.EMAIL_USER}
EMAIL_PASSWORD=${values.EMAIL_PASSWORD}
EMAIL_SECURE=${values.EMAIL_SECURE}
EMAIL_IMAP_PORT=993
EMAIL_IMAP_SECURE=true
EMAIL_CONN_TIMEOUT=10000
EMAIL_GREETING_TIMEOUT=10000
EMAIL_SOCKET_TIMEOUT=15000
EMAIL_AUTH_TIMEOUT=10000
ADMIN_EMAIL=${values.ADMIN_EMAIL}
API_KEY=${values.API_KEY}
COMPANY_NAME=${values.COMPANY_NAME}
RATE_LIMIT_MAX=60
`;

  fs.writeFileSync('.env', content);
  console.log('\n.env file created successfully!');
  console.log('\nNext steps:');
  console.log('  1. Review .env and adjust values if needed');
  console.log('  2. npm install');
  console.log('  3. npm run dev');
  rl.close();
}

ask(0);
