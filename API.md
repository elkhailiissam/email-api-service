# API Documentation

This document provides a comprehensive reference for the Email API Service endpoints.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Your deployment URL (e.g., `https://your-app.herokuapp.com`)

## Authentication

All endpoints under `/api/email/` require authentication using an API Key.
Include the key in the `Authorization` header of your HTTP requests.

```http
Authorization: Bearer YOUR_API_KEY
```

> **Note:** If you do not set an `API_KEY` in your `.env` file, the server will generate a temporary one on startup and print it to the console.

## Rate Limiting

By default, the API is rate-limited to **60 requests per minute** per IP address to prevent abuse.

---

## Endpoints

### 1. System Health

#### Check Service Health
Check if the API server is up and running. Does not require authentication.

- **URL**: `/api/health`
- **Method**: `GET`
- **Auth Required**: No

**Response:**
```json
{
  "status": "success",
  "message": "Email API Service is running",
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### 2. Email Service Status

#### Check SMTP Connection
Verifies if the service can connect to the configured SMTP server.

- **URL**: `/api/email/status`
- **Method**: `GET`
- **Auth Required**: Yes

**Response:**
```json
{
  "status": "success",
  "emailServiceAvailable": true,
  "message": "Email service status"
}
```

---

### 3. Send Email

#### Send a Single Email
Sends a transactional email to a recipient.

- **URL**: `/api/email/send`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `text` | string | No* | Plain text version of the email (*required if html is missing) |
| `html` | string | No* | HTML version of the email (*required if text is missing) |
| `options` | object | No | Optional SMTP headers (messageId, inReplyTo, references) |

**Example Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Our Service",
  "text": "Hello, thanks for signing up!",
  "html": "<h1>Hello</h1><p>Thanks for signing up!</p>"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Email sent successfully",
  "messageId": "<custom-id@domain.com>"
}
```

---

### 4. Contact Form Processing

#### Handle Contact Submission
Designed for "Contact Us" forms. This endpoint performs two actions:
1. Sends a notification email to the `ADMIN_EMAIL`.
2. Sends an automated "We received your message" reply to the user.

- **URL**: `/api/email/send-contact`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the person contacting you |
| `email` | string | Yes | Email address of the person contacting you |
| `message` | string | Yes | The message content |

**Example Request:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "message": "I am interested in your enterprise plan. Please contact me."
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Contact form processed successfully",
  "notificationSent": true,
  "autoResponseSent": true,
  "messageId": "<notification-id@domain.com>"
}
```

---

### 5. Fetch Emails

#### Retrieve Unread Emails
Connects to the IMAP server and retrieves **unseen** emails. It automatically parses content and strips quoted replies to give you just the new message text.

- **URL**: `/api/email/fetch`
- **Method**: `POST`
- **Auth Required**: Yes

**Success Response:**
```json
{
  "status": "success",
  "message": "Emails fetched successfully",
  "count": 1,
  "emails": [
    {
      "from": "sender@external.com",
      "subject": "Re: Inquiry",
      "content": "This is the clean reply text without the quoted history...",
      "rawHtml": "<p>This is the clean reply text...</p>",
      "messageId": "<msg-id@external.com>",
      "originalMessageId": "<original-id@yourdomain.com>",
      "timestamp": "2024-03-14T10:05:00.000Z"
    }
  ]
}
```

---

### 6. Diagnostics

#### Test Configuration
Sends a test email to the configured `ADMIN_EMAIL` to verify that your SMTP credentials are working correctly.

- **URL**: `/api/email/test`
- **Method**: `POST`
- **Auth Required**: Yes

**Success Response:**
```json
{
  "status": "success",
  "message": "Test email sent successfully"
}
```

---

## Error Handling

All error responses follow this standard format:

```json
{
  "status": "error",
  "message": "Description of what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (Missing fields, invalid email format)
- `401` - Unauthorized (Invalid or missing API Key)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (SMTP/IMAP connection failed)

## Usage Examples

### cURL

**Send an Email:**
```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "to": "client@company.com",
    "subject": "Project Update",
    "text": "The project is on track."
  }'
```

### Node.js (Fetch API)

```javascript
const sendEmail = async () => {
  const response = await fetch('http://localhost:3001/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      to: 'client@company.com',
      subject: 'Project Update',
      text: 'The project is on track.'
    })
  });

  const data = await response.json();
  console.log(data);
};
```
