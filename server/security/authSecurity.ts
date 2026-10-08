import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt algorithm with salt rounds = 10
 */
export async function hashPassword(plainText: string, rounds = SALT_ROUNDS): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compares a plaintext password against a bcrypt hash in constant-time
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  try {
    return await bcrypt.compare(plainText, hash);
  } catch (err) {
    console.error('[Security] Error al comparar hash bcrypt:', err);
    return false;
  }
}

/**
 * Checks if a string is already a formatted Bcrypt hash ($2a$ or $2b$)
 */
export function isBcryptHash(str: string): boolean {
  if (!str) return false;
  return /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Rate Limiter for Login and Authentication endpoints:
 * Prevents automated dictionary and brute-force attacks.
 * Limit: 10 attempts per 15 minutes per IP address.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo 15 intentos en 15 minutos por IP
  standardHeaders: true, // Retorna info en cabeceras `RateLimit-*` (RFC draft)
  legacyHeaders: false, // Deshabilita cabeceras obsoletas `X-RateLimit-*`
  message: {
    success: false,
    error: 'Demasiados intentos de acceso desde esta dirección IP. Por protección contra ataques de fuerza bruta, el acceso ha sido suspendido temporalmente. Intente nuevamente en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: false,
});

/**
 * General API Rate Limiter:
 * Protects server resources against DoS / excessive requests while allowing bulk CSV imports and deletions.
 * Limit: 5000 requests per minute per IP.
 */
export const apiGeneralRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5000, // 5000 peticiones por minuto (soporta cargas masivas de alumnos)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Límite de solicitudes de API excedido. Por favor reduzca la frecuencia de peticiones.',
    code: 'API_RATE_LIMIT_EXCEEDED',
  },
});
