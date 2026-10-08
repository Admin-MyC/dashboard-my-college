import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Bell,
  ClipboardList,
  Calendar,
  ShieldAlert,
  BookMarked,
  BarChart3,
  Palette,
  ArrowLeft,
  Lock,
  CreditCard,
  HeartHandshake,
  UserCheck,
  LogOut,
  ChevronDown,
  Check,
  QrCode,
  X,
  UserPlus,
  User,
  Users2,
  Percent,
  Library,
  Shield,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { CollegeModuleId, UserRole, SYSTEM_MODULES_REGISTRY } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    colleges,
    activeCollege,
    selectedCollegeId,
    setSelectedCollegeId,
    currentUser,
    isSuperuserSession,
    resetRoleToSuperuser,
    hasRolePermission,
    getRolePermissionsForCollege,
  } = useApp();

  const isSuperUserActive = currentUser.rol === 'superusuario' || isSuperuserSession;

  // Ordered module IDs configured in Permisos for the active profile
  const activePermsMap = getRolePermissionsForCollege(selectedCollegeId);
  const roleOrderedModuleIds = activePermsMap[currentUser.rol] || [];

  const sortItemsByRoleOrder = <T extends { id: string }>(items: T[]): T[] => {
    if (!roleOrderedModuleIds.length) return items;
    return [...items].sort((a, b) => {
      const idxA = roleOrderedModuleIds.indexOf(a.id);
      const idxB = roleOrderedModuleIds.indexOf(b.id);
      const posA = idxA === -1 ? 9999 : idxA;
      const posB = idxB === -1 ? 9999 : idxB;
      return posA - posB;
    });
  };

  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        collegeDropdownRef.current &&
        !collegeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCollegeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGlobalView = selectedCollegeId === null;
  const primaryColor = activeCollege ? activeCollege.colores.primario : '#0B2545';
  const goldColor = activeCollege ? activeCollege.colores.secundario : '#C59B27';

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Global navigation items
  const globalNavItems = [
    {
      id: 'dashboard_general',
      label: 'Dashboard General',
      icon: LayoutDashboard,
    },
    {
      id: 'colegios',
      label: 'Colegios e Instituciones',
      icon: Building2,
      badge: 'Módulo Principal',
    },
    {
      id: 'preinscripciones',
      label: 'Preinscripciones',
      icon: UserPlus,
      badge: 'Admisiones',
    },
    {
      id: 'tutores',
      label: 'Tutores',
      icon: Users2,
      badge: 'Padrón Familiar',
    },
    {
      id: 'usuarios_globales',
      label: 'Gestión de Usuarios',
      icon: Users,
    },
    {
      id: 'perfiles',
      label: 'Perfiles',
      icon: UserCheck,
      badge: 'Roles y Módulos',
    },
    {
      id: 'permisos',
      label: 'Permisos',
      icon: Shield,
      badge: 'Perfiles y Accesos',
    },
    {
      id: 'planes_modulos',
      label: 'Planes y Facturación',
      icon: CreditCard,
    },
    {
      id: 'comisiones_plataforma',
      label: 'Comisiones de Plataforma',
      icon: Percent,
      badge: 'Cobro % y Cuotas',
    },
    {
      id: 'bitacora_logs',
      label: 'Bitácora de Actividades (TXT)',
      icon: FileText,
      badge: 'Logs por Día',
    },
    {
      id: 'mi_perfil',
      label: 'Mi Perfil',
      icon: User,
    },
  ];

  // Specific exclusive navigation items for Alumno role
  // "al colocar estas credenciales les mostrara el perfil Alumnos, donde pueden ver: Mis Tareas, Mis Exámenes, Mis Comunicados y Mi Biblioteca"
  const alumnoNavItems = [
    {
      id: 'mis_tareas',
      label: 'Mis Tareas',
      sublabel: 'Actividades y Entregas',
      icon: BookOpen,
    },
    {
      id: 'mis_examenes',
      label: 'Mis Exámenes',
      sublabel: 'Evaluaciones y Fechas',
      icon: Award,
    },
    {
      id: 'mis_comunicados',
      label: 'Mis Comunicados',
      sublabel: 'Avisos y Circulares',
      icon: Bell,
    },
    {
      id: 'mi_biblioteca',
      label: 'Mi Biblioteca',
      sublabel: 'Libros y Recursos',
      icon: Library,
    },
    {
      id: 'mi_perfil',
      label: 'Mi Perfil',
      sublabel: 'Credencial y Datos',
      icon: User,
    },
  ];

  // Specific exclusive navigation items for Tutor role
  const tutorNavItems = [
    {
      id: 'tutor_cuotas',
      label: 'Cuotas Escolares',
      sublabel: 'Colegiaturas y Pagos',
      icon: CreditCard,
    },
    {
      id: 'comunicados',
      label: 'Comunicados y Avisos',
      sublabel: 'Circulares y Notificaciones',
      icon: Bell,
    },
    {
      id: 'tutor_historial',
      label: 'Historial Académico',
      sublabel: 'Calificaciones y Boletas',
      icon: Award,
    },
    {
      id: 'tutor_alumnos',
      label: 'Alumnos',
      sublabel: 'Hijos a mi Cargo',
      icon: GraduationCap,
    },
    {
      id: 'calendario',
      label: 'Calendario Escolar',
      sublabel: 'Días Sin Clases y Puentes',
      icon: Calendar,
    },
    {
      id: 'mi_perfil',
      label: 'Mi Perfil',
      sublabel: 'Búsqueda CURP y Tutores',
      icon: User,
    },
  ];

  // College-specific navigation items mapped to requested modules and role access
  const collegeNavConfig: {
    moduleId: CollegeModuleId | null;
    id: string;
    label: string;
    icon: any;
    sublabel?: string;
    isSpecial?: boolean;
    allowedRoles?: UserRole[];
  }[] = [
    {
      moduleId: null, // Only for Administradores and Control Escolar
      id: 'colegio_resumen',
      label: 'Resumen del Colegio',
      icon: LayoutDashboard,
      allowedRoles: ['superusuario', 'administrador', 'supervisor', 'prefecto'],
    },
    {
      moduleId: null, // For Directivo and Coordinador
      id: 'resumen_escolar',
      label: 'Resumen Escolar',
      icon: BarChart3,
      allowedRoles: ['superusuario', 'directivo', 'coordinador'],
    },
    {
      moduleId: null, // For Psicólogo
      id: 'resumen_psicologico',
      label: 'Resumen Psicológico',
      icon: HeartHandshake,
      allowedRoles: ['superusuario', 'psicologo'],
    },
    {
      moduleId: null, // For Docente
      id: 'resumen_docentes',
      label: 'Resumen Docentes',
      icon: GraduationCap,
      allowedRoles: ['superusuario', 'docente'],
    },
    {
      moduleId: null, // Always available for Admin & Control Escolar
      id: 'campus',
      label: 'Campus',
      sublabel: 'Sedes y Asignación',
      icon: Building2,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto'],
    },
    {
      moduleId: null, // Always available for Admin & Control Escolar
      id: 'ciclo_escolar',
      label: 'Ciclo Escolar',
      sublabel: 'Fechas y Asignaciones',
      icon: Calendar,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto'],
    },
    {
      moduleId: 'preinscripciones' as CollegeModuleId,
      id: 'preinscripciones',
      label: 'Preinscripciones',
      sublabel: 'Aspirantes y Admisión',
      icon: UserPlus,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor'],
    },
    {
      moduleId: 'tutores' as CollegeModuleId,
      id: 'tutores',
      label: 'Tutores',
      sublabel: 'Padrón de Familias',
      icon: Users2,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor'],
    },
    {
      moduleId: 'cobros' as CollegeModuleId,
      id: 'cobros',
      label: 'Cobros',
      sublabel: 'Conceptos y Tarifas',
      icon: CreditCard,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor'],
    },
    {
      moduleId: 'estudiantes' as CollegeModuleId,
      id: 'estudiantes',
      label: 'Control de Alumnos',
      icon: GraduationCap,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente', 'psicologo'],
    },
    {
      moduleId: 'docentes' as CollegeModuleId,
      id: 'docentes',
      label: 'Profesores y Personal',
      icon: Users,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor'],
    },
    {
      moduleId: 'materias' as CollegeModuleId,
      id: 'materias',
      label: 'Materias y Grupos',
      icon: BookOpen,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'docente'],
    },
    {
      moduleId: 'evaluaciones' as CollegeModuleId,
      id: 'evaluaciones',
      label: 'Evaluaciones',
      sublabel: 'Conceptos 100% y Registros',
      icon: ClipboardCheck,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'docente'],
    },
    {
      moduleId: 'calificaciones' as CollegeModuleId,
      id: 'calificaciones',
      label: 'Calificaciones y Boletas',
      icon: Award,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'docente'],
    },
    {
      moduleId: 'asistencias' as CollegeModuleId,
      id: 'asistencias',
      label: 'Asistencia',
      icon: QrCode,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente'],
    },
    {
      moduleId: null,
      id: 'calendario',
      label: 'Calendario',
      sublabel: 'Días Sin Clases',
      icon: Calendar,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente', 'psicologo', 'tutor'],
    },
    {
      moduleId: null,
      id: 'horarios',
      label: 'Horarios',
      sublabel: 'Roles por Grupo',
      icon: Calendar,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente'],
    },
    {
      moduleId: 'pagos' as CollegeModuleId,
      id: 'pagos',
      label: 'Colegiaturas y Pagos',
      icon: CreditCard,
      allowedRoles: ['superusuario', 'administrador', 'directivo'],
    },
    {
      moduleId: 'tareas_examenes' as CollegeModuleId,
      id: 'tareas_examenes',
      label: 'Tareas y Exámenes',
      icon: ClipboardList,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'docente'],
    },
    {
      moduleId: 'actividades_docentes' as CollegeModuleId,
      id: 'actividades_docentes',
      label: 'Planeaciones Docentes',
      icon: Calendar,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'docente'],
    },
    {
      moduleId: 'incidencias' as CollegeModuleId,
      id: 'incidencias',
      label: 'Incidencias y Prefectura',
      icon: ShieldAlert,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'psicologo'],
    },
    {
      moduleId: null, // Psychology is linked or available with staff
      id: 'psicologia',
      label: 'Psicología y Orientación',
      icon: HeartHandshake,
      isSpecial: true,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'psicologo'],
    },
    {
      moduleId: 'biblioteca' as CollegeModuleId,
      id: 'biblioteca',
      label: 'Biblioteca',
      icon: BookMarked,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'docente'],
    },
    {
      moduleId: 'comunicados' as CollegeModuleId,
      id: 'comunicados',
      label: 'Comunicados y Avisos',
      icon: Bell,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente', 'psicologo'],
    },
    {
      moduleId: 'usuarios' as CollegeModuleId,
      id: 'usuarios_colegio',
      label: 'Usuarios del Colegio',
      icon: UserCheck,
      allowedRoles: ['superusuario', 'administrador'],
    },
    {
      moduleId: null, // Always available customizer
      id: 'personalizar',
      label: 'Personalizar',
      sublabel: 'Escudo y Colores',
      icon: Palette,
      isSpecial: true,
      allowedRoles: ['superusuario', 'administrador'],
    },
    {
      moduleId: null, // Always available for all roles
      id: 'mi_perfil',
      label: 'Mi Perfil',
      sublabel: 'Datos y Contraseña',
      icon: User,
      isSpecial: true,
      allowedRoles: ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor', 'prefecto', 'docente', 'psicologo'],
    },
  ];

  const isTutorUser = currentUser.rol === 'tutor';
  const isAlumnoUser = currentUser.rol === 'alumno';
  const navScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollTop = 0;
      navScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentUser.id, currentUser.rol, selectedCollegeId]);

  const sidebarInner = (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Contextual Header for Alumno */}
      {isAlumnoUser ? (
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-purple-50/50 to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            {activeCollege?.escudoUrl && (
              <img
                src={activeCollege.escudoUrl}
                alt="Escudo Oficial"
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                Portal del Estudiante
              </span>
              <h2 className="text-xs font-bold text-slate-900 truncate">
                {currentUser.nombre}
              </h2>
              <span className="text-[11px] text-slate-500 truncate block">
                {activeCollege?.nombre || 'Colegio Oficial'}
              </span>
            </div>
          </div>
        </div>
      ) : isTutorUser ? (
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50">
          <div className="flex items-center gap-3">
            {activeCollege?.escudoUrl && (
              <img
                src={activeCollege.escudoUrl}
                alt="Escudo Oficial"
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Portal de Tutores
              </span>
              <h2 className="text-xs font-bold text-slate-900 truncate">
                {currentUser.nombre}
              </h2>
              <span className="text-[11px] text-slate-500 truncate block">
                {activeCollege?.nombre || 'Colegio Oficial'}
              </span>
            </div>
          </div>
        </div>
      ) : isGlobalView ? (
        /* Global contextual header when in global maestro view */
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-amber-50/40">
          <div className="flex items-center gap-3">
            <img
              src="/my-college-logo.svg"
              alt="Escudo Oficial"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                Panel Central Maestro
              </h2>
              <div className="text-[11px] text-amber-800 font-semibold">
                My College Oficial
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sistema Activo</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeCollege ? (
        /* College contextual header if in a college view */
        <div
          className="p-4 border-b border-slate-200 transition-colors"
          style={{
            backgroundColor: `${primaryColor}08`,
          }}
        >
          <div className="flex items-center gap-3">
            {activeCollege.escudoUrl && (
              <img
                src={activeCollege.escudoUrl}
                alt={activeCollege.nombre}
                className="w-12 h-12 object-contain rounded-lg bg-white p-1 shadow-xs border border-slate-200 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 truncate">
                {activeCollege.nombre}
              </h2>
              <div className="text-[11px] text-slate-500 font-medium">
                {activeCollege.codigoCCT}
              </div>
              <div
                className="mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: `${goldColor}20`,
                  color: primaryColor,
                }}
              >
                Plan {activeCollege.plan}
              </div>
            </div>
          </div>

          {/* Quick exit to global superuser panel */}
          {isSuperUserActive && (
            <button
              onClick={() => {
                resetRoleToSuperuser();
                setSelectedCollegeId(null);
                handleTabClick('dashboard_general');
              }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard General</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Nav List with custom independent scrollbar */}
      <nav
        ref={navScrollRef}
        className="flex-1 min-h-0 overflow-y-auto sidebar-scrollbar p-3 space-y-1"
      >
        {/* ALUMNO EXCLUSIVE NAVIGATION */}
        {isAlumnoUser ? (
          <>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Módulos del Alumno
            </div>
            {sortItemsByRoleOrder(
              alumnoNavItems.filter((item) => hasRolePermission('alumno', item.id))
            ).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] text-amber-300 font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <div className="text-left">
                        <span className="block font-bold leading-tight">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-[10px] opacity-70 block font-normal">{item.sublabel}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </>
        ) : isTutorUser ? (
          <>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Módulos del Tutor
            </div>
            {sortItemsByRoleOrder(
              tutorNavItems.filter((item) => hasRolePermission('tutor', item.id))
            ).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] text-amber-300 font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <div className="text-left">
                        <span className="block font-bold leading-tight">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-[10px] opacity-70 block font-normal">{item.sublabel}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </>
        ) : isGlobalView ? (
          <>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Control General
            </div>

            {/* 1. Módulo Dashboard General */}
            {hasRolePermission(currentUser.rol, 'dashboard_general') && (
              <button
                onClick={() => handleTabClick('dashboard_general')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'dashboard_general'
                    ? 'bg-[#0B2545] text-amber-300 font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard
                    className={`w-4 h-4 ${
                      currentTab === 'dashboard_general'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>Dashboard General</span>
                </div>
              </button>
            )}

            {/* 2. Menú Desplegable (Debajo del módulo Dashboard General) */}
            <div className="relative my-1.5 px-0.5" ref={collegeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-xs font-semibold text-slate-800 shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedCollegeId === null ? (
                    <>
                      <img
                        src="/my-college-logo.svg"
                        alt="My College"
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="font-semibold text-slate-900 truncate">
                        Panel General Maestro
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                        Global
                      </span>
                    </>
                  ) : (
                    <>
                      {activeCollege?.escudoUrl && (
                        <img
                          src={activeCollege.escudoUrl}
                          alt={activeCollege?.nombre}
                          className="w-5 h-5 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                        />
                      )}
                      <span className="truncate font-semibold text-slate-900">
                        {activeCollege?.nombre}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                        Colegio
                      </span>
                    </>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                    isCollegeDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Options */}
              {isCollegeDropdownOpen && (
                <div className="mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 overflow-hidden animate-in fade-in">
                  {/* Global Maestro Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCollegeId(null);
                      handleTabClick('dashboard_general');
                      setIsCollegeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-amber-50/60 transition-colors cursor-pointer ${
                      selectedCollegeId === null
                        ? 'bg-amber-50 font-bold text-amber-900 border-l-4 border-amber-600'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src="/my-college-logo.svg"
                        alt="Global"
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-bold text-slate-900 text-xs">
                          Panel General Maestro
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Vista global con escudo central
                        </div>
                      </div>
                    </div>
                    {selectedCollegeId === null && (
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </button>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Planteles Escolares
                  </div>

                  {/* College list */}
                  <div className="max-h-56 overflow-y-auto sidebar-scrollbar divide-y divide-slate-100">
                    {colleges.map((col) => {
                      const isCurrent = selectedCollegeId === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setSelectedCollegeId(col.id);
                            handleTabClick('colegio_resumen');
                            setIsCollegeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-50/70 font-bold text-blue-900 border-l-4 border-blue-600'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {col.escudoUrl && (
                              <img
                                src={col.escudoUrl}
                                alt={col.nombre}
                                className="w-5 h-5 object-contain rounded border border-slate-200 bg-white p-0.5 shrink-0"
                              />
                            )}
                            <div className="truncate text-left">
                              <div className="font-medium text-slate-900 truncate max-w-[130px] text-xs">
                                {col.nombre}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <span>{col.nivel}</span>
                                <span>·</span>
                                <span
                                  className={`font-semibold ${
                                    col.estadoPago === 'al_corriente'
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {col.estadoPago === 'al_corriente'
                                    ? 'Al corriente'
                                    : 'Próx. venc.'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isCurrent && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Demás módulos de Control General */}
            {sortItemsByRoleOrder(
              globalNavItems
                .slice(1)
                .filter(
                  (item) =>
                    item.id === 'perfiles' ||
                    item.id === 'permisos' ||
                    item.id === 'bitacora_logs' ||
                    hasRolePermission(currentUser.rol, item.id)
                )
            ).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] text-amber-300 font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </>
        ) : (
          /* COLLEGE NAVIGATION (Scoped to active college) */
          <>
            <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Módulos del Colegio</span>
            </div>

            {sortItemsByRoleOrder(collegeNavConfig).map((item) => {
              // Check allowedRoles on the item first
              if (
                item.allowedRoles &&
                currentUser.rol !== 'superusuario' &&
                !item.allowedRoles.includes(currentUser.rol)
              ) {
                return null;
              }

              // Check dynamic role permission from Permisos module (both Global and College)
              if (!hasRolePermission(currentUser.rol, item.id, selectedCollegeId)) {
                return null;
              }

              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (item.id === 'personalizar' && currentTab === 'personalizacion');

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'font-semibold shadow-xs text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: primaryColor,
                          borderLeft: `4px solid ${goldColor}`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: isActive ? goldColor : '#64748B',
                      }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.sublabel && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer info: Platform branding & active user indicator (without logout button) */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-xs text-slate-500 space-y-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">My College Core</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded">
            v2.4 Enterprise
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {currentUser.rol === 'superusuario'
            ? 'Superusuario con privilegios globales'
            : isSuperUserActive
            ? `Modo Superusuario: ${currentUser.cargo}`
            : `Sesión: ${currentUser.cargo}`}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: visible on lg and up, fixed height with independent scroll */}
      <aside className="hidden lg:flex w-64 lg:w-72 bg-white border-r border-slate-200 flex-col shrink-0 no-print h-full min-h-0 overflow-hidden">
        {sidebarInner}
      </aside>

      {/* Mobile Drawer Sidebar: visible on screens < lg when opened */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Navegación Escolar</span>
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarInner}
          </aside>
        </div>
      )}
    </>
  );
};
