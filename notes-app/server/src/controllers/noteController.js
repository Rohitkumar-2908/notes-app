import { Note } from '../models/Note.js';
import { ROLES } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const isAdmin = (user) => user.role === ROLES.ADMIN;

// Loads a note and makes sure the caller owns it (admins may access any note).
async function findAccessibleNote(id, user) {
  const note = await Note.findById(id).populate('owner', 'name email');
  if (!note) throw new AppError('Note not found', 404);
  if (!isAdmin(user) && note.owner?._id?.toString() !== user._id.toString()) {
    throw new AppError('Note not found', 404); // 404 so we don't leak that it exists
  }
  return note;
}

const parseTags = (tags) =>
  Array.isArray(tags)
    ? [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
    : undefined;

// GET /api/notes?q=&tag=&page=&limit=&scope=all(admin only)
export const getNotes = asyncHandler(async (req, res) => {
  const { q, tag, scope } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

  const filter = {};
  if (!(isAdmin(req.user) && scope === 'all')) filter.owner = req.user._id;
  if (q) filter.$text = { $search: q };
  if (tag) filter.tags = tag.toLowerCase();

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'name email'),
    Note.countDocuments(filter),
  ]);

  res.json({ success: true, notes, total, page, pages: Math.ceil(total / limit) });
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await findAccessibleNote(req.params.id, req.user);
  res.json({ success: true, note });
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, content, tags, pinned } = req.body;
  const note = await Note.create({ title, content, tags: parseTags(tags), pinned, owner: req.user._id });
  res.status(201).json({ success: true, note });
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await findAccessibleNote(req.params.id, req.user);
  const { title, content, tags, pinned } = req.body;

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (tags !== undefined) note.tags = parseTags(tags);
  if (pinned !== undefined) note.pinned = pinned;

  await note.save();
  res.json({ success: true, note });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await findAccessibleNote(req.params.id, req.user);
  await note.deleteOne();
  res.json({ success: true, message: 'Note deleted' });
});
