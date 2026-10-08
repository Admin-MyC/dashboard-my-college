import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { GlobalDashboard } from './modules/GlobalDashboard';
import { CollegesModule } from './modules/CollegesModule';
import { UsersModule } from './modules/UsersModule';
import { CollegeDashboard } from './modules/CollegeDashboard';
import { StudentsModule } from './modules/StudentsModule';
import { GradesModule } from './modules/GradesModule';
import { TeachersModule } from './modules/TeachersModule';
import { SubjectsModule } from './modules/SubjectsModule';
import { TasksExamsModule } from './modules/TasksExamsModule';
import { IncidentsModule } from './modules/IncidentsModule';
import { PsychologyModule } from './modules/PsychologyModule';
import { LibraryModule } from './modules/LibraryModule';
import { NoticesModule } from './modules/NoticesModule';
import { PlansBillingModule } from './modules/PlansBillingModule';
import { CollegeCustomizerModule } from './modules/CollegeCustomizerModule';
import { AttendanceModule } from './modules/AttendanceModule';
import { PreenrollmentModule } from './components/PreenrollmentModule';
import { UserProfileModule } from './components/UserProfileModule';
import { TutorsModule } from './modules/TutorsModule';
import { TutorStudentsModule } from './modules/TutorStudentsModule';
import { TutorAcademicHistoryModule } from './modules/TutorAcademicHistoryModule';
import { TutorFeesModule } from './modules/TutorFeesModule';
import { BillingConceptsModule } from './modules/BillingConceptsModule';
import { PublicPreenrollmentModal } from './components/PublicPreenrollmentModal';
import { PublicTutorRegistrationModal } from './components/PublicTutorRegistrationModal';
import { PlatformFeeModule } from './modules/PlatformFeeModule';
import { StudentPortalModule } from './modules/StudentPortalModule';
import { SchoolCyclesModule } from './modules/SchoolCyclesModule';
import { SchoolCalendarModule } from './modules/SchoolCalendarModule';
import { SchedulesModule } from './modules/SchedulesModule';
import { CampusModule } from './modules/CampusModule';
import { PermissionsModule } from './modules/PermissionsModule';
import { ProfilesModule } from './modules/ProfilesModule';
import { ActivityLogsModule } from './modules/ActivityLogsModule';
import { EvaluationsModule } from './modules/EvaluationsModule';
import { SchoolSummaryModule } from './modules/SchoolSummaryModule';
import { PsychologySummaryModule } from './modules/PsychologySummaryModule';
import { TeacherSummaryModule } from './modules/TeacherSummaryModule';
import { SuperuserCredentialsModal } from './components/SuperuserCredentialsModal';
import { QuickLoginModal } from './components/QuickLoginModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import {
  startSessionHeartbeat,
  terminateUserSession,
  INACTIVITY_TIMEOUT_MS,
  recordUserActivity,
  getLastUserActivity,
  clearLastUserActivity,
} from './services/sessionService';
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_MODULES_REGISTRY, UserRole } from './types';

const getPrimarySummaryModuleForRole = (rol: UserRole): string => {
  if (rol === 'directivo' || rol === 'coordinador') return 'resumen_escolar';
  if (rol === 'psicologo') return 'resumen_psicologico';
  if (rol === 'docente') return 'resumen_docentes';
  return 'colegio_resumen';
};

const getFirstAllowedModuleForRole = (
  rol: UserRole,
  hasCollegeSelected: boolean,
  hasPermission?: (role: UserRole, modId: string) => boolean,
  customRoleOrder?: string[]
): string => {
  const check = (modId: string) => (hasPermission ? hasPermission(rol, modId) : true);

  // If a custom order is defined for this role in Permisos, pick the first enabled module from that order
  if (Array.isArray(customRoleOrder) && customRoleOrder.length > 0) {
    const globalModuleIds = [
      'dashboard_general',
      'colegios',
      'usuarios_globales',
      'perfiles',
      'permisos',
      'planes_modulos',
      'comisiones_plataforma',
      'bitacora_logs',
    ];
    const validForContext = customRoleOrder.filter((modId) => {
      if (rol === 'superusuario' && !hasCollegeSelected) {
        return globalModuleIds.includes(modId) || modId === 'preinscripciones' || modId === 'tutores' || modId === 'mi_perfil';
      }
      if (hasCollegeSelected) {
        return !globalModuleIds.includes(modId);
      }
      return true;
    });
    const firstCustom = validForContext.find(check);
    if (firstCustom) return firstCustom;
  }

  if (rol === 'alumno') {
    const alumnoOrder = ['mis_tareas', 'mis_examenes', 'mis_comunicados', 'mi_biblioteca', 'mi_perfil'];
    return alumnoOrder.find(check) || 'mi_perfil';
  }
  if (rol === 'tutor') {
    const tutorOrder = ['tutor_cuotas', 'comunicados', 'tutor_historial', 'tutor_alumnos', 'calendario', 'mi_perfil'];
    return tutorOrder.find(check) || 'mi_perfil';
  }
  if (rol === 'superusuario' && !hasCollegeSelected) {
    const globalOrder = [
      'dashboard_general',
      'colegios',
      'preinscripciones',
      'tutores',
      'usuarios_globales',
      'perfiles',
      'permisos',
      'planes_modulos',
      'comisiones_plataforma',
      'bitacora_logs',
      'mi_perfil',
    ];
    return globalOrder.find(check) || 'permisos';
  }

  // Primary first view for each college role (if enabled in permissions):
  // - Directivo & Coordinador -> resumen_escolar
  // - Psicólogo -> resumen_psicologico
  // - Docente -> resumen_docentes
  // - Administrador & Control Escolar -> colegio_resumen
  if ((rol === 'directivo' || rol === 'coordinador') && check('resumen_escolar')) {
    return 'resumen_escolar';
  }
  if (rol === 'psicologo' && check('resumen_psicologico')) {
    return 'resumen_psicologico';
  }
  if (rol === 'docente' && check('resumen_docentes')) {
    return 'resumen_docentes';
  }
  const rolLower = String(rol).toLowerCase();
  if (
    (rol === 'administrador' ||
      rol === 'supervisor' ||
      rol === 'prefecto' ||
      rolLower.includes('control_escolar') ||
      rolLower.includes('control escolar')) &&
    check('colegio_resumen')
  ) {
    return 'colegio_resumen';
  }

  const collegeOrder = SYSTEM_MODULES_REGISTRY.map((m) => m.id);
  return collegeOrder.find(check) || 'mi_perfil';
};

const AppContent: React.FC = () => {
  const {
    selectedCollegeId,
    setSelectedCollegeId,
    activeCollege,
    currentUser,
    rolePermissions,
    collegeRolePermissions,
    hasRolePermission,
  } = useApp();
  const mainScrollRef = React.useRef<HTMLElement | null>(null);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  // Authentication state: persists across page refreshes unless 15 minutes of inactivity have elapsed
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('my_college_v1_is_authenticated');
      const isAuth = savedAuth !== null ? savedAuth === 'true' : true;
      if (isAuth) {
        const lastRaw = localStorage.getItem('my_college_v1_last_activity_ts');
        if (lastRaw) {
          const lastTs = parseInt(lastRaw, 10);
          if (!isNaN(lastTs) && Date.now() - lastTs >= INACTIVITY_TIMEOUT_MS) {
            localStorage.setItem('my_college_v1_is_authenticated', 'false');
            localStorage.removeItem('my_college_v1_last_activity_ts');
            return false;
          }
        }
        recordUserActivity();
      }
      return isAuth;
    } catch {
      return true;
    }
  });

  // Keep authentication state stored
  useEffect(() => {
    try {
      localStorage.setItem('my_college_v1_is_authenticated', isAuthenticated ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Navigation tab state: persisted across refreshes in localStorage and sessionStorage
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const savedTab =
        sessionStorage.getItem('my_college_v1_current_tab') ||
        localStorage.getItem('my_college_v1_current_tab');
      if (savedTab) return savedTab;
    } catch {
      // ignore
    }
    return getFirstAllowedModuleForRole(
      currentUser?.rol || 'superusuario',
      Boolean(selectedCollegeId || currentUser?.colegioId),
      hasRolePermission
    );
  });

  // Track previous user/role/auth to detect actual login/logout/role-switch vs page reload
  const prevSessionRef = React.useRef({
    userId: currentUser?.id,
    rol: currentUser?.rol,
    isAuthenticated,
  });
  const [isSuperuserModalOpen, setIsSuperuserModalOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUrlPublicFormOpen, setIsUrlPublicFormOpen] = useState(false);
  const [isUrlTutorRegistrationOpen, setIsUrlTutorRegistrationOpen] = useState(false);
  const [urlCollegeId, setUrlCollegeId] = useState<string | null>(null);

  // Check URL query parameters or path on mount (e.g. /formulario-preinscripcion?form=preinscripcion&colegio=... or /formulario-registro-tutor?form=registro_tutor&colegio=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      const colParam = params.get('colegio');

      if (
        params.get('form') === 'preinscripcion' ||
        path.includes('preinscripcion')
      ) {
        setIsUrlPublicFormOpen(true);
        setUrlCollegeId(colParam);
      } else if (
        params.get('form') === 'registro_tutor' ||
        path.includes('registro-tutor') ||
        path.includes('registro_tutor')
      ) {
        setIsUrlTutorRegistrationOpen(true);
        setUrlCollegeId(colParam);
      } else if (params.get('alumno') || path.includes('asistencia')) {
        if (colParam) {
          setSelectedCollegeId(colParam);
        }
        setCurrentTab('asistencias');
      }
    }
  }, []);

  // Auto-route role to the FIRST module of the user's profile ONLY on actual login, logout, or user/role switch (not on page refresh!)
  useEffect(() => {
    const prev = prevSessionRef.current;
    const userOrRoleChanged =
      prev.userId !== currentUser?.id ||
      prev.rol !== currentUser?.rol ||
      prev.isAuthenticated !== isAuthenticated;

    prevSessionRef.current = {
      userId: currentUser?.id,
      rol: currentUser?.rol,
      isAuthenticated,
    };

    if (userOrRoleChanged) {
      const firstTab = getFirstAllowedModuleForRole(
        currentUser?.rol || 'superusuario',
        Boolean(selectedCollegeId || currentUser?.colegioId),
        hasRolePermission
      );
      setCurrentTab(firstTab);
      try {
        sessionStorage.setItem('my_college_v1_current_tab', firstTab);
        localStorage.setItem('my_college_v1_current_tab', firstTab);
      } catch {
        // ignore
      }
      scrollToTop();
      setTimeout(scrollToTop, 20);
    }
  }, [currentUser?.id, currentUser?.rol, isAuthenticated]);

  // If the currentTab is disabled for the active user's role in Permisos, redirect immediately to the first allowed module
  useEffect(() => {
    if (!currentUser) return;
    if (currentTab === 'permisos' && currentUser.rol === 'superusuario') return;
    if (!hasRolePermission(currentUser.rol, currentTab)) {
      const fallbackTab = getFirstAllowedModuleForRole(
        currentUser.rol,
        Boolean(selectedCollegeId || currentUser.colegioId),
        hasRolePermission
      );
      if (fallbackTab !== currentTab) {
        setCurrentTab(fallbackTab);
        try {
          sessionStorage.setItem('my_college_v1_current_tab', fallbackTab);
          localStorage.setItem('my_college_v1_current_tab', fallbackTab);
        } catch {
          // ignore
        }
      }
    }
  }, [rolePermissions, collegeRolePermissions, currentUser?.rol, currentTab, selectedCollegeId]);

  // If superusuario enters or leaves a college, ensure currentTab matches the view context
  const prevCollegeRef = React.useRef<string | null>(selectedCollegeId);
  useEffect(() => {
    if (prevCollegeRef.current !== selectedCollegeId) {
      const wasGlobal = prevCollegeRef.current === null;
      const isNowGlobal = selectedCollegeId === null;
      prevCollegeRef.current = selectedCollegeId;

      if (wasGlobal && !isNowGlobal) {
        const firstTab = getFirstAllowedModuleForRole(
          currentUser?.rol || 'superusuario',
          true,
          (r, modId) => hasRolePermission(r, modId, selectedCollegeId)
        );
        setCurrentTab(firstTab);
        try {
          sessionStorage.setItem('my_college_v1_current_tab', firstTab);
          localStorage.setItem('my_college_v1_current_tab', firstTab);
        } catch {
          // ignore
        }
      } else if (!wasGlobal && isNowGlobal && currentUser?.rol === 'superusuario') {
        setCurrentTab('dashboard_general');
        try {
          sessionStorage.setItem('my_college_v1_current_tab', 'dashboard_general');
          localStorage.setItem('my_college_v1_current_tab', 'dashboard_general');
        } catch {
          // ignore
        }
      }
    }
  }, [selectedCollegeId, currentUser?.rol]);

  // Always position at the top whenever currentTab, authentication state, or selectedCollegeId changes
  useEffect(() => {
    scrollToTop();
    const timer = setTimeout(scrollToTop, 20);
    return () => clearTimeout(timer);
  }, [currentTab, isAuthenticated, selectedCollegeId]);

  // Single Active Session Heartbeat & Concurrency Detection
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const stopHeartbeat = startSessionHeartbeat(currentUser, (reason) => {
        alert(reason || 'Usuario con sesíon activa en otro dispositivo');
        handleLogout();
      });
      return () => stopHeartbeat();
    }
  }, [isAuthenticated, currentUser?.id]);

  // 15-Minute Inactivity Session Timeout (closes session automatically if no movement/interaction is detected for 15 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastRecorded = 0;

    const resetInactivityTimer = () => {
      const now = Date.now();
      // Throttle localStorage writes to once per second while keeping timer responsive
      if (now - lastRecorded > 1000) {
        lastRecorded = now;
        recordUserActivity();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const checkElapsedInactivity = () => {
      const elapsed = Date.now() - getLastUserActivity();
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleLogout();
      }
    };

    // Initialize activity timestamp and timer on session start
    recordUserActivity();
    resetInactivityTimer();

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    // Periodic check every 15 seconds (handles computer sleep/wake or background tab)
    const intervalCheckId = setInterval(checkElapsedInactivity, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkElapsedInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(intervalCheckId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetInactivityTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, currentUser?.id]);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    try {
      sessionStorage.setItem('my_college_v1_current_tab', tab);
      localStorage.setItem('my_college_v1_current_tab', tab);
    } catch {
      // ignore
    }
    setIsMobileNavOpen(false);
    scrollToTop();
  };

  const handleLogout = async () => {
    if (currentUser) {
      await terminateUserSession(currentUser);
    }
    const firstTab = getFirstAllowedModuleForRole(
      currentUser?.rol || 'superusuario',
      false,
      hasRolePermission
    );
    setCurrentTab(firstTab);
    setIsAuthenticated(false);
    try {
      localStorage.setItem('my_college_v1_is_authenticated', 'false');
      localStorage.removeItem('my_college_v1_selected_college_id');
      localStorage.removeItem('my_college_v1_current_tab');
      sessionStorage.removeItem('my_college_v1_current_tab');
      clearLastUserActivity();
    } catch {
      // ignore
    }
    setSelectedCollegeId(null);
    setIsMobileNavOpen(false);
    scrollToTop();
    setTimeout(scrollToTop, 20);
  };

  // If user is not authenticated, show strictly the login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(loggedInUser) => {
            const userObj = loggedInUser || currentUser;
            const firstTab = getFirstAllowedModuleForRole(
              userObj?.rol || 'superusuario',
              Boolean(userObj?.colegioId),
              hasRolePermission
            );
            setCurrentTab(firstTab);
            try {
              sessionStorage.setItem('my_college_v1_current_tab', firstTab);
              localStorage.setItem('my_college_v1_current_tab', firstTab);
              recordUserActivity();
            } catch {
              // ignore
            }
            setIsAuthenticated(true);
            setTimeout(scrollToTop, 0);
          }}
          onOpenPublicPreenrollment={() => setIsUrlPublicFormOpen(true)}
          onOpenTutorRegistration={() => setIsUrlTutorRegistrationOpen(true)}
        />
        <PublicPreenrollmentModal
          isOpen={isUrlPublicFormOpen}
          onClose={() => setIsUrlPublicFormOpen(false)}
          defaultCollegeId={urlCollegeId}
        />
        <PublicTutorRegistrationModal
          isOpen={isUrlTutorRegistrationOpen}
          onClose={() => setIsUrlTutorRegistrationOpen(false)}
          defaultCollegeId={urlCollegeId}
        />
      </>
    );
  }

  // Render main dashboard view when authenticated
  const renderCurrentView = () => {
    // If logged in as Alumno, route strictly to the requested student modules
    if (currentUser.rol === 'alumno') {
      switch (currentTab) {
        case 'mis_tareas':
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
        case 'mis_examenes':
          return <StudentPortalModule initialTab="mis_examenes" onNavigateTab={handleSelectTab} />;
        case 'mis_comunicados':
          return <StudentPortalModule initialTab="mis_comunicados" onNavigateTab={handleSelectTab} />;
        case 'mi_biblioteca':
          return <StudentPortalModule initialTab="mi_biblioteca" onNavigateTab={handleSelectTab} />;
        case 'mi_perfil':
          return <UserProfileModule />;
        default:
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
      }
    }

    // If logged in as Tutor, route strictly to the allowed Tutor modules (first module is tutor_cuotas)
    if (currentUser.rol === 'tutor') {
      switch (currentTab) {
        case 'tutor_cuotas':
          return <TutorFeesModule onNavigateTab={handleSelectTab} />;
        case 'comunicados':
          return <NoticesModule />;
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
        case 'estudiantes':
          return <TutorStudentsModule onNavigateTab={handleSelectTab} />;
        case 'calendario':
          return <SchoolCalendarModule />;
        case 'mi_perfil':
          return <UserProfileModule />;
        default:
          return <TutorFeesModule onNavigateTab={handleSelectTab} />;
      }
    }

    if (selectedCollegeId === null) {
      // Global View (Superusuario Maestro)
      switch (currentTab) {
        case 'dashboard_general':
          return (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => {
                setCurrentTab('colegios');
              }}
            />
          );
        case 'colegios':
          return <CollegesModule onNavigateTab={handleSelectTab} />;
        case 'preinscripciones':
          return <PreenrollmentModule onNavigateTab={handleSelectTab} />;
        case 'tutores':
          return <TutorsModule collegeIdFilter={null} />;
        case 'usuarios_globales':
          return <UsersModule />;
        case 'perfiles':
          return <ProfilesModule />;
        case 'permisos':
          return <PermissionsModule />;
        case 'planes_modulos':
          return <PlansBillingModule />;
        case 'comisiones_plataforma':
          return <PlatformFeeModule />;
        case 'bitacora_logs':
          return <ActivityLogsModule />;
        case 'mis_tareas':
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
        case 'mis_examenes':
          return <StudentPortalModule initialTab="mis_examenes" onNavigateTab={handleSelectTab} />;
        case 'mis_comunicados':
          return <StudentPortalModule initialTab="mis_comunicados" onNavigateTab={handleSelectTab} />;
        case 'mi_biblioteca':
          return <StudentPortalModule initialTab="mi_biblioteca" onNavigateTab={handleSelectTab} />;
        case 'mi_perfil':
          return <UserProfileModule />;
        case 'tutor_cuotas':
          return <TutorFeesModule onNavigateTab={handleSelectTab} />;
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
          return <TutorStudentsModule onNavigateTab={handleSelectTab} />;
        case 'calendario':
          return <SchoolCalendarModule />;
        default:
          return (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          );
      }
    } else {
      // College-specific scoped view
      switch (currentTab) {
        case 'colegio_resumen':
          return <CollegeDashboard onNavigateTab={handleSelectTab} />;
        case 'resumen_escolar':
          return <SchoolSummaryModule onNavigateTab={handleSelectTab} />;
        case 'resumen_psicologico':
          return <PsychologySummaryModule onNavigateTab={handleSelectTab} />;
        case 'resumen_docentes':
          return <TeacherSummaryModule onNavigateTab={handleSelectTab} />;
        case 'campus':
          return <CampusModule />;
        case 'ciclo_escolar':
          return <SchoolCyclesModule />;
        case 'calendario':
          return <SchoolCalendarModule />;
        case 'horarios':
          return <SchedulesModule />;
        case 'preinscripciones':
          return <PreenrollmentModule onNavigateTab={handleSelectTab} />;
        case 'tutores':
          return <TutorsModule collegeIdFilter={activeCollege?.id || null} />;
        case 'cobros':
          return <BillingConceptsModule />;
        case 'estudiantes':
        case 'control_escolar':
          return <StudentsModule />;
        case 'evaluaciones':
          return <EvaluationsModule />;
        case 'calificaciones':
          return <GradesModule />;
        case 'asistencias':
          return <AttendanceModule />;
        case 'docentes':
        case 'actividades_docentes':
          return <TeachersModule onNavigateTab={handleSelectTab} />;
        case 'materias':
          return <SubjectsModule />;
        case 'tareas_examenes':
          return <TasksExamsModule />;
        case 'incidencias':
          return <IncidentsModule />;
        case 'psicologia':
          return <PsychologyModule />;
        case 'biblioteca':
          return <LibraryModule />;
        case 'comunicados':
          return <NoticesModule />;
        case 'usuarios_colegio':
          return <UsersModule collegeIdFilter={activeCollege?.id || null} />;
        case 'personalizar':
        case 'personalizacion':
          return <CollegeCustomizerModule />;
        case 'comisiones_plataforma':
          return <PlatformFeeModule />;
        case 'mis_tareas':
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
        case 'mis_examenes':
          return <StudentPortalModule initialTab="mis_examenes" onNavigateTab={handleSelectTab} />;
        case 'mis_comunicados':
          return <StudentPortalModule initialTab="mis_comunicados" onNavigateTab={handleSelectTab} />;
        case 'mi_biblioteca':
          return <StudentPortalModule initialTab="mi_biblioteca" onNavigateTab={handleSelectTab} />;
        case 'mi_perfil':
          return <UserProfileModule />;
        case 'tutor_cuotas':
          return <TutorFeesModule onNavigateTab={handleSelectTab} />;
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
          return <TutorStudentsModule onNavigateTab={handleSelectTab} />;
        default:
          if (currentUser.rol === 'directivo' || currentUser.rol === 'coordinador') {
            return <SchoolSummaryModule onNavigateTab={handleSelectTab} />;
          }
          if (currentUser.rol === 'psicologo') {
            return <PsychologySummaryModule onNavigateTab={handleSelectTab} />;
          }
          if (currentUser.rol === 'docente') {
            return <TeacherSummaryModule onNavigateTab={handleSelectTab} />;
          }
          return <CollegeDashboard onNavigateTab={handleSelectTab} />;
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col antialiased">
      {/* Top Header with mobile hamburger, notification center, and security audit */}
      <Header
        onOpenSuperuserModal={() => setIsSuperuserModalOpen(true)}
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
        onLogout={handleLogout}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        onOpenNotificationsModal={() => setIsNotificationModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onNavigateTab={handleSelectTab}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar with mobile drawer support */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area - Responsive padding across all devices */}
        <main
          ref={mainScrollRef}
          className="flex-1 min-h-0 overflow-y-auto bg-slate-50"
        >
          <div className="p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <SuperuserCredentialsModal
        isOpen={isSuperuserModalOpen}
        onClose={() => setIsSuperuserModalOpen(false)}
      />

      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <SecurityAuditModal
        isOpen={isSecurityModalOpen && currentUser.rol === 'superusuario'}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <PublicPreenrollmentModal
        isOpen={isUrlPublicFormOpen}
        onClose={() => setIsUrlPublicFormOpen(false)}
        defaultCollegeId={urlCollegeId}
      />

      <PublicTutorRegistrationModal
        isOpen={isUrlTutorRegistrationOpen}
        onClose={() => setIsUrlTutorRegistrationOpen(false)}
        defaultCollegeId={urlCollegeId}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
