const mongoose = require('mongoose');

const paketSchema = new mongoose.Schema({
  pathImg: { type: String, required: true, maxlength: 512 },
  pic: { type: String, required: true, maxlength: 255 },
  title: { type: String, required: true, maxlength: 255 },
  desc: { type: String, required: true, maxlength: 255 },
  price: { type: Number, required: true, min: 0 },
  isFav: { type: Boolean, default: false },
}, { timestamps: true });
paketSchema.index({ title: 1, pic: 1 }, { unique: true });

module.exports = mongoose.model('Paket', paketSchema);
