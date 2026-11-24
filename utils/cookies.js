const config = require('../config/env');

module.exports = {
  REFRESH_COOKIE: 'refreshToken',
  cookieOptions: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/api/user',
  },
};
