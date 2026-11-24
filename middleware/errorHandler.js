const HttpError = require('../utils/httpError');

module.exports = (err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate data' });
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.expose ? err.message : 'Bad request' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
};
