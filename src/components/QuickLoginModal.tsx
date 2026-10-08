import React from 'react';
import { ROLES_CONFIG, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Check,
  Shield,
  Sliders,
  GraduationCap,
  Compass,
  Eye,
  ShieldAlert,
  BookOpen,
  HeartHandshake,
  UserCheck,
  RotateCcw,
  Sparkles,
  Building2,
  Users2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    activeCollege,
    isSuperuserSession,
    originalSuperuser,
    switchRoleAsSuperuser,
    resetRoleToSuperuser,
  } = useApp();

  if (!isOpen) return null;

  // Icon mapping for each role
  const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    superusuario: Shield,
    administrador: Sliders,
    directivo: GraduationCap,
    coordinador: Compass,
    supervisor: Eye,
    prefecto: ShieldAlert,
    docente: BookOpen,
    psicologo: HeartHandshake,
    tutor: Users2,
    alumno: GraduationCap,
  };

  // Specific highlighted attributes for each role to demonstrate permission switching
  const roleAttributes: Record<
    UserRole,
    { permissions: string[]; color: string; bgAccent: string }
  > = {
    superusuario: {
      permissions: ['Control Global de Plataforma', 'Facturación y Planes', 'Todos los Colegios'],
      color: 'text-amber-700',
      bgAccent: 'bg-amber-500',
    },
    administrador: {
      permissions: ['Gestión de Usuarios del Colegio', 'Personalizar Escudo y Colores', 'Ajustes del Plantel'],
      color: 'text-blue-700',
      bgAccent: 'bg-blue-600',
    },
    directivo: {
      permissions: ['Supervisión General', 'Tótem Entrada General', 'Reportes y Boletas Oficiales'],
      color: 'text-indigo-700',
      bgAccent: 'bg-indigo-600',
    },
    coordinador: {
      permissions: ['Revisión de Planeaciones', 'Materias y Grupos', 'Tótem Entrada General'],
      color: 'text-cyan-700',
      bgAccent: 'bg-cyan-600',
    },
    supervisor: {
      permissions: ['Auditoría de Asistencias', 'Ajuste de Tolerancia de Retardo', 'Calificaciones'],
      color: 'text-emerald-700',
      bgAccent: 'bg-emerald-600',
    },
    prefecto: {
      permissions: ['Operación Kiosco Tótem Entrada', 'Incidencias y Citatorios', 'Control Disciplinario'],
      color: 'text-orange-700',
      bgAccent: 'bg-orange-600',
    },
    docente: {
      permissions: ['Pase de Lista QR en Aula', 'Asistencia Semanal Manual', 'Captura de Calificaciones', 'Tareas'],
      color: 'text-teal-700',
      bgAccent: 'bg-teal-600',
    },
    psicologo: {
      permissions: ['Expedientes Psicológicos Confidenciales', 'Bitácoras de Orientación', 'Seguimiento'],
      color: 'text-purple-700',
      bgAccent: 'bg-purple-600',
    },
    tutor: {
      permissions: ['Cuotas Escolares y Pagos', 'Comunicados Oficiales', 'Historial Académico', 'Alumnos (Hijos)'],
      color: 'text-emerald-700',
      bgAccent: 'bg-emerald-600',
    },
    alumno: {
      permissions: ['Mis Tareas', 'Mis Exámenes', 'Mis Comunicados', 'Mi Biblioteca'],
      color: 'text-indigo-700',
      bgAccent: 'bg-indigo-600',
    },
  };

  const allRoles: UserRole[] = [
    'superusuario',
    'administrador',
    'directivo',
    'coordinador',
    'supervisor',
    'prefecto',
    'docente',
    'psicologo',
    'tutor',
    'alumno',
  ];

  const handleSelectRole = (role: UserRole) => {
    switchRoleAsSuperuser(role);
    onClose();
  };

  // The superuser identity to display
  const identityName = originalSuperuser?.nombre || currentUser.nombre;
  const identityAvatar = originalSuperuser?.avatar || currentUser.avatar;
  const identityEmail = originalSuperuser?.correo || currentUser.correo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                Simular Rol en el Colegio
                {activeCollege && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {activeCollege.nombre}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona qué rol deseas adoptar para probar sus funciones y permisos específicos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Preserved Card */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-50 to-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={identityAvatar}
                alt={identityName}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 text-slate-950 rounded-full" title="Superusuario">
                <Shield className="w-3 h-3" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm truncate">
                  {identityName}
                </span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                  Identidad Conservada
                </span>
              </div>
              <div className="text-xs text-slate-600 truncate flex items-center gap-2 mt-0.5">
                <span>{identityEmail}</span>
                <span>·</span>
                <span className="font-semibold text-slate-800">
                  Rol actual: {ROLES_CONFIG[currentUser.rol]?.label || currentUser.rol}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Rol activo: <span className="font-bold text-slate-900">{ROLES_CONFIG[currentUser.rol]?.label || currentUser.rol}</span>
            </span>
          </div>
        </div>

        {/* Roles Grid (Never shows other college users) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Roles Disponibles para Probar ({allRoles.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allRoles.map((roleKey) => {
              const roleCfg = ROLES_CONFIG[roleKey];
              const RoleIcon = roleIcons[roleKey] || UserCheck;
              const isCurrent = currentUser.rol === roleKey;
              const attrs = roleAttributes[roleKey];

              return (
                <div
                  key={roleKey}
                  onClick={() => handleSelectRole(roleKey)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden group ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`p-2 rounded-xl text-white ${attrs.bgAccent} shadow-xs group-hover:scale-105 transition-transform`}
                        >
                          <RoleIcon className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {roleCfg.label}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 inline-block ${roleCfg.badgeBg} ${roleCfg.badgeText}`}
                          >
                            {roleKey === 'superusuario' ? 'Acceso Maestro Global' : 'Rol Escolar'}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" /> Activo
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 bg-slate-100 group-hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors shrink-0">
                          Seleccionar →
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {roleCfg.descripcion}
                    </p>
                  </div>

                  {/* Permissions pills */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {attrs.permissions.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Cambia entre roles en cualquier momento para verificar la interfaz y módulos de cada usuario.
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
