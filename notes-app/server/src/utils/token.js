import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, {
    expiresIn: env.accessExpires,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.refreshSecret, {
    expiresIn: env.refreshExpires,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.refreshSecret);

// Refresh tokens are stored hashed so a DB leak doesn't expose usable tokens.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
