import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../server/app';
import { connectDB } from '../server/db/connection';

let isDbConnecting = false;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Ensure MongoDB connection is initialized in Vercel serverless environment
  if (!isDbConnecting) {
    isDbConnecting = true;
    try {
      await connectDB();
    } catch (err: any) {
      console.warn('[Vercel Serverless] Error en conexión a MongoDB:', err?.message || err);
    } finally {
      isDbConnecting = false;
    }
  }

  return app(req as any, res as any);
}
