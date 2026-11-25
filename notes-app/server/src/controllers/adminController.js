import { User, ROLES } from '../models/User.js';
import { Note } from '../models/Note.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

// GET /api/admin/stats  - aggregation pipelines
export const getStats = asyncHandler(async (_req, res) => {
  const [roleCounts, totalNotes, writerGroups] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Note.countDocuments(),
    Note.aggregate([
      { $group: { _id: '$owner', notes: { $sum: 1 } } },
      { $sort: { notes: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const writers = await User.find({ _id: { $in: writerGroups.map((w) => w._id) } }).select('name email');
  const byId = new Map(writers.map((u) => [u._id.toString(), u]));
  const topWriters = writerGroups
    .filter((w) => byId.has(w._id.toString()))
    .map((w) => ({ name: byId.get(w._id.toString()).name, email: byId.get(w._id.toString()).email, notes: w.notes }));

  const byRole = Object.fromEntries(roleCounts.map((r) => [r._id, r.count]));
  res.json({
    success: true,
    stats: {
      totalUsers: (byRole.user || 0) + (byRole.admin || 0),
      admins: byRole.admin || 0,
      users: byRole.user || 0,
      totalNotes,
      topWriters,
    },
  });
});

// GET /api/admin/users  - each user with their note count
export const getUsers = asyncHandler(async (_req, res) => {
  const [users, counts] = await Promise.all([
    User.find().sort({ createdAt: -1 }),
    Note.aggregate([{ $group: { _id: '$owner', noteCount: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.noteCount]));
  res.json({
    success: true,
    users: users.map((u) => ({ ...u.toJSON(), noteCount: countById.get(u._id.toString()) || 0 })),
  });
});

// POST /api/admin/users  { name, email, password, role? }
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = ROLES.USER } = req.body;
  if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);
  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, user });
});

// PATCH /api/admin/users/:id  { role?, isActive? }
export const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findById(req.params.id).select('+refreshTokens');
  if (!user) throw new AppError('User not found', 404);

  const isSelf = user._id.equals(req.user._id);
  if (isSelf && (role !== undefined || isActive === false)) {
    throw new AppError('You cannot change your own role or deactivate yourself', 400);
  }

  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);
    user.role = role;
  }
  if (isActive !== undefined) {
    user.isActive = Boolean(isActive);
    if (!user.isActive) user.refreshTokens = []; // kick out existing sessions
  }

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id  - removes the user and all their notes
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.equals(req.user._id)) throw new AppError('You cannot delete yourself', 400);

  await Note.deleteMany({ owner: user._id });
  await user.deleteOne();
  res.json({ success: true, message: 'User and their notes deleted' });
});
