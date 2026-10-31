export type UserRole = 
  | 'superusuario'
  | 'soporte'
  | 'administrador'
  | 'control_escolar'
  | 'directivo'
  | 'coordinador'
  | 'supervisor'
  | 'prefecto'
  | 'psicologo'
  | 'docente'
  | 'tutor'
  | 'alumno'
  | (string & {});

export interface RoleDefinition {
  id: UserRole;
  label: string;
  descripcion: string;
  badgeBg: string;
  badgeText: string;
  esGlobal: boolean;
  esPersonalizado?: boolean;
  creadoEn?: string;
}

export const ROLES_CONFIG: Record<string, RoleDefinition> = {
  superusuario: {
    id: 'superusuario',
    label: 'Superusuario',
    descripcion: 'Control total de la plataforma, todas las instituciones, facturación y módulos globales.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
    esGlobal: true,
  },
  soporte: {
    id: 'soporte',
    label: 'Soporte',
    descripcion: 'Soporte técnico y operativo global de la plataforma. Acceso a colegios previa autorización del Administrador.',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900 border-sky-300',
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
  control_escolar: {
    id: 'control_escolar',
    label: 'Control Escolar',
    descripcion: 'Control escolar institucional con acceso administrativo a expedientes, calificaciones, asistencias, cobros y catálogo escolar.',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-900 border-violet-300',
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
  tutor: {
    id: 'tutor',
    label: 'Tutor / Padre de Familia',
    descripcion: 'Portal exclusivo familiar: Cuotas Escolares, Comunicados y Avisos, Historial Académico, Alumnos a cargo y Mi Perfil.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900 border-emerald-300',
    esGlobal: false,
  },
  alumno: {
    id: 'alumno',
    label: 'Alumno / Estudiante',
    descripcion: 'Portal oficial del estudiante: Mis Tareas, Mis Exámenes, Mis Comunicados y Mi Biblioteca.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900 border-indigo-300',
    esGlobal: false,
  },
};

export type CollegeModuleId =
  | 'preinscripciones'
  | 'tutores'
  | 'docentes'
  | 'usuarios'
  | 'estudiantes'
  | 'calificaciones'
  | 'asistencias'
  | 'materias'
  | 'biblioteca'
  | 'tareas'
  | 'examenes'
  | 'control_escolar'
  | 'reportes'
  | 'incidencias'
  | 'actividades_docentes'
  | 'comunicados'
  | 'ciclo_escolar'
  | 'calendario'
  | 'horarios'
  | 'campus'
  | 'cobros'
  | 'pagos'
  | 'psicologia'
  | 'expedientes'
  | 'evaluaciones'
  | 'cafeteria';

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
    id: 'preinscripciones',
    label: 'Preinscripciones',
    categoria: 'Administrativo',
    descripcion: 'Aspirantes, enlace público de registro, validación de solicitudes, altas de tutor y asignación de grupo tras pago.',
    icono: 'UserPlus',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'tutores',
    label: 'Tutores',
    categoria: 'Comunidad',
    descripcion: 'Padrón institucional de padres y tutores legales vinculados a los alumnos, contactos de emergencia y método de acceso (Preinscripción / QR).',
    icono: 'Users2',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'asistencias',
    label: 'Asistencia',
    categoria: 'Académico',
    descripcion: 'Pase de lista con lista semanal de alumnos, escaneo QR en vivo y modo manual.',
    icono: 'CheckSquare',
    requierePlanMinimo: 'Básico',
  },
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
    id: 'evaluaciones',
    label: 'Evaluaciones y Libreta Docente',
    categoria: 'Académico',
    descripcion: 'Ponderación 100% de conceptos a evaluar del docente, registros de alumnos con examen y tareas, opciones de libreta docente y periodicidad mensual, bimestral, trimestral, cuatrimestral o semestral.',
    icono: 'ClipboardCheck',
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
    id: 'ciclo_escolar',
    label: 'Ciclos Escolares y Asignaciones',
    categoria: 'Administrativo',
    descripcion: 'Creación del ciclo escolar con fechas de inicio y fin de clases, y asignación de alumnos a grupos, docentes y materias.',
    icono: 'Calendar',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'calendario',
    label: 'Calendario Escolar',
    categoria: 'Académico',
    descripcion: 'Calendario institucional para registrar días sin clases, puentes y suspensiones, visible en el perfil de tutores y docentes.',
    icono: 'Calendar',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'horarios',
    label: 'Horarios y Roles de Grupo',
    categoria: 'Académico',
    descripcion: 'Roles semanales de cada grupo con opción para copiar el horario de la semana anterior o cada dos semanas.',
    icono: 'Clock',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'campus',
    label: 'Campus y Sedes',
    categoria: 'Administrativo',
    descripcion: 'Configuración de uno o más campus dentro del colegio, asignación de docentes y alumnos por campus y selector activo en Control Escolar.',
    icono: 'Building2',
    requierePlanMinimo: 'Básico',
  },
  {
    id: 'cafeteria',
    label: 'Cafetería',
    categoria: 'Comunidad',
    descripcion: 'Control de menú escolar, productos, precios, fotos, y gestión de pedidos de tutores con entrega por escaneo QR de alumnos.',
    icono: 'UtensilsCrossed',
    requierePlanMinimo: 'Básico',
  },
];

export interface CollegeColors {
  primario: string; // e.g. '#0B2545'
  secundario: string; // e.g. '#C59B27'
  textoCabecera?: string;
}

export type PaymentStatus = 'al_corriente' | 'proximo_a_vencer' | 'vencido' | 'pendiente';
export type PlanType = 'Básico' | 'Estándar' | 'Institucional Pro' | 'Campus Elite' | 'Plan' | 'Demo';
export type CollegeOperationType = 'demo' | 'plan';

export type ReportCardElementType =
  | 'escudo'
  | 'datos_escuela'
  | 'folio_boleta'
  | 'datos_alumno'
  | 'foto_alumno'
  | 'tabla_materias'
  | 'promedio_destacado'
  | 'firma_director'
  | 'sello_digital'
  | 'firma_docente'
  | 'firma_tutor'
  | 'texto_libre';

export interface ReportCardCanvasElement {
  id: string;
  type: ReportCardElementType;
  label: string;
  visible: boolean;
  x: number; // Porcentaje horizontal (0 a 100) sobre el lienzo de la hoja
  y: number; // Porcentaje vertical (0 a 100) sobre el lienzo de la hoja
  w: number; // Ancho en porcentaje (5 a 100)
  h: number; // Alto en porcentaje (4 a 100)
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  showBorder?: boolean;
  fontSizeScale?: number; // 0.8 a 1.4
  customText?: string;
  zIndex?: number;
}

export interface ReportCardDesignConfig {
  usarDisenoPersonalizado: boolean;
  plantillaId?: 'clasica' | 'moderna' | 'minimalista' | 'personalizada';
  firmaSecundariaTipo?: 'docente' | 'tutor' | 'ambos';
  colorFondoHoja: string;
  imagenFondoUrl?: string;
  opacidadImagenFondo: number; // 0.05 a 1
  marcaAguaEscudo: boolean;
  opacidadMarcaAgua: number; // 0.03 a 0.35
  mostrarMarcoDecorativo: boolean;
  estiloMarco: 'ninguno' | 'simple' | 'doble_institucional' | 'esquinas_doradas';
  colorMarco: string;
  colorEncabezadoTabla: string;
  colorTextoTabla: string;
  colorAcento: string;
  elementos: ReportCardCanvasElement[];
  actualizadoEn?: string;
}

export interface College {
  id: string;
  nombre: string;
  codigoCCT: string;
  codigo?: string; // alias
  lema: string;
  nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Colegio Integral' | 'Universidad';
  niveles?: ('Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Universidad' | string)[];
  escudoUrl: string; // Data URL or SVG
  colores: CollegeColors;
  modulosHabilitados: CollegeModuleId[];
  estadoPago: PaymentStatus;
  plan: PlanType;
  operacion?: CollegeOperationType; // 'demo' (1 mes a partir de creadoEn) | 'plan' (permanente)
  fechaExpiracionDemo?: string; // ISO date string of 1 month after creation when operacion === 'demo'
  modoSoporteActivo?: boolean; // Si está activo, el usuario de soporte ingresa sin autorización del administrador
  modoSoporteDesactivadoPermanentemente?: boolean; // Una vez desactivado o no activado al alta, ya no se puede volver a activar
  solicitudReanudacionDemoEnviada?: boolean;
  montoMensual: number;
  fechaProximoPago: string;
  telefono: string;
  correo: string;
  email?: string; // alias
  direccion: string;
  director: string;
  Responsable?: string; // alias
  adminUserId: string; // ID of the administrator
  alumnosTotales: number;
  docentesTotales: number;
  periodicidadEvaluacion?: EvaluationPeriodicity; // 'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'semestral'
  disenoBoleta?: ReportCardDesignConfig;
  activo: boolean;
  creadoEn: string;
  claveBajaCodigo?: string;
  claveBajaExpiraEn?: number;
  claveBajaGeneradaPor?: string;
  datosFiscales?: TutorFiscalData;
  modoPrueba?: boolean; // Colegio en modo prueba con botones automáticos de simulación de pagos de pasarela para demostraciones a clientes
}

export interface TutorSecondParent {
  nombre: string;
  correo: string;
  telefono: string;
  parentesco: string; // 'Madre' | 'Padre' | 'Tutor Legal' | 'Abuelo/a' | 'Familiar'
}

export interface TutorFiscalData {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCFDI?: string;
  usoCfdi?: string; // alias
  codigoPostalFiscal: string;
  correoFacturacion: string;
  domicilioFiscal?: string;
  direccionFiscal?: string; // alias
  actualizadoEn?: string;
}

export interface User {
  id: string;
  nombre: string;
  correo: string;
  usuarioLogin?: string; // Generated username (e.g. initial + surname + 4 digits)
  password?: string;
  rol: UserRole;
  colegioId: string | null; // null only for superusuarios
  nivelAsignado?: AcademicLevel; // Nivel educativo principal asignado (ej. Coordinador de Primaria, Secundaria, etc.)
  tipoCoordinacion?: 'un_nivel' | 'multinivel'; // Si coordina un solo nivel o es multinivel
  nivelesAsignados?: AcademicLevel[]; // Lista de niveles asignados cuando es multinivel o un nivel
  gruposAsignados?: string[]; // Grupos específicos asignados en formato "Nivel Grado Grupo" (ej. ["Primaria 4° A", "Primaria 4° B", "Secundaria 1° A", "Secundaria 1° B"]); si está vacío aplica a todos los grupos de sus nivelesAsignados
  cargo: string;
  avatar: string;
  telefono?: string;
  activo: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
  // Tutor specific attributes:
  hijosIds?: string[]; // IDs of the students associated with this tutor
  curpsAsociadas?: string[]; // CURPs linked
  metodoAcceso?: 'qr' | 'preinscripcion' | 'directo'; // How the tutor accessed/registered
  curpBusquedaBloqueada?: boolean; // When accessed via QR and confirmed, blocked from searching again!
  segundoTutor?: TutorSecondParent; // Allows registering a secondary tutor (maximum 2 tutores)
  parentesco?: string; // 'Padre' | 'Madre' | 'Tutor Legal' | 'Abuelo/a'
  datosFiscales?: TutorFiscalData; // Datos fiscales (RFC, Razón Social, etc.) para solicitar factura
  // Alumno specific attribute:
  estudianteId?: string; // ID of the linked Student record if user is an alumno
}

export interface Student {
  id: string;
  colegioId: string;
  campusId?: string; // Assigned campus ID
  cicloId?: string; // Assigned school cycle ID
  matricula: string;
  curp: string;
  nombre: string;
  apellidos: string;
  nivel?: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria';
  grado: string;
  grupo: string;
  docenteId?: string; // Assigned teacher ID in control escolar
  docenteNombre?: string; // Assigned teacher name in control escolar
  materiasIds?: string[]; // Assigned subject IDs for the school cycle
  tutorNombre: string;
  tutorTelefono: string;
  tutorCorreo: string;
  tutorId?: string; // Linked tutor user ID
  segundoTutorNombre?: string;
  segundoTutorTelefono?: string;
  promedio: number;
  estatus: 'activo' | 'baja' | 'condicionado' | 'pendiente' | 'inscrito';
  foto?: string;
  fechaNacimiento: string;
  // Student portal credentials:
  usuarioLogin?: string; // e.g. first letter + surname + 4 digits
  password?: string; // 8+ chars alphanumeric
}

export type AcademicLevel = 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Universidad';

export interface CollegeGroup {
  id: string;
  colegioId: string;
  campusId?: string;
  nivel: AcademicLevel;
  grado: string; // ej. '1°', '2°', '3°', '4°', '5°', '6°'
  grupo: string; // ej. 'A', 'B', 'C'
  etiqueta: string; // ej. '1° A'
  activo: boolean;
}

export interface Teacher {
  id: string;
  colegioId: string;
  campusId?: string; // Assigned campus ID
  nombre: string;
  correo: string;
  telefono: string;
  especialidad: string;
  nivel?: AcademicLevel; // Nivel educativo que imparte el docente
  esTutorPrincipal?: boolean; // Si es tutor principal de un grupo
  grupoTutorado?: string; // Grupo bajo su tutela (ej. '6° A')
  esTutorGrupo?: boolean;
  tutorGrado?: string;
  tutorGrupo?: string;
  materias: string[];
  grupos: string[];
  gruposAsignados?: string[];
  horasSemanales: number;
  estatus?: 'activo' | 'inactivo' | 'licencia';
  foto?: string;
}

export interface Subject {
  id: string;
  colegioId: string;
  campusId?: string; // Assigned campus ID
  cicloId?: string;
  nombre: string;
  clave: string;
  nivel?: AcademicLevel; // Nivel educativo al que pertenece la materia y grupo
  grado: string;
  grupo?: string;
  grupos?: string[];
  creditos: number;
  horasSemanales: number;
  docenteId?: string;
  docenteNombre?: string;
}

export type EvaluationPeriodicity =
  | 'mensual'
  | 'bimestral'
  | 'trimestral'
  | 'cuatrimestral'
  | 'semestral';

export interface EvaluationPeriodicityMeta {
  id: EvaluationPeriodicity;
  label: string;
  singularLabel?: string;
  boletaLabel: string;
  periodCount: number;
  periodNames: string[];
  shortLabels: string[];
}

export const EVALUATION_PERIODICITY_CONFIG: Record<
  EvaluationPeriodicity,
  EvaluationPeriodicityMeta
> = {
  mensual: {
    id: 'mensual',
    label: 'Mensual',
    singularLabel: 'Mes',
    boletaLabel: 'Boleta de Evaluación Mensual',
    periodCount: 10,
    periodNames: [
      'Septiembre (Mes 1)',
      'Octubre (Mes 2)',
      'Noviembre (Mes 3)',
      'Diciembre (Mes 4)',
      'Enero (Mes 5)',
      'Febrero (Mes 6)',
      'Marzo (Mes 7)',
      'Abril (Mes 8)',
      'Mayo (Mes 9)',
      'Junio (Mes 10)',
    ],
    shortLabels: ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  },
  bimestral: {
    id: 'bimestral',
    label: 'Bimestral',
    singularLabel: 'Bimestre',
    boletaLabel: 'Boleta de Evaluación Bimestral',
    periodCount: 5,
    periodNames: [
      '1° Bimestre (Sep-Oct)',
      '2° Bimestre (Nov-Dic)',
      '3° Bimestre (Ene-Feb)',
      '4° Bimestre (Mar-Abr)',
      '5° Bimestre (May-Jun)',
    ],
    shortLabels: ['1° Bim', '2° Bim', '3° Bim', '4° Bim', '5° Bim'],
  },
  trimestral: {
    id: 'trimestral',
    label: 'Trimestral',
    singularLabel: 'Trimestre',
    boletaLabel: 'Boleta de Evaluación Trimestral',
    periodCount: 3,
    periodNames: [
      '1° Trimestre (Sep-Nov)',
      '2° Trimestre (Dic-Mar)',
      '3° Trimestre (Abr-Jun)',
    ],
    shortLabels: ['1° Trim', '2° Trim', '3° Trim'],
  },
  cuatrimestral: {
    id: 'cuatrimestral',
    label: 'Cuatrimestral',
    singularLabel: 'Cuatrimestre',
    boletaLabel: 'Boleta de Evaluación Cuatrimestral',
    periodCount: 3,
    periodNames: [
      '1° Cuatrimestre',
      '2° Cuatrimestre',
      '3° Cuatrimestre',
    ],
    shortLabels: ['1° Cuat', '2° Cuat', '3° Cuat'],
  },
  semestral: {
    id: 'semestral',
    label: 'Semestral',
    singularLabel: 'Semestre',
    boletaLabel: 'Boleta de Evaluación Semestral',
    periodCount: 2,
    periodNames: [
      '1° Semestre (Ago-Ene)',
      '2° Semestre (Feb-Jul)',
    ],
    shortLabels: ['1° Sem', '2° Sem'],
  },
};

export type EvaluationConceptKind =
  | 'examen'
  | 'tareas'
  | 'trabajo_clase'
  | 'proyecto'
  | 'participacion'
  | 'personalizado';

export interface EvaluationConceptItem {
  id: string;
  colegioId: string;
  cicloId?: string; // Ciclo escolar al que pertenece el concepto
  docenteId?: string;
  materiaId?: string; // 'todas' or specific subject ID
  gradoGrupo?: string; // 'todos' or '3°:::A'
  nombre: string; // ej. "Examen del Periodo", "Tareas Registradas", "Proyecto Integrador", "Trabajo en Libreta"
  descripcion?: string;
  tipo: EvaluationConceptKind;
  porcentaje: number; // 0 to 100 (Sum across concepts = 100%)
  totalMeta?: number; // Cantidad total N (ej. 10, 12, 15 participaciones/sellos) que equivale al 100% del porcentaje del concepto
  totalEsperado?: number; // Alias compatible con totalMeta
  periodicidad: EvaluationPeriodicity;
  periodoIndex?: number; // 1-based index of the month/bimester/etc.
  periodoNombre?: string; // ej. "Septiembre (Mes 1)"
  savedPeriodId?: string;
  activo: boolean;
}

export interface EvaluationSavedPeriod {
  id: string;
  colegioId: string;
  cicloId?: string; // Ciclo escolar al que se anida el periodo de evaluación
  docenteId?: string;
  docenteNombre?: string;
  periodicidad: EvaluationPeriodicity;
  periodoIndex: number; // 1-based index (e.g. 1..10 for mensual)
  periodoNombre: string; // ej. "Septiembre (Mes 1)", "Octubre (Mes 2)", "1° Bimestre (Sep-Oct)"
  modoSeleccionFecha?: 'mes_completo' | 'rango_fechas';
  fechaInicio?: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
  conceptos: EvaluationConceptItem[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface StudentEvaluationEntry {
  id: string; // `${colegioId}_${estudianteId}_${materiaId}_${periodicidad}_P${periodoIndex}`
  colegioId: string;
  cicloId?: string; // Ciclo escolar de la evaluación
  docenteId?: string;
  docenteNombre?: string;
  estudianteId: string;
  materiaId: string;
  periodicidad: EvaluationPeriodicity;
  periodoIndex: number; // 1-based index (e.g. 1..10 for mensual, 1..5 for bimestral, etc.)
  calificacionExamen: number; // 0 to 10
  totalTareasDocente: number; // Total tasks registered by teacher in the list
  tareasEntregadasAlumno: number; // Tasks completed/delivered by student
  // Checklist statuses per individual task index (for Libreta Checklist option): 'entregada' | 'incompleta' | 'no_entregada'
  checklistTareas?: Record<string, 'entregada' | 'incompleta' | 'no_entregada'>;
  // Scores (0 to 10) for additional concepts keyed by conceptId
  puntajesConceptos: Record<string, number>;
  // Optional manual override if teacher enters final grade directly
  calificacionManualActiva?: boolean;
  calificacionManual?: number;
  porcentajeFinalObtenido: number; // 0 to 100%
  calificacionFinalPeriodo: number; // 0.0 to 10.0
  observaciones?: string;
  actualizadoEn: string;
}

export interface GradeRecord {
  id: string;
  colegioId: string;
  cicloId?: string; // Ciclo escolar de las calificaciones y boleta
  estudianteId: string;
  materiaId: string;
  materiaNombre: string;
  periodo1: number;
  periodo2: number;
  periodo3: number;
  periodo4?: number;
  periodo5?: number;
  periodosPorModalidad?: Partial<Record<EvaluationPeriodicity, number[]>>;
  promedioFinal: number;
  observaciones?: string;
}

export interface IncidentRecord {
  id: string;
  colegioId: string;
  cicloId?: string; // Ligado al ciclo escolar para bitácoras anuales
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

export interface PsychologySession {
  id: string;
  numero: number;
  fecha: string;
  hora?: string;
  tipoSesion:
    | 'Individual con Alumno'
    | 'Entrevista con Padres/Tutor'
    | 'Reunión con Docentes'
    | 'Observación en Aula'
    | 'Evaluación Psicométrica'
    | 'Cierre de Caso';
  temasTratados: string;
  observacionesConductuales: string;
  acuerdos: string;
  proximaCita?: string;
  atendioNombre: string;
}

export interface PsychologyAttachment {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'image' | 'doc';
  categoria:
    | 'Consentimiento Informado'
    | 'Prueba Psicométrica / Dibujo'
    | 'Reporte Externo'
    | 'Evidencia de Seguimiento'
    | 'Nota Escaneada';
  url: string; // Data URL (Base64) or link
  tamanoKb?: number;
  fechaSubida: string;
  subidoPor: string;
}

export interface PsychologyRecord {
  id: string;
  colegioId: string;
  numeroExpediente?: string; // Folio ej: EXP-PSI-2026-0042
  estudianteId: string;
  estudianteNombre: string;
  matricula?: string;
  gradoGrupo: string;
  nivel?: AcademicLevel;
  edad?: number;
  tutorNombre?: string;
  tutorTelefono?: string;
  psicologoNombre: string;
  motivoConsulta: string;
  resumenSesion: string;
  acuerdos: string;
  esConfidencial: boolean;
  fecha: string;
  estatus:
    | 'En Proceso'
    | 'Concluido'
    | 'Canalizado'
    | 'En Evaluación'
    | 'En Intervención'
    | 'Seguimiento'
    | 'Cerrado';

  // Origen de la canalización
  canalizacionId?: string; // ID del comunicado si fue derivado de canalización
  canalizadoPor?: string; // Docente, Dirección, Prefectura, Padre de Familia
  areaAtencion?:
    | 'Conductual'
    | 'Emocional'
    | 'Académica / Aprendizaje'
    | 'Social / Convivencia'
    | 'Familiar'
    | 'Neurodivergencia / TDAH / TEA'
    | 'Duelo / Crisis'
    | 'Otra';
  nivelRiesgo?: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

  // Historia y Diagnóstico
  antecedentesClinicos?: string; // Antecedentes familiares, médicos y escolares
  impresionDiagnostica?: string; // Hipótesis diagnóstica escolar
  pruebasAplicadas?: string; // Batería psicométrica o proyectiva

  // Plan de Intervención
  objetivosIntervencion?: string;
  estrategiasAula?: string; // Recomendaciones específicas para docentes
  acuerdosTutor?: string; // Compromisos acordados con los padres
  canalizacionExterna?: string; // Datos de derivación externa (neuropediatría, psiquiatría)

  // Bitácora de Sesiones y Archivos
  sesiones?: PsychologySession[];
  archivosAdjuntos?: PsychologyAttachment[];
  ultimaActualizacion?: string;
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
  // Campos para libros digitales en .pdf subidos por el docente para sus grupos asignados
  esDigitalPdf?: boolean;
  archivoPdfNombre?: string;
  archivoPdfUrl?: string;
  archivoPdfTamano?: string;
  gruposAsignados?: string[];
  subidoPorDocenteId?: string;
  subidoPorDocenteNombre?: string;
  subidoPorDocenteRol?: string;
  soloLecturaSinDescarga?: boolean;
  fechaPublicacion?: string;
}

export type NoticeCommunicationType =
  | 'Incidencia'
  | 'Canalización'
  | 'Reporte al Tutor'
  | 'Aviso'
  | 'Notificación'
  | 'Citatorio'
  | 'Circular General';

export interface Notice {
  id: string;
  colegioId: string; // or 'todos'
  titulo: string;
  contenido: string;
  tipoComunicado?: NoticeCommunicationType;
  nivelEscolar?: AcademicLevel;
  gradoGrupo?: string;
  estudianteId?: string;
  estudianteNombre?: string;
  prioridad: 'Normal' | 'Importante' | 'Urgente';
  fecha: string;
  autorId?: string;
  autor: string;
  autorRol?: UserRole;
  destinatarios: string;
  destinatariosPrincipalesNombres?: string[];
  destinatariosPrincipalesCorreos?: string[];
  copiaCoordinadoresIds?: string[];
  copiaDocentesIds?: string[];
  enCopiaNombres?: string[];
  enCopiaCorreos?: string[];
  usuariosInvolucradosIds?: string[];
}

export interface TeacherActivityWeekPlan {
  semanaNumero: 1 | 2 | 3;
  etiquetaSemana: string;
  enfoqueBruner: string; // Representación Enactiva (Sem 1), Icónica (Sem 2), Simbólica (Sem 3)
  enfoquePiaget: string; // Asimilación, Conflicto Cognitivo / Acomodación, Equilibración
  actividadesInicioDesarrolloCierre: string;
  materialesYAndamiaje: string;
  productoSemanal: string;
}

export interface TeacherPlanningComment {
  id: string;
  autorId: string;
  autorNombre: string;
  autorRol: string;
  tipo: 'observacion' | 'correccion' | 'aprobacion';
  comentario: string;
  fecha: string;
  hora: string;
}

export interface TeacherActivity {
  id: string;
  colegioId: string;
  cicloId?: string; // Ligado al ciclo escolar para nuevas planeaciones por ciclo
  docenteId: string;
  docenteNombre: string;
  titulo: string;
  materia: string;
  nivel?: AcademicLevel;
  gradoGrupo: string;
  semana: string;
  duracionSemanas?: number; // Por defecto 3 semanas
  etapaPiaget?: string; // Preoperacional, Operaciones Concretas, Operaciones Formales
  modalidadBruner?: string; // Espiral Constructivista (Enactivo → Icónico → Simbólico)
  // Campos oficiales de la Nueva Escuela Mexicana (NEM)
  faseNEM?: string; // Fase 2 (Preescolar), Fase 3 (1°-2° Primaria), Fase 4 (3°-4° Primaria), Fase 5 (5°-6° Primaria), Fase 6 (Secundaria)
  campoFormativoNEM?: string; // Lenguajes | Saberes y Pensamiento Científico | Ética, Naturaleza y Sociedades | De lo Humano y lo Comunitario
  ejesArticuladoresNEM?: string[]; // Inclusión, Pensamiento crítico, Interculturalidad crítica, Igualdad de género, Vida saludable, Apropiación de las culturas..., Artes y experiencias estéticas
  metodologiaDidacticaNEM?: string; // ABP, STEAM, Aprendizaje Basado en Problemas, Aprendizaje Servicio (AS)
  escenarioNEM?: string; // Aula | Escolar | Comunitario
  contenidoProgramaSinteticoNEM?: string; // Contenido del Programa Sintético
  pdaNEM?: string; // Procesos de Desarrollo de Aprendizaje (PDA)
  problematizacionProgramaAnaliticoNEM?: string; // Problemática o contextualización del Programa Analítico
  evaluacionFormativaNEM?: string; // Instrumentos y criterios de Evaluación Formativa NEM
  objetivo: string;
  entregables: string;
  semanasDetalle?: TeacherActivityWeekPlan[];
  archivoNombre?: string;
  archivoUrl?: string;
  archivoTipo?: string; // .pdf, .xlsx, .xls, .docx, .doc
  archivoTamano?: string;
  estado: 'Borrador' | 'Entregada' | 'Requiere Correcciones' | 'Aprobada';
  fechaEntrega: string;
  comentariosCoordinacion?: TeacherPlanningComment[];
}

export type ExamQuestionType =
  | 'opcion_multiple_unica'
  | 'opcion_multiple_varias'
  | 'verdadero_falso'
  | 'relacionar_columnas'
  | 'respuesta_corta';

export interface ExamQuestionOption {
  id: string;
  texto: string;
  imagenUrl?: string;
  esCorrecta: boolean; // Privado para el docente y autocalificación, oculto para el alumno al responder
}

export interface ExamMatchingPair {
  id: string;
  fraseIzquierda: string;
  respuestaDerecha: string;
}

export interface ExamQuestion {
  id: string;
  numero: number;
  tipo: ExamQuestionType;
  enunciado: string;
  imagenUrl?: string;
  puntos: number;
  opciones?: ExamQuestionOption[]; // Para opción múltiple (sencilla o múltiple) y verdadero/falso
  paresRelacion?: ExamMatchingPair[]; // Para relacionar frases con respuestas
  respuestaCortaCorrecta?: string; // Para respuesta corta / palabra clave
  pistaOpcional?: string; // Pista didáctica opcional para hacer el examen más atractivo
  retroalimentacion?: string; // Explicación que ve el alumno al finalizar si se habilita
}

export interface ExamInteractiveConfig {
  tiempoLimiteMinutos?: number; // 0 o undefined = sin límite
  ordenAleatorioPreguntas?: boolean;
  mezclarOpciones?: boolean;
  modoGamificado?: boolean; // Racha de aciertos, insignias e interfaz dinámica
  permitirPistas?: boolean;
  mostrarCalificacionAlTerminar?: boolean;
  temaVisual?: 'institucional' | 'desafio_quiz' | 'olimpiada_academica' | 'laboratorio_visual';
}

export interface TaskEvidenceSubmission {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  matricula?: string;
  gradoGrupo: string; // ej. "6° A" o "6° B"
  comentario?: string;
  archivoNombre: string;
  archivoUrl: string;
  archivoTipo?: string;
  fechaEntrega: string;
}

export interface StudentExamSubmission {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  matricula?: string;
  gradoGrupo: string;
  respuestas?: Record<string, any>;
  aciertosObtenidos: number;
  totalReactivos: number;
  porcentajeAciertos: number; // 0 to 100
  calificacionEscala10: number; // 0 to 10
  fechaEntrega: string;
}

export interface TaskOrExam {
  id: string;
  colegioId: string;
  cicloId?: string; // Ligado al ciclo escolar
  tipo: 'tarea' | 'examen' | 'proyecto';
  titulo: string;
  materia: string;
  gradoGrupo: string;
  gruposAsignados?: string[];
  docenteId?: string;
  docenteNombre: string;
  fechaLimite: string;
  programado?: boolean; // Si el examen está programado para habilitarse en fecha y hora específica
  fechaHabilitacion?: string; // YYYY-MM-DD en que se habilita en el perfil del alumno
  horaHabilitacion?: string; // HH:mm en que se habilita en el perfil del alumno
  puntosMaximos: number;
  estado: 'Activa' | 'Cerrada' | 'Calificada' | 'Borrador';
  instrucciones: string;
  solicitarEvidencia?: boolean;
  evidenciaNombre?: string;
  evidenciaUrl?: string;
  evidenciaTipo?: string;
  entregasEvidencias?: TaskEvidenceSubmission[];
  entregasExamenes?: StudentExamSubmission[];
  savedPeriodId?: string;
  periodoNombre?: string;
  fechaInicioPeriodo?: string;
  fechaFinPeriodo?: string;
  preguntasExamen?: ExamQuestion[];
  configuracionExamen?: ExamInteractiveConfig;
}

export interface AttendanceRecord {
  id: string;
  colegioId: string;
  estudianteId: string;
  estudianteNombre: string;
  matricula: string;
  nivel?: AcademicLevel;
  grado: string;
  grupo: string;
  foto?: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM AM/PM
  tipo: 'general' | 'clase'; // general (Entrada Colegio) | clase (Salón de Docente)
  materiaNombre?: string;
  docenteNombre?: string;
  estado: 'presente' | 'retardo' | 'falta' | 'justificado';
  metodo: 'qr' | 'manual';
  registradoPor: string;
  timestamp: number;
  tutorNotificado?: boolean;
  // Solicitud de justificante enviada por el Tutor al Coordinador asignado al grupo
  justificanteEstado?: 'pendiente' | 'aprobado' | 'rechazado';
  justificanteMotivo?: string;
  justificanteArchivoNombre?: string;
  justificanteArchivoUrl?: string;
  justificanteFechaEnvio?: string;
  justificanteEnviadoPor?: string;
  justificanteCoordinadorId?: string;
  justificanteCoordinadorNombre?: string;
  justificanteResueltoPor?: string;
  justificanteFechaResolucion?: string;
  justificanteObservacionCoordinador?: string;
}

export const SYSTEM_NOTIFICATION_EMAIL = 'notifications@mycollege.com.mx';

export interface EmailNotification {
  id: string;
  colegioId: string | null;
  colegioNombre?: string;
  remitente: string; // notifications@mycollege.com.mx
  destinatarios: string[];
  rolesDestino: (UserRole | string)[];
  usuariosDestino?: string[]; // IDs, correos o logins de los usuarios específicamente involucrados
  asunto: string;
  cuerpo: string;
  cuerpoHtml?: string;
  categoria: 'asistencia' | 'incidencia' | 'calificaciones' | 'comunicado' | 'facturacion' | 'seguridad' | 'sistema';
  prioridad: 'normal' | 'alta' | 'urgente';
  fecha: string;
  hora: string;
  leido: boolean;
  leidoPorIds?: string[]; // IDs de usuarios que ya leyeron esta notificación
  estatusEntrega: 'enviado' | 'entregado';
}

export interface UserSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  dispositivo: string;
  navegador: string;
  ip: string;
  fechaInicio: string;
  ultimoPing: number;
  activo: boolean;
}

export type PreenrollmentLevel = 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria';
export type PreenrollmentStatus = 'pendiente' | 'aceptado' | 'rechazado';
export type PreenrollmentPaymentStatus = 'pendiente_pago' | 'pago_confirmado';

export interface PreenrollmentFeeConcept {
  concepto: string;
  monto: number;
}

export interface PreenrollmentDocumentRequirement {
  id: string;
  nombre: string; // ej. "Acta de Nacimiento", "Boleta de Calificaciones", "CURP en PDF", etc.
  descripcion?: string;
  activo: boolean; // Si el colegio solicita este documento
  obligatorio: boolean; // Si es obligatorio para enviar
}

export interface PreenrollmentAttachedFile {
  documentoId: string;
  nombreDocumento: string;
  nombreArchivo: string;
  tamano: string;
  fechaSubida: string;
  tipoMime?: string;
  urlPreview?: string;
}

export interface PreenrollmentCollegeConfig {
  colegioId: string;
  nivelesDisponibles: PreenrollmentLevel[];
  documentosRequeridos: PreenrollmentDocumentRequirement[];
  mostrarCuotasEstimadas: boolean;
  cuotasPorNivel: Record<PreenrollmentLevel, PreenrollmentFeeConcept[]>;
  pedirEscuelaProcedencia: boolean;
  pedirPromedio: boolean;
  pedirFechaNacimiento: boolean;
  instruccionesPersonalizadas?: string;
  correoNotificacionesAdmisiones?: string;
}

export interface PreenrollmentRequest {
  id: string;
  colegioId: string;
  colegioNombre: string;
  folio: string; // e.g. PRE-2026-8491
  // Datos del alumno
  alumnoNombreCompleto: string;
  curp: string;
  fechaNacimiento: string;
  promedio: number;
  nivel: PreenrollmentLevel;
  grado: string; // e.g. "1° de Primaria"
  escuelaProcedencia: string; // Defaults to "Ninguna"
  // Datos del tutor
  tutorNombre: string;
  tutorCorreo: string;
  tutorTelefono: string;
  // Documentos adjuntos por el aspirante
  archivosAdjuntos?: PreenrollmentAttachedFile[];
  // Estado y resolución
  estatus: PreenrollmentStatus;
  fechaSolicitud: string;
  fechaResolucion?: string;
  motivoRechazo?: string;
  // Generados al aceptar
  estudianteId?: string;
  matriculaGenerada?: string;
  tutorUsuarioGenerado?: string;
  tutorPasswordTemporal?: string;
  // Desglose de cuotas y montos de inscripción
  conceptosPago: PreenrollmentFeeConcept[];
  montoTotalInscripcion: number;
  estadoPago: PreenrollmentPaymentStatus;
  fechaPago?: string;
  folioComprobante?: string;
  // Asignación de grupo tras confirmación de pago
  grupoAsignado?: string; // e.g. "A", "B", "C"
  fechaAsignacionGrupo?: string;
}

// ==========================================
// PLATFORM FEE & COMMISSION CONFIGURATION
// ==========================================
export type FeeConditionOperator = 'mayor_o_igual' | 'menor_que' | 'entre' | 'siempre';
export type FeeChargeType = 'porcentaje' | 'monto_fijo';

export interface PlatformFeeConditionRule {
  id: string;
  nombre: string;
  operador: FeeConditionOperator;
  montoMinimo?: number;
  montoMaximo?: number;
  tipoCobro: FeeChargeType;
  valor: number;
  descripcion?: string;
  activo: boolean;
}

export interface CollegePlatformFeeRate {
  porcentaje: number; // e.g. 4.5
  incluirMontoFijo: boolean; // e.g. true
  montoFijo: number; // e.g. 5.00
}

export interface PlatformFeeConfig {
  activa: boolean;
  nombreComision: string; // "Comisión por Uso de Plataforma"
  porcentajeComision: number; // ej. 4.5 (4.5%)
  incluirMontoFijo: boolean; // ej. true
  montoFijoAdicional: number; // ej. 5.00 ($5.00 pesos)
  comisionesPorColegio?: Record<string, CollegePlatformFeeRate>;
  tipoCobroDefecto: FeeChargeType;
  valorDefecto: number;
  reglas: PlatformFeeConditionRule[];
  conceptosAfectados: string[];
  mostrarDesgloseEnComprobante: boolean;
  actualizadoEn: string;
}

export interface FeeCalculationResult {
  montoBase: number;
  comisionMonto: number;
  montoTotal: number;
  reglaAplicadaNombre: string;
  tipoCobro: FeeChargeType;
  valorRegla: number;
  porcentajeAplicado: number;
  montoFijoAplicado: number;
  etiquetaComision: string; // ej. "4.5% + $5.00 pesos" o "4.5%"
  activa: boolean;
}

export type BillingTargetLevel = 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria';
export type EducationalLevelId = BillingTargetLevel;

export interface BillingConcept {
  id: string;
  colegioId: string;
  campusId?: string;
  concepto: string;
  descripcion?: string;
  precio: number;
  llevaImagen: boolean;
  imagenUrl?: string;
  nivelesPublicados: EducationalLevelId[];
  nivelesDestino?: BillingTargetLevel[];
  esRecurrenteMensual?: boolean; // Si el cobro se repite cada mes
  diaCobroMensual?: number; // Día del mes (1 al 31) o fecha de cobro mensual
  fechaCobroMensual?: string; // Fecha de cobro establecida para el cobro mensual
  programadoParaFuturo?: boolean; // Si el concepto está programado para publicarse en una fecha y hora futura
  fechaProgramadaPublicacion?: string; // YYYY-MM-DD
  horaProgramadaPublicacion?: string; // HH:MM (24h)
  fechaVencimiento?: string;
  fechaCreacion?: string;
  activo: boolean;
  creadoEn: string;
  solicitudEliminacion?: {
    solicitadoPorId: string;
    solicitadoPorNombre: string;
    solicitadoPorRol: string;
    fechaSolicitud: string;
    motivo?: string;
  };
}

export type DiscountType = 'porcentaje' | 'fijo';
export type DiscountStatus = 'pendiente_aprobacion' | 'aprobado' | 'rechazado';

export interface StudentDiscount {
  id: string;
  colegioId: string;
  campusId?: string;
  nombreDescuento: string; // ej. "Beca Académica 20%", "Hijo de Docente $500", "Convenio Familiar"
  conceptoId: string; // ID del concepto de cobro o "todos"
  conceptoNombre: string; // Nombre del concepto de cobro o "Todos los Conceptos de Cobro"
  tipoDescuento: DiscountType; // 'porcentaje' | 'fijo'
  valor: number; // Porcentaje (ej. 20) o Monto Fijo en Pesos (ej. 500)
  alumnosIds: string[]; // Lista de IDs de alumnos con derecho a descuento
  motivo?: string;
  estatus: DiscountStatus; // 'pendiente_aprobacion' | 'aprobado' | 'rechazado'
  solicitadoPorId?: string;
  solicitadoPorNombre?: string;
  solicitadoPorRol?: string;
  autorizadoPorId?: string;
  autorizadoPorNombre?: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
  activo: boolean;
  solicitudEliminacion?: {
    solicitadoPorId: string;
    solicitadoPorNombre: string;
    solicitadoPorRol: string;
    fechaSolicitud: string;
    motivo?: string;
  };
}

export interface ActivityLogEntry {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  usuarioId: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  usuarioRol: UserRole;
  acceso: string; // ej. "Panel General", "Colegio Cervantes Moderno"
  modulo: string; // ej. "Usuarios", "Cobros", "Control de Alumnos", "Docentes", "Campus", etc.
  accion: string; // ej. "Alta de Usuario", "Creación de Cobro", "Asignación de Grupo"
  detalle: string; // Descripción completa de la tarea realizada
  colegioId?: string | null;
  colegioNombre?: string;
  timestamp: number;
}

// ==========================================
// CICLO ESCOLAR, CALENDARIO, HORARIOS Y CAMPUS
// ==========================================
export interface SchoolCycle {
  id: string;
  colegioId: string;
  nombre: string; // ej. "Ciclo Escolar 2026-2027"
  fechaInicioClases: string; // YYYY-MM-DD
  fechaFinClases: string; // YYYY-MM-DD
  activo: boolean;
  creadoPor: string;
  creadoEn: string;
  notas?: string;
}

export interface CalendarNonSchoolDay {
  id: string;
  colegioId: string;
  cicloId?: string;
  fecha: string; // YYYY-MM-DD
  fechaFin?: string; // Optional range end YYYY-MM-DD
  motivo: string; // ej. "Suspensión de Labores Docentes - Día de la Independencia"
  tipo:
    | 'suspension_oficial'
    | 'dia_feriado'
    | 'consejo_tecnico'
    | 'vacaciones'
    | 'evento_institucional'
    | 'evento_escolar';
  visibleTutores: boolean;
  visibleDocentes: boolean;
  creadoPor: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface ScheduleCell {
  materiaId: string;
  materiaNombre: string;
  docenteId: string;
  docenteNombre: string;
  aula?: string;
}

export interface GroupWeekSchedule {
  id: string;
  colegioId: string;
  campusId?: string;
  cicloId?: string;
  nivel?: AcademicLevel; // ej. "Preescolar", "Primaria", "Secundaria", "Preparatoria"
  grado: string; // ej. "3°"
  grupo: string; // ej. "A"
  semanaInicio: string; // YYYY-MM-DD (Monday of the week)
  semanaEtiqueta: string; // ej. "Semana del 5 al 9 de Octubre 2026"
  patronRepeticion?: 'semanal' | 'quincenal_a' | 'quincenal_b';
  // Keyed by `${dia}_${bloqueHora}` e.g. "Lunes_08:00 - 08:50"
  bloques: Record<string, ScheduleCell>;
  actualizadoEn: string;
}

export interface CollegeScheduleDriveConfig {
  colegioId: string;
  driveUsoHabilitado?: boolean; // Si el uso del sistema Drive está activado o desactivado en este colegio (por defecto true)
  horarioHabilitado: boolean;
  modoHoraConsulta?: 'reloj_actual' | 'bloque_manual';
  diaConsulta?: DayOfWeek;
  bloqueHoraConsulta?: string;
  bloquesHorarioPorNivel?: Partial<Record<AcademicLevel, string[]>>;
  driveAbierto?: boolean;
  driveAbiertoPor?: string;
  driveAbiertoRol?: string;
  driveAbiertoEn?: string;
  actualizadoEn: string;
}

export interface DrivePickupEntry {
  id: string;
  colegioId: string;
  colegioNombre?: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteFoto: string;
  estudianteGrado: string;
  estudianteGrupo: string;
  estudianteNivel?: AcademicLevel;
  estudianteMatricula: string;
  tutorId: string;
  tutorNombre: string;
  tutorParentesco: string;
  tutorTelefono?: string;
  tutorCorreo?: string;
  tutorAvatar?: string;
  horaSolicitud: string; // HH:MM:SS
  fechaSolicitud: string; // YYYY-MM-DD
  timestamp: number;
  estado: 'en_fila' | 'entregado';
  horaEntrega?: string;
  entregadoPor?: string;
}

export interface EnFilaStudentCheckResult {
  estudianteId: string;
  estudianteNombre: string;
  estudianteFoto: string;
  grado: string;
  grupo: string;
  nivel?: AcademicLevel;
  matricula: string;
  enClase: boolean;
  materiaNombre?: string;
  docenteNombre?: string;
  aula?: string;
  bloqueHora?: string;
  dia?: string;
  enviadoADrive: boolean;
}

export interface TriggerEnFilaResult {
  ok: boolean;
  driveAbierto: boolean;
  colegioId: string;
  colegioNombre: string;
  horarioHabilitado: boolean;
  tutorNombre: string;
  tutorParentesco: string;
  tutorTelefono?: string;
  horaConsulta: string;
  diaConsulta: string;
  mensajeGeneral: string;
  resultadosAlumnos: EnFilaStudentCheckResult[];
}

export interface Campus {
  id: string;
  colegioId: string;
  nombre: string; // ej. "Campus Norte - Insurgentes"
  clave: string; // ej. "CMP-NORTE"
  direccion: string;
  telefono: string;
  responsable: string;
  activo: boolean;
  esPrincipal?: boolean;
}

export interface MonthlyTuitionRecord {
  id: string;
  colegioId: string;
  campusId?: string;
  estudianteId: string;
  mesClave: string; // ej. "2026-10", "2026-09", "2026-08"
  mesEtiqueta: string; // ej. "Octubre 2026"
  montoColegiatura: number;
  pagado: boolean;
  fechaPago?: string;
  metodoPago?: string;
  folioRecibo?: string;
}

// ==========================================
// MÓDULO CAFETERÍA Y MI CAFETERÍA (TUTOR)
// ==========================================
export interface CafeteriaProduct {
  id: string;
  colegioId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string; // ej. 'Desayunos' | 'Bebidas' | 'Snacks' | 'Comidas' | 'Postres' | 'Saludable' | 'Combos'
  imagen?: string;
  disponible: boolean;
  stock?: number;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface CafeteriaOrderItem {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  notas?: string;
  imagen?: string;
}

export type CafeteriaOrderStatus = 'pendiente' | 'preparando' | 'listo' | 'entregada' | 'cancelada';

export interface CafeteriaOrder {
  id: string;
  folio: string; // ej. "#CAF-1001"
  colegioId: string;
  tutorId: string;
  tutorNombre: string;
  tutorTelefono?: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteMatricula: string;
  estudianteGrado?: string;
  estudianteGrupo?: string;
  estudianteFoto?: string;
  items: CafeteriaOrderItem[];
  totalItems: number;
  total: number;
  metodoPago: 'saldo_escolar' | 'tarjeta' | 'efectivo_cafeteria' | 'spei';
  estado: CafeteriaOrderStatus;
  fechaCreacion: string;
  fechaEntrega?: string;
  entregadoPor?: string;
  notas?: string;
}

// ==========================================
// SISTEMA CENTRALIZADO DE MÓDULOS Y PERMISOS POR PERFIL
// ==========================================
export interface SystemModulePermDef {
  id: string;
  label: string;
  sublabel?: string;
  descripcion: string;
  categoria: 'Panel Global' | 'Control Escolar y Colegio' | 'Portal de Tutores' | 'Portal de Alumnos' | 'Cuenta';
  collegeModuleId?: CollegeModuleId | null;
}

export const SYSTEM_MODULES_REGISTRY: SystemModulePermDef[] = [
  // Panel Global
  {
    id: 'dashboard_general',
    label: 'Dashboard General',
    sublabel: 'Panel Maestro',
    descripcion: 'Vista general multi-colegio con indicadores globales y selector rápido.',
    categoria: 'Panel Global',
  },
  {
    id: 'colegios',
    label: 'Colegios e Instituciones',
    sublabel: 'Módulo Principal',
    descripcion: 'Directorio de colegios afiliados, alta de instituciones, planes y personalización.',
    categoria: 'Panel Global',
  },
  {
    id: 'usuarios_globales',
    label: 'Gestión de Usuarios',
    sublabel: 'Cuentas Globales',
    descripcion: 'Administración centralizada de usuarios, roles y accesos de la plataforma.',
    categoria: 'Panel Global',
  },
  {
    id: 'perfiles',
    label: 'Perfiles',
    sublabel: 'Roles y Módulos',
    descripcion: 'Creación de nuevos tipos de rol de usuario y asignación personalizada de los módulos que requieran.',
    categoria: 'Panel Global',
  },
  {
    id: 'permisos',
    label: 'Permisos',
    sublabel: 'Control de Perfiles',
    descripcion: 'Configuración de permisos y visibilidad de módulos por cada perfil de usuario.',
    categoria: 'Panel Global',
  },
  {
    id: 'planes_modulos',
    label: 'Planes y Facturación',
    sublabel: 'Suscripciones',
    descripcion: 'Planes contratados, control de cobranza mensual y módulos por nivel de plan.',
    categoria: 'Panel Global',
  },
  {
    id: 'comisiones_plataforma',
    label: 'Comisiones de Plataforma',
    sublabel: 'Cobro % y Cuotas',
    descripcion: 'Reglas de comisión por uso de plataforma en pagos escolares.',
    categoria: 'Panel Global',
  },
  {
    id: 'bitacora_logs',
    label: 'Bitácora de Actividades (Logs TXT)',
    sublabel: 'Auditoría Diaria TXT',
    descripcion: 'Registro detallado por día de todas las acciones realizadas en el panel con descarga en archivo .txt para el Superusuario.',
    categoria: 'Panel Global',
  },

  // Control Escolar y Colegio
  {
    id: 'colegio_resumen',
    label: 'Resumen del Colegio',
    sublabel: 'Administración y Control Escolar',
    descripcion: 'Panel principal del colegio con métricas financieras, colegiaturas del mes y control escolar.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'resumen_escolar',
    label: 'Resumen Escolar',
    sublabel: 'Directivo y Coordinador',
    descripcion: 'Panorama académico con total de docentes, grupos, materias, matrícula de alumnos e indicadores por grupo.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'resumen_psicologico',
    label: 'Resumen Psicológico',
    sublabel: 'Gabinete Psicopedagógico',
    descripcion: 'Información de alumnos en seguimiento, expedientes abiertos, canalizaciones y bitácoras del psicólogo.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'resumen_docentes',
    label: 'Resumen Docentes',
    sublabel: 'Indicadores del Docente',
    descripcion: 'Resumen para el docente con número de alumnos, cantidad de grupos, promedio de cada grupo y carga académica.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'campus',
    label: 'Campus',
    sublabel: 'Sedes y Asignación',
    descripcion: 'Gestión de sedes o campus del colegio y asignación de docentes y alumnos.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'campus',
  },
  {
    id: 'ciclo_escolar',
    label: 'Ciclo Escolar',
    sublabel: 'Fechas y Asignaciones',
    descripcion: 'Configuración de fechas de inicio y fin de ciclo escolar y asignaciones académicas.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'ciclo_escolar',
  },
  {
    id: 'preinscripciones',
    label: 'Preinscripciones',
    sublabel: 'Aspirantes y Admisión',
    descripcion: 'Solicitudes de admisión en línea, enlaces/QR por plantel y validación de ingreso.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'preinscripciones',
  },
  {
    id: 'tutores',
    label: 'Tutores',
    sublabel: 'Padrón de Familias',
    descripcion: 'Directorio de padres de familia y tutores legales vinculados a los alumnos.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'tutores',
  },
  {
    id: 'cobros',
    label: 'Cobros',
    sublabel: 'Conceptos y Tarifas',
    descripcion: 'Creación y publicación de conceptos de cobro con precio, imagen opcional y segmentación para tutores de Preescolar, Primaria, Secundaria o Preparatoria.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'cobros',
  },
  {
    id: 'pagos',
    label: 'Colegiaturas y Pagos',
    sublabel: 'Corte de Caja y Recibos',
    descripcion: 'Cobro de colegiaturas, corte de caja diario, exportación a Excel y emisión de recibos oficiales.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'pagos',
  },
  {
    id: 'estudiantes',
    label: 'Control de Alumnos',
    sublabel: 'Expedientes y QR',
    descripcion: 'Padrón estudiantil, matrículas, grupos, credenciales y códigos QR de asistencia.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'estudiantes',
  },
  {
    id: 'docentes',
    label: 'Docentes',
    sublabel: 'Plantilla Docente',
    descripcion: 'Directorio de docentes, carga horaria y asignación de materias.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'docentes',
  },
  {
    id: 'materias',
    label: 'Materias y Grupos',
    sublabel: 'Malla Curricular',
    descripcion: 'Catálogo de asignaturas por grado, créditos y docentes titulares.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'materias',
  },
  {
    id: 'calificaciones',
    label: 'Calificaciones y Boletas',
    sublabel: 'Evaluación Oficial',
    descripcion: 'Sábana de notas y descarga de boletas oficiales en formato PDF (mensual, bimestral, trimestral, cuatrimestral o semestral).',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'calificaciones',
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    sublabel: 'Conceptos 100% y Registros',
    descripcion: 'Conceptos a evaluar del docente con reparto de 100%, libreta de registros con examen y conteo de tareas, y periodicidad mensual a semestral.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'evaluaciones',
  },
  {
    id: 'asistencias',
    label: 'Asistencia',
    sublabel: 'Pase de Lista QR',
    descripcion: 'Control de asistencia diaria mediante lector QR o registro manual por grupo.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'asistencias',
  },
  {
    id: 'calendario',
    label: 'Calendario Escolar',
    sublabel: 'Días Sin Clases y Eventos',
    descripcion: 'Calendario mensual completo con días festivos, vacaciones, CTE y eventos.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'calendario',
  },
  {
    id: 'horarios',
    label: 'Horarios',
    sublabel: 'Roles por Grupo',
    descripcion: 'Horarios semanales de clases por grado y grupo con copia automática.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'horarios',
  },
  {
    id: 'tareas_examenes',
    label: 'Tareas y Exámenes',
    sublabel: 'Actividades Escolares',
    descripcion: 'Publicación y seguimiento de tareas y evaluaciones por materia y grupo.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'tareas',
  },
  {
    id: 'actividades_docentes',
    label: 'Planeaciones Docentes',
    sublabel: 'Bitácora Académica',
    descripcion: 'Planeaciones didácticas semanales y actividades académicas del profesorado.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'actividades_docentes',
  },
  {
    id: 'incidencias',
    label: 'Incidencias y Prefectura',
    sublabel: 'Conducta y Citatorios',
    descripcion: 'Reportes disciplinarios, reconocimientos, retardos y seguimiento de prefectura.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'incidencias',
  },
  {
    id: 'psicologia',
    label: 'Psicología y Orientación',
    sublabel: 'Atención Socioemocional',
    descripcion: 'Atención psicopedagógica, sesiones de orientación y bitácora clínica estudiantil.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'expedientes',
    label: 'Expedientes de Psicología',
    sublabel: 'Seguimiento por Alumno',
    descripcion: 'Expedientes clínicos individuales por alumno con archivos, imágenes, bitácora de sesiones y cifrado confidencial.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    sublabel: 'Acervo y Préstamos',
    descripcion: 'Catálogo de libros físicos y digitales y control de préstamos.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'biblioteca',
  },
  {
    id: 'comunicados',
    label: 'Comunicados y Avisos',
    sublabel: 'Circulares Oficiales',
    descripcion: 'Emisión y consulta de avisos y circulares dirigidos a la comunidad escolar.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'comunicados',
  },
  {
    id: 'usuarios_colegio',
    label: 'Usuarios del Colegio',
    sublabel: 'Personal del Plantel',
    descripcion: 'Gestión de cuentas de directivos, docentes, prefectos y personal del colegio.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'usuarios',
  },
  {
    id: 'personalizar',
    label: 'Personalizar',
    sublabel: 'Escudo y Colores',
    descripcion: 'Configuración del escudo oficial, colores institucionales y datos en boletas.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: null,
  },
  {
    id: 'cafeteria',
    label: 'Cafetería',
    sublabel: 'Productos y Órdenes QR',
    descripcion: 'Alta de productos con precios e imágenes, catálogo escolar y entrega de órdenes con escáner QR del alumno.',
    categoria: 'Control Escolar y Colegio',
    collegeModuleId: 'cafeteria',
  },

  // Portal de Tutores
  {
    id: 'tutor_cuotas',
    label: 'Cuotas Escolares (Tutor)',
    sublabel: 'Colegiaturas y Pagos',
    descripcion: 'Consulta y pago de inscripciones, colegiaturas mensuales y recibos para tutores.',
    categoria: 'Portal de Tutores',
  },
  {
    id: 'mi_cafeteria',
    label: 'Mi Cafetería (Tutor)',
    sublabel: 'Pedidos y Carrito Escolar',
    descripcion: 'Tienda de cafetería para realizar pedidos para los hijos asignados con carrito de compras y seguimiento de órdenes.',
    categoria: 'Portal de Tutores',
  },
  {
    id: 'tutor_historial',
    label: 'Historial Académico (Tutor)',
    sublabel: 'Calificaciones y Boletas',
    descripcion: 'Consulta de calificaciones bimestrales y descarga de boletas de los hijos.',
    categoria: 'Portal de Tutores',
  },
  {
    id: 'tutor_alumnos',
    label: 'Alumnos a mi Cargo (Tutor)',
    sublabel: 'Hijos Vinculados',
    descripcion: 'Expedientes, asistencia y datos escolares de los hijos vinculados al tutor.',
    categoria: 'Portal de Tutores',
  },

  // Portal de Alumnos
  {
    id: 'mis_tareas',
    label: 'Mis Tareas (Alumno)',
    sublabel: 'Actividades y Entregas',
    descripcion: 'Vista de tareas asignadas y fechas de entrega para el estudiante.',
    categoria: 'Portal de Alumnos',
  },
  {
    id: 'mis_examenes',
    label: 'Mis Exámenes (Alumno)',
    sublabel: 'Evaluaciones y Fechas',
    descripcion: 'Calendario de exámenes y temarios de evaluación para el estudiante.',
    categoria: 'Portal de Alumnos',
  },
  {
    id: 'mis_comunicados',
    label: 'Mis Comunicados (Alumno)',
    sublabel: 'Avisos Escolares',
    descripcion: 'Tablero de avisos y circulares escolares para el estudiante.',
    categoria: 'Portal de Alumnos',
  },
  {
    id: 'mi_biblioteca',
    label: 'Mi Biblioteca (Alumno)',
    sublabel: 'Libros y Recursos',
    descripcion: 'Consulta de acervo bibliográfico y material digital para el estudiante.',
    categoria: 'Portal de Alumnos',
  },

  // Cuenta
  {
    id: 'mi_perfil',
    label: 'Mi Perfil',
    sublabel: 'Datos y Contraseña',
    descripcion: 'Información personal del usuario activo, credencial y cambio de contraseña.',
    categoria: 'Cuenta',
  },
];

export interface SupportAccessRequest {
  id: string;
  colegioId: string;
  colegioNombre: string;
  supportUserId: string;
  supportUserName: string;
  supportUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export type RolePermissionsMap = Record<UserRole, string[]>;

// Mapa por colegio: Record<colegioId, RolePermissionsMap>
export type CollegeRolePermissionsMap = Record<string, RolePermissionsMap>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  superusuario: SYSTEM_MODULES_REGISTRY.map((m) => m.id),
  soporte: SYSTEM_MODULES_REGISTRY.map((m) => m.id).filter(
    (id) =>
      id !== 'perfiles' &&
      id !== 'planes_modulos' &&
      id !== 'comisiones_plataforma'
  ),
  administrador: [
    'colegio_resumen',
    'campus',
    'ciclo_escolar',
    'preinscripciones',
    'tutores',
    'cobros',
    'pagos',
    'cafeteria',
    'estudiantes',
    'docentes',
    'materias',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'incidencias',
    'psicologia',
    'expedientes',
    'biblioteca',
    'comunicados',
    'usuarios_colegio',
    'personalizar',
    'mi_perfil',
  ],
  control_escolar: [
    'colegio_resumen',
    'campus',
    'ciclo_escolar',
    'preinscripciones',
    'tutores',
    'cobros',
    'pagos',
    'cafeteria',
    'estudiantes',
    'docentes',
    'materias',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'incidencias',
    'psicologia',
    'expedientes',
    'biblioteca',
    'comunicados',
    'usuarios_colegio',
    'personalizar',
    'mi_perfil',
  ],
  directivo: [
    'resumen_escolar',
    'campus',
    'ciclo_escolar',
    'preinscripciones',
    'tutores',
    'cobros',
    'pagos',
    'cafeteria',
    'estudiantes',
    'docentes',
    'materias',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'incidencias',
    'psicologia',
    'expedientes',
    'biblioteca',
    'comunicados',
    'mi_perfil',
  ],
  coordinador: [
    'resumen_escolar',
    'campus',
    'ciclo_escolar',
    'preinscripciones',
    'tutores',
    'cobros',
    'cafeteria',
    'estudiantes',
    'docentes',
    'materias',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'incidencias',
    'biblioteca',
    'comunicados',
    'mi_perfil',
  ],
  supervisor: [
    'colegio_resumen',
    'campus',
    'ciclo_escolar',
    'preinscripciones',
    'tutores',
    'cobros',
    'cafeteria',
    'estudiantes',
    'docentes',
    'materias',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'incidencias',
    'comunicados',
    'mi_perfil',
  ],
  prefecto: [
    'colegio_resumen',
    'campus',
    'ciclo_escolar',
    'cafeteria',
    'estudiantes',
    'asistencias',
    'calendario',
    'horarios',
    'incidencias',
    'comunicados',
    'mi_perfil',
  ],
  psicologo: [
    'resumen_psicologico',
    'estudiantes',
    'calendario',
    'incidencias',
    'psicologia',
    'expedientes',
    'comunicados',
    'mi_perfil',
  ],
  docente: [
    'resumen_docentes',
    'evaluaciones',
    'calificaciones',
    'asistencias',
    'calendario',
    'horarios',
    'tareas_examenes',
    'actividades_docentes',
    'biblioteca',
    'comunicados',
    'mi_perfil',
  ],
  tutor: [
    'tutor_cuotas',
    'mi_cafeteria',
    'mis_comunicados',
    'tutor_historial',
    'tutor_alumnos',
    'calendario',
    'mi_perfil',
  ],
  alumno: [
    'mis_tareas',
    'mis_examenes',
    'mis_comunicados',
    'mi_biblioteca',
    'mi_perfil',
  ],
};




