const HttpError = require('./httpError');

async function createUnique(Model, data, duplicateMessage) {
  try {
    return await Model.create(data);
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, duplicateMessage);
    throw err;
  }
}

module.exports = { createUnique };
