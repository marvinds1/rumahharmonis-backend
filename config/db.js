const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

let connecting = null;

function connect() {
  if (!connecting) {
    connecting = mongoose
      .connect(config.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
}

module.exports = { connect };
