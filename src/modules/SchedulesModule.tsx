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
  Edit3,
  RotateCcw,
  Lock,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { DayOfWeek, ScheduleCell, AcademicLevel } from '../types';

const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const DEFAULT_TIME_SLOTS_BY_LEVEL: Record<AcademicLevel, string[]> = {
  Preescolar: [
    '09:00 - 09:45',
    '09:45 - 10:30',
    '10:30 - 11:00 (Receso)',
    '11:00 - 11:45',
    '11:45 - 12:30',
    '12:30 - 13:15',
  ],
  Primaria: [
    '08:00 - 08:50',
    '08:50 - 09:40',
    '09:40 - 10:30',
    '10:30 - 11:00 (Receso)',
    '11:00 - 11:50',
    '11:50 - 12:40',
    '12:40 - 13:30',
    '13:30 - 14:20',
  ],
  Secundaria: [
    '07:00 - 07:50',
    '07:50 - 08:40',
    '08:40 - 09:30',
    '09:30 - 10:20',
    '10:20 - 10:50 (Receso)',
    '10:50 - 11:40',
    '11:40 - 12:30',
    '12:30 - 13:20',
    '13:20 - 14:10',
  ],
  Preparatoria: [
    '07:00 - 07:50',
    '07:50 - 08:40',
    '08:40 - 09:30',
    '09:30 - 10:20',
    '10:20 - 10:50 (Receso)',
    '10:50 - 11:40',
    '11:40 - 12:30',
    '12:30 - 13:20',
    '13:20 - 14:10',
  ],
  Universidad: [
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
  ],
};

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
    collegeGroups,
    getGroupsForCollegeLevel,
    getCollegeScheduleDriveConfig,
    toggleCollegeScheduleEnabled,
    updateCollegeScheduleDriveConfig,
  } = useApp();

  const [selectedNivel, setSelectedNivel] = useState<AcademicLevel | 'todos'>('todos');
  const [selectedGroupLevel, setSelectedGroupLevel] = useState<AcademicLevel>('Primaria');
  const [selectedGrado, setSelectedGrado] = useState('1°');
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

  // States for managing/modifying hours per level and adding more hours
  const [isManageSlotsModalOpen, setIsManageSlotsModalOpen] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('14:10');
  const [newSlotEnd, setNewSlotEnd] = useState('15:00');
  const [newSlotIsRecess, setNewSlotIsRecess] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editingSlotStart, setEditingSlotStart] = useState('');
  const [editingSlotEnd, setEditingSlotEnd] = useState('');
  const [editingSlotIsRecess, setEditingSlotIsRecess] = useState(false);

  const getAllowedLevelsForCollege = (collegeNivel?: string): AcademicLevel[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };

  const allowedLevels = getAllowedLevelsForCollege(activeCollege?.nivel);
  const isMultinivelCollege = allowedLevels.length > 1;

  const isDocente = currentUser.rol === 'docente';
  const currentTeacherRecord = React.useMemo(() => {
    if (!isDocente) return null;
    const cleanId = currentUser.id.replace(/^usr-/, '');
    const cleanEmail = (currentUser.correo || '').trim().toLowerCase();
    const cleanName = (currentUser.nombre || '').trim().toLowerCase();
    return (
      teachers.find(
        (t) =>
          t.colegioId === activeCollege?.id &&
          (t.id === currentUser.id ||
            t.id === cleanId ||
            (t.correo && t.correo.trim().toLowerCase() === cleanEmail) ||
            (t.nombre && t.nombre.trim().toLowerCase() === cleanName))
      ) || null
    );
  }, [isDocente, teachers, currentUser, activeCollege?.id]);

  const teacherAssignedGroups = React.useMemo(() => {
    if (!isDocente) return [];
    const list: string[] = [];
    const seen = new Set<string>();

    const addGrp = (raw?: string) => {
      if (!raw) return;
      const clean = raw.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    };

    if (currentTeacherRecord?.grupos) {
      currentTeacherRecord.grupos.forEach(addGrp);
    }

    if (activeCollege) {
      subjects
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (s.docenteId === currentTeacherRecord?.id ||
              s.docenteId === currentUser.id ||
              (currentTeacherRecord?.nombre &&
                s.docenteNombre?.trim().toLowerCase() === currentTeacherRecord.nombre.trim().toLowerCase()) ||
              (currentUser.nombre &&
                s.docenteNombre?.trim().toLowerCase() === currentUser.nombre.trim().toLowerCase()))
        )
        .forEach((s) => addGrp(s.grupo));
    }

    if (Array.isArray(currentUser.gruposAsignados)) {
      currentUser.gruposAsignados.forEach(addGrp);
    }

    return list;
  }, [isDocente, currentTeacherRecord, subjects, activeCollege, currentUser]);

  // Build registered groups list STRICTLY from Materias y Grupos -> pestaña Grupos (getGroupsForCollegeLevel)
  const registeredCollegeGroups = React.useMemo(() => {
    if (!activeCollege) {
      return [] as {
        key: string;
        nivel: AcademicLevel;
        grado: string;
        grupo: string;
        etiqueta: string;
      }[];
    }

    const levelsToScan: AcademicLevel[] =
      selectedNivel === 'todos' ? allowedLevels : [selectedNivel];

    let list: {
      key: string;
      nivel: AcademicLevel;
      grado: string;
      grupo: string;
      etiqueta: string;
    }[] = [];
    const seen = new Set<string>();

    levelsToScan.forEach((lvl) => {
      const labels = getGroupsForCollegeLevel(activeCollege.id, lvl);
      labels.forEach((lbl) => {
        const norm = lbl.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        const parts = norm.split(' ');
        if (parts.length >= 2) {
          const gr = parts[0].trim();
          const grp = parts.slice(1).join(' ').trim().toUpperCase();
          if (gr && grp) {
            const key = `${lvl}|${gr}|${grp}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                key,
                nivel: lvl,
                grado: gr,
                grupo: grp,
                etiqueta: `${gr} ${grp}`,
              });
            }
          }
        }
      });
    });

    // Si el usuario es DOCENTE, se filtran estrictamente sus grupos asignados
    if (isDocente) {
      if (teacherAssignedGroups.length > 0) {
        list = list.filter((g) => {
          const gFull = `${g.grado} ${g.grupo}`.toLowerCase();
          const gLvlFull = `${g.nivel} ${g.grado} ${g.grupo}`.toLowerCase();
          return teacherAssignedGroups.some((tag) => {
            const cleanTag = tag.toLowerCase();
            return (
              cleanTag === gFull ||
              cleanTag === gLvlFull ||
              cleanTag.includes(gFull) ||
              gFull.includes(cleanTag)
            );
          });
        });
      } else {
        list = [];
      }
    }

    return list;
  }, [activeCollege?.id, selectedNivel, allowedLevels, collegeGroups, subjects, isDocente, teacherAssignedGroups]);

  const currentSelectedGroupKey = `${selectedGroupLevel}|${selectedGrado}|${selectedGrupo}`;

  // Ensure selectedGroupLevel, selectedGrado and selectedGrupo stay synced with the groups registered in Materias y Grupos
  React.useEffect(() => {
    if (registeredCollegeGroups.length > 0) {
      const exactMatch = registeredCollegeGroups.find(
        (g) =>
          g.nivel === selectedGroupLevel &&
          g.grado === selectedGrado &&
          g.grupo === selectedGrupo
      );
      if (!exactMatch) {
        const gradeGrupoMatch = registeredCollegeGroups.find(
          (g) => g.grado === selectedGrado && g.grupo === selectedGrupo
        );
        const nextGroup = gradeGrupoMatch || registeredCollegeGroups[0];
        setSelectedGroupLevel(nextGroup.nivel);
        setSelectedGrado(nextGroup.grado);
        setSelectedGrupo(nextGroup.grupo);
      }
    } else if (selectedNivel !== 'todos') {
      setSelectedGroupLevel(selectedNivel);
    } else if (allowedLevels.length > 0 && !allowedLevels.includes(selectedGroupLevel)) {
      setSelectedGroupLevel(allowedLevels[0]);
    }
  }, [registeredCollegeGroups, selectedGroupLevel, selectedGrado, selectedGrupo, selectedNivel, allowedLevels]);

  if (!activeCollege) return null;

  const scheduleDriveCfg = getCollegeScheduleDriveConfig(activeCollege.id);
  const isScheduleEnabled = scheduleDriveCfg.horarioHabilitado;

  // Determine the active academic level for the timetable hours
  const activeLevelForSchedule: AcademicLevel =
    registeredCollegeGroups.length > 0
      ? selectedGroupLevel
      : selectedNivel !== 'todos'
      ? selectedNivel
      : allowedLevels.includes(selectedGroupLevel)
      ? selectedGroupLevel
      : allowedLevels[0] || 'Primaria';

  const getSlotsForLevel = (lvl: AcademicLevel): string[] => {
    const customSlots = scheduleDriveCfg.bloquesHorarioPorNivel?.[lvl];
    if (customSlots && customSlots.length > 0) {
      return customSlots;
    }
    return DEFAULT_TIME_SLOTS_BY_LEVEL[lvl] || DEFAULT_TIME_SLOTS_BY_LEVEL.Primaria;
  };

  const currentTimeSlots = getSlotsForLevel(activeLevelForSchedule);

  // Suggest next consecutive hour based on the last slot of the active level
  const suggestNextTimeRange = (slots: string[]): { start: string; end: string } => {
    if (slots.length === 0) return { start: '07:00', end: '07:50' };
    const lastSlot = slots[slots.length - 1];
    const match = lastSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return { start: '14:10', end: '15:00' };
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);
    const startTotal = endH * 60 + endM;
    const endTotal = startTotal + 50;
    const fmt = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    return { start: fmt(startTotal), end: fmt(endTotal) };
  };

  const saveSlotsForActiveLevel = (
    updatedSlots: string[],
    renamedSlot?: { oldSlot: string; newSlot: string }
  ) => {
    const nextMap: Partial<Record<AcademicLevel, string[]>> = {
      ...(scheduleDriveCfg.bloquesHorarioPorNivel || {}),
      [activeLevelForSchedule]: updatedSlots,
    };
    updateCollegeScheduleDriveConfig(activeCollege.id, {
      bloquesHorarioPorNivel: nextMap,
    });

    // If a slot was renamed, migrate existing assigned classes on that slot for this level so no data is lost
    if (renamedSlot && renamedSlot.oldSlot !== renamedSlot.newSlot) {
      groupSchedules
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (!s.nivel || s.nivel === activeLevelForSchedule)
        )
        .forEach((sch) => {
          let changed = false;
          const nextBlocks: Record<string, ScheduleCell> = {};
          Object.entries(sch.bloques || {}).forEach(([k, v]) => {
            const matchedDay = DAYS_OF_WEEK.find((d) => k === `${d}_${renamedSlot.oldSlot}`);
            if (matchedDay) {
              nextBlocks[`${matchedDay}_${renamedSlot.newSlot}`] = v;
              changed = true;
            } else {
              nextBlocks[k] = v;
            }
          });
          if (changed) {
            saveGroupSchedule({
              ...sch,
              bloques: nextBlocks,
            });
          }
        });
    }
  };

  const handleOpenManageSlots = () => {
    const suggested = suggestNextTimeRange(currentTimeSlots);
    setNewSlotStart(suggested.start);
    setNewSlotEnd(suggested.end);
    setNewSlotIsRecess(false);
    setEditingSlotIndex(null);
    setIsManageSlotsModalOpen(true);
  };

  const handleAddSlotToLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotStart || !newSlotEnd) return;
    const formatted = `${newSlotStart} - ${newSlotEnd}${newSlotIsRecess ? ' (Receso)' : ''}`;
    if (currentTimeSlots.includes(formatted)) {
      showConfirmation(`El bloque "${formatted}" ya existe en el horario de ${activeLevelForSchedule}.`);
      return;
    }
    const nextSlots = [...currentTimeSlots, formatted].sort((a, b) => a.localeCompare(b));
    saveSlotsForActiveLevel(nextSlots);
    const nextSuggested = suggestNextTimeRange(nextSlots);
    setNewSlotStart(nextSuggested.start);
    setNewSlotEnd(nextSuggested.end);
    setNewSlotIsRecess(false);
    showConfirmation(
      `¡Hora "${formatted}" agregada exitosamente al horario de nivel ${activeLevelForSchedule}!`
    );
  };

  const handleStartEditSlot = (idx: number, slotStr: string) => {
    const match = slotStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    setEditingSlotIndex(idx);
    setEditingSlotStart(match ? match[1] : '07:00');
    setEditingSlotEnd(match ? match[2] : '07:50');
    setEditingSlotIsRecess(slotStr.toLowerCase().includes('receso'));
  };

  const handleSaveEditedSlot = (idx: number) => {
    if (!editingSlotStart || !editingSlotEnd) return;
    const oldSlot = currentTimeSlots[idx];
    const newSlot = `${editingSlotStart} - ${editingSlotEnd}${editingSlotIsRecess ? ' (Receso)' : ''}`;
    const nextSlots = currentTimeSlots
      .map((s, i) => (i === idx ? newSlot : s))
      .sort((a, b) => a.localeCompare(b));
    saveSlotsForActiveLevel(nextSlots, { oldSlot, newSlot });
    setEditingSlotIndex(null);
    showConfirmation(
      `¡Bloque horario actualizado a "${newSlot}" para el nivel ${activeLevelForSchedule}!`
    );
  };

  const handleDeleteSlotFromLevel = (idx: number) => {
    if (currentTimeSlots.length <= 1) {
      showConfirmation('El horario debe conservar al menos un bloque de hora.');
      return;
    }
    const removed = currentTimeSlots[idx];
    const nextSlots = currentTimeSlots.filter((_, i) => i !== idx);
    saveSlotsForActiveLevel(nextSlots);
    showConfirmation(
      `Se eliminó el bloque "${removed}" del horario de nivel ${activeLevelForSchedule}.`
    );
  };

  const handleResetLevelSlotsToDefault = () => {
    const defaultSlots =
      DEFAULT_TIME_SLOTS_BY_LEVEL[activeLevelForSchedule] || DEFAULT_TIME_SLOTS_BY_LEVEL.Primaria;
    saveSlotsForActiveLevel([...defaultSlots]);
    setEditingSlotIndex(null);
    showConfirmation(
      `Se restauraron las horas predeterminadas para el nivel ${activeLevelForSchedule}.`
    );
  };

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Solo Directivo, Control Escolar, Administrador y Soporte pueden habilitar o deshabilitar
  const canToggleSchedule = [
    'directivo',
    'control_escolar',
    'administrador',
    'soporte',
    'superusuario',
  ].includes(currentUser.rol);

  const canEditSchedules =
    !isDocente &&
    [
      'superusuario',
      'administrador',
      'control_escolar',
      'directivo',
      'soporte',
      'coordinador',
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
      (!s.nivel || s.nivel === activeLevelForSchedule) &&
      s.grado === selectedGrado &&
      s.grupo === selectedGrupo &&
      (!hasMultipleCampuses || !selectedCampusId || s.campusId === selectedCampusId)
  ).length;

  const currentWeekMeta = AVAILABLE_WEEKS[selectedWeekIndex] || AVAILABLE_WEEKS[0];

  // Find current schedule for this level + grade + group + week
  const currentSchedule = groupSchedules.find(
    (s) =>
      s.colegioId === activeCollege.id &&
      (!s.nivel || s.nivel === activeLevelForSchedule) &&
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
        (!s.nivel || s.nivel === activeLevelForSchedule) &&
        s.grado === selectedGrado &&
        s.grupo === selectedGrupo &&
        s.semanaInicio === prevWeekMeta.inicio
    );

    if (!prevSchedule || Object.keys(prevSchedule.bloques).length === 0) {
      // If previous week has no saved schedule, fallback to any existing schedule for this group
      const anySchedule = groupSchedules.find(
        (s) =>
          s.colegioId === activeCollege.id &&
          (!s.nivel || s.nivel === activeLevelForSchedule) &&
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
        nivel: activeLevelForSchedule,
        grado: selectedGrado,
        grupo: selectedGrupo,
        semanaInicio: currentWeekMeta.inicio,
        semanaEtiqueta: currentWeekMeta.etiqueta,
        patronRepeticion: 'semanal',
        bloques: { ...anySchedule.bloques },
      });
      showConfirmation(
        `¡Horario copiado exitosamente desde "${anySchedule.semanaEtiqueta}" hacia "${currentWeekMeta.etiqueta}" para el grupo ${selectedGrado} "${selectedGrupo}" (${activeLevelForSchedule})!`
      );
      return;
    }

    saveGroupSchedule({
      colegioId: activeCollege.id,
      campusId: selectedCampusId || undefined,
      cicloId: activeCycle?.id,
      nivel: activeLevelForSchedule,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      patronRepeticion: 'semanal',
      bloques: { ...prevSchedule.bloques },
    });

    showConfirmation(
      `¡Se copió el horario de la semana anterior (${prevWeekMeta.etiqueta}) a ${currentWeekMeta.etiqueta} para el grupo ${selectedGrado} "${selectedGrupo}" (${activeLevelForSchedule})!`
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
            (!s.nivel || s.nivel === activeLevelForSchedule) &&
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
        nivel: activeLevelForSchedule,
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
      `¡Rol de horario aplicado en modalidad "Cada Dos Semanas" (${replicatedWeeks.join(', ')}) para el grupo ${selectedGrado} "${selectedGrupo}" (${activeLevelForSchedule})!`
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
      nivel: activeLevelForSchedule,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      patronRepeticion: currentSchedule?.patronRepeticion || 'semanal',
      bloques: updatedBlocks,
    });

    if (scheduleDriveCfg.modoHoraConsulta === 'bloque_manual') {
      updateCollegeScheduleDriveConfig(activeCollege.id, {
        diaConsulta: editingCellKey.day,
        bloqueHoraConsulta: editingCellKey.slot,
      });
    }

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
      nivel: activeLevelForSchedule,
      grado: selectedGrado,
      grupo: selectedGrupo,
      semanaInicio: currentWeekMeta.inicio,
      semanaEtiqueta: currentWeekMeta.etiqueta,
      bloques: updatedBlocks,
    });

    if (scheduleDriveCfg.modoHoraConsulta === 'bloque_manual') {
      updateCollegeScheduleDriveConfig(activeCollege.id, {
        diaConsulta: editingCellKey.day,
        bloqueHoraConsulta: editingCellKey.slot,
      });
    }

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

      {/* Panel de Activación / Desactivación del Horario (Llenado y Consulta para Drive) */}
      <div
        className={`rounded-2xl border-2 p-4 sm:p-5 shadow-xs transition-all ${
          isScheduleEnabled
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-slate-100 border-slate-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  isScheduleEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-600 text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isScheduleEnabled ? 'bg-amber-300 animate-ping' : 'bg-slate-300'
                  }`}
                />
                <span>
                  {isScheduleEnabled ? 'Horario Habilitado (Activo)' : 'Horario Deshabilitado (Comprimido)'}
                </span>
              </span>
              <span className="text-xs font-bold text-slate-700">
                Llenado de Horario por Grupo y Validación para Drive
              </span>
            </div>

            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {isScheduleEnabled ? (
                <>
                  <strong>Horario Habilitado:</strong> La tabla de horario se encuentra{' '}
                  <strong>activa y desplegada para su llenado</strong>. Además, cuando un padre/tutor presione el botón{' '}
                  <strong>"En Fila"</strong>, el sistema consultará este horario mediante el <strong>grupo</strong> del alumno; si se encuentra en una clase asignada, le enviará notificación de estacionarse, y si no tiene clase, enviará la información a <strong>Drive</strong>.
                </>
              ) : (
                <>
                  <strong>Horario Deshabilitado:</strong> La sección de llenado de horario se encuentra{' '}
                  <strong>comprimida</strong> y el sistema <strong>no lo toma en cuenta para el Drive</strong> (al presionar{' '}
                  <strong>"En Fila"</strong>, envía la información directamente al monitor Drive sin consultar clases). Haz clic en{' '}
                  <strong>"Habilitar Horario"</strong> para desplegar y llenar el horario.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {canToggleSchedule ? (
              <button
                type="button"
                onClick={() => {
                  const nextState = !isScheduleEnabled;
                  toggleCollegeScheduleEnabled(activeCollege.id, nextState);
                  if (!nextState) {
                    setEditingCellKey(null);
                  }
                  showConfirmation(
                    nextState
                      ? '¡Horario HABILITADO! Se ha desplegado la tabla para su llenado y se consultará cuando el padre/tutor presione "En Fila".'
                      : '¡Horario DESHABILITADO! Se ha comprimido el horario y no se tomará en cuenta para el envío a Drive.'
                  );
                }}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2 ${
                  isScheduleEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {isScheduleEnabled ? 'Deshabilitar Horario' : 'Habilitar Horario'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isScheduleEnabled ? 'Horario Habilitado (Activo)' : 'Horario Deshabilitado'}
                </span>
              </div>
            )}
            {!canToggleSchedule && (
              <span className="text-[10px] text-slate-400 font-medium">
                Solo Directivo, Control Escolar, Administrador o Soporte pueden modificar este ajuste
              </span>
            )}
          </div>
        </div>
      </div>

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

      {/* Si el Horario está HABILITADO se despliega para su llenado; si está DESHABILITADO se comprime */}
      {isScheduleEnabled && (
        <>
          {/* Banner informativo exclusivo para Docentes */}
          {isDocente && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-2xs"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    Horarios de Clases · Vista de Docente ({currentUser.nombre})
                  </span>
                  <span className="text-slate-600">
                    Solo puedes visualizar los horarios de tus grupos escolares asignados:{' '}
                    <strong className="text-indigo-900">
                      {teacherAssignedGroups.length > 0
                        ? teacherAssignedGroups.join(', ')
                        : 'Sin grupos asignados'}
                    </strong>
                    .
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-800 font-bold text-xs shadow-2xs self-start sm:self-auto shrink-0 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Modo Consulta Autorizado</span>
              </span>
            </div>
          )}

          {isDocente && registeredCollegeGroups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base">
                No tienes grupos escolares asignados actualmente
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                El perfil de docente únicamente puede consultar los horarios de sus grupos asignados. Solicita a Dirección, Control Escolar o Coordinación la asignación de tus materias y grupos para visualizarlos aquí.
              </p>
            </div>
          ) : (
            <>
          {/* Copy, Repeat & Modify Level Hours Action Buttons (Below Header) */}
          {canEditSchedules && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenManageSlots}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50/70 text-slate-900 border-2 border-blue-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>
                    Modificar Horas / Agregar Horas ({activeLevelForSchedule})
                  </span>
                </button>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                  Entrada {activeLevelForSchedule}:{' '}
                  <strong>{currentTimeSlots[0]?.split('-')[0]?.trim() || '07:00'} hrs</strong> ·{' '}
                  {currentTimeSlots.length} bloques
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
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
            </div>
          )}

          {/* Filters Bar: Campus (if >1), Grado, Grupo, Semana */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
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

              {isMultinivelCollege && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Nivel Escolar
                  </label>
                  <select
                    value={selectedNivel}
                    onChange={(e) => {
                      const val = e.target.value as AcademicLevel | 'todos';
                      setSelectedNivel(val);
                      if (val !== 'todos') {
                        setSelectedGroupLevel(val);
                      }
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                  >
                    <option value="todos">Todos los Niveles</option>
                    {allowedLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Grupo / Rol (Materias y Grupos)
                </label>
                <select
                  value={
                    registeredCollegeGroups.length > 0 ? currentSelectedGroupKey : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = registeredCollegeGroups.find((g) => g.key === val);
                    if (found) {
                      setSelectedGroupLevel(found.nivel);
                      setSelectedGrado(found.grado);
                      setSelectedGrupo(found.grupo);
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  {registeredCollegeGroups.length === 0 ? (
                    <option value="">
                      Sin grupos dados de alta en Materias y Grupos
                    </option>
                  ) : isMultinivelCollege && selectedNivel === 'todos' ? (
                    allowedLevels.map((lvl) => {
                      const groupsInLvl = registeredCollegeGroups.filter(
                        (g) => g.nivel === lvl
                      );
                      if (groupsInLvl.length === 0) return null;
                      return (
                        <optgroup key={lvl} label={`Nivel ${lvl}`}>
                          {groupsInLvl.map((g) => (
                            <option key={g.key} value={g.key}>
                              {g.etiqueta} ({g.nivel})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })
                  ) : (
                    registeredCollegeGroups.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.etiqueta}
                      </option>
                    ))
                  )}
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

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {registeredCollegeGroups.length > 0 ? (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  Grupo <strong>{selectedGrado} {selectedGrupo}</strong>
                  {isMultinivelCollege ? ` (${selectedGroupLevel})` : ''} · {groupStudentsCount} alumnos inscritos
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                  Da de alta tus grupos en el módulo <strong>Materias y Grupos → Pestaña Grupos</strong>
                </span>
              )}
              {currentSchedule?.patronRepeticion === 'quincenal_a' && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                  Rol Quincenal (Cada 2 Semanas)
                </span>
              )}
            </div>
          </div>

          {/* Weekly Timetable Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[780px]">
                <thead>
                  <tr
                    className="text-white text-left"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <th className="py-3.5 px-4 w-44 font-bold uppercase tracking-wider text-[11px] border-r border-white/15">
                      <div className="flex items-center justify-between gap-1">
                        <span>Horario ({activeLevelForSchedule})</span>
                        {canEditSchedules && (
                          <button
                            type="button"
                            onClick={handleOpenManageSlots}
                            title={`Modificar o agregar horas para ${activeLevelForSchedule}`}
                            className="p-1 rounded-md bg-white/15 hover:bg-white/25 text-amber-300 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                  {currentTimeSlots.map((slot) => {
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
                                (() => {
                                  const isMyClass =
                                    isDocente &&
                                    Boolean(
                                      cellData.docenteId === currentTeacherRecord?.id ||
                                        cellData.docenteId === currentUser.id ||
                                        (currentTeacherRecord?.nombre &&
                                          cellData.docenteNombre?.trim().toLowerCase() ===
                                            currentTeacherRecord.nombre.trim().toLowerCase()) ||
                                        (currentUser.nombre &&
                                          cellData.docenteNombre?.trim().toLowerCase() ===
                                            currentUser.nombre.trim().toLowerCase())
                                    );

                                  return (
                                    <div
                                      className={`p-2.5 rounded-xl border text-left space-y-1 shadow-2xs transition-all ${
                                        isMyClass
                                          ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/70'
                                          : ''
                                      }`}
                                      style={
                                        !isMyClass
                                          ? {
                                              backgroundColor: `${primaryColor}08`,
                                              borderColor: `${primaryColor}25`,
                                            }
                                          : undefined
                                      }
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <div
                                          className={`font-bold text-xs leading-snug ${
                                            isMyClass ? 'text-emerald-950' : ''
                                          }`}
                                          style={!isMyClass ? { color: primaryColor } : undefined}
                                        >
                                          {cellData.materiaNombre}
                                        </div>
                                        {isMyClass && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider shrink-0 shadow-2xs">
                                            Tu Clase
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        className={`text-[11px] font-medium flex items-center gap-1 ${
                                          isMyClass ? 'text-emerald-800' : 'text-slate-600'
                                        }`}
                                      >
                                        <Users
                                          className={`w-3 h-3 shrink-0 ${
                                            isMyClass ? 'text-emerald-600' : 'text-slate-400'
                                          }`}
                                        />
                                        <span className="truncate">{cellData.docenteNombre}</span>
                                      </div>
                                      {cellData.aula && (
                                        <span
                                          className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                            isMyClass
                                              ? 'bg-white border-emerald-200 text-emerald-900 font-bold'
                                              : 'bg-white border-slate-200 text-slate-500'
                                          }`}
                                        >
                                          {cellData.aula}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="h-16 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                  {canEditSchedules ? '+ Asignar Clase' : 'Hora Libre / Sin Asignar'}
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

            {canEditSchedules && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  Horario configurado para el nivel <strong>{activeLevelForSchedule}</strong> ({currentTimeSlots.length} bloques). Puedes modificar las horas de entrada/salida o agregar más horas a este nivel.
                </span>
                <button
                  type="button"
                  onClick={handleOpenManageSlots}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white shadow-2xs transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Más Horas / Modificar Horario ({activeLevelForSchedule})</span>
                </button>
              </div>
            )}
          </div>
            </>
          )}
        </>
      )}

      {/* Modal: Modify Schedule Hours per Level & Add More Hours */}
      {isManageSlotsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div
              className="p-4 text-white flex items-center justify-between shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Configuración de Horas por Nivel Escolar
                </span>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Horario de Nivel {activeLevelForSchedule}</span>
                </h3>
              </div>
              <button onClick={() => setIsManageSlotsModalOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto text-xs sm:text-sm">
              {/* Selector rápido de nivel dentro del modal si el colegio es multinivel */}
              {isMultinivelCollege && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Nivel a configurar:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {allowedLevels.map((lvl) => {
                      const isCurrentLvl = activeLevelForSchedule === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setSelectedNivel(lvl);
                            setSelectedGroupLevel(lvl);
                            setEditingSlotIndex(null);
                            const slotsOfLvl = getSlotsForLevel(lvl);
                            const sug = suggestNextTimeRange(slotsOfLvl);
                            setNewSlotStart(sug.start);
                            setNewSlotEnd(sug.end);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrentLvl
                              ? 'text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          style={isCurrentLvl ? { backgroundColor: primaryColor } : {}}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulario para agregar más horas */}
              <form
                onSubmit={handleAddSlotToLevel}
                className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-700" />
                    <span>Agregar Nueva Hora a {activeLevelForSchedule}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Hora de Fin
                    </label>
                    <input
                      type="time"
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSlotIsRecess}
                      onChange={(e) => setNewSlotIsRecess(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Marcar este bloque como Receso</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Hora</span>
                  </button>
                </div>
              </form>

              {/* Lista de bloques actuales del nivel para editar o eliminar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Bloques Horarios de {activeLevelForSchedule} ({currentTimeSlots.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetLevelSlotsToDefault}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Restaurar horas predeterminadas de este nivel"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar por defecto</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {currentTimeSlots.map((slotStr, idx) => {
                    const isEditingThis = editingSlotIndex === idx;
                    const isRecessSlot = slotStr.toLowerCase().includes('receso');

                    return (
                      <div
                        key={`${slotStr}_${idx}`}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isRecessSlot ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="w-full space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">
                                  Inicio
                                </label>
                                <input
                                  type="time"
                                  value={editingSlotStart}
                                  onChange={(e) => setEditingSlotStart(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">
                                  Fin
                                </label>
                                <input
                                  type="time"
                                  value={editingSlotEnd}
                                  onChange={(e) => setEditingSlotEnd(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingSlotIsRecess}
                                  onChange={(e) => setEditingSlotIsRecess(e.target.checked)}
                                />
                                <span>Es Receso</span>
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingSlotIndex(null)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedSlot(idx)}
                                  className="px-3 py-1 rounded-lg text-white text-xs font-bold cursor-pointer"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                                {slotStr}
                              </span>
                              {isRecessSlot && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  Receso
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleStartEditSlot(idx, slotStr)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modificar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlotFromLevel(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Quitar</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManageSlotsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

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
