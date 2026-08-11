// src/middleware/session.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('../config/db');

const store = new SequelizeStore({ db: sequelize });
store.sync();

module.exports = session({
  secret: process.env.SESSION_SECRET || 'super-secret-session',
  store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    // secure: false for development; enable true in production with HTTPS
  },
});
