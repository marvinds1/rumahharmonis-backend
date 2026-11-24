const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../model/User');
const HttpError = require('../utils/httpError');

async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Unauthorized');
  let payload;
  try {
    payload = jwt.verify(header.slice(7), config.accessSecret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Unauthorized');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Unauthorized');
  req.user = user;
  next();
}

const requireAdmin = (req, _res, next) => (
  req.user.role === 'admin' ? next() : next(new HttpError(403, 'Forbidden'))
);

module.exports = { requireAuth, requireAdmin };
