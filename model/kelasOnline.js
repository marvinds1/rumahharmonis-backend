const mongoose = require('mongoose');

const kelasOnlineSchema = new mongoose.Schema({
  title: {
    type: String, required: true, unique: true, maxlength: 255,
  },
  pathImg: { type: String, required: true, maxlength: 512 },
}, { timestamps: true });

module.exports = mongoose.model('kelasOnline', kelasOnlineSchema);
