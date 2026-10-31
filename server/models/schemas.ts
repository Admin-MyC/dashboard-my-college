import mongoose, { Schema } from 'mongoose';

// 1. College Schema
const CollegeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, required: true },
    codigoCCT: { type: String, default: '' },
    lema: { type: String, default: '' },
    nivel: { type: String, default: 'Primaria' },
    escudoUrl: { type: String, default: '' },
    colores: {
      primario: { type: String, default: '#0B2545' },
      secundario: { type: String, default: '#C59B27' },
      textoCabecera: { type: String, default: '#FFFFFF' },
    },
    modulosHabilitados: [{ type: String }],
    estadoPago: { type: String, enum: ['al_corriente', 'proximo_a_vencer', 'vencido'], default: 'al_corriente' },
    plan: { type: String, default: 'Institucional Pro' },
    operacion: { type: String, enum: ['demo', 'plan'], default: 'plan' },
    fechaExpiracionDemo: { type: String, default: '' },
    modoSoporteActivo: { type: Boolean, default: false },
    modoSoporteDesactivadoPermanentemente: { type: Boolean, default: false },
    solicitudReanudacionDemoEnviada: { type: Boolean, default: false },
    montoMensual: { type: Number, default: 0 },
    fechaProximoPago: { type: String, default: '' },
    telefono: { type: String, default: '' },
    correo: { type: String, default: '' },
    direccion: { type: String, default: '' },
    director: { type: String, default: '' },
    adminUserId: { type: String, default: '' },
    alumnosTotales: { type: Number, default: 0 },
    docentesTotales: { type: Number, default: 0 },
    periodicidadEvaluacion: { type: String, default: 'trimestral' },
    disenoBoleta: { type: Schema.Types.Mixed, default: null },
    datosFiscales: { type: Schema.Types.Mixed, default: null },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, default: () => new Date().toISOString() },
    claveBajaCodigo: { type: String, default: '' },
    claveBajaExpiraEn: { type: Number, default: 0 },
    claveBajaGeneradaPor: { type: String, default: '' },
    modoPrueba: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2. User Schema
const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, required: true },
    correo: { type: String, default: '', index: true },
    usuarioLogin: { type: String, default: '', index: true },
    password: { type: String, default: '123456' },
    rol: { type: String, required: true, index: true },
    colegioId: { type: String, default: null, index: true },
    cargo: { type: String, default: '' },
    avatar: { type: String, default: '' },
    telefono: { type: String, default: '' },
    activo: { type: Boolean, default: true },
    ultimoAcceso: { type: String, default: 'Nunca' },
    creadoEn: { type: String, default: () => new Date().toISOString() },
    hijosIds: [{ type: String }],
    curpsAsociadas: [{ type: String }],
    metodoAcceso: { type: String, enum: ['qr', 'preinscripcion', 'directo'], default: 'directo' },
    curpBusquedaBloqueada: { type: Boolean, default: false },
    segundoTutor: {
      nombre: { type: String, default: '' },
      correo: { type: String, default: '' },
      telefono: { type: String, default: '' },
      parentesco: { type: String, default: '' },
    },
    parentesco: { type: String, default: 'Tutor Legal' },
    estudianteId: { type: String, default: '', index: true },
    nivelAsignado: { type: String, default: '' },
    tipoCoordinacion: { type: String, default: 'un_nivel' },
    nivelesAsignados: [{ type: String }],
    gruposAsignados: [{ type: String }],
    datosFiscales: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// 3. Student Schema
const StudentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '', index: true },
    cicloId: { type: String, default: '', index: true },
    matricula: { type: String, required: true },
    curp: { type: String, default: '', index: true },
    nombre: { type: String, required: true },
    apellidos: { type: String, default: '' },
    nivel: { type: String, default: 'Primaria' },
    grado: { type: String, default: '1°' },
    grupo: { type: String, default: 'A' },
    docenteId: { type: String, default: '' },
    docenteNombre: { type: String, default: '' },
    materiasIds: [{ type: String }],
    tutorNombre: { type: String, default: '' },
    tutorTelefono: { type: String, default: '' },
    tutorCorreo: { type: String, default: '' },
    tutorId: { type: String, default: '', index: true },
    segundoTutorNombre: { type: String, default: '' },
    segundoTutorTelefono: { type: String, default: '' },
    promedio: { type: Number, default: 0 },
    estatus: { type: String, enum: ['activo', 'baja', 'condicionado', 'pendiente', 'inscrito'], default: 'activo' },
    foto: { type: String, default: '' },
    fechaNacimiento: { type: String, default: '' },
    usuarioLogin: { type: String, default: '', index: true },
    password: { type: String, default: '' },
  },
  { timestamps: true }
);
StudentSchema.index({ colegioId: 1, matricula: 1 });
StudentSchema.index({ colegioId: 1, grado: 1, grupo: 1 });
StudentSchema.index({ colegioId: 1, curp: 1 });
StudentSchema.index({ colegioId: 1, estatus: 1 });
StudentSchema.index({ colegioId: 1, tutorId: 1 });

UserSchema.index({ colegioId: 1, rol: 1 });
UserSchema.index({ usuarioLogin: 1, activo: 1 });
UserSchema.index({ correo: 1, activo: 1 });

// 4. Teacher Schema
const TeacherSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '', index: true },
    nombre: { type: String, required: true },
    correo: { type: String, default: '' },
    telefono: { type: String, default: '' },
    especialidad: { type: String, default: '' },
    nivel: { type: String, default: 'Primaria' },
    esTutorPrincipal: { type: Boolean, default: false },
    grupoTutorado: { type: String, default: '' },
    materias: [{ type: String }],
    grupos: [{ type: String }],
    horasSemanales: { type: Number, default: 0 },
    estatus: { type: String, enum: ['activo', 'licencia', 'inactivo'], default: 'activo' },
    foto: { type: String, default: '' },
  },
  { timestamps: true }
);

// 5. Subject Schema
const SubjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '', index: true },
    cicloId: { type: String, default: '', index: true },
    nombre: { type: String, required: true },
    clave: { type: String, default: '' },
    grado: { type: String, default: '' },
    grupo: { type: String, default: '' },
    creditos: { type: Number, default: 0 },
    horasSemanales: { type: Number, default: 0 },
    docenteId: { type: String, default: '' },
    docenteNombre: { type: String, default: '' },
  },
  { timestamps: true }
);

// 6. Grade Record Schema
const GradeRecordSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    estudianteId: { type: String, required: true, index: true },
    materiaId: { type: String, required: true, index: true },
    materiaNombre: { type: String, required: true },
    periodo1: { type: Number, default: 0 },
    periodo2: { type: Number, default: 0 },
    periodo3: { type: Number, default: 0 },
    promedioFinal: { type: Number, default: 0 },
    observaciones: { type: String, default: '' },
    periodosPorModalidad: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
GradeRecordSchema.index({ colegioId: 1, estudianteId: 1 });

// 7. Incident Schema
const IncidentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    estudianteId: { type: String, required: true, index: true },
    estudianteNombre: { type: String, required: true },
    gradoGrupo: { type: String, required: true },
    reportadoPor: { type: String, required: true },
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: String, required: true },
    estatus: { type: String, default: 'Pendiente' },
    acuerdos: { type: String, default: '' },
  },
  { timestamps: true }
);

// 8. Psychology Schema
const PsychologySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    estudianteId: { type: String, required: true, index: true },
    estudianteNombre: { type: String, required: true },
    gradoGrupo: { type: String, required: true },
    psicologoNombre: { type: String, required: true },
    motivoConsulta: { type: String, required: true },
    resumenSesion: { type: String, default: '' },
    acuerdos: { type: String, default: '' },
    esConfidencial: { type: Boolean, default: true },
    fecha: { type: String, required: true },
    estatus: { type: String, default: 'En Proceso' },
  },
  { timestamps: true }
);

// 9. Library Book Schema
const LibraryBookSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    titulo: { type: String, required: true },
    autor: { type: String, required: true },
    isbn: { type: String, default: '' },
    editorial: { type: String, default: '' },
    categoria: { type: String, default: '' },
    ejemplaresTotales: { type: Number, default: 1 },
    disponibles: { type: Number, default: 1 },
    ubicacion: { type: String, default: '' },
    esDigitalPdf: { type: Boolean, default: false },
    archivoPdfNombre: { type: String, default: '' },
    archivoPdfUrl: { type: String, default: '' },
    archivoPdfTamano: { type: String, default: '' },
    gruposAsignados: [{ type: String }],
    subidoPorDocenteId: { type: String, default: '' },
    subidoPorDocenteNombre: { type: String, default: '' },
    soloLecturaSinDescarga: { type: Boolean, default: true },
    fechaPublicacion: { type: String, default: '' },
  },
  { timestamps: true }
);

// 10. Notice Schema
const NoticeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
    tipoComunicado: { type: String, default: 'Aviso' },
    nivelEscolar: { type: String, default: '' },
    gradoGrupo: { type: String, default: '' },
    estudianteId: { type: String, default: '' },
    estudianteNombre: { type: String, default: '' },
    prioridad: { type: String, default: 'Normal' },
    fecha: { type: String, required: true },
    autorId: { type: String, default: '' },
    autor: { type: String, required: true },
    autorRol: { type: String, default: '' },
    destinatarios: { type: String, default: 'Toda la Comunidad' },
    destinatariosPrincipalesNombres: [{ type: String }],
    destinatariosPrincipalesCorreos: [{ type: String }],
    copiaCoordinadoresIds: [{ type: String }],
    copiaDocentesIds: [{ type: String }],
    enCopiaNombres: [{ type: String }],
    enCopiaCorreos: [{ type: String }],
    usuariosInvolucradosIds: [{ type: String }],
  },
  { timestamps: true }
);

// 11. Teacher Activity Schema
const TeacherActivitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    docenteId: { type: String, required: true, index: true },
    docenteNombre: { type: String, required: true },
    titulo: { type: String, required: true },
    materia: { type: String, required: true },
    nivel: { type: String, default: '' },
    gradoGrupo: { type: String, required: true },
    semana: { type: String, required: true },
    duracionSemanas: { type: Number, default: 3 },
    etapaPiaget: { type: String, default: '' },
    modalidadBruner: { type: String, default: '' },
    faseNEM: { type: String, default: '' },
    campoFormativoNEM: { type: String, default: '' },
    ejesArticuladoresNEM: [{ type: String }],
    metodologiaDidacticaNEM: { type: String, default: '' },
    escenarioNEM: { type: String, default: '' },
    contenidoProgramaSinteticoNEM: { type: String, default: '' },
    pdaNEM: { type: String, default: '' },
    problematizacionProgramaAnaliticoNEM: { type: String, default: '' },
    evaluacionFormativaNEM: { type: String, default: '' },
    objetivo: { type: String, default: '' },
    entregables: { type: String, default: '' },
    semanasDetalle: { type: Schema.Types.Mixed, default: [] },
    archivoNombre: { type: String, default: '' },
    archivoUrl: { type: String, default: '' },
    archivoTipo: { type: String, default: '' },
    archivoTamano: { type: String, default: '' },
    estado: { type: String, default: 'Borrador' },
    fechaEntrega: { type: String, default: '' },
  },
  { timestamps: true }
);

// 12. Task Or Exam Schema
const TaskOrExamSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    tipo: { type: String, enum: ['tarea', 'examen', 'proyecto'], required: true },
    titulo: { type: String, required: true },
    materia: { type: String, required: true },
    gradoGrupo: { type: String, required: true },
    gruposAsignados: [{ type: String }],
    docenteId: { type: String, default: '' },
    docenteNombre: { type: String, required: true },
    fechaLimite: { type: String, required: true },
    programado: { type: Boolean, default: false },
    fechaHabilitacion: { type: String, default: '' },
    horaHabilitacion: { type: String, default: '' },
    puntosMaximos: { type: Number, default: 10 },
    estado: { type: String, default: 'Activa' },
    instrucciones: { type: String, default: '' },
    solicitarEvidencia: { type: Boolean, default: false },
    evidenciaNombre: { type: String, default: '' },
    evidenciaUrl: { type: String, default: '' },
    evidenciaTipo: { type: String, default: '' },
    entregasEvidencias: { type: Schema.Types.Mixed, default: [] },
    entregasExamenes: { type: Schema.Types.Mixed, default: [] },
    savedPeriodId: { type: String, default: '' },
    periodoNombre: { type: String, default: '' },
    fechaInicioPeriodo: { type: String, default: '' },
    fechaFinPeriodo: { type: String, default: '' },
    preguntasExamen: { type: Schema.Types.Mixed, default: [] },
    configuracionExamen: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// 13. Attendance Schema
const AttendanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    estudianteId: { type: String, required: true, index: true },
    estudianteNombre: { type: String, required: true },
    matricula: { type: String, required: true, index: true },
    grado: { type: String, required: true },
    grupo: { type: String, required: true },
    foto: { type: String, default: '' },
    fecha: { type: String, required: true, index: true },
    hora: { type: String, required: true },
    tipo: { type: String, enum: ['general', 'clase'], required: true, index: true },
    materiaNombre: { type: String, default: '' },
    docenteNombre: { type: String, default: '' },
    estado: { type: String, enum: ['presente', 'retardo', 'falta', 'justificado'], default: 'presente' },
    metodo: { type: String, default: 'qr' },
    registradoPor: { type: String, default: '' },
    timestamp: { type: Number, default: () => Date.now() },
    tutorNotificado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 14. Preenrollment Config Schema (customized form per college)
const PreenrollmentConfigSchema = new Schema(
  {
    colegioId: { type: String, required: true, unique: true, index: true },
    documentosRequeridos: [
      {
        id: { type: String, required: true },
        nombre: { type: String, required: true },
        descripcion: { type: String, default: '' },
        obligatorio: { type: Boolean, default: false },
        activo: { type: Boolean, default: true },
      },
    ],
    cuotasPorNivel: { type: Schema.Types.Mixed, default: {} },
    nivelesDisponibles: [{ type: String }],
    instruccionesPersonalizadas: { type: String, default: '' },
    mostrarCuotasEstimadas: { type: Boolean, default: true },
    pedirPromedio: { type: Boolean, default: true },
    pedirEscuelaProcedencia: { type: Boolean, default: true },
    pedirFechaNacimiento: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 15. Preenrollment Request Schema
const PreenrollmentRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    colegioNombre: { type: String, required: true },
    folio: { type: String, required: true, index: true },
    alumnoNombreCompleto: { type: String, required: true },
    curp: { type: String, required: true },
    fechaNacimiento: { type: String, default: '' },
    promedio: { type: Number, default: 0 },
    nivel: { type: String, required: true },
    grado: { type: String, required: true },
    escuelaProcedencia: { type: String, default: 'Ninguna' },
    tutorNombre: { type: String, required: true },
    tutorCorreo: { type: String, required: true },
    tutorTelefono: { type: String, required: true },
    archivosAdjuntos: [
      {
        documentoId: { type: String },
        nombreDocumento: { type: String },
        nombreArchivo: { type: String },
        tamano: { type: String },
        fechaSubida: { type: String },
      },
    ],
    estatus: { type: String, enum: ['pendiente', 'aceptado', 'rechazado'], default: 'pendiente' },
    fechaSolicitud: { type: String, required: true },
    fechaResolucion: { type: String },
    motivoRechazo: { type: String },
    conceptosPago: [
      {
        concepto: { type: String },
        monto: { type: Number },
      },
    ],
    montoTotalInscripcion: { type: Number, default: 0 },
    estadoPago: {
      type: String,
      enum: ['pendiente_pago', 'pago_confirmado'],
      default: 'pendiente_pago',
    },
    fechaPago: { type: String },
    folioComprobante: { type: String },
    estudianteId: { type: String },
    matriculaGenerada: { type: String },
    tutorUsuarioGenerado: { type: String },
    tutorPasswordTemporal: { type: String },
    grupoAsignado: { type: String },
    fechaAsignacionGrupo: { type: String },
  },
  { timestamps: true }
);

// 16. Campus Schema (per college)
const CampusSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    nombre: { type: String, required: true },
    clave: { type: String, default: '' },
    direccion: { type: String, default: '' },
    telefono: { type: String, default: '' },
    responsable: { type: String, default: '' },
    niveles: [{ type: String }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 17. School Cycle Schema (per college)
const SchoolCycleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    nombre: { type: String, required: true },
    fechaInicioClases: { type: String, default: '' },
    fechaFinClases: { type: String, default: '' },
    periodosVacacionales: { type: Schema.Types.Mixed, default: [] },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

// 18. Calendar Non-School Day Schema (per college)
const CalendarDaySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    cicloId: { type: String, default: '' },
    fecha: { type: String, required: true, index: true },
    fechaFin: { type: String, default: '' },
    motivo: { type: String, required: true },
    tipo: { type: String, default: 'asueto_oficial' },
    descripcion: { type: String, default: '' },
    visibleTutores: { type: Boolean, default: true },
    visibleDocentes: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 19. Group Schedule Schema (per college)
const GroupScheduleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '' },
    cicloId: { type: String, default: '' },
    grado: { type: String, required: true },
    grupo: { type: String, required: true },
    semanaInicio: { type: String, default: '' },
    semanaEtiqueta: { type: String, default: '' },
    bloques: { type: Schema.Types.Mixed, default: [] },
    actualizadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

// 20. Monthly Tuition Schema (per college)
const MonthlyTuitionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    estudianteId: { type: String, required: true, index: true },
    mesClave: { type: String, required: true },
    mesEtiqueta: { type: String, default: '' },
    montoColegiatura: { type: Number, default: 0 },
    pagado: { type: Boolean, default: false },
    fechaPago: { type: String, default: '' },
    metodoPago: { type: String, default: '' },
    folioRecibo: { type: String, default: '' },
  },
  { timestamps: true }
);

// 21. Billing Concept Schema (per college)
const BillingConceptSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '' },
    concepto: { type: String, required: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, default: 0 },
    tipo: { type: String, default: 'colegiatura' },
    llevaImagen: { type: Boolean, default: false },
    imagenUrl: { type: String, default: '' },
    esRecurrenteMensual: { type: Boolean, default: false },
    diaCobroMensual: { type: Number, default: 10 },
    fechaCobroMensual: { type: String, default: '' },
    programadoParaFuturo: { type: Boolean, default: false },
    fechaProgramadaPublicacion: { type: String, default: '' },
    horaProgramadaPublicacion: { type: String, default: '' },
    fechaVencimiento: { type: String, default: '' },
    fechaCreacion: { type: String, default: '' },
    fechaLimitePago: { type: String, default: '' },
    nivelesDestino: [{ type: String }],
    nivelesPublicados: [{ type: String }],
    obligatorio: { type: Boolean, default: true },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

// 22. Evaluation Concept Schema (per college)
const EvaluationConceptSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    docenteId: { type: String, default: '' },
    materiaId: { type: String, default: 'todas' },
    gradoGrupo: { type: String, default: 'todos' },
    nombre: { type: String, required: true },
    descripcion: { type: String, default: '' },
    tipo: { type: String, default: 'personalizado' },
    porcentaje: { type: Number, default: 0 },
    totalMeta: { type: Number, default: 10 },
    periodicidad: { type: String, default: 'trimestral' },
    periodoIndex: { type: Number, default: 1 },
    periodoNombre: { type: String, default: '' },
    savedPeriodId: { type: String, default: '' },
    esAutomaticoSistema: { type: Boolean, default: false },
    tipoFuente: { type: String, default: 'manual' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 23. Evaluation Saved Period Schema (per college and per teacher/user)
const EvaluationSavedPeriodSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    docenteId: { type: String, default: '' },
    docenteNombre: { type: String, default: '' },
    periodicidad: { type: String, default: 'trimestral' },
    periodoIndex: { type: Number, default: 1 },
    periodoNombre: { type: String, default: '' },
    modoSeleccionFecha: { type: String, default: 'mes_completo' },
    fechaInicio: { type: String, default: '' },
    fechaFin: { type: String, default: '' },
    conceptos: { type: Schema.Types.Mixed, default: [] },
    creadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
    actualizadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

// 24. Student Evaluation Schema (per college and per teacher/user)
const StudentEvaluationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    docenteId: { type: String, default: '' },
    docenteNombre: { type: String, default: '' },
    estudianteId: { type: String, required: true, index: true },
    materiaId: { type: String, required: true, index: true },
    periodicidad: { type: String, default: 'trimestral' },
    periodoIndex: { type: Number, default: 1 },
    calificacionExamen: { type: Number, default: 0 },
    tareasEntregadasAlumno: { type: Number, default: 0 },
    totalTareasDocente: { type: Number, default: 1 },
    checklistTareas: { type: Schema.Types.Mixed, default: {} },
    puntajesConceptos: { type: Schema.Types.Mixed, default: {} },
    calificacionesConceptos: { type: Schema.Types.Mixed, default: {} },
    calificacionManualActiva: { type: Boolean, default: false },
    calificacionManual: { type: Number, default: 0 },
    porcentajeFinalObtenido: { type: Number, default: 0 },
    calificacionFinalPeriodo: { type: Number, default: 0 },
    observaciones: { type: String, default: '' },
    actualizadoEn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

// 25. Activity Log Schema (per college or global)
const ActivityLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    fecha: { type: String, required: true, index: true },
    hora: { type: String, required: true },
    timestamp: { type: Number, default: () => Date.now(), index: true },
    usuarioId: { type: String, default: '' },
    usuarioNombre: { type: String, default: '' },
    usuarioCorreo: { type: String, default: '' },
    rol: { type: String, default: '' },
    colegioId: { type: String, default: null, index: true },
    colegioNombre: { type: String, default: '' },
    modulo: { type: String, default: '' },
    accion: { type: String, default: '' },
    detalle: { type: String, default: '' },
    acceso: { type: String, default: '' },
  },
  { timestamps: true }
);

// High-Performance Compound Indexes for Daily High-Volume Queries
TeacherSchema.index({ colegioId: 1, estatus: 1 });
SubjectSchema.index({ colegioId: 1, grado: 1 });
AttendanceSchema.index({ colegioId: 1, fecha: -1, tipo: 1 });
AttendanceSchema.index({ colegioId: 1, estudianteId: 1, fecha: -1 });
AttendanceSchema.index({ colegioId: 1, grado: 1, grupo: 1, fecha: -1 });
MonthlyTuitionSchema.index({ colegioId: 1, mesClave: 1, pagado: 1 });
MonthlyTuitionSchema.index({ colegioId: 1, estudianteId: 1, mesClave: 1 });
BillingConceptSchema.index({ colegioId: 1, activo: 1 });
StudentEvaluationSchema.index({ colegioId: 1, periodicidad: 1, periodoIndex: 1 });
StudentEvaluationSchema.index({ colegioId: 1, estudianteId: 1, materiaId: 1 });
TaskOrExamSchema.index({ colegioId: 1, gradoGrupo: 1, estado: 1 });
NoticeSchema.index({ colegioId: 1, fecha: -1 });
IncidentSchema.index({ colegioId: 1, estudianteId: 1, fecha: -1 });
PreenrollmentRequestSchema.index({ colegioId: 1, estatus: 1, fechaSolicitud: -1 });
GroupScheduleSchema.index({ colegioId: 1, grado: 1, grupo: 1 });
ActivityLogSchema.index({ colegioId: 1, fecha: -1, timestamp: -1 });

// 25. Student Discount Schema (Descuentos y Becas)
const StudentDiscountSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    campusId: { type: String, default: '' },
    nombreDescuento: { type: String, required: true },
    conceptoId: { type: String, default: 'todos' },
    conceptoNombre: { type: String, default: 'Todos los Conceptos de Cobro' },
    tipoDescuento: { type: String, enum: ['porcentaje', 'fijo'], default: 'porcentaje' },
    valor: { type: Number, required: true },
    alumnosIds: [{ type: String }],
    motivo: { type: String, default: '' },
    estatus: {
      type: String,
      enum: ['pendiente_aprobacion', 'aprobado', 'rechazado'],
      default: 'aprobado',
      index: true,
    },
    solicitadoPorId: { type: String, default: '' },
    solicitadoPorNombre: { type: String, default: '' },
    solicitadoPorRol: { type: String, default: '' },
    autorizadoPorId: { type: String, default: '' },
    autorizadoPorNombre: { type: String, default: '' },
    fechaSolicitud: { type: String, default: () => new Date().toISOString().split('T')[0] },
    fechaResolucion: { type: String, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StudentDiscountSchema.index({ colegioId: 1, estatus: 1, activo: 1 });

export const CollegeModel = mongoose.models.College || mongoose.model('College', CollegeSchema);
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const TeacherModel = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
export const SubjectModel = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
export const GradeRecordModel = mongoose.models.GradeRecord || mongoose.model('GradeRecord', GradeRecordSchema);
export const IncidentModel = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
export const PsychologyModel = mongoose.models.Psychology || mongoose.model('Psychology', PsychologySchema);
export const LibraryBookModel = mongoose.models.LibraryBook || mongoose.model('LibraryBook', LibraryBookSchema);
export const NoticeModel = mongoose.models.Notice || mongoose.model('Notice', NoticeSchema);
export const TeacherActivityModel = mongoose.models.TeacherActivity || mongoose.model('TeacherActivity', TeacherActivitySchema);
export const TaskOrExamModel = mongoose.models.TaskOrExam || mongoose.model('TaskOrExam', TaskOrExamSchema);
export const AttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const PreenrollmentConfigModel =
  mongoose.models.PreenrollmentConfig || mongoose.model('PreenrollmentConfig', PreenrollmentConfigSchema);
export const PreenrollmentRequestModel =
  mongoose.models.PreenrollmentRequest || mongoose.model('PreenrollmentRequest', PreenrollmentRequestSchema);
export const CampusModel = mongoose.models.Campus || mongoose.model('Campus', CampusSchema);
export const SchoolCycleModel = mongoose.models.SchoolCycle || mongoose.model('SchoolCycle', SchoolCycleSchema);
export const CalendarDayModel = mongoose.models.CalendarDay || mongoose.model('CalendarDay', CalendarDaySchema);
export const GroupScheduleModel = mongoose.models.GroupSchedule || mongoose.model('GroupSchedule', GroupScheduleSchema);
export const MonthlyTuitionModel = mongoose.models.MonthlyTuition || mongoose.model('MonthlyTuition', MonthlyTuitionSchema);
export const BillingConceptModel = mongoose.models.BillingConcept || mongoose.model('BillingConcept', BillingConceptSchema);
export const StudentDiscountModel = mongoose.models.StudentDiscount || mongoose.model('StudentDiscount', StudentDiscountSchema);
export const EvaluationConceptModel = mongoose.models.EvaluationConcept || mongoose.model('EvaluationConcept', EvaluationConceptSchema);
export const EvaluationSavedPeriodModel = mongoose.models.EvaluationSavedPeriod || mongoose.model('EvaluationSavedPeriod', EvaluationSavedPeriodSchema);
export const StudentEvaluationModel = mongoose.models.StudentEvaluation || mongoose.model('StudentEvaluation', StudentEvaluationSchema);
export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

// Cafeteria Schemas
const CafeteriaProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, required: true },
    categoria: { type: String, default: 'General', index: true },
    imagen: { type: String, default: '' },
    disponible: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    creadoEn: { type: String, default: () => new Date().toISOString() },
    actualizadoEn: { type: String, default: '' },
  },
  { timestamps: true }
);

const CafeteriaOrderItemSchema = new Schema(
  {
    productoId: { type: String, required: true },
    nombre: { type: String, required: true },
    precioUnitario: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    notas: { type: String, default: '' },
    imagen: { type: String, default: '' },
  },
  { _id: false }
);

const CafeteriaOrderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    folio: { type: String, required: true, index: true },
    colegioId: { type: String, required: true, index: true },
    tutorId: { type: String, required: true, index: true },
    tutorNombre: { type: String, required: true },
    tutorTelefono: { type: String, default: '' },
    estudianteId: { type: String, required: true, index: true },
    estudianteNombre: { type: String, required: true },
    estudianteMatricula: { type: String, required: true, index: true },
    estudianteGrado: { type: String, default: '' },
    estudianteGrupo: { type: String, default: '' },
    estudianteFoto: { type: String, default: '' },
    items: [CafeteriaOrderItemSchema],
    totalItems: { type: Number, default: 0 },
    total: { type: Number, required: true },
    metodoPago: {
      type: String,
      enum: ['saldo_escolar', 'tarjeta', 'efectivo_cafeteria', 'spei'],
      default: 'saldo_escolar',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'preparando', 'listo', 'entregada', 'cancelada'],
      default: 'pendiente',
      index: true,
    },
    fechaCreacion: { type: String, default: () => new Date().toISOString() },
    fechaEntrega: { type: String, default: '' },
    entregadoPor: { type: String, default: '' },
    notas: { type: String, default: '' },
  },
  { timestamps: true }
);

CafeteriaProductSchema.index({ colegioId: 1, disponible: 1 });
CafeteriaOrderSchema.index({ colegioId: 1, estado: 1, fechaCreacion: -1 });

export const CafeteriaProductModel =
  mongoose.models.CafeteriaProduct || mongoose.model('CafeteriaProduct', CafeteriaProductSchema);
export const CafeteriaOrderModel =
  mongoose.models.CafeteriaOrder || mongoose.model('CafeteriaOrder', CafeteriaOrderSchema);
