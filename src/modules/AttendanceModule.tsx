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
} from 'lucide-react';
import jsQR from 'jsqr';
import { Student, AttendanceRecord, UserRole } from '../types';

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
  } = useApp();

  // Role permissions
  const userRole = currentUser.rol as UserRole;
  const isTeacher = userRole === 'docente';
  const canStartTotem = ['superusuario', 'administrador', 'directivo', 'coordinador', 'prefecto'].includes(userRole);
  const canConfigureTolerance = ['superusuario', 'administrador', 'directivo', 'coordinador', 'supervisor'].includes(userRole);

  // College teachers list
  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege?.id);

  // Active teacher selected for attendance (auto-linked if logged in as docente)
  const defaultTeacher = useMemo(() => {
    if (isTeacher) {
      return (
        collegeTeachers.find(
          (t) =>
            t.correo.toLowerCase() === currentUser.correo.toLowerCase() ||
            t.nombre.toLowerCase() === currentUser.nombre.toLowerCase()
        ) || collegeTeachers[0]
      );
    }
    return collegeTeachers[0];
  }, [isTeacher, currentUser.correo, currentUser.nombre, collegeTeachers.length]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacher?.id || 'todos');
  const [filterByAssignedTeacherOnly, setFilterByAssignedTeacherOnly] = useState<boolean>(false);

  // Group and Class selections
  const [selectedGrado, setSelectedGrado] = useState<string>('3°');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('A');
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

  // Generate the 5 days of the current week (Lunes a Viernes)
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    for (let i = 0; i < 5; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        index: i,
        name: dayNames[i],
        date: d,
        iso,
        label: `${dayNames[i]} ${d.getDate()}`,
        isToday: new Date().toISOString().split('T')[0] === iso,
      });
    }
    return days;
  }, [currentWeekMonday]);

  const activeDateIso = weekDays[selectedDayIndex]?.iso || new Date().toISOString().split('T')[0];

  // Tolerance Configuration (Configurable by Admin, Director, Coordinator, Supervisor)
  const [startTime, setStartTime] = useState<string>('08:00'); // Hora programada de clase/colegio
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(10); // Minutos a los que es retardo
  const [isToleranceConfigOpen, setIsToleranceConfigOpen] = useState<boolean>(false);

  // Totem (Kiosk) Fullscreen Mode for Admins/Directors/Coordinators/Prefects
  const [isTotemActive, setIsTotemActive] = useState<boolean>(false);

  // Scanner Panel & Camera
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  // Real-time student row highlighting when scanned
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Last scan feedback result
  interface ScanResult {
    student: Student;
    status: 'presente' | 'retardo' | 'advertencia';
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

  const availableGrados = Array.from(new Set(collegeStudents.map((s) => s.grado))).sort();
  const availableGrupos = Array.from(new Set(collegeStudents.map((s) => s.grupo))).sort();

  const activeTeacherObj = collegeTeachers.find((t) => t.id === selectedTeacherId) || defaultTeacher;

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

  // Class students list (filtered by Grado/Grupo or by any Assigned Teacher in Control Escolar)
  const currentClassStudents = collegeStudents.filter((s) => {
    const assignedTeachers = getStudentAssignedTeachers(s);
    const isTeacherInGroup =
      s.docenteId === selectedTeacherId ||
      assignedTeachers.some((t) => t.id === selectedTeacherId);
    if (filterByAssignedTeacherOnly && selectedTeacherId !== 'todos') {
      return isTeacherInGroup;
    }
    const matchGroup = s.grado === selectedGrado && s.grupo === selectedGrupo;
    if (selectedTeacherId !== 'todos' && filterByAssignedTeacherOnly) {
      return matchGroup && isTeacherInGroup;
    }
    return matchGroup;
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

  // Helper to determine if current time is late according to configured tolerance
  const calculateAttendanceStatus = (): 'presente' | 'retardo' => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const diff = currentTotalMinutes - startTotalMinutes;
    if (diff > toleranceMinutes) {
      return 'retardo';
    }
    return 'presente';
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
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const computedStatus = calculateAttendanceStatus();
    const studentAssignedTeachers = getStudentAssignedTeachers(targetStudent);
    const studentAssignedTeacher = studentAssignedTeachers[0];
    const effectiveTeacherName =
      activeTeacherObj?.nombre ||
      studentAssignedTeacher?.nombre ||
      targetStudent.docenteNombre ||
      currentUser.nombre;

    // Mode A: Docente Asignado en el Aula
    if (mode === 'clase') {
      // Automatically switch view to the student's grade & group if scanning a student assigned to ANY of the teachers of that group
      const isAssignedToCurrentTeacher =
        selectedTeacherId === 'todos' ||
        targetStudent.docenteId === selectedTeacherId ||
        studentAssignedTeachers.some((t) => t.id === selectedTeacherId);

      const belongsToClass =
        (targetStudent.grado === selectedGrado && targetStudent.grupo === selectedGrupo) ||
        (filterByAssignedTeacherOnly && isAssignedToCurrentTeacher);

      if (!belongsToClass && isAssignedToCurrentTeacher) {
        // Auto-sync the grade & group selector to the scanned student's group so the teacher can scan any of their assigned students seamlessly
        setSelectedGrado(targetStudent.grado);
        setSelectedGrupo(targetStudent.grupo);
      } else if (!belongsToClass && !isAssignedToCurrentTeacher) {
        playBeep('error');
        setLastScan({
          student: targetStudent,
          status: 'advertencia',
          message: `⚠️ Alumno de ${targetStudent.grado} "${targetStudent.grupo}" asignado a ${
            targetStudent.docenteNombre || studentAssignedTeacher?.nombre || 'otro docente'
          }. No corresponde al grupo/docente actual.`,
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
            ? `⚠️ Retardo registrado (> ${toleranceMinutes} min de tolerancia).`
            : `✓ Asistencia registrada a tiempo en ${selectedMateria}.`,
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
            ? `Ingreso con retardo (> ${toleranceMinutes} min). Tutor notificado.`
            : '¡Ingreso puntual al plantel! Notificación enviada al tutor.',
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

  // Highlight row and smooth scroll
  const highlightAndScrollStudent = (studentId: string) => {
    setHighlightedStudentId(studentId);
    setTimeout(() => {
      const row = studentRowRefs.current[studentId];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Remove highlight after 4 seconds
    setTimeout(() => {
      setHighlightedStudentId((prev) => (prev === studentId ? null : prev));
    }, 4500);
  };

  // Manual Toggle / Cycle of Attendance Status for a Student on a specific Date
  const handleCycleManualStatus = (student: Student, dateIso: string) => {
    const existing = attendanceRecords.find(
      (a) =>
        a.colegioId === activeCollege.id &&
        a.estudianteId === student.id &&
        a.fecha === dateIso &&
        a.tipo === 'clase' &&
        a.materiaNombre === selectedMateria
    );

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!existing) {
      // Create as 'presente'
      addAttendanceRecord({
        colegioId: activeCollege.id,
        estudianteId: student.id,
        estudianteNombre: `${student.nombre} ${student.apellidos}`,
        matricula: student.matricula,
        grado: student.grado,
        grupo: student.grupo,
        foto: student.foto,
        fecha: dateIso,
        hora: timeFormatted,
        tipo: 'clase',
        materiaNombre: selectedMateria,
        docenteNombre: currentUser.nombre,
        estado: 'presente',
        metodo: 'manual',
        registradoPor: `${currentUser.nombre} (${currentUser.cargo || 'Docente'})`,
        tutorNotificado: false,
      });
      playBeep('success');
    } else {
      // Cycle: presente -> retardo -> falta -> justificado -> delete (vacío)
      const cycleMap: Record<string, 'retardo' | 'falta' | 'justificado' | 'borrar'> = {
        presente: 'retardo',
        retardo: 'falta',
        falta: 'justificado',
        justificado: 'borrar',
      };

      const next = cycleMap[existing.estado];
      if (next === 'borrar') {
        deleteAttendanceRecord(existing.id);
      } else {
        updateAttendanceRecord(existing.id, {
          estado: next,
          metodo: 'manual',
        });
      }
    }
  };

  // Quick action: Mark all students in current class as Present for active day
  const handleMarkAllPresent = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
        addAttendanceRecord({
          colegioId: activeCollege.id,
          estudianteId: student.id,
          estudianteNombre: `${student.nombre} ${student.apellidos}`,
          matricula: student.matricula,
          grado: student.grado,
          grupo: student.grupo,
          foto: student.foto,
          fecha: activeDateIso,
          hora: timeFormatted,
          tipo: 'clase',
          materiaNombre: selectedMateria,
          docenteNombre: currentUser.nombre,
          estado: 'presente',
          metodo: 'manual',
          registradoPor: `${currentUser.nombre} (Pase Masivo)`,
          tutorNotificado: false,
        });
      } else if (existing.estado !== 'presente') {
        updateAttendanceRecord(existing.id, {
          estado: 'presente',
          metodo: 'manual',
        });
      }
    });

    playBeep('success');
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador no soporta cámara');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('No se pudo acceder a la cámara. Puedes ingresar matrículas o usar pistola USB.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
            title="Configurar minutos de retardo y hora de inicio"
          >
            <Settings className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Tolerancia ({toleranceMinutes} min)</span>
          </button>
        )}

        {canStartTotem && (
          <button
            onClick={() => {
              setIsTotemActive(true);
              setIsScannerOpen(true);
              startCamera();
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
            setIsScannerOpen(!isScannerOpen);
            if (!isScannerOpen) {
              startCamera();
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
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-amber-950 flex items-center gap-1.5">
                Configuración de Tolerancia de Retardo
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-bold">
                  Solo Dirección / Coordinación
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Establece la hora programada y los minutos permitidos antes de catalogar la
                asistencia como "Retardo".
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-600">Hora de Inicio:</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-600">Minutos Tolerancia:</span>
              <select
                value={toleranceMinutes}
                onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
              >
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
              </select>
            </div>

            <button
              onClick={() => setIsToleranceConfigOpen(false)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Guardar
            </button>
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

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-300">
                Tolerancia: {toleranceMinutes} min (después de {startTime})
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
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

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
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Muestra tu credencial frente al lente</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
                        stopCamera();
                        setTimeout(startCamera, 300);
                      }}
                      className="px-2.5 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-200"
                    >
                      Voltear Cámara
                    </button>
                  </div>
                </div>
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
                    <img
                      src={
                        lastScan.student.foto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={lastScan.student.nombre}
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

              <button
                onClick={() => {
                  setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
                  stopCamera();
                  setTimeout(startCamera, 300);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1"
                title="Girar cámara"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Girar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Video Box */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full relative aspect-video max-h-[260px] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

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
              </div>

              {cameraError && (
                <div className="mt-2 text-xs text-red-400 bg-red-950/60 border border-red-900 p-2 rounded-xl w-full text-center">
                  {cameraError}
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
                    <img
                      src={
                        lastScan.student.foto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={lastScan.student.nombre}
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
        {/* Row 1: Class Filters + Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Docente Asignado Selector */}
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-semibold text-indigo-800">Docente Asignado:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTeacherId(val);
                  const tch = collegeTeachers.find((t) => t.id === val);
                  if (tch && tch.materias.length > 0) {
                    setSelectedMateria(tch.materias[0]);
                  }
                }}
                className="text-xs font-bold text-indigo-950 bg-transparent focus:outline-hidden max-w-[210px]"
              >
                <option value="todos">Todos los Docentes</option>
                {collegeTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeacherId !== 'todos' && (
              <button
                type="button"
                onClick={() => setFilterByAssignedTeacherOnly(!filterByAssignedTeacherOnly)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  filterByAssignedTeacherOnly
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Mostrar todos los alumnos asignados a este docente en el listado general de Control Escolar"
              >
                {filterByAssignedTeacherOnly ? '✓ Mis Alumnos Asignados' : 'Filtrar por Docente Asignado'}
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Grado:</span>
              <select
                value={selectedGrado}
                onChange={(e) => setSelectedGrado(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
              >
                {availableGrados.map((g) => (
                  <option key={g} value={g}>
                    Grado {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Grupo:</span>
              <select
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden"
              >
                {availableGrupos.map((grp) => (
                  <option key={grp} value={grp}>
                    Grupo "{grp}"
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Materia:</span>
              <select
                value={selectedMateria}
                onChange={(e) => setSelectedMateria(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden max-w-[220px]"
              >
                {collegeSubjects.length > 0 ? (
                  collegeSubjects.map((sub) => (
                    <option key={sub.id} value={sub.nombre}>
                      {sub.nombre}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Matemáticas III">Matemáticas III</option>
                    <option value="Español y Literatura">Español y Literatura</option>
                    <option value="Historia de México">Historia de México</option>
                  </>
                )}
              </select>
            </div>
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
              className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
              title="Marcar como presentes a todos los alumnos de este grupo hoy"
            >
              + Marcar Todos Presentes
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
                setCurrentWeekMonday(next);
              }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Semana siguiente"
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

          {/* Search student in table */}
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

          <div className="text-[11px] text-slate-500">
            💡 <em>Haz clic en cualquier casilla para cambiar el estado manualmente</em>
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
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`py-3 px-3 text-center min-w-[100px] cursor-pointer transition-colors ${
                      selectedDayIndex === idx
                        ? 'bg-teal-50 text-teal-900 border-b-2 border-teal-600'
                        : 'hover:bg-slate-200/60'
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
                    </div>
                  </th>
                ))}

                <th className="py-3.5 px-4 text-center w-28">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron alumnos para {selectedGrado} "{selectedGrupo}".
                  </td>
                </tr>
              ) : (
                displayedStudents.map((st, index) => {
                  const isHighlighted = highlightedStudentId === st.id;

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
                        {index + 1}
                      </td>

                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={st.foto || activeCollege.escudoUrl}
                            onError={(e) => {
                              e.currentTarget.src = activeCollege.escudoUrl;
                            }}
                            alt={st.nombre}
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

                        return (
                          <td
                            key={day.iso}
                            className={`py-2 px-2 text-center transition-colors ${
                              selectedDayIndex === day.index ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCycleManualStatus(st, day.iso)}
                              className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs transition-all active:scale-95 shadow-2xs flex items-center justify-center gap-1 ${
                                estado === 'presente'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                  : estado === 'retardo'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                  : estado === 'falta'
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                                  : estado === 'justificado'
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
                                  : 'bg-slate-100/70 text-slate-400 hover:bg-slate-200 hover:text-slate-700 border border-dashed border-slate-300'
                              }`}
                              title={
                                record
                                  ? `${estado?.toUpperCase()} - Registrado a las ${record.hora || 'S/H'} vía ${record.metodo}`
                                  : 'Clic para marcar asistencia'
                              }
                            >
                              {estado === 'presente' && <span>P</span>}
                              {estado === 'retardo' && <span>R</span>}
                              {estado === 'falta' && <span>F</span>}
                              {estado === 'justificado' && <span>J</span>}
                              {!estado && <span>-</span>}
                            </button>
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

        {/* Footer with summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando <strong>{displayedStudents.length}</strong> alumnos en {selectedGrado} "{selectedGrupo}"
            ({selectedMateria}).
          </div>
          <div className="text-[11px]">
            Hora programada: <strong>{startTime} hrs</strong> · Tolerancia: <strong>{toleranceMinutes} min</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
