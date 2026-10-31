/**
 * Utilidades para la gestión robusta de cámara y pruebas de lectura QR dentro de la app en AI Studio
 * Soporta cámara física (webcam/móvil) y cámara virtual de pruebas QR en tiempo real
 */

import QRCode from 'qrcode';

export interface CameraDevice {
  deviceId: string;
  label: string;
  facingMode?: 'environment' | 'user' | 'unknown';
}

export interface CameraPermissionState {
  status: 'prompt' | 'granted' | 'denied' | 'unsupported';
  errorDetails?: string;
}

export async function checkCameraSupport(): Promise<{
  supported: boolean;
  reason?: string;
}> {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Entorno de ventana no disponible' };
  }

  if (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext) {
    return {
      supported: false,
      reason: 'El acceso a la cámara física requiere una conexión segura (HTTPS).',
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      reason:
        'Tu navegador no soporta acceso directo a cámara web o está restringido por el contenedor.',
    };
  }

  return { supported: true };
}

export async function getAvailableCameraDevices(): Promise<CameraDevice[]> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    return videoInputs.map((d, index) => {
      const label = d.label || `Cámara ${index + 1}`;
      const lower = label.toLowerCase();
      let facingMode: 'environment' | 'user' | 'unknown' = 'unknown';
      if (
        lower.includes('back') ||
        lower.includes('trasera') ||
        lower.includes('posterior') ||
        lower.includes('environment') ||
        lower.includes('wide')
      ) {
        facingMode = 'environment';
      } else if (
        lower.includes('front') ||
        lower.includes('frontal') ||
        lower.includes('delantera') ||
        lower.includes('user') ||
        lower.includes('selfie') ||
        lower.includes('facetime')
      ) {
        facingMode = 'user';
      }
      return {
        deviceId: d.deviceId,
        label,
        facingMode,
      };
    });
  } catch (e) {
    console.warn('Error al enumerar dispositivos de cámara:', e);
    return [];
  }
}

export interface RequestStreamOptions {
  deviceId?: string;
  facingMode?: 'environment' | 'user';
}

export interface RequestStreamResult {
  stream: MediaStream | null;
  error: string | null;
  errorType?:
    | 'NotAllowedError'
    | 'NotFoundError'
    | 'NotReadableError'
    | 'OverconstrainedError'
    | 'InsecureContext'
    | 'PermissionsPolicyError'
    | 'Generic';
}

function classifyCameraError(err: any): {
  error: string;
  errorType: RequestStreamResult['errorType'];
} {
  const name = err?.name || '';
  const message = String(err?.message || '').toLowerCase();

  const inIframe = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (
    message.includes('permissions policy') ||
    message.includes('permission policy') ||
    message.includes('disallowed by permissions policy') ||
    name === 'SecurityError' ||
    (inIframe && (name === 'NotAllowedError' || name === 'PermissionDeniedError'))
  ) {
    return {
      error:
        'El visor embebido de AI Studio bloquea la cámara física por restricciones de seguridad del navegador (Permissions-Policy). Usa el botón "🎥 Cámara de Pruebas QR" para probar el escaneo aquí mismo, o abre la URL directa de la aplicación en otra pestaña para encender tu webcam física.',
      errorType: 'PermissionsPolicyError',
    };
  }

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      error:
        'El permiso de la cámara física fue denegado en el navegador. Haz clic en el ícono del candado 🔒 en la barra de direcciones para conceder acceso o usa la Cámara de Pruebas QR.',
      errorType: 'NotAllowedError',
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      error: 'No se detectó cámara web física conectada a este dispositivo.',
      errorType: 'NotFoundError',
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      error:
        'La cámara física está ocupada por otra app (Zoom, Meet u otra ventana).',
      errorType: 'NotReadableError',
    };
  }

  return {
    error: `No se pudo iniciar la cámara física (${name || 'Dispositivo no disponible'}).`,
    errorType: 'Generic',
  };
}

/**
 * Solicita acceso a la cámara física del usuario (webcam o cámara de móvil)
 */
export async function requestCameraStream(
  options: RequestStreamOptions = {}
): Promise<RequestStreamResult> {
  const support = await checkCameraSupport();
  if (!support.supported) {
    return {
      stream: null,
      error: support.reason || 'Cámara no soportada en este entorno',
      errorType: 'InsecureContext',
    };
  }

  const { deviceId, facingMode = 'environment' } = options;

  const attempts: MediaStreamConstraints[] = [];

  if (deviceId) {
    attempts.push({ video: { deviceId: { exact: deviceId } }, audio: false });
    attempts.push({ video: { deviceId }, audio: false });
    attempts.push({ video: true, audio: false });
  } else {
    attempts.push({
      video: {
        facingMode: { ideal: facingMode },
      },
      audio: false,
    });
    attempts.push({ video: true, audio: false });
  }

  for (let i = 0; i < attempts.length; i++) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(attempts[i]);
      if (stream && stream.getVideoTracks().length > 0) {
        return { stream, error: null };
      }
    } catch (err: any) {
      if (i === attempts.length - 1) {
        console.info('Permiso o acceso a cámara física no concedido:', err?.name || err?.message);
        const finalClass = classifyCameraError(err);
        return {
          stream: null,
          error: finalClass.error,
          errorType: finalClass.errorType,
        };
      }
    }
  }

  return { stream: null, error: 'No se pudo iniciar la cámara del dispositivo', errorType: 'Generic' };
}

/**
 * Conecta de forma segura y robusta un MediaStream a un elemento HTMLVideoElement
 */
export async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    video.onloadedmetadata = () => {
      video.play().then(done).catch((e) => {
        console.warn('Error en video.play() onloadedmetadata:', e);
        done();
      });
    };

    video.play().then(done).catch(() => {
      // Se completará cuando los metadatos se carguen o por el timer de seguridad
    });

    setTimeout(done, 600);
  });
}

export interface VirtualCameraOptions {
  qrPayload: string;
  studentName?: string;
  studentMatricula?: string;
  collegeName?: string;
  studentPhoto?: string;
}

/**
 * Genera un MediaStream de Cámara Virtual interactiva en tiempo real usando un Canvas HTML5.
 * Proyecta una credencial escolar con un código QR 100% válido y legible por jsQR.
 * Permite realizar pruebas de lectura de QR de manera directa aquí en AI Studio.
 */
export async function createVirtualCameraStream(
  options: VirtualCameraOptions
): Promise<{ stream: MediaStream; updatePayload: (newPayload: string, name?: string, mat?: string) => Promise<void>; stop: () => void }> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d', { alpha: false });

  let currentPayload = options.qrPayload;
  let currentStudentName = options.studentName || 'Estudiante';
  let currentMatricula = options.studentMatricula || 'MAT-2026';
  const collegeName = options.collegeName || 'My College';

  // Generar el código QR inicial en un canvas auxiliar
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, currentPayload, {
    width: 175,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const updatePayload = async (newPayload: string, name?: string, mat?: string) => {
    currentPayload = newPayload;
    if (name) currentStudentName = name;
    if (mat) currentMatricula = mat;
    await QRCode.toCanvas(qrCanvas, currentPayload, {
      width: 175,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  };

  let animId: number;
  let frame = 0;

  const render = () => {
    if (!ctx) return;
    frame++;

    // 1. Fondo de visor de cámara (ambiente simulado de aula / mostrador)
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Líneas sutiles de cuadrícula óptica de cámara
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 60; x < 640; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 60; y < 480; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // 2. Credencial escolar que se presenta al frente del lente
    const floatY = Math.sin(frame * 0.035) * 6;
    const cardW = 340;
    const cardH = 220;
    const cardX = (640 - cardW) / 2;
    const cardY = (480 - cardH) / 2 + floatY;

    // Sombra de la credencial
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(cardX + 6, cardY + 10, cardW, cardH, 16);
    ctx.fill();

    // Cuerpo de la credencial blanca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    // Encabezado institucional de la credencial
    const headGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    headGrad.addColorStop(0, '#0B2545');
    headGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, 40, [16, 16, 0, 0]);
    ctx.fill();

    // Texto del encabezado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${collegeName.toUpperCase().slice(0, 24)} · CREDENCIAL`, cardX + 16, cardY + 25);

    // 3. Dibujar el Código QR Nítido y de Alto Contraste (Crucial para jsQR)
    ctx.drawImage(qrCanvas, cardX + 14, cardY + 48, 155, 155);

    // 4. Datos del alumno al lado derecho
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(currentStudentName.slice(0, 18), cardX + 180, cardY + 76);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText(currentMatricula, cardX + 180, cardY + 98);

    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.fillText('Credencial Oficial SEP', cardX + 180, cardY + 118);

    // Pill de estatus
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath();
    ctx.roundRect(cardX + 180, cardY + 138, 130, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('● CREDENCIAL VÁLIDA', cardX + 190, cardY + 153);

    // Badge inferior en la cámara
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(14, 442, 280, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🎥 Cámara de Pruebas QR · AI Studio', 24, 459);

    animId = requestAnimationFrame(render);
  };

  render();

  // Obtener stream desde el canvas (30 FPS)
  let stream: MediaStream;
  if ((canvas as any).captureStream) {
    stream = (canvas as any).captureStream(30);
  } else if ((canvas as any).mozCaptureStream) {
    stream = (canvas as any).mozCaptureStream(30);
  } else {
    stream = (canvas as any).captureStream(30);
  }

  const stop = () => {
    if (animId) cancelAnimationFrame(animId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  return { stream, updatePayload, stop };
}
