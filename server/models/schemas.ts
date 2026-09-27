import mongoose, { Schema } from 'mongoose';

// 1. College Schema
const CollegeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, required: true },
    codigoCCT: { type: String, required: true },
    lema: { type: String, default: '' },
    nivel: { type: String, required: true },
    escudoUrl: { type: String, default: '' },
    colores: {
      primario: { type: String, default: '#0B2545' },
      secundario: { type: String, default: '#C59B27' },
      textoCabecera: { type: String, default: '#FFFFFF' },
    },
    modulosHabilitados: [{ type: String }],
    estadoPago: { type: String, enum: ['al_corriente', 'proximo_a_vencer', 'vencido'], default: 'al_corriente' },
    plan: { type: String, default: 'Institucional Pro' },
    montoMensual: { type: Number, default: 0 },
    fechaProximoPago: { type: String, default: '' },
    telefono: { type: String, default: '' },
    correo: { type: String, default: '' },
    direccion: { type: String, default: '' },
    director: { type: String, default: '' },
    adminUserId: { type: String, default: '' },
    alumnosTotales: { type: Number, default: 0 },
    docentesTotales: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
    creadoEn: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// 2. User Schema
const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: '123456' },
    rol: { type: String, required: true, index: true },
    colegioId: { type: String, default: null, index: true },
    cargo: { type: String, default: '' },
    avatar: { type: String, default: '' },
    telefono: { type: String, default: '' },
    activo: { type: Boolean, default: true },
    ultimoAcceso: { type: String },
    creadoEn: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// 3. Student Schema
const StudentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    matricula: { type: String, required: true },
    curp: { type: String, default: '' },
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    grado: { type: String, required: true },
    grupo: { type: String, required: true },
    tutorNombre: { type: String, default: '' },
    tutorTelefono: { type: String, default: '' },
    tutorCorreo: { type: String, default: '' },
    promedio: { type: Number, default: 0 },
    estatus: { type: String, enum: ['activo', 'baja', 'condicionado'], default: 'activo' },
    foto: { type: String, default: '' },
    fechaNacimiento: { type: String, default: '' },
  },
  { timestamps: true }
);
StudentSchema.index({ colegioId: 1, matricula: 1 });
StudentSchema.index({ colegioId: 1, grado: 1, grupo: 1 });

// 4. Teacher Schema
const TeacherSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    nombre: { type: String, required: true },
    correo: { type: String, required: true },
    telefono: { type: String, default: '' },
    especialidad: { type: String, default: '' },
    materias: [{ type: String }],
    grupos: [{ type: String }],
    horasSemanales: { type: Number, default: 0 },
    estatus: { type: String, enum: ['activo', 'licencia'], default: 'activo' },
    foto: { type: String, default: '' },
  },
  { timestamps: true }
);

// 5. Subject Schema
const SubjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    colegioId: { type: String, required: true, index: true },
    nombre: { type: String, required: true },
    clave: { type: String, required: true },
    grado: { type: String, required: true },
    creditos: { type: Number, default: 0 },
    horasSemanales: { type: Number, default: 0 },
    docenteId: { type: String },
    docenteNombre: { type: String },
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
    prioridad: { type: String, default: 'Normal' },
    fecha: { type: String, required: true },
    autor: { type: String, required: true },
    destinatarios: { type: String, default: 'Toda la Comunidad' },
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
    gradoGrupo: { type: String, required: true },
    semana: { type: String, required: true },
    objetivo: { type: String, default: '' },
    entregables: { type: String, default: '' },
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
    tipo: { type: String, enum: ['tarea', 'examen'], required: true },
    titulo: { type: String, required: true },
    materia: { type: String, required: true },
    gradoGrupo: { type: String, required: true },
    docenteNombre: { type: String, required: true },
    fechaLimite: { type: String, required: true },
    puntosMaximos: { type: Number, default: 10 },
    estado: { type: String, default: 'Activa' },
    instrucciones: { type: String, default: '' },
  },
  { timestamps: true }
);

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
