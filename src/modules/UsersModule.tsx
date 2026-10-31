import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Search,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Mail,
  Lock,
  Phone,
  Briefcase,
  KeyRound,
  Filter,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  Sparkles,
  Send,
  Power,
} from 'lucide-react';
import { ROLES_CONFIG, User, UserRole, AcademicLevel } from '../types';
import {
  generateTutorUsername,
  generateRandomPassword,
  ensureUserCredentials,
} from '../utils/preenrollmentHelper';
import { SafeImage } from '../components/SafeImage';

interface Props {
  collegeIdFilter?: string | null;
}

const ALL_ACADEMIC_LEVELS: AcademicLevel[] = [
  'Preescolar',
  'Primaria',
  'Secundaria',
  'Preparatoria',
  'Universidad',
];

const DEFAULT_GRADES_BY_LEVEL: Record<AcademicLevel, string[]> = {
  Preescolar: ['1°', '2°', '3°'],
  Primaria: ['1°', '2°', '3°', '4°', '5°', '6°'],
  Secundaria: ['1°', '2°', '3°'],
  Preparatoria: ['1°', '2°', '3°', '4°', '5°', '6°'],
  Universidad: ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°'],
};

export const UsersModule: React.FC<Props> = ({ collegeIdFilter = null }) => {
  const {
    users,
    colleges,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    selectedCollegeId,
    activeCollege,
    allRolesConfig,
    sendEmailNotification,
    getGroupsForCollegeLevel,
  } = useApp();

  const isGlobalDashboard = selectedCollegeId === null && !collegeIdFilter;
  const isSuperuserRole = currentUser.rol === 'superusuario';
  const isSupportRole = currentUser.rol === 'soporte';
  const canChooseCollege = isSuperuserRole || isSupportRole;
  const currentCollege =
    activeCollege ||
    (collegeIdFilter ? colleges.find((c) => c.id === collegeIdFilter) : null) ||
    (currentUser.colegioId ? colleges.find((c) => c.id === currentUser.colegioId) : null);
  const primaryColor = currentCollege ? currentCollege.colores.primario : "#0B2545";
  const goldColor = currentCollege ? currentCollege.colores.secundario : "#DFB743";

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>(
    collegeIdFilter || 'todos'
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletedBanner, setDeletedBanner] = useState<string | null>(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<User | null>(null);
  const [emailedUserId, setEmailedUserId] = useState<string | null>(null);
  const [emailedBanner, setEmailedBanner] = useState<string | null>(null);
  const [emailedModalCreds, setEmailedModalCreds] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRandom4Digits, setFormRandom4Digits] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );
  const [formPass, setFormPass] = useState(() => generateRandomPassword());
  const [formRole, setFormRole] = useState<UserRole>('coordinador');
  const [formCollegeId, setFormCollegeId] = useState<string>(
    collegeIdFilter || colleges[0]?.id || ''
  );
  const [formCargo, setFormCargo] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [formNivelAsignado, setFormNivelAsignado] = useState<AcademicLevel>('Primaria');
  const [formTipoCoordinacion, setFormTipoCoordinacion] = useState<'un_nivel' | 'multinivel'>('un_nivel');
  const [formNivelesAsignados, setFormNivelesAsignados] = useState<AcademicLevel[]>(['Primaria']);
  const [formUsarGruposEspecificos, setFormUsarGruposEspecificos] = useState<boolean>(false);
  const [formGruposAsignados, setFormGruposAsignados] = useState<string[]>([]);

  // Obtener exclusivamente los grupos que se crearon en el módulo Materias y Grupos para el colegio y nivel seleccionados
  const getAvailableGroupsForLevel = (colId: string, level: AcademicLevel): string[] => {
    const registered = colId ? getGroupsForCollegeLevel(colId, level) : [];
    const set = new Set<string>();
    registered.forEach((raw) => {
      const clean = raw.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      if (clean) set.add(`${level} ${clean}`);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  };

  const isLevelGroupScopedRole = (roleId?: string) =>
    roleId === 'coordinador' || roleId === 'psicologo';

  const buildCoordinatorCargoLabel = (
    roleId: string,
    tipo: 'un_nivel' | 'multinivel',
    niveles: AcademicLevel[],
    grupos: string[],
    usarEspecificos: boolean
  ): string => {
    const effectiveNiveles: AcademicLevel[] =
      niveles.length > 0 ? niveles : [formNivelAsignado || 'Primaria'];
    const rolePrefix = roleId === 'psicologo' ? 'Psicólogo' : 'Coordinador';
    const baseLabel =
      tipo === 'multinivel' && effectiveNiveles.length > 1
        ? `${rolePrefix} Multinivel (${effectiveNiveles.join(' y ')})`
        : `${rolePrefix} de ${effectiveNiveles[0]}`;
    if (usarEspecificos && grupos.length > 0) {
      return `${baseLabel} · ${grupos.length} grupo(s)`;
    }
    return baseLabel;
  };

  // Regla: Todos los usuarios creados pueden ponerse como inactivos para negarles el acceso,
  // CON EXCEPCIÓN de tutores, alumnos y superusuario.
  const canRoleBeInactivated = (roleId?: string) => {
    const clean = String(roleId || '').toLowerCase().trim();
    return clean !== 'superusuario' && clean !== 'tutor' && clean !== 'alumno';
  };

  // Auto-preview username when name changes using the FIXED 4 random digits generated once
  const previewUsername = useMemo(() => {
    if (!formName.trim()) return '';
    return generateTutorUsername(formName, formRandom4Digits);
  }, [formName, formRandom4Digits]);

  const handleSendCredentialsByEmail = (targetUser: User, fromModal = false) => {
    const resolvedUsername =
      targetUser.usuarioLogin || ensureUserCredentials(targetUser).usuarioLogin;
    const resolvedPassword =
      targetUser.password || ensureUserCredentials(targetUser).password || 'a4Km9xP2';
    const assignedCol = colleges.find((c) => c.id === targetUser.colegioId);
    const roleLabel =
      allRolesConfig[targetUser.rol]?.label ||
      ROLES_CONFIG[targetUser.rol]?.label ||
      targetUser.rol;

    sendEmailNotification({
      colegioId: targetUser.colegioId || 'global',
      colegioNombre: assignedCol?.nombre || 'Plataforma Global My College',
      destinatarios: [targetUser.correo],
      rolesDestino: [targetUser.rol],
      usuariosDestino: [targetUser.id, targetUser.correo, resolvedUsername],
      asunto: `[My College] Envío de Credenciales de Acceso (${roleLabel})`,
      cuerpo:
        `Estimado(a) ${targetUser.nombre}:\n\n` +
        `En atención a su solicitud, le enviamos sus credenciales oficiales de acceso a la plataforma My College.\n\n` +
        `=== CREDENCIALES DE ACCESO ===\n` +
        `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Perfil / Rol: ${roleLabel}\n` +
        `• Institución: ${assignedCol?.nombre || 'Panel Global My College'}\n` +
        `• Usuario de Acceso: ${resolvedUsername}\n` +
        `• Contraseña: ${resolvedPassword}\n\n` +
        `Por seguridad, sus credenciales permanecen ocultas en el directorio y se envían exclusivamente a su correo electrónico registrado.`,
      categoria: 'seguridad',
      prioridad: 'alta',
    });

    setEmailedUserId(targetUser.id);
    setEmailedBanner(
      `Se han enviado las credenciales de acceso de "${targetUser.nombre}" al correo ${targetUser.correo}.`
    );
    if (fromModal) {
      setEmailedModalCreds(true);
      setTimeout(() => setEmailedModalCreds(false), 3000);
    }
    setTimeout(() => setEmailedUserId(null), 2500);
    setTimeout(() => setEmailedBanner(null), 4500);
  };

  // Roles allowed to be viewed/filtered in current view context (table & filter dropdown)
  const allowedRolesForCurrentView = useMemo(() => {
    if (isGlobalDashboard) {
      if (isSupportRole) {
        return ['administrador', 'soporte'];
      }
      return ['superusuario', 'administrador', 'soporte'];
    }
    // Inside a college: all college staff roles excluding superusuario, soporte, alumno, tutor y docente (los docentes solo aparecen en el módulo Docentes)
    return Object.keys(allRolesConfig).filter(
      (rId) =>
        rId !== 'superusuario' &&
        rId !== 'soporte' &&
        rId !== 'alumno' &&
        rId !== 'tutor' &&
        rId !== 'docente'
    );
  }, [isGlobalDashboard, isSupportRole, allRolesConfig]);

  // Roles allowed to be created in "Registrar Nuevo Usuario":
  // - Los docentes solo se registran y aparecen en el módulo Docentes (no en Usuarios del Colegio)
  // - Superusuario can create all roles except tutor, alumno and docente
  // - Soporte can create the exact same roles as Superusuario EXCEPT superusuario, tutor, alumno and docente
  // - Administrador del colegio (y otros perfiles locales) NO pueden dar de alta otros 'administrador' (eso solo lo hacen soporte y superusuario), ni superusuario, soporte, alumno, tutor o docente.
  const creatableRolesForModal = useMemo(() => {
    if (isSuperuserRole) {
      return Object.keys(allRolesConfig).filter(
        (rId) => rId !== 'alumno' && rId !== 'tutor' && rId !== 'docente'
      );
    }
    if (isSupportRole) {
      return Object.keys(allRolesConfig).filter(
        (rId) =>
          rId !== 'superusuario' &&
          rId !== 'alumno' &&
          rId !== 'tutor' &&
          rId !== 'docente'
      );
    }
    return Object.keys(allRolesConfig).filter(
      (rId) =>
        rId !== 'superusuario' &&
        rId !== 'soporte' &&
        rId !== 'administrador' &&
        rId !== 'alumno' &&
        rId !== 'tutor' &&
        rId !== 'docente'
    );
  }, [isSuperuserRole, isSupportRole, allRolesConfig]);

  // Helper to check if a role is global / not linked to any college (Superusuario or Soporte)
  const isUnlinkedGlobalRole = (roleId: string) => {
    const lower = (roleId || '').toLowerCase().trim();
    const roleCfg = allRolesConfig[roleId] || ROLES_CONFIG[roleId];
    return (
      lower === 'superusuario' ||
      lower === 'soporte' ||
      lower.includes('soporte') ||
      Boolean(roleCfg?.esGlobal)
    );
  };

  const filteredUsers = users.filter((u) => {
    // En el Dashboard Global:
    // - Superusuario solo ve: superusuario, administrador y soporte
    // - Soporte solo ve: administrador y soporte
    if (isGlobalDashboard) {
      if (isSupportRole) {
        if (u.rol !== 'administrador' && u.rol !== 'soporte') return false;
      } else {
        if (
          u.rol !== 'superusuario' &&
          u.rol !== 'administrador' &&
          u.rol !== 'soporte'
        ) {
          return false;
        }
      }
    } else {
      // En el módulo Usuarios del Colegio NO deben aparecer docentes (solo aparecen en el módulo Docentes), ni alumnos, tutores, superusuario o soporte
      if (
        u.rol === 'docente' ||
        u.rol === 'alumno' ||
        u.rol === 'tutor' ||
        u.rol === 'superusuario' ||
        u.rol === 'soporte'
      ) {
        return false;
      }
    }

    const resolvedUsername = u.usuarioLogin || ensureUserCredentials(u).usuarioLogin;
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resolvedUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'todos' || u.rol === selectedRoleFilter;
    const isEffectivelyActive = !canRoleBeInactivated(u.rol) ? true : u.activo !== false;
    const matchesStatus =
      selectedStatusFilter === 'todos'
        ? true
        : selectedStatusFilter === 'activos'
        ? isEffectivelyActive
        : !isEffectivelyActive;
    const matchesCollege =
      selectedCollegeFilter === 'todos'
        ? true
        : selectedCollegeFilter === 'global'
        ? u.colegioId === null
        : u.colegioId === selectedCollegeFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesCollege;
  });

  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRandom4Digits(String(Math.floor(1000 + Math.random() * 9000)));
    setFormPass(generateRandomPassword());
    const defaultRole: UserRole = isGlobalDashboard
      ? isSupportRole
        ? 'administrador'
        : 'superusuario'
      : 'coordinador';
    setFormRole(defaultRole);
    setFormCollegeId(
      isUnlinkedGlobalRole(defaultRole)
        ? ''
        : currentCollege?.id || collegeIdFilter || colleges[0]?.id || ''
    );
    setFormCargo('');
    setFormPhone('');
    setFormActivo(true);
    setFormTipoCoordinacion('un_nivel');
    setFormNivelAsignado('Primaria');
    setFormNivelesAsignados(['Primaria']);
    setFormUsarGruposEspecificos(false);
    setFormGruposAsignados([]);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nombre y correo son obligatorios.');
      return;
    }

    // Superusuario and Soporte are NEVER linked to any college (colegioId is always null)
    // Administrador del colegio NO puede crear otros administradores (solo soporte y superusuario)
    const effectiveRole: UserRole =
      !canChooseCollege &&
      (isUnlinkedGlobalRole(formRole) || formRole === 'administrador' || formRole === 'docente')
        ? 'coordinador'
        : isUnlinkedGlobalRole(formRole) && formRole !== 'superusuario'
        ? 'soporte'
        : formRole;

    // El administrador del colegio solo da de alta usuarios en su propio colegio
    const targetCollegeId = isUnlinkedGlobalRole(effectiveRole)
      ? null
      : !canChooseCollege
      ? currentCollege?.id || currentUser.colegioId || collegeIdFilter || colleges[0]?.id || null
      : formCollegeId || currentCollege?.id || colleges[0]?.id || null;

    const finalUsername = generateTutorUsername(formName, formRandom4Digits);
    const finalPassword =
      formPass && formPass.trim().length === 8
        ? formPass.trim()
        : generateRandomPassword();

    const hasScopedLevelsAndGroups = isLevelGroupScopedRole(effectiveRole);

    const effectiveNivelesCoord: AcademicLevel[] = hasScopedLevelsAndGroups
      ? formTipoCoordinacion === 'un_nivel'
        ? [formNivelAsignado]
        : formNivelesAsignados.length > 0
        ? formNivelesAsignados
        : [formNivelAsignado]
      : [];

    const effectiveGruposCoord: string[] =
      hasScopedLevelsAndGroups && formUsarGruposEspecificos
        ? formGruposAsignados.filter((g) =>
            effectiveNivelesCoord.some((lvl) => g.toLowerCase().startsWith(lvl.toLowerCase()))
          )
        : [];

    const created = addUser({
      nombre: formName.trim(),
      correo: formEmail.trim(),
      usuarioLogin: finalUsername,
      password: finalPassword,
      rol: effectiveRole,
      colegioId: targetCollegeId,
      nivelAsignado: hasScopedLevelsAndGroups
        ? effectiveNivelesCoord[0] || formNivelAsignado
        : undefined,
      tipoCoordinacion: hasScopedLevelsAndGroups ? formTipoCoordinacion : undefined,
      nivelesAsignados: hasScopedLevelsAndGroups ? effectiveNivelesCoord : undefined,
      gruposAsignados: hasScopedLevelsAndGroups ? effectiveGruposCoord : undefined,
      cargo:
        formCargo.trim() ||
        (effectiveRole === 'superusuario'
          ? 'Superadministrador de Plataforma'
          : effectiveRole === 'soporte'
          ? 'Especialista de Soporte Técnico Global'
          : hasScopedLevelsAndGroups
          ? buildCoordinatorCargoLabel(
              effectiveRole,
              formTipoCoordinacion,
              effectiveNivelesCoord,
              effectiveGruposCoord,
              formUsarGruposEspecificos
            )
          : `${allRolesConfig[effectiveRole]?.label || ROLES_CONFIG[effectiveRole]?.label || effectiveRole} Institucional`),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
      telefono: formPhone.trim(),
      activo: canRoleBeInactivated(effectiveRole) ? formActivo : true,
      ultimoAcceso: 'Nunca',
    });

    // Reset Form
    setFormName('');
    setFormEmail('');
    setFormRandom4Digits(String(Math.floor(1000 + Math.random() * 9000)));
    setFormPass(generateRandomPassword());
    setFormCargo('');
    setFormPhone('');
    setFormActivo(true);
    setIsAddModalOpen(false);
    setEmailedUserId(created.id);
    setEmailedBanner(
      `Se han enviado las credenciales de acceso de "${created.nombre}" al correo ${created.correo}.`
    );
    setTimeout(() => setEmailedUserId(null), 2500);
    setTimeout(() => setEmailedBanner(null), 4500);
    setCreatedUserCredentials(created);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              {isGlobalDashboard ? 'Administración Global' : 'Personal del Plantel'}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: goldColor }} />
            {isGlobalDashboard ? "Gestión Integral de Usuarios y Roles" : `Personal Institucional de ${currentCollege?.nombre}`}
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {isGlobalDashboard
              ? isSupportRole
                ? "Directorio de Administradores de Colegios y personal de Soporte Técnico."
                : "Administra usuarios de Superusuario, Administradores de Colegios y Soporte."
              : `Directorio de personal institucional (Administrador, Directivo, Coordinador, Control Escolar, Prefectura y Psicología) de este plantel.`}
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nuevo Usuario</span>
        </button>
      </div>

      {emailedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setEmailedBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {deletedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deletedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeletedBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="todos">Todos los Roles</option>
            {Object.values(allRolesConfig)
              .filter((r) => allowedRolesForCurrentView.includes(r.id))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) =>
              setSelectedStatusFilter(e.target.value as 'todos' | 'activos' | 'inactivos')
            }
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="todos">Todos los Estatus</option>
            <option value="activos">Usuarios Activos (Con acceso)</option>
            <option value="inactivos">Usuarios Inactivos (Acceso denegado)</option>
          </select>

          {/* College Filter */}
          {!collegeIdFilter && (
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none max-w-[220px]"
            >
              <option value="todos">Todas las Instituciones</option>
              <option value="global">
                {isSupportRole ? 'Soporte Global (Sin colegio)' : 'Usuarios Globales (Sin colegio)'}
              </option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nombre & Correo</th>
                <th className="py-3 px-4">Credenciales de Acceso</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Colegio Asignado</th>
                <th className="py-3 px-4">Cargo / Función</th>
                <th className="py-3 px-4">Estatus</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const roleConfig =
                  allRolesConfig[u.rol] || ROLES_CONFIG[u.rol] || ROLES_CONFIG.docente;
                const assignedCollege = colleges.find((c) => c.id === u.colegioId);
                const isSentRecently = emailedUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={u.avatar}
                          alt={u.nombre}
                          fallbackType={u.rol === 'alumno' ? 'student' : 'user'}
                          fallbackText={u.nombre}
                          fallbackExtra={u.rol}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{u.nombre}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.correo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Credenciales Ocultas + Enviar por Correo */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Credenciales ocultas</span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleSendCredentialsByEmail(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                              isSentRecently
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                            }`}
                            title="Enviar usuario y contraseña al correo electrónico registrado"
                          >
                            {isSentRecently ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>¡Enviadas al correo!</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3 text-blue-700" />
                                <span>Enviar por correo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeBg} ${roleConfig.badgeText}`}
                      >
                        {(u.rol === 'superusuario' || u.rol === 'soporte') && (
                          <Shield className="w-3 h-3" />
                        )}
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* Assigned College */}
                    <td className="py-3 px-4">
                      {u.rol === 'superusuario' ? (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Acceso Global Maestro
                        </span>
                      ) : u.rol === 'soporte' ? (
                        <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          Soporte Técnico Global
                        </span>
                      ) : assignedCollege ? (
                        <div className="flex items-center gap-2">
                          {assignedCollege.escudoUrl && (
                            <SafeImage
                              src={assignedCollege.escudoUrl}
                              alt={assignedCollege.nombre}
                              fallbackType="shield"
                              fallbackText={assignedCollege.nombre}
                              className="w-6 h-6 object-contain rounded bg-white border p-0.5"
                            />
                          )}
                          <span className="font-medium text-slate-800">
                            {assignedCollege.nombre}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No asignado</span>
                      )}
                    </td>

                    {/* Cargo */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{u.cargo}</div>
                      {isLevelGroupScopedRole(u.rol) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(u.nivelesAsignados && u.nivelesAsignados.length > 0
                            ? u.nivelesAsignados
                            : u.nivelAsignado
                            ? [u.nivelAsignado]
                            : []
                          ).map((lvl) => (
                            <span
                              key={lvl}
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                u.rol === 'psicologo'
                                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                                  : 'bg-cyan-50 text-cyan-900 border-cyan-200'
                              }`}
                            >
                              {lvl}
                            </span>
                          ))}
                          {u.gruposAsignados && u.gruposAsignados.length > 0 && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-semibold"
                              title={u.gruposAsignados.join(', ')}
                            >
                              {u.gruposAsignados.length} grupos específicos
                            </span>
                          )}
                        </div>
                      )}
                      {u.telefono && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{u.telefono}</div>
                      )}
                    </td>

                    {/* Estatus */}
                    <td className="py-3 px-4">
                      {canRoleBeInactivated(u.rol) ? (
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => updateUser(u.id, { activo: !u.activo })}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                              u.activo
                                ? 'text-emerald-800 bg-emerald-50 hover:bg-rose-50 hover:text-rose-800 border-emerald-200 hover:border-rose-300'
                                : 'text-rose-800 bg-rose-50 hover:bg-emerald-50 hover:text-emerald-800 border-rose-300 hover:border-emerald-200'
                            }`}
                            title={
                              u.activo
                                ? 'Clic para poner como Inactivo (negar acceso a la plataforma)'
                                : 'Clic para reactivar cuenta y permitir el acceso'
                            }
                          >
                            {u.activo ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Inactivo (Acceso denegado)</span>
                              </>
                            )}
                          </button>
                          <span className="text-[10px] text-slate-400">
                            {u.activo ? 'Clic para inactivar' : 'Clic para activar'}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200"
                          title="Este perfil tiene acceso permanente y no puede ponerse como inactivo"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Siempre Activo</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canRoleBeInactivated(u.rol) && (
                          <button
                            type="button"
                            onClick={() => updateUser(u.id, { activo: !u.activo })}
                            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                              u.activo
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={
                              u.activo
                                ? 'Poner usuario como Inactivo (negar acceso)'
                                : 'Activar usuario (permitir acceso)'
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSendCredentialsByEmail(u)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md cursor-pointer"
                          title="Enviar credenciales por correo electrónico"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                          title="Editar Usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md cursor-pointer"
                          title="Eliminar Usuario de la plataforma y base de datos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: REGISTRAR NUEVO USUARIO (+ ASIGNACIÓN A COLEGIO)       */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Sticky Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                    Registrar Nuevo Usuario en My College
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Completa los datos del usuario y su asignación institucional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleCreateUser}
              className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs md:text-sm"
            >
              {/* Compact Automatic Credentials Notice */}
              <div className="p-2.5 px-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <p className="text-[11px] text-amber-900 leading-snug">
                    <strong className="uppercase">Credenciales Ocultas:</strong> El usuario y contraseña de 8 caracteres se generan y envían en automático al correo al crear la cuenta.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  Automático
                </span>
              </div>

              {/* Row 1: Nombre Completo & Correo Electrónico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lic. Claudia Romero Ortiz"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@colegio.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Rol a Asignar & Colegio que Pertenece */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Rol a Asignar *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setFormRole(nextRole);
                      if (isUnlinkedGlobalRole(nextRole)) {
                        setFormCollegeId('');
                      } else if (!formCollegeId) {
                        setFormCollegeId(
                          currentCollege?.id || collegeIdFilter || colleges[0]?.id || ''
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium bg-white"
                  >
                    {Object.values(allRolesConfig)
                      .filter((r) => creatableRolesForModal.includes(r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block leading-tight">
                    {allRolesConfig[formRole]?.descripcion}
                  </span>
                </div>

                {isUnlinkedGlobalRole(formRole) ? (
                  <div className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center gap-2 self-start mt-5">
                    <Shield className="w-4 h-4 text-sky-700 shrink-0" />
                    <span className="text-[11px] font-semibold text-sky-900">
                      Perfil global (sin colegio asignado).
                    </span>
                  </div>
                ) : canChooseCollege ? (
                  <div>
                    <label className="font-bold text-blue-900 block mb-1 text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-700" />
                      Asignar al Colegio que Pertenece *
                    </label>
                    <select
                      value={formCollegeId || colleges[0]?.id || ''}
                      onChange={(e) => setFormCollegeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-blue-300 bg-blue-50/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.codigoCCT})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-blue-800/80 mt-1 block leading-tight">
                      Administrará únicamente los módulos de este colegio.
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-blue-900 block mb-1 text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-700" />
                      Colegio al que Pertenece
                    </label>
                    <div className="w-full px-3 py-2 text-xs sm:text-sm border border-blue-200 bg-blue-50/60 rounded-lg font-bold text-slate-900 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {currentCollege?.nombre || 'Mi Colegio'}{' '}
                        {currentCollege?.codigoCCT ? `(${currentCollege.codigoCCT})` : ''}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                        Fijo
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-800/80 mt-1 block leading-tight">
                      El usuario quedará registrado automáticamente en tu colegio.
                    </span>
                  </div>
                )}
              </div>

              {/* COORDINADOR & PSICÓLOGO CONFIGURATION: UN NIVEL vs MULTINIVEL + GRUPOS ESPECÍFICOS */}
              {isLevelGroupScopedRole(formRole) && (
                <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-bold text-cyan-950 text-xs block">
                        {formRole === 'psicologo'
                          ? 'Alcance de Atención Psicopedagógica (Niveles y Grupos) *'
                          : 'Alcance de Coordinación Académica (Niveles y Grupos) *'}
                      </label>
                      <span className="text-[11px] text-cyan-800">
                        {formRole === 'psicologo'
                          ? 'Elige si el psicólogo atiende un solo nivel o es multinivel, y qué grupos específicos tiene asignados.'
                          : 'Elige si coordina un solo nivel o es multinivel, y qué grupos específicos tiene a cargo.'}
                      </span>
                    </div>

                    {/* Selector Un Nivel vs Multinivel */}
                    <div className="inline-flex rounded-xl bg-white p-1 border border-cyan-200 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setFormTipoCoordinacion('un_nivel');
                          const primaryLvl = formNivelesAsignados[0] || formNivelAsignado || 'Primaria';
                          setFormNivelAsignado(primaryLvl);
                          setFormNivelesAsignados([primaryLvl]);
                          setFormGruposAsignados((prev) =>
                            prev.filter((g) => g.toLowerCase().startsWith(primaryLvl.toLowerCase()))
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          formTipoCoordinacion === 'un_nivel'
                            ? 'bg-cyan-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Un solo Nivel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormTipoCoordinacion('multinivel');
                          if (formNivelesAsignados.length < 2) {
                            const nextLevels: AcademicLevel[] =
                              formNivelAsignado === 'Primaria'
                                ? ['Primaria', 'Secundaria']
                                : [formNivelAsignado, 'Primaria'];
                            setFormNivelesAsignados(nextLevels);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          formTipoCoordinacion === 'multinivel'
                            ? 'bg-cyan-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Multinivel (Varios Niveles)
                      </button>
                    </div>
                  </div>

                  {/* Selección de Nivel(es) */}
                  {formTipoCoordinacion === 'un_nivel' ? (
                    <div>
                      <label className="text-[11px] font-bold text-cyan-900 block mb-1">
                        Nivel Educativo Asignado:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ALL_ACADEMIC_LEVELS.map((lvl) => {
                          const isSelected = formNivelAsignado === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                setFormNivelAsignado(lvl);
                                setFormNivelesAsignados([lvl]);
                                setFormGruposAsignados((prev) =>
                                  prev.filter((g) => g.toLowerCase().startsWith(lvl.toLowerCase()))
                                );
                              }}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-700 text-white border-cyan-800 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-cyan-900 block mb-1">
                        Selecciona los Niveles que coordina (Multinivel):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ALL_ACADEMIC_LEVELS.map((lvl) => {
                          const isChecked = formNivelesAsignados.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                const exists = formNivelesAsignados.includes(lvl);
                                const next = exists
                                  ? formNivelesAsignados.filter((item) => item !== lvl)
                                  : [...formNivelesAsignados, lvl];
                                if (next.length === 0) return;
                                setFormNivelesAsignados(next);
                                setFormNivelAsignado(next[0]);
                                if (exists) {
                                  setFormGruposAsignados((prev) =>
                                    prev.filter((g) => !g.toLowerCase().startsWith(lvl.toLowerCase()))
                                  );
                                }
                              }}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-cyan-700 text-white border-cyan-800 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                  isChecked
                                    ? 'bg-white text-cyan-800 border-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span>{lvl}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selector: Todos los grupos del nivel vs Grupos específicos (ej. 4°, 5° y 6° A/B de Primaria y 1°, 2° y 3° A/B de Secundaria) */}
                  <div className="pt-2 border-t border-cyan-200/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-cyan-950">
                        Asignación de Grupos:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormUsarGruposEspecificos(false);
                            setFormGruposAsignados([]);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            !formUsarGruposEspecificos
                              ? 'bg-cyan-800 text-white border-cyan-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Todos los grupos del nivel
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormUsarGruposEspecificos(true)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            formUsarGruposEspecificos
                              ? 'bg-cyan-800 text-white border-cyan-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Elegir grupos en específico
                        </button>
                      </div>
                    </div>

                    {formUsarGruposEspecificos && (
                      <div className="space-y-2.5 bg-white p-3 rounded-xl border border-cyan-200">
                        <p className="text-[11px] text-slate-600">
                          Selecciona los grupos que se crearon en el módulo <strong>Materias y Grupos</strong> para este colegio:
                        </p>

                        {(formTipoCoordinacion === 'un_nivel'
                          ? [formNivelAsignado]
                          : formNivelesAsignados
                        ).map((lvl) => {
                          const targetColId =
                            formCollegeId || currentCollege?.id || colleges[0]?.id || '';
                          const levelGroups = getAvailableGroupsForLevel(targetColId, lvl);
                          const selectedInLevel = levelGroups.filter((g) =>
                            formGruposAsignados.includes(g)
                          );

                          return (
                            <div
                              key={lvl}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                                  {lvl} ({selectedInLevel.length} de {levelGroups.length} seleccionados)
                                </span>
                                {levelGroups.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormGruposAsignados((prev) =>
                                          Array.from(new Set([...prev, ...levelGroups]))
                                        );
                                      }}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
                                    >
                                      Todos {lvl}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormGruposAsignados((prev) =>
                                          prev.filter((g) => !levelGroups.includes(g))
                                        );
                                      }}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                    >
                                      Limpiar
                                    </button>
                                  </div>
                                )}
                              </div>

                              {levelGroups.length === 0 ? (
                                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                                  No hay grupos creados para <strong>{lvl}</strong> en el módulo <strong>Materias y Grupos</strong> de este colegio.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {levelGroups.map((fullGrp) => {
                                    const shortLabel = fullGrp.replace(`${lvl} `, '');
                                    const isSelected = formGruposAsignados.includes(fullGrp);
                                    return (
                                      <button
                                        key={fullGrp}
                                        type="button"
                                        onClick={() => {
                                          setFormGruposAsignados((prev) =>
                                            prev.includes(fullGrp)
                                              ? prev.filter((item) => item !== fullGrp)
                                              : [...prev, fullGrp]
                                          );
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                          isSelected
                                            ? 'bg-cyan-700 text-white border-cyan-800 shadow-2xs'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-400'
                                        }`}
                                      >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        <span>{shortLabel}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Row 3: Cargo / Puesto & Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Cargo / Puesto
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isLevelGroupScopedRole(formRole)
                        ? buildCoordinatorCargoLabel(
                            formRole,
                            formTipoCoordinacion,
                            formTipoCoordinacion === 'un_nivel'
                              ? [formNivelAsignado]
                              : formNivelesAsignados,
                            formGruposAsignados,
                            formUsarGruposEspecificos
                          )
                        : 'Ej. Profesor Titular'
                    }
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+52 55 ..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {canRoleBeInactivated(formRole) && (
                <div className="p-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Estado de Acceso a la Plataforma
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formActivo
                        ? 'Usuario Activo: podrá iniciar sesión con sus credenciales.'
                        : 'Usuario Inactivo: se le negará el acceso a la plataforma.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormActivo(!formActivo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                      formActivo
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-rose-600 text-white border-rose-600'
                    }`}
                  >
                    {formActivo ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sticky Footer Actions inside Form */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Crear y Enviar por Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDITAR USUARIO EXISTENTE                              */}
      {/* ============================================================ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                Editar Usuario: {editingUser.nombre}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs md:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">Nombre</label>
                  <input
                    type="text"
                    value={editingUser.nombre}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">Correo</label>
                  <input
                    type="email"
                    value={editingUser.correo}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, correo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Credenciales Ocultas por Seguridad</span>
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Si el usuario solicita nuevamente sus datos de acceso, envíaselos a su correo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendCredentialsByEmail(editingUser)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar por correo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">Rol</label>
                  <select
                    value={editingUser.rol}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setEditingUser({
                        ...editingUser,
                        rol: nextRole,
                        colegioId: isUnlinkedGlobalRole(nextRole)
                          ? null
                          : editingUser.colegioId || currentCollege?.id || colleges[0]?.id || null,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                  >
                    {Object.values(allRolesConfig)
                      .filter((r) => creatableRolesForModal.includes(r.id) || r.id === editingUser.rol)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">Cargo</label>
                  <input
                    type="text"
                    value={editingUser.cargo}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, cargo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {isLevelGroupScopedRole(editingUser.rol) && (() => {
                const currentLevels: AcademicLevel[] =
                  editingUser.nivelesAsignados && editingUser.nivelesAsignados.length > 0
                    ? editingUser.nivelesAsignados
                    : [
                        editingUser.nivelAsignado ||
                          (editingUser.cargo?.toLowerCase().includes('preescolar')
                            ? 'Preescolar'
                            : editingUser.cargo?.toLowerCase().includes('secundaria')
                            ? 'Secundaria'
                            : editingUser.cargo?.toLowerCase().includes('preparatoria')
                            ? 'Preparatoria'
                            : 'Primaria'),
                      ];
                const isMulti =
                  editingUser.tipoCoordinacion === 'multinivel' || currentLevels.length > 1;
                const currentGroups = editingUser.gruposAsignados || [];
                const hasSpecificGroups = currentGroups.length > 0;

                return (
                  <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-bold text-cyan-950 text-xs block">
                        {editingUser.rol === 'psicologo'
                          ? 'Alcance de Atención Psicopedagógica (Niveles y Grupos)'
                          : 'Alcance de Coordinación Académica (Niveles y Grupos)'}
                      </label>
                      <div className="inline-flex rounded-xl bg-white p-1 border border-cyan-200">
                        <button
                          type="button"
                          onClick={() => {
                            const singleLvl = currentLevels[0] || 'Primaria';
                            setEditingUser({
                              ...editingUser,
                              tipoCoordinacion: 'un_nivel',
                              nivelAsignado: singleLvl,
                              nivelesAsignados: [singleLvl],
                              gruposAsignados: currentGroups.filter((g) =>
                                g.toLowerCase().startsWith(singleLvl.toLowerCase())
                              ),
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            !isMulti ? 'bg-cyan-700 text-white' : 'text-slate-600'
                          }`}
                        >
                          Un solo Nivel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextLvls: AcademicLevel[] =
                              currentLevels.length >= 2
                                ? currentLevels
                                : currentLevels[0] === 'Primaria'
                                ? ['Primaria', 'Secundaria']
                                : [currentLevels[0], 'Primaria'];
                            setEditingUser({
                              ...editingUser,
                              tipoCoordinacion: 'multinivel',
                              nivelesAsignados: nextLvls,
                              nivelAsignado: nextLvls[0],
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            isMulti ? 'bg-cyan-700 text-white' : 'text-slate-600'
                          }`}
                        >
                          Multinivel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_ACADEMIC_LEVELS.map((lvl) => {
                        const isSelected = currentLevels.includes(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              if (!isMulti) {
                                setEditingUser({
                                  ...editingUser,
                                  nivelAsignado: lvl,
                                  nivelesAsignados: [lvl],
                                  gruposAsignados: currentGroups.filter((g) =>
                                    g.toLowerCase().startsWith(lvl.toLowerCase())
                                  ),
                                });
                              } else {
                                const next = isSelected
                                  ? currentLevels.filter((l) => l !== lvl)
                                  : [...currentLevels, lvl];
                                if (next.length === 0) return;
                                setEditingUser({
                                  ...editingUser,
                                  nivelAsignado: next[0],
                                  nivelesAsignados: next,
                                  gruposAsignados: isSelected
                                    ? currentGroups.filter(
                                        (g) => !g.toLowerCase().startsWith(lvl.toLowerCase())
                                      )
                                    : currentGroups,
                                });
                              }
                            }}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-700 text-white border-cyan-800'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>

                    {/* Grupos específicos para edición */}
                    <div className="pt-2 border-t border-cyan-200/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-cyan-950">
                          Grupos Asignados ({hasSpecificGroups ? `${currentGroups.length} específicos` : 'Todos los grupos de sus niveles'}):
                        </span>
                        {hasSpecificGroups && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingUser({ ...editingUser, gruposAsignados: [] })
                            }
                            className="text-[11px] font-bold text-cyan-800 underline cursor-pointer"
                          >
                            Restablecer a todos los grupos del nivel
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 bg-white p-2.5 rounded-xl border border-cyan-200">
                        {currentLevels.map((lvl) => {
                          const targetColId =
                            editingUser.colegioId || currentCollege?.id || colleges[0]?.id || '';
                          const levelGroups = getAvailableGroupsForLevel(targetColId, lvl);
                          return (
                            <div key={lvl} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-800">{lvl} (creados en Materias y Grupos):</span>
                              </div>
                              {levelGroups.length === 0 ? (
                                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                                  No hay grupos creados para <strong>{lvl}</strong> en el módulo Materias y Grupos.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {levelGroups.map((fullGrp) => {
                                    const shortLabel = fullGrp.replace(`${lvl} `, '');
                                    const isSelected = currentGroups.includes(fullGrp);
                                    return (
                                      <button
                                        key={fullGrp}
                                        type="button"
                                        onClick={() => {
                                          const nextGrps = isSelected
                                            ? currentGroups.filter((g) => g !== fullGrp)
                                            : [...currentGroups, fullGrp];
                                          setEditingUser({
                                            ...editingUser,
                                            gruposAsignados: nextGrps,
                                          });
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                          isSelected
                                            ? 'bg-cyan-700 text-white border-cyan-800'
                                            : 'bg-slate-50 text-slate-700 border-slate-300'
                                        }`}
                                      >
                                        {shortLabel}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {isUnlinkedGlobalRole(editingUser.rol) ? (
                <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="text-xs font-semibold text-sky-900">
                    Este perfil es global y no va ligado a ningún colegio.
                  </span>
                </div>
              ) : canChooseCollege ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Colegio Asignado
                  </label>
                  <select
                    value={editingUser.colegioId || colleges[0]?.id || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, colegioId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Colegio Asignado
                  </label>
                  <div className="w-full px-3 py-2 border border-blue-200 bg-blue-50/60 rounded-lg font-bold text-slate-900 flex items-center justify-between">
                    <span>
                      {colleges.find((c) => c.id === (editingUser.colegioId || currentCollege?.id))
                        ?.nombre || currentCollege?.nombre || 'Mi Colegio'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Fijo
                    </span>
                  </div>
                </div>
              )}

              {canRoleBeInactivated(editingUser.rol) && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Estado del Usuario (Acceso a la Plataforma)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {editingUser.activo !== false
                        ? 'Cuenta Activa: tiene permitido el ingreso al sistema.'
                        : 'Cuenta Inactiva: acceso bloqueado y sesión revocada.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({
                        ...editingUser,
                        activo: editingUser.activo === false ? true : false,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                      editingUser.activo !== false
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {editingUser.activo !== false ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activo (Cambiar a Inactivo)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Inactivo (Cambiar a Activo)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const normalizedEdit: User = {
                    ...editingUser,
                    activo: canRoleBeInactivated(editingUser.rol)
                      ? editingUser.activo !== false
                      : true,
                    colegioId: isUnlinkedGlobalRole(editingUser.rol)
                      ? null
                      : editingUser.colegioId || currentCollege?.id || colleges[0]?.id || null,
                  };
                  updateUser(editingUser.id, normalizedEdit);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ENVÍO DE CREDENCIALES POR CORREO                      */}
      {/* ============================================================ */}
      {createdUserCredentials && (
        <div
          onClick={() => setCreatedUserCredentials(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 cursor-default"
          >
            <div
              className="p-5 text-white flex items-center justify-between border-b-4"
              style={{ backgroundColor: primaryColor, borderColor: goldColor }}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5" style={{ color: goldColor }} />
                <div>
                  <h3 className="font-display font-bold text-base">
                    Credenciales Ocultas · Envío por Correo
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Protección de credenciales para todos los perfiles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedUserCredentials(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Nombre Completo
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {createdUserCredentials.nombre}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      (
                        allRolesConfig[createdUserCredentials.rol] ||
                        ROLES_CONFIG[createdUserCredentials.rol] ||
                        ROLES_CONFIG.docente
                      ).badgeBg
                    } ${
                      (
                        allRolesConfig[createdUserCredentials.rol] ||
                        ROLES_CONFIG[createdUserCredentials.rol] ||
                        ROLES_CONFIG.docente
                      ).badgeText
                    }`}
                  >
                    {
                      (
                        allRolesConfig[createdUserCredentials.rol] ||
                        ROLES_CONFIG[createdUserCredentials.rol] ||
                        ROLES_CONFIG.docente
                      ).label
                    }
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Credenciales de Acceso (Usuario y Contraseña)
                  </span>
                  <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/80 text-slate-700 font-semibold text-xs border border-slate-300">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ocultas por seguridad (••••••••)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Correo Electrónico Destino
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {createdUserCredentials.correo}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendCredentialsByEmail(createdUserCredentials, true)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                {emailedModalCreds ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Credenciales enviadas nuevamente al correo!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Credenciales por Correo</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedUserCredentials(null)}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR USUARIO                  */}
      {/* ============================================================ */}
      {userToDelete && (
        <div
          onClick={() => setUserToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 cursor-default"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-900">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-display font-bold text-base">
                  Confirmar Eliminación de Usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs md:text-sm text-slate-700">
              <p>
                ¿Estás seguro de que deseas eliminar al usuario{' '}
                <strong className="text-slate-900">{userToDelete.nombre}</strong> (
                <span className="font-mono">{userToDelete.correo}</span>)?
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Rol:</span>{' '}
                  <strong>
                    {allRolesConfig[userToDelete.rol]?.label || userToDelete.rol}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Cargo:</span>{' '}
                  <strong>{userToDelete.cargo}</strong>
                </div>
              </div>
              <p className="text-xs text-rose-700 font-semibold">
                Esta acción eliminará permanentemente al usuario tanto de la plataforma como de la base de datos y revocará su acceso de inmediato.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const deletedName = userToDelete.nombre;
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                  setDeletedBanner(
                    `El usuario "${deletedName}" ha sido eliminado permanentemente de la plataforma y de la base de datos.`
                  );
                  setTimeout(() => setDeletedBanner(null), 4000);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Usuario</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
