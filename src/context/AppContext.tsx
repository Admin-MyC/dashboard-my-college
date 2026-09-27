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
} from '../types';
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
} from '../data/initialData';
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
  dbStatus: DatabaseStatus | null;
  refreshDbStatus: () => Promise<void>;
  
  // Actions
  addCollege: (
    collegeData: Partial<College>,
    adminUserData: { nombre: string; correo: string; password?: string; telefono?: string }
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
  addStudent: (data: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (data: Omit<Teacher, 'id'>) => void;
  addSubject: (data: Omit<Subject, 'id'>) => void;
  addGrade: (data: Omit<GradeRecord, 'id'>) => void;
  updateGrade: (id: string, updates: Partial<GradeRecord>) => void;
  addIncident: (data: Omit<IncidentRecord, 'id'>) => void;
  updateIncident: (id: string, updates: Partial<IncidentRecord>) => void;
  addPsychologyRecord: (data: Omit<PsychologyRecord, 'id'>) => void;
  addBook: (data: Omit<LibraryBook, 'id'>) => void;
  addNotice: (data: Omit<Notice, 'id'>) => void;
  addTaskOrExam: (data: Omit<TaskOrExam, 'id'>) => void;
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

  const [colleges, setColleges] = useState<College[]>(() =>
    loadState('colleges', INITIAL_COLLEGES)
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadState('users', INITIAL_USERS)
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
        if (resp.data.users?.length) setUsers(resp.data.users);
        if (resp.data.students?.length) setStudents(resp.data.students);
        if (resp.data.teachers?.length) setTeachers(resp.data.teachers);
        if (resp.data.subjects?.length) setSubjects(resp.data.subjects);
        if (resp.data.grades?.length) setGrades(resp.data.grades);
        if (resp.data.incidents?.length) setIncidents(resp.data.incidents);
        if (resp.data.psychologyRecords?.length) setPsychologyRecords(resp.data.psychologyRecords);
        if (resp.data.libraryBooks?.length) setLibraryBooks(resp.data.libraryBooks);
        if (resp.data.notices?.length) setNotices(resp.data.notices);
        if (resp.data.activities?.length) setActivities(resp.data.activities);
        if (resp.data.tasksExams?.length) setTasksExams(resp.data.tasksExams);
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

  // Selected College ID in global navigation dropdown: null means "Panel General"
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'colleges', JSON.stringify(colleges));
  }, [colleges]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'students', JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'teachers', JSON.stringify(teachers));
  }, [teachers]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'subjects', JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'grades', JSON.stringify(grades));
  }, [grades]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'incidents', JSON.stringify(incidents));
  }, [incidents]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'psychology', JSON.stringify(psychologyRecords));
  }, [psychologyRecords]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'library', JSON.stringify(libraryBooks));
  }, [libraryBooks]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'notices', JSON.stringify(notices));
  }, [notices]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'activities', JSON.stringify(activities));
  }, [activities]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'tasks_exams', JSON.stringify(tasksExams));
  }, [tasksExams]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // If user changes and they belong strictly to a single college, automatically select that college
  useEffect(() => {
    if (currentUser.rol !== 'superusuario' && currentUser.colegioId) {
      setSelectedCollegeId(currentUser.colegioId);
    }
  }, [currentUser]);

  const activeCollege = selectedCollegeId
    ? colleges.find((c) => c.id === selectedCollegeId) || null
    : null;

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
  const addCollege = (
    collegeData: Partial<College>,
    adminUserData: { nombre: string; correo: string; password?: string; telefono?: string }
  ) => {
    const collegeId = 'col-' + Date.now();
    const adminUserId = 'usr-admin-' + Date.now();

    const initials = (collegeData.nombre || 'NC')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 3)
      .join('')
      .toUpperCase();

    const primaryCol = collegeData.colores?.primario || '#0B2545';
    const goldCol = collegeData.colores?.secundario || '#C59B27';

    const defaultShield = createShieldSvg(primaryCol, goldCol, initials, 'book');

    const newCollege: College = {
      id: collegeId,
      nombre: collegeData.nombre || 'Nuevo Colegio Registrado',
      codigoCCT: collegeData.codigoCCT || `CCT-${Math.floor(10 + Math.random() * 89)}PPR${Math.floor(100 + Math.random() * 899)}Z`,
      lema: collegeData.lema || 'Educación para el Futuro',
      nivel: collegeData.nivel || 'Primaria',
      escudoUrl: collegeData.escudoUrl || defaultShield,
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
        'usuarios',
        'comunicados',
      ],
      estadoPago: collegeData.estadoPago || 'al_corriente',
      plan: collegeData.plan || 'Básico',
      montoMensual: collegeData.montoMensual || 4500,
      fechaProximoPago: collegeData.fechaProximoPago || '2026-10-30',
      telefono: collegeData.telefono || '+52 (55) 0000-0000',
      correo: collegeData.correo || 'contacto@nuevo-colegio.edu.mx',
      direccion: collegeData.direccion || 'Dirección de la Institución',
      director: collegeData.director || adminUserData.nombre,
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
      password: adminUserData.password || 'admin123',
      rol: 'administrador',
      colegioId: collegeId,
      cargo: 'Administrador Institucional de Plantel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      telefono: adminUserData.telefono || '+52 (55) 1234-5678',
      activo: true,
      creadoEn: new Date().toISOString().split('T')[0],
      ultimoAcceso: 'Sin accesos previos',
    };

    setColleges((prev) => [newCollege, ...prev]);
    setUsers((prev) => [...prev, newAdminUser]);

    apiClient.createCollege(newCollege);
    apiClient.createUser(newAdminUser);

    return { college: newCollege, adminUser: newAdminUser };
  };

  const updateCollege = (id: string, updates: Partial<College>) => {
    setColleges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    apiClient.updateCollege(id, updates);
  };

  const deleteCollege = (id: string) => {
    apiClient.deleteCollege(id);
    setColleges((prev) => prev.filter((c) => c.id !== id));
    setUsers((prev) => prev.filter((u) => u.colegioId !== id));
    if (selectedCollegeId === id) {
      setSelectedCollegeId(null);
    }
  };

  const toggleModule = (collegeId: string, moduleId: CollegeModuleId, enable: boolean) => {
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
  };

  const updateCollegeBranding = (
    collegeId: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ) => {
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
  };

  const addUser = (userData: Omit<User, 'id' | 'creadoEn'>): User => {
    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now(),
      creadoEn: new Date().toISOString().split('T')[0],
      ultimoAcceso: 'Recién registrado',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
    setUsers((prev) => [newUser, ...prev]);
    apiClient.createUser(newUser);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    apiClient.updateUser(id, updates);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (id: string) => {
    apiClient.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addStudent = (data: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...data,
      id: 'std-' + Date.now(),
    };
    setStudents((prev) => [newStudent, ...prev]);
    apiClient.createStudent(newStudent);
    // update count
    setColleges((prev) =>
      prev.map((c) =>
        c.id === data.colegioId
          ? { ...c, alumnosTotales: c.alumnosTotales + 1 }
          : c
      )
    );
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    apiClient.updateStudent(id, updates);
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteStudent = (id: string) => {
    apiClient.deleteStudent(id);
    const student = students.find((s) => s.id === id);
    if (student) {
      setColleges((prev) =>
        prev.map((c) =>
          c.id === student.colegioId
            ? { ...c, alumnosTotales: Math.max(0, c.alumnosTotales - 1) }
            : c
        )
      );
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const addTeacher = (data: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...data,
      id: 'tch-' + Date.now(),
    };
    setTeachers((prev) => [newTeacher, ...prev]);
    setColleges((prev) =>
      prev.map((c) =>
        c.id === data.colegioId
          ? { ...c, docentesTotales: c.docentesTotales + 1 }
          : c
      )
    );
  };

  const addSubject = (data: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...data,
      id: 'sub-' + Date.now(),
    };
    setSubjects((prev) => [...prev, newSubject]);
  };

  const addGrade = (data: Omit<GradeRecord, 'id'>) => {
    const newGrade: GradeRecord = {
      ...data,
      id: 'grd-' + Date.now(),
    };
    setGrades((prev) => [newGrade, ...prev]);
  };

  const updateGrade = (id: string, updates: Partial<GradeRecord>) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const addIncident = (data: Omit<IncidentRecord, 'id'>) => {
    const newInc: IncidentRecord = {
      ...data,
      id: 'inc-' + Date.now(),
    };
    setIncidents((prev) => [newInc, ...prev]);
  };

  const updateIncident = (id: string, updates: Partial<IncidentRecord>) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const addPsychologyRecord = (data: Omit<PsychologyRecord, 'id'>) => {
    const newRec: PsychologyRecord = {
      ...data,
      id: 'psy-' + Date.now(),
    };
    setPsychologyRecords((prev) => [newRec, ...prev]);
  };

  const addBook = (data: Omit<LibraryBook, 'id'>) => {
    const newBook: LibraryBook = {
      ...data,
      id: 'lib-' + Date.now(),
    };
    setLibraryBooks((prev) => [newBook, ...prev]);
  };

  const addNotice = (data: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...data,
      id: 'not-' + Date.now(),
    };
    setNotices((prev) => [newNotice, ...prev]);
  };

  const addTaskOrExam = (data: Omit<TaskOrExam, 'id'>) => {
    const newItem: TaskOrExam = {
      ...data,
      id: 'txe-' + Date.now(),
    };
    setTasksExams((prev) => [newItem, ...prev]);
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
        updateStudent,
        deleteStudent,
        addTeacher,
        addSubject,
        addGrade,
        updateGrade,
        addIncident,
        updateIncident,
        addPsychologyRecord,
        addBook,
        addNotice,
        addTaskOrExam,
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
