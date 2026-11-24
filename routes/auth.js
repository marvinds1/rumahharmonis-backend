const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const User = require('../model/User');
const validate = require('../middleware/validate');
const trustedOrigin = require('../middleware/trustedOrigin');
const schemas = require('../utils/validation');
const HttpError = require('../utils/httpError');
const { cookieOptions, REFRESH_COOKIE } = require('../utils/cookies');

const MAX_SESSIONS = 5;
const MAX_ROTATED = 10;
const ROTATION_GRACE_MS = 10_000;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 12);

const limiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again later' },
});
const authLimiter = limiter(20);
const refreshLimiter = limiter(120);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function issueSession(res, user) {
  const sub = String(user._id);
  const refreshToken = jwt.sign(
    { sub, jti: crypto.randomUUID() },
    config.refreshSecret,
    { expiresIn: config.refreshTtl, algorithm: 'HS256' },
  );
  await User.updateOne({ _id: user._id }, {
    $push: { refreshTokens: { $each: [hashToken(refreshToken)], $slice: -MAX_SESSIONS } },
  });
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  return jwt.sign({ sub, role: user.role }, config.accessSecret, {
    expiresIn: config.accessTtl, algorithm: 'HS256',
  });
}

router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  const password = await bcrypt.hash(req.body.password, 12);
  try {
    const user = await User.create({ ...req.body, password });
    res.status(201).json({ user: user._id });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Email address already exists');
    throw err;
  }
});

router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  const valid = await bcrypt.compare(req.body.password, user ? user.password : DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Email or password is wrong');
  res.json({ token: await issueSession(res, user) });
});

async function refresh(req, res) {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (!refreshToken) throw new HttpError(401, 'Unauthorized');
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.refreshSecret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Unauthorized');
  }
  const hash = hashToken(refreshToken);
  const now = new Date();
  const user = await User.findOneAndUpdate(
    { _id: payload.sub, refreshTokens: hash },
    {
      $pull: { refreshTokens: hash },
      $push: { rotatedTokens: { $each: [{ hash, at: now }], $slice: -MAX_ROTATED } },
    },
  );
  if (user) return res.json({ token: await issueSession(res, user) });

  const justRotated = await User.exists({
    _id: payload.sub,
    rotatedTokens: { $elemMatch: { hash, at: { $gte: new Date(now - ROTATION_GRACE_MS) } } },
  });
  if (justRotated) throw new HttpError(409, 'Refresh token already rotated, retry with the new cookie');

  await User.updateOne({ _id: payload.sub }, { $set: { refreshTokens: [], rotatedTokens: [] } });
  throw new HttpError(401, 'Refresh token reuse detected');
}

router.post('/token', refreshLimiter, trustedOrigin, refresh);
router.get('/refreshToken', refreshLimiter, trustedOrigin, refresh);

router.delete('/logout', trustedOrigin, async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await User.updateOne({ refreshTokens: hash }, { $pull: { refreshTokens: hash } });
  }
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.sendStatus(204);
});

module.exports = router;
