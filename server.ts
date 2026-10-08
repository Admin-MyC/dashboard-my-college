import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/db/connection';
import { seedDatabaseIfEmpty } from './server/db/seed';
import { apiRouter } from './server/routes/api';
import { apiGeneralRateLimiter } from './server/security/authSecurity';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.DEFAULT_APP_PORT) || 3000;

  // Trust reverse proxy for accurate IP determination in rate-limiting
  app.set('trust proxy', 1);

  // 1. Security Headers (Helmet):
  // Protects against MIME-sniffing, enforces X-Content-Type-Options, HSTS, Referrer-Policy,
  // while configuring frameguard/CSP to allow the preview iframe to render seamlessly.
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite and React modules in development
      crossOriginEmbedderPolicy: false,
      frameguard: false, // Allows iframe embedding for AI Studio preview environment
      hidePoweredBy: true, // Removes X-Powered-By: Express header
      xssFilter: true, // X-XSS-Protection header
      noSniff: true, // X-Content-Type-Options: nosniff
    })
  );

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Connect to MongoDB Atlas (if MONGODB_URI is provided) & seed initial data
  const connected = await connectDB();
  if (connected) {
    await seedDatabaseIfEmpty();
  }

  // General API Rate Limiting to prevent DoS
  app.use('/api', apiGeneralRateLimiter);

  // Mount API routes under /api
  app.use('/api', apiRouter);

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
}

startServer().catch((err) => {
  console.error('[My College] Error al iniciar servidor:', err);
});
