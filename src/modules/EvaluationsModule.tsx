import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  EvaluationConceptItem,
  EvaluationConceptKind,
  EvaluationSavedPeriod,
  Student,
} from '../types';
import {
  ClipboardCheck,
  Percent,
  Plus,
  Trash2,
  Save,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ListChecks,
  Sliders,
  Edit3,
  X,
  FolderPlus,
} from 'lucide-react';
import { getGradePeriodsForModalidad } from '../utils/reportCardPdfGenerator';

const CONCEPT_KIND_LABELS: Record<
  EvaluationConceptKind,
  { label: string; badgeBg: string; description: string }
> = {
  examen: {
    label: 'Examen (Valor Obtenido)',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Toma la calificación obtenida por el alumno en el examen del periodo.',
  },
  tareas: {
    label: 'Tareas Registradas en Lista',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description:
      'Calcula automáticamente el % y calificación según el total de tareas registradas por el docente vs las entregadas por el alumno.',
  },
  trabajo_clase: {
    label: 'Trabajo en Clase / Libreta',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Sellos en libreta, apuntes y actividades cotidianas en el aula.',
  },
  proyecto: {
    label: 'Proyecto / Laboratorio',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Proyectos integradores, investigaciones o prácticas de laboratorio.',
  },
  participacion: {
    label: 'Participación y Desempeño',
    badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    description: 'Participación activa, exposiciones y actitud académica.',
  },
  personalizado: {
    label: 'Concepto Personalizado',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Criterio adicional configurable por el docente.',
  },
};

const SPANISH_MONTH_KEYWORDS: Record<number, string[]> = {
  0: ['enero', 'ene'],
  1: ['febrero', 'feb'],
  2: ['marzo', 'mar'],
  3: ['abril', 'abr'],
  4: ['mayo', 'may'],
  5: ['junio', 'jun'],
  6: ['julio', 'jul'],
  7: ['agosto', 'ago'],
  8: ['septiembre', 'sep'],
  9: ['octubre', 'oct'],
  10: ['noviembre', 'nov'],
  11: ['diciembre', 'dic'],
};

export const EvaluationsModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    students,
    teachers,
    subjects,
    grades,
    tasksExams,
    evaluationConcepts,
    evaluationSavedPeriods,
    studentEvaluations,
    addEvaluationConcept,
    updateEvaluationConcept,
    deleteEvaluationConcept,
    updateEvaluationConceptPercentages,
    saveEvaluationPeriod,
    deleteEvaluationPeriod,
    saveStudentEvaluation,
    setCollegeEvaluationPeriodicity,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'conceptos' | 'registros'>('registros');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(() => {
    const m = new Date().getMonth();
    // Map current network month to school cycle month index (Sep = 1, Oct = 2, etc.)
    if (m >= 8) return m - 7; // Sep(8)->1, Oct(9)->2, Nov(10)->3, Dec(11)->4
    if (m <= 5) return m + 5; // Jan(0)->5 .. Jun(5)->10
    return 1;
  });

  // Selection mode for period dates: 'mes_completo' or 'rango_fechas'
  const [dateSelectionMode, setDateSelectionMode] = useState<'mes_completo' | 'rango_fechas'>(
    'mes_completo'
  );
  const [rangeStartDate, setRangeStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [rangeEndDate, setRangeEndDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  });

  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // New Concept Form State
  const [newConceptName, setNewConceptName] = useState('');
  const [newConceptKind, setNewConceptKind] = useState<EvaluationConceptKind>('personalizado');
  const [newConceptPct, setNewConceptPct] = useState<number>(20);
  const [newConceptDesc, setNewConceptDesc] = useState('');

  // Selected Saved Period in "Mis Bitácoras"
  const [activeSavedPeriodId, setActiveSavedPeriodId] = useState<string>('');

  // Local draft edits for student rows in Mis Bitácoras tab
  const [draftRows, setDraftRows] = useState<
    Record<
      string,
      {
        calificacionExamen: number;
        tareasEntregadasAlumno: number;
        checklistTareas: Record<string, 'entregada' | 'incompleta' | 'no_entregada'>;
        puntajesConceptos: Record<string, number>;
        calificacionManualActiva: boolean;
        calificacionManual: number;
        observaciones: string;
      }
    >
  >({});

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores?.primario || '#0B2545';
  const goldColor = activeCollege.colores?.secundario || '#C59B27';

  const activePeriodicity: EvaluationPeriodicity =
    activeCollege.periodicidadEvaluacion || 'mensual';
  const periodicityMeta =
    EVALUATION_PERIODICITY_CONFIG[activePeriodicity] ||
    EVALUATION_PERIODICITY_CONFIG.mensual;

  // Saved periods for this college
  const collegeSavedPeriods = useMemo(() => {
    return evaluationSavedPeriods.filter((p) => p.colegioId === activeCollege.id);
  }, [evaluationSavedPeriods, activeCollege.id]);

  // Network date detection for automatic selection in Mis Bitácoras (Req #7)
  const networkMatchedPeriod = useMemo(() => {
    if (collegeSavedPeriods.length === 0) return null;
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const currentMonthIdx = now.getMonth();
    const monthKeywords = SPANISH_MONTH_KEYWORDS[currentMonthIdx] || [];

    // 1. Check if today's network date falls within a saved period's explicit date range
    const byDateRange = collegeSavedPeriods.find(
      (p) => p.fechaInicio && p.fechaFin && todayIso >= p.fechaInicio && todayIso <= p.fechaFin
    );
    if (byDateRange) return byDateRange;

    // 2. Check if the saved period name matches the current network month (e.g. "Octubre")
    const byMonthName = collegeSavedPeriods.find((p) =>
      monthKeywords.some((kw) => p.periodoNombre.toLowerCase().includes(kw))
    );
    if (byMonthName) return byMonthName;

    // 3. Fallback to most recently saved period
    return collegeSavedPeriods[collegeSavedPeriods.length - 1];
  }, [collegeSavedPeriods]);

  // Auto-select the period matching the network date when entering or loading
  useEffect(() => {
    if (
      collegeSavedPeriods.length > 0 &&
      (!activeSavedPeriodId || !collegeSavedPeriods.some((p) => p.id === activeSavedPeriodId))
    ) {
      if (networkMatchedPeriod) {
        setActiveSavedPeriodId(networkMatchedPeriod.id);
      } else {
        setActiveSavedPeriodId(collegeSavedPeriods[0].id);
      }
    }
  }, [collegeSavedPeriods, activeSavedPeriodId, networkMatchedPeriod]);

  // Active saved period in Mis Bitácoras
  const activeBitacoraPeriod: EvaluationSavedPeriod | null = useMemo(() => {
    if (collegeSavedPeriods.length === 0) return null;
    return (
      collegeSavedPeriods.find((p) => p.id === activeSavedPeriodId) ||
      networkMatchedPeriod ||
      collegeSavedPeriods[0]
    );
  }, [collegeSavedPeriods, activeSavedPeriodId, networkMatchedPeriod]);

  // Subjects of this college
  const collegeSubjects = useMemo(() => {
    const list = subjects.filter((s) => s.colegioId === activeCollege.id);
    if (list.length > 0) return list;
    return [
      {
        id: `sub-default-${activeCollege.id}`,
        colegioId: activeCollege.id,
        nombre: 'Matemáticas y Pensamiento Lógico',
        clave: 'MAT-101',
        grado: 'General',
        creditos: 8,
        horasSemanales: 5,
      },
    ];
  }, [subjects, activeCollege.id]);

  const effectiveSubject = collegeSubjects[0];

  // Find if the currently selected Periodo (periodicidad + periodoIndex + date mode/range) already exists in evaluationSavedPeriods
  const matchingSavedPeriodForCurrentSelection = useMemo(() => {
    if (dateSelectionMode === 'rango_fechas') {
      const rangeLabel = `Del ${rangeStartDate} al ${rangeEndDate}`;
      return (
        collegeSavedPeriods.find(
          (p) =>
            p.periodicidad === activePeriodicity &&
            p.modoSeleccionFecha === 'rango_fechas' &&
            ((p.fechaInicio === rangeStartDate && p.fechaFin === rangeEndDate) ||
              p.periodoNombre === rangeLabel)
        ) || null
      );
    }

    // Match by periodicidad, periodoIndex, and modoSeleccionFecha === 'mes_completo'
    return (
      collegeSavedPeriods.find(
        (p) =>
          p.periodicidad === activePeriodicity &&
          p.periodoIndex === selectedPeriodIndex &&
          (p.modoSeleccionFecha || 'mes_completo') === 'mes_completo'
      ) || null
    );
  }, [
    collegeSavedPeriods,
    activePeriodicity,
    selectedPeriodIndex,
    dateSelectionMode,
    rangeStartDate,
    rangeEndDate,
  ]);

  // Period-specific local concepts editor state so each period keeps its own independent concepts (Req #3)
  const buildDefaultConceptsForPeriod = (
    pIdx: number,
    pName: string
  ): EvaluationConceptItem[] => [
    {
      id: `concept-${activeCollege.id}-${activePeriodicity}-P${pIdx}-examen`,
      colegioId: activeCollege.id,
      nombre: 'Examen del Periodo',
      descripcion: CONCEPT_KIND_LABELS.examen.description,
      tipo: 'examen',
      porcentaje: 40,
      periodicidad: activePeriodicity,
      periodoIndex: pIdx,
      periodoNombre: pName,
      activo: true,
    },
    {
      id: `concept-${activeCollege.id}-${activePeriodicity}-P${pIdx}-tareas`,
      colegioId: activeCollege.id,
      nombre: 'Tareas y Entregas en Lista',
      descripcion: CONCEPT_KIND_LABELS.tareas.description,
      tipo: 'tareas',
      porcentaje: 30,
      periodicidad: activePeriodicity,
      periodoIndex: pIdx,
      periodoNombre: pName,
      activo: true,
    },
    {
      id: `concept-${activeCollege.id}-${activePeriodicity}-P${pIdx}-clase`,
      colegioId: activeCollege.id,
      nombre: 'Trabajo en Clase y Libreta',
      descripcion: CONCEPT_KIND_LABELS.trabajo_clase.description,
      tipo: 'trabajo_clase',
      porcentaje: 30,
      periodicidad: activePeriodicity,
      periodoIndex: pIdx,
      periodoNombre: pName,
      activo: true,
    },
  ];

  // Key identifying the currently selected period in the editor
  const currentEditorPeriodKey =
    dateSelectionMode === 'rango_fechas'
      ? `${activeCollege.id}__${activePeriodicity}__rango_fechas__${rangeStartDate}_${rangeEndDate}`
      : `${activeCollege.id}__${activePeriodicity}__P${selectedPeriodIndex}__mes_completo__mes`;

  const [periodConceptsDraftMap, setPeriodConceptsDraftMap] = useState<
    Record<string, EvaluationConceptItem[]>
  >({});

  // Concepts for the currently selected period in Conceptos de Evaluación tab (strictly isolated per period!)
  const collegeConcepts = useMemo(() => {
    // 1. If the user has edited concepts for this specific period key in this session, use that draft
    if (periodConceptsDraftMap[currentEditorPeriodKey] !== undefined) {
      return periodConceptsDraftMap[currentEditorPeriodKey];
    }
    // 2. If this period was already saved in evaluationSavedPeriods, load its own saved concepts
    if (
      matchingSavedPeriodForCurrentSelection &&
      matchingSavedPeriodForCurrentSelection.conceptos.length > 0
    ) {
      return matchingSavedPeriodForCurrentSelection.conceptos;
    }
    // 3. Requirement #2: If this is a newly registered college with no saved periods, no concepts, and no students, keep empty
    const hasCollegeData =
      collegeSavedPeriods.length > 0 ||
      evaluationConcepts.some((c) => c.colegioId === activeCollege.id) ||
      students.some((s) => s.colegioId === activeCollege.id);
    if (!hasCollegeData) {
      return [];
    }
    // 4. Otherwise return clean default concepts specific to this period
    const pName =
      periodicityMeta.periodNames[selectedPeriodIndex - 1] ||
      periodicityMeta.periodNames[0];
    return buildDefaultConceptsForPeriod(selectedPeriodIndex, pName);
  }, [
    periodConceptsDraftMap,
    currentEditorPeriodKey,
    matchingSavedPeriodForCurrentSelection,
    collegeSavedPeriods.length,
    evaluationConcepts,
    students,
    activeCollege.id,
    activePeriodicity,
    selectedPeriodIndex,
    periodicityMeta.periodNames,
  ]);

  const setCurrentPeriodConcepts = (
    updater: (prev: EvaluationConceptItem[]) => EvaluationConceptItem[]
  ) => {
    const nextList = updater(collegeConcepts);
    setPeriodConceptsDraftMap((prev) => ({
      ...prev,
      [currentEditorPeriodKey]: nextList,
    }));
  };

  // Strictly use ONLY the concepts registered in the saved period (or active concepts if none saved yet) (Req #2)
  const bitacoraConcepts = useMemo(() => {
    if (activeBitacoraPeriod && activeBitacoraPeriod.conceptos.length > 0) {
      return activeBitacoraPeriod.conceptos;
    }
    return collegeConcepts;
  }, [activeBitacoraPeriod, collegeConcepts]);

  const totalPercentageSum = useMemo(
    () =>
      Math.min(
        100,
        Number(
          collegeConcepts
            .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
            .toFixed(1)
        )
      ),
    [collegeConcepts]
  );

  const rawTotalPercentageSum = useMemo(
    () =>
      Number(
        collegeConcepts
          .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
          .toFixed(1)
      ),
    [collegeConcepts]
  );

  const bitacoraTotalPctSum = useMemo(
    () =>
      Number(
        bitacoraConcepts
          .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
          .toFixed(1)
      ),
    [bitacoraConcepts]
  );

  // Tasks registered in Tasks & Exams module for this college
  const registeredTasksInSystem = useMemo(() => {
    return tasksExams.filter(
      (t) => t.colegioId === activeCollege.id && t.tipo === 'tarea'
    );
  }, [tasksExams, activeCollege.id]);

  const totalTasksByTeacher = Math.max(5, registeredTasksInSystem.length || 8);

  // Students assigned in this college (excluding students with estatus 'baja' from bitácoras)
  const collegeStudents = useMemo(() => {
    const allInCollege = students.filter(
      (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
    );
    if (currentUser.rol === 'docente') {
      const teacherRecord = teachers.find(
        (t) =>
          t.colegioId === activeCollege.id &&
          (t.correo.toLowerCase() === currentUser.correo.toLowerCase() ||
            t.nombre.toLowerCase() === currentUser.nombre.toLowerCase())
      );
      const assignedDirect = allInCollege.filter(
        (s) =>
          s.docenteId === currentUser.id ||
          (teacherRecord &&
            (s.docenteId === teacherRecord.id ||
              teacherRecord.grupos.some((g) => g.includes(s.grado) || g.includes(s.grupo))))
      );
      if (assignedDirect.length > 0) return assignedDirect;
    }
    return allInCollege;
  }, [students, teachers, activeCollege.id, currentUser]);

  // Ensure selectedPeriodIndex stays within bounds when periodicity changes
  useEffect(() => {
    if (selectedPeriodIndex > periodicityMeta.periodCount) {
      setSelectedPeriodIndex(1);
    }
  }, [activePeriodicity, periodicityMeta.periodCount, selectedPeriodIndex]);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4200);
  };

  const basePeriodSubName =
    periodicityMeta.periodNames[selectedPeriodIndex - 1] ||
    periodicityMeta.periodNames[0];

  const currentPeriodSubName =
    dateSelectionMode === 'rango_fechas' && rangeStartDate && rangeEndDate
      ? `Del ${rangeStartDate} al ${rangeEndDate}`
      : basePeriodSubName;

  // =========================================================
  // HANDLERS FOR TAB 1: CONCEPTOS DE EVALUACIÓN & GUARDAR PERIODO
  // =========================================================
  const handleManualPercentageChange = (conceptId: string, rawVal: string) => {
    setCurrentPeriodConcepts((prev) => {
      const otherSum = prev
        .filter((c) => c.id !== conceptId)
        .reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);
      const maxAllowed = Math.max(0, Number((100 - otherSum).toFixed(1)));
      const num = Math.max(0, Math.min(maxAllowed, Number(rawVal) || 0));
      return prev.map((c) => (c.id === conceptId ? { ...c, porcentaje: num } : c));
    });
  };

  const handleUpdateConceptName = (conceptId: string, newName: string) => {
    setCurrentPeriodConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, nombre: newName } : c))
    );
  };

  const handleDeleteConceptAndRedistribute = (conceptId: string) => {
    setCurrentPeriodConcepts((prev) => {
      const remaining = prev.filter((c) => c.id !== conceptId);
      if (remaining.length === 0) return prev;
      const count = remaining.length;
      const base = Math.floor((100 / count) * 10) / 10;
      let runningSum = 0;
      return remaining.map((c, idx) => {
        if (idx === count - 1) {
          return { ...c, porcentaje: Number((100 - runningSum).toFixed(1)) };
        }
        runningSum += base;
        return { ...c, porcentaje: base };
      });
    });
    showToast(
      `Concepto eliminado de "${currentPeriodSubName}". El 100% se repartió automáticamente entre los conceptos de este periodo.`
    );
  };

  const handleCreateConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConceptName.trim()) return;

    const clampedPct = Math.max(0, Math.min(100, Number(newConceptPct) || 0));
    const newConceptItem: EvaluationConceptItem = {
      id: `eval-c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      colegioId: activeCollege.id,
      docenteId: currentUser.id,
      materiaId: effectiveSubject?.id || 'todas',
      gradoGrupo: 'todos',
      nombre: newConceptName.trim(),
      descripcion:
        newConceptDesc.trim() || CONCEPT_KIND_LABELS[newConceptKind].description,
      tipo: newConceptKind,
      porcentaje: clampedPct,
      periodicidad: activePeriodicity,
      periodoIndex: selectedPeriodIndex,
      periodoNombre: currentPeriodSubName,
      activo: true,
    };

    setCurrentPeriodConcepts((prev) => {
      if (prev.length === 0) {
        return [{ ...newConceptItem, porcentaje: 100 }];
      }
      const remainingPool = Math.max(0, Number((100 - clampedPct).toFixed(1)));
      const count = prev.length;
      const subtractEach = clampedPct / count;

      const rawUpdated = prev.map((c) => ({
        id: c.id,
        val: Math.max(0, Number((c.porcentaje - subtractEach).toFixed(1))),
      }));

      const rawSum = rawUpdated.reduce((acc, item) => acc + item.val, 0);
      const pctMap: Record<string, number> = {};

      if (rawSum > 0) {
        let running = 0;
        rawUpdated.forEach((item, idx) => {
          if (idx === count - 1) {
            pctMap[item.id] = Math.max(0, Number((remainingPool - running).toFixed(1)));
          } else {
            const scaled = Number(((item.val / rawSum) * remainingPool).toFixed(1));
            pctMap[item.id] = scaled;
            running += scaled;
          }
        });
      } else {
        const equalShare = Math.floor((remainingPool / count) * 10) / 10;
        let running = 0;
        prev.forEach((c, idx) => {
          if (idx === count - 1) {
            pctMap[c.id] = Math.max(0, Number((remainingPool - running).toFixed(1)));
          } else {
            pctMap[c.id] = equalShare;
            running += equalShare;
          }
        });
      }

      const updatedExisting = prev.map((c) => ({
        ...c,
        porcentaje: pctMap[c.id] ?? c.porcentaje,
      }));

      return [...updatedExisting, newConceptItem];
    });

    setNewConceptName('');
    setNewConceptDesc('');
    showToast(
      `Concepto "${newConceptItem.nombre}" (${clampedPct}%) agregado únicamente al periodo "${currentPeriodSubName}". Recuerda presionar "Guardar Periodo" para conservar sus cambios.`
    );
  };

  const handleSaveCurrentPeriod = () => {
    const saved = saveEvaluationPeriod({
      id: matchingSavedPeriodForCurrentSelection?.id,
      colegioId: activeCollege.id,
      periodicidad: activePeriodicity,
      periodoIndex: selectedPeriodIndex,
      periodoNombre: currentPeriodSubName,
      modoSeleccionFecha: dateSelectionMode,
      fechaInicio: dateSelectionMode === 'rango_fechas' ? rangeStartDate : undefined,
      fechaFin: dateSelectionMode === 'rango_fechas' ? rangeEndDate : undefined,
      conceptos: collegeConcepts,
    });
    setActiveSavedPeriodId(saved.id);
    showToast(
      `¡Periodo "${periodicityMeta.label} — ${currentPeriodSubName}" guardado con sus ${collegeConcepts.length} conceptos exclusivos!`
    );
  };

  const handleStartNewPeriod = () => {
    const nextIdx =
      selectedPeriodIndex < periodicityMeta.periodCount
        ? selectedPeriodIndex + 1
        : 1;
    setSelectedPeriodIndex(nextIdx);
    const nextName =
      periodicityMeta.periodNames[nextIdx - 1] || periodicityMeta.periodNames[0];
    showToast(
      `Nuevo periodo seleccionado (${periodicityMeta.label} — ${nextName}). Configura sus conceptos propios y presiona "Guardar Periodo".`
    );
  };

  const handleLoadSavedPeriodIntoEditor = (period: EvaluationSavedPeriod) => {
    setCollegeEvaluationPeriodicity(activeCollege.id, period.periodicidad);
    setSelectedPeriodIndex(period.periodoIndex);
    const mode = period.modoSeleccionFecha || 'mes_completo';
    setDateSelectionMode(mode);
    if (period.fechaInicio) setRangeStartDate(period.fechaInicio);
    if (period.fechaFin) setRangeEndDate(period.fechaFin);

    const targetKey =
      mode === 'rango_fechas'
        ? `${activeCollege.id}__${period.periodicidad}__rango_fechas__${period.fechaInicio || rangeStartDate}_${period.fechaFin || rangeEndDate}`
        : `${activeCollege.id}__${period.periodicidad}__P${period.periodoIndex}__mes_completo__mes`;

    setPeriodConceptsDraftMap((prev) => ({
      ...prev,
      [targetKey]: period.conceptos.map((c) => ({ ...c })),
    }));

    showToast(
      `Se cargó el periodo "${EVALUATION_PERIODICITY_CONFIG[period.periodicidad].label} — ${period.periodoNombre}" con sus ${period.conceptos.length} conceptos.`
    );
  };

  // =========================================================
  // HELPERS & HANDLERS FOR TAB 2: MIS BITÁCORAS
  // =========================================================
  const bitacoraPeriodicity: EvaluationPeriodicity =
    activeBitacoraPeriod?.periodicidad || activePeriodicity;
  const bitacoraPeriodIdx: number =
    activeBitacoraPeriod?.periodoIndex || selectedPeriodIndex;
  const bitacoraPeriodLabel: string =
    activeBitacoraPeriod?.periodoNombre || currentPeriodSubName;

  // Check WHICH concept types actually exist in the registered period (Req #2: only show concepts registered for the period!)
  const hasTasksConceptInBitacora = useMemo(
    () => bitacoraConcepts.some((c) => c.tipo === 'tareas'),
    [bitacoraConcepts]
  );

  const getStudentRowState = (student: Student) => {
    const entryKey = `${activeCollege.id}_${student.id}_${effectiveSubject?.id || 'gen'}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
    if (draftRows[entryKey]) {
      return { key: entryKey, ...draftRows[entryKey] };
    }

    const saved = studentEvaluations.find((e) => e.id === entryKey);
    if (saved) {
      return {
        key: entryKey,
        calificacionExamen: saved.calificacionExamen,
        tareasEntregadasAlumno: Math.min(totalTasksByTeacher, saved.tareasEntregadasAlumno),
        checklistTareas: saved.checklistTareas || {},
        puntajesConceptos: saved.puntajesConceptos || {},
        calificacionManualActiva: Boolean(saved.calificacionManualActiva),
        calificacionManual: saved.calificacionManual ?? saved.calificacionFinalPeriodo,
        observaciones: saved.observaciones || '',
      };
    }

    const existingGrade = grades.find(
      (g) => g.colegioId === activeCollege.id && g.estudianteId === student.id
    );
    const baseScore = existingGrade
      ? getGradePeriodsForModalidad(existingGrade, bitacoraPeriodicity)[
          bitacoraPeriodIdx - 1
        ] || existingGrade.promedioFinal
      : student.promedio || 9.0;

    const defaultTasksDelivered = Math.round((baseScore / 10) * totalTasksByTeacher);
    const initialChecklist: Record<string, 'entregada' | 'incompleta' | 'no_entregada'> = {};
    for (let i = 1; i <= totalTasksByTeacher; i++) {
      initialChecklist[`T${i}`] =
        i <= defaultTasksDelivered ? 'entregada' : 'no_entregada';
    }

    const defaultConceptScores: Record<string, number> = {};
    bitacoraConcepts.forEach((c) => {
      defaultConceptScores[c.id] = Number(baseScore.toFixed(1));
    });

    return {
      key: entryKey,
      calificacionExamen: Number(baseScore.toFixed(1)),
      tareasEntregadasAlumno: defaultTasksDelivered,
      checklistTareas: initialChecklist,
      puntajesConceptos: defaultConceptScores,
      calificacionManualActiva: false,
      calificacionManual: Number(baseScore.toFixed(1)),
      observaciones: existingGrade?.observaciones || 'Cumple con objetivos del periodo',
    };
  };

  const updateStudentDraft = (
    student: Student,
    patch: Partial<{
      calificacionExamen: number;
      tareasEntregadasAlumno: number;
      checklistTareas: Record<string, 'entregada' | 'incompleta' | 'no_entregada'>;
      puntajesConceptos: Record<string, number>;
      calificacionManualActiva: boolean;
      calificacionManual: number;
      observaciones: string;
    }>
  ) => {
    const current = getStudentRowState(student);
    setDraftRows((prev) => ({
      ...prev,
      [current.key]: {
        calificacionExamen: patch.calificacionExamen ?? current.calificacionExamen,
        tareasEntregadasAlumno:
          patch.tareasEntregadasAlumno ?? current.tareasEntregadasAlumno,
        checklistTareas: patch.checklistTareas ?? current.checklistTareas,
        puntajesConceptos: patch.puntajesConceptos ?? current.puntajesConceptos,
        calificacionManualActiva:
          patch.calificacionManualActiva ?? current.calificacionManualActiva,
        calificacionManual: patch.calificacionManual ?? current.calificacionManual,
        observaciones: patch.observaciones ?? current.observaciones,
      },
    }));
  };

  const computeStudentEvaluationBreakdown = (student: Student) => {
    const row = getStudentRowState(student);
    const safeTotalTasks = Math.max(1, totalTasksByTeacher);
    const safeDeliveredTasks = Math.max(
      0,
      Math.min(safeTotalTasks, Number(row.tareasEntregadasAlumno) || 0)
    );
    const taskCompliancePct = Number(
      ((safeDeliveredTasks / safeTotalTasks) * 100).toFixed(1)
    );
    const taskScore10 = Number(((safeDeliveredTasks / safeTotalTasks) * 10).toFixed(1));
    const examScore10 = Math.max(0, Math.min(10, Number(row.calificacionExamen) || 0));

    let totalWeightedPctEarned = 0;
    const conceptBreakdowns: Array<{
      concept: EvaluationConceptItem;
      score10: number;
      weightedPct: number;
    }> = [];

    bitacoraConcepts.forEach((concept) => {
      let score10 = 0;
      if (concept.tipo === 'tareas') {
        score10 = taskScore10;
      } else if (concept.tipo === 'examen') {
        score10 = Math.max(
          0,
          Math.min(10, Number(row.puntajesConceptos[concept.id] ?? examScore10))
        );
      } else {
        score10 = Math.max(
          0,
          Math.min(10, Number(row.puntajesConceptos[concept.id] ?? examScore10))
        );
      }

      const weightedPct = Number(((score10 / 10) * concept.porcentaje).toFixed(2));
      totalWeightedPctEarned += weightedPct;
      conceptBreakdowns.push({
        concept,
        score10,
        weightedPct,
      });
    });

    const normalizedPct =
      bitacoraTotalPctSum > 0
        ? Math.min(
            100,
            Number(((totalWeightedPctEarned / bitacoraTotalPctSum) * 100).toFixed(1))
          )
        : 0;

    const calculatedGrade10 = Number((normalizedPct / 10).toFixed(1));
    const finalGrade10 = row.calificacionManualActiva
      ? Math.max(0, Math.min(10, Number(row.calificacionManual) || 0))
      : calculatedGrade10;

    return {
      row,
      safeTotalTasks,
      safeDeliveredTasks,
      taskCompliancePct,
      taskScore10,
      examScore10,
      conceptBreakdowns,
      porcentajeFinalObtenido: row.calificacionManualActiva
        ? Number((finalGrade10 * 10).toFixed(1))
        : normalizedPct,
      calculatedGrade10,
      finalGrade10,
    };
  };

  const handleSaveSingleStudentRecord = (student: Student) => {
    const calc = computeStudentEvaluationBreakdown(student);
    saveStudentEvaluation({
      id: calc.row.key,
      colegioId: activeCollege.id,
      estudianteId: student.id,
      materiaId: effectiveSubject?.id || 'general',
      periodicidad: bitacoraPeriodicity,
      periodoIndex: bitacoraPeriodIdx,
      calificacionExamen: calc.examScore10,
      totalTareasDocente: calc.safeTotalTasks,
      tareasEntregadasAlumno: calc.safeDeliveredTasks,
      checklistTareas: calc.row.checklistTareas,
      puntajesConceptos: calc.row.puntajesConceptos,
      calificacionManualActiva: calc.row.calificacionManualActiva,
      calificacionManual: calc.row.calificacionManual,
      porcentajeFinalObtenido: calc.porcentajeFinalObtenido,
      calificacionFinalPeriodo: calc.finalGrade10,
      observaciones: calc.row.observaciones,
    });
    showToast(
      `Registro guardado en "${bitacoraPeriodLabel}" para ${student.nombre} ${student.apellidos}: Calificación ${calc.finalGrade10.toFixed(1)}.`
    );
  };

  const handleToggleChecklistTask = (student: Student, taskIndex: number) => {
    const current = getStudentRowState(student);
    const key = `T${taskIndex}`;
    const prevState = current.checklistTareas[key] || 'entregada';
    const nextState: 'entregada' | 'incompleta' | 'no_entregada' =
      prevState === 'entregada'
        ? 'incompleta'
        : prevState === 'incompleta'
        ? 'no_entregada'
        : 'entregada';

    const nextChecklist = {
      ...current.checklistTareas,
      [key]: nextState,
    };

    let deliveredPoints = 0;
    for (let i = 1; i <= totalTasksByTeacher; i++) {
      const st = nextChecklist[`T${i}`] || 'no_entregada';
      if (st === 'entregada') deliveredPoints += 1;
      else if (st === 'incompleta') deliveredPoints += 0.5;
    }

    updateStudentDraft(student, {
      checklistTareas: nextChecklist,
      tareasEntregadasAlumno: Number(deliveredPoints.toFixed(1)),
    });
  };

  const currentNetworkMonthName = new Date().toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. CLEAN INSTITUTIONAL HEADER BANNER */}
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
              Módulo de Evaluaciones · Periodo {periodicityMeta.label}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" style={{ color: goldColor }} />
            <span>Evaluaciones: Conceptos de Evaluación y Mis Bitácoras</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-200 max-w-3xl">
            {activeCollege.nombre} · Configura el periodo (por mes completo o rango de fechas) y los conceptos de evaluación con tope del 100%, guárdalos y evalúa a tus alumnos en Mis Bitácoras.
          </p>
        </div>
      </div>

      {/* 2. FOLDER TABS (OUTSIDE THE BOX) & PERIODO SELECTOR BAR */}
      <div>
        {/* Requirement #2: Pestañas fuera del recuadro con diseño de pestañas de folder (Mis Bitácoras en primer lugar) */}
        <div className="flex items-end gap-1.5 pl-4 sm:pl-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('registros')}
            className={`relative flex items-center gap-2.5 px-6 py-3 rounded-t-2xl text-xs font-extrabold transition-all cursor-pointer select-none ${
              activeTab === 'registros'
                ? 'z-10 translate-y-[1px] shadow-xs'
                : 'opacity-85 hover:opacity-100'
            }`}
            style={
              activeTab === 'registros'
                ? {
                    backgroundColor: primaryColor,
                    color: '#FFFFFF',
                    borderTop: `4px solid ${goldColor}`,
                    borderLeft: `1px solid ${primaryColor}`,
                    borderRight: `1px solid ${primaryColor}`,
                  }
                : {
                    backgroundColor: '#E2E8F0',
                    color: primaryColor,
                    borderTop: `3px solid transparent`,
                    borderLeft: '1px solid #CBD5E1',
                    borderRight: '1px solid #CBD5E1',
                  }
            }
          >
            <FileSpreadsheet
              className="w-4 h-4"
              style={{ color: activeTab === 'registros' ? goldColor : primaryColor }}
            />
            <span>Mis Bitácoras</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={
                activeTab === 'registros'
                  ? { backgroundColor: goldColor, color: primaryColor }
                  : { backgroundColor: '#FFFFFF', color: primaryColor }
              }
            >
              {collegeSavedPeriods.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conceptos')}
            className={`relative flex items-center gap-2.5 px-6 py-3 rounded-t-2xl text-xs font-extrabold transition-all cursor-pointer select-none ${
              activeTab === 'conceptos'
                ? 'z-10 translate-y-[1px] shadow-xs'
                : 'opacity-85 hover:opacity-100'
            }`}
            style={
              activeTab === 'conceptos'
                ? {
                    backgroundColor: primaryColor,
                    color: '#FFFFFF',
                    borderTop: `4px solid ${goldColor}`,
                    borderLeft: `1px solid ${primaryColor}`,
                    borderRight: `1px solid ${primaryColor}`,
                  }
                : {
                    backgroundColor: '#E2E8F0',
                    color: primaryColor,
                    borderTop: `3px solid transparent`,
                    borderLeft: '1px solid #CBD5E1',
                    borderRight: '1px solid #CBD5E1',
                  }
            }
          >
            <Percent
              className="w-4 h-4"
              style={{ color: activeTab === 'conceptos' ? goldColor : primaryColor }}
            />
            <span>Conceptos de Evaluación</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={
                activeTab === 'conceptos'
                  ? { backgroundColor: goldColor, color: primaryColor }
                  : { backgroundColor: '#FFFFFF', color: primaryColor }
              }
            >
              {totalPercentageSum}%
            </span>
          </button>
        </div>

        {/* Folder Body Bar (Only rendered in Conceptos tab for Periodo + Date Mode selection) */}
        {activeTab === 'conceptos' && (
          <div
            className="bg-white rounded-2xl rounded-tl-none p-4 border shadow-2xs space-y-4"
            style={{ borderColor: `${primaryColor}35`, borderTopWidth: '2px', borderTopColor: primaryColor }}
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span>Periodo:</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(
                    [
                      'mensual',
                      'bimestral',
                      'trimestral',
                      'cuatrimestral',
                      'semestral',
                    ] as EvaluationPeriodicity[]
                  ).map((per) => {
                    const isSelected = activePeriodicity === per;
                    return (
                      <button
                        key={per}
                        type="button"
                        onClick={() => {
                          setCollegeEvaluationPeriodicity(activeCollege.id, per);
                          setSelectedPeriodIndex(1);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        style={
                          isSelected
                            ? { backgroundColor: primaryColor, color: '#FFFFFF' }
                            : { color: primaryColor }
                        }
                      >
                        {EVALUATION_PERIODICITY_CONFIG[per].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Toggle between Mes/Periodo Completo or Rango de Fechas */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDateSelectionMode('mes_completo')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    style={
                      dateSelectionMode === 'mes_completo'
                        ? { backgroundColor: primaryColor, color: '#FFFFFF' }
                        : { color: primaryColor }
                    }
                  >
                    {activePeriodicity === 'mensual' ? 'Mes Completo' : 'Periodo Completo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateSelectionMode('rango_fechas')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    style={
                      dateSelectionMode === 'rango_fechas'
                        ? { backgroundColor: primaryColor, color: '#FFFFFF' }
                        : { color: primaryColor }
                    }
                  >
                    Rango de Fechas
                  </button>
                </div>

                {/* Month / Period Dropdown ONLY when 'mes_completo' is selected */}
                {dateSelectionMode === 'mes_completo' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      {activePeriodicity === 'mensual' ? 'Mes a evaluar:' : 'Periodo a evaluar:'}
                    </span>
                    <select
                      value={selectedPeriodIndex}
                      onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                    >
                      {periodicityMeta.periodNames.map((pName, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {pName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Range Pickers ONLY when 'rango_fechas' is selected */}
                {dateSelectionMode === 'rango_fechas' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Del:</span>
                    <input
                      type="date"
                      value={rangeStartDate}
                      onChange={(e) => setRangeStartDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-700">Al:</span>
                    <input
                      type="date"
                      value={rangeEndDate}
                      onChange={(e) => setRangeEndDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Toast Banner */}
      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: CONCEPTOS DE EVALUACIÓN                                        */}
      {/* ===================================================================== */}
      {activeTab === 'conceptos' && (
        <div className="space-y-4">
          {/* 100% Distribution Meter Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>
                    Distribución del 100% en Conceptos — Periodo {periodicityMeta.label} ({currentPeriodSubName})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tope máximo de 100%: si agregas un concepto se resta equitativamente a los ya creados, y si eliminas uno se reparte el 100% automáticamente. También puedes ajustarlos manualmente.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`px-4 py-2 rounded-xl font-mono font-black text-sm border flex items-center gap-2 ${
                    rawTotalPercentageSum === 100
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {rawTotalPercentageSum === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Total: {totalPercentageSum}% / 100% (Tope)</span>
                </div>
              </div>
            </div>

            {/* Visual Stacked Progress Bar */}
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 p-0.5 gap-0.5">
              {collegeConcepts.map((c, idx) => {
                const colors = [
                  'bg-indigo-600',
                  'bg-emerald-600',
                  'bg-amber-500',
                  'bg-purple-600',
                  'bg-cyan-600',
                  'bg-rose-600',
                ];
                const barColor = colors[idx % colors.length];
                return (
                  <div
                    key={c.id}
                    style={{ width: `${Math.min(100, Math.max(0, c.porcentaje))}%` }}
                    className={`${barColor} h-full first:rounded-l-full last:rounded-r-full transition-all flex items-center justify-center text-[10px] font-bold text-white truncate px-1`}
                    title={`${c.nombre}: ${c.porcentaje}%`}
                  >
                    {c.porcentaje >= 8 ? `${c.nombre} (${c.porcentaje}%)` : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requirement #5: El botón Agregar Nuevo Periodo esté fuera de ese marco justo debajo de Distribución del 100% */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStartNewPeriod}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer active:scale-98"
              style={{
                backgroundColor: primaryColor,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <FolderPlus className="w-4 h-4" style={{ color: goldColor }} />
              <span>Agregar Nuevo Periodo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form to Add New Evaluation Concept */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 h-fit">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Agregar Concepto a Evaluar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    El % asignado se restará equitativamente a los conceptos existentes
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateConcept} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Concepto *
                  </label>
                  <input
                    type="text"
                    value={newConceptName}
                    onChange={(e) => setNewConceptName(e.target.value)}
                    placeholder="Ej. Examen Parcial, Tareas, Libreta, Proyecto..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Vinculación *
                  </label>
                  <select
                    value={newConceptKind}
                    onChange={(e) =>
                      setNewConceptKind(e.target.value as EvaluationConceptKind)
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="examen">Examen (Toma el valor obtenido en el examen)</option>
                    <option value="tareas">
                      Tareas (Calcula por Total de Tareas vs Registradas en Lista)
                    </option>
                    <option value="trabajo_clase">Trabajo en Clase / Sellos de Libreta</option>
                    <option value="proyecto">Proyecto / Prácticas de Laboratorio</option>
                    <option value="participacion">Participación y Exposición</option>
                    <option value="personalizado">Otro Concepto Personalizado</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {CONCEPT_KIND_LABELS[newConceptKind].description}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Porcentaje Asignado (Tope 100%) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={newConceptPct}
                      onChange={(e) =>
                        setNewConceptPct(
                          Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        )
                      }
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:outline-none"
                    />
                    <span className="font-bold text-slate-600">% (se resta a los actuales)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Descripción / Criterio (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newConceptDesc}
                    onChange={(e) => setNewConceptDesc(e.target.value)}
                    placeholder="Detalles de cómo se evalúa este concepto..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-4 h-4" style={{ color: goldColor }} />
                  <span>Crear Concepto de Evaluación</span>
                </button>
              </form>
            </div>

            {/* Right 2 Columns: List of Concepts with Manual Percentage Modification */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Conceptos del Periodo: {periodicityMeta.label} — {currentPeriodSubName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifica manualmente los porcentajes (tope máximo 100%) o elimina algún concepto para repartir el 100% automáticamente.
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
                  style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                >
                  Periodo: {periodicityMeta.label}
                </span>
              </div>

              <div className="space-y-3">
                {collegeConcepts.map((concept) => {
                  const kindMeta =
                    CONCEPT_KIND_LABELS[concept.tipo] || CONCEPT_KIND_LABELS.personalizado;
                  const otherSum = collegeConcepts
                    .filter((c) => c.id !== concept.id)
                    .reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);
                  const maxForThisConcept = Math.max(0, Number((100 - otherSum).toFixed(1)));

                  return (
                    <div
                      key={concept.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={concept.nombre}
                            onChange={(e) =>
                              handleUpdateConceptName(concept.id, e.target.value)
                            }
                            className="font-display font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:bg-white px-1 py-0.5 rounded focus:outline-none"
                          />
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${kindMeta.badgeBg}`}
                          >
                            {kindMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {concept.descripcion || kindMeta.description}
                        </p>
                      </div>

                      {/* Manual Percentage Input + Slider (capped so total <= 100%) */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-28 sm:w-36">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={concept.porcentaje}
                            onChange={(e) =>
                              handleManualPercentageChange(concept.id, e.target.value)
                            }
                            style={{ accentColor: primaryColor }}
                            className="w-full cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                          <input
                            type="number"
                            min={0}
                            max={maxForThisConcept}
                            step={0.5}
                            value={concept.porcentaje}
                            onChange={(e) =>
                              handleManualPercentageChange(concept.id, e.target.value)
                            }
                            className="w-14 text-right font-mono font-black text-sm text-slate-900 focus:outline-none"
                          />
                          <span className="font-mono font-bold text-xs text-slate-500 ml-1">
                            %
                          </span>
                        </div>

                        {collegeConcepts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteConceptAndRedistribute(concept.id)}
                            className="p-2 text-white rounded-xl transition-opacity hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: primaryColor }}
                            title="Eliminar concepto y repartir 100% automáticamente"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: goldColor }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Requirement #4: Botón de Guardar Periodo al final del formulario de conceptos */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Guarda este periodo ({periodicityMeta.label} — <strong>{currentPeriodSubName}</strong>) con sus {collegeConcepts.length} conceptos exclusivos.
                </div>
                <button
                  type="button"
                  onClick={handleSaveCurrentPeriod}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer active:scale-98"
                  style={{
                    backgroundColor: primaryColor,
                    borderBottom: `3px solid ${goldColor}`,
                  }}
                >
                  <Save className="w-4 h-4" style={{ color: goldColor }} />
                  <span>Guardar Periodo</span>
                </button>
              </div>

              {/* Requirement #1: Los periodos guardados aparezcan al final del formulario de conceptos */}
              <div className="pt-5 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    <h4 className="font-display font-bold text-sm text-slate-900">
                      Periodos Guardados ({collegeSavedPeriods.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Cada periodo conserva sus propios conceptos de evaluación
                  </span>
                </div>

                {collegeSavedPeriods.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Aún no hay periodos guardados. Configura los conceptos arriba y presiona <strong>"Guardar Periodo"</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {collegeSavedPeriods.map((sp) => {
                      const perLabel =
                        EVALUATION_PERIODICITY_CONFIG[sp.periodicidad]?.label ||
                        sp.periodicidad;
                      const isCurrentInEditor =
                        matchingSavedPeriodForCurrentSelection?.id === sp.id;

                      return (
                        <div
                          key={sp.id}
                          className="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3"
                          style={
                            isCurrentInEditor
                              ? {
                                  backgroundColor: `${primaryColor}08`,
                                  borderColor: primaryColor,
                                }
                              : {
                                  backgroundColor: '#F8FAFC',
                                  borderColor: '#E2E8F0',
                                }
                          }
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                                style={{
                                  backgroundColor: primaryColor,
                                  color: '#FFFFFF',
                                }}
                              >
                                {perLabel}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {sp.conceptos.length} conceptos · 100%
                              </span>
                            </div>

                            <div className="font-display font-bold text-xs text-slate-900">
                              {sp.periodoNombre}
                            </div>

                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {sp.conceptos.map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                                >
                                  {c.nombre}: <strong>{c.porcentaje}%</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => handleLoadSavedPeriodIntoEditor(sp)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Editar Conceptos
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSavedPeriodId(sp.id);
                                setActiveTab('registros');
                              }}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-opacity hover:opacity-90"
                              style={{
                                backgroundColor: goldColor,
                                color: primaryColor,
                              }}
                            >
                              Ver en Bitácora
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteEvaluationPeriod(sp.id);
                                showToast(
                                  `Periodo "${sp.periodoNombre}" eliminado.`
                                );
                              }}
                              className="p-1.5 rounded-xl text-white cursor-pointer transition-opacity hover:opacity-90"
                              style={{ backgroundColor: primaryColor }}
                              title="Eliminar periodo guardado"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: goldColor }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MIS BITÁCORAS (SELECTOR DESPLEGABLE Y FECHA DE LA RED)         */}
      {/* ===================================================================== */}
      {activeTab === 'registros' && (
        <div className="space-y-6">
          {/* Requirement #7 & #8: Periodos creados en forma de lista desplegable, auto-seleccionando según la fecha de la red */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Periodo de Evaluación en Bitácora
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                >
                  Sincronizado con fecha de red: {currentNetworkMonthName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Se muestra automáticamente la bitácora correspondiente a la fecha actual de la red o selecciona otro periodo creado de la lista desplegable.
              </p>
            </div>

            {collegeSavedPeriods.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={activeBitacoraPeriod?.id || ''}
                  onChange={(e) => setActiveSavedPeriodId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 text-xs font-extrabold focus:outline-none cursor-pointer min-w-[280px]"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {collegeSavedPeriods.map((sp) => {
                    const perLabel =
                      EVALUATION_PERIODICITY_CONFIG[sp.periodicidad]?.label ||
                      sp.periodicidad;
                    return (
                      <option key={sp.id} value={sp.id}>
                        {perLabel}: {sp.periodoNombre} ({sp.conceptos.length} conceptos)
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('conceptos')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Configurar y Guardar Periodo
              </button>
            )}
          </div>

          {/* =============================================================== */}
          {/* BITÁCORA DE DOCENTE: SOLO MUESTRA LOS CONCEPTOS DADOS DE ALTA   */}
          {/* =============================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>
                    Bitácora de Evaluación ({EVALUATION_PERIODICITY_CONFIG[bitacoraPeriodicity]?.label} —{' '}
                    <span style={{ color: primaryColor }}>{bitacoraPeriodLabel}</span>)
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conceptos dados de alta en este periodo:{' '}
                  <strong>
                    {bitacoraConcepts.length > 0
                      ? bitacoraConcepts.map((c) => `${c.nombre} (${c.porcentaje}%)`).join(' · ')
                      : 'Sin conceptos registrados aún'}
                  </strong>
                </p>
              </div>
            </div>

            {collegeStudents.length === 0 && bitacoraConcepts.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                Sin información registrada en Mis Bitácoras para este colegio aún. Configura primero los Conceptos de Evaluación y registra alumnos en el plantel.
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="text-white text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <th className="py-3 px-3">Alumno Asignado</th>

                    {/* Only render T1..Tn checklist if a 'tareas' concept is registered in this period (Req #2) */}
                    {hasTasksConceptInBitacora &&
                      Array.from({ length: totalTasksByTeacher }, (_, i) => (
                        <th key={i} className="py-3 px-1.5 text-center font-mono">
                          T{i + 1}
                        </th>
                      ))}

                    {/* Render ONLY the concepts registered in this period in their exact order */}
                    {bitacoraConcepts.map((c) => (
                      <th key={c.id} className="py-3 px-2.5 text-center">
                        {c.nombre}
                        <span
                          className="block text-[9px] font-mono"
                          style={{ color: goldColor }}
                        >
                          {c.porcentaje}%
                        </span>
                      </th>
                    ))}

                    <th className="py-3 px-2 text-center">% Total</th>
                    <th
                      className="py-3 px-3 text-center"
                      style={{ backgroundColor: goldColor, color: primaryColor }}
                    >
                      Calif. Final
                      <span className="block text-[9px] font-mono">
                        Auto / Manual
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {collegeStudents.map((student) => {
                    const calc = computeStudentEvaluationBreakdown(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={student.foto}
                              alt={student.nombre}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {student.apellidos}, {student.nombre}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {student.grado} "{student.grupo}" · {student.matricula}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Checklist boxes T1 .. Tn ONLY if 'tareas' concept is in the period */}
                        {hasTasksConceptInBitacora &&
                          Array.from({ length: totalTasksByTeacher }, (_, i) => {
                            const tIdx = i + 1;
                            const st =
                              calc.row.checklistTareas[`T${tIdx}`] ||
                              (tIdx <= calc.safeDeliveredTasks
                                ? 'entregada'
                                : 'no_entregada');
                            return (
                              <td key={tIdx} className="py-2 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChecklistTask(student, tIdx)}
                                  className="w-7 h-7 rounded-lg font-mono font-black text-xs transition-all cursor-pointer border"
                                  style={
                                    st === 'entregada'
                                      ? {
                                          backgroundColor: primaryColor,
                                          borderColor: primaryColor,
                                          color: '#FFFFFF',
                                        }
                                      : st === 'incompleta'
                                      ? {
                                          backgroundColor: `${goldColor}30`,
                                          borderColor: goldColor,
                                          color: primaryColor,
                                        }
                                      : {
                                          backgroundColor: '#F8FAFC',
                                          borderColor: '#CBD5E1',
                                          color: '#64748B',
                                        }
                                  }
                                  title={`Tarea ${tIdx}: ${st}`}
                                >
                                  {st === 'entregada'
                                    ? '✓'
                                    : st === 'incompleta'
                                    ? '½'
                                    : '✗'}
                                </button>
                              </td>
                            );
                          })}

                        {/* Render cells ONLY for the concepts registered in this period */}
                        {bitacoraConcepts.map((c) => {
                          if (c.tipo === 'tareas') {
                            const taskPointsEarned = (
                              (calc.taskScore10 / 10) *
                              c.porcentaje
                            ).toFixed(1);
                            return (
                              <td
                                key={c.id}
                                className="py-2.5 px-2.5 text-center font-mono bg-slate-50/60"
                              >
                                <div className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300">
                                  <input
                                    type="number"
                                    min={0}
                                    max={calc.safeTotalTasks}
                                    step={0.5}
                                    value={calc.safeDeliveredTasks}
                                    onChange={(e) =>
                                      updateStudentDraft(student, {
                                        tareasEntregadasAlumno: Number(e.target.value),
                                      })
                                    }
                                    className="w-10 text-center font-mono font-black text-xs text-slate-900 focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-500">
                                    /{calc.safeTotalTasks}
                                  </span>
                                </div>
                                <span
                                  className="block text-[10px] font-bold mt-0.5"
                                  style={{ color: primaryColor }}
                                >
                                  {calc.taskCompliancePct}% · {taskPointsEarned}%
                                </span>
                              </td>
                            );
                          }

                          const val =
                            c.tipo === 'examen'
                              ? calc.row.puntajesConceptos[c.id] ?? calc.row.calificacionExamen
                              : calc.row.puntajesConceptos[c.id] ?? calc.examScore10;
                          const pts = ((Number(val) / 10) * c.porcentaje).toFixed(1);

                          return (
                            <td key={c.id} className="py-2.5 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={val}
                                onChange={(e) => {
                                  const numVal = Math.max(
                                    0,
                                    Math.min(10, Number(e.target.value) || 0)
                                  );
                                  updateStudentDraft(student, {
                                    calificacionExamen:
                                      c.tipo === 'examen'
                                        ? numVal
                                        : calc.row.calificacionExamen,
                                    puntajesConceptos: {
                                      ...calc.row.puntajesConceptos,
                                      [c.id]: numVal,
                                    },
                                  });
                                }}
                                className="w-14 px-1.5 py-1 text-center font-mono font-black text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                              />
                              <span
                                className="block text-[10px] font-mono font-bold mt-0.5"
                                style={{ color: primaryColor }}
                              >
                                {pts}%
                              </span>
                            </td>
                          );
                        })}

                        {/* Porcentaje Total Obtenido */}
                        <td className="py-2.5 px-2 text-center font-mono">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-black text-slate-800">
                            {calc.porcentajeFinalObtenido}%
                          </span>
                        </td>

                        {/* Calificación Final (Automática o Manual) */}
                        <td className="py-2.5 px-3 text-center bg-amber-50/40">
                          {calc.row.calificacionManualActiva ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={calc.row.calificacionManual}
                                onChange={(e) =>
                                  updateStudentDraft(student, {
                                    calificacionManual: Number(e.target.value),
                                  })
                                }
                                className="w-14 px-1.5 py-1 text-center font-mono font-black text-xs bg-white border-2 rounded-lg text-slate-950"
                                style={{ borderColor: primaryColor }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentDraft(student, {
                                    calificacionManualActiva: false,
                                  })
                                }
                                className="px-1.5 py-0.5 rounded text-[10px] text-white cursor-pointer font-bold"
                                style={{ backgroundColor: primaryColor }}
                                title="Volver a cálculo automático"
                              >
                                Auto
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span
                                className="px-2.5 py-1 rounded-lg font-mono font-black text-sm"
                                style={{
                                  backgroundColor: `${goldColor}25`,
                                  color: primaryColor,
                                }}
                              >
                                {calc.finalGrade10.toFixed(1)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentDraft(student, {
                                    calificacionManualActiva: true,
                                    calificacionManual: calc.finalGrade10,
                                  })
                                }
                                className="p-1.5 rounded-lg text-white cursor-pointer"
                                style={{ backgroundColor: primaryColor }}
                                title="Agregar o modificar calificación manualmente"
                              >
                                <Edit3 className="w-3 h-3" style={{ color: goldColor }} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Guardar (Styled with College Admin Color) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleStudentRecord(student)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shadow-2xs cursor-pointer transition-opacity hover:opacity-95"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Save className="w-3 h-3" style={{ color: goldColor }} />
                              <span>Guardar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {collegeStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={4 + bitacoraConcepts.length + (hasTasksConceptInBitacora ? totalTasksByTeacher : 0)}
                        className="py-8 text-center text-slate-400 text-xs"
                      >
                        No hay alumnos registrados en este colegio aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
