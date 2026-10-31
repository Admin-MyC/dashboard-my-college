import { User } from '../types';

const SESSION_STORAGE_KEY = 'my_college_current_session_id';
const LOCAL_SESSIONS_KEY = 'my_college_active_local_sessions';
const LAST_ACTIVITY_STORAGE_KEY = 'my_college_v1_last_activity_ts';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 35000;

export const recordUserActivity = () => {
  const nowStr = String(Date.now());
  try {
    sessionStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, nowStr);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, nowStr);
  } catch {
    // ignore
  }
};

export const getLastUserActivity = (): number => {
  try {
    const raw =
      sessionStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) ||
      localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return isNaN(parsed) ? Date.now() : parsed;
  } catch {
    return Date.now();
  }
};

export const clearLastUserActivity = () => {
  try {
    sessionStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export interface ClientActiveSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  device: string;
  lastPing: number;
}

export const getDeviceDescription = (): string => {
  const ua = navigator.userAgent;
  let device = 'Navegador Web';
  if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Android/i.test(ua)) device = 'Android Móvil';
  else if (/Macintosh|Mac OS X/i.test(ua)) device = 'Mac';
  else if (/Windows/i.test(ua)) device = 'PC Windows';
  else if (/Linux/i.test(ua)) device = 'Linux';

  let browser = '';
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  return browser ? `${device} (${browser})` : device;
};

export const getOrCreateSessionId = (): string => {
  try {
    let sessId =
      sessionStorage.getItem(SESSION_STORAGE_KEY) ||
      localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessId) {
      sessId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessId);
    localStorage.setItem(SESSION_STORAGE_KEY, sessId);
    return sessId;
  } catch {
    return 'sess_' + Date.now();
  }
};

export const getCurrentSessionId = (): string | null => {
  try {
    return (
      sessionStorage.getItem(SESSION_STORAGE_KEY) ||
      localStorage.getItem(SESSION_STORAGE_KEY)
    );
  } catch {
    return null;
  }
};

export const clearCurrentSessionId = () => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

// Check local storage session map
const getLocalActiveSession = (userId: string, email: string): ClientActiveSession | null => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return null;
    const map: Record<string, ClientActiveSession> = JSON.parse(raw);
    const key = (userId || email).toLowerCase();
    const sess = map[key];
    if (sess && Date.now() - sess.lastPing < SESSION_TTL_MS) {
      return sess;
    }
  } catch (e) {
    console.error('Error leyendo sesiones locales:', e);
  }
  return null;
};

const setLocalActiveSession = (sess: ClientActiveSession) => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    const map: Record<string, ClientActiveSession> = raw ? JSON.parse(raw) : {};
    map[sess.userId.toLowerCase()] = sess;
    map[sess.userEmail.toLowerCase()] = sess;
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error guardando sesión local:', e);
  }
};

const removeLocalActiveSession = (userId: string, email: string) => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return;
    const map: Record<string, ClientActiveSession> = JSON.parse(raw);
    delete map[userId.toLowerCase()];
    delete map[email.toLowerCase()];
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error eliminando sesión local:', e);
  }
};

export interface AttemptLoginResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  activeSessionInfo?: {
    device: string;
    secondsAgo: number;
  };
}

export const attemptUserSessionLogin = async (
  user: User,
  override = false
): Promise<AttemptLoginResult> => {
  const sessionId = getOrCreateSessionId();
  const device = getDeviceDescription();
  const userKey = user.id.toLowerCase();

  // 1. First check LocalStorage / Broadcast (instant cross-tab check)
  const localSess = getLocalActiveSession(user.id, user.correo);
  if (localSess && localSess.sessionId !== sessionId && !override) {
    const secondsAgo = Math.max(1, Math.round((Date.now() - localSess.lastPing) / 1000));
    return {
      success: false,
      error: 'Usuario con sesíon activa en otro dispositivo',
      activeSessionInfo: {
        device: localSess.device,
        secondsAgo,
      },
    };
  }

  // 2. Check Backend Server (cross-device check)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('/api/sessions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.correo,
        sessionId,
        device,
        userName: user.nombre,
        override,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      const activeSession = data.activeSession;
      const secondsAgo = activeSession?.lastPing
        ? Math.max(1, Math.round((Date.now() - activeSession.lastPing) / 1000))
        : 5;
      return {
        success: false,
        error: data.error || 'Usuario con sesíon activa en otro dispositivo',
        activeSessionInfo: {
          device: activeSession?.device || 'Otro dispositivo',
          secondsAgo,
        },
      };
    }
  } catch {
    // If backend is unreachable or times out, local storage check above stands as fallback
  }

  // Mark local session as active
  setLocalActiveSession({
    sessionId,
    userId: user.id,
    userEmail: user.correo,
    device,
    lastPing: Date.now(),
  });

  return { success: true, sessionId };
};

export const startSessionHeartbeat = (
  user: User,
  onTerminated: (reason: string) => void
): (() => void) => {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return () => {};

  const ping = async () => {
    const now = Date.now();
    const device = getDeviceDescription();
    // Update local storage
    setLocalActiveSession({
      sessionId,
      userId: user.id,
      userEmail: user.correo,
      device,
      lastPing: now,
    });

    // Update server
    try {
      const res = await fetch('/api/sessions/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.correo,
          userName: user.nombre,
          device,
          sessionId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid === false && data.reason === 'INACTIVE_USER') {
          onTerminated('Tu cuenta ha sido marcada como inactiva');
        }
      }
    } catch {
      // ignore transient network hiccups
    }
  };

  // Immediate ping then every 10 seconds
  ping();
  const intervalId = setInterval(ping, 10000);

  // Cross-tab broadcast listener
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel('mycollege_session_channel');
    bc.onmessage = (event) => {
      const data = event.data;
      if (
        data?.type === 'NEW_LOGIN' &&
        data?.userId?.toLowerCase() === user.id.toLowerCase() &&
        data?.sessionId !== sessionId
      ) {
        onTerminated('Usuario con sesíon activa en otro dispositivo');
      }
    };
  } catch {
    // ignore
  }

  return () => {
    clearInterval(intervalId);
    if (bc) bc.close();
  };
};

export const terminateUserSession = async (user: User) => {
  const sessionId = getCurrentSessionId();
  removeLocalActiveSession(user.id, user.correo);
  clearCurrentSessionId();

  try {
    await fetch('/api/sessions/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.correo,
        sessionId,
      }),
    });
  } catch {
    // ignore
  }
};
