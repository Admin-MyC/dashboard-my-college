import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SYSTEM_MODULES_REGISTRY,
  RoleDefinition,
} from '../types';
import {
  UserCheck,
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Layers,
  Shield,
  Search,
} from 'lucide-react';

const BADGE_COLOR_PRESETS = [
  {
    name: 'Violeta',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-900 border-violet-300',
  },
  {
    name: 'Azul Institucional',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900 border-blue-300',
  },
  {
    name: 'Esmeralda',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900 border-emerald-300',
  },
  {
    name: 'Ámbar Dorado',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
  },
  {
    name: 'Rosa Coral',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900 border-rose-300',
  },
  {
    name: 'Cian',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900 border-cyan-300',
  },
];

export const ProfilesModule: React.FC = () => {
  const {
    allRolesConfig,
    customRoles,
    rolePermissions,
    addCustomRole,
    updateCustomRole,
    deleteCustomRole,
    updateRolePermissions,
  } = useApp();

  const primaryColor = '#0B2545';
  const goldColor = '#DFB743';

  // Form state for creating/editing a role profile
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'colegio_resumen',
    'estudiantes',
    'mi_perfil',
  ]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleDefinition | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const categories = [
    'todas',
    'Control Escolar y Colegio',
    'Portal de Tutores',
    'Portal de Alumnos',
    'Panel Global',
    'Cuenta',
  ];

  const filteredSystemModules = SYSTEM_MODULES_REGISTRY.filter((m) => {
    const matchesSearch =
      !moduleSearch.trim() ||
      m.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(moduleSearch.toLowerCase());
    const matchesCategory =
      selectedCategory === 'todas' || m.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleModuleSelection = (modId: string) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredSystemModules.map((m) => m.id);
    setSelectedModules((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedModules(['mi_perfil']);
  };

  const handleStartEditRole = (role: RoleDefinition) => {
    setEditingRoleId(role.id);
    setRoleName(role.label);
    setRoleDescription(role.descripcion);
    const currentMods = rolePermissions[role.id] || ['mi_perfil'];
    setSelectedModules(currentMods);
    const presetIdx = BADGE_COLOR_PRESETS.findIndex((p) => p.badgeBg === role.badgeBg);
    setSelectedColorIdx(presetIdx >= 0 ? presetIdx : 0);
  };

  const handleResetForm = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedColorIdx(0);
    setSelectedModules(['colegio_resumen', 'estudiantes', 'mi_perfil']);
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const preset = BADGE_COLOR_PRESETS[selectedColorIdx] || BADGE_COLOR_PRESETS[0];

    if (editingRoleId) {
      const isCustom = customRoles.some((r) => r.id === editingRoleId);
      if (isCustom) {
        updateCustomRole(
          editingRoleId,
          {
            label: roleName.trim(),
            descripcion: roleDescription.trim(),
            badgeBg: preset.badgeBg,
            badgeText: preset.badgeText,
          },
          selectedModules
        );
      } else {
        updateRolePermissions({
          ...rolePermissions,
          [editingRoleId]: selectedModules,
        });
      }
      showToast(
        `Perfil "${roleName.trim()}" actualizado con ${selectedModules.length} módulos asignados.`
      );
      handleResetForm();
    } else {
      const created = addCustomRole({
        label: roleName.trim(),
        descripcion: roleDescription.trim(),
        badgeBg: preset.badgeBg,
        badgeText: preset.badgeText,
        esGlobal: false,
        modulosAsignados: selectedModules,
      });
      showToast(
        `¡Nuevo perfil "${created.label}" creado con éxito y con ${selectedModules.length} módulos asignados!`
      );
      handleResetForm();
    }
  };

  const allRolesList = Object.values(allRolesConfig);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #133B6E 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Superusuario · Módulo Perfiles
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white border border-white/20">
              {allRolesList.length} Perfiles Registrados ({customRoles.length} personalizados)
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6" style={{ color: goldColor }} />
            <span>Módulo Perfiles: Creación de Roles de Usuario y Asignación de Módulos</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-200 max-w-3xl">
            Crea nuevos tipos de rol de usuario (ej. Enfermería, Contabilidad, Recepción, Subdirección, etc.) y asígnales directamente desde aquí los módulos que requieran.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left / Main Form: Create or Edit Role & Assign Modules */}
        <div className="xl:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  {editingRoleId
                    ? `Editar Perfil y Módulos: ${roleName}`
                    : 'Crear Nuevo Tipo de Rol / Perfil de Usuario'}
                </h3>
                <p className="text-xs text-slate-500">
                  Define el nombre del rol y marca las casillas de los módulos a los que tendrá acceso
                </p>
              </div>
            </div>

            {editingRoleId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                + Nuevo Perfil
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Nuevo Rol / Perfil *
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ej. Contabilidad, Enfermería, Subdirector, Cajero..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Color Distintivo de Etiqueta
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BADGE_COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${preset.badgeBg} ${preset.badgeText} ${
                        selectedColorIdx === idx ? 'ring-2 ring-slate-900 scale-105' : 'opacity-75'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Descripción / Funciones del Perfil
              </label>
              <input
                type="text"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Ej. Personal encargado de cobranza escolar, control de pagos y facturación..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Module Assignment Section */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      Asignar los Módulos que Requiere ({selectedModules.length} seleccionados)
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-200 cursor-pointer"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Filter & Search Modules */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Buscar módulo..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'todas' ? 'Todas las Categorías' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modules Grid Checkboxes */}
              <div className="max-h-80 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
                {filteredSystemModules.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModuleSelection(mod.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-white border-blue-500 shadow-2xs'
                          : 'bg-white/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {mod.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {mod.categoria}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {editingRoleId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: goldColor, color: primaryColor }}
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingRoleId
                    ? 'Guardar Cambios del Perfil'
                    : 'Crear Rol de Usuario y Asignar Módulos'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List of Existing & Custom Roles */}
        <div className="xl:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Catálogo de Perfiles y Roles ({allRolesList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Haz clic en cualquier perfil para modificar sus módulos asignados
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {allRolesList.map((role) => {
              const assignedMods =
                role.id === 'superusuario'
                  ? SYSTEM_MODULES_REGISTRY.map((m) => m.id)
                  : rolePermissions[role.id] || [];
              const isCustom = Boolean(role.esPersonalizado);

              return (
                <div
                  key={role.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    editingRoleId === role.id
                      ? 'bg-amber-50/50 border-amber-400 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${role.badgeBg} ${role.badgeText}`}
                        >
                          {role.id === 'superusuario' && <Shield className="w-3 h-3" />}
                          {role.label}
                        </span>
                        {isCustom ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-900 border border-violet-200">
                            Rol Personalizado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                            Rol Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{role.descripcion}</p>
                    </div>

                    {role.id !== 'superusuario' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditRole(role)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar módulos asignados a este perfil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => setRoleToDelete(role)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar perfil personalizado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assigned modules preview pills */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">
                      Módulos ({assignedMods.length}):
                    </span>
                    {assignedMods.slice(0, 6).map((mId) => {
                      const modObj = SYSTEM_MODULES_REGISTRY.find((m) => m.id === mId);
                      return (
                        <span
                          key={mId}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                        >
                          {modObj?.label || mId}
                        </span>
                      );
                    })}
                    {assignedMods.length > 6 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                        +{assignedMods.length - 6} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete Custom Role Confirmation Modal */}
      {roleToDelete && (
        <div
          onClick={() => setRoleToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900">
                Eliminar Perfil Personalizado
              </h3>
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              ¿Deseas eliminar el perfil de usuario{' '}
              <strong className="text-slate-900">{roleToDelete.label}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = roleToDelete.label;
                  deleteCustomRole(roleToDelete.id);
                  setRoleToDelete(null);
                  showToast(`Perfil "${name}" eliminado correctamente.`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Eliminar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
