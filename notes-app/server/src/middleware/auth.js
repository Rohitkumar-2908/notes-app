import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/token.js';

// Authentication: verifies the Bearer access token and loads the user.
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);

  const payload = verifyAccessToken(header.split(' ')[1]); // throws -> errorHandler -> 401
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('User no longer exists', 401);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  req.user = user;
  next();
});

// Authorization (RBAC): allow only the listed roles.
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
