import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  College,
  User,
  Student,
  Teacher,
  Subject,
  GradeRecord,
  IncidentRecord,
  PsychologyRecord,
  LibraryBook,
  Notice,
  TeacherActivity,
  TaskOrExam,
  TaskEvidenceSubmission,
  StudentExamSubmission,
  CollegeModuleId,
  AttendanceRecord,
  UserRole,
  EmailNotification,
  PreenrollmentRequest,
  PreenrollmentCollegeConfig,
  PreenrollmentAttachedFile,
  PlatformFeeConfig,
  SchoolCycle,
  CalendarNonSchoolDay,
  GroupWeekSchedule,
  Campus,
  MonthlyTuitionRecord,
  BillingConcept,
  StudentDiscount,
  DiscountStatus,
  ActivityLogEntry,
  RolePermissionsMap,
  CollegeRolePermissionsMap,
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_MODULES_REGISTRY,
  RoleDefinition,
  ROLES_CONFIG,
  EvaluationConceptItem,
  EvaluationSavedPeriod,
  StudentEvaluationEntry,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  CollegeGroup,
  AcademicLevel,
  SupportAccessRequest,
  DrivePickupEntry,
  CollegeScheduleDriveConfig,
  TriggerEnFilaResult,
  EnFilaStudentCheckResult,
  DayOfWeek,
  ScheduleCell,
  CafeteriaProduct,
  CafeteriaOrder,
  CafeteriaOrderStatus,
} from '../types';
import { DEFAULT_PLATFORM_FEE_CONFIG } from '../utils/feeCalculator';
import {
  loadStoredNotifications,
  saveStoredNotifications,
  dispatchSystemEmailNotification,
  SendNotificationParams,
} from '../services/notificationService';
import {
  INITIAL_COLLEGES,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_GRADES,
  INITIAL_INCIDENTS,
  INITIAL_PSYCHOLOGY,
  INITIAL_LIBRARY,
  INITIAL_NOTICES,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS_EXAMS,
  INITIAL_ATTENDANCE,
  INITIAL_PREENROLLMENTS,
  INITIAL_PREENROLLMENT_CONFIGS,
  INITIAL_CAMPUSES,
  INITIAL_SCHOOL_CYCLES,
  INITIAL_CALENDAR_DAYS,
  INITIAL_GROUP_SCHEDULES,
  INITIAL_MONTHLY_TUITIONS,
  INITIAL_BILLING_CONCEPTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_EVALUATION_CONCEPTS,
  INITIAL_STUDENT_EVALUATIONS,
  INITIAL_STUDENT_DISCOUNTS,
  INITIAL_CAFETERIA_PRODUCTS,
  INITIAL_CAFETERIA_ORDERS,
} from '../data/initialData';
import {
  generateTutorUsername,
  generateRandomPassword,
  ensureUserCredentials,
  isValidGeneratedUsername,
  getDefaultEnrollmentFees,
  createDefaultCollegePreenrollmentConfig,
} from '../utils/preenrollmentHelper';
import { ensureStudentCredentials } from '../utils/studentCredentialsHelper';
import { createShieldSvg } from '../utils/shieldHelper';
import {
  getCafeteriaProductFallback,
  getStudentAvatarFallback,
  getUserAvatarFallback,
} from '../utils/imageUtils';
import { apiClient, DatabaseStatus } from '../services/apiClient';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  selectedCollegeId: string | null;
  setSelectedCollegeId: (id: string | null) => void;
  activeCollege: College | null;
  colleges: College[];
  users: User[];
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  grades: GradeRecord[];
  incidents: IncidentRecord[];
  psychologyRecords: PsychologyRecord[];
  libraryBooks: LibraryBook[];
  notices: Notice[];
  activities: TeacherActivity[];
  tasksExams: TaskOrExam[];
  attendanceRecords: AttendanceRecord[];
  preenrollments: PreenrollmentRequest[];
  preenrollmentConfigs: Record<string, PreenrollmentCollegeConfig>;
  getPreenrollmentConfig: (colegioId: string) => PreenrollmentCollegeConfig;
  updatePreenrollmentConfig: (colegioId: string, updates: Partial<PreenrollmentCollegeConfig>) => void;
  platformFeeConfig: PlatformFeeConfig;
  updatePlatformFeeConfig: (updates: Partial<PlatformFeeConfig>) => void;
  dbStatus: DatabaseStatus | null;
  refreshDbStatus: () => Promise<void>;
  
  // Actions
  addCollege: (
    collegeData: Partial<College>,
    adminUserData: {
      nombre: string;
      correo: string;
      usuarioLogin?: string;
      password?: string;
      telefono?: string;
    }
  ) => { college: College; adminUser: User };
  updateCollege: (id: string, updates: Partial<College>) => void;
  deleteCollege: (id: string) => void;
  generateCollegeDeletionKey: (collegeId: string) => { codigo: string; expiraEn: number };
  verifyCollegeDeletionKey: (
    collegeId: string,
    inputKey: string
  ) => Promise<{ valid: boolean; reason?: 'no_key' | 'expired' | 'invalid'; message?: string }>;
  toggleCollegeActiveStatus: (collegeId: string, activo: boolean) => void;
  toggleModule: (collegeId: string, moduleId: CollegeModuleId, enable: boolean) => void;
  updateCollegeBranding: (
    collegeId: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ) => void;
  updateCollegeReportCardDesign: (
    collegeId: string,
    disenoBoleta: College['disenoBoleta']
  ) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'creadoEn'>, options?: { skipWelcomeEmail?: boolean }) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addStudent: (data: Omit<Student, 'id'> & { id?: string }) => Student;
  addStudentsBulk: (items: (Omit<Student, 'id'> & { id?: string })[]) => Student[];
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (data: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (data: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  collegeGroups: CollegeGroup[];
  addCollegeGroup: (data: Omit<CollegeGroup, 'id'>) => CollegeGroup;
  deleteCollegeGroup: (id: string) => void;
  getGroupsForCollegeLevel: (colegioId: string, nivel: AcademicLevel) => string[];
  // Campus, Ciclos Escolares, Calendario, Horarios y Colegiaturas Mensuales
  campuses: Campus[];
  selectedCampusId: string | null; // null means 'todos' (all campuses of the college)
  setSelectedCampusId: (id: string | null) => void;
  addCampus: (data: Omit<Campus, 'id'>) => Campus;
  updateCampus: (id: string, updates: Partial<Campus>) => void;
  deleteCampus: (id: string) => void;
  assignCampusMembers: (
    campusId: string,
    colegioId: string,
    teacherIds: string[],
    studentIds: string[]
  ) => void;
  schoolCycles: SchoolCycle[];
  addSchoolCycle: (data: Omit<SchoolCycle, 'id' | 'creadoEn'>) => SchoolCycle;
  updateSchoolCycle: (id: string, updates: Partial<SchoolCycle>) => void;
  deleteSchoolCycle: (id: string) => void;
  calendarDays: CalendarNonSchoolDay[];
  addCalendarDay: (data: Omit<CalendarNonSchoolDay, 'id'>) => CalendarNonSchoolDay;
  updateCalendarDay: (id: string, updates: Partial<CalendarNonSchoolDay>) => void;
  deleteCalendarDay: (id: string) => void;
  groupSchedules: GroupWeekSchedule[];
  saveGroupSchedule: (data: Omit<GroupWeekSchedule, 'id' | 'actualizadoEn'> & { id?: string }) => GroupWeekSchedule;
  deleteGroupSchedule: (id: string) => void;
  scheduleDriveConfigs: Record<string, CollegeScheduleDriveConfig>;
  getCollegeScheduleDriveConfig: (colegioId: string) => CollegeScheduleDriveConfig;
  toggleCollegeScheduleEnabled: (colegioId: string, enabled: boolean) => void;
  toggleCollegeDriveUsageEnabled: (colegioId: string, enabled: boolean) => void;
  isCollegeDriveUsageEnabled: (colegioId?: string | null) => boolean;
  updateCollegeScheduleDriveConfig: (
    colegioId: string,
    updates: Partial<CollegeScheduleDriveConfig>
  ) => void;
  setCollegeDriveOpenStatus: (colegioId: string, isOpen: boolean) => void;
  isCollegeDriveOpen: (colegioId?: string | null) => boolean;
  drivePickupQueue: DrivePickupEntry[];
  triggerTutorEnFila: (options?: {
    studentIds?: string[];
    pickupTutorName?: string;
    pickupTutorParentesco?: string;
    pickupTutorTelefono?: string;
  }) => TriggerEnFilaResult;
  markDriveStudentDelivered: (entryId: string) => void;
  removeDriveQueueEntry: (entryId: string) => void;
  clearDeliveredDriveEntries: (colegioId?: string | null) => void;
  monthlyTuitions: MonthlyTuitionRecord[];
  toggleMonthlyTuitionPayment: (
    colegioId: string,
    estudianteId: string,
    mesClave: string,
    mesEtiqueta: string,
    montoColegiatura: number,
    pagado: boolean,
    details?: {
      fechaPago?: string;
      metodoPago?: string;
      folioRecibo?: string;
    }
  ) => void;
  billingConcepts: BillingConcept[];
  addBillingConcept: (data: Omit<BillingConcept, 'id' | 'creadoEn'>) => BillingConcept;
  updateBillingConcept: (id: string, updates: Partial<BillingConcept>) => void;
  deleteBillingConcept: (id: string) => void;
  requestDeleteBillingConcept: (id: string, motivo?: string) => void;
  cancelDeleteBillingConceptRequest: (id: string) => void;
  studentDiscounts: StudentDiscount[];
  addStudentDiscount: (data: Omit<StudentDiscount, 'id' | 'fechaSolicitud' | 'estatus'> & { estatus?: DiscountStatus }) => StudentDiscount;
  updateStudentDiscount: (id: string, updates: Partial<StudentDiscount>) => void;
  deleteStudentDiscount: (id: string) => void;
  requestDeleteStudentDiscount: (id: string, motivo?: string) => void;
  cancelDeleteStudentDiscountRequest: (id: string) => void;
  approveStudentDiscount: (id: string) => void;
  rejectStudentDiscount: (id: string) => void;
  getEffectiveStudentPrice: (colegioId: string, studentId: string, basePrice: number, conceptoId?: string) => { finalPrice: number; discountAmount: number; appliedDiscounts: StudentDiscount[] };
  evaluationConcepts: EvaluationConceptItem[];
  evaluationSavedPeriods: EvaluationSavedPeriod[];
  studentEvaluations: StudentEvaluationEntry[];
  addEvaluationConcept: (data: Omit<EvaluationConceptItem, 'id'>) => EvaluationConceptItem;
  updateEvaluationConcept: (id: string, updates: Partial<EvaluationConceptItem>) => void;
  deleteEvaluationConcept: (id: string) => void;
  updateEvaluationConceptPercentages: (updates: Record<string, number>) => void;
  saveEvaluationPeriod: (params: {
    colegioId: string;
    cicloId?: string;
    docenteId?: string;
    docenteNombre?: string;
    periodicidad: EvaluationPeriodicity;
    periodoIndex: number;
    periodoNombre: string;
    modoSeleccionFecha?: 'mes_completo' | 'rango_fechas';
    fechaInicio?: string;
    fechaFin?: string;
    conceptos: EvaluationConceptItem[];
    id?: string;
  }) => EvaluationSavedPeriod;
  deleteEvaluationPeriod: (id: string) => void;
  saveStudentEvaluation: (entry: Omit<StudentEvaluationEntry, 'id' | 'actualizadoEn'> & { id?: string }) => StudentEvaluationEntry;
  setCollegeEvaluationPeriodicity: (collegeId: string, periodicidad: EvaluationPeriodicity) => void;
  customRoles: RoleDefinition[];
  allRolesConfig: Record<string, RoleDefinition>;
  addCustomRole: (params: {
    label: string;
    descripcion: string;
    badgeBg?: string;
    badgeText?: string;
    esGlobal?: boolean;
    modulosAsignados: string[];
  }) => RoleDefinition;
  updateCustomRole: (id: string, updates: Partial<RoleDefinition>, modulosAsignados?: string[]) => void;
  deleteCustomRole: (id: string) => void;
  addGrade: (data: Omit<GradeRecord, 'id'>) => void;
  updateGrade: (id: string, updates: Partial<GradeRecord>) => void;
  addIncident: (data: Omit<IncidentRecord, 'id'>) => void;
  updateIncident: (id: string, updates: Partial<IncidentRecord>) => void;
  addPsychologyRecord: (data: Omit<PsychologyRecord, 'id'>) => void;
  updatePsychologyRecord: (id: string, updates: Partial<PsychologyRecord>) => void;
  deletePsychologyRecord: (id: string) => void;
  pendingCanalizacionForExpediente: Notice | null;
  setPendingCanalizacionForExpediente: (notice: Notice | null) => void;
  addBook: (data: Omit<LibraryBook, 'id'>) => void;
  deleteBook: (id: string) => void;
  addNotice: (data: Omit<Notice, 'id'>) => void;
  updateNotice: (id: string, updates: Partial<Notice>) => void;
  addActivity: (data: Omit<TeacherActivity, 'id'>) => TeacherActivity;
  updateActivity: (id: string, updates: Partial<TeacherActivity>) => void;
  deleteActivity: (id: string) => void;
  addTaskOrExam: (data: Omit<TaskOrExam, 'id'>) => void;
  updateTaskOrExam: (id: string, updates: Partial<TaskOrExam>) => void;
  deleteTaskOrExam: (id: string) => void;
  submitTaskEvidence: (
    taskId: string,
    submission: Omit<TaskEvidenceSubmission, 'id' | 'fechaEntrega'>
  ) => void;
  submitStudentExam: (
    examId: string,
    submission: Omit<StudentExamSubmission, 'id' | 'fechaEntrega'>
  ) => StudentExamSubmission;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => AttendanceRecord;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  addPreenrollment: (data: {
    colegioId: string;
    colegioNombre: string;
    alumnoNombreCompleto: string;
    curp: string;
    fechaNacimiento: string;
    promedio: number;
    nivel: PreenrollmentRequest['nivel'];
    grado: string;
    escuelaProcedencia?: string;
    tutorNombre: string;
    tutorCorreo: string;
    tutorTelefono: string;
    archivosAdjuntos?: PreenrollmentAttachedFile[];
  }) => PreenrollmentRequest;
  acceptPreenrollment: (id: string) => { preenrollment: PreenrollmentRequest; student: Student; tutorUser: User } | null;
  rejectPreenrollment: (id: string, motivo: string) => void;
  confirmPreenrollmentPayment: (id: string, folioComprobante?: string) => void;
  assignStudentGroup: (preenrollmentId: string, grupo: string) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  isSuperuserSession: boolean;
  originalSuperuser: User | null;
  switchRoleAsSuperuser: (newRole: UserRole) => void;
  resetRoleToSuperuser: () => void;
  emailNotifications: EmailNotification[];
  sendEmailNotification: (params: SendNotificationParams) => EmailNotification;
  markNotificationAsRead: (id: string) => void;
  rolePermissions: RolePermissionsMap;
  collegeRolePermissions: CollegeRolePermissionsMap;
  getRolePermissionsForCollege: (collegeId: string | null) => RolePermissionsMap;
  updateRolePermissions: (newMap: RolePermissionsMap, collegeId?: string | null) => void;
  hasRolePermission: (rol: UserRole, moduleId: string, collegeId?: string | null) => boolean;
  supportAccessRequests: Record<string, SupportAccessRequest>;
  requestSupportCollegeAccess: (collegeId: string) => void;
  respondToSupportCollegeAccess: (
    collegeId: string,
    decision: 'accepted' | 'rejected'
  ) => void;
  clearSupportCollegeAccess: (collegeId: string) => void;
  deactivateCollegeSupportMode: (collegeId: string) => void;
  requestDemoRenewalContact: (collegeId: string) => void;
  activityLogs: ActivityLogEntry[];
  addActivityLog: (params: {
    modulo: string;
    accion: string;
    detalle: string;
    colegioId?: string | null;
    colegioNombre?: string;
    acceso?: string;
  }) => void;
  clearActivityLogs: (dateFilter?: string) => void;
  resetToDefaults: () => void;

  // Cafetería
  cafeteriaProducts: CafeteriaProduct[];
  cafeteriaOrders: CafeteriaOrder[];
  addCafeteriaProduct: (productData: Omit<CafeteriaProduct, 'id' | 'creadoEn'>) => Promise<CafeteriaProduct>;
  updateCafeteriaProduct: (id: string, updates: Partial<CafeteriaProduct>) => Promise<void>;
  deleteCafeteriaProduct: (id: string) => Promise<void>;
  toggleCafeteriaProductAvailability: (id: string) => Promise<void>;
  createCafeteriaOrder: (orderData: Omit<CafeteriaOrder, 'id' | 'folio' | 'fechaCreacion' | 'estado'>) => Promise<CafeteriaOrder>;
  updateCafeteriaOrderStatus: (id: string, estado: CafeteriaOrderStatus) => Promise<void>;
  deliverCafeteriaOrderWithQr: (params: {
    orderId: string;
    qrCodeRaw: string;
    candidateStudent?: Student;
    entregadoPor?: string;
  }) => Promise<{ success: boolean; validMatch: boolean; message: string; order?: CafeteriaOrder }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'my_college_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const SESSION_CRITICAL_KEYS = new Set([
    'current_user',
    'original_superuser',
    'selected_college_id',
  ]);

  // Load helper (prioritizes sessionStorage for active user session so quota limits never lose the logged-in user)
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      if (SESSION_CRITICAL_KEYS.has(key)) {
        const sessSaved = sessionStorage.getItem(LOCAL_STORAGE_PREFIX + key);
        if (sessSaved) {
          return JSON.parse(sessSaved);
        }
      }
      const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const saveState = (key: string, val: any) => {
    const payload =
      key === 'activity_logs' && Array.isArray(val) ? val.slice(0, 80) : val;
    const serialized = JSON.stringify(payload);

    if (SESSION_CRITICAL_KEYS.has(key)) {
      try {
        sessionStorage.setItem(LOCAL_STORAGE_PREFIX + key, serialized);
      } catch {
        if ((key === 'current_user' || key === 'original_superuser') && val && typeof val === 'object') {
          try {
            const slimUser = { ...val, avatar: val.avatar?.startsWith('data:') ? '' : val.avatar };
            sessionStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(slimUser));
          } catch {
            // ignore
          }
        }
      }
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serialized);
    } catch {
      try {
        // Free space from bulky cache keys so critical session state always saves
        localStorage.removeItem('my_college_notifications_v1');
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'activity_logs');
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'attendance');
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'grades');
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'student_evaluations');
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serialized);
      } catch {
        if ((key === 'current_user' || key === 'original_superuser') && val && typeof val === 'object') {
          try {
            const slimUser = { ...val, avatar: val.avatar?.startsWith('data:') ? '' : val.avatar };
            localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(slimUser));
          } catch {
            // ignore
          }
        }
      }
    }
  };

  const getDeletedUserIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'deleted_user_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  };

  const markUserIdAsDeleted = (id: string) => {
    try {
      const current = getDeletedUserIds();
      current.add(id);
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX + 'deleted_user_ids',
        JSON.stringify(Array.from(current))
      );
    } catch {
      // ignore
    }
  };

  const normalizeUserList = (
    list: User[],
    localReferenceList?: User[],
    persistToDb = false
  ): User[] => {
    const deletedIds = getDeletedUserIds();
    const initialMap = new Map(INITIAL_USERS.map((iu) => [iu.id, iu]));
    const localMap = new Map((localReferenceList || []).map((lu) => [lu.id, lu]));

    const filteredSource = (Array.isArray(list) ? list : INITIAL_USERS).filter(
      (u) => !deletedIds.has(u.id)
    );

    const normalized: User[] = filteredSource.map((u): User => {
      const seedUser = initialMap.get(u.id);
      const localUser = localMap.get(u.id);
      // Prefer existing valid username in DB, then local saved username, then seedUser, then deterministic first-time generation
      const fallbackRef =
        localUser && isValidGeneratedUsername(localUser.usuarioLogin)
          ? localUser
          : seedUser;

      const { usuarioLogin, password, wasUpdated } = ensureUserCredentials(u, fallbackRef);

      const isTrueSuperuser =
        seedUser?.rol === 'superusuario' ||
        u.id.startsWith('usr-super') ||
        u.rol === 'superusuario';

      const isGlobalRole =
        isTrueSuperuser ||
        u.rol === 'soporte' ||
        String(u.rol || '').toLowerCase().includes('soporte');
      const normalizedColegioId = isGlobalRole ? null : u.colegioId;
      const normalizedRole: UserRole = isTrueSuperuser
        ? 'superusuario'
        : String(u.rol || '').toLowerCase().includes('soporte')
        ? 'soporte'
        : u.rol;

      // Superusuario and Tutor always remain active; other roles preserve their active/inactive flag
      const resolvedActivo =
        normalizedRole === 'superusuario' || normalizedRole === 'tutor'
          ? true
          : typeof u.activo === 'boolean'
          ? u.activo
          : typeof localUser?.activo === 'boolean'
          ? localUser.activo
          : true;

      if (
        persistToDb &&
        (wasUpdated ||
          u.usuarioLogin !== usuarioLogin ||
          u.password !== password ||
          u.colegioId !== normalizedColegioId ||
          u.rol !== normalizedRole ||
          u.activo !== resolvedActivo)
      ) {
        apiClient.updateUser(u.id, {
          rol: normalizedRole,
          usuarioLogin,
          password,
          colegioId: normalizedColegioId,
          activo: resolvedActivo,
        });
      }

      const resolvedAvatar =
        !u.avatar || u.avatar.includes('images.unsplash.com')
          ? u.rol === 'alumno'
            ? getStudentAvatarFallback(u.nombre)
            : getUserAvatarFallback(u.nombre, normalizedRole)
          : u.avatar;

      return {
        ...u,
        avatar: resolvedAvatar,
        rol: normalizedRole,
        colegioId: normalizedColegioId,
        usuarioLogin,
        password,
        activo: resolvedActivo,
      };
    });

    // Ensure critical master superusers from INITIAL_USERS always exist even if localStorage had old cached users
    INITIAL_USERS.forEach((iu) => {
      if (iu.rol === 'superusuario' || iu.rol === 'soporte') {
        const existingIdx = normalized.findIndex(
          (u) =>
            u.id === iu.id ||
            (u.usuarioLogin && u.usuarioLogin.toLowerCase() === iu.usuarioLogin?.toLowerCase())
        );
        if (existingIdx === -1 && !deletedIds.has(iu.id)) {
          normalized.unshift(iu);
          if (persistToDb) {
            apiClient.createUser(iu);
          }
        }
      }
    });

    return normalized;
  };

  const [colleges, setColleges] = useState<College[]>(() =>
    loadState('colleges', INITIAL_COLLEGES)
  );
  const [users, setUsers] = useState<User[]>(() =>
    normalizeUserList(loadState('users', INITIAL_USERS))
  );
  const [students, setStudents] = useState<Student[]>(() => {
    const loaded = loadState('students', INITIAL_STUDENTS);
    return loaded.map((st) => {
      if (!st.foto || st.foto.includes('images.unsplash.com')) {
        return { ...st, foto: getStudentAvatarFallback(st.nombre, st.grado) };
      }
      return st;
    });
  });
  const isPhantomSubjectName = (name?: string | null): boolean => {
    const low = String(name || '').trim().toLowerCase();
    return (
      !low ||
      low === 'materia asignada' ||
      low === 'materia general' ||
      low === 'evaluación general' ||
      low === 'evaluacion general' ||
      low === 'por asignar' ||
      low === 'sin materia'
    );
  };

  const sanitizeTeacherList = (list: Teacher[]): Teacher[] =>
    (Array.isArray(list) ? list : INITIAL_TEACHERS).map((t) => ({
      ...t,
      materias: Array.isArray(t.materias)
        ? t.materias.filter((m) => !isPhantomSubjectName(m))
        : [],
    }));

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cleaned = sanitizeTeacherList(loadState('teachers', INITIAL_TEACHERS));
    saveState('teachers', cleaned);
    return cleaned;
  });
  const getDeletedSubjectIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'deleted_subject_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  };

  const markSubjectIdAsDeleted = (id: string) => {
    try {
      const current = getDeletedSubjectIds();
      current.add(id);
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX + 'deleted_subject_ids',
        JSON.stringify(Array.from(current))
      );
    } catch {
      // ignore
    }
  };

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const deletedSubIds = getDeletedSubjectIds();
    const loaded = loadState('subjects', INITIAL_SUBJECTS);
    const cleaned = (Array.isArray(loaded) ? loaded : INITIAL_SUBJECTS).filter(
      (s) =>
        !deletedSubIds.has(s.id) &&
        !isPhantomSubjectName(s.nombre) &&
        s.id !== 'sub-tch-tch-1791402280268-0'
    );
    saveState('subjects', cleaned);
    return cleaned;
  });
  const [collegeGroups, setCollegeGroups] = useState<CollegeGroup[]>(() =>
    loadState<CollegeGroup[]>('college_groups', [])
  );
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const loaded = loadState('grades', INITIAL_GRADES);
    const cleaned = (Array.isArray(loaded) ? loaded : INITIAL_GRADES).filter(
      (g) =>
        !isPhantomSubjectName(g.materiaNombre) &&
        g.materiaId !== 'sub-tch-tch-1791402280268-0'
    );
    saveState('grades', cleaned);
    return cleaned;
  });
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() =>
    loadState('incidents', INITIAL_INCIDENTS)
  );
  const [psychologyRecords, setPsychologyRecords] = useState<PsychologyRecord[]>(() =>
    loadState('psychology', INITIAL_PSYCHOLOGY)
  );
  const [pendingCanalizacionForExpediente, setPendingCanalizacionForExpediente] = useState<Notice | null>(null);
  const getDeletedBookIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'deleted_book_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  };

  const markBookIdAsDeleted = (id: string) => {
    try {
      const current = getDeletedBookIds();
      current.add(id);
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX + 'deleted_book_ids',
        JSON.stringify(Array.from(current))
      );
    } catch {
      // ignore
    }
  };

  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() => {
    const deletedIds = getDeletedBookIds();
    const loaded = loadState('library', INITIAL_LIBRARY);
    const cleaned = (Array.isArray(loaded) ? loaded : INITIAL_LIBRARY).filter(
      (b) => b && !deletedIds.has(b.id)
    );
    saveState('library', cleaned);
    return cleaned;
  });
  const [notices, setNotices] = useState<Notice[]>(() =>
    loadState('notices', INITIAL_NOTICES)
  );
  const [activities, setActivities] = useState<TeacherActivity[]>(() =>
    loadState('activities', INITIAL_ACTIVITIES)
  );
  const getDeletedTaskExamIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'deleted_task_exam_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  };

  const markTaskExamIdAsDeleted = (id: string) => {
    try {
      const current = getDeletedTaskExamIds();
      current.add(id);
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX + 'deleted_task_exam_ids',
        JSON.stringify(Array.from(current))
      );
    } catch {
      // ignore
    }
  };

  // Deduplicate tasks/exams that were created simultaneously for multiple groups into a single unified task card
  const deduplicateTasksExamsList = (list: TaskOrExam[], localRef?: TaskOrExam[]): TaskOrExam[] => {
    const deletedIds = getDeletedTaskExamIds();
    const localMap = new Map((localRef || []).map((item) => [item.id, item]));
    const bySignature = new Map<string, TaskOrExam>();

    (Array.isArray(list) ? list : []).forEach((rawItem, idx) => {
      if (!rawItem || deletedIds.has(rawItem.id)) return;
      const localMatch = localMap.get(rawItem.id);
      const mergedEvidences = [
        ...(rawItem.entregasEvidencias || []),
        ...(localMatch?.entregasEvidencias || []),
      ];
      const uniqueEvidencesMap = new Map<string, TaskEvidenceSubmission>();
      mergedEvidences.forEach((ev) => {
        if (ev && ev.estudianteId) {
          uniqueEvidencesMap.set(`${ev.estudianteId}_${ev.gradoGrupo}`, ev);
        }
      });

      const sig = `${rawItem.colegioId}__${rawItem.tipo}__${(rawItem.titulo || '').trim().toLowerCase()}__${(rawItem.materia || '').trim().toLowerCase()}__${(rawItem.docenteNombre || '').trim().toLowerCase()}__${rawItem.fechaLimite || ''}__${(rawItem.instrucciones || '').trim().toLowerCase()}`;
      const existing = bySignature.get(sig);

      const itemGroups = Array.from(
        new Set(
          [
            ...(Array.isArray(rawItem.gruposAsignados) ? rawItem.gruposAsignados : []),
            ...(rawItem.gradoGrupo ? rawItem.gradoGrupo.split(',').map((g) => g.trim()) : []),
          ].filter(Boolean)
        )
      );

      if (!existing) {
        const safeId =
          bySignature.size > 0 && Array.from(bySignature.values()).some((v) => v.id === rawItem.id)
            ? `${rawItem.id}-${idx}`
            : rawItem.id;
        bySignature.set(sig, {
          ...rawItem,
          id: safeId,
          gruposAsignados: itemGroups.length > 0 ? itemGroups : [rawItem.gradoGrupo],
          gradoGrupo: itemGroups.length > 0 ? itemGroups.join(', ') : rawItem.gradoGrupo,
          entregasEvidencias: Array.from(uniqueEvidencesMap.values()),
        });
      } else {
        const combinedGroups = Array.from(
          new Set([
            ...(existing.gruposAsignados || []),
            ...itemGroups,
          ].filter(Boolean))
        );
        const combinedEvMap = new Map<string, TaskEvidenceSubmission>();
        (existing.entregasEvidencias || []).forEach((ev) => {
          combinedEvMap.set(`${ev.estudianteId}_${ev.gradoGrupo}`, ev);
        });
        uniqueEvidencesMap.forEach((ev, k) => {
          combinedEvMap.set(k, ev);
        });

        bySignature.set(sig, {
          ...existing,
          gruposAsignados: combinedGroups,
          gradoGrupo: combinedGroups.join(', '),
          entregasEvidencias: Array.from(combinedEvMap.values()),
        });
      }
    });

    return Array.from(bySignature.values());
  };

  const [tasksExams, setTasksExams] = useState<TaskOrExam[]>(() =>
    deduplicateTasksExamsList(loadState('tasks_exams', INITIAL_TASKS_EXAMS))
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    loadState('attendance', INITIAL_ATTENDANCE)
  );
  const [preenrollments, setPreenrollments] = useState<PreenrollmentRequest[]>(() =>
    loadState('preenrollments', INITIAL_PREENROLLMENTS)
  );
  const [preenrollmentConfigs, setPreenrollmentConfigs] = useState<Record<string, PreenrollmentCollegeConfig>>(() =>
    loadState('preenrollment_configs', INITIAL_PREENROLLMENT_CONFIGS)
  );
  const [platformFeeConfig, setPlatformFeeConfig] = useState<PlatformFeeConfig>(() => {
    const saved = loadState<PlatformFeeConfig | null>('platform_fee_config', null);
    if (!saved) return DEFAULT_PLATFORM_FEE_CONFIG;
    return {
      ...DEFAULT_PLATFORM_FEE_CONFIG,
      ...saved,
      porcentajeComision: saved.porcentajeComision ?? 4.5,
      incluirMontoFijo: saved.incluirMontoFijo ?? true,
      montoFijoAdicional: saved.montoFijoAdicional ?? 5.0,
      comisionesPorColegio: saved.comisionesPorColegio || {},
      reglas: [],
    };
  });
  const [campuses, setCampuses] = useState<Campus[]>(() =>
    loadState('campuses', INITIAL_CAMPUSES)
  );
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(() =>
    loadState('selected_campus_id', null)
  );
  const [schoolCycles, setSchoolCycles] = useState<SchoolCycle[]>(() =>
    loadState('school_cycles', INITIAL_SCHOOL_CYCLES)
  );
  const [calendarDays, setCalendarDays] = useState<CalendarNonSchoolDay[]>(() =>
    loadState('calendar_days', INITIAL_CALENDAR_DAYS)
  );
  const [groupSchedules, setGroupSchedules] = useState<GroupWeekSchedule[]>(() =>
    loadState('group_schedules', INITIAL_GROUP_SCHEDULES)
  );
  const [scheduleDriveConfigs, setScheduleDriveConfigs] = useState<
    Record<string, CollegeScheduleDriveConfig>
  >(() => loadState('schedule_drive_configs', {}));
  const [drivePickupQueue, setDrivePickupQueue] = useState<DrivePickupEntry[]>(() =>
    loadState('drive_pickup_queue', [])
  );
  const [monthlyTuitions, setMonthlyTuitions] = useState<MonthlyTuitionRecord[]>(() =>
    loadState('monthly_tuitions', INITIAL_MONTHLY_TUITIONS)
  );
  const [billingConcepts, setBillingConcepts] = useState<BillingConcept[]>(() => {
    const saved = loadState<BillingConcept[]>('billing_concepts', INITIAL_BILLING_CONCEPTS);
    return (Array.isArray(saved) ? saved : INITIAL_BILLING_CONCEPTS).map((c) => ({
      ...c,
      nivelesPublicados: Array.isArray(c.nivelesPublicados)
        ? c.nivelesPublicados
        : Array.isArray(c.nivelesDestino)
        ? c.nivelesDestino
        : ['preescolar', 'primaria', 'secundaria', 'preparatoria'],
    }));
  });
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>(() => {
    const saved = loadState<StudentDiscount[] | null>('student_discounts', null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return INITIAL_STUDENT_DISCOUNTS;
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() =>
    loadState('activity_logs', INITIAL_ACTIVITY_LOGS)
  );
  const [evaluationConcepts, setEvaluationConcepts] = useState<EvaluationConceptItem[]>(() =>
    loadState('evaluation_concepts', INITIAL_EVALUATION_CONCEPTS)
  );
  const [evaluationSavedPeriods, setEvaluationSavedPeriods] = useState<EvaluationSavedPeriod[]>(() => {
    const saved = loadState<EvaluationSavedPeriod[] | null>('evaluation_saved_periods', null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [
      {
        id: 'eval-per-init-1',
        colegioId: 'col-cervantes',
        periodicidad: 'mensual',
        periodoIndex: 1,
        periodoNombre: 'Septiembre (Mes 1)',
        modoSeleccionFecha: 'mes_completo',
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30',
        conceptos: INITIAL_EVALUATION_CONCEPTS.filter((c) => c.colegioId === 'col-cervantes').map((c) => ({
          ...c,
          periodicidad: 'mensual',
          periodoIndex: 1,
          periodoNombre: 'Septiembre (Mes 1)',
        })),
        creadoEn: '2026-09-01',
        actualizadoEn: '2026-09-30',
      },
      {
        id: 'eval-per-init-2',
        colegioId: 'col-cervantes',
        periodicidad: 'mensual',
        periodoIndex: 2,
        periodoNombre: 'Octubre (Mes 2)',
        modoSeleccionFecha: 'mes_completo',
        fechaInicio: '2026-10-01',
        fechaFin: '2026-10-31',
        conceptos: INITIAL_EVALUATION_CONCEPTS.filter((c) => c.colegioId === 'col-cervantes').map((c) => ({
          ...c,
          periodicidad: 'mensual',
          periodoIndex: 2,
          periodoNombre: 'Octubre (Mes 2)',
        })),
        creadoEn: '2026-10-01',
        actualizadoEn: '2026-10-05',
      },
    ];
  });
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>(() =>
    loadState<RoleDefinition[]>('custom_roles', [])
  );
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluationEntry[]>(() => {
    const loaded = loadState('student_evaluations', INITIAL_STUDENT_EVALUATIONS);
    const cleaned = (Array.isArray(loaded) ? loaded : INITIAL_STUDENT_EVALUATIONS).filter(
      (e) =>
        e.materiaId !== 'sub-tch-tch-1791402280268-0' &&
        !String(e.id || '').includes('sub-tch-tch-1791402280268-0')
    );
    saveState('student_evaluations', cleaned);
    return cleaned;
  });

  const [cafeteriaProducts, setCafeteriaProducts] = useState<CafeteriaProduct[]>(() => {
    const loaded = loadState('cafeteria_products', INITIAL_CAFETERIA_PRODUCTS);
    return loaded.map((p) => {
      if (!p.imagen || p.imagen.includes('images.unsplash.com')) {
        return { ...p, imagen: getCafeteriaProductFallback(p.nombre, p.categoria) };
      }
      return p;
    });
  });
  const [cafeteriaOrders, setCafeteriaOrders] = useState<CafeteriaOrder[]>(() => {
    const loaded = loadState('cafeteria_orders', INITIAL_CAFETERIA_ORDERS);
    return loaded.map((ord) => ({
      ...ord,
      estudianteFoto:
        !ord.estudianteFoto || ord.estudianteFoto.includes('images.unsplash.com')
          ? getStudentAvatarFallback(ord.estudianteNombre, ord.estudianteGrado)
          : ord.estudianteFoto,
      items: (ord.items || []).map((it) => ({
        ...it,
        imagen:
          !it.imagen || it.imagen.includes('images.unsplash.com')
            ? getCafeteriaProductFallback(it.nombre)
            : it.imagen,
      })),
    }));
  });

  const updatePlatformFeeConfig = (updates: Partial<PlatformFeeConfig>) => {
    setPlatformFeeConfig((prev) => {
      const updated = { ...prev, ...updates };
      saveState('platform_fee_config', updated);
      return updated;
    });
  };

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const refreshDbStatus = async () => {
    try {
      const status = await apiClient.getStatus();
      if (status) {
        setDbStatus(status.database);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshDbStatus();
    apiClient.getBootstrapData().then((resp) => {
      if (resp && resp.source === 'mongodb' && resp.data) {
        if (resp.data.colleges?.length) {
          setColleges((prevLocal) => {
            const localMap = new Map(prevLocal.map((c) => [c.id, c]));
            const merged = resp.data.colleges.map((remoteCol: College) => {
              const localCol = localMap.get(remoteCol.id);
              const resolvedDiseno = remoteCol.disenoBoleta || localCol?.disenoBoleta;
              const resolvedPeriodicidad =
                remoteCol.periodicidadEvaluacion || localCol?.periodicidadEvaluacion;
              if (!remoteCol.disenoBoleta && localCol?.disenoBoleta) {
                apiClient.updateCollegeReportCardDesign(
                  remoteCol.id,
                  localCol.disenoBoleta,
                  resolvedPeriodicidad
                );
              }
              return {
                ...remoteCol,
                ...(localCol || {}),
                ...remoteCol,
                disenoBoleta: resolvedDiseno,
                periodicidadEvaluacion: resolvedPeriodicidad,
              };
            });
            saveState('colleges', merged);
            return merged;
          });
        }
        if (resp.data.users?.length) {
          setUsers((prevLocal) => {
            const mergedUsers = normalizeUserList(resp.data.users, prevLocal, false);
            saveState('users', mergedUsers);
            return mergedUsers;
          });
        }
        if (resp.data.students?.length) {
          setStudents((prevLocal) => {
            const localMap = new Map(prevLocal.map((s) => [s.id, s]));
            return resp.data.students.map((remoteSt: Student) => {
              const localSt = localMap.get(remoteSt.id);
              const { usuarioLogin, password, wasUpdated } = ensureStudentCredentials({
                id: remoteSt.id,
                nombre: remoteSt.nombre,
                apellidos: remoteSt.apellidos,
                matricula: remoteSt.matricula,
                usuarioLogin: remoteSt.usuarioLogin || localSt?.usuarioLogin,
                password: remoteSt.password || localSt?.password,
              });
              if (
                wasUpdated ||
                remoteSt.usuarioLogin !== usuarioLogin ||
                remoteSt.password !== password
              ) {
                apiClient.updateStudent(remoteSt.id, { usuarioLogin, password });
              }
              return {
                ...remoteSt,
                usuarioLogin,
                password,
                campusId: remoteSt.campusId || localSt?.campusId,
                cicloId: remoteSt.cicloId || localSt?.cicloId,
                docenteId: remoteSt.docenteId || localSt?.docenteId,
                docenteNombre: remoteSt.docenteNombre || localSt?.docenteNombre,
                materiasIds:
                  remoteSt.materiasIds && remoteSt.materiasIds.length > 0
                    ? remoteSt.materiasIds
                    : localSt?.materiasIds,
              };
            });
          });
        }
        if (resp.data.teachers?.length) {
          setTeachers((prevLocal) => {
            const localMap = new Map(prevLocal.map((t) => [t.id, t]));
            const merged = resp.data.teachers.map((remoteTch: Teacher) => {
              const localTch = localMap.get(remoteTch.id);
              const resolvedNivel = remoteTch.nivel || localTch?.nivel;
              const resolvedEsTutor =
                typeof remoteTch.esTutorPrincipal === 'boolean' &&
                (remoteTch.esTutorPrincipal || !localTch?.esTutorPrincipal)
                  ? remoteTch.esTutorPrincipal
                  : Boolean(localTch?.esTutorPrincipal);
              const resolvedGrupoTutorado =
                remoteTch.grupoTutorado ||
                (resolvedEsTutor ? localTch?.grupoTutorado : undefined);

              const cleanRemoteMaterias = Array.isArray(remoteTch.materias)
                ? remoteTch.materias.filter((m: string) => !isPhantomSubjectName(m))
                : [];
              const cleanLocalMaterias = Array.isArray(localTch?.materias)
                ? localTch!.materias.filter((m: string) => !isPhantomSubjectName(m))
                : [];
              const resolvedMaterias =
                cleanRemoteMaterias.length > 0 ? cleanRemoteMaterias : cleanLocalMaterias;

              if (
                localTch &&
                ((localTch.esTutorPrincipal && !remoteTch.esTutorPrincipal) ||
                  (localTch.grupoTutorado && !remoteTch.grupoTutorado) ||
                  (localTch.nivel && !remoteTch.nivel))
              ) {
                apiClient.updateTeacher(remoteTch.id, {
                  nivel: resolvedNivel,
                  esTutorPrincipal: resolvedEsTutor,
                  grupoTutorado: resolvedGrupoTutorado || '',
                  grupos:
                    localTch.grupos && localTch.grupos.length > 0
                      ? localTch.grupos
                      : remoteTch.grupos,
                  materias: resolvedMaterias,
                });
              }

              return {
                ...remoteTch,
                materias: resolvedMaterias,
                campusId: remoteTch.campusId || localTch?.campusId,
                nivel: resolvedNivel,
                esTutorPrincipal: resolvedEsTutor,
                grupoTutorado: resolvedGrupoTutorado || undefined,
              };
            });
            saveState('teachers', merged);
            return merged;
          });
        }
        if (Array.isArray(resp.data.subjects)) {
          const deletedSubIds = getDeletedSubjectIds();
          const filteredRemoteSubjects = resp.data.subjects.filter(
            (s: Subject) =>
              !deletedSubIds.has(s.id) &&
              !isPhantomSubjectName(s.nombre) &&
              s.id !== 'sub-tch-tch-1791402280268-0'
          );
          setSubjects((prevLocal) => {
            // Conservar materias creadas localmente que aún no estén en remoto, excluyendo las eliminadas
            const remoteIds = new Set(filteredRemoteSubjects.map((s: Subject) => s.id));
            const localOnly = prevLocal.filter(
              (s) =>
                !remoteIds.has(s.id) &&
                !deletedSubIds.has(s.id) &&
                !s.id.startsWith('sub-') &&
                !isPhantomSubjectName(s.nombre)
            );
            const merged = [...filteredRemoteSubjects, ...localOnly];
            saveState('subjects', merged);
            return merged;
          });
        }
        if (Array.isArray(resp.data.grades)) {
          const deletedSubIds = getDeletedSubjectIds();
          const remotePeriods: EvaluationSavedPeriod[] = Array.isArray(
            resp.data.evaluationSavedPeriods
          )
            ? resp.data.evaluationSavedPeriods
            : [];
          const remoteEvals: StudentEvaluationEntry[] = Array.isArray(
            resp.data.studentEvaluations
          )
            ? resp.data.studentEvaluations
            : [];
          const collegesWithSavedPeriods = new Set(
            remotePeriods.map((p) => p.colegioId)
          );

          // Limpiar en cada GradeRecord cualquier calificación en un periodo que NO exista en evaluationSavedPeriods
          const sanitizedGrades: GradeRecord[] = [];
          const gradesToDeleteInDb: string[] = [];
          const gradesToUpdateInDb: Array<{ id: string; updates: Partial<GradeRecord> }> = [];

          resp.data.grades.forEach((g: GradeRecord) => {
            if (
              !g ||
              deletedSubIds.has(g.materiaId) ||
              isPhantomSubjectName(g.materiaNombre) ||
              g.materiaId === 'sub-tch-tch-1791402280268-0' ||
              !collegesWithSavedPeriods.has(g.colegioId)
            ) {
              if (g?.id) gradesToDeleteInDb.push(g.id);
              return;
            }

            const collegePeriods = remotePeriods.filter((p) => p.colegioId === g.colegioId);
            const collegeHasAnyRealEval = remoteEvals.some(
              (ev) =>
                ev.colegioId === g.colegioId &&
                Number(ev.calificacionFinalPeriodo) > 0 &&
                collegePeriods.some(
                  (p) =>
                    p.periodicidad === ev.periodicidad &&
                    Number(p.periodoIndex) === Number(ev.periodoIndex)
                )
            );
            if (!collegeHasAnyRealEval) {
              if (g?.id) gradesToDeleteInDb.push(g.id);
              return;
            }
            const rawModMap = g.periodosPorModalidad || {};
            const cleanedModMap: Record<string, number[]> = {};
            let wasModified = false;

            Object.entries(rawModMap).forEach(([modKey, arr]) => {
              if (!Array.isArray(arr)) return;
              const validIndicesForMod = new Set(
                collegePeriods
                  .filter((p) => p.periodicidad === modKey)
                  .map((p) => Number(p.periodoIndex))
              );
              const cleanedArr = arr.map((val, idx) => {
                const pIdx = idx + 1;
                if (!validIndicesForMod.has(pIdx)) {
                  if (Number(val) > 0) wasModified = true;
                  return 0;
                }
                // Verificar que exista evaluación real guardada en Mis Bitácoras en ese periodo
                const hasEvalInPeriod = remoteEvals.some(
                  (ev) =>
                    ev.colegioId === g.colegioId &&
                    ev.periodicidad === modKey &&
                    Number(ev.periodoIndex) === pIdx &&
                    Number(ev.calificacionFinalPeriodo) > 0
                );
                if (!hasEvalInPeriod) {
                  if (Number(val) > 0) wasModified = true;
                  return 0;
                }
                return Number(val) || 0;
              });
              if (cleanedArr.some((v) => v > 0)) {
                cleanedModMap[modKey] = cleanedArr;
              } else if (arr.some((v) => Number(v) > 0)) {
                wasModified = true;
              }
            });

            const allNonZero = Object.values(cleanedModMap)
              .flat()
              .filter((v) => v > 0);

            if (allNonZero.length === 0) {
              gradesToDeleteInDb.push(g.id);
              return;
            }

            const newAvg = Number(
              (allNonZero.reduce((a, b) => a + b, 0) / allNonZero.length).toFixed(1)
            );
            const cleanedGrade: GradeRecord = {
              ...g,
              promedioFinal: newAvg,
              periodosPorModalidad: cleanedModMap as GradeRecord['periodosPorModalidad'],
            };
            sanitizedGrades.push(cleanedGrade);

            if (wasModified || g.promedioFinal !== newAvg) {
              gradesToUpdateInDb.push({
                id: g.id,
                updates: {
                  promedioFinal: newAvg,
                  periodosPorModalidad: cleanedModMap as GradeRecord['periodosPorModalidad'],
                },
              });
            }
          });

          setGrades(sanitizedGrades);
          saveState('grades', sanitizedGrades);

          // Sincronizar limpieza de calificaciones fantasma/huérfanas en la base de datos
          gradesToDeleteInDb.forEach((gid) => {
            apiClient.deleteGrade(gid);
          });
          gradesToUpdateInDb.forEach((item) => {
            apiClient.updateGrade(item.id, item.updates);
          });
        }
        if (Array.isArray(resp.data.incidents)) setIncidents(resp.data.incidents);
        if (Array.isArray(resp.data.psychologyRecords)) setPsychologyRecords(resp.data.psychologyRecords);
        if (Array.isArray(resp.data.libraryBooks)) {
          const deletedBookIds = getDeletedBookIds();
          const validBooks = resp.data.libraryBooks.filter(
            (b: LibraryBook) => b && !deletedBookIds.has(b.id)
          );
          setLibraryBooks(validBooks);
          saveState('library', validBooks);
          // Asegurar que cualquier libro marcado como eliminado también se borre de BD si seguía ahí
          resp.data.libraryBooks.forEach((b: LibraryBook) => {
            if (b && deletedBookIds.has(b.id)) {
              apiClient.deleteLibraryBook(b.id);
            }
          });
        }
        if (Array.isArray(resp.data.notices)) setNotices(resp.data.notices);
        if (Array.isArray(resp.data.activities)) setActivities(resp.data.activities);
        if (Array.isArray(resp.data.tasksExams)) {
          setTasksExams((prevLocal) => {
            const cleaned = deduplicateTasksExamsList(resp.data.tasksExams, prevLocal);
            saveState('tasks_exams', cleaned);
            return cleaned;
          });
        }
        if (Array.isArray(resp.data.attendance)) setAttendanceRecords(resp.data.attendance);
        if (resp.data.preenrollmentConfigs && Object.keys(resp.data.preenrollmentConfigs).length) {
          setPreenrollmentConfigs(resp.data.preenrollmentConfigs);
        }
        if (Array.isArray(resp.data.preenrollments)) {
          setPreenrollments(resp.data.preenrollments);
        }
        if (Array.isArray(resp.data.campuses)) setCampuses(resp.data.campuses);
        if (Array.isArray(resp.data.schoolCycles)) setSchoolCycles(resp.data.schoolCycles);
        if (Array.isArray(resp.data.calendarDays)) setCalendarDays(resp.data.calendarDays);
        if (Array.isArray(resp.data.groupSchedules)) setGroupSchedules(resp.data.groupSchedules);
        if (Array.isArray(resp.data.monthlyTuitions)) setMonthlyTuitions(resp.data.monthlyTuitions);
        if (Array.isArray(resp.data.billingConcepts)) {
          setBillingConcepts((prevLocal) => {
            const localMap = new Map(prevLocal.map((item) => [item.id, item]));
            const merged = resp.data.billingConcepts.map((remote: BillingConcept) => {
              const local = localMap.get(remote.id);
              if (!local) return remote;
              const resolvedProgramado =
                typeof remote.programadoParaFuturo === 'boolean' &&
                (remote.programadoParaFuturo || !local.programadoParaFuturo)
                  ? remote.programadoParaFuturo
                  : Boolean(local.programadoParaFuturo);
              const resolvedFechaProg =
                remote.fechaProgramadaPublicacion || local.fechaProgramadaPublicacion;
              const resolvedHoraProg =
                remote.horaProgramadaPublicacion || local.horaProgramadaPublicacion;
              const resolvedLlevaImagen =
                typeof remote.llevaImagen === 'boolean' &&
                (remote.llevaImagen || !local.llevaImagen)
                  ? remote.llevaImagen
                  : Boolean(local.llevaImagen);
              const resolvedImagenUrl = remote.imagenUrl || local.imagenUrl;

              if (
                (resolvedProgramado &&
                  (!remote.programadoParaFuturo || !remote.fechaProgramadaPublicacion)) ||
                (resolvedLlevaImagen && !remote.imagenUrl && resolvedImagenUrl)
              ) {
                apiClient.updateBillingConcept(remote.id, {
                  programadoParaFuturo: resolvedProgramado,
                  fechaProgramadaPublicacion: resolvedFechaProg,
                  horaProgramadaPublicacion: resolvedHoraProg,
                  llevaImagen: resolvedLlevaImagen,
                  imagenUrl: resolvedImagenUrl,
                });
              }

              return {
                ...remote,
                programadoParaFuturo: resolvedProgramado,
                fechaProgramadaPublicacion: resolvedFechaProg,
                horaProgramadaPublicacion: resolvedHoraProg,
                llevaImagen: resolvedLlevaImagen,
                imagenUrl: resolvedImagenUrl,
              };
            });
            saveState('billing_concepts', merged);
            return merged;
          });
        }
        if (Array.isArray(resp.data.studentDiscounts)) {
          setStudentDiscounts((prevLocal) => {
            const localMap = new Map(prevLocal.map((item) => [item.id, item]));
            const remoteMap = new Map((resp.data.studentDiscounts as StudentDiscount[]).map((r) => [r.id, r]));
            const merged = (resp.data.studentDiscounts as StudentDiscount[]).map((remote: StudentDiscount) => {
              const local = localMap.get(remote.id);
              if (!local) return remote;
              return {
                ...remote,
                ...local,
                estatus: remote.estatus || local.estatus,
                autorizadoPorNombre: remote.autorizadoPorNombre || local.autorizadoPorNombre,
                fechaResolucion: remote.fechaResolucion || local.fechaResolucion,
              };
            });
            prevLocal.forEach((local) => {
              if (!remoteMap.has(local.id)) {
                merged.push(local);
              }
            });
            saveState('student_discounts', merged);
            return merged;
          });
        }
        if (Array.isArray(resp.data.evaluationConcepts)) setEvaluationConcepts(resp.data.evaluationConcepts);
        if (Array.isArray(resp.data.evaluationSavedPeriods)) {
          setEvaluationSavedPeriods(resp.data.evaluationSavedPeriods);
          saveState('evaluation_saved_periods', resp.data.evaluationSavedPeriods);
        }
        if (Array.isArray(resp.data.studentEvaluations)) {
          const remotePeriods: EvaluationSavedPeriod[] = Array.isArray(
            resp.data.evaluationSavedPeriods
          )
            ? resp.data.evaluationSavedPeriods
            : [];
          const cleanedEvals = resp.data.studentEvaluations.filter(
            (e: StudentEvaluationEntry) => {
              if (
                !e ||
                e.materiaId === 'sub-tch-tch-1791402280268-0' ||
                String(e.id || '').includes('sub-tch-tch-1791402280268-0')
              ) {
                return false;
              }
              return remotePeriods.some(
                (p) =>
                  p.colegioId === e.colegioId &&
                  p.periodicidad === e.periodicidad &&
                  Number(p.periodoIndex) === Number(e.periodoIndex)
              );
            }
          );
          setStudentEvaluations(cleanedEvals);
          saveState('student_evaluations', cleanedEvals);
        }
        if (resp.data.activityLogs?.length) {
          setActivityLogs(resp.data.activityLogs);
        }
        if (Array.isArray(resp.data.cafeteriaProducts) && resp.data.cafeteriaProducts.length) {
          setCafeteriaProducts(resp.data.cafeteriaProducts);
          saveState('cafeteria_products', resp.data.cafeteriaProducts);
        }
        if (Array.isArray(resp.data.cafeteriaOrders) && resp.data.cafeteriaOrders.length) {
          setCafeteriaOrders(resp.data.cafeteriaOrders);
          saveState('cafeteria_orders', resp.data.cafeteriaOrders);
        }
      }
    });
  }, []);

  // Active current logged-in user: default is Superadmin!
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const savedUser = loadState<User | null>('current_user', null);
    if (savedUser && savedUser.id) {
      const matched =
        users.find((u) => u.id === savedUser.id) ||
        INITIAL_USERS.find((u) => u.id === savedUser.id);
      const baseUser = matched ? { ...matched, ...savedUser } : savedUser;
      const isSuperuserAccount =
        savedUser.id.startsWith('usr-super') ||
        matched?.rol === 'superusuario' ||
        savedUser.correo === 'superadmin@mycollege.edu' ||
        savedUser.correo === 'mariana.villarreal@mycollege.edu';
      const effectiveRole: UserRole = isSuperuserAccount ? 'superusuario' : baseUser.rol;
      return {
        ...baseUser,
        rol: effectiveRole,
        cargo:
          effectiveRole === 'superusuario'
            ? matched?.cargo || 'Superadministrador Maestro de Plataforma'
            : baseUser.cargo,
        colegioId:
          effectiveRole === 'superusuario' || effectiveRole === 'soporte'
            ? null
            : baseUser.colegioId,
      };
    }
    return users.find((u) => u.rol === 'superusuario') || INITIAL_USERS[0];
  });

  const setCurrentUser: React.Dispatch<React.SetStateAction<User>> = (value) => {
    setCurrentUserState((prev) => {
      const next = typeof value === 'function' ? (value as (p: User) => User)(prev) : value;
      saveState('current_user', next);
      if (next.rol === 'superusuario') {
        saveState('original_superuser', next);
      }
      return next;
    });
  };

  // Track original superuser ONLY when the logged-in user is the superusuario account
  const [originalSuperuser, setOriginalSuperuser] = useState<User | null>(() => {
    const savedUser = loadState<User | null>('current_user', null);
    if (savedUser && savedUser.rol === 'superusuario') {
      return savedUser;
    }
    const savedOriginal = loadState<User | null>('original_superuser', null);
    if (savedUser && savedOriginal && savedUser.id === savedOriginal.id) {
      return savedOriginal;
    }
    if (!savedUser) {
      return INITIAL_USERS.find((u) => u.rol === 'superusuario') || INITIAL_USERS[0];
    }
    return null;
  });

  // Selected College ID in global navigation dropdown: null means "Panel General"
  // Persisted in localStorage so refreshing as Superusuario stays inside the selected college
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(() => {
    const savedColId = loadState<string | null>('selected_college_id', null);
    const savedUser = loadState<User | null>('current_user', null);
    if (savedUser?.rol === 'soporte') {
      const savedReqs = loadState<Record<string, SupportAccessRequest>>(
        'support_access_requests',
        {}
      );
      if (savedColId && savedReqs?.[savedColId]?.status !== 'accepted') {
        return null;
      }
    }
    return savedColId;
  });

  const normalizeRolePermissionsMap = (rawMap: RolePermissionsMap, isInitialMigration = false): RolePermissionsMap => {
    const allRegistryIds = SYSTEM_MODULES_REGISTRY.map((m) => m.id);
    const rawSuperOrder = Array.isArray(rawMap?.superusuario) ? rawMap.superusuario : [];
    const orderedSuperIds = [
      ...rawSuperOrder.filter((id) => allRegistryIds.includes(id)),
      ...allRegistryIds.filter((id) => !rawSuperOrder.includes(id)),
    ];

    const forbiddenForSoporte = ['perfiles', 'planes_modulos', 'comisiones_plataforma'];
    const allowedForSoporteAll = allRegistryIds.filter(
      (id) => !forbiddenForSoporte.includes(id)
    );
    const rawSoporteOrder = Array.isArray(rawMap?.soporte)
      ? rawMap.soporte
      : DEFAULT_ROLE_PERMISSIONS.soporte;
    const orderedSoporteIds = rawSoporteOrder.filter((id) =>
      allowedForSoporteAll.includes(id)
    );

    const merged: RolePermissionsMap = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...rawMap,
      superusuario: orderedSuperIds,
      soporte: orderedSoporteIds,
    };

    if (isInitialMigration) {
      (['administrador', 'directivo', 'coordinador', 'supervisor'] as UserRole[]).forEach((r) => {
        const list = Array.isArray(merged[r]) ? merged[r] : DEFAULT_ROLE_PERMISSIONS[r];
        if (!list.includes('cobros')) {
          merged[r] = [...list, 'cobros'];
        }
        if (!merged[r].includes('evaluaciones')) {
          merged[r] = [...merged[r], 'evaluaciones'];
        }
      });

      if (Array.isArray(merged.docente) && !merged.docente.includes('evaluaciones')) {
        merged.docente = [...merged.docente, 'evaluaciones'];
      }
    }

    // Remove summary modules that belong to other profiles so each profile only ever has its own summary module if enabled
    (['administrador', 'control_escolar', 'supervisor', 'prefecto'] as UserRole[]).forEach((r) => {
      const list = (Array.isArray(merged[r]) ? merged[r] : DEFAULT_ROLE_PERMISSIONS[r]).filter(
        (m) =>
          m !== 'resumen_escolar' &&
          m !== 'resumen_psicologico' &&
          m !== 'resumen_docentes'
      );
      merged[r] = isInitialMigration && !list.includes('colegio_resumen')
        ? ['colegio_resumen', ...list]
        : list;
    });

    (['directivo', 'coordinador'] as UserRole[]).forEach((r) => {
      const rawList = Array.isArray(merged[r]) ? merged[r] : DEFAULT_ROLE_PERMISSIONS[r];
      const list = rawList.filter(
        (m) =>
          m !== 'colegio_resumen' &&
          m !== 'resumen_psicologico' &&
          m !== 'resumen_docentes'
      );
      merged[r] = isInitialMigration && !list.includes('resumen_escolar')
        ? ['resumen_escolar', ...list]
        : list;
    });

    {
      const rawList = Array.isArray(merged.psicologo)
        ? merged.psicologo
        : DEFAULT_ROLE_PERMISSIONS.psicologo;
      let list = rawList.filter(
        (m) =>
          m !== 'colegio_resumen' &&
          m !== 'resumen_escolar' &&
          m !== 'resumen_docentes'
      );
      if (!list.includes('psicologia')) {
        list = [...list, 'psicologia'];
      }
      if (!list.includes('expedientes')) {
        list = [...list, 'expedientes'];
      }
      merged.psicologo = isInitialMigration && !list.includes('resumen_psicologico')
        ? ['resumen_psicologico', ...list]
        : list;
    }

    {
      const rawList = Array.isArray(merged.docente)
        ? merged.docente
        : DEFAULT_ROLE_PERMISSIONS.docente;
      const list = rawList.filter(
        (m) =>
          m !== 'colegio_resumen' &&
          m !== 'resumen_escolar' &&
          m !== 'resumen_psicologico' &&
          m !== 'estudiantes' &&
          m !== 'control_escolar' &&
          m !== 'materias'
      );
      merged.docente = isInitialMigration && !list.includes('resumen_docentes')
        ? ['resumen_docentes', ...list]
        : list;
    }

    // Ensure tutor has mis_comunicados and mi_cafeteria
    if (Array.isArray(merged.tutor)) {
      if (!merged.tutor.includes('mis_comunicados')) {
        merged.tutor = ['tutor_cuotas', 'mis_comunicados', ...merged.tutor.filter((id) => id !== 'tutor_cuotas' && id !== 'mis_comunicados')];
      }
      if (!merged.tutor.includes('mi_cafeteria') && !merged.tutor.includes('cafeteria')) {
        merged.tutor = ['tutor_cuotas', 'mi_cafeteria', ...merged.tutor.filter((id) => id !== 'tutor_cuotas' && id !== 'mi_cafeteria' && id !== 'cafeteria')];
      }
    }

    // Ensure "mi_perfil" is ALWAYS at the very end for all profiles whenever present
    Object.keys(merged).forEach((roleKey) => {
      const r = roleKey as UserRole;
      if (Array.isArray(merged[r]) && merged[r].includes('mi_perfil')) {
        merged[r] = [
          ...merged[r].filter((id) => id !== 'mi_perfil'),
          'mi_perfil',
        ];
      }
    });

    return merged;
  };

  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const saved = loadState<RolePermissionsMap | null>('role_permissions', null);
    return normalizeRolePermissionsMap(saved || DEFAULT_ROLE_PERMISSIONS, !saved);
  });

  const [collegeRolePermissions, setCollegeRolePermissions] = useState<CollegeRolePermissionsMap>(() => {
    const rawColPerms = loadState<CollegeRolePermissionsMap>('college_role_permissions', {});
    const normalized: CollegeRolePermissionsMap = {};
    Object.keys(rawColPerms || {}).forEach((colId) => {
      normalized[colId] = normalizeRolePermissionsMap(rawColPerms[colId], false);
    });
    return normalized;
  });

  const getRolePermissionsForCollege = (collegeId: string | null): RolePermissionsMap => {
    if (!collegeId) {
      return normalizeRolePermissionsMap(rolePermissions, false);
    }

    const colMap = collegeRolePermissions[collegeId];
    if (!colMap) {
      return normalizeRolePermissionsMap(rolePermissions, false);
    }

    // Intersect college permissions with global rolePermissions so any module disabled in Global Mode is also disabled in all colleges
    const intersected: RolePermissionsMap = { ...colMap };
    Object.keys(rolePermissions).forEach((roleKey) => {
      const r = roleKey as UserRole;
      if (r === 'superusuario') {
        const superOrder = Array.isArray(colMap.superusuario) && colMap.superusuario.length > 0
          ? colMap.superusuario
          : Array.isArray(rolePermissions.superusuario) && rolePermissions.superusuario.length > 0
          ? rolePermissions.superusuario
          : SYSTEM_MODULES_REGISTRY.map((m) => m.id);
        intersected[r] = superOrder;
        return;
      }
      if (r === 'soporte') {
        const forbiddenForSoporte = ['perfiles', 'planes_modulos', 'comisiones_plataforma'];
        const globalSoporte = Array.isArray(rolePermissions.soporte)
          ? rolePermissions.soporte.filter((id) => !forbiddenForSoporte.includes(id))
          : DEFAULT_ROLE_PERMISSIONS.soporte;
        const colSoporte = Array.isArray(colMap.soporte)
          ? colMap.soporte.filter((id) => !forbiddenForSoporte.includes(id))
          : globalSoporte;
        intersected[r] = colSoporte.filter((modId) => globalSoporte.includes(modId));
        return;
      }
      const globalAllowed = Array.isArray(rolePermissions[r])
        ? rolePermissions[r]
        : DEFAULT_ROLE_PERMISSIONS[r] || [];
      const collegeAllowed = Array.isArray(colMap[r]) ? colMap[r] : globalAllowed;
      intersected[r] = collegeAllowed.filter((modId) => globalAllowed.includes(modId));
    });

    return normalizeRolePermissionsMap(intersected, false);
  };

  const updateRolePermissions = (newMap: RolePermissionsMap, collegeId?: string | null) => {
    const sanitized: RolePermissionsMap = normalizeRolePermissionsMap(
      {
        ...newMap,
        superusuario:
          Array.isArray(newMap.superusuario) && newMap.superusuario.length > 0
            ? newMap.superusuario
            : SYSTEM_MODULES_REGISTRY.map((m) => m.id),
      },
      false
    );
    const colObj = collegeId ? colleges.find((c) => c.id === collegeId) : null;
    if (collegeId) {
      setCollegeRolePermissions((prev) => {
        const updated = {
          ...prev,
          [collegeId]: sanitized,
        };
        saveState('college_role_permissions', updated);
        return updated;
      });
    } else {
      // Updating in Global Mode: apply to global rolePermissions AND synchronize across ALL colleges!
      setRolePermissions(sanitized);
      saveState('role_permissions', sanitized);

      setCollegeRolePermissions((prev) => {
        const updated: CollegeRolePermissionsMap = {};
        const allColIds = Array.from(
          new Set([...colleges.map((c) => c.id), ...Object.keys(prev || {})])
        );
        allColIds.forEach((colId) => {
          updated[colId] = { ...sanitized };
        });
        saveState('college_role_permissions', updated);
        return updated;
      });
    }
    addActivityLog({
      modulo: 'Permisos',
      accion: 'Actualización de Permisos de Perfil',
      detalle: collegeId
        ? `Guardó y actualizó los permisos de módulos por perfil para el colegio "${colObj?.nombre || collegeId}".`
        : 'Guardó y aplicó los permisos globales de módulos por perfil en todos los colegios.',
      colegioId: collegeId || null,
      colegioNombre: colObj?.nombre || 'Panel General (Todos los Colegios)',
    });
  };

  const hasRolePermission = (rol: UserRole, moduleId: string, collegeId?: string | null): boolean => {
    const normalizeId =
      moduleId === 'personalizacion'
        ? 'personalizar'
        : moduleId === 'control_escolar'
        ? 'estudiantes'
        : moduleId;

    const effectiveCollegeId =
      collegeId !== undefined
        ? collegeId
        : rol === 'superusuario' || rol === 'soporte'
        ? selectedCollegeId
        : selectedCollegeId || currentUser?.colegioId || null;

    if (rol === 'soporte') {
      // Soporte never has access to Perfiles, Planes y Facturación, or Comisiones de Plataforma
      if (
        normalizeId === 'perfiles' ||
        normalizeId === 'planes_modulos' ||
        normalizeId === 'comisiones_plataforma'
      ) {
        return false;
      }

      // 1. Check Global Permissions for soporte first: if disabled in Global Mode for soporte, it is disabled everywhere
      const globalSoporteAllowed = rolePermissions?.soporte;
      if (Array.isArray(globalSoporteAllowed) && !globalSoporteAllowed.includes(normalizeId)) {
        return false;
      }

      // 2. If inside a college, check college-specific permissions for soporte
      if (effectiveCollegeId && collegeRolePermissions[effectiveCollegeId]) {
        const colMap = collegeRolePermissions[effectiveCollegeId];
        const colSoporteAllowed = colMap?.soporte;
        if (Array.isArray(colSoporteAllowed) && !colSoporteAllowed.includes(normalizeId)) {
          return false;
        }
      }

      if (!effectiveCollegeId) {
        return Array.isArray(globalSoporteAllowed)
          ? globalSoporteAllowed.includes(normalizeId)
          : DEFAULT_ROLE_PERMISSIONS.soporte.includes(normalizeId);
      }

      return true;
    }

    if (rol === 'superusuario') {
      // In Global Panel (no college selected), superusuario always has access to all global modules
      if (!effectiveCollegeId) return true;

      // Inside a college, if a module was disabled for ALL profiles in Global Mode or in this college, hide it in the college sidebar too
      const nonSuperRoles = Object.keys(rolePermissions || {}).filter(
        (r) => r !== 'superusuario' && r !== 'soporte'
      ) as UserRole[];
      const enabledInGlobal = nonSuperRoles.some((r) =>
        (rolePermissions[r] || []).includes(normalizeId)
      );
      if (!enabledInGlobal) return false;

      if (collegeRolePermissions[effectiveCollegeId]) {
        const colMap = collegeRolePermissions[effectiveCollegeId];
        const enabledInCol = nonSuperRoles.some((r) =>
          (colMap[r] || []).includes(normalizeId)
        );
        if (!enabledInCol) return false;
      }
      return true;
    }

    // Enforce strict role separation for the 4 summary modules (cannot be accessed by a different profile)
    const rolLower = String(rol).toLowerCase();
    const isAdminOrControlEscolar =
      rol === 'administrador' ||
      rol === 'supervisor' ||
      rol === 'prefecto' ||
      rolLower.includes('control_escolar') ||
      rolLower.includes('control escolar');

    if (normalizeId === 'colegio_resumen' && !isAdminOrControlEscolar) {
      return false;
    }
    if (normalizeId === 'resumen_escolar' && rol !== 'directivo' && rol !== 'coordinador') {
      return false;
    }
    if (normalizeId === 'resumen_psicologico' && rol !== 'psicologo') {
      return false;
    }
    if (normalizeId === 'resumen_docentes' && rol !== 'docente') {
      return false;
    }
    if (
      rol === 'docente' &&
      (normalizeId === 'estudiantes' ||
        normalizeId === 'control_escolar' ||
        normalizeId === 'materias')
    ) {
      return false;
    }

    // 1. Check Global Permissions first: if disabled in Global Mode, it is disabled in ALL colleges!
    const globalAllowed = rolePermissions?.[rol];
    if (Array.isArray(globalAllowed)) {
      if (rol === 'tutor' && (normalizeId === 'mis_comunicados' || normalizeId === 'comunicados')) {
        if (!globalAllowed.includes('mis_comunicados') && !globalAllowed.includes('comunicados')) {
          return false;
        }
      } else if (rol === 'tutor' && (normalizeId === 'mi_cafeteria' || normalizeId === 'cafeteria')) {
        if (!globalAllowed.includes('mi_cafeteria') && !globalAllowed.includes('cafeteria')) {
          return false;
        }
      } else if (!globalAllowed.includes(normalizeId)) {
        return false;
      }
    }

    // 2. Check college-specific permissions if inside a college
    const permsMap =
      effectiveCollegeId && collegeRolePermissions[effectiveCollegeId]
        ? collegeRolePermissions[effectiveCollegeId]
        : rolePermissions;

    const allowed = permsMap?.[rol];
    if (!Array.isArray(allowed)) {
      if (rol === 'tutor' && (normalizeId === 'mis_comunicados' || normalizeId === 'comunicados')) {
        return (
          DEFAULT_ROLE_PERMISSIONS.tutor?.includes('mis_comunicados') ||
          DEFAULT_ROLE_PERMISSIONS.tutor?.includes('comunicados') ||
          false
        );
      }
      if (rol === 'tutor' && (normalizeId === 'mi_cafeteria' || normalizeId === 'cafeteria')) {
        return (
          DEFAULT_ROLE_PERMISSIONS.tutor?.includes('mi_cafeteria') ||
          DEFAULT_ROLE_PERMISSIONS.tutor?.includes('cafeteria') ||
          false
        );
      }
      return DEFAULT_ROLE_PERMISSIONS[rol]?.includes(normalizeId) ?? false;
    }
    if (rol === 'tutor' && (normalizeId === 'mis_comunicados' || normalizeId === 'comunicados')) {
      return allowed.includes('mis_comunicados') || allowed.includes('comunicados');
    }
    if (rol === 'tutor' && (normalizeId === 'mi_cafeteria' || normalizeId === 'cafeteria')) {
      return allowed.includes('mi_cafeteria') || allowed.includes('cafeteria');
    }
    return allowed.includes(normalizeId);
  };

  // Sync to local storage
  useEffect(() => {
    saveState('selected_college_id', selectedCollegeId);
  }, [selectedCollegeId]);
  useEffect(() => {
    saveState('colleges', colleges);
  }, [colleges]);
  useEffect(() => {
    saveState('users', users);
  }, [users]);
  useEffect(() => {
    saveState('students', students);
  }, [students]);
  useEffect(() => {
    saveState('teachers', teachers);
  }, [teachers]);
  useEffect(() => {
    saveState('subjects', subjects);
  }, [subjects]);
  useEffect(() => {
    saveState('grades', grades);
  }, [grades]);
  useEffect(() => {
    saveState('incidents', incidents);
  }, [incidents]);
  useEffect(() => {
    saveState('psychology', psychologyRecords);
  }, [psychologyRecords]);
  useEffect(() => {
    saveState('library', libraryBooks);
  }, [libraryBooks]);
  useEffect(() => {
    saveState('notices', notices);
  }, [notices]);
  useEffect(() => {
    saveState('activities', activities);
  }, [activities]);
  useEffect(() => {
    saveState('tasks_exams', tasksExams);
  }, [tasksExams]);
  useEffect(() => {
    saveState('attendance', attendanceRecords);
  }, [attendanceRecords]);
  useEffect(() => {
    saveState('preenrollments', preenrollments);
  }, [preenrollments]);
  useEffect(() => {
    saveState('preenrollment_configs', preenrollmentConfigs);
  }, [preenrollmentConfigs]);
  useEffect(() => {
    saveState('campuses', campuses);
  }, [campuses]);
  useEffect(() => {
    saveState('selected_campus_id', selectedCampusId);
  }, [selectedCampusId]);
  useEffect(() => {
    saveState('school_cycles', schoolCycles);
  }, [schoolCycles]);
  useEffect(() => {
    saveState('calendar_days', calendarDays);
  }, [calendarDays]);
  useEffect(() => {
    saveState('group_schedules', groupSchedules);
  }, [groupSchedules]);
  useEffect(() => {
    saveState('schedule_drive_configs', scheduleDriveConfigs);
  }, [scheduleDriveConfigs]);
  useEffect(() => {
    saveState('drive_pickup_queue', drivePickupQueue);
  }, [drivePickupQueue]);
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_PREFIX + 'drive_pickup_queue' && e.newValue) {
        try {
          setDrivePickupQueue(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === LOCAL_STORAGE_PREFIX + 'schedule_drive_configs' && e.newValue) {
        try {
          setScheduleDriveConfigs(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === LOCAL_STORAGE_PREFIX + 'group_schedules' && e.newValue) {
        try {
          setGroupSchedules(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);
  useEffect(() => {
    saveState('evaluation_concepts', evaluationConcepts);
  }, [evaluationConcepts]);
  useEffect(() => {
    saveState('evaluation_saved_periods', evaluationSavedPeriods);
    const collegesWithPeriods = new Set(
      (evaluationSavedPeriods || []).map((p) => p.colegioId)
    );
    setGrades((prev) => {
      const hasOrphans = prev.some((g) => !collegesWithPeriods.has(g.colegioId));
      if (!hasOrphans) return prev;
      const next = prev.filter((g) => collegesWithPeriods.has(g.colegioId));
      saveState('grades', next);
      return next;
    });
    setStudentEvaluations((prev) => {
      const hasOrphans = prev.some((e) => !collegesWithPeriods.has(e.colegioId));
      if (!hasOrphans) return prev;
      const next = prev.filter((e) => collegesWithPeriods.has(e.colegioId));
      saveState('student_evaluations', next);
      return next;
    });
  }, [evaluationSavedPeriods]);
  useEffect(() => {
    saveState('custom_roles', customRoles);
  }, [customRoles]);
  useEffect(() => {
    saveState('student_evaluations', studentEvaluations);
  }, [studentEvaluations]);
  useEffect(() => {
    saveState('monthly_tuitions', monthlyTuitions);
  }, [monthlyTuitions]);
  useEffect(() => {
    saveState('billing_concepts', billingConcepts);
  }, [billingConcepts]);
  useEffect(() => {
    saveState('activity_logs', activityLogs);
  }, [activityLogs]);
  useEffect(() => {
    saveState('current_user', currentUser);
  }, [currentUser]);
  useEffect(() => {
    saveState('original_superuser', originalSuperuser);
  }, [originalSuperuser]);

  // Keep original superuser updated if current user is superusuario, or clear if logged in as a different user account
  useEffect(() => {
    if (currentUser.rol === 'superusuario') {
      setOriginalSuperuser(currentUser);
    } else if (originalSuperuser && currentUser.id !== originalSuperuser.id) {
      setOriginalSuperuser(null);
    }
  }, [currentUser]);

  // Email notifications dispatched by notifications@mycollege.com.mx
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>(() => {
    return loadStoredNotifications();
  });

  const sendEmailNotification = (params: SendNotificationParams): EmailNotification => {
    const created = dispatchSystemEmailNotification(params);
    setEmailNotifications((prev) => [created, ...prev]);
    return created;
  };

  const markNotificationAsRead = (id: string) => {
    setEmailNotifications((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== id) return n;
        const currentReadBy = Array.isArray(n.leidoPorIds) ? n.leidoPorIds : [];
        const nextReadBy =
          currentUser?.id && !currentReadBy.includes(currentUser.id)
            ? [...currentReadBy, currentUser.id]
            : currentReadBy;
        return { ...n, leido: true, leidoPorIds: nextReadBy };
      });
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const isSuperuserSession =
    currentUser.rol === 'superusuario' ||
    (originalSuperuser !== null && currentUser.id === originalSuperuser.id);

  const activeCollege = selectedCollegeId
    ? colleges.find((c) => c.id === selectedCollegeId) || null
    : null;

  const addActivityLog = (params: {
    modulo: string;
    accion: string;
    detalle: string;
    colegioId?: string | null;
    colegioNombre?: string;
    acceso?: string;
  }) => {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0];
    const targetColId =
      params.colegioId !== undefined
        ? params.colegioId
        : activeCollege?.id || currentUser?.colegioId || null;
    const targetColObj = targetColId ? colleges.find((c) => c.id === targetColId) : null;
    const accesoLabel =
      params.acceso ||
      (targetColObj
        ? targetColObj.nombre
        : currentUser?.rol === 'superusuario'
        ? 'Panel General Multi-Colegio'
        : 'Portal Escolar');

    const newEntry: ActivityLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fecha,
      hora,
      usuarioId: currentUser?.id || 'sistema',
      usuarioNombre: currentUser?.nombre || 'Usuario del Sistema',
      usuarioCorreo: currentUser?.correo || 'sistema@mycollege.edu.mx',
      usuarioRol: currentUser?.rol || 'superusuario',
      acceso: accesoLabel,
      modulo: params.modulo,
      accion: params.accion,
      detalle: params.detalle,
      colegioId: targetColId,
      colegioNombre: params.colegioNombre || targetColObj?.nombre || 'Panel General',
      timestamp: Date.now(),
    };

    setActivityLogs((prev) => [newEntry, ...(Array.isArray(prev) ? prev : [])]);
    apiClient.createActivityLog(newEntry);
  };

  const clearActivityLogs = (dateFilter?: string) => {
    if (currentUser?.rol !== 'superusuario') return;
    if (dateFilter && dateFilter !== 'todas') {
      setActivityLogs((prev) => prev.filter((l) => l.fecha !== dateFilter));
    } else {
      setActivityLogs([]);
    }
  };

  // Support College Access Requests (for 'soporte' role requiring College Admin authorization)
  const [supportAccessRequests, setSupportAccessRequests] = useState<
    Record<string, SupportAccessRequest>
  >(() => loadState<Record<string, SupportAccessRequest>>('support_access_requests', {}));

  useEffect(() => {
    saveState('support_access_requests', supportAccessRequests);
  }, [supportAccessRequests]);

  // Listen to cross-tab storage events and poll backend API so Support <-> Admin pop-push works in real time
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_PREFIX + 'support_access_requests' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setSupportAccessRequests(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);

    const pollInterval = setInterval(async () => {
      const remote = await apiClient.getSupportAccessRequests();
      if (remote && typeof remote === 'object') {
        setSupportAccessRequests((prev) => {
          const merged: Record<string, SupportAccessRequest> = { ...prev };
          let changed = false;
          Object.keys(remote).forEach((colId) => {
            const rItem = remote[colId];
            const lItem = prev[colId];
            if (!lItem || (rItem?.updatedAt || 0) > (lItem?.updatedAt || 0)) {
              merged[colId] = rItem;
              changed = true;
            }
          });
          // Also check if a request was deleted on server
          Object.keys(prev).forEach((colId) => {
            if (!remote[colId] && Date.now() - (prev[colId]?.updatedAt || 0) > 3000) {
              delete merged[colId];
              changed = true;
            }
          });
          if (changed) {
            saveState('support_access_requests', merged);
            return merged;
          }
          return prev;
        });
      }
    }, 3500);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      clearInterval(pollInterval);
    };
  }, []);

  // Sincronización automática: los alumnos, docentes y usuarios que no tengan una fotografía propia toman el escudo actualizado de su colegio
  useEffect(() => {
    const shieldByColId = new Map<string, string>();
    colleges.forEach((c) => {
      if (c.escudoUrl) {
        shieldByColId.set(c.id, c.escudoUrl);
      }
    });
    if (shieldByColId.size === 0) return;

    setStudents((prev) => {
      let changed = false;
      const next = prev.map((st) => {
        const shield = shieldByColId.get(st.colegioId);
        if (shield && st.foto !== shield && isGenericOrShieldImage(st.foto)) {
          changed = true;
          return { ...st, foto: shield };
        }
        return st;
      });
      if (changed) saveState('students', next);
      return changed ? next : prev;
    });

    setTeachers((prev) => {
      let changed = false;
      const next = prev.map((tch) => {
        const shield = shieldByColId.get(tch.colegioId);
        if (shield && tch.foto !== shield && isGenericOrShieldImage(tch.foto)) {
          changed = true;
          return { ...tch, foto: shield };
        }
        return tch;
      });
      if (changed) saveState('teachers', next);
      return changed ? next : prev;
    });

    setUsers((prev) => {
      let changed = false;
      const next = prev.map((u) => {
        const shield = u.colegioId ? shieldByColId.get(u.colegioId) : undefined;
        if (shield && u.avatar !== shield && isGenericOrShieldImage(u.avatar)) {
          changed = true;
          return { ...u, avatar: shield };
        }
        return u;
      });
      if (changed) saveState('users', next);
      return changed ? next : prev;
    });

    if (currentUser.colegioId) {
      const shield = shieldByColId.get(currentUser.colegioId);
      if (shield && currentUser.avatar !== shield && isGenericOrShieldImage(currentUser.avatar)) {
        setCurrentUser((prev) => ({ ...prev, avatar: shield }));
      }
    }
  }, [colleges]);

  const requestSupportCollegeAccess = (collegeId: string) => {
    const col = colleges.find((c) => c.id === collegeId);
    const now = Date.now();
    const newReq: SupportAccessRequest = {
      id: `sup-req-${collegeId}-${now}`,
      colegioId: collegeId,
      colegioNombre: col?.nombre || 'Colegio',
      supportUserId: currentUser.id,
      supportUserName: currentUser.nombre,
      supportUserEmail: currentUser.correo,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    setSupportAccessRequests((prev) => {
      const next = { ...prev, [collegeId]: newReq };
      saveState('support_access_requests', next);
      return next;
    });
    apiClient.createSupportAccessRequest(newReq);
    addActivityLog({
      modulo: 'Acceso de Soporte a Colegio',
      accion: 'Solicitud de Permiso de Ingreso',
      detalle: `El usuario de Soporte "${currentUser.nombre}" solicitó permiso al Administrador para ingresar al colegio "${col?.nombre || collegeId}".`,
      colegioId: collegeId,
      colegioNombre: col?.nombre || collegeId,
    });
  };

  const respondToSupportCollegeAccess = (
    collegeId: string,
    decision: 'accepted' | 'rejected'
  ) => {
    const col = colleges.find((c) => c.id === collegeId);
    const now = Date.now();
    setSupportAccessRequests((prev) => {
      const existing = prev[collegeId];
      if (!existing) return prev;
      const updated: SupportAccessRequest = {
        ...existing,
        status: decision,
        updatedAt: now,
      };
      const next = { ...prev, [collegeId]: updated };
      saveState('support_access_requests', next);
      return next;
    });
    apiClient.respondSupportAccessRequest(collegeId, decision);
    addActivityLog({
      modulo: 'Acceso de Soporte a Colegio',
      accion:
        decision === 'accepted'
          ? 'Autorización de Acceso a Soporte'
          : 'Denegación de Acceso a Soporte',
      detalle: `El Administrador "${currentUser.nombre}" ${
        decision === 'accepted' ? 'ACEPTÓ' : 'RECHAZÓ'
      } la solicitud de acceso de Soporte al colegio "${col?.nombre || collegeId}".`,
      colegioId: collegeId,
      colegioNombre: col?.nombre || collegeId,
    });
  };

  const clearSupportCollegeAccess = (collegeId: string) => {
    setSupportAccessRequests((prev) => {
      const next = { ...prev };
      delete next[collegeId];
      saveState('support_access_requests', next);
      return next;
    });
    apiClient.clearSupportAccessRequest(collegeId);
  };

  const switchRoleAsSuperuser = (newRole: UserRole) => {
    const base =
      originalSuperuser ||
      (currentUser.rol === 'superusuario'
        ? currentUser
        : INITIAL_USERS.find((u) => u.rol === 'superusuario') || INITIAL_USERS[0]);

    if (!originalSuperuser) {
      setOriginalSuperuser(base);
    }

    if (newRole === 'superusuario') {
      setCurrentUser({
        ...base,
        rol: 'superusuario',
        cargo: base.cargo || 'Superadministrador Maestro de Plataforma',
        colegioId: null,
      });
      return;
    }

    if (newRole === 'soporte') {
      setSelectedCollegeId(null);
      setCurrentUser({
        ...base,
        rol: 'soporte',
        cargo: 'Especialista de Soporte Técnico Global',
        colegioId: null,
      });
      return;
    }

    const roleCargoMap: Record<UserRole, string> = {
      superusuario: base.cargo || 'Superadministrador Maestro de Plataforma',
      soporte: 'Especialista de Soporte Técnico Global',
      administrador: 'Administrador Institucional (Modo Superusuario)',
      control_escolar: 'Control Escolar Institucional (Modo Superusuario)',
      directivo: 'Director General Escolar (Modo Superusuario)',
      coordinador: 'Coordinador Académico (Modo Superusuario)',
      supervisor: 'Supervisor Escolar (Modo Superusuario)',
      prefecto: 'Prefecto y Control Escolar (Modo Superusuario)',
      psicologo: 'Psicólogo Escolar y Orientación (Modo Superusuario)',
      docente: 'Docente Titular (Modo Superusuario)',
      tutor: 'Tutor / Padre de Familia (Modo Superusuario)',
      alumno: 'Alumno / Estudiante (Modo Superusuario)',
    };

    const targetCollegeId = selectedCollegeId || activeCollege?.id || 'col-cervantes';

    // Retain strictly the superuser's identity (name, photo/avatar, email)
    setCurrentUser({
      ...base,
      id: base.id,
      nombre: base.nombre,
      avatar: base.avatar,
      correo: base.correo,
      telefono: base.telefono,
      rol: newRole,
      cargo: roleCargoMap[newRole] || `Rol ${newRole} (Superusuario)`,
      colegioId: targetCollegeId,
      hijosIds: newRole === 'tutor' && (!base.hijosIds || base.hijosIds.length === 0) ? ['std-1'] : base.hijosIds,
      estudianteId: newRole === 'alumno' ? 'std-1' : base.estudianteId,
      metodoAcceso: base.metodoAcceso || 'preinscripcion',
    });
  };

  const resetRoleToSuperuser = () => {
    const base =
      originalSuperuser ||
      (currentUser.rol === 'superusuario'
        ? currentUser
        : INITIAL_USERS.find((u) => u.rol === 'superusuario') || INITIAL_USERS[0]);

    setCurrentUser({
      ...base,
      rol: 'superusuario',
      cargo: base.cargo || 'Superadministrador Maestro de Plataforma',
      colegioId: null,
    });
  };

  // If user changes and they belong strictly to a single college, automatically select that college
  useEffect(() => {
    if (
      currentUser.rol !== 'superusuario' &&
      currentUser.rol !== 'soporte' &&
      currentUser.colegioId
    ) {
      setSelectedCollegeId(currentUser.colegioId);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeCollege) {
      document.documentElement.style.setProperty("--college-primary", activeCollege.colores.primario);
      document.documentElement.style.setProperty("--college-secondary", activeCollege.colores.secundario);
    } else {
      document.documentElement.style.setProperty("--college-primary", "#0B2545");
      document.documentElement.style.setProperty("--college-secondary", "#DFB743");
    }
  }, [activeCollege?.id, activeCollege?.colores?.primario, activeCollege?.colores?.secundario]);

  // Add College: CRITICAL REQUIREMENT: "cuando se cree un nuevo colegio se debe de agregar un administrador para poder acceder a ese colegio"
  // 1.- Cuando se agregue un colegio, te dé un usuario compuesto por la primer inicial de su nombre+apellido+4 dígitos aleatorios, y se envíen sus credenciales por correo
  // 2.- Cuando se registre un colegio nuevo, todos los apartados deben de estar sin información
  // 3.- Cuando se agrega un colegio si no se sube un escudo, no aparezca la imagen
  const addCollege = (
    collegeData: Partial<College>,
    adminUserData: {
      nombre: string;
      correo: string;
      usuarioLogin?: string;
      password?: string;
      telefono?: string;
    }
  ) => {
    const collegeId = 'col-' + Date.now();
    const adminUserId = 'usr-admin-' + Date.now();

    const primaryCol = collegeData.colores?.primario || '#0B2545';
    const goldCol = collegeData.colores?.secundario || '#C59B27';

    // Requirement #3: If no shield image was uploaded, escudoUrl remains empty ('') so no image appears
    const uploadedShield = collegeData.escudoUrl ? collegeData.escudoUrl.trim() : '';

    // Requirement #1: Generate username once (first initial of name + surname + 4 random digits) and save it permanently in DB
    const adminGeneratedUsername =
      adminUserData.usuarioLogin?.trim() && isValidGeneratedUsername(adminUserData.usuarioLogin)
        ? adminUserData.usuarioLogin.trim()
        : generateTutorUsername(adminUserData.nombre);
    const rawAdminPass = adminUserData.password?.trim() || '';
    const adminPassword =
      rawAdminPass && rawAdminPass !== 'admin123' && rawAdminPass.length === 8
        ? rawAdminPass
        : generateRandomPassword();

    const createdDateObj = new Date();
    const createdDateStr = createdDateObj.toISOString().split('T')[0];
    const operacionType: College['operacion'] = collegeData.operacion || 'plan';

    let calculatedExpiration = collegeData.fechaExpiracionDemo || '';
    if (operacionType === 'demo' && !calculatedExpiration) {
      const expDate = new Date(createdDateObj);
      expDate.setMonth(expDate.getMonth() + 1);
      calculatedExpiration = expDate.toISOString().split('T')[0];
    }

    const initialModoSoporte = Boolean(collegeData.modoSoporteActivo);

    const newCollege: College = {
      id: collegeId,
      nombre: collegeData.nombre || 'Nuevo Colegio Registrado',
      codigoCCT: collegeData.codigoCCT?.trim() || '',
      lema: collegeData.lema?.trim() || '',
      nivel: collegeData.nivel || 'Primaria',
      niveles: collegeData.niveles || (collegeData.nivel ? [collegeData.nivel] : ['Primaria']),
      escudoUrl: uploadedShield,
      colores: {
        primario: primaryCol,
        secundario: goldCol,
        textoCabecera: '#FFFFFF',
      },
      modulosHabilitados: collegeData.modulosHabilitados || [
        'control_escolar',
        'estudiantes',
        'docentes',
        'materias',
        'calificaciones',
        'asistencias',
        'usuarios',
        'comunicados',
        'tareas',
        'examenes',
        'actividades_docentes',
        'incidencias',
        'biblioteca',
        'ciclo_escolar',
        'calendario',
        'horarios',
        'campus',
      ],
      estadoPago: collegeData.estadoPago || 'al_corriente',
      plan: collegeData.plan || 'Estándar',
      operacion: operacionType,
      fechaExpiracionDemo: operacionType === 'demo' ? calculatedExpiration : '',
      modoSoporteActivo: initialModoSoporte,
      modoSoporteDesactivadoPermanentemente: !initialModoSoporte,
      solicitudReanudacionDemoEnviada: false,
      montoMensual:
        operacionType === 'demo'
          ? 0
          : collegeData.montoMensual && collegeData.montoMensual > 0
          ? collegeData.montoMensual
          : (() => {
              try {
                const raw = localStorage.getItem('my_college_v1_plan_cost_config');
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (typeof parsed?.costoMensual === 'number') return parsed.costoMensual;
                }
              } catch {
                // ignore
              }
              return 6500;
            })(),
      fechaProximoPago: collegeData.fechaProximoPago || '',
      telefono: collegeData.telefono?.trim() || adminUserData.telefono?.trim() || '',
      correo: collegeData.correo?.trim() || adminUserData.correo.trim(),
      direccion: collegeData.direccion?.trim() || '',
      director: collegeData.director?.trim() || adminUserData.nombre.trim(),
      adminUserId: adminUserId,
      alumnosTotales: 0,
      docentesTotales: 0,
      activo: true,
      creadoEn: createdDateStr,
      modoPrueba: Boolean(collegeData.modoPrueba),
    };

    const newAdminUser: User = {
      id: adminUserId,
      nombre: adminUserData.nombre,
      correo: adminUserData.correo,
      usuarioLogin: adminGeneratedUsername,
      password: adminPassword,
      rol: 'administrador',
      colegioId: collegeId,
      cargo: 'Administrador Institucional de Plantel',
      avatar: '',
      telefono: adminUserData.telefono || '',
      activo: true,
      creadoEn: new Date().toISOString().split('T')[0],
      ultimoAcceso: 'Sin accesos previos',
    };

    const emptyPreenrollmentConfig: PreenrollmentCollegeConfig = {
      colegioId: collegeId,
      nivelesDisponibles: [],
      documentosRequeridos: [],
      mostrarCuotasEstimadas: false,
      cuotasPorNivel: {
        preescolar: [],
        primaria: [],
        secundaria: [],
        preparatoria: [],
      },
      pedirEscuelaProcedencia: false,
      pedirPromedio: false,
      pedirFechaNacimiento: false,
      instruccionesPersonalizadas: '',
      correoNotificacionesAdmisiones: '',
    };

    setColleges((prev) => [newCollege, ...prev]);
    setUsers((prev) => [...prev, newAdminUser]);
    setPreenrollmentConfigs((prev) => ({
      ...prev,
      [collegeId]: emptyPreenrollmentConfig,
    }));

    apiClient.createCollege(newCollege);
    apiClient.createUser(newAdminUser);
    apiClient.updatePreenrollmentConfig(collegeId, emptyPreenrollmentConfig);

    // Send official email notification with credentials strictly to the administrator user involved
    sendEmailNotification({
      colegioId: collegeId,
      colegioNombre: newCollege.nombre,
      destinatarios: [adminUserData.correo],
      rolesDestino: ['administrador'],
      usuariosDestino: [adminUserId, adminUserData.correo, adminGeneratedUsername],
      asunto: `[My College] Alta de Institución y Credenciales de Acceso (${newCollege.nombre})`,
      cuerpo:
        `Estimado(a) ${newAdminUser.nombre}:\n\n` +
        `Le damos la más cordial bienvenida. Se ha registrado exitosamente la institución "${newCollege.nombre}"${newCollege.codigoCCT ? ` (${newCollege.codigoCCT})` : ''} en la plataforma oficial My College.\n\n` +
        `=== CREDENCIALES OFICIALES DE ACCESO (ADMINISTRADOR) ===\n` +
        `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Institución: ${newCollege.nombre}\n` +
        `• Perfil Asignado: Administrador Institucional\n` +
        `• Usuario Generado: ${adminGeneratedUsername}\n` +
        `• Correo Registrado: ${newAdminUser.correo}\n` +
        `• Contraseña Temporal (8 caracteres): ${adminPassword}\n\n` +
        `=== INSTRUCCIONES DE INGRESO ===\n` +
        `1. Ingrese al enlace oficial: https://dashboard.mycollege.com.mx\n` +
        `2. Capture únicamente su Usuario (${adminGeneratedUsername}) junto con su contraseña (el correo electrónico es exclusivo para recibir notificaciones y recuperación de contraseña).\n\n` +
        `Recordatorio importante de seguridad: Una vez que ingrese a la plataforma, vaya al apartado de "Mi Perfil" y cambie su contraseña por una personalizada.`,
      categoria: 'seguridad',
      prioridad: 'alta',
    });

    addActivityLog({
      modulo: 'Colegios',
      accion: 'Alta de Colegio y Envío de Credenciales',
      detalle: `Dio de alta el colegio "${newCollege.nombre}"${newCollege.codigoCCT ? ` (${newCollege.codigoCCT})` : ''}, generó el usuario "${adminGeneratedUsername}" para el administrador ${newAdminUser.nombre} y envió sus credenciales al correo ${newAdminUser.correo}.`,
      colegioNombre: newCollege.nombre,
    });

    return { college: newCollege, adminUser: newAdminUser };
  };

  const updateCollege = (id: string, updates: Partial<College>) => {
    const col = colleges.find((c) => c.id === id);
    const safeUpdates: Partial<College> = { ...updates };

    // Regla estricta Modo Soporte: Solo se puede activar al dar de alta un colegio y solo una vez.
    // Cuando lo desactivas ya no se puede volver a activar y se necesita la autorización del administrador.
    if (col) {
      if (col.modoSoporteDesactivadoPermanentemente || !col.modoSoporteActivo) {
        safeUpdates.modoSoporteActivo = false;
        safeUpdates.modoSoporteDesactivadoPermanentemente = true;
      } else if ('modoSoporteActivo' in safeUpdates && safeUpdates.modoSoporteActivo === false) {
        safeUpdates.modoSoporteActivo = false;
        safeUpdates.modoSoporteDesactivadoPermanentemente = true;
      }
    }

    // Si cambia operacion a 'demo' y no tenía fecha de expiración, calcular 1 mes a partir de creadoEn
    if (safeUpdates.operacion === 'demo' && !safeUpdates.fechaExpiracionDemo && !col?.fechaExpiracionDemo) {
      const baseDate = col?.creadoEn ? new Date(col.creadoEn + 'T00:00:00') : new Date();
      const exp = new Date(isNaN(baseDate.getTime()) ? Date.now() : baseDate.getTime());
      exp.setMonth(exp.getMonth() + 1);
      safeUpdates.fechaExpiracionDemo = exp.toISOString().split('T')[0];
    } else if (safeUpdates.operacion === 'plan') {
      safeUpdates.fechaExpiracionDemo = '';
      safeUpdates.solicitudReanudacionDemoEnviada = false;
      if (safeUpdates.montoMensual === undefined && (!col?.montoMensual || col.montoMensual <= 0)) {
        try {
          const raw = localStorage.getItem('my_college_v1_plan_cost_config');
          const parsed = raw ? JSON.parse(raw) : null;
          safeUpdates.montoMensual = typeof parsed?.costoMensual === 'number' ? parsed.costoMensual : 6500;
        } catch {
          safeUpdates.montoMensual = 6500;
        }
      }
    }
    if (safeUpdates.operacion === 'demo' && safeUpdates.montoMensual === undefined) {
      safeUpdates.montoMensual = 0;
    }

    setColleges((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...safeUpdates } : c));
      saveState('colleges', next);
      return next;
    });
    apiClient.updateCollege(id, safeUpdates);
    addActivityLog({
      modulo: 'Colegios',
      accion: 'Actualización de Colegio',
      detalle: `Actualizó la información institucional del colegio "${col?.nombre || id}".`,
      colegioId: id,
      colegioNombre: col?.nombre,
    });
  };

  // Desactivar Modo Soporte (acción única e irreversible: una vez desactivado ya no se puede volver a activar)
  const deactivateCollegeSupportMode = (collegeId: string) => {
    const col = colleges.find((c) => c.id === collegeId);
    const updates: Partial<College> = {
      modoSoporteActivo: false,
      modoSoporteDesactivadoPermanentemente: true,
    };
    setColleges((prev) => {
      const next = prev.map((c) => (c.id === collegeId ? { ...c, ...updates } : c));
      saveState('colleges', next);
      return next;
    });
    apiClient.updateCollege(collegeId, updates);
    addActivityLog({
      modulo: 'Colegios / Modo Soporte',
      accion: 'Desactivación Definitiva de Modo Soporte',
      detalle: `Desactivó de forma permanente el Modo Soporte del colegio "${col?.nombre || collegeId}". A partir de ahora se requiere autorización del Administrador para ingresar.`,
      colegioId: collegeId,
      colegioNombre: col?.nombre || collegeId,
    });
  };

  // Notificación cuando finaliza el mes de Demo y el Administrador da clic en "Contactar"
  const requestDemoRenewalContact = (collegeId: string) => {
    const col = colleges.find((c) => c.id === collegeId);
    if (!col) return;

    const adminUser =
      users.find((u) => u.id === col.adminUserId) ||
      users.find((u) => u.colegioId === col.id && u.rol === 'administrador') ||
      currentUser;

    // Obtener todos los usuarios de Soporte y Superusuario para notificarles en plataforma, correo y WhatsApp
    const supportAndSuperUsers = users.filter(
      (u) =>
        u.rol === 'superusuario' ||
        u.rol === 'soporte' ||
        String(u.rol || '').toLowerCase().includes('soporte')
    );

    const targetEmails = Array.from(
      new Set([
        ...supportAndSuperUsers.map((u) => u.correo).filter(Boolean),
        'superadmin@mycollege.edu',
        'soporte@mycollege.edu.mx',
      ])
    );

    const targetUsersTokens = Array.from(
      new Set([
        ...supportAndSuperUsers.map((u) => u.id).filter(Boolean),
        ...supportAndSuperUsers.map((u) => u.correo).filter(Boolean),
        ...supportAndSuperUsers.map((u) => u.usuarioLogin || '').filter(Boolean),
      ])
    );

    const whatsappPhone = col.telefono || adminUser?.telefono || 'Sin teléfono registrado';

    // Enviar aviso/notificación oficial por Correo, WhatsApp y Plataforma a Soporte y Superadmin
    sendEmailNotification({
      colegioId: 'global',
      colegioNombre: col.nombre,
      destinatarios: targetEmails,
      rolesDestino: ['superusuario', 'soporte'],
      usuariosDestino: targetUsersTokens,
      asunto: `[Aviso Urgente · Correo, WhatsApp y Plataforma] Solicitud para Reanudar Inscripción / Adquirir Servicio - ${col.nombre}`,
      cuerpo:
        `AVISO MULTICANAL (CORREO ELECTRÓNICO · WHATSAPP · PLATAFORMA MY COLLEGE)\n\n` +
        `La demostración de 1 mes del colegio "${col.nombre}" (${col.codigoCCT}) ha finalizado y su Administrador ha solicitado contacto para adquirir el servicio y reanudar la inscripción.\n\n` +
        `=== DATOS DE CONTACTO DE LA INSTITUCIÓN ===\n` +
        `• Colegio: ${col.nombre}\n` +
        `• Clave CCT: ${col.codigoCCT || 'N/A'}\n` +
        `• Administrador Solicitante: ${adminUser?.nombre || col.director}\n` +
        `• Correo Electrónico: ${adminUser?.correo || col.correo}\n` +
        `• Teléfono / WhatsApp: ${whatsappPhone}\n` +
        `• Fecha de Alta (Inicio Demo): ${col.creadoEn}\n` +
        `• Fecha de Término de Demo: ${col.fechaExpiracionDemo || 'Finalizada'}\n\n` +
        `=== CANALES DE NOTIFICACIÓN ENVIADOS ===\n` +
        `✓ Notificación en Plataforma: Recibida en bandeja de Superusuario y Soporte\n` +
        `✓ Correo Electrónico: Enviado a ${targetEmails.join(', ')}\n` +
        `✓ Alerta de WhatsApp Operativo: Despachada al equipo de Soporte y Superadmin para seguimiento inmediato.`,
      categoria: 'facturacion',
      prioridad: 'urgente',
    });

    setColleges((prev) => {
      const next = prev.map((c) =>
        c.id === collegeId ? { ...c, solicitudReanudacionDemoEnviada: true } : c
      );
      saveState('colleges', next);
      return next;
    });
    apiClient.updateCollege(collegeId, { solicitudReanudacionDemoEnviada: true });

    addActivityLog({
      modulo: 'Demostración / Suscripción de Colegio',
      accion: 'Solicitud para Adquirir Servicio y Reanudar Inscripción (Demo Finalizada)',
      detalle: `El Administrador "${adminUser?.nombre || col.director}" del colegio "${col.nombre}" solicitó contacto para reanudar la inscripción tras finalizar su mes de demostración. Se envió aviso por correo, WhatsApp y plataforma a Soporte y Superusuario.`,
      colegioId: null,
      colegioNombre: col.nombre,
    });
  };

  // Generate 1-minute authorization key in the Administrator's Profile to allow Superuser to delete the college
  const generateCollegeDeletionKey = (collegeId: string): { codigo: string; expiraEn: number } => {
    const col = colleges.find((c) => c.id === collegeId);
    // 6-digit numeric authorization key (easy to copy or type within 60 seconds)
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expiraEn = Date.now() + 60 * 1000; // Strictly 1 minute (60,000 ms)
    const generadaPor = currentUser?.nombre || 'Administrador del Colegio';

    setColleges((prev) => {
      const next = prev.map((c) =>
        c.id === collegeId
          ? {
              ...c,
              claveBajaCodigo: codigo,
              claveBajaExpiraEn: expiraEn,
              claveBajaGeneradaPor: generadaPor,
            }
          : c
      );
      saveState('colleges', next);
      return next;
    });

    apiClient.saveCollegeDeletionKey(collegeId, {
      claveBajaCodigo: codigo,
      claveBajaExpiraEn: expiraEn,
      claveBajaGeneradaPor: generadaPor,
    });
    apiClient.updateCollege(collegeId, {
      claveBajaCodigo: codigo,
      claveBajaExpiraEn: expiraEn,
      claveBajaGeneradaPor: generadaPor,
    });

    addActivityLog({
      modulo: 'Mi Perfil / Seguridad Institucional',
      accion: 'Generación de Clave de Baja de Colegio (1 min)',
      detalle: `El administrador "${generadaPor}" generó una clave temporal de 1 minuto para autorizar la baja definitiva del colegio "${col?.nombre || collegeId}".`,
      colegioId: collegeId,
      colegioNombre: col?.nombre,
    });

    return { codigo, expiraEn };
  };

  // Verify the 1-minute deletion key entered by the Superuser in Global Dashboard
  const verifyCollegeDeletionKey = async (
    collegeId: string,
    inputKey: string
  ): Promise<{ valid: boolean; reason?: 'no_key' | 'expired' | 'invalid'; message?: string }> => {
    const cleanInput = (inputKey || '').trim().toUpperCase();
    if (!cleanInput) {
      return {
        valid: false,
        reason: 'invalid',
        message: 'Por favor ingresa la clave de autorización generada por el administrador del colegio.',
      };
    }

    // 1. Check current state, localStorage (in case generated in another browser tab), and backend API
    const stateCol = colleges.find((c) => c.id === collegeId);
    let storedCodigo = stateCol?.claveBajaCodigo || '';
    let storedExpira = stateCol?.claveBajaExpiraEn || 0;

    try {
      const rawStorage = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'colleges');
      if (rawStorage) {
        const parsedCols: College[] = JSON.parse(rawStorage);
        const lsCol = parsedCols.find((c) => c.id === collegeId);
        if (lsCol?.claveBajaCodigo && (lsCol.claveBajaExpiraEn || 0) >= storedExpira) {
          storedCodigo = lsCol.claveBajaCodigo;
          storedExpira = lsCol.claveBajaExpiraEn || 0;
        }
      }
    } catch {
      // ignore
    }

    // Also check backend in case the administrator generated it from a different device/session
    const remoteKey = await apiClient.getCollegeDeletionKey(collegeId);
    if (remoteKey?.claveBajaCodigo && (remoteKey.claveBajaExpiraEn || 0) >= storedExpira) {
      storedCodigo = remoteKey.claveBajaCodigo;
      storedExpira = remoteKey.claveBajaExpiraEn || 0;
    }

    if (!storedCodigo || !storedExpira) {
      return {
        valid: false,
        reason: 'no_key',
        message:
          'No existe una clave activa para este colegio. Solicita al Administrador del colegio que ingrese a su módulo "Mi Perfil" y genere la clave de baja.',
      };
    }

    if (Date.now() > storedExpira) {
      return {
        valid: false,
        reason: 'expired',
        message:
          'La clave de autorización ha expirado (su duración es de 1 minuto). Solicita al Administrador del colegio que genere una nueva clave en su módulo "Mi Perfil".',
      };
    }

    if (storedCodigo.trim().toUpperCase() !== cleanInput) {
      return {
        valid: false,
        reason: 'invalid',
        message:
          'La clave ingresada no coincide con la generada por el Administrador del colegio. Verifícala e inténtalo nuevamente.',
      };
    }

    return { valid: true };
  };

  // Deactivate or Activate a college without deleting any information (only restricts/restores access to all profiles and users)
  const toggleCollegeActiveStatus = (collegeId: string, activo: boolean) => {
    const col = colleges.find((c) => c.id === collegeId);
    setColleges((prev) => {
      const next = prev.map((c) => (c.id === collegeId ? { ...c, activo } : c));
      saveState('colleges', next);
      return next;
    });
    apiClient.updateCollege(collegeId, { activo });
    addActivityLog({
      modulo: 'Dashboard Global / Colegios',
      accion: activo ? 'Activación de Colegio' : 'Desactivación Temporal de Colegio',
      detalle: activo
        ? `Activó el colegio "${col?.nombre || collegeId}", restableciendo el acceso a todos sus perfiles y usuarios.`
        : `Desactivó el colegio "${col?.nombre || collegeId}". Se restringieron todos los accesos a perfiles y usuarios sin eliminar información.`,
      colegioId: null,
      colegioNombre: col?.nombre || 'Panel General',
    });
  };

  const deleteCollege = (id: string) => {
    const col = colleges.find((c) => c.id === id);
    apiClient.deleteCollege(id);

    // Wipe college and 100% of its associated data across all collections in state & localStorage
    setColleges((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveState('colleges', next);
      return next;
    });
    setUsers((prev) => {
      const next = prev.filter((u) => u.colegioId !== id);
      saveState('users', next);
      return next;
    });
    setStudents((prev) => {
      const next = prev.filter((s) => s.colegioId !== id);
      saveState('students', next);
      return next;
    });
    setTeachers((prev) => {
      const next = prev.filter((t) => t.colegioId !== id);
      saveState('teachers', next);
      return next;
    });
    setSubjects((prev) => {
      const next = prev.filter((s) => s.colegioId !== id);
      saveState('subjects', next);
      return next;
    });
    setGrades((prev) => {
      const next = prev.filter((g) => g.colegioId !== id);
      saveState('grades', next);
      return next;
    });
    setIncidents((prev) => {
      const next = prev.filter((i) => i.colegioId !== id);
      saveState('incidents', next);
      return next;
    });
    setPsychologyRecords((prev) => {
      const next = prev.filter((p) => p.colegioId !== id);
      saveState('psychology', next);
      return next;
    });
    setLibraryBooks((prev) => {
      const next = prev.filter((b) => b.colegioId !== id);
      saveState('library', next);
      return next;
    });
    setNotices((prev) => {
      const next = prev.filter((n) => n.colegioId !== id);
      saveState('notices', next);
      return next;
    });
    setActivities((prev) => {
      const next = prev.filter((a) => a.colegioId !== id);
      saveState('activities', next);
      return next;
    });
    setTasksExams((prev) => {
      const next = prev.filter((t) => t.colegioId !== id);
      saveState('tasks_exams', next);
      return next;
    });
    setAttendanceRecords((prev) => {
      const next = prev.filter((a) => a.colegioId !== id);
      saveState('attendance', next);
      return next;
    });
    setPreenrollments((prev) => {
      const next = prev.filter((p) => p.colegioId !== id);
      saveState('preenrollments', next);
      return next;
    });
    setPreenrollmentConfigs((prev) => {
      const next = { ...prev };
      delete next[id];
      saveState('preenrollment_configs', next);
      return next;
    });
    setCampuses((prev) => {
      const next = prev.filter((c) => c.colegioId !== id);
      saveState('campuses', next);
      return next;
    });
    setSchoolCycles((prev) => {
      const next = prev.filter((c) => c.colegioId !== id);
      saveState('school_cycles', next);
      return next;
    });
    setCalendarDays((prev) => {
      const next = prev.filter((d) => d.colegioId !== id);
      saveState('calendar_days', next);
      return next;
    });
    setGroupSchedules((prev) => {
      const next = prev.filter((g) => g.colegioId !== id);
      saveState('group_schedules', next);
      return next;
    });
    setMonthlyTuitions((prev) => {
      const next = prev.filter((m) => m.colegioId !== id);
      saveState('monthly_tuitions', next);
      return next;
    });
    setBillingConcepts((prev) => {
      const next = prev.filter((b) => b.colegioId !== id);
      saveState('billing_concepts', next);
      return next;
    });
    setEvaluationConcepts((prev) => {
      const next = prev.filter((e) => e.colegioId !== id);
      saveState('evaluation_concepts', next);
      return next;
    });
    setEvaluationSavedPeriods((prev) => {
      const next = prev.filter((p) => p.colegioId !== id);
      saveState('evaluation_saved_periods', next);
      return next;
    });
    setStudentEvaluations((prev) => {
      const next = prev.filter((s) => s.colegioId !== id);
      saveState('student_evaluations', next);
      return next;
    });
    setCollegeGroups((prev) => {
      const next = prev.filter((g) => g.colegioId !== id);
      saveState('college_groups', next);
      return next;
    });
    setCollegeRolePermissions((prev) => {
      const next = { ...prev };
      delete next[id];
      saveState('college_role_permissions', next);
      return next;
    });

    if (selectedCollegeId === id) {
      setSelectedCollegeId(null);
    }

    addActivityLog({
      modulo: 'Dashboard Global / Colegios',
      accion: 'Baja Definitiva de Colegio con Clave de Autorización',
      detalle: `Eliminó definitivamente el colegio "${col?.nombre || id}" y borró toda su información de la base de datos tras validar la clave del administrador.`,
      colegioId: null,
      colegioNombre: col?.nombre || 'Panel General',
    });
  };

  const toggleModule = (collegeId: string, moduleId: CollegeModuleId, enable: boolean) => {
    const col = colleges.find((c) => c.id === collegeId);
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== collegeId) return c;
        const currentModules = c.modulosHabilitados || [];
        const updated = enable
          ? Array.from(new Set([...currentModules, moduleId]))
          : currentModules.filter((m) => m !== moduleId);
        apiClient.updateCollege(collegeId, { modulosHabilitados: updated });
        return { ...c, modulosHabilitados: updated };
      })
    );
    addActivityLog({
      modulo: 'Módulos de Colegio',
      accion: enable ? 'Activación de Módulo' : 'Desactivación de Módulo',
      detalle: `${enable ? 'Activó' : 'Desactivó'} el módulo "${moduleId}" para el colegio "${col?.nombre || collegeId}".`,
      colegioId: collegeId,
      colegioNombre: col?.nombre,
    });
  };

  const isGenericOrShieldImage = (imgUrl?: string, prevShieldUrl?: string): boolean => {
    if (!imgUrl || !imgUrl.trim()) return true;
    if (prevShieldUrl && imgUrl === prevShieldUrl) return true;
    if (imgUrl.startsWith('data:image/svg+xml')) return true;
    if (imgUrl.includes('images.unsplash.com')) return true;
    return false;
  };

  const updateCollegeBranding = (
    collegeId: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ) => {
    const col = colleges.find((c) => c.id === collegeId);
    const prevShield = col?.escudoUrl || '';
    const nextShield =
      escudoUrl ||
      col?.escudoUrl ||
      createShieldSvg(primario || '#0B2545', secundario || '#C59B27', col?.nombre || 'Colegio');

    apiClient.updateCollegeBranding(collegeId, escudoUrl, primario, secundario);
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== collegeId) return c;
        return {
          ...c,
          escudoUrl: escudoUrl || c.escudoUrl,
          colores: {
            ...c.colores,
            primario,
            secundario,
          },
        };
      })
    );

    // Si se actualiza el escudo de la escuela, todos los alumnos, docentes y usuarios que no tengan una fotografía propia toman el escudo actualizado
    if (nextShield) {
      setStudents((prev) => {
        let changed = false;
        const next = prev.map((st) => {
          if (st.colegioId === collegeId && isGenericOrShieldImage(st.foto, prevShield)) {
            changed = true;
            apiClient.updateStudent(st.id, { foto: nextShield });
            return { ...st, foto: nextShield };
          }
          return st;
        });
        if (changed) saveState('students', next);
        return changed ? next : prev;
      });

      setTeachers((prev) => {
        let changed = false;
        const next = prev.map((tch) => {
          if (tch.colegioId === collegeId && isGenericOrShieldImage(tch.foto, prevShield)) {
            changed = true;
            apiClient.updateTeacher(tch.id, { foto: nextShield });
            return { ...tch, foto: nextShield };
          }
          return tch;
        });
        if (changed) saveState('teachers', next);
        return changed ? next : prev;
      });

      setUsers((prev) => {
        let changed = false;
        const next = prev.map((u) => {
          if (u.colegioId === collegeId && isGenericOrShieldImage(u.avatar, prevShield)) {
            changed = true;
            apiClient.updateUser(u.id, { avatar: nextShield });
            return { ...u, avatar: nextShield };
          }
          return u;
        });
        if (changed) saveState('users', next);
        return changed ? next : prev;
      });

      if (
        currentUser.colegioId === collegeId &&
        isGenericOrShieldImage(currentUser.avatar, prevShield)
      ) {
        setCurrentUser((prev) => ({ ...prev, avatar: nextShield }));
      }
    }

    addActivityLog({
      modulo: 'Personalizar',
      accion: 'Actualización de Escudo y Colores',
      detalle: `Actualizó la identidad visual (escudo y colores ${primario} / ${secundario}) del colegio "${col?.nombre || collegeId}" y sincronizó el escudo en los perfiles sin fotografía propia.`,
      colegioId: collegeId,
      colegioNombre: col?.nombre,
    });
  };

  const updateCollegeReportCardDesign = async (
    collegeId: string,
    disenoBoleta: College['disenoBoleta']
  ): Promise<boolean> => {
    const col = colleges.find((c) => c.id === collegeId);
    setColleges((prev) => {
      const next = prev.map((c) =>
        c.id === collegeId ? { ...c, disenoBoleta } : c
      );
      saveState('colleges', next);
      return next;
    });

    const [okDesign, okCol] = await Promise.all([
      apiClient.updateCollegeReportCardDesign(
        collegeId,
        disenoBoleta,
        col?.periodicidadEvaluacion
      ),
      apiClient.updateCollege(collegeId, { disenoBoleta }),
    ]);

    addActivityLog({
      modulo: 'Calificaciones y Boletas',
      accion: 'Guardado de Diseño Institucional de Boleta',
      detalle: `Guardó el diseño general de la boleta oficial para el colegio "${col?.nombre || collegeId}" en la base de datos.`,
      colegioId: collegeId,
      colegioNombre: col?.nombre,
    });

    return okDesign || okCol;
  };

  const addUser = (
    userData: Omit<User, 'id' | 'creadoEn'>,
    options?: { skipWelcomeEmail?: boolean }
  ): User => {
    const generatedUsername =
      userData.usuarioLogin?.trim() || generateTutorUsername(userData.nombre);
    const rawPass = userData.password?.trim() || '';
    const generatedPassword =
      rawPass && rawPass !== 'admin123' && rawPass.length === 8
        ? rawPass
        : generateRandomPassword();

    // Ensure every non-superusuario/non-soporte user is saved in their respective college, and superusuario/soporte is NEVER linked to any college
    const isGlobalUnlinkedRole =
      userData.rol === 'superusuario' ||
      userData.rol === 'soporte' ||
      String(userData.rol || '').toLowerCase().includes('soporte');
    const resolvedCollegeId = isGlobalUnlinkedRole
      ? null
      : userData.colegioId || activeCollege?.id || selectedCollegeId || colleges[0]?.id || null;

    const newUser: User = {
      ...userData,
      rol:
        String(userData.rol || '').toLowerCase().includes('soporte') &&
        userData.rol !== 'superusuario'
          ? 'soporte'
          : userData.rol,
      id: 'usr-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      colegioId: resolvedCollegeId,
      usuarioLogin: generatedUsername,
      password: generatedPassword,
      creadoEn: new Date().toISOString().split('T')[0],
      ultimoAcceso: 'Recién registrado',
      avatar:
        userData.avatar && !userData.avatar.includes('images.unsplash.com')
          ? userData.avatar
          : (resolvedCollegeId
              ? colleges.find((c) => c.id === resolvedCollegeId)?.escudoUrl
              : '') ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
    setUsers((prev) => [newUser, ...prev]);
    apiClient.createUser(newUser);

    const assignedCol = newUser.colegioId
      ? colleges.find((c) => c.id === newUser.colegioId)
      : null;

    if (newUser.correo && !options?.skipWelcomeEmail) {
      sendEmailNotification({
        colegioId: newUser.colegioId || 'global',
        colegioNombre: assignedCol?.nombre || 'My College Plataforma Global',
        destinatarios: [newUser.correo],
        rolesDestino: [newUser.rol],
        usuariosDestino: [newUser.id, newUser.correo, generatedUsername],
        asunto: `[My College] Alta de Usuario y Credenciales Oficiales de Acceso (${newUser.nombre})`,
        cuerpo:
          `Estimado(a) ${newUser.nombre}:\n\n` +
          `Le damos la bienvenida a ${assignedCol?.nombre || 'My College'}. Su cuenta ha sido dada de alta exitosamente con el perfil de ${ROLES_CONFIG[newUser.rol]?.label || newUser.rol}.\n\n` +
          `=== CREDENCIALES OFICIALES DE ACCESO ===\n` +
          `• Enlace de Acceso: https://dashboard.mycollege.com.mx\n` +
          `• Institución: ${assignedCol?.nombre || 'Plataforma Global My College'}\n` +
          `• Perfil / Rol: ${ROLES_CONFIG[newUser.rol]?.label || newUser.rol}\n` +
          `• Usuario: ${generatedUsername}\n` +
          `• Correo Electrónico: ${newUser.correo}\n` +
          `• Contraseña Aleatoria (8 caracteres): ${generatedPassword}\n\n` +
          `=== PASOS PARA INICIAR SESIÓN ===\n` +
          `1. Ingrese al portal oficial: https://dashboard.mycollege.com.mx\n` +
          `2. Escriba únicamente su Usuario (${generatedUsername}) y su contraseña (el correo electrónico solo sirve para recibir notificaciones y restablecimiento de contraseña).\n\n` +
          `Recordatorio importante de seguridad: Una vez que ingrese a la plataforma, diríjase a su "Perfil" (Mi Perfil) y cambie su contraseña por una de su elección.`,
        categoria: 'seguridad',
        prioridad: 'alta',
      });
    }

    addActivityLog({
      modulo: 'Usuarios',
      accion: 'Alta de Usuario',
      detalle: `Dio de alta al usuario "${newUser.nombre}" (Usuario: ${generatedUsername}, Correo: ${newUser.correo}) con el perfil/rol "${newUser.rol}".`,
      colegioId: newUser.colegioId,
    });
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const target = users.find((u) => u.id === id);
    // 1.- El usuario (usuarioLogin) NO se puede modificar una vez generado
    const safeUpdates: Partial<User> = { ...updates };
    if (target?.usuarioLogin && isValidGeneratedUsername(target.usuarioLogin)) {
      safeUpdates.usuarioLogin = target.usuarioLogin;
    }
    const resultingRole = safeUpdates.rol || target?.rol;
    if (
      resultingRole === 'superusuario' ||
      resultingRole === 'soporte' ||
      String(resultingRole || '').toLowerCase().includes('soporte')
    ) {
      safeUpdates.colegioId = null;
    }
    // Con excepción de tutores, alumnos y superusuario: superusuario y tutor nunca se pueden poner inactivos
    if (resultingRole === 'superusuario' || resultingRole === 'tutor') {
      safeUpdates.activo = true;
    }

    apiClient.updateUser(id, safeUpdates);
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...safeUpdates } : u));
      saveState('users', next);
      return next;
    });
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...safeUpdates }));
    }

    // Si es un usuario docente y se cambió su estado activo/inactivo o su fotografía (avatar), sincronizar su ficha en Teachers
    if (
      resultingRole === 'docente' &&
      (typeof safeUpdates.activo === 'boolean' || Boolean(safeUpdates.avatar))
    ) {
      const nextTeacherStatus: 'activo' | 'inactivo' | undefined =
        typeof safeUpdates.activo === 'boolean'
          ? safeUpdates.activo
            ? 'activo'
            : 'inactivo'
          : undefined;
      const targetName = (safeUpdates.nombre || target?.nombre || '').trim().toLowerCase();
      const targetEmail = (safeUpdates.correo || target?.correo || '').trim().toLowerCase();
      const targetColId = safeUpdates.colegioId || target?.colegioId;
      const expectedTchId = id.replace(/^usr-/, '');

      setTeachers((prev) => {
        let changed = false;
        const next = prev.map((tch) => {
          const matchesId = tch.id === id || tch.id === expectedTchId;
          const matchesExactTeacher =
            Boolean(targetName) &&
            tch.nombre.trim().toLowerCase() === targetName &&
            (!targetEmail || tch.correo.trim().toLowerCase() === targetEmail) &&
            (!targetColId || tch.colegioId === targetColId);
          if (matchesId || matchesExactTeacher) {
            changed = true;
            const tchPatch: Partial<Teacher> = {};
            if (nextTeacherStatus) tchPatch.estatus = nextTeacherStatus;
            if (safeUpdates.avatar) tchPatch.foto = safeUpdates.avatar;
            apiClient.updateTeacher(tch.id, tchPatch);
            return { ...tch, ...tchPatch };
          }
          return tch;
        });
        if (changed) saveState('teachers', next);
        return changed ? next : prev;
      });
    }

    // Si es un usuario alumno y se actualizó su avatar, sincronizar foto en Students
    if (resultingRole === 'alumno' && safeUpdates.avatar) {
      const targetStId = safeUpdates.estudianteId || target?.estudianteId || id.replace(/^usr-(alumno-|std-)?/, '');
      setStudents((prev) => {
        let changed = false;
        const next = prev.map((st) => {
          if (
            st.id === targetStId ||
            (target?.usuarioLogin &&
              st.usuarioLogin?.toLowerCase() === target.usuarioLogin.toLowerCase())
          ) {
            changed = true;
            apiClient.updateStudent(st.id, { foto: safeUpdates.avatar });
            return { ...st, foto: safeUpdates.avatar };
          }
          return st;
        });
        if (changed) saveState('students', next);
        return changed ? next : prev;
      });
    }

    const statusChanged =
      typeof safeUpdates.activo === 'boolean' &&
      target &&
      safeUpdates.activo !== target.activo;

    addActivityLog({
      modulo: 'Usuarios / Perfil',
      accion: safeUpdates.datosFiscales
        ? 'Actualización de Datos Fiscales (RFC)'
        : statusChanged
        ? safeUpdates.activo
          ? 'Activación de Acceso de Usuario'
          : 'Usuario Marcado como Inactivo (Acceso Negado)'
        : 'Actualización de Usuario',
      detalle: safeUpdates.datosFiscales
        ? `El usuario "${target?.nombre || currentUser.nombre}" dio de alta/actualizó sus datos fiscales (RFC: ${safeUpdates.datosFiscales.rfc}).`
        : statusChanged
        ? safeUpdates.activo
          ? `Activó nuevamente al usuario "${target?.nombre || id}" (${target?.rol || ''}), restableciendo su acceso a la plataforma.`
          : `Marcó como INACTIVO al usuario "${target?.nombre || id}" (${target?.rol || ''}), negándole el acceso a la plataforma.`
        : `Actualizó los datos del usuario "${target?.nombre || id}".`,
      colegioId: target?.colegioId || currentUser.colegioId,
    });
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    markUserIdAsDeleted(id);
    apiClient.deleteUser(id);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveState('users', next);
      return next;
    });

    // Si el usuario eliminado es un docente, eliminar únicamente su propio registro en Teachers y en la base de datos
    if (target?.rol === 'docente' || id.startsWith('usr-tch-') || id.startsWith('tch-')) {
      const targetName = (target?.nombre || '').trim().toLowerCase();
      const targetEmail = (target?.correo || '').trim().toLowerCase();
      const targetColId = target?.colegioId;
      const expectedTchId = id.replace(/^usr-/, '');

      const matchedTeachers = teachers.filter((tch) => {
        const matchesId = tch.id === id || tch.id === expectedTchId;
        const matchesExactTeacher =
          Boolean(targetName) &&
          tch.nombre.trim().toLowerCase() === targetName &&
          (!targetEmail || tch.correo.trim().toLowerCase() === targetEmail) &&
          (!targetColId || tch.colegioId === targetColId);
        return matchesId || matchesExactTeacher;
      });

      if (matchedTeachers.length > 0) {
        const matchedIds = new Set(matchedTeachers.map((t) => t.id));
        matchedTeachers.forEach((t) => apiClient.deleteTeacher(t.id));
        setTeachers((prev) => {
          const next = prev.filter((t) => !matchedIds.has(t.id));
          saveState('teachers', next);
          return next;
        });

        if (targetColId) {
          setColleges((prev) =>
            prev.map((c) => {
              if (c.id !== targetColId) return c;
              const nextCount = Math.max(0, (c.docentesTotales || 0) - matchedTeachers.length);
              apiClient.updateCollege(targetColId, { docentesTotales: nextCount });
              return { ...c, docentesTotales: nextCount };
            })
          );
        }
      }
    }

    addActivityLog({
      modulo: 'Usuarios',
      accion: 'Baja Definitiva de Usuario (Plataforma y Base de Datos)',
      detalle: `Eliminó permanentemente de la plataforma y de la base de datos al usuario "${target?.nombre || id}" (${target?.rol || ''}).`,
      colegioId: target?.colegioId,
    });
  };

  const addStudent = (data: Omit<Student, 'id'> & { id?: string }): Student => {
    const targetColId = data.colegioId || activeCollege?.id || selectedCollegeId || colleges[0]?.id || '';
    const assignedCol = colleges.find((c) => c.id === targetColId);
    const defaultShieldFoto =
      assignedCol?.escudoUrl ||
      createShieldSvg(
        assignedCol?.colores?.primario || '#0B2545',
        assignedCol?.colores?.secundario || '#C59B27',
        assignedCol?.nombre || 'Colegio'
      );
    const resolvedFoto =
      data.foto && !data.foto.includes('images.unsplash.com')
        ? data.foto
        : defaultShieldFoto;
    const studentId = data.id || 'std-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const { usuarioLogin, password } = ensureStudentCredentials({
      id: studentId,
      nombre: data.nombre,
      apellidos: data.apellidos,
      matricula: data.matricula,
      usuarioLogin: data.usuarioLogin,
      password: data.password,
    });
    const newStudent: Student = {
      ...data,
      foto: resolvedFoto,
      colegioId: targetColId,
      id: studentId,
      usuarioLogin,
      password,
    };
    setStudents((prev) => [newStudent, ...prev]);
    apiClient.createStudent(newStudent);
    // update count in state and DB
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== targetColId) return c;
        const nextCount = (c.alumnosTotales || 0) + 1;
        apiClient.updateCollege(targetColId, { alumnosTotales: nextCount });
        return { ...c, alumnosTotales: nextCount };
      })
    );
    addActivityLog({
      modulo: 'Control de Alumnos',
      accion: 'Alta de Alumno',
      detalle: `Dio de alta al alumno "${newStudent.nombre} ${newStudent.apellidos}" (Matrícula: ${newStudent.matricula}, Usuario: ${usuarioLogin}, Grado: ${newStudent.grado}, Grupo: ${newStudent.grupo}).`,
      colegioId: newStudent.colegioId,
    });
    return newStudent;
  };

  const addStudentsBulk = (items: (Omit<Student, 'id'> & { id?: string })[]): Student[] => {
    if (!items.length) return [];
    const targetColId =
      items[0]?.colegioId || activeCollege?.id || selectedCollegeId || colleges[0]?.id || '';
    const assignedCol = colleges.find((c) => c.id === targetColId);
    const cctSlug = (assignedCol?.codigoCCT || targetColId || 'mycollege').toLowerCase();

    const newStudents: Student[] = [];
    const newUsers: User[] = [];

    items.forEach((data, idx) => {
      const colId = data.colegioId || targetColId;
      const studentId =
        data.id || `std-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`;
      const { usuarioLogin, password } = ensureStudentCredentials({
        id: studentId,
        nombre: data.nombre,
        apellidos: data.apellidos,
        matricula: data.matricula,
        usuarioLogin: data.usuarioLogin,
        password: data.password,
      });

      const newStudent: Student = {
        ...data,
        colegioId: colId,
        id: studentId,
        usuarioLogin,
        password,
      };
      newStudents.push(newStudent);

      const newUser: User = {
        id: `usr-alumno-${studentId}`,
        nombre: `${data.nombre} ${data.apellidos}`.trim(),
        correo: `${usuarioLogin}@alumno.${cctSlug}.edu.mx`,
        usuarioLogin,
        password,
        rol: 'alumno',
        colegioId: colId,
        cargo: `Alumno (${data.nivel || 'Primaria'} · ${data.grado} "${data.grupo}")`,
        avatar: data.foto || assignedCol?.escudoUrl || '',
        activo: true,
        estudianteId: studentId,
        creadoEn: new Date().toISOString().split('T')[0],
        ultimoAcceso: 'Recién registrado',
      };
      newUsers.push(newUser);
    });

    setStudents((prev) => {
      const next = [...newStudents, ...prev];
      saveState('students', next);
      return next;
    });

    setUsers((prev) => {
      const next = [...newUsers, ...prev];
      saveState('users', next);
      return next;
    });

    apiClient.createStudentsBulk(newStudents, targetColId);

    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== targetColId) return c;
        const nextCount = (c.alumnosTotales || 0) + newStudents.length;
        apiClient.updateCollege(targetColId, { alumnosTotales: nextCount });
        return { ...c, alumnosTotales: nextCount };
      })
    );

    addActivityLog({
      modulo: 'Control de Alumnos',
      accion: 'Importación Masiva de Alumnos',
      detalle: `Importó y registró ${newStudents.length} alumnos con sus respectivos usuarios y contraseñas en el colegio "${assignedCol?.nombre || targetColId}".`,
      colegioId: targetColId,
    });

    return newStudents;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const target = students.find((s) => s.id === id);
    // 1.- El usuario (usuarioLogin) NO se puede modificar una vez generado
    const safeUpdates: Partial<Student> = { ...updates };
    if (target?.usuarioLogin && isValidGeneratedUsername(target.usuarioLogin)) {
      safeUpdates.usuarioLogin = target.usuarioLogin;
    }
    const cleanUpdates = { ...safeUpdates };
    if ('campusId' in safeUpdates && safeUpdates.campusId === undefined) {
      (cleanUpdates as any).campusId = '';
    }
    apiClient.updateStudent(id, cleanUpdates);
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...safeUpdates } : s));
      saveState('students', next);
      return next;
    });
    if (safeUpdates.estatus || safeUpdates.foto) {
      const isNowBaja = safeUpdates.estatus === 'baja';
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (
            u.rol === 'alumno' &&
            (u.estudianteId === id ||
              (target?.usuarioLogin &&
                u.usuarioLogin?.toLowerCase() === target.usuarioLogin.toLowerCase()))
          ) {
            const usrPatch: Partial<User> = {};
            if (safeUpdates.estatus) usrPatch.activo = !isNowBaja;
            if (safeUpdates.foto) usrPatch.avatar = safeUpdates.foto;
            apiClient.updateUser(u.id, usrPatch);
            return { ...u, ...usrPatch };
          }
          return u;
        });
        saveState('users', nextUsers);
        return nextUsers;
      });
    }
    addActivityLog({
      modulo: 'Control de Alumnos',
      accion:
        safeUpdates.estatus === 'baja'
          ? 'Baja de Alumno'
          : safeUpdates.grupo
          ? 'Asignación / Cambio de Grupo'
          : 'Actualización de Alumno',
      detalle:
        safeUpdates.estatus === 'baja'
          ? `Cambió el estatus del alumno "${target?.nombre || ''} ${target?.apellidos || ''}" a BAJA (sin cobros en tutores ni acceso a la plataforma).`
          : safeUpdates.grupo
          ? `Asignó o actualizó el grupo del alumno "${target?.nombre || ''} ${target?.apellidos || ''}" a "${safeUpdates.grupo}".`
          : `Actualizó el expediente del alumno "${target?.nombre || ''} ${target?.apellidos || ''}".`,
      colegioId: target?.colegioId,
    });
  };

  const deleteStudent = (id: string) => {
    const student = students.find((s) => s.id === id);
    apiClient.deleteStudent(id);

    // Also remove any associated 'alumno' user account for this student
    const linkedUsers = users.filter(
      (u) =>
        u.estudianteId === id ||
        (student?.usuarioLogin &&
          u.rol === 'alumno' &&
          u.usuarioLogin?.toLowerCase() === student.usuarioLogin.toLowerCase())
    );
    if (linkedUsers.length > 0) {
      const linkedIds = new Set(linkedUsers.map((u) => u.id));
      linkedUsers.forEach((u) => apiClient.deleteUser(u.id));
      setUsers((prev) => {
        const next = prev.filter((u) => !linkedIds.has(u.id));
        saveState('users', next);
        return next;
      });
    }

    // Remove student ID from any tutor's hijosIds list
    setUsers((prev) => {
      let changed = false;
      const next = prev.map((u) => {
        if (Array.isArray(u.hijosIds) && u.hijosIds.includes(id)) {
          changed = true;
          const updatedHijos = u.hijosIds.filter((hid) => hid !== id);
          apiClient.updateUser(u.id, { hijosIds: updatedHijos });
          return { ...u, hijosIds: updatedHijos };
        }
        return u;
      });
      if (changed) saveState('users', next);
      return changed ? next : prev;
    });

    // Remove monthly tuition records for this student
    setMonthlyTuitions((prev) => {
      const next = prev.filter((m) => m.estudianteId !== id);
      saveState('monthly_tuitions', next);
      return next;
    });

    if (student) {
      setColleges((prev) =>
        prev.map((c) => {
          if (c.id !== student.colegioId) return c;
          const nextCount = Math.max(0, (c.alumnosTotales || 0) - 1);
          apiClient.updateCollege(student.colegioId, { alumnosTotales: nextCount });
          return { ...c, alumnosTotales: nextCount };
        })
      );
    }

    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveState('students', next);
      return next;
    });

    addActivityLog({
      modulo: 'Control de Alumnos',
      accion: 'Baja de Alumno',
      detalle: `Dio de baja y eliminó al alumno "${student?.nombre || ''} ${student?.apellidos || id}" (Matrícula: ${student?.matricula || 'N/A'}).`,
      colegioId: student?.colegioId,
    });
  };

  const addTeacher = (data: Omit<Teacher, 'id'>) => {
    const assignedCol = colleges.find((c) => c.id === data.colegioId);
    const defaultShieldFoto =
      assignedCol?.escudoUrl ||
      createShieldSvg(
        assignedCol?.colores?.primario || '#0B2545',
        assignedCol?.colores?.secundario || '#C59B27',
        assignedCol?.nombre || 'Colegio'
      );
    const resolvedFoto =
      data.foto && !data.foto.includes('images.unsplash.com')
        ? data.foto
        : defaultShieldFoto;

    const newTeacher: Teacher = {
      ...data,
      foto: resolvedFoto,
      id: 'tch-' + Date.now(),
    };
    setTeachers((prev) => {
      const next = [newTeacher, ...prev];
      saveState('teachers', next);
      return next;
    });
    apiClient.createTeacher(newTeacher);

    // Automatically link students in the assigned groups (matching teacher's level if specified)
    if (Array.isArray(newTeacher.grupos) && newTeacher.grupos.length > 0) {
      const normalizedGroups = new Set(
        newTeacher.grupos.map((g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
      );
      setStudents((prev) => {
        let changed = false;
        const next = prev.map((st) => {
          if (st.colegioId !== newTeacher.colegioId) return st;
          const stLevel = (st.nivel || '').trim().toLowerCase();
          const tchLevel = (newTeacher.nivel || '').trim().toLowerCase();
          const stGradeGroup = `${st.grado} ${st.grupo}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
          const stFullGroup = `${st.nivel || ''} ${st.grado} ${st.grupo}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
          const levelMatches = !tchLevel || !stLevel || stLevel === tchLevel;
          if (
            normalizedGroups.has(stFullGroup) ||
            (levelMatches && normalizedGroups.has(stGradeGroup))
          ) {
            changed = true;
            apiClient.updateStudent(st.id, { docenteId: newTeacher.id, docenteNombre: newTeacher.nombre });
            return { ...st, docenteId: newTeacher.id, docenteNombre: newTeacher.nombre };
          }
          return st;
        });
        if (changed) saveState('students', next);
        return changed ? next : prev;
      });
    }

    // Also create the corresponding User account for this specific teacher (linked by ID `usr-${newTeacher.id}`)
    const expectedUserId = `usr-${newTeacher.id}`;
    const existsInUsers = users.some(
      (u) =>
        u.id === expectedUserId ||
        (u.rol === 'docente' &&
          u.nombre.trim().toLowerCase() === newTeacher.nombre.trim().toLowerCase() &&
          u.colegioId === newTeacher.colegioId)
    );
    if (!existsInUsers) {
      const teacherUsername = generateTutorUsername(newTeacher.nombre);
      const teacherPassword = generateRandomPassword();
      const newTeacherUser: User = {
        id: expectedUserId,
        nombre: newTeacher.nombre,
        correo: newTeacher.correo,
        usuarioLogin: teacherUsername,
        password: teacherPassword,
        rol: 'docente',
        colegioId: newTeacher.colegioId,
        cargo: `Docente de ${newTeacher.especialidad || 'Plantel'}${newTeacher.nivel ? ` (${newTeacher.nivel})` : ''}`,
        avatar: resolvedFoto,
        telefono: newTeacher.telefono,
        activo: true,
        creadoEn: new Date().toISOString().split('T')[0],
        ultimoAcceso: 'Sin accesos previos',
      };
      setUsers((prev) => [newTeacherUser, ...prev]);
      apiClient.createUser(newTeacherUser);

      if (newTeacherUser.correo) {
        sendEmailNotification({
          colegioId: newTeacher.colegioId,
          colegioNombre: assignedCol?.nombre || 'My College',
          destinatarios: [newTeacherUser.correo],
          rolesDestino: ['docente'],
          usuariosDestino: [newTeacherUser.id, newTeacherUser.correo, teacherUsername],
          asunto: `[My College] Alta de Usuario Docente y Credenciales de Acceso (${newTeacherUser.nombre})`,
          cuerpo:
            `Estimado(a) ${newTeacherUser.nombre}:\n\n` +
            `Se ha registrado exitosamente su cuenta docente en ${assignedCol?.nombre || 'My College'}.\n\n` +
            `=== CREDENCIALES OFICIALES DE ACCESO DOCENTE ===\n` +
            `• Enlace de Acceso: https://dashboard.mycollege.com.mx\n` +
            `• Institución: ${assignedCol?.nombre || 'My College'}\n` +
            `• Usuario: ${teacherUsername}\n` +
            `• Correo Electrónico: ${newTeacherUser.correo}\n` +
            `• Contraseña Aleatoria (8 caracteres): ${teacherPassword}\n\n` +
            `=== PASOS PARA INICIAR SESIÓN ===\n` +
            `1. Ingrese al portal oficial: https://dashboard.mycollege.com.mx\n` +
            `2. Capture únicamente su Usuario (${teacherUsername}) y su contraseña.\n\n` +
            `Recordatorio importante de seguridad: Una vez que ingrese a la plataforma, vaya al apartado de "Perfil" (Mi Perfil) y cambie su contraseña.`,
          categoria: 'seguridad',
          prioridad: 'alta',
        });
      }
    }

    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== data.colegioId) return c;
        const nextCount = (c.docentesTotales || 0) + 1;
        apiClient.updateCollege(data.colegioId, { docentesTotales: nextCount });
        return { ...c, docentesTotales: nextCount };
      })
    );
    addActivityLog({
      modulo: 'Profesores y Personal',
      accion: 'Alta de Docente',
      detalle: `Dio de alta al docente "${newTeacher.nombre}" (Especialidad: ${newTeacher.especialidad}${newTeacher.nivel ? `, Nivel: ${newTeacher.nivel}` : ''}).`,
      colegioId: newTeacher.colegioId,
    });
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    const target = teachers.find((t) => t.id === id);
    const cleanUpdates = { ...updates };
    if ('campusId' in updates && updates.campusId === undefined) {
      (cleanUpdates as any).campusId = '';
    }
    if ('grupoTutorado' in updates && !updates.grupoTutorado) {
      (cleanUpdates as any).grupoTutorado = '';
    }
    if (updates.esTutorPrincipal === false) {
      (cleanUpdates as any).grupoTutorado = '';
    }
    apiClient.updateTeacher(id, cleanUpdates);
    setTeachers((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              grupoTutorado:
                updates.esTutorPrincipal === false
                  ? undefined
                  : 'grupoTutorado' in updates
                  ? updates.grupoTutorado || undefined
                  : t.grupoTutorado,
            }
          : t
      );
      saveState('teachers', next);
      return next;
    });

    // When a teacher's groups or level are updated, link matching students in the same college automatically
    if (target && (Array.isArray(updates.grupos) || updates.nivel !== undefined)) {
      const effectiveGroups = updates.grupos ?? target.grupos ?? [];
      const effectiveNivel = (updates.nivel ?? target.nivel ?? '').trim().toLowerCase();
      const normalizedGroups = new Set(
        effectiveGroups.map((g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
      );
      const teacherName = updates.nombre || target.nombre;
      setStudents((prev) => {
        let changed = false;
        const next = prev.map((st) => {
          if (st.colegioId !== target.colegioId) return st;
          const stLevel = (st.nivel || '').trim().toLowerCase();
          const stGradeGroup = `${st.grado} ${st.grupo}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
          const stFullGroup = `${st.nivel || ''} ${st.grado} ${st.grupo}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
          const levelMatches = !effectiveNivel || !stLevel || stLevel === effectiveNivel;
          if (
            normalizedGroups.has(stFullGroup) ||
            (levelMatches && normalizedGroups.has(stGradeGroup))
          ) {
            if (st.docenteId !== id || st.docenteNombre !== teacherName) {
              changed = true;
              apiClient.updateStudent(st.id, { docenteId: id, docenteNombre: teacherName });
              return { ...st, docenteId: id, docenteNombre: teacherName };
            }
          } else if (st.docenteId === id) {
            changed = true;
            apiClient.updateStudent(st.id, { docenteId: '', docenteNombre: '' });
            return { ...st, docenteId: undefined, docenteNombre: undefined };
          }
          return st;
        });
        if (changed) saveState('students', next);
        return changed ? next : prev;
      });
    }

    // Si se actualiza el estatus del profesor (activo / inactivo) o su fotografía, sincronizar su usuario Docente
    if (
      target &&
      (updates.estatus === 'activo' ||
        updates.estatus === 'inactivo' ||
        Boolean(updates.foto))
    ) {
      const isNowActive =
        updates.estatus === 'activo' || updates.estatus === 'inactivo'
          ? updates.estatus === 'activo'
          : undefined;
      const targetName = (updates.nombre || target.nombre || '').trim().toLowerCase();
      const expectedUsrId = `usr-${id}`;

      setUsers((prev) => {
        let changed = false;
        const next = prev.map((u) => {
          const matchesId = u.id === id || u.id === expectedUsrId;
          const matchesExactTeacher =
            u.rol === 'docente' &&
            Boolean(targetName) &&
            u.nombre.trim().toLowerCase() === targetName &&
            (!target.colegioId || u.colegioId === target.colegioId);
          if (matchesId || matchesExactTeacher) {
            changed = true;
            const usrPatch: Partial<User> = {};
            if (typeof isNowActive === 'boolean') usrPatch.activo = isNowActive;
            if (updates.foto) usrPatch.avatar = updates.foto;
            apiClient.updateUser(u.id, usrPatch);
            if (currentUser.id === u.id) {
              setCurrentUser((prevCur) => ({ ...prevCur, ...usrPatch }));
            }
            return { ...u, ...usrPatch };
          }
          return u;
        });
        if (changed) saveState('users', next);
        return changed ? next : prev;
      });
    }

    addActivityLog({
      modulo: 'Profesores y Personal',
      accion:
        updates.estatus === 'inactivo'
          ? 'Docente Marcado como Inactivo (Acceso Negado)'
          : updates.estatus === 'activo'
          ? 'Activación de Acceso de Docente'
          : 'Actualización de Docente',
      detalle:
        updates.estatus === 'inactivo'
          ? `Marcó como INACTIVO al docente "${target?.nombre || id}", negándole el acceso a la plataforma.`
          : updates.estatus === 'activo'
          ? `Activó nuevamente al docente "${target?.nombre || id}", restableciendo su acceso.`
          : `Actualizó la asignación o datos del docente "${target?.nombre || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const deleteTeacher = (id: string) => {
    const target = teachers.find((t) => t.id === id);
    apiClient.deleteTeacher(id);
    setTeachers((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveState('teachers', next);
      return next;
    });

    // Eliminar únicamente la cuenta de usuario asociada a este docente en estado y en la base de datos
    const targetName = (target?.nombre || '').trim().toLowerCase();
    const expectedUsrId = `usr-${id}`;
    const matchedUsers = users.filter((u) => {
      const matchesId = u.id === id || u.id === expectedUsrId;
      const matchesExactTeacher =
        u.rol === 'docente' &&
        Boolean(targetName) &&
        u.nombre.trim().toLowerCase() === targetName &&
        (!target?.colegioId || u.colegioId === target.colegioId);
      return matchesId || matchesExactTeacher;
    });

    if (matchedUsers.length > 0) {
      const matchedUserIds = new Set(matchedUsers.map((u) => u.id));
      matchedUsers.forEach((u) => {
        markUserIdAsDeleted(u.id);
        apiClient.deleteUser(u.id);
      });
      setUsers((prev) => {
        const next = prev.filter((u) => !matchedUserIds.has(u.id));
        saveState('users', next);
        return next;
      });
    }

    if (target?.colegioId) {
      setColleges((prev) =>
        prev.map((c) => {
          if (c.id !== target.colegioId) return c;
          const nextCount = Math.max(0, (c.docentesTotales || 0) - 1);
          apiClient.updateCollege(target.colegioId, { docentesTotales: nextCount });
          return { ...c, docentesTotales: nextCount };
        })
      );
    }

    addActivityLog({
      modulo: 'Profesores y Personal',
      accion: 'Baja Definitiva de Docente y Usuario (Plataforma y Base de Datos)',
      detalle: `Eliminó de la plataforma y de la base de datos al docente "${target?.nombre || id}" y su cuenta de usuario.`,
      colegioId: target?.colegioId,
    });
  };

  const assignCampusMembers = (
    campusId: string,
    colegioId: string,
    teacherIds: string[],
    studentIds: string[]
  ) => {
    const teacherSet = new Set(teacherIds);
    const studentSet = new Set(studentIds);

    setTeachers((prev) => {
      const next = prev.map((tch) => {
        if (tch.colegioId !== colegioId) return tch;
        if (teacherSet.has(tch.id)) {
          if (tch.campusId !== campusId) {
            apiClient.updateTeacher(tch.id, { campusId });
          }
          return { ...tch, campusId };
        } else if (tch.campusId === campusId) {
          apiClient.updateTeacher(tch.id, { campusId: '' });
          return { ...tch, campusId: undefined };
        }
        return tch;
      });
      saveState('teachers', next);
      return next;
    });

    setStudents((prev) => {
      const next = prev.map((st) => {
        if (st.colegioId !== colegioId) return st;
        if (studentSet.has(st.id)) {
          if (st.campusId !== campusId) {
            apiClient.updateStudent(st.id, { campusId });
          }
          return { ...st, campusId };
        } else if (st.campusId === campusId) {
          apiClient.updateStudent(st.id, { campusId: '' });
          return { ...st, campusId: undefined };
        }
        return st;
      });
      saveState('students', next);
      return next;
    });
    const cmpObj = campuses.find((c) => c.id === campusId);
    addActivityLog({
      modulo: 'Campus',
      accion: 'Asignación de Docentes y Alumnos a Campus',
      detalle: `Asignó ${teacherIds.length} docente(s) y ${studentIds.length} alumno(s) al campus "${cmpObj?.nombre || campusId}".`,
      colegioId,
    });
  };

  const addSubject = (data: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...data,
      id: 'sub-' + Date.now(),
    };
    setSubjects((prev) => {
      const next = [...prev, newSubject];
      saveState('subjects', next);
      return next;
    });
    apiClient.createSubject(newSubject);
    addActivityLog({
      modulo: 'Materias y Grupos',
      accion: 'Alta de Materia',
      detalle: `Dio de alta la materia "${newSubject.nombre}" (Clave: ${newSubject.clave}, Nivel: ${newSubject.nivel || 'General'}, Grado: ${newSubject.grado}${newSubject.grupo ? ` ${newSubject.grupo}` : ''}).`,
      colegioId: newSubject.colegioId,
    });
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    apiClient.updateSubject(id, updates);
    setSubjects((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveState('subjects', next);
      return next;
    });
  };

  const deleteSubject = (id: string) => {
    const target = subjects.find((s) => s.id === id);
    markSubjectIdAsDeleted(id);
    apiClient.deleteSubject(id);

    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveState('subjects', next);
      return next;
    });

    // Eliminar también registros de calificaciones huérfanos de esta materia eliminada
    setGrades((prev) => {
      const next = prev.filter(
        (g) =>
          g.materiaId !== id &&
          !(
            target &&
            g.colegioId === target.colegioId &&
            g.materiaNombre.trim().toLowerCase() === target.nombre.trim().toLowerCase()
          )
      );
      saveState('grades', next);
      return next;
    });

    // Limpiar la materia eliminada de los docentes y alumnos del colegio
    if (target) {
      const targetNameLower = target.nombre.trim().toLowerCase();
      setTeachers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.colegioId !== target.colegioId) return t;
          if ((t.materias || []).some((m) => m.trim().toLowerCase() === targetNameLower)) {
            changed = true;
            const filteredMaterias = (t.materias || []).filter(
              (m) => m.trim().toLowerCase() !== targetNameLower
            );
            apiClient.updateTeacher(t.id, { materias: filteredMaterias });
            return { ...t, materias: filteredMaterias };
          }
          return t;
        });
        if (changed) saveState('teachers', next);
        return changed ? next : prev;
      });

      setStudents((prev) => {
        let changed = false;
        const next = prev.map((st) => {
          if (st.colegioId !== target.colegioId) return st;
          if ((st.materiasIds || []).includes(id)) {
            changed = true;
            const filteredIds = (st.materiasIds || []).filter((mid) => mid !== id);
            apiClient.updateStudent(st.id, { materiasIds: filteredIds });
            return { ...st, materiasIds: filteredIds };
          }
          return st;
        });
        if (changed) saveState('students', next);
        return changed ? next : prev;
      });
    }

    addActivityLog({
      modulo: 'Materias y Grupos',
      accion: 'Eliminación de Materia',
      detalle: `Eliminó la materia "${target?.nombre || id}" de la plataforma y base de datos.`,
      colegioId: target?.colegioId,
    });
  };

  const getDefaultGroupsForLevel = (nivel: AcademicLevel): { grado: string; grupo: string; etiqueta: string }[] => {
    const grades = nivel === 'Primaria' ? ['1°', '2°', '3°', '4°', '5°', '6°'] : ['1°', '2°', '3°'];
    const letters = ['A', 'B', 'C'];
    const result: { grado: string; grupo: string; etiqueta: string }[] = [];
    for (const gr of grades) {
      for (const lt of letters) {
        result.push({ grado: gr, grupo: lt, etiqueta: `${gr} ${lt}` });
      }
    }
    return result;
  };

  const addCollegeGroup = (data: Omit<CollegeGroup, 'id'>): CollegeGroup => {
    const newGroup: CollegeGroup = {
      ...data,
      id: `grp-${data.colegioId}-${data.nivel}-${data.grado}-${data.grupo}-${Date.now()}`,
    };
    setCollegeGroups((prev) => {
      const exists = prev.some(
        (g) =>
          g.colegioId === data.colegioId &&
          g.nivel === data.nivel &&
          g.etiqueta.toLowerCase() === data.etiqueta.toLowerCase()
      );
      if (exists) return prev;
      const next = [...prev, newGroup];
      saveState('college_groups', next);
      return next;
    });
    addActivityLog({
      modulo: 'Materias y Grupos',
      accion: 'Alta de Grupo Escolar',
      detalle: `Registró el grupo "${newGroup.etiqueta}" para el nivel ${newGroup.nivel}.`,
      colegioId: newGroup.colegioId,
    });
    return newGroup;
  };

  const deleteCollegeGroup = (id: string) => {
    const target = collegeGroups.find((g) => g.id === id);
    setCollegeGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveState('college_groups', next);
      return next;
    });
    if (target) {
      const targetEtiquetaNorm = target.etiqueta.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const targetFullNorm = `${target.nivel} ${target.etiqueta}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

      // Limpiar grupo eliminado de los docentes que lo tuvieran asignado
      setTeachers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.colegioId !== target.colegioId) return t;
          if (t.nivel && t.nivel !== target.nivel) return t;
          const hadGroup = (t.grupos || []).some(
            (g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() === targetEtiquetaNorm
          );
          const hadTutorGroup =
            t.grupoTutorado &&
            t.grupoTutorado.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() === targetEtiquetaNorm;
          if (!hadGroup && !hadTutorGroup) return t;
          changed = true;
          const nextGroups = (t.grupos || []).filter(
            (g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() !== targetEtiquetaNorm
          );
          const nextTutorGrp = hadTutorGroup ? undefined : t.grupoTutorado;
          const nextEsTutor = hadTutorGroup ? false : t.esTutorPrincipal;
          apiClient.updateTeacher(t.id, {
            grupos: nextGroups,
            grupoTutorado: nextTutorGrp || '',
            esTutorPrincipal: nextEsTutor,
          });
          return {
            ...t,
            grupos: nextGroups,
            grupoTutorado: nextTutorGrp,
            esTutorPrincipal: nextEsTutor,
          };
        });
        if (changed) saveState('teachers', next);
        return changed ? next : prev;
      });

      // Limpiar grupo eliminado de usuarios (coordinadores / psicólogos) que lo tuvieran en gruposAsignados
      setUsers((prev) => {
        let changed = false;
        const next = prev.map((u) => {
          if (u.colegioId !== target.colegioId || !Array.isArray(u.gruposAsignados)) return u;
          const hasIt = u.gruposAsignados.some((g) => {
            const norm = g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
            return norm === targetFullNorm || norm === targetEtiquetaNorm;
          });
          if (!hasIt) return u;
          changed = true;
          const filtered = u.gruposAsignados.filter((g) => {
            const norm = g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
            return norm !== targetFullNorm && norm !== targetEtiquetaNorm;
          });
          apiClient.updateUser(u.id, { gruposAsignados: filtered });
          return { ...u, gruposAsignados: filtered };
        });
        if (changed) saveState('users', next);
        return changed ? next : prev;
      });

      addActivityLog({
        modulo: 'Materias y Grupos',
        accion: 'Baja de Grupo Escolar',
        detalle: `Eliminó el grupo "${target.etiqueta}" del nivel ${target.nivel}.`,
        colegioId: target.colegioId,
      });
    }
  };

  const getGroupsForCollegeLevel = (colegioId: string, nivel: AcademicLevel): string[] => {
    // Únicamente devuelve los grupos explícitamente dados de alta en el módulo Materias y Grupos (pestaña Grupos) para este colegio y nivel
    const customForLevel = collegeGroups.filter(
      (g) => g.colegioId === colegioId && g.nivel === nivel && g.activo
    );

    const set = new Set<string>(customForLevel.map((g) => g.etiqueta));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  };

  // Campus CRUD
  const addCampus = (data: Omit<Campus, 'id'>): Campus => {
    const newCampus: Campus = {
      ...data,
      id: 'cmp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    };
    setCampuses((prev) => [...prev, newCampus]);
    apiClient.createCampus(newCampus);
    addActivityLog({
      modulo: 'Campus',
      accion: 'Creación de Campus',
      detalle: `Creó el campus "${newCampus.nombre}" (Clave: ${newCampus.clave}).`,
      colegioId: newCampus.colegioId,
    });
    return newCampus;
  };

  const updateCampus = (id: string, updates: Partial<Campus>) => {
    const target = campuses.find((c) => c.id === id);
    apiClient.updateCampus(id, updates);
    setCampuses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    addActivityLog({
      modulo: 'Campus',
      accion: 'Actualización de Campus',
      detalle: `Actualizó la configuración del campus "${target?.nombre || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const deleteCampus = (id: string) => {
    const target = campuses.find((c) => c.id === id);
    apiClient.deleteCampus(id);
    setCampuses((prev) => prev.filter((c) => c.id !== id));
    if (selectedCampusId === id) {
      setSelectedCampusId(null);
    }
    addActivityLog({
      modulo: 'Campus',
      accion: 'Eliminación de Campus',
      detalle: `Eliminó el campus "${target?.nombre || id}".`,
      colegioId: target?.colegioId,
    });
  };

  // School Cycles CRUD
  const addSchoolCycle = (data: Omit<SchoolCycle, 'id' | 'creadoEn'>): SchoolCycle => {
    const newCycle: SchoolCycle = {
      ...data,
      id: 'ciclo-' + Date.now(),
      creadoEn: new Date().toISOString().split('T')[0],
    };
    setSchoolCycles((prev) => {
      const base = data.activo
        ? prev.map((c) => (c.colegioId === data.colegioId ? { ...c, activo: false } : c))
        : prev;
      return [newCycle, ...base];
    });
    apiClient.createSchoolCycle(newCycle);

    // Cargar automáticamente el Calendario Escolar Oficial de la SEP para este nuevo ciclo
    const startYear = parseInt(newCycle.fechaInicioClases.split('-')[0]) || 2026;
    const endYear = parseInt(newCycle.fechaFinClases.split('-')[0]) || (startYear + 1);

    const sepOfficialDays: CalendarNonSchoolDay[] = [
      { id: `sep-${newCycle.id}-1`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-09-16`, motivo: 'SEP Oficial: Aniversario de la Independencia de México (Suspensión Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-2`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-09-25`, motivo: 'SEP Oficial: 1ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-3`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-10-30`, motivo: 'SEP Oficial: 2ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-4`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-11-02`, motivo: 'SEP Oficial: Día de Muertos (Suspensión Oficial)', tipo: 'suspension_oficial', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-5`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-11-16`, motivo: 'SEP Oficial: Revolución Mexicana (Día Feriado Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-6`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-11-27`, motivo: 'SEP Oficial: 3ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-7`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${startYear}-12-21`, fechaFin: `${endYear}-01-08`, motivo: 'SEP Oficial: Periodo Vacacional de Invierno', tipo: 'vacaciones', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-8`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-01-29`, motivo: 'SEP Oficial: 4ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-9`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-02-01`, motivo: 'SEP Oficial: Día de la Constitución Mexicana (Suspensión Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-10`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-02-26`, motivo: 'SEP Oficial: 5ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-11`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-03-15`, motivo: 'SEP Oficial: Natalicio de Benito Juárez (Suspensión Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-12`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-03-22`, fechaFin: `${endYear}-04-02`, motivo: 'SEP Oficial: Periodo Vacacional de Semana Santa', tipo: 'vacaciones', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-13`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-04-30`, motivo: 'SEP Oficial: 6ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-14`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-05-01`, motivo: 'SEP Oficial: Día del Trabajo (Suspensión Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-15`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-05-05`, motivo: 'SEP Oficial: Conmemoración Batalla de Puebla (Suspensión Oficial)', tipo: 'suspension_oficial', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-16`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-05-15`, motivo: 'SEP Oficial: Día del Maestro (Suspensión Oficial)', tipo: 'dia_feriado', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-17`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-05-28`, motivo: 'SEP Oficial: 7ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-18`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: `${endYear}-06-25`, motivo: 'SEP Oficial: 8ª Sesión Ordinaria del Consejo Técnico Escolar (CTE)', tipo: 'consejo_tecnico', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
      { id: `sep-${newCycle.id}-19`, colegioId: newCycle.colegioId, cicloId: newCycle.id, fecha: newCycle.fechaFinClases, motivo: 'SEP Oficial: Fin de Clases del Ciclo Escolar', tipo: 'evento_escolar', visibleTutores: true, visibleDocentes: true, creadoPor: 'SEP Oficial' },
    ];

    setCalendarDays((prev) => {
      const filtered = prev.filter((d) => d.cicloId !== newCycle.id);
      return [...filtered, ...sepOfficialDays];
    });

    addActivityLog({
      modulo: 'Ciclo Escolar',
      accion: 'Alta de Ciclo Escolar',
      detalle: `Dio de alta el ciclo escolar "${newCycle.nombre}" (${newCycle.fechaInicioClases} a ${newCycle.fechaFinClases}) y cargó automáticamente el calendario oficial SEP.`,
      colegioId: newCycle.colegioId,
    });
    return newCycle;
  };

  const updateSchoolCycle = (id: string, updates: Partial<SchoolCycle>) => {
    apiClient.updateSchoolCycle(id, updates);
    setSchoolCycles((prev) => {
      const target = prev.find((c) => c.id === id);
      return prev.map((c) => {
        if (c.id === id) return { ...c, ...updates };
        if (updates.activo && target && c.colegioId === target.colegioId) {
          return { ...c, activo: false };
        }
        return c;
      });
    });
  };

  const deleteSchoolCycle = (id: string) => {
    apiClient.deleteSchoolCycle(id);
    setSchoolCycles((prev) => prev.filter((c) => c.id !== id));
  };

  // Calendar Non-School Days CRUD
  const addCalendarDay = (data: Omit<CalendarNonSchoolDay, 'id'>): CalendarNonSchoolDay => {
    const newDay: CalendarNonSchoolDay = {
      ...data,
      id: 'cal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    };
    setCalendarDays((prev) =>
      [...prev, newDay].sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
    apiClient.createCalendarDay(newDay);
    return newDay;
  };

  const updateCalendarDay = (id: string, updates: Partial<CalendarNonSchoolDay>) => {
    apiClient.updateCalendarDay(id, updates);
    setCalendarDays((prev) =>
      prev
        .map((d) => (d.id === id ? { ...d, ...updates } : d))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
  };

  const deleteCalendarDay = (id: string) => {
    apiClient.deleteCalendarDay(id);
    setCalendarDays((prev) => prev.filter((d) => d.id !== id));
  };

  // Group Schedules CRUD
  const saveGroupSchedule = (
    data: Omit<GroupWeekSchedule, 'id' | 'actualizadoEn'> & { id?: string }
  ): GroupWeekSchedule => {
    const nowDate = new Date().toISOString().split('T')[0];
    let savedItem: GroupWeekSchedule | null = null;
    setGroupSchedules((prev) => {
      const existingIndex = prev.findIndex(
        (s) =>
          (data.id && s.id === data.id) ||
          (s.colegioId === data.colegioId &&
            (!data.nivel || !s.nivel || s.nivel === data.nivel) &&
            s.grado === data.grado &&
            s.grupo === data.grupo &&
            s.semanaInicio === data.semanaInicio)
      );
      if (existingIndex >= 0) {
        const updated: GroupWeekSchedule = {
          ...prev[existingIndex],
          ...data,
          id: prev[existingIndex].id,
          actualizadoEn: nowDate,
        };
        savedItem = updated;
        apiClient.saveGroupSchedule(updated);
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      } else {
        const created: GroupWeekSchedule = {
          ...data,
          id: data.id || 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          actualizadoEn: nowDate,
        };
        savedItem = created;
        apiClient.saveGroupSchedule(created);
        return [created, ...prev];
      }
    });
    return (
      savedItem || {
        ...data,
        id: data.id || 'sch-' + Date.now(),
        actualizadoEn: nowDate,
      }
    );
  };

  const deleteGroupSchedule = (id: string) => {
    apiClient.deleteGroupSchedule(id);
    setGroupSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // ==========================================
  // HORARIO HABILITADO / DESHABILITADO Y SISTEMA DRIVE (EN FILA)
  // ==========================================
  const getCollegeScheduleDriveConfig = (colegioId: string): CollegeScheduleDriveConfig => {
    const existing = scheduleDriveConfigs[colegioId];
    if (existing) {
      return {
        ...existing,
        driveUsoHabilitado: existing.driveUsoHabilitado !== false,
      };
    }
    return {
      colegioId,
      driveUsoHabilitado: true,
      horarioHabilitado: true,
      modoHoraConsulta: 'reloj_actual',
      diaConsulta: 'Lunes',
      bloqueHoraConsulta: '08:00 - 08:50',
      driveAbierto: false,
      actualizadoEn: new Date().toISOString().split('T')[0],
    };
  };

  const updateCollegeScheduleDriveConfig = (
    colegioId: string,
    updates: Partial<CollegeScheduleDriveConfig>
  ) => {
    const nowDate = new Date().toISOString().split('T')[0];
    setScheduleDriveConfigs((prev) => {
      const current = prev[colegioId] || {
        colegioId,
        horarioHabilitado: true,
        modoHoraConsulta: 'reloj_actual',
        diaConsulta: 'Lunes',
        bloqueHoraConsulta: '08:00 - 08:50',
        driveAbierto: false,
        actualizadoEn: nowDate,
      };
      const updated: CollegeScheduleDriveConfig = {
        ...current,
        ...updates,
        colegioId,
        actualizadoEn: nowDate,
      };
      const next = {
        ...prev,
        [colegioId]: updated,
      };
      saveState('schedule_drive_configs', next);
      return next;
    });
  };

  const setCollegeDriveOpenStatus = (colegioId: string, isOpen: boolean) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (colegioId === 'todos') {
      const nowDate = new Date().toISOString().split('T')[0];
      setScheduleDriveConfigs((prev) => {
        const next = { ...prev };
        colleges.forEach((col) => {
          const curr = next[col.id] || {
            colegioId: col.id,
            horarioHabilitado: true,
            modoHoraConsulta: 'bloque_manual',
            diaConsulta: 'Lunes',
            bloqueHoraConsulta: '08:00 - 08:50',
            actualizadoEn: nowDate,
          };
          next[col.id] = {
            ...curr,
            driveAbierto: isOpen,
            driveAbiertoPor: isOpen ? currentUser.nombre : undefined,
            driveAbiertoRol: isOpen ? currentUser.cargo || currentUser.rol : undefined,
            driveAbiertoEn: isOpen ? nowTime : undefined,
            actualizadoEn: nowDate,
          };
        });
        saveState('schedule_drive_configs', next);
        return next;
      });
      return;
    }

    updateCollegeScheduleDriveConfig(colegioId, {
      driveAbierto: isOpen,
      driveAbiertoPor: isOpen ? currentUser.nombre : undefined,
      driveAbiertoRol: isOpen ? currentUser.cargo || currentUser.rol : undefined,
      driveAbiertoEn: isOpen ? nowTime : undefined,
    });
  };

  const isCollegeDriveOpen = (colegioId?: string | null): boolean => {
    if (colegioId && colegioId !== 'todos') {
      const cfg = scheduleDriveConfigs[colegioId];
      if (cfg && cfg.driveUsoHabilitado === false) return false;
      return Boolean(cfg?.driveAbierto);
    }
    return Object.values(scheduleDriveConfigs).some(
      (c) => c?.driveUsoHabilitado !== false && Boolean(c?.driveAbierto)
    );
  };

  const isCollegeDriveUsageEnabled = (colegioId?: string | null): boolean => {
    if (colegioId && colegioId !== 'todos') {
      return scheduleDriveConfigs[colegioId]?.driveUsoHabilitado !== false;
    }
    return true;
  };

  const toggleCollegeDriveUsageEnabled = (colegioId: string, enabled: boolean) => {
    const nowDate = new Date().toISOString().split('T')[0];
    if (colegioId === 'global' || colegioId === 'todos') {
      setScheduleDriveConfigs((prev) => {
        const next = { ...prev };
        colleges.forEach((col) => {
          const curr = next[col.id] || {
            colegioId: col.id,
            driveUsoHabilitado: true,
            horarioHabilitado: true,
            modoHoraConsulta: 'reloj_actual',
            diaConsulta: 'Lunes',
            bloqueHoraConsulta: '08:00 - 08:50',
            actualizadoEn: nowDate,
          };
          next[col.id] = {
            ...curr,
            driveUsoHabilitado: enabled,
            driveAbierto: enabled ? curr.driveAbierto : false,
            actualizadoEn: nowDate,
          };
        });
        saveState('schedule_drive_configs', next);
        return next;
      });
      addActivityLog({
        modulo: 'Permisos / Drive Escolar',
        accion: enabled
          ? 'Activación Global de Uso de Drive'
          : 'Desactivación Global de Uso de Drive',
        detalle: enabled
          ? 'Activó el uso del sistema Drive (En Fila / Entrega de Alumnos) en todos los colegios.'
          : 'Desactivó el uso del sistema Drive (En Fila / Entrega de Alumnos) en todos los colegios.',
        colegioId: null,
      });
      return;
    }

    updateCollegeScheduleDriveConfig(colegioId, {
      driveUsoHabilitado: enabled,
      ...(enabled ? {} : { driveAbierto: false }),
    });
    const colObj = colleges.find((c) => c.id === colegioId);
    addActivityLog({
      modulo: 'Permisos / Drive Escolar',
      accion: enabled
        ? 'Uso de Drive Activado en Colegio'
        : 'Uso de Drive Desactivado en Colegio',
      detalle: enabled
        ? `Activó el uso del sistema Drive en "${colObj?.nombre || colegioId}".`
        : `Desactivó el uso del sistema Drive en "${colObj?.nombre || colegioId}".`,
      colegioId,
      colegioNombre: colObj?.nombre,
    });
  };

  const toggleCollegeScheduleEnabled = (colegioId: string, enabled: boolean) => {
    updateCollegeScheduleDriveConfig(colegioId, { horarioHabilitado: enabled });
    const colObj = colleges.find((c) => c.id === colegioId);
    addActivityLog({
      modulo: 'Horarios / Drive',
      accion: enabled ? 'Horario Escolar Habilitado' : 'Horario Escolar Deshabilitado',
      detalle: enabled
        ? `Habilitó el horario escolar en "${colObj?.nombre || colegioId}" para validación de clases al presionar "En Fila".`
        : `Deshabilitó el horario escolar en "${colObj?.nombre || colegioId}"; las solicitudes "En Fila" se envían directamente a Drive sin consultar horario.`,
      colegioId,
      colegioNombre: colObj?.nombre,
    });
  };

  // Helper to parse "HH:MM - HH:MM" into start and end minutes from midnight
  const parseSlotMinutes = (slotStr: string): { start: number; end: number } | null => {
    const match = slotStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);
    return {
      start: startH * 60 + startM,
      end: endH * 60 + endM,
    };
  };

  const normalizeGradeForSchedule = (gradoRaw: string): string => {
    const m = String(gradoRaw || '').match(/(\d+)\s*°?/);
    if (m) return `${m[1]}°`;
    return String(gradoRaw || '').trim();
  };

  const normalizeGroupForSchedule = (grupoRaw: string): string => {
    return String(grupoRaw || '')
      .replace(/grupo/gi, '')
      .replace(/["']/g, '')
      .trim()
      .toUpperCase();
  };

  const findStudentActiveClassInSchedule = (
    student: Student,
    cfg: CollegeScheduleDriveConfig
  ): {
    inClass: boolean;
    cell?: ScheduleCell;
    dia: string;
    bloqueHora: string;
  } => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayMap: Record<number, DayOfWeek> = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
    };
    const clockDay: DayOfWeek = dayMap[dayIndex] || cfg.diaConsulta || 'Lunes';
    const clockTimeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const targetGrado = normalizeGradeForSchedule(student.grado);
    const targetGrupo = normalizeGroupForSchedule(student.grupo);

    // Find all schedule records for this college + level + grade + group (preferring Semana 2 / latest updated)
    const matchingSchedules = groupSchedules
      .filter(
        (s) =>
          s.colegioId === student.colegioId &&
          (!student.nivel || !s.nivel || s.nivel === student.nivel) &&
          normalizeGradeForSchedule(s.grado) === targetGrado &&
          normalizeGroupForSchedule(s.grupo) === targetGrupo
      )
      .sort((a, b) => b.semanaInicio.localeCompare(a.semanaInicio));

    // Merge blocks across matching schedules (latest week takes precedence)
    const combinedBlocks: Record<string, ScheduleCell> = {};
    [...matchingSchedules].reverse().forEach((sch) => {
      Object.entries(sch.bloques || {}).forEach(([k, v]) => {
        if (v && v.materiaNombre) {
          combinedBlocks[k] = v;
        }
      });
    });

    // Check if current clock minutes fall into any scheduled block on clockDay
    for (const [key, cell] of Object.entries(combinedBlocks)) {
      if (!key.startsWith(`${clockDay}_`)) continue;
      const slotPart = key.substring(clockDay.length + 1);
      if (slotPart.toLowerCase().includes('receso')) continue;
      const range = parseSlotMinutes(slotPart);
      if (range && currentMinutes >= range.start && currentMinutes <= range.end) {
        if (cell && cell.materiaNombre) {
          return {
            inClass: true,
            cell,
            dia: clockDay,
            bloqueHora: slotPart,
          };
        }
      }
    }

    return {
      inClass: false,
      dia: clockDay,
      bloqueHora: clockTimeStr,
    };
  };

  const triggerTutorEnFila = (options?: {
    studentIds?: string[];
    pickupTutorName?: string;
    pickupTutorParentesco?: string;
    pickupTutorTelefono?: string;
  }): TriggerEnFilaResult => {
    // 1. Find all active students linked to the current tutor
    const allLinkedStudents = students.filter((s) => {
      if (s.estatus === 'baja') return false;
      if (s.tutorId === currentUser.id) return true;
      if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
      if (
        currentUser.curpsAsociadas &&
        s.curp &&
        currentUser.curpsAsociadas.includes(s.curp.toUpperCase())
      ) {
        return true;
      }
      if (
        currentUser.correo &&
        s.tutorCorreo &&
        s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    const targetStudents =
      options?.studentIds && options.studentIds.length > 0
        ? allLinkedStudents.filter((s) => options.studentIds!.includes(s.id))
        : allLinkedStudents;

    const targetCollegeId =
      targetStudents[0]?.colegioId ||
      currentUser.colegioId ||
      activeCollege?.id ||
      'col-cervantes';
    const colObj = colleges.find((c) => c.id === targetCollegeId);
    const colNombre = colObj?.nombre || 'Colegio Oficial';
    const cfg = getCollegeScheduleDriveConfig(targetCollegeId);

    const tutorName = options?.pickupTutorName?.trim() || currentUser.nombre;
    const tutorParentesco =
      options?.pickupTutorParentesco?.trim() ||
      currentUser.parentesco ||
      'Padre / Tutor Legal';
    const tutorTelefono =
      options?.pickupTutorTelefono?.trim() ||
      currentUser.telefono ||
      targetStudents[0]?.tutorTelefono ||
      '';

    const now = new Date();
    const fechaIso = now.toISOString().split('T')[0];
    const horaStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (targetStudents.length === 0) {
      return {
        ok: false,
        driveAbierto: Boolean(cfg.driveAbierto),
        colegioId: targetCollegeId,
        colegioNombre: colNombre,
        horarioHabilitado: cfg.horarioHabilitado,
        tutorNombre: tutorName,
        tutorParentesco,
        tutorTelefono,
        horaConsulta: horaStr,
        diaConsulta: cfg.diaConsulta || 'Hoy',
        mensajeGeneral:
          'No se encontraron alumnos vinculados a tu cuenta de tutor. Por favor vincula a tu hijo(a) mediante su CURP en Mi Perfil.',
        resultadosAlumnos: [],
      };
    }

    // 2. Check if Drive usage is enabled for this college and if Drive is currently OPEN
    if (cfg.driveUsoHabilitado === false) {
      return {
        ok: false,
        driveAbierto: false,
        colegioId: targetCollegeId,
        colegioNombre: colNombre,
        horarioHabilitado: cfg.horarioHabilitado,
        tutorNombre: tutorName,
        tutorParentesco,
        tutorTelefono,
        horaConsulta: horaStr,
        diaConsulta: cfg.diaConsulta || 'Hoy',
        mensajeGeneral:
          'El uso del sistema Drive se encuentra desactivado para este colegio.',
        resultadosAlumnos: [],
      };
    }

    if (!cfg.driveAbierto) {
      return {
        ok: false,
        driveAbierto: false,
        colegioId: targetCollegeId,
        colegioNombre: colNombre,
        horarioHabilitado: cfg.horarioHabilitado,
        tutorNombre: tutorName,
        tutorParentesco,
        tutorTelefono,
        horaConsulta: horaStr,
        diaConsulta: cfg.diaConsulta || 'Hoy',
        mensajeGeneral:
          'No hay Drive abierto en este momento. Ningún perfil del colegio tiene activa la pantalla de entrega (Iniciar Drive). Por favor espera a que el colegio inicie el sistema Drive.',
        resultadosAlumnos: [],
      };
    }

    const resultadosAlumnos: EnFilaStudentCheckResult[] = [];
    const entriesToQueue: DrivePickupEntry[] = [];

    targetStudents.forEach((st) => {
      const studentFullName = `${st.nombre} ${st.apellidos}`.trim();
      const studentFoto =
        st.foto ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80';

      // Case A: Horario is NOT enabled -> Send directly to Drive without consulting the schedule
      if (!cfg.horarioHabilitado) {
        resultadosAlumnos.push({
          estudianteId: st.id,
          estudianteNombre: studentFullName,
          estudianteFoto: studentFoto,
          grado: st.grado,
          grupo: st.grupo,
          nivel: st.nivel,
          matricula: st.matricula,
          enClase: false,
          enviadoADrive: true,
        });

        entriesToQueue.push({
          id: `drive-${st.colegioId}-${st.id}`,
          colegioId: st.colegioId,
          colegioNombre: colNombre,
          estudianteId: st.id,
          estudianteNombre: studentFullName,
          estudianteFoto: studentFoto,
          estudianteGrado: st.grado,
          estudianteGrupo: st.grupo,
          estudianteNivel: st.nivel,
          estudianteMatricula: st.matricula,
          tutorId: currentUser.id,
          tutorNombre: tutorName,
          tutorParentesco,
          tutorTelefono,
          tutorCorreo: currentUser.correo || st.tutorCorreo,
          tutorAvatar: currentUser.avatar,
          horaSolicitud: horaStr,
          fechaSolicitud: fechaIso,
          timestamp: Date.now(),
          estado: 'en_fila',
        });
        return;
      }

      // Case B: Horario IS enabled -> Search student in schedule via their group
      const check = findStudentActiveClassInSchedule(st, cfg);

      if (check.inClass && check.cell) {
        // Student IS currently in a class -> Send notification to park, do NOT send to Drive
        resultadosAlumnos.push({
          estudianteId: st.id,
          estudianteNombre: studentFullName,
          estudianteFoto: studentFoto,
          grado: st.grado,
          grupo: st.grupo,
          nivel: st.nivel,
          matricula: st.matricula,
          enClase: true,
          materiaNombre: check.cell.materiaNombre,
          docenteNombre: check.cell.docenteNombre,
          aula: check.cell.aula,
          bloqueHora: check.bloqueHora,
          dia: check.dia,
          enviadoADrive: false,
        });

        sendEmailNotification({
          colegioId: st.colegioId,
          colegioNombre: colNombre,
          destinatarios: [currentUser.correo || st.tutorCorreo || 'tutor@familia.mx'],
          rolesDestino: ['tutor'],
          usuariosDestino: [
            currentUser.id,
            currentUser.correo,
            ...(currentUser.usuarioLogin ? [currentUser.usuarioLogin] : []),
          ],
          asunto: `[Aviso de Horario Escolar] ${studentFullName} se encuentra en clase de ${check.cell.materiaNombre} — Favor de estacionarse`,
          cuerpo:
            `Estimado(a) ${tutorName}:\n\n` +
            `Al presionar el botón "En Fila", el sistema consultó el horario activo del grupo ${st.grado} "${st.grupo}" y detectó que el alumno(a) ${studentFullName} se encuentra actualmente en la clase de "${check.cell.materiaNombre}" (${check.dia} · ${check.bloqueHora}${
              check.cell.aula ? ` · ${check.cell.aula}` : ''
            }, impartida por ${check.cell.docenteNombre}).\n\n` +
            `👉 Favor de estacionarse y esperar a que concluya su clase para pasar por la fila de entrega (Drive).`,
          categoria: 'asistencia',
          prioridad: 'urgente',
        });
      } else {
        // Student is NOT in class in the schedule -> Send info to Drive
        resultadosAlumnos.push({
          estudianteId: st.id,
          estudianteNombre: studentFullName,
          estudianteFoto: studentFoto,
          grado: st.grado,
          grupo: st.grupo,
          nivel: st.nivel,
          matricula: st.matricula,
          enClase: false,
          bloqueHora: check.bloqueHora,
          dia: check.dia,
          enviadoADrive: true,
        });

        entriesToQueue.push({
          id: `drive-${st.colegioId}-${st.id}`,
          colegioId: st.colegioId,
          colegioNombre: colNombre,
          estudianteId: st.id,
          estudianteNombre: studentFullName,
          estudianteFoto: studentFoto,
          estudianteGrado: st.grado,
          estudianteGrupo: st.grupo,
          estudianteNivel: st.nivel,
          estudianteMatricula: st.matricula,
          tutorId: currentUser.id,
          tutorNombre: tutorName,
          tutorParentesco,
          tutorTelefono,
          tutorCorreo: currentUser.correo || st.tutorCorreo,
          tutorAvatar: currentUser.avatar,
          horaSolicitud: horaStr,
          fechaSolicitud: fechaIso,
          timestamp: Date.now(),
          estado: 'en_fila',
        });
      }
    });

    if (entriesToQueue.length > 0) {
      setDrivePickupQueue((prev) => {
        const queuedIds = new Set(entriesToQueue.map((e) => e.id));
        const filteredPrev = prev.filter((item) => !queuedIds.has(item.id));
        const updatedQueue = [...filteredPrev, ...entriesToQueue];
        saveState('drive_pickup_queue', updatedQueue);
        return updatedQueue;
      });
    }

    const inClassItems = resultadosAlumnos.filter((r) => r.enClase);
    const sentToDriveItems = resultadosAlumnos.filter((r) => r.enviadoADrive);

    let mensajeGeneral = '';
    if (!cfg.horarioHabilitado) {
      mensajeGeneral = `El horario está deshabilitado. Se envió directamente a la pantalla Drive la solicitud para recoger a: ${sentToDriveItems
        .map((s) => `${s.estudianteNombre} (${s.grado} "${s.grupo}")`)
        .join(', ')}.`;
    } else if (inClassItems.length > 0 && sentToDriveItems.length === 0) {
      mensajeGeneral = inClassItems
        .map(
          (s) =>
            `El alumno(a) ${s.estudianteNombre} (${s.grado} "${s.grupo}") se encuentra en la clase de "${s.materiaNombre}" (${s.bloqueHora}). Favor de estacionarse.`
        )
        .join(' ');
    } else if (inClassItems.length === 0 && sentToDriveItems.length > 0) {
      mensajeGeneral = `Se verificó el horario del grupo y el alumno(a) ${sentToDriveItems
        .map((s) => `${s.estudianteNombre} (${s.grado} "${s.grupo}")`)
        .join(', ')} no se encuentra en clase. ¡Información enviada a la pantalla Drive!`;
    } else {
      mensajeGeneral =
        `Enviado a Drive: ${sentToDriveItems.map((s) => s.estudianteNombre).join(', ')}. ` +
        `En clase (Favor de estacionarse): ${inClassItems
          .map((s) => `${s.estudianteNombre} en ${s.materiaNombre}`)
          .join(', ')}.`;
    }

    addActivityLog({
      modulo: 'Fila / Drive Escolar',
      accion:
        inClassItems.length > 0 && sentToDriveItems.length === 0
          ? 'Aviso En Clase (Favor de Estacionarse)'
          : 'Tutor En Fila -> Enviado a Drive',
      detalle: mensajeGeneral,
      colegioId: targetCollegeId,
      colegioNombre: colNombre,
    });

    return {
      ok: true,
      driveAbierto: true,
      colegioId: targetCollegeId,
      colegioNombre: colNombre,
      horarioHabilitado: cfg.horarioHabilitado,
      tutorNombre: tutorName,
      tutorParentesco,
      tutorTelefono,
      horaConsulta: resultadosAlumnos[0]?.bloqueHora || horaStr,
      diaConsulta: resultadosAlumnos[0]?.dia || cfg.diaConsulta || 'Hoy',
      mensajeGeneral,
      resultadosAlumnos,
    };
  };

  const markDriveStudentDelivered = (entryId: string) => {
    const horaEntrega = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setDrivePickupQueue((prev) => {
      const updated = prev.map((item) =>
        item.id === entryId
          ? {
              ...item,
              estado: 'entregado' as const,
              horaEntrega,
              entregadoPor: currentUser.nombre,
            }
          : item
      );
      saveState('drive_pickup_queue', updated);
      return updated;
    });
  };

  const removeDriveQueueEntry = (entryId: string) => {
    setDrivePickupQueue((prev) => {
      const updated = prev.filter((item) => item.id !== entryId);
      saveState('drive_pickup_queue', updated);
      return updated;
    });
  };

  const clearDeliveredDriveEntries = (colegioId?: string | null) => {
    setDrivePickupQueue((prev) => {
      const updated = prev.filter((item) => {
        if (item.estado !== 'entregado') return true;
        if (colegioId && item.colegioId !== colegioId) return true;
        return false;
      });
      saveState('drive_pickup_queue', updated);
      return updated;
    });
  };

  // Monthly Tuition Payment Toggle
  const toggleMonthlyTuitionPayment = (
    colegioId: string,
    estudianteId: string,
    mesClave: string,
    mesEtiqueta: string,
    montoColegiatura: number,
    pagado: boolean,
    details?: {
      fechaPago?: string;
      metodoPago?: string;
      folioRecibo?: string;
    }
  ) => {
    if (pagado) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === estudianteId && s.estatus === 'pendiente'
            ? { ...s, estatus: 'activo' }
            : s
        )
      );
      apiClient.updateStudent(estudianteId, { estatus: 'activo' });
    }
    setMonthlyTuitions((prev) => {
      const existing = prev.find(
        (m) => m.colegioId === colegioId && m.estudianteId === estudianteId && m.mesClave === mesClave
      );
      let next: MonthlyTuitionRecord[];
      if (existing) {
        const updatedRec: MonthlyTuitionRecord = {
          ...existing,
          pagado,
          montoColegiatura,
          fechaPago: pagado
            ? details?.fechaPago || existing.fechaPago || new Date().toISOString().split('T')[0]
            : undefined,
          metodoPago: pagado
            ? details?.metodoPago || existing.metodoPago || 'Caja Escolar / SPEI'
            : undefined,
          folioRecibo: pagado
            ? details?.folioRecibo ||
              existing.folioRecibo ||
              `REC-${mesClave.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
            : undefined,
        };
        apiClient.saveMonthlyTuition(updatedRec);
        next = prev.map((m) => (m.id === existing.id ? updatedRec : m));
      } else {
        const newRec: MonthlyTuitionRecord = {
          id: `tui-${mesClave}-${estudianteId}-${Date.now()}`,
          colegioId,
          estudianteId,
          mesClave,
          mesEtiqueta,
          montoColegiatura,
          pagado,
          fechaPago: pagado
            ? details?.fechaPago || new Date().toISOString().split('T')[0]
            : undefined,
          metodoPago: pagado
            ? details?.metodoPago || 'Caja Escolar / SPEI'
            : undefined,
          folioRecibo: pagado
            ? details?.folioRecibo ||
              `REC-${mesClave.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
            : undefined,
        };
        apiClient.saveMonthlyTuition(newRec);
        next = [...prev, newRec];
      }
      saveState('monthly_tuitions', next);
      return next;
    });
  };

  // Billing Concepts (Módulo Cobros) CRUD
  const addBillingConcept = (data: Omit<BillingConcept, 'id' | 'creadoEn'>): BillingConcept => {
    const newConcept: BillingConcept = {
      ...data,
      id: 'cob-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      creadoEn: new Date().toISOString().split('T')[0],
    };
    setBillingConcepts((prev) => {
      const next = [newConcept, ...prev];
      saveState('billing_concepts', next);
      return next;
    });
    apiClient.createBillingConcept(newConcept);
    addActivityLog({
      modulo: 'Cobros',
      accion: newConcept.programadoParaFuturo
        ? 'Programación de Concepto de Cobro Futuro'
        : newConcept.esRecurrenteMensual
        ? 'Alta de Cobro Recurrente Mensual'
        : 'Alta de Concepto de Cobro',
      detalle: `Dio de alta el cobro "${newConcept.concepto}" por $${newConcept.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN${
        newConcept.esRecurrenteMensual
          ? ` (Recurrente cada mes, fecha de cobro: ${newConcept.fechaCobroMensual || `Día ${newConcept.diaCobroMensual || 10}`})`
          : ''
      }${
        newConcept.programadoParaFuturo && newConcept.fechaProgramadaPublicacion
          ? ` — Programado para activarse el ${newConcept.fechaProgramadaPublicacion} a las ${newConcept.horaProgramadaPublicacion || '08:00'} hrs`
          : ''
      }.`,
      colegioId: newConcept.colegioId,
    });
    return newConcept;
  };

  const updateBillingConcept = (id: string, updates: Partial<BillingConcept>) => {
    const target = billingConcepts.find((c) => c.id === id);
    apiClient.updateBillingConcept(id, updates);
    setBillingConcepts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveState('billing_concepts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros',
      accion: 'Actualización de Concepto de Cobro',
      detalle: `Modificó el concepto de cobro "${target?.concepto || id}"${
        updates.programadoParaFuturo && updates.fechaProgramadaPublicacion
          ? ` (Programado para el ${updates.fechaProgramadaPublicacion} a las ${updates.horaProgramadaPublicacion || '08:00'} hrs)`
          : ''
      }.`,
      colegioId: target?.colegioId,
    });
  };

  const deleteBillingConcept = (id: string) => {
    const target = billingConcepts.find((c) => c.id === id);
    apiClient.deleteBillingConcept(id);
    setBillingConcepts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveState('billing_concepts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros',
      accion: 'Eliminación de Concepto de Cobro',
      detalle: `Eliminó el concepto de cobro "${target?.concepto || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const requestDeleteBillingConcept = (id: string, motivo?: string) => {
    const target = billingConcepts.find((c) => c.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updates: Partial<BillingConcept> = {
      solicitudEliminacion: {
        solicitadoPorId: currentUser.id,
        solicitadoPorNombre: currentUser.nombre,
        solicitadoPorRol: currentUser.rol,
        fechaSolicitud: nowStr,
        motivo,
      },
    };
    updateBillingConcept(id, updates);
    addActivityLog({
      modulo: 'Cobros',
      accion: 'Solicitud de Eliminación de Concepto',
      detalle: `El usuario ${currentUser.nombre} (${currentUser.rol}) solicitó eliminar el concepto de cobro "${target.concepto}". Pendiente de autorización del Administrador.`,
      colegioId: target.colegioId,
    });
  };

  const cancelDeleteBillingConceptRequest = (id: string) => {
    const target = billingConcepts.find((c) => c.id === id);
    if (!target) return;
    updateBillingConcept(id, { solicitudEliminacion: undefined });
  };

  // ==========================================
  // DESCUENTOS Y BECAS (CONTROL ESCOLAR Y ADMINISTRADOR)
  // ==========================================
  const addStudentDiscount = (
    data: Omit<StudentDiscount, 'id' | 'fechaSolicitud' | 'estatus'> & { estatus?: DiscountStatus }
  ): StudentDiscount => {
    // Si lo crea Control Escolar, requiere autorización del Administrador ('pendiente_aprobacion')
    // Si lo crea Administrador, Superusuario o Soporte, queda directamente 'aprobado'
    const isControlEscolar = currentUser.rol === 'control_escolar';
    const resolvedStatus: DiscountStatus =
      data.estatus || (isControlEscolar ? 'pendiente_aprobacion' : 'aprobado');

    const newDiscount: StudentDiscount = {
      ...data,
      id: 'desc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fechaSolicitud: new Date().toISOString().split('T')[0],
      estatus: resolvedStatus,
      solicitadoPorId: currentUser.id,
      solicitadoPorNombre: currentUser.nombre,
      solicitadoPorRol: currentUser.rol,
      autorizadoPorId: !isControlEscolar ? currentUser.id : undefined,
      autorizadoPorNombre: !isControlEscolar ? currentUser.nombre : undefined,
      fechaResolucion: !isControlEscolar ? new Date().toISOString().split('T')[0] : undefined,
      activo: data.activo ?? true,
    };

    setStudentDiscounts((prev) => {
      const next = [newDiscount, ...prev];
      saveState('student_discounts', next);
      return next;
    });
    apiClient.createStudentDiscount(newDiscount);

    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: isControlEscolar
        ? 'Solicitud de Descuento (Pendiente de Autorización de Administrador)'
        : 'Alta y Aplicación de Descuento Directo',
      detalle: `${
        isControlEscolar ? 'Solicitó' : 'Registró y aplicó'
      } el descuento "${newDiscount.nombreDescuento}" (${
        newDiscount.tipoDescuento === 'porcentaje' ? `${newDiscount.valor}%` : `$${newDiscount.valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
      }) para ${newDiscount.alumnosIds.length} alumno(s) en concepto "${newDiscount.conceptoNombre}".`,
      colegioId: newDiscount.colegioId,
    });

    return newDiscount;
  };

  const updateStudentDiscount = (id: string, updates: Partial<StudentDiscount>) => {
    const target = studentDiscounts.find((d) => d.id === id);
    apiClient.updateStudentDiscount(id, updates);
    setStudentDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveState('student_discounts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: 'Modificación de Descuento',
      detalle: `Modificó el descuento "${target?.nombreDescuento || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const deleteStudentDiscount = (id: string) => {
    const target = studentDiscounts.find((d) => d.id === id);
    apiClient.deleteStudentDiscount(id);
    setStudentDiscounts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveState('student_discounts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: 'Eliminación de Descuento',
      detalle: `Eliminó el descuento "${target?.nombreDescuento || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const requestDeleteStudentDiscount = (id: string, motivo?: string) => {
    const target = studentDiscounts.find((d) => d.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updates: Partial<StudentDiscount> = {
      solicitudEliminacion: {
        solicitadoPorId: currentUser.id,
        solicitadoPorNombre: currentUser.nombre,
        solicitadoPorRol: currentUser.rol,
        fechaSolicitud: nowStr,
        motivo,
      },
    };
    updateStudentDiscount(id, updates);
    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: 'Solicitud de Eliminación de Descuento',
      detalle: `El usuario ${currentUser.nombre} (${currentUser.rol}) solicitó eliminar el descuento "${target.nombreDescuento}". Pendiente de autorización del Administrador.`,
      colegioId: target.colegioId,
    });
  };

  const cancelDeleteStudentDiscountRequest = (id: string) => {
    const target = studentDiscounts.find((d) => d.id === id);
    if (!target) return;
    updateStudentDiscount(id, { solicitudEliminacion: undefined });
  };

  const approveStudentDiscount = (id: string) => {
    const target = studentDiscounts.find((d) => d.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updates: Partial<StudentDiscount> = {
      estatus: 'aprobado',
      autorizadoPorId: currentUser.id,
      autorizadoPorNombre: currentUser.nombre,
      fechaResolucion: nowStr,
    };
    apiClient.updateStudentDiscount(id, updates);
    setStudentDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveState('student_discounts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: 'Autorización de Descuento (Administrador)',
      detalle: `El Administrador "${currentUser.nombre}" autorizó el descuento "${target.nombreDescuento}" solicitado por ${target.solicitadoPorNombre || 'Control Escolar'}. El descuento ahora está activo para ${target.alumnosIds.length} alumno(s).`,
      colegioId: target.colegioId,
    });
  };

  const rejectStudentDiscount = (id: string) => {
    const target = studentDiscounts.find((d) => d.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updates: Partial<StudentDiscount> = {
      estatus: 'rechazado',
      autorizadoPorId: currentUser.id,
      autorizadoPorNombre: currentUser.nombre,
      fechaResolucion: nowStr,
    };
    apiClient.updateStudentDiscount(id, updates);
    setStudentDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveState('student_discounts', next);
      return next;
    });
    addActivityLog({
      modulo: 'Cobros / Descuentos',
      accion: 'Rechazo de Solicitud de Descuento',
      detalle: `El Administrador "${currentUser.nombre}" rechazó el descuento "${target.nombreDescuento}" solicitado por ${target.solicitadoPorNombre || 'Control Escolar'}.`,
      colegioId: target.colegioId,
    });
  };

  const getEffectiveStudentPrice = (
    colegioId: string,
    studentId: string,
    basePrice: number,
    conceptoId?: string
  ): { finalPrice: number; discountAmount: number; appliedDiscounts: StudentDiscount[] } => {
    if (!studentId || basePrice <= 0) {
      return { finalPrice: basePrice, discountAmount: 0, appliedDiscounts: [] };
    }
    // Only discounts that are approved, active and linked to this college and student
    const activeDiscounts = studentDiscounts.filter((d) => {
      if (!d.activo || d.estatus !== 'aprobado' || d.colegioId !== colegioId) return false;
      if (!d.alumnosIds.includes(studentId)) return false;
      if (conceptoId && d.conceptoId !== 'todos' && d.conceptoId !== conceptoId) return false;
      return true;
    });

    let currentPrice = basePrice;
    let totalDiscount = 0;

    activeDiscounts.forEach((d) => {
      if (d.tipoDescuento === 'porcentaje') {
        const pct = Math.min(100, Math.max(0, d.valor));
        const disc = (basePrice * pct) / 100;
        totalDiscount += disc;
      } else {
        const fix = Math.max(0, d.valor);
        totalDiscount += fix;
      }
    });

    const finalPrice = Math.max(0, Number((basePrice - totalDiscount).toFixed(2)));
    const discountAmount = Number((basePrice - finalPrice).toFixed(2));

    return {
      finalPrice,
      discountAmount,
      appliedDiscounts: activeDiscounts,
    };
  };

  // ==========================================
  // EVALUACIONES: CONCEPTOS (100%) Y REGISTROS DE LIBRETA DOCENTE
  // ==========================================
  const addEvaluationConcept = (
    data: Omit<EvaluationConceptItem, 'id'>
  ): EvaluationConceptItem => {
    const clampedPct = Math.max(0, Math.min(100, Number(data.porcentaje) || 0));
    const newConcept: EvaluationConceptItem = {
      ...data,
      porcentaje: clampedPct,
      id: 'eval-conc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    };

    setEvaluationConcepts((prev) => {
      const existingCollegeConcepts = prev.filter(
        (c) => c.colegioId === data.colegioId && c.activo
      );

      if (existingCollegeConcepts.length === 0 || clampedPct <= 0) {
        return [...prev, newConcept];
      }

      // Subtract newConcept.porcentaje equally from existing concepts so total never exceeds 100%
      const remainingPool = Math.max(0, Number((100 - clampedPct).toFixed(1)));
      const count = existingCollegeConcepts.length;
      const subtractEach = clampedPct / count;

      // Subtract equally from each existing concept, then normalize to remainingPool so sum === 100%
      const rawUpdated = existingCollegeConcepts.map((c) => ({
        id: c.id,
        val: Math.max(0, Number((c.porcentaje - subtractEach).toFixed(1))),
      }));

      const rawSum = rawUpdated.reduce((acc, item) => acc + item.val, 0);
      const pctMap: Record<string, number> = {};

      if (rawSum > 0) {
        let running = 0;
        rawUpdated.forEach((item, idx) => {
          if (idx === count - 1) {
            pctMap[item.id] = Math.max(0, Number((remainingPool - running).toFixed(1)));
          } else {
            const scaled = Number(((item.val / rawSum) * remainingPool).toFixed(1));
            pctMap[item.id] = scaled;
            running += scaled;
          }
        });
      } else {
        const equalShare = Math.floor((remainingPool / count) * 10) / 10;
        let running = 0;
        existingCollegeConcepts.forEach((c, idx) => {
          if (idx === count - 1) {
            pctMap[c.id] = Math.max(0, Number((remainingPool - running).toFixed(1)));
          } else {
            pctMap[c.id] = equalShare;
            running += equalShare;
          }
        });
      }

      const updatedPrev = prev.map((c) => {
        if (pctMap[c.id] !== undefined) {
          const updatedC = { ...c, porcentaje: pctMap[c.id] };
          apiClient.updateEvaluationConcept(c.id, { porcentaje: pctMap[c.id] });
          return updatedC;
        }
        return c;
      });

      apiClient.createEvaluationConcept(newConcept);
      return [...updatedPrev, newConcept];
    });

    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Alta de Concepto de Evaluación (Resta Equitativa del 100%)',
      detalle: `Creó el concepto de evaluación "${newConcept.nombre}" con ${newConcept.porcentaje}% y restó equitativamente ese porcentaje a los conceptos existentes.`,
      colegioId: newConcept.colegioId,
    });
    return newConcept;
  };

  const updateEvaluationConcept = (id: string, updates: Partial<EvaluationConceptItem>) => {
    const target = evaluationConcepts.find((c) => c.id === id);
    apiClient.updateEvaluationConcept(id, updates);
    setEvaluationConcepts((prev) => {
      if (updates.porcentaje !== undefined && target) {
        const otherSum = prev
          .filter((c) => c.colegioId === target.colegioId && c.activo && c.id !== id)
          .reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);
        const maxAllowed = Math.max(0, Number((100 - otherSum).toFixed(1)));
        const clampedVal = Math.max(0, Math.min(maxAllowed, Number(updates.porcentaje) || 0));
        return prev.map((c) =>
          c.id === id ? { ...c, ...updates, porcentaje: clampedVal } : c
        );
      }
      return prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
    });
    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Modificación de Concepto de Evaluación',
      detalle: `Actualizó el concepto "${target?.nombre || id}"${
        updates.porcentaje !== undefined ? ` al ${updates.porcentaje}%` : ''
      }.`,
      colegioId: target?.colegioId,
    });
  };

  const deleteEvaluationConcept = (id: string) => {
    const target = evaluationConcepts.find((c) => c.id === id);
    apiClient.deleteEvaluationConcept(id);
    setEvaluationConcepts((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (!target) return remaining;

      // Auto-distribute 100% among remaining active concepts of the same college
      const collegeRemaining = remaining.filter(
        (c) => c.colegioId === target.colegioId && c.activo
      );
      if (collegeRemaining.length === 0) return remaining;

      const count = collegeRemaining.length;
      const base = Math.floor((100 / count) * 10) / 10;
      let runningSum = 0;
      const pctMap: Record<string, number> = {};

      collegeRemaining.forEach((c, idx) => {
        if (idx === count - 1) {
          pctMap[c.id] = Number((100 - runningSum).toFixed(1));
        } else {
          pctMap[c.id] = base;
          runningSum += base;
        }
      });

      return remaining.map((c) =>
        pctMap[c.id] !== undefined ? { ...c, porcentaje: pctMap[c.id] } : c
      );
    });
    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Eliminación de Concepto y Reparto Automático del 100%',
      detalle: `Eliminó el concepto de evaluación "${target?.nombre || id}" y repartió automáticamente el 100% entre los conceptos restantes.`,
      colegioId: target?.colegioId,
    });
  };

  const saveEvaluationPeriod = (params: {
    colegioId: string;
    cicloId?: string;
    docenteId?: string;
    docenteNombre?: string;
    periodicidad: EvaluationPeriodicity;
    periodoIndex: number;
    periodoNombre: string;
    modoSeleccionFecha?: 'mes_completo' | 'rango_fechas';
    fechaInicio?: string;
    fechaFin?: string;
    conceptos: EvaluationConceptItem[];
    id?: string;
  }): EvaluationSavedPeriod => {
    const nowStr = new Date().toISOString().split('T')[0];
    const ownerDocId = params.docenteId || currentUser.id;
    const ownerDocName = params.docenteNombre || currentUser.nombre;
    const effectiveCicloId =
      params.cicloId ||
      schoolCycles.find((c) => c.colegioId === params.colegioId && c.activo)?.id ||
      schoolCycles.find((c) => c.colegioId === params.colegioId)?.id ||
      '';

    const existing = evaluationSavedPeriods.find(
      (p) =>
        (params.id && p.id === params.id) ||
        (p.colegioId === params.colegioId &&
          (!effectiveCicloId || !p.cicloId || p.cicloId === effectiveCicloId) &&
          (p.docenteId || '') === (ownerDocId || '') &&
          p.periodicidad === params.periodicidad &&
          p.periodoIndex === params.periodoIndex &&
          p.periodoNombre === params.periodoNombre)
    );

    const periodId =
      existing?.id ||
      params.id ||
      `eval-per-${params.colegioId}-${effectiveCicloId || 'ciclo'}-${ownerDocId}-${params.periodicidad}-P${params.periodoIndex}-${Date.now()}`;

    const savedObj: EvaluationSavedPeriod = {
      id: periodId,
      colegioId: params.colegioId,
      cicloId: effectiveCicloId,
      docenteId: ownerDocId,
      docenteNombre: ownerDocName,
      periodicidad: params.periodicidad,
      periodoIndex: params.periodoIndex,
      periodoNombre: params.periodoNombre,
      modoSeleccionFecha: params.modoSeleccionFecha || 'mes_completo',
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin,
      conceptos: params.conceptos.map((c) => ({
        ...c,
        colegioId: params.colegioId,
        cicloId: effectiveCicloId,
        docenteId: ownerDocId,
        periodicidad: params.periodicidad,
        periodoIndex: params.periodoIndex,
        periodoNombre: params.periodoNombre,
        savedPeriodId: periodId,
      })),
      creadoEn: existing?.creadoEn || nowStr,
      actualizadoEn: nowStr,
    };

    setEvaluationSavedPeriods((prev) => {
      const idx = prev.findIndex((p) => p.id === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedObj;
        return next;
      }
      return [...prev, savedObj];
    });
    apiClient.saveEvaluationPeriod(savedObj);

    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Guardado de Periodo y Conceptos de Evaluación',
      detalle: `Guardó el periodo de evaluación "${EVALUATION_PERIODICITY_CONFIG[params.periodicidad]?.label || params.periodicidad} - ${params.periodoNombre}" (${ownerDocName}) con ${params.conceptos.length} conceptos (100%).`,
      colegioId: params.colegioId,
    });

    return savedObj;
  };

  const deleteEvaluationPeriod = (id: string) => {
    const target = evaluationSavedPeriods.find((p) => p.id === id);
    apiClient.deleteEvaluationPeriod(id);
    const remainingPeriodsForCollege = evaluationSavedPeriods.filter(
      (p) => p.id !== id && (!target || p.colegioId === target.colegioId)
    );
    setEvaluationSavedPeriods((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveState('evaluation_saved_periods', next);
      return next;
    });
    if (target) {
      const colId = target.colegioId;
      const perMod = target.periodicidad;
      const pIdx = Number(target.periodoIndex) || 1;
      const targetDocId = target.docenteId || '';

      // Eliminar las evaluaciones de alumnos vinculadas a este periodo específico eliminado
      setStudentEvaluations((prev) => {
        const toDelete = prev.filter(
          (e) =>
            e.id.endsWith(`_${id}`) ||
            (e.colegioId === colId &&
              e.periodicidad === perMod &&
              Number(e.periodoIndex) === pIdx &&
              (!targetDocId || !e.docenteId || e.docenteId === targetDocId))
        );
        toDelete.forEach((e) => apiClient.deleteStudentEvaluation(e.id));
        const next = prev.filter(
          (e) =>
            !e.id.endsWith(`_${id}`) &&
            !(
              e.colegioId === colId &&
              e.periodicidad === perMod &&
              Number(e.periodoIndex) === pIdx &&
              (!targetDocId || !e.docenteId || e.docenteId === targetDocId)
            )
        );
        saveState('student_evaluations', next);
        return next;
      });

      // Si ya no quedan periodos guardados en este colegio, limpiar todas las calificaciones del colegio
      if (remainingPeriodsForCollege.length === 0) {
        setGrades((prev) => {
          const next = prev.filter((g) => g.colegioId !== colId);
          saveState('grades', next);
          return next;
        });
        fetch(`/api/grades/clear-college/${encodeURIComponent(colId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      } else {
        // Poner en 0 la calificación de este periodo eliminado en las boletas y borrar el registro si queda todo en 0
        setGrades((prev) => {
          const next: GradeRecord[] = [];
          prev.forEach((g) => {
            if (g.colegioId !== colId) {
              next.push(g);
              return;
            }
            const modMap = { ...(g.periodosPorModalidad || {}) };
            if (Array.isArray(modMap[perMod])) {
              const arr = [...modMap[perMod]!];
              if (pIdx - 1 >= 0 && pIdx - 1 < arr.length) {
                arr[pIdx - 1] = 0;
              }
              modMap[perMod] = arr;
            }
            const allNonZero = Object.values(modMap)
              .flat()
              .map((v) => Number(v) || 0)
              .filter((v) => v > 0);
            if (allNonZero.length === 0) {
              apiClient.deleteGrade(g.id);
              return;
            }
            const newAvg = Number(
              (allNonZero.reduce((a, b) => a + b, 0) / allNonZero.length).toFixed(1)
            );
            const updatedG: GradeRecord = {
              ...g,
              promedioFinal: newAvg,
              periodosPorModalidad: modMap,
              ...(pIdx === 1 ? { periodo1: 0 } : {}),
              ...(pIdx === 2 ? { periodo2: 0 } : {}),
              ...(pIdx === 3 ? { periodo3: 0 } : {}),
            };
            apiClient.updateGrade(g.id, {
              promedioFinal: newAvg,
              periodosPorModalidad: modMap,
              ...(pIdx === 1 ? { periodo1: 0 } : {}),
              ...(pIdx === 2 ? { periodo2: 0 } : {}),
              ...(pIdx === 3 ? { periodo3: 0 } : {}),
            });
            next.push(updatedG);
          });
          saveState('grades', next);
          return next;
        });
      }
      addActivityLog({
        modulo: 'Evaluaciones',
        accion: 'Eliminación de Periodo Guardado',
        detalle: `Eliminó el periodo guardado "${target.periodoNombre}" y sus calificaciones asociadas en la base de datos.`,
        colegioId: target.colegioId,
      });
    }
  };

  // ==========================================
  // MÓDULO PERFILES (CREACIÓN DE ROLES Y ASIGNACIÓN DE MÓDULOS)
  // ==========================================
  const allRolesConfig: Record<string, RoleDefinition> = React.useMemo(() => {
    const merged: Record<string, RoleDefinition> = { ...ROLES_CONFIG };
    customRoles.forEach((cr) => {
      merged[cr.id] = cr;
    });
    return merged;
  }, [customRoles]);

  const addCustomRole = (params: {
    label: string;
    descripcion: string;
    badgeBg?: string;
    badgeText?: string;
    esGlobal?: boolean;
    modulosAsignados: string[];
  }): RoleDefinition => {
    const slug =
      'perfil_' +
      params.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') +
      '_' +
      Math.floor(100 + Math.random() * 900);

    const newRole: RoleDefinition = {
      id: slug,
      label: params.label.trim(),
      descripcion:
        params.descripcion.trim() ||
        `Perfil personalizado con acceso a ${params.modulosAsignados.length} módulos.`,
      badgeBg: params.badgeBg || 'bg-violet-100',
      badgeText: params.badgeText || 'text-violet-900 border-violet-300',
      esGlobal: Boolean(params.esGlobal),
      esPersonalizado: true,
      creadoEn: new Date().toISOString().split('T')[0],
    };

    setCustomRoles((prev) => [...prev, newRole]);

    // Save module permissions for this role in global and college maps
    const nextGlobalPerms: RolePermissionsMap = {
      ...rolePermissions,
      [slug]: params.modulosAsignados,
    };
    setRolePermissions(nextGlobalPerms);
    saveState('role_permissions', nextGlobalPerms);

    setCollegeRolePermissions((prevColPerms) => {
      const updatedColPerms: CollegeRolePermissionsMap = { ...prevColPerms };
      Object.keys(updatedColPerms).forEach((colId) => {
        updatedColPerms[colId] = {
          ...updatedColPerms[colId],
          [slug]: params.modulosAsignados,
        };
      });
      saveState('college_role_permissions', updatedColPerms);
      return updatedColPerms;
    });

    addActivityLog({
      modulo: 'Perfiles',
      accion: 'Alta de Nuevo Perfil / Rol de Usuario',
      detalle: `Creó el perfil de usuario "${newRole.label}" y le asignó ${params.modulosAsignados.length} módulos del sistema.`,
      colegioId: null,
      colegioNombre: 'Panel General',
    });

    return newRole;
  };

  const updateCustomRole = (
    id: string,
    updates: Partial<RoleDefinition>,
    modulosAsignados?: string[]
  ) => {
    setCustomRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    if (modulosAsignados) {
      const nextGlobalPerms: RolePermissionsMap = {
        ...rolePermissions,
        [id]: modulosAsignados,
      };
      setRolePermissions(nextGlobalPerms);
      saveState('role_permissions', nextGlobalPerms);

      setCollegeRolePermissions((prevColPerms) => {
        const updatedColPerms: CollegeRolePermissionsMap = { ...prevColPerms };
        Object.keys(updatedColPerms).forEach((colId) => {
          updatedColPerms[colId] = {
            ...updatedColPerms[colId],
            [id]: modulosAsignados,
          };
        });
        saveState('college_role_permissions', updatedColPerms);
        return updatedColPerms;
      });
    }
    addActivityLog({
      modulo: 'Perfiles',
      accion: 'Actualización de Perfil de Usuario',
      detalle: `Actualizó la configuración y módulos asignados del perfil "${updates.label || id}".`,
      colegioId: null,
      colegioNombre: 'Panel General',
    });
  };

  const deleteCustomRole = (id: string) => {
    const target = customRoles.find((r) => r.id === id);
    if (!target) return;
    setCustomRoles((prev) => prev.filter((r) => r.id !== id));
    addActivityLog({
      modulo: 'Perfiles',
      accion: 'Eliminación de Perfil de Usuario',
      detalle: `Eliminó el perfil personalizado "${target.label}".`,
      colegioId: null,
      colegioNombre: 'Panel General',
    });
  };

  const updateEvaluationConceptPercentages = (updates: Record<string, number>) => {
    Object.entries(updates).forEach(([cid, pct]) => {
      apiClient.updateEvaluationConcept(cid, {
        porcentaje: Math.max(0, Math.min(100, Number(pct))),
      });
    });
    setEvaluationConcepts((prev) =>
      prev.map((c) =>
        updates[c.id] !== undefined
          ? { ...c, porcentaje: Math.max(0, Math.min(100, Number(updates[c.id]))) }
          : c
      )
    );
    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Ajuste de Porcentajes de Evaluación (100%)',
      detalle: `Actualizó la distribución de porcentajes de los conceptos de evaluación.`,
      colegioId: activeCollege?.id || null,
    });
  };

  const setCollegeEvaluationPeriodicity = (
    collegeId: string,
    periodicidad: EvaluationPeriodicity
  ) => {
    const colObj = colleges.find((c) => c.id === collegeId);
    apiClient.updateCollege(collegeId, { periodicidadEvaluacion: periodicidad } as any);
    setColleges((prev) =>
      prev.map((c) => (c.id === collegeId ? { ...c, periodicidadEvaluacion: periodicidad } : c))
    );
    setEvaluationConcepts((prev) =>
      prev.map((c) => (c.colegioId === collegeId ? { ...c, periodicidad } : c))
    );
    addActivityLog({
      modulo: 'Evaluaciones y Boletas',
      accion: 'Cambio de Periodicidad de Evaluación y Boletas',
      detalle: `Configuró la modalidad de evaluación y emisión de boletas como "${EVALUATION_PERIODICITY_CONFIG[periodicidad].label}" para ${colObj?.nombre || collegeId}.`,
      colegioId: collegeId,
      colegioNombre: colObj?.nombre,
    });
  };

  const saveStudentEvaluation = (
    entry: Omit<StudentEvaluationEntry, 'id' | 'actualizadoEn'> & { id?: string }
  ): StudentEvaluationEntry => {
    const effectiveCicloId =
      entry.cicloId ||
      schoolCycles.find((c) => c.colegioId === entry.colegioId && c.activo)?.id ||
      schoolCycles.find((c) => c.colegioId === entry.colegioId)?.id ||
      '';

    const entryId =
      entry.id ||
      `${entry.colegioId}_${effectiveCicloId || 'ciclo'}_${entry.estudianteId}_${entry.materiaId}_${entry.periodicidad}_P${entry.periodoIndex}`;
    const saved: StudentEvaluationEntry = {
      ...entry,
      cicloId: effectiveCicloId,
      id: entryId,
      actualizadoEn: new Date().toISOString().split('T')[0],
    };

    setStudentEvaluations((prev) => {
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    apiClient.saveStudentEvaluation(saved);

    // Also synchronize with GradeRecord so official report cards (Boletas) reflect this evaluation!
    const subj = subjects.find((s) => s.id === entry.materiaId);
    const materiaNombre = subj?.nombre || 'Evaluación General';
    const meta = EVALUATION_PERIODICITY_CONFIG[entry.periodicidad];
    const pIdx = Math.max(1, Math.min(meta.periodCount, entry.periodoIndex)) - 1;
    const finalScore = Number(saved.calificacionFinalPeriodo.toFixed(1));

    setGrades((prevGrades) => {
      const existingGrade = prevGrades.find(
        (g) =>
          g.colegioId === entry.colegioId &&
          g.estudianteId === entry.estudianteId &&
          (g.materiaId === entry.materiaId || g.materiaNombre === materiaNombre) &&
          (!effectiveCicloId || !g.cicloId || g.cicloId === effectiveCicloId)
      );

      if (existingGrade) {
        const currentModalidadArr =
          existingGrade.periodosPorModalidad?.[entry.periodicidad] ||
          Array.from({ length: meta.periodCount }, () => 0);
        const updatedArr = [...currentModalidadArr];
        while (updatedArr.length < meta.periodCount) {
          updatedArr.push(0);
        }
        updatedArr[pIdx] = finalScore;

        const nonZeroScores = updatedArr.filter((v) => v > 0);
        const avg =
          nonZeroScores.length > 0
            ? Number(
                (
                  nonZeroScores.reduce((acc, v) => acc + v, 0) / nonZeroScores.length
                ).toFixed(1)
              )
            : 0;

        const p1 = entry.periodoIndex === 1 ? finalScore : (existingGrade.periodo1 || 0);
        const p2 = entry.periodoIndex === 2 ? finalScore : (existingGrade.periodo2 || 0);
        const p3 = entry.periodoIndex === 3 ? finalScore : (existingGrade.periodo3 || 0);

        const gradeUpdates = {
          cicloId: existingGrade.cicloId || effectiveCicloId,
          periodo1: p1,
          periodo2: p2,
          periodo3: p3,
          promedioFinal: avg,
          observaciones: saved.observaciones || existingGrade.observaciones,
          periodosPorModalidad: {
            ...(existingGrade.periodosPorModalidad || {}),
            [entry.periodicidad]: updatedArr,
          },
        };
        apiClient.updateGrade(existingGrade.id, gradeUpdates);

        return prevGrades.map((g) =>
          g.id === existingGrade.id
            ? {
                ...g,
                ...gradeUpdates,
              }
            : g
        );
      } else {
        const newArr = Array.from({ length: meta.periodCount }, (_, idx) =>
          idx === pIdx ? finalScore : 0
        );
        const createdGrade: GradeRecord = {
          id: `grd-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          colegioId: entry.colegioId,
          cicloId: effectiveCicloId,
          estudianteId: entry.estudianteId,
          materiaId: entry.materiaId,
          materiaNombre,
          periodo1: entry.periodoIndex === 1 ? finalScore : 0,
          periodo2: entry.periodoIndex === 2 ? finalScore : 0,
          periodo3: entry.periodoIndex === 3 ? finalScore : 0,
          promedioFinal: finalScore,
          observaciones: saved.observaciones || 'Evaluado en Libreta Docente',
          periodosPorModalidad: {
            [entry.periodicidad]: newArr,
          },
        };
        apiClient.createGrade(createdGrade);
        return [createdGrade, ...prevGrades];
      }
    });

    const stObj = students.find((s) => s.id === entry.estudianteId);
    addActivityLog({
      modulo: 'Evaluaciones',
      accion: 'Registro de Evaluación de Alumno',
      detalle: `Registró evaluación de ${stObj ? `${stObj.nombre} ${stObj.apellidos}` : entry.estudianteId} en "${materiaNombre}" (${meta.periodNames[pIdx] || `Periodo ${entry.periodoIndex}`}): Examen ${saved.calificacionExamen}, Tareas ${saved.tareasEntregadasAlumno}/${saved.totalTareasDocente} → Calificación Final: ${finalScore}.`,
      colegioId: entry.colegioId,
    });

    return saved;
  };

  const addGrade = (data: Omit<GradeRecord, 'id'>) => {
    const effectiveCicloId =
      data.cicloId ||
      schoolCycles.find((c) => c.colegioId === data.colegioId && c.activo)?.id ||
      schoolCycles.find((c) => c.colegioId === data.colegioId)?.id ||
      '';
    const newGrade: GradeRecord = {
      ...data,
      cicloId: effectiveCicloId,
      id: 'grd-' + Date.now(),
    };
    setGrades((prev) => [newGrade, ...prev]);
    apiClient.createGrade(newGrade);
    addActivityLog({
      modulo: 'Calificaciones',
      accion: 'Captura de Calificación',
      detalle: `Registró calificaciones en la materia "${newGrade.materiaNombre}" (Promedio: ${newGrade.promedioFinal}).`,
      colegioId: newGrade.colegioId,
    });
  };

  const updateGrade = (id: string, updates: Partial<GradeRecord>) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
    apiClient.updateGrade(id, updates);
    addActivityLog({
      modulo: 'Calificaciones',
      accion: 'Actualización de Calificación',
      detalle: `Actualizó registro de calificación (${id}).`,
    });
  };

  const addIncident = (data: Omit<IncidentRecord, 'id'>) => {
    const activeCycle = schoolCycles.find((c) => c.colegioId === data.colegioId && c.activo) || schoolCycles.find((c) => c.colegioId === data.colegioId);
    const newInc: IncidentRecord = {
      ...data,
      cicloId: data.cicloId || activeCycle?.id,
      id: 'inc-' + Date.now(),
    };
    setIncidents((prev) => [newInc, ...prev]);
    apiClient.createIncident(newInc);
    addActivityLog({
      modulo: 'Incidencias',
      accion: 'Registro de Incidencia',
      detalle: `Registró incidencia tipo "${newInc.tipo}" para el alumno ${newInc.estudianteNombre}.`,
      colegioId: newInc.colegioId,
    });
  };

  const updateIncident = (id: string, updates: Partial<IncidentRecord>) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    apiClient.updateIncident(id, updates);
  };

  const addPsychologyRecord = (data: Omit<PsychologyRecord, 'id'>) => {
    const newRec: PsychologyRecord = {
      ...data,
      id: 'psy-' + Date.now(),
    };
    setPsychologyRecords((prev) => [newRec, ...prev]);
    apiClient.createPsychology(newRec);
    addActivityLog({
      modulo: 'Psicología',
      accion: 'Alta de Expediente Psicopedagógico',
      detalle: `Creó expediente de seguimiento psicológico para ${newRec.estudianteNombre}.`,
      colegioId: newRec.colegioId,
    });
  };

  const updatePsychologyRecord = (id: string, updates: Partial<PsychologyRecord>) => {
    setPsychologyRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, ultimaActualizacion: new Date().toISOString() } : r))
    );
    apiClient.updatePsychology(id, updates);
  };

  const deletePsychologyRecord = (id: string) => {
    setPsychologyRecords((prev) => prev.filter((r) => r.id !== id));
    apiClient.deletePsychology(id);
  };

  const addBook = (data: Omit<LibraryBook, 'id'>) => {
    const newBook: LibraryBook = {
      ...data,
      id: 'lib-' + Date.now(),
    };
    setLibraryBooks((prev) => {
      const next = [newBook, ...prev];
      saveState('library', next);
      return next;
    });
    apiClient.createLibraryBook(newBook);
    addActivityLog({
      modulo: 'Biblioteca',
      accion: 'Alta de Libro',
      detalle: `Dio de alta el libro "${newBook.titulo}" (${newBook.autor}).`,
      colegioId: newBook.colegioId,
    });
  };

  const deleteBook = (id: string) => {
    const target = libraryBooks.find((b) => b.id === id);
    markBookIdAsDeleted(id);
    setLibraryBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveState('library', next);
      return next;
    });
    apiClient.deleteLibraryBook(id);
    if (target) {
      addActivityLog({
        modulo: 'Biblioteca',
        accion: 'Eliminación de Libro',
        detalle: `Eliminó el libro "${target.titulo}" (${target.autor}) del acervo bibliográfico y de la base de datos.`,
        colegioId: target.colegioId,
      });
    }
  };

  const addNotice = (data: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...data,
      id: 'not-' + Date.now(),
    };
    setNotices((prev) => {
      const next = [newNotice, ...prev];
      saveState('notices', next);
      return next;
    });
    apiClient.createNotice(newNotice);
    addActivityLog({
      modulo: 'Comunicados y Avisos',
      accion: `Emisión de ${newNotice.tipoComunicado || 'Comunicado'}`,
      detalle: `Emitió ${newNotice.tipoComunicado || 'el comunicado'} "${newNotice.titulo}" dirigido a ${newNotice.destinatarios}${newNotice.enCopiaNombres && newNotice.enCopiaNombres.length > 0 ? ` (CC: ${newNotice.enCopiaNombres.join(', ')})` : ''}.`,
      colegioId: newNotice.colegioId,
    });
  };

  const updateNotice = (id: string, updates: Partial<Notice>) => {
    const target = notices.find((n) => n.id === id);
    setNotices((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      saveState('notices', next);
      return next;
    });
    apiClient.updateNotice(id, updates);
    addActivityLog({
      modulo: 'Comunicados y Avisos',
      accion: `Edición de ${updates.tipoComunicado || target?.tipoComunicado || 'Comunicado'}`,
      detalle: `Editó el comunicado "${updates.titulo || target?.titulo || id}" dirigido a ${updates.destinatarios || target?.destinatarios || 'Destinatarios'}.`,
      colegioId: updates.colegioId || target?.colegioId,
    });
  };

  const addActivity = (data: Omit<TeacherActivity, 'id'>): TeacherActivity => {
    const activeCycle = schoolCycles.find((c) => c.colegioId === data.colegioId && c.activo) || schoolCycles.find((c) => c.colegioId === data.colegioId);
    const newAct: TeacherActivity = {
      ...data,
      cicloId: data.cicloId || activeCycle?.id,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    setActivities((prev) => {
      const next = [newAct, ...prev];
      saveState('activities', next);
      return next;
    });
    apiClient.createActivity(newAct);
    addActivityLog({
      modulo: 'Planeación Docente',
      accion: newAct.archivoNombre ? 'Subida de Archivo de Planeación' : 'Creación de Planeación Didáctica (Piaget / Bruner)',
      detalle: `Registró la planeación "${newAct.titulo}" (${newAct.materia} · ${newAct.gradoGrupo}, duración: ${newAct.duracionSemanas || 3} semanas)${newAct.archivoNombre ? ` con archivo adjunto "${newAct.archivoNombre}"` : ''}.`,
      colegioId: newAct.colegioId,
    });
    return newAct;
  };

  const updateActivity = (id: string, updates: Partial<TeacherActivity>) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      saveState('activities', next);
      return next;
    });
    apiClient.updateActivity(id, updates);
  };

  const deleteActivity = (id: string) => {
    const target = activities.find((a) => a.id === id);
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveState('activities', next);
      return next;
    });
    apiClient.deleteActivity(id);
    if (target) {
      addActivityLog({
        modulo: 'Planeación Docente',
        accion: 'Eliminación de Planeación Docente',
        detalle: `Eliminó la planeación "${target.titulo}" (${target.gradoGrupo}).`,
        colegioId: target.colegioId,
      });
    }
  };

  const addTaskOrExam = (data: Omit<TaskOrExam, 'id'>) => {
    const activeCycle = schoolCycles.find((c) => c.colegioId === data.colegioId && c.activo) || schoolCycles.find((c) => c.colegioId === data.colegioId);
    const assignedGroups = Array.from(
      new Set(
        (Array.isArray(data.gruposAsignados) && data.gruposAsignados.length > 0
          ? data.gruposAsignados
          : (data.gradoGrupo || '').split(',').map((g) => g.trim())
        ).filter(Boolean)
      )
    );
    const unifiedGroupLabel =
      assignedGroups.length > 0 ? assignedGroups.join(', ') : data.gradoGrupo;

    const newItem: TaskOrExam = {
      ...data,
      cicloId: data.cicloId || activeCycle?.id,
      id: 'txe-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      gradoGrupo: unifiedGroupLabel,
      gruposAsignados: assignedGroups.length > 0 ? assignedGroups : [data.gradoGrupo],
      entregasEvidencias: data.entregasEvidencias || [],
    };
    setTasksExams((prev) => {
      const next = deduplicateTasksExamsList([newItem, ...prev], prev);
      saveState('tasks_exams', next);
      return next;
    });
    apiClient.createTaskOrExam(newItem);
    addActivityLog({
      modulo: 'Tareas y Exámenes',
      accion: newItem.tipo === 'examen' ? 'Alta de Examen' : 'Alta de Tarea',
      detalle: `Publicó ${newItem.tipo}: "${newItem.titulo}" para ${newItem.gradoGrupo} (${newItem.materia}).`,
      colegioId: newItem.colegioId,
    });
  };

  const updateTaskOrExam = (id: string, updates: Partial<TaskOrExam>) => {
    const target = tasksExams.find((t) => t.id === id);
    const assignedGroups =
      updates.gruposAsignados !== undefined || updates.gradoGrupo !== undefined
        ? Array.from(
            new Set(
              (Array.isArray(updates.gruposAsignados) && updates.gruposAsignados.length > 0
                ? updates.gruposAsignados
                : (updates.gradoGrupo || '').split(',').map((g) => g.trim())
              ).filter(Boolean)
            )
          )
        : undefined;

    const normalizedUpdates: Partial<TaskOrExam> = {
      ...updates,
      ...(assignedGroups && assignedGroups.length > 0
        ? {
            gruposAsignados: assignedGroups,
            gradoGrupo: assignedGroups.join(', '),
          }
        : {}),
    };

    setTasksExams((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...normalizedUpdates } : t));
      saveState('tasks_exams', next);
      return next;
    });
    apiClient.updateTaskOrExam(id, normalizedUpdates);
    if (target) {
      addActivityLog({
        modulo: 'Tareas y Exámenes',
        accion: 'Edición de Actividad',
        detalle: `Actualizó ${normalizedUpdates.tipo || target.tipo}: "${normalizedUpdates.titulo || target.titulo}" (${normalizedUpdates.gradoGrupo || target.gradoGrupo}).`,
        colegioId: target.colegioId,
      });
    }
  };

  const deleteTaskOrExam = (id: string) => {
    const target = tasksExams.find((t) => t.id === id);
    markTaskExamIdAsDeleted(id);
    setTasksExams((prev) => {
      const next = prev.filter(
        (t) =>
          t.id !== id &&
          !(
            target &&
            t.colegioId === target.colegioId &&
            t.tipo === target.tipo &&
            t.titulo === target.titulo &&
            t.materia === target.materia &&
            t.fechaLimite === target.fechaLimite
          )
      );
      saveState('tasks_exams', next);
      return next;
    });
    apiClient.deleteTaskOrExam(id);
    if (target) {
      addActivityLog({
        modulo: 'Tareas y Exámenes',
        accion: 'Eliminación de Actividad',
        detalle: `Eliminó ${target.tipo} "${target.titulo}" (${target.gradoGrupo}).`,
        colegioId: target.colegioId,
      });
    }
  };

  const submitTaskEvidence = (
    taskId: string,
    submission: Omit<TaskEvidenceSubmission, 'id' | 'fechaEntrega'>
  ) => {
    const newSubmission: TaskEvidenceSubmission = {
      ...submission,
      id: 'evd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fechaEntrega: new Date().toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setTasksExams((prev) => {
      const next = prev.map((t) => {
        if (t.id !== taskId) return t;
        const existing = Array.isArray(t.entregasEvidencias) ? t.entregasEvidencias : [];
        const filtered = existing.filter((e) => e.estudianteId !== submission.estudianteId);
        const updatedEvidences = [newSubmission, ...filtered];
        const updatedTask = { ...t, entregasEvidencias: updatedEvidences };
        apiClient.updateTaskOrExam(taskId, { entregasEvidencias: updatedEvidences });
        return updatedTask;
      });
      saveState('tasks_exams', next);
      return next;
    });

    const targetTask = tasksExams.find((t) => t.id === taskId);
    if (targetTask) {
      addActivityLog({
        modulo: 'Tareas y Exámenes',
        accion: 'Entrega de Evidencia de Alumno',
        detalle: `El alumno ${submission.estudianteNombre} (${submission.gradoGrupo}) entregó evidencia "${submission.archivoNombre}" en la tarea "${targetTask.titulo}".`,
        colegioId: targetTask.colegioId,
      });
    }
  };

  const submitStudentExam = (
    examId: string,
    submission: Omit<StudentExamSubmission, 'id' | 'fechaEntrega'>
  ): StudentExamSubmission => {
    const newSubmission: StudentExamSubmission = {
      ...submission,
      id: 'exs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fechaEntrega: new Date().toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setTasksExams((prev) => {
      const next = prev.map((t) => {
        if (t.id !== examId) return t;
        const existing = Array.isArray(t.entregasExamenes) ? t.entregasExamenes : [];
        const filtered = existing.filter((e) => e.estudianteId !== submission.estudianteId);
        const updatedSubmissions = [newSubmission, ...filtered];
        const updatedExam = { ...t, entregasExamenes: updatedSubmissions };
        apiClient.updateTaskOrExam(examId, { entregasExamenes: updatedSubmissions });
        return updatedExam;
      });
      saveState('tasks_exams', next);
      return next;
    });

    const targetExam = tasksExams.find((t) => t.id === examId);
    if (targetExam) {
      addActivityLog({
        modulo: 'Tareas y Exámenes',
        accion: 'Entrega de Examen de Alumno',
        detalle: `El alumno ${submission.estudianteNombre} (${submission.gradoGrupo}) respondió el examen "${targetExam.titulo}" (${targetExam.materia}) obteniendo ${submission.aciertosObtenidos}/${submission.totalReactivos} aciertos (${submission.calificacionEscala10.toFixed(1)}).`,
        colegioId: targetExam.colegioId,
      });
    }
    return newSubmission;
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id' | 'timestamp'>): AttendanceRecord => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    setAttendanceRecords((prev) => {
      const next = [newRecord, ...prev];
      saveState('attendance', next);
      return next;
    });
    apiClient.createAttendance(newRecord);
    return newRecord;
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveState('attendance', next);
      return next;
    });
    apiClient.updateAttendance(id, updates);
  };

  const deleteAttendanceRecord = (id: string) => {
    apiClient.deleteAttendance(id);
    setAttendanceRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveState('attendance', next);
      return next;
    });
  };

  const getPreenrollmentConfig = (colegioId: string): PreenrollmentCollegeConfig => {
    if (preenrollmentConfigs[colegioId]) {
      return preenrollmentConfigs[colegioId];
    }
    return createDefaultCollegePreenrollmentConfig(colegioId);
  };

  const updatePreenrollmentConfig = (
    colegioId: string,
    updates: Partial<PreenrollmentCollegeConfig>
  ) => {
    setPreenrollmentConfigs((prev) => {
      const current = prev[colegioId] || createDefaultCollegePreenrollmentConfig(colegioId);
      const merged = {
        ...current,
        ...updates,
      };
      apiClient.updatePreenrollmentConfig(colegioId, merged);
      return {
        ...prev,
        [colegioId]: merged,
      };
    });
  };

  const addPreenrollment = (data: {
    colegioId: string;
    colegioNombre: string;
    alumnoNombreCompleto: string;
    curp: string;
    fechaNacimiento: string;
    promedio: number;
    nivel: PreenrollmentRequest['nivel'];
    grado: string;
    escuelaProcedencia?: string;
    tutorNombre: string;
    tutorCorreo: string;
    tutorTelefono: string;
    archivosAdjuntos?: PreenrollmentAttachedFile[];
  }): PreenrollmentRequest => {
    const folio = `PRE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const collegeConfig = getPreenrollmentConfig(data.colegioId);
    const conceptosPago =
      collegeConfig.cuotasPorNivel?.[data.nivel] || getDefaultEnrollmentFees(data.nivel);
    const montoTotalInscripcion = conceptosPago.reduce((acc, c) => acc + c.monto, 0);

    const newReq: PreenrollmentRequest = {
      id: 'pre-' + Date.now(),
      colegioId: data.colegioId,
      colegioNombre: data.colegioNombre,
      folio,
      alumnoNombreCompleto: data.alumnoNombreCompleto,
      curp: data.curp,
      fechaNacimiento: data.fechaNacimiento,
      promedio: data.promedio,
      nivel: data.nivel,
      grado: data.grado,
      escuelaProcedencia: data.escuelaProcedencia?.trim() || 'Ninguna',
      tutorNombre: data.tutorNombre,
      tutorCorreo: data.tutorCorreo,
      tutorTelefono: data.tutorTelefono,
      archivosAdjuntos: data.archivosAdjuntos || [],
      estatus: 'pendiente',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      conceptosPago,
      montoTotalInscripcion,
      estadoPago: 'pendiente_pago',
    };

    setPreenrollments((prev) => [newReq, ...prev]);
    apiClient.createPreenrollment(newReq);

    // Send confirmation email to applicant's tutor and notify the college admissions team
    sendEmailNotification({
      colegioId: data.colegioId,
      colegioNombre: data.colegioNombre,
      destinatarios: [data.tutorCorreo, `direccion@${data.colegioId}.edu.mx`],
      rolesDestino: ['tutor', 'administrador', 'directivo'],
      asunto: `[Admisiones] Solicitud de Preinscripción Recibida - Folio ${folio}`,
      cuerpo: `Estimado(a) ${data.tutorNombre}:\n\n` +
        `Hemos recibido con éxito su solicitud de preinscripción para el aspirante ${data.alumnoNombreCompleto} al grado ${data.grado} en ${data.colegioNombre}.\n\n` +
        `• Folio de Solicitud: ${folio}\n` +
        `• Fecha de Registro: ${newReq.fechaSolicitud}\n` +
        `• Nivel Solicitado: ${data.nivel.toUpperCase()}\n` +
        `• Promedio reportado: ${data.promedio}\n\n` +
        `El departamento de Admisiones y Control Escolar revisará el expediente. En breve recibirá la resolución oficial a través de este medio.`,
      categoria: 'comunicado',
      prioridad: 'normal',
    });

    return newReq;
  };

  const acceptPreenrollment = (id: string) => {
    const req = preenrollments.find((p) => p.id === id);
    if (!req) return null;

    // 1. Generate tutor credentials
    const tutorUsuarioGenerado = generateTutorUsername(req.tutorNombre);
    const tutorPasswordTemporal = generateRandomPassword();

    // 2. Generate student credentials (primer letra del nombre + apellido + 4 dígitos aleatorios, pass mín 8 chars)
    const studentParts = req.alumnoNombreCompleto.trim().split(' ');
    const studentFirstInitial = studentParts[0].toLowerCase().charAt(0);
    const studentSurname = (studentParts.length > 1 ? studentParts[1] : studentParts[0]).toLowerCase().replace(/[^a-z0-9]/gi, '');
    const studentRandom4 = Math.floor(1000 + Math.random() * 9000);
    const studentUsuarioGenerado = `${studentFirstInitial}${studentSurname}${studentRandom4}`;
    const studentPasswordTemporal = generateRandomPassword();

    // 3. Determine matricula
    const collegeCode = req.colegioId.toUpperCase().replace('COL-', '');
    const matriculaGenerada = `${collegeCode}-2026-${Math.floor(100 + Math.random() * 900)}`;

    const assignedCol = colleges.find((c) => c.id === req.colegioId);
    const defaultShieldFoto =
      assignedCol?.escudoUrl ||
      createShieldSvg(
        assignedCol?.colores?.primario || '#0B2545',
        assignedCol?.colores?.secundario || '#C59B27',
        assignedCol?.nombre || 'Colegio'
      );

    // 4. Create Student record (with status "pendiente" and group "Sin Grupo (Pendiente Pago Inscripción)")
    const newStudentId = 'std-' + Date.now();
    const newTutorUserId = 'usr-tutor-' + Date.now();
    const newStudentUserId = 'usr-std-' + Date.now();

    const newStudent: Student = {
      id: newStudentId,
      colegioId: req.colegioId,
      matricula: matriculaGenerada,
      curp: req.curp,
      nombre: req.alumnoNombreCompleto,
      apellidos: '',
      grado: req.grado,
      grupo: 'Sin Grupo (Pendiente Pago Inscripción)',
      tutorNombre: req.tutorNombre,
      tutorTelefono: req.tutorTelefono,
      tutorCorreo: req.tutorCorreo,
      tutorId: newTutorUserId,
      promedio: req.promedio,
      estatus: 'pendiente',
      foto: defaultShieldFoto,
      fechaNacimiento: req.fechaNacimiento,
      usuarioLogin: studentUsuarioGenerado,
      password: studentPasswordTemporal,
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Update college student count in state and DB
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== req.colegioId) return c;
        const nextCount = (c.alumnosTotales || 0) + 1;
        apiClient.updateCollege(req.colegioId, { alumnosTotales: nextCount });
        return { ...c, alumnosTotales: nextCount };
      })
    );

    // 5. Create User for Tutor with usuarioLogin and temp password
    const newTutorUser: User = {
      id: newTutorUserId,
      nombre: req.tutorNombre,
      correo: req.tutorCorreo,
      usuarioLogin: tutorUsuarioGenerado,
      password: tutorPasswordTemporal,
      rol: 'tutor',
      colegioId: req.colegioId,
      cargo: 'Tutor Legal / Padre de Familia',
      avatar: defaultShieldFoto,
      telefono: req.tutorTelefono,
      activo: true,
      creadoEn: new Date().toISOString().split('T')[0],
      metodoAcceso: 'preinscripcion',
      hijosIds: [newStudentId],
      curpsAsociadas: [req.curp],
      curpBusquedaBloqueada: false,
    };

    // 6. Create User for Student with rol: 'alumno'
    const newStudentUser: User = {
      id: newStudentUserId,
      nombre: req.alumnoNombreCompleto,
      correo: `${studentUsuarioGenerado}@alumno.${collegeCode.toLowerCase()}.edu.mx`,
      usuarioLogin: studentUsuarioGenerado,
      password: studentPasswordTemporal,
      rol: 'alumno',
      colegioId: req.colegioId,
      cargo: `Alumno (${req.grado})`,
      avatar: newStudent.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      activo: true,
      creadoEn: new Date().toISOString().split('T')[0],
      estudianteId: newStudentId,
    };

    setUsers((prev) => [newTutorUser, newStudentUser, ...prev]);

    // 7. Update preenrollment record
    const updatedReq: PreenrollmentRequest = {
      ...req,
      estatus: 'aceptado',
      fechaResolucion: new Date().toISOString().split('T')[0],
      tutorUsuarioGenerado,
      tutorPasswordTemporal,
      matriculaGenerada,
      estudianteId: newStudent.id,
      estadoPago: 'pendiente_pago',
    };
    setPreenrollments((prev) => prev.map((p) => (p.id === id ? updatedReq : p)));
    apiClient.updatePreenrollment(id, updatedReq);
    apiClient.createStudent(newStudent);
    apiClient.createUser(newTutorUser);
    apiClient.createUser(newStudentUser);

    // 6. Dispatch Official Email Notification strictly to Tutor & Student with admission confirmation and credentials
    sendEmailNotification({
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
      destinatarios: [req.tutorCorreo],
      rolesDestino: ['tutor', 'alumno'],
      usuariosDestino: [
        newTutorUserId,
        newStudentUserId,
        req.tutorCorreo,
        tutorUsuarioGenerado,
        studentUsuarioGenerado,
      ],
      asunto: `[Admisiones] Solicitud Aceptada y Credenciales de Acceso (${req.alumnoNombreCompleto})`,
      cuerpo:
        `Estimado(a) ${req.tutorNombre}:\n\n` +
        `Nos complace informarle que la solicitud de preinscripción para su hijo(a) ${req.alumnoNombreCompleto} ha sido ACEPTADA en ${req.colegioNombre} para ${req.grado}.\n\n` +
        `=== CREDENCIALES DE ACCESO AL PORTAL ESCOLAR (TUTOR) ===\n` +
        `• Enlace de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Usuario Tutor: ${tutorUsuarioGenerado}\n` +
        `• Contraseña Temporal: ${tutorPasswordTemporal}\n\n` +
        `=== CREDENCIALES DE ACCESO DEL ALUMNO ===\n` +
        `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Matrícula Asignada: ${matriculaGenerada}\n` +
        `• Usuario Alumno: ${studentUsuarioGenerado}\n` +
        `• Contraseña Alumno: ${studentPasswordTemporal}\n\n` +
        `Recordatorio importante de seguridad: Una vez que ingrese a https://dashboard.mycollege.com.mx, diríjase al módulo "Mi Perfil" y cambie su contraseña por una personalizada.`,
      categoria: 'comunicado',
      prioridad: 'alta',
    });

    // 7. Add Notice in Comunicación y Avisos (without payment slip)
    addNotice({
      colegioId: req.colegioId,
      titulo: `Aviso de Admisión: ${req.alumnoNombreCompleto}`,
      contenido: `Se informa a los tutores del aspirante ${req.alumnoNombreCompleto} (Folio: ${req.folio}) que la solicitud de preinscripción fue APROBADA para ${req.grado} con matrícula ${matriculaGenerada}.`,
      prioridad: 'Importante',
      fecha: new Date().toISOString().split('T')[0],
      autor: 'Departamento de Admisiones y Control Escolar',
      destinatarios: 'Padres de Familia',
    });

    addActivityLog({
      modulo: 'Preinscripciones',
      accion: 'Aceptación de Preinscripción y Alta de Alumno/Tutor',
      detalle: `Aceptó la preinscripción de "${req.alumnoNombreCompleto}" (${req.grado}, Matrícula: ${matriculaGenerada}) y generó acceso para el tutor ${req.tutorNombre}.`,
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
    });

    return { preenrollment: updatedReq, student: newStudent, tutorUser: newTutorUser };
  };

  const rejectPreenrollment = (id: string, motivo: string) => {
    const req = preenrollments.find((p) => p.id === id);
    if (!req) return;

    const fechaResolucion = new Date().toISOString().split('T')[0];

    setPreenrollments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              estatus: 'rechazado',
              motivoRechazo: motivo,
              fechaResolucion,
            }
          : p
      )
    );
    apiClient.updatePreenrollment(id, {
      estatus: 'rechazado',
      motivoRechazo: motivo,
      fechaResolucion,
    });

    sendEmailNotification({
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
      destinatarios: [req.tutorCorreo],
      rolesDestino: ['tutor'],
      usuariosDestino: [req.tutorCorreo],
      asunto: `[Admisiones] Notificación sobre Solicitud de Preinscripción (${req.folio})`,
      cuerpo: `Estimado(a) ${req.tutorNombre}:\n\n` +
        `Agradecemos su interés en formar parte de ${req.colegioNombre}.\n\n` +
        `Le informamos que tras la evaluación del comité de admisiones para el aspirante ${req.alumnoNombreCompleto}, la solicitud no ha podido ser admitida en esta ocasión debido al siguiente motivo:\n\n` +
        `"${motivo}"\n\n` +
        `Para mayor información o dudas, puede ponerse en contacto con la Dirección Escolar.`,
      categoria: 'comunicado',
      prioridad: 'normal',
    });
  };

  const confirmPreenrollmentPayment = (id: string, folioComprobante?: string) => {
    const req = preenrollments.find((p) => p.id === id);
    if (!req) return;

    const fechaPago = new Date().toISOString().split('T')[0];
    const comp = folioComprobante || `BBVA-TRANSF-${Math.floor(100000 + Math.random() * 900000)}`;

    setPreenrollments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              estadoPago: 'pago_confirmado',
              fechaPago,
              folioComprobante: comp,
            }
          : p
      )
    );
    apiClient.updatePreenrollment(id, {
      estadoPago: 'pago_confirmado',
      fechaPago,
      folioComprobante: comp,
    });

    // Update student status to active in state and DB
    if (req.estudianteId) {
      apiClient.updateStudent(req.estudianteId, { estatus: 'activo' });
      setStudents((prev) =>
        prev.map((s) => (s.id === req.estudianteId ? { ...s, estatus: 'activo' } : s))
      );
    }

    sendEmailNotification({
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
      destinatarios: [req.tutorCorreo],
      rolesDestino: ['tutor'],
      usuariosDestino: [
        req.tutorCorreo,
        ...(req.tutorUsuarioGenerado ? [req.tutorUsuarioGenerado] : []),
        ...(req.estudianteId ? [req.estudianteId] : []),
      ],
      asunto: `[Control Escolar] Pago Confirmado - Inscripción Oficial (${req.alumnoNombreCompleto})`,
      cuerpo: `Estimado(a) ${req.tutorNombre}:\n\n` +
        `Le confirmamos que el pago de inscripción por $${req.montoTotalInscripcion.toLocaleString()} MXN para el alumno ${req.alumnoNombreCompleto} ha sido RECIBIDO y VALIDADO satisfactoriamente por el sistema con comprobante: ${comp}.\n\n` +
        `El expediente del alumno ha sido completado. El siguiente paso es la asignación de su grupo escolar por parte de Control Escolar.`,
      categoria: 'facturacion',
      prioridad: 'alta',
    });
  };

  const assignStudentGroup = (preenrollmentId: string, grupo: string) => {
    const req = preenrollments.find((p) => p.id === preenrollmentId);
    if (!req) return;

    const fechaAsignacion = new Date().toISOString().split('T')[0];

    setPreenrollments((prev) =>
      prev.map((p) =>
        p.id === preenrollmentId
          ? {
              ...p,
              grupoAsignado: grupo,
              fechaAsignacionGrupo: fechaAsignacion,
            }
          : p
      )
    );
    apiClient.updatePreenrollment(preenrollmentId, {
      grupoAsignado: grupo,
      fechaAsignacionGrupo: fechaAsignacion,
    });

    // Update student in students list and DB
    if (req.estudianteId) {
      apiClient.updateStudent(req.estudianteId, { grupo, estatus: 'activo' });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === req.estudianteId
            ? { ...s, grupo: grupo, estatus: 'activo' }
            : s
        )
      );
    }

    sendEmailNotification({
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
      destinatarios: [req.tutorCorreo],
      rolesDestino: ['tutor', 'alumno'],
      usuariosDestino: [
        req.tutorCorreo,
        ...(req.tutorUsuarioGenerado ? [req.tutorUsuarioGenerado] : []),
        ...(req.estudianteId ? [req.estudianteId] : []),
      ],
      asunto: `[Control Escolar] Grupo Escolar Asignado: ${req.grado} Grupo "${grupo}"`,
      cuerpo: `Estimado(a) ${req.tutorNombre}:\n\n` +
        `Nos es grato comunicarle que su hijo(a) ${req.alumnoNombreCompleto} ha sido asignado(a) oficialmente al grupo escolar:\n\n` +
        `• Nivel: ${req.nivel.toUpperCase()}\n` +
        `• Grado: ${req.grado}\n` +
        `• Grupo Oficial: "${grupo}"\n` +
        `• Matrícula Oficial: ${req.matriculaGenerada || 'Asignada'}\n\n` +
        `¡Bienvenido(a) a la comunidad escolar de ${req.colegioNombre}! Ya puede consultar sus horarios y materias en la plataforma.`,
      categoria: 'comunicado',
      prioridad: 'alta',
    });
    addActivityLog({
      modulo: 'Preinscripciones / Control Escolar',
      accion: 'Asignación de Grupo Oficial',
      detalle: `Asignó al alumno "${req.alumnoNombreCompleto}" al grupo "${req.grado} Grupo ${grupo}".`,
      colegioId: req.colegioId,
      colegioNombre: req.colegioNombre,
    });
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.rol === 'alumno' || (currentUser.id === userId && currentUser.rol === 'alumno')) {
      return;
    }
    apiClient.updateUser(userId, { password: newPassword });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, password: newPassword }));
    }
    addActivityLog({
      modulo: 'Mi Perfil / Seguridad',
      accion: 'Actualización de Contraseña',
      detalle: `El usuario "${target?.nombre || currentUser.nombre}" actualizó su contraseña de acceso.`,
      colegioId: target?.colegioId || currentUser.colegioId,
    });
  };

  const resetToDefaults = () => {
    setColleges(INITIAL_COLLEGES);
    setUsers(INITIAL_USERS);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setSubjects(INITIAL_SUBJECTS);
    setGrades(INITIAL_GRADES);
    setIncidents(INITIAL_INCIDENTS);
    setPsychologyRecords(INITIAL_PSYCHOLOGY);
    setLibraryBooks(INITIAL_LIBRARY);
    setNotices(INITIAL_NOTICES);
    setActivities(INITIAL_ACTIVITIES);
    setTasksExams(INITIAL_TASKS_EXAMS);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setPreenrollments(INITIAL_PREENROLLMENTS);
    setPreenrollmentConfigs(INITIAL_PREENROLLMENT_CONFIGS);
    setCampuses(INITIAL_CAMPUSES);
    setSelectedCampusId(null);
    setSchoolCycles(INITIAL_SCHOOL_CYCLES);
    setCalendarDays(INITIAL_CALENDAR_DAYS);
    setGroupSchedules(INITIAL_GROUP_SCHEDULES);
    setMonthlyTuitions(INITIAL_MONTHLY_TUITIONS);
    setBillingConcepts(INITIAL_BILLING_CONCEPTS);
    setStudentDiscounts(INITIAL_STUDENT_DISCOUNTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setEvaluationConcepts(INITIAL_EVALUATION_CONCEPTS);
    setStudentEvaluations(INITIAL_STUDENT_EVALUATIONS);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setCollegeRolePermissions({});
    setCurrentUser(INITIAL_USERS[0]);
    setCafeteriaProducts(INITIAL_CAFETERIA_PRODUCTS);
    setCafeteriaOrders(INITIAL_CAFETERIA_ORDERS);
    localStorage.clear();
  };

  // Cafetería Actions
  const addCafeteriaProduct = async (
    productData: Omit<CafeteriaProduct, 'id' | 'creadoEn'>
  ): Promise<CafeteriaProduct> => {
    const newProd: CafeteriaProduct = {
      ...productData,
      id: `prod-caf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      creadoEn: new Date().toISOString(),
    };
    setCafeteriaProducts((prev) => {
      const next = [newProd, ...prev];
      saveState('cafeteria_products', next);
      return next;
    });
    apiClient.createCafeteriaProduct(newProd);
    addActivityLog({
      modulo: 'Cafetería',
      accion: 'Alta de Producto',
      detalle: `Se dio de alta "${newProd.nombre}" con precio $${newProd.precio} MXN en categoría "${newProd.categoria}".`,
      colegioId: newProd.colegioId,
    });
    return newProd;
  };

  const updateCafeteriaProduct = async (id: string, updates: Partial<CafeteriaProduct>) => {
    setCafeteriaProducts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...updates, actualizadoEn: new Date().toISOString() } : p
      );
      saveState('cafeteria_products', next);
      return next;
    });
    apiClient.updateCafeteriaProduct(id, updates);
  };

  const deleteCafeteriaProduct = async (id: string) => {
    const prod = cafeteriaProducts.find((p) => p.id === id);
    setCafeteriaProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveState('cafeteria_products', next);
      return next;
    });
    apiClient.deleteCafeteriaProduct(id);
    if (prod) {
      addActivityLog({
        modulo: 'Cafetería',
        accion: 'Eliminar Producto',
        detalle: `Se eliminó el producto "${prod.nombre}".`,
        colegioId: prod.colegioId,
      });
    }
  };

  const toggleCafeteriaProductAvailability = async (id: string) => {
    const prod = cafeteriaProducts.find((p) => p.id === id);
    if (!prod) return;
    const nextVal = !prod.disponible;
    setCafeteriaProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, disponible: nextVal } : p));
      saveState('cafeteria_products', next);
      return next;
    });
    apiClient.updateCafeteriaProduct(id, { disponible: nextVal });
  };

  const createCafeteriaOrder = async (
    orderData: Omit<CafeteriaOrder, 'id' | 'folio' | 'fechaCreacion' | 'estado'>
  ): Promise<CafeteriaOrder> => {
    const randDigits = String(Math.floor(1000 + Math.random() * 9000));
    const newOrder: CafeteriaOrder = {
      ...orderData,
      id: `ord-caf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      folio: `#CAF-${randDigits}`,
      fechaCreacion: new Date().toISOString(),
      estado: 'pendiente',
    };
    setCafeteriaOrders((prev) => {
      const next = [newOrder, ...prev];
      saveState('cafeteria_orders', next);
      return next;
    });
    apiClient.createCafeteriaOrder(newOrder);
    addActivityLog({
      modulo: 'Mi Cafetería',
      accion: 'Pedido Creado',
      detalle: `El tutor "${newOrder.tutorNombre}" realizó el pedido ${newOrder.folio} por $${newOrder.total} MXN para el alumno "${newOrder.estudianteNombre}" (${newOrder.estudianteMatricula}).`,
      colegioId: newOrder.colegioId,
    });
    return newOrder;
  };

  const updateCafeteriaOrderStatus = async (id: string, estado: CafeteriaOrderStatus) => {
    setCafeteriaOrders((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, estado } : o));
      saveState('cafeteria_orders', next);
      return next;
    });
    apiClient.updateCafeteriaOrderStatus(id, estado);
  };

  const deliverCafeteriaOrderWithQr = async (params: {
    orderId: string;
    qrCodeRaw: string;
    candidateStudent?: Student;
    entregadoPor?: string;
  }): Promise<{ success: boolean; validMatch: boolean; message: string; order?: CafeteriaOrder }> => {
    const order = cafeteriaOrders.find((o) => o.id === params.orderId);
    if (!order) {
      return {
        success: false,
        validMatch: false,
        message: 'Orden de cafetería no encontrada.',
      };
    }

    // Try finding the student from params.candidateStudent or parse from qrCodeRaw
    let candidate = params.candidateStudent;
    const collegeStudents = students.filter((s) => s.colegioId === order.colegioId);

    if (!candidate && params.qrCodeRaw) {
      const raw = params.qrCodeRaw.trim();
      if (raw.includes('alumno=') || raw.includes('sid=') || raw.includes('curp=') || raw.startsWith('http')) {
        try {
          const queryPart = raw.includes('?') ? raw.split('?')[1] : raw;
          const p = new URLSearchParams(queryPart);
          const sid = p.get('sid');
          const mat = p.get('alumno') || p.get('matricula');
          const curp = p.get('curp');
          if (sid) candidate = collegeStudents.find((s) => s.id.toLowerCase() === sid.toLowerCase());
          if (!candidate && mat) candidate = collegeStudents.find((s) => s.matricula.toLowerCase() === mat.toLowerCase());
          if (!candidate && curp) candidate = collegeStudents.find((s) => s.curp.toLowerCase() === curp.toLowerCase());
        } catch {
          // ignore
        }
      }
      if (!candidate) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.sid) candidate = collegeStudents.find((s) => s.id === parsed.sid);
          if (!candidate && (parsed.matricula || parsed.mat)) {
            const m = parsed.matricula || parsed.mat;
            candidate = collegeStudents.find((s) => s.matricula === m);
          }
        } catch {
          const clean = raw.toLowerCase();
          candidate = collegeStudents.find(
            (s) =>
              s.matricula.toLowerCase() === clean ||
              s.id.toLowerCase() === clean ||
              s.curp.toLowerCase() === clean
          );
        }
      }
    }

    const expectedId = (order.estudianteId || '').toLowerCase().trim();
    const expectedMat = (order.estudianteMatricula || '').toLowerCase().trim();

    const matchesId = candidate && candidate.id.toLowerCase().trim() === expectedId;
    const matchesMat = candidate && candidate.matricula.toLowerCase().trim() === expectedMat;

    const rawLower = String(params.qrCodeRaw || '').toLowerCase();
    const matchesRaw =
      (expectedMat && rawLower.includes(expectedMat)) ||
      (expectedId && rawLower.includes(expectedId));

    const isMatch = Boolean(matchesId || matchesMat || matchesRaw);

    if (!isMatch) {
      const detectedInfo = candidate
        ? `${candidate.nombre} ${candidate.apellidos} (${candidate.matricula})`
        : 'Código QR no reconocido';
      const errorMsg = `El código QR escaneado no corresponde al alumno de esta orden. Se detectó a: ${detectedInfo}, pero este pedido pertenece a: ${order.estudianteNombre}.`;
      return {
        success: false,
        validMatch: false,
        message: errorMsg,
      };
    }

    const nowIso = new Date().toISOString();
    const deliverer = params.entregadoPor || currentUser.nombre || 'Personal de Cafetería';
    const updatedOrder: CafeteriaOrder = {
      ...order,
      estado: 'entregada',
      fechaEntrega: nowIso,
      entregadoPor: deliverer,
    };

    setCafeteriaOrders((prev) => {
      const next = prev.map((o) => (o.id === order.id ? updatedOrder : o));
      saveState('cafeteria_orders', next);
      return next;
    });

    apiClient.deliverCafeteriaOrder({
      orderId: order.id,
      qrCodeRaw: params.qrCodeRaw,
      scannedStudentId: candidate?.id || order.estudianteId,
      scannedMatricula: candidate?.matricula || order.estudianteMatricula,
      entregadoPor: deliverer,
    });

    addActivityLog({
      modulo: 'Cafetería',
      accion: 'Entrega Validada QR',
      detalle: `Pedido ${order.folio} entregado exitosamente mediante validación QR del alumno "${order.estudianteNombre}" por ${deliverer}.`,
      colegioId: order.colegioId,
    });

    return {
      success: true,
      validMatch: true,
      message: `¡Pedido ${order.folio} entregado y validado exitosamente para ${order.estudianteNombre}!`,
      order: updatedOrder,
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        selectedCollegeId,
        setSelectedCollegeId,
        activeCollege,
        colleges,
        users,
        students,
        teachers,
        subjects,
        grades,
        incidents,
        psychologyRecords,
        libraryBooks,
        notices,
        activities,
        tasksExams,
        attendanceRecords,
        preenrollments,
        preenrollmentConfigs,
        getPreenrollmentConfig,
        updatePreenrollmentConfig,
        platformFeeConfig,
        updatePlatformFeeConfig,
        dbStatus,
        refreshDbStatus,
        addCollege,
        updateCollege,
        deleteCollege,
        generateCollegeDeletionKey,
        verifyCollegeDeletionKey,
        toggleCollegeActiveStatus,
        toggleModule,
        updateCollegeBranding,
        updateCollegeReportCardDesign,
        addUser,
        updateUser,
        deleteUser,
        addStudent,
        addStudentsBulk,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        collegeGroups,
        addCollegeGroup,
        deleteCollegeGroup,
        getGroupsForCollegeLevel,
        campuses,
        selectedCampusId,
        setSelectedCampusId,
        addCampus,
        updateCampus,
        deleteCampus,
        assignCampusMembers,
        schoolCycles,
        addSchoolCycle,
        updateSchoolCycle,
        deleteSchoolCycle,
        calendarDays,
        addCalendarDay,
        updateCalendarDay,
        deleteCalendarDay,
        groupSchedules,
        saveGroupSchedule,
        deleteGroupSchedule,
        scheduleDriveConfigs,
        getCollegeScheduleDriveConfig,
        toggleCollegeScheduleEnabled,
        toggleCollegeDriveUsageEnabled,
        isCollegeDriveUsageEnabled,
        updateCollegeScheduleDriveConfig,
        setCollegeDriveOpenStatus,
        isCollegeDriveOpen,
        drivePickupQueue,
        triggerTutorEnFila,
        markDriveStudentDelivered,
        removeDriveQueueEntry,
        clearDeliveredDriveEntries,
        monthlyTuitions,
        toggleMonthlyTuitionPayment,
        billingConcepts,
        addBillingConcept,
        updateBillingConcept,
        deleteBillingConcept,
        requestDeleteBillingConcept,
        cancelDeleteBillingConceptRequest,
        evaluationConcepts,
        evaluationSavedPeriods,
        studentEvaluations,
        addEvaluationConcept,
        updateEvaluationConcept,
        deleteEvaluationConcept,
        updateEvaluationConceptPercentages,
        saveEvaluationPeriod,
        deleteEvaluationPeriod,
        saveStudentEvaluation,
        setCollegeEvaluationPeriodicity,
        customRoles,
        allRolesConfig,
        addCustomRole,
        updateCustomRole,
        deleteCustomRole,
        addGrade,
        updateGrade,
        addIncident,
        updateIncident,
        addPsychologyRecord,
        updatePsychologyRecord,
        deletePsychologyRecord,
        pendingCanalizacionForExpediente,
        setPendingCanalizacionForExpediente,
        addBook,
        deleteBook,
        addNotice,
        updateNotice,
        addActivity,
        updateActivity,
        deleteActivity,
        addTaskOrExam,
        updateTaskOrExam,
        deleteTaskOrExam,
        submitTaskEvidence,
        submitStudentExam,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        addPreenrollment,
        acceptPreenrollment,
        rejectPreenrollment,
        confirmPreenrollmentPayment,
        assignStudentGroup,
        updateUserPassword,
        isSuperuserSession,
        originalSuperuser,
        switchRoleAsSuperuser,
        resetRoleToSuperuser,
        emailNotifications,
        sendEmailNotification,
        markNotificationAsRead,
        rolePermissions,
        collegeRolePermissions,
        getRolePermissionsForCollege,
        updateRolePermissions,
        hasRolePermission,
        supportAccessRequests,
        requestSupportCollegeAccess,
        respondToSupportCollegeAccess,
        clearSupportCollegeAccess,
        deactivateCollegeSupportMode,
        requestDemoRenewalContact,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        studentDiscounts,
        addStudentDiscount,
        updateStudentDiscount,
        deleteStudentDiscount,
        requestDeleteStudentDiscount,
        cancelDeleteStudentDiscountRequest,
        approveStudentDiscount,
        rejectStudentDiscount,
        getEffectiveStudentPrice,
        resetToDefaults,
        cafeteriaProducts,
        cafeteriaOrders,
        addCafeteriaProduct,
        updateCafeteriaProduct,
        deleteCafeteriaProduct,
        toggleCafeteriaProductAvailability,
        createCafeteriaOrder,
        updateCafeteriaOrderStatus,
        deliverCafeteriaOrderWithQr,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
