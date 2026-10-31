import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { compressImageFile } from '../utils/imageCompressor';
import {
  Users,
  Plus,
  Calendar,
  X,
  QrCode,
  Edit2,
  Upload,
  Shield,
  BookOpen,
  UserCheck,
  Mail,
  Lock,
  Send,
  Check,
  Power,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Download,
  Paperclip,
  Layers,
  Eye,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  Teacher,
  AcademicLevel,
  Subject,
  TeacherActivity,
  TeacherActivityWeekPlan,
  TeacherPlanningComment,
} from '../types';
import { createShieldSvg } from '../utils/shieldHelper';
import { generateTutorUsername, generateRandomPassword } from '../utils/preenrollmentHelper';
import {
  getPiagetStageForLevelAndGrade,
  generatePiagetBrunerThreeWeekPlan,
  NEM_CAMPOS_FORMATIVOS,
  NEM_EJES_ARTICULADORES,
  NEM_METODOLOGIAS_SOCIOCRITICAS,
  NEM_ESCENARIOS,
  inferCampoYMetodologiaNEM,
} from '../utils/planningAssistantHelper';

interface TeachersModuleProps {
  mode?: 'docentes' | 'planeaciones';
  onNavigateTab?: (tab: string) => void;
}

export const TeachersModule: React.FC<TeachersModuleProps> = ({
  mode = 'docentes',
  onNavigateTab,
}) => {
  const {
    activeCollege,
    currentUser,
    teachers,
    subjects,
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    calendarDays,
    getGroupsForCollegeLevel,
    sendEmailNotification,
    users,
    updateUser,
    schoolCycles,
  } = useApp();

  const isTeacherRole = currentUser?.rol === 'docente';
  const isCoordinatorRole = currentUser?.rol === 'coordinador';
  const isPlanningMode = isTeacherRole || mode === 'planeaciones';

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

  const teacherAssignedGroups = React.useMemo(() => {
    if (!activeCollege) return [];
    const allowedLvls = (activeCollege.nivel || '').trim().toLowerCase();
    const lvls: AcademicLevel[] =
      allowedLvls === 'preescolar'
        ? ['Preescolar']
        : allowedLvls === 'primaria'
        ? ['Primaria']
        : allowedLvls === 'secundaria'
        ? ['Secundaria']
        : allowedLvls === 'preparatoria'
        ? ['Preparatoria']
        : ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];

    if (currentTeacherRecord) {
      const tchLvl: AcademicLevel =
        currentTeacherRecord.nivel && lvls.includes(currentTeacherRecord.nivel)
          ? currentTeacherRecord.nivel
          : lvls[0] || 'Primaria';
      const registeredInLevel = new Set(
        getGroupsForCollegeLevel(activeCollege.id, tchLvl).map((g) =>
          g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
        )
      );
      if (registeredInLevel.size === 0) return [];

      const fromTeacher = (currentTeacherRecord.grupos || []).filter((g) =>
        registeredInLevel.has(g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
      );
      return Array.from(new Set(fromTeacher));
    }

    const allRegistered: string[] = [];
    lvls.forEach((lvl) => {
      allRegistered.push(...getGroupsForCollegeLevel(activeCollege.id, lvl));
    });
    return Array.from(new Set(allRegistered));
  }, [activeCollege, currentTeacherRecord, getGroupsForCollegeLevel]);

  const teacherAssignedSubjects = React.useMemo(() => {
    if (!activeCollege) return [];
    if (currentTeacherRecord) {
      const fromTeacher = (currentTeacherRecord.materias || []).filter(Boolean);
      const fromSubjects = subjects
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (s.docenteId === currentTeacherRecord.id ||
              (s.docenteNombre &&
                s.docenteNombre.trim().toLowerCase() ===
                  currentTeacherRecord.nombre.trim().toLowerCase()))
        )
        .map((s) => s.nombre);
      return Array.from(new Set([...fromTeacher, ...fromSubjects]));
    }
    return Array.from(
      new Set(subjects.filter((s) => s.colegioId === activeCollege.id).map((s) => s.nombre))
    );
  }, [activeCollege, currentTeacherRecord, subjects]);

  // Modal states for Planeaciones Docentes (Subir Archivo o Crear con Asistente Piaget-Bruner 3 Semanas + Nueva Escuela Mexicana)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [planningModalMode, setPlanningModalMode] = useState<'asistente_crear' | 'subir_archivo'>('asistente_crear');
  const [planGradoGrupo, setPlanGradoGrupo] = useState('');
  const [planMateria, setPlanMateria] = useState('');
  const [planTemaCentral, setPlanTemaCentral] = useState('');
  const [planContextoGrupo, setPlanContextoGrupo] = useState('');
  const [planTitulo, setPlanTitulo] = useState('');
  const [planPeriodoSemanas, setPlanPeriodoSemanas] = useState('3 Semanas (NEM · Piaget y Bruner)');
  const [planObjetivo, setPlanObjetivo] = useState('');
  const [planEntregables, setPlanEntregables] = useState('');
  const [planSemanasDetalle, setPlanSemanasDetalle] = useState<TeacherActivityWeekPlan[]>([]);
  // Campos Nueva Escuela Mexicana (NEM)
  const [planFaseNEM, setPlanFaseNEM] = useState('');
  const [planCampoFormativoNEM, setPlanCampoFormativoNEM] = useState<string>('Lenguajes');
  const [planEjesArticuladoresNEM, setPlanEjesArticuladoresNEM] = useState<string[]>([
    'Pensamiento crítico',
    'Inclusión',
  ]);
  const [planMetodologiaNEM, setPlanMetodologiaNEM] = useState<string>(
    'Aprendizaje Basado en Proyectos Comunitarios (ABPC)'
  );
  const [planEscenarioNEM, setPlanEscenarioNEM] = useState<string>('Proyectos de Aula');
  const [planContenidoSinteticoNEM, setPlanContenidoSinteticoNEM] = useState('');
  const [planPdaNEM, setPlanPdaNEM] = useState('');
  const [planProblematizacionNEM, setPlanProblematizacionNEM] = useState('');
  const [planEvaluacionFormativaNEM, setPlanEvaluacionFormativaNEM] = useState('');
  const [planArchivoNombre, setPlanArchivoNombre] = useState('');
  const [planArchivoUrl, setPlanArchivoUrl] = useState('');
  const [planArchivoTipo, setPlanArchivoTipo] = useState('');
  const [planArchivoTamano, setPlanArchivoTamano] = useState('');
  const [planFileError, setPlanFileError] = useState<string | null>(null);
  const [viewingPlanDetail, setViewingPlanDetail] = useState<TeacherActivity | null>(null);
  const planFileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados de revisión y comentarios de Coordinación para las planeaciones recibidas
  const [commentingActivityId, setCommentingActivityId] = useState<string | null>(null);
  const [coordCommentText, setCoordCommentText] = useState<string>('');
  const [coordCommentType, setCoordCommentType] = useState<'correccion' | 'observacion' | 'aprobacion'>('correccion');
  const [planningLevelFilter, setPlanningLevelFilter] = useState<string>('todos');
  const [planningTeacherFilter, setPlanningTeacherFilter] = useState<string>('todos');

  const [activeSubTab, setActiveSubTab] = useState<'plantilla' | 'planeaciones' | 'calendario'>(() =>
    isPlanningMode ? 'planeaciones' : 'plantilla'
  );

  // Ciclo Escolar activo y selector para ligar las planeaciones didácticas
  const collegeCycles = React.useMemo(() => {
    return (schoolCycles || []).filter((c) => c.colegioId === activeCollege?.id);
  }, [schoolCycles, activeCollege?.id]);

  const activeSchoolCycle = React.useMemo(() => {
    return collegeCycles.find((c) => c.activo) || collegeCycles[0] || null;
  }, [collegeCycles]);

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  useEffect(() => {
    if (activeSchoolCycle && !selectedCycleId) {
      setSelectedCycleId(activeSchoolCycle.id);
    }
  }, [activeSchoolCycle, selectedCycleId]);

  const currentEffectiveCycleId = selectedCycleId || activeSchoolCycle?.id || '';

  useEffect(() => {
    if (isPlanningMode) {
      setActiveSubTab('planeaciones');
    } else if (activeSubTab === 'planeaciones') {
      setActiveSubTab('plantilla');
    }
  }, [isPlanningMode, mode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [emailedTeacherId, setEmailedTeacherId] = useState<string | null>(null);
  const [emailedTeacherBanner, setEmailedTeacherBanner] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const findLinkedUserForTeacher = (tch: Teacher) => {
    const expectedUsrId = `usr-${tch.id}`;
    return (
      users.find((u) => u.id === tch.id || u.id === expectedUsrId) ||
      users.find(
        (u) =>
          u.rol === 'docente' &&
          u.nombre.trim().toLowerCase() === tch.nombre.trim().toLowerCase() &&
          (!tch.colegioId || u.colegioId === tch.colegioId)
      )
    );
  };

  const handleSendTeacherCredentialsByEmail = (tch: Teacher) => {
    const matchedUser =
      findLinkedUserForTeacher(tch) ||
      users.find(
        (u) =>
          u.rol === 'docente' &&
          u.correo.toLowerCase() === tch.correo.toLowerCase() &&
          (!tch.colegioId || u.colegioId === tch.colegioId)
      );
    const resolvedUsername =
      matchedUser?.usuarioLogin || generateTutorUsername(tch.nombre, '5284');
    const resolvedPassword =
      matchedUser?.password || 'a4Km9xP2';

    sendEmailNotification({
      colegioId: activeCollege?.id || tch.colegioId,
      colegioNombre: activeCollege?.nombre || 'My College',
      destinatarios: [tch.correo],
      rolesDestino: ['docente'],
      usuariosDestino: [tch.id, tch.correo, resolvedUsername],
      asunto: `[My College] Envío de Credenciales de Acceso Docente (${tch.nombre})`,
      cuerpo:
        `Estimado(a) ${tch.nombre}:\n\n` +
        `En atención a su solicitud, le enviamos sus credenciales oficiales de acceso al Portal Docente de ${activeCollege?.nombre || 'My College'}.\n\n` +
        `=== CREDENCIALES DE ACCESO ===\n` +
        `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Institución: ${activeCollege?.nombre || 'My College'}\n` +
        `• Perfil: Docente (${tch.especialidad})\n` +
        `• Usuario de Acceso: ${resolvedUsername}\n` +
        `• Contraseña: ${resolvedPassword}\n\n` +
        `Por seguridad, sus credenciales permanecen ocultas en la plataforma y se envían exclusivamente a su correo electrónico registrado.`,
      categoria: 'seguridad',
      prioridad: 'alta',
    });

    setEmailedTeacherId(tch.id);
    setEmailedTeacherBanner(
      `Se enviaron las credenciales de acceso de "${tch.nombre}" al correo ${tch.correo}.`
    );
    setTimeout(() => setEmailedTeacherId(null), 2500);
    setTimeout(() => setEmailedTeacherBanner(null), 4500);
  };

  // New teacher form state
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [nivelDocente, setNivelDocente] = useState<AcademicLevel>('Primaria');
  const [selectedNewGroups, setSelectedNewGroups] = useState<string[]>([]);
  const [selectedNewSubjects, setSelectedNewSubjects] = useState<string[]>([]);
  const [newEsTutorPrincipal, setNewEsTutorPrincipal] = useState<boolean>(false);
  const [newGrupoTutorado, setNewGrupoTutorado] = useState<string>('');
  const [fotoPersonalizada, setFotoPersonalizada] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit teacher groups/subjects/level/tutor modal state
  const [editingTeacherForGroups, setEditingTeacherForGroups] = useState<Teacher | null>(null);
  const [editNivelDocente, setEditNivelDocente] = useState<AcademicLevel>('Primaria');
  const [editGroupsList, setEditGroupsList] = useState<string[]>([]);
  const [editSubjectsList, setEditSubjectsList] = useState<string[]>([]);
  const [editEsTutorPrincipal, setEditEsTutorPrincipal] = useState<boolean>(false);
  const [editGrupoTutorado, setEditGrupoTutorado] = useState<string>('');
  const [tutorConflictWarning, setTutorConflictWarning] = useState<string | null>(null);
  const [newTutorConflictWarning, setNewTutorConflictWarning] = useState<string | null>(null);

  if (!activeCollege) return null;

  const getAllowedLevelsForCollege = (collegeNivel?: string): AcademicLevel[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };

  const allowedLevels = getAllowedLevelsForCollege(activeCollege.nivel);

  useEffect(() => {
    if (!allowedLevels.includes(nivelDocente)) {
      const defaultLvl = allowedLevels[0] || 'Primaria';
      setNivelDocente(defaultLvl);
      const groupsForLvl = getGroupsForCollegeLevel(activeCollege.id, defaultLvl);
      setSelectedNewGroups(groupsForLvl.length > 0 ? [groupsForLvl[0]] : []);
    }
  }, [activeCollege.id, activeCollege.nivel]);

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Escudo oficial del colegio para usar cuando no se ha subido una foto personalizada
  const collegeShieldUrl =
    activeCollege.escudoUrl ||
    createShieldSvg(primaryColor, goldColor, activeCollege.nombre);

  const resolveTeacherPhoto = (foto?: string): string => {
    if (!foto || foto.includes('images.unsplash.com')) {
      return collegeShieldUrl;
    }
    return foto;
  };

  const resolveTeacherLevel = (tch: Teacher): AcademicLevel => {
    if (tch.nivel && allowedLevels.includes(tch.nivel)) return tch.nivel;
    if (tch.nivel) return tch.nivel;
    const hasUpperPrimary = (tch.grupos || []).some(
      (g) => g.includes('4°') || g.includes('5°') || g.includes('6°')
    );
    if (hasUpperPrimary && allowedLevels.includes('Primaria')) return 'Primaria';
    return allowedLevels[0] || 'Primaria';
  };

  // Grupos obtenidos directamente desde el módulo Materias y Grupos según el nivel seleccionado
  const availableGroupsForNewTeacher = getGroupsForCollegeLevel(activeCollege.id, nivelDocente);
  const availableGroupsForEditTeacher = getGroupsForCollegeLevel(activeCollege.id, editNivelDocente);

  // Materias obtenidas desde Materias y Grupos filtradas únicamente por el nivel del profesor
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const resolveSubjectLevel = (sub: Subject): AcademicLevel => {
    if (sub.nivel && allowedLevels.includes(sub.nivel)) return sub.nivel;
    if (sub.nivel) return sub.nivel;
    const lower = (sub.grado || '').toLowerCase();
    if (lower.includes('preescolar')) return 'Preescolar';
    if (lower.includes('secundaria')) return 'Secundaria';
    if (lower.includes('preparatoria') || lower.includes('bachillerato')) return 'Preparatoria';
    if (lower.includes('primaria')) return 'Primaria';
    return allowedLevels[0] || 'Primaria';
  };

  const getSubjectsForLevel = (lvl: AcademicLevel): string[] => {
    const names = collegeSubjects
      .filter((s) => resolveSubjectLevel(s) === lvl)
      .map((s) => s.nombre.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  };

  const availableSubjectsForNewTeacher = getSubjectsForLevel(nivelDocente);
  const availableSubjectsForEditTeacher = getSubjectsForLevel(editNivelDocente);

  // Busca si otro docente del colegio ya es Tutor Principal de ese grupo en ese nivel
  const findExistingTutorForGroup = (
    lvl: AcademicLevel,
    grp: string,
    excludeTeacherId?: string
  ): Teacher | undefined => {
    const cleanTarget = (grp || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!cleanTarget) return undefined;
    return teachers.find((t) => {
      if (t.colegioId !== activeCollege.id) return false;
      if (excludeTeacherId && t.id === excludeTeacherId) return false;
      if (!t.esTutorPrincipal || !t.grupoTutorado) return false;
      if (resolveTeacherLevel(t) !== lvl) return false;
      const cleanTchGrp = t.grupoTutorado
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      return cleanTchGrp === cleanTarget;
    });
  };

  const openTeacherAssignmentModal = (tch: Teacher) => {
    const currentLvl = resolveTeacherLevel(tch);
    const currentGroups = tch.grupos || [];
    const availableInLvl = getGroupsForCollegeLevel(activeCollege.id, currentLvl);
    const firstFreeGroup =
      [...currentGroups, ...availableInLvl].find(
        (g) => !findExistingTutorForGroup(currentLvl, g, tch.id)
      ) || '';
    setEditingTeacherForGroups(tch);
    setEditNivelDocente(currentLvl);
    setEditGroupsList(currentGroups);
    setEditSubjectsList(tch.materias || []);
    setEditEsTutorPrincipal(Boolean(tch.esTutorPrincipal && tch.grupoTutorado));
    setEditGrupoTutorado(tch.grupoTutorado || firstFreeGroup);
    setTutorConflictWarning(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 256, 256, 0.82);
      setFotoPersonalizada(compressed);
    } catch {
      // ignore
    }
  };

  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;

  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;
  // Niveles asignados al Coordinador actual
  const coordinatorAssignedLevels = React.useMemo<AcademicLevel[]>(() => {
    if (!isCoordinatorRole || !currentUser) return allowedLevels;
    if (Array.isArray(currentUser.nivelesAsignados) && currentUser.nivelesAsignados.length > 0) {
      return currentUser.nivelesAsignados;
    }
    if (currentUser.nivelAsignado) {
      return [currentUser.nivelAsignado];
    }
    if (Array.isArray(currentUser.gruposAsignados) && currentUser.gruposAsignados.length > 0) {
      const lvls = new Set<AcademicLevel>();
      currentUser.gruposAsignados.forEach((raw) => {
        const lower = (raw || '').toLowerCase();
        if (lower.startsWith('preescolar')) lvls.add('Preescolar');
        else if (lower.startsWith('primaria')) lvls.add('Primaria');
        else if (lower.startsWith('secundaria')) lvls.add('Secundaria');
        else if (lower.startsWith('preparatoria')) lvls.add('Preparatoria');
      });
      if (lvls.size > 0) return Array.from(lvls);
    }
    return allowedLevels;
  }, [isCoordinatorRole, currentUser, allowedLevels]);

  const resolveActivityLevel = (act: TeacherActivity): AcademicLevel => {
    if (act.nivel && allowedLevels.includes(act.nivel)) return act.nivel;
    if (act.nivel) return act.nivel;
    const actDocId = (act.docenteId || '').trim().toLowerCase();
    const actDocName = (act.docenteNombre || '').trim().toLowerCase();
    const matchedTeacher = collegeTeachersAll.find(
      (t) =>
        t.id.trim().toLowerCase() === actDocId ||
        `usr-${t.id}`.trim().toLowerCase() === actDocId ||
        (t.nombre || '').trim().toLowerCase() === actDocName
    );
    if (matchedTeacher) {
      return resolveTeacherLevel(matchedTeacher);
    }
    const fase = (act.faseNEM || '').toLowerCase();
    if (fase.includes('fase 2') || fase.includes('preescolar')) return 'Preescolar';
    if (fase.includes('fase 6') || fase.includes('secundaria')) return 'Secundaria';
    if (fase.includes('preparatoria') || fase.includes('bachillerato')) return 'Preparatoria';
    return allowedLevels[0] || 'Primaria';
  };

  const collegeActivities = activities.filter((a) => {
    if (a.colegioId !== activeCollege.id) return false;

    // 0. Ligado estricto al Ciclo Escolar: Cuando se crea un nuevo ciclo escolar, las planeaciones inician en blanco
    if (currentEffectiveCycleId) {
      if (a.cicloId && a.cicloId !== currentEffectiveCycleId) {
        return false;
      }
      if (!a.cicloId) {
        const oldestCycle = collegeCycles[collegeCycles.length - 1];
        if (oldestCycle && oldestCycle.id !== currentEffectiveCycleId) {
          return false;
        }
      }
    }

    const actDocId = (a.docenteId || '').trim().toLowerCase();
    const actDocName = (a.docenteNombre || '').trim().toLowerCase();

    // 1. Docente: solo ve sus propias planeaciones
    if (isTeacherRole) {
      const isOwnedByCurrentUser =
        Boolean(actDocId && currentOwnerIds.has(actDocId)) ||
        Boolean(actDocName && currentOwnerNames.has(actDocName));
      return isOwnedByCurrentUser;
    }

    // 2. Coordinador: recibe únicamente las planeaciones de los docentes del nivel escolar que tiene asignado
    const actLevel = resolveActivityLevel(a);
    if (isCoordinatorRole && !coordinatorAssignedLevels.includes(actLevel)) {
      return false;
    }

    // 3. Filtros adicionales de nivel y docente en la vista de revisión (Directivo, Administrador, Coordinador, Supervisor)
    if (planningLevelFilter !== 'todos' && actLevel !== planningLevelFilter) {
      return false;
    }
    if (
      planningTeacherFilter !== 'todos' &&
      (a.docenteNombre || '').trim().toLowerCase() !== planningTeacherFilter.trim().toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  const handleSubmitCoordinatorComment = (act: TeacherActivity) => {
    const trimmed = coordCommentText.trim();
    if (!trimmed) return;

    const now = new Date();
    const newComment: TeacherPlanningComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      autorId: currentUser.id,
      autorNombre: currentUser.nombre,
      autorRol: currentUser.rol,
      tipo: coordCommentType,
      comentario: trimmed,
      fecha: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextComments = [...(act.comentariosCoordinacion || []), newComment];
    const nextEstado: TeacherActivity['estado'] =
      coordCommentType === 'aprobacion'
        ? 'Aprobada'
        : coordCommentType === 'correccion'
        ? 'Requiere Correcciones'
        : act.estado;

    updateActivity(act.id, {
      comentariosCoordinacion: nextComments,
      estado: nextEstado,
    });

    setCoordCommentText('');
    setCommentingActivityId(null);
    setEmailedTeacherBanner(
      coordCommentType === 'aprobacion'
        ? `La planeación "${act.titulo}" de ${act.docenteNombre} fue marcada como Aprobada.`
        : `Se envió tu comentario de revisión a ${act.docenteNombre} en la planeación "${act.titulo}".`
    );
    setTimeout(() => setEmailedTeacherBanner(null), 4500);
  };

  const teacherLevelForPlanning: AcademicLevel =
    currentTeacherRecord?.nivel || allowedLevels[0] || 'Primaria';

  const openPlanningModal = (mode: 'asistente_crear' | 'subir_archivo') => {
    const defaultGrp = teacherAssignedGroups[0] || '1° A';
    const defaultSub =
      teacherAssignedSubjects[0] ||
      currentTeacherRecord?.especialidad ||
      'Matemáticas';
    const stageInfo = getPiagetStageForLevelAndGrade(teacherLevelForPlanning, defaultGrp);
    const inferredNEM = inferCampoYMetodologiaNEM(defaultSub);

    setPlanningModalMode(mode);
    setPlanGradoGrupo(defaultGrp);
    setPlanMateria(defaultSub);
    setPlanTemaCentral('');
    setPlanContextoGrupo('');
    setPlanTitulo('');
    setPlanPeriodoSemanas('3 Semanas (NEM · Piaget y Bruner)');
    setPlanObjetivo('');
    setPlanEntregables('');
    setPlanSemanasDetalle([]);
    setPlanFaseNEM(stageInfo.faseNEM);
    setPlanCampoFormativoNEM(inferredNEM.campoFormativo);
    setPlanEjesArticuladoresNEM(inferredNEM.ejesSugeridos);
    setPlanMetodologiaNEM(inferredNEM.metodologia);
    setPlanEscenarioNEM('Proyectos de Aula');
    setPlanContenidoSinteticoNEM('');
    setPlanPdaNEM('');
    setPlanProblematizacionNEM('');
    setPlanEvaluacionFormativaNEM('');
    setPlanArchivoNombre('');
    setPlanArchivoUrl('');
    setPlanArchivoTipo('');
    setPlanArchivoTamano('');
    setPlanFileError(null);
    setIsPlanningModalOpen(true);
  };

  const toggleEjeArticuladorNEM = (eje: string) => {
    setPlanEjesArticuladoresNEM((prev) =>
      prev.includes(eje) ? prev.filter((item) => item !== eje) : [...prev, eje]
    );
  };

  const handlePlanFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.docx', '.doc'];
    if (!allowedExtensions.includes(ext)) {
      setPlanFileError(
        'Formato no permitido. Por favor selecciona un archivo .pdf, .xlsx, .xls, .docx o .doc'
      );
      return;
    }
    setPlanFileError(null);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPlanArchivoNombre(file.name);
        setPlanArchivoUrl(reader.result);
        setPlanArchivoTipo(ext.toUpperCase().replace('.', ''));
        setPlanArchivoTamano(sizeLabel);
        if (!planTitulo.trim()) {
          const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
          setPlanTitulo(`Planeación: ${baseTitle}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateWithPiagetBrunerAssistant = () => {
    const generated = generatePiagetBrunerThreeWeekPlan({
      nivel: teacherLevelForPlanning,
      gradoGrupo: planGradoGrupo || teacherAssignedGroups[0] || '1° A',
      materia: planMateria || teacherAssignedSubjects[0] || 'Materia General',
      temaCentral: planTemaCentral || `Unidad Didáctica de ${planMateria || 'la Materia'}`,
      contextoGrupo: planContextoGrupo,
      campoFormativoNEM: planCampoFormativoNEM,
      metodologiaDidacticaNEM: planMetodologiaNEM,
      escenarioNEM: planEscenarioNEM,
      ejesArticuladoresNEM: planEjesArticuladoresNEM,
    });
    setPlanTitulo(generated.tituloSugerido);
    setPlanFaseNEM(generated.faseNEM);
    setPlanCampoFormativoNEM(generated.campoFormativoNEM);
    setPlanEjesArticuladoresNEM(generated.ejesArticuladoresNEM);
    setPlanMetodologiaNEM(generated.metodologiaDidacticaNEM);
    setPlanEscenarioNEM(generated.escenarioNEM);
    setPlanContenidoSinteticoNEM(generated.contenidoProgramaSinteticoNEM);
    setPlanPdaNEM(generated.pdaNEM);
    setPlanProblematizacionNEM(generated.problematizacionProgramaAnaliticoNEM);
    setPlanEvaluacionFormativaNEM(generated.evaluacionFormativaNEM);
    setPlanObjetivo(generated.objetivoGeneral);
    setPlanEntregables(generated.entregablesEvaluacion);
    setPlanSemanasDetalle(generated.semanasDetalle);
    setPlanPeriodoSemanas('3 Semanas (NEM · Método Jean Piaget y Jerome Bruner)');
  };

  const handleSaveTeacherPlanning = (e: React.FormEvent) => {
    e.preventDefault();
    if (planningModalMode === 'subir_archivo' && !planArchivoUrl) {
      setPlanFileError('Debes adjuntar tu archivo de planeación (.pdf, .xlsx, .xls, .docx o .doc).');
      return;
    }
    const resolvedTitle =
      planTitulo.trim() ||
      (planArchivoNombre
        ? `Planeación en archivo: ${planArchivoNombre}`
        : `Planeación 3 Semanas (${planMateria} · ${planGradoGrupo})`);
    const piagetInfo = getPiagetStageForLevelAndGrade(teacherLevelForPlanning, planGradoGrupo);

    addActivity({
      colegioId: activeCollege.id,
      cicloId: currentEffectiveCycleId || undefined,
      docenteId: currentTeacherRecord?.id || currentUser.id,
      docenteNombre: currentTeacherRecord?.nombre || currentUser.nombre,
      titulo: resolvedTitle,
      materia: planMateria || teacherAssignedSubjects[0] || 'General',
      nivel: teacherLevelForPlanning,
      gradoGrupo: planGradoGrupo || teacherAssignedGroups[0] || '1° A',
      semana: planPeriodoSemanas || 'Duración: 3 Semanas',
      duracionSemanas: 3,
      etapaPiaget: piagetInfo.etapaNombre,
      modalidadBruner: 'Currículum en Espiral (Enactivo → Icónico → Simbólico · 3 Semanas)',
      faseNEM: planFaseNEM || piagetInfo.faseNEM,
      campoFormativoNEM: planCampoFormativoNEM || undefined,
      ejesArticuladoresNEM:
        planEjesArticuladoresNEM.length > 0 ? planEjesArticuladoresNEM : undefined,
      metodologiaDidacticaNEM: planMetodologiaNEM || undefined,
      escenarioNEM: planEscenarioNEM || undefined,
      contenidoProgramaSinteticoNEM: planContenidoSinteticoNEM.trim() || undefined,
      pdaNEM: planPdaNEM.trim() || undefined,
      problematizacionProgramaAnaliticoNEM: planProblematizacionNEM.trim() || undefined,
      evaluacionFormativaNEM: planEvaluacionFormativaNEM.trim() || undefined,
      objetivo:
        planObjetivo.trim() ||
        (planArchivoNombre
          ? `Planeación didáctica de 3 semanas adjunta en formato ${planArchivoTipo} (${planArchivoNombre}) para el grupo ${planGradoGrupo}.`
          : `Planeación de 3 semanas sustentada en la Nueva Escuela Mexicana, Jean Piaget y Jerome Bruner para ${planGradoGrupo}.`),
      entregables:
        planEntregables.trim() ||
        'Semana 1 (Enactivo), Semana 2 (Icónico) y Semana 3 (Simbólico / Evaluación Formativa NEM).',
      semanasDetalle: planSemanasDetalle.length > 0 ? planSemanasDetalle : undefined,
      archivoNombre: planArchivoNombre || undefined,
      archivoUrl: planArchivoUrl || undefined,
      archivoTipo: planArchivoTipo || undefined,
      archivoTamano: planArchivoTamano || undefined,
      estado: 'Entregada',
      fechaEntrega: new Date().toISOString().split('T')[0],
    });

    setIsPlanningModalOpen(false);
    setEmailedTeacherBanner(
      `Se registró exitosamente la planeación "${resolvedTitle}" para el grupo ${planGradoGrupo}.`
    );
    setTimeout(() => setEmailedTeacherBanner(null), 4500);
  };
  const teacherCalendarDays = calendarDays.filter(
    (d) => d.colegioId === activeCollege.id && d.visibleDocentes
  );

  const filteredTeachers = collegeTeachers.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.especialidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;

    const effectiveTutorGroup =
      newEsTutorPrincipal && newGrupoTutorado
        ? newGrupoTutorado
        : newEsTutorPrincipal && selectedNewGroups.length > 0
        ? selectedNewGroups[0]
        : undefined;

    if (newEsTutorPrincipal && effectiveTutorGroup) {
      const existingTutor = findExistingTutorForGroup(nivelDocente, effectiveTutorGroup);
      if (existingTutor) {
        setNewTutorConflictWarning(
          `El grupo ${effectiveTutorGroup} de ${nivelDocente} ya tiene tutor asignado (${existingTutor.nombre}). Por favor elige otro grupo disponible.`
        );
        return;
      }
    }

    const finalSubjects =
      selectedNewSubjects.length > 0
        ? selectedNewSubjects
        : especialidad.trim()
        ? [especialidad.trim()]
        : [];

    const finalGroupsForTeacher =
      effectiveTutorGroup && !selectedNewGroups.includes(effectiveTutorGroup)
        ? [...selectedNewGroups, effectiveTutorGroup]
        : selectedNewGroups;

    addTeacher({
      colegioId: activeCollege.id,
      nombre,
      correo,
      telefono: telefono || '+52 (55) 0000-0000',
      especialidad: especialidad || finalSubjects[0] || 'Docencia General',
      nivel: nivelDocente,
      esTutorPrincipal: Boolean(newEsTutorPrincipal && effectiveTutorGroup),
      grupoTutorado: effectiveTutorGroup,
      materias: finalSubjects,
      grupos: finalGroupsForTeacher,
      horasSemanales: 0,
      estatus: 'activo',
      // Si no han subido una imagen personalizada, toma el escudo del colegio (nunca una imagen random)
      foto: fotoPersonalizada || collegeShieldUrl,
    });

    setNombre('');
    setCorreo('');
    setTelefono('');
    setEspecialidad('');
    setFotoPersonalizada('');
    setSelectedNewSubjects([]);
    setNewEsTutorPrincipal(false);
    setNewGrupoTutorado('');
    setNewTutorConflictWarning(null);
    const defaultGroups = getGroupsForCollegeLevel(activeCollege.id, nivelDocente);
    setSelectedNewGroups(defaultGroups.length > 0 ? [defaultGroups[0]] : []);
    setIsAddTeacherOpen(false);
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
              {isPlanningMode ? 'Planeación Docente' : 'Plantilla Docente'}
            </span>
            {isPlanningMode && isCoordinatorRole && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25">
                Nivel Asignado: {coordinatorAssignedLevels.join(', ')}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: goldColor }} />
            {isPlanningMode
              ? isTeacherRole
                ? 'Actividades y Planeaciones'
                : 'Recepción y Revisión de Planeaciones Docentes'
              : 'Docentes'}
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {isPlanningMode
              ? isTeacherRole
                ? `${activeCollege.nombre} · Actividades docentes y planeaciones didácticas semanales`
                : isCoordinatorRole
                ? `${activeCollege.nombre} · Planeaciones enviadas por los docentes de tu nivel asignado (${coordinatorAssignedLevels.join(', ')})`
                : `${activeCollege.nombre} · Consulta general de todas las planeaciones enviadas por los docentes del colegio`
              : `${activeCollege.nombre} · Plantilla de profesores, nivel educativo y grupos asignados`}
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      {emailedTeacherBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailedTeacherBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setEmailedTeacherBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {!isPlanningMode && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('asistencias')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <QrCode className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Tomar Asistencia QR (Aula)</span>
            </button>
          )}

          <button
            onClick={() => {
              const initialLvl = allowedLevels[0] || 'Primaria';
              setNivelDocente(initialLvl);
              const lvGroups = getGroupsForCollegeLevel(activeCollege.id, initialLvl);
              setSelectedNewGroups(lvGroups.length > 0 ? [lvGroups[0]] : []);
              const lvSubs = getSubjectsForLevel(initialLvl);
              setSelectedNewSubjects(lvSubs.length > 0 ? [lvSubs[0]] : []);
              setFotoPersonalizada('');
              setIsAddTeacherOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Profesor</span>
          </button>
        </div>
      )}

      {/* Classroom Attendance Banner (Only inside Docentes module, hidden in Planeaciones Docentes) */}
      {!isPlanningMode && onNavigateTab && (
        <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-400/30 text-teal-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
                Pase de Lista Inteligente en la Puerta del Salón
                <span className="text-[10px] bg-teal-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                  NUEVO
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Abre el escáner en tu tablet: los alumnos muestran su código QR al entrar al aula y se valida automáticamente su grupo.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('asistencias')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
          >
            Abrir Escáner de Aula →
          </button>
        </div>
      )}

      {/* Segmented Controls (Tabs) */}
      {!isPlanningMode && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveSubTab('plantilla')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'plantilla'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plantilla Docente ({collegeTeachers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('calendario')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'calendario'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Calendario Días Sin Clases ({teacherCalendarDays.length})</span>
            </button>
          </div>

          {hasMultipleCampuses && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase text-amber-800">Campus:</span>
              <select
                value={selectedCampusId || ''}
                onChange={(e) => setSelectedCampusId(e.target.value || null)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="">Todos los Campus ({collegeCampuses.length})</option>
                {collegeCampuses.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'calendario' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                Calendario Oficial de Días Sin Clases (Perfil Docente)
              </h3>
              <p className="text-xs text-slate-500">
                Fechas de suspensión de labores, Consejos Técnicos Escolares (CTE) y vacaciones registradas por Control Escolar.
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('calendario')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Abrir Módulo Calendario →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {teacherCalendarDays.map((day) => (
              <div
                key={day.id}
                className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    {day.fecha}
                    {day.fechaFin ? ` al ${day.fechaFin}` : ''}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-rose-700">
                    Sin Clases
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900">{day.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'plantilla' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((tch) => {
            const tchLevel = resolveTeacherLevel(tch);
            const validGroupsForTchLevel = getGroupsForCollegeLevel(activeCollege.id, tchLevel);
            const validTchGroups = (tch.grupos || []).filter((g) =>
              validGroupsForTchLevel.includes(g)
            );
            const validTchTutorGroup =
              tch.esTutorPrincipal &&
              tch.grupoTutorado &&
              validGroupsForTchLevel.includes(tch.grupoTutorado)
                ? tch.grupoTutorado
                : '';
            const displayFoto = resolveTeacherPhoto(tch.foto);
            const linkedTeacherUser = findLinkedUserForTeacher(tch);
            const isTeacherActive =
              tch.estatus !== 'inactivo' &&
              (linkedTeacherUser ? linkedTeacherUser.activo !== false : true);

            return (
              <div
                key={tch.id}
                onClick={() => openTeacherAssignmentModal(tch)}
                className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-md transition-all space-y-3 cursor-pointer group ${
                  isTeacherActive
                    ? 'border-slate-200 hover:border-indigo-300'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
                title="Clic para elegir nivel, grupos y materias impartidas del profesor"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={displayFoto}
                    alt={tch.nombre}
                    className="w-12 h-12 rounded-full object-contain bg-slate-50 border border-slate-200 shrink-0 p-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                        {tch.nombre}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {tchLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{tch.especialidad}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{tch.correo}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextActive = !isTeacherActive;
                          updateTeacher(tch.id, {
                            estatus: nextActive ? 'activo' : 'inactivo',
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          isTeacherActive
                            ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-800 border-emerald-200 hover:border-rose-300'
                            : 'bg-rose-100 hover:bg-emerald-50 text-rose-800 hover:text-emerald-800 border-rose-300 hover:border-emerald-200'
                        }`}
                        title={
                          isTeacherActive
                            ? 'Clic para poner al docente como Inactivo (negar acceso)'
                            : 'Clic para activar al docente (permitir acceso)'
                        }
                      >
                        {isTeacherActive ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Inactivo (Sin acceso)</span>
                          </>
                        )}
                      </button>

                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        <span>Credenciales ocultas</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendTeacherCredentialsByEmail(tch);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          emailedTeacherId === tch.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                        }`}
                        title="Enviar credenciales de acceso al correo del docente"
                      >
                        {emailedTeacherId === tch.id ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>¡Enviadas!</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-2.5 h-2.5 text-blue-700" />
                            <span>Enviar por correo</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeacherToDelete(tch);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        title="Eliminar docente de la plataforma y base de datos"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Nivel que imparte:</span>
                    <span className="font-bold text-indigo-900">{tchLevel}</span>
                  </div>
                  {validTchTutorGroup && (
                    <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-2 py-1 rounded-md">
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tutor Principal:</span>
                      </span>
                      <span className="font-extrabold text-[11px]">
                        Grupo {validTchTutorGroup}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 text-slate-600">
                    <span>Grupos a Cargo:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {validTchGroups.length > 0
                          ? validTchGroups.join(', ')
                          : 'Sin grupo asignado'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTeacherAssignmentModal(tch);
                        }}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        title="Asignar o modificar nivel, grupos y materias del docente"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Asignar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Materias Impartidas ({tchLevel})
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 group-hover:underline">
                      + Elegir materias
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tch.materias && tch.materias.length > 0 ? (
                      tch.materias.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-indigo-50/80 text-indigo-900 border border-indigo-200/70 font-semibold px-2 py-0.5 rounded-md"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Clic para asignar materias de {tchLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Actividades Docentes / Planeaciones */
        <div className="space-y-4">
          {/* Action bar: only for Docentes to create/upload their planning; for Coordinador/Directivo/Admin/Supervisor show reception & filter bar */}
          {isTeacherRole ? (
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-indigo-800/50">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Método Jean Piaget y Jerome Bruner · Duración: 3 Semanas</span>
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                  Gestión de Planeaciones Didácticas y Asistente Pedagógico
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Sube tus planeaciones en formato <strong>.pdf, .xlsx, .xls, .docx o .doc</strong>, o redacta tu planeación de <strong>3 semanas</strong> aquí mismo con el asistente pedagógico adaptado al grado que tienes asignado ({teacherAssignedGroups.join(', ') || '1° A'}).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openPlanningModal('subir_archivo')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>Subir Archivo (.PDF, .XLSX, .DOCX)</span>
                </button>

                <button
                  type="button"
                  onClick={() => openPlanningModal('asistente_crear')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Planeación (Asistente Piaget-Bruner)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-extrabold uppercase tracking-wider">
                  <FileText className="w-3 h-3" />
                  <span>
                    {isCoordinatorRole
                      ? `Bandeja de Coordinación (${coordinatorAssignedLevels.join(', ')})`
                      : 'Consulta Institucional de Planeaciones (Todos los Niveles)'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                  {isCoordinatorRole
                    ? 'Planeaciones Recibidas de los Docentes de tu Nivel Asignado'
                    : 'Planeaciones Recibidas de Todos los Docentes del Colegio'}
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl">
                  {isCoordinatorRole
                    ? 'Revisa las planeaciones enviadas por los docentes de tu nivel escolar y agrega comentarios para solicitar complementación, correcciones o aprobar la secuencia didáctica.'
                    : 'Visualiza todas las planeaciones didácticas enviadas por los docentes de todos los niveles escolares y el seguimiento de comentarios de Coordinación.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 text-xs">
                {(!isCoordinatorRole || coordinatorAssignedLevels.length > 1) && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Nivel:</span>
                    <select
                      value={planningLevelFilter}
                      onChange={(e) => setPlanningLevelFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="todos">
                        {isCoordinatorRole ? 'Todos mis Niveles' : 'Todos los Niveles'}
                      </option>
                      {(isCoordinatorRole ? coordinatorAssignedLevels : allowedLevels).map(
                        (lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Docente:</span>
                  <select
                    value={planningTeacherFilter}
                    onChange={(e) => setPlanningTeacherFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="todos">Todos los Docentes</option>
                    {collegeTeachers
                      .filter((t) => {
                        const tLvl = resolveTeacherLevel(t);
                        if (isCoordinatorRole && !coordinatorAssignedLevels.includes(tLvl)) {
                          return false;
                        }
                        if (planningLevelFilter !== 'todos' && tLvl !== planningLevelFilter) {
                          return false;
                        }
                        return true;
                      })
                      .map((t) => (
                        <option key={t.id} value={t.nombre}>
                          {t.nombre} ({resolveTeacherLevel(t)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  {isTeacherRole
                    ? `Mis Planeaciones Registradas (${collegeActivities.length})`
                    : `Planeaciones Docentes Recibidas (${collegeActivities.length})`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Secuencias didácticas de 3 semanas (Piaget & Bruner · NEM) y archivos de planeación adjuntos
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {collegeCycles.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[11px] font-bold text-slate-500">Ciclo:</span>
                    <select
                      value={currentEffectiveCycleId}
                      onChange={(e) => setSelectedCycleId(e.target.value)}
                      className="text-xs font-black text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                    >
                      {collegeCycles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.activo ? '(Activo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="text-xs text-slate-500 font-semibold">
                  {isCoordinatorRole
                    ? `Nivel: ${coordinatorAssignedLevels.join(', ')}`
                    : 'Supervisadas por Coordinación Académica'}
                </span>
              </div>
            </div>

            {collegeActivities.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  {isTeacherRole
                    ? 'Aún no hay planeaciones registradas. Usa los botones superiores para subir un archivo (.pdf, .xlsx, .xls, .docx, .doc) o redactar una planeación con el asistente Piaget-Bruner.'
                    : isCoordinatorRole
                    ? `No se han recibido planeaciones de los docentes del nivel ${coordinatorAssignedLevels.join(', ')} con los filtros seleccionados.`
                    : 'No se han recibido planeaciones de los docentes con los filtros seleccionados.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {collegeActivities.map((act) => {
                  const actLevel = resolveActivityLevel(act);
                  const commentsList = act.comentariosCoordinacion || [];
                  const isCommentingThis = commentingActivityId === act.id;

                  return (
                    <div key={act.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                act.estado === 'Aprobada'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : act.estado === 'Requiere Correcciones'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {act.estado}
                            </span>
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                              Nivel {actLevel}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Grupo {act.gradoGrupo}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                              {act.duracionSemanas || 3} Semanas · Piaget & Bruner
                            </span>
                            {act.campoFormativoNEM && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                                NEM · {act.campoFormativoNEM}
                              </span>
                            )}
                            {act.faseNEM && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                {act.faseNEM.split('·')[0].trim()}
                              </span>
                            )}
                            {act.archivoNombre && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                <span>{act.archivoTipo || 'Archivo'}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">{act.titulo}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">{act.semana}</span>
                          {Array.isArray(act.semanasDetalle) && act.semanasDetalle.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setViewingPlanDetail(act)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver 3 Semanas</span>
                            </button>
                          )}

                          {/* Botón para que el Coordinador comente / solicite complementación o correcciones */}
                          {isCoordinatorRole && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isCommentingThis) {
                                  setCommentingActivityId(null);
                                } else {
                                  setCommentingActivityId(act.id);
                                  setCoordCommentText('');
                                  setCoordCommentType('correccion');
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                              <span>
                                {isCommentingThis
                                  ? 'Cerrar Revisión'
                                  : 'Comentar / Solicitar Correcciones'}
                              </span>
                            </button>
                          )}

                          {isTeacherRole && (
                            <button
                              type="button"
                              onClick={() => deleteActivity(act.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Eliminar planeación"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          <strong>Docente:</strong> {act.docenteNombre}
                        </span>
                        <span>
                          <strong>Nivel:</strong> {actLevel}
                        </span>
                        <span>
                          <strong>Materia:</strong> {act.materia}
                        </span>
                        <span>
                          <strong>Grado y Grupo:</strong> {act.gradoGrupo}
                        </span>
                        {act.etapaPiaget && (
                          <span className="text-indigo-800 font-semibold">
                            <strong>Etapa Piaget:</strong> {act.etapaPiaget}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                        {(act.campoFormativoNEM ||
                          act.metodologiaDidacticaNEM ||
                          act.pdaNEM ||
                          (act.ejesArticuladoresNEM && act.ejesArticuladoresNEM.length > 0)) && (
                          <div className="pb-2 mb-1.5 border-b border-slate-200/80 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                              {act.faseNEM && (
                                <span>
                                  <strong className="text-emerald-900">Fase NEM:</strong> {act.faseNEM}
                                </span>
                              )}
                              {act.campoFormativoNEM && (
                                <span>
                                  <strong className="text-emerald-900">Campo Formativo:</strong>{' '}
                                  {act.campoFormativoNEM}
                                </span>
                              )}
                              {act.metodologiaDidacticaNEM && (
                                <span>
                                  <strong className="text-emerald-900">Metodología Sociocrítica:</strong>{' '}
                                  {act.metodologiaDidacticaNEM}
                                </span>
                              )}
                              {act.escenarioNEM && (
                                <span>
                                  <strong className="text-emerald-900">Escenario:</strong>{' '}
                                  {act.escenarioNEM}
                                </span>
                              )}
                            </div>
                            {act.ejesArticuladoresNEM && act.ejesArticuladoresNEM.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                <strong className="text-[11px] text-slate-800 mr-1">
                                  Ejes Articuladores:
                                </strong>
                                {act.ejesArticuladoresNEM.map((eje, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-950 border border-emerald-200"
                                  >
                                    {eje}
                                  </span>
                                ))}
                              </div>
                            )}
                            {act.pdaNEM && (
                              <div className="text-[11px] text-slate-700 pt-0.5">
                                <strong className="text-slate-900">
                                  Proceso de Desarrollo de Aprendizaje (PDA):
                                </strong>{' '}
                                {act.pdaNEM}
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-900">Objetivo de Aprendizaje (Piaget / Bruner):</strong>{' '}
                          {act.objetivo}
                        </div>
                        {act.entregables && (
                          <div className="text-slate-600 whitespace-pre-line pt-1 border-t border-slate-200/60">
                            <strong className="text-slate-800">Productos y Entregables (3 Semanas):</strong>{' '}
                            {act.entregables}
                          </div>
                        )}
                      </div>

                      {Array.isArray(act.semanasDetalle) && act.semanasDetalle.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                          {act.semanasDetalle.map((sem) => (
                            <div
                              key={sem.semanaNumero}
                              className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-1.5 text-xs"
                            >
                              <div className="font-bold text-indigo-950 flex items-center justify-between">
                                <span>Semana {sem.semanaNumero}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-800">
                                  {sem.semanaNumero === 1
                                    ? 'Enactivo · Asimilación'
                                    : sem.semanaNumero === 2
                                      ? 'Icónico · Acomodación'
                                      : 'Simbólico · Equilibración'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 whitespace-pre-line line-clamp-4">
                                {sem.actividadesInicioDesarrolloCierre}
                              </p>
                              <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200">
                                Producto: {sem.productoSemanal}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {act.archivoNombre && act.archivoUrl && (
                        <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-teal-950">{act.archivoNombre}</span>
                              {act.archivoTamano && (
                                <span className="text-[11px] text-teal-700 ml-2 font-mono">
                                  ({act.archivoTamano})
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={act.archivoUrl}
                            download={act.archivoNombre}
                            className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar Archivo</span>
                          </a>
                        </div>
                      )}

                      {/* Historial de Comentarios y Observaciones de Coordinación */}
                      {commentsList.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5 text-xs">
                          <div className="font-bold text-amber-950 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-amber-700" />
                            <span>
                              Observaciones y Comentarios de Coordinación ({commentsList.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {commentsList.map((cmt) => (
                              <div
                                key={cmt.id}
                                className="p-2.5 rounded-lg bg-white border border-amber-200/80 space-y-1 shadow-2xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                      {cmt.autorNombre}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        cmt.tipo === 'correccion'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : cmt.tipo === 'aprobacion'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {cmt.tipo === 'correccion'
                                        ? 'Solicitud de Complementación / Corrección'
                                        : cmt.tipo === 'aprobacion'
                                        ? 'Planeación Aprobada'
                                        : 'Observación Pedagógica'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {cmt.fecha} · {cmt.hora}
                                  </span>
                                </div>
                                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                  {cmt.comentario}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Panel de Comentario para el Coordinador */}
                      {isCoordinatorRole && isCommentingThis && (
                        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-3 text-xs animate-in fade-in">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-amber-950 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-700" />
                              <span>
                                Revisión de Coordinación para {act.docenteNombre} ({actLevel})
                              </span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCoordCommentType('correccion')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer transition-colors ${
                                  coordCommentType === 'correccion'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                                }`}
                              >
                                Solicitar Corrección / Complementación
                              </button>
                              <button
                                type="button"
                                onClick={() => setCoordCommentType('observacion')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer transition-colors ${
                                  coordCommentType === 'observacion'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                                }`}
                              >
                                Observación General
                              </button>
                              <button
                                type="button"
                                onClick={() => setCoordCommentType('aprobacion')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer transition-colors ${
                                  coordCommentType === 'aprobacion'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                                }`}
                              >
                                Aprobar Planeación
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            value={coordCommentText}
                            onChange={(e) => setCoordCommentText(e.target.value)}
                            placeholder="Escribe tus comentarios para solicitar complementación, ajustes en actividades, PDA o correcciones a la planeación del docente..."
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setCommentingActivityId(null)}
                              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitCoordinatorComment(act)}
                              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Guardar Comentario de Revisión</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Profesor</h3>
              <button type="button" onClick={() => setIsAddTeacherOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-5 space-y-3 text-xs md:text-sm">
              {/* Fotografía opcional o escudo del colegio por defecto */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={fotoPersonalizada || collegeShieldUrl}
                  alt="Foto o Escudo"
                  className="w-12 h-12 rounded-full object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    Fotografía del Docente (Opcional)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {fotoPersonalizada
                      ? 'Fotografía personalizada cargada.'
                      : 'Si no se sube foto, se asigna el escudo oficial del colegio.'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir</span>
                  </button>
                  {fotoPersonalizada && (
                    <button
                      type="button"
                      onClick={() => setFotoPersonalizada('')}
                      className="px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 cursor-pointer"
                      title="Usar escudo del colegio"
                    >
                      Escudo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lic. Fernando Treviño"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="profesor@colegio.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Matemáticas"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nivel que Impartirá *</label>
                  <select
                    value={nivelDocente}
                    onChange={(e) => {
                      const nextLevel = e.target.value as AcademicLevel;
                      setNivelDocente(nextLevel);
                      const levelGroups = getGroupsForCollegeLevel(activeCollege.id, nextLevel);
                      setSelectedNewGroups(levelGroups.length > 0 ? [levelGroups[0]] : []);
                      const levelSubs = getSubjectsForLevel(nextLevel);
                      setSelectedNewSubjects(levelSubs.length > 0 ? [levelSubs[0]] : []);
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {allowedLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold block">
                    Grupos de {nivelDocente} Asignados al Docente
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Módulo Materias y Grupos
                  </span>
                </div>
                {availableGroupsForNewTeacher.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {availableGroupsForNewTeacher.map((grp) => {
                      const isSelected = selectedNewGroups.includes(grp);
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => {
                            setSelectedNewGroups((prev) =>
                              prev.includes(grp) ? prev.filter((g) => g !== grp) : [...prev, grp]
                            );
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {grp}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                    No hay grupos dados de alta para <strong>{nivelDocente}</strong> en el módulo{' '}
                    <strong>Materias y Grupos → Grupos</strong>.
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold block">
                    Materias de {nivelDocente} a Impartir
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Nivel {nivelDocente}
                  </span>
                </div>
                {availableSubjectsForNewTeacher.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {availableSubjectsForNewTeacher.map((subName) => {
                      const isSelected = selectedNewSubjects.includes(subName);
                      return (
                        <button
                          key={subName}
                          type="button"
                          onClick={() => {
                            setSelectedNewSubjects((prev) =>
                              prev.includes(subName)
                                ? prev.filter((s) => s !== subName)
                                : [...prev, subName]
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-[11px] text-slate-500">
                    No hay materias dadas de alta para <strong>{nivelDocente}</strong> en el módulo Materias y Grupos.
                  </div>
                )}
              </div>

              {/* Opción Tutor Principal también al registrar nuevo profesor */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newEsTutorPrincipal}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewEsTutorPrincipal(checked);
                      setNewTutorConflictWarning(null);
                      if (checked) {
                        const firstFree =
                          [...selectedNewGroups, ...availableGroupsForNewTeacher].find(
                            (g) => !findExistingTutorForGroup(nivelDocente, g)
                          ) || '';
                        setNewGrupoTutorado(firstFree);
                        if (!firstFree && availableGroupsForNewTeacher.length > 0) {
                          setNewTutorConflictWarning(
                            `Todos los grupos de ${nivelDocente} ya tienen tutor asignado.`
                          );
                        }
                      } else {
                        setNewGrupoTutorado('');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tutor Principal (Asignar tutor a un grupo)</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Designa a este docente como tutor titular de un grupo de {nivelDocente}.
                    </span>
                  </div>
                </label>

                {newEsTutorPrincipal && (
                  <div className="pt-2 border-t border-emerald-200/70 space-y-2">
                    <span className="font-semibold text-emerald-950 text-[11px] block">
                      Selecciona el grupo bajo su tutela ({nivelDocente}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {availableGroupsForNewTeacher.map((grp) => {
                        const existingTutor = findExistingTutorForGroup(nivelDocente, grp);
                        const isTutored = newGrupoTutorado === grp;
                        return (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => {
                              if (existingTutor) {
                                setNewTutorConflictWarning(
                                  `El grupo ${grp} de ${nivelDocente} ya tiene tutor asignado: ${existingTutor.nombre}.`
                                );
                                return;
                              }
                              setNewTutorConflictWarning(null);
                              setNewGrupoTutorado(grp);
                              if (!selectedNewGroups.includes(grp)) {
                                setSelectedNewGroups((prev) => [...prev, grp]);
                              }
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isTutored
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : existingTutor
                                ? 'bg-amber-50 text-amber-800 border-amber-300 opacity-85'
                                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                            title={
                              existingTutor
                                ? `Ya tiene tutor asignado: ${existingTutor.nombre}`
                                : `Asignar tutoría del grupo ${grp}`
                            }
                          >
                            <span>{grp}</span>
                            {existingTutor && (
                              <span className="text-[8px] font-extrabold uppercase text-amber-700 leading-none mt-0.5">
                                Con tutor
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {newTutorConflictWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-start gap-2 animate-in fade-in">
                        <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{newTutorConflictWarning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Level, Groups & Subjects to Teacher Modal */}
      {editingTeacherForGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Asignar Nivel, Grupos y Materias al Docente
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingTeacherForGroups.nombre} ({editingTeacherForGroups.especialidad})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacherForGroups(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Nivel Educativo que Impartirá el Docente
                </label>
                <select
                  value={editNivelDocente}
                  onChange={(e) => {
                    const nextLvl = e.target.value as AcademicLevel;
                    setEditNivelDocente(nextLvl);
                    const validGroupSet = new Set(
                      getGroupsForCollegeLevel(activeCollege.id, nextLvl)
                    );
                    setEditGroupsList((prev) => prev.filter((g) => validGroupSet.has(g)));
                    const validSubjectSet = new Set(getSubjectsForLevel(nextLvl));
                    setEditSubjectsList((prev) => prev.filter((s) => validSubjectSet.has(s)));
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
                >
                  {allowedLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800">
                    Grupos de {editNivelDocente} (desde Materias y Grupos)
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-2">
                  Selecciona los grupos de <strong>{editNivelDocente}</strong> a cargo de este docente. Al guardar, los alumnos de esos grupos en <strong>Control de Alumnos</strong> se enlazarán automáticamente.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableGroupsForEditTeacher.map((grp) => {
                    const isSelected = editGroupsList.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => {
                          setEditGroupsList((prev) =>
                            prev.includes(grp) ? prev.filter((g) => g !== grp) : [...prev, grp]
                          );
                        }}
                        className={`py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Materias de {editNivelDocente} a Impartir</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Solo nivel {editNivelDocente}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-2">
                  Selecciona las materias del nivel <strong>{editNivelDocente}</strong> que impartirá este profesor:
                </p>

                {availableSubjectsForEditTeacher.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {availableSubjectsForEditTeacher.map((subName) => {
                      const isSelected = editSubjectsList.includes(subName);
                      return (
                        <button
                          key={subName}
                          type="button"
                          onClick={() => {
                            setEditSubjectsList((prev) =>
                              prev.includes(subName)
                                ? prev.filter((s) => s !== subName)
                                : [...prev, subName]
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-[11px] font-bold border text-left transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={subName}
                        >
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-center">
                    No hay materias registradas en el nivel <strong>{editNivelDocente}</strong> dentro del módulo <strong>Materias y Grupos</strong>.
                  </div>
                )}
              </div>

              {/* Opción Tutor Principal para asignar un grupo bajo su tutela */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editEsTutorPrincipal}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditEsTutorPrincipal(checked);
                      setTutorConflictWarning(null);
                      if (checked) {
                        const currentFree =
                          editGrupoTutorado &&
                          !findExistingTutorForGroup(
                            editNivelDocente,
                            editGrupoTutorado,
                            editingTeacherForGroups.id
                          )
                            ? editGrupoTutorado
                            : [...editGroupsList, ...availableGroupsForEditTeacher].find(
                                (g) =>
                                  !findExistingTutorForGroup(
                                    editNivelDocente,
                                    g,
                                    editingTeacherForGroups.id
                                  )
                              ) || '';
                        setEditGrupoTutorado(currentFree);
                        if (!currentFree && availableGroupsForEditTeacher.length > 0) {
                          setTutorConflictWarning(
                            `Todos los grupos de ${editNivelDocente} ya tienen un tutor asignado.`
                          );
                        }
                      } else {
                        setEditGrupoTutorado('');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tutor Principal (Grupo bajo su tutela)</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Activa esta opción para designar a este docente como tutor titular de un grupo específico de {editNivelDocente}.
                    </span>
                  </div>
                </label>

                {editEsTutorPrincipal && (
                  <div className="pt-2 border-t border-emerald-200/70 space-y-2">
                    <span className="font-semibold text-emerald-950 text-[11px] block">
                      Selecciona el grupo bajo su tutela ({editNivelDocente}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {availableGroupsForEditTeacher.map((grp) => {
                        const existingTutor = findExistingTutorForGroup(
                          editNivelDocente,
                          grp,
                          editingTeacherForGroups.id
                        );
                        const isTutored = editGrupoTutorado === grp;
                        return (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => {
                              if (existingTutor) {
                                setTutorConflictWarning(
                                  `El grupo ${grp} de ${editNivelDocente} ya tiene tutor asignado (${existingTutor.nombre}). Elige otro grupo disponible.`
                                );
                                return;
                              }
                              setTutorConflictWarning(null);
                              setEditGrupoTutorado(grp);
                              if (!editGroupsList.includes(grp)) {
                                setEditGroupsList((prev) => [...prev, grp]);
                              }
                            }}
                            className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isTutored
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : existingTutor
                                ? 'bg-amber-50 text-amber-800 border-amber-300 opacity-85'
                                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                            title={
                              existingTutor
                                ? `Este grupo ya tiene tutor asignado: ${existingTutor.nombre}`
                                : `Asignar tutoría del grupo ${grp}`
                            }
                          >
                            <span>{grp}</span>
                            {existingTutor && (
                              <span className="text-[8px] font-extrabold uppercase text-amber-700 leading-none mt-0.5">
                                Con tutor
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {tutorConflictWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-start gap-2 animate-in fade-in">
                        <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{tutorConflictWarning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTutorConflictWarning(null);
                    setEditingTeacherForGroups(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editEsTutorPrincipal && !editGrupoTutorado) {
                      setTutorConflictWarning(
                        `Selecciona un grupo disponible de ${editNivelDocente} para asignarlo como Tutor Principal.`
                      );
                      return;
                    }

                    const effectiveTutorGroup =
                      editEsTutorPrincipal && editGrupoTutorado ? editGrupoTutorado : undefined;

                    if (effectiveTutorGroup) {
                      const conflictingTutor = findExistingTutorForGroup(
                        editNivelDocente,
                        effectiveTutorGroup,
                        editingTeacherForGroups.id
                      );
                      if (conflictingTutor) {
                        setTutorConflictWarning(
                          `El grupo ${effectiveTutorGroup} de ${editNivelDocente} ya tiene tutor asignado (${conflictingTutor.nombre}). Por favor elige otro grupo.`
                        );
                        return;
                      }
                    }

                    const finalGroups =
                      effectiveTutorGroup && !editGroupsList.includes(effectiveTutorGroup)
                        ? [...editGroupsList, effectiveTutorGroup]
                        : editGroupsList;

                    updateTeacher(editingTeacherForGroups.id, {
                      nivel: editNivelDocente,
                      grupos: finalGroups,
                      materias: editSubjectsList,
                      esTutorPrincipal: Boolean(editEsTutorPrincipal && effectiveTutorGroup),
                      grupoTutorado: effectiveTutorGroup,
                    });
                    setTutorConflictWarning(null);
                    setEditingTeacherForGroups(null);
                    setEmailedTeacherBanner(
                      effectiveTutorGroup
                        ? `Se guardó en la base de datos a "${editingTeacherForGroups.nombre}" como Tutor Principal del grupo ${effectiveTutorGroup} (${editNivelDocente}).`
                        : `Se guardó la asignación de nivel, grupos y materias de "${editingTeacherForGroups.nombre}" en la base de datos.`
                    );
                    setTimeout(() => setEmailedTeacherBanner(null), 4500);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Teacher Modal */}
      {teacherToDelete && (
        <div
          onClick={() => setTeacherToDelete(null)}
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
                  Confirmar Eliminación de Docente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs md:text-sm text-slate-700">
              <p>
                ¿Estás seguro de que deseas eliminar al docente{' '}
                <strong className="text-slate-900">{teacherToDelete.nombre}</strong> (
                <span className="font-mono">{teacherToDelete.correo}</span>)?
              </p>
              <p className="text-xs text-rose-700 font-semibold">
                Esta acción eliminará permanentemente al docente y su usuario de acceso tanto de la plataforma como de la base de datos.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const deletedName = teacherToDelete.nombre;
                  deleteTeacher(teacherToDelete.id);
                  setTeacherToDelete(null);
                  setEmailedTeacherBanner(
                    `El docente "${deletedName}" y su usuario de acceso han sido eliminados de la plataforma y de la base de datos.`
                  );
                  setTimeout(() => setEmailedTeacherBanner(null), 4500);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Docente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBIR ARCHIVO DE PLANEACIÓN (.PDF, .XLSX, .XLS, .DOCX, .DOC) O CREAR CON ASISTENTE PIAGET-BRUNER (3 SEMANAS) */}
      {isPlanningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div
              className="px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: goldColor, color: primaryColor }}
                  >
                    Duración: 3 Semanas · Jean Piaget & Jerome Bruner
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/20">
                    Nivel: {teacherLevelForPlanning}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: goldColor }} />
                  <span>
                    {planningModalMode === 'subir_archivo'
                      ? 'Subir Archivo de Planeación (.PDF, .XLSX, .XLS, .DOCX, .DOC)'
                      : 'Asistente de Redacción de Planeaciones (Piaget & Bruner · 3 Semanas)'}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs">
                  <button
                    type="button"
                    onClick={() => setPlanningModalMode('asistente_crear')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      planningModalMode === 'asistente_crear'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Asistente Redacción
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanningModalMode('subir_archivo')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      planningModalMode === 'subir_archivo'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Subir Archivo
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlanningModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSaveTeacherPlanning}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/70 text-xs sm:text-sm"
            >
              {/* 1. Grado Asignado al Docente y Materia */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>1. Grado Asignado al Docente y Asignatura</span>
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {getPiagetStageForLevelAndGrade(teacherLevelForPlanning, planGradoGrupo).etapaNombre}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Grado y Grupo Asignado *
                    </label>
                    {teacherAssignedGroups.length > 0 ? (
                      <select
                        value={planGradoGrupo}
                        onChange={(e) => {
                          const nextGrp = e.target.value;
                          setPlanGradoGrupo(nextGrp);
                          setPlanFaseNEM(
                            getPiagetStageForLevelAndGrade(teacherLevelForPlanning, nextGrp).faseNEM
                          );
                        }}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-slate-900 text-xs"
                      >
                        {teacherAssignedGroups.map((grp) => (
                          <option key={grp} value={grp}>
                            Grupo {grp} ({teacherLevelForPlanning})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={planGradoGrupo}
                        onChange={(e) => {
                          const nextGrp = e.target.value;
                          setPlanGradoGrupo(nextGrp);
                          setPlanFaseNEM(
                            getPiagetStageForLevelAndGrade(teacherLevelForPlanning, nextGrp).faseNEM
                          );
                        }}
                        placeholder="Ej. 3° A"
                        className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs">Materia *</label>
                    {teacherAssignedSubjects.length > 0 ? (
                      <select
                        value={planMateria}
                        onChange={(e) => {
                          const nextSub = e.target.value;
                          setPlanMateria(nextSub);
                          const inferred = inferCampoYMetodologiaNEM(nextSub);
                          setPlanCampoFormativoNEM(inferred.campoFormativo);
                          setPlanMetodologiaNEM(inferred.metodologia);
                          setPlanEjesArticuladoresNEM(inferred.ejesSugeridos);
                        }}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-semibold text-slate-900 text-xs"
                      >
                        {teacherAssignedSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={planMateria}
                        onChange={(e) => {
                          const nextSub = e.target.value;
                          setPlanMateria(nextSub);
                          const inferred = inferCampoYMetodologiaNEM(nextSub);
                          setPlanCampoFormativoNEM(inferred.campoFormativo);
                          setPlanMetodologiaNEM(inferred.metodologia);
                        }}
                        placeholder="Ej. Matemáticas"
                        className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Duración de la Planeación
                    </label>
                    <input
                      type="text"
                      value={planPeriodoSemanas}
                      onChange={(e) => setPlanPeriodoSemanas(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-amber-50/70 font-bold text-amber-950 text-xs"
                    />
                  </div>
                </div>

                {/* Resumen Pedagógico Automático Piaget + Bruner según el grado del docente */}
                {(() => {
                  const stageInfo = getPiagetStageForLevelAndGrade(
                    teacherLevelForPlanning,
                    planGradoGrupo
                  );
                  return (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-amber-50/80 border border-indigo-200/80 text-xs space-y-1.5">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          Diagnóstico Psicopedagógico para {planGradoGrupo} ({stageInfo.rangoEdad}):
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        <strong>Jean Piaget ({stageInfo.etapaNombre}):</strong>{' '}
                        {stageInfo.descripcionCognitiva}
                      </p>
                      <p className="text-[11px] text-slate-700">
                        <strong>Jerome Bruner (Andamiaje en 3 Semanas):</strong>{' '}
                        {stageInfo.andamiajeBruner}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Elementos Curriculares de la Nueva Escuela Mexicana (NEM) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                  <div>
                    <h4 className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-700" />
                      <span>2. Marco Curricular de la Nueva Escuela Mexicana (NEM)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Fase de aprendizaje, Campo Formativo, Ejes Articuladores, Metodología Sociocrítica, Contenido y PDA.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {planFaseNEM ||
                      getPiagetStageForLevelAndGrade(teacherLevelForPlanning, planGradoGrupo)
                        .faseNEM}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Fase de Aprendizaje (NEM)
                    </label>
                    <input
                      type="text"
                      value={
                        planFaseNEM ||
                        getPiagetStageForLevelAndGrade(teacherLevelForPlanning, planGradoGrupo)
                          .faseNEM
                      }
                      onChange={(e) => setPlanFaseNEM(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/50 font-bold text-emerald-950 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Campo Formativo (NEM) *
                    </label>
                    <select
                      value={planCampoFormativoNEM}
                      onChange={(e) => setPlanCampoFormativoNEM(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 text-xs"
                    >
                      {NEM_CAMPOS_FORMATIVOS.map((campo) => (
                        <option key={campo} value={campo}>
                          {campo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Metodología Didáctica Sociocrítica *
                    </label>
                    <select
                      value={planMetodologiaNEM}
                      onChange={(e) => setPlanMetodologiaNEM(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 text-xs"
                    >
                      {NEM_METODOLOGIAS_SOCIOCRITICAS.map((met) => (
                        <option key={met} value={met}>
                          {met}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Escenario (NEM)
                    </label>
                    <select
                      value={planEscenarioNEM}
                      onChange={(e) => setPlanEscenarioNEM(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 text-xs"
                    >
                      {NEM_ESCENARIOS.map((esc) => (
                        <option key={esc} value={esc}>
                          {esc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selección de los 7 Ejes Articuladores de la NEM */}
                <div>
                  <label className="font-semibold block mb-1.5 text-xs text-slate-800">
                    Ejes Articuladores (Selecciona uno o varios de los 7 ejes de la NEM):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEM_EJES_ARTICULADORES.map((eje) => {
                      const isSelected = planEjesArticuladoresNEM.includes(eje);
                      return (
                        <button
                          key={eje}
                          type="button"
                          onClick={() => toggleEjeArticuladorNEM(eje)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{eje}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contenido del Programa Sintético, PDA, Plano Didáctico Analítico y Evaluación Formativa NEM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Contenido (Programa Sintético NEM)
                    </label>
                    <textarea
                      rows={2}
                      value={planContenidoSinteticoNEM}
                      onChange={(e) => setPlanContenidoSinteticoNEM(e.target.value)}
                      placeholder="Se llena automáticamente con el Asistente o escribe el Contenido del Programa Sintético..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Proceso de Desarrollo de Aprendizaje (PDA)
                    </label>
                    <textarea
                      rows={2}
                      value={planPdaNEM}
                      onChange={(e) => setPlanPdaNEM(e.target.value)}
                      placeholder="Se llena automáticamente con el Asistente o escribe el PDA correspondiente al grado..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Programa Analítico · Contextualización y Problematización (Codiseño)
                    </label>
                    <textarea
                      rows={2}
                      value={planProblematizacionNEM}
                      onChange={(e) => setPlanProblematizacionNEM(e.target.value)}
                      placeholder="Situación-problema del aula, escuela o comunidad..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Evaluación Formativa y Retroalimentación (NEM)
                    </label>
                    <textarea
                      rows={2}
                      value={planEvaluacionFormativaNEM}
                      onChange={(e) => setPlanEvaluacionFormativaNEM(e.target.value)}
                      placeholder="Instrumentos de observación, rúbrica formativa, autoevaluación y coevaluación..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Subida de Archivo (.pdf, .xlsx, .xls, .docx, .doc) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-teal-600" />
                      <span>
                        3. Subir Archivo de Planeación (.pdf, .xlsx, .xls, .docx, .doc){' '}
                        {planningModalMode === 'subir_archivo' ? '*' : '(Opcional)'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Adjunta tu formato institucional en PDF, Excel (.xlsx, .xls) o Word (.docx, .doc).
                    </p>
                  </div>

                  <input
                    ref={planFileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.docx,.doc,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handlePlanFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => planFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Archivo (.pdf, .xlsx, .xls, .docx, .doc)</span>
                  </button>
                </div>

                {planFileError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    {planFileError}
                  </div>
                )}

                {planArchivoNombre ? (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-teal-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-teal-950 block truncate">
                          {planArchivoNombre}
                        </span>
                        <span className="text-[11px] text-teal-700 font-mono">
                          Formato: .{planArchivoTipo.toLowerCase()} · Tamaño: {planArchivoTamano}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanArchivoNombre('');
                        setPlanArchivoUrl('');
                        setPlanArchivoTipo('');
                        setPlanArchivoTamano('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 text-[11px] font-bold cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => planFileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl text-center cursor-pointer bg-slate-50/60 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-600 block">
                      Haz clic aquí para subir tu archivo en <strong>.pdf, .xlsx, .xls, .docx o .doc</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Asistente de Redacción de Planeación de 3 Semanas (NEM + Piaget & Bruner) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-indigo-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>
                        4. Asistente de Redacción de Planeaciones (3 Semanas · NEM + Jean Piaget y Jerome Bruner)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Escribe el tema o aprendizaje esperado y el asistente redactará automáticamente los campos de la Nueva Escuela Mexicana (Contenido, PDA, Problematización y Evaluación Formativa) junto con la secuencia de 3 semanas (Piaget y Bruner) adaptada al grado {planGradoGrupo}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Tema o Contenido Central a Planear *
                    </label>
                    <input
                      type="text"
                      value={planTemaCentral}
                      onChange={(e) => setPlanTemaCentral(e.target.value)}
                      placeholder="Ej. Fracciones equivalentes / El ciclo del agua / La Revolución Mexicana..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Enfoque o Particularidad del Grupo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={planContextoGrupo}
                      onChange={(e) => setPlanContextoGrupo(e.target.value)}
                      placeholder="Ej. Aprendizaje visual, uso de regletas, trabajo en equipo..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleGenerateWithPiagetBrunerAssistant}
                      className="w-full py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: goldColor }} />
                      <span>Redactar con Asistente (3 Sem.)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Título de la Planeación *
                  </label>
                  <input
                    type="text"
                    required={planningModalMode === 'asistente_crear'}
                    value={planTitulo}
                    onChange={(e) => setPlanTitulo(e.target.value)}
                    placeholder="Ej. Planeación 3 Semanas (Piaget-Bruner): Fracciones y Proporciones"
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Objetivo General de Aprendizaje (Piaget & Bruner) *
                  </label>
                  <textarea
                    rows={3}
                    required={planningModalMode === 'asistente_crear'}
                    value={planObjetivo}
                    onChange={(e) => setPlanObjetivo(e.target.value)}
                    placeholder="Pulsa 'Redactar con Asistente (3 Sem.)' o escribe aquí el objetivo pedagógico..."
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>

                {/* Desglose editable de las 3 semanas generadas por el asistente */}
                {planSemanasDetalle.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Secuencia Didáctica de 3 Semanas (Editable por el Docente):</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {planSemanasDetalle.map((sem, idx) => (
                        <div
                          key={sem.semanaNumero}
                          className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs text-indigo-950">
                              {sem.etiquetaSemana}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-800">
                              {sem.enfoqueBruner.split(':')[0]} · {sem.enfoquePiaget.split(':')[0]}
                            </span>
                          </div>

                          <textarea
                            rows={4}
                            value={sem.actividadesInicioDesarrolloCierre}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPlanSemanasDetalle((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, actividadesInicioDesarrolloCierre: val }
                                    : item
                                )
                              );
                            }}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-xs bg-white"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                Materiales y Andamiaje (Bruner):
                              </label>
                              <input
                                type="text"
                                value={sem.materialesYAndamiaje}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlanSemanasDetalle((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, materialesYAndamiaje: val } : item
                                    )
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                                Producto / Evidencia de la Semana {sem.semanaNumero}:
                              </label>
                              <input
                                type="text"
                                value={sem.productoSemanal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlanSemanasDetalle((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, productoSemanal: val } : item
                                    )
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Entregables y Evaluación Formativa (3 Semanas)
                  </label>
                  <textarea
                    rows={2}
                    value={planEntregables}
                    onChange={(e) => setPlanEntregables(e.target.value)}
                    placeholder="Productos esperados al término de las 3 semanas..."
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-white p-4 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsPlanningModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4" style={{ color: goldColor }} />
                  <span>Guardar Planeación Docente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA DETALLADA DE LAS 3 SEMANAS (PIAGET & BRUNER) */}
      {viewingPlanDetail && (
        <div
          onClick={() => setViewingPlanDetail(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 cursor-default"
          >
            <div
              className="px-6 py-4 text-white flex items-center justify-between gap-3"
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
                  Planeación de 3 Semanas · Método Jean Piaget y Jerome Bruner
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-white mt-1">
                  {viewingPlanDetail.titulo}
                </h3>
                <p className="text-xs text-slate-200">
                  {viewingPlanDetail.materia} · Grupo {viewingPlanDetail.gradoGrupo} ·{' '}
                  {viewingPlanDetail.docenteNombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlanDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50 text-xs">
              {(viewingPlanDetail.campoFormativoNEM ||
                viewingPlanDetail.faseNEM ||
                viewingPlanDetail.pdaNEM) && (
                <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Marco Curricular · Nueva Escuela Mexicana (NEM)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {viewingPlanDetail.faseNEM && (
                      <div>
                        <strong>Fase de Aprendizaje:</strong> {viewingPlanDetail.faseNEM}
                      </div>
                    )}
                    {viewingPlanDetail.campoFormativoNEM && (
                      <div>
                        <strong>Campo Formativo:</strong> {viewingPlanDetail.campoFormativoNEM}
                      </div>
                    )}
                    {viewingPlanDetail.metodologiaDidacticaNEM && (
                      <div>
                        <strong>Metodología Sociocrítica:</strong>{' '}
                        {viewingPlanDetail.metodologiaDidacticaNEM}
                      </div>
                    )}
                    {viewingPlanDetail.escenarioNEM && (
                      <div>
                        <strong>Escenario:</strong> {viewingPlanDetail.escenarioNEM}
                      </div>
                    )}
                  </div>
                  {viewingPlanDetail.ejesArticuladoresNEM &&
                    viewingPlanDetail.ejesArticuladoresNEM.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <strong className="text-[11px] mr-1">Ejes Articuladores:</strong>
                        {viewingPlanDetail.ejesArticuladoresNEM.map((eje, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-900 font-bold text-[10px]"
                          >
                            {eje}
                          </span>
                        ))}
                      </div>
                    )}
                  {viewingPlanDetail.contenidoProgramaSinteticoNEM && (
                    <div className="pt-1 border-t border-emerald-200/70">
                      <strong>Contenido (Programa Sintético):</strong>{' '}
                      {viewingPlanDetail.contenidoProgramaSinteticoNEM}
                    </div>
                  )}
                  {viewingPlanDetail.pdaNEM && (
                    <div>
                      <strong>Proceso de Desarrollo de Aprendizaje (PDA):</strong>{' '}
                      {viewingPlanDetail.pdaNEM}
                    </div>
                  )}
                  {viewingPlanDetail.problematizacionProgramaAnaliticoNEM && (
                    <div>
                      <strong>Programa Analítico (Contextualización / Codiseño):</strong>{' '}
                      {viewingPlanDetail.problematizacionProgramaAnaliticoNEM}
                    </div>
                  )}
                  {viewingPlanDetail.evaluacionFormativaNEM && (
                    <div>
                      <strong>Evaluación Formativa NEM:</strong>{' '}
                      {viewingPlanDetail.evaluacionFormativaNEM}
                    </div>
                  )}
                </div>
              )}

              {viewingPlanDetail.etapaPiaget && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1">
                  <div className="font-bold">Fundamento Psicopedagógico:</div>
                  <div>
                    <strong>Jean Piaget:</strong> {viewingPlanDetail.etapaPiaget}
                  </div>
                  <div>
                    <strong>Jerome Bruner:</strong>{' '}
                    {viewingPlanDetail.modalidadBruner ||
                      'Currículum en Espiral (Enactivo → Icónico → Simbólico · 3 Semanas)'}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Objetivo General:</div>
                <p className="text-slate-700 leading-relaxed">{viewingPlanDetail.objetivo}</p>
              </div>

              {Array.isArray(viewingPlanDetail.semanasDetalle) &&
                viewingPlanDetail.semanasDetalle.map((sem) => (
                  <div
                    key={sem.semanaNumero}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="font-bold text-sm text-indigo-950">{sem.etiquetaSemana}</div>
                    <div className="text-[11px] text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      <strong>Bruner:</strong> {sem.enfoqueBruner}
                    </div>
                    <div className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <strong>Piaget:</strong> {sem.enfoquePiaget}
                    </div>
                    <div className="text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {sem.actividadesInicioDesarrolloCierre}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-slate-600">
                        <strong>Andamiaje y Materiales:</strong> {sem.materialesYAndamiaje}
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Producto: {sem.productoSemanal}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPlanDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
