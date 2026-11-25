import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User, ROLES } from '../models/User.js';

const name = process.env.ADMIN_NAME || 'Super Admin';
const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

await connectDB();

const existing = await User.findOne({ email });
if (existing) {
  existing.role = ROLES.ADMIN;
  await existing.save({ validateBeforeSave: false });
  console.log(`Existing user ${email} promoted to admin`);
} else {
  await User.create({ name, email, password, role: ROLES.ADMIN });
  console.log(`Admin created: ${email}`);
}

await mongoose.disconnect();
void env;
