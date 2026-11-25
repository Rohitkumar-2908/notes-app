import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { env, serverRoot } from './env.js';

let mode = 'disconnected'; // 'mongodb' | 'embedded' | 'disconnected'
let embeddedServer = null;
export const getDbMode = () => mode;

function explain(err) {
  const msg = err.message || '';
  console.error('\n✖ Could not connect to MongoDB:', msg);
  if (/ECONNREFUSED/.test(msg)) {
    console.error('  → MongoDB is not running on that address. Start it (mongod / "brew services start mongodb-community" / Docker),');
    console.error('    or use a free MongoDB Atlas URI in MONGO_URI.');
    console.error('    Docker one-liner:  docker run -d -p 27017:27017 --name mongo mongo:7');
  } else if (/bad auth|Authentication failed/i.test(msg)) {
    console.error('  → Wrong username/password in MONGO_URI. Special characters in the password must be URL-encoded (@ → %40).');
  } else if (/ENOTFOUND|querySrv|ETIMEOUT/i.test(msg)) {
    console.error('  → Cannot resolve the host. Check the Atlas URI and your internet connection.');
  } else if (/Could not connect to any servers|whitelist|IP/i.test(msg)) {
    console.error('  → In Atlas open Network Access and allow your IP (or 0.0.0.0/0 for testing).');
  }
}

async function startEmbedded() {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = await import('mongodb-memory-server'));
  } catch {
    throw new Error('Embedded fallback unavailable (run "npm install" in server/ to enable it).');
  }
  // Data is kept on disk in server/.data so it survives restarts.
  const dbPath = path.join(serverRoot, '.data');
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('⏳ Starting embedded local MongoDB (first run downloads a MongoDB binary, please wait)…');
  embeddedServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(embeddedServer.getUri('notes_app'));
  mode = 'embedded';
  console.log(`✔ Using embedded MongoDB. Data is saved in ${dbPath}`);
  console.log('  (Set MONGO_URI to a real MongoDB / Atlas URI to use that instead.)');
}

export async function connectDB() {
  if (env.mongoUri === 'memory') return startEmbedded();

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    mode = 'mongodb';
    console.log(`✔ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    explain(err);
    if (!env.memoryFallback) throw err;
    console.log('\n→ Falling back to an embedded local database so the app still works in development.');
    try {
      await startEmbedded();
    } catch (fallbackErr) {
      console.error('✖ Embedded fallback failed:', fallbackErr.message);
      throw err;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (embeddedServer) await embeddedServer.stop();
}
