const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: true, minlength: 3, maxlength: 100,
  },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255,
  },
  address: { type: String, required: true, maxlength: 512 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshTokens: { type: [String], default: [], select: false },
  rotatedTokens: {
    type: [{ _id: false, hash: String, at: Date }],
    default: [],
    select: false,
  },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    const {
      password, refreshTokens, rotatedTokens, __v, ...safe
    } = ret;
    return safe;
  },
});

module.exports = mongoose.model('User', userSchema);
