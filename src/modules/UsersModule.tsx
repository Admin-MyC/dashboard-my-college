import React, { useState } from 'react';
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
} from 'lucide-react';
import { ROLES_CONFIG, User, UserRole } from '../types';

interface Props {
  collegeIdFilter?: string | null;
}

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
  } = useApp();

  const isGlobalDashboard = selectedCollegeId === null && !collegeIdFilter;
  const currentCollege = activeCollege || (collegeIdFilter ? colleges.find((c) => c.id === collegeIdFilter) : null);
  const primaryColor = currentCollege ? currentCollege.colores.primario : "#0B2545";
  const goldColor = currentCollege ? currentCollege.colores.secundario : "#DFB743";

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>(
    collegeIdFilter || 'todos'
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPass, setFormPass] = useState('admin123');
  const [formRole, setFormRole] = useState<UserRole>('docente');
  const [formCollegeId, setFormCollegeId] = useState<string>(
    collegeIdFilter || colleges[0]?.id || ''
  );
  const [formCargo, setFormCargo] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'todos' || u.rol === selectedRoleFilter;
    const matchesCollege =
      selectedCollegeFilter === 'todos'
        ? true
        : selectedCollegeFilter === 'global'
        ? u.colegioId === null
        : u.colegioId === selectedCollegeFilter;

    return matchesSearch && matchesRole && matchesCollege;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nombre y correo son obligatorios.');
      return;
    }

    // If Superusuario, colegioId is null. Otherwise, it must be assigned to the chosen college!
    const effectiveRole = !isGlobalDashboard && formRole === "superusuario" ? "administrador" : formRole;
    const targetCollegeId = effectiveRole === "superusuario" ? null : (currentCollege ? currentCollege.id : formCollegeId);

    addUser({
      nombre: formName,
      correo: formEmail,
      password: formPass || 'admin123',
      rol: effectiveRole,
      colegioId: targetCollegeId,
      cargo:
        formCargo ||
        (effectiveRole === "superusuario"
          ? 'Superadministrador de Plataforma'
          : `${ROLES_CONFIG[formRole].label} Institucional`),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
      telefono: formPhone,
      activo: true,
      ultimoAcceso: 'Nunca',
    });

    // Reset Form
    setFormName('');
    setFormEmail('');
    setFormPass('admin123');
    setFormCargo('');
    setFormPhone('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: primaryColor }} />
            {isGlobalDashboard ? "Gestión Integral de Usuarios y Roles" : `Personal Institucional de ${currentCollege?.nombre}`}
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {isGlobalDashboard
              ? "Administra superusuarios globales y el personal institucional asignado a cada colegio."
              : `Directorio de personal institucional (Administrador, Directivo, Coordinador, Docentes y Personal) de este plantel.`}
          </p>
        </div>

        <button
          onClick={() => {
            setFormRole(isGlobalDashboard ? "superusuario" : "docente");
            if (currentCollege) setFormCollegeId(currentCollege.id);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 self-start sm:self-auto cursor-pointer"
          style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nuevo Usuario</span>
        </button>
      </div>

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
            {isGlobalDashboard && (
              <option value="superusuario">Superusuario (Global)</option>
            )}
            <option value="administrador">Administrador de Plantel</option>
            <option value="directivo">Directivo</option>
            <option value="coordinador">Coordinador</option>
            <option value="supervisor">Supervisor</option>
            <option value="prefecto">Prefecto</option>
            <option value="psicologo">Psicólogo</option>
            <option value="docente">Docente</option>
          </select>

          {/* College Filter */}
          {!collegeIdFilter && (
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none max-w-[220px]"
            >
              <option value="todos">Todas las Instituciones</option>
              <option value="global">Superusuarios Globales (Sin colegio)</option>
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
                <th className="py-3 px-4">Usuario & Perfil</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Colegio Asignado</th>
                <th className="py-3 px-4">Cargo / Función</th>
                <th className="py-3 px-4">Estatus</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const roleConfig = ROLES_CONFIG[u.rol] || ROLES_CONFIG.docente;
                const assignedCollege = colleges.find((c) => c.id === u.colegioId);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.nombre}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{u.nombre}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.correo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeBg} ${roleConfig.badgeText}`}
                      >
                        {u.rol === 'superusuario' && <Shield className="w-3 h-3" />}
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* Assigned College (Crucial feature from prompt) */}
                    <td className="py-3 px-4">
                      {u.rol === 'superusuario' ? (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Acceso Global Maestro
                        </span>
                      ) : assignedCollege ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={assignedCollege.escudoUrl}
                            alt=""
                            className="w-6 h-6 object-contain rounded bg-white border p-0.5"
                          />
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
                      <div>{u.cargo}</div>
                      {u.telefono && (
                        <div className="text-[11px] text-slate-400">{u.telefono}</div>
                      )}
                    </td>

                    {/* Estatus */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => updateUser(u.id, { activo: !u.activo })}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                          u.activo
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                        }`}
                      >
                        {u.activo ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="Editar Usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al usuario ${u.nombre}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Registrar Nuevo Usuario en My College
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs md:text-sm">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lic. Claudia Romero Ortiz"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@colegio.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contraseña Inicial
                  </label>
                  <input
                    type="text"
                    value={formPass}
                    onChange={(e) => setFormPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Role Selection (Superusuario, Administrador, Directivo, Coordinador, Supervisor, Prefecto, Psicólogo, Docente) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Rol a Asignar *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {isGlobalDashboard && (
                    <option value="superusuario">Superusuario (Acceso Global al Panel)</option>
                  )}
                  <option value="administrador">Administrador de Plantel</option>
                  <option value="directivo">Directivo</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="prefecto">Prefecto</option>
                  <option value="psicologo">Psicólogo</option>
                  <option value="docente">Docente</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {ROLES_CONFIG[formRole]?.descripcion}
                </span>
              </div>

              {/* College Assignment (Requested specifically in prompt) */}
              {formRole !== 'superusuario' && (
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                  <label className="font-bold text-blue-900 block mb-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    Asignar al Colegio que Pertenece *
                  </label>
                  <select
                    value={formCollegeId}
                    onChange={(e) => setFormCollegeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigoCCT})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-blue-800/80 mt-1 block">
                    El usuario podrá ingresar y administrar únicamente los módulos de este colegio.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cargo / Puesto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Profesor Titular"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+52 55 ..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Crear y Asignar Usuario
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-900">
                Editar Usuario: {editingUser.nombre}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correo</label>
                <input
                  type="email"
                  value={editingUser.correo}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, correo: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rol</label>
                <select
                  value={editingUser.rol}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, rol: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 border rounded-lg font-medium mb-3"
                >
                  {isGlobalDashboard && (
                    <option value="superusuario">Superusuario (Global)</option>
                  )}
                  <option value="administrador">Administrador de Plantel</option>
                  <option value="directivo">Directivo</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="prefecto">Prefecto</option>
                  <option value="psicologo">Psicólogo</option>
                  <option value="docente">Docente</option>
                </select>

                <label className="font-semibold text-slate-700 block mb-1">Cargo</label>
                <input
                  type="text"
                  value={editingUser.cargo}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, cargo: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {editingUser.rol !== 'superusuario' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Colegio Asignado
                  </label>
                  <select
                    value={editingUser.colegioId || ''}
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
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateUser(editingUser.id, editingUser);
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
    </div>
  );
};
