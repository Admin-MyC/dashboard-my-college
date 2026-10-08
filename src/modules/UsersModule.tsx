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
} from 'lucide-react';
import { ROLES_CONFIG, User, UserRole } from '../types';
import {
  generateTutorUsername,
  generateRandomPassword,
  ensureUserCredentials,
} from '../utils/preenrollmentHelper';

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
    allRolesConfig,
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletedBanner, setDeletedBanner] = useState<string | null>(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<User | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [copiedModalCreds, setCopiedModalCreds] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRandom4Digits, setFormRandom4Digits] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );
  const [formPass, setFormPass] = useState(() => generateRandomPassword());
  const [formRole, setFormRole] = useState<UserRole>('docente');
  const [formCollegeId, setFormCollegeId] = useState<string>(
    collegeIdFilter || colleges[0]?.id || ''
  );
  const [formCargo, setFormCargo] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Auto-preview username when name changes using the FIXED 4 random digits generated once
  const previewUsername = useMemo(() => {
    if (!formName.trim()) return '';
    return generateTutorUsername(formName, formRandom4Digits);
  }, [formName, formRandom4Digits]);

  const filteredUsers = users.filter((u) => {
    // En el módulo Usuarios del Colegio solo deben aparecer los demás roles menos alumnos y tutores
    if (!isGlobalDashboard && (u.rol === 'alumno' || u.rol === 'tutor')) {
      return false;
    }

    const resolvedUsername = u.usuarioLogin || ensureUserCredentials(u).usuarioLogin;
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resolvedUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRandom4Digits(String(Math.floor(1000 + Math.random() * 9000)));
    setFormPass(generateRandomPassword());
    setFormRole(isGlobalDashboard ? 'superusuario' : 'docente');
    if (currentCollege) setFormCollegeId(currentCollege.id);
    setFormCargo('');
    setFormPhone('');
    setIsAddModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nombre y correo son obligatorios.');
      return;
    }

    // If Superusuario, colegioId is null. Otherwise, it must be assigned to the chosen college!
    const effectiveRole = !isGlobalDashboard && formRole === "superusuario" ? "administrador" : formRole;
    const targetCollegeId = effectiveRole === "superusuario" ? null : (currentCollege ? currentCollege.id : formCollegeId);

    const finalUsername = generateTutorUsername(formName, formRandom4Digits);
    const finalPassword =
      formPass && formPass.trim().length === 8
        ? formPass.trim()
        : generateRandomPassword();

    const created = addUser({
      nombre: formName.trim(),
      correo: formEmail.trim(),
      usuarioLogin: finalUsername,
      password: finalPassword,
      rol: effectiveRole,
      colegioId: targetCollegeId,
      cargo:
        formCargo.trim() ||
        (effectiveRole === "superusuario"
          ? 'Superadministrador de Plataforma'
          : `${ROLES_CONFIG[formRole]?.label || formRole} Institucional`),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
      telefono: formPhone.trim(),
      activo: true,
      ultimoAcceso: 'Nunca',
    });

    // Reset Form
    setFormName('');
    setFormEmail('');
    setFormRandom4Digits(String(Math.floor(1000 + Math.random() * 9000)));
    setFormPass(generateRandomPassword());
    setFormCargo('');
    setFormPhone('');
    setIsAddModalOpen(false);
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
              ? "Administra superusuarios globales y el personal institucional asignado a cada colegio."
              : `Directorio de personal institucional (Administrador, Directivo, Coordinador, Docentes y Personal) de este plantel.`}
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
            placeholder="Buscar por nombre, usuario, correo o cargo..."
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
              .filter(
                (r) =>
                  (isGlobalDashboard || r.id !== 'superusuario') &&
                  (isGlobalDashboard || (r.id !== 'alumno' && r.id !== 'tutor'))
              )
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
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
                <th className="py-3 px-4">Nombre & Correo</th>
                <th className="py-3 px-4">Usuario & Contraseña</th>
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
                const resolvedUsername = u.usuarioLogin || ensureUserCredentials(u).usuarioLogin;
                const resolvedPassword = u.password || 'a4Km9xP2';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={u.nombre}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{u.nombre}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.correo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Usuario & Contraseña */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Usr:
                          </span>
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-950 border border-amber-200">
                            {resolvedUsername}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Usuario: ${resolvedUsername} | Contraseña: ${resolvedPassword}`
                              );
                              setCopiedUserId(u.id);
                              setTimeout(() => setCopiedUserId(null), 2000);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copiar usuario y contraseña"
                          >
                            {copiedUserId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Pass:
                          </span>
                          <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {resolvedPassword}
                          </span>
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
                          {assignedCollege.escudoUrl && (
                            <img
                              src={assignedCollege.escudoUrl}
                              alt=""
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
                          type="button"
                          onClick={() => setCreatedUserCredentials(u)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md cursor-pointer"
                          title="Ver Credenciales de Acceso"
                        >
                          <KeyRound className="w-4 h-4" />
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
                          title="Eliminar Usuario"
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

              {/* Automatic Username & 8-Char Random Password Preview Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Credenciales Generadas Automáticamente
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    4 dígitos fijos al generarse
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Usuario Generado (Fijo en BD)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={previewUsername}
                      placeholder="Se genera al escribir el nombre"
                      className="w-full px-2.5 py-1.5 bg-slate-100 border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-none cursor-not-allowed"
                      title="Los 4 dígitos aleatorios se generan una sola vez y quedan guardados en la base de datos"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Contraseña Aleatoria (8 dígitos)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={8}
                        value={formPass}
                        onChange={(e) => setFormPass(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFormPass(generateRandomPassword())}
                        className="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer shrink-0"
                        title="Generar nueva contraseña de 8 caracteres"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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

              {/* Role Selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Rol a Asignar *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {Object.values(allRolesConfig)
                    .filter(
                      (r) =>
                        (isGlobalDashboard || r.id !== 'superusuario') &&
                        (isGlobalDashboard || (r.id !== 'alumno' && r.id !== 'tutor'))
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {allRolesConfig[formRole]?.descripcion}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Usuario (Fijo en Base de Datos)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={editingUser.usuarioLogin || ensureUserCredentials(editingUser).usuarioLogin}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-amber-300 rounded-lg font-mono font-bold text-xs text-slate-800 cursor-not-allowed"
                    title="El usuario y sus 4 dígitos se generan una sola vez y no cambian"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contraseña (8 dígitos)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={8}
                      value={editingUser.password || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, password: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          password: generateRandomPassword(),
                        })
                      }
                      className="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer shrink-0"
                      title="Regenerar contraseña aleatoria de 8 caracteres"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
                  {Object.values(allRolesConfig)
                    .filter(
                      (r) =>
                        (isGlobalDashboard || r.id !== 'superusuario') &&
                        (isGlobalDashboard || (r.id !== 'alumno' && r.id !== 'tutor'))
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
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
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
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

      {/* ============================================================ */}
      {/* MODAL: CREDENCIALES DEL USUARIO                              */}
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
                <KeyRound className="w-5 h-5" style={{ color: goldColor }} />
                <div>
                  <h3 className="font-display font-bold text-base">
                    Credenciales Oficiales de Acceso
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Nomenclatura: 1ra letra nombre + apellido + 4 dígitos
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
                    Usuario de Acceso
                  </span>
                  <span className="font-mono font-black text-base text-[#0B2545] bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-300 inline-block mt-1">
                    {createdUserCredentials.usuarioLogin}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contraseña Aleatoria (8 dígitos alfanuméricos)
                  </span>
                  <span className="font-mono font-black text-base text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 inline-block mt-1">
                    {createdUserCredentials.password}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Correo Electrónico Registrado
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {createdUserCredentials.correo}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Usuario: ${createdUserCredentials.usuarioLogin}\nCorreo: ${createdUserCredentials.correo}\nContraseña: ${createdUserCredentials.password}`
                  );
                  setCopiedModalCreds(true);
                  setTimeout(() => setCopiedModalCreds(false), 2000);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedModalCreds ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">¡Credenciales copiadas al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar Credenciales</span>
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
                Esta acción dará de baja la cuenta y se registrará en la bitácora del sistema.
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
                  setDeletedBanner(`El usuario "${deletedName}" ha sido eliminado correctamente.`);
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
