import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/token.js';
import { env } from '../config/env.js';

const MAX_SESSIONS = 5;

const cookieOptions = {
  httpOnly: true, // not readable from JS -> safe from XSS token theft
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Creates an access + refresh token pair, stores the hashed refresh token, sets the cookie.
async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokens = [...(user.refreshTokens || []), hashToken(refreshToken)].slice(-MAX_SESSIONS);
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // role is never taken from the request body -> no self-registered admins
  const user = await User.create({ name, email, password });
  const accessToken = await issueTokens(user, res);
  res.status(201).json({ success: true, accessToken, user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const accessToken = await issueTokens(user, res);
  res.json({ success: true, accessToken, user });
});

// Rotates the refresh token: old one is invalidated, a new pair is issued.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('No refresh token', 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.isActive) throw new AppError('Not authenticated', 401);

  const hashed = hashToken(token);
  if (!user.refreshTokens.includes(hashed)) {
    // Token reuse detected -> revoke every session for safety
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    throw new AppError('Refresh token reuse detected. Please log in again.', 401);
  }

  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  const accessToken = await issueTokens(user, res);
  res.json({ success: true, accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const { sub } = verifyRefreshToken(token);
      await User.updateOne({ _id: sub }, { $pull: { refreshTokens: hashToken(token) } });
    } catch {
      /* token already invalid - nothing to revoke */
    }
  }
  res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Logged out' });
});

export const me = (req, res) => res.json({ success: true, user: req.user });
