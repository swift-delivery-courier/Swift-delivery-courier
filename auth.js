const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies[config.jwt.cookieName]) {
    return req.cookies[config.jwt.cookieName];
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function loadUser(req, res, next) {
  req.user = null;
  const token = getTokenFromRequest(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await db.get(
      'SELECT id, email, full_name, phone, company, role, status FROM users WHERE id = ?',
      [payload.userId]
    );
    if (user && user.status !== 'suspended') req.user = user;
  } catch (err) { /* ignore */ }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireApprovedCustomer(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role === 'admin') return next();
  if (req.user.status !== 'approved') {
    return res.status(403).render('error', {
      title: 'Account Pending',
      message: 'Your account is pending approval. Contact support if you need access to payments and shipments.',
      user: req.user
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this area.',
      user: req.user
    });
  }
  next();
}

function signToken(userId) {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function setAuthCookie(res, token) {
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName);
}

module.exports = {
  loadUser, requireAuth, requireApprovedCustomer, requireAdmin,
  signToken, setAuthCookie, clearAuthCookie
};
