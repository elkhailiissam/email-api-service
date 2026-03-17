const express = require('express');
const cors = require('cors');
require('dotenv').config();

const emailRoutes = require('./routes/emailRoutes');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    name: 'Email API Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      status: 'GET /api/email/status',
      send: 'POST /api/email/send',
      sendContact: 'POST /api/email/send-contact',
      fetch: 'POST /api/email/fetch',
      test: 'POST /api/email/test'
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Email API Service is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/email', rateLimiter, apiKeyAuth, emailRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Email API Service running on port ${PORT}`);
  });
}

module.exports = app;
