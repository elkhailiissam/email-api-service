# Email API Service

A lightweight, self-hosted email microservice that wraps SMTP and IMAP into a clean REST API. Deploy it once, then send and receive emails from any application with simple HTTP requests.

## Why I Built This

I needed a way to handle transactional emails (contact forms, notifications, auto-responses) from multiple projects without embedding SMTP credentials into every single one. Instead of duplicating email logic across apps, I built a single API that any frontend or backend can call. It runs on its own server, keeps credentials isolated, and handles all the mail protocol complexity behind a few endpoints.

## Features

- **Send emails** via SMTP with plain text and HTML support
- **Contact form processing** with admin notification + user auto-response
- **Fetch incoming emails** via IMAP with reply threading support
### API Key Authentication

This service enforces authentication on all email endpoints.

1.  **Set your API Key**: Add `API_KEY=your-secret-key` to your `.env` file.
2.  **Automatic Generation**: If you don't set an `API_KEY`, the server will generate a **temporary secure key** on startup and print it to the console.

**Usage:**

Include the key in the `Authorization` header of your requests:

```bash
Authorization: Bearer <YOUR_API_KEY>
```
- **Rate limiting** (60 requests/min per IP by default)
- **Health check** endpoint for monitoring
- **One-click deploy** to Heroku, Railway, or Docker

## Project Structure

```
.
├── server.js                  # Express app entry point
├── routes/
│   └── emailRoutes.js         # API route handlers
├── services/
│   ├── emailService.js        # SMTP sending logic
│   └── emailFetchService.js   # IMAP fetching logic
├── middleware/
│   ├── apiKeyAuth.js          # Bearer token authentication
│   └── rateLimiter.js         # Per-IP rate limiting
├── examples/
│   └── client.js              # Integration example
├── setup.js                   # Interactive .env generator
├── Dockerfile                 # Production container
├── Procfile                   # Heroku process file
└── app.json                   # Heroku app manifest
```

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/email-api-service.git
cd email-api-service
npm install
```

### 2. Configure

Run the interactive setup or copy the example file:

```bash
npm run setup
# or
cp .env.example .env
```

Edit `.env` with your SMTP credentials. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

### 3. Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The service runs on `http://localhost:3001` by default.

## API Reference

All `/api/email/*` endpoints require the `Authorization: Bearer <API_KEY>` header (if `API_KEY` is set in your environment).

### API Key Authentication

This service enforces authentication on all email endpoints.

1.  **Set your API Key**: Add `API_KEY=your-secret-key` to your `.env` file.
2.  **Automatic Generation**: If you don't set an `API_KEY`, the server will generate a **temporary secure key** on startup and print it to the console.

**Usage:**

Include the key in the `Authorization` header of your requests:

```bash
Authorization: Bearer <YOUR_API_KEY>
```

### Health Check

```
GET /api/health
```

```json
{ "status": "success", "message": "Email API Service is running", "timestamp": "..." }
```

### Send Email

```
POST /api/email/send
```

```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "text": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

### Contact Form

```
POST /api/email/send-contact
```

Sends an admin notification and an auto-response to the user.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I'd like to learn more about your services."
}
```

### Fetch Emails

```
POST /api/email/fetch
```

Returns unread emails from the IMAP inbox. Automatically strips quoted reply content and extracts threading metadata.

### Test Configuration

```
POST /api/email/test
```

Sends a test email to `ADMIN_EMAIL` to verify SMTP is working.

### Service Status

```
GET /api/email/status
```

Returns whether the SMTP connection is active.

## Response Format

All responses follow a consistent envelope:

```json
{
  "status": "success" | "error",
  "message": "Human-readable description",
  "...": "endpoint-specific fields"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Server port |
| `EMAIL_HOST` | Yes | - | SMTP/IMAP host |
| `EMAIL_PORT` | Yes | `587` | SMTP port |
| `EMAIL_USER` | Yes | - | SMTP username |
| `EMAIL_PASSWORD` | Yes | - | SMTP password |
| `EMAIL_SECURE` | No | `false` | Use TLS for SMTP |
| `EMAIL_IMAP_PORT` | No | `993` | IMAP port |
| `EMAIL_IMAP_SECURE` | No | `true` | Use TLS for IMAP |
| `ADMIN_EMAIL` | No | - | Receives notifications and test emails |
| `API_KEY` | No | - | Bearer token for authentication (disabled if unset) |
| `COMPANY_NAME` | No | `Your Company` | Used in email templates |
| `RATE_LIMIT_MAX` | No | `60` | Max requests per minute per IP |
| `EMAIL_CONN_TIMEOUT` | No | `10000` | SMTP connection timeout (ms) |
| `EMAIL_SOCKET_TIMEOUT` | No | `15000` | SMTP socket timeout (ms) |

## Deployment

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

```bash
heroku create your-email-api
heroku config:set EMAIL_HOST=smtp.gmail.com EMAIL_PORT=587 EMAIL_USER=you@gmail.com EMAIL_PASSWORD=your-app-password API_KEY=$(openssl rand -hex 16)
git push heroku main
```

### Docker

```bash
docker build -t email-api .
docker run -d -p 3001:3001 --env-file .env email-api
```

### Any Node.js Host

Works on Railway, Render, DigitalOcean App Platform, or any VPS with Node.js 18+.

## Client Integration

See [`examples/client.js`](examples/client.js) for a ready-to-use Node.js client, or call the API from any language:

```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"to":"user@example.com","subject":"Hello","text":"Hi there"}'
```

## License

MIT
