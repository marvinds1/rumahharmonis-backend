require('dotenv').config({ quiet: true });

const required = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) throw new Error(`Missing required env vars: ${missing.join(', ')}`);

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
if (corsOrigins.includes('*')) {
  throw new Error('CORS_ORIGIN must list explicit origins; "*" cannot be combined with credentials');
}

const trustProxy = process.env.TRUST_PROXY ?? '1';

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL || '1d',
  corsOrigins,
  trustProxy: /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 8000),
};
