import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ROLES_CONFIG,
  SYSTEM_MODULES_REGISTRY,
  DEFAULT_ROLE_PERMISSIONS,
  UserRole,
  RolePermissionsMap,
} from '../types';
import {
  Shield,
  Save,
  CheckCircle2,
  RotateCcw,
  CheckSquare,
  Square,
  Search,
  Lock,
  Layers,
  Info,
  Sparkles,
  Building2,
  Globe,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ChevronsUp,
  ChevronsDown,
  ListOrdered,
  Car,
  Power,
} from 'lucide-react';

const PROFILE_TABS_ORDER: UserRole[] = [
  'administrador',
  'control_escolar',
  'directivo',
  'coordinador',
  'supervisor',
  'prefecto',
  'psicologo',
  'docente',
  'tutor',
  'alumno',
  'soporte',
  'superusuario',
];

export const PermissionsModule: React.FC = () => {
  const {
    colleges,
    activeCollege,
    selectedCollegeId,
    rolePermissions,
    collegeRolePermissions,
    getRolePermissionsForCollege,
    updateRolePermissions,
    allRolesConfig,
    currentUser,
    toggleCollegeDriveUsageEnabled,
    isCollegeDriveUsageEnabled,
    getCollegeScheduleDriveConfig,
  } = useApp();

  const [activePermSection, setActivePermSection] = useState<'perfiles' | 'uso_drive'>('perfiles');
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [driveSavedNotice, setDriveSavedNotice] = useState<string | null>(null);

  // Target college selector: defaults to 'global' when in Global Mode (selectedCollegeId === null), or activeCollege.id if inside a college
  const [targetCollegeId, setTargetCollegeId] = useState<string>(() => {
    if (selectedCollegeId) return selectedCollegeId;
    if (activeCollege?.id) return activeCollege.id;
    return 'global';
  });

  // Sync if user switches college or returns to Global Mode in sidebar dropdown
  useEffect(() => {
    if (selectedCollegeId) {
      setTargetCollegeId(selectedCollegeId);
    } else {
      setTargetCollegeId('global');
    }
  }, [selectedCollegeId]);

  const effectiveCollegeId = targetCollegeId === 'global' ? null : targetCollegeId;
  const selectedCollegeObj = colleges.find((c) => c.id === effectiveCollegeId) || activeCollege;

  const [selectedRole, setSelectedRole] = useState<UserRole>('administrador');
  const [draftPermissions, setDraftPermissions] = useState<RolePermissionsMap>(() =>
    getRolePermissionsForCollege(effectiveCollegeId)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [savedNotice, setSavedNotice] = useState(false);
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

  // Sync draft when targetCollegeId or context permissions change
  useEffect(() => {
    setDraftPermissions(getRolePermissionsForCollege(effectiveCollegeId));
  }, [effectiveCollegeId, rolePermissions, collegeRolePermissions]);

  // El usuario de soporte en el módulo permisos no puede ver el perfil de soporte (ni superusuario)
  useEffect(() => {
    if (
      currentUser?.rol === 'soporte' &&
      (selectedRole === 'soporte' || selectedRole === 'superusuario')
    ) {
      setSelectedRole('administrador');
    }
  }, [currentUser?.rol, selectedRole]);

  const primaryColor = selectedCollegeObj?.colores?.primario || activeCollege?.colores?.primario || '#0B2545';
  const goldColor = selectedCollegeObj?.colores?.secundario || activeCollege?.colores?.secundario || '#DFB743';

  const currentRoleDef = allRolesConfig[selectedRole] || ROLES_CONFIG[selectedRole] || ROLES_CONFIG.docente;
  const rawAllowedIds = draftPermissions[selectedRole] || [];
  // Ensure mi_perfil is always at the end
  const currentAllowedIds = rawAllowedIds.includes('mi_perfil')
    ? [...rawAllowedIds.filter((id) => id !== 'mi_perfil'), 'mi_perfil']
    : rawAllowedIds;

  const allRoleKeys = Array.from(
    new Set([...PROFILE_TABS_ORDER, ...Object.keys(allRolesConfig)])
  ).filter((roleKey) => {
    if (currentUser?.rol === 'soporte') {
      return roleKey !== 'soporte' && roleKey !== 'superusuario';
    }
    return true;
  });

  // Helper to get the ordered active modules for the selected role (with mi_perfil always at the end)
  const orderedActiveModules = currentAllowedIds
    .map((id) => SYSTEM_MODULES_REGISTRY.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const persistRoleOrder = (nextOrderIds: string[]) => {
    const normalizedOrder = nextOrderIds.includes('mi_perfil')
      ? [...nextOrderIds.filter((id) => id !== 'mi_perfil'), 'mi_perfil']
      : nextOrderIds;
    const nextMap: RolePermissionsMap = {
      ...draftPermissions,
      [selectedRole]: normalizedOrder,
    };
    setDraftPermissions(nextMap);
    updateRolePermissions(nextMap, effectiveCollegeId);
  };

  const handleMoveModuleOrder = (moduleId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (moduleId === 'mi_perfil') return; // Mi Perfil siempre va al final
    const listWithoutMiPerfil = currentAllowedIds.filter((id) => id !== 'mi_perfil');
    const hasMiPerfil = currentAllowedIds.includes('mi_perfil');
    const index = listWithoutMiPerfil.indexOf(moduleId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = listWithoutMiPerfil[index - 1];
      listWithoutMiPerfil[index - 1] = listWithoutMiPerfil[index];
      listWithoutMiPerfil[index] = temp;
      persistRoleOrder(hasMiPerfil ? [...listWithoutMiPerfil, 'mi_perfil'] : listWithoutMiPerfil);
    } else if (direction === 'down' && index < listWithoutMiPerfil.length - 1) {
      const temp = listWithoutMiPerfil[index + 1];
      listWithoutMiPerfil[index + 1] = listWithoutMiPerfil[index];
      listWithoutMiPerfil[index] = temp;
      persistRoleOrder(hasMiPerfil ? [...listWithoutMiPerfil, 'mi_perfil'] : listWithoutMiPerfil);
    } else if (direction === 'top' && index > 0) {
      listWithoutMiPerfil.splice(index, 1);
      listWithoutMiPerfil.unshift(moduleId);
      persistRoleOrder(hasMiPerfil ? [...listWithoutMiPerfil, 'mi_perfil'] : listWithoutMiPerfil);
    } else if (direction === 'bottom' && index < listWithoutMiPerfil.length - 1) {
      listWithoutMiPerfil.splice(index, 1);
      listWithoutMiPerfil.push(moduleId);
      persistRoleOrder(hasMiPerfil ? [...listWithoutMiPerfil, 'mi_perfil'] : listWithoutMiPerfil);
    }
  };

  const handleDropReorder = (targetModuleId: string) => {
    if (
      !draggedModuleId ||
      draggedModuleId === targetModuleId ||
      draggedModuleId === 'mi_perfil'
    ) {
      setDraggedModuleId(null);
      setDragOverModuleId(null);
      return;
    }
    const listWithoutMiPerfil = currentAllowedIds.filter((id) => id !== 'mi_perfil');
    const hasMiPerfil = currentAllowedIds.includes('mi_perfil');
    const fromIdx = listWithoutMiPerfil.indexOf(draggedModuleId);
    const toIdx =
      targetModuleId === 'mi_perfil'
        ? listWithoutMiPerfil.length - 1
        : listWithoutMiPerfil.indexOf(targetModuleId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedModuleId(null);
      setDragOverModuleId(null);
      return;
    }
    listWithoutMiPerfil.splice(fromIdx, 1);
    listWithoutMiPerfil.splice(toIdx, 0, draggedModuleId);
    persistRoleOrder(hasMiPerfil ? [...listWithoutMiPerfil, 'mi_perfil'] : listWithoutMiPerfil);
    setDraggedModuleId(null);
    setDragOverModuleId(null);
  };

  const categories = [
    'todas',
    'Control Escolar y Colegio',
    'Portal de Tutores',
    'Portal de Alumnos',
    'Panel Global',
    'Cuenta',
  ];

  const filteredModules = SYSTEM_MODULES_REGISTRY.filter((mod) => {
    if (
      selectedRole === 'soporte' &&
      (mod.id === 'perfiles' ||
        mod.id === 'planes_modulos' ||
        mod.id === 'comisiones_plataforma')
    ) {
      return false;
    }
    const matchesSearch =
      !searchQuery.trim() ||
      mod.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'todas' || mod.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Group filtered modules by category so they are super scannable
  const groupedModules = categories
    .filter((c) => c !== 'todas')
    .map((cat) => ({
      categoria: cat,
      items: filteredModules.filter((m) => m.categoria === cat),
    }))
    .filter((g) => g.items.length > 0);

  const handleToggleModule = (moduleId: string) => {
    // If Superusuario tab is selected, toggling a module enables/disables it across ALL profiles at once!
    if (selectedRole === 'superusuario') {
      const nonSuperRoles = allRoleKeys.filter((r) => r !== 'superusuario') as UserRole[];
      const isCurrentlyActiveInAny = nonSuperRoles.some((r) =>
        (draftPermissions[r] || []).includes(moduleId)
      );
      const nextMap: RolePermissionsMap = { ...draftPermissions };
      nonSuperRoles.forEach((r) => {
        const currentList = nextMap[r] || [];
        if (isCurrentlyActiveInAny) {
          nextMap[r] = currentList.filter((id) => id !== moduleId);
        } else if (!currentList.includes(moduleId)) {
          nextMap[r] = [...currentList, moduleId];
        }
      });
      setDraftPermissions(nextMap);
      updateRolePermissions(nextMap, effectiveCollegeId);
      return;
    }

    const targetIds =
      selectedRole === 'tutor' && (moduleId === 'cafeteria' || moduleId === 'mi_cafeteria')
        ? ['cafeteria', 'mi_cafeteria']
        : [moduleId];

    // If inside a specific college and the module is disabled in Global Mode for this role, also enable it in Global Mode or update college
    if (effectiveCollegeId) {
      const globalRoleList = rolePermissions[selectedRole] || [];
      const currentList = draftPermissions[selectedRole] || [];
      const exists = currentList.includes(moduleId);
      const updatedList = exists
        ? currentList.filter((id) => !targetIds.includes(id))
        : [...currentList, ...targetIds.filter((id) => !currentList.includes(id))];

      // If enabling a module in a specific college that was disabled in Global Mode, also enable it in Global Mode for that role so it can be active in this college
      if (!exists && !globalRoleList.includes(moduleId)) {
        updateRolePermissions(
          {
            ...rolePermissions,
            [selectedRole]: [...globalRoleList, ...targetIds.filter((id) => !globalRoleList.includes(id))],
          },
          null
        );
      }

      const nextMap: RolePermissionsMap = {
        ...draftPermissions,
        [selectedRole]: updatedList,
      };
      setDraftPermissions(nextMap);
      updateRolePermissions(nextMap, effectiveCollegeId);
      return;
    }

    const currentList = draftPermissions[selectedRole] || [];
    const exists = currentList.includes(moduleId);
    const updatedList = exists
      ? currentList.filter((id) => !targetIds.includes(id))
      : [...currentList, ...targetIds.filter((id) => !currentList.includes(id))];
    const nextMap: RolePermissionsMap = {
      ...draftPermissions,
      [selectedRole]: updatedList,
    };
    setDraftPermissions(nextMap);
    // Apply immediately in Global Mode -> synchronizes across ALL colleges!
    updateRolePermissions(nextMap, null);
  };

  const handleSelectAllForRole = () => {
    if (selectedRole === 'superusuario') return;
    const allIds = SYSTEM_MODULES_REGISTRY.map((m) => m.id).filter(
      (id) =>
        selectedRole !== 'soporte' ||
        (id !== 'perfiles' && id !== 'planes_modulos' && id !== 'comisiones_plataforma')
    );
    const nextMap = {
      ...draftPermissions,
      [selectedRole]: allIds,
    };
    setDraftPermissions(nextMap);
    updateRolePermissions(nextMap, effectiveCollegeId);
  };

  const handleResetRoleDefaults = () => {
    const defaultForRole = DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];
    const nextMap = {
      ...draftPermissions,
      [selectedRole]: [...defaultForRole],
    };
    setDraftPermissions(nextMap);
    updateRolePermissions(nextMap, effectiveCollegeId);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSavePermissions = () => {
    updateRolePermissions(draftPermissions, effectiveCollegeId);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const hasCustomCollegePermissions = Boolean(
    effectiveCollegeId && collegeRolePermissions[effectiveCollegeId]
  );

  const filteredDriveColleges = colleges.filter((col) => {
    if (!driveSearchQuery.trim()) return true;
    const q = driveSearchQuery.toLowerCase();
    return (
      col.nombre.toLowerCase().includes(q) ||
      col.codigoCCT.toLowerCase().includes(q) ||
      col.nivel.toLowerCase().includes(q) ||
      col.director.toLowerCase().includes(q)
    );
  });

  const enabledDriveCollegesCount = colleges.filter((col) =>
    isCollegeDriveUsageEnabled(col.id)
  ).length;

  const handleToggleCollegeDrive = (collegeId: string, nextEnabled: boolean, collegeName?: string) => {
    toggleCollegeDriveUsageEnabled(collegeId, nextEnabled);
    const label =
      collegeId === 'global'
        ? `todos los colegios (${nextEnabled ? 'Activado' : 'Desactivado'})`
        : `${collegeName || 'el colegio'} (${nextEnabled ? 'Drive Activado' : 'Drive Desactivado'})`;
    setDriveSavedNotice(`Se actualizó el uso de Drive para ${label}.`);
    setTimeout(() => setDriveSavedNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
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
              {currentUser?.rol === 'soporte' ? 'Soporte' : 'Superusuario'} · Control de Accesos y Drive por Colegio
            </span>
            <span className="text-xs text-slate-200 font-mono">
              {SYSTEM_MODULES_REGISTRY.length} módulos · {enabledDriveCollegesCount}/{colleges.length} colegios con Drive activo
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Shield className="w-6 h-6" style={{ color: goldColor }} />
            Módulo de Permisos y Uso de Drive por Colegio
          </h2>
          <p className="text-xs md:text-sm text-slate-200 max-w-2xl">
            Configura los módulos visibles por perfil en cada institución o utiliza la pestaña{' '}
            <strong>Uso de Drive por Colegio</strong> para activar o desactivar el sistema de entrega escolar (Drive / En Fila) en cada plantel.
          </p>
        </div>
      </div>

      {/* Main Module Navigation Tabs: Perfiles vs Uso de Drive por Colegio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActivePermSection('perfiles')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activePermSection === 'perfiles'
                ? 'text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            style={
              activePermSection === 'perfiles'
                ? { backgroundColor: primaryColor }
                : {}
            }
          >
            <Layers
              className="w-4 h-4 shrink-0"
              style={{ color: activePermSection === 'perfiles' ? goldColor : '#64748B' }}
            />
            <span>Permisos de Módulos por Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePermSection('uso_drive')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activePermSection === 'uso_drive'
                ? 'text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            style={
              activePermSection === 'uso_drive'
                ? { backgroundColor: primaryColor }
                : {}
            }
          >
            <Car
              className="w-4 h-4 shrink-0"
              style={{ color: activePermSection === 'uso_drive' ? goldColor : '#0B2545' }}
            />
            <span>Uso de Drive por Colegio</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activePermSection === 'uso_drive'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {enabledDriveCollegesCount}/{colleges.length} activos
            </span>
          </button>
        </div>

        {activePermSection === 'perfiles' && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetRoleDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Restaurar permisos predeterminados para este perfil"
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Restaurar Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleSavePermissions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                Guardar en {selectedCollegeObj ? selectedCollegeObj.nombre : 'Global'}
              </span>
            </button>
          </div>
        )}
      </div>

      {activePermSection === 'uso_drive' ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Drive Usage Control Banner & Bulk Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    <Car className="w-3.5 h-3.5 text-amber-700" />
                    <span>Control de Uso de Drive (En Fila y Monitor de Entrega)</span>
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    · {enabledDriveCollegesCount} de {colleges.length} colegios con Drive habilitado
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Activa o desactiva el uso del sistema <strong>Drive</strong> en cada colegio. Cuando el Drive está <strong>Activo</strong>, el personal del colegio puede abrir la pantalla <strong>Iniciar Drive</strong> y los padres/tutores visualizan el botón flotante <strong>En Fila</strong>. Cuando está <strong>Desactivado</strong>, los botones y pantallas de Drive se ocultan en ese colegio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleCollegeDrive('global', true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activar Drive en Todos</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCollegeDrive('global', false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Desactivar Drive en Todos</span>
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={driveSearchQuery}
                  onChange={(e) => setDriveSearchQuery(e.target.value)}
                  placeholder="Buscar colegio por nombre, CCT, nivel o director..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Drive Activo: {enabledDriveCollegesCount}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Drive Inactivo: {colleges.length - enabledDriveCollegesCount}</span>
                </span>
              </div>
            </div>
          </div>

          {driveSavedNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{driveSavedNotice}</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 shrink-0">
                Aplicado al instante
              </span>
            </div>
          )}

          {/* Colleges Drive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDriveColleges.map((col) => {
              const isDriveEnabled = isCollegeDriveUsageEnabled(col.id);
              const driveCfg = getCollegeScheduleDriveConfig(col.id);
              const colPrimary = col.colores?.primario || '#0B2545';
              const colGold = col.colores?.secundario || '#C59B27';

              return (
                <div
                  key={col.id}
                  onClick={() => handleToggleCollegeDrive(col.id, !isDriveEnabled, col.nombre)}
                  className={`rounded-2xl border-2 p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                    isDriveEnabled
                      ? 'bg-white border-emerald-400 shadow-xs hover:shadow-md'
                      : 'bg-slate-50/80 border-slate-200 opacity-85 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {col.escudoUrl ? (
                          <img
                            src={col.escudoUrl}
                            alt={col.nombre}
                            className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                            style={{ backgroundColor: colPrimary }}
                          >
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="inline-block text-[10px] font-mono font-bold text-slate-500 uppercase">
                            CCT: {col.codigoCCT} · {col.nivel}
                          </span>
                          <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug truncate">
                            {col.nombre}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">
                            Dir. {col.director}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCollegeDrive(col.id, !isDriveEnabled, col.nombre);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${
                          isDriveEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        aria-label={`Alternar uso de Drive en ${col.nombre}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isDriveEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isDriveEnabled
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Car
                            className={`w-4 h-4 shrink-0 ${
                              isDriveEnabled ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          />
                          <span>
                            {isDriveEnabled ? 'Uso de Drive ACTIVADO' : 'Uso de Drive DESACTIVADO'}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isDriveEnabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isDriveEnabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {isDriveEnabled
                          ? 'Botón "Iniciar Drive" habilitado para personal del colegio y botón flotante "En Fila" visible para padres/tutores.'
                          : 'El sistema Drive y el botón "En Fila" se encuentran deshabilitados y ocultos para todos los usuarios de este colegio.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>Validación horario:</span>
                      <strong className="text-slate-700">
                        {driveCfg.horarioHabilitado ? 'Habilitada' : 'Directo a Drive'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollegeDrive(col.id, !isDriveEnabled, col.nombre);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isDriveEnabled
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'text-white shadow-2xs'
                      }`}
                      style={
                        !isDriveEnabled
                          ? { backgroundColor: colPrimary, color: colGold }
                          : {}
                      }
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isDriveEnabled ? 'Desactivar Drive' : 'Activar Drive'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>

      {/* College Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedCollegeObj ? (
              selectedCollegeObj.escudoUrl ? (
                <img
                  src={selectedCollegeObj.escudoUrl}
                  alt={selectedCollegeObj.nombre}
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-2xs shrink-0"
                />
              ) : null
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-slate-700" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Colegio Seleccionado para Configurar Permisos:</span>
                </span>
                {hasCustomCollegePermissions ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Configuración exclusiva guardada en este colegio
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Usando plantilla base
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                {selectedCollegeObj
                  ? `${selectedCollegeObj.nombre} (${selectedCollegeObj.codigoCCT})`
                  : 'Plantilla Global (Todos los Colegios sin configuración propia)'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:min-w-[320px]">
            <select
              value={targetCollegeId}
              onChange={(e) => setTargetCollegeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="global">
                🌐 Modo Global (Aplica a Todos los Colegios)
              </option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  🏫 {col.nombre} ({col.codigoCCT})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick College Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          <button
            type="button"
            onClick={() => setTargetCollegeId('global')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              targetCollegeId === 'global'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Modo Global (Todos los Colegios)</span>
          </button>
          {colleges.map((col) => {
            const isSelectedCol = targetCollegeId === col.id;
            const hasSaved = Boolean(collegeRolePermissions[col.id]);
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setTargetCollegeId(col.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                  isSelectedCol
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {col.escudoUrl && (
                  <img
                    src={col.escudoUrl}
                    alt={col.nombre}
                    className="w-4 h-4 rounded object-contain bg-white p-0.5 shrink-0"
                  />
                )}
                <span className="truncate max-w-[180px]">{col.nombre}</span>
                {hasSaved && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelectedCol ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    title="Permisos personalizados guardados"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instant Save Notification */}
      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ¡Permisos guardados al instante para{' '}
              <strong>
                {selectedCollegeObj ? selectedCollegeObj.nombre : 'la Plantilla Global'}
              </strong>
              ! El perfil de <strong>{currentRoleDef.label}</strong> se ha actualizado en tiempo real.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 shrink-0">
            Guardado por Colegio
          </span>
        </div>
      )}

      {/* Profile Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Perfiles en {selectedCollegeObj ? selectedCollegeObj.nombre : 'Plantilla Global'} (Selecciona una Pestaña):
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            Cada módulo nuevo que se agregue al sistema aparece automáticamente en esta lista
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {allRoleKeys.map((roleKey) => {
            const roleDef = allRolesConfig[roleKey] || ROLES_CONFIG[roleKey];
            if (!roleDef) return null;
            const isSelected = selectedRole === roleKey;
            const count = (draftPermissions[roleKey] || []).length;

            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRole(roleKey)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }
                    : {}
                }
              >
                <span>{roleDef.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white font-extrabold'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}/{SYSTEM_MODULES_REGISTRY.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Profile Summary & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentRoleDef.badgeBg} ${currentRoleDef.badgeText}`}
              >
                Perfil: {currentRoleDef.label}
              </span>
              <span className="text-xs font-bold text-slate-700">
                en {selectedCollegeObj ? selectedCollegeObj.nombre : 'Plantilla Global'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                · {currentAllowedIds.length} de {SYSTEM_MODULES_REGISTRY.length} módulos habilitados
              </span>
            </div>
            <p className="text-xs text-slate-600">{currentRoleDef.descripcion}</p>
          </div>

          {selectedRole !== 'superusuario' ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllForRole}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
              >
                Activar Todos
              </button>
              <button
                type="button"
                onClick={handleResetRoleDefaults}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
              >
                Valores por Defecto
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-3.5 h-3.5" style={{ color: goldColor }} />
                <span>Guardar para este Colegio</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>El Superusuario conserva acceso maestro a todos los módulos</span>
            </div>
          )}
        </div>

        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar módulo por nombre o descripción..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'todas' ? 'Todas las Categorías' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Menu Order Organizer for the Selected Profile */}
      <div className="bg-white rounded-2xl border-2 border-amber-300/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 via-amber-50/40 to-white border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl shadow-2xs shrink-0"
              style={{ backgroundColor: primaryColor, color: goldColor }}
            >
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>Orden de Aparición de Módulos en el Perfil: {currentRoleDef.label}</span>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {orderedActiveModules.length} activos
                </span>
              </h3>
              <p className="text-[11px] text-slate-600">
                Arrastra y suelta las tarjetas o usa las flechas para acomodar el orden exacto en que aparecerán los módulos en el menú lateral para <strong>{currentRoleDef.label}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetRoleDefaults}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Restaurar Orden Original</span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {orderedActiveModules.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              No hay módulos activos en este perfil. Activa módulos en la parte inferior para ordenar su aparición.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {orderedActiveModules.map((mod, idx) => {
                const isDragging = draggedModuleId === mod.id;
                const isDragOver = dragOverModuleId === mod.id && draggedModuleId !== mod.id;
                const isMiPerfil = mod.id === 'mi_perfil';
                const maxMovableIdx = orderedActiveModules.some((m) => m.id === 'mi_perfil')
                  ? orderedActiveModules.length - 2
                  : orderedActiveModules.length - 1;

                return (
                  <div
                    key={mod.id}
                    draggable={!isMiPerfil}
                    onDragStart={() => !isMiPerfil && setDraggedModuleId(mod.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverModuleId !== mod.id) {
                        setDragOverModuleId(mod.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverModuleId === mod.id) {
                        setDragOverModuleId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropReorder(mod.id);
                    }}
                    onDragEnd={() => {
                      setDraggedModuleId(null);
                      setDragOverModuleId(null);
                    }}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all select-none ${
                      isMiPerfil ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    } ${
                      isDragging
                        ? 'opacity-40 bg-amber-50 border-amber-400 scale-98'
                        : isDragOver
                        ? 'bg-amber-50/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-300/50'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                      <span
                        className="w-6 h-6 rounded-lg text-[11px] font-mono font-extrabold flex items-center justify-center shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: idx === 0 ? goldColor : primaryColor,
                          color: idx === 0 ? primaryColor : '#FFFFFF',
                        }}
                        title={idx === 0 ? 'Primer módulo al iniciar sesión' : `Posición #${idx + 1}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {mod.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <span>{mod.categoria}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.1 rounded">
                              1° Vista Principal
                            </span>
                          )}
                          {isMiPerfil && (
                            <span className="text-[9px] font-extrabold text-slate-700 bg-slate-200 px-1.5 py-0.1 rounded">
                              Siempre al Final
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isMiPerfil || idx === 0}
                        onClick={() => handleMoveModuleOrder(mod.id, 'top')}
                        title="Mover al inicio (Posición #1)"
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isMiPerfil || idx === 0}
                        onClick={() => handleMoveModuleOrder(mod.id, 'up')}
                        title="Subir una posición"
                        className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isMiPerfil || idx >= maxMovableIdx}
                        onClick={() => handleMoveModuleOrder(mod.id, 'down')}
                        title="Bajar una posición"
                        className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isMiPerfil || idx >= maxMovableIdx}
                        onClick={() => handleMoveModuleOrder(mod.id, 'bottom')}
                        title="Mover al final"
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modules Grid Grouped by Category */}
      <div className="space-y-6">
        {groupedModules.map((group) => (
          <div
            key={group.categoria}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
          >
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  {group.categoria}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {group.items.filter((m) => currentAllowedIds.includes(m.id)).length} de{' '}
                {group.items.length} activos
              </span>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {group.items.map((mod) => {
                const nonSuperRoles = allRoleKeys.filter((r) => r !== 'superusuario') as UserRole[];
                const isEnabled =
                  selectedRole === 'superusuario'
                    ? nonSuperRoles.some((r) => (draftPermissions[r] || []).includes(mod.id))
                    : currentAllowedIds.includes(mod.id);
                const isLockedSuper = false;

                return (
                  <div
                    key={mod.id}
                    onClick={() => !isLockedSuper && handleToggleModule(mod.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                      isLockedSuper ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      isEnabled
                        ? 'bg-emerald-50/40 border-emerald-400 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                            {mod.label}
                          </div>
                          {mod.sublabel && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.2 rounded bg-slate-200/70 text-slate-700 mt-0.5">
                              {mod.sublabel}
                            </span>
                          )}
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          disabled={isLockedSuper}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLockedSuper) handleToggleModule(mod.id);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                          } ${isLockedSuper ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          aria-label={`Alternar módulo ${mod.label}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {mod.descripcion}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">ID: {mod.id}</span>
                        {currentAllowedIds.includes(mod.id) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                            Orden #{currentAllowedIds.indexOf(mod.id) + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {currentAllowedIds.includes(mod.id) && mod.id !== 'mi_perfil' && (
                          <div
                            className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={currentAllowedIds.indexOf(mod.id) <= 0}
                              onClick={() => handleMoveModuleOrder(mod.id, 'up')}
                              title="Subir en el orden del menú"
                              className="p-0.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={
                                currentAllowedIds
                                  .filter((id) => id !== 'mi_perfil')
                                  .indexOf(mod.id) ===
                                currentAllowedIds.filter((id) => id !== 'mi_perfil').length - 1
                              }
                              onClick={() => handleMoveModuleOrder(mod.id, 'down')}
                              title="Bajar en el orden del menú"
                              className="p-0.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>Oculto</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Save Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Los cambios realizados para <strong>{currentRoleDef.label}</strong> se guardan
            específicamente para{' '}
            <strong>{selectedCollegeObj ? selectedCollegeObj.nombre : 'la Plantilla Global'}</strong>{' '}
            y se aplican al instante.
          </span>
        </div>

        <button
          type="button"
          onClick={handleSavePermissions}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs md:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Save className="w-4 h-4" />
          <span>
            Guardar Permisos ({selectedCollegeObj ? selectedCollegeObj.nombre : 'Global'})
          </span>
        </button>
      </div>
      </>
      )}
    </div>
  );
};
