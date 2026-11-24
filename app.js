const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { connect } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/controlUser');
const kelasRoutes = require('./routes/kelas');
const propsRoutes = require('./routes/props');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
app.use(async (_req, _res, next) => {
  await connect();
  next();
});

app.use('/api/user', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/props', propsRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

module.exports = app;
