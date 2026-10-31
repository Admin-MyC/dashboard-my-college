import {
  PreenrollmentFeeConcept,
  PreenrollmentLevel,
  PreenrollmentDocumentRequirement,
  PreenrollmentCollegeConfig,
} from '../types';

/**
 * Requisitos de documentos predeterminados para colegios
 */
export const DEFAULT_DOCUMENT_REQUIREMENTS: PreenrollmentDocumentRequirement[] = [
  {
    id: 'doc-acta',
    nombre: 'Acta de Nacimiento',
    descripcion: 'Copia legible del acta de nacimiento oficial',
    activo: true,
    obligatorio: true,
  },
  {
    id: 'doc-boleta',
    nombre: 'Boleta de Calificaciones o Certificado',
    descripcion: 'Boleta oficial del ciclo escolar previo o kardex',
    activo: true,
    obligatorio: true,
  },
  {
    id: 'doc-curp',
    nombre: 'CURP del Alumno en Digital',
    descripcion: 'Formato descargable oficial de RENAPO',
    activo: true,
    obligatorio: true,
  },
  {
    id: 'doc-comprobante',
    nombre: 'Comprobante de Domicilio',
    descripcion: 'Recibo reciente de luz, agua o telefonía (no mayor a 3 meses)',
    activo: true,
    obligatorio: false,
  },
  {
    id: 'doc-medico',
    nombre: 'Certificado Médico / Cartilla',
    descripcion: 'Certificado de salud expedido por médico con tipo sanguíneo',
    activo: true,
    obligatorio: false,
  },
  {
    id: 'doc-conducta',
    nombre: 'Carta de Buena Conducta',
    descripcion: 'Constancia expedida por la institución escolar anterior',
    activo: false,
    obligatorio: false,
  },
];

/**
 * Genera la configuración predeterminada del formulario para un colegio
 */
export function createDefaultCollegePreenrollmentConfig(
  colegioId: string
): PreenrollmentCollegeConfig {
  return {
    colegioId,
    nivelesDisponibles: ['preescolar', 'primaria', 'secundaria', 'preparatoria'],
    documentosRequeridos: DEFAULT_DOCUMENT_REQUIREMENTS.map((d) => ({ ...d })),
    mostrarCuotasEstimadas: true,
    cuotasPorNivel: {
      preescolar: getDefaultEnrollmentFees('preescolar'),
      primaria: getDefaultEnrollmentFees('primaria'),
      secundaria: getDefaultEnrollmentFees('secundaria'),
      preparatoria: getDefaultEnrollmentFees('preparatoria'),
    },
    pedirEscuelaProcedencia: true,
    pedirPromedio: true,
    pedirFechaNacimiento: true,
    instruccionesPersonalizadas:
      'Completa los campos del aspirante y adjunta los documentos requeridos. Al enviar, tu solicitud pasará inmediatamente al comité de admisiones del colegio para su revisión.',
    correoNotificacionesAdmisiones: '',
  };
}

/**
 * Genera un número de 4 dígitos determinístico a partir de una semilla (ID o nombre)
 * únicamente para respaldar registros antiguos que no tenían usuario guardado en BD.
 */
export function getDeterministic4Digits(seed: string): string {
  const cleanSeed = (seed || 'mycollege').trim();
  let hash = 0;
  for (let i = 0; i < cleanSeed.length; i++) {
    hash = (hash * 31 + cleanSeed.charCodeAt(i)) >>> 0;
  }
  const num = 1000 + (hash % 9000);
  return String(num);
}

/**
 * Genera de manera automática el usuario:
 * Primera inicial de su primer nombre + primer apellido + 4 dígitos aleatorios.
 * Una vez generados los 4 dígitos por primera vez, se mantienen fijos y se guardan en la base de datos.
 * Ejemplo: "Carlos Mendoza" -> "cmendoza4821"
 */
export function generateTutorUsername(
  fullName: string,
  fixed4Digits?: string | number
): string {
  const digitsStr =
    fixed4Digits !== undefined && /^\d{4}$/.test(String(fixed4Digits).trim())
      ? String(fixed4Digits).trim()
      : String(Math.floor(1000 + Math.random() * 9000));

  if (!fullName || !fullName.trim()) {
    return `usr${digitsStr}`;
  }

  // Normalizar acentos, eliminar texto entre paréntesis como (Ret.) y caracteres especiales
  const clean = fullName
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const titles = new Set([
    'lic',
    'dr',
    'dra',
    'ing',
    'mtro',
    'mtra',
    'prof',
    'profr',
    'profra',
    'cp',
    'arq',
    'sr',
    'sra',
    'srta',
    'c',
    'cap',
    'ret',
    'psic',
    'coord',
    'dir',
  ]);

  const rawParts = clean
    .split(/\s+/)
    .map((p) => p.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  const parts = rawParts.filter((p) => !titles.has(p));
  const effectiveParts = parts.length > 0 ? parts : rawParts;

  const firstInitial = effectiveParts[0]?.charAt(0) || 'u';

  // Si tiene 4 o más palabras (ej. 2 nombres y 2 apellidos), el primer apellido es el penúltimo;
  // si tiene 2 o 3 palabras, el primer apellido es el segundo elemento.
  const surnameIndex =
    effectiveParts.length >= 4
      ? effectiveParts.length - 2
      : effectiveParts.length > 1
      ? 1
      : 0;
  const rawLastName = effectiveParts[surnameIndex] || effectiveParts[0] || 'usuario';
  const cleanLastName = rawLastName.replace(/[^a-z0-9]/g, '');

  return `${firstInitial}${cleanLastName}${digitsStr}`;
}

/**
 * Verifica si un usuarioLogin ya cumple con la nomenclatura (letras en minúscula + 4 dígitos al final)
 * para que una vez generado por primera vez NUNCA cambie.
 */
export function isValidGeneratedUsername(usuarioLogin?: string): boolean {
  if (!usuarioLogin || typeof usuarioLogin !== 'string') return false;
  const clean = usuarioLogin.trim();
  if (!clean) return false;
  // Rechazar códigos antiguos tipo "CM7482" (todo mayúsculas) o matrículas con guiones
  if (clean.includes('-')) return false;
  if (/^[A-Z]{2,4}\d{4}$/.test(clean)) return false;
  return /^[a-z0-9]+[0-9]{4}$/.test(clean);
}

/**
 * Garantiza que un usuario conserve siempre el mismo usuarioLogin (incluyendo sus 4 dígitos finales)
 * una vez generado la primera vez.
 */
export function ensureUserCredentials(
  user: { id?: string; nombre: string; usuarioLogin?: string; password?: string },
  seedUser?: { usuarioLogin?: string; password?: string }
): { usuarioLogin: string; password: string; wasUpdated: boolean } {
  let usuarioLogin = user.usuarioLogin?.trim() || '';
  let password = user.password?.trim() || '';
  let wasUpdated = false;

  if (!isValidGeneratedUsername(usuarioLogin)) {
    if (seedUser?.usuarioLogin && isValidGeneratedUsername(seedUser.usuarioLogin)) {
      usuarioLogin = seedUser.usuarioLogin.trim();
    } else {
      const fixed4 = getDeterministic4Digits(user.id || user.nombre);
      usuarioLogin = generateTutorUsername(user.nombre, fixed4);
    }
    wasUpdated = true;
  }

  const hasValidPass =
    Boolean(password) &&
    password !== 'admin123' &&
    !password.startsWith('Col#') &&
    password.length >= 8;

  if (!hasValidPass) {
    if (seedUser?.password && seedUser.password.length >= 8 && seedUser.password !== 'admin123') {
      password = seedUser.password.trim();
    } else {
      password = generateRandomPassword();
    }
    wasUpdated = true;
  }

  return { usuarioLogin, password, wasUpdated };
}

/**
 * Genera una contraseña aleatoria de exactamente 8 caracteres combinando letras, números y caracteres especiales comunes.
 */
export function generateRandomPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '@#$%&*!?';
  const all = letters + digits + specials;
  const chars: string[] = [
    letters.charAt(Math.floor(Math.random() * letters.length)),
    letters.charAt(Math.floor(Math.random() * letters.length)),
    digits.charAt(Math.floor(Math.random() * digits.length)),
    digits.charAt(Math.floor(Math.random() * digits.length)),
    specials.charAt(Math.floor(Math.random() * specials.length)),
  ];
  for (let i = 0; i < 3; i++) {
    chars.push(all.charAt(Math.floor(Math.random() * all.length)));
  }
  // Mezclar aleatoriamente los 8 caracteres (letras, números y caracteres especiales comunes)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Mapeo oficial de Grados según el Nivel Académico seleccionado
 */
export const PREENROLLMENT_GRADES_BY_LEVEL: Record<PreenrollmentLevel, string[]> = {
  preescolar: [
    '1° de Preescolar (3 años)',
    '2° de Preescolar (4 años)',
    '3° de Preescolar (5 años)',
  ],
  primaria: [
    '1° de Primaria',
    '2° de Primaria',
    '3° de Primaria',
    '4° de Primaria',
    '5° de Primaria',
    '6° de Primaria',
  ],
  secundaria: [
    '1° de Secundaria',
    '2° de Secundaria',
    '3° de Secundaria',
  ],
  preparatoria: [
    '1° Semestre (Preparatoria)',
    '2° Semestre (Preparatoria)',
    '3° Semestre (Preparatoria)',
    '4° Semestre (Preparatoria)',
    '5° Semestre (Preparatoria)',
    '6° Semestre (Preparatoria)',
  ],
};

/**
 * Montos institucionales de inscripción según nivel
 */
export function getDefaultEnrollmentFees(nivel: PreenrollmentLevel): PreenrollmentFeeConcept[] {
  switch (nivel) {
    case 'preescolar':
      return [
        { concepto: 'Cuota de Inscripción Anual', monto: 3200 },
        { concepto: 'Seguro Escolar y Material Didáctico', monto: 650 },
        { concepto: 'Credencial Inteligente QR y Plataforma', monto: 350 },
      ];
    case 'primaria':
      return [
        { concepto: 'Cuota de Inscripción Anual', monto: 3800 },
        { concepto: 'Seguro contra Accidentes Escolares', monto: 550 },
        { concepto: 'Credencial Digital con QR de Acceso', monto: 300 },
      ];
    case 'secundaria':
      return [
        { concepto: 'Cuota de Inscripción Anual', monto: 4200 },
        { concepto: 'Seguro Escolar y Laboratorios', monto: 750 },
        { concepto: 'Credencial Digital y Plataforma Virtual', monto: 350 },
      ];
    case 'preparatoria':
      return [
        { concepto: 'Cuota de Inscripción Semestral', monto: 4600 },
        { concepto: 'Talleres, Laboratorios y Seguro', monto: 850 },
        { concepto: 'Credencial Digital y Licencia My College', monto: 350 },
      ];
  }
}
