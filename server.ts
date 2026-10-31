import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './server/app';
import { connectDB } from './server/db/connection';
import { seedDatabaseIfEmpty } from './server/db/seed';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.DEFAULT_APP_PORT) || 3000;

  // In development, mount Vite dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets built in dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[My College] Servidor Full-Stack activo en http://0.0.0.0:${PORT}`);
  });

  // Connect to MongoDB Atlas in background so the server never blocks startup
  connectDB()
    .then(async (connected) => {
      if (connected) {
        await seedDatabaseIfEmpty();
      }
    })
    .catch((err) => {
      console.warn('[My College] Aviso en conexión inicial a MongoDB:', err?.message || err);
    });
}

startServer().catch((err) => {
  console.error('[My College] Error al iniciar servidor:', err);
});
