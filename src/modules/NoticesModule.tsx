import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Plus,
  X,
  Check,
  Users,
  UserCheck,
  HeartHandshake,
  ShieldAlert,
  FileText,
  Mail,
  Send,
  GraduationCap,
  Inbox,
  SendHorizontal,
  Pencil,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import {
  Notice,
  NoticeCommunicationType,
  AcademicLevel,
  UserRole,
  User,
} from '../types';

const COMMUNICATION_TYPES: {
  id: NoticeCommunicationType;
  label: string;
  descripcionRuta: string;
  badgeClass: string;
}[] = [
  {
    id: 'Canalización',
    label: 'Canalización Psicopedagógica',
    descripcionRuta:
      'Se envía automáticamente al Psicólogo asignado a ese nivel escolar y al Coordinador asignado a ese nivel.',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'Incidencia',
    label: 'Incidencia Disciplinaria / Académica',
    descripcionRuta:
      'Se envía automáticamente al Coordinador asignado a ese nivel escolar.',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'Reporte al Tutor',
    label: 'Reporte al Tutor / Padre de Familia',
    descripcionRuta:
      'Se envía directamente al Tutor del alumno o grupo seleccionado (y al Coordinador de nivel).',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'Citatorio',
    label: 'Citatorio a Padres / Tutor',
    descripcionRuta:
      'Se envía al Tutor del alumno y se notifica al Coordinador del nivel escolar.',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'Aviso',
    label: 'Aviso Escolar',
    descripcionRuta:
      'Se envía a los destinatarios seleccionados (Padres de Familia, Estudiantes, Docentes o Comunidad).',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'Notificación',
    label: 'Notificación Oficial',
    descripcionRuta:
      'Notificación formal dirigida al perfil o grupo seleccionado con opción de copia (CC).',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  {
    id: 'Circular General',
    label: 'Circular General Institucional',
    descripcionRuta:
      'Comunicado general dirigido a los perfiles seleccionados del plantel.',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
  },
];

interface NoticesModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const NoticesModule: React.FC<NoticesModuleProps> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    colleges,
    currentUser,
    notices,
    addNotice,
    updateNotice,
    sendEmailNotification,
    users,
    teachers,
    students,
    subjects,
    setPendingCanalizacionForExpediente,
  } = useApp();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [mailboxTab, setMailboxTab] = useState<'todos' | 'recibidos' | 'emitidos'>('todos');
  const [sentBanner, setSentBanner] = useState<string | null>(null);

  const isTeacher = currentUser?.rol === 'docente';
  const canCreateNotice = !['tutor', 'alumno'].includes(currentUser?.rol || '');

  const effectiveCollege =
    activeCollege ||
    (currentUser?.colegioId
      ? colleges.find((c) => c.id === currentUser.colegioId) || null
      : null);

  // Detectar registro del docente actual si aplica
  const currentTeacherRecord = useMemo(() => {
    if (!effectiveCollege || !currentUser) return null;
    const collegeTeachers = teachers.filter((t) => t.colegioId === effectiveCollege.id);
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
  }, [effectiveCollege, currentUser, teachers]);

  const currentOwnerIds = useMemo(() => {
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

  const currentOwnerNames = useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.nombre) names.add(currentUser.nombre.trim().toLowerCase());
    if (currentTeacherRecord?.nombre) {
      names.add(currentTeacherRecord.nombre.trim().toLowerCase());
    }
    return names;
  }, [currentUser?.nombre, currentTeacherRecord]);

  // Grupos asignados exclusivamente a este docente
  const teacherOwnGroups = useMemo(() => {
    if (!effectiveCollege || !currentTeacherRecord) return [];
    const fromTeacher = (currentTeacherRecord.grupos || []).filter(Boolean);
    const fromSubjects = subjects
      .filter(
        (sub) =>
          sub.colegioId === effectiveCollege.id &&
          (sub.docenteId === currentTeacherRecord.id ||
            (sub.docenteNombre &&
              sub.docenteNombre.trim().toLowerCase() ===
                currentTeacherRecord.nombre.trim().toLowerCase())) &&
          sub.grado
      )
      .map((sub) =>
        `${sub.grado}${sub.grupo ? ` ${sub.grupo}` : ''}`
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean);
    return Array.from(new Set([...fromTeacher, ...fromSubjects]));
  }, [effectiveCollege, currentTeacherRecord, subjects]);

  // Niveles permitidos del colegio (o solo el nivel del docente cuando es docente)
  const allowedLevels: AcademicLevel[] = useMemo(() => {
    if (isTeacher && currentTeacherRecord?.nivel) {
      return [currentTeacherRecord.nivel];
    }
    if (currentUser?.rol === 'coordinador' || currentUser?.rol === 'psicologo') {
      const assignedLvls = [
        ...(currentUser.nivelAsignado ? [currentUser.nivelAsignado] : []),
        ...(Array.isArray(currentUser.nivelesAsignados)
          ? currentUser.nivelesAsignados
          : []),
      ];
      if (assignedLvls.length > 0) {
        return Array.from(new Set(assignedLvls));
      }
    }
    const clean = (effectiveCollege?.nivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  }, [
    isTeacher,
    currentTeacherRecord?.nivel,
    currentUser?.rol,
    currentUser?.nivelAsignado,
    currentUser?.nivelesAsignados,
    effectiveCollege?.nivel,
  ]);

  const defaultLevel: AcademicLevel =
    currentTeacherRecord?.nivel ||
    currentUser?.nivelAsignado ||
    allowedLevels[0] ||
    'Primaria';

  // Estados del formulario de emisión de comunicado
  const [tipoComunicado, setTipoComunicado] =
    useState<NoticeCommunicationType>('Aviso');
  const [nivelEscolar, setNivelEscolar] = useState<AcademicLevel>(defaultLevel);
  // Para docentes, 'MIS_GRUPOS' envía el aviso a sus grupos asignados a la vez (ej. 6° A y 6° B)
  const [gradoGrupo, setGradoGrupo] = useState<string>(
    isTeacher ? 'MIS_GRUPOS' : ''
  );
  const [estudianteId, setEstudianteId] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [prioridad, setPrioridad] = useState<Notice['prioridad']>('Normal');
  const [destinatariosManual, setDestinatariosManual] = useState<string>(
    isTeacher ? 'Padres de Familia' : 'Toda la Comunidad'
  );
  // Copias (CC) a otros coordinadores y otros docentes
  const [copiaCoordinadoresIds, setCopiaCoordinadoresIds] = useState<string[]>(
    []
  );
  const [copiaDocentesIds, setCopiaDocentesIds] = useState<string[]>([]);

  useEffect(() => {
    setNivelEscolar(defaultLevel);
  }, [defaultLevel]);

  // Grupos disponibles para el selector de Grado y Grupo
  const availableGroupsForLevel = useMemo(() => {
    if (!effectiveCollege) return [];
    if (isTeacher) {
      return teacherOwnGroups;
    }
    const fromStudents = students
      .filter(
        (s) =>
          s.colegioId === effectiveCollege.id &&
          (!s.nivel || s.nivel === nivelEscolar)
      )
      .map((s) => `${s.grado} ${s.grupo}`.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const fromSubjects = subjects
      .filter(
        (sub) =>
          sub.colegioId === effectiveCollege.id &&
          (!sub.nivel || sub.nivel === nivelEscolar) &&
          sub.grado
      )
      .map((sub) =>
        `${sub.grado}${sub.grupo ? ` ${sub.grupo}` : ''}`
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean);
    const merged = Array.from(new Set([...fromStudents, ...fromSubjects]));
    return merged.length > 0 ? merged : ['1° A', '2° A', '3° A'];
  }, [
    effectiveCollege,
    isTeacher,
    teacherOwnGroups,
    students,
    subjects,
    nivelEscolar,
  ]);

  // Etiqueta legible del grupo seleccionado (resolviendo 'MIS_GRUPOS' a los grupos del docente, ej. "6° A, 6° B")
  const resolvedGroupLabel = useMemo(() => {
    if (gradoGrupo === 'MIS_GRUPOS') {
      return teacherOwnGroups.length > 0
        ? teacherOwnGroups.join(', ')
        : 'Mis Grupos Asignados';
    }
    return gradoGrupo;
  }, [gradoGrupo, teacherOwnGroups]);

  // Alumnos disponibles (para el docente, únicamente los alumnos de sus grupos asignados)
  const availableStudents = useMemo(() => {
    if (!effectiveCollege) return [];
    return students.filter((s) => {
      if (s.colegioId !== effectiveCollege.id) return false;
      if (s.nivel && s.nivel !== nivelEscolar) return false;

      const stGrp = `${s.grado} ${s.grupo}`
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      if (isTeacher && teacherOwnGroups.length > 0) {
        const belongsToTeacherGroups = teacherOwnGroups.some((tg) => {
          const cleanTg = tg.replace(/\s+/g, ' ').trim().toLowerCase();
          return stGrp === cleanTg || stGrp.includes(cleanTg) || cleanTg.includes(stGrp);
        });
        if (!belongsToTeacherGroups) return false;
      }

      if (gradoGrupo && gradoGrupo !== 'MIS_GRUPOS') {
        const targetGrp = gradoGrupo.replace(/\s+/g, ' ').trim().toLowerCase();
        if (!stGrp.includes(targetGrp) && !targetGrp.includes(stGrp)) {
          return false;
        }
      }
      return true;
    });
  }, [
    effectiveCollege,
    students,
    nivelEscolar,
    isTeacher,
    teacherOwnGroups,
    gradoGrupo,
  ]);

  // Helper para saber si un usuario (Coordinador o Psicólogo) está asignado al nivelEscolar y/o gradoGrupo
  const userMatchesLevelAndGroup = (
    u: User,
    targetLevel: AcademicLevel,
    targetGroup?: string
  ): boolean => {
    const levels: AcademicLevel[] = [
      ...(u.nivelAsignado ? [u.nivelAsignado] : []),
      ...(Array.isArray(u.nivelesAsignados) ? u.nivelesAsignados : []),
    ];
    if (levels.length > 0 && !levels.includes(targetLevel)) {
      return false;
    }
    if (
      targetGroup &&
      targetGroup !== 'MIS_GRUPOS' &&
      Array.isArray(u.gruposAsignados) &&
      u.gruposAsignados.length > 0
    ) {
      const cleanGrp = targetGroup.replace(/\s+/g, ' ').trim().toLowerCase();
      const matchesSpecificGroup = u.gruposAsignados.some((g) =>
        g.toLowerCase().includes(cleanGrp)
      );
      if (!matchesSpecificGroup) return false;
    }
    return true;
  };

  // Todos los coordinadores del colegio
  const collegeCoordinators = useMemo(() => {
    if (!effectiveCollege) return [];
    return users.filter(
      (u) =>
        u.colegioId === effectiveCollege.id &&
        u.rol === 'coordinador' &&
        u.activo !== false
    );
  }, [effectiveCollege, users]);

  // Todos los psicólogos del colegio
  const collegePsychologists = useMemo(() => {
    if (!effectiveCollege) return [];
    return users.filter(
      (u) =>
        u.colegioId === effectiveCollege.id &&
        u.rol === 'psicologo' &&
        u.activo !== false
    );
  }, [effectiveCollege, users]);

  // Todos los docentes del colegio
  const collegeTeachersList = useMemo(() => {
    if (!effectiveCollege) return [];
    const list: {
      id: string;
      nombre: string;
      correo: string;
      nivel?: string;
    }[] = [];
    const seenEmails = new Set<string>();

    teachers
      .filter((t) => t.colegioId === effectiveCollege.id && t.estatus === 'activo')
      .forEach((t) => {
        const emailLower = (t.correo || '').trim().toLowerCase();
        if (emailLower) seenEmails.add(emailLower);
        list.push({
          id: t.id,
          nombre: t.nombre,
          correo: t.correo,
          nivel: t.nivel,
        });
      });

    users
      .filter(
        (u) =>
          u.colegioId === effectiveCollege.id &&
          u.rol === 'docente' &&
          u.activo !== false
      )
      .forEach((u) => {
        const emailLower = (u.correo || '').trim().toLowerCase();
        if (!seenEmails.has(emailLower)) {
          list.push({
            id: u.id,
            nombre: u.nombre,
            correo: u.correo,
            nivel: u.nivelAsignado,
          });
        }
      });

    return list.filter(
      (item) =>
        item.id !== currentUser?.id && item.id !== currentTeacherRecord?.id
    );
  }, [
    effectiveCollege,
    teachers,
    users,
    currentUser?.id,
    currentTeacherRecord?.id,
  ]);

  // Coordinadores asignados automáticamente al nivel seleccionado
  const assignedCoordinatorsForLevel = useMemo(() => {
    const matched = collegeCoordinators.filter((c) =>
      userMatchesLevelAndGroup(c, nivelEscolar, gradoGrupo)
    );
    return matched.length > 0 ? matched : collegeCoordinators;
  }, [collegeCoordinators, nivelEscolar, gradoGrupo]);

  // Psicólogos asignados automáticamente al nivel seleccionado
  const assignedPsychologistsForLevel = useMemo(() => {
    const matched = collegePsychologists.filter((p) =>
      userMatchesLevelAndGroup(p, nivelEscolar, gradoGrupo)
    );
    return matched.length > 0 ? matched : collegePsychologists;
  }, [collegePsychologists, nivelEscolar, gradoGrupo]);

  // Alumno seleccionado
  const selectedStudentObj = useMemo(
    () => availableStudents.find((s) => s.id === estudianteId) || null,
    [availableStudents, estudianteId]
  );

  // Cálculo automático de destinatarios principales según el Tipo de Comunicado
  const automaticRoutingSummary = useMemo(() => {
    const recipientNames: string[] = [];
    const recipientEmails: string[] = [];
    const recipientUserIds: string[] = [];
    const targetRoles = new Set<UserRole>();

    const groupScopeText = resolvedGroupLabel
      ? `Grupos: ${resolvedGroupLabel}`
      : nivelEscolar;

    if (tipoComunicado === 'Canalización') {
      targetRoles.add('psicologo');
      targetRoles.add('coordinador');
      assignedPsychologistsForLevel.forEach((p) => {
        recipientNames.push(`Psic. ${p.nombre} (${nivelEscolar})`);
        if (p.correo) recipientEmails.push(p.correo);
        recipientUserIds.push(p.id);
      });
      if (assignedPsychologistsForLevel.length === 0) {
        recipientNames.push(`Departamento de Psicología (${nivelEscolar})`);
        recipientEmails.push(
          `psicologia.${nivelEscolar.toLowerCase()}@${effectiveCollege?.id || 'colegio'}.edu.mx`
        );
      }

      assignedCoordinatorsForLevel.forEach((c) => {
        recipientNames.push(`Coord. ${c.nombre} (${nivelEscolar})`);
        if (c.correo) recipientEmails.push(c.correo);
        recipientUserIds.push(c.id);
      });
      if (assignedCoordinatorsForLevel.length === 0) {
        recipientNames.push(`Coordinación de ${nivelEscolar}`);
        recipientEmails.push(
          `coordinacion.${nivelEscolar.toLowerCase()}@${effectiveCollege?.id || 'colegio'}.edu.mx`
        );
      }
    } else if (tipoComunicado === 'Incidencia') {
      targetRoles.add('coordinador');
      assignedCoordinatorsForLevel.forEach((c) => {
        recipientNames.push(`Coord. ${c.nombre} (${nivelEscolar})`);
        if (c.correo) recipientEmails.push(c.correo);
        recipientUserIds.push(c.id);
      });
      if (assignedCoordinatorsForLevel.length === 0) {
        recipientNames.push(`Coordinación Académica de ${nivelEscolar}`);
        recipientEmails.push(
          `coordinacion.${nivelEscolar.toLowerCase()}@${effectiveCollege?.id || 'colegio'}.edu.mx`
        );
      }
    } else if (
      tipoComunicado === 'Reporte al Tutor' ||
      tipoComunicado === 'Citatorio'
    ) {
      targetRoles.add('tutor');
      targetRoles.add('coordinador');
      if (selectedStudentObj) {
        recipientNames.push(
          `Tutor: ${selectedStudentObj.tutorNombre} (Alumno: ${selectedStudentObj.nombre} ${selectedStudentObj.apellidos})`
        );
        if (selectedStudentObj.tutorCorreo) {
          recipientEmails.push(selectedStudentObj.tutorCorreo);
        }
        if (selectedStudentObj.tutorId) {
          recipientUserIds.push(selectedStudentObj.tutorId);
        }
      } else {
        recipientNames.push(`Tutores / Padres de Familia (${groupScopeText})`);
      }
      assignedCoordinatorsForLevel.forEach((c) => {
        recipientNames.push(`Coord. ${c.nombre} (${nivelEscolar})`);
        if (c.correo) recipientEmails.push(c.correo);
        recipientUserIds.push(c.id);
      });
    } else {
      // Aviso, Notificación, Circular General
      const rolesMap: Record<string, UserRole[]> = {
        'Toda la Comunidad': [
          'directivo',
          'docente',
          'prefecto',
          'coordinador',
          'psicologo',
          'tutor',
          'alumno',
        ],
        Docentes: ['docente', 'coordinador', 'directivo'],
        'Padres de Familia': ['tutor'],
        Estudiantes: ['alumno'],
        'Padres de Familia y Estudiantes': ['tutor', 'alumno'],
        'Coordinación Académica': ['coordinador', 'directivo'],
        'Psicología y Orientación': ['psicologo', 'coordinador'],
      };
      (rolesMap[destinatariosManual] || ['tutor', 'alumno']).forEach((r) =>
        targetRoles.add(r)
      );
      recipientNames.push(`${destinatariosManual} (${groupScopeText})`);
    }

    return {
      recipientNames,
      recipientEmails,
      recipientUserIds,
      targetRoles: Array.from(targetRoles),
      summaryLabel: recipientNames.join(', '),
    };
  }, [
    tipoComunicado,
    nivelEscolar,
    resolvedGroupLabel,
    assignedPsychologistsForLevel,
    assignedCoordinatorsForLevel,
    selectedStudentObj,
    destinatariosManual,
    effectiveCollege?.id,
  ]);

  if (!effectiveCollege) return null;
  const primaryColor = effectiveCollege.colores.primario || '#0B2545';
  const goldColor = effectiveCollege.colores.secundario || '#C59B27';

  // Determinar si un comunicado fue emitido por el usuario actual o si fue recibido (compartido con él)
  const isNoticeAuthoredByCurrentUser = (n: Notice): boolean => {
    if (!currentUser) return false;
    const authorIdClean = (n.autorId || '').trim().toLowerCase();
    if (authorIdClean && currentOwnerIds.has(authorIdClean)) return true;
    const authorClean = (n.autor || '').trim().toLowerCase();
    return Boolean(authorClean && currentOwnerNames.has(authorClean));
  };

  // Determinar si un comunicado fue emitido por un perfil de docente
  const isNoticeAuthoredByAnyTeacher = (n: Notice): boolean => {
    if (n.autorRol === 'docente') return true;
    const authorClean = (n.autor || '').trim().toLowerCase();
    const authorIdClean = (n.autorId || '').trim().toLowerCase();
    return teachers.some(
      (t) =>
        t.colegioId === effectiveCollege.id &&
        ((authorIdClean &&
          (t.id.trim().toLowerCase() === authorIdClean ||
            `usr-${t.id}`.trim().toLowerCase() === authorIdClean)) ||
          (authorClean && t.nombre.trim().toLowerCase() === authorClean))
    );
  };

  const isNoticeReceivedByCurrentUser = (n: Notice): boolean => {
    if (!currentUser) return false;
    if (isNoticeAuthoredByCurrentUser(n)) return false;

    const myIds = Array.from(currentOwnerIds);
    const myEmail = (
      currentUser.correo ||
      currentTeacherRecord?.correo ||
      ''
    )
      .trim()
      .toLowerCase();

    // 1. Verificar si este usuario está explícitamente compartido en copia (CC) o como destinatario directo
    const isExplicitlySharedWithMe =
      Boolean(
        n.copiaDocentesIds?.some((id) => myIds.includes(id.trim().toLowerCase())) ||
          n.copiaCoordinadoresIds?.some((id) => myIds.includes(id.trim().toLowerCase())) ||
          n.usuariosInvolucradosIds?.some((id) => myIds.includes(id.trim().toLowerCase()))
      ) ||
      Boolean(
        myEmail &&
          (n.enCopiaCorreos?.some((c) => c.trim().toLowerCase() === myEmail) ||
            n.destinatariosPrincipalesCorreos?.some(
              (c) => c.trim().toLowerCase() === myEmail
            ))
      );

    if (isExplicitlySharedWithMe) {
      return true;
    }

    const authoredByTeacher = isNoticeAuthoredByAnyTeacher(n);
    const destLower = (n.destinatarios || '').toLowerCase();

    // 2. Si el usuario actual es DOCENTE:
    // Todo lo que otro docente haga en su perfil es únicamente para ese otro docente,
    // salvo los comunicados que explícitamente comparta con este usuario (isExplicitlySharedWithMe).
    if (isTeacher) {
      if (authoredByTeacher) {
        // Nunca mostrar comunicados de otros docentes a menos que hayan sido compartidos explícitamente en CC / destinatarios con este docente
        return false;
      }
      // Si fue emitido por Administración / Dirección / Coordinación / Psicología dirigido a docentes o toda la comunidad:
      if (
        destLower.includes('toda la comunidad') ||
        destLower.includes('docente') ||
        destLower.includes('profesor')
      ) {
        return true;
      }
      return false;
    }

    // 3. Si el comunicado fue emitido por un DOCENTE y el usuario actual NO es ese docente:
    // Solo pueden verlo los usuarios con quienes el docente lo compartió (destinatarios principales o CC)
    if (authoredByTeacher) {
      if (currentUser.rol === 'coordinador') {
        return (
          n.tipoComunicado === 'Incidencia' ||
          n.tipoComunicado === 'Canalización' ||
          n.tipoComunicado === 'Reporte al Tutor' ||
          n.tipoComunicado === 'Citatorio' ||
          destLower.includes('coordin') ||
          destLower.includes('toda la comunidad')
        );
      }
      if (currentUser.rol === 'psicologo') {
        return (
          n.tipoComunicado === 'Canalización' ||
          destLower.includes('psic') ||
          destLower.includes('toda la comunidad')
        );
      }
      if (
        currentUser.rol === 'directivo' ||
        currentUser.rol === 'administrador' ||
        currentUser.rol === 'control_escolar' ||
        currentUser.rol === 'superusuario'
      ) {
        return (
          destLower.includes('toda la comunidad') ||
          destLower.includes('direcci') ||
          destLower.includes('coordin') ||
          destLower.includes('admin')
        );
      }
      return false;
    }

    if (currentUser.rol === 'coordinador') {
      if (
        n.tipoComunicado === 'Incidencia' ||
        n.tipoComunicado === 'Canalización' ||
        destLower.includes('coordin') ||
        destLower.includes('toda la comunidad')
      ) {
        return true;
      }
    }

    if (currentUser.rol === 'psicologo') {
      if (
        n.tipoComunicado === 'Canalización' ||
        destLower.includes('psic') ||
        destLower.includes('toda la comunidad')
      ) {
        return true;
      }
    }

    return true;
  };

  // Todos los comunicados del colegio pertinentes para este usuario (Recibidos + Emitidos)
  const allRelevantNotices = useMemo(() => {
    return notices.filter((n) => {
      if (n.colegioId !== effectiveCollege.id && n.colegioId !== 'todos') {
        return false;
      }
      return (
        isNoticeAuthoredByCurrentUser(n) || isNoticeReceivedByCurrentUser(n)
      );
    });
  }, [notices, effectiveCollege.id, currentUser, currentTeacherRecord]);

  const receivedNoticesCount = useMemo(
    () =>
      allRelevantNotices.filter((n) => !isNoticeAuthoredByCurrentUser(n)).length,
    [allRelevantNotices]
  );

  const emittedNoticesCount = useMemo(
    () =>
      allRelevantNotices.filter((n) => isNoticeAuthoredByCurrentUser(n)).length,
    [allRelevantNotices]
  );

  const collegeNotices = useMemo(() => {
    return allRelevantNotices.filter((n) => {
      if (mailboxTab === 'recibidos' && isNoticeAuthoredByCurrentUser(n)) {
        return false;
      }
      if (mailboxTab === 'emitidos' && !isNoticeAuthoredByCurrentUser(n)) {
        return false;
      }
      if (
        filterType !== 'TODOS' &&
        (n.tipoComunicado || 'Aviso') !== filterType
      ) {
        return false;
      }
      return true;
    });
  }, [allRelevantNotices, mailboxTab, filterType]);

  const toggleCcCoordinator = (id: string) => {
    setCopiaCoordinadoresIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCcTeacher = (id: string) => {
    setCopiaDocentesIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAddModal = () => {
    setEditingNotice(null);
    setTipoComunicado(isTeacher ? 'Aviso' : 'Aviso');
    setNivelEscolar(defaultLevel);
    // Para docentes, por defecto selecciona "Mis Grupos" (ambos grupos a la vez)
    setGradoGrupo(isTeacher ? 'MIS_GRUPOS' : '');
    setEstudianteId('');
    setTitulo('');
    setContenido('');
    setPrioridad('Normal');
    setDestinatariosManual(
      isTeacher ? 'Padres de Familia y Estudiantes' : 'Toda la Comunidad'
    );
    setCopiaCoordinadoresIds([]);
    setCopiaDocentesIds([]);
    setIsAddOpen(true);
  };

  const handleOpenEditModal = (notice: Notice) => {
    if (!canCreateNotice) return;
    setEditingNotice(notice);
    setTipoComunicado(notice.tipoComunicado || 'Aviso');
    setNivelEscolar(notice.nivelEscolar || defaultLevel);
    if (isTeacher) {
      if (
        !notice.gradoGrupo ||
        notice.gradoGrupo.includes(',') ||
        notice.gradoGrupo === 'Mis Grupos Asignados'
      ) {
        setGradoGrupo('MIS_GRUPOS');
      } else {
        setGradoGrupo(notice.gradoGrupo);
      }
    } else {
      setGradoGrupo(notice.gradoGrupo || '');
    }
    setEstudianteId(notice.estudianteId || '');
    setTitulo(notice.titulo || '');
    setContenido(notice.contenido || '');
    setPrioridad(notice.prioridad || 'Normal');

    const rawDest = notice.destinatarios || '';
    const manualCandidates = [
      'Padres de Familia y Estudiantes',
      'Padres de Familia',
      'Estudiantes',
      'Coordinación Académica',
      'Psicología y Orientación',
      'Docentes',
      'Toda la Comunidad',
    ];
    const matchedManual = manualCandidates.find((cand) => rawDest.startsWith(cand));
    setDestinatariosManual(
      matchedManual || (isTeacher ? 'Padres de Familia y Estudiantes' : 'Toda la Comunidad')
    );

    setCopiaCoordinadoresIds(
      Array.isArray(notice.copiaCoordinadoresIds) ? notice.copiaCoordinadoresIds : []
    );
    setCopiaDocentesIds(
      Array.isArray(notice.copiaDocentesIds) ? notice.copiaDocentesIds : []
    );
    setIsAddOpen(true);
  };

  // Determinar si el usuario actual con permiso de creación puede editar un comunicado específico
  const canEditSpecificNotice = (n: Notice): boolean => {
    if (!canCreateNotice) return false;
    if (
      ['superusuario', 'administrador', 'control_escolar', 'directivo', 'coordinador', 'supervisor'].includes(
        currentUser?.rol || ''
      )
    ) {
      return true;
    }
    return isNoticeAuthoredByCurrentUser(n);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    // Resolver personas puestas en Copia (CC): Otros Coordinadores y Otros Docentes
    const ccCoordinators = collegeCoordinators.filter((c) =>
      copiaCoordinadoresIds.includes(c.id)
    );
    const ccTeachers = collegeTeachersList.filter((t) =>
      copiaDocentesIds.includes(t.id)
    );

    const enCopiaNombres = [
      ...ccCoordinators.map((c) => `Coord. ${c.nombre}`),
      ...ccTeachers.map((t) => `Prof. ${t.nombre}`),
    ];
    const enCopiaCorreos = [
      ...ccCoordinators.map((c) => c.correo).filter(Boolean),
      ...ccTeachers.map((t) => t.correo).filter(Boolean),
    ];
    const ccUserIds = [
      ...ccCoordinators.map((c) => c.id),
      ...ccTeachers.map((t) => t.id),
    ];

    const finalRoles = new Set<UserRole>(automaticRoutingSummary.targetRoles);
    if (ccCoordinators.length > 0) finalRoles.add('coordinador');
    if (ccTeachers.length > 0) finalRoles.add('docente');

    const allTargetEmails = Array.from(
      new Set([
        ...automaticRoutingSummary.recipientEmails,
        ...enCopiaCorreos,
        `comunicados@${effectiveCollege.id}.edu.mx`,
      ])
    );

    const allTargetUserIds = Array.from(
      new Set([
        ...automaticRoutingSummary.recipientUserIds,
        ...ccUserIds,
        ...(selectedStudentObj ? [selectedStudentObj.id] : []),
      ])
    );

    const studentFullName = selectedStudentObj
      ? `${selectedStudentObj.nombre} ${selectedStudentObj.apellidos}`
      : undefined;

    if (editingNotice) {
      updateNotice(editingNotice.id, {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        tipoComunicado,
        nivelEscolar,
        gradoGrupo: resolvedGroupLabel || undefined,
        estudianteId: selectedStudentObj?.id,
        estudianteNombre: studentFullName,
        prioridad,
        destinatarios: automaticRoutingSummary.summaryLabel,
        destinatariosPrincipalesNombres: automaticRoutingSummary.recipientNames,
        destinatariosPrincipalesCorreos: automaticRoutingSummary.recipientEmails,
        copiaCoordinadoresIds:
          copiaCoordinadoresIds.length > 0 ? copiaCoordinadoresIds : undefined,
        copiaDocentesIds:
          copiaDocentesIds.length > 0 ? copiaDocentesIds : undefined,
        enCopiaNombres: enCopiaNombres.length > 0 ? enCopiaNombres : undefined,
        enCopiaCorreos: enCopiaCorreos.length > 0 ? enCopiaCorreos : undefined,
        usuariosInvolucradosIds:
          allTargetUserIds.length > 0 ? allTargetUserIds : undefined,
      });

      setSentBanner(
        `Se actualizó el comunicado "${titulo.trim()}" (${tipoComunicado}) dirigido a: ${automaticRoutingSummary.summaryLabel}${
          enCopiaNombres.length > 0 ? ` · CC: ${enCopiaNombres.join(', ')}` : ''
        }.`
      );
      setTimeout(() => setSentBanner(null), 6000);
      setEditingNotice(null);
      setIsAddOpen(false);
      return;
    }

    addNotice({
      colegioId: effectiveCollege.id,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipoComunicado,
      nivelEscolar,
      gradoGrupo: resolvedGroupLabel || undefined,
      estudianteId: selectedStudentObj?.id,
      estudianteNombre: studentFullName,
      prioridad,
      destinatarios: automaticRoutingSummary.summaryLabel,
      destinatariosPrincipalesNombres: automaticRoutingSummary.recipientNames,
      destinatariosPrincipalesCorreos: automaticRoutingSummary.recipientEmails,
      copiaCoordinadoresIds:
        copiaCoordinadoresIds.length > 0 ? copiaCoordinadoresIds : undefined,
      copiaDocentesIds:
        copiaDocentesIds.length > 0 ? copiaDocentesIds : undefined,
      enCopiaNombres: enCopiaNombres.length > 0 ? enCopiaNombres : undefined,
      enCopiaCorreos: enCopiaCorreos.length > 0 ? enCopiaCorreos : undefined,
      usuariosInvolucradosIds:
        allTargetUserIds.length > 0 ? allTargetUserIds : undefined,
      autorId: currentTeacherRecord?.id || currentUser?.id,
      autor:
        currentTeacherRecord?.nombre ||
        currentUser?.nombre ||
        effectiveCollege.director ||
        'Dirección General',
      autorRol: currentUser?.rol,
      fecha: new Date().toISOString().split('T')[0],
    });

    const emailCategory =
      tipoComunicado === 'Incidencia' || tipoComunicado === 'Canalización'
        ? 'incidencia'
        : 'comunicado';

    const richBodyLines = [
      `=== ${tipoComunicado.toUpperCase()} ESCOLAR (${nivelEscolar.toUpperCase()}) ===`,
      `• Emitido por: ${currentTeacherRecord?.nombre || currentUser?.nombre || 'Personal Escolar'}`,
      `• Nivel y Grupo(s): ${nivelEscolar}${resolvedGroupLabel ? ` · Grupo(s): ${resolvedGroupLabel}` : ''}`,
      ...(studentFullName ? [`• Alumno involucrado: ${studentFullName}`] : []),
      `• Destinatarios Principales: ${automaticRoutingSummary.summaryLabel}`,
      ...(enCopiaNombres.length > 0
        ? [`• En Copia (CC): ${enCopiaNombres.join(', ')}`]
        : []),
      '',
      contenido.trim(),
    ].join('\n');

    sendEmailNotification({
      colegioId: effectiveCollege.id,
      colegioNombre: effectiveCollege.nombre,
      destinatarios: allTargetEmails,
      rolesDestino: Array.from(finalRoles),
      usuariosDestino:
        allTargetUserIds.length > 0 ? allTargetUserIds : undefined,
      asunto: `[${tipoComunicado} · ${nivelEscolar}] ${titulo.trim()}`,
      cuerpo: richBodyLines,
      categoria: emailCategory,
      prioridad:
        prioridad === 'Urgente'
          ? 'urgente'
          : prioridad === 'Importante' ||
              tipoComunicado === 'Canalización' ||
              tipoComunicado === 'Incidencia'
            ? 'alta'
            : 'normal',
    });

    setSentBanner(
      `Se emitió "${titulo.trim()}" (${tipoComunicado}) dirigido a: ${automaticRoutingSummary.summaryLabel}${
        enCopiaNombres.length > 0 ? ` · CC: ${enCopiaNombres.join(', ')}` : ''
      }.`
    );
    setTimeout(() => setSentBanner(null), 6000);
    setIsAddOpen(false);
  };

  const getBadgeForType = (type?: NoticeCommunicationType) => {
    const found = COMMUNICATION_TYPES.find((t) => t.id === type);
    return (
      found?.badgeClass || 'bg-blue-100 text-blue-900 border-blue-300'
    );
  };

  const roleDisplayName: Record<string, string> = {
    administrador: 'Administración',
    directivo: 'Dirección General',
    coordinador: 'Coordinación Académica',
    psicologo: 'Psicología Escolar',
    prefecto: 'Prefectura',
    docente: 'Docente',
    superusuario: 'Dirección Institucional',
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
              Bandeja de Recepción y Emisión de Comunicados
            </span>
            {isTeacher && teacherOwnGroups.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25">
                Mis Grupos: {teacherOwnGroups.join(', ')}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Bell className="w-6 h-6" style={{ color: goldColor }} />
            Comunicados y Avisos
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {effectiveCollege.nombre} · Recibe avisos de Administración, Coordinación, Dirección y otros docentes, o emite avisos a tus grupos ({teacherOwnGroups.join(' y ') || 'Asignados'}), canalizaciones e incidencias
          </p>
        </div>

        {canCreateNotice && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Emitir Comunicado / Aviso</span>
          </button>
        )}
      </div>

      {sentBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sentBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSentBanner(null)}
            className="text-emerald-800 hover:underline text-[11px] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas de Bandeja (Todos / Recibidos de Admin, Coordinador, Directivo, etc. / Emitidos por mí) + Filtros por Tipo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMailboxTab('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mailboxTab === 'todos'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Todos ({allRelevantNotices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMailboxTab('recibidos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mailboxTab === 'recibidos'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>
                Recibidos de Admin / Coordinación / Dirección ({receivedNoticesCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMailboxTab('emitidos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mailboxTab === 'emitidos'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Emitidos por mí ({emittedNoticesCount})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">
            Filtrar por tipo:
          </span>
          <button
            type="button"
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'TODOS'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {COMMUNICATION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterType === t.id
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Comunicados Recibidos y Emitidos */}
      <div className="space-y-3">
        {collegeNotices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No hay comunicados registrados en esta bandeja con el filtro seleccionado.
          </div>
        ) : (
          collegeNotices.map((n) => {
            const commType = n.tipoComunicado || 'Aviso';
            const isMine = isNoticeAuthoredByCurrentUser(n);
            const myIds = [currentUser?.id, currentTeacherRecord?.id].filter(
              Boolean
            ) as string[];
            const isCopiedToMe =
              n.copiaDocentesIds?.some((id) => myIds.includes(id)) ||
              n.copiaCoordinadoresIds?.some((id) => myIds.includes(id));

            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3 ${
                  isMine ? 'border-emerald-200' : 'border-indigo-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isMine
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      }`}
                    >
                      {isMine ? (
                        <>
                          <SendHorizontal className="w-3 h-3" />
                          <span>Emitido por mí</span>
                        </>
                      ) : (
                        <>
                          <Inbox className="w-3 h-3" />
                          <span>
                            Recibido de {n.autor}
                            {n.autorRol
                              ? ` (${roleDisplayName[n.autorRol] || n.autorRol})`
                              : ''}
                          </span>
                        </>
                      )}
                    </span>

                    {isCopiedToMe && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Recibido en Copia (CC)
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getBadgeForType(
                        commType
                      )}`}
                    >
                      {commType}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        n.prioridad === 'Urgente'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : n.prioridad === 'Importante'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      Prioridad: {n.prioridad}
                    </span>

                    {n.nivelEscolar && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
                        Nivel: {n.nivelEscolar}
                        {n.gradoGrupo ? ` · Grupo(s): ${n.gradoGrupo}` : ''}
                      </span>
                    )}

                    {n.estudianteNombre && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Alumno: {n.estudianteNombre}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditSpecificNotice(n) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(n)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                        title="Editar comunicado"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}
                    <span className="text-xs text-slate-400 font-mono">{n.fecha}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{n.titulo}</h3>

                <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  {n.contenido}
                </p>

                {/* Acción para Canalización -> Abrir Expediente de Psicología */}
                {(n.tipoComunicado === 'Canalización' || commType === 'Canalización') && (
                  <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-purple-950 block">
                          Reporte de Canalización Psicopedagógica
                        </span>
                        <span className="text-[11px] text-purple-800">
                          {n.estudianteNombre
                            ? `Alumno canalizado: ${n.estudianteNombre} (${n.gradoGrupo || n.nivelEscolar || 'General'})`
                            : 'Canalización individual para intervención de Psicología y Orientación.'}
                        </span>
                      </div>
                    </div>

                    {currentUser?.rol === 'psicologo' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCanalizacionForExpediente(n);
                          if (onNavigateTab) {
                            onNavigateTab('expedientes');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Abrir Expediente de Psicología</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="space-y-1">
                    <div>
                      <strong className="text-slate-800">Destinatario(s):</strong>{' '}
                      <span className="font-semibold text-indigo-900">{n.destinatarios}</span>
                    </div>
                    {n.enCopiaNombres && n.enCopiaNombres.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <strong className="text-slate-700">En Copia (CC):</strong>
                        {n.enCopiaNombres.map((ccName, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200"
                          >
                            {ccName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 shrink-0">
                    Emitido por: <strong className="text-slate-800">{n.autor}</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Emitir Comunicado con Tipo, Destinatario Automático por Nivel y Copia (CC) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div
              className="px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  {editingNotice
                    ? 'Edición de Comunicado · Comunicados y Avisos'
                    : 'Emisión Oficial · Comunicados y Avisos'}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-white mt-0.5">
                  {editingNotice
                    ? `Editar ${tipoComunicado}: ${editingNotice.titulo}`
                    : 'Emitir Comunicado, Canalización, Incidencia o Aviso'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingNotice(null);
                  setIsAddOpen(false);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs md:text-sm bg-slate-50/60"
            >
              {/* 1. Selección del Tipo de Comunicado */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-900 block text-xs">
                  1. Tipo de Comunicado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMMUNICATION_TYPES.map((t) => {
                    const active = tipoComunicado === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipoComunicado(t.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          active
                            ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm'
                            : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs">{t.id}</span>
                          {active && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explicación de a quién le llega según el tipo */}
                <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-2">
                  {tipoComunicado === 'Canalización' ? (
                    <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  ) : tipoComunicado === 'Incidencia' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      Ruta automática para "{tipoComunicado}":
                    </span>
                    <span className="text-[11px] text-slate-700">
                      {
                        COMMUNICATION_TYPES.find((c) => c.id === tipoComunicado)
                          ?.descripcionRuta
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Nivel Escolar, Grado y Grupo (Mis Grupos para enviar a ambos a la vez) y Destinatarios */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-900 block text-xs">
                  2. Nivel Escolar, Grado y Grupo y Destinatarios Asignados
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Nivel Escolar *
                    </label>
                    <select
                      value={nivelEscolar}
                      onChange={(e) => {
                        setNivelEscolar(e.target.value as AcademicLevel);
                        setEstudianteId('');
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-xs"
                    >
                      {allowedLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Grado y Grupo
                    </label>
                    <select
                      value={gradoGrupo}
                      onChange={(e) => {
                        setGradoGrupo(e.target.value);
                        setEstudianteId('');
                      }}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      {isTeacher ? (
                        <>
                          <option value="MIS_GRUPOS">
                            Ambos grupos / Mis grupos ({teacherOwnGroups.join(' y ') || 'Asignados'})
                          </option>
                          {teacherOwnGroups.map((grp) => (
                            <option key={grp} value={grp}>
                              Solo grupo {grp}
                            </option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="">Todos los grupos de {nivelEscolar}</option>
                          {availableGroupsForLevel.map((grp) => (
                            <option key={grp} value={grp}>
                              Grupo {grp}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Prioridad
                    </label>
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Importante">Importante</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Selección de Alumno cuando es Canalización, Incidencia, Reporte al Tutor o Citatorio */}
                {(tipoComunicado === 'Canalización' ||
                  tipoComunicado === 'Incidencia' ||
                  tipoComunicado === 'Reporte al Tutor' ||
                  tipoComunicado === 'Citatorio') && (
                  <div>
                    <label className="font-semibold block mb-1 text-xs text-slate-800">
                      Alumno involucrado (Opcional · solo alumnos de{' '}
                      {resolvedGroupLabel || nivelEscolar}):
                    </label>
                    <select
                      value={estudianteId}
                      onChange={(e) => setEstudianteId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                    >
                      <option value="">
                        -- Seleccionar alumno ({resolvedGroupLabel || nivelEscolar}) --
                      </option>
                      {availableStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.nombre} {st.apellidos} ({st.grado} {st.grupo}) · Tutor:{' '}
                          {st.tutorNombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Si es Aviso, Notificación o Circular General, permitir elegir destinatarios */}
                {(tipoComunicado === 'Aviso' ||
                  tipoComunicado === 'Notificación' ||
                  tipoComunicado === 'Circular General') && (
                  <div>
                    <label className="font-semibold block mb-1 text-xs">
                      Dirigido principalmente a:
                    </label>
                    <select
                      value={destinatariosManual}
                      onChange={(e) => setDestinatariosManual(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      {isTeacher ? (
                        <>
                          <option value="Padres de Familia y Estudiantes">
                            Tutores y Alumnos de mis grupos ({resolvedGroupLabel})
                          </option>
                          <option value="Padres de Familia">
                            Tutores / Padres de Familia ({resolvedGroupLabel})
                          </option>
                          <option value="Estudiantes">
                            Alumnos ({resolvedGroupLabel})
                          </option>
                          <option value="Coordinación Académica">
                            Coordinación Académica ({nivelEscolar})
                          </option>
                          <option value="Psicología y Orientación">
                            Psicología y Orientación ({nivelEscolar})
                          </option>
                        </>
                      ) : (
                        <>
                          <option value="Toda la Comunidad">Toda la Comunidad</option>
                          <option value="Padres de Familia">
                            Tutores / Padres de Familia
                          </option>
                          <option value="Docentes">Docentes</option>
                          <option value="Estudiantes">Alumnos</option>
                          <option value="Coordinación Académica">
                            Coordinación Académica
                          </option>
                          <option value="Psicología y Orientación">
                            Psicología y Orientación
                          </option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Resumen en vivo de a quiénes les llegará automáticamente */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Destinatarios automáticos según el tipo "{tipoComunicado}":</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {automaticRoutingSummary.recipientNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 font-bold text-[11px]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Poner en Copia (CC) a otros Coordinadores o a otros Docentes */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>
                      3. Poner en Copia (CC) a otros Coordinadores o a otros Docentes (Opcional)
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Selecciona a qué otros coordinadores o docentes deseas enviarles copia de este comunicado en su módulo de Comunicados y Avisos y en su campanita.
                  </p>
                </div>

                {/* Lista de Coordinadores para poner en copia */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Coordinadores en Copia (CC):
                  </span>
                  {collegeCoordinators.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic block">
                      No hay otros coordinadores registrados en el plantel.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {collegeCoordinators.map((coord) => {
                        const isSelected = copiaCoordinadoresIds.includes(coord.id);
                        const coordLevels =
                          coord.nivelesAsignados && coord.nivelesAsignados.length > 0
                            ? coord.nivelesAsignados.join(', ')
                            : coord.nivelAsignado || 'General';
                        return (
                          <button
                            key={coord.id}
                            type="button"
                            onClick={() => toggleCcCoordinator(coord.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>
                              Coord. {coord.nombre} ({coordLevels})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Lista de Docentes para poner en copia */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Docentes en Copia (CC):
                  </span>
                  {collegeTeachersList.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic block">
                      No hay otros docentes registrados en el plantel.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                      {collegeTeachersList.map((tch) => {
                        const isSelected = copiaDocentesIds.includes(tch.id);
                        return (
                          <button
                            key={tch.id}
                            type="button"
                            onClick={() => toggleCcTeacher(tch.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>
                              Prof. {tch.nombre}
                              {tch.nivel ? ` (${tch.nivel})` : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Asunto y Mensaje */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Asunto / Título del {tipoComunicado} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Ej. ${tipoComunicado}: Seguimiento académico y conductual`}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-xs">
                    Descripción / Contenido del {tipoComunicado} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe detalladamente la situación, acuerdos o motivo del comunicado..."
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotice(null);
                    setIsAddOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-3.5 h-3.5" style={{ color: goldColor }} />
                  <span>
                    {editingNotice ? `Guardar Cambios en ${tipoComunicado}` : `Emitir ${tipoComunicado}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
