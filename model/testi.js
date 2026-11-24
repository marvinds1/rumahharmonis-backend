const mongoose = require('mongoose');

const testiSchema = new mongoose.Schema({
  pathImg: { type: String, required: true, maxlength: 512 },
  name: { type: String, required: true, maxlength: 255 },
  desc: { type: String, required: true, maxlength: 511 },
  role: { type: String, required: true, maxlength: 255 },
}, { timestamps: true });
testiSchema.index({ name: 1, desc: 1 }, { unique: true });

module.exports = mongoose.model('Testi', testiSchema);
