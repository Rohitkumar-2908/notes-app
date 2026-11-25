import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ensureAdmin } from './utils/ensureAdmin.js';
import app from './app.js';

try {
  await connectDB();
  await ensureAdmin();
  const server = app.listen(env.port, () => console.log(`✔ API running on http://localhost:${env.port}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✖ Port ${env.port} is already in use. Change PORT in server/.env (and the proxy in client/vite.config.js).`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (err) {
  console.error('\n✖ Failed to start server:', err.message);
  process.exit(1);
}
