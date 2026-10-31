import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { compressImageFile } from '../utils/imageCompressor';
import {
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  CheckSquare,
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Shuffle,
  Award,
  Layers,
  Link2,
  ListChecks,
  BookOpen,
  Upload,
  FileText,
  Paperclip,
  Users,
  Download,
  Pencil,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import {
  TaskOrExam,
  ExamQuestion,
  ExamQuestionType,
  ExamQuestionOption,
  ExamMatchingPair,
  ExamInteractiveConfig,
} from '../types';
import { MatchingQuestionStudentView } from '../components/MatchingQuestionStudentView';

const QUESTION_TYPE_META: Record<
  ExamQuestionType,
  { label: string; shortLabel: string; badge: string; desc: string }
> = {
  opcion_multiple_unica: {
    label: 'Opción Múltiple (Respuesta Sencilla / Única)',
    shortLabel: 'Respuesta Sencilla',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    desc: 'El alumno elige una sola respuesta correcta entre varias opciones.',
  },
  opcion_multiple_varias: {
    label: 'Opción Múltiple (Varias Respuestas Correctas)',
    shortLabel: 'Respuesta Múltiple',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: 'El alumno debe marcar dos o más opciones que sean correctas.',
  },
  relacionar_columnas: {
    label: 'Relacionar Frases con Respuestas (Columnas)',
    shortLabel: 'Relacionar Frases',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'El alumno conecta cada frase o concepto con su definición o par correcto.',
  },
  verdadero_falso: {
    label: 'Verdadero o Falso',
    shortLabel: 'Verdadero / Falso',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Reactivo ágil para validar si un enunciado o imagen es verdadero o falso.',
  },
  respuesta_corta: {
    label: 'Respuesta Corta / Palabra Clave Exacta',
    shortLabel: 'Respuesta Corta',
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    desc: 'El alumno escribe el concepto, resultado numérico o palabra clave exacta.',
  },
};

const createInitialQuestion = (num: number, tipo: ExamQuestionType = 'opcion_multiple_unica'): ExamQuestion => {
  const baseId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (tipo === 'verdadero_falso') {
    return {
      id: baseId,
      numero: num,
      tipo,
      enunciado: '',
      puntos: 2,
      opciones: [
        { id: `${baseId}-opt-1`, texto: 'Verdadero', esCorrecta: true },
        { id: `${baseId}-opt-2`, texto: 'Falso', esCorrecta: false },
      ],
      pistaOpcional: '',
      retroalimentacion: '',
    };
  }
  if (tipo === 'relacionar_columnas') {
    return {
      id: baseId,
      numero: num,
      tipo,
      enunciado: 'Relaciona cada frase o concepto con su respuesta correspondiente:',
      puntos: 3,
      paresRelacion: [
        { id: `${baseId}-pair-1`, fraseIzquierda: '', respuestaDerecha: '' },
        { id: `${baseId}-pair-2`, fraseIzquierda: '', respuestaDerecha: '' },
        { id: `${baseId}-pair-3`, fraseIzquierda: '', respuestaDerecha: '' },
      ],
      pistaOpcional: '',
      retroalimentacion: '',
    };
  }
  if (tipo === 'respuesta_corta') {
    return {
      id: baseId,
      numero: num,
      tipo,
      enunciado: '',
      puntos: 2,
      respuestaCortaCorrecta: '',
      pistaOpcional: '',
      retroalimentacion: '',
    };
  }
  return {
    id: baseId,
    numero: num,
    tipo,
    enunciado: '',
    puntos: 2,
    opciones: [
      { id: `${baseId}-opt-1`, texto: '', esCorrecta: true },
      { id: `${baseId}-opt-2`, texto: '', esCorrecta: false },
      { id: `${baseId}-opt-3`, texto: '', esCorrecta: false },
      { id: `${baseId}-opt-4`, texto: '', esCorrecta: false },
    ],
    pistaOpcional: '',
    retroalimentacion: '',
  };
};

// Helper para niveles permitidos del colegio
const getAllowedLevelsForCollege = (collegeNivel?: string): ('Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria')[] => {
  const raw = (collegeNivel || '').toLowerCase();
  if (raw.includes('multi')) {
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  }
  if (raw.includes('preescolar') || raw.includes('kínder') || raw.includes('kinder') || raw.includes('maternal')) {
    return ['Preescolar'];
  }
  if (raw.includes('secundaria')) {
    return ['Secundaria'];
  }
  if (raw.includes('prepa') || raw.includes('bachiller')) {
    return ['Preparatoria'];
  }
  return ['Primaria'];
};

export const TasksExamsModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    students,
    teachers,
    subjects,
    tasksExams,
    evaluationSavedPeriods,
    addTaskOrExam,
    updateTaskOrExam,
    deleteTaskOrExam,
    getGroupsForCollegeLevel,
    schoolCycles,
  } = useApp();

  // Ciclo escolar activo y selector
  const collegeCycles = React.useMemo(() => {
    return (schoolCycles || []).filter((c) => c.colegioId === activeCollege?.id);
  }, [schoolCycles, activeCollege?.id]);

  const activeSchoolCycle = React.useMemo(() => {
    return collegeCycles.find((c) => c.activo) || collegeCycles[0] || null;
  }, [collegeCycles]);

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  React.useEffect(() => {
    if (activeSchoolCycle && !selectedCycleId) {
      setSelectedCycleId(activeSchoolCycle.id);
    }
  }, [activeSchoolCycle, selectedCycleId]);

  const currentEffectiveCycleId = selectedCycleId || activeSchoolCycle?.id || '';

  const [filterType, setFilterType] = useState<'todos' | 'tarea' | 'examen' | 'proyecto'>('todos');

  const allowedLevels = React.useMemo(() => {
    return getAllowedLevelsForCollege(activeCollege?.nivel);
  }, [activeCollege?.nivel]);

  // Two distinct modals: one for Tarea/Proyecto, one for Interactive Exam Builder
  const [isTaskProjectOpen, setIsTaskProjectOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [noPeriodWarningOpen, setNoPeriodWarningOpen] = useState(false);
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');

  // Modal de advertencia al cancelar / salir con opción de guardar borrador
  const [exitWarningModal, setExitWarningModal] = useState<'task_project' | 'exam' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [evidenceModalTaskId, setEvidenceModalTaskId] = useState<string | null>(null);
  const [selectedEvidenceGroupTab, setSelectedEvidenceGroupTab] = useState<string>('todos');
  const [previewExamItem, setPreviewExamItem] = useState<TaskOrExam | null>(null);
  const [previewModeAsStudent, setPreviewModeAsStudent] = useState(true);
  const [studentSimulationAnswers, setStudentSimulationAnswers] = useState<Record<string, any>>({});
  const [studentSimulationSubmitted, setStudentSimulationSubmitted] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  const isTeacherRole = currentUser?.rol === 'docente';
  const currentTeacherRecord = React.useMemo(() => {
    if (!activeCollege || !currentUser) return null;
    const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
    const expectedTchId = currentUser.id.replace(/^usr-/, '');
    const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
    const usrEmail = (currentUser.correo || '').trim().toLowerCase();
    const usrName = (currentUser.nombre || '').trim().toLowerCase();

    const byId = collegeTeachers.find(
      (t) => t.id === currentUser.id || t.id === expectedTchId
    );
    if (byId) return byId;

    if (usrName) {
      const byName = collegeTeachers.find(
        (t) => (t.nombre || '').trim().toLowerCase() === usrName
      );
      if (byName) return byName;
    }

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

    if (usrEmail) {
      const emailMatches = collegeTeachers.filter(
        (t) => (t.correo || '').trim().toLowerCase() === usrEmail
      );
      if (emailMatches.length === 1) return emailMatches[0];
    }

    return null;
  }, [activeCollege, currentUser, teachers]);

  const currentOwnerIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentUser?.id) {
      ids.add(currentUser.id.trim().toLowerCase());
      ids.add(currentUser.id.replace(/^usr-/, '').trim().toLowerCase());
    }
    if (currentUser?.usuarioLogin) {
      ids.add(currentUser.usuarioLogin.trim().toLowerCase());
    }
    if (currentTeacherRecord?.id) {
      ids.add(currentTeacherRecord.id.trim().toLowerCase());
      ids.add(`usr-${currentTeacherRecord.id}`.trim().toLowerCase());
    }
    return ids;
  }, [currentUser, currentTeacherRecord]);

  const currentOwnerNames = React.useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.nombre) names.add(currentUser.nombre.trim().toLowerCase());
    if (currentTeacherRecord?.nombre) {
      names.add(currentTeacherRecord.nombre.trim().toLowerCase());
    }
    return names;
  }, [currentUser?.nombre, currentTeacherRecord]);

  const collegeSavedPeriods = React.useMemo(() => {
    if (!activeCollege) return [];
    return (evaluationSavedPeriods || []).filter((p) => {
      if (p.colegioId !== activeCollege.id) return false;
      if (isTeacherRole) {
        const pDocId = (p.docenteId || '').trim().toLowerCase();
        const pDocName = (p.docenteNombre || '').trim().toLowerCase();
        if (pDocId && currentOwnerIds.has(pDocId)) return true;
        if (pDocName && currentOwnerNames.has(pDocName)) return true;
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
      }
      return true;
    });
  }, [activeCollege, evaluationSavedPeriods, isTeacherRole, currentOwnerIds, currentOwnerNames]);

  const teacherAssignedSubjects = React.useMemo(() => {
    if (!activeCollege) return [];
    if (isTeacherRole && currentTeacherRecord) {
      const fromTeacher = (currentTeacherRecord.materias || [])
        .map((m) => m.trim())
        .filter(Boolean);
      if (fromTeacher.length > 0) {
        return Array.from(new Set(fromTeacher));
      }
      const fromSubjectsMod = subjects
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (s.docenteId === currentTeacherRecord.id ||
              (s.docenteNombre &&
                s.docenteNombre.trim().toLowerCase() ===
                  currentTeacherRecord.nombre.trim().toLowerCase()))
        )
        .map((s) => s.nombre);
      return Array.from(new Set(fromSubjectsMod));
    }
    return Array.from(
      new Set(subjects.filter((s) => s.colegioId === activeCollege.id).map((s) => s.nombre))
    );
  }, [activeCollege, isTeacherRole, currentTeacherRecord, subjects]);

  const teacherAssignedGroups = React.useMemo(() => {
    if (!activeCollege) return [];
    const registeredSet = new Set<string>();
    allowedLevels.forEach((lvl) => {
      getGroupsForCollegeLevel(activeCollege.id, lvl).forEach((g) => {
        registeredSet.add(g.replace(/["']/g, '').replace(/\s+/g, ' ').trim());
      });
    });

    if (isTeacherRole && currentTeacherRecord) {
      const fromTeacher = (currentTeacherRecord.grupos || [])
        .map((g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim())
        .filter((g) => g && registeredSet.has(g));
      const fromSubjects = subjects
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (s.docenteId === currentTeacherRecord.id ||
              (s.docenteNombre &&
                s.docenteNombre.trim().toLowerCase() ===
                  currentTeacherRecord.nombre.trim().toLowerCase())) &&
            s.grado
        )
        .map((s) => `${s.grado}${s.grupo ? ` ${s.grupo}` : ''}`.replace(/["']/g, '').replace(/\s+/g, ' ').trim())
        .filter((g) => g && registeredSet.has(g));
      return Array.from(new Set([...fromTeacher, ...fromSubjects]));
    }
    return [];
  }, [activeCollege, isTeacherRole, currentTeacherRecord, subjects, allowedLevels, getGroupsForCollegeLevel]);

  // Shared fields for Tarea / Proyecto and Examen
  const [tipoTareaProyecto, setTipoTareaProyecto] = useState<'tarea' | 'proyecto'>('tarea');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState('');
  const [gradoGrupo, setGradoGrupo] = useState('');
  const [selectedGroupsForTask, setSelectedGroupsForTask] = useState<string[]>([]);
  const [selectedGroupsForExam, setSelectedGroupsForExam] = useState<string[]>([]);
  const [programarExamen, setProgramarExamen] = useState<boolean>(true);
  const [fechaHabilitacionExamen, setFechaHabilitacionExamen] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [horaHabilitacionExamen, setHoraHabilitacionExamen] = useState<string>('08:00');
  const [horaLimiteExamen, setHoraLimiteExamen] = useState<string>('23:59');
  const [docenteNombre, setDocenteNombre] = useState('');
  const [fechaLimite, setFechaLimite] = useState('2026-10-15');
  const [puntos, setPuntos] = useState('10');
  const [instrucciones, setInstrucciones] = useState('');
  const [solicitarEvidencia, setSolicitarEvidencia] = useState(false);
  const [evidenciaNombre, setEvidenciaNombre] = useState('');
  const [evidenciaUrl, setEvidenciaUrl] = useState('');
  const [evidenciaTipo, setEvidenciaTipo] = useState('');

  // Interactive Exam Builder state
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(() => [
    createInitialQuestion(1, 'opcion_multiple_unica'),
  ]);
  const [newQuestionTypeToAdd, setNewQuestionTypeToAdd] = useState<ExamQuestionType>(
    'opcion_multiple_unica'
  );
  const [examConfig, setExamConfig] = useState<ExamInteractiveConfig>({
    tiempoLimiteMinutos: 45,
    ordenAleatorioPreguntas: true,
    mezclarOpciones: true,
    modoGamificado: true,
    permitirPistas: true,
    mostrarCalificacionAlTerminar: true,
    temaVisual: 'desafio_quiz',
  });
  const [builderPreviewStudentView, setBuilderPreviewStudentView] = useState(false);
  const [builderPreviewAnswers, setBuilderPreviewAnswers] = useState<Record<string, Record<string, string>>>({});
  const [builderShuffleKey, setBuilderShuffleKey] = useState(0);

  React.useEffect(() => {
    if (isTaskProjectOpen || isExamBuilderOpen) {
      setDocenteNombre(currentTeacherRecord?.nombre || currentUser?.nombre || 'Docente');
      if (collegeSavedPeriods.length > 0 && !selectedPeriodId) {
        const defaultPeriod = collegeSavedPeriods[collegeSavedPeriods.length - 1];
        setSelectedPeriodId(defaultPeriod.id);
        if (defaultPeriod.fechaFin) {
          setFechaLimite(defaultPeriod.fechaFin);
        }
      }
      if (teacherAssignedSubjects.length > 0 && !materia) {
        setMateria(teacherAssignedSubjects[0]);
      }
      if (teacherAssignedGroups.length > 0 && !gradoGrupo) {
        setGradoGrupo(teacherAssignedGroups[0]);
      } else if (!gradoGrupo) {
        setGradoGrupo('1° A');
      }
    }
  }, [
    isTaskProjectOpen,
    isExamBuilderOpen,
    currentTeacherRecord,
    currentUser,
    teacherAssignedSubjects,
    teacherAssignedGroups,
    collegeSavedPeriods,
    selectedPeriodId,
    materia,
    gradoGrupo,
  ]);

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';
  const collegeItems = tasksExams.filter((t) => {
    if (t.colegioId !== activeCollege.id) return false;
    if (currentEffectiveCycleId) {
      if (t.cicloId && t.cicloId !== currentEffectiveCycleId) return false;
      if (!t.cicloId) {
        const oldestCycle = collegeCycles[collegeCycles.length - 1];
        if (oldestCycle && oldestCycle.id !== currentEffectiveCycleId) return false;
      }
    }
    const itemDocId = (t.docenteId || '').trim().toLowerCase();
    const itemDocName = (t.docenteNombre || '').trim().toLowerCase();
    const matchesId = Boolean(itemDocId && currentOwnerIds.has(itemDocId));
    const matchesName = Boolean(itemDocName && currentOwnerNames.has(itemDocName));
    const isOwnedByCurrentUser = matchesId || matchesName;

    // Todo registro de tarea, examen y proyecto que el usuario de docente haga en su perfil es únicamente para él:
    // solo ese usuario puede verlo en el panel.
    if (!isOwnedByCurrentUser) return false;

    if (isTeacherRole && teacherAssignedSubjects.length > 0 && t.materia) {
      const itemSub = t.materia.trim().toLowerCase();
      const matchesAssignedSub = teacherAssignedSubjects.some((sub) => {
        const normSub = sub.trim().toLowerCase();
        return itemSub === normSub || itemSub.includes(normSub) || normSub.includes(itemSub);
      });
      if (!matchesAssignedSub) return false;
    }
    return true;
  });

  const filtered = collegeItems.filter(
    (t) => filterType === 'todos' || t.tipo === filterType
  );

  const handleOpenTaskProjectModal = () => {
    if (collegeSavedPeriods.length === 0) {
      setNoPeriodWarningOpen(true);
      return;
    }
    setEditingTaskId(null);
    setTitulo('');
    setInstrucciones('');
    setPuntos('10');
    setTipoTareaProyecto('tarea');
    setSolicitarEvidencia(false);
    setEvidenciaNombre('');
    setEvidenciaUrl('');
    setEvidenciaTipo('');
    if (teacherAssignedGroups.length > 0) {
      setSelectedGroupsForTask([teacherAssignedGroups[0]]);
    }
    setIsTaskProjectOpen(true);
  };

  const handleEditTaskOrExam = (item: TaskOrExam) => {
    const itemAssignedGroups =
      Array.isArray(item.gruposAsignados) && item.gruposAsignados.length > 0
        ? item.gruposAsignados
        : (item.gradoGrupo || '')
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean);

    if (item.tipo === 'examen') {
      setEditingExamId(item.id);
      setSelectedPeriodId(
        item.savedPeriodId ||
          (collegeSavedPeriods.length > 0
            ? collegeSavedPeriods[collegeSavedPeriods.length - 1].id
            : '')
      );
      setTitulo(item.titulo || '');
      setMateria(item.materia || (teacherAssignedSubjects[0] ?? ''));
      setGradoGrupo(item.gradoGrupo || '1° A');
      setSelectedGroupsForExam(
        itemAssignedGroups.length > 0
          ? itemAssignedGroups
          : teacherAssignedGroups.length > 0
            ? [teacherAssignedGroups[0]]
            : []
      );
      setDocenteNombre(item.docenteNombre || currentTeacherRecord?.nombre || currentUser?.nombre || 'Docente');
      const rawLimiteParts = (item.fechaLimite || '2026-10-15').trim().split(/[\sT]+/);
      setFechaLimite(rawLimiteParts[0] || '2026-10-15');
      setHoraLimiteExamen(rawLimiteParts[1] ? rawLimiteParts[1].slice(0, 5) : '23:59');
      setProgramarExamen(Boolean(item.programado));
      if (item.fechaHabilitacion) {
        const rawHabParts = item.fechaHabilitacion.trim().split(/[\sT]+/);
        setFechaHabilitacionExamen(rawHabParts[0]);
        if (rawHabParts[1] && !item.horaHabilitacion) {
          setHoraHabilitacionExamen(rawHabParts[1].slice(0, 5));
        }
      }
      if (item.horaHabilitacion) {
        setHoraHabilitacionExamen(item.horaHabilitacion.slice(0, 5));
      }
      setInstrucciones(
        item.instrucciones ||
          'Lee cuidadosamente cada reactivo y selecciona o relaciona la respuesta correcta.'
      );
      setExamQuestions(
        Array.isArray(item.preguntasExamen) && item.preguntasExamen.length > 0
          ? item.preguntasExamen
          : [createInitialQuestion(1, 'opcion_multiple_unica')]
      );
      if (item.configuracionExamen) {
        setExamConfig(item.configuracionExamen);
      }
      setBuilderPreviewStudentView(false);
      setIsExamBuilderOpen(true);
      return;
    }

    setEditingTaskId(item.id);
    setTipoTareaProyecto(item.tipo === 'proyecto' ? 'proyecto' : 'tarea');
    setSelectedPeriodId(
      item.savedPeriodId ||
        (collegeSavedPeriods.length > 0
          ? collegeSavedPeriods[collegeSavedPeriods.length - 1].id
          : '')
    );
    setTitulo(item.titulo || '');
    setMateria(item.materia || (teacherAssignedSubjects[0] ?? ''));
    setGradoGrupo(item.gradoGrupo || '1° A');
    setSelectedGroupsForTask(
      itemAssignedGroups.length > 0
        ? itemAssignedGroups
        : teacherAssignedGroups.length > 0
          ? [teacherAssignedGroups[0]]
          : []
    );
    setDocenteNombre(item.docenteNombre || currentTeacherRecord?.nombre || currentUser?.nombre || 'Docente');
    setFechaLimite((item.fechaLimite || '').split(' ')[0] || '2026-10-15');
    setPuntos(String(item.puntosMaximos || 10));
    setInstrucciones(item.instrucciones || '');
    setSolicitarEvidencia(Boolean(item.solicitarEvidencia));
    setEvidenciaNombre(item.evidenciaNombre || '');
    setEvidenciaUrl(item.evidenciaUrl || '');
    setEvidenciaTipo(item.evidenciaTipo || '');
    setIsTaskProjectOpen(true);
  };

  const handleEvidenceFileUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 540, 540, 0.82);
      setEvidenciaNombre(file.name);
      setEvidenciaUrl(dataUrl);
      setEvidenciaTipo(file.type || 'archivo');
    } catch {
      // ignore
    }
  };

  const handleToggleGroupForTask = (grp: string) => {
    setSelectedGroupsForTask((prev) => {
      if (prev.includes(grp)) {
        // Prevent empty selection so at least one group stays selected
        if (prev.length <= 1) return prev;
        return prev.filter((g) => g !== grp);
      }
      return [...prev, grp];
    });
  };

  const handleSelectAllTeacherGroups = () => {
    if (selectedGroupsForTask.length === teacherAssignedGroups.length) {
      setSelectedGroupsForTask(teacherAssignedGroups.length > 0 ? [teacherAssignedGroups[0]] : []);
    } else {
      setSelectedGroupsForTask([...teacherAssignedGroups]);
    }
  };

  const handleToggleGroupForExam = (grp: string) => {
    setSelectedGroupsForExam((prev) => {
      if (prev.includes(grp)) {
        if (prev.length <= 1) return prev;
        return prev.filter((g) => g !== grp);
      }
      return [...prev, grp];
    });
  };

  const handleSelectAllTeacherGroupsForExam = () => {
    if (selectedGroupsForExam.length === teacherAssignedGroups.length) {
      setSelectedGroupsForExam(teacherAssignedGroups.length > 0 ? [teacherAssignedGroups[0]] : []);
    } else {
      setSelectedGroupsForExam([...teacherAssignedGroups]);
    }
  };

  const handleOpenExamBuilderModal = () => {
    if (collegeSavedPeriods.length === 0) {
      setNoPeriodWarningOpen(true);
      return;
    }
    setEditingExamId(null);
    setTitulo('');
    setInstrucciones('Lee cuidadosamente cada reactivo y selecciona o relaciona la respuesta correcta.');
    setExamQuestions([createInitialQuestion(1, 'opcion_multiple_unica')]);
    setBuilderPreviewStudentView(false);
    setProgramarExamen(true);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setFechaHabilitacionExamen(`${yyyy}-${mm}-${dd}`);
    setHoraHabilitacionExamen('08:00');
    setHoraLimiteExamen('23:59');
    if (teacherAssignedGroups.length > 0) {
      setSelectedGroupsForExam([teacherAssignedGroups[0]]);
    }
    setIsExamBuilderOpen(true);
  };

  const handleCreateTaskOrProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (collegeSavedPeriods.length === 0 && !editingTaskId) {
      setIsTaskProjectOpen(false);
      setNoPeriodWarningOpen(true);
      return;
    }
    if (!titulo.trim()) return;

    const linkedPeriod =
      collegeSavedPeriods.find((p) => p.id === selectedPeriodId) ||
      collegeSavedPeriods[collegeSavedPeriods.length - 1];

    const groupsToAssign =
      teacherAssignedGroups.length > 0
        ? selectedGroupsForTask.length > 0
          ? selectedGroupsForTask
          : [teacherAssignedGroups[0]]
        : [gradoGrupo || '1° A'];

    const ownerDocId = currentTeacherRecord?.id || currentUser?.id || '';

    if (editingTaskId) {
      updateTaskOrExam(editingTaskId, {
        tipo: tipoTareaProyecto,
        titulo,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite,
        puntosMaximos: 10,
        estado: 'Activa',
        instrucciones,
        solicitarEvidencia,
        evidenciaNombre: evidenciaNombre || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
        evidenciaTipo: evidenciaTipo || undefined,
        ...(linkedPeriod
          ? {
              savedPeriodId: linkedPeriod.id,
              periodoNombre: linkedPeriod.periodoNombre,
              fechaInicioPeriodo: linkedPeriod.fechaInicio,
              fechaFinPeriodo: linkedPeriod.fechaFin,
            }
          : {}),
      });
      setToastMessage(`"${titulo}" ha sido guardada y publicada oficialmente.`);
    } else {
      // Generar UNA SOLA TAREA (ya sea para 1 grupo específico o para ambos grupos)
      addTaskOrExam({
        colegioId: activeCollege.id,
        cicloId: currentEffectiveCycleId || undefined,
        tipo: tipoTareaProyecto,
        titulo,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite,
        puntosMaximos: 10,
        estado: 'Activa',
        instrucciones,
        solicitarEvidencia,
        evidenciaNombre: evidenciaNombre || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
        evidenciaTipo: evidenciaTipo || undefined,
        entregasEvidencias: [],
        savedPeriodId: linkedPeriod?.id,
        periodoNombre: linkedPeriod?.periodoNombre,
        fechaInicioPeriodo: linkedPeriod?.fechaInicio,
        fechaFinPeriodo: linkedPeriod?.fechaFin,
      });
      setToastMessage(`"${titulo}" publicada con éxito para los alumnos.`);
    }

    setEditingTaskId(null);
    setTitulo('');
    setInstrucciones('');
    setSolicitarEvidencia(false);
    setEvidenciaNombre('');
    setEvidenciaUrl('');
    setEvidenciaTipo('');
    setIsTaskProjectOpen(false);
    setExitWarningModal(null);
  };

  const totalExamPoints = examQuestions.reduce((acc, q) => acc + (Number(q.puntos) || 0), 0);

  const handleCreateInteractiveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (collegeSavedPeriods.length === 0 && !editingExamId) {
      setIsExamBuilderOpen(false);
      setNoPeriodWarningOpen(true);
      return;
    }
    if (!titulo.trim() || examQuestions.length === 0) return;

    const linkedPeriod =
      collegeSavedPeriods.find((p) => p.id === selectedPeriodId) ||
      collegeSavedPeriods[collegeSavedPeriods.length - 1];

    const groupsToAssign =
      teacherAssignedGroups.length > 0
        ? selectedGroupsForExam.length > 0
          ? selectedGroupsForExam
          : [teacherAssignedGroups[0]]
        : [gradoGrupo || '1° A'];

    const cleanFechaLimiteDate = (fechaLimite || '').trim().split(/[\sT]+/)[0] || '2026-10-15';
    const cleanHoraLimite = (horaLimiteExamen || '23:59').trim().slice(0, 5) || '23:59';
    const formattedExamFechaLimite = `${cleanFechaLimiteDate} ${cleanHoraLimite}`;

    const ownerDocId = currentTeacherRecord?.id || currentUser?.id || '';

    if (editingExamId) {
      updateTaskOrExam(editingExamId, {
        titulo,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite: formattedExamFechaLimite,
        programado: programarExamen,
        fechaHabilitacion: programarExamen ? fechaHabilitacionExamen : undefined,
        horaHabilitacion: programarExamen ? horaHabilitacionExamen : undefined,
        puntosMaximos: totalExamPoints > 0 ? totalExamPoints : 10,
        estado: 'Activa',
        instrucciones:
          instrucciones.trim() ||
          `Examen interactivo de ${examQuestions.length} reactivos (${totalExamPoints} pts).`,
        ...(linkedPeriod
          ? {
              savedPeriodId: linkedPeriod.id,
              periodoNombre: linkedPeriod.periodoNombre,
              fechaInicioPeriodo: linkedPeriod.fechaInicio,
              fechaFinPeriodo: linkedPeriod.fechaFin,
            }
          : {}),
        preguntasExamen: examQuestions.map((q, idx) => ({ ...q, numero: idx + 1 })),
        configuracionExamen: examConfig,
      });
      setToastMessage(`Examen "${titulo}" actualizado y publicado para los alumnos.`);
    } else {
      // Generar UN SOLO EXAMEN unificado para el grupo o los grupos seleccionados
      addTaskOrExam({
        colegioId: activeCollege.id,
        cicloId: currentEffectiveCycleId || undefined,
        tipo: 'examen',
        titulo,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite: formattedExamFechaLimite,
        programado: programarExamen,
        fechaHabilitacion: programarExamen ? fechaHabilitacionExamen : undefined,
        horaHabilitacion: programarExamen ? horaHabilitacionExamen : undefined,
        puntosMaximos: totalExamPoints > 0 ? totalExamPoints : 10,
        estado: 'Activa',
        instrucciones:
          instrucciones.trim() ||
          `Examen interactivo de ${examQuestions.length} reactivos (${totalExamPoints} pts).`,
        savedPeriodId: linkedPeriod?.id,
        periodoNombre: linkedPeriod?.periodoNombre,
        fechaInicioPeriodo: linkedPeriod?.fechaInicio,
        fechaFinPeriodo: linkedPeriod?.fechaFin,
        preguntasExamen: examQuestions.map((q, idx) => ({ ...q, numero: idx + 1 })),
        configuracionExamen: examConfig,
      });
      setToastMessage(`Examen "${titulo}" publicado exitosamente para los alumnos.`);
    }

    setEditingExamId(null);
    setTitulo('');
    setInstrucciones('');
    setIsExamBuilderOpen(false);
    setExitWarningModal(null);
  };

  // Helpers de verificación de avances y guardado en Borrador
  const checkHasTaskAdvances = () => {
    return Boolean(
      titulo.trim() !== '' ||
      instrucciones.trim() !== '' ||
      solicitarEvidencia ||
      evidenciaNombre.trim() !== '' ||
      evidenciaUrl.trim() !== ''
    );
  };

  const checkHasExamAdvances = () => {
    return Boolean(
      titulo.trim() !== '' ||
      instrucciones.trim() !== '' ||
      examQuestions.some((q) => q.enunciado.trim() !== '') ||
      examQuestions.length > 1
    );
  };

  const handleForceCloseTaskProject = () => {
    setEditingTaskId(null);
    setTitulo('');
    setInstrucciones('');
    setSolicitarEvidencia(false);
    setEvidenciaNombre('');
    setEvidenciaUrl('');
    setEvidenciaTipo('');
    setIsTaskProjectOpen(false);
    setExitWarningModal(null);
  };

  const handleForceCloseExam = () => {
    setEditingExamId(null);
    setTitulo('');
    setInstrucciones('');
    setExamQuestions([createInitialQuestion(1, 'opcion_multiple_unica')]);
    setIsExamBuilderOpen(false);
    setExitWarningModal(null);
  };

  const handleRequestCloseTaskProject = () => {
    if (checkHasTaskAdvances()) {
      setExitWarningModal('task_project');
    } else {
      handleForceCloseTaskProject();
    }
  };

  const handleRequestCloseExam = () => {
    if (checkHasExamAdvances()) {
      setExitWarningModal('exam');
    } else {
      handleForceCloseExam();
    }
  };

  // Guardar como Borrador (No publicado a los alumnos)
  const handleSaveTaskAsDraft = () => {
    const linkedPeriod =
      collegeSavedPeriods.find((p) => p.id === selectedPeriodId) ||
      collegeSavedPeriods[collegeSavedPeriods.length - 1];

    const groupsToAssign =
      teacherAssignedGroups.length > 0
        ? selectedGroupsForTask.length > 0
          ? selectedGroupsForTask
          : [teacherAssignedGroups[0]]
        : [gradoGrupo || '1° A'];

    const ownerDocId = currentTeacherRecord?.id || currentUser?.id || '';
    const draftTitle = titulo.trim() || `Borrador de ${tipoTareaProyecto === 'proyecto' ? 'Proyecto' : 'Tarea'}`;

    if (editingTaskId) {
      updateTaskOrExam(editingTaskId, {
        tipo: tipoTareaProyecto,
        titulo: draftTitle,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite,
        puntosMaximos: 10,
        estado: 'Borrador',
        instrucciones,
        solicitarEvidencia,
        evidenciaNombre: evidenciaNombre || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
        evidenciaTipo: evidenciaTipo || undefined,
        ...(linkedPeriod
          ? {
              savedPeriodId: linkedPeriod.id,
              periodoNombre: linkedPeriod.periodoNombre,
              fechaInicioPeriodo: linkedPeriod.fechaInicio,
              fechaFinPeriodo: linkedPeriod.fechaFin,
            }
          : {}),
      });
    } else {
      addTaskOrExam({
        colegioId: activeCollege.id,
        cicloId: currentEffectiveCycleId || undefined,
        tipo: tipoTareaProyecto,
        titulo: draftTitle,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite,
        puntosMaximos: 10,
        estado: 'Borrador',
        instrucciones,
        solicitarEvidencia,
        evidenciaNombre: evidenciaNombre || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
        evidenciaTipo: evidenciaTipo || undefined,
        entregasEvidencias: [],
        savedPeriodId: linkedPeriod?.id,
        periodoNombre: linkedPeriod?.periodoNombre,
        fechaInicioPeriodo: linkedPeriod?.fechaInicio,
        fechaFinPeriodo: linkedPeriod?.fechaFin,
      });
    }

    handleForceCloseTaskProject();
    setToastMessage(`Avances guardados como borrador. "${draftTitle}" no se publicará a los alumnos hasta que esté completo.`);
  };

  const handleSaveExamAsDraft = () => {
    const linkedPeriod =
      collegeSavedPeriods.find((p) => p.id === selectedPeriodId) ||
      collegeSavedPeriods[collegeSavedPeriods.length - 1];

    const groupsToAssign =
      teacherAssignedGroups.length > 0
        ? selectedGroupsForExam.length > 0
          ? selectedGroupsForExam
          : [teacherAssignedGroups[0]]
        : [gradoGrupo || '1° A'];

    const cleanFechaLimiteDate = (fechaLimite || '').trim().split(/[\sT]+/)[0] || '2026-10-15';
    const cleanHoraLimite = (horaLimiteExamen || '23:59').trim().slice(0, 5) || '23:59';
    const formattedExamFechaLimite = `${cleanFechaLimiteDate} ${cleanHoraLimite}`;
    const ownerDocId = currentTeacherRecord?.id || currentUser?.id || '';
    const draftTitle = titulo.trim() || 'Borrador de Examen Interactivo';

    if (editingExamId) {
      updateTaskOrExam(editingExamId, {
        titulo: draftTitle,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite: formattedExamFechaLimite,
        programado: programarExamen,
        fechaHabilitacion: programarExamen ? fechaHabilitacionExamen : undefined,
        horaHabilitacion: programarExamen ? horaHabilitacionExamen : undefined,
        puntosMaximos: totalExamPoints > 0 ? totalExamPoints : 10,
        estado: 'Borrador',
        instrucciones: instrucciones.trim(),
        preguntasExamen: examQuestions.map((q, idx) => ({ ...q, numero: idx + 1 })),
        configuracionExamen: examConfig,
        ...(linkedPeriod
          ? {
              savedPeriodId: linkedPeriod.id,
              periodoNombre: linkedPeriod.periodoNombre,
              fechaInicioPeriodo: linkedPeriod.fechaInicio,
              fechaFinPeriodo: linkedPeriod.fechaFin,
            }
          : {}),
      });
    } else {
      addTaskOrExam({
        colegioId: activeCollege.id,
        cicloId: currentEffectiveCycleId || undefined,
        tipo: 'examen',
        titulo: draftTitle,
        materia,
        gradoGrupo: groupsToAssign.join(', '),
        gruposAsignados: groupsToAssign,
        docenteId: ownerDocId,
        docenteNombre,
        fechaLimite: formattedExamFechaLimite,
        programado: programarExamen,
        fechaHabilitacion: programarExamen ? fechaHabilitacionExamen : undefined,
        horaHabilitacion: programarExamen ? horaHabilitacionExamen : undefined,
        puntosMaximos: totalExamPoints > 0 ? totalExamPoints : 10,
        estado: 'Borrador',
        instrucciones: instrucciones.trim(),
        savedPeriodId: linkedPeriod?.id,
        periodoNombre: linkedPeriod?.periodoNombre,
        fechaInicioPeriodo: linkedPeriod?.fechaInicio,
        fechaFinPeriodo: linkedPeriod?.fechaFin,
        preguntasExamen: examQuestions.map((q, idx) => ({ ...q, numero: idx + 1 })),
        configuracionExamen: examConfig,
      });
    }

    handleForceCloseExam();
    setToastMessage(`Avances guardados como borrador. "${draftTitle}" no se publicará a los alumnos hasta que esté completo.`);
  };

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helpers to manipulate questions inside Exam Builder
  const handleAddQuestion = (tipo: ExamQuestionType) => {
    setExamQuestions((prev) => [...prev, createInitialQuestion(prev.length + 1, tipo)]);
  };

  const handleRemoveQuestion = (qId: string) => {
    setExamQuestions((prev) =>
      prev
        .filter((q) => q.id !== qId)
        .map((q, idx) => ({ ...q, numero: idx + 1 }))
    );
  };

  const handleChangeQuestionType = (qId: string, nextType: ExamQuestionType) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const fresh = createInitialQuestion(q.numero, nextType);
        return {
          ...fresh,
          id: q.id,
          enunciado: q.enunciado || fresh.enunciado,
          imagenUrl: q.imagenUrl,
          puntos: q.puntos,
          pistaOpcional: q.pistaOpcional,
          retroalimentacion: q.retroalimentacion,
        };
      })
    );
  };

  const handleUpdateQuestionField = (qId: string, updates: Partial<ExamQuestion>) => {
    setExamQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    );
  };

  const handleImageFileUpload = async (
    file: File | undefined,
    onLoaded: (dataUrl: string) => void
  ) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 540, 540, 0.82);
      onLoaded(dataUrl);
    } catch {
      // ignore
    }
  };

  const handleToggleCorrectOption = (qId: string, optId: string, isSingleChoice: boolean) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.opciones) return q;
        return {
          ...q,
          opciones: q.opciones.map((o) => {
            if (isSingleChoice) {
              return { ...o, esCorrecta: o.id === optId };
            }
            return o.id === optId ? { ...o, esCorrecta: !o.esCorrecta } : o;
          }),
        };
      })
    );
  };

  const handleUpdateOption = (
    qId: string,
    optId: string,
    updates: Partial<ExamQuestionOption>
  ) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.opciones) return q;
        return {
          ...q,
          opciones: q.opciones.map((o) => (o.id === optId ? { ...o, ...updates } : o)),
        };
      })
    );
  };

  const handleAddOption = (qId: string) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.opciones) return q;
        return {
          ...q,
          opciones: [
            ...q.opciones,
            {
              id: `${q.id}-opt-${Date.now()}-${q.opciones.length + 1}`,
              texto: '',
              esCorrecta: false,
            },
          ],
        };
      })
    );
  };

  const handleRemoveOption = (qId: string, optId: string) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.opciones || q.opciones.length <= 2) return q;
        const remaining = q.opciones.filter((o) => o.id !== optId);
        if (!remaining.some((o) => o.esCorrecta)) {
          remaining[0] = { ...remaining[0], esCorrecta: true };
        }
        return { ...q, opciones: remaining };
      })
    );
  };

  const handleUpdatePair = (
    qId: string,
    pairId: string,
    updates: Partial<ExamMatchingPair>
  ) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.paresRelacion) return q;
        return {
          ...q,
          paresRelacion: q.paresRelacion.map((p) =>
            p.id === pairId ? { ...p, ...updates } : p
          ),
        };
      })
    );
  };

  const handleAddPair = (qId: string) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.paresRelacion) return q;
        return {
          ...q,
          paresRelacion: [
            ...q.paresRelacion,
            {
              id: `${q.id}-pair-${Date.now()}-${q.paresRelacion.length + 1}`,
              fraseIzquierda: '',
              respuestaDerecha: '',
            },
          ],
        };
      })
    );
  };

  const handleRemovePair = (qId: string, pairId: string) => {
    setExamQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.paresRelacion || q.paresRelacion.length <= 2) return q;
        return {
          ...q,
          paresRelacion: q.paresRelacion.filter((p) => p.id !== pairId),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
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
              Actividades y Evaluaciones
            </span>
            {collegeCycles.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {collegeCycles.find((c) => c.id === currentEffectiveCycleId)?.nombre || 'Ciclo Escolar'}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: goldColor }} />
            Tareas, Proyectos y Exámenes Interactivos
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Diseña tareas, proyectos y exámenes interactivos con preguntas múltiples, imágenes y relación de columnas
          </p>
        </div>

        {collegeCycles.length > 1 && (
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl p-1.5 border border-white/20">
            <span className="text-xs text-white/90 font-medium pl-2">Ciclo:</span>
            <select
              value={currentEffectiveCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              aria-label="Seleccionar ciclo escolar"
              className="text-xs font-semibold bg-white text-slate-800 rounded-lg px-2.5 py-1.5 border-0 focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {collegeCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activo ? '(Activo)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {collegeSavedPeriods.length === 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-amber-950 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold">
              Primero debes crear el Periodo de Evaluación antes de registrar tareas, exámenes o proyectos
            </p>
            <p className="text-amber-800">
              Para poder agregar tareas, exámenes o proyectos, primero se tiene que crear el periodo de evaluación en el módulo <strong>Evaluaciones → Conceptos de Evaluación</strong>, ya que cada actividad se enlaza a ese rango de tiempo para poder cerrar las calificaciones.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons Bar: Divided into Two Distinct Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleOpenTaskProjectModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Crear Tarea o Proyecto</span>
        </button>

        <button
          type="button"
          onClick={handleOpenExamBuilderModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-sm transition-all active:scale-98 cursor-pointer border border-white/15"
          style={{ backgroundColor: primaryColor }}
        >
          <Sparkles className="w-4 h-4" style={{ color: goldColor }} />
          <span>Crear Examen Interactivo</span>
        </button>
      </div>

      {/* Filter and View Layout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'todos' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({collegeItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('tarea')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'tarea' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tareas ({collegeItems.filter((t) => t.tipo === 'tarea').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('proyecto')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'proyecto' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Proyectos ({collegeItems.filter((t) => t.tipo === 'proyecto').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('examen')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filterType === 'examen' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exámenes ({collegeItems.filter((t) => t.tipo === 'examen').length})
          </button>
        </div>

        {/* View Switcher: Listado (default) and Cuadrícula */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewLayout('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewLayout === 'list'
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista de Listado (Recomendada)"
          >
            <LayoutList className="w-3.5 h-3.5 text-indigo-600" />
            <span>Listado</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewLayout === 'grid'
                ? 'bg-white shadow-xs text-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista de Cuadrícula"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cuadrícula</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-slate-900 text-base">
            No se encontraron actividades registradas
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filterType !== 'todos'
              ? `No hay elementos en la categoría "${filterType}". Cambia el filtro o crea una nueva actividad.`
              : 'Aún no se han registrado tareas, proyectos o exámenes en este ciclo o plantel.'}
          </p>
        </div>
      ) : (
        <div
          className={
            viewLayout === 'list'
              ? 'space-y-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          }
        >
          {filtered.map((item) => {
            const hasQuestions =
              item.tipo === 'examen' &&
              Array.isArray(item.preguntasExamen) &&
              item.preguntasExamen.length > 0;

            const itemAssignedGroups =
              Array.isArray(item.gruposAsignados) && item.gruposAsignados.length > 0
                ? item.gruposAsignados
                : (item.gradoGrupo || '')
                    .split(',')
                    .map((g) => g.trim())
                    .filter(Boolean);

            const itemEvidences = Array.isArray(item.entregasEvidencias)
              ? item.entregasEvidencias
              : [];

            const normalizeGrp = (val?: string) =>
              (val || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

            const isList = viewLayout === 'list';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                  isList ? 'p-5 sm:p-6 space-y-4' : 'p-5 space-y-3.5'
                } ${
                  item.estado === 'Borrador'
                    ? 'border-amber-300 ring-1 ring-amber-200/80 bg-gradient-to-r from-amber-50/25 via-white to-white'
                    : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Upper Metadata Row: Badges, Date & Points */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Type Badge */}
                      <span
                        className={`font-black px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-wider ${
                          item.tipo === 'examen'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : item.tipo === 'proyecto'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {item.tipo}
                      </span>

                      {/* Status Badge */}
                      {item.estado === 'Borrador' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] sm:text-[11px] font-black uppercase flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Borrador (No publicado)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Publicado</span>
                        </span>
                      )}

                      {/* Subject */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{item.materia}</span>
                      </span>

                      {/* Assigned Groups */}
                      {itemAssignedGroups.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {itemAssignedGroups.length > 1
                              ? `Grupos: ${itemAssignedGroups.join(', ')}`
                              : `Grupo ${itemAssignedGroups[0] || item.gradoGrupo}`}
                          </span>
                        </span>
                      )}

                      {/* Linked Evaluation Period */}
                      {item.periodoNombre && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>Periodo: {item.periodoNombre}</span>
                        </span>
                      )}

                      {/* Questions count */}
                      {hasQuestions && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>{item.preguntasExamen!.length} reactivos</span>
                        </span>
                      )}

                      {/* Gamified indicator */}
                      {item.configuracionExamen?.modoGamificado && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Gamificado</span>
                        </span>
                      )}
                    </div>

                    {/* Due Date & Maximum Points */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Vence: <strong>{item.fechaLimite}</strong></span>
                      </span>
                      <span className="font-mono font-black text-xs text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs">
                        {item.puntosMaximos} pts
                      </span>
                    </div>
                  </div>

                  {/* Title & Teacher */}
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-base sm:text-lg leading-snug">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Docente titular: <strong className="text-slate-700">{item.docenteNombre}</strong>
                    </p>
                  </div>

                  {/* Scheduled Exam info if applicable */}
                  {item.tipo === 'examen' && item.programado && item.fechaHabilitacion && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900">
                      <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                      <span>
                        Se habilita automáticamente: <strong>{item.fechaHabilitacion}</strong> a las{' '}
                        <strong>{item.horaHabilitacion || '08:00'} hrs</strong>
                      </span>
                    </div>
                  )}

                  {/* Instructions Box */}
                  {item.instrucciones && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                      <span className="font-bold text-slate-800 block mb-1">Instrucciones y descripción:</span>
                      <p className="whitespace-pre-line text-slate-600">{item.instrucciones}</p>
                    </div>
                  )}

                  {/* Student Evidence Submissions Summary & Breakdown */}
                  {item.solicitarEvidencia && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-950">
                          <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Recepción de Evidencias Habilitada para Alumnos</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-[11px] font-mono font-bold text-indigo-900 shadow-2xs">
                          {itemEvidences.length} recibida(s) en total
                        </span>
                      </div>

                      {/* Desglose de evidencias recibidas separadas por cada grupo asignado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {itemAssignedGroups.map((grp) => {
                          const grpEvidences = itemEvidences.filter(
                            (ev) =>
                              normalizeGrp(ev.gradoGrupo) === normalizeGrp(grp) ||
                              normalizeGrp(ev.gradoGrupo).replace(/\s+/g, '') ===
                                normalizeGrp(grp).replace(/\s+/g, '')
                          );
                          return (
                            <div
                              key={grp}
                              className="px-3 py-2 rounded-xl bg-white border border-indigo-200/80 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800">Grupo {grp}</span>
                              <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {grpEvidences.length} evidencia(s)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Attached File/Evidence uploaded by teacher */}
                  {item.evidenciaUrl && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 truncate">
                          <Paperclip className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate">
                            Material adjunto: {item.evidenciaNombre || 'Archivo descargable'}
                          </span>
                        </span>
                        <a
                          href={item.evidenciaUrl}
                          download={item.evidenciaNombre || 'material_tarea'}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 font-bold text-xs"
                        >
                          Descargar
                        </a>
                      </div>
                      {(item.evidenciaTipo?.startsWith('image/') ||
                        item.evidenciaUrl.startsWith('data:image/')) && (
                        <img
                          src={item.evidenciaUrl}
                          alt={item.evidenciaNombre || 'Material adjunto'}
                          className="max-h-48 w-full object-contain rounded-lg border border-slate-200 bg-white p-1"
                        />
                      )}
                    </div>
                  )}

                  {/* Exam Question Types Summary */}
                  {hasQuestions && (
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-purple-950">
                        <span className="flex items-center gap-1.5">
                          <EyeOff className="w-4 h-4 text-purple-700" />
                          <span>Respuestas y claves protegidas para alumnos</span>
                        </span>
                        {item.configuracionExamen?.tiempoLimiteMinutos ? (
                          <span className="font-mono text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200 text-xs">
                            ⏱ Tiempo límite: {item.configuracionExamen.tiempoLimiteMinutos} min
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(item.preguntasExamen!.map((q) => q.tipo))).map(
                          (qType) => (
                            <span
                              key={qType}
                              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-900 font-bold"
                            >
                              {QUESTION_TYPE_META[qType]?.shortLabel || qType}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dedicated Action Buttons Toolbar - All buttons comfortably fit inside! */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {/* Left: View/Inspect Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {hasQuestions && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewExamItem(item);
                          setPreviewModeAsStudent(true);
                          setStudentSimulationAnswers({});
                          setStudentSimulationSubmitted(false);
                          setRevealedHints({});
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        title="Ver simulación del alumno o clave de respuestas"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Vista Alumno / Clave ({item.preguntasExamen!.length})</span>
                      </button>
                    )}

                    {item.solicitarEvidencia && (
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceModalTaskId(item.id);
                          setSelectedEvidenceGroupTab(itemAssignedGroups[0] || 'todos');
                        }}
                        className="px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-opacity hover:opacity-95"
                        style={{ backgroundColor: primaryColor }}
                        title="Ver evidencias entregadas por los alumnos"
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: goldColor }} />
                        <span>
                          Ver Evidencias Recibidas ({itemEvidences.length})
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Right: Management Buttons (Publicar, Editar, Eliminar) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.estado === 'Borrador' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateTaskOrExam(item.id, { estado: 'Activa' });
                          setToastMessage(`"${item.titulo}" ha sido publicado oficialmente para los alumnos.`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        title="Publicar esta actividad inmediatamente a los alumnos"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publicar Ahora</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEditTaskOrExam(item)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      title="Editar actividad"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de eliminar "${item.titulo}"?`)) {
                          deleteTaskOrExam(item.id);
                          setToastMessage(`"${item.titulo}" fue eliminado.`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Modal if no Periodo de Evaluación exists */}
      {noPeriodWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200">
            <div className="p-4 border-b flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Periodo de Evaluación Requerido</span>
              </div>
              <button onClick={() => setNoPeriodWarningOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-700">
              <p className="font-bold text-slate-900">
                Primero debes crear el Periodo de Evaluación.
              </p>
              <p>
                Para poder agregar tareas, exámenes o proyectos, primero se tiene que crear y guardar un <strong>Periodo de Evaluación</strong> en el módulo de <strong>Evaluaciones (pestaña Conceptos de Evaluación)</strong>, ya que al crear una tarea, examen o proyecto se enlaza a ese rango de tiempo para poder cerrar las calificaciones.
              </p>
              <div className="pt-3 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setNoPeriodWarningOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREAR TAREA O PROYECTO */}
      {isTaskProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border">
            <div
              className="p-4 border-b flex items-center justify-between shrink-0"
              style={{ backgroundColor: `${goldColor}20` }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingTaskId ? 'Editar Tarea o Proyecto' : 'Crear Tarea o Proyecto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRequestCloseTaskProject}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateTaskOrProject}
              className="p-5 space-y-3.5 text-xs md:text-sm overflow-y-auto flex-1"
            >
              <div>
                <label className="font-semibold block mb-1">
                  Periodo de Evaluación Enlazado *
                </label>
                <select
                  required
                  value={selectedPeriodId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPeriodId(pid);
                    const found = collegeSavedPeriods.find((p) => p.id === pid);
                    if (found?.fechaFin) {
                      setFechaLimite(found.fechaFin);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-amber-50/60 border-amber-300 font-medium text-slate-900"
                >
                  {collegeSavedPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.periodoNombre}
                      {period.fechaInicio && period.fechaFin
                        ? ` (${period.fechaInicio} al ${period.fechaFin})`
                        : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  La tarea o proyecto quedará vinculado a este rango de evaluación para cerrar calificaciones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tipo de Actividad</label>
                  <select
                    value={tipoTareaProyecto}
                    onChange={(e) => setTipoTareaProyecto(e.target.value as 'tarea' | 'proyecto')}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="tarea">Tarea / Deber</option>
                    <option value="proyecto">Proyecto / Investigación</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Materia</label>
                  {teacherAssignedSubjects.length > 0 ? (
                    <select
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      {teacherAssignedSubjects.map((subName) => (
                        <option key={subName} value={subName}>
                          {subName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      placeholder="Nombre de la materia"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Título de la Tarea o Proyecto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Maqueta del Sistema Solar / Ejercicios Cap. 4"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold block">
                    Grado y Grupo(s) a Asignar *
                  </label>
                </div>

                {teacherAssignedGroups.length > 0 ? (
                  <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                    {teacherAssignedGroups.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
                        <button
                          type="button"
                          onClick={() => setSelectedGroupsForTask([...teacherAssignedGroups])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                            selectedGroupsForTask.length === teacherAssignedGroups.length
                              ? 'text-white shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                          style={
                            selectedGroupsForTask.length === teacherAssignedGroups.length
                              ? { backgroundColor: primaryColor, borderColor: primaryColor }
                              : undefined
                          }
                        >
                          Ambos / Todos mis grupos ({teacherAssignedGroups.join(' y ')})
                        </button>
                        {teacherAssignedGroups.map((grp) => {
                          const isOnlyThisGroup =
                            selectedGroupsForTask.length === 1 &&
                            selectedGroupsForTask[0] === grp;
                          return (
                            <button
                              key={`only-${grp}`}
                              type="button"
                              onClick={() => setSelectedGroupsForTask([grp])}
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                                isOnlyThisGroup
                                  ? 'text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                              style={
                                isOnlyThisGroup
                                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                                  : undefined
                              }
                            >
                              Solo Grupo {grp}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-bold">Se creará 1 sola tarea dirigida a:</span>
                      <span
                        className="px-2.5 py-0.5 rounded-md font-extrabold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {selectedGroupsForTask.join(' y ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={gradoGrupo}
                    onChange={(e) => setGradoGrupo(e.target.value)}
                    placeholder="Ej. 6° A"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                )}
                {teacherAssignedGroups.length > 1 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Aunque elijas ambos grupos, se generará <strong>una sola tarea</strong> y, si habilitas evidencias, ahí mismo recibirás las entregas separadas por grupo.
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Fecha Límite de Entrega
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={(fechaLimite || '').split(' ')[0]}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      } catch {
                        // ignore
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Instrucciones y Rúbrica</label>
                <textarea
                  rows={3}
                  required
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  placeholder="Describe los criterios de entrega, materiales o rúbrica del proyecto..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs md:text-sm text-slate-900 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Solicitar evidencia</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Habilita esta opción si requieres que el alumno suba fotografía de la tarea o algún archivo como evidencia.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={solicitarEvidencia}
                  onClick={() => setSolicitarEvidencia((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    solicitarEvidencia ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      solicitarEvidencia ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleRequestCloseTaskProject}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskAsDraft}
                  className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Guardar avances como borrador sin publicar a los alumnos"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Guardar Avances</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg cursor-pointer"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  {editingTaskId
                    ? `Guardar Cambios en ${tipoTareaProyecto === 'proyecto' ? 'Proyecto' : 'Tarea'}`
                    : `Publicar ${tipoTareaProyecto === 'proyecto' ? 'Proyecto' : 'Tarea'}${
                        teacherAssignedGroups.length > 0 && selectedGroupsForTask.length > 1
                          ? ` (${selectedGroupsForTask.length} Grupos)`
                          : ''
                      }`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONSTRUCTOR DE EXÁMENES INTERACTIVOS */}
      {isExamBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div
              className="px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: goldColor, color: primaryColor }}
                  >
                    Diseñador de Evaluaciones Dinámicas
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Respuestas ocultas al alumno
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: goldColor }} />
                  <span>{editingExamId ? 'Editar Examen Interactivo' : 'Crear Examen Interactivo'}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBuilderPreviewStudentView((v) => {
                      if (!v) {
                        setBuilderShuffleKey((k) => k + 1);
                        setBuilderPreviewAnswers({});
                      }
                      return !v;
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    builderPreviewStudentView
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                  }`}
                >
                  {builderPreviewStudentView ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Volver a Edición Docente</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver como Alumno (Sin Respuestas)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRequestCloseExam}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Cerrar diseñador de examen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <form
              onSubmit={handleCreateInteractiveExam}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/60 text-xs sm:text-sm"
            >
              {/* Section 1: Datos Generales y Enlace al Periodo */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>1. Datos del Examen y Periodo de Evaluación</span>
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                      Reactivos: {examQuestions.length}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-lg font-black"
                      style={{ backgroundColor: `${goldColor}30`, color: primaryColor }}
                    >
                      Puntaje Total: {totalExamPoints} pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Periodo de Evaluación Enlazado *
                    </label>
                    <select
                      required
                      value={selectedPeriodId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedPeriodId(pid);
                        const found = collegeSavedPeriods.find((p) => p.id === pid);
                        if (found?.fechaFin) {
                          setFechaLimite(found.fechaFin.split(/[\sT]+/)[0]);
                          setHoraLimiteExamen('23:59');
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-amber-50/70 border-amber-300 font-semibold text-slate-900 text-xs"
                    >
                      {collegeSavedPeriods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.periodoNombre}
                          {period.fechaInicio && period.fechaFin
                            ? ` (${period.fechaInicio} al ${period.fechaFin})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold block mb-1 text-xs">
                      Título del Examen *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Examen Parcial de Ciencias Naturales · Bloque 1"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-xs">Materia</label>
                  {teacherAssignedSubjects.length > 0 ? (
                    <select
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    >
                      {teacherAssignedSubjects.map((subName) => (
                        <option key={subName} value={subName}>
                          {subName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      placeholder="Nombre de la materia"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  )}
                </div>

                {/* Selección de Grupos Asignados al Docente */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold block text-xs">
                      Grado y Grupo(s) Asignados al Examen *
                    </label>
                    {teacherAssignedGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectAllTeacherGroupsForExam}
                        className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        {selectedGroupsForExam.length === teacherAssignedGroups.length
                          ? 'Seleccionar solo un grupo'
                          : `Asignar a todos mis grupos (${teacherAssignedGroups.length}) al mismo tiempo`}
                      </button>
                    )}
                  </div>

                  {teacherAssignedGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                      {teacherAssignedGroups.map((grp) => {
                        const isChecked = selectedGroupsForExam.includes(grp);
                        return (
                          <label
                            key={grp}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all select-none ${
                              isChecked
                                ? 'text-white shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                            style={
                              isChecked
                                ? {
                                    backgroundColor: primaryColor,
                                    borderColor: primaryColor,
                                  }
                                : undefined
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleGroupForExam(grp)}
                              className="rounded text-amber-500 focus:ring-0"
                            />
                            <span>Grupo {grp}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={gradoGrupo}
                      onChange={(e) => setGradoGrupo(e.target.value)}
                      placeholder="Ej. 1° A"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  )}
                  {teacherAssignedGroups.length > 1 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Selecciona uno o varios de tus grupos asignados para programarles este examen.
                    </p>
                  )}
                </div>

                {/* Programación de Habilitación y Cierre del Examen (Fecha y Hora en el mismo campo) */}
                <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-700" />
                        <span>Programar Habilitación y Cierre del Examen para Alumnos</span>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        Elige la fecha y hora exacta en que se habilitará el examen en el perfil de los alumnos y la fecha y hora de cierre.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-bold text-purple-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={programarExamen}
                        onChange={(e) => setProgramarExamen(e.target.checked)}
                        className="rounded text-purple-700"
                      />
                      <span>Activar programación por fecha y hora</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {programarExamen && (
                      <div>
                        <label className="font-semibold block mb-1 text-xs text-purple-950">
                          Fecha y hora de habilitación del examen *
                        </label>
                        <input
                          type="datetime-local"
                          required={programarExamen}
                          value={`${(fechaHabilitacionExamen || '').split(/[\sT]+/)[0] || '2026-10-10'}T${(horaHabilitacionExamen || '08:00').slice(0, 5)}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes('T')) {
                              const [dPart, tPart] = val.split('T');
                              if (dPart) setFechaHabilitacionExamen(dPart);
                              if (tPart) setHoraHabilitacionExamen(tPart.slice(0, 5));
                            } else if (val) {
                              setFechaHabilitacionExamen(val);
                            }
                          }}
                          onClick={(e) => {
                            try {
                              (e.currentTarget as HTMLInputElement).showPicker?.();
                            } catch {
                              // ignore
                            }
                          }}
                          className="w-full px-3 py-2 border border-purple-300 rounded-xl text-xs bg-white font-semibold text-slate-900 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className={programarExamen ? '' : 'sm:col-span-2'}>
                      <label className="font-semibold block mb-1 text-xs text-purple-950">
                        Fecha y hora límite / cierre del examen *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={`${(fechaLimite || '').split(/[\sT]+/)[0] || '2026-10-15'}T${(horaLimiteExamen || '23:59').slice(0, 5)}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes('T')) {
                            const [dPart, tPart] = val.split('T');
                            if (dPart) setFechaLimite(dPart);
                            if (tPart) setHoraLimiteExamen(tPart.slice(0, 5));
                          } else if (val) {
                            setFechaLimite(val);
                          }
                        }}
                        onClick={(e) => {
                          try {
                            (e.currentTarget as HTMLInputElement).showPicker?.();
                          } catch {
                            // ignore
                          }
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-xl text-xs bg-white font-semibold text-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Instrucciones Generales para el Alumno
                  </label>
                  <input
                    type="text"
                    value={instrucciones}
                    onChange={(e) => setInstrucciones(e.target.value)}
                    placeholder="Indicaciones generales antes de iniciar el examen..."
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* Section 2: Opciones Atractivas y Dinámicas para Docentes y Alumnos */}
              <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-amber-50/80 rounded-2xl p-4 sm:p-5 border border-indigo-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-indigo-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>2. Opciones Dinámicas y Gamificación (Experiencia Atractiva)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Personaliza cómo vivirán el examen tus alumnos: cronómetro, orden aleatorio anti-copia, pistas didácticas y modo desafío.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-indigo-950">Estilo Visual:</label>
                    <select
                      value={examConfig.temaVisual || 'desafio_quiz'}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          temaVisual: e.target.value as ExamInteractiveConfig['temaVisual'],
                        }))
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold text-indigo-950"
                    >
                      <option value="desafio_quiz">🎯 Desafío Quiz Interactivo</option>
                      <option value="olimpiada_academica">🏆 Olimpiada Académica</option>
                      <option value="laboratorio_visual">🔬 Laboratorio Visual con Imágenes</option>
                      <option value="institucional">🏛️ Clásico Institucional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tiempo Límite</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Minutos (0 = libre)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="240"
                      value={examConfig.tiempoLimiteMinutos ?? 45}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          tiempoLimiteMinutos: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-16 px-2 py-1 border rounded-lg text-center font-mono font-bold text-xs"
                    />
                  </div>

                  <label className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(examConfig.ordenAleatorioPreguntas)}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          ordenAleatorioPreguntas: e.target.checked,
                        }))
                      }
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Shuffle className="w-3 h-3 text-purple-600" />
                        <span>Preguntas Aleatorias</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Orden distinto por alumno</span>
                    </div>
                  </label>

                  <label className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(examConfig.mezclarOpciones)}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          mezclarOpciones: e.target.checked,
                        }))
                      }
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">Mezclar Incisos</div>
                      <span className="text-[10px] text-slate-500 block">Barajar opciones A, B, C, D</span>
                    </div>
                  </label>

                  <label className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(examConfig.modoGamificado)}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          modoGamificado: e.target.checked,
                        }))
                      }
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>Modo Gamificado</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Barra de progreso y rachas</span>
                    </div>
                  </label>

                  <label className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(examConfig.permitirPistas)}
                      onChange={(e) =>
                        setExamConfig((prev) => ({
                          ...prev,
                          permitirPistas: e.target.checked,
                        }))
                      }
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-emerald-600" />
                        <span>Pistas Didácticas</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Apoyo opcional al alumno</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 3: Lista de Preguntas del Examen */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>
                        3. Banco de Reactivos del Examen ({examQuestions.length})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Marca la respuesta correcta en cada reactivo. <strong>El alumno nunca verá cuál es la respuesta correcta</strong> mientras responde su examen.
                    </p>
                  </div>
                </div>

                {examQuestions.map((q, qIdx) => {
                  const meta = QUESTION_TYPE_META[q.tipo];
                  const isSingleChoice =
                    q.tipo === 'opcion_multiple_unica' || q.tipo === 'verdadero_falso';

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Question Top Bar */}
                      <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {qIdx + 1}
                          </span>

                          {!builderPreviewStudentView ? (
                            <select
                              value={q.tipo}
                              onChange={(e) =>
                                handleChangeQuestionType(q.id, e.target.value as ExamQuestionType)
                              }
                              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                            >
                              <option value="opcion_multiple_unica">
                                🔘 Opción Múltiple · Respuesta Sencilla (1 correcta)
                              </option>
                              <option value="opcion_multiple_varias">
                                ☑️ Opción Múltiple · Respuesta Múltiple (Varias correctas)
                              </option>
                              <option value="relacionar_columnas">
                                🔗 Relacionar Frases con Respuestas (Columnas)
                              </option>
                              <option value="verdadero_falso">
                                ⚡ Verdadero o Falso
                              </option>
                              <option value="respuesta_corta">
                                ✍️ Respuesta Corta / Palabra Clave
                              </option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badge}`}
                            >
                              {meta.shortLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-600">Valor:</span>
                            {!builderPreviewStudentView ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={q.puntos}
                                onChange={(e) =>
                                  handleUpdateQuestionField(q.id, {
                                    puntos: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="w-12 text-center font-mono font-bold text-xs border-b border-slate-300 focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono font-bold text-xs">{q.puntos}</span>
                            )}
                            <span className="text-[11px] text-slate-500">pts</span>
                          </div>

                          {!builderPreviewStudentView && examQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Eliminar pregunta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Question Prompt + Image Attachment */}
                        <div className="space-y-3">
                          {!builderPreviewStudentView ? (
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <div className="flex-1">
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                  Pregunta o Planteamiento del Reactivo *
                                </label>
                                <textarea
                                  rows={2}
                                  required
                                  value={q.enunciado}
                                  onChange={(e) =>
                                    handleUpdateQuestionField(q.id, { enunciado: e.target.value })
                                  }
                                  placeholder="Escribe la pregunta, problema o instrucción para el alumno..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                                />
                              </div>

                              <div className="sm:w-56 shrink-0 space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-600 block">
                                  Imagen de Apoyo (Opcional)
                                </label>
                                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 font-bold text-xs cursor-pointer transition-colors">
                                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                                  <span>{q.imagenUrl ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleImageFileUpload(e.target.files?.[0], (url) =>
                                        handleUpdateQuestionField(q.id, { imagenUrl: url })
                                      )
                                    }
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={q.imagenUrl || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestionField(q.id, { imagenUrl: e.target.value })
                                  }
                                  placeholder="O pega URL de imagen..."
                                  className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-[11px]"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-slate-900 text-sm">
                              {q.enunciado || '(Pregunta sin texto)'}
                            </div>
                          )}

                          {q.imagenUrl && (
                            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                              <img
                                src={q.imagenUrl}
                                alt="Ilustración de la pregunta"
                                className="max-h-48 rounded-xl object-contain mx-auto"
                              />
                              {!builderPreviewStudentView && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuestionField(q.id, { imagenUrl: undefined })
                                  }
                                  className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 shadow-md cursor-pointer"
                                  title="Quitar imagen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* BODY BY QUESTION TYPE */}
                        {(q.tipo === 'opcion_multiple_unica' ||
                          q.tipo === 'opcion_multiple_varias' ||
                          q.tipo === 'verdadero_falso') &&
                          q.opciones && (
                            <div className="space-y-2.5">
                              {!builderPreviewStudentView && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-slate-700">
                                    {isSingleChoice
                                      ? 'Selecciona el círculo de la respuesta correcta (Oculto para el alumno):'
                                      : 'Marca TODAS las casillas que sean respuestas correctas (Oculto para el alumno):'}
                                  </span>
                                  {q.tipo !== 'verdadero_falso' && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddOption(q.id)}
                                      className="text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Agregar Opción</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {q.opciones.map((opt, optIdx) => {
                                  const letter = String.fromCharCode(65 + optIdx);
                                  const showCorrectHighlight =
                                    !builderPreviewStudentView && opt.esCorrecta;

                                  return (
                                    <div
                                      key={opt.id}
                                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                                        showCorrectHighlight
                                          ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400'
                                          : 'border-slate-200 bg-slate-50/60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {!builderPreviewStudentView ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleToggleCorrectOption(
                                                q.id,
                                                opt.id,
                                                isSingleChoice
                                              )
                                            }
                                            className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                              opt.esCorrecta
                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500'
                                            }`}
                                            title={
                                              opt.esCorrecta
                                                ? 'Respuesta correcta (Oculta al alumno)'
                                                : 'Marcar como respuesta correcta'
                                            }
                                          >
                                            {opt.esCorrecta ? '✓' : letter}
                                          </button>
                                        ) : (
                                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 text-slate-700">
                                            {letter}
                                          </span>
                                        )}

                                        {!builderPreviewStudentView ? (
                                          q.tipo === 'verdadero_falso' ? (
                                            <span className="font-bold text-xs text-slate-800 flex-1">
                                              {opt.texto}
                                            </span>
                                          ) : (
                                            <input
                                              type="text"
                                              required
                                              value={opt.texto}
                                              onChange={(e) =>
                                                handleUpdateOption(q.id, opt.id, {
                                                  texto: e.target.value,
                                                })
                                              }
                                              placeholder={`Opción ${letter}...`}
                                              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                            />
                                          )
                                        ) : (
                                          <span className="text-xs font-medium text-slate-800 flex-1">
                                            {opt.texto || `Opción ${letter}`}
                                          </span>
                                        )}

                                        {!builderPreviewStudentView &&
                                          q.tipo !== 'verdadero_falso' && (
                                            <label
                                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white cursor-pointer"
                                              title="Adjuntar imagen a esta opción"
                                            >
                                              <ImageIcon className="w-3.5 h-3.5" />
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                  handleImageFileUpload(
                                                    e.target.files?.[0],
                                                    (url) =>
                                                      handleUpdateOption(q.id, opt.id, {
                                                        imagenUrl: url,
                                                      })
                                                  )
                                                }
                                              />
                                            </label>
                                          )}

                                        {!builderPreviewStudentView &&
                                          q.tipo !== 'verdadero_falso' &&
                                          q.opciones!.length > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveOption(q.id, opt.id)}
                                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                              title="Eliminar opción"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                      </div>

                                      {!builderPreviewStudentView && opt.esCorrecta && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 pl-8">
                                          <EyeOff className="w-3 h-3" />
                                          <span>
                                            Respuesta correcta (Solo visible para el docente)
                                          </span>
                                        </div>
                                      )}

                                      {opt.imagenUrl && (
                                        <div className="pl-8 relative inline-block">
                                          <img
                                            src={opt.imagenUrl}
                                            alt={`Opción ${letter}`}
                                            className="h-20 rounded-lg object-contain border bg-white p-1"
                                          />
                                          {!builderPreviewStudentView && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUpdateOption(q.id, opt.id, {
                                                  imagenUrl: undefined,
                                                })
                                              }
                                              className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {/* RELACIONAR FRASES CON RESPUESTAS */}
                        {q.tipo === 'relacionar_columnas' && q.paresRelacion && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5 text-amber-700" />
                                <span>
                                  {!builderPreviewStudentView
                                    ? 'Escribe cada Frase (Columna A) frente a su Respuesta Correcta (Columna B). Al alumno le aparecerán desordenadas:'
                                    : 'Vista Alumno: El alumno selecciona la respuesta que corresponde a cada frase:'}
                                </span>
                              </span>
                              {!builderPreviewStudentView && (
                                <button
                                  type="button"
                                  onClick={() => handleAddPair(q.id)}
                                  className="text-amber-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Agregar Par de Relación</span>
                                </button>
                              )}
                            </div>

                            {!builderPreviewStudentView ? (
                              <div className="space-y-2">
                                {q.paresRelacion.map((pair, pIdx) => (
                                  <div
                                    key={pair.id}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80"
                                  >
                                    <div className="sm:col-span-5 flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-950 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                        {pIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        required
                                        value={pair.fraseIzquierda}
                                        onChange={(e) =>
                                          handleUpdatePair(q.id, pair.id, {
                                            fraseIzquierda: e.target.value,
                                          })
                                        }
                                        placeholder="Frase, autor, fórmula o concepto..."
                                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                                      />
                                    </div>

                                    <div className="sm:col-span-1 text-center text-amber-700 font-bold text-xs">
                                      ⟷
                                    </div>

                                    <div className="sm:col-span-5">
                                      <input
                                        type="text"
                                        required
                                        value={pair.respuestaDerecha}
                                        onChange={(e) =>
                                          handleUpdatePair(q.id, pair.id, {
                                            respuestaDerecha: e.target.value,
                                          })
                                        }
                                        placeholder="Respuesta correcta que se relaciona..."
                                        className="w-full px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-950"
                                      />
                                    </div>

                                    <div className="sm:col-span-1 text-right">
                                      {(q.paresRelacion?.length || 0) > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePair(q.id, pair.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <MatchingQuestionStudentView
                                question={q}
                                isBuilderPreview={true}
                                shuffleKey={builderShuffleKey}
                                selectedAnswers={builderPreviewAnswers[q.id] || {}}
                                onSelectAnswer={(pairId, answerId) =>
                                  setBuilderPreviewAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      ...(prev[q.id] || {}),
                                      [pairId]: answerId,
                                    },
                                  }))
                                }
                              />
                            )}
                          </div>
                        )}

                        {/* RESPUESTA CORTA */}
                        {q.tipo === 'respuesta_corta' && (
                          <div>
                            {!builderPreviewStudentView ? (
                              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-1">
                                <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                                  <EyeOff className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>
                                    Respuesta Correcta Esperada (Oculta para el alumno):
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={q.respuestaCortaCorrecta || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestionField(q.id, {
                                      respuestaCortaCorrecta: e.target.value,
                                    })
                                  }
                                  placeholder="Ej. Mitocondria / 1810 / Teorema de Pitágoras"
                                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                disabled
                                placeholder="El alumno escribirá su respuesta aquí..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                              />
                            )}
                          </div>
                        )}

                        {/* Optional Hint & Feedback */}
                        {!builderPreviewStudentView && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                💡 Pista Opcional para el Alumno
                              </label>
                              <input
                                type="text"
                                value={q.pistaOpcional || ''}
                                onChange={(e) =>
                                  handleUpdateQuestionField(q.id, {
                                    pistaOpcional: e.target.value,
                                  })
                                }
                                placeholder="Ej. Recuerda la fórmula vista en la pág. 42..."
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                ✨ Explicación / Retroalimentación al finalizar
                              </label>
                              <input
                                type="text"
                                value={q.retroalimentacion || ''}
                                onChange={(e) =>
                                  handleUpdateQuestionField(q.id, {
                                    retroalimentacion: e.target.value,
                                  })
                                }
                                placeholder="Se muestra al alumno únicamente después de entregar..."
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Question Bar */}
                {!builderPreviewStudentView && (
                  <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-indigo-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>Elegir tipo de pregunta para agregar al examen:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <select
                        value={newQuestionTypeToAdd}
                        onChange={(e) =>
                          setNewQuestionTypeToAdd(e.target.value as ExamQuestionType)
                        }
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 flex-1 sm:flex-initial"
                      >
                        <option value="opcion_multiple_unica">
                          Opción Múltiple (Respuesta Sencilla)
                        </option>
                        <option value="opcion_multiple_varias">
                          Opción Múltiple (Respuesta Múltiple)
                        </option>
                        <option value="relacionar_columnas">
                          Relacionar Frases con Respuestas
                        </option>
                        <option value="verdadero_falso">Verdadero o Falso</option>
                        <option value="respuesta_corta">Respuesta Corta / Palabra Clave</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(newQuestionTypeToAdd)}
                        className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Plus className="w-4 h-4" style={{ color: goldColor }} />
                        <span>Agregar Pregunta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Total: <strong>{examQuestions.length} pregunta(s)</strong> · Valor total del examen:{' '}
                    <strong>{totalExamPoints} puntos</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestCloseExam}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExamAsDraft}
                    className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Guardar avances como borrador sin publicar a los alumnos"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Guardar Avances</span>
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: goldColor }} />
                    <span>
                      {editingExamId
                        ? 'Guardar Cambios del Examen'
                        : `Publicar Examen Interactivo${
                            teacherAssignedGroups.length > 0 && selectedGroupsForExam.length > 1
                              ? ` (${selectedGroupsForExam.length} Grupos)`
                              : ''
                          }`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SIMULADOR / VISTA PREVIA DE EXAMEN (MODO ALUMNO SIN RESPUESTAS vs CLAVE DOCENTE) */}
      {previewExamItem && previewExamItem.preguntasExamen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div
              className="px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  {previewModeAsStudent
                    ? 'Vista del Alumno (Respuestas Correctas Ocultas)'
                    : 'Clave del Profesor (Respuestas Correctas Visibles)'}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-white mt-1">
                  {previewExamItem.titulo}
                </h3>
                <p className="text-xs text-slate-200">
                  {previewExamItem.materia} · Grupo {previewExamItem.gradoGrupo} ·{' '}
                  {previewExamItem.puntosMaximos} pts
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentUser?.rol !== 'alumno' && (
                  <button
                    type="button"
                    onClick={() => setPreviewModeAsStudent((v) => !v)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    {previewModeAsStudent ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Clave Docente</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar Clave (Modo Alumno)</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewExamItem(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50">
              {previewExamItem.configuracionExamen && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-950 text-white px-4 py-3 rounded-2xl text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {previewExamItem.configuracionExamen.tiempoLimiteMinutos ? (
                      <span className="flex items-center gap-1 font-mono font-bold text-amber-300">
                        <Clock className="w-4 h-4" />
                        Tiempo: {previewExamItem.configuracionExamen.tiempoLimiteMinutos} min
                      </span>
                    ) : null}
                    {previewExamItem.configuracionExamen.modoGamificado && (
                      <span className="flex items-center gap-1 text-emerald-300 font-bold">
                        <Sparkles className="w-4 h-4" />
                        Modo Gamificado Activo
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    {previewExamItem.preguntasExamen.length} reactivos en total
                  </span>
                </div>
              )}

              {previewExamItem.preguntasExamen.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          QUESTION_TYPE_META[q.tipo]?.badge || 'bg-slate-100'
                        }`}
                      >
                        {QUESTION_TYPE_META[q.tipo]?.shortLabel || q.tipo}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {q.puntos} pts
                    </span>
                  </div>

                  <p className="font-bold text-sm text-slate-900">{q.enunciado}</p>

                  {q.imagenUrl && (
                    <img
                      src={q.imagenUrl}
                      alt=""
                      className="max-h-48 rounded-xl border border-slate-200 object-contain bg-slate-50 p-2"
                    />
                  )}

                  {q.pistaOpcional && previewExamItem.configuracionExamen?.permitirPistas && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{revealedHints[q.id] ? 'Ocultar pista' : 'Ver pista didáctica'}</span>
                      </button>
                      {revealedHints[q.id] && (
                        <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          💡 {q.pistaOpcional}
                        </div>
                      )}
                    </div>
                  )}

                  {q.opciones && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.opciones.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const selectedByStudent =
                          q.tipo === 'opcion_multiple_varias'
                            ? (studentSimulationAnswers[q.id] || []).includes(opt.id)
                            : studentSimulationAnswers[q.id] === opt.id;
                        const showAnswerKey = !previewModeAsStudent && opt.esCorrecta;

                        return (
                          <div
                            key={opt.id}
                            onClick={() => {
                              if (!previewModeAsStudent) return;
                              if (q.tipo === 'opcion_multiple_varias') {
                                const curr: string[] = studentSimulationAnswers[q.id] || [];
                                const next = curr.includes(opt.id)
                                  ? curr.filter((id) => id !== opt.id)
                                  : [...curr, opt.id];
                                setStudentSimulationAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: next,
                                }));
                              } else {
                                setStudentSimulationAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: opt.id,
                                }));
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs flex flex-col gap-2 cursor-pointer transition-all ${
                              showAnswerKey
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                                : selectedByStudent
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md border border-slate-300 bg-slate-50 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <span className="flex-1">{opt.texto}</span>
                              {showAnswerKey && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                                  Correcta
                                </span>
                              )}
                            </div>
                            {opt.imagenUrl && (
                              <img
                                src={opt.imagenUrl}
                                alt=""
                                className="h-20 object-contain rounded-lg border bg-white p-1"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.tipo === 'relacionar_columnas' && q.paresRelacion && (
                    <div>
                      {!previewModeAsStudent ? (
                        <div className="space-y-2">
                          {q.paresRelacion.map((pair, pIdx) => (
                            <div
                              key={pair.id}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                            >
                              <div className="sm:col-span-5 font-semibold text-slate-800">
                                {pIdx + 1}. {pair.fraseIzquierda}
                              </div>
                              <div className="sm:col-span-2 text-center text-slate-400">⟷</div>
                              <div className="sm:col-span-5">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold block">
                                  ✓ {pair.respuestaDerecha}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <MatchingQuestionStudentView
                          question={q}
                          isBuilderPreview={false}
                          selectedAnswers={
                            (q.paresRelacion || []).reduce((acc: Record<string, string>, pair: any) => {
                              acc[pair.id] = studentSimulationAnswers[`${q.id}_${pair.id}`] || '';
                              return acc;
                            }, {})
                          }
                          onSelectAnswer={(pairId, ansId) => {
                            setStudentSimulationAnswers((prev) => ({
                              ...prev,
                              [`${q.id}_${pairId}`]: ansId,
                            }));
                          }}
                        />
                      )}
                    </div>
                  )}

                  {q.tipo === 'respuesta_corta' && (
                    <div>
                      {!previewModeAsStudent ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                          Respuesta clave (oculta al alumno): {q.respuestaCortaCorrecta}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={studentSimulationAnswers[q.id] || ''}
                          onChange={(e) =>
                            setStudentSimulationAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder="Escribe tu respuesta aquí..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {previewModeAsStudent
                  ? 'Así visualiza el alumno el examen (sin ver cuáles son las respuestas correctas).'
                  : 'Vista exclusiva del docente con las respuestas correctas marcadas.'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewExamItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EVIDENCIAS RECIBIDAS SEPARADAS POR GRUPO EN LA MISMA TAREA */}
      {evidenceModalTaskId &&
        (() => {
          const activeTask = tasksExams.find((t) => t.id === evidenceModalTaskId);
          if (!activeTask) return null;

          const assignedGroups =
            Array.isArray(activeTask.gruposAsignados) && activeTask.gruposAsignados.length > 0
              ? activeTask.gruposAsignados
              : (activeTask.gradoGrupo || '')
                  .split(',')
                  .map((g) => g.trim())
                  .filter(Boolean);

          const allEvidences = Array.isArray(activeTask.entregasEvidencias)
            ? activeTask.entregasEvidencias
            : [];

          const normalizeGrp = (val?: string) =>
            (val || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

          const doesStudentBelongToGroup = (stGrado: string, stGrupo: string, targetGrp: string) => {
            const normTarget = normalizeGrp(targetGrp);
            const normSt = normalizeGrp(`${stGrado} ${stGrupo}`);
            return (
              normSt === normTarget ||
              normSt.replace(/\s+/g, '') === normTarget.replace(/\s+/g, '')
            );
          };

          const groupsToRender =
            selectedEvidenceGroupTab === 'todos'
              ? assignedGroups
              : assignedGroups.filter((g) => g === selectedEvidenceGroupTab);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                <div
                  className="px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
                    borderBottom: `3px solid ${goldColor}`,
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                        style={{ backgroundColor: goldColor, color: primaryColor }}
                      >
                        Evidencias de Alumnos por Grupo
                      </span>
                      <span className="text-xs text-slate-200 font-semibold">
                        {activeTask.materia} · Vence: {activeTask.fechaLimite}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-white">
                      {activeTask.titulo}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEvidenceModalTaskId(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer self-end sm:self-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Group Filter Tabs inside the Same Task */}
                <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 mr-1">
                      Filtrar por grupo:
                    </span>
                    {assignedGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedEvidenceGroupTab('todos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          selectedEvidenceGroupTab === 'todos'
                            ? 'text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-300'
                        }`}
                        style={
                          selectedEvidenceGroupTab === 'todos'
                            ? { backgroundColor: primaryColor }
                            : undefined
                        }
                      >
                        Todos los grupos ({assignedGroups.join(' y ')})
                      </button>
                    )}
                    {assignedGroups.map((grp) => {
                      const countForGrp = allEvidences.filter(
                        (ev) =>
                          normalizeGrp(ev.gradoGrupo) === normalizeGrp(grp) ||
                          normalizeGrp(ev.gradoGrupo).replace(/\s+/g, '') ===
                            normalizeGrp(grp).replace(/\s+/g, '')
                      ).length;
                      const isSelected = selectedEvidenceGroupTab === grp;
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setSelectedEvidenceGroupTab(grp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-300'
                          }`}
                          style={
                            isSelected ? { backgroundColor: primaryColor } : undefined
                          }
                        >
                          <span>Grupo {grp}</span>
                          <span
                            className="px-1.5 py-0.2 rounded-full text-[10px] font-mono"
                            style={
                              isSelected
                                ? { backgroundColor: goldColor, color: primaryColor }
                                : { backgroundColor: '#EEF2FF', color: '#3730A3' }
                            }
                          >
                            {countForGrp}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600">
                    Total evidencias recibidas: {allEvidences.length}
                  </span>
                </div>

                {/* Body separated by Group */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/70">
                  {groupsToRender.map((grp) => {
                    const groupStudents = students.filter(
                      (s) =>
                        s.colegioId === activeCollege.id &&
                        s.estatus !== 'baja' &&
                        doesStudentBelongToGroup(s.grado, s.grupo, grp)
                    );

                    const groupEvidences = allEvidences.filter(
                      (ev) =>
                        normalizeGrp(ev.gradoGrupo) === normalizeGrp(grp) ||
                        normalizeGrp(ev.gradoGrupo).replace(/\s+/g, '') ===
                          normalizeGrp(grp).replace(/\s+/g, '')
                    );

                    return (
                      <div
                        key={grp}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
                      >
                        <div
                          className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2"
                          style={{ backgroundColor: `${primaryColor}08` }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="px-3 py-1 rounded-lg text-xs font-extrabold text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Grupo {grp}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {groupStudents.length} alumno(s) en el grupo
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                            {groupEvidences.length} evidencia(s) recibida(s) en {grp}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          {groupEvidences.length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                              Aún no se han recibido evidencias de alumnos del <strong>Grupo {grp}</strong> en esta tarea.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {groupEvidences.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between"
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-xs text-slate-900">
                                        {ev.estudianteNombre}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                        Grupo {ev.gradoGrupo}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500">
                                      Entregado: {ev.fechaEntrega}
                                    </div>
                                    {ev.comentario && (
                                      <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                                        {ev.comentario}
                                      </p>
                                    )}
                                    {(ev.archivoTipo?.startsWith('image/') ||
                                      ev.archivoUrl?.startsWith('data:image/')) && (
                                      <img
                                        src={ev.archivoUrl}
                                        alt={ev.archivoNombre}
                                        className="max-h-36 w-full object-contain rounded-lg border border-slate-200 bg-white p-1"
                                      />
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                                    <span className="font-semibold text-slate-700 truncate flex items-center gap-1">
                                      <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <span className="truncate">{ev.archivoNombre}</span>
                                    </span>
                                    {ev.archivoUrl && (
                                      <a
                                        href={ev.archivoUrl}
                                        download={ev.archivoNombre || 'evidencia'}
                                        className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline shrink-0"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Descargar</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Las evidencias subidas por los alumnos desde su portal se agrupan automáticamente por su grupo escolar.
                  </span>
                  <button
                    type="button"
                    onClick={() => setEvidenceModalTaskId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-slate-100 flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA AL SALIR / CANCELAR: OPCIÓN DE GUARDAR AVANCES */}
      {exitWarningModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                ¿Estás seguro de que deseas salir?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {exitWarningModal === 'task_project'
                  ? 'Tienes información capturada en esta tarea o proyecto. Si sales sin guardar, se perderán los datos ingresados. Puedes guardar tus avances como borrador para conservarlos; la tarea no se publicará a los alumnos hasta que esté completa.'
                  : 'Tienes preguntas y configuración capturadas en este examen interactivo. Si sales sin guardar, se perderán tus cambios. Puedes guardar tus avances como borrador para retomarlo más tarde; el examen no se publicará a los alumnos hasta que esté completo.'}
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={
                    exitWarningModal === 'task_project'
                      ? handleSaveTaskAsDraft
                      : handleSaveExamAsDraft
                  }
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-900" />
                  <span>Guardar Avances como Borrador</span>
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setExitWarningModal(null)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Continuar Editando
                  </button>
                  <button
                    type="button"
                    onClick={
                      exitWarningModal === 'task_project'
                        ? handleForceCloseTaskProject
                        : handleForceCloseExam
                    }
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Salir sin Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
