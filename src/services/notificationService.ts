import { EmailNotification, Student, SYSTEM_NOTIFICATION_EMAIL, User, UserRole } from '../types';

const STORAGE_KEY = 'my_college_notifications_v1';

export const INITIAL_EMAIL_NOTIFICATIONS: EmailNotification[] = [
  {
    id: 'notif-1',
    colegioId: 'col-cervantes',
    colegioNombre: 'Colegio Cervantes Bosques',
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: ['directivo@cervantes.edu.mx', 'prefectura@cervantes.edu.mx', 'tutor.garcia@gmail.com'],
    rolesDestino: ['directivo', 'prefecto'],
    asunto: '[My College - Incidencia Grave] Citatorio a Tutor: Mateo García Lozano',
    cuerpo: 'Se ha registrado una incidencia disciplinaria clasificada como grave (Uso indebido de celular en laboratorio) para el alumno Mateo García Lozano (2° A). Se solicita citatorio presencial.',
    categoria: 'incidencia',
    prioridad: 'alta',
    fecha: '2026-09-28',
    hora: '08:45 AM',
    leido: false,
    estatusEntrega: 'entregado',
  },
  {
    id: 'notif-2',
    colegioId: 'col-cervantes',
    colegioNombre: 'Colegio Cervantes Bosques',
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: ['docentes@cervantes.edu.mx', 'direccion@cervantes.edu.mx'],
    rolesDestino: ['docente', 'directivo', 'coordinador'],
    asunto: '[Comunicado Oficial] Consejo Técnico Escolar y Entrega de Planeaciones',
    cuerpo: 'Estimado cuerpo docente y directivo: Se les recuerda que la entrega de planeaciones didácticas del bloque 2 vence este viernes a las 18:00 hrs.',
    categoria: 'comunicado',
    prioridad: 'normal',
    fecha: '2026-09-28',
    hora: '07:30 AM',
    leido: true,
    estatusEntrega: 'entregado',
  },
  {
    id: 'notif-3',
    colegioId: 'col-anglo',
    colegioNombre: 'Instituto Anglo Mexicano',
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: ['tutor.valeria@outlook.com', 'prefectura@anglo.edu.mx'],
    rolesDestino: ['prefecto', 'directivo'],
    asunto: '[My College - Control de Asistencia] Registro de Retardo: Valeria Sofia Ramos',
    cuerpo: 'Aviso automatizado: El alumno Valeria Sofia Ramos (3° B) registró ingreso con retardo (07:42 AM, tolerancia máxima 07:15 AM). Registrado mediante Tótem Escolar.',
    categoria: 'asistencia',
    prioridad: 'normal',
    fecha: '2026-09-28',
    hora: '07:42 AM',
    leido: false,
    estatusEntrega: 'entregado',
  },
  {
    id: 'notif-4',
    colegioId: 'col-cervantes',
    colegioNombre: 'Colegio Cervantes Bosques',
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: ['admin@cervantes.edu.mx', 'superadmin@mycollege.edu'],
    rolesDestino: ['administrador', 'superusuario'],
    asunto: '[Facturación My College] Confirmación de Pago y Renovación Plan Campus Elite',
    cuerpo: 'El pago mensual correspondiente al Colegio Cervantes Bosques ($6,800.00 MXN) ha sido procesado exitosamente. Todos los módulos continúan activos.',
    categoria: 'facturacion',
    prioridad: 'normal',
    fecha: '2026-09-27',
    hora: '14:20 PM',
    leido: true,
    estatusEntrega: 'entregado',
  },
];

const MAX_STORED_NOTIFICATIONS = 120;

export const loadStoredNotifications = (): EmailNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: EmailNotification[] = JSON.parse(raw);
      return (Array.isArray(parsed) ? parsed : []).map((n) => ({
        ...n,
        cuerpoHtml:
          n.cuerpoHtml ||
          buildInstitutionalEmailHtml({
            colegioNombre: n.colegioNombre || 'Sistema My College',
            asunto: n.asunto || '',
            cuerpo: n.cuerpo || '',
            categoria: n.categoria || 'sistema',
            fecha: n.fecha || '',
            hora: n.hora || '',
          }),
      }));
    }
  } catch (e) {
    console.warn('Error cargando notificaciones:', e);
  }
  return INITIAL_EMAIL_NOTIFICATIONS;
};

export const saveStoredNotifications = (notifs: EmailNotification[]) => {
  // Keep only the latest notifications and omit bulky cuerpoHtml in localStorage (it is regenerated on load)
  const prepareCompactList = (limit: number) =>
    (Array.isArray(notifs) ? notifs : []).slice(0, limit).map(({ cuerpoHtml, ...rest }) => rest);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prepareCompactList(MAX_STORED_NOTIFICATIONS)));
  } catch {
    try {
      // If localStorage is near capacity, prune older activity logs and save a smaller batch of notifications
      localStorage.removeItem('my_college_v1_activity_logs');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prepareCompactList(40)));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prepareCompactList(15)));
      } catch {
        // Ignore if browser storage is completely disabled/full
      }
    }
  }
};

export interface SendNotificationParams {
  colegioId: string | null;
  colegioNombre?: string;
  destinatarios: string[];
  rolesDestino: (UserRole | string)[];
  usuariosDestino?: string[];
  asunto: string;
  cuerpo: string;
  categoria: 'asistencia' | 'incidencia' | 'calificaciones' | 'comunicado' | 'facturacion' | 'seguridad' | 'sistema';
  prioridad?: 'normal' | 'alta' | 'urgente';
  cuerpoHtml?: string;
}

/**
 * Determina si una notificación de la campanita involucra directamente al usuario actual.
 * REGLA ESTRICTA:
 * - Las notificaciones personales (ej. cambios de contraseña, altas de usuario/credenciales, pagos o preinscripciones individuales)
 *   SOLO se muestran al usuario titular involucrado (por su ID, correo o usuarioLogin), nunca a otros usuarios aunque sean directivos o superusuarios.
 * - Las notificaciones de alumnos (asistencias/retardos, incidencias) solo se muestran al tutor/alumno involucrado y al personal del plantel responsable de ese evento.
 * - Los comunicados generales del plantel solo se muestran a los usuarios de ese colegio cuyo rol esté incluido en rolesDestino.
 */
export const isNotificationForUser = (
  notif: EmailNotification,
  user: User | null | undefined,
  studentsList: Student[] = []
): boolean => {
  if (!user) return false;

  const userEmail = (user.correo || '').trim().toLowerCase();
  const userLogin = (user.usuarioLogin || '').trim().toLowerCase();
  const userId = (user.id || '').trim().toLowerCase();

  // 1. Validar aislamiento por colegio: si el usuario pertenece a un colegio fijo, nunca ve eventos de otro colegio
  if (user.colegioId && notif.colegioId && notif.colegioId !== 'global' && notif.colegioId !== user.colegioId) {
    return false;
  }

  const recipients = (notif.destinatarios || []).map((d) => (d || '').trim().toLowerCase()).filter(Boolean);
  const targetUsers = (notif.usuariosDestino || []).map((u) => (u || '').trim().toLowerCase()).filter(Boolean);

  // Coincidencia directa con el usuario (por correo, usuarioLogin o ID)
  const isDirectUserMatch =
    (userEmail && (recipients.includes(userEmail) || targetUsers.includes(userEmail))) ||
    (userLogin && (recipients.includes(userLogin) || targetUsers.includes(userLogin))) ||
    (userId && targetUsers.includes(userId)) ||
    (userLogin &&
      recipients.some((r) => r.startsWith(`${userLogin}@`)));

  // Coincidencia por hijos vinculados (si es tutor o alumno)
  const linkedStudents = studentsList.filter(
    (s) =>
      (user.hijosIds && user.hijosIds.includes(s.id)) ||
      (user.estudianteId && user.estudianteId === s.id) ||
      (userEmail && (s.tutorCorreo || '').trim().toLowerCase() === userEmail) ||
      (user.id && s.tutorId === user.id)
  );
  const isLinkedStudentMatch = linkedStudents.some((st) => {
    const stTutorEmail = (st.tutorCorreo || '').trim().toLowerCase();
    const stId = (st.id || '').trim().toLowerCase();
    const stLogin = (st.usuarioLogin || '').trim().toLowerCase();
    return (
      (stTutorEmail && recipients.includes(stTutorEmail)) ||
      (stId && targetUsers.includes(stId)) ||
      (stLogin && targetUsers.includes(stLogin))
    );
  });

  // 2. Si la notificación tiene usuariosDestino explícitos, SOLO esos usuarios involucrados pueden verla
  if (targetUsers.length > 0) {
    return Boolean(isDirectUserMatch || isLinkedStudentMatch);
  }

  // 3. Notificaciones privadas o personales (cambios de contraseña, alta de credenciales, preinscripciones individuales, pagos individuales)
  const subjectLower = (notif.asunto || '').toLowerCase();
  const isPersonalSecurityOrAccountEvent =
    notif.categoria === 'seguridad' ||
    subjectLower.includes('contraseña') ||
    subjectLower.includes('credenciales') ||
    subjectLower.includes('alta de usuario') ||
    subjectLower.includes('alta de institución') ||
    subjectLower.includes('[admisiones]') ||
    subjectLower.includes('confirmación de pago') ||
    subjectLower.includes('pago confirmado') ||
    subjectLower.includes('grupo escolar asignado');

  if (isPersonalSecurityOrAccountEvent) {
    return Boolean(isDirectUserMatch || isLinkedStudentMatch);
  }

  // 4. Si el usuario aparece directamente en los destinatarios o es tutor/alumno del estudiante involucrado
  if (isDirectUserMatch || isLinkedStudentMatch) {
    return true;
  }

  // 5. Verificar si los destinatarios son correos genéricos/grupales del rol en su colegio (ej. comunicados@, docentes@, prefectura@, direccion@)
  const genericPrefixes = [
    'comunicados@',
    'comunidad@',
    'todos@',
    'docentes@',
    'docente@',
    'prefectura@',
    'prefecto@',
    'direccion@',
    'directivo@',
    'coordinador@',
    'psicologo@',
    'supervisor@',
    'admin@',
    'administrador@',
    'superadmin@',
    'superusuario@',
  ];
  const hasGroupBroadcastAddress = recipients.some((r) =>
    genericPrefixes.some((prefix) => r.startsWith(prefix))
  );

  // Si la notificación fue enviada únicamente a correos personales de otras personas y NO a un buzón grupal, no mostrarla a terceros
  if (!hasGroupBroadcastAddress) {
    return false;
  }

  // 6. Para avisos o alertas grupales del colegio, validar que el rol del usuario esté involucrado en rolesDestino
  const roles = Array.isArray(notif.rolesDestino) ? notif.rolesDestino : [];
  const isRoleIncluded =
    roles.includes(user.rol) ||
    roles.includes('todos') ||
    roles.includes('comunidad');

  if (!isRoleIncluded) {
    return false;
  }

  // Además, si el usuario tiene un colegio asignado (o si no es superusuario), debe coincidir con el colegio del evento
  if (user.colegioId && notif.colegioId && notif.colegioId !== 'global' && notif.colegioId !== user.colegioId) {
    return false;
  }

  return true;
};

export const isNotificationReadByUser = (
  notif: EmailNotification,
  user: User | null | undefined
): boolean => {
  if (!user) return Boolean(notif.leido);
  if (Array.isArray(notif.leidoPorIds) && notif.leidoPorIds.includes(user.id)) {
    return true;
  }
  return Boolean(notif.leido);
};

/**
 * Construye una plantilla HTML institucional de alta presentación para correos de notificación,
 * resaltando bloques de credenciales, el enlace oficial https://dashboard.mycollege.com.mx y el
 * recordatorio de seguridad para cambiar la contraseña desde Mi Perfil.
 */
export const buildInstitutionalEmailHtml = (params: {
  colegioNombre: string;
  asunto: string;
  cuerpo: string;
  categoria: string;
  fecha: string;
  hora: string;
}): string => {
  const lines = params.cuerpo.split('\n');
  let bodyHtml = '';
  let inBox = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('===') && line.endsWith('===')) {
      if (inBox) {
        bodyHtml += `</div>`;
      }
      const sectionTitle = line.replace(/===/g, '').trim();
      bodyHtml += `
        <div style="margin: 18px 0 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #DFB743; border-radius: 10px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0B2545; margin-bottom: 8px;">
            ${sectionTitle}
          </div>`;
      inBox = true;
    } else if (line.startsWith('•')) {
      const itemText = line
        .substring(1)
        .trim()
        .replace(
          /(https?:\/\/[^\s]+|dashboard\.mycollege\.com\.mx[^\s]*)/g,
          (match) => {
            const href = match.startsWith('http') ? match : `https://${match}`;
            return `<a href="${href}" target="_blank" style="color: #1d4ed8; font-weight: 700; text-decoration: underline;">${match}</a>`;
          }
        );
      const parts = itemText.split(':');
      if (parts.length >= 2) {
        const label = parts[0];
        const val = parts.slice(1).join(':').trim();
        bodyHtml += `
          <div style="padding: 5px 0; font-size: 13px; color: #1e293b; border-bottom: 1px dashed #e2e8f0;">
            <strong style="color: #475569;">${label}:</strong>
            <span style="font-family: monospace; font-weight: 700; color: #0B2545; background: #fffbeb; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a; margin-left: 4px;">${val}</span>
          </div>`;
      } else {
        bodyHtml += `<div style="padding: 4px 0; font-size: 13px; color: #1e293b;">• ${itemText}</div>`;
      }
    } else if (line === '') {
      if (inBox) {
        bodyHtml += `</div>`;
        inBox = false;
      } else {
        bodyHtml += `<div style="height: 10px;"></div>`;
      }
    } else {
      const linkedLine = line.replace(
        /(https?:\/\/[^\s]+|dashboard\.mycollege\.com\.mx[^\s]*)/g,
        (match) => {
          const href = match.startsWith('http') ? match : `https://${match}`;
          return `<a href="${href}" target="_blank" style="color: #1d4ed8; font-weight: 700; text-decoration: underline;">${match}</a>`;
        }
      );
      if (
        line.toLowerCase().includes('recordatorio') ||
        line.toLowerCase().includes('importante') ||
        line.toLowerCase().includes('cambie su contraseña') ||
        line.toLowerCase().includes('cambiar su contraseña')
      ) {
        bodyHtml += `
          <div style="margin: 14px 0; padding: 12px 14px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; color: #92400e; font-size: 12.5px; font-weight: 600;">
            🔒 ${linkedLine}
          </div>`;
      } else {
        bodyHtml += `<p style="margin: 6px 0; font-size: 14px; color: #334155; line-height: 1.6;">${linkedLine}</p>`;
      }
    }
  }

  if (inBox) {
    bodyHtml += `</div>`;
  }

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(11, 37, 69, 0.08);">
      <!-- Header Institucional -->
      <div style="background: linear-gradient(135deg, #0B2545 0%, #133b6e 100%); color: #ffffff; padding: 24px 28px; border-bottom: 4px solid #DFB743;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span style="display: inline-block; background-color: #DFB743; color: #0B2545; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 999px; margin-bottom: 8px;">
              Notificación Oficial · ${params.categoria.toUpperCase()}
            </span>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
              ${params.colegioNombre || 'My College · Plataforma de Gestión Escolar'}
            </h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">
              ${params.asunto}
            </p>
          </div>
        </div>
      </div>

      <!-- Cuerpo del Mensaje -->
      <div style="padding: 28px;">
        ${bodyHtml}

        <!-- Botón de Acceso Directo al Portal -->
        <div style="margin: 24px 0 16px; text-align: center;">
          <a href="https://dashboard.mycollege.com.mx" target="_blank" style="display: inline-block; background-color: #0B2545; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 26px; border-radius: 10px; border-bottom: 3px solid #DFB743;">
            Ingresar a dashboard.mycollege.com.mx →
          </a>
        </div>

        <!-- Recordatorio Permanente de Seguridad -->
        <div style="margin-top: 20px; padding: 12px 16px; background-color: #f1f5f9; border-radius: 10px; border-left: 4px solid #0B2545; font-size: 12px; color: #334155;">
          <strong style="color: #0B2545;">Recordatorio de Seguridad:</strong> Una vez que ingrese al portal en <a href="https://dashboard.mycollege.com.mx" target="_blank" style="color: #1d4ed8; font-weight: 700;">dashboard.mycollege.com.mx</a>, le recomendamos dirigirse al apartado <strong>"Mi Perfil"</strong> y cambiar su contraseña por una personalizada.
        </div>
      </div>

      <!-- Pie de Correo -->
      <div style="background-color: #f8fafc; padding: 16px 28px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
        <div>
          Enviado por <strong>${SYSTEM_NOTIFICATION_EMAIL}</strong> · ${params.fecha} ${params.hora}
        </div>
        <div>
          Portal Oficial: <a href="https://dashboard.mycollege.com.mx" style="color: #0B2545; font-weight: 700; text-decoration: none;">dashboard.mycollege.com.mx</a>
        </div>
      </div>
    </div>
  `;
};

export const dispatchSystemEmailNotification = (
  params: SendNotificationParams
): EmailNotification => {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0];
  const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const colegioNombre = params.colegioNombre || 'Sistema My College';
  const generatedHtml =
    params.cuerpoHtml ||
    buildInstitutionalEmailHtml({
      colegioNombre,
      asunto: params.asunto,
      cuerpo: params.cuerpo,
      categoria: params.categoria,
      fecha,
      hora,
    });

  const newNotification: EmailNotification = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    colegioId: params.colegioId,
    colegioNombre,
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: params.destinatarios.length > 0 ? params.destinatarios : ['comunidad@mycollege.com.mx'],
    rolesDestino: params.rolesDestino,
    usuariosDestino: params.usuariosDestino,
    asunto: params.asunto,
    cuerpo: params.cuerpo,
    cuerpoHtml: generatedHtml,
    categoria: params.categoria,
    prioridad: params.prioridad || 'normal',
    fecha,
    hora,
    leido: false,
    leidoPorIds: [],
    estatusEntrega: 'entregado',
  };

  const current = loadStoredNotifications();
  const updated = [newNotification, ...current];
  saveStoredNotifications(updated);

  // Trigger real server-side SMTP email dispatch only for external deliverable email addresses
  if (typeof window !== 'undefined' && newNotification.destinatarios.length > 0) {
    const externalRecipients = newNotification.destinatarios.filter((addr) => {
      const lower = (addr || '').trim().toLowerCase();
      if (!lower || !lower.includes('@')) return false;
      // Skip auto-generated internal/placeholder addresses (e.g. @alumno.*.edu.mx, @correo.com)
      if (
        lower.includes('@alumno.') ||
        lower.endsWith('@correo.com') ||
        lower.endsWith('@mycollege.edu.mx') ||
        lower === 'comunidad@mycollege.com.mx'
      ) {
        return false;
      }
      return true;
    });

    if (externalRecipients.length > 0) {
      fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: externalRecipients,
          subject: newNotification.asunto,
          text: newNotification.cuerpo,
          html: newNotification.cuerpoHtml,
          colegioNombre: newNotification.colegioNombre,
        }),
      }).catch(() => {
        // Fallback silently to local inbox if offline
      });
    }
  }

  // Broadcast event across tabs
  try {
    const bc = new BroadcastChannel('mycollege_notifications_channel');
    bc.postMessage({ type: 'NEW_NOTIFICATION', notification: newNotification });
    bc.close();
  } catch {
    // ignore
  }

  return newNotification;
};
