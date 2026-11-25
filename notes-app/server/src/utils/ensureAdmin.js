import { env } from '../config/env.js';
import { User, ROLES } from '../models/User.js';

// Creates the first admin from ADMIN_* env vars if that account does not exist yet.
export async function ensureAdmin() {
  const { name, email, password } = env.admin;
  if (!email || !password) return;
  if (await User.exists({ email })) return;
  await User.create({ name, email, password, role: ROLES.ADMIN });
  console.log(`✔ Admin account created: ${email}`);
}
