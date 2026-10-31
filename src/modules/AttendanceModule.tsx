import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  Building2,
  BookOpen,
  Calendar,
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  Lock,
  VideoOff,
  ExternalLink,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Student, AttendanceRecord, UserRole, AcademicLevel } from '../types';
import {
  CameraDevice,
  requestCameraStream,
  getAvailableCameraDevices,
  attachStreamToVideo,
  createVirtualCameraStream,
} from '../utils/cameraUtils';
import { SafeImage } from '../components/SafeImage';

interface AttendanceModuleProps {
  initialMode?: 'clase' | 'general';
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = () => {
  const {
    activeCollege,
    students,
    teachers,
    subjects,
    currentUser,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    sendEmailNotification,
    getGroupsForCollegeLevel,
  } = useApp();

  // Role permissions
  const userRole = currentUser.rol as UserRole;
  const isTeacher = userRole === 'docente';
  const isCoordinator = userRole === 'coordinador';
  const isGeneralAdminRole = !isTeacher && !isCoordinator;
  const canStartTotem = ['superusuario', 'administrador', 'control_escolar', 'directivo', 'coordinador', 'prefecto'].includes(userRole);
  const canConfigureTolerance = ['superusuario', 'administrador', 'control_escolar', 'directivo', 'coordinador', 'supervisor', 'prefecto'].includes(userRole);

  // College teachers list
  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege?.id);

  // Active teacher selected for attendance (auto-linked if logged in as docente)
  const defaultTeacher = useMemo(() => {
    if (isTeacher) {
      const expectedTchId = currentUser.id.replace(/^usr-/, '');
      const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
      const usrName = (currentUser.nombre || '').trim().toLowerCase();
      const usrEmail = (currentUser.correo || '').trim().toLowerCase();

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

      return collegeTeachers[0];
    }
    return collegeTeachers[0];
  }, [isTeacher, currentUser, collegeTeachers]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacher?.id || 'todos');
  const [filterByAssignedTeacherOnly, setFilterByAssignedTeacherOnly] = useState<boolean>(false);

  // Group and Class selections ("todos" for Administrador, Coordinador, Directivo, Supervisor, Prefecto, etc.)
  const [selectedGrado, setSelectedGrado] = useState<string>(!isTeacher ? 'todos' : '3°');
  const [selectedGrupo, setSelectedGrupo] = useState<string>(!isTeacher ? 'todos' : 'A');
  const [selectedNivel, setSelectedNivel] = useState<string>('todos');
  const [selectedMateria, setSelectedMateria] = useState<string>('Matemáticas III');

  // Search input in students table
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Weekly Navigation
  // Helper to get Monday of the given date
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const todayDay = new Date().getDay();
    return todayDay >= 1 && todayDay <= 5 ? todayDay - 1 : 0; // 0 = Lunes, 4 = Viernes
  });

  // Helper to format a Date object as local YYYY-MM-DD
  const getLocalIsoDate = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Generate the 5 days of the current week (Lunes a Viernes)
  const todayIso = getLocalIsoDate(new Date());
  const currentMondayIso = getLocalIsoDate(getMonday(new Date()));

  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const nowIso = getLocalIsoDate(new Date());
    for (let i = 0; i < 5; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      const iso = getLocalIsoDate(d);
      days.push({
        index: i,
        name: dayNames[i],
        date: d,
        iso,
        label: `${dayNames[i]} ${d.getDate()}`,
        isToday: nowIso === iso,
        isFuture: iso > nowIso,
        isPast: iso < nowIso,
      });
    }
    return days;
  }, [currentWeekMonday]);

  const activeDateIso = weekDays[selectedDayIndex]?.iso || todayIso;

  // Tolerance Configuration (Configurable by Admin, Director, Coordinator, Supervisor, Prefecto)
  const [startTime, setStartTime] = useState<string>('08:00'); // Hora programada de clase/colegio (cuando es un solo nivel)
  const [levelStartTimes, setLevelStartTimes] = useState<
    Record<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria', string>
  >({
    Preescolar: '09:00',
    Primaria: '08:00',
    Secundaria: '07:00',
    Preparatoria: '07:00',
  });
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(10); // Minutos en los que es Presente [P] (ej. 0 a 10 min)
  const [faltaAfterMinutes, setFaltaAfterMinutes] = useState<number>(20); // Minutos después de los cuales se marca Falta [F] en automático (ej. > 20 min)
  const [isToleranceConfigOpen, setIsToleranceConfigOpen] = useState<boolean>(false);

  // Cargar y guardar configuración de tolerancia y horas de entrada por nivel para el colegio activo
  useEffect(() => {
    if (!activeCollege?.id) return;
    try {
      const raw = localStorage.getItem(`mycollege_attendance_tolerance_${activeCollege.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.startTime) setStartTime(parsed.startTime);
        if (parsed.levelStartTimes) {
          setLevelStartTimes((prev) => ({
            ...prev,
            ...parsed.levelStartTimes,
          }));
        }
        if (typeof parsed.toleranceMinutes === 'number') {
          setToleranceMinutes(parsed.toleranceMinutes);
        }
        if (typeof parsed.faltaAfterMinutes === 'number') {
          setFaltaAfterMinutes(parsed.faltaAfterMinutes);
        }
      } else {
        setStartTime('08:00');
        setLevelStartTimes({
          Preescolar: '09:00',
          Primaria: '08:00',
          Secundaria: '07:00',
          Preparatoria: '07:00',
        });
        setToleranceMinutes(10);
        setFaltaAfterMinutes(20);
      }
    } catch {
      // ignore storage errors
    }
  }, [activeCollege?.id]);

  const saveCollegeToleranceSettings = (next?: {
    startTime?: string;
    levelStartTimes?: Record<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria', string>;
    toleranceMinutes?: number;
    faltaAfterMinutes?: number;
  }) => {
    if (!activeCollege?.id) return;
    const payload = {
      startTime: next?.startTime ?? startTime,
      levelStartTimes: next?.levelStartTimes ?? levelStartTimes,
      toleranceMinutes: next?.toleranceMinutes ?? toleranceMinutes,
      faltaAfterMinutes: next?.faltaAfterMinutes ?? faltaAfterMinutes,
    };
    try {
      localStorage.setItem(
        `mycollege_attendance_tolerance_${activeCollege.id}`,
        JSON.stringify(payload)
      );
    } catch {
      // ignore storage errors
    }
  };
  const [statusFeedbackBanner, setStatusFeedbackBanner] = useState<string | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<{
    url: string;
    fileName: string;
    studentName: string;
    motivo: string;
    fecha: string;
  } | null>(null);

  // Totem (Kiosk) Fullscreen Mode for Admins/Directors/Coordinators/Prefects
  const [isTotemActive, setIsTotemActive] = useState<boolean>(false);

  // Scanner Panel & Camera
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [virtualStudentIndex, setVirtualStudentIndex] = useState<number>(0);
  const virtualControllerRef = useRef<{
    stream: MediaStream;
    updatePayload: (newPayload: string, name?: string, mat?: string) => Promise<void>;
    stop: () => void;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermissionErrorType, setCameraPermissionErrorType] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  // Real-time student row highlighting when scanned
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Last scan feedback result
  interface ScanResult {
    student: Student;
    status: 'presente' | 'retardo' | 'falta' | 'advertencia';
    message: string;
    hora: string;
    tipo: 'clase' | 'general';
    timestamp: number;
  }
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const secondaryColor = activeCollege.colores.secundario || '#C59B27';
  const goldColor = secondaryColor;

  // College data filtered (exclude students in estatus 'baja' from bitácoras / asistencia)
  const collegeStudents = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);

  // Niveles del colegio
  const getAllowedLevelsForCollege = (
    collegeNivel?: string
  ): ('Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria')[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };
  const allowedCollegeLevels = getAllowedLevelsForCollege(activeCollege.nivel);
  const isMultiLevelCollege = allowedCollegeLevels.length > 1;

  // Obtener la hora de entrada programada según el nivel educativo al que pertenece el alumno
  const getEffectiveStartTimeForLevel = (
    nivel?: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'
  ): string => {
    if (isMultiLevelCollege) {
      const targetLvl =
        nivel ||
        (selectedNivel !== 'todos'
          ? (selectedNivel as 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria')
          : allowedCollegeLevels[0] || 'Primaria');
      return levelStartTimes[targetLvl] || startTime;
    }
    const singleLvl = allowedCollegeLevels[0];
    if (singleLvl && levelStartTimes[singleLvl]) {
      return startTime;
    }
    return startTime;
  };

  // Determinar los niveles asignados al Coordinador (soporta un solo nivel o multinivel)
  const coordinatorAssignedLevels = useMemo((): AcademicLevel[] => {
    if (!isCoordinator) return [];
    if (currentUser.nivelesAsignados && currentUser.nivelesAsignados.length > 0) {
      return currentUser.nivelesAsignados;
    }
    if (currentUser.nivelAsignado) return [currentUser.nivelAsignado];
    const cargoLower = (currentUser.cargo || '').toLowerCase();
    const detected: AcademicLevel[] = [];
    if (cargoLower.includes('preescolar')) detected.push('Preescolar');
    if (cargoLower.includes('primaria')) detected.push('Primaria');
    if (cargoLower.includes('secundaria')) detected.push('Secundaria');
    if (cargoLower.includes('preparatoria') || cargoLower.includes('bachillerato'))
      detected.push('Preparatoria');
    if (cargoLower.includes('universidad')) detected.push('Universidad');
    if (detected.length > 0) return detected;
    return [allowedCollegeLevels[0] || 'Primaria'];
  }, [
    isCoordinator,
    currentUser.nivelesAsignados,
    currentUser.nivelAsignado,
    currentUser.cargo,
    allowedCollegeLevels,
  ]);

  const coordinatorAssignedLevel = coordinatorAssignedLevels[0] || null;
  const coordinatorSpecificGroups = useMemo(() => {
    if (!isCoordinator || !currentUser.gruposAsignados) return [];
    return currentUser.gruposAsignados.map((g) =>
      g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
    );
  }, [isCoordinator, currentUser.gruposAsignados]);

  // Determinar el nivel de un alumno
  const getStudentEffectiveLevel = (
    st: Student
  ): 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' => {
    if (st.nivel) return st.nivel;
    if (allowedCollegeLevels.length === 1) return allowedCollegeLevels[0];
    if (st.grado === '4°' || st.grado === '5°' || st.grado === '6°') return 'Primaria';
    return allowedCollegeLevels[0] || 'Primaria';
  };

  // Todos los grupos dados de alta exclusivamente en el módulo Materias y Grupos para este colegio
  const allCollegeRegisteredGroups = useMemo(() => {
    const result: Array<{
      nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria';
      grado: string;
      grupo: string;
      label: string; // e.g. "6° A"
      fullLabel: string; // e.g. "Primaria 6° A"
    }> = [];
    const seen = new Set<string>();

    allowedCollegeLevels.forEach((lvl) => {
      const labels = getGroupsForCollegeLevel(activeCollege.id, lvl);
      labels.forEach((raw) => {
        const norm = raw.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        const parts = norm.split(' ');
        if (parts.length >= 2) {
          const grado = parts[0].trim();
          const grupo = parts.slice(1).join(' ').trim().toUpperCase();
          const key = `${lvl}|${grado}|${grupo}`;
          if (!seen.has(key)) {
            seen.add(key, );
            result.push({
              nivel: lvl,
              grado,
              grupo,
              label: `${grado} ${grupo}`,
              fullLabel: `${lvl} ${grado} ${grupo}`,
            });
          }
        }
      });
    });

    // Incluir también cualquier combinación (nivel, grado, grupo) que exista en el padrón de alumnos del colegio
    collegeStudents.forEach((st) => {
      const lvl = getStudentEffectiveLevel(st);
      const grado = (st.grado || '').trim();
      const grupo = (st.grupo || '').replace(/["']/g, '').trim().toUpperCase();
      if (grado && grupo) {
        const key = `${lvl}|${grado}|${grupo}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            nivel: lvl,
            grado,
            grupo,
            label: `${grado} ${grupo}`,
            fullLabel: `${lvl} ${grado} ${grupo}`,
          });
        }
      }
    });

    return result;
  }, [activeCollege.id, allowedCollegeLevels, getGroupsForCollegeLevel, collegeStudents]);

  // Niveles disponibles en el selector según el rol
  const registeredLevelsInCollege = useMemo(() => {
    if (isTeacher && defaultTeacher?.nivel) {
      return [defaultTeacher.nivel as 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'];
    }
    const levelsSet = new Set<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'>(
      allowedCollegeLevels
    );
    collegeStudents.forEach((st) => {
      levelsSet.add(getStudentEffectiveLevel(st));
    });
    return Array.from(levelsSet);
  }, [
    allowedCollegeLevels,
    isTeacher,
    defaultTeacher?.nivel,
    collegeStudents,
  ]);

  const activeTeacherObj = collegeTeachers.find((t) => t.id === selectedTeacherId) || defaultTeacher;

  // Grupos permitidos según el rol del usuario:
  // - Docente: SOLO los grupos que tiene asignados
  // - Administrador, Coordinador, Directivo, Supervisor, Prefecto, Control Escolar, etc.: TODOS los grupos y grados del colegio
  const allowedGroupsForCurrentUser = useMemo(() => {
    if (isTeacher && defaultTeacher) {
      const tchLevel = (
        defaultTeacher.nivel ||
        allowedCollegeLevels[0] ||
        'Primaria'
      ) as 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria';

      const rawAssigned = new Set<string>();
      (defaultTeacher.grupos || []).forEach((g) => {
        const clean = g.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        if (clean) rawAssigned.add(clean);
      });
      if (defaultTeacher.esTutorPrincipal && defaultTeacher.grupoTutorado) {
        const cleanT = defaultTeacher.grupoTutorado
          .replace(/["']/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanT) rawAssigned.add(cleanT);
      }

      const parsedTeacherGroups: Array<{
        nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria';
        grado: string;
        grupo: string;
        label: string;
        fullLabel: string;
      }> = [];

      rawAssigned.forEach((entry) => {
        // Entry puede ser "6° A" o "Primaria 6° A"
        const parts = entry.split(' ');
        let entryLevel = tchLevel;
        let gradoPart = parts[0];
        let grupoPart = parts.slice(1).join(' ').toUpperCase();

        if (
          ['preescolar', 'primaria', 'secundaria', 'preparatoria'].includes(
            parts[0].toLowerCase()
          ) &&
          parts.length >= 3
        ) {
          const matchedLvl = allowedCollegeLevels.find(
            (l) => l.toLowerCase() === parts[0].toLowerCase()
          );
          if (matchedLvl) entryLevel = matchedLvl;
          gradoPart = parts[1];
          grupoPart = parts.slice(2).join(' ').toUpperCase();
        }

        if (gradoPart && grupoPart) {
          if (
            !parsedTeacherGroups.some(
              (item) =>
                item.nivel === entryLevel &&
                item.grado === gradoPart &&
                item.grupo === grupoPart
            )
          ) {
            parsedTeacherGroups.push({
              nivel: entryLevel,
              grado: gradoPart,
              grupo: grupoPart,
              label: `${gradoPart} ${grupoPart}`,
              fullLabel: `${entryLevel} ${gradoPart} ${grupoPart}`,
            });
          }
        }
      });

      if (parsedTeacherGroups.length > 0) {
        return parsedTeacherGroups;
      }
      return allCollegeRegisteredGroups.filter((g) => g.nivel === tchLevel);
    }

    // Para Administrador, Coordinador, Directivo, Supervisor, Prefecto, Control Escolar, etc.: todos los grupos y grados del colegio
    return allCollegeRegisteredGroups;
  }, [
    isTeacher,
    defaultTeacher,
    allCollegeRegisteredGroups,
    allowedCollegeLevels,
  ]);

  // Sincronizar selección inicial cuando cambia el usuario o colegio
  useEffect(() => {
    if (isTeacher) {
      if (allowedGroupsForCurrentUser.length > 0) {
        const currentExists = allowedGroupsForCurrentUser.some(
          (g) => g.grado === selectedGrado && g.grupo === selectedGrupo
        );
        if (!currentExists) {
          setSelectedNivel(allowedGroupsForCurrentUser[0].nivel);
          setSelectedGrado(allowedGroupsForCurrentUser[0].grado);
          setSelectedGrupo(allowedGroupsForCurrentUser[0].grupo);
        }
      }
    } else {
      setSelectedNivel('todos');
      setSelectedGrado('todos');
      setSelectedGrupo('todos');
    }
  }, [
    currentUser.id,
    activeCollege.id,
    isTeacher,
    allowedGroupsForCurrentUser.length,
  ]);

  const availableGrados = useMemo(() => {
    const set = new Set<string>();
    allowedGroupsForCurrentUser.forEach((g) => {
      if (selectedNivel === 'todos' || g.nivel === selectedNivel) {
        set.add(g.grado);
      }
    });
    if (!isTeacher) {
      collegeStudents.forEach((st) => {
        const stLevel = getStudentEffectiveLevel(st);
        if ((selectedNivel === 'todos' || stLevel === selectedNivel) && st.grado) {
          set.add(st.grado.trim());
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [allowedGroupsForCurrentUser, selectedNivel, isTeacher, collegeStudents]);

  const availableGrupos = useMemo(() => {
    const set = new Set<string>();
    allowedGroupsForCurrentUser.forEach((g) => {
      if (selectedNivel !== 'todos' && g.nivel !== selectedNivel) return;
      if (selectedGrado !== 'todos' && g.grado !== selectedGrado) return;
      set.add(g.grupo);
    });
    if (!isTeacher) {
      collegeStudents.forEach((st) => {
        const stLevel = getStudentEffectiveLevel(st);
        const stGrupo = (st.grupo || '').replace(/["']/g, '').trim().toUpperCase();
        if (selectedNivel !== 'todos' && stLevel !== selectedNivel) return;
        if (selectedGrado !== 'todos' && st.grado !== selectedGrado) return;
        if (stGrupo) set.add(stGrupo);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [allowedGroupsForCurrentUser, selectedNivel, selectedGrado, isTeacher, collegeStudents]);

  // Helper to resolve ALL assigned teachers for a student (all teachers assigned to the same group & level can take attendance)
  const getStudentAssignedTeachers = (st: Student) => {
    const cleanLevel = (st.nivel || '').trim().toLowerCase();
    const cleanGradeGroup = `${st.grado} ${st.grupo}`
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const cleanFullGroup = `${st.nivel || ''} ${st.grado} ${st.grupo}`
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const byGroup = collegeTeachers.filter((t) => {
      const tchLevel = (t.nivel || '').trim().toLowerCase();
      if (tchLevel && cleanLevel && tchLevel !== cleanLevel) return false;
      const inGroups = (t.grupos || []).some((g) => {
        const norm = g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        return norm === cleanFullGroup || norm === cleanGradeGroup;
      });
      const isTutor =
        Boolean(t.esTutorPrincipal) &&
        (t.grupoTutorado || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
          cleanGradeGroup;
      return inGroups || isTutor;
    });

    const list = [...byGroup];
    if (st.docenteId && !list.some((t) => t.id === st.docenteId)) {
      const found = collegeTeachers.find((t) => t.id === st.docenteId);
      if (found) list.push(found);
    }
    if (
      st.docenteNombre &&
      !list.some((t) => t.nombre.toLowerCase() === st.docenteNombre?.toLowerCase())
    ) {
      const found = collegeTeachers.find(
        (t) => t.nombre.toLowerCase() === st.docenteNombre?.toLowerCase()
      );
      if (found) list.push(found);
    }
    return list;
  };

  // Helper to resolve primary assigned teacher for a student from Control Escolar
  const getStudentAssignedTeacher = (st: Student) => {
    const all = getStudentAssignedTeachers(st);
    return all[0] || collegeTeachers[0];
  };

  // Alumnos filtrados según el rol y los selectores de Nivel, Grado y Grupo
  const currentClassStudents = collegeStudents.filter((s) => {
    const stLevel = getStudentEffectiveLevel(s);
    const stGrupo = (s.grupo || '').replace(/["']/g, '').trim().toUpperCase();

    // 1. Para el rol Docente: validar que el alumno pertenezca a uno de sus grupos asignados
    if (isTeacher) {
      const isInRegisteredGroups = allowedGroupsForCurrentUser.some(
        (g) => g.nivel === stLevel && g.grado === s.grado && g.grupo === stGrupo
      );
      if (!isInRegisteredGroups) return false;
    }

    // 2. Filtrar por Nivel, Grado y Grupo seleccionados
    if (selectedNivel !== 'todos' && stLevel !== selectedNivel) return false;
    if (selectedGrado !== 'todos' && s.grado !== selectedGrado) return false;
    if (selectedGrupo !== 'todos' && stGrupo !== selectedGrupo.toUpperCase()) return false;

    return true;
  });

  // Filtered by search
  const displayedStudents = currentClassStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.nombre.toLowerCase().includes(q) ||
      s.apellidos.toLowerCase().includes(q) ||
      s.matricula.toLowerCase().includes(q)
    );
  });

  // Paginación para evitar carga pesada (10, 30 o 50 alumnos por lista)
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNivel, selectedGrado, selectedGrupo, studentSearch, itemsPerPage, activeCollege.id]);

  const totalPages = Math.max(1, Math.ceil(displayedStudents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedStudents = displayedStudents.slice(startIndex, startIndex + itemsPerPage);

  // Sound generator
  const playBeep = (type: 'success' | 'retardo' | 'error') => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'retardo') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(750, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context restricted
    }
  };

  // Determinar automáticamente el estatus ('presente' [P], 'retardo' [R] o 'falta' [F]):
  // - Si es una fecha pasada (< todayIso) -> siempre 'falta' [F]
  // - Si es la fecha del día actual -> según la hora actual y la hora de entrada del nivel al que pertenece el alumno (P, R o F)
  const calculateAttendanceStatus = (
    targetDateIso?: string,
    studentLevel?: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'
  ): 'presente' | 'retardo' | 'falta' => {
    const checkIso = targetDateIso || activeDateIso;
    const currentTodayIso = getLocalIsoDate(new Date());
    if (checkIso < currentTodayIso) {
      return 'falta';
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const effectiveStart = getEffectiveStartTimeForLevel(studentLevel);
    const [startH, startM] = effectiveStart.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const diff = currentTotalMinutes - startTotalMinutes;
    if (diff > faltaAfterMinutes) {
      return 'falta';
    }
    if (diff > toleranceMinutes) {
      return 'retardo';
    }
    return 'presente';
  };

  // Verifica si el usuario actual es el Coordinador asignado al nivel/grupo del alumno
  const isCoordinatorAssignedToStudentGroup = (st: Student): boolean => {
    if (!isCoordinator) return false;
    const stLevel = getStudentEffectiveLevel(st);
    const stGrupo = (st.grupo || '').replace(/["']/g, '').trim().toUpperCase();
    if (
      coordinatorAssignedLevels.length > 0 &&
      !coordinatorAssignedLevels.includes(stLevel)
    ) {
      return false;
    }
    if (coordinatorSpecificGroups.length > 0) {
      const fullKey = `${stLevel} ${st.grado} ${stGrupo}`.toLowerCase();
      return coordinatorSpecificGroups.includes(fullKey);
    }
    return allowedGroupsForCurrentUser.some(
      (g) => g.nivel === stLevel && g.grado === st.grado && g.grupo === stGrupo
    );
  };

  // Process a QR code payload (URL, JSON, or plain matricula/CURP) generated in Control de Alumnos
  const handleProcessScan = (rawCode: string, mode: 'clase' | 'general' = 'clase') => {
    if (scanCooldown) return;

    let targetStudent: Student | undefined;
    const trimmed = rawCode.trim();

    // 1. Check if rawCode is a URL or query string from Student QR (e.g. https://dashboard.mycollege.com.mx/asistencia?alumno=CCM-2026-081&sid=std-1...)
    if (trimmed.includes('alumno=') || trimmed.includes('sid=') || trimmed.includes('curp=') || trimmed.startsWith('http')) {
      try {
        const queryPart = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
        const params = new URLSearchParams(queryPart);
        const sidParam = params.get('sid');
        const alumnoParam = params.get('alumno') || params.get('matricula');
        const curpParam = params.get('curp');

        if (sidParam) {
          targetStudent = collegeStudents.find((s) => s.id.toLowerCase() === sidParam.toLowerCase());
        }
        if (!targetStudent && alumnoParam) {
          targetStudent = collegeStudents.find(
            (s) => s.matricula.toLowerCase() === alumnoParam.toLowerCase()
          );
        }
        if (!targetStudent && curpParam) {
          targetStudent = collegeStudents.find(
            (s) => s.curp.toLowerCase() === curpParam.toLowerCase()
          );
        }
      } catch {
        // Fallback to next parser
      }
    }

    // 2. Check if raw data is JSON payload or plain matricula/student ID
    if (!targetStudent) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.sid) {
          targetStudent = collegeStudents.find((s) => s.id === parsed.sid);
        } else if (parsed.mat || parsed.matricula) {
          const m = parsed.mat || parsed.matricula;
          targetStudent = collegeStudents.find((s) => s.matricula === m);
        }
      } catch {
        const clean = trimmed.toLowerCase();
        targetStudent = collegeStudents.find(
          (s) =>
            s.matricula.toLowerCase() === clean ||
            s.id.toLowerCase() === clean ||
            s.curp.toLowerCase() === clean
        );
      }
    }

    if (!targetStudent) {
      playBeep('error');
      setLastScan({
        student: {
          id: 'unknown',
          colegioId: activeCollege.id,
          matricula: rawCode,
          curp: '',
          nombre: 'Credencial No Registrada',
          apellidos: '',
          grado: '?',
          grupo: '?',
          tutorNombre: '',
          tutorTelefono: '',
          tutorCorreo: '',
          promedio: 0,
          estatus: 'activo',
          foto: '',
          fechaNacimiento: '',
        },
        status: 'advertencia',
        message: 'Código QR no reconocido en el padrón de Control Escolar',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: mode,
        timestamp: Date.now(),
      });
      triggerCooldown();
      return;
    }

    const now = new Date();
    const currentTodayIso = getLocalIsoDate(now);
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeDateIso > currentTodayIso) {
      playBeep('error');
      showTempBanner(
        `🚫 No se puede tomar asistencia de una fecha futura (${activeDateIso}). Solo puedes tomar asistencia del día actual (${currentTodayIso}).`
      );
      setLastScan({
        student: targetStudent,
        status: 'advertencia',
        message: `🚫 Fecha futura (${activeDateIso}): Solo se permite tomar asistencia del día actual.`,
        hora: timeFormatted,
        tipo: mode,
        timestamp: Date.now(),
      });
      triggerCooldown();
      return;
    }

    const scannedStudentLevel = getStudentEffectiveLevel(targetStudent);
    const scannedStudentStartTime = getEffectiveStartTimeForLevel(scannedStudentLevel);
    const computedStatus = calculateAttendanceStatus(activeDateIso, scannedStudentLevel);
    const studentAssignedTeachers = getStudentAssignedTeachers(targetStudent);
    const studentAssignedTeacher = studentAssignedTeachers[0];
    const effectiveTeacherName =
      activeTeacherObj?.nombre ||
      studentAssignedTeacher?.nombre ||
      targetStudent.docenteNombre ||
      currentUser.nombre;

    // Mode A: Docente Asignado en el Aula / Pase de Lista
    if (mode === 'clase') {
      const targetLvl = getStudentEffectiveLevel(targetStudent);
      const targetGrp = (targetStudent.grupo || '').replace(/["']/g, '').trim().toUpperCase();
      const isAllowedForUser =
        !isTeacher && !isCoordinator
          ? true
          : allowedGroupsForCurrentUser.some(
              (g) =>
                g.nivel === targetLvl &&
                g.grado === targetStudent!.grado &&
                g.grupo === targetGrp
            );

      const belongsToClass =
        (selectedGrado === 'todos' || targetStudent.grado === selectedGrado) &&
        (selectedGrupo === 'todos' || targetGrp === selectedGrupo.toUpperCase());

      if (!belongsToClass && isAllowedForUser) {
        // Auto-sync the grade & group selector to the scanned student's group so the user can scan any of their assigned students seamlessly
        setSelectedNivel(targetLvl);
        setSelectedGrado(targetStudent.grado);
        setSelectedGrupo(targetStudent.grupo);
      } else if (!isAllowedForUser) {
        playBeep('error');
        setLastScan({
          student: targetStudent,
          status: 'advertencia',
          message: `⚠️ Alumno de ${targetStudent.grado} "${targetStudent.grupo}" asignado a ${
            targetStudent.docenteNombre || studentAssignedTeacher?.nombre || 'otro docente'
          }. No corresponde a tus grupos asignados.`,
          hora: timeFormatted,
          tipo: 'clase',
          timestamp: Date.now(),
        });
        triggerCooldown();
        return;
      }

      // Check if already registered today in this subject
      const existing = attendanceRecords.find(
        (a) =>
          a.colegioId === activeCollege.id &&
          a.estudianteId === targetStudent!.id &&
          a.fecha === activeDateIso &&
          a.tipo === 'clase' &&
          a.materiaNombre === selectedMateria
      );

      if (existing) {
        playBeep('retardo');
        setLastScan({
          student: targetStudent,
          status: existing.estado === 'retardo' ? 'retardo' : 'presente',
          message: `ℹ️ Asistencia ya registrada con ${effectiveTeacherName} como [${existing.estado.toUpperCase()}]`,
          hora: existing.hora || timeFormatted,
          tipo: 'clase',
          timestamp: Date.now(),
        });
        highlightAndScrollStudent(targetStudent.id);
        triggerCooldown();
        return;
      }

      // Add to attendance database linked to the assigned teacher
      addAttendanceRecord({
        colegioId: activeCollege.id,
        estudianteId: targetStudent.id,
        estudianteNombre: `${targetStudent.nombre} ${targetStudent.apellidos}`,
        matricula: targetStudent.matricula,
        grado: targetStudent.grado,
        grupo: targetStudent.grupo,
        foto: targetStudent.foto || activeCollege.escudoUrl,
        fecha: activeDateIso,
        hora: timeFormatted,
        tipo: 'clase',
        materiaNombre: selectedMateria,
        docenteNombre: effectiveTeacherName,
        estado: computedStatus,
        metodo: 'qr',
        registradoPor: `${effectiveTeacherName} (Escáner QR Docente Asignado)`,
        tutorNotificado: false,
      });

      if (computedStatus === 'retardo') {
        playBeep('retardo');
        sendEmailNotification({
          colegioId: activeCollege.id,
          colegioNombre: activeCollege.nombre,
          destinatarios: [targetStudent.tutorCorreo || 'tutor@familia.com', 'prefectura@mycollege.edu.mx'],
          rolesDestino: ['prefecto', 'directivo'],
          asunto: `[Aviso de Retardo] ${targetStudent.nombre} ${targetStudent.apellidos} - ${selectedMateria}`,
          cuerpo: `Aviso oficial: El alumno ${targetStudent.nombre} ${targetStudent.apellidos} (${targetStudent.grado} ${targetStudent.grupo}) registró ingreso con retardo (${timeFormatted}) a la clase de ${selectedMateria}.`,
          categoria: 'asistencia',
          prioridad: 'normal',
        });
      } else {
        playBeep('success');
      }

      setLastScan({
        student: targetStudent,
        status: computedStatus,
        message:
          computedStatus === 'retardo'
            ? `⚠️ Retardo registrado en ${scannedStudentLevel} (entrada ${scannedStudentStartTime} hrs, +${toleranceMinutes} min tolerancia).`
            : computedStatus === 'falta'
            ? `✕ Registrado como Falta [F] por horario en ${scannedStudentLevel} (entrada ${scannedStudentStartTime} hrs, > ${faltaAfterMinutes} min).`
            : `✓ Asistencia registrada a tiempo en ${selectedMateria} (${scannedStudentLevel} · Entrada ${scannedStudentStartTime} hrs).`,
        hora: timeFormatted,
        tipo: 'clase',
        timestamp: Date.now(),
      });

      highlightAndScrollStudent(targetStudent.id);
      triggerCooldown();
    } else {
      // Mode B: Entrada General Tótem (Para Directivos, Admins, Coordinadores, Prefectos)
      const existingGeneral = attendanceRecords.find(
        (a) =>
          a.colegioId === activeCollege.id &&
          a.estudianteId === targetStudent!.id &&
          a.fecha === activeDateIso &&
          a.tipo === 'general'
      );

      if (existingGeneral) {
        playBeep('retardo');
        setLastScan({
          student: targetStudent,
          status: existingGeneral.estado === 'retardo' ? 'retardo' : 'presente',
          message: 'ℹ️ Ingreso general al plantel ya registrado con anterioridad',
          hora: existingGeneral.hora || timeFormatted,
          tipo: 'general',
          timestamp: Date.now(),
        });
        triggerCooldown();
        return;
      }

      addAttendanceRecord({
        colegioId: activeCollege.id,
        estudianteId: targetStudent.id,
        estudianteNombre: `${targetStudent.nombre} ${targetStudent.apellidos}`,
        matricula: targetStudent.matricula,
        grado: targetStudent.grado,
        grupo: targetStudent.grupo,
        foto: targetStudent.foto,
        fecha: activeDateIso,
        hora: timeFormatted,
        tipo: 'general',
        estado: computedStatus,
        metodo: 'qr',
        registradoPor: `Kiosco Tótem Entrada (${currentUser.nombre})`,
        tutorNotificado: true,
      });

      if (computedStatus === 'retardo') {
        playBeep('retardo');
      } else {
        playBeep('success');
      }

      setLastScan({
        student: targetStudent,
        status: computedStatus,
        message:
          computedStatus === 'retardo'
            ? `Ingreso con retardo en ${scannedStudentLevel} (entrada ${scannedStudentStartTime} hrs, > ${toleranceMinutes} min). Tutor notificado.`
            : computedStatus === 'falta'
            ? `Ingreso fuera de límite en ${scannedStudentLevel} (entrada ${scannedStudentStartTime} hrs, > ${faltaAfterMinutes} min = Falta [F]). Tutor notificado.`
            : `¡Ingreso puntual a ${scannedStudentLevel} (entrada ${scannedStudentStartTime} hrs)! Notificación enviada al tutor.`,
        hora: timeFormatted,
        tipo: 'general',
        timestamp: Date.now(),
      });

      triggerCooldown();
    }
  };

  const triggerCooldown = () => {
    setScanCooldown(true);
    setTimeout(() => {
      setScanCooldown(false);
    }, 2200);
  };

  // Highlight row and smooth scroll (auto-navigates to the student's page if paginated)
  const highlightAndScrollStudent = (studentId: string) => {
    const idxInDisplayed = displayedStudents.findIndex((s) => s.id === studentId);
    if (idxInDisplayed !== -1) {
      const targetPage = Math.floor(idxInDisplayed / itemsPerPage) + 1;
      if (targetPage !== safeCurrentPage) {
        setCurrentPage(targetPage);
      }
    }
    setHighlightedStudentId(studentId);
    setTimeout(() => {
      const row = studentRowRefs.current[studentId];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    // Remove highlight after 4 seconds
    setTimeout(() => {
      setHighlightedStudentId((prev) => (prev === studentId ? null : prev));
    }, 4500);
  };

  const showTempBanner = (msg: string) => {
    setStatusFeedbackBanner(msg);
    setTimeout(() => {
      setStatusFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Manual Attendance Placement:
  // - Solo se puede tomar asistencia del día actual (P, R o F según la hora).
  // - Si intenta tomar asistencia de una fecha futura (ej. próxima semana o días posteriores a hoy), no lo permite.
  // - Si toma una asistencia de una fecha pasada (< hoy), se coloca automáticamente en F (Falta).
  // - Una vez registrada, SOLO el usuario Coordinador asignado a ese grupo puede cambiar el estatus a J (Justificado).
  const handleCycleManualStatus = (student: Student, dateIso: string) => {
    const now = new Date();
    const currentTodayIso = getLocalIsoDate(now);
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (dateIso > currentTodayIso) {
      playBeep('error');
      showTempBanner(
        `🚫 No puedes tomar asistencia de una fecha futura (${dateIso}). Solo se permite registrar asistencia del día actual (${currentTodayIso}).`
      );
      return;
    }

    const existing = attendanceRecords.find(
      (a) =>
        a.colegioId === activeCollege.id &&
        a.estudianteId === student.id &&
        a.fecha === dateIso &&
        a.tipo === 'clase' &&
        a.materiaNombre === selectedMateria
    );

    const stLevel = getStudentEffectiveLevel(student);
    const stLevelStartTime = getEffectiveStartTimeForLevel(stLevel);

    if (!existing) {
      const isPastDay = dateIso < currentTodayIso;
      // Si es fecha pasada -> 'falta' [F]; si es hoy -> P, R o F según la hora actual y la entrada del nivel del alumno
      const autoStatus: 'presente' | 'retardo' | 'falta' = isPastDay
        ? 'falta'
        : calculateAttendanceStatus(dateIso, stLevel);
      addAttendanceRecord({
        colegioId: activeCollege.id,
        estudianteId: student.id,
        estudianteNombre: `${student.nombre} ${student.apellidos}`,
        matricula: student.matricula,
        nivel: stLevel,
        grado: student.grado,
        grupo: student.grupo,
        foto: student.foto,
        fecha: dateIso,
        hora: timeFormatted,
        tipo: 'clase',
        materiaNombre: selectedMateria,
        docenteNombre: currentUser.nombre,
        estado: autoStatus,
        metodo: 'manual',
        registradoPor: `${currentUser.nombre} (${currentUser.cargo || 'Registro Manual'})`,
        tutorNotificado: false,
      });

      if (autoStatus === 'presente') {
        playBeep('success');
      } else if (autoStatus === 'retardo') {
        playBeep('retardo');
      } else {
        playBeep('error');
      }

      const labelMap: Record<'presente' | 'retardo' | 'falta', string> = {
        presente: 'P (Presente)',
        retardo: 'R (Retardo)',
        falta: isPastDay ? 'F (Falta por fecha pasada)' : 'F (Falta por horario)',
      };
      showTempBanner(
        isPastDay
          ? `Por tratarse de una fecha pasada (${dateIso}), el registro de ${student.nombre} ${student.apellidos} se colocó automáticamente en [F] Falta.`
          : `Asistencia registrada automáticamente como [${labelMap[autoStatus]}] para ${student.nombre} ${student.apellidos} (${stLevel} · Entrada ${stLevelStartTime} hrs, hora actual ${timeFormatted}).`
      );
      return;
    }

    // Si ya está registrada: SOLO el usuario Coordinador asignado a ese grupo puede cambiar el estatus a J (Justificado)
    if (isCoordinatorAssignedToStudentGroup(student)) {
      if (existing.estado !== 'justificado') {
        updateAttendanceRecord(existing.id, {
          estado: 'justificado',
          metodo: 'manual',
          justificanteEstado: existing.justificanteEstado ? 'aprobado' : undefined,
          justificanteResueltoPor: currentUser.nombre,
          justificanteFechaResolucion: new Date().toISOString().split('T')[0],
        });
        playBeep('success');
        showTempBanner(
          `✓ Estatus cambiado a [J] Justificado por el Coordinador (${currentUser.nombre}) para ${student.nombre} ${student.apellidos}.`
        );
      } else {
        showTempBanner(
          `ℹ️ La asistencia de ${student.nombre} ${student.apellidos} ya se encuentra como [J] Justificado.`
        );
      }
      return;
    }

    // Cualquier otro perfil (docente, admin, directivo, etc.) o coordinador no asignado al grupo:
    playBeep('error');
    showTempBanner(
      `🔒 La asistencia ya quedó registrada como [${existing.estado.toUpperCase()}] a las ${existing.hora || timeFormatted}. Únicamente el Coordinador asignado al grupo (${stLevel} ${student.grado} "${student.grupo}") puede cambiar el estatus a [J] Justificado.`
    );
  };

  // Resolver solicitud de justificante enviada por el Tutor (Aprobar -> cambia a 'justificado' J | Rechazar -> conserva la falta F/R)
  const handleResolveJustificationRequest = (
    record: AttendanceRecord,
    approve: boolean
  ) => {
    const studentObj = collegeStudents.find((s) => s.id === record.estudianteId);
    if (studentObj && !isCoordinatorAssignedToStudentGroup(studentObj)) {
      showTempBanner(
        '🔒 Solo el Coordinador asignado a este grupo puede autorizar o rechazar este justificante.'
      );
      return;
    }

    const resolutionDate = new Date().toISOString().split('T')[0];
    updateAttendanceRecord(record.id, {
      estado: approve ? 'justificado' : record.estado,
      justificanteEstado: approve ? 'aprobado' : 'rechazado',
      justificanteResueltoPor: currentUser.nombre,
      justificanteFechaResolucion: resolutionDate,
      justificanteObservacionCoordinador: approve
        ? `Justificante autorizado por Coordinación (${currentUser.nombre}). Estatus actualizado a [J] Justificado.`
        : `Solicitud de justificante no procedente según revisión de Coordinación (${currentUser.nombre}). Se mantiene [${record.estado.toUpperCase()}].`,
    });

    if (studentObj?.tutorCorreo) {
      sendEmailNotification({
        colegioId: activeCollege.id,
        colegioNombre: activeCollege.nombre,
        destinatarios: [studentObj.tutorCorreo],
        rolesDestino: ['tutor'],
        usuariosDestino: [
          studentObj.tutorId || '',
          studentObj.tutorCorreo,
          studentObj.id,
        ].filter(Boolean),
        asunto: approve
          ? `[Justificante Aprobado] Falta justificada [J] para ${record.estudianteNombre} (${record.fecha})`
          : `[Resolución de Justificante] Solicitud revisada para ${record.estudianteNombre} (${record.fecha})`,
        cuerpo: approve
          ? `Estimado(a) ${studentObj.tutorNombre || 'Padre/Tutor'}:\n\nEl Coordinador asignado al grupo (${currentUser.nombre}) ha APROBADO el justificante enviado para el alumno(a) ${record.estudianteNombre} correspondiente al día ${record.fecha}${record.materiaNombre ? ` en la materia ${record.materiaNombre}` : ''}.\n\nEl estatus de asistencia ha sido actualizado oficialmente a [J] JUSTIFICADO.`
          : `Estimado(a) ${studentObj.tutorNombre || 'Padre/Tutor'}:\n\nEl Coordinador asignado al grupo (${currentUser.nombre}) ha revisado el comprobante enviado para el alumno(a) ${record.estudianteNombre} del día ${record.fecha} y determinó no cambiar la falta.\n\nEl registro permanece como [${record.estado.toUpperCase()}].`,
        categoria: 'asistencia',
        prioridad: 'alta',
      });
    }

    playBeep(approve ? 'success' : 'retardo');
    showTempBanner(
      approve
        ? `✓ Justificante aprobado: se cambió la falta de ${record.estudianteNombre} (${record.fecha}) a [J] Justificado.`
        : `✕ Solicitud rechazada: se conservó la falta de ${record.estudianteNombre} (${record.fecha}) sin cambio.`
    );
  };

  // Quick action: Registrar asistencia manual en bloque para los alumnos sin registro (hoy: P/R/F según hora; fecha pasada: F; fecha futura: bloqueado)
  const handleMarkAllPresent = () => {
    const now = new Date();
    const currentTodayIso = getLocalIsoDate(now);
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (activeDateIso > currentTodayIso) {
      playBeep('error');
      showTempBanner(
        `🚫 No puedes tomar asistencia de una fecha futura (${activeDateIso}). Solo se permite registrar asistencia del día actual (${currentTodayIso}).`
      );
      return;
    }

    const isPastDay = activeDateIso < currentTodayIso;

    let countRegistered = 0;
    let lastComputedStatus: 'presente' | 'retardo' | 'falta' = 'presente';
    currentClassStudents.forEach((student) => {
      const existing = attendanceRecords.find(
        (a) =>
          a.colegioId === activeCollege.id &&
          a.estudianteId === student.id &&
          a.fecha === activeDateIso &&
          a.tipo === 'clase' &&
          a.materiaNombre === selectedMateria
      );

      if (!existing) {
        countRegistered++;
        const stLevel = getStudentEffectiveLevel(student);
        const studentAutoStatus: 'presente' | 'retardo' | 'falta' = isPastDay
          ? 'falta'
          : calculateAttendanceStatus(activeDateIso, stLevel);
        lastComputedStatus = studentAutoStatus;
        addAttendanceRecord({
          colegioId: activeCollege.id,
          estudianteId: student.id,
          estudianteNombre: `${student.nombre} ${student.apellidos}`,
          matricula: student.matricula,
          nivel: stLevel,
          grado: student.grado,
          grupo: student.grupo,
          foto: student.foto,
          fecha: activeDateIso,
          hora: timeFormatted,
          tipo: 'clase',
          materiaNombre: selectedMateria,
          docenteNombre: currentUser.nombre,
          estado: studentAutoStatus,
          metodo: 'manual',
          registradoPor: `${currentUser.nombre} (${isPastDay ? 'Pase Fecha Pasada [F]' : `Pase Manual por Nivel (${stLevel})`})`,
          tutorNotificado: false,
        });
      }
    });

    playBeep(
      lastComputedStatus === 'presente'
        ? 'success'
        : lastComputedStatus === 'retardo'
        ? 'retardo'
        : 'error'
    );
    showTempBanner(
      countRegistered > 0
        ? isPastDay
          ? `Por ser una fecha pasada (${activeDateIso}), se registró automáticamente como [F] Falta a ${countRegistered} alumno(s) pendientes.`
          : `Se registró asistencia automática a ${countRegistered} alumno(s) pendientes evaluando la hora de entrada del nivel al que pertenece cada alumno (${timeFormatted}).`
        : 'Todos los alumnos de este grupo ya cuentan con su asistencia registrada en esta fecha.'
    );
  };

  // Camera Management
  const startVirtualCamera = async (studentIdx?: number, isUnregistered: boolean = false) => {
    stopCamera();
    setIsRequestingPermission(true);
    setCameraError(null);
    setCameraPermissionErrorType(null);

    try {
      const list = currentClassStudents.length > 0 ? currentClassStudents : collegeStudents;
      const targetIdx = studentIdx !== undefined ? studentIdx : virtualStudentIndex;
      const chosenStudent = isUnregistered
        ? null
        : list[targetIdx % Math.max(1, list.length)] || collegeStudents[0];

      const officialDomain = 'https://dashboard.mycollege.com.mx';
      let payload = '';
      let studentName = 'Credencial No Registrada';
      let studentMatricula = 'DESCONOCIDO-999';

      if (chosenStudent) {
        payload = `${officialDomain}/asistencia?alumno=${encodeURIComponent(
          chosenStudent.matricula
        )}&sid=${encodeURIComponent(chosenStudent.id)}&colegio=${encodeURIComponent(activeCollege.id)}`;
        studentName = `${chosenStudent.nombre} ${chosenStudent.apellidos}`;
        studentMatricula = chosenStudent.matricula;
      } else {
        payload = 'https://credencial-externa.com/id?matricula=INV-999&alumno=Desconocido';
      }

      const virtual = await createVirtualCameraStream({
        qrPayload: payload,
        studentName,
        studentMatricula,
        collegeName: activeCollege.nombre,
        studentPhoto: chosenStudent?.foto,
      });

      virtualControllerRef.current = virtual;
      setIsVirtualCamera(true);

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, virtual.stream);
        setIsCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Error starting virtual camera in AttendanceModule:', err);
      setCameraError('No se pudo inicializar la cámara de pruebas QR.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSwitchVirtualStudent = async (studentIdx?: number, isUnregistered: boolean = false) => {
    if (!isVirtualCamera || !virtualControllerRef.current) {
      if (studentIdx !== undefined) setVirtualStudentIndex(studentIdx);
      await startVirtualCamera(studentIdx, isUnregistered);
      return;
    }

    const list = currentClassStudents.length > 0 ? currentClassStudents : collegeStudents;
    const targetIdx = studentIdx !== undefined ? studentIdx : virtualStudentIndex;
    if (studentIdx !== undefined) setVirtualStudentIndex(targetIdx);

    const chosenStudent = isUnregistered
      ? null
      : list[targetIdx % Math.max(1, list.length)] || collegeStudents[0];

    const officialDomain = 'https://dashboard.mycollege.com.mx';
    let payload = '';
    let studentName = 'Credencial No Registrada';
    let studentMatricula = 'DESCONOCIDO-999';

    if (chosenStudent) {
      payload = `${officialDomain}/asistencia?alumno=${encodeURIComponent(
        chosenStudent.matricula
      )}&sid=${encodeURIComponent(chosenStudent.id)}&colegio=${encodeURIComponent(activeCollege.id)}`;
      studentName = `${chosenStudent.nombre} ${chosenStudent.apellidos}`;
      studentMatricula = chosenStudent.matricula;
    } else {
      payload = 'https://credencial-externa.com/id?matricula=INV-999&alumno=Desconocido';
    }

    await virtualControllerRef.current.updatePayload(payload, studentName, studentMatricula);
  };

  const startCamera = async (
    customDeviceId?: string,
    customFacing?: 'environment' | 'user',
    preferVirtual: boolean = false
  ) => {
    if (preferVirtual) {
      await startVirtualCamera();
      return;
    }

    setIsRequestingPermission(true);
    setCameraError(null);
    setCameraPermissionErrorType(null);

    try {
      if (virtualControllerRef.current) {
        virtualControllerRef.current.stop();
        virtualControllerRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const activeDeviceId = customDeviceId !== undefined ? customDeviceId : selectedDeviceId;
      const activeFacing = customFacing !== undefined ? customFacing : facingMode;

      const result = await requestCameraStream({
        deviceId: activeDeviceId || undefined,
        facingMode: activeFacing,
      });

      if (!result.stream) {
        console.info('Cámara física no disponible en este momento:', result.error);
        setCameraError(result.error || 'No se pudo acceder a la cámara física del dispositivo.');
        setCameraPermissionErrorType(result.errorType || 'Generic');
        setIsCameraActive(false);
        return;
      }

      const stream = result.stream;
      setIsVirtualCamera(false);

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, stream);
        setIsCameraActive(true);
        startScanningLoop();
      }

      const devices = await getAvailableCameraDevices();
      setCameraDevices(devices);
      if (!selectedDeviceId && devices.length > 0) {
        const activeTrack = stream.getVideoTracks()[0];
        const settings = activeTrack ? activeTrack.getSettings() : null;
        if (settings && settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('No se pudo acceder a la cámara del dispositivo.');
      setCameraPermissionErrorType('Generic');
      setIsCameraActive(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (virtualControllerRef.current) {
      virtualControllerRef.current.stop();
      virtualControllerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVirtualCamera(false);
  };

  const handleSelectCameraDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    stopCamera();
    setTimeout(() => {
      startCamera(deviceId);
    }, 150);
  };

  const startScanningLoop = () => {
    const scanFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleProcessScan(code.data, isTotemActive ? 'general' : 'clase');
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Sincronizar ciclo de vida de la cámara con el montaje del visor de escaneo o tótem
  useEffect(() => {
    if (isScannerOpen || isTotemActive) {
      const timer = setTimeout(() => {
        startCamera();
      }, 50);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isScannerOpen, isTotemActive]);

  // Submission via USB laser or text
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleProcessScan(manualCodeInput.trim(), isTotemActive ? 'general' : 'clase');
    setManualCodeInput('');
  };

  // Helper to get status pill for a student on a given date
  const getRecordForDay = (studentId: string, dateIso: string) => {
    return attendanceRecords.find(
      (a) =>
        a.colegioId === activeCollege.id &&
        a.estudianteId === studentId &&
        a.fecha === dateIso &&
        a.tipo === 'clase' &&
        a.materiaNombre === selectedMateria
    );
  };

  // Statistics for active day
  const activeDayRecords = currentClassStudents.map((st) => getRecordForDay(st.id, activeDateIso));
  const presentCount = activeDayRecords.filter((r) => r?.estado === 'presente').length;
  const retardoCount = activeDayRecords.filter((r) => r?.estado === 'retardo').length;
  const faltaCount = activeDayRecords.filter((r) => r?.estado === 'falta').length;
  const totalStudentsInClass = currentClassStudents.length;
  const attendanceRate =
    totalStudentsInClass > 0
      ? Math.round(((presentCount + retardoCount) / totalStudentsInClass) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & DATE CONTROLS                                  */}
      {/* ============================================================== */}
      <div
        className="p-5 sm:p-6 rounded-2xl text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
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
              {isTeacher ? 'Pase de Lista Docente' : 'Control Académico Escolar'}
            </span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6" style={{ color: goldColor }} />
            Asistencia y Pase de Lista QR
          </h1>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Lista semanal de alumnos con escáner QR en vivo y registro manual
          </p>
        </div>
      </div>

      {/* Action Controls Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {canConfigureTolerance && (
          <button
            onClick={() => setIsToleranceConfigOpen(!isToleranceConfigOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            title="Configurar minutos de tolerancia y horas de entrada por nivel educativo"
          >
            <Settings className="w-4 h-4" style={{ color: primaryColor }} />
            <span>
              Tolerancia y Entradas ({toleranceMinutes} min
              {isMultiLevelCollege ? ' · Multinivel' : ` · ${startTime} hrs`})
            </span>
          </button>
        )}

        {canStartTotem && (
          <button
            onClick={() => {
              setIsTotemActive(true);
              setIsScannerOpen(true);
              startCamera(undefined, undefined, false);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Iniciar Kiosco para checador de entrada general en puerta principal"
          >
            <Building2 className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Iniciar Modo Tótem (Entrada General)</span>
          </button>
        )}

        <button
          onClick={() => {
            const next = !isScannerOpen;
            setIsScannerOpen(next);
            if (next) {
              startCamera(undefined, undefined, false);
            } else {
              stopCamera();
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
          style={
            isScannerOpen
              ? { backgroundColor: '#DC2626', color: '#FFFFFF' }
              : { backgroundColor: goldColor, color: primaryColor }
          }
        >
          <QrCode className="w-4 h-4" />
          <span>{isScannerOpen ? 'Cerrar Escáner' : 'Tomar Asistencia QR'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. TOLERANCE SETTINGS MODAL / POPUP (Configurable)             */}
      {/* ============================================================== */}
      {isToleranceConfigOpen && canConfigureTolerance && (
        <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200 rounded-2xl animate-in fade-in duration-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs md:text-sm text-amber-950 flex flex-wrap items-center gap-1.5">
                  <span>Configuración de Tolerancia y Horas de Entrada</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Administrador · Directivo · Coordinador · Prefecto
                  </span>
                  {isMultiLevelCollege && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      Colegio Multinivel
                    </span>
                  )}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {isMultiLevelCollege
                    ? 'Configura la hora de entrada de cada nivel educativo (ej. Secundaria más temprano, Primaria intermedio y Preescolar más tarde). Al escanear QR o registrar asistencia, el sistema evalúa automáticamente la entrada del nivel al que pertenece el alumno.'
                    : 'Establece la hora programada de entrada y los minutos permitidos antes de catalogar la asistencia como Retardo [R] o Falta [F].'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isMultiLevelCollege && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-600">
                    Hora de Entrada ({allowedCollegeLevels[0] || 'General'}):
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      const nextTime = e.target.value;
                      setStartTime(nextTime);
                      saveCollegeToleranceSettings({ startTime: nextTime });
                    }}
                    className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-600">Tolerancia [P]:</span>
                <select
                  value={toleranceMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const nextFalta = faltaAfterMinutes <= val ? val + 10 : faltaAfterMinutes;
                    setToleranceMinutes(val);
                    if (faltaAfterMinutes <= val) {
                      setFaltaAfterMinutes(nextFalta);
                    }
                    saveCollegeToleranceSettings({
                      toleranceMinutes: val,
                      faltaAfterMinutes: nextFalta,
                    });
                  }}
                  className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value={5}>Hasta 5 min</option>
                  <option value={10}>Hasta 10 min</option>
                  <option value={15}>Hasta 15 min</option>
                  <option value={20}>Hasta 20 min</option>
                  <option value={30}>Hasta 30 min</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-600">Límite Retardo [R] → [F]:</span>
                <select
                  value={faltaAfterMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFaltaAfterMinutes(val);
                    saveCollegeToleranceSettings({ faltaAfterMinutes: val });
                  }}
                  className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value={15}>Después de 15 min = Falta [F]</option>
                  <option value={20}>Después de 20 min = Falta [F]</option>
                  <option value={30}>Después de 30 min = Falta [F]</option>
                  <option value={40}>Después de 40 min = Falta [F]</option>
                  <option value={60}>Después de 60 min = Falta [F]</option>
                </select>
              </div>

              <button
                onClick={() => {
                  saveCollegeToleranceSettings();
                  setIsToleranceConfigOpen(false);
                  showTempBanner(
                    isMultiLevelCollege
                      ? `✓ Horarios de entrada por nivel (${allowedCollegeLevels
                          .map((lvl) => `${lvl}: ${levelStartTimes[lvl]} hrs`)
                          .join(' · ')}) y tolerancia (${toleranceMinutes} min) guardados correctamente.`
                      : `✓ Hora de entrada (${startTime} hrs) y tolerancia (${toleranceMinutes} min) guardadas correctamente.`
                  );
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Guardar Configuración
              </button>
            </div>
          </div>

          {/* Configuración de diferentes horas de entrada por nivel cuando el colegio es multinivel */}
          {isMultiLevelCollege && (
            <div className="pt-3 border-t border-amber-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span>Horarios de Entrada por Nivel Educativo (Colegio Multinivel):</span>
                </span>
                <span className="text-[11px] text-amber-800">
                  La asistencia (Presente [P], Retardo [R] o Falta [F]) se calcula según el nivel del alumno
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {allowedCollegeLevels.map((lvl) => {
                  const lvlTime = levelStartTimes[lvl] || '08:00';
                  const levelHint =
                    lvl === 'Secundaria'
                      ? 'Entrada más temprano'
                      : lvl === 'Primaria'
                      ? 'Horario intermedio'
                      : lvl === 'Preescolar'
                      ? 'Entrada más tarde'
                      : 'Horario bachillerato';
                  return (
                    <div
                      key={lvl}
                      className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{lvl}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{levelHint}</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <input
                          type="time"
                          value={lvlTime}
                          onChange={(e) => {
                            const updated = {
                              ...levelStartTimes,
                              [lvl]: e.target.value,
                            };
                            setLevelStartTimes(updated);
                            saveCollegeToleranceSettings({ levelStartTimes: updated });
                          }}
                          className="text-xs font-extrabold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner de retroalimentación de registro automático / permisos */}
      {statusFeedbackBanner && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusFeedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedbackBanner(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* BANDEJA DE JUSTIFICANTES ENVIADOS POR TUTORES (COORDINACIÓN)   */}
      {/* ============================================================== */}
      {(() => {
        const justificationRequests = attendanceRecords.filter((rec) => {
          if (rec.colegioId !== activeCollege.id || !rec.justificanteEstado) return false;
          const stObj = collegeStudents.find((s) => s.id === rec.estudianteId);
          if (!stObj) return false;
          // Mostrar los justificantes que corresponden a los grupos visibles / asignados al coordinador
          const stLvl = getStudentEffectiveLevel(stObj);
          const stGrp = (stObj.grupo || '').replace(/["']/g, '').trim().toUpperCase();
          return allowedGroupsForCurrentUser.some(
            (g) => g.nivel === stLvl && g.grado === stObj.grado && g.grupo === stGrp
          );
        });

        const pendingRequests = justificationRequests.filter(
          (r) => r.justificanteEstado === 'pendiente'
        );

        if (justificationRequests.length === 0) return null;

        return (
          <div className="bg-white rounded-3xl border border-indigo-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-indigo-50/80 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-xs md:text-sm text-indigo-950 flex items-center gap-2">
                    Comprobantes y Justificantes Enviados por Tutores
                    {pendingRequests.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                        {pendingRequests.length} Pendiente{pendingRequests.length > 1 ? 's' : ''} de Revisión
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-indigo-800">
                    {isCoordinator
                      ? `Coordinación de ${coordinatorAssignedLevel || 'Nivel'} · Revisa los comprobantes enviados por los tutores de tus grupos asignados y decide si se cambia la falta a [J] Justificado.`
                      : 'Vista informativa · Únicamente el Coordinador asignado al grupo correspondiente puede autorizar el cambio de falta a [J] Justificado.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {justificationRequests.map((req) => {
                const stObj = collegeStudents.find((s) => s.id === req.estudianteId);
                const canCoordResolve = stObj ? isCoordinatorAssignedToStudentGroup(stObj) : false;

                return (
                  <div
                    key={req.id}
                    className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs hover:bg-slate-50/80"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.estudianteNombre}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {stObj ? getStudentEffectiveLevel(stObj) : req.nivel || ''} {req.grado} "{req.grupo}"
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]">
                          Fecha falta: {req.fecha} {req.materiaNombre ? `· ${req.materiaNombre}` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            req.justificanteEstado === 'pendiente'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : req.justificanteEstado === 'aprobado'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {req.justificanteEstado === 'pendiente'
                            ? '⏳ Pendiente de Coordinación'
                            : req.justificanteEstado === 'aprobado'
                            ? '✓ Aprobado [J]'
                            : '✕ No procedente (Se conserva falta)'}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        <strong className="text-slate-900">Motivo del Tutor ({req.justificanteEnviadoPor || 'Padre/Tutor'}):</strong>{' '}
                        {req.justificanteMotivo || 'Sin descripción adicional'}
                      </p>
                      {req.justificanteResueltoPor && (
                        <p className="text-[11px] text-slate-500">
                          Revisado por <strong>{req.justificanteResueltoPor}</strong> el{' '}
                          {req.justificanteFechaResolucion}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {req.justificanteArchivoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewProofUrl({
                              url: req.justificanteArchivoUrl!,
                              fileName: req.justificanteArchivoNombre || 'Comprobante_Medico.pdf',
                              studentName: req.estudianteNombre,
                              motivo: req.justificanteMotivo || '',
                              fecha: req.fecha,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                        >
                          📎 Ver Comprobante ({req.justificanteArchivoNombre || 'Adjunto'})
                        </button>
                      )}

                      {canCoordResolve && req.justificanteEstado === 'pendiente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolveJustificationRequest(req, true)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Autorizar y Cambiar a [J]</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveJustificationRequest(req, false)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>No Cambiar Falta</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Modal para visualizar comprobante enviado por el Tutor */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Comprobante / Justificante · {previewProofUrl.studentName}
                </h4>
                <p className="text-xs text-slate-500">
                  Fecha de inasistencia: {previewProofUrl.fecha} · Archivo: {previewProofUrl.fileName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <strong>Motivo expuesto por el Tutor:</strong> {previewProofUrl.motivo}
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-80 flex items-center justify-center p-2">
              {previewProofUrl.url.startsWith('data:image') ||
              previewProofUrl.url.startsWith('http') ? (
                <img
                  src={previewProofUrl.url}
                  alt={previewProofUrl.fileName}
                  className="max-h-72 object-contain rounded-lg"
                />
              ) : (
                <div className="p-6 text-center space-y-2">
                  <FileSpreadsheet className="w-10 h-10 text-indigo-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">{previewProofUrl.fileName}</p>
                  <a
                    href={previewProofUrl.url}
                    download={previewProofUrl.fileName}
                    className="inline-block px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Descargar Comprobante
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TOTEM KIOSK FULLSCREEN MODAL (Entrada General)              */}
      {/* ============================================================== */}
      {isTotemActive && canStartTotem && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 md:p-8 animate-in fade-in">
          <div className="flex items-center justify-between text-white pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-600 text-white">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-display font-bold text-lg md:text-xl">
                  Kiosco Tótem · Entrada General al Plantel
                </h2>
                <p className="text-xs text-slate-400">
                  {activeCollege.nombre} · Escaneo de credenciales para todo el alumnado
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-300">
                {isMultiLevelCollege
                  ? `Tolerancia: ${toleranceMinutes} min · Entradas: ${allowedCollegeLevels
                      .map((lvl) => `${lvl} ${levelStartTimes[lvl]}`)
                      .join(' | ')}`
                  : `Tolerancia: ${toleranceMinutes} min (después de ${startTime})`}
              </span>
              <button
                onClick={() => {
                  setIsTotemActive(false);
                  stopCamera();
                  setIsScannerOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-red-900/80 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                Salir del Tótem ✕
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center justify-center py-6">
            {/* Camera Frame */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full max-w-xl bg-slate-900 rounded-3xl p-4 border border-slate-800 relative overflow-hidden text-center shadow-2xl">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover block"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {isCameraActive ? (
                    <>
                      {/* Overlay box */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1"></div>
                          <div className="w-full h-0.5 bg-indigo-400/80 absolute top-1/2 left-0 shadow-[0_0_10px_#818cf8] animate-bounce"></div>
                        </div>
                      </div>

                      {/* Top live badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {isVirtualCamera ? (
                          <div className="bg-purple-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-purple-300 font-bold flex items-center gap-1.5 shadow-md border border-purple-500/40">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                            <span>Cámara Virtual de Pruebas QR</span>
                          </div>
                        ) : (
                          <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 shadow-md border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Cámara Web en Vivo</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Permiso no otorgado o cámara inactiva: Selector explícito aquí en AI Studio */
                    <div className="absolute inset-0 z-10 bg-slate-950/95 backdrop-blur-xs p-6 text-center flex flex-col items-center justify-center space-y-4 text-white animate-in fade-in duration-200">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                        <Camera className="w-8 h-8 animate-pulse" />
                      </div>

                      <div className="space-y-1 max-w-md">
                        <h4 className="text-base font-extrabold text-white">
                          Cámara y Lector QR del Plantel
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Puedes utilizar tu cámara web física o activar la cámara virtual interactiva para probar lecturas QR directamente aquí sin abrir otra ventana.
                        </p>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera(undefined, undefined, false)}
                          disabled={isRequestingPermission}
                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>📸 Activar Cámara Web</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startVirtualCamera(undefined, false)}
                          disabled={isRequestingPermission}
                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer border border-purple-400/40"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>🎥 Cámara de Pruebas QR</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Virtual Camera Credential Presenter */}
                {isCameraActive && isVirtualCamera && (
                  <div className="mt-3 p-2.5 bg-slate-950/80 rounded-2xl border border-purple-500/30 text-left space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Presentar credencial frente a la cámara virtual:
                      </span>
                      <span className="text-[10px] text-slate-400">Lectura en tiempo real</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {collegeStudents.slice(0, 4).map((st, idx) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSwitchVirtualStudent(idx, false)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            virtualStudentIndex === idx
                              ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                              : 'bg-slate-900 text-slate-300 hover:bg-purple-950/60 border-slate-700'
                          }`}
                        >
                          👤 {st.nombre.split(' ')[0]} ({st.matricula})
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSwitchVirtualStudent(undefined, true)}
                        className="text-[11px] font-semibold px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-lg border border-red-700/60 transition-all cursor-pointer"
                        title="Simular código QR de alumno no registrado en este colegio"
                      >
                        ✕ QR Desconocido
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer bar with device controls & switcher */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => (isVirtualCamera ? startCamera(undefined, undefined, false) : startVirtualCamera(undefined, false))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {isVirtualCamera ? (
                        <>
                          <Camera className="w-3 h-3 text-indigo-400" />
                          <span>Cambiar a Cámara Web</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Cámara de Pruebas QR</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {cameraDevices.length > 1 && isCameraActive && !isVirtualCamera && (
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => handleSelectCameraDevice(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-700"
                        title="Seleccionar cámara"
                      >
                        {cameraDevices.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Cámara ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}

                    {isCameraActive && !isVirtualCamera && (
                      <button
                        onClick={() => {
                          const next = facingMode === 'environment' ? 'user' : 'environment';
                          setFacingMode(next);
                          setSelectedDeviceId('');
                          stopCamera();
                          setTimeout(() => startCamera('', next), 200);
                        }}
                        className="px-2.5 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Voltear</span>
                      </button>
                    )}
                  </div>
                </div>

                {cameraError && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs text-left ${
                      cameraPermissionErrorType === 'NotAllowedError' || cameraPermissionErrorType === 'PermissionsPolicyError'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                        : 'bg-amber-950/80 border-amber-500 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => startVirtualCamera(undefined, false)}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Activar Cámara Virtual de Pruebas QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fast test simulators */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Simulación rápida:</span>
                {collegeStudents.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleProcessScan(s.matricula, 'general')}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                  >
                    ⚡ {s.nombre} ({s.grado} {s.grupo})
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Last Scan Card */}
            <div className="lg:col-span-5 space-y-4">
              {lastScan ? (
                <div
                  className={`p-6 rounded-3xl border-2 transition-all ${
                    lastScan.status === 'presente'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                      : lastScan.status === 'retardo'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-100'
                      : 'bg-red-950/80 border-red-500 text-red-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <SafeImage
                      src={lastScan.student.foto}
                      alt={lastScan.student.nombre}
                      fallbackType="student"
                      fallbackText={lastScan.student.nombre}
                      fallbackExtra={lastScan.student.grado}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                    />
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider block opacity-75">
                        {lastScan.student.matricula}
                      </span>
                      <h3 className="font-display font-bold text-xl text-white">
                        {lastScan.student.nombre} {lastScan.student.apellidos}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 mt-1 inline-block">
                        {lastScan.student.grado} "{lastScan.student.grupo}"
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs block opacity-80">Estado:</span>
                      <span className="font-bold text-base uppercase">
                        {lastScan.status === 'presente'
                          ? '✓ Ingreso a Tiempo'
                          : lastScan.status === 'retardo'
                          ? '⚠️ Con Retardo'
                          : '✕ No Reconocido'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block opacity-80">Hora:</span>
                      <span className="font-mono font-bold text-base">{lastScan.hora}</span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-white/90">{lastScan.message}</p>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
                  <QrCode className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <h4 className="font-bold text-white text-base">Esperando credencial</h4>
                  <p className="text-xs mt-1">Coloca el código QR frente a la cámara para checar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CLASSROOM QR SCANNER DRAWER (DOCENTE EN EL AULA)           */}
      {/* ============================================================== */}
      {isScannerOpen && !isTotemActive && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                <Camera className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm md:text-base text-white flex items-center gap-2">
                  Escáner de Aula Activo · {selectedGrado} "{selectedGrupo}"
                  <span className="text-[10px] bg-teal-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                    {selectedMateria}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ponte en la entrada del salón con tu tablet: al escanear, la lista se llena
                  automáticamente en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSoundEnabled
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Sonido {isSoundEnabled ? 'On' : 'Off'}</span>
              </button>

              {cameraDevices.length > 1 && isCameraActive && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleSelectCameraDevice(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-[11px] font-bold px-2 py-1 rounded-xl border border-slate-700"
                  title="Seleccionar cámara"
                >
                  {cameraDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Cámara ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}

              {isCameraActive && (
                <button
                  onClick={() => {
                    const next = facingMode === 'environment' ? 'user' : 'environment';
                    setFacingMode(next);
                    setSelectedDeviceId('');
                    stopCamera();
                    setTimeout(() => startCamera('', next), 200);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1"
                  title="Girar cámara"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Girar</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Video Box */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full relative aspect-video max-h-[260px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover block"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {isCameraActive ? (
                  <>
                    {/* Target overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-44 h-44 border-2 border-teal-400/80 rounded-2xl relative animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-4 border-l-4 border-teal-400 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-4 border-r-4 border-teal-400 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-4 border-l-4 border-teal-400 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-4 border-r-4 border-teal-400 -mb-1 -mr-1"></div>
                        <div className="w-full h-0.5 bg-teal-400/80 absolute top-1/2 left-0 shadow-[0_0_10px_#2dd4bf] animate-bounce"></div>
                      </div>
                    </div>

                    {/* Live badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {isVirtualCamera ? (
                        <div className="bg-purple-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-purple-300 font-bold flex items-center gap-1.5 shadow-md border border-purple-500/40">
                          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                          <span>Cámara Virtual de Pruebas QR</span>
                        </div>
                      ) : (
                        <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-teal-400 font-bold flex items-center gap-1.5 shadow-md border border-teal-500/30">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                          <span>Cámara Web en Vivo</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 z-10 bg-slate-950/95 backdrop-blur-xs p-4 text-center flex flex-col items-center justify-center space-y-3 text-white animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                      <Camera className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="space-y-0.5 max-w-sm">
                      <h4 className="text-sm font-extrabold text-white">
                        Cámara de Aula y Escáner QR
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Activa tu cámara web física o usa la cámara virtual de pruebas para validar asistencias sin salir de la app.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera(undefined, undefined, false)}
                        disabled={isRequestingPermission}
                        className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>📸 Cámara Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startVirtualCamera(undefined, false)}
                        disabled={isRequestingPermission}
                        className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer border border-purple-400/40"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>🎥 Cámara Virtual QR</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Virtual Camera Credential Presenter */}
              {isCameraActive && isVirtualCamera && (
                <div className="mt-2.5 p-2 bg-slate-950/80 rounded-2xl border border-purple-500/30 text-left space-y-1 w-full animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Presentar credencial frente al lente virtual:
                    </span>
                    <span className="text-slate-400">Escaneo activo</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(currentClassStudents.length > 0 ? currentClassStudents : collegeStudents)
                      .slice(0, 4)
                      .map((st, idx) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSwitchVirtualStudent(idx, false)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            virtualStudentIndex === idx
                              ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                              : 'bg-slate-900 text-slate-300 hover:bg-purple-950/60 border-slate-700'
                          }`}
                        >
                          👤 {st.nombre.split(' ')[0]} ({st.matricula})
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => handleSwitchVirtualStudent(undefined, true)}
                      className="text-[10px] font-semibold px-2 py-0.5 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-lg border border-red-700/60 transition-all cursor-pointer"
                      title="Simular credencial no registrada"
                    >
                      ✕ QR No Registrado
                    </button>
                  </div>
                </div>
              )}

              {/* Viewfinder footer toolbar */}
              <div className="mt-2 w-full flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => (isVirtualCamera ? startCamera(undefined, undefined, false) : startVirtualCamera(undefined, false))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[10px] flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                >
                  {isVirtualCamera ? (
                    <>
                      <Camera className="w-3 h-3 text-teal-400" />
                      <span>Cambiar a Cámara Web</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Cámara de Pruebas QR</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-500">Muestra la credencial al visor</span>
              </div>

              {cameraError && (
                <div
                  className={`mt-2 text-xs p-2.5 rounded-xl border w-full text-left ${
                    cameraPermissionErrorType === 'NotAllowedError' || cameraPermissionErrorType === 'PermissionsPolicyError'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : 'bg-amber-950/80 border-amber-500 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-semibold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => startVirtualCamera(undefined, false)}
                        className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Activar Cámara Virtual de Pruebas QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Last Scan Feedback + Manual USB / Quick Test */}
            <div className="lg:col-span-6 space-y-3">
              {lastScan ? (
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    lastScan.status === 'presente'
                      ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
                      : lastScan.status === 'retardo'
                      ? 'bg-amber-950/70 border-amber-500/80 text-amber-200'
                      : 'bg-red-950/70 border-red-500/80 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={lastScan.student.foto}
                      alt={lastScan.student.nombre}
                      fallbackType="student"
                      fallbackText={lastScan.student.nombre}
                      fallbackExtra={lastScan.student.grado}
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase opacity-75">
                          {lastScan.student.matricula}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10">
                          {lastScan.hora}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white truncate">
                        {lastScan.student.nombre} {lastScan.student.apellidos}
                      </h4>
                      <p className="text-xs mt-0.5 font-medium">{lastScan.message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-400 text-center">
                  Listo para escanear credenciales de los alumnos al ingresar al aula.
                </div>
              )}

              {/* USB Laser Scanner or Manual Matrícula Input */}
              <form onSubmit={handleManualCodeSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Pistola láser USB o matrícula (ej. CCM-2026-081)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-teal-400 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-teal-400"
                >
                  Registrar
                </button>
              </form>

              {/* Quick Simulator Buttons for this group */}
              <div className="pt-1 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] text-slate-400 shrink-0">Simular escaneo:</span>
                {currentClassStudents.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleProcessScan(s.matricula, 'clase')}
                    className="text-[11px] font-semibold px-2 py-0.5 bg-slate-800 hover:bg-teal-900/60 text-slate-200 rounded border border-slate-700 shrink-0"
                  >
                    ⚡ {s.nombre.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CLASS CONFIGURATION & WEEKLY DAY SELECTOR                  */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Class Filters (Nivel, Grado y Grupo) + Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Nivel */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Nivel:</span>
              <select
                value={selectedNivel}
                onChange={(e) => {
                  const nextNivel = e.target.value;
                  setSelectedNivel(nextNivel);
                  setSelectedGrado('todos');
                  setSelectedGrupo('todos');
                  if (isTeacher) {
                    const firstForLvl = allowedGroupsForCurrentUser.find(
                      (g) => nextNivel === 'todos' || g.nivel === nextNivel
                    );
                    if (firstForLvl) {
                      setSelectedGrado(firstForLvl.grado);
                      setSelectedGrupo(firstForLvl.grupo);
                    }
                  }
                }}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {!isTeacher && (
                  <option value="todos">Todos los Niveles</option>
                )}
                {registeredLevelsInCollege.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Grado */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Grado:</span>
              <select
                value={selectedGrado}
                onChange={(e) => {
                  const nextGrade = e.target.value;
                  setSelectedGrado(nextGrade);
                  if (nextGrade === 'todos') {
                    setSelectedGrupo('todos');
                  } else if (isTeacher) {
                    const firstGrpForGrade = allowedGroupsForCurrentUser.find(
                      (g) => g.grado === nextGrade
                    );
                    if (firstGrpForGrade) {
                      setSelectedGrupo(firstGrpForGrade.grupo);
                    }
                  }
                }}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {!isTeacher && <option value="todos">Todos los Grados</option>}
                {availableGrados.map((g) => (
                  <option key={g} value={g}>
                    Grado {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Grupo */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Grupo:</span>
              <select
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {!isTeacher && <option value="todos">Todos los Grupos</option>}
                {availableGrupos.map((grp) => (
                  <option key={grp} value={grp}>
                    Grupo "{grp}"
                  </option>
                ))}
              </select>
            </div>

            {isTeacher && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-600">Materia:</span>
                <select
                  value={selectedMateria}
                  onChange={(e) => setSelectedMateria(e.target.value)}
                  className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden max-w-[220px] cursor-pointer"
                >
                  {(defaultTeacher?.materias && defaultTeacher.materias.length > 0
                    ? defaultTeacher.materias
                    : collegeSubjects.map((s) => s.nombre)
                  ).map((matName) => (
                    <option key={matName} value={matName}>
                      {matName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Metrics for the active day */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {presentCount} / {totalStudentsInClass} Asistieron ({attendanceRate}%)
              </span>
            </div>

            {retardoCount > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                {retardoCount} Retardo{retardoCount > 1 ? 's' : ''}
              </div>
            )}

            <button
              onClick={handleMarkAllPresent}
              className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Registrar asistencia manual en bloque para los alumnos sin registro hoy (se asigna P, R o F automático según la hora actual)"
            >
              + Registrar Asistencia del Grupo (Según Hora)
            </button>
          </div>
        </div>

        {/* Row 2: Week Navigator & 5 Day Buttons (Lunes a Viernes) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Week Selector Arrow controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(currentWeekMonday);
                prev.setDate(prev.getDate() - 7);
                setCurrentWeekMonday(prev);
              }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs md:text-sm font-bold text-slate-800">
              Semana del {weekDays[0]?.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al{' '}
              {weekDays[4]?.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>

            <button
              onClick={() => {
                const next = new Date(currentWeekMonday);
                next.setDate(next.getDate() + 7);
                const nextMondayIso = getLocalIsoDate(next);
                const todayNowIso = getLocalIsoDate(new Date());
                if (nextMondayIso > todayNowIso) {
                  playBeep('error');
                  showTempBanner(
                    '🚫 No puedes avanzar a la próxima semana para tomar asistencia. Solo se permite tomar asistencia de la fecha del día actual.'
                  );
                  return;
                }
                setCurrentWeekMonday(next);
              }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Semana siguiente (no permite avanzar a semanas futuras)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentWeekMonday(getMonday(new Date()));
                const todayDay = new Date().getDay();
                setSelectedDayIndex(todayDay >= 1 && todayDay <= 5 ? todayDay - 1 : 0);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded-md"
            >
              Hoy
            </button>
          </div>

          {/* Search & Page Size selector */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold">Mostrar:</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                {[10, 30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setItemsPerPage(size)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      itemsPerPage === size
                        ? 'text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                    style={
                      itemsPerPage === size ? { backgroundColor: primaryColor } : undefined
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative max-w-xs w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Buscar alumno por nombre o matrícula..."
                className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. WEEKLY ATTENDANCE SHEET TABLE                               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Instructions / Legend */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span className="font-bold text-slate-800">Leyenda:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              [P] Presente
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              [R] Retardo
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded">
              [F] Falta
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
              [J] Justificado
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">[-] Sin registrar</span>
          </div>

          <div className="text-[11px] text-slate-600">
            💡{' '}
            <em>
              Solo puedes tomar asistencia del <strong>día actual</strong> (se asigna{' '}
              <strong>[P]</strong>, <strong>[R]</strong> o <strong>[F]</strong> según la hora). Si se
              toma en una <strong>fecha pasada</strong> se coloca en <strong>[F] Falta</strong>. Las{' '}
              <strong>fechas futuras</strong> están bloqueadas. Solo el{' '}
              <strong>Coordinador asignado</strong> puede cambiar a <strong>[J] Justificado</strong>.
            </em>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[240px]">Alumno / Matrícula</th>
                <th className="py-3.5 px-2 text-center w-20">Grupo</th>

                {/* 5 Days of the Week Columns */}
                {weekDays.map((day, idx) => (
                  <th
                    key={day.iso}
                    onClick={() => {
                      if (day.isFuture) {
                        playBeep('error');
                        showTempBanner(
                          `🚫 No se puede seleccionar ni tomar asistencia de una fecha futura (${day.label}). Solo puedes tomar asistencia del día actual.`
                        );
                        return;
                      }
                      setSelectedDayIndex(idx);
                    }}
                    className={`py-3 px-3 text-center min-w-[100px] transition-colors ${
                      day.isFuture
                        ? 'opacity-50 cursor-not-allowed bg-slate-100/50 text-slate-400'
                        : selectedDayIndex === idx
                        ? 'bg-teal-50 text-teal-900 border-b-2 border-teal-600 cursor-pointer'
                        : 'hover:bg-slate-200/60 cursor-pointer'
                    }`}
                  >
                    <div className="font-bold">{day.name}</div>
                    <div className="text-[10px] font-normal text-slate-500">
                      {day.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      {day.isToday && (
                        <span className="ml-1 text-[9px] bg-teal-600 text-white font-extrabold px-1 rounded">
                          HOY
                        </span>
                      )}
                      {day.isPast && (
                        <span className="ml-1 text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded">
                          Pasado [F]
                        </span>
                      )}
                      {day.isFuture && (
                        <span className="ml-1 text-[9px] bg-slate-200 text-slate-600 font-bold px-1 rounded">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </th>
                ))}

                <th className="py-3.5 px-4 text-center w-28">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron alumnos para{' '}
                    {selectedGrado === 'todos' && selectedGrupo === 'todos'
                      ? 'los grupos seleccionados'
                      : `${selectedGrado === 'todos' ? 'Todos los grados' : selectedGrado} "${
                          selectedGrupo === 'todos' ? 'Todos' : selectedGrupo
                        }"`}
                    .
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st, index) => {
                  const isHighlighted = highlightedStudentId === st.id;
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr
                      key={st.id}
                      ref={(el) => {
                        studentRowRefs.current[st.id] = el;
                      }}
                      className={`transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-emerald-100/90 ring-2 ring-emerald-500 ring-inset font-semibold'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-slate-50/40 hover:bg-slate-100/60'
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {globalIndex}
                      </td>

                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={st.foto}
                            alt={st.nombre}
                            fallbackType="student"
                            fallbackText={st.nombre}
                            fallbackExtra={st.grado}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs bg-white"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {st.nombre} {st.apellidos}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-500">
                                {st.matricula}
                              </span>
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 truncate">
                                Docente(s):{' '}
                                {(() => {
                                  const tchs = getStudentAssignedTeachers(st);
                                  if (tchs.length > 0) {
                                    return tchs.map((t) => t.nombre).join(', ');
                                  }
                                  return st.docenteNombre || 'Titular';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-600">
                        {st.grado} "{st.grupo}"
                      </td>

                      {/* 5 Day Cells (Lunes a Viernes) */}
                      {weekDays.map((day) => {
                        const record = getRecordForDay(st.id, day.iso);
                        const estado = record?.estado;
                        const hasPendingJustification = record?.justificanteEstado === 'pendiente';
                        const canCoordChangeToJ =
                          Boolean(record) &&
                          estado !== 'justificado' &&
                          isCoordinatorAssignedToStudentGroup(st);

                        return (
                          <td
                            key={day.iso}
                            className={`py-2 px-2 text-center transition-colors ${
                              selectedDayIndex === day.index ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCycleManualStatus(st, day.iso)}
                                className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs transition-all active:scale-95 shadow-2xs flex items-center justify-center gap-1 ${
                                  day.isFuture && !estado
                                    ? 'bg-slate-100/40 text-slate-300 border border-dashed border-slate-200 cursor-not-allowed'
                                    : estado === 'presente'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 cursor-pointer'
                                    : estado === 'retardo'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 cursor-pointer'
                                    : estado === 'falta'
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 cursor-pointer'
                                    : estado === 'justificado'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 cursor-pointer'
                                    : 'bg-slate-100/70 text-slate-400 hover:bg-slate-200 hover:text-slate-700 border border-dashed border-slate-300 cursor-pointer'
                                }`}
                                title={
                                  day.isFuture
                                    ? 'Fecha futura bloqueada: solo se puede tomar asistencia del día actual'
                                    : record
                                    ? canCoordChangeToJ
                                      ? `${estado?.toUpperCase()} (${record.hora || 'S/H'}) — Clic como Coordinador del grupo para cambiar a [J] Justificado`
                                      : `${estado?.toUpperCase()} — Registrado a las ${record.hora || 'S/H'} (Solo el Coordinador del grupo puede cambiar a [J])`
                                    : day.isPast
                                    ? 'Fecha pasada: al hacer clic se colocará automáticamente en [F] Falta'
                                    : 'Clic para registrar asistencia del día actual (se asigna P, R o F automático según la hora actual)'
                                }
                              >
                                {estado === 'presente' && <span>P</span>}
                                {estado === 'retardo' && <span>R</span>}
                                {estado === 'falta' && <span>F</span>}
                                {estado === 'justificado' && <span>J</span>}
                                {!estado && <span>-</span>}
                              </button>
                              {hasPendingJustification && (
                                <span
                                  className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 truncate max-w-[90px]"
                                  title={`Justificante enviado por Tutor: ${record?.justificanteMotivo || ''}`}
                                >
                                  📄 Justificante
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Action column */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleProcessScan(
                              `https://dashboard.mycollege.com.mx/asistencia?alumno=${encodeURIComponent(
                                st.matricula
                              )}&sid=${encodeURIComponent(st.id)}&colegio=${encodeURIComponent(
                                activeCollege.id
                              )}&curp=${encodeURIComponent(st.curp)}&grado=${encodeURIComponent(
                                st.grado
                              )}&grupo=${encodeURIComponent(st.grupo)}&docente=${encodeURIComponent(
                                st.docenteId || getStudentAssignedTeacher(st)?.id || ''
                              )}`,
                              'clase'
                            )
                          }
                          className="px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Escanear código QR del alumno en el módulo del docente asignado"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Escanear QR</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination (10, 30 o 50 por lista) and summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Mostrando{' '}
              <strong className="text-slate-900">
                {displayedStudents.length === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-900">
                {Math.min(startIndex + itemsPerPage, displayedStudents.length)}
              </strong>{' '}
              de <strong className="text-slate-900">{displayedStudents.length}</strong> alumnos
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Alumnos por lista:</span>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {[10, 30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setItemsPerPage(size)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      itemsPerPage === size
                        ? 'text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    style={
                      itemsPerPage === size ? { backgroundColor: primaryColor } : undefined
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <span className="px-2.5 py-1 font-bold text-slate-800">
                  Página {safeCurrentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-500">
              {isMultiLevelCollege ? (
                <span>
                  Entradas por nivel:{' '}
                  {allowedCollegeLevels.map((lvl, i) => (
                    <React.Fragment key={lvl}>
                      {i > 0 && ' · '}
                      <strong>
                        {lvl}: {levelStartTimes[lvl]} hrs
                      </strong>
                    </React.Fragment>
                  ))}{' '}
                  · Tolerancia: <strong>{toleranceMinutes} min</strong>
                </span>
              ) : (
                <span>
                  Hora programada: <strong>{startTime} hrs</strong> · Tolerancia:{' '}
                  <strong>{toleranceMinutes} min</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
