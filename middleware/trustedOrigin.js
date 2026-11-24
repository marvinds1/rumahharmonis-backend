const config = require('../config/env');
const HttpError = require('../utils/httpError');

const SAFE_FETCH_SITES = new Set(['same-origin', 'same-site', 'none']);

module.exports = (req, _res, next) => {
  const origin = req.get('origin');
  if (origin) {
    const self = `${req.protocol}://${req.get('host')}`;
    return config.corsOrigins.includes(origin) || origin === self
      ? next()
      : next(new HttpError(403, 'Forbidden'));
  }
  const site = req.get('sec-fetch-site');
  if (site && !SAFE_FETCH_SITES.has(site)) return next(new HttpError(403, 'Forbidden'));
  return next();
};
