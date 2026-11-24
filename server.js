/* eslint-disable no-console */
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');
const { connect } = require('./config/db');

module.exports = app;

if (require.main === module) {
  connect()
    .then(() => {
      const server = app.listen(config.port, () => {
        console.log(`Server running on http://localhost:${config.port}`);
      });
      const shutdown = () => server.close(() => {
        mongoose.disconnect().finally(() => process.exit(0));
      });
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err) => {
      console.error('Cannot connect to the database', err);
      process.exit(1);
    });
}
