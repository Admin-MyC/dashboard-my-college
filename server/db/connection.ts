import mongoose from 'mongoose';

// Disable Mongoose query buffering globally so disconnected/stalled states fail immediately instead of hanging for 10s
mongoose.set('bufferCommands', false);

let isConnected = false;
let connectionError: string | null = null;
let circuitOpenUntil = 0;
let consecutiveTimeouts = 0;

const CIRCUIT_COOLDOWN_MS = 10 * 1000; // 10 seconds cooldown before retrying stalled MongoDB
export const DEFAULT_QUERY_TIMEOUT_MS = 8000; // 8s max per DB operation

export function tripDBCircuitBreaker(reason: string) {
  consecutiveTimeouts += 1;
  connectionError = reason;
  if (consecutiveTimeouts >= 3) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    console.warn(
      `[MongoDB CircuitBreaker] Aviso: Latencia repetida detectada (${reason}). Activando respaldo temporal por 10s.`
    );
  }
}

export function resetDBCircuitBreaker() {
  consecutiveTimeouts = 0;
  circuitOpenUntil = 0;
  connectionError = null;
}

/**
 * Executes a MongoDB promise with a strict timeout.
 * If MongoDB hangs (e.g. Atlas IP firewall / dropped packets), it trips the circuit breaker
 * and throws immediately so the caller can return in-memory fallback data without freezing the UI.
 */
export async function withDBTimeout<T>(
  operation: Promise<T> | { exec?: () => Promise<T>; then: Promise<T>['then'] },
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
  label = 'DB Query'
): Promise<T> {
  if (!isDBConnected()) {
    throw new Error('MongoDB circuit open or disconnected');
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout (${timeoutMs}ms) en ${label}`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([Promise.resolve(operation), timeoutPromise]);
    if (timer) clearTimeout(timer);
    if (consecutiveTimeouts > 0) {
      resetDBCircuitBreaker();
    }
    return result;
  } catch (err: any) {
    if (timer) clearTimeout(timer);
    const msg = String(err?.message || err || '');
    if (
      msg.includes('Timeout') ||
      msg.includes('timed out') ||
      msg.includes('ECONNRESET') ||
      msg.includes('topology') ||
      msg.includes('ServerSelectionError') ||
      msg.includes('buffering timed out')
    ) {
      tripDBCircuitBreaker(msg);
    }
    throw err;
  }
}

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[MongoDB] Variable MONGODB_URI no detectada. Operando en modo memoria/local.');
    isConnected = false;
    connectionError = 'MONGODB_URI no configurada (Modo Memoria Activo)';
    return false;
  }

  // If already connected, return immediately (optimized for Serverless warm invocations)
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // Attach connection event listeners once
  if (mongoose.connection.listenerCount('disconnected') === 0) {
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
    });
    mongoose.connection.on('connected', () => {
      isConnected = true;
      resetDBCircuitBreaker();
    });
    mongoose.connection.on('error', (err) => {
      connectionError = err?.message || 'Error de conexión MongoDB';
    });
  }

  try {
    const targetDbName = process.env.MONGODB_DB_NAME || 'mycollege_db';
    console.log(`[MongoDB] Conectando a MongoDB Atlas (Base de datos: ${targetDbName})...`);
    const conn = await mongoose.connect(uri, {
      dbName: targetDbName,
      readPreference: 'secondaryPreferred',
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxConnecting: 4,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      autoIndex: false,
    });

    // Verify connection can actually execute a fast ping (detects hanging shard sockets)
    if (conn.connection.db) {
      await withDBTimeout(
        conn.connection.db.admin().ping(),
        5000,
        'Ping inicial MongoDB'
      );
    }

    isConnected = conn.connection.readyState === 1;
    resetDBCircuitBreaker();
    console.log(`[MongoDB] ¡Conexión exitosa y verificada a la base de datos: ${conn.connection.name}!`);
    return true;
  } catch (error: any) {
    console.warn(
      '[MongoDB] Aviso al conectar a MongoDB (operando con respaldo rápido en memoria):',
      error.message || error
    );
    isConnected = false;
    tripDBCircuitBreaker(error.message || 'Tiempo de espera agotado al conectar con MongoDB Atlas');
    return false;
  }
}

export function isDBConnected(): boolean {
  if (Date.now() < circuitOpenUntil) {
    return false;
  }
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDBStatus() {
  const states = ['Desconectado', 'Conectado', 'Conectando', 'Desconectando'];
  const readyState = mongoose.connection.readyState;
  const circuitActive = Date.now() < circuitOpenUntil;
  const effectivelyConnected = isDBConnected();

  return {
    connected: effectivelyConnected,
    state: circuitActive
      ? 'Respaldo Local Activo (Reconectando)'
      : states[readyState] || 'Desconocido',
    dbName: mongoose.connection.name || process.env.MONGODB_DB_NAME || 'mycollege_db',
    host: mongoose.connection.host || null,
    error: effectivelyConnected ? null : connectionError,
  };
}

