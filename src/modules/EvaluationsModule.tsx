import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  EvaluationConceptItem,
  EvaluationConceptKind,
  EvaluationSavedPeriod,
  Student,
  Subject,
  SchoolCycle,
} from '../types';

interface EvaluationsModuleProps {
  onNavigateTab?: (tab: string) => void;
}
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
  BookOpen,
  Users,
  ClipboardList,
} from 'lucide-react';
import { getGradePeriodsForModalidad } from '../utils/reportCardPdfGenerator';

const CONCEPT_KIND_LABELS: Record<
  EvaluationConceptKind,
  { label: string; badgeBg: string; description: string }
> = {
  examen: {
    label: 'Examen Publicado',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description:
      'Se enlaza automáticamente con los exámenes publicados de las diferentes materias dentro del periodo.',
  },
  tareas: {
    label: 'Tareas o Proyectos Publicados',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description:
      'Se enlaza automáticamente con las tareas o proyectos publicados por el docente vs las registradas por el alumno en el periodo.',
  },
  trabajo_clase: {
    label: 'Captura Manual',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    description:
      'Permite capturar manualmente en la Bitácora la cantidad N obtenida por el alumno y calcula su porcentaje automáticamente.',
  },
  proyecto: {
    label: 'Captura Manual',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    description:
      'Permite capturar manualmente en la Bitácora la cantidad N obtenida por el alumno y calcula su porcentaje automáticamente.',
  },
  participacion: {
    label: 'Captura Manual',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    description:
      'Permite capturar manualmente en la Bitácora la cantidad N obtenida por el alumno y calcula su porcentaje automáticamente.',
  },
  personalizado: {
    label: 'Captura Manual',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    description:
      'Permite capturar manualmente en la Bitácora la cantidad N obtenida por el alumno y calcula su porcentaje automáticamente.',
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

const getDefaultDateRangeForPeriod = (
  periodicidad: EvaluationPeriodicity,
  periodoIndex: number
): { fechaInicio: string; fechaFin: string } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0..11
  const cycleStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  const cycleEndYear = cycleStartYear + 1;

  const formatMonthBounds = (year: number, month0: number) => {
    const mStr = String(month0 + 1).padStart(2, '0');
    const lastDay = new Date(year, month0 + 1, 0).getDate();
    return {
      start: `${year}-${mStr}-01`,
      end: `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`,
    };
  };

  if (periodicidad === 'mensual') {
    // 1=Sep(8), 2=Oct(9), 3=Nov(10), 4=Dec(11), 5=Jan(0)..10=Jun(5)
    const month0 = periodoIndex <= 4 ? periodoIndex + 7 : periodoIndex - 5;
    const yr = periodoIndex <= 4 ? cycleStartYear : cycleEndYear;
    const bounds = formatMonthBounds(yr, Math.max(0, Math.min(11, month0)));
    return { fechaInicio: bounds.start, fechaFin: bounds.end };
  }

  if (periodicidad === 'bimestral') {
    const bimMap: Record<number, { sm: number; sy: number; em: number; ey: number }> = {
      1: { sm: 8, sy: cycleStartYear, em: 9, ey: cycleStartYear },
      2: { sm: 10, sy: cycleStartYear, em: 11, ey: cycleStartYear },
      3: { sm: 0, sy: cycleEndYear, em: 1, ey: cycleEndYear },
      4: { sm: 2, sy: cycleEndYear, em: 3, ey: cycleEndYear },
      5: { sm: 4, sy: cycleEndYear, em: 5, ey: cycleEndYear },
    };
    const cfg = bimMap[periodoIndex] || bimMap[1];
    const bStart = formatMonthBounds(cfg.sy, cfg.sm);
    const bEnd = formatMonthBounds(cfg.ey, cfg.em);
    return { fechaInicio: bStart.start, fechaFin: bEnd.end };
  }

  if (periodicidad === 'trimestral' || periodicidad === 'cuatrimestral') {
    const trimMap: Record<number, { sm: number; sy: number; em: number; ey: number }> = {
      1: { sm: 8, sy: cycleStartYear, em: 10, ey: cycleStartYear },
      2: { sm: 11, sy: cycleStartYear, em: 2, ey: cycleEndYear },
      3: { sm: 3, sy: cycleEndYear, em: 5, ey: cycleEndYear },
    };
    const cfg = trimMap[periodoIndex] || trimMap[1];
    const bStart = formatMonthBounds(cfg.sy, cfg.sm);
    const bEnd = formatMonthBounds(cfg.ey, cfg.em);
    return { fechaInicio: bStart.start, fechaFin: bEnd.end };
  }

  // semestral
  if (periodoIndex === 1) {
    const bStart = formatMonthBounds(cycleStartYear, 7);
    const bEnd = formatMonthBounds(cycleEndYear, 0);
    return { fechaInicio: bStart.start, fechaFin: bEnd.end };
  }
  const bStart = formatMonthBounds(cycleEndYear, 1);
  const bEnd = formatMonthBounds(cycleEndYear, 6);
  return { fechaInicio: bStart.start, fechaFin: bEnd.end };
};

export const EvaluationsModule: React.FC<EvaluationsModuleProps> = ({ onNavigateTab }) => {
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
    schoolCycles,
    addEvaluationConcept,
    updateEvaluationConcept,
    deleteEvaluationConcept,
    updateEvaluationConceptPercentages,
    saveEvaluationPeriod,
    deleteEvaluationPeriod,
    saveStudentEvaluation,
    setCollegeEvaluationPeriodicity,
  } = useApp();

  // College cycles
  const collegeCycles = useMemo(() => {
    if (!activeCollege) return [];
    return (schoolCycles || []).filter((c) => c.colegioId === activeCollege.id);
  }, [schoolCycles, activeCollege]);

  const activeCycle = useMemo(() => {
    return collegeCycles.find((c) => c.activo) || collegeCycles[0] || null;
  }, [collegeCycles]);

  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => activeCycle?.id || '');

  useEffect(() => {
    if (!selectedCycleId || !collegeCycles.some((c) => c.id === selectedCycleId)) {
      if (activeCycle?.id) {
        setSelectedCycleId(activeCycle.id);
      } else if (collegeCycles[0]?.id) {
        setSelectedCycleId(collegeCycles[0].id);
      }
    }
  }, [collegeCycles, activeCycle, selectedCycleId]);

  const selectedCycleObj = useMemo(() => {
    return collegeCycles.find((c) => c.id === selectedCycleId) || activeCycle;
  }, [collegeCycles, selectedCycleId, activeCycle]);

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
  const [newConceptTotalMeta, setNewConceptTotalMeta] = useState<number>(10);
  const [newConceptDesc, setNewConceptDesc] = useState('');

  // Overrides for Total / Base N of manual concepts in Mis Bitácoras (keyed by `${periodId}__${conceptId}`)
  const [conceptTotalMetaOverrides, setConceptTotalMetaOverrides] = useState<
    Record<string, number>
  >({});

  // Selected Saved Period in "Mis Bitácoras"
  const [activeSavedPeriodId, setActiveSavedPeriodId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>('');

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

  const isTeacherRole = currentUser.rol === 'docente';

  // Ficha del Docente actual en el módulo Docentes (priorizando coincidencia exacta por ID, nombre o usuarioLogin antes de correo)
  const currentTeacherRecord = useMemo(() => {
    if (!isTeacherRole) return null;
    const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
    const expectedTchId = currentUser.id.replace(/^usr-/, '');
    const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
    const usrEmail = (currentUser.correo || '').trim().toLowerCase();
    const usrName = (currentUser.nombre || '').trim().toLowerCase();

    // 1. Coincidencia exacta por ID
    const byId = collegeTeachers.find(
      (t) => t.id === currentUser.id || t.id === expectedTchId
    );
    if (byId) return byId;

    // 2. Coincidencia exacta por Nombre
    if (usrName) {
      const byName = collegeTeachers.find(
        (t) => (t.nombre || '').trim().toLowerCase() === usrName
      );
      if (byName) return byName;
    }

    // 3. Coincidencia por Usuario de Login (ej. jluna8514 -> Juan Luna)
    if (usrLogin) {
      const byLogin = collegeTeachers.find((t) => {
        const generatedFromTch = (t.nombre || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const parts = generatedFromTch.split(/\s+/).filter(Boolean);
        const candidatePrefix =
          parts.length >= 2 ? `${parts[0][0]}${parts[1]}` : parts[0] || '';
        return Boolean(candidatePrefix && usrLogin.startsWith(candidatePrefix));
      });
      if (byLogin) return byLogin;
    }

    // 4. Respaldo por correo únicamente si solo un docente tiene ese correo
    if (usrEmail) {
      const emailMatches = collegeTeachers.filter(
        (t) => (t.correo || '').trim().toLowerCase() === usrEmail
      );
      if (emailMatches.length === 1) return emailMatches[0];
    }

    return null;
  }, [isTeacherRole, teachers, activeCollege.id, currentUser]);

  // Identificadores válidos del usuario/docente actual para aislar sus propios periodos, bitácoras y exámenes
  const currentOwnerIds = useMemo(() => {
    const ids = new Set<string>();
    if (currentUser.id) {
      ids.add(currentUser.id.trim().toLowerCase());
      ids.add(currentUser.id.replace(/^usr-/, '').trim().toLowerCase());
    }
    if (currentUser.usuarioLogin) {
      ids.add(currentUser.usuarioLogin.trim().toLowerCase());
    }
    if (currentTeacherRecord?.id) {
      ids.add(currentTeacherRecord.id.trim().toLowerCase());
      ids.add(`usr-${currentTeacherRecord.id}`.trim().toLowerCase());
    }
    return ids;
  }, [currentUser, currentTeacherRecord]);

  const currentOwnerNames = useMemo(() => {
    const names = new Set<string>();
    if (currentUser.nombre) names.add(currentUser.nombre.trim().toLowerCase());
    if (currentTeacherRecord?.nombre) {
      names.add(currentTeacherRecord.nombre.trim().toLowerCase());
    }
    return names;
  }, [currentUser.nombre, currentTeacherRecord]);

  const normalizeGroupToken = (val?: string) =>
    (val || '')
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const isPhantomSubjectName = (name?: string | null) => {
    const low = String(name || '').trim().toLowerCase();
    return (
      !low ||
      low === 'materia asignada' ||
      low === 'materia general' ||
      low === 'evaluación general' ||
      low === 'evaluacion general' ||
      low === 'por asignar' ||
      low === 'sin materia'
    );
  };

  // Materias asignadas exclusivamente a este docente (o del colegio para directivos/admin)
  const collegeSubjects: Subject[] = useMemo(() => {
    const allInCollege = subjects.filter(
      (s) => s.colegioId === activeCollege.id && !isPhantomSubjectName(s.nombre)
    );
    if (isTeacherRole) {
      if (!currentTeacherRecord) return [];
      const assignedNames = (currentTeacherRecord.materias || [])
        .map((m) => m.trim())
        .filter((m) => Boolean(m) && !isPhantomSubjectName(m));
      const assignedNamesLower = new Set(assignedNames.map((m) => m.toLowerCase()));

      // Si el docente tiene materias explícitamente asignadas en su ficha (ej. Inglés),
      // usar ÚNICAMENTE esas materias asignadas a su usuario.
      const matchedFromCatalog = allInCollege.filter((s) => {
        const subNameLow = s.nombre.trim().toLowerCase();
        if (assignedNamesLower.size > 0) {
          return assignedNamesLower.has(subNameLow);
        }
        return (
          s.docenteId === currentTeacherRecord.id ||
          (s.docenteNombre &&
            s.docenteNombre.trim().toLowerCase() ===
              currentTeacherRecord.nombre.trim().toLowerCase())
        );
      });

      const uniqueMap = new Map<string, Subject>();
      matchedFromCatalog.forEach((s) => {
        const key = s.nombre.trim().toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, s);
        }
      });

      assignedNames.forEach((matName, idx) => {
        const key = matName.toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            id: `sub-tch-${currentTeacherRecord.id}-${idx}`,
            colegioId: activeCollege.id,
            nombre: matName,
            clave: `MAT-${idx + 1}`,
            nivel: currentTeacherRecord.nivel || 'Primaria',
            grado: (currentTeacherRecord.grupos && currentTeacherRecord.grupos[0]) || 'General',
            creditos: 8,
            horasSemanales: 5,
            docenteId: currentTeacherRecord.id,
            docenteNombre: currentTeacherRecord.nombre,
          });
        }
      });

      return Array.from(uniqueMap.values());
    }

    return allInCollege;
  }, [subjects, activeCollege.id, isTeacherRole, currentTeacherRecord]);

  const teacherAssignedSubjectNamesLower = useMemo(
    () => new Set(collegeSubjects.map((s) => s.nombre.trim().toLowerCase())),
    [collegeSubjects]
  );

  // Periodos de evaluación guardados independientes por usuario/docente (filtrados por ciclo escolar)
  const collegeSavedPeriods = useMemo(() => {
    return evaluationSavedPeriods.filter((p) => {
      if (p.colegioId !== activeCollege.id) return false;
      if (selectedCycleId && p.cicloId && p.cicloId !== selectedCycleId) return false;
      if (!p.cicloId && selectedCycleId !== activeCycle?.id) return false;
      const pDocId = (p.docenteId || '').trim().toLowerCase();
      const pDocName = (p.docenteNombre || '').trim().toLowerCase();
      // El periodo debe pertenecer explícitamente a este usuario/docente
      if (pDocId && currentOwnerIds.has(pDocId)) return true;
      if (pDocName && currentOwnerNames.has(pDocName)) return true;
      // Verificar si los conceptos internos fueron creados por este usuario
      if (
        !pDocId &&
        !pDocName &&
        Array.isArray(p.conceptos) &&
        p.conceptos.length > 0 &&
        p.conceptos.every(
          (c) => c.docenteId && currentOwnerIds.has(c.docenteId.trim().toLowerCase())
        )
      ) {
        return true;
      }
      return false;
    });
  }, [
    evaluationSavedPeriods,
    activeCollege.id,
    selectedCycleId,
    activeCycle?.id,
    currentOwnerIds,
    currentOwnerNames,
  ]);

  // Network date detection for automatic selection in Mis Bitácoras
  const networkMatchedPeriod = useMemo(() => {
    if (collegeSavedPeriods.length === 0) return null;
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const currentMonthIdx = now.getMonth();
    const monthKeywords = SPANISH_MONTH_KEYWORDS[currentMonthIdx] || [];

    const byDateRange = collegeSavedPeriods.find(
      (p) => p.fechaInicio && p.fechaFin && todayIso >= p.fechaInicio && todayIso <= p.fechaFin
    );
    if (byDateRange) return byDateRange;

    const byMonthName = collegeSavedPeriods.find((p) =>
      monthKeywords.some((kw) => p.periodoNombre.toLowerCase().includes(kw))
    );
    if (byMonthName) return byMonthName;

    return collegeSavedPeriods[collegeSavedPeriods.length - 1];
  }, [collegeSavedPeriods]);

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
    } else if (collegeSavedPeriods.length === 0 && activeSavedPeriodId) {
      setActiveSavedPeriodId('');
    }
  }, [collegeSavedPeriods, activeSavedPeriodId, networkMatchedPeriod]);

  const activeBitacoraPeriod: EvaluationSavedPeriod | null = useMemo(() => {
    if (collegeSavedPeriods.length === 0) return null;
    return (
      collegeSavedPeriods.find((p) => p.id === activeSavedPeriodId) ||
      networkMatchedPeriod ||
      collegeSavedPeriods[0]
    );
  }, [collegeSavedPeriods, activeSavedPeriodId, networkMatchedPeriod]);

  useEffect(() => {
    if (collegeSubjects.length > 0) {
      if (!selectedSubjectId || !collegeSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(collegeSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [collegeSubjects, selectedSubjectId]);

  const effectiveSubject: Subject | undefined = useMemo(() => {
    if (collegeSubjects.length === 0) return undefined;
    return collegeSubjects.find((s) => s.id === selectedSubjectId) || collegeSubjects[0];
  }, [collegeSubjects, selectedSubjectId]);

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
      nombre: 'Examen Publicado',
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
      nombre: 'Tareas o Proyectos Publicados',
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
      nombre: 'Participación y Trabajo en Clase',
      descripcion: CONCEPT_KIND_LABELS.personalizado.description,
      tipo: 'personalizado',
      porcentaje: 30,
      totalEsperado: 10,
      periodicidad: activePeriodicity,
      periodoIndex: pIdx,
      periodoNombre: pName,
      activo: true,
    },
  ];

  // Key identifying the currently selected period in the editor (isolated per user)
  const currentEditorPeriodKey =
    dateSelectionMode === 'rango_fechas'
      ? `${activeCollege.id}__${currentUser.id}__${activePeriodicity}__rango_fechas__${rangeStartDate}_${rangeEndDate}`
      : `${activeCollege.id}__${currentUser.id}__${activePeriodicity}__P${selectedPeriodIndex}__mes_completo__mes`;

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
    // 3. Si aún no se han configurado conceptos para este periodo, iniciar vacío (sin datos predefinidos)
    return [];
  }, [
    periodConceptsDraftMap,
    currentEditorPeriodKey,
    matchingSavedPeriodForCurrentSelection,
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

  // Tareas y Exámenes dados de alta exclusivamente por el docente actual y de sus materias asignadas
  const allTeacherTasksExams = useMemo(() => {
    return tasksExams.filter((t) => {
      if (t.colegioId !== activeCollege.id) return false;
      const itemDocId = (t.docenteId || '').trim().toLowerCase();
      const itemDocName = (t.docenteNombre || '').trim().toLowerCase();
      const matchesOwnerId = Boolean(itemDocId && currentOwnerIds.has(itemDocId));
      const matchesOwnerName = Boolean(itemDocName && currentOwnerNames.has(itemDocName));
      if (!matchesOwnerId && !matchesOwnerName) return false;

      if (isTeacherRole) {
        // Además, verificar que la materia de la tarea/examen corresponda a las materias asignadas a este docente
        const itemSub = (t.materia || '').trim().toLowerCase();
        if (itemSub && teacherAssignedSubjectNamesLower.size > 0) {
          const matchesAssignedSubject = Array.from(teacherAssignedSubjectNamesLower).some(
            (assignedSub) =>
              itemSub === assignedSub ||
              itemSub.includes(assignedSub) ||
              assignedSub.includes(itemSub)
          );
          if (!matchesAssignedSubject) return false;
        }
      }
      return true;
    });
  }, [
    tasksExams,
    activeCollege.id,
    isTeacherRole,
    currentOwnerIds,
    currentOwnerNames,
    teacherAssignedSubjectNamesLower,
  ]);

  const matchesActivePeriod = (t: (typeof allTeacherTasksExams)[number]) => {
    if (!activeBitacoraPeriod) return true;
    // 1. Explicit link to this saved period
    if (t.savedPeriodId) {
      return t.savedPeriodId === activeBitacoraPeriod.id;
    }
    if (t.periodoNombre && t.periodoNombre === activeBitacoraPeriod.periodoNombre) {
      return true;
    }
    // 2. Date range of the evaluation period (explicit or derived from the selected month/period)
    const fallbackBounds = getDefaultDateRangeForPeriod(
      activeBitacoraPeriod.periodicidad,
      activeBitacoraPeriod.periodoIndex
    );
    const startRange = activeBitacoraPeriod.fechaInicio || fallbackBounds.fechaInicio;
    const endRange = activeBitacoraPeriod.fechaFin || fallbackBounds.fechaFin;
    const rawDate = (t.fechaLimite || t.fechaHabilitacion || '').trim().split(' ')[0];
    if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && startRange && endRange) {
      return rawDate >= startRange && rawDate <= endRange;
    }
    return true;
  };

  const doesItemMatchGroup = (
    item: (typeof allTeacherTasksExams)[number],
    targetGroupLabel: string
  ) => {
    const normTarget = normalizeGroupToken(targetGroupLabel);
    if (!normTarget) return true;
    const assignedList =
      Array.isArray(item.gruposAsignados) && item.gruposAsignados.length > 0
        ? item.gruposAsignados
        : (item.gradoGrupo || '').split(',').map((g) => g.trim()).filter(Boolean);
    if (assignedList.length === 0) return true;
    return assignedList.some((grp) => {
      const normItemGrp = normalizeGroupToken(grp);
      return (
        normItemGrp === normTarget ||
        normItemGrp.replace(/\s+/g, '') === normTarget.replace(/\s+/g, '')
      );
    });
  };

  const getTasksForGroupAndSubject = (groupLabel: string, subjectName?: string) => {
    const normSub = (subjectName || '').trim().toLowerCase();

    return allTeacherTasksExams.filter((t) => {
      if (t.tipo !== 'tarea' && t.tipo !== 'proyecto') return false;
      if (!matchesActivePeriod(t)) return false;
      const itemSub = (t.materia || '').trim().toLowerCase();

      if (isTeacherRole && teacherAssignedSubjectNamesLower.size > 0 && itemSub) {
        const isAssignedToThisTeacher = Array.from(teacherAssignedSubjectNamesLower).some(
          (assignedSub) =>
            itemSub === assignedSub ||
            itemSub.includes(assignedSub) ||
            assignedSub.includes(itemSub)
        );
        if (!isAssignedToThisTeacher) return false;
      }

      const subjectMatches =
        !normSub || !itemSub || itemSub === normSub || itemSub.includes(normSub) || normSub.includes(itemSub);
      const groupMatches = doesItemMatchGroup(t, groupLabel);

      return subjectMatches && groupMatches;
    });
  };

  const getExamsForGroupAndSubject = (groupLabel: string, subjectName?: string) => {
    const normSub = (subjectName || '').trim().toLowerCase();

    return allTeacherTasksExams.filter((t) => {
      if (t.tipo !== 'examen') return false;
      if (!matchesActivePeriod(t)) return false;
      const itemSub = (t.materia || '').trim().toLowerCase();

      if (isTeacherRole && teacherAssignedSubjectNamesLower.size > 0) {
        if (!itemSub) return false;
        const isAssignedToThisTeacher = Array.from(teacherAssignedSubjectNamesLower).some(
          (assignedSub) =>
            itemSub === assignedSub ||
            itemSub.includes(assignedSub) ||
            assignedSub.includes(itemSub)
        );
        if (!isAssignedToThisTeacher) return false;
      }

      const subjectMatches =
        !normSub || !itemSub || itemSub === normSub || itemSub.includes(normSub) || normSub.includes(itemSub);
      const groupMatches = doesItemMatchGroup(t, groupLabel);

      return subjectMatches && groupMatches;
    });
  };

  // Grupos asignados al docente (o grupos del colegio para directivos/admin)
  const assignedBitacoraGroups = useMemo(() => {
    const allStudentsInCollege = students.filter(
      (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
    );

    const doesStudentMatchGroup = (st: Student, groupLabel: string, requiredLevel?: string) => {
      if (requiredLevel && st.nivel && st.nivel.toLowerCase() !== requiredLevel.toLowerCase()) {
        return false;
      }
      const normTarget = normalizeGroupToken(groupLabel);
      const stGradeGroup = normalizeGroupToken(`${st.grado} ${st.grupo}`);
      const stFullGroup = normalizeGroupToken(`${st.nivel || ''} ${st.grado} ${st.grupo}`);
      const stCompact = normalizeGroupToken(`${st.grado}${st.grupo}`);
      const normTargetCompact = normTarget.replace(/\s+/g, '');
      return (
        stGradeGroup === normTarget ||
        stFullGroup === normTarget ||
        stCompact === normTargetCompact
      );
    };

    if (isTeacherRole) {
      if (!currentTeacherRecord) return [];
      const teacherGroups = Array.from(
        new Set((currentTeacherRecord.grupos || []).map((g) => g.trim()).filter(Boolean))
      );
      if (teacherGroups.length === 0) return [];

      return teacherGroups.map((grpLabel) => {
        const groupStudents = allStudentsInCollege.filter((st) =>
          doesStudentMatchGroup(st, grpLabel, currentTeacherRecord.nivel)
        );
        return {
          groupLabel: grpLabel,
          nivel: currentTeacherRecord.nivel || groupStudents[0]?.nivel || 'Primaria',
          students: groupStudents,
        };
      });
    }

    // Para roles administrativos/directivos/coordinador: agrupar por los grupos existentes de los alumnos
    const groupMap = new Map<string, { groupLabel: string; nivel: string; students: Student[] }>();
    allStudentsInCollege.forEach((st) => {
      const grpLabel = `${st.grado} ${st.grupo}`.trim();
      const key = `${st.nivel || 'General'}__${grpLabel}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupLabel: grpLabel,
          nivel: st.nivel || 'Primaria',
          students: [],
        });
      }
      groupMap.get(key)!.students.push(st);
    });

    return Array.from(groupMap.values());
  }, [students, activeCollege.id, isTeacherRole, currentTeacherRecord]);

  useEffect(() => {
    if (assignedBitacoraGroups.length > 0) {
      const exists = assignedBitacoraGroups.some(
        (g) => `${g.nivel}-${g.groupLabel}` === selectedGroupKey
      );
      if (!selectedGroupKey || !exists) {
        const first = assignedBitacoraGroups[0];
        setSelectedGroupKey(`${first.nivel}-${first.groupLabel}`);
      }
    } else {
      setSelectedGroupKey('');
    }
  }, [assignedBitacoraGroups, selectedGroupKey]);

  const activeGroupBlock = useMemo(() => {
    if (assignedBitacoraGroups.length === 0) return null;
    return (
      assignedBitacoraGroups.find(
        (g) => `${g.nivel}-${g.groupLabel}` === selectedGroupKey
      ) || assignedBitacoraGroups[0]
    );
  }, [assignedBitacoraGroups, selectedGroupKey]);

  const collegeStudents = useMemo(
    () => assignedBitacoraGroups.flatMap((g) => g.students),
    [assignedBitacoraGroups]
  );

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

  const handleUpdateConceptTotalMeta = (conceptId: string, rawTotal: string) => {
    const validTotal = Math.max(1, Number(rawTotal) || 1);
    setCurrentPeriodConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, totalMeta: validTotal } : c))
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
    if (/asistencia/i.test(newConceptName.trim())) {
      showToast(
        'Las asistencias no se evalúan como concepto de calificación. El control de asistencia se lleva únicamente en el módulo Asistencia.'
      );
      return;
    }

    const clampedPct = Math.max(0, Math.min(100, Number(newConceptPct) || 0));
    const safeTotalMeta =
      newConceptKind !== 'examen' && newConceptKind !== 'tareas'
        ? Math.max(1, Number(newConceptTotalMeta) || 10)
        : undefined;
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
      totalMeta: safeTotalMeta,
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
    const computedBounds =
      dateSelectionMode === 'rango_fechas'
        ? { fechaInicio: rangeStartDate, fechaFin: rangeEndDate }
        : getDefaultDateRangeForPeriod(activePeriodicity, selectedPeriodIndex);

    const ownerDocId = currentTeacherRecord?.id || currentUser.id;
    const ownerDocName = currentTeacherRecord?.nombre || currentUser.nombre;

    const saved = saveEvaluationPeriod({
      id: matchingSavedPeriodForCurrentSelection?.id,
      colegioId: activeCollege.id,
      cicloId: selectedCycleId,
      docenteId: ownerDocId,
      docenteNombre: ownerDocName,
      periodicidad: activePeriodicity,
      periodoIndex: selectedPeriodIndex,
      periodoNombre: currentPeriodSubName,
      modoSeleccionFecha: dateSelectionMode,
      fechaInicio: computedBounds.fechaInicio,
      fechaFin: computedBounds.fechaFin,
      conceptos: collegeConcepts,
    });
    setActiveSavedPeriodId(saved.id);
    showToast(
      `¡Periodo "${periodicityMeta.label} — ${currentPeriodSubName}" (${computedBounds.fechaInicio} al ${computedBounds.fechaFin}) guardado en tu usuario con sus ${collegeConcepts.length} conceptos exclusivos!`
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
        ? `${activeCollege.id}__${currentUser.id}__${period.periodicidad}__rango_fechas__${period.fechaInicio || rangeStartDate}_${period.fechaFin || rangeEndDate}`
        : `${activeCollege.id}__${currentUser.id}__${period.periodicidad}__P${period.periodoIndex}__mes_completo__mes`;

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

  const getActiveConceptsForGroup = (groupTasksCount: number, groupExamsCount: number) => {
    return bitacoraConcepts.filter((c) => {
      if (/asistencia/i.test(c.nombre || '')) return false;
      if (c.tipo === 'tareas') return groupTasksCount > 0;
      return true;
    });
  };

  // Helper to resolve total reactivos (questions/points) for an exam item
  const getExamTotalReactivos = (examItem: (typeof allTeacherTasksExams)[number]): number => {
    if (Array.isArray(examItem.preguntasExamen) && examItem.preguntasExamen.length > 0) {
      return examItem.preguntasExamen.length;
    }
    if (examItem.puntosMaximos && examItem.puntosMaximos > 0 && examItem.puntosMaximos <= 100) {
      return examItem.puntosMaximos;
    }
    return 10;
  };

  const ownerScopeKey = currentTeacherRecord?.id || currentUser.id;

  const getStudentRowState = (
    student: Student,
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams)
  ) => {
    const groupTasksCount = groupTasks.length;
    const entryKey = `${activeCollege.id}_${selectedCycleId || 'ciclo'}_${ownerScopeKey}_${student.id}_${effectiveSubject?.id || 'gen'}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
    const legacyEntryKey = `${activeCollege.id}_${student.id}_${effectiveSubject?.id || 'gen'}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
    if (draftRows[entryKey]) {
      return { key: entryKey, ...draftRows[entryKey] };
    }

    const saved = studentEvaluations.find(
      (e) =>
        (e.id === entryKey ||
          e.id === legacyEntryKey ||
          (e.estudianteId === student.id &&
            e.materiaId === (effectiveSubject?.id || 'gen') &&
            e.periodicidad === bitacoraPeriodicity &&
            Number(e.periodoIndex) === bitacoraPeriodIdx)) &&
        (e.cicloId === selectedCycleId || (!e.cicloId && selectedCycleId === activeCycle?.id)) &&
        (!e.docenteId || currentOwnerIds.has(e.docenteId.trim().toLowerCase()))
    );
    if (saved) {
      return {
        key: entryKey,
        calificacionExamen: saved.calificacionExamen,
        tareasEntregadasAlumno:
          groupTasksCount > 0
            ? Math.min(groupTasksCount, saved.tareasEntregadasAlumno)
            : 0,
        checklistTareas: saved.checklistTareas || {},
        puntajesConceptos: saved.puntajesConceptos || {},
        calificacionManualActiva: Boolean(saved.calificacionManualActiva),
        calificacionManual: saved.calificacionManual ?? saved.calificacionFinalPeriodo,
        observaciones: saved.observaciones || '',
      };
    }

    const existingGrade = grades.find(
      (g) =>
        g.colegioId === activeCollege.id &&
        g.estudianteId === student.id &&
        (g.cicloId === selectedCycleId || (!g.cicloId && selectedCycleId === activeCycle?.id)) &&
        (!effectiveSubject ||
          g.materiaId === effectiveSubject.id ||
          g.materiaNombre.trim().toLowerCase() === effectiveSubject.nombre.trim().toLowerCase())
    );
    const baseScore = 0;

    // Auto-detect if student already submitted evidence for any of the period's tasks
    const initialChecklist: Record<string, 'entregada' | 'incompleta' | 'no_entregada'> = {};
    let autoDeliveredCount = 0;
    groupTasks.forEach((tItem, idx) => {
      const tIdx = idx + 1;
      const hasSubmittedEvidence =
        Array.isArray(tItem.entregasEvidencias) &&
        tItem.entregasEvidencias.some(
          (ev) =>
            ev.estudianteId === student.id ||
            ev.estudianteNombre.trim().toLowerCase() ===
              `${student.nombre} ${student.apellidos}`.trim().toLowerCase()
        );
      if (hasSubmittedEvidence) {
        initialChecklist[`T${tIdx}`] = 'entregada';
        autoDeliveredCount += 1;
      } else {
        initialChecklist[`T${tIdx}`] = 'no_entregada';
      }
    });

    const defaultConceptScores: Record<string, number> = {};
    bitacoraConcepts.forEach((c) => {
      defaultConceptScores[c.id] = 0;
      if (c.tipo !== 'tareas' && c.tipo !== 'examen') {
        defaultConceptScores[`CONCEPT_TOTAL_${c.id}`] = Math.max(1, Number(c.totalMeta) || 10);
      }
    });

    // Auto-populate exam aciertos if the student already answered the interactive exam in the portal
    groupExams.forEach((exItem) => {
      const totalReacts = getExamTotalReactivos(exItem);
      defaultConceptScores[`EXAM_TOTAL_${exItem.id}`] = totalReacts;
      const studentSub = Array.isArray(exItem.entregasExamenes)
        ? exItem.entregasExamenes.find(
            (sub) =>
              sub.estudianteId === student.id ||
              sub.estudianteNombre.trim().toLowerCase() ===
                `${student.nombre} ${student.apellidos}`.trim().toLowerCase()
          )
        : undefined;
      if (studentSub) {
        defaultConceptScores[`EXAM_HITS_${exItem.id}`] = studentSub.aciertosObtenidos;
        defaultConceptScores[`EXAM_TOTAL_${exItem.id}`] =
          studentSub.totalReactivos || totalReacts;
        defaultConceptScores[`EXAM_${exItem.id}`] = studentSub.calificacionEscala10;
      } else {
        defaultConceptScores[`EXAM_HITS_${exItem.id}`] = 0;
        defaultConceptScores[`EXAM_${exItem.id}`] = 0;
      }
    });

    // Inicializar calificaciones por cada materia asignada al docente
    collegeSubjects.forEach((sub) => {
      const subEvalEntryKey = `${activeCollege.id}_${ownerScopeKey}_${student.id}_${sub.id}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
      const legacySubKey = `${activeCollege.id}_${student.id}_${sub.id}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
      const savedSubEval = studentEvaluations.find(
        (e) =>
          e.id === subEvalEntryKey ||
          (e.id === legacySubKey &&
            (!e.docenteId || currentOwnerIds.has(e.docenteId.trim().toLowerCase())))
      );
      if (savedSubEval) {
        defaultConceptScores[`SUBJ_${sub.id}`] = Number(
          (savedSubEval.calificacionFinalPeriodo || 0).toFixed(1)
        );
      }
    });

    return {
      key: entryKey,
      calificacionExamen: Number(baseScore.toFixed(1)),
      tareasEntregadasAlumno: autoDeliveredCount,
      checklistTareas: initialChecklist,
      puntajesConceptos: defaultConceptScores,
      calificacionManualActiva: false,
      calificacionManual: Number(baseScore.toFixed(1)),
      observaciones: existingGrade?.observaciones || '',
    };
  };

  const updateStudentDraft = (
    student: Student,
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams),
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
    const current = getStudentRowState(student, groupTasks, groupExams);
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

  // Resuelve el Total / Base N (ej. 10, 12, 15 participaciones/sellos) que equivale al 100% del concepto manual
  const getConceptTotalMetaForBitacora = (
    concept: EvaluationConceptItem,
    row?: { puntajesConceptos: Record<string, number> }
  ): number => {
    const overrideKey = `${activeBitacoraPeriod?.id || 'default'}__${concept.id}`;
    if (conceptTotalMetaOverrides[overrideKey] && conceptTotalMetaOverrides[overrideKey] > 0) {
      return conceptTotalMetaOverrides[overrideKey];
    }
    if (row && row.puntajesConceptos[`CONCEPT_TOTAL_${concept.id}`] > 0) {
      const rowTotal = Number(row.puntajesConceptos[`CONCEPT_TOTAL_${concept.id}`]);
      const rowVal = Number(row.puntajesConceptos[concept.id] ?? 0);
      return Math.max(1, rowTotal, rowVal);
    }
    // Check if any student in the current group has a saved CONCEPT_TOTAL or a higher N count
    let maxFoundTotal = Math.max(1, Number(concept.totalMeta) || 10);
    if (activeGroupBlock?.students) {
      activeGroupBlock.students.forEach((st) => {
        const entryKey = `${activeCollege.id}_${ownerScopeKey}_${st.id}_${effectiveSubject?.id || 'gen'}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;
        const draft = draftRows[entryKey];
        const saved = studentEvaluations.find((e) => e.id === entryKey);
        const map = draft?.puntajesConceptos || saved?.puntajesConceptos;
        if (map) {
          if (map[`CONCEPT_TOTAL_${concept.id}`] > 0) {
            maxFoundTotal = Math.max(maxFoundTotal, Number(map[`CONCEPT_TOTAL_${concept.id}`]));
          }
          if (map[concept.id] > maxFoundTotal) {
            maxFoundTotal = Number(map[concept.id]);
          }
        }
      });
    }
    return maxFoundTotal;
  };

  // Permite cambiar la cantidad base N (ej. 10, 12, 15 participaciones = % del concepto) para todo el grupo en la bitácora
  const handleBitacoraConceptTotalMetaChange = (
    concept: EvaluationConceptItem,
    rawTotal: number,
    groupStudents: Student[],
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams)
  ) => {
    const validTotal = Math.max(1, Number(rawTotal) || 1);
    const overrideKey = `${activeBitacoraPeriod?.id || 'default'}__${concept.id}`;
    setConceptTotalMetaOverrides((prev) => ({
      ...prev,
      [overrideKey]: validTotal,
    }));

    // Actualizar los borradores de todos los alumnos del grupo con el nuevo denominador N
    setDraftRows((prev) => {
      const next = { ...prev };
      groupStudents.forEach((st) => {
        const current = getStudentRowState(st, groupTasks, groupExams);
        next[current.key] = {
          ...current,
          puntajesConceptos: {
            ...current.puntajesConceptos,
            [`CONCEPT_TOTAL_${concept.id}`]: validTotal,
          },
        };
      });
      return next;
    });

    // Si hay un periodo guardado activo, actualizar también el totalMeta en el concepto del periodo
    if (activeBitacoraPeriod) {
      const updatedConcepts = activeBitacoraPeriod.conceptos.map((c) =>
        c.id === concept.id ? { ...c, totalMeta: validTotal } : c
      );
      saveEvaluationPeriod({
        id: activeBitacoraPeriod.id,
        colegioId: activeBitacoraPeriod.colegioId,
        docenteId: activeBitacoraPeriod.docenteId || ownerScopeKey,
        docenteNombre:
          activeBitacoraPeriod.docenteNombre ||
          currentTeacherRecord?.nombre ||
          currentUser.nombre,
        periodicidad: activeBitacoraPeriod.periodicidad,
        periodoIndex: activeBitacoraPeriod.periodoIndex,
        periodoNombre: activeBitacoraPeriod.periodoNombre,
        modoSeleccionFecha: activeBitacoraPeriod.modoSeleccionFecha,
        fechaInicio: activeBitacoraPeriod.fechaInicio,
        fechaFin: activeBitacoraPeriod.fechaFin,
        conceptos: updatedConcepts,
      });
    }
  };

  // Calcula:
  // 1) Tareas del periodo (ej. 10 tareas = 30% -> tareasEntregadas / totalTareas * 30%), que cuenta para TODAS las materias asignadas.
  // 2) Examen de cada materia en base a los aciertos obtenidos (ej. aciertos / totalReactivos * 40%).
  // 3) Otros conceptos manuales (ej. Trabajo en clase, Participación, Proyecto) en base a la cantidad N registrada al alumno (ej. 10, 8, 12 de N = % del concepto).
  // 4) Calificación de cada materia asignada = Tareas (%) + Examen de esa materia (%) + Otros conceptos (%) -> escala 0 a 10.
  // 5) Calificación Promedio Total del alumno = promedio de las calificaciones de todas las materias asignadas.
  const computeStudentEvaluationBreakdown = (
    student: Student,
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams)
  ) => {
    const groupTasksCount = groupTasks.length;
    const groupExamsCount = groupExams.length;
    const row = getStudentRowState(student, groupTasks, groupExams);
    const activeConceptsForGroup = getActiveConceptsForGroup(groupTasksCount, groupExamsCount);
    const activeConceptsPctSum = Number(
      activeConceptsForGroup
        .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
        .toFixed(1)
    );

    // 1. Ecuación de Tareas: N tareas registradas en el periodo = % del concepto Tareas (compartido para todas las materias)
    const safeTotalTasks = groupTasksCount;
    const safeDeliveredTasks =
      safeTotalTasks > 0
        ? Math.max(0, Math.min(safeTotalTasks, Number(row.tareasEntregadasAlumno) || 0))
        : 0;
    const taskCompliancePct =
      safeTotalTasks > 0
        ? Number(((safeDeliveredTasks / safeTotalTasks) * 100).toFixed(1))
        : 0;
    const taskScore10 =
      safeTotalTasks > 0
        ? Number(((safeDeliveredTasks / safeTotalTasks) * 10).toFixed(1))
        : 0;

    // 2. Desglose de cada Examen por Aciertos (aciertos / totalReactivos)
    const examResultsById: Record<
      string,
      {
        exam: (typeof allTeacherTasksExams)[number];
        hits: number;
        totalReactivos: number;
        accuracyRatio: number; // 0..1
        score10: number; // 0..10
        weightedPctEarned: number; // % ganado según el concepto Examen
      }
    > = {};

    const examConcepts = activeConceptsForGroup.filter((c) => c.tipo === 'examen');
    const examConceptTotalPct = examConcepts.reduce(
      (sum, c) => sum + (Number(c.porcentaje) || 0),
      0
    );

    groupExams.forEach((exItem) => {
      const defaultTotal = getExamTotalReactivos(exItem);
      const totalReacts = Math.max(
        1,
        Number(row.puntajesConceptos[`EXAM_TOTAL_${exItem.id}`]) || defaultTotal
      );
      const rawHits = row.puntajesConceptos[`EXAM_HITS_${exItem.id}`];
      const fallbackScore10 = row.puntajesConceptos[`EXAM_${exItem.id}`];

      let hits = 0;
      if (rawHits !== undefined) {
        hits = Math.max(0, Math.min(totalReacts, Number(rawHits) || 0));
      } else if (fallbackScore10 !== undefined) {
        hits = Number(((Math.max(0, Math.min(10, Number(fallbackScore10) || 0)) / 10) * totalReacts).toFixed(1));
      }

      const accuracyRatio = totalReacts > 0 ? hits / totalReacts : 0;
      const score10 = Number((accuracyRatio * 10).toFixed(1));
      const weightedPctEarned = Number((accuracyRatio * examConceptTotalPct).toFixed(1));

      examResultsById[exItem.id] = {
        exam: exItem,
        hits,
        totalReactivos: totalReacts,
        accuracyRatio,
        score10,
        weightedPctEarned,
      };
    });

    const allExamScores10 = Object.values(examResultsById).map((r) => r.score10);
    const avgExamScore10 =
      allExamScores10.length > 0
        ? Number(
            (
              allExamScores10.reduce((a, b) => a + b, 0) / allExamScores10.length
            ).toFixed(1)
          )
        : Math.max(0, Math.min(10, Number(row.calificacionExamen) || 0));

    // 3. Porcentaje ganado en Tareas y en otros conceptos manuales (compartidos en todas las materias)
    let sharedNonExamWeightedPct = 0;
    let manualConceptsWeightedPctTotal = 0;
    const manualConceptResultsById: Record<
      string,
      {
        concept: EvaluationConceptItem;
        rawCount: number;
        totalMeta: number;
        complianceRatio: number;
        score10: number;
        weightedPctEarned: number;
      }
    > = {};
    const conceptBreakdowns: Array<{
      concept: EvaluationConceptItem;
      rawCount?: number;
      totalMeta?: number;
      score10: number;
      weightedPct: number;
    }> = [];

    activeConceptsForGroup.forEach((concept) => {
      let score10 = 0;
      let rawCount: number | undefined = undefined;
      let totalMeta: number | undefined = undefined;

      if (concept.tipo === 'tareas') {
        score10 = taskScore10;
      } else if (concept.tipo === 'examen') {
        score10 =
          allExamScores10.length > 0
            ? avgExamScore10
            : Math.max(
                0,
                Math.min(10, Number(row.puntajesConceptos[concept.id] ?? avgExamScore10))
              );
      } else {
        // Concepto manual no enlazado a tareas ni exámenes (ej. Trabajo en clase, Participación, Proyecto, Personalizado):
        // El docente coloca manualmente si el alumno tiene 10, 8, 12 o N participaciones/sellos y se hace la ecuación con el % del concepto
        rawCount = Math.max(0, Number(row.puntajesConceptos[concept.id] ?? 0));
        const baseMeta = getConceptTotalMetaForBitacora(concept, row);
        totalMeta = Math.max(1, baseMeta, rawCount);
        const complianceRatio = totalMeta > 0 ? Math.min(1, rawCount / totalMeta) : 0;
        score10 = Number((complianceRatio * 10).toFixed(1));
        const earnedPct = Number((complianceRatio * concept.porcentaje).toFixed(1));
        manualConceptResultsById[concept.id] = {
          concept,
          rawCount,
          totalMeta,
          complianceRatio,
          score10,
          weightedPctEarned: earnedPct,
        };
      }

      const weightedPct = Number(((score10 / 10) * concept.porcentaje).toFixed(2));
      if (concept.tipo !== 'examen') {
        sharedNonExamWeightedPct += weightedPct;
        if (concept.tipo !== 'tareas') {
          manualConceptsWeightedPctTotal += weightedPct;
        }
      }
      conceptBreakdowns.push({
        concept,
        rawCount,
        totalMeta,
        score10,
        weightedPct,
      });
    });

    // 4. Cálculo de calificación por CADA MATERIA ASIGNADA:
    // Cada materia toma las Tareas del periodo (que cuentan para todas las materias) + Otros conceptos + el Examen de esa materia
    const subjectBreakdowns: Record<
      string,
      {
        subject: Subject;
        matchedExams: (typeof allTeacherTasksExams);
        examScore10: number;
        examWeightedPct: number;
        tasksWeightedPct: number;
        otherConceptsWeightedPct: number;
        totalSubjectPct: number;
        calculatedSubjectGrade10: number;
        finalSubjectGrade10: number;
        isManualSubjectOverride: boolean;
      }
    > = {};

    const tasksConceptPct = activeConceptsForGroup
      .filter((c) => c.tipo === 'tareas')
      .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0);
    const tasksWeightedPctForAllSubjects = Number(
      ((taskScore10 / 10) * tasksConceptPct).toFixed(1)
    );
    const otherConceptsWeightedPctForAllSubjects = Number(
      manualConceptsWeightedPctTotal.toFixed(1)
    );

    collegeSubjects.forEach((sub) => {
      const normSubName = sub.nombre.trim().toLowerCase();
      // Buscar examen(es) publicados específicamente para esta materia en el periodo
      const matchedSubExams = groupExams.filter((ex) => {
        const exSub = (ex.materia || '').trim().toLowerCase();
        if (!exSub) return false;
        return (
          exSub === normSubName ||
          exSub.includes(normSubName) ||
          normSubName.includes(exSub)
        );
      });

      const hasPublishedExamForSubject = matchedSubExams.length > 0;

      // Si hay examen publicado de esta materia, usar únicamente los exámenes de esta materia.
      // Si NO hay examen publicado de esta materia, NO tomar el valor de otros exámenes:
      // calcular el promedio de esta materia tomando en cuenta únicamente los otros conceptos a evaluar.
      let subExamScore10 = 0;
      let subExamWeightedPct = 0;
      let normalizedSubPct = 0;

      if (hasPublishedExamForSubject) {
        const scores = matchedSubExams.map(
          (ex) => examResultsById[ex.id]?.score10 ?? 0
        );
        subExamScore10 = Number(
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        );
        subExamWeightedPct = Number(
          ((subExamScore10 / 10) * examConceptTotalPct).toFixed(2)
        );
        const rawSubTotalPct = sharedNonExamWeightedPct + subExamWeightedPct;
        normalizedSubPct =
          activeConceptsPctSum > 0
            ? Math.min(
                100,
                Number(((rawSubTotalPct / activeConceptsPctSum) * 100).toFixed(1))
              )
            : Number((subExamScore10 * 10).toFixed(1));
      } else if (groupExams.length === 0 && examConcepts.length > 0) {
        // Caso especial: no hay ningún examen publicado en todo el grupo, pero el docente capturó calificación directa en la columna general de Examen
        const firstExamConcept = examConcepts[0];
        const manualExamVal = row.puntajesConceptos[firstExamConcept.id];
        if (manualExamVal !== undefined && Number(manualExamVal) > 0) {
          subExamScore10 = Math.max(0, Math.min(10, Number(manualExamVal)));
          subExamWeightedPct = Number(
            ((subExamScore10 / 10) * examConceptTotalPct).toFixed(2)
          );
          const rawSubTotalPct = sharedNonExamWeightedPct + subExamWeightedPct;
          normalizedSubPct =
            activeConceptsPctSum > 0
              ? Math.min(
                  100,
                  Number(((rawSubTotalPct / activeConceptsPctSum) * 100).toFixed(1))
                )
              : Number((subExamScore10 * 10).toFixed(1));
        } else {
          const nonExamConceptsPctSum = Number(
            activeConceptsForGroup
              .filter((c) => c.tipo !== 'examen')
              .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
              .toFixed(1)
          );
          normalizedSubPct =
            nonExamConceptsPctSum > 0
              ? Math.min(
                  100,
                  Number(((sharedNonExamWeightedPct / nonExamConceptsPctSum) * 100).toFixed(1))
                )
              : 0;
        }
      } else {
        // No hay examen publicado para esta materia: evaluar solo con los otros conceptos (Tareas + Captura manual)
        const nonExamConceptsPctSum = Number(
          activeConceptsForGroup
            .filter((c) => c.tipo !== 'examen')
            .reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
            .toFixed(1)
        );
        normalizedSubPct =
          nonExamConceptsPctSum > 0
            ? Math.min(
                100,
                Number(((sharedNonExamWeightedPct / nonExamConceptsPctSum) * 100).toFixed(1))
              )
            : 0;
      }

      const calculatedSubjectGrade10 = Number((normalizedSubPct / 10).toFixed(1));
      const manualOverrideFlag = Boolean(row.puntajesConceptos[`SUBJ_MANUAL_${sub.id}`]);
      const manualSubVal = row.puntajesConceptos[`SUBJ_${sub.id}`];
      const finalSubjectGrade10 =
        manualOverrideFlag && manualSubVal !== undefined
          ? Math.max(0, Math.min(10, Number(manualSubVal) || 0))
          : calculatedSubjectGrade10;

      subjectBreakdowns[sub.id] = {
        subject: sub,
        matchedExams: matchedSubExams,
        examScore10: subExamScore10,
        examWeightedPct: Number(subExamWeightedPct.toFixed(1)),
        tasksWeightedPct: tasksWeightedPctForAllSubjects,
        otherConceptsWeightedPct: otherConceptsWeightedPctForAllSubjects,
        totalSubjectPct: normalizedSubPct,
        calculatedSubjectGrade10,
        finalSubjectGrade10,
        isManualSubjectOverride: manualOverrideFlag,
      };
    });

    // 5. Promedio Total de todas las materias asignadas
    const allSubjectFinalGrades = collegeSubjects.map(
      (sub) => subjectBreakdowns[sub.id]?.finalSubjectGrade10 ?? 0
    );
    const totalWeightedPctAllConcepts = conceptBreakdowns.reduce(
      (sum, item) => sum + item.weightedPct,
      0
    );
    const fallbackNormalizedPct =
      activeConceptsPctSum > 0
        ? Math.min(
            100,
            Number(((totalWeightedPctAllConcepts / activeConceptsPctSum) * 100).toFixed(1))
          )
        : Number((avgExamScore10 * 10).toFixed(1));

    const avgSubjectsGrade10 =
      allSubjectFinalGrades.length > 0
        ? Number(
            (
              allSubjectFinalGrades.reduce((acc, v) => acc + v, 0) /
              allSubjectFinalGrades.length
            ).toFixed(1)
          )
        : Number((fallbackNormalizedPct / 10).toFixed(1));

    const calculatedGrade10 = avgSubjectsGrade10;
    const finalGrade10 = row.calificacionManualActiva
      ? Math.max(0, Math.min(10, Number(row.calificacionManual) || 0))
      : calculatedGrade10;
    const porcentajeFinalObtenido = Number((finalGrade10 * 10).toFixed(1));

    return {
      row,
      safeTotalTasks,
      safeDeliveredTasks,
      taskCompliancePct,
      taskScore10,
      tasksWeightedPctForAllSubjects,
      otherConceptsWeightedPctForAllSubjects,
      examScore10: avgExamScore10,
      examConceptTotalPct,
      examResultsById,
      manualConceptResultsById,
      conceptBreakdowns,
      subjectBreakdowns,
      porcentajeFinalObtenido,
      calculatedGrade10,
      finalGrade10,
    };
  };

  const handleSaveSingleStudentRecord = (
    student: Student,
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams)
  ) => {
    const calc = computeStudentEvaluationBreakdown(student, groupTasks, groupExams);
    const ownerDocName = currentTeacherRecord?.nombre || currentUser.nombre;
    // Guardar evaluación para cada materia asignada al docente
    if (collegeSubjects.length > 0) {
      collegeSubjects.forEach((sub, idx) => {
        const subBreakdown = calc.subjectBreakdowns[sub.id];
        const subScore = subBreakdown
          ? subBreakdown.finalSubjectGrade10
          : calc.finalGrade10;
        const subExamScore = subBreakdown
          ? subBreakdown.examScore10
          : calc.examScore10;
        const subPct = subBreakdown
          ? subBreakdown.totalSubjectPct
          : calc.porcentajeFinalObtenido;

        const entryIdForSub =
          idx === 0
            ? calc.row.key
            : `${activeCollege.id}_${ownerScopeKey}_${student.id}_${sub.id}_${bitacoraPeriodicity}_P${bitacoraPeriodIdx}_${activeBitacoraPeriod?.id || 'default'}`;

        saveStudentEvaluation({
          id: entryIdForSub,
          colegioId: activeCollege.id,
          cicloId: selectedCycleId,
          docenteId: ownerScopeKey,
          docenteNombre: ownerDocName,
          estudianteId: student.id,
          materiaId: sub.id,
          periodicidad: bitacoraPeriodicity,
          periodoIndex: bitacoraPeriodIdx,
          calificacionExamen: subExamScore,
          totalTareasDocente: calc.safeTotalTasks,
          tareasEntregadasAlumno: calc.safeDeliveredTasks,
          checklistTareas: calc.row.checklistTareas,
          puntajesConceptos: {
            ...calc.row.puntajesConceptos,
            [`SUBJ_${sub.id}`]: subScore,
          },
          calificacionManualActiva: calc.row.calificacionManualActiva,
          calificacionManual: calc.row.calificacionManual,
          porcentajeFinalObtenido: subPct,
          calificacionFinalPeriodo: calc.row.calificacionManualActiva
            ? calc.finalGrade10
            : subScore,
          observaciones: calc.row.observaciones,
        });
      });
    } else {
      saveStudentEvaluation({
        id: calc.row.key,
        colegioId: activeCollege.id,
        cicloId: selectedCycleId,
        docenteId: ownerScopeKey,
        docenteNombre: ownerDocName,
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
    }
    showToast(
      `Calificaciones guardadas en "${bitacoraPeriodLabel}" para ${student.nombre} ${student.apellidos}: Promedio General ${calc.finalGrade10.toFixed(1)}.`
    );
  };

  const handleToggleChecklistTask = (
    student: Student,
    taskIndex: number,
    groupTasks: (typeof allTeacherTasksExams),
    groupExams: (typeof allTeacherTasksExams)
  ) => {
    const groupTasksCount = groupTasks.length;
    const current = getStudentRowState(student, groupTasks, groupExams);
    const key = `T${taskIndex}`;
    const prevState = current.checklistTareas[key] || 'no_entregada';
    const nextState: 'entregada' | 'incompleta' | 'no_entregada' =
      prevState === 'no_entregada'
        ? 'entregada'
        : prevState === 'entregada'
        ? 'incompleta'
        : 'no_entregada';

    const nextChecklist = {
      ...current.checklistTareas,
      [key]: nextState,
    };

    let deliveredPoints = 0;
    for (let i = 1; i <= groupTasksCount; i++) {
      const st = nextChecklist[`T${i}`] || 'no_entregada';
      if (st === 'entregada') deliveredPoints += 1;
      else if (st === 'incompleta') deliveredPoints += 0.5;
    }

    updateStudentDraft(student, groupTasks, groupExams, {
      checklistTareas: nextChecklist,
      tareasEntregadasAlumno: Number(deliveredPoints.toFixed(1)),
    });
  };

  const currentNetworkMonthName = new Date().toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  // Requirement #2: Es necesario primero crear el ciclo escolar
  if (collegeCycles.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div
          className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            borderBottom: `4px solid ${goldColor}`,
          }}
        >
          <div className="space-y-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Módulo de Evaluaciones
            </span>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6" style={{ color: goldColor }} />
              <span>Evaluaciones y Calificaciones</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-200">
              {activeCollege.nombre}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-amber-200 shadow-xl space-y-6 text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
              Requisito Previo de Evaluación
            </span>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Es necesario primero crear el Ciclo Escolar
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              En el sistema, los periodos de evaluación (mensuales, bimestrales, trimestrales, etc.), los conceptos de ponderación al 100%, las libretas de registros de tareas/exámenes y las boletas de calificaciones se anidan estrictamente a un ciclo escolar. Esto garantiza que las notas históricas de ciclos anteriores queden archivadas y puedan ser consultadas en cualquier momento con solo cambiar de ciclo.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.('ciclo_escolar')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-4 h-4" style={{ color: goldColor }} />
              <span>Ir a Crear Ciclo Escolar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. CLEAN INSTITUTIONAL HEADER BANNER WITH CYCLE SELECTOR */}
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
            {selectedCycleObj && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${
                selectedCycleObj.activo
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
              }`}>
                {selectedCycleObj.nombre} {selectedCycleObj.activo ? '· Activo' : '· Histórico'}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" style={{ color: goldColor }} />
            <span>Evaluaciones: Conceptos de Evaluación y Mis Bitácoras</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-200 max-w-3xl">
            {activeCollege.nombre} · Configura el periodo (por mes completo o rango de fechas) y los conceptos de evaluación con tope del 100%, guárdalos y evalúa a tus alumnos en Mis Bitácoras.
          </p>
        </div>

        {/* Ciclo Escolar Selector */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 shadow-inner">
            <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-white/90">Ciclo Escolar:</span>
            <select
              value={selectedCycleId}
              onChange={(e) => {
                setSelectedCycleId(e.target.value);
                setDraftRows({});
              }}
              className="bg-transparent text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
            >
              {collegeCycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white font-medium">
                  {c.nombre} {c.activo ? '⭐ (Activo)' : '(Histórico)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Historical Cycle Banner if non-active cycle is selected */}
      {selectedCycleObj && !selectedCycleObj.activo && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Consulta de Ciclo Histórico:</strong> Estás revisando las evaluaciones y bitácoras de <strong>{selectedCycleObj.nombre}</strong>. Las calificaciones guardadas pertenecen a este ciclo escolar.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
            Ciclo Anterior
          </span>
        </div>
      )}

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

        {/* Folder Body Bar & Step-by-Step Period + Concepts Workspace (Conceptos Tab) */}
        {activeTab === 'conceptos' && (
          <div
            className="bg-white rounded-2xl rounded-tl-none p-5 sm:p-6 border shadow-2xs space-y-5"
            style={{
              borderColor: `${primaryColor}35`,
              borderTopWidth: '3px',
              borderTopColor: primaryColor,
            }}
          >
            {/* PASO 1 HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: goldColor, color: primaryColor }}
                  >
                    Paso 1
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
                    <span>Elige el Mes o Rango de Fechas como Periodo de Evaluación</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Primero selecciona <strong>qué mes o qué fechas vas a evaluar</strong>. Una vez elegido el periodo, en el recuadro de abajo colocarás los conceptos exclusivos que se calificarán dentro de ese periodo.
                </p>
              </div>

              {/* Modalidad / Periodicidad selector */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                <span className="text-[11px] font-bold text-slate-600">Modalidad:</span>
                <div className="flex flex-wrap gap-1">
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
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
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
            </div>

            {/* TWO VISUAL OPTIONS: POR MES/PERIODO O POR RANGO DE FECHAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Mode Selector Cards (Left 4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  ¿Cómo deseas definir el periodo?
                </span>
                <button
                  type="button"
                  onClick={() => setDateSelectionMode('mes_completo')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    dateSelectionMode === 'mes_completo'
                      ? 'shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                  style={
                    dateSelectionMode === 'mes_completo'
                      ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={
                      dateSelectionMode === 'mes_completo'
                        ? { backgroundColor: primaryColor, color: goldColor }
                        : { backgroundColor: '#E2E8F0', color: '#475569' }
                    }
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-extrabold text-slate-900">
                      {activePeriodicity === 'mensual'
                        ? 'Opción A: Elegir un Mes del Ciclo'
                        : `Opción A: Elegir ${periodicityMeta.singularLabel}`}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Selecciona directamente el mes o bloque escolar (ej. Septiembre, Octubre, Noviembre...).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDateSelectionMode('rango_fechas')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    dateSelectionMode === 'rango_fechas'
                      ? 'shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                  style={
                    dateSelectionMode === 'rango_fechas'
                      ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={
                      dateSelectionMode === 'rango_fechas'
                        ? { backgroundColor: primaryColor, color: goldColor }
                        : { backgroundColor: '#E2E8F0', color: '#475569' }
                    }
                  >
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-extrabold text-slate-900">
                      Opción B: Elegir Rango de Fechas
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Define una fecha de inicio y una fecha de término específicas para este periodo.
                    </p>
                  </div>
                </button>
              </div>

              {/* Active Selection Area (Right 8 cols) */}
              <div className="lg:col-span-8 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between gap-4">
                {dateSelectionMode === 'mes_completo' ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {activePeriodicity === 'mensual'
                          ? 'Selecciona el Mes que vas a configurar:'
                          : `Selecciona el ${periodicityMeta.singularLabel} que vas a configurar:`}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Haz clic en un mes/periodo para ver o agregar sus conceptos
                      </span>
                    </div>

                    {/* Interactive Grid of Months / Periods */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {periodicityMeta.periodNames.map((pName, idx) => {
                        const pIdx = idx + 1;
                        const isSelected = selectedPeriodIndex === pIdx;
                        const savedForThisIdx = collegeSavedPeriods.find(
                          (sp) =>
                            sp.periodicidad === activePeriodicity &&
                            sp.periodoIndex === pIdx &&
                            (sp.modoSeleccionFecha || 'mes_completo') === 'mes_completo'
                        );

                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setSelectedPeriodIndex(pIdx)}
                            className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'shadow-xs ring-2 ring-offset-1'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: primaryColor,
                                    borderColor: primaryColor,
                                    color: '#FFFFFF',
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  isSelected ? 'text-slate-200' : 'text-slate-400'
                                }`}
                              >
                                #{pIdx}
                              </span>
                              {savedForThisIdx && (
                                <span
                                  className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-0.5"
                                  style={
                                    isSelected
                                      ? { backgroundColor: goldColor, color: primaryColor }
                                      : { backgroundColor: '#DCFCE7', color: '#166534' }
                                  }
                                >
                                  ✓ {savedForThisIdx.conceptos.length}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-extrabold truncate">{pName}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Selecciona las fechas de inicio y fin del periodo a evaluar:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Los conceptos que agregues en el Paso 2 se evaluarán dentro de este rango de fechas.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-slate-300 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Fecha de Inicio (Del):
                        </label>
                        <input
                          type="date"
                          value={rangeStartDate}
                          onChange={(e) => setRangeStartDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-300 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Fecha de Término (Al):
                        </label>
                        <input
                          type="date"
                          value={rangeEndDate}
                          onChange={(e) => setRangeEndDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Period Summary Strip */}
                <div
                  className="px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2"
                  style={{
                    backgroundColor: `${primaryColor}08`,
                    borderColor: `${primaryColor}25`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">
                      Periodo activo seleccionado:
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-lg font-extrabold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {periodicityMeta.label} · {currentPeriodSubName}
                    </span>
                    {matchingSavedPeriodForCurrentSelection ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold">
                        ✓ Guardado ({matchingSavedPeriodForCurrentSelection.conceptos.length} conceptos)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                        Pendiente de guardar
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartNewPeriod}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-white shadow-2xs transition-all cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <FolderPlus className="w-3.5 h-3.5" style={{ color: goldColor }} />
                    <span>Siguiente Mes / Nuevo Periodo</span>
                  </button>
                </div>
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
      {/* TAB 1: CONCEPTOS DE EVALUACIÓN (PASO 2 DENTRO DEL PERIODO ELEGIDO)     */}
      {/* ===================================================================== */}
      {activeTab === 'conceptos' && (
        <div className="space-y-6">
          {/* UNIFIED CONTAINER FOR STEP 2: CONCEPTS INSIDE THE SELECTED PERIOD */}
          <div
            className="bg-white rounded-3xl border-2 shadow-xs overflow-hidden"
            style={{ borderColor: `${primaryColor}40` }}
          >
            {/* Header Bar of the Selected Period Container */}
            <div
              className="px-5 py-4 sm:px-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              style={{
                backgroundColor: `${primaryColor}08`,
                borderColor: `${primaryColor}25`,
              }}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor, color: goldColor }}
                  >
                    Paso 2
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
                    <span>
                      Coloca los Conceptos que se Evaluarán en:{' '}
                      <span
                        className="underline decoration-2"
                        style={{ color: primaryColor, textDecorationColor: goldColor }}
                      >
                        {currentPeriodSubName}
                      </span>
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Agrega aquí los criterios de evaluación (Examen, Tareas, Trabajo en clase, Proyecto, etc.) que calificarás durante <strong>{currentPeriodSubName}</strong> hasta completar el <strong>100%</strong>.
                </p>
              </div>

              {/* 100% Total Badge */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div
                  className={`px-4 py-2 rounded-xl font-mono font-black text-xs sm:text-sm border flex items-center gap-2 ${
                    rawTotalPercentageSum === 100
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {rawTotalPercentageSum === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    Suma en {currentPeriodSubName}: {totalPercentageSum}% / 100%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Visual Stacked 100% Bar inside the Period Container */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">
                    Distribución del 100% dentro del periodo{' '}
                    <strong style={{ color: primaryColor }}>{currentPeriodSubName}</strong>:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {collegeConcepts.length === 0
                      ? 'Sin conceptos aún (0% asignado)'
                      : `${collegeConcepts.length} concepto(s) en este periodo · Tope máximo 100%`}
                  </span>
                </div>
                <div className="w-full h-5 bg-slate-200/80 rounded-full overflow-hidden flex border border-slate-300 p-0.5 gap-0.5">
                  {collegeConcepts.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                      Agrega tu primer concepto para este periodo en el formulario de abajo
                    </div>
                  ) : (
                    collegeConcepts.map((c, idx) => {
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
                    })
                  )}
                </div>
              </div>

              {/* 2-Column Workspace inside the Period: Left = Add Concept to Period, Right = Concepts in Period */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form to Add New Evaluation Concept into currentPeriodSubName */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 space-y-4 h-fit">
                  <div className="space-y-1.5 border-b border-slate-200 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      >
                        Paso 2.1 · Agregar Concepto
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                      >
                        En: {currentPeriodSubName}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                      <span>Nuevo Concepto para {currentPeriodSubName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Elige una sugerencia rápida o escribe el nombre del criterio que evaluarás en este periodo:
                    </p>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(
                        [
                          { label: '+ Examen Publicado', name: 'Examen Publicado', kind: 'examen' as EvaluationConceptKind, pct: 40 },
                          { label: '+ Tareas o Proyectos Publicados', name: 'Tareas o Proyectos Publicados', kind: 'tareas' as EvaluationConceptKind, pct: 30 },
                          { label: '+ Captura Manual', name: 'Participación y Trabajo en Clase', kind: 'personalizado' as EvaluationConceptKind, pct: 30 },
                        ]
                      ).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNewConceptName(preset.name);
                            setNewConceptKind(preset.kind);
                            setNewConceptPct(preset.pct);
                            setNewConceptDesc(CONCEPT_KIND_LABELS[preset.kind].description);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-[10px] font-extrabold text-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleCreateConcept} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nombre del Concepto a Evaluar *
                      </label>
                      <input
                        type="text"
                        value={newConceptName}
                        onChange={(e) => setNewConceptName(e.target.value)}
                        placeholder="Ej. Examen Parcial, Tareas y Proyectos, Participación, Sellos..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tipo de Criterio / Vinculación *
                      </label>
                      <select
                        value={
                          newConceptKind === 'examen' || newConceptKind === 'tareas'
                            ? newConceptKind
                            : 'personalizado'
                        }
                        onChange={(e) =>
                          setNewConceptKind(e.target.value as EvaluationConceptKind)
                        }
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none"
                      >
                        <option value="examen">
                          Examen Publicado (Enlazado a los exámenes publicados de cada materia)
                        </option>
                        <option value="tareas">
                          Tareas o Proyectos Publicados (Enlazado a tareas/proyectos del periodo)
                        </option>
                        <option value="personalizado">
                          Captura Manual (Conteo N en Bitácora: participaciones, sellos, etc.)
                        </option>
                      </select>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {CONCEPT_KIND_LABELS[newConceptKind].description}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Valor en Porcentaje dentro del Periodo *
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
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:outline-none"
                        />
                        <span className="font-bold text-slate-600">% (se ajusta al 100%)</span>
                      </div>
                    </div>

                    {newConceptKind !== 'examen' && newConceptKind !== 'tareas' && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <label className="block font-bold text-amber-950 text-[11px]">
                          Total de Participaciones / Sellos / Registros Esperados (N)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            step={1}
                            value={newConceptTotalMeta}
                            onChange={(e) =>
                              setNewConceptTotalMeta(
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                            className="w-20 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-black text-xs text-slate-900 focus:outline-none"
                          />
                          <span className="text-[11px] font-semibold text-amber-900">
                            registros = {newConceptPct}% (editable en Bitácora)
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 leading-snug">
                          En la bitácora podrás colocar manualmente si el alumno tiene 10, 8, 12 o N y se hará la ecuación automática con el {newConceptPct}%.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Descripción / Criterio (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={newConceptDesc}
                        onChange={(e) => setNewConceptDesc(e.target.value)}
                        placeholder="Detalles de cómo se evalúa este concepto..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Plus className="w-4 h-4" style={{ color: goldColor }} />
                      <span>Agregar Concepto a "{currentPeriodSubName}"</span>
                    </button>
                  </form>
                </div>

                {/* Right 2 Columns: List of Concepts inside the Selected Period + Save Period Button */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            Paso 2.2 · Conceptos dentro del Periodo
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-slate-900">
                          Conceptos asignados a: {periodicityMeta.label} — {currentPeriodSubName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Ajusta los porcentajes de cada concepto evaluado en este periodo o elimina alguno para redistribuir el 100%.
                        </p>
                      </div>
                      <span
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 self-start sm:self-center"
                        style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                      >
                        {collegeConcepts.length} Concepto(s) en {currentPeriodSubName}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {collegeConcepts.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-center space-y-2">
                          <div
                            className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                          >
                            <ListChecks className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-800">
                            El periodo "{currentPeriodSubName}" aún no tiene conceptos registrados
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                            Usa el panel de la izquierda (<strong>Paso 2.1</strong>) o los botones rápidos (<em>+ Examen, + Tareas, + Trabajo en Clase</em>) para colocar los conceptos que evaluarás en <strong>{currentPeriodSubName}</strong>.
                          </p>
                        </div>
                      ) : (
                        collegeConcepts.map((concept) => {
                          const kindMeta =
                            CONCEPT_KIND_LABELS[concept.tipo] || CONCEPT_KIND_LABELS.personalizado;
                          const otherSum = collegeConcepts
                            .filter((c) => c.id !== concept.id)
                            .reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);
                          const maxForThisConcept = Math.max(
                            0,
                            Number((100 - otherSum).toFixed(1))
                          );

                          return (
                            <div
                              key={concept.id}
                              className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                                {concept.tipo !== 'examen' && concept.tipo !== 'tareas' && (
                                  <div className="pt-1 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-950">
                                      <span>Total Base (N) para el {concept.porcentaje}%:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        step={1}
                                        value={concept.totalMeta ?? 10}
                                        onChange={(e) =>
                                          handleUpdateConceptTotalMeta(concept.id, e.target.value)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-center font-mono font-black text-xs bg-white border border-amber-300 rounded text-slate-900 focus:outline-none"
                                        title="Cantidad N (ej. 10, 12, 15 participaciones o sellos) que equivale al 100% de este concepto. También puedes modificarla directo en la Bitácora."
                                      />
                                      <span className="text-[10px] font-semibold text-amber-800">
                                        registros = {concept.porcentaje}% (en Bitácora capturas 10, 8, 12 o N por alumno)
                                      </span>
                                    </span>
                                  </div>
                                )}
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
                        })
                      )}
                    </div>
                  </div>

                  {/* PASO 3: Botón destacado para Guardar el Periodo con sus Conceptos */}
                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{
                      backgroundColor: `${primaryColor}06`,
                      borderColor: `${primaryColor}25`,
                    }}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase"
                          style={{ backgroundColor: goldColor, color: primaryColor }}
                        >
                          Paso 3 · Confirmar y Guardar
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          Guardar Periodo "{currentPeriodSubName}"
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Al guardar, este periodo ({periodicityMeta.label} — <strong>{currentPeriodSubName}</strong>) quedará listo con sus <strong>{collegeConcepts.length} conceptos</strong> para calificar en <em>Mis Bitácoras</em>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveCurrentPeriod}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer active:scale-98 shrink-0"
                      style={{
                        backgroundColor: primaryColor,
                        borderBottom: `3px solid ${goldColor}`,
                      }}
                    >
                      <Save className="w-4 h-4" style={{ color: goldColor }} />
                      <span>Guardar Periodo ({currentPeriodSubName})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* RESUMEN DE PERIODOS YA CONFIGURADOS Y GUARDADOS                 */}
          {/* =============================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Periodos de Evaluación Guardados ({collegeSavedPeriods.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aquí puedes ver todos los meses o rangos de fechas que ya configuraste con sus respectivos conceptos de evaluación.
                  </p>
                </div>
              </div>
            </div>

            {collegeSavedPeriods.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Aún no hay periodos guardados. Elige un mes o fechas en el <strong>Paso 1</strong>, agrega sus conceptos en el <strong>Paso 2</strong> y presiona <strong>"Guardar Periodo"</strong> en el <strong>Paso 3</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {collegeSavedPeriods.map((sp) => {
                  const perLabel =
                    EVALUATION_PERIODICITY_CONFIG[sp.periodicidad]?.label ||
                    sp.periodicidad;
                  const isCurrentInEditor =
                    matchingSavedPeriodForCurrentSelection?.id === sp.id;

                  return (
                    <div
                      key={sp.id}
                      className="p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3"
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
                      <div className="space-y-2">
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
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            {sp.conceptos.length} conceptos · 100%
                          </span>
                        </div>

                        <div className="font-display font-bold text-sm text-slate-900">
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

                      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/80">
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
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MIS BITÁCORAS (SELECTOR DESPLEGABLE Y BOTONES DE GRUPOS)       */}
      {/* ===================================================================== */}
      {activeTab === 'registros' && (
        <div className="space-y-6">
          {/* Selector de Periodo y Botones de Grupos Asignados al Docente */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  {isTeacherRole
                    ? 'Selecciona uno de tus grupos asignados para abrir su bitácora correspondiente.'
                    : 'Selecciona el periodo y el grupo para visualizar su bitácora.'}
                </p>
              </div>

              {collegeSavedPeriods.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={activeBitacoraPeriod?.id || ''}
                    onChange={(e) => setActiveSavedPeriodId(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border-2 text-xs font-extrabold focus:outline-none cursor-pointer min-w-[260px]"
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

            {/* Botones de Grupos Asignados (al seleccionar uno cambia a la bitácora de ese grupo) */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" style={{ color: primaryColor }} />
                  Grupos asignados ({assignedBitacoraGroups.length}):
                </span>
                {assignedBitacoraGroups.length > 0 ? (
                  assignedBitacoraGroups.map((g) => {
                    const gKey = `${g.nivel}-${g.groupLabel}`;
                    const isSelectedGroup =
                      activeGroupBlock &&
                      `${activeGroupBlock.nivel}-${activeGroupBlock.groupLabel}` === gKey;
                    return (
                      <button
                        key={gKey}
                        type="button"
                        onClick={() => setSelectedGroupKey(gKey)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        style={
                          isSelectedGroup
                            ? {
                                backgroundColor: primaryColor,
                                borderColor: primaryColor,
                                color: '#FFFFFF',
                              }
                            : {
                                backgroundColor: `${primaryColor}10`,
                                borderColor: `${primaryColor}30`,
                                color: primaryColor,
                              }
                        }
                      >
                        <span>
                          {g.groupLabel} ({g.nivel})
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs font-semibold text-amber-700">
                    Sin grupos asignados
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* BITÁCORA DEL GRUPO SELECCIONADO                                 */}
          {/* =============================================================== */}
          {assignedBitacoraGroups.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 text-xs shadow-2xs">
              No tienes grupos asignados actualmente. Asigna los grupos del docente en el módulo <strong>Docentes</strong> para visualizar sus bitácoras.
            </div>
          ) : collegeSavedPeriods.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-amber-300 p-10 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1 max-w-xl mx-auto">
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Aún no hay Periodos ni Conceptos de Evaluación guardados
                </h4>
                <p className="text-xs text-slate-500">
                  Para habilitar la bitácora de calificaciones de tus alumnos, primero configura los conceptos a calificar en la pestaña <strong>"Conceptos de Evaluación"</strong> y presiona <strong>"Guardar Periodo"</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('conceptos')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm cursor-pointer"
                style={{ backgroundColor: primaryColor, borderBottom: `3px solid ${goldColor}` }}
              >
                <Percent className="w-4 h-4" style={{ color: goldColor }} />
                <span>Ir a Configurar Conceptos y Guardar Periodo</span>
              </button>
            </div>
          ) : (
            activeGroupBlock &&
            (() => {
              const groupBlock = activeGroupBlock;
              // Tareas y exámenes dados de alta por el docente para este grupo dentro del rango de fechas del periodo activo
              const groupTasks = getTasksForGroupAndSubject(groupBlock.groupLabel);
              const groupExams = getExamsForGroupAndSubject(groupBlock.groupLabel);
              const groupTasksCount = groupTasks.length;
              const groupExamsCount = groupExams.length;
              const activeGroupConcepts = getActiveConceptsForGroup(
                groupTasksCount,
                groupExamsCount
              );
              const hasTasksConceptForGroup = groupTasksCount > 0;
              const periodFallbackDates = activeBitacoraPeriod
                ? getDefaultDateRangeForPeriod(
                    activeBitacoraPeriod.periodicidad,
                    activeBitacoraPeriod.periodoIndex
                  )
                : { fechaInicio: rangeStartDate, fechaFin: rangeEndDate };
              const periodStartStr =
                activeBitacoraPeriod?.fechaInicio || periodFallbackDates.fechaInicio;
              const periodEndStr =
                activeBitacoraPeriod?.fechaFin || periodFallbackDates.fechaFin;
              const tasksConceptInPeriod = bitacoraConcepts.find((c) => c.tipo === 'tareas');
              const examConceptInPeriod = bitacoraConcepts.find((c) => c.tipo === 'examen');

              return (
                <div
                  key={`${groupBlock.nivel}-${groupBlock.groupLabel}`}
                  className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden"
                >
                  {/* Encabezado de la Bitácora del Grupo Seleccionado */}
                  <div
                    className="p-4 sm:p-5 border-b border-slate-200 space-y-3"
                    style={{ backgroundColor: `${primaryColor}06` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="px-3 py-1 rounded-xl text-xs font-extrabold text-white shadow-2xs flex items-center gap-1.5"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Users className="w-3.5 h-3.5" style={{ color: goldColor }} />
                            <span>
                              Grupo {groupBlock.groupLabel} · {groupBlock.nivel}
                            </span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                            {groupBlock.students.length} alumno(s) en este grupo
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3" style={{ color: primaryColor }} />
                            <span>
                              Rango del Periodo: {periodStartStr} al {periodEndStr}
                            </span>
                          </span>
                        </div>

                        <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2 pt-1">
                          <ListChecks className="w-4 h-4" style={{ color: primaryColor }} />
                          <span>
                            Bitácora de Evaluación — Grupo {groupBlock.groupLabel} (
                            {EVALUATION_PERIODICITY_CONFIG[bitacoraPeriodicity]?.label} ·{' '}
                            <span style={{ color: primaryColor }}>{bitacoraPeriodLabel}</span>)
                          </span>
                        </h4>
                      </div>

                      {/* Tareas y Exámenes dados de alta para este grupo en este periodo */}
                      {(groupTasks.length > 0 || groupExams.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {groupTasks.map((t, idx) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold"
                              title={`Tarea T${idx + 1}: ${t.titulo} (Vence: ${t.fechaLimite}) — Cuenta para todas las materias`}
                            >
                              <ClipboardList className="w-3 h-3 text-emerald-600" />
                              <span>
                                T{idx + 1}: {t.titulo}
                              </span>
                            </span>
                          ))}
                          {groupExams.map((ex, idx) => (
                            <span
                              key={ex.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold"
                              title={`Examen E${idx + 1}: ${ex.titulo} · Materia: ${ex.materia} (Fecha: ${ex.fechaLimite})`}
                            >
                              <ClipboardCheck className="w-3 h-3 text-indigo-600" />
                              <span>
                                Examen ({ex.materia}): {ex.titulo}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resumen de la Ecuación del Periodo Activo */}
                    <div className="p-3 rounded-2xl bg-white border border-slate-200/90 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px]"
                          style={{ backgroundColor: `${goldColor}30`, color: primaryColor }}
                        >
                          Fórmula del Periodo
                        </span>
                        {tasksConceptInPeriod && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                            <strong>{groupTasksCount} Tarea(s)</strong> en el periodo ={' '}
                            <strong>{tasksConceptInPeriod.porcentaje}%</strong> (cuentan para todas las materias)
                          </span>
                        )}
                        {examConceptInPeriod && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold">
                            <strong>Examen por Materia</strong> (Aciertos / Total) ={' '}
                            <strong>{examConceptInPeriod.porcentaje}%</strong>
                          </span>
                        )}
                        {bitacoraConcepts
                          .filter((c) => c.tipo !== 'tareas' && c.tipo !== 'examen')
                          .map((c) => {
                            const currentMetaN = getConceptTotalMetaForBitacora(c);
                            return (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold"
                              >
                                <strong>{c.nombre}:</strong>
                                <input
                                  type="number"
                                  min={1}
                                  max={500}
                                  step={1}
                                  value={currentMetaN}
                                  onChange={(e) =>
                                    handleBitacoraConceptTotalMetaChange(
                                      c,
                                      Number(e.target.value) || 1,
                                      groupBlock.students,
                                      groupTasks,
                                      groupExams
                                    )
                                  }
                                  className="w-12 px-1 py-0.2 text-center font-mono font-black text-[11px] bg-white border border-amber-300 rounded text-slate-900 focus:outline-none"
                                  title="Cantidad total N (ej. 10, 12, 15 participaciones/sellos) que equivale al porcentaje total de este concepto"
                                />
                                <span>
                                  registros (N) = <strong>{c.porcentaje}%</strong>
                                </span>
                              </span>
                            );
                          })}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        Cada materia suma Tareas + su Examen + Conceptos manuales (Cantidad / N × %) → Promedio Final
                      </span>
                    </div>
                  </div>

                  {groupBlock.students.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No hay alumnos activos registrados en el grupo{' '}
                      <strong>
                        {groupBlock.groupLabel} ({groupBlock.nivel})
                      </strong>
                      .
                    </div>
                  ) : (
                    <div className="overflow-x-auto relative">
                      <table className="w-full text-left text-xs border-separate border-spacing-0">
                        <thead>
                          <tr
                            className="text-white text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <th
                              className="sticky left-0 z-20 py-3 px-3 whitespace-nowrap border-r border-white/15 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.18)]"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Alumno ({groupBlock.groupLabel})
                            </th>

                            {/* 1. Tareas dadas de alta en el rango del periodo (cuentan para todas las materias) */}
                            {hasTasksConceptForGroup &&
                              groupTasks.map((tItem, i) => (
                                <th
                                  key={tItem.id}
                                  className="py-3 px-1.5 text-center font-mono"
                                  title={`${tItem.titulo} (Vence: ${tItem.fechaLimite})`}
                                >
                                  <span>T{i + 1}</span>
                                  <span
                                    className="block text-[8px] font-sans font-normal truncate max-w-[64px] mx-auto"
                                    style={{ color: goldColor }}
                                  >
                                    {tItem.titulo}
                                  </span>
                                </th>
                              ))}

                            {/* 2. Exámenes dados de alta en el rango del periodo (evaluados por Aciertos / Reactivos) */}
                            {groupExams.map((exItem, i) => (
                              <th
                                key={exItem.id}
                                className="py-3 px-2.5 text-center"
                                title={`${exItem.titulo} (${exItem.materia})`}
                              >
                                <span>{exItem.titulo || `Examen ${i + 1}`}</span>
                                <span
                                  className="block text-[9px] font-mono"
                                  style={{ color: goldColor }}
                                >
                                  {exItem.materia} · Aciertos
                                </span>
                              </th>
                            ))}

                            {/* Si hay concepto Examen pero aún no se ha creado un examen en Tareas y Exámenes, mostrar columna del concepto Examen */}
                            {groupExams.length === 0 &&
                              activeGroupConcepts
                                .filter((c) => c.tipo === 'examen')
                                .map((c) => (
                                  <th key={c.id} className="py-3 px-2.5 text-center">
                                    <span>{c.nombre}</span>
                                    <span
                                      className="block text-[9px] font-mono"
                                      style={{ color: goldColor }}
                                    >
                                      {c.porcentaje}%
                                    </span>
                                  </th>
                                ))}

                            {/* Otros conceptos registrados únicamente si existen */}
                            {activeGroupConcepts
                              .filter((c) => c.tipo !== 'examen')
                              .map((c) => {
                                if (c.tipo === 'tareas') {
                                  return (
                                    <th key={c.id} className="py-3 px-2.5 text-center">
                                      {c.nombre}
                                      <span
                                        className="block text-[9px] font-mono"
                                        style={{ color: goldColor }}
                                      >
                                        {c.porcentaje}%
                                      </span>
                                    </th>
                                  );
                                }
                                return (
                                  <th
                                    key={c.id}
                                    className="py-3 px-2.5 text-center"
                                    title={`${c.nombre} (${c.porcentaje}%)`}
                                  >
                                    <span className="block">{c.nombre}</span>
                                    <span
                                      className="block text-[9px] font-mono"
                                      style={{ color: goldColor }}
                                    >
                                      {c.porcentaje}%
                                    </span>
                                  </th>
                                );
                              })}

                            {/* 3. Materias asignadas al docente (calificación calculada con Tareas + Examen de la materia si existe + Otros conceptos) */}
                            {collegeSubjects.map((sub) => {
                              const normSubName = sub.nombre.trim().toLowerCase();
                              const hasSubExam = groupExams.some((ex) => {
                                const exSub = (ex.materia || '').trim().toLowerCase();
                                if (!exSub) return false;
                                return (
                                  exSub === normSubName ||
                                  exSub.includes(normSubName) ||
                                  normSubName.includes(exSub)
                                );
                              });
                              return (
                                <th key={sub.id} className="py-3 px-2.5 text-center">
                                  <span>{sub.nombre}</span>
                                  <span
                                    className="block text-[9px] font-mono"
                                    style={{ color: goldColor }}
                                  >
                                    {hasSubExam ? 'Tareas + Examen' : 'Otros conceptos (Sin Examen)'}
                                  </span>
                                </th>
                              );
                            })}

                            <th className="py-3 px-2 text-center">% Total</th>
                            <th
                              className="py-3 px-3 text-center"
                              style={{ backgroundColor: goldColor, color: primaryColor }}
                            >
                              Prom. Final
                              <span className="block text-[9px] font-mono">
                                Promedio Materias
                              </span>
                            </th>
                            <th className="py-3 px-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {groupBlock.students.map((student) => {
                            const calc = computeStudentEvaluationBreakdown(
                              student,
                              groupTasks,
                              groupExams
                            );

                            return (
                              <tr
                                key={student.id}
                                className="group hover:bg-slate-50/80 transition-colors [&>td]:border-b [&>td]:border-slate-200"
                              >
                                <td className="sticky left-0 z-10 py-2.5 px-3 whitespace-nowrap bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-200 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.08)]">
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

                                {/* 1. Casillas T1..Tn de las tareas del periodo (cuentan para todas las materias) */}
                                {hasTasksConceptForGroup &&
                                  groupTasks.map((tItem, i) => {
                                    const tIdx = i + 1;
                                    const st =
                                      calc.row.checklistTareas[`T${tIdx}`] ||
                                      (tIdx <= calc.safeDeliveredTasks
                                        ? 'entregada'
                                        : 'no_entregada');
                                    return (
                                      <td key={tItem.id} className="py-2 px-1 text-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleChecklistTask(
                                              student,
                                              tIdx,
                                              groupTasks,
                                              groupExams
                                            )
                                          }
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
                                          title={`${tItem.titulo}: ${st}`}
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

                                {/* 2. Exámenes del periodo evaluados por Aciertos / Total de Reactivos */}
                                {groupExams.map((exItem) => {
                                  const exBreakdown = calc.examResultsById[exItem.id];
                                  const hitsVal = exBreakdown ? exBreakdown.hits : 0;
                                  const totalReactsVal = exBreakdown
                                    ? exBreakdown.totalReactivos
                                    : getExamTotalReactivos(exItem);
                                  const examPctEarned = exBreakdown
                                    ? exBreakdown.weightedPctEarned
                                    : 0;
                                  const examScore10Val = exBreakdown ? exBreakdown.score10 : 0;

                                  return (
                                    <td
                                      key={exItem.id}
                                      className="py-2.5 px-2 text-center font-mono bg-indigo-50/30"
                                    >
                                      <div
                                        className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300"
                                        title="Aciertos obtenidos / Total de reactivos del examen"
                                      >
                                        <input
                                          type="number"
                                          min={0}
                                          max={totalReactsVal}
                                          step={0.5}
                                          value={hitsVal}
                                          onChange={(e) => {
                                            const nextHits = Math.max(
                                              0,
                                              Math.min(
                                                totalReactsVal,
                                                Number(e.target.value) || 0
                                              )
                                            );
                                            const nextScore10 = Number(
                                              ((nextHits / totalReactsVal) * 10).toFixed(1)
                                            );
                                            updateStudentDraft(
                                              student,
                                              groupTasks,
                                              groupExams,
                                              {
                                                calificacionExamen: nextScore10,
                                                puntajesConceptos: {
                                                  ...calc.row.puntajesConceptos,
                                                  [`EXAM_HITS_${exItem.id}`]: nextHits,
                                                  [`EXAM_TOTAL_${exItem.id}`]: totalReactsVal,
                                                  [`EXAM_${exItem.id}`]: nextScore10,
                                                },
                                              }
                                            );
                                          }}
                                          className="w-10 text-center font-mono font-black text-xs text-slate-900 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">/</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={200}
                                          step={1}
                                          value={totalReactsVal}
                                          onChange={(e) => {
                                            const nextTotal = Math.max(
                                              1,
                                              Number(e.target.value) || 1
                                            );
                                            const clampedHits = Math.min(hitsVal, nextTotal);
                                            const nextScore10 = Number(
                                              ((clampedHits / nextTotal) * 10).toFixed(1)
                                            );
                                            updateStudentDraft(
                                              student,
                                              groupTasks,
                                              groupExams,
                                              {
                                                calificacionExamen: nextScore10,
                                                puntajesConceptos: {
                                                  ...calc.row.puntajesConceptos,
                                                  [`EXAM_HITS_${exItem.id}`]: clampedHits,
                                                  [`EXAM_TOTAL_${exItem.id}`]: nextTotal,
                                                  [`EXAM_${exItem.id}`]: nextScore10,
                                                },
                                              }
                                            );
                                          }}
                                          className="w-9 text-center font-mono font-bold text-[10px] text-slate-600 focus:outline-none"
                                          title="Total de reactivos o preguntas del examen"
                                        />
                                      </div>
                                      <span
                                        className="block text-[10px] font-bold mt-0.5"
                                        style={{ color: primaryColor }}
                                      >
                                        {examPctEarned}% · Calif {examScore10Val.toFixed(1)}
                                      </span>
                                    </td>
                                  );
                                })}

                                {/* Si no hay examen creado en Tareas y Exámenes pero sí hay concepto Examen en el periodo */}
                                {groupExams.length === 0 &&
                                  activeGroupConcepts
                                    .filter((c) => c.tipo === 'examen')
                                    .map((c) => {
                                      const val =
                                        calc.row.puntajesConceptos[c.id] ?? calc.examScore10;
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
                                              updateStudentDraft(
                                                student,
                                                groupTasks,
                                                groupExams,
                                                {
                                                  calificacionExamen: numVal,
                                                  puntajesConceptos: {
                                                    ...calc.row.puntajesConceptos,
                                                    [c.id]: numVal,
                                                  },
                                                }
                                              );
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

                                {/* Otros conceptos activos */}
                                {activeGroupConcepts
                                  .filter((c) => c.tipo !== 'examen')
                                  .map((c) => {
                                    if (c.tipo === 'tareas') {
                                      const taskPointsEarned = (
                                        (calc.taskScore10 / 10) *
                                        c.porcentaje
                                      ).toFixed(1);
                                      return (
                                        <td
                                          key={c.id}
                                          className="py-2.5 px-2.5 text-center font-mono bg-emerald-50/30"
                                        >
                                          <div className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300">
                                            <input
                                              type="number"
                                              min={0}
                                              max={calc.safeTotalTasks}
                                              step={0.5}
                                              value={calc.safeDeliveredTasks}
                                              onChange={(e) =>
                                                updateStudentDraft(
                                                  student,
                                                  groupTasks,
                                                  groupExams,
                                                  {
                                                    tareasEntregadasAlumno: Number(
                                                      e.target.value
                                                    ),
                                                  }
                                                )
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
                                            {taskPointsEarned}% de {c.porcentaje}%
                                          </span>
                                        </td>
                                      );
                                    }

                                    const manualBreak = calc.manualConceptResultsById[c.id];
                                    const rawVal = manualBreak
                                      ? manualBreak.rawCount
                                      : Math.max(0, Number(calc.row.puntajesConceptos[c.id] ?? 0));
                                    const totalMetaVal = manualBreak
                                      ? manualBreak.totalMeta
                                      : getConceptTotalMetaForBitacora(c, calc.row);
                                    const ptsEarned = manualBreak
                                      ? manualBreak.weightedPctEarned.toFixed(1)
                                      : (
                                          Math.min(1, rawVal / Math.max(1, totalMetaVal)) *
                                          c.porcentaje
                                        ).toFixed(1);
                                    const conceptScore10 = manualBreak
                                      ? manualBreak.score10
                                      : Number(
                                          (
                                            Math.min(1, rawVal / Math.max(1, totalMetaVal)) * 10
                                          ).toFixed(1)
                                        );

                                    return (
                                      <td
                                        key={c.id}
                                        className="py-2.5 px-2 text-center font-mono bg-amber-50/25"
                                      >
                                        <div
                                          className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300"
                                          title={`Cantidad obtenida por el alumno (ej. 10, 8, 12 o N) / Total N (${totalMetaVal}) = ${ptsEarned}% de ${c.porcentaje}%`}
                                        >
                                          <input
                                            type="number"
                                            min={0}
                                            max={500}
                                            step={0.5}
                                            value={rawVal}
                                            onChange={(e) => {
                                              const numVal = Math.max(
                                                0,
                                                Number(e.target.value) || 0
                                              );
                                              const nextTotal = Math.max(totalMetaVal, numVal);
                                              if (numVal > totalMetaVal) {
                                                const overrideKey = `${activeBitacoraPeriod?.id || 'default'}__${c.id}`;
                                                setConceptTotalMetaOverrides((prev) => ({
                                                  ...prev,
                                                  [overrideKey]: nextTotal,
                                                }));
                                              }
                                              updateStudentDraft(
                                                student,
                                                groupTasks,
                                                groupExams,
                                                {
                                                  puntajesConceptos: {
                                                    ...calc.row.puntajesConceptos,
                                                    [c.id]: numVal,
                                                    [`CONCEPT_TOTAL_${c.id}`]: nextTotal,
                                                  },
                                                }
                                              );
                                            }}
                                            className="w-11 text-center font-mono font-black text-xs text-slate-900 focus:outline-none"
                                            title="Coloca la cantidad del alumno (ej. 10, 8, 12 o N participaciones/sellos)"
                                          />
                                          <span className="text-[10px] text-slate-400">/</span>
                                          <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            step={1}
                                            value={totalMetaVal}
                                            onChange={(e) =>
                                              handleBitacoraConceptTotalMetaChange(
                                                c,
                                                Number(e.target.value) || 1,
                                                groupBlock.students,
                                                groupTasks,
                                                groupExams
                                              )
                                            }
                                            className="w-10 text-center font-mono font-bold text-[10px] text-slate-600 focus:outline-none"
                                            title="Cantidad Total N que equivale al 100% de este concepto"
                                          />
                                        </div>
                                        <span
                                          className="block text-[10px] font-bold mt-0.5"
                                          style={{ color: primaryColor }}
                                        >
                                          {ptsEarned}% de {c.porcentaje}% · Calif {conceptScore10.toFixed(1)}
                                        </span>
                                      </td>
                                    );
                                  })}

                                {/* 3. Celdas de Materias Asignadas al Docente: Calificación calculada con Tareas (todas las materias) + Examen de la materia */}
                                {collegeSubjects.map((sub) => {
                                  const subBreakdown = calc.subjectBreakdowns[sub.id];
                                  const subVal = subBreakdown
                                    ? subBreakdown.finalSubjectGrade10
                                    : calc.finalGrade10;
                                  const subPct = subBreakdown
                                    ? subBreakdown.totalSubjectPct
                                    : calc.porcentajeFinalObtenido;
                                  const subTasksPct = subBreakdown
                                    ? subBreakdown.tasksWeightedPct
                                    : 0;
                                  const subOtherPct = subBreakdown
                                    ? subBreakdown.otherConceptsWeightedPct
                                    : 0;
                                  const subExamPct = subBreakdown
                                    ? subBreakdown.examWeightedPct
                                    : 0;

                                  const hasSubExam = Boolean(
                                    subBreakdown && subBreakdown.matchedExams.length > 0
                                  );

                                  return (
                                    <td
                                      key={sub.id}
                                      className="py-2.5 px-2 text-center bg-slate-50/50"
                                      title={
                                        hasSubExam
                                          ? `${sub.nombre}: Tareas ${subTasksPct}% + Otros conceptos ${subOtherPct}% + Examen ${subExamPct}% = ${subPct}% (Calif: ${subVal.toFixed(1)})`
                                          : `${sub.nombre} (Sin examen publicado): Evaluado solo con otros conceptos (Tareas ${subTasksPct}% + Captura manual ${subOtherPct}%) → ${subPct}% (Calif: ${subVal.toFixed(1)})`
                                      }
                                    >
                                      <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        value={subVal}
                                        onChange={(e) => {
                                          const numVal = Math.max(
                                            0,
                                            Math.min(10, Number(e.target.value) || 0)
                                          );
                                          updateStudentDraft(
                                            student,
                                            groupTasks,
                                            groupExams,
                                            {
                                              puntajesConceptos: {
                                                ...calc.row.puntajesConceptos,
                                                [`SUBJ_${sub.id}`]: numVal,
                                                [`SUBJ_MANUAL_${sub.id}`]: 1,
                                              },
                                            }
                                          );
                                        }}
                                        className="w-14 px-1.5 py-1 text-center font-mono font-black text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                                      />
                                      <span
                                        className="block text-[9px] font-mono font-bold mt-0.5"
                                        style={{ color: primaryColor }}
                                      >
                                        T:{subTasksPct}%
                                        {subOtherPct > 0 ? ` + C:${subOtherPct}%` : ''}
                                        {hasSubExam ? ` + Ex:${subExamPct}%` : ' (Sin Ex.)'}
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

                                {/* Calificación Promedio Final (Automática o Manual) */}
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
                                          updateStudentDraft(
                                            student,
                                            groupTasks,
                                            groupExams,
                                            {
                                              calificacionManual: Number(e.target.value),
                                            }
                                          )
                                        }
                                        className="w-14 px-1.5 py-1 text-center font-mono font-black text-xs bg-white border-2 rounded-lg text-slate-950"
                                        style={{ borderColor: primaryColor }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateStudentDraft(
                                            student,
                                            groupTasks,
                                            groupExams,
                                            {
                                              calificacionManualActiva: false,
                                            }
                                          )
                                        }
                                        className="px-1.5 py-0.5 rounded text-[10px] text-white cursor-pointer font-bold"
                                        style={{ backgroundColor: primaryColor }}
                                        title="Volver a cálculo automático por promedio de materias"
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
                                          updateStudentDraft(
                                            student,
                                            groupTasks,
                                            groupExams,
                                            {
                                              calificacionManualActiva: true,
                                              calificacionManual: calc.finalGrade10,
                                            }
                                          )
                                        }
                                        className="p-1.5 rounded-lg text-white cursor-pointer"
                                        style={{ backgroundColor: primaryColor }}
                                        title="Agregar o modificar calificación manualmente"
                                      >
                                        <Edit3
                                          className="w-3 h-3"
                                          style={{ color: goldColor }}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* Guardar */}
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveSingleStudentRecord(
                                          student,
                                          groupTasks,
                                          groupExams
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shadow-2xs cursor-pointer transition-opacity hover:opacity-95"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      <Save
                                        className="w-3 h-3"
                                        style={{ color: goldColor }}
                                      />
                                      <span>Guardar</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
