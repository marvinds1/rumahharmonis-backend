const { parseArgs } = require('node:util');
const readline = require('node:readline');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connect } = require('../config/db');
const User = require('../model/User');
const schemas = require('../utils/validation');

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write(question);
    rl._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string', default: 'Administrator' },
      address: { type: 'string', default: 'Not provided' },
    },
  });
  if (!values.email) throw new Error('Usage: npm run create-admin -- --email <email> [--name <name>] [--address <address>]');

  await connect();
  const email = values.email.trim().toLowerCase();
  const promoted = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } });
  if (promoted) {
    console.log(`Existing user ${email} now has role "admin" (password unchanged).`);
    return;
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (!process.stdin.isTTY) throw new Error('Set ADMIN_PASSWORD or run in an interactive terminal');
    password = await promptHidden('Password for the new admin: ');
  }
  const { error, value } = schemas.register.validate({
    name: values.name, email, address: values.address, password,
  });
  if (error) throw new Error(error.details[0].message);

  try {
    await User.create({ ...value, password: await bcrypt.hash(value.password, 12), role: 'admin' });
    console.log(`Created admin ${email}.`);
  } catch (err) {
    if (err.code !== 11000) throw err;
    await User.updateOne({ email }, { $set: { role: 'admin' } });
    console.log(`User ${email} was created concurrently; promoted to admin.`);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
