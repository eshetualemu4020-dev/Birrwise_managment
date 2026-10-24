// src/config/jwt.js
// Single source of truth for the JWT signing secret.
//
// A hardcoded fallback secret is dangerous: any deployment that forgets to set
// JWT_SECRET would sign tokens with a publicly known string, letting anyone
// forge credentials. Instead we fail fast on startup.
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'supersecretkey123' || JWT_SECRET.length < 16) {
  throw new Error(
    'JWT_SECRET is missing or too weak. Set a random value of at least 16 ' +
    'characters in backend/.env (see .env.example).'
  );
}

module.exports = { JWT_SECRET };
