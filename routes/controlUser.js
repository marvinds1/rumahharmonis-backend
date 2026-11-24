const router = require('express').Router();
const User = require('../model/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('../utils/validation');
const HttpError = require('../utils/httpError');
const { cookieOptions, REFRESH_COOKIE } = require('../utils/cookies');

const publicProfile = ({ name, email, address }) => ({ name, email, address });

router.use('/profile', requireAuth);

router.get('/profile', (req, res) => {
  res.json(publicProfile(req.user));
});

router.put('/profile', validate(schemas.updateProfile), async (req, res) => {
  let user;
  try {
    user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    );
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Email address already exists');
    throw err;
  }
  if (!user) throw new HttpError(401, 'Unauthorized');
  res.json(publicProfile(user));
});

router.delete('/profile', async (req, res) => {
  await User.deleteOne({ _id: req.user._id });
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.json({ message: 'User deleted' });
});

module.exports = router;
