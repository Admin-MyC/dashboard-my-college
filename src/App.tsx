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
import { ExpedientesModule } from './modules/ExpedientesModule';
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
import { MyNoticesModule } from './modules/MyNoticesModule';
import { CafeteriaModule } from './modules/CafeteriaModule';
import { TutorCafeteriaModule } from './modules/TutorCafeteriaModule';
import { SuperuserCredentialsModal } from './components/SuperuserCredentialsModal';
import { QuickLoginModal } from './components/QuickLoginModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { DriveScreenModal } from './components/DriveScreenModal';
import { TutorEnFilaModal } from './components/TutorEnFilaModal';
import {
  startSessionHeartbeat,
  terminateUserSession,
  INACTIVITY_TIMEOUT_MS,
  recordUserActivity,
  getLastUserActivity,
  clearLastUserActivity,
} from './services/sessionService';
import {
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_MODULES_REGISTRY,
  UserRole,
  TriggerEnFilaResult,
} from './types';

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
    const validForContext = [
      ...customRoleOrder.filter((id) => id !== 'mi_perfil'),
      ...(customRoleOrder.includes('mi_perfil') ? ['mi_perfil'] : []),
    ].filter((modId) => {
      if ((rol === 'superusuario' || rol === 'soporte') && !hasCollegeSelected) {
        if (
          rol === 'soporte' &&
          (modId === 'perfiles' || modId === 'planes_modulos' || modId === 'comisiones_plataforma')
        ) {
          return false;
        }
        return globalModuleIds.includes(modId) || modId === 'mi_perfil';
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
    const tutorOrder = ['tutor_cuotas', 'mi_cafeteria', 'mis_comunicados', 'tutor_historial', 'tutor_alumnos', 'calendario', 'mi_perfil'];
    return tutorOrder.find(check) || 'mi_perfil';
  }
  if ((rol === 'superusuario' || rol === 'soporte') && !hasCollegeSelected) {
    const globalOrder = [
      'dashboard_general',
      'colegios',
      'usuarios_globales',
      'perfiles',
      'permisos',
      'planes_modulos',
      'comisiones_plataforma',
      'bitacora_logs',
      'mi_perfil',
    ];
    return globalOrder.find(check) || 'dashboard_general';
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
    (rol === 'superusuario' ||
      rol === 'soporte' ||
      rol === 'administrador' ||
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
    colleges,
    users,
    currentUser,
    isSuperuserSession,
    resetRoleToSuperuser,
    toggleCollegeActiveStatus,
    rolePermissions,
    collegeRolePermissions,
    hasRolePermission,
    supportAccessRequests,
    requestSupportCollegeAccess,
    respondToSupportCollegeAccess,
    clearSupportCollegeAccess,
    deactivateCollegeSupportMode,
    requestDemoRenewalContact,
    triggerTutorEnFila,
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

  // Authentication state: persists across page refreshes
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth =
        sessionStorage.getItem('my_college_v1_is_authenticated') ??
        localStorage.getItem('my_college_v1_is_authenticated');
      const isAuth = savedAuth !== null ? savedAuth === 'true' : true;
      if (isAuth) {
        recordUserActivity();
      }
      return isAuth;
    } catch {
      return true;
    }
  });

  // Keep authentication state stored in both sessionStorage and localStorage so page refresh never logs out
  useEffect(() => {
    const val = isAuthenticated ? 'true' : 'false';
    try {
      sessionStorage.setItem('my_college_v1_is_authenticated', val);
    } catch {
      // ignore
    }
    try {
      localStorage.setItem('my_college_v1_is_authenticated', val);
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
      Boolean(
        selectedCollegeId ||
          (currentUser?.rol !== 'superusuario' &&
            currentUser?.rol !== 'soporte' &&
            currentUser?.colegioId)
      ),
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
  const [demoContactSentFeedback, setDemoContactSentFeedback] = useState(false);
  const [isDriveScreenOpen, setIsDriveScreenOpen] = useState(false);
  const [enFilaModalResult, setEnFilaModalResult] = useState<TriggerEnFilaResult | null>(null);

  const handleTriggerEnFila = (studentIds?: string[]) => {
    const res = triggerTutorEnFila(
      studentIds && studentIds.length > 0 ? { studentIds } : undefined
    );
    setEnFilaModalResult(res);
  };

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
      const hasCol = Boolean(
        selectedCollegeId ||
          (currentUser?.rol !== 'superusuario' &&
            currentUser?.rol !== 'soporte' &&
            currentUser?.colegioId)
      );
      const firstTab = getFirstAllowedModuleForRole(
        currentUser?.rol || 'superusuario',
        hasCol,
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
    if (currentTab === 'permisos' && (currentUser.rol === 'superusuario' || currentUser.rol === 'soporte')) return;
    if (!hasRolePermission(currentUser.rol, currentTab)) {
      const hasCol = Boolean(
        selectedCollegeId ||
          (currentUser.rol !== 'superusuario' &&
            currentUser.rol !== 'soporte' &&
            currentUser.colegioId)
      );
      const fallbackTab = getFirstAllowedModuleForRole(
        currentUser.rol,
        hasCol,
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

  // If superusuario or soporte enters or leaves a college, ensure currentTab matches the view context
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
      } else if (
        !wasGlobal &&
        isNowGlobal &&
        (currentUser?.rol === 'superusuario' || currentUser?.rol === 'soporte')
      ) {
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
      const stopHeartbeat = startSessionHeartbeat(currentUser, (_reason) => {
        handleLogout();
      });
      return () => stopHeartbeat();
    }
  }, [isAuthenticated, currentUser?.id]);

  // Deny access immediately if the currently logged-in user (except superusuario, tutor, alumno) is explicitly marked inactive
  useEffect(() => {
    if (!isAuthenticated || !currentUser || isSuperuserSession) return;
    const roleLower = String(currentUser.rol || '').toLowerCase();
    if (roleLower === 'superusuario' || roleLower === 'tutor' || roleLower === 'alumno') {
      return;
    }
    const matchedInStore = users.find((u) => u.id === currentUser.id);
    if (matchedInStore && matchedInStore.activo === false) {
      handleLogout();
    } else if (currentUser.activo === false) {
      handleLogout();
    }
  }, [isAuthenticated, currentUser, users, isSuperuserSession]);

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
      sessionStorage.setItem('my_college_v1_is_authenticated', 'false');
      localStorage.setItem('my_college_v1_is_authenticated', 'false');
      localStorage.removeItem('my_college_v1_selected_college_id');
      sessionStorage.removeItem('my_college_v1_selected_college_id');
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
            const hasCol = Boolean(
              userObj?.rol !== 'superusuario' &&
                userObj?.rol !== 'soporte' &&
                userObj?.colegioId
            );
            const firstTab = getFirstAllowedModuleForRole(
              userObj?.rol || 'superusuario',
              hasCol,
              hasRolePermission
            );
            setCurrentTab(firstTab);
            try {
              sessionStorage.setItem('my_college_v1_is_authenticated', 'true');
              localStorage.setItem('my_college_v1_is_authenticated', 'true');
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

  // Check if the user's college or currently selected college is deactivated (activo === false)
  const currentUserCollege =
    currentUser.rol !== 'superusuario' && currentUser.rol !== 'soporte'
      ? colleges.find((c) => c.id === currentUser.colegioId) ||
        colleges.find((c) => c.adminUserId === currentUser.id) ||
        activeCollege
      : activeCollege;

  const isCurrentCollegeDeactivated = Boolean(
    currentUserCollege && currentUserCollege.activo === false
  );

  // Check if current Administrator has any pending Support access request for their college
  const adminManagedCollege =
    currentUser.rol === 'administrador'
      ? colleges.find((c) => c.id === currentUser.colegioId) ||
        colleges.find((c) => c.adminUserId === currentUser.id) ||
        activeCollege
      : null;

  const pendingSupportRequestForAdmin =
    currentUser.rol === 'administrador'
      ? (adminManagedCollege &&
          supportAccessRequests[adminManagedCollege.id]?.status === 'pending' &&
          supportAccessRequests[adminManagedCollege.id]) ||
        Object.values(supportAccessRequests).find(
          (req) =>
            req.status === 'pending' &&
            (req.colegioId === currentUser.colegioId ||
              req.colegioId === selectedCollegeId ||
              colleges.find((c) => c.id === req.colegioId)?.adminUserId === currentUser.id)
        ) ||
        null
      : null;

  // Check if the current Administrator's college is in 'demo' operation and 1 month has elapsed
  const isCollegeDemoExpired = (col: typeof adminManagedCollege): boolean => {
    if (!col || col.operacion !== 'demo') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (col.fechaExpiracionDemo) {
      return todayStr >= col.fechaExpiracionDemo;
    }
    if (col.creadoEn) {
      const created = new Date(col.creadoEn + 'T00:00:00');
      if (!isNaN(created.getTime())) {
        const exp = new Date(created);
        exp.setMonth(exp.getMonth() + 1);
        const expStr = exp.toISOString().split('T')[0];
        return todayStr >= expStr;
      }
    }
    return false;
  };

  const isAdminDemoExpired =
    currentUser.rol === 'administrador' &&
    !isSuperuserSession &&
    Boolean(adminManagedCollege && isCollegeDemoExpired(adminManagedCollege));

  // Render main dashboard view when authenticated
  const renderCurrentView = () => {
    // Support role authorization gate when attempting to enter a college
    // If Modo Soporte is active (enabled once at college creation and not yet deactivated), Support enters without authorization
    const isSupportModeBypassActive = Boolean(
      activeCollege?.modoSoporteActivo && !activeCollege?.modoSoporteDesactivadoPermanentemente
    );

    if (
      currentUser.rol === 'soporte' &&
      selectedCollegeId &&
      activeCollege &&
      !isSupportModeBypassActive
    ) {
      const supportReq = supportAccessRequests[activeCollege.id];
      const reqStatus = supportReq?.status;

      if (reqStatus !== 'accepted') {
        return (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 animate-in fade-in">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-xs ${
                  reqStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${
                    reqStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-sky-100 text-sky-900 border-sky-300'
                  }`}
                >
                  {reqStatus === 'rejected'
                    ? 'Solicitud Rechazada · Acceso Restringido'
                    : reqStatus === 'pending'
                    ? 'Solicitud Enviada · Esperando Respuesta'
                    : 'Perfil Soporte · Autorización Requerida'}
                </span>

                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                  {activeCollege.nombre}
                </h2>

                {reqStatus === 'rejected' ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-1">
                    <p className="font-display font-extrabold text-base sm:text-lg text-rose-800">
                      Acceso denegado por el Administrador
                    </p>
                    <p className="text-xs text-rose-700">
                      El Administrador del colegio ha rechazado la solicitud de ingreso a los módulos de esta institución.
                    </p>
                  </div>
                ) : reqStatus === 'pending' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                    <div className="flex items-center justify-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Esperando confirmación del Administrador del colegio...</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Se ha enviado una notificación emergente en pantalla (pop push) al Administrador de{' '}
                      <strong>{activeCollege.nombre}</strong>. En cuanto acepte la solicitud, accederás automáticamente a los módulos del colegio.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                    Se necesita autorización del Administrador para ingresar a este colegio
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {reqStatus !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => requestSupportCollegeAccess(activeCollege.id)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
                  >
                    Solicitar permiso
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearSupportCollegeAccess(activeCollege.id);
                    setSelectedCollegeId(null);
                    handleSelectTab('dashboard_general');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      }
    }

    if (isCurrentCollegeDeactivated && currentUserCollege) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black uppercase tracking-wider">
                Colegio Desactivado · Acceso Restringido
              </span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                {currentUserCollege.nombre}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                El acceso a todos los perfiles y usuarios de esta institución se encuentra temporalmente restringido hasta que el estatus del colegio cambie a <strong>Activo</strong>. Toda la información del colegio permanece resguardada.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {isSuperuserSession || currentUser.rol === 'soporte' ? (
                <>
                  {currentUser.rol === 'superusuario' && (
                    <button
                      onClick={() => toggleCollegeActiveStatus(currentUserCollege.id, true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                    >
                      Cambiar Estatus a Activo
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentUser.rol !== 'soporte') {
                        resetRoleToSuperuser();
                      }
                      setSelectedCollegeId(null);
                      handleSelectTab('dashboard_general');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                  >
                    Volver al Dashboard Global
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // If logged in as Alumno, route strictly to the requested student modules
    // If logged in as Alumno, route to allowed student modules (with full fallback to other permitted modules)
    if (currentUser.rol === 'alumno') {
      switch (currentTab) {
        case 'mis_tareas':
        case 'tareas_examenes':
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
        case 'mis_examenes':
          return <StudentPortalModule initialTab="mis_examenes" onNavigateTab={handleSelectTab} />;
        case 'mis_comunicados':
        case 'comunicados':
          return <StudentPortalModule initialTab="mis_comunicados" onNavigateTab={handleSelectTab} />;
        case 'mi_biblioteca':
        case 'biblioteca':
          return <StudentPortalModule initialTab="mi_biblioteca" onNavigateTab={handleSelectTab} />;
        case 'calendario':
          return <SchoolCalendarModule />;
        case 'horarios':
          return <SchedulesModule />;
        case 'calificaciones':
          return <GradesModule onNavigateTab={handleSelectTab} />;
        case 'asistencias':
          return <AttendanceModule />;
        case 'mi_perfil':
          return <UserProfileModule />;
        default:
          return <StudentPortalModule initialTab="mis_tareas" onNavigateTab={handleSelectTab} />;
      }
    }

    // If logged in as Tutor, route to allowed Tutor modules
    if (currentUser.rol === 'tutor') {
      switch (currentTab) {
        case 'tutor_cuotas':
          return (
            <TutorFeesModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
        case 'mi_cafeteria':
        case 'cafeteria':
          return <TutorCafeteriaModule onNavigateTab={handleSelectTab} />;
        case 'mis_comunicados':
        case 'comunicados':
          return <MyNoticesModule onNavigateTab={handleSelectTab} />;
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
        case 'estudiantes':
          return (
            <TutorStudentsModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
        case 'calendario':
          return <SchoolCalendarModule />;
        case 'horarios':
          return <SchedulesModule />;
        case 'tareas_examenes':
          return <TasksExamsModule />;
        case 'asistencias':
          return <AttendanceModule />;
        case 'incidencias':
          return <IncidentsModule />;
        case 'biblioteca':
          return <LibraryModule />;
        case 'mi_perfil':
          return <UserProfileModule />;
        default:
          return (
            <TutorFeesModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
      }
    }

    if (selectedCollegeId === null) {
      // Global View (Superusuario & Soporte)
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
        case 'usuarios_globales':
          return <UsersModule />;
        case 'perfiles':
          return currentUser.rol === 'soporte' ? (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          ) : (
            <ProfilesModule />
          );
        case 'permisos':
          return <PermissionsModule />;
        case 'planes_modulos':
          return currentUser.rol === 'soporte' ? (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          ) : (
            <PlansBillingModule />
          );
        case 'comisiones_plataforma':
          return currentUser.rol === 'soporte' ? (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          ) : (
            <PlatformFeeModule />
          );
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
          return (
            <TutorFeesModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
          return (
            <TutorStudentsModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
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
          return <BillingConceptsModule initialTab="conceptos" />;
        case 'pagos':
          return <BillingConceptsModule initialTab="corte" />;
        case 'estudiantes':
        case 'control_escolar':
          return <StudentsModule />;
        case 'evaluaciones':
          return <EvaluationsModule onNavigateTab={handleSelectTab} />;
        case 'calificaciones':
          return <GradesModule onNavigateTab={handleSelectTab} />;
        case 'asistencias':
          return <AttendanceModule />;
        case 'docentes':
          return <TeachersModule mode="docentes" onNavigateTab={handleSelectTab} />;
        case 'actividades_docentes':
          return <TeachersModule mode="planeaciones" onNavigateTab={handleSelectTab} />;
        case 'materias':
          return <SubjectsModule />;
        case 'tareas_examenes':
          return <TasksExamsModule />;
        case 'incidencias':
          return <IncidentsModule />;
        case 'psicologia':
          return <PsychologyModule onNavigateTab={handleSelectTab} />;
        case 'expedientes':
          return <ExpedientesModule onNavigateTab={handleSelectTab} />;
        case 'biblioteca':
          return <LibraryModule />;
        case 'comunicados':
          return <NoticesModule onNavigateTab={handleSelectTab} />;
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
          return (
            <TutorFeesModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
        case 'mi_cafeteria':
          return <TutorCafeteriaModule onNavigateTab={handleSelectTab} />;
        case 'cafeteria':
          return <CafeteriaModule onNavigateTab={handleSelectTab} />;
        case 'tutor_historial':
          return <TutorAcademicHistoryModule onNavigateTab={handleSelectTab} />;
        case 'tutor_alumnos':
          return (
            <TutorStudentsModule
              onNavigateTab={handleSelectTab}
              onTriggerEnFila={handleTriggerEnFila}
            />
          );
        case 'dashboard_general':
          return (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          );
        case 'colegios':
          return <CollegesModule onNavigateTab={handleSelectTab} />;
        case 'usuarios_globales':
          return <UsersModule />;
        case 'perfiles':
          return <ProfilesModule />;
        case 'permisos':
          return <PermissionsModule />;
        case 'planes_modulos':
          return <PlansBillingModule />;
        case 'bitacora_logs':
          return <ActivityLogsModule />;
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
    <div className="h-screen w-full max-w-[100vw] overflow-hidden bg-slate-50 flex flex-col antialiased">
      {/* Top Header with mobile hamburger, notification center, and security audit */}
      <Header
        onOpenSuperuserModal={() => setIsSuperuserModalOpen(true)}
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
        onLogout={handleLogout}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        onOpenNotificationsModal={() => setIsNotificationModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onNavigateTab={handleSelectTab}
        onOpenDriveScreen={() => setIsDriveScreenOpen(true)}
        onTriggerEnFila={() => handleTriggerEnFila()}
      />

      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* Sidebar with mobile drawer support */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          onOpenDriveScreen={() => setIsDriveScreenOpen(true)}
          onTriggerEnFila={() => handleTriggerEnFila()}
        />

        {/* Main Content Area - Responsive padding across all devices */}
        <main
          ref={mainScrollRef}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-slate-50"
        >
          <div className="p-3 pb-24 sm:p-5 sm:pb-24 lg:p-8 max-w-7xl w-full min-w-0 mx-auto">
            {selectedCollegeId &&
              activeCollege &&
              activeCollege.modoSoporteActivo &&
              !activeCollege.modoSoporteDesactivadoPermanentemente &&
              (currentUser.rol === 'soporte' ||
                currentUser.rol === 'superusuario' ||
                currentUser.rol === 'administrador') && (
                <div className="mb-4 p-3.5 rounded-2xl bg-sky-50 border border-sky-300 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse shrink-0" />
                    <div>
                      <span className="font-extrabold text-sky-900">
                        Modo Soporte Activo en {activeCollege.nombre}:
                      </span>{' '}
                      <span>
                        El usuario de Soporte puede ingresar sin autorización del Administrador para apoyar en el alta de grupos, docentes, etc. Una vez desactivado ya no se podrá volver a activar.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deactivateCollegeSupportMode(activeCollege.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors"
                  >
                    Desactivar Modo Soporte
                  </button>
                </div>
              )}
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

      {/* Full-Screen Drive Monitor (for all roles except tutor and alumno) */}
      <DriveScreenModal
        isOpen={isDriveScreenOpen}
        onClose={() => setIsDriveScreenOpen(false)}
      />

      {/* Tutor En Fila Confirmation & Schedule Consultation Modal */}
      <TutorEnFilaModal
        isOpen={Boolean(enFilaModalResult)}
        onClose={() => setEnFilaModalResult(null)}
        result={enFilaModalResult}
        onRetrigger={(ids) => handleTriggerEnFila(ids)}
      />

      {/* Pop Modal when 1-Month College Demo Has Finished (For College Administrator) */}
      {isAdminDemoExpired && adminManagedCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-400 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B2545] to-[#133B6E] px-6 py-4 text-white flex items-center justify-between border-b-4 border-[#C59B27]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    Aviso de Operación · Demostración de 1 Mes
                  </span>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                    {adminManagedCollege.nombre}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto shadow-xs">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="font-display font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                  "Tu demostración ha finalizado, si deseas adquirir el servicio contáctanos"
                </p>
                <p className="text-xs text-slate-600">
                  Periodo de demostración: <strong>{adminManagedCollege.creadoEn}</strong> al{' '}
                  <strong>{adminManagedCollege.fechaExpiracionDemo}</strong>
                </p>
              </div>

              {(demoContactSentFeedback || adminManagedCollege.solicitudReanudacionDemoEnviada) && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold space-y-1 animate-in fade-in">
                  <p>
                    ¡Aviso enviado con éxito a Soporte y Superadministrador!
                  </p>
                  <p className="font-normal text-[11px] text-emerald-800">
                    Hemos notificado por Correo Electrónico, WhatsApp y Plataforma que deseas adquirir el servicio y reanudar tu inscripción.
                  </p>
                </div>
              )}

              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    requestDemoRenewalContact(adminManagedCollege.id);
                    setDemoContactSentFeedback(true);
                  }}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#0B2545] hover:bg-[#133B6E] text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-98"
                >
                  Contactar
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pop-Push Authorization Request Modal for College Administrator */}
      {pendingSupportRequestForAdmin && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-400 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 mt-8 sm:mt-0">
            <div className="bg-gradient-to-r from-[#0B2545] to-[#133B6E] px-6 py-4 text-white flex items-center justify-between border-b-4 border-[#C59B27]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    Notificación en Tiempo Real (Pop Push)
                  </span>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                    Solicitud de Ingreso · Soporte Técnico
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm">
                  El usuario de Soporte{' '}
                  <span className="text-blue-900 underline">
                    {pendingSupportRequestForAdmin.supportUserName}
                  </span>{' '}
                  solicita permiso para ingresar a los módulos de:
                </p>
                <p className="font-display font-black text-base text-[#0B2545]">
                  {pendingSupportRequestForAdmin.colegioNombre}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Correo: {pendingSupportRequestForAdmin.supportUserEmail}
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Autorizas que el perfil de <strong>Soporte</strong> acceda a los módulos de tu colegio en este momento?
              </p>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    respondToSupportCollegeAccess(
                      pendingSupportRequestForAdmin.colegioId,
                      'rejected'
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    respondToSupportCollegeAccess(
                      pendingSupportRequestForAdmin.colegioId,
                      'accepted'
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
