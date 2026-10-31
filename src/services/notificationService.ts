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
 * Determina si una notificación de la campanita involucra directamente al usuario actual y a su perfil/rol activo.
 * REGLA ESTRICTA:
 * - Solo se muestran las notificaciones que involucren a ese usuario Y ese perfil, nunca las notificaciones de otros colegios o de otros usuarios.
 * - Si el usuario no tiene colegio asignado (Superusuario / Soporte en vista global), solo ve notificaciones globales o dirigidas directamente a su usuario y perfil actual.
 * - Si el usuario pertenece a un colegio (o está dentro de un colegio), solo ve notificaciones de ese colegio que involucren a su usuario y perfil actual.
 */
export const isNotificationForUser = (
  notif: EmailNotification,
  user: User | null | undefined,
  studentsList: Student[] = [],
  activeCollegeId?: string | null
): boolean => {
  if (!user) return false;

  const userEmail = (user.correo || '').trim().toLowerCase();
  const userLogin = (user.usuarioLogin || '').trim().toLowerCase();
  const userId = (user.id || '').trim().toLowerCase();
  const userRole = (user.rol || '').trim().toLowerCase();

  // 1. Validar que el perfil/rol actual del usuario esté involucrado en rolesDestino (cuando rolesDestino está definido)
  const roles = Array.isArray(notif.rolesDestino)
    ? notif.rolesDestino.map((r) => (r || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const isRoleMatched =
    roles.length === 0 ||
    roles.includes(userRole) ||
    roles.includes('todos') ||
    roles.includes('comunidad');

  if (!isRoleMatched) {
    return false;
  }

  // 2. Validar aislamiento estricto por colegio:
  // Determinar el contexto de colegio efectivo del usuario (su colegio asignado o el colegio activo si aplica)
  const effectiveUserCollegeId = user.colegioId || activeCollegeId || null;

  if (effectiveUserCollegeId) {
    // El usuario está ligado a un colegio: NO debe ver notificaciones de otros colegios
    if (
      notif.colegioId &&
      notif.colegioId !== 'global' &&
      notif.colegioId !== effectiveUserCollegeId
    ) {
      return false;
    }
  } else {
    // El usuario es global (Superusuario o Soporte sin colegio seleccionado):
    // NO debe ver notificaciones internas de otros colegios a menos que estén dirigidas directamente a su usuario
    const recipientsCheck = (notif.destinatarios || []).map((d) => (d || '').trim().toLowerCase());
    const targetUsersCheck = (notif.usuariosDestino || []).map((u) => (u || '').trim().toLowerCase());
    const isExplicitlyForThisGlobalUser =
      (userEmail && (recipientsCheck.includes(userEmail) || targetUsersCheck.includes(userEmail))) ||
      (userLogin && (recipientsCheck.includes(userLogin) || targetUsersCheck.includes(userLogin))) ||
      (userId && targetUsersCheck.includes(userId));

    if (notif.colegioId && notif.colegioId !== 'global' && !isExplicitlyForThisGlobalUser) {
      return false;
    }
  }

  const recipients = (notif.destinatarios || []).map((d) => (d || '').trim().toLowerCase()).filter(Boolean);
  const targetUsers = (notif.usuariosDestino || []).map((u) => (u || '').trim().toLowerCase()).filter(Boolean);

  // Coincidencia directa con el usuario (por correo, usuarioLogin o ID)
  const isDirectUserMatch =
    (userEmail && (recipients.includes(userEmail) || targetUsers.includes(userEmail))) ||
    (userLogin && (recipients.includes(userLogin) || targetUsers.includes(userLogin))) ||
    (userId && targetUsers.includes(userId)) ||
    (userLogin && recipients.some((r) => r.startsWith(`${userLogin}@`)));

  // Coincidencia por hijos vinculados (únicamente cuando el perfil activo es tutor o alumno)
  const linkedStudents =
    userRole === 'tutor' || userRole === 'alumno'
      ? studentsList.filter(
          (s) =>
            (user.hijosIds && user.hijosIds.includes(s.id)) ||
            (user.estudianteId && user.estudianteId === s.id) ||
            (userEmail && (s.tutorCorreo || '').trim().toLowerCase() === userEmail) ||
            (user.id && s.tutorId === user.id)
        )
      : [];

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

  // 3. Si la notificación es un aviso global operativo dirigido a Soporte / Superusuario (ej. Solicitud para Reanudar Inscripción tras finalizar Demo), mostrar a cualquier usuario con ese perfil activo
  if (
    notif.colegioId === 'global' &&
    (userRole === 'superusuario' || userRole === 'soporte') &&
    (roles.includes(userRole) || roles.includes('superusuario') || roles.includes('soporte'))
  ) {
    return true;
  }

  // 4. Si la notificación tiene usuariosDestino explícitos, SOLO ese usuario involucrado (con su perfil correspondiente) puede verla
  if (targetUsers.length > 0) {
    return Boolean(isDirectUserMatch || isLinkedStudentMatch);
  }

  // 4. Notificaciones privadas o personales (cambios de contraseña, alta de credenciales, preinscripciones individuales, pagos individuales)
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

  // 5. Si el usuario aparece directamente en los destinatarios o es tutor/alumno del estudiante involucrado
  if (isDirectUserMatch || isLinkedStudentMatch) {
    return true;
  }

  // 6. Verificar si los destinatarios incluyen el buzón grupal específico del rol/perfil actual en su mismo colegio
  const roleBroadcastPrefixes: Record<string, string[]> = {
    superusuario: ['superadmin@', 'superusuario@', 'todos@'],
    soporte: ['soporte@', 'todos@'],
    administrador: ['admin@', 'administrador@', 'direccion@', 'comunicados@', 'comunidad@', 'todos@'],
    directivo: ['directivo@', 'direccion@', 'comunicados@', 'comunidad@', 'todos@'],
    coordinador: ['coordinador@', 'comunicados@', 'comunidad@', 'todos@'],
    supervisor: ['supervisor@', 'comunicados@', 'comunidad@', 'todos@'],
    prefecto: ['prefectura@', 'prefecto@', 'comunicados@', 'comunidad@', 'todos@'],
    psicologo: ['psicologo@', 'comunicados@', 'comunidad@', 'todos@'],
    docente: ['docentes@', 'docente@', 'comunicados@', 'comunidad@', 'todos@'],
    tutor: ['tutores@', 'padres@', 'comunicados@', 'comunidad@', 'todos@'],
    alumno: ['alumnos@', 'estudiantes@', 'comunicados@', 'comunidad@', 'todos@'],
  };

  const allowedPrefixesForRole = roleBroadcastPrefixes[userRole] || [
    `${userRole}@`,
    'comunicados@',
    'comunidad@',
    'todos@',
  ];

  const hasMatchingRoleBroadcast = recipients.some((r) =>
    allowedPrefixesForRole.some((prefix) => r.startsWith(prefix))
  );

  if (!hasMatchingRoleBroadcast) {
    return false;
  }

  // Para comunicados grupales de un colegio, exigir que el usuario pertenezca o esté en ese mismo colegio
  if (notif.colegioId && notif.colegioId !== 'global') {
    if (!effectiveUserCollegeId || notif.colegioId !== effectiveUserCollegeId) {
      return false;
    }
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
 * Construye una plantilla HTML institucional limpia y optimizada para máxima entregabilidad (Bandeja de Entrada),
 * usando un botón con texto descriptivo ("Ingresar al Portal Escolar") en lugar de mostrar URLs en el texto
 * y evitando palabras/patrones que disparen filtros anti-phishing de Gmail/Outlook.
 */
export const buildInstitutionalEmailHtml = (params: {
  colegioNombre: string;
  asunto: string;
  cuerpo: string;
  categoria: string;
  fecha: string;
  hora: string;
}): string => {
  const cleanSubject = params.asunto
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/contraseñas?/gi, 'Clave de Acceso')
    .replace(/credenciales/gi, 'Datos de Acceso')
    .trim();

  const sanitizedBody = params.cuerpo
    .replace(/contraseñas?\s+temporal(es)?/gi, 'Clave de ingreso inicial')
    .replace(/contraseña/gi, 'Clave de ingreso')
    .replace(/credenciales\s+oficiales\s+de\s+acceso/gi, 'Datos de ingreso al portal')
    .replace(/credenciales\s+de\s+acceso/gi, 'Datos de ingreso')
    .replace(/credenciales/gi, 'datos de ingreso');

  const lines = sanitizedBody.split('\n');
  let bodyHtml = '';
  let inBox = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    // Omit raw lines that only repeat the portal URL since we place a clean CTA button below
    if (
      line.toLowerCase().includes('portal de acceso:') ||
      line.toLowerCase().includes('enlace de acceso:')
    ) {
      continue;
    }

    if (line.startsWith('===') && line.endsWith('===')) {
      if (inBox) {
        bodyHtml += `</div>`;
      }
      const sectionTitle = line.replace(/===/g, '').trim();
      bodyHtml += `
        <div style="margin: 16px 0 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            ${sectionTitle}
          </div>`;
      inBox = true;
    } else if (line.startsWith('•')) {
      const itemText = line
        .substring(1)
        .trim()
        .replace(/https?:\/\/dashboard\.mycollege\.com\.mx[^\s]*/gi, 'Portal Escolar My College')
        .replace(/dashboard\.mycollege\.com\.mx[^\s]*/gi, 'Portal Escolar My College');

      const parts = itemText.split(':');
      if (parts.length >= 2) {
        const label = parts[0];
        const val = parts.slice(1).join(':').trim();
        bodyHtml += `
          <div style="padding: 4px 0; font-size: 14px; color: #1e293b;">
            <strong style="color: #334155;">${label}:</strong>
            <span style="font-family: Consolas, Monaco, monospace; font-weight: 700; color: #0f172a; margin-left: 4px;">${val}</span>
          </div>`;
      } else {
        bodyHtml += `<div style="padding: 4px 0; font-size: 14px; color: #1e293b;">• ${itemText}</div>`;
      }
    } else if (line === '') {
      if (inBox) {
        bodyHtml += `</div>`;
        inBox = false;
      } else {
        bodyHtml += `<div style="height: 8px;"></div>`;
      }
    } else {
      const cleanLine = line
        .replace(/https?:\/\/dashboard\.mycollege\.com\.mx[^\s,]*/gi, 'el portal escolar')
        .replace(/dashboard\.mycollege\.com\.mx[^\s,]*/gi, 'el portal escolar');
      bodyHtml += `<p style="margin: 8px 0; font-size: 14px; color: #1e293b; line-height: 1.6;">${cleanLine}</p>`;
    }
  }

  if (inBox) {
    bodyHtml += `</div>`;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <div style="padding: 20px 24px; border-bottom: 2px solid #0B2545;">
        <div style="font-size: 17px; font-weight: 700; color: #0B2545;">
          ${params.colegioNombre || 'My College'}
        </div>
        <div style="margin-top: 4px; font-size: 13px; color: #475569;">
          ${cleanSubject}
        </div>
      </div>

      <div style="padding: 24px;">
        ${bodyHtml}

        <div style="margin: 24px 0 8px; text-align: left;">
          <a href="https://dashboard.mycollege.com.mx" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0B2545; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 11px 22px; border-radius: 6px;">
            Ir al Portal Escolar
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 14px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Notificación académica enviada por ${params.colegioNombre || 'My College'}. Fecha: ${params.fecha} ${params.hora}.
      </div>
    </div>
  `;
};

const recentEmailDispatchGuard = new Map<string, number>();

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

  // Deduplicate recipients (case-insensitive) so the same address never receives 2 copies
  const uniqueDestinatarios = Array.from(
    new Map(
      (params.destinatarios.length > 0 ? params.destinatarios : ['comunidad@mycollege.com.mx'])
        .filter(Boolean)
        .map((d) => [d.trim().toLowerCase(), d.trim()])
    ).values()
  );

  const newNotification: EmailNotification = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    colegioId: params.colegioId,
    colegioNombre,
    remitente: SYSTEM_NOTIFICATION_EMAIL,
    destinatarios: uniqueDestinatarios,
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
      const dedupeKey = `${externalRecipients.map((r) => r.toLowerCase()).sort().join(',')}|${newNotification.asunto.trim().toLowerCase()}`;
      const lastSentTs = recentEmailDispatchGuard.get(dedupeKey) || 0;
      const nowTs = Date.now();

      if (nowTs - lastSentTs > 8000) {
        recentEmailDispatchGuard.set(dedupeKey, nowTs);
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
