const HttpError = require('../utils/httpError');

module.exports = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body ?? {}, { abortEarly: true, stripUnknown: true });
  if (error) return next(new HttpError(400, error.details[0].message));
  req.body = value;
  return next();
};
