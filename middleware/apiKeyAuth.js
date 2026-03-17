require('dotenv').config();

const API_KEY = process.env.API_KEY;

function apiKeyAuth(req, res, next) {
  if (!API_KEY) return next();

  const provided = req.header('Authorization')?.replace('Bearer ', '');

  if (!provided || provided !== API_KEY) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid or missing API key'
    });
  }

  next();
}

module.exports = apiKeyAuth;
