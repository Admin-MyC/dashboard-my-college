import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Plus,
  Users,
  GraduationCap,
  CheckCircle2,
  MapPin,
  Phone,
  UserCheck,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Campus } from '../types';

export const CampusModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    addCampus,
    updateCampus,
    deleteCampus,
    assignCampusMembers,
    teachers,
    students,
  } = useApp();

  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [responsable, setResponsable] = useState('');
  const [activo, setActivo] = useState(true);

  const [assignModalCampus, setAssignModalCampus] = useState<Campus | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const isAdminOrSuper =
    currentUser.rol === 'administrador' || currentUser.rol === 'superusuario';

  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id);
  const activeCampuses = collegeCampuses.filter((c) => c.activo);
  const hasMultipleActiveCampuses = activeCampuses.length > 1;

  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeStudents = students.filter((s) => s.colegioId === activeCollege.id);

  const handleOpenAdd = () => {
    setEditingCampus(null);
    setNombre('');
    setClave(`CMP-${Math.floor(10 + Math.random() * 89)}`);
    setDireccion(activeCollege.direccion);
    setTelefono(activeCollege.telefono);
    setResponsable(activeCollege.director);
    setActivo(true);
    setIsCampusModalOpen(true);
  };

  const handleOpenEdit = (cmp: Campus) => {
    setEditingCampus(cmp);
    setNombre(cmp.nombre);
    setClave(cmp.clave);
    setDireccion(cmp.direccion);
    setTelefono(cmp.telefono);
    setResponsable(cmp.responsable);
    setActivo(cmp.activo);
    setIsCampusModalOpen(true);
  };

  const handleSaveCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (editingCampus) {
      updateCampus(editingCampus.id, {
        nombre: nombre.trim(),
        clave: clave.trim().toUpperCase(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        responsable: responsable.trim(),
        activo,
      });
      setNoticeMsg(`Campus "${nombre}" actualizado correctamente.`);
    } else {
      const created = addCampus({
        colegioId: activeCollege.id,
        nombre: nombre.trim(),
        clave: clave.trim().toUpperCase() || `CMP-${Date.now().toString().slice(-3)}`,
        direccion: direccion.trim() || activeCollege.direccion,
        telefono: telefono.trim() || activeCollege.telefono,
        responsable: responsable.trim() || activeCollege.director,
        activo,
        esPrincipal: collegeCampuses.length === 0,
      });
      setNoticeMsg(
        `¡Campus "${created.nombre}" creado! Ahora puedes asignar qué maestros y qué alumnos pertenecen a este campus.`
      );
    }

    setIsCampusModalOpen(false);
    setTimeout(() => setNoticeMsg(null), 5000);
  };

  const handleOpenAssignModal = (cmp: Campus) => {
    setAssignModalCampus(cmp);
    setSelectedTeacherIds(
      collegeTeachers.filter((t) => t.campusId === cmp.id).map((t) => t.id)
    );
    setSelectedStudentIds(
      collegeStudents.filter((s) => s.campusId === cmp.id).map((s) => s.id)
    );
  };

  const handleSaveCampusAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalCampus) return;

    assignCampusMembers(
      assignModalCampus.id,
      activeCollege.id,
      selectedTeacherIds,
      selectedStudentIds
    );

    setNoticeMsg(
      `Se asignaron ${selectedTeacherIds.length} docentes y ${selectedStudentIds.length} alumnos al campus "${assignModalCampus.nombre}".`
    );
    setAssignModalCampus(null);
    setTimeout(() => setNoticeMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
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
              Módulo de Campus y Sedes
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                hasMultipleActiveCampuses
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-white/15 text-slate-100 border-white/20'
              }`}
            >
              {hasMultipleActiveCampuses
                ? `${activeCampuses.length} Campus Activos (Selector Habilitado en Control Escolar)`
                : 'Modo Colegio Normal (1 Sede Activa)'}
            </span>
          </div>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" style={{ color: goldColor }} />
            Configuración de Campus Institucionales
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-3xl">
            Configura uno o más campus dentro de <strong>{activeCollege.nombre}</strong>, elige qué maestros y qué alumnos van a cada campus. Si hay más de un campus activo, Control Escolar mostrará un selector para elegir qué campus administrar; si solo hay uno activo, se muestra el colegio normal.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {isAdminOrSuper ? (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Nuevo Campus</span>
          </button>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Solo el Administrador puede dar de alta nuevos campus</span>
          </div>
        )}
      </div>

      {/* Active Campus Selector Bar (When > 1 campus is active) */}
      {hasMultipleActiveCampuses ? (
        <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50/40 rounded-2xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Selector de Campus Activo para Control Escolar
              </h3>
              <p className="text-xs text-slate-600">
                Al tener {activeCampuses.length} campus activos, puedes filtrar qué campus estás administrando en Control de Alumnos, Docentes, Horarios y Ciclos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedCampusId || ''}
              onChange={(e) => setSelectedCampusId(e.target.value || null)}
              className="px-3.5 py-2 rounded-xl border-2 border-amber-400 bg-white text-xs sm:text-sm font-bold text-slate-900 cursor-pointer shadow-2xs"
            >
              <option value="">Ver Todo el Colegio ({activeCampuses.length} Campus)</option>
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>
                  Administrar: {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Actualmente hay <strong>{activeCampuses.length} campus activo</strong>. El sistema muestra la vista de colegio normal sin dividir por sedes hasta que actives un segundo campus.
          </span>
        </div>
      )}

      {noticeMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
          <button onClick={() => setNoticeMsg(null)}>
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Campuses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {collegeCampuses.map((cmp) => {
          const assignedTeachers = collegeTeachers.filter((t) => t.campusId === cmp.id);
          const assignedStudents = collegeStudents.filter((s) => s.campusId === cmp.id);
          const isCurrentlySelected = selectedCampusId === cmp.id;

          return (
            <div
              key={cmp.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between gap-4 ${
                isCurrentlySelected
                  ? 'border-2 border-amber-500 ring-2 ring-amber-500/15'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cmp.clave}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        cmp.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cmp.activo ? 'Campus Activo' : 'Inactivo'}
                    </span>
                    {isCurrentlySelected && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Administrando Ahora
                      </span>
                    )}
                  </div>

                  {isAdminOrSuper && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateCampus(cmp.id, { activo: !cmp.activo })
                        }
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        {cmp.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cmp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {collegeCampuses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteCampus(cmp.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {cmp.nombre}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cmp.direccion}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {cmp.telefono}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Resp: {cmp.responsable}
                    </span>
                  </div>
                </div>

                {/* Teachers and Students Summary in this Campus */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold uppercase">Maestros Asignados</span>
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="font-display font-bold text-xl text-slate-900">
                      {assignedTeachers.length}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {assignedTeachers.map((t) => t.nombre).join(', ') || 'Sin docentes asignados'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold uppercase">Alumnos en Campus</span>
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-display font-bold text-xl text-slate-900">
                      {assignedStudents.length}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {assignedStudents.map((s) => `${s.nombre} ${s.apellidos}`).join(', ') ||
                        'Sin alumnos asignados'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(cmp)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs text-white shadow-2xs transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Asignar Maestros y Alumnos al Campus
                </button>

                {hasMultipleActiveCampuses && cmp.activo && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCampusId(isCurrentlySelected ? null : cmp.id)
                    }
                    className={`px-3 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                      isCurrentlySelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isCurrentlySelected
                      ? 'Administrando este Campus ✓'
                      : 'Elegir en Control Escolar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Campus */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {editingCampus ? 'Editar Campus' : 'Registrar Nuevo Campus'}
                </h3>
              </div>
              <button onClick={() => setIsCampusModalOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nombre del Campus / Plantel *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Campus Norte - Satélite"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clave Interna</label>
                  <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="CMP-NORTE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dirección del Campus
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Director / Coordinador de Campus
                </label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Campus Activo (Si hay más de 1 campus activo se habilita el selector en Control Escolar)
                </span>
              </label>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Teachers & Students to Campus */}
      {assignModalCampus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Asignación de Plantilla y Matrícula por Sede
                </span>
                <h3 className="font-bold text-sm sm:text-base">
                  Maestros y Alumnos en {assignModalCampus.nombre}
                </h3>
              </div>
              <button onClick={() => setAssignModalCampus(null)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCampusAssignments} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Col 1: Teachers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Maestros Asignados ({selectedTeacherIds.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTeacherIds(
                          selectedTeacherIds.length === collegeTeachers.length
                            ? []
                            : collegeTeachers.map((t) => t.id)
                        )
                      }
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      {selectedTeacherIds.length === collegeTeachers.length
                        ? 'Desmarcar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {collegeTeachers.map((tch) => {
                      const checked = selectedTeacherIds.includes(tch.id);
                      const currentCmp = collegeCampuses.find((c) => c.id === tch.campusId);
                      return (
                        <label
                          key={tch.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedTeacherIds((prev) =>
                                  prev.includes(tch.id)
                                    ? prev.filter((id) => id !== tch.id)
                                    : [...prev, tch.id]
                                )
                              }
                              className="w-4 h-4 rounded text-blue-600"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{tch.nombre}</div>
                              <div className="text-[11px] text-slate-500">{tch.especialidad}</div>
                            </div>
                          </div>
                          {currentCmp && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {currentCmp.clave}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Col 2: Students */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Alumnos Asignados ({selectedStudentIds.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudentIds(
                          selectedStudentIds.length === collegeStudents.length
                            ? []
                            : collegeStudents.map((s) => s.id)
                        )
                      }
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      {selectedStudentIds.length === collegeStudents.length
                        ? 'Desmarcar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {collegeStudents.map((st) => {
                      const checked = selectedStudentIds.includes(st.id);
                      const currentCmp = collegeCampuses.find((c) => c.id === st.campusId);
                      return (
                        <label
                          key={st.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedStudentIds((prev) =>
                                  prev.includes(st.id)
                                    ? prev.filter((id) => id !== st.id)
                                    : [...prev, st.id]
                                )
                              }
                              className="w-4 h-4 rounded text-emerald-600"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {st.nombre} {st.apellidos}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {st.grado} "{st.grupo}" · {st.matricula}
                              </div>
                            </div>
                          </div>
                          {currentCmp && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {currentCmp.clave}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalCampus(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Asignación de Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
