import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MyCollegeLogo } from './MyCollegeLogo';
import { SafeImage } from './SafeImage';
import {
  ChevronDown,
  UserCheck,
  LogOut,
  KeyRound,
  Shield,
  Sliders,
  GraduationCap,
  Compass,
  Eye,
  ShieldAlert,
  BookOpen,
  HeartHandshake,
  Check,
  Menu,
  Bell,
  User,
  Users2,
  Car,
  FileText,
} from 'lucide-react';
import { ROLES_CONFIG, UserRole } from '../types';
import { isNotificationForUser, isNotificationReadByUser } from '../services/notificationService';

interface HeaderProps {
  onOpenQuickLogin: () => void;
  onOpenSuperuserModal: () => void;
  onLogout: () => void;
  onToggleMobileNav?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenSecurityModal?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenDriveScreen?: () => void;
  onTriggerEnFila?: () => void;
}

const ALL_ROLES: UserRole[] = [
  'superusuario',
  'soporte',
  'administrador',
  'control_escolar',
  'directivo',
  'coordinador',
  'supervisor',
  'prefecto',
  'docente',
  'psicologo',
  'tutor',
  'alumno',
];

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  superusuario: Shield,
  soporte: Shield,
  administrador: Sliders,
  control_escolar: FileText,
  directivo: GraduationCap,
  coordinador: Compass,
  supervisor: Eye,
  prefecto: ShieldAlert,
  docente: BookOpen,
  psicologo: HeartHandshake,
  tutor: Users2,
  alumno: GraduationCap,
};

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickLogin,
  onOpenSuperuserModal,
  onLogout,
  onToggleMobileNav,
  onOpenNotificationsModal,
  onOpenSecurityModal,
  onNavigateTab,
  onOpenDriveScreen,
  onTriggerEnFila,
}) => {
  const {
    currentUser,
    setSelectedCollegeId,
    activeCollege,
    isSuperuserSession,
    originalSuperuser,
    switchRoleAsSuperuser,
    emailNotifications,
    students,
    allRolesConfig,
    drivePickupQueue,
    isCollegeDriveUsageEnabled,
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const isTutorRole = currentUser.rol === 'tutor';

  const tutorLinkedStudents = isTutorRole
    ? students.filter((s) => {
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
      })
    : [];

  const tutorLinkedStudentIds = tutorLinkedStudents.map((s) => s.id);

  const effectiveCollegeIdForDrive = isTutorRole
    ? tutorLinkedStudents[0]?.colegioId ||
      currentUser.colegioId ||
      activeCollege?.id ||
      null
    : activeCollege?.id ||
      currentUser.colegioId ||
      null;

  const isDriveUsageEnabled = isCollegeDriveUsageEnabled(effectiveCollegeIdForDrive);
  const canUseDriveMonitor =
    isDriveUsageEnabled &&
    currentUser.rol !== 'tutor' &&
    currentUser.rol !== 'alumno' &&
    currentUser.rol !== 'superusuario' &&
    currentUser.rol !== 'soporte';

  const isTutorValidatedInDriveQueue =
    isTutorRole &&
    drivePickupQueue.some(
      (item) =>
        item.estado === 'en_fila' &&
        (item.tutorId === currentUser.id ||
          tutorLinkedStudentIds.includes(item.estudianteId))
    );

  const activeDriveQueueCount = drivePickupQueue.filter((item) => {
    if (item.estado !== 'en_fila') return false;
    const colId = activeCollege?.id || currentUser.colegioId;
    if (colId && item.colegioId !== colId) return false;
    return true;
  }).length;

  const isDriveOpenNow = useApp().isCollegeDriveOpen(
    activeCollege?.id || currentUser.colegioId
  );

  // Scoped unread count strictly for notifications involving the current user and profile
  const unreadCount = emailNotifications.filter((n) => {
    if (isNotificationReadByUser(n, currentUser)) return false;
    return isNotificationForUser(n, currentUser, students, activeCollege?.id || null);
  }).length;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // True when active role is superusuario or during a superuser role-testing session
  const isSuperUserActive = currentUser.rol === 'superusuario' || isSuperuserSession;
  const canReturnToGlobalView =
    currentUser.rol === 'superusuario' ||
    currentUser.rol === 'soporte' ||
    isSuperuserSession;
  const CurrentRoleIcon = ROLE_ICONS[currentUser.rol] || UserCheck;
  const availableRoles: UserRole[] = Array.from(
    new Set([...ALL_ROLES, ...Object.keys(allRolesConfig || {})])
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* ZONE 1: MOBILE HAMBURGER + BRAND LOGO */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          {/* Hamburger Menu on Mobile */}
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <button
            onClick={() => {
              if (canReturnToGlobalView) {
                setSelectedCollegeId(null);
              }
            }}
            className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none cursor-pointer group min-w-0"
          >
            {activeCollege ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {activeCollege.escudoUrl && (
                  <SafeImage
                    src={activeCollege.escudoUrl}
                    alt={activeCollege.nombre}
                    fallbackType="shield"
                    fallbackText={activeCollege.nombre}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
                      Colegio Activo
                    </span>
                    {activeCollege.modoPrueba && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs shrink-0"
                        title="Colegio en Modo Prueba: Pasarela de pagos con botones automáticos de simulación para demostraciones"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                        <span>Modo Prueba</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[95px] sm:max-w-[220px] md:max-w-[320px]">
                    {activeCollege.nombre}
                  </h1>
                </div>
              </div>
            ) : (
              <MyCollegeLogo size="sm" />
            )}
          </button>
        </div>

        {/* ZONE 2: ACTIONS, NOTIFICATIONS & USER PROFILE */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* OPCIÓN INICIAR DRIVE (Todos los perfiles excepto tutor y alumno) */}
          {canUseDriveMonitor && onOpenDriveScreen && (
            <button
              type="button"
              onClick={onOpenDriveScreen}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-sm border transition-all cursor-pointer ${
                isDriveOpenNow
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-400'
                  : 'bg-[#0B2545] hover:bg-[#133E6E] text-white border-amber-400/50'
              }`}
              title={
                isDriveOpenNow
                  ? 'Drive Abierto (Haz clic para ver la pantalla completa de entrega)'
                  : 'Iniciar Drive (Pantalla completa de entrega de alumnos)'
              }
            >
              <Car
                className={`w-4 h-4 shrink-0 ${
                  isDriveOpenNow ? 'text-emerald-200' : 'text-amber-300'
                }`}
              />
              <span className="hidden sm:inline">
                {isDriveOpenNow ? 'Drive Abierto' : 'Iniciar Drive'}
              </span>
              <span className="sm:hidden">Drive</span>
              {activeDriveQueueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] leading-none animate-pulse">
                  {activeDriveQueueCount}
                </span>
              )}
            </button>
          )}

          {/* LISTA DESPLEGABLE DE ROLES PARA SUPERUSUARIO */}
          {isSuperUserActive && (
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs cursor-pointer"
                title="Lista desplegable de roles"
              >
                <span className="text-slate-400 font-medium hidden md:inline">Rol:</span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <CurrentRoleIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-slate-900 max-w-[70px] sm:max-w-none truncate">
                    {allRolesConfig?.[currentUser.rol]?.label ||
                      ROLES_CONFIG[currentUser.rol]?.label ||
                      currentUser.rol}
                  </span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Cambiar Rol
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                      {availableRoles.length} opciones
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
                    {availableRoles.map((roleKey) => {
                      const roleCfg =
                        allRolesConfig?.[roleKey] ||
                        ROLES_CONFIG[roleKey] || {
                          id: roleKey,
                          label: roleKey,
                          descripcion: 'Rol personalizado',
                        };
                      const isSelected = currentUser.rol === roleKey;
                      const Icon = ROLE_ICONS[roleKey] || UserCheck;

                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => {
                            switchRoleAsSuperuser(roleKey);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/80 font-bold text-amber-950 border-l-4 border-amber-500'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{roleCfg.label}</span>
                                {roleKey === 'superusuario' && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-300 shrink-0">
                                    Maestro
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">
                                {roleCfg.descripcion}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS BELL (notifications@mycollege.com.mx) */}
          {onOpenNotificationsModal && (
            <button
              type="button"
              onClick={onOpenNotificationsModal}
              className="relative p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Notificaciones Oficiales (notifications@mycollege.com.mx)"
              aria-label="Abrir centro de notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* SECURITY AUDIT BUTTON (Bcrypt, Helmet, Rate Limiting) - ONLY FOR SUPERUSUARIO */}
          {isSuperUserActive && onOpenSecurityModal && (
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Auditoría de Seguridad: Bcrypt · Rate Limiting · Helmet"
              aria-label="Auditoría de Seguridad"
            >
              <Shield className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* Active User Avatar & Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <SafeImage
                src={currentUser.avatar}
                alt={currentUser.nombre}
                fallbackType="user"
                fallbackText={currentUser.nombre}
                fallbackExtra={currentUser.rol}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.nombre}
                </div>
                <div className="text-[11px] text-slate-500 font-medium capitalize">
                  {ROLES_CONFIG[currentUser.rol]?.label || currentUser.rol}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.nombre}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.correo}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span className="truncate">Rol: {ROLES_CONFIG[currentUser.rol]?.label}</span>
                  </div>
                </div>

                <div className="py-1">
                  {onOpenNotificationsModal && (
                    <button
                      onClick={() => {
                        onOpenNotificationsModal();
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Notificaciones oficiales ({unreadCount})</span>
                    </button>
                  )}

                  {isSuperUserActive && (
                    <>
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(true);
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Cambiar Rol (Lista Desplegable)</span>
                      </button>
                      <button
                        onClick={onOpenSuperuserModal}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Datos de acceso Superusuario</span>
                      </button>
                    </>
                  )}

                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onNavigateTab('mi_perfil');
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <User className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Mi Perfil (Datos y Contraseña)</span>
                    </button>
                  )}

                  {isSuperUserActive && onOpenSecurityModal && (
                    <button
                      onClick={() => {
                        onOpenSecurityModal();
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Auditoría de Seguridad (Bcrypt/Helmet)</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* BOTÓN FLOTANTE "EN FILA" (Exclusivo perfil Tutor / Padre cuando el uso de Drive está activo en el colegio) */}
      {isTutorRole && isDriveUsageEnabled && onTriggerEnFila && (
        <button
          type="button"
          onClick={onTriggerEnFila}
          className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-30 no-print flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full font-extrabold text-xs sm:text-sm shadow-2xl border-2 transition-all duration-200 active:scale-95 cursor-pointer ${
            isTutorValidatedInDriveQueue
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border-emerald-200 ring-4 ring-emerald-500/30'
              : 'bg-gradient-to-r from-[#0B2545] to-[#133E6E] hover:from-[#133E6E] hover:to-[#1B4F8A] text-white border-amber-400 ring-4 ring-[#0B2545]/25'
          }`}
          title={
            isTutorValidatedInDriveQueue
              ? '¡En Fila Validado! Ya puedes recoger a tu alumno en Drive'
              : 'En Fila — Enviar información de alumno a recoger al sistema Drive'
          }
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isTutorValidatedInDriveQueue
                ? 'bg-emerald-200 animate-ping'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <Car
            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
              isTutorValidatedInDriveQueue ? 'text-white' : 'text-amber-300'
            }`}
          />
          <span>
            {isTutorValidatedInDriveQueue
              ? '✓ En Fila (Listo)'
              : 'En Fila'}
          </span>
        </button>
      )}
    </>
  );
};
