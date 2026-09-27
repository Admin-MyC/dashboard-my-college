export type UserRole = 
  | 'superusuario'
  | 'administrador'
  | 'directivo'
  | 'coordinador'
  | 'supervisor'
  | 'prefecto'
  | 'psicologo'
  | 'docente';

export interface RoleDefinition {
  id: UserRole;
  label: string;
  descripcion: string;
  badgeBg: string;
  badgeText: string;
  esGlobal: boolean;
}

export const ROLES_CONFIG: Record<UserRole, RoleDefinition> = {
  superusuario: {
    id: 'superusuario',
    label: 'Superusuario',
    descripcion: 'Control total de la plataforma, todas las instituciones, facturación y módulos globales.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
    esGlobal: true,
  },
  administrador: {
    id: 'administrador',
    label: 'Administrador',
    descripcion: 'Administrador institucional de un colegio con gestión local de personal, módulos y ajustes.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900 border-blue-300',
    esGlobal: false,
  },
  directivo: {
    id: 'directivo',
    label: 'Directivo',
    descripcion: 'Dirección académica y directiva escolar, supervisión de reportes, boletas y comunicados.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900 border-indigo-300',
    esGlobal: false,
  },
  coordinador: {
    id: 'coordinador',
    label: 'Coordinador',
    descripcion: 'Coordinación académica por niveles, revisión de planeaciones docentes y materias.',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900 border-cyan-300',
    esGlobal: false,
  },
  supervisor: {
    id: 'supervisor',
    label: 'Supervisor',
    descripcion: 'Inspección de normativas, asistencia escolar, auditoría de reportes y calificaciones.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900 border-emerald-300',
    esGlobal: false,
  },
  prefecto: {
    id: 'prefecto',
    label: 'Prefecto',
    descripcion: 'Control disciplinario, registro de incidencias, justificaciones, puntualidad y asistencia.',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900 border-orange-300',
    esGlobal: false,
  },
  psicologo: {
    id: 'psicologo',
    label: 'Psicólogo',
    descripcion: 'Atención psicopedagógica, bitácoras de orientación y seguimiento confidencial a estudiantes.',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900 border-purple-300',
    esGlobal: false,
  },
  docente: {
    id: 'docente',
    label: 'Docente',
    descripcion: 'Carga de calificaciones, pase de lista, tareas, exámenes y planeaciones didácticas.',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900 border-teal-300',
    esGlobal: false,
  },
};

export type CollegeModuleId =
  | 'docentes'
  | 'usuarios'
  | 'estudiantes'
  | 'calificaciones'
  | 'materias'
  | 'biblioteca'
  | 'tareas'
  | 'examenes'
  | 'control_escolar'
  | 'reportes'
  | 'incidencias'
  | 'actividades_docentes'
  | 'comunicados';

export interface ModuleDefinition {
  id: CollegeModuleId;
  label: string;
  categoria: 'Académico' | 'Administrativo' | 'Comunidad' | 'Especializado';
  descripcion: string;
  icono: string;
  requierePlanMinimo: 'Básico' | 'Estándar' | 'Institucional Pro' | 'Campus Elite';
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: 'control_escolar',
    label: 'Control Escolar',
    categoria: 'Administrativo',
    descripcion: 'Matrículas, expedientes digitales, inscripciones y kardex de alumnos.',
    icono: 'FileText',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'estudiantes',
    label: 'Estudiantes',
    categoria: 'Académico',
    descripcion: 'Directorio de alumnos, grupos asignados, tutores y credenciales escolares.',
    icono: 'GraduationCap',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'docentes',
    label: 'Docentes',
    categoria: 'Académico',
    descripcion: 'Plantilla de profesores, asignación horaria y materias a cargo.',
    icono: 'Users',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'materias',
    label: 'Materias',
    categoria: 'Académico',
    descripcion: 'Malla curricular por grado, créditos, planes de estudio y contenidos temáticos.',
    icono: 'BookOpen',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'calificaciones',
    label: 'Calificaciones',
    categoria: 'Académico',
    descripcion: 'Sábana de notas, bimestres, promedios y boletas oficiales para impresión.',
    icono: 'Award',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'usuarios',
    label: 'Gestión de Usuarios',
    categoria: 'Administrativo',
    descripcion: 'Cuentas de directivos, docentes, prefectos y personal institucional.',
    icono: 'UserCheck',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'comunicados',
    label: 'Comunicados',
    categoria: 'Comunidad',
    descripcion: 'Circulares, avisos urgentes, boletines y notificaciones institucionales.',
    icono: 'Bell',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'tareas',
    label: 'Tareas',
    categoria: 'Académico',
    descripcion: 'Asignación de deberes, rúbricas de evaluación y recepción de entregas.',
    icono: 'ClipboardList',
    requierePlanMinimo: 'Estándar',
  },
  {
    id: 'examenes',
    label: 'Exámenes',
    categoria: 'Académico',
    descripcion: 'Calendarización de pruebas, evaluaciones periódicas y estadísticas de rendimiento.',
    icono: 'CheckSquare',
    requierePlanMinimo: 'Estándar',
  },
  {
    id: 'actividades_docentes',
    label: 'Actividades Docentes',
    categoria: 'Académico',
    descripcion: 'Planeaciones semanales, proyectos transversales y bitácoras de clase.',
    icono: 'Calendar',
    requierePlanMinimo: 'Estándar',
  },
  {
    id: 'incidencias',
    label: 'Incidencias',
    categoria: 'Comunidad',
    descripcion: 'Reportes de conducta, citatorios a tutores, reconocimientos y faltas disciplinarias.',
    icono: 'ShieldAlert',
    requierePlanMinimo: 'Institucional Pro',
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    categoria: 'Especializado',
    descripcion: 'Catálogo de libros físicos y digitales, control de préstamos y devoluciones.',
    icono: 'BookMarked',
    requierePlanMinimo: 'Institucional Pro',
  },
  {
    id: 'reportes',
    label: 'Reportes y Analíticas',
    categoria: 'Administrativo',
    descripcion: 'Reportes institucionales avanzados, estadísticas de aprobación y auditoría.',
    icono: 'BarChart3',
    requierePlanMinimo: 'Campus Elite',
  },
];

export interface CollegeColors {
  primario: string; // e.g. '#0B2545'
  secundario: string; // e.g. '#C59B27'
  textoCabecera?: string;
}

export type PaymentStatus = 'al_corriente' | 'proximo_a_vencer' | 'vencido';
export type PlanType = 'Básico' | 'Estándar' | 'Institucional Pro' | 'Campus Elite';

export interface College {
  id: string;
  nombre: string;
  codigoCCT: string;
  lema: string;
  nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Colegio Integral' | 'Universidad';
  escudoUrl: string; // Data URL or SVG
  colores: CollegeColors;
  modulosHabilitados: CollegeModuleId[];
  estadoPago: PaymentStatus;
  plan: PlanType;
  montoMensual: number;
  fechaProximoPago: string;
  telefono: string;
  correo: string;
  direccion: string;
  director: string;
  adminUserId: string; // ID of the administrator
  alumnosTotales: number;
  docentesTotales: number;
  activo: boolean;
  creadoEn: string;
}

export interface User {
  id: string;
  nombre: string;
  correo: string;
  password?: string;
  rol: UserRole;
  colegioId: string | null; // null only for superusuarios
  cargo: string;
  avatar: string;
  telefono?: string;
  activo: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
}

export interface Student {
  id: string;
  colegioId: string;
  matricula: string;
  curp: string;
  nombre: string;
  apellidos: string;
  grado: string;
  grupo: string;
  tutorNombre: string;
  tutorTelefono: string;
  tutorCorreo: string;
  promedio: number;
  estatus: 'activo' | 'baja' | 'condicionado';
  foto: string;
  fechaNacimiento: string;
}

export interface Teacher {
  id: string;
  colegioId: string;
  nombre: string;
  correo: string;
  telefono: string;
  especialidad: string;
  materias: string[];
  grupos: string[];
  horasSemanales: number;
  estatus: 'activo' | 'licencia';
  foto: string;
}

export interface Subject {
  id: string;
  colegioId: string;
  nombre: string;
  clave: string;
  grado: string;
  creditos: number;
  horasSemanales: number;
  docenteId?: string;
  docenteNombre?: string;
}

export interface GradeRecord {
  id: string;
  colegioId: string;
  estudianteId: string;
  materiaId: string;
  materiaNombre: string;
  periodo1: number;
  periodo2: number;
  periodo3: number;
  promedioFinal: number;
  observaciones?: string;
}

export interface IncidentRecord {
  id: string;
  colegioId: string;
  estudianteId: string;
  estudianteNombre: string;
  gradoGrupo: string;
  reportadoPor: string;
  tipo: 'Leve' | 'Grave' | 'Reconocimiento' | 'Citatorio Tutor';
  descripcion: string;
  fecha: string;
  estatus: 'Pendiente' | 'Resuelto' | 'En seguimiento';
  acuerdos?: string;
}

export interface PsychologyRecord {
  id: string;
  colegioId: string;
  estudianteId: string;
  estudianteNombre: string;
  gradoGrupo: string;
  psicologoNombre: string;
  motivoConsulta: string;
  resumenSesion: string;
  acuerdos: string;
  esConfidencial: boolean;
  fecha: string;
  estatus: 'En Proceso' | 'Concluido' | 'Canalizado';
}

export interface LibraryBook {
  id: string;
  colegioId: string;
  titulo: string;
  autor: string;
  isbn: string;
  editorial: string;
  categoria: string;
  ejemplaresTotales: number;
  disponibles: number;
  ubicacion: string;
}

export interface Notice {
  id: string;
  colegioId: string; // or 'todos'
  titulo: string;
  contenido: string;
  prioridad: 'Normal' | 'Importante' | 'Urgente';
  fecha: string;
  autor: string;
  destinatarios: 'Toda la Comunidad' | 'Docentes' | 'Padres de Familia' | 'Estudiantes';
}

export interface TeacherActivity {
  id: string;
  colegioId: string;
  docenteId: string;
  docenteNombre: string;
  titulo: string;
  materia: string;
  gradoGrupo: string;
  semana: string;
  objetivo: string;
  entregables: string;
  estado: 'Borrador' | 'Entregada' | 'Aprobada';
  fechaEntrega: string;
}

export interface TaskOrExam {
  id: string;
  colegioId: string;
  tipo: 'tarea' | 'examen';
  titulo: string;
  materia: string;
  gradoGrupo: string;
  docenteNombre: string;
  fechaLimite: string;
  puntosMaximos: number;
  estado: 'Activa' | 'Cerrada' | 'Calificada';
  instrucciones: string;
}
