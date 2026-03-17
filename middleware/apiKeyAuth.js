const crypto = require('crypto');
require('dotenv').config();

let API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // Generate a random API key if one isn't provided
  API_KEY = crypto.randomBytes(32).toString('hex');
  
  console.log('\n================================================================');
  console.log('⚠️  SECURITY WARNING: No API_KEY found in environment variables.');
  console.log('🔑  Generated Temporary API Key:');
  console.log(`    ${API_KEY}`);
  console.log('================================================================\n');
}

function apiKeyAuth(req, res, next) {
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
