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
} from 'lucide-react';
import { CollegeModuleId } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
}) => {
  const {
    colleges,
    activeCollege,
    selectedCollegeId,
    setSelectedCollegeId,
    currentUser,
  } = useApp();

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
      id: 'usuarios_globales',
      label: 'Gestión de Usuarios',
      icon: Users,
    },
    {
      id: 'planes_modulos',
      label: 'Planes y Facturación',
      icon: CreditCard,
    },
  ];

  // College-specific navigation items mapped to requested modules
  const collegeNavConfig = [
    {
      moduleId: null, // Always available overview
      id: 'colegio_resumen',
      label: 'Resumen del Colegio',
      icon: LayoutDashboard,
    },
    {
      moduleId: 'estudiantes' as CollegeModuleId,
      id: 'estudiantes',
      label: 'Control de Alumnos',
      icon: GraduationCap,
    },
    {
      moduleId: 'docentes' as CollegeModuleId,
      id: 'docentes',
      label: 'Profesores y Personal',
      icon: Users,
    },
    {
      moduleId: 'materias' as CollegeModuleId,
      id: 'materias',
      label: 'Materias y Grupos',
      icon: BookOpen,
    },
    {
      moduleId: 'calificaciones' as CollegeModuleId,
      id: 'calificaciones',
      label: 'Calificaciones y Boletas',
      icon: Award,
    },
    {
      moduleId: 'asistencias' as CollegeModuleId,
      id: 'asistencias',
      label: 'Control de Asistencias',
      icon: Calendar,
    },
    {
      moduleId: 'horarios' as CollegeModuleId,
      id: 'horarios',
      label: 'Horarios Escolares',
      icon: Calendar,
    },
    {
      moduleId: 'pagos' as CollegeModuleId,
      id: 'pagos',
      label: 'Colegiaturas y Pagos',
      icon: CreditCard,
    },
    {
      moduleId: 'tareas_examenes' as CollegeModuleId,
      id: 'tareas_examenes',
      label: 'Tareas y Exámenes',
      icon: ClipboardList,
    },
    {
      moduleId: 'incidencias' as CollegeModuleId,
      id: 'incidencias',
      label: 'Incidencias y Prefectura',
      icon: ShieldAlert,
    },
    {
      moduleId: null, // Psychology is linked or available with staff
      id: 'psicologia',
      label: 'Psicología y Orientación',
      icon: HeartHandshake,
      isSpecial: true,
    },
    {
      moduleId: 'biblioteca' as CollegeModuleId,
      id: 'biblioteca',
      label: 'Biblioteca',
      icon: BookMarked,
    },
    {
      moduleId: 'comunicados' as CollegeModuleId,
      id: 'comunicados',
      label: 'Comunicados y Avisos',
      icon: Bell,
    },
    {
      moduleId: 'usuarios' as CollegeModuleId,
      id: 'usuarios_colegio',
      label: 'Usuarios del Colegio',
      icon: UserCheck,
    },
    {
      moduleId: 'reportes' as CollegeModuleId,
      id: 'reportes',
      label: 'Reportes y Analíticas',
      icon: BarChart3,
    },
    {
      moduleId: null, // Always available customizer
      id: 'personalizar',
      label: 'Personalizar',
      sublabel: 'Escudo y Colores',
      icon: Palette,
      isSpecial: true,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 no-print h-full max-h-screen overflow-hidden">
      {/* Global contextual header when in global maestro view */}
      {isGlobalView && (
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
      )}

      {/* College contextual header if in a college view */}
      {!isGlobalView && activeCollege && (
        <div
          className="p-4 border-b border-slate-200 transition-colors"
          style={{
            backgroundColor: `${primaryColor}08`,
          }}
        >
          <div className="flex items-center gap-3">
            <img
              src={activeCollege.escudoUrl}
              alt={activeCollege.nombre}
              className="w-12 h-12 object-contain rounded-lg bg-white p-1 shadow-xs border border-slate-200 shrink-0"
            />
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
          {currentUser.rol === 'superusuario' && (
            <button
              onClick={() => {
                setSelectedCollegeId(null);
                onSelectTab('dashboard_general');
              }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard General</span>
            </button>
          )}
        </div>
      )}

      {/* Nav List with custom scrollbar */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar p-3 space-y-1">
        {/* GLOBAL NAVIGATION (When selectedCollegeId === null) */}
        {isGlobalView ? (
          <>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Control General
            </div>

            {/* 1. Módulo Dashboard General */}
            <button
              onClick={() => onSelectTab('dashboard_general')}
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
                      <img
                        src={activeCollege?.escudoUrl}
                        alt={activeCollege?.nombre}
                        className="w-5 h-5 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                      />
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
                      onSelectTab('dashboard_general');
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
                            onSelectTab('colegio_resumen');
                            setIsCollegeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-50/70 font-bold text-blue-900 border-l-4 border-blue-600'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={col.escudoUrl}
                              alt={col.nombre}
                              className="w-5 h-5 object-contain rounded border border-slate-200 bg-white p-0.5 shrink-0"
                            />
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
            {globalNavItems.slice(1).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
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

            {collegeNavConfig.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (item.id === 'personalizar' && currentTab === 'personalizacion');

              // Check if module is enabled in this college
              const isEnabled =
                item.moduleId === null ||
                (activeCollege?.modulosHabilitados?.includes(item.moduleId) ?? true);

              if (!isEnabled) {
                // Render restricted module item showing it is blocked by plan/payment
                return (
                  <div
                    key={item.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-50/70 border border-dashed border-slate-200 cursor-not-allowed select-none"
                    title="Módulo restringido para este colegio según su plan de pago"
                  >
                    <div className="flex items-center gap-2.5 opacity-60">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Restringido</span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
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

      {/* Footer info: Platform branding & active user indicator */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-xs text-slate-500 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">My College Core</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded">
            v2.4 Enterprise
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {currentUser.rol === 'superusuario'
            ? 'Superusuario con privilegios globales'
            : `Sesión: ${currentUser.cargo}`}
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
