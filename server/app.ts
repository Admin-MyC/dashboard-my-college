import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';
import { apiGeneralRateLimiter } from './security/authSecurity';

dotenv.config();

export const app = express();

// Trust reverse proxy for accurate IP determination in rate-limiting
app.set('trust proxy', 1);

// 1. Security Headers (Helmet):
// Protects against MIME-sniffing, enforces X-Content-Type-Options, HSTS, Referrer-Policy,
// while configuring frameguard/CSP to allow the preview iframe to render seamlessly.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    hidePoweredBy: true,
    xssFilter: true,
    noSniff: true,
  })
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// General API Rate Limiting to prevent DoS
app.use('/api', apiGeneralRateLimiter);

// Mount API routes on BOTH '/api' AND '/' so requests work seamlessly
// whether called on standard server (/api/...) or via Vercel serverless rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
