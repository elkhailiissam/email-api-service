const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '60', 10);

const requests = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const timestamps = (requests.get(ip) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }

  timestamps.push(now);
  requests.set(ip, timestamps);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - timestamps.length);

  next();
}

module.exports = rateLimiter;
