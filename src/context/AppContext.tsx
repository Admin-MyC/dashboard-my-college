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
  toggleModule: (collegeId: string, moduleId: CollegeModuleId, enable: boolean) => void;
  updateCollegeBranding: (
    collegeId: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ) => void;
  addUser: (userData: Omit<User, 'id' | 'creadoEn'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addStudent: (data: Omit<Student, 'id'> & { id?: string }) => Student;
  addStudentsBulk: (items: (Omit<Student, 'id'> & { id?: string })[]) => Student[];
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (data: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
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
  monthlyTuitions: MonthlyTuitionRecord[];
  toggleMonthlyTuitionPayment: (
    colegioId: string,
    estudianteId: string,
    mesClave: string,
    mesEtiqueta: string,
    montoColegiatura: number,
    pagado: boolean
  ) => void;
  billingConcepts: BillingConcept[];
  addBillingConcept: (data: Omit<BillingConcept, 'id' | 'creadoEn'>) => BillingConcept;
  updateBillingConcept: (id: string, updates: Partial<BillingConcept>) => void;
  deleteBillingConcept: (id: string) => void;
  evaluationConcepts: EvaluationConceptItem[];
  evaluationSavedPeriods: EvaluationSavedPeriod[];
  studentEvaluations: StudentEvaluationEntry[];
  addEvaluationConcept: (data: Omit<EvaluationConceptItem, 'id'>) => EvaluationConceptItem;
  updateEvaluationConcept: (id: string, updates: Partial<EvaluationConceptItem>) => void;
  deleteEvaluationConcept: (id: string) => void;
  updateEvaluationConceptPercentages: (updates: Record<string, number>) => void;
  saveEvaluationPeriod: (params: {
    colegioId: string;
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
  addBook: (data: Omit<LibraryBook, 'id'>) => void;
  addNotice: (data: Omit<Notice, 'id'>) => void;
  addTaskOrExam: (data: Omit<TaskOrExam, 'id'>) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'my_college_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load helper
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const saveState = (key: string, val: any) => {
    const payload =
      key === 'activity_logs' && Array.isArray(val) ? val.slice(0, 150) : val;
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(payload));
    } catch {
      try {
        // Free space from bulky cache keys and retry
        localStorage.removeItem('my_college_notifications_v1');
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'activity_logs');
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(payload));
      } catch {
        // Ignore if storage quota is still full
      }
    }
  };

  const normalizeUserList = (
    list: User[],
    localReferenceList?: User[],
    persistToDb = false
  ): User[] => {
    const initialMap = new Map(INITIAL_USERS.map((iu) => [iu.id, iu]));
    const localMap = new Map((localReferenceList || []).map((lu) => [lu.id, lu]));

    return (Array.isArray(list) ? list : INITIAL_USERS).map((u) => {
      const seedUser = initialMap.get(u.id);
      const localUser = localMap.get(u.id);
      // Prefer existing valid username in DB, then local saved username, then seedUser, then deterministic first-time generation
      const fallbackRef =
        localUser && isValidGeneratedUsername(localUser.usuarioLogin)
          ? localUser
          : seedUser;

      const { usuarioLogin, password, wasUpdated } = ensureUserCredentials(u, fallbackRef);

      if (persistToDb && (wasUpdated || u.usuarioLogin !== usuarioLogin || u.password !== password)) {
        apiClient.updateUser(u.id, { usuarioLogin, password });
      }

      return {
        ...u,
        usuarioLogin,
        password,
      };
    });
  };

  const [colleges, setColleges] = useState<College[]>(() =>
    loadState('colleges', INITIAL_COLLEGES)
  );
  const [users, setUsers] = useState<User[]>(() =>
    normalizeUserList(loadState('users', INITIAL_USERS))
  );
  const [students, setStudents] = useState<Student[]>(() =>
    loadState('students', INITIAL_STUDENTS)
  );
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    loadState('teachers', INITIAL_TEACHERS)
  );
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    loadState('subjects', INITIAL_SUBJECTS)
  );
  const [collegeGroups, setCollegeGroups] = useState<CollegeGroup[]>(() =>
    loadState<CollegeGroup[]>('college_groups', [])
  );
  const [grades, setGrades] = useState<GradeRecord[]>(() =>
    loadState('grades', INITIAL_GRADES)
  );
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() =>
    loadState('incidents', INITIAL_INCIDENTS)
  );
  const [psychologyRecords, setPsychologyRecords] = useState<PsychologyRecord[]>(() =>
    loadState('psychology', INITIAL_PSYCHOLOGY)
  );
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() =>
    loadState('library', INITIAL_LIBRARY)
  );
  const [notices, setNotices] = useState<Notice[]>(() =>
    loadState('notices', INITIAL_NOTICES)
  );
  const [activities, setActivities] = useState<TeacherActivity[]>(() =>
    loadState('activities', INITIAL_ACTIVITIES)
  );
  const [tasksExams, setTasksExams] = useState<TaskOrExam[]>(() =>
    loadState('tasks_exams', INITIAL_TASKS_EXAMS)
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
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluationEntry[]>(() =>
    loadState('student_evaluations', INITIAL_STUDENT_EVALUATIONS)
  );

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
        if (resp.data.colleges?.length) setColleges(resp.data.colleges);
        if (resp.data.users?.length) {
          setUsers((prevLocal) => normalizeUserList(resp.data.users, prevLocal, true));
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
            return resp.data.teachers.map((remoteTch: Teacher) => {
              const localTch = localMap.get(remoteTch.id);
              return {
                ...remoteTch,
                campusId: remoteTch.campusId || localTch?.campusId,
              };
            });
          });
        }
        if (resp.data.subjects?.length) setSubjects(resp.data.subjects);
        if (resp.data.grades?.length) setGrades(resp.data.grades);
        if (resp.data.incidents?.length) setIncidents(resp.data.incidents);
        if (resp.data.psychologyRecords?.length) setPsychologyRecords(resp.data.psychologyRecords);
        if (resp.data.libraryBooks?.length) setLibraryBooks(resp.data.libraryBooks);
        if (resp.data.notices?.length) setNotices(resp.data.notices);
        if (resp.data.activities?.length) setActivities(resp.data.activities);
        if (resp.data.tasksExams?.length) setTasksExams(resp.data.tasksExams);
        if (resp.data.attendance?.length) setAttendanceRecords(resp.data.attendance);
        if (resp.data.preenrollmentConfigs && Object.keys(resp.data.preenrollmentConfigs).length) {
          setPreenrollmentConfigs(resp.data.preenrollmentConfigs);
        }
        if (resp.data.preenrollments?.length) {
          setPreenrollments(resp.data.preenrollments);
        }
        if (resp.data.campuses?.length) setCampuses(resp.data.campuses);
        if (resp.data.schoolCycles?.length) setSchoolCycles(resp.data.schoolCycles);
        if (resp.data.calendarDays?.length) setCalendarDays(resp.data.calendarDays);
        if (resp.data.groupSchedules?.length) setGroupSchedules(resp.data.groupSchedules);
        if (resp.data.monthlyTuitions?.length) setMonthlyTuitions(resp.data.monthlyTuitions);
        if (resp.data.billingConcepts?.length) setBillingConcepts(resp.data.billingConcepts);
        if (resp.data.evaluationConcepts?.length) setEvaluationConcepts(resp.data.evaluationConcepts);
        if (resp.data.evaluationSavedPeriods?.length) {
          setEvaluationSavedPeriods(resp.data.evaluationSavedPeriods);
        }
        if (resp.data.studentEvaluations?.length) {
          setStudentEvaluations(resp.data.studentEvaluations);
        }
        if (resp.data.activityLogs?.length) {
          setActivityLogs(resp.data.activityLogs);
        }
      }
    });
  }, []);

  // Active current logged-in user: default is Superadmin!
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = loadState<User | null>('current_user', null);
    if (savedUser && users.some((u) => u.id === savedUser.id)) {
      return savedUser;
    }
    return users[0] || INITIAL_USERS[0];
  });

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
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(() =>
    loadState('selected_college_id', null)
  );

  const normalizeRolePermissionsMap = (rawMap: RolePermissionsMap, isInitialMigration = false): RolePermissionsMap => {
    const allRegistryIds = SYSTEM_MODULES_REGISTRY.map((m) => m.id);
    const rawSuperOrder = Array.isArray(rawMap?.superusuario) ? rawMap.superusuario : [];
    const orderedSuperIds = [
      ...rawSuperOrder.filter((id) => allRegistryIds.includes(id)),
      ...allRegistryIds.filter((id) => !rawSuperOrder.includes(id)),
    ];

    const merged: RolePermissionsMap = {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...rawMap,
      superusuario: orderedSuperIds,
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
    (['administrador', 'supervisor', 'prefecto'] as UserRole[]).forEach((r) => {
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
      const list = rawList.filter(
        (m) =>
          m !== 'colegio_resumen' &&
          m !== 'resumen_escolar' &&
          m !== 'resumen_docentes'
      );
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
          m !== 'resumen_psicologico'
      );
      merged.docente = isInitialMigration && !list.includes('resumen_docentes')
        ? ['resumen_docentes', ...list]
        : list;
    }

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
        : selectedCollegeId || currentUser?.colegioId || null;

    if (rol === 'superusuario') {
      // In Global Panel (no college selected), superusuario always has access to all global modules
      if (!effectiveCollegeId) return true;

      // Inside a college, if a module was disabled for ALL profiles in Global Mode or in this college, hide it in the college sidebar too
      const nonSuperRoles = Object.keys(rolePermissions || {}).filter(
        (r) => r !== 'superusuario'
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

    // 1. Check Global Permissions first: if disabled in Global Mode, it is disabled in ALL colleges!
    const globalAllowed = rolePermissions?.[rol];
    if (Array.isArray(globalAllowed) && !globalAllowed.includes(normalizeId)) {
      return false;
    }

    // 2. Check college-specific permissions if inside a college
    const permsMap =
      effectiveCollegeId && collegeRolePermissions[effectiveCollegeId]
        ? collegeRolePermissions[effectiveCollegeId]
        : rolePermissions;

    const allowed = permsMap?.[rol];
    if (!Array.isArray(allowed)) {
      return DEFAULT_ROLE_PERMISSIONS[rol]?.includes(normalizeId) ?? false;
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
    saveState('evaluation_concepts', evaluationConcepts);
  }, [evaluationConcepts]);
  useEffect(() => {
    saveState('evaluation_saved_periods', evaluationSavedPeriods);
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
    if (dateFilter && dateFilter !== 'todas') {
      setActivityLogs((prev) => prev.filter((l) => l.fecha !== dateFilter));
    } else {
      setActivityLogs([]);
    }
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

    const roleCargoMap: Record<UserRole, string> = {
      superusuario: base.cargo || 'Superadministrador Maestro de Plataforma',
      administrador: 'Administrador Institucional (Modo Superusuario)',
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
    if (currentUser.rol !== 'superusuario' && currentUser.colegioId) {
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

    const newCollege: College = {
      id: collegeId,
      nombre: collegeData.nombre || 'Nuevo Colegio Registrado',
      codigoCCT: collegeData.codigoCCT?.trim() || '',
      lema: collegeData.lema?.trim() || '',
      nivel: collegeData.nivel || 'Primaria',
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
      montoMensual: collegeData.montoMensual ?? 0,
      fechaProximoPago: collegeData.fechaProximoPago || '',
      telefono: collegeData.telefono?.trim() || adminUserData.telefono?.trim() || '',
      correo: collegeData.correo?.trim() || adminUserData.correo.trim(),
      direccion: collegeData.direccion?.trim() || '',
      director: collegeData.director?.trim() || adminUserData.nombre.trim(),
      adminUserId: adminUserId,
      alumnosTotales: 0,
      docentesTotales: 0,
      activo: true,
      creadoEn: new Date().toISOString().split('T')[0],
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
    setColleges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    apiClient.updateCollege(id, updates);
    addActivityLog({
      modulo: 'Colegios',
      accion: 'Actualización de Colegio',
      detalle: `Actualizó la información institucional del colegio "${col?.nombre || id}".`,
      colegioId: id,
      colegioNombre: col?.nombre,
    });
  };

  const deleteCollege = (id: string) => {
    const col = colleges.find((c) => c.id === id);
    apiClient.deleteCollege(id);
    setColleges((prev) => prev.filter((c) => c.id !== id));
    setUsers((prev) => prev.filter((u) => u.colegioId !== id));
    if (selectedCollegeId === id) {
      setSelectedCollegeId(null);
    }
    addActivityLog({
      modulo: 'Colegios',
      accion: 'Baja de Colegio',
      detalle: `Eliminó el colegio "${col?.nombre || id}".`,
      colegioId: id,
      colegioNombre: col?.nombre,
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

  const updateCollegeBranding = (
    collegeId: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ) => {
    const col = colleges.find((c) => c.id === collegeId);
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
    addActivityLog({
      modulo: 'Personalizar',
      accion: 'Actualización de Escudo y Colores',
      detalle: `Actualizó la identidad visual (escudo y colores ${primario} / ${secundario}) del colegio "${col?.nombre || collegeId}".`,
      colegioId: collegeId,
      colegioNombre: col?.nombre,
    });
  };

  const addUser = (userData: Omit<User, 'id' | 'creadoEn'>): User => {
    const generatedUsername =
      userData.usuarioLogin?.trim() || generateTutorUsername(userData.nombre);
    const rawPass = userData.password?.trim() || '';
    const generatedPassword =
      rawPass && rawPass !== 'admin123' && rawPass.length === 8
        ? rawPass
        : generateRandomPassword();

    // Ensure every non-superusuario user is saved in their respective college
    const resolvedCollegeId =
      userData.rol === 'superusuario'
        ? null
        : userData.colegioId || activeCollege?.id || selectedCollegeId || colleges[0]?.id || null;

    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      colegioId: resolvedCollegeId,
      usuarioLogin: generatedUsername,
      password: generatedPassword,
      creadoEn: new Date().toISOString().split('T')[0],
      ultimoAcceso: 'Recién registrado',
      avatar:
        userData.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
    setUsers((prev) => [newUser, ...prev]);
    apiClient.createUser(newUser);

    const assignedCol = newUser.colegioId
      ? colleges.find((c) => c.id === newUser.colegioId)
      : null;

    if (newUser.correo) {
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
    apiClient.updateUser(id, safeUpdates);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...safeUpdates } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...safeUpdates }));
    }
    addActivityLog({
      modulo: 'Usuarios / Perfil',
      accion: safeUpdates.datosFiscales ? 'Actualización de Datos Fiscales (RFC)' : 'Actualización de Usuario',
      detalle: safeUpdates.datosFiscales
        ? `El usuario "${target?.nombre || currentUser.nombre}" dio de alta/actualizó sus datos fiscales (RFC: ${safeUpdates.datosFiscales.rfc}).`
        : `Actualizó los datos del usuario "${target?.nombre || id}".`,
      colegioId: target?.colegioId || currentUser.colegioId,
    });
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    apiClient.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addActivityLog({
      modulo: 'Usuarios',
      accion: 'Baja de Usuario',
      detalle: `Eliminó al usuario "${target?.nombre || id}" (${target?.rol || ''}).`,
      colegioId: target?.colegioId,
    });
  };

  const addStudent = (data: Omit<Student, 'id'> & { id?: string }): Student => {
    const targetColId = data.colegioId || activeCollege?.id || selectedCollegeId || colleges[0]?.id || '';
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
    if (safeUpdates.estatus) {
      const isNowBaja = safeUpdates.estatus === 'baja';
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (u.rol === 'alumno' && u.estudianteId === id) {
            apiClient.updateUser(u.id, { activo: !isNowBaja });
            return { ...u, activo: !isNowBaja };
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

    // Also create the corresponding User account with the standard username (first initial + surname + 4 digits) and 8-char random password
    const existsInUsers = users.some(
      (u) => u.correo.toLowerCase() === newTeacher.correo.toLowerCase()
    );
    if (!existsInUsers) {
      const teacherUsername = generateTutorUsername(newTeacher.nombre);
      const teacherPassword = generateRandomPassword();
      const newTeacherUser: User = {
        id: 'usr-tch-' + Date.now(),
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
    apiClient.updateTeacher(id, cleanUpdates);
    setTeachers((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
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

    addActivityLog({
      modulo: 'Profesores y Personal',
      accion: 'Actualización de Docente',
      detalle: `Actualizó la asignación o datos del docente "${target?.nombre || id}".`,
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
    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveState('subjects', next);
      return next;
    });
    addActivityLog({
      modulo: 'Materias y Grupos',
      accion: 'Eliminación de Materia',
      detalle: `Eliminó la materia "${target?.nombre || id}".`,
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
      addActivityLog({
        modulo: 'Materias y Grupos',
        accion: 'Baja de Grupo Escolar',
        detalle: `Eliminó el grupo "${target.etiqueta}" del nivel ${target.nivel}.`,
        colegioId: target.colegioId,
      });
    }
  };

  const getGroupsForCollegeLevel = (colegioId: string, nivel: AcademicLevel): string[] => {
    // 1. Custom groups explicitly managed in Materias y Grupos for this college & level
    const customForLevel = collegeGroups.filter(
      (g) => g.colegioId === colegioId && g.nivel === nivel && g.activo
    );

    // 2. Also include any groups referenced in SubjectsModule for this college & level
    const subjectsForLevel = subjects.filter((s) => {
      if (s.colegioId !== colegioId) return false;
      if (s.nivel === nivel) return true;
      const gLower = (s.grado || '').toLowerCase();
      return gLower.includes(nivel.toLowerCase());
    });

    const subjectGroupLabels: string[] = [];
    subjectsForLevel.forEach((s) => {
      const gradeMatch = (s.grado || '').match(/([1-6]°)/);
      const gradePart = gradeMatch ? gradeMatch[1] : '';
      if (gradePart && s.grupo && s.grupo !== 'Sin Grupo' && !s.grupo.includes('Pendiente')) {
        subjectGroupLabels.push(`${gradePart} ${s.grupo.trim().toUpperCase()}`);
      }
    });

    const set = new Set<string>([
      ...customForLevel.map((g) => g.etiqueta),
      ...subjectGroupLabels,
    ]);
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
    addActivityLog({
      modulo: 'Ciclo Escolar',
      accion: 'Alta de Ciclo Escolar',
      detalle: `Dio de alta el ciclo escolar "${newCycle.nombre}" (${newCycle.fechaInicioClases} a ${newCycle.fechaFinClases}).`,
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

  // Monthly Tuition Payment Toggle
  const toggleMonthlyTuitionPayment = (
    colegioId: string,
    estudianteId: string,
    mesClave: string,
    mesEtiqueta: string,
    montoColegiatura: number,
    pagado: boolean
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
      if (existing) {
        const updatedRec: MonthlyTuitionRecord = {
          ...existing,
          pagado,
          montoColegiatura,
          fechaPago: pagado ? new Date().toISOString().split('T')[0] : undefined,
          metodoPago: pagado ? existing.metodoPago || 'Caja Escolar / SPEI' : undefined,
          folioRecibo: pagado
            ? existing.folioRecibo || `REC-${mesClave.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
            : undefined,
        };
        apiClient.saveMonthlyTuition(updatedRec);
        return prev.map((m) => (m.id === existing.id ? updatedRec : m));
      } else {
        const newRec: MonthlyTuitionRecord = {
          id: `tui-${mesClave}-${estudianteId}-${Date.now()}`,
          colegioId,
          estudianteId,
          mesClave,
          mesEtiqueta,
          montoColegiatura,
          pagado,
          fechaPago: pagado ? new Date().toISOString().split('T')[0] : undefined,
          metodoPago: pagado ? 'Caja Escolar / SPEI' : undefined,
          folioRecibo: pagado
            ? `REC-${mesClave.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
            : undefined,
        };
        apiClient.saveMonthlyTuition(newRec);
        return [...prev, newRec];
      }
    });
  };

  // Billing Concepts (Módulo Cobros) CRUD
  const addBillingConcept = (data: Omit<BillingConcept, 'id' | 'creadoEn'>): BillingConcept => {
    const newConcept: BillingConcept = {
      ...data,
      id: 'cob-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      creadoEn: new Date().toISOString().split('T')[0],
    };
    setBillingConcepts((prev) => [newConcept, ...prev]);
    apiClient.createBillingConcept(newConcept);
    addActivityLog({
      modulo: 'Cobros',
      accion: newConcept.esRecurrenteMensual ? 'Alta de Cobro Recurrente Mensual' : 'Alta de Concepto de Cobro',
      detalle: `Dio de alta el cobro "${newConcept.concepto}" por $${newConcept.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN${
        newConcept.esRecurrenteMensual
          ? ` (Recurrente cada mes, fecha de cobro: ${newConcept.fechaCobroMensual || `Día ${newConcept.diaCobroMensual || 10}`})`
          : ''
      }.`,
      colegioId: newConcept.colegioId,
    });
    return newConcept;
  };

  const updateBillingConcept = (id: string, updates: Partial<BillingConcept>) => {
    const target = billingConcepts.find((c) => c.id === id);
    apiClient.updateBillingConcept(id, updates);
    setBillingConcepts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    addActivityLog({
      modulo: 'Cobros',
      accion: 'Actualización de Concepto de Cobro',
      detalle: `Modificó el concepto de cobro "${target?.concepto || id}".`,
      colegioId: target?.colegioId,
    });
  };

  const deleteBillingConcept = (id: string) => {
    const target = billingConcepts.find((c) => c.id === id);
    apiClient.deleteBillingConcept(id);
    setBillingConcepts((prev) => prev.filter((c) => c.id !== id));
    addActivityLog({
      modulo: 'Cobros',
      accion: 'Eliminación de Concepto de Cobro',
      detalle: `Eliminó el concepto de cobro "${target?.concepto || id}".`,
      colegioId: target?.colegioId,
    });
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
    const existing = evaluationSavedPeriods.find(
      (p) =>
        (params.id && p.id === params.id) ||
        (p.colegioId === params.colegioId &&
          p.periodicidad === params.periodicidad &&
          p.periodoIndex === params.periodoIndex &&
          p.periodoNombre === params.periodoNombre)
    );

    const periodId =
      existing?.id ||
      params.id ||
      `eval-per-${params.colegioId}-${params.periodicidad}-P${params.periodoIndex}-${Date.now()}`;

    const savedObj: EvaluationSavedPeriod = {
      id: periodId,
      colegioId: params.colegioId,
      periodicidad: params.periodicidad,
      periodoIndex: params.periodoIndex,
      periodoNombre: params.periodoNombre,
      modoSeleccionFecha: params.modoSeleccionFecha || 'mes_completo',
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin,
      conceptos: params.conceptos.map((c) => ({
        ...c,
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
      detalle: `Guardó el periodo de evaluación "${EVALUATION_PERIODICITY_CONFIG[params.periodicidad]?.label || params.periodicidad} - ${params.periodoNombre}" con ${params.conceptos.length} conceptos (100%).`,
      colegioId: params.colegioId,
    });

    return savedObj;
  };

  const deleteEvaluationPeriod = (id: string) => {
    const target = evaluationSavedPeriods.find((p) => p.id === id);
    apiClient.deleteEvaluationPeriod(id);
    setEvaluationSavedPeriods((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      addActivityLog({
        modulo: 'Evaluaciones',
        accion: 'Eliminación de Periodo Guardado',
        detalle: `Eliminó el periodo guardado "${target.periodoNombre}".`,
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
    const entryId =
      entry.id ||
      `${entry.colegioId}_${entry.estudianteId}_${entry.materiaId}_${entry.periodicidad}_P${entry.periodoIndex}`;
    const saved: StudentEvaluationEntry = {
      ...entry,
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
          (g.materiaId === entry.materiaId || g.materiaNombre === materiaNombre)
      );

      if (existingGrade) {
        const currentModalidadArr =
          existingGrade.periodosPorModalidad?.[entry.periodicidad] ||
          Array.from({ length: meta.periodCount }, (_, i) => {
            if (i === 0) return existingGrade.periodo1 || finalScore;
            if (i === 1) return existingGrade.periodo2 || finalScore;
            if (i === 2) return existingGrade.periodo3 || finalScore;
            return existingGrade.promedioFinal || finalScore;
          });
        const updatedArr = [...currentModalidadArr];
        while (updatedArr.length < meta.periodCount) {
          updatedArr.push(existingGrade.promedioFinal || finalScore);
        }
        updatedArr[pIdx] = finalScore;

        const avg = Number(
          (updatedArr.reduce((acc, v) => acc + v, 0) / updatedArr.length).toFixed(1)
        );

        const p1 = entry.periodoIndex === 1 ? finalScore : existingGrade.periodo1;
        const p2 = entry.periodoIndex === 2 ? finalScore : existingGrade.periodo2;
        const p3 = entry.periodoIndex === 3 ? finalScore : existingGrade.periodo3;

        const gradeUpdates = {
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
        const newArr = Array.from({ length: meta.periodCount }, () => finalScore);
        const createdGrade: GradeRecord = {
          id: `grd-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          colegioId: entry.colegioId,
          estudianteId: entry.estudianteId,
          materiaId: entry.materiaId,
          materiaNombre,
          periodo1: finalScore,
          periodo2: finalScore,
          periodo3: finalScore,
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
    const newGrade: GradeRecord = {
      ...data,
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
    const newInc: IncidentRecord = {
      ...data,
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

  const addBook = (data: Omit<LibraryBook, 'id'>) => {
    const newBook: LibraryBook = {
      ...data,
      id: 'lib-' + Date.now(),
    };
    setLibraryBooks((prev) => [newBook, ...prev]);
    apiClient.createLibraryBook(newBook);
    addActivityLog({
      modulo: 'Biblioteca',
      accion: 'Alta de Libro',
      detalle: `Dio de alta el libro "${newBook.titulo}" (${newBook.autor}).`,
      colegioId: newBook.colegioId,
    });
  };

  const addNotice = (data: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...data,
      id: 'not-' + Date.now(),
    };
    setNotices((prev) => [newNotice, ...prev]);
    apiClient.createNotice(newNotice);
    addActivityLog({
      modulo: 'Comunicados y Avisos',
      accion: 'Publicación de Comunicado',
      detalle: `Publicó el comunicado "${newNotice.titulo}" dirigido a ${newNotice.destinatarios}.`,
      colegioId: newNotice.colegioId,
    });
  };

  const addTaskOrExam = (data: Omit<TaskOrExam, 'id'>) => {
    const newItem: TaskOrExam = {
      ...data,
      id: 'txe-' + Date.now(),
    };
    setTasksExams((prev) => [newItem, ...prev]);
    apiClient.createTaskOrExam(newItem);
    addActivityLog({
      modulo: 'Tareas y Exámenes',
      accion: newItem.tipo === 'examen' ? 'Alta de Examen' : 'Alta de Tarea',
      detalle: `Publicó ${newItem.tipo}: "${newItem.titulo}" para ${newItem.gradoGrupo} (${newItem.materia}).`,
      colegioId: newItem.colegioId,
    });
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id' | 'timestamp'>): AttendanceRecord => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    setAttendanceRecords((prev) => [newRecord, ...prev]);
    apiClient.createAttendance(newRecord);
    return newRecord;
  };

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteAttendanceRecord = (id: string) => {
    apiClient.deleteAttendance(id);
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
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
      foto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
      avatar: newStudent.foto,
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
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setEvaluationConcepts(INITIAL_EVALUATION_CONCEPTS);
    setStudentEvaluations(INITIAL_STUDENT_EVALUATIONS);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setCollegeRolePermissions({});
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedCollegeId(null);
    localStorage.clear();
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
        toggleModule,
        updateCollegeBranding,
        addUser,
        updateUser,
        deleteUser,
        addStudent,
        addStudentsBulk,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
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
        monthlyTuitions,
        toggleMonthlyTuitionPayment,
        billingConcepts,
        addBillingConcept,
        updateBillingConcept,
        deleteBillingConcept,
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
        addBook,
        addNotice,
        addTaskOrExam,
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
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        resetToDefaults,
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
