import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Calendar,
  Copy,
  Repeat,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Users,
  BookOpen,
  Building2,
  Sparkles,
  Printer,
} from 'lucide-react';
import { DayOfWeek, ScheduleCell } from '../types';

const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TIME_SLOTS = [
  '08:00 - 08:50',
  '08:50 - 09:40',
  '09:40 - 10:30',
  '10:30 - 11:00 (Receso)',
  '11:00 - 11:50',
  '11:50 - 12:40',
  '12:40 - 13:30',
  '13:30 - 14:20',
];

const AVAILABLE_WEEKS = [
  { inicio: '2026-09-28', etiqueta: 'Semana 1 (28 Sep - 02 Oct 2026)' },
  { inicio: '2026-10-05', etiqueta: 'Semana 2 (05 Oct - 09 Oct 2026)' },
  { inicio: '2026-10-12', etiqueta: 'Semana 3 (12 Oct - 16 Oct 2026)' },
  { inicio: '2026-10-19', etiqueta: 'Semana 4 (19 Oct - 23 Oct 2026)' },
  { inicio: '2026-10-26', etiqueta: 'Semana 5 (26 Oct - 30 Oct 2026)' },
  { inicio: '2026-11-02', etiqueta: 'Semana 6 (02 Nov - 06 Nov 2026)' },
];

export const SchedulesModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    groupSchedules,
    saveGroupSchedule,
    subjects,
    teachers,
    students,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    schoolCycles,
  } = useApp();

  const [selectedGrado, setSelectedGrado] = useState('3°');
  const [selectedGrupo, setSelectedGrupo] = useState('A');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(1); // Default to Semana 2 (05 Oct)
  const [editingCellKey, setEditingCellKey] = useState<{
    day: DayOfWeek;
    slot: string;
  } | null>(null);
  const [cellMateriaId, setCellMateriaId] = useState('');
  const [cellDocenteId, setCellDocenteId] = useState('');
  const [cellAula, setCellAula] = useState('Aula 301');
  const [actionToast, setActionToast] = useState<string | null>(null);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const canEditSchedules = [
    'superusuario',
    'administrador',
    'directivo',
    'coordinador',
    'supervisor',
    'prefecto',
  ].includes(currentUser.rol);

  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;
  const activeCycle = schoolCycles.find((c) => c.colegioId === activeCollege.id && c.activo);

  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;

  const groupStudentsCount = students.filter(
    (s) =>
      s.colegioId === activeCollege.id &&
      s.grado === selectedGrado &&
      s.grupo === selectedGrupo &&
      (!hasMultipleCampuses || !selectedCampusId || s.campusId === selectedCampusId)
  ).length;

  const currentWeekMeta = AVAILABLE_WEEKS[selectedWeekIndex] || AVAILABLE_WEEKS[0];

  // Find current schedule for this grade + group + week
  const currentSchedule = groupSchedules.find(
    (s) =>
      s.colegioId === activeCollege.id &&
      s.grado === selectedGrado &&
      s.grupo === selectedGrupo &&
      s.semanaInicio === currentWeekMeta.inicio
  );

  const currentBlocks: Record<string, ScheduleCell> = currentSchedule?.bloques || {};

  // Helper to show temporary confirmation message
  const showConfirmation = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4500);
  };

  // Copy schedule from previous week (Semana Anterior: index - 1)
  const handleCopyFromPreviousWeek = () => {
    if (selectedWeekIndex <= 0) {
      showConfirmation('Ya estás en la primera semana registrada. Selecciona la Semana 2 o posterior para copiar la semana anterior.');
      return;
    }
    const prevWeekMeta = AVAILABLE_WEEKS[selectedWeekIndex - 1];
    const prevSchedule = groupSchedules.find(
      (s) =>
        s.colegioId === activeCollege.id &&
        s.grado === selectedGrado &&
        s.grupo === selectedGrupo &&
        s.semanaInicio === prevWeekMeta.inicio
    );

    if (!prevSchedule || Object.keys(prevSchedule.bloques).length === 0) {
      // If previous week has no saved schedule, fallback to any existing schedule for this group
      const anySchedule = groupSchedules.find(
        (s) =>
          s.colegioId === activeCollege.id &&
          s.grado === selectedGrado &&
          s.grupo === selectedGrupo &&
          Object.keys(s.bloques).length > 0
      );
      if (!anySchedule) {
        showConfirmation(`No se encontró un horario previo cargado en ${prevWeekMeta.etiqueta} para copiar.`);
        return;
      }
      saveGroupSchedule({
        colegioId: activeCollege.id,
        campusId: selectedCampusId || undefined,
        cicloId: activeCycle?.id,
        grado: selectedGrado,
        grupo: selectedGrupo,
        semanaInicio: currentWeekMeta.inicio,
        semanaEtiqueta: currentWeekMeta.etiqueta,
        patronRepeticion: 'semanal',
        bloques: { ...anySchedule.bloques },
      });
      showConfirmation(
        `¡Horario copiado exitosamente desde "${anySchedule.semanaEtiqueta}" hacia "${currentWeekMeta.etiqueta}" para el grupo ${selectedGrado} "${selectedGrupo}"!`
      );
      return;
    }

    saveGroupSchedule({
      colegioId: activeCollege.id,
      campusId: selectedCampusId || undefined,
      cicloId: activeCycle?.id,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      patronRepeticion: 'semanal',
      bloques: { ...prevSchedule.bloques },
    });

    showConfirmation(
      `¡Se copió el horario de la semana anterior (${prevWeekMeta.etiqueta}) a ${currentWeekMeta.etiqueta} para el grupo ${selectedGrado} "${selectedGrupo}"!`
    );
  };

  // Copy or repeat schedule every two weeks (Cada Dos Semanas / Quincenal: index - 2 or replicate forward every 2 weeks)
  const handleCopyEveryTwoWeeks = () => {
    // Check if there is a schedule 2 weeks prior (biweekly pattern)
    const twoWeeksAgoMeta = selectedWeekIndex >= 2 ? AVAILABLE_WEEKS[selectedWeekIndex - 2] : null;
    const twoWeeksAgoSchedule = twoWeeksAgoMeta
      ? groupSchedules.find(
          (s) =>
            s.colegioId === activeCollege.id &&
            s.grado === selectedGrado &&
            s.grupo === selectedGrupo &&
            s.semanaInicio === twoWeeksAgoMeta.inicio
        )
      : null;

    const sourceBlocks =
      twoWeeksAgoSchedule && Object.keys(twoWeeksAgoSchedule.bloques).length > 0
        ? twoWeeksAgoSchedule.bloques
        : Object.keys(currentBlocks).length > 0
        ? currentBlocks
        : groupSchedules.find(
            (s) => s.colegioId === activeCollege.id && Object.keys(s.bloques).length > 0
          )?.bloques || {};

    if (Object.keys(sourceBlocks).length === 0) {
      showConfirmation('Primero asigna al menos una clase en el horario para replicarlo cada dos semanas.');
      return;
    }

    // Apply to current week AND replicate every 2 weeks (selectedWeekIndex, selectedWeekIndex + 2, selectedWeekIndex + 4...)
    let replicatedWeeks: string[] = [];
    for (let idx = selectedWeekIndex % 2; idx < AVAILABLE_WEEKS.length; idx += 2) {
      const targetWeek = AVAILABLE_WEEKS[idx];
      saveGroupSchedule({
        colegioId: activeCollege.id,
        campusId: selectedCampusId || undefined,
        cicloId: activeCycle?.id,
        grado: selectedGrado,
        grupo: selectedGrupo,
        semanaInicio: targetWeek.inicio,
        semanaEtiqueta: targetWeek.etiqueta,
        patronRepeticion: 'quincenal_a',
        bloques: { ...sourceBlocks },
      });
      replicatedWeeks.push(targetWeek.etiqueta.split('(')[0].trim());
    }

    showConfirmation(
      `¡Rol de horario aplicado en modalidad "Cada Dos Semanas" (${replicatedWeeks.join(', ')}) para el grupo ${selectedGrado} "${selectedGrupo}"!`
    );
  };

  const handleOpenCellModal = (day: DayOfWeek, slot: string) => {
    if (!canEditSchedules) return;
    if (slot.includes('Receso')) return;
    const key = `${day}_${slot}`;
    const existing = currentBlocks[key];
    setEditingCellKey({ day, slot });
    setCellMateriaId(existing?.materiaId || collegeSubjects[0]?.id || '');
    setCellDocenteId(existing?.docenteId || collegeTeachers[0]?.id || '');
    setCellAula(existing?.aula || `Aula ${selectedGrado.replace('°', '')}0${selectedGrupo === 'A' ? '1' : '2'}`);
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCellKey) return;

    const chosenSub = collegeSubjects.find((s) => s.id === cellMateriaId);
    const chosenTch = collegeTeachers.find((t) => t.id === cellDocenteId);
    const key = `${editingCellKey.day}_${editingCellKey.slot}`;

    const updatedBlocks: Record<string, ScheduleCell> = {
      ...currentBlocks,
      [key]: {
        materiaId: chosenSub?.id || 'sub-custom',
        materiaNombre: chosenSub?.nombre || 'Materia General',
        docenteId: chosenTch?.id || 'tch-custom',
        docenteNombre: chosenTch?.nombre || chosenSub?.docenteNombre || 'Docente Titular',
        aula: cellAula.trim() || 'Aula General',
      },
    };

    saveGroupSchedule({
      id: currentSchedule?.id,
      colegioId: activeCollege.id,
      campusId: selectedCampusId || undefined,
      cicloId: activeCycle?.id,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      patronRepeticion: currentSchedule?.patronRepeticion || 'semanal',
      bloques: updatedBlocks,
    });

    setEditingCellKey(null);
  };

  const handleRemoveCell = () => {
    if (!editingCellKey) return;
    const key = `${editingCellKey.day}_${editingCellKey.slot}`;
    const updatedBlocks = { ...currentBlocks };
    delete updatedBlocks[key];

    saveGroupSchedule({
      id: currentSchedule?.id,
      colegioId: activeCollege.id,
      campusId: selectedCampusId || undefined,
      cicloId: activeCycle?.id,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      bloques: updatedBlocks,
    });

    setEditingCellKey(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Control Escolar · Roles y Horarios
            </span>
            {activeCycle && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                {activeCycle.nombre}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
            <Clock className="w-6 h-6" style={{ color: goldColor }} />
            Módulo de Horarios y Roles por Grupo
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-3xl">
            Elabora los roles de clases de cada grupo escolar. Puedes hacer clic en cualquier bloque horario para asignar materia y docente, o bien <strong>copiar el horario de la semana anterior</strong> o aplicarlo <strong>cada dos semanas</strong>.
          </p>
        </div>
      </div>

      {/* Copy & Repeat Action Buttons (Below Header) */}
      {canEditSchedules && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCopyFromPreviousWeek}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Copiar Semana Anterior</span>
          </button>

          <button
            type="button"
            onClick={handleCopyEveryTwoWeeks}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Repeat className="w-4 h-4 stroke-[2.5]" />
            <span>Copiar / Repetir Cada 2 Semanas</span>
          </button>
        </div>
      )}

      {actionToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)}>
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Filters Bar: Campus (if >1), Grado, Grupo, Semana */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {hasMultipleCampuses && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Campus Activo
              </label>
              <select
                value={selectedCampusId || ''}
                onChange={(e) => setSelectedCampusId(e.target.value || null)}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/60 text-xs font-bold text-slate-900"
              >
                <option value="">Todos los Campus</option>
                {collegeCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Grado Escolar
            </label>
            <select
              value={selectedGrado}
              onChange={(e) => setSelectedGrado(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
            >
              <option value="1°">1° Grado</option>
              <option value="2°">2° Grado</option>
              <option value="3°">3° Grado</option>
              <option value="4°">4° Grado</option>
              <option value="5°">5° Grado</option>
              <option value="6°">6° Grado</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Grupo / Rol
            </label>
            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
            >
              <option value="A">Grupo "A"</option>
              <option value="B">Grupo "B"</option>
              <option value="C">Grupo "C"</option>
              <option value="D">Grupo "D"</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Semana del Ciclo Escolar
            </label>
            <select
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border-2 border-blue-200 bg-blue-50/40 text-xs font-bold text-slate-900"
            >
              {AVAILABLE_WEEKS.map((w, idx) => (
                <option key={w.inicio} value={idx}>
                  {w.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
            Grupo <strong>{selectedGrado} "{selectedGrupo}"</strong> · {groupStudentsCount} alumnos inscritos
          </span>
          {currentSchedule?.patronRepeticion === 'quincenal_a' && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
              Rol Quincenal (Cada 2 Semanas)
            </span>
          )}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[780px]">
            <thead>
              <tr
                className="text-white text-left"
                style={{ backgroundColor: primaryColor }}
              >
                <th className="py-3.5 px-4 w-36 font-bold uppercase tracking-wider text-[11px] border-r border-white/15">
                  Horario / Módulo
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] border-r border-white/15 last:border-r-0"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {TIME_SLOTS.map((slot) => {
                const isRecess = slot.includes('Receso');
                if (isRecess) {
                  return (
                    <tr key={slot} className="bg-amber-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-900 border-r border-amber-200/60">
                        {slot}
                      </td>
                      <td
                        colSpan={5}
                        className="py-2.5 px-4 text-center font-bold text-amber-800 uppercase tracking-widest text-[11px]"
                      >
                        ☕ Receso Escolar Institucional / Cambio de Guardia
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                      {slot}
                    </td>
                    {DAYS_OF_WEEK.map((day) => {
                      const cellKey = `${day}_${slot}`;
                      const cellData = currentBlocks[cellKey];

                      return (
                        <td
                          key={day}
                          onClick={() => handleOpenCellModal(day, slot)}
                          className={`p-2 border-r border-slate-100 last:border-r-0 align-top transition-all ${
                            canEditSchedules ? 'cursor-pointer hover:bg-blue-50/40' : ''
                          }`}
                        >
                          {cellData ? (
                            <div
                              className="p-2.5 rounded-xl border text-left space-y-1 shadow-2xs"
                              style={{
                                backgroundColor: `${primaryColor}08`,
                                borderColor: `${primaryColor}25`,
                              }}
                            >
                              <div
                                className="font-bold text-xs leading-snug"
                                style={{ color: primaryColor }}
                              >
                                {cellData.materiaNombre}
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{cellData.docenteNombre}</span>
                              </div>
                              {cellData.aula && (
                                <span className="inline-block text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                                  {cellData.aula}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
                              {canEditSchedules ? '+ Asignar Clase' : 'Hora Libre'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign Subject & Teacher to a Schedule Slot */}
      {editingCellKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Grupo {selectedGrado} "{selectedGrupo}" · {editingCellKey.day}
                </span>
                <h3 className="font-bold text-sm">
                  Asignar Rol en Bloque {editingCellKey.slot}
                </h3>
              </div>
              <button onClick={() => setEditingCellKey(null)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Materia / Asignatura *
                </label>
                <select
                  value={cellMateriaId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    setCellMateriaId(subId);
                    const subObj = collegeSubjects.find((s) => s.id === subId);
                    if (subObj?.docenteId) {
                      setCellDocenteId(subObj.docenteId);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  {collegeSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nombre} ({sub.clave})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Docente que Imparte *
                </label>
                <select
                  value={cellDocenteId}
                  onChange={(e) => setCellDocenteId(e.target.value)}
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
                <label className="font-bold text-slate-700 block mb-1">
                  Salón / Laboratorio / Aula
                </label>
                <input
                  type="text"
                  value={cellAula}
                  onChange={(e) => setCellAula(e.target.value)}
                  placeholder="Ej. Aula 301 o Lab. de Ciencias"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-between gap-2">
                {currentBlocks[`${editingCellKey.day}_${editingCellKey.slot}`] ? (
                  <button
                    type="button"
                    onClick={handleRemoveCell}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar Bloque</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCellKey(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Guardar en Horario
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
