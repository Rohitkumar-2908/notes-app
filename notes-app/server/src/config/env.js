import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, '../..');
const envPath = path.join(serverRoot, '.env');

const randomSecret = () => crypto.randomBytes(48).toString('hex');
const isPlaceholder = (v) => !v || /^(change_me|your_|secret$|replace)/i.test(v.trim());

// JWT secrets are just long random strings that only the server knows.
// There is nothing to sign up for: if they are missing, we generate them and save them to .env.
const template = () => `PORT=5050
NODE_ENV=development

# MongoDB: local server or a MongoDB Atlas "mongodb+srv://..." string
MONGO_URI=mongodb://127.0.0.1:27017/notes_app

# Auto-generated random secrets used to sign JWT tokens. Keep them private.
JWT_ACCESS_SECRET=${randomSecret()}
JWT_REFRESH_SECRET=${randomSecret()}
ACCESS_EXPIRES=15m
REFRESH_EXPIRES=7d

CLIENT_URL=http://localhost:5173

# First admin account, created automatically on server start if it does not exist
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, template());
  console.log('Created server/.env with freshly generated JWT secrets.');
}

dotenv.config({ path: envPath });

function upsertEnvVar(key, value) {
  let text = fs.readFileSync(envPath, 'utf8');
  const line = new RegExp(`^${key}=.*$`, 'm');
  text = line.test(text) ? text.replace(line, `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
  fs.writeFileSync(envPath, text);
}

for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (isPlaceholder(process.env[key])) {
    const value = randomSecret();
    process.env[key] = value;
    upsertEnvVar(key, value);
    console.log(`Generated a new ${key} and saved it to server/.env`);
  }
}

const clean = (v) => (v ?? '').trim().replace(/^["']|["']$/g, '');

export const env = {
  port: Number(process.env.PORT) || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: clean(process.env.MONGO_URI) || 'mongodb://127.0.0.1:27017/notes_app',
  // If MongoDB is unreachable (dev only), fall back to an embedded local database.
  memoryFallback: process.env.MEMORY_FALLBACK !== 'false' && process.env.NODE_ENV !== 'production',
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.REFRESH_EXPIRES || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME || 'Super Admin',
    email: clean(process.env.ADMIN_EMAIL).toLowerCase(),
    password: clean(process.env.ADMIN_PASSWORD),
  },
};
