import mongoose from 'mongoose';

let isConnected = false;
let connectionError: string | null = null;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[MongoDB] Variable MONGODB_URI no detectada. Operando en modo memoria/local.');
    isConnected = false;
    connectionError = 'MONGODB_URI no configurada';
    return false;
  }

  try {
    const targetDbName = process.env.MONGODB_DB_NAME || 'mycollege_db';
    console.log(`[MongoDB] Conectando a MongoDB Atlas (Base de datos: ${targetDbName})...`);
    const conn = await mongoose.connect(uri, {
      dbName: targetDbName,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;
    connectionError = null;
    console.log(`[MongoDB] ¡Conexión exitosa a la base de datos: ${conn.connection.name}!`);
    return true;
  } catch (error: any) {
    console.error('[MongoDB] Error al conectar a MongoDB:', error.message || error);
    isConnected = false;
    connectionError = error.message || 'Error desconocido al conectar con MongoDB';
    return false;
  }
}

export function isDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDBStatus() {
  const states = ['Desconectado', 'Conectado', 'Conectando', 'Desconectando'];
  const readyState = mongoose.connection.readyState;
  return {
    connected: isDBConnected(),
    state: states[readyState] || 'Desconocido',
    dbName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    error: connectionError,
  };
}
