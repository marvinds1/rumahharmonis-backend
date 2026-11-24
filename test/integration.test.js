const test = require('node:test');
const assert = require('node:assert');

const uri = process.env.TEST_MONGODB_URI;

test('auth, admin guard and duplicate protection', { skip: !uri && 'set TEST_MONGODB_URI' }, async (t) => {
  Object.assign(process.env, {
    MONGODB_URI: uri,
    ACCESS_TOKEN_SECRET: 'test-access-secret-test-access-secret',
    REFRESH_TOKEN_SECRET: 'test-refresh-secret-test-refresh-secret',
  });
  const mongoose = require('mongoose');
  const app = require('../app');
  const { connect } = require('../config/db');
  const User = require('../model/User');

  await connect();
  await mongoose.connection.db.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { server.close(); await mongoose.disconnect(); });

  const call = async (method, path, body, token, cookie) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token && { authorization: `Bearer ${token}` }),
        ...(cookie && { cookie }),
      },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null), setCookie: res.headers.get('set-cookie') };
  };

  const user = { name: 'Tester', email: 'a@example.com', address: 'Jl. Test 1', password: 'password123' };
  const regs = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/api/user/register', user)));
  assert.strictEqual(regs.filter((r) => r.status === 201).length, 1, 'one account per email under concurrency');

  const login = await call('POST', '/api/user/login', { email: user.email, password: user.password });
  assert.strictEqual(login.status, 200);
  const cookie = login.setCookie.split(';')[0];

  const profile = await call('GET', '/api/user/profile', null, login.body.token);
  assert.deepStrictEqual(Object.keys(profile.body).sort(), ['address', 'email', 'name']);

  const paket = { pathImg: '/img/a.png', pic: 'Dr. A', title: 'Paket Konseling', desc: 'Deskripsi paket', price: 100000 };
  assert.strictEqual((await call('POST', '/api/props/addPaket', paket)).status, 401);
  assert.strictEqual((await call('POST', '/api/props/addPaket', paket, login.body.token)).status, 403);

  await User.updateOne({ email: user.email }, { role: 'admin' });
  const admin = (await call('POST', '/api/user/login', { email: user.email, password: user.password })).body.token;
  const adds = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/api/props/addPaket', paket, admin)));
  assert.strictEqual(adds.filter((r) => r.status === 201).length, 1, 'unique index stops duplicate inserts');
  assert.strictEqual((await call('GET', '/api/props/getProps')).body.props.paket.length, 1);

  const refreshes = await Promise.all([call('POST', '/api/user/token', null, null, cookie), call('POST', '/api/user/token', null, null, cookie)]);
  assert.deepStrictEqual(refreshes.map((r) => r.status).sort(), [200, 401], 'a refresh token can be used once');
});
