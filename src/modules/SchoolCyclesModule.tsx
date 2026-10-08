import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Plus,
  CheckCircle2,
  GraduationCap,
  Users,
  BookOpen,
  Lock,
  Unlock,
  Check,
  X,
  Trash2,
  Edit2,
  AlertCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { Student } from '../types';

export const SchoolCyclesModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    schoolCycles,
    addSchoolCycle,
    updateSchoolCycle,
    deleteSchoolCycle,
    students,
    teachers,
    subjects,
    updateStudent,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
  } = useApp();

  // Create/Edit Cycle Form State (Administrador / Superusuario)
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [cycleNombre, setCycleNombre] = useState('Ciclo Escolar 2026-2027');
  const [cycleInicio, setCycleInicio] = useState('2026-08-24');
  const [cycleFin, setCycleFin] = useState('2027-07-16');
  const [cycleNotas, setCycleNotas] = useState('');
  const [cycleActivo, setCycleActivo] = useState(true);

  // Assignment State for Control Escolar
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState('todos');
  const [assignModalStudent, setAssignModalStudent] = useState<Student | null>(null);
  const [assignGrado, setAssignGrado] = useState('3°');
  const [assignGrupo, setAssignGrupo] = useState('A');
  const [assignDocenteId, setAssignDocenteId] = useState('');
  const [assignMateriasIds, setAssignMateriasIds] = useState<string[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Bulk assignment state
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkGrado, setBulkGrado] = useState('3°');
  const [bulkGrupo, setBulkGrupo] = useState('A');
  const [bulkDocenteId, setBulkDocenteId] = useState('');
  const [bulkMateriasIds, setBulkMateriasIds] = useState<string[]>([]);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const isAdminOrSuper =
    currentUser.rol === 'administrador' || currentUser.rol === 'superusuario';

  // Campuses for this college
  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;

  // Cycles for this college
  const collegeCycles = schoolCycles.filter((c) => c.colegioId === activeCollege.id);
  const activeCycle =
    collegeCycles.find((c) => c.id === selectedCycleId) ||
    collegeCycles.find((c) => c.activo) ||
    collegeCycles[0] ||
    null;

  // Students, Teachers, Subjects scoped to college (and active campus if > 1 campus)
  const collegeStudentsAll = students.filter((s) => s.colegioId === activeCollege.id);
  const collegeStudents =
    hasMultipleCampuses && selectedCampusId
      ? collegeStudentsAll.filter((s) => s.campusId === selectedCampusId)
      : collegeStudentsAll;

  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;

  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);

  const filteredStudents = collegeStudents.filter(
    (s) => gradeFilter === 'todos' || s.grado === gradeFilter
  );

  const handleOpenNewCycle = () => {
    setEditingCycleId(null);
    setCycleNombre(`Ciclo Escolar ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setCycleInicio('2026-08-24');
    setCycleFin('2027-07-16');
    setCycleNotas('Calendario oficial con fechas de inicio y fin de clases.');
    setCycleActivo(true);
    setIsCycleModalOpen(true);
  };

  const handleOpenEditCycle = (c: typeof collegeCycles[0]) => {
    setEditingCycleId(c.id);
    setCycleNombre(c.nombre);
    setCycleInicio(c.fechaInicioClases);
    setCycleFin(c.fechaFinClases);
    setCycleNotas(c.notas || '');
    setCycleActivo(c.activo);
    setIsCycleModalOpen(true);
  };

  const handleSaveCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleNombre.trim() || !cycleInicio || !cycleFin) return;

    if (editingCycleId) {
      updateSchoolCycle(editingCycleId, {
        nombre: cycleNombre.trim(),
        fechaInicioClases: cycleInicio,
        fechaFinClases: cycleFin,
        notas: cycleNotas.trim(),
        activo: cycleActivo,
      });
      setSavedNotice(`Se actualizaron las fechas del ${cycleNombre}.`);
    } else {
      const created = addSchoolCycle({
        colegioId: activeCollege.id,
        nombre: cycleNombre.trim(),
        fechaInicioClases: cycleInicio,
        fechaFinClases: cycleFin,
        activo: cycleActivo,
        creadoPor: `${currentUser.nombre} (${currentUser.rol})`,
        notas: cycleNotas.trim(),
      });
      setSelectedCycleId(created.id);
      setSavedNotice(
        `¡${created.nombre} creado con éxito! Inicio: ${created.fechaInicioClases} · Fin: ${created.fechaFinClases}. Ya puedes asignar alumnos a grupos, docentes y materias.`
      );
    }

    setIsCycleModalOpen(false);
    setTimeout(() => setSavedNotice(null), 5000);
  };

  const handleOpenStudentAssignment = (st: Student) => {
    setAssignModalStudent(st);
    setAssignGrado(st.grado || '3°');
    setAssignGrupo(st.grupo || 'A');
    setAssignDocenteId(st.docenteId || collegeTeachers[0]?.id || '');
    setAssignMateriasIds(
      st.materiasIds && st.materiasIds.length > 0
        ? st.materiasIds
        : collegeSubjects.map((sub) => sub.id)
    );
  };

  const handleToggleSubjectId = (id: string, isBulk = false) => {
    if (isBulk) {
      setBulkMateriasIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setAssignMateriasIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleSaveStudentAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalStudent || !activeCycle) return;

    const chosenTeacher = collegeTeachers.find((t) => t.id === assignDocenteId);
    updateStudent(assignModalStudent.id, {
      cicloId: activeCycle.id,
      grado: assignGrado,
      grupo: assignGrupo,
      docenteId: chosenTeacher?.id,
      docenteNombre: chosenTeacher?.nombre || 'Por asignar',
      materiasIds: assignMateriasIds,
      estatus: assignModalStudent.estatus === 'pendiente' ? 'activo' : assignModalStudent.estatus,
    });

    setSavedNotice(
      `Asignación guardada para ${assignModalStudent.nombre} ${assignModalStudent.apellidos} en ${activeCycle.nombre}: Grupo ${assignGrado} "${assignGrupo}", Docente ${chosenTeacher?.nombre || ''} y ${assignMateriasIds.length} materias.`
    );
    setAssignModalStudent(null);
    setTimeout(() => setSavedNotice(null), 5000);
  };

  const handleSaveBulkAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;
    const chosenTeacher = collegeTeachers.find((t) => t.id === bulkDocenteId);
    const matchingStudents = collegeStudents.filter((s) => s.grado === bulkGrado);

    matchingStudents.forEach((st) => {
      updateStudent(st.id, {
        cicloId: activeCycle.id,
        grado: bulkGrado,
        grupo: bulkGrupo,
        docenteId: chosenTeacher?.id || st.docenteId,
        docenteNombre: chosenTeacher?.nombre || st.docenteNombre,
        materiasIds: bulkMateriasIds.length > 0 ? bulkMateriasIds : st.materiasIds,
      });
    });

    setSavedNotice(
      `Se asignaron ${matchingStudents.length} alumnos de ${bulkGrado} al Grupo "${bulkGrupo}", Docente ${chosenTeacher?.nombre || 'Titular'} y ${bulkMateriasIds.length} materias en el ${activeCycle.nombre}.`
    );
    setIsBulkAssignOpen(false);
    setTimeout(() => setSavedNotice(null), 5000);
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
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Control Escolar y Administración
            </span>
            {activeCycle && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ciclo Vigente Activo</span>
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: goldColor }} />
            Ciclos Escolares y Asignación Académica
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-3xl">
            El <strong>Administrador</strong> crea el ciclo escolar definiendo el <strong>Inicio de Clases</strong> y <strong>Fin de Clases</strong>. Una vez creado el ciclo, los usuarios de <strong>Control Escolar</strong> pueden asignar a los alumnos su grupo, docente titular y materias del ciclo.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {hasMultipleCampuses && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Building2 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none">
                Campus en Control Escolar
              </span>
              <select
                value={selectedCampusId || ''}
                onChange={(e) => setSelectedCampusId(e.target.value || null)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Todos los Campus ({collegeCampuses.length})</option>
                {collegeCampuses.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isAdminOrSuper ? (
          <button
            type="button"
            onClick={handleOpenNewCycle}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Nuevo Ciclo Escolar</span>
          </button>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Creación de ciclo exclusiva para Administrador</span>
          </div>
        )}
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
          <button onClick={() => setSavedNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* List of School Cycles with Start & End of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collegeCycles.map((cycle) => {
          const isSelected = activeCycle?.id === cycle.id;
          return (
            <div
              key={cycle.id}
              onClick={() => setSelectedCycleId(cycle.id)}
              className={`rounded-2xl p-5 border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-white border-2 shadow-md'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
              style={isSelected ? { borderColor: primaryColor } : {}}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      cycle.activo
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cycle.activo ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {cycle.activo ? 'Ciclo Activo' : 'Ciclo Histórico'}
                  </span>
                  <h3 className="font-display font-bold text-base text-slate-900 mt-1">
                    {cycle.nombre}
                  </h3>
                </div>

                {isAdminOrSuper && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCycle(cycle)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                      title="Editar fechas del ciclo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {collegeCycles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSchoolCycle(cycle.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar ciclo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Inicio de Clases
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {cycle.fechaInicioClases}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Fin de Clases
                  </span>
                  <span className="font-mono font-bold text-rose-700">
                    {cycle.fechaFinClases}
                  </span>
                </div>
              </div>

              {cycle.notas && (
                <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">{cycle.notas}</p>
              )}

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Creado por: {cycle.creadoPor}</span>
                {isSelected && (
                  <span className="font-bold" style={{ color: primaryColor }}>
                    Seleccionado ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 2: Control Escolar Assignment Panel (Only enabled when a School Cycle exists) */}
      {activeCycle ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Módulo de Control Escolar · {activeCycle.nombre}
                </span>
                <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                  Clases: {activeCycle.fechaInicioClases} → {activeCycle.fechaFinClases}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 mt-0.5">
                Asignación de Alumnos a Grupos, Docentes y Materias
              </h3>
              <p className="text-xs text-slate-500">
                Asigna individualmente o por bloque el grupo escolar, profesor titular y tira de materias a cada estudiante para este ciclo escolar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="todos">Todos los Grados ({collegeStudents.length})</option>
                {Array.from(new Set(collegeStudents.map((s) => s.grado))).map((g) => (
                  <option key={g} value={g}>
                    Grado {g}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setBulkDocenteId(collegeTeachers[0]?.id || '');
                  setBulkMateriasIds(collegeSubjects.map((s) => s.id));
                  setIsBulkAssignOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Asignación Masiva por Grado</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <th className="py-3 px-4">Alumno / Matrícula</th>
                  <th className="py-3 px-4">Ciclo Asignado</th>
                  <th className="py-3 px-4">Grado y Grupo</th>
                  <th className="py-3 px-4">Docente Titular Asignado</th>
                  <th className="py-3 px-4">Materias Cargadas</th>
                  <th className="py-3 px-4 text-right">Control Escolar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const assignedTeacher =
                    collegeTeachers.find((t) => t.id === st.docenteId) ||
                    collegeTeachers.find((t) => t.nombre === st.docenteNombre);
                  const assignedSubjectsCount = st.materiasIds
                    ? st.materiasIds.length
                    : collegeSubjects.length;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/90">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={st.foto || activeCollege.escudoUrl}
                            onError={(e) => {
                              e.currentTarget.src = activeCollege.escudoUrl;
                            }}
                            alt={st.nombre}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {st.nombre} {st.apellidos}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {st.matricula}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {activeCycle.nombre}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800">
                          {st.grado} Grupo "{st.grupo}"
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {assignedTeacher?.nombre || st.docenteNombre || 'Sin Docente Asignado'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {assignedTeacher?.especialidad || 'Docente de grupo'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-[11px]">
                          <BookOpen className="w-3.5 h-3.5" />
                          {assignedSubjectsCount} materias asignadas
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentAssignment(st)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-2xs transition-all cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Asignar Grupo, Docente y Materias
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-display font-bold text-base text-amber-950">
            No hay un Ciclo Escolar creado para este colegio
          </h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            El Administrador debe crear primero el Ciclo Escolar con las fechas de inicio y fin de clases para habilitar la asignación de grupos, docentes y materias por parte de Control Escolar.
          </p>
        </div>
      )}

      {/* Modal: Create / Edit School Cycle */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {editingCycleId ? 'Editar Ciclo Escolar' : 'Crear Nuevo Ciclo Escolar'}
                </h3>
              </div>
              <button onClick={() => setIsCycleModalOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCycle} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nombre del Ciclo Escolar *
                </label>
                <input
                  type="text"
                  required
                  value={cycleNombre}
                  onChange={(e) => setCycleNombre(e.target.value)}
                  placeholder="Ej. Ciclo Escolar 2026-2027"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Inicio de Clases *
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleInicio}
                    onChange={(e) => setCycleInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Fin de Clases *
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleFin}
                    onChange={(e) => setCycleFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Observaciones o Lineamientos del Ciclo
                </label>
                <textarea
                  rows={2}
                  value={cycleNotas}
                  onChange={(e) => setCycleNotas(e.target.value)}
                  placeholder="Notas oficiales del calendario escolar..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cycleActivo}
                  onChange={(e) => setCycleActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Establecer como Ciclo Escolar Activo vigente para Control Escolar
                </span>
              </label>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Ciclo Escolar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Individual Student to Group, Teacher & Subjects */}
      {assignModalStudent && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  {activeCycle.nombre} ({activeCycle.fechaInicioClases} a {activeCycle.fechaFinClases})
                </span>
                <h3 className="font-bold text-sm sm:text-base">
                  Asignar Grupo, Docente y Materias
                </h3>
              </div>
              <button onClick={() => setAssignModalStudent(null)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentAssignment} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={assignModalStudent.foto || activeCollege.escudoUrl}
                  alt={assignModalStudent.nombre}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    {assignModalStudent.nombre} {assignModalStudent.apellidos}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Matrícula: {assignModalStudent.matricula} · CURP: {assignModalStudent.curp}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grado Escolar</label>
                  <select
                    value={assignGrado}
                    onChange={(e) => setAssignGrado(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="1°">1°</option>
                    <option value="2°">2°</option>
                    <option value="3°">3°</option>
                    <option value="4°">4°</option>
                    <option value="5°">5°</option>
                    <option value="6°">6°</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grupo Oficial</label>
                  <select
                    value={assignGrupo}
                    onChange={(e) => setAssignGrupo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="A">Grupo "A"</option>
                    <option value="B">Grupo "B"</option>
                    <option value="C">Grupo "C"</option>
                    <option value="D">Grupo "D"</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Docente Titular Asignado
                </label>
                <select
                  value={assignDocenteId}
                  onChange={(e) => setAssignDocenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  {collegeTeachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.nombre} ({tch.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Materias Asignadas en el Ciclo ({assignMateriasIds.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAssignMateriasIds(
                        assignMateriasIds.length === collegeSubjects.length
                          ? []
                          : collegeSubjects.map((s) => s.id)
                      )
                    }
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {assignMateriasIds.length === collegeSubjects.length
                      ? 'Desmarcar todas'
                      : 'Seleccionar todas'}
                  </button>
                </div>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {collegeSubjects.map((sub) => {
                    const checked = assignMateriasIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleSubjectId(sub.id, false)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">{sub.nombre}</div>
                            <div className="text-[10px] text-slate-400">
                              {sub.clave} · Prof: {sub.docenteNombre || 'Titular'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {sub.horasSemanales}h/sem
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Asignación del Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Assignment by Grade */}
      {isBulkAssignOpen && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-200 block">
                  Control Escolar · {activeCycle.nombre}
                </span>
                <h3 className="font-bold text-sm sm:text-base">
                  Asignación Masiva por Grado Escolar
                </h3>
              </div>
              <button onClick={() => setIsBulkAssignOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkAssignment} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Grado de los Alumnos
                  </label>
                  <select
                    value={bulkGrado}
                    onChange={(e) => setBulkGrado(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="1°">1°</option>
                    <option value="2°">2°</option>
                    <option value="3°">3°</option>
                    <option value="4°">4°</option>
                    <option value="5°">5°</option>
                    <option value="6°">6°</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Asignar al Grupo
                  </label>
                  <select
                    value={bulkGrupo}
                    onChange={(e) => setBulkGrupo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="A">Grupo "A"</option>
                    <option value="B">Grupo "B"</option>
                    <option value="C">Grupo "C"</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Docente Titular para el Grupo
                </label>
                <select
                  value={bulkDocenteId}
                  onChange={(e) => setBulkDocenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  {collegeTeachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.nombre} ({tch.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Materias a Cargar ({bulkMateriasIds.length})
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {collegeSubjects.map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={bulkMateriasIds.includes(sub.id)}
                        onChange={() => handleToggleSubjectId(sub.id, true)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span className="font-semibold text-xs text-slate-800">
                        {sub.nombre} ({sub.clave})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAssignOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  Aplicar a Alumnos de {bulkGrado}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
