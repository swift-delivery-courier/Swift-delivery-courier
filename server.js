const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const db = require('./db/database');
const { loadUser } = require('./middleware/auth');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
app.use('/login', authLimiter);
app.use('/register', authLimiter);
app.use('/contact', authLimiter);

app.use(loadUser);
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.baseUrl = config.baseUrl;
  next();
});

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', customerRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested does not exist.',
    user: req.user
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: config.nodeEnv === 'production' ? 'Something went wrong. Please try again later.' : String(err.message || err),
    user: req.user
  });
});

async function start() {
  await db.init();
  app.listen(config.port, () => {
    console.log(`Swift Delivery Courier running at http://localhost:${config.port}`);
    console.log(`Database driver: ${db.getDriver()}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
