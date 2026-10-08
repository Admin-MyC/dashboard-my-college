import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Printer,
  Award,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  UserCheck,
  Users2,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Check,
  QrCode,
  Download,
  KeyRound,
  Copy,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import { StudentQrSheetsModal } from '../components/StudentQrSheetsModal';
import { StudentCredentialsModal } from '../components/StudentCredentialsModal';
import { StudentExcelExportModal } from '../components/StudentExcelExportModal';
import { StudentCsvImportModal } from '../components/StudentCsvImportModal';
import { compressImageFile } from '../utils/imageCompressor';

export const StudentsModule: React.FC = () => {
  const {
    activeCollege,
    students,
    teachers,
    addStudent,
    addStudentsBulk,
    updateStudent,
    deleteStudent,
    addUser,
    users,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    getGroupsForCollegeLevel,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('todos');
  const [gradeFilter, setGradeFilter] = useState('todos');
  const [teacherFilter, setTeacherFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setLevelFilter('todos');
    setGradeFilter('todos');
    setTeacherFilter('todos');
    setStatusFilter('todos');
    setSelectedStudentIds([]);
    setCurrentPage(1);
  }, [activeCollege?.id]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, levelFilter, gradeFilter, teacherFilter, statusFilter, itemsPerPage, selectedCampusId]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [assignGroupStudent, setAssignGroupStudent] = useState<Student | null>(null);
  const [selectedGroupToAssign, setSelectedGroupToAssign] = useState('A');
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState('');
  const [groupAssignSuccess, setGroupAssignSuccess] = useState(false);

  // Student QR Code States
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [createdStudentCredentials, setCreatedStudentCredentials] = useState<{
    student: Student;
    username: string;
    password: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [studentQrMap, setStudentQrMap] = useState<Record<string, string>>({});

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formNivel, setFormNivel] = useState<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'>('Primaria');
  const [formGrado, setFormGrado] = useState('1°');
  const [formGrupo, setFormGrupo] = useState('A');
  const [formMatricula, setFormMatricula] = useState('');
  const [formCurp, setFormCurp] = useState('');
  const [formTutorNombre, setFormTutorNombre] = useState('');
  const [formTutorTel, setFormTutorTel] = useState('');
  const [formTutorEmail, setFormTutorEmail] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Niveles permitidos según el tipo de colegio (si es Multinivel / Colegio Integral muestra todos los niveles)
  const getAllowedLevelsForCollege = (
    collegeNivel?: string
  ): ('Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria')[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    // Para Multinivel / Colegio Integral o general, habilitar todos los niveles
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };

  const allowedLevels = getAllowedLevelsForCollege(activeCollege?.nivel);
  const isMultinivelCollege = allowedLevels.length > 1;

  // Helper to resolve effective level of a student
  const getStudentLevel = (
    st: Student
  ): 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' => {
    if (st.nivel && allowedLevels.includes(st.nivel)) {
      return st.nivel;
    }
    if (st.nivel) return st.nivel;
    if (!isMultinivelCollege) {
      return allowedLevels[0] || 'Primaria';
    }
    // Fallback deterministic assignment for legacy students without nivel in a multinivel college
    if (st.grado === '4°' || st.grado === '5°' || st.grado === '6°') {
      return 'Primaria';
    }
    return allowedLevels[0] || 'Primaria';
  };

  const getGradesForLevel = (
    nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'
  ): string[] => {
    if (nivel === 'Primaria') {
      return ['1°', '2°', '3°', '4°', '5°', '6°'];
    }
    return ['1°', '2°', '3°'];
  };

  // Edit Student Form State
  const [editFoto, setEditFoto] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editNivel, setEditNivel] = useState<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'>('Primaria');
  const [editGrado, setEditGrado] = useState('1°');
  const [editGrupo, setEditGrupo] = useState('A');
  const [editDocenteId, setEditDocenteId] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editCurp, setEditCurp] = useState('');
  const [editPromedio, setEditPromedio] = useState('9.0');
  const [editEstatus, setEditEstatus] = useState<'activo' | 'baja' | 'condicionado' | 'pendiente' | 'inscrito'>('activo');
  const [editTutorNombre, setEditTutorNombre] = useState('');
  const [editTutorTel, setEditTutorTel] = useState('');
  const [editTutorEmail, setEditTutorEmail] = useState('');

  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege?.id);

  // Helper to resolve ALL teachers assigned to a specific (nivel, grado, grupo)
  const getTeachersByGroup = (
    nivel: string,
    grado: string,
    grupo: string
  ) => {
    const cleanLevel = (nivel || '').trim().toLowerCase();
    const cleanGroup = grupo.replace(/["']/g, '').trim().toUpperCase();
    const cleanGradeGroup = `${grado} ${cleanGroup}`.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanFullGroup = `${nivel} ${grado} ${cleanGroup}`.replace(/\s+/g, ' ').trim().toLowerCase();

    const matched = collegeTeachers.filter((t) => {
      const tchLevel = (t.nivel || '').trim().toLowerCase();
      if (tchLevel && cleanLevel && tchLevel !== cleanLevel) return false;
      const inGroups = (t.grupos || []).some((g) => {
        const norm = g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        return norm === cleanFullGroup || norm === cleanGradeGroup;
      });
      const isTutorOfGroup =
        Boolean(t.esTutorPrincipal) &&
        Boolean(t.grupoTutorado) &&
        t.grupoTutorado!.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
          cleanGradeGroup;
      return inGroups || isTutorOfGroup;
    });

    // Sort so Tutor Principal of this group appears first
    return matched.sort((a, b) => {
      const aIsTutor =
        Boolean(a.esTutorPrincipal) &&
        (a.grupoTutorado || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
          cleanGradeGroup;
      const bIsTutor =
        Boolean(b.esTutorPrincipal) &&
        (b.grupoTutorado || '').replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
          cleanGradeGroup;
      if (aIsTutor && !bIsTutor) return -1;
      if (!aIsTutor && bIsTutor) return 1;
      return 0;
    });
  };

  // Helper to resolve primary/first teacher assigned to a specific (nivel, grado, grupo)
  const getTeacherByGroup = (
    nivel: string,
    grado: string,
    grupo: string
  ) => {
    const all = getTeachersByGroup(nivel, grado, grupo);
    return all[0];
  };

  // Helper to resolve ALL assigned teachers for a student (when multiple teachers share the same group, all can take attendance)
  const getStudentAssignedTeachers = (st: Student) => {
    const stLevel = getStudentLevel(st);
    const byGroup = getTeachersByGroup(stLevel, st.grado, st.grupo);
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

  // Helper to resolve primary assigned teacher for a student
  const getStudentAssignedTeacher = (st: Student) => {
    const all = getStudentAssignedTeachers(st);
    return all[0];
  };

  // Helper to resolve linked tutor for a student (linked once tutor registers via Link/QR and searches by CURP)
  const getStudentLinkedTutor = (
    st: Student
  ): { nombre: string; telefono: string; correo: string } | null => {
    const cleanCurp = (st.curp || '').trim().toUpperCase();
    const linkedTutorUser = users.find((u) => {
      if (u.rol !== 'tutor') return false;
      if (u.colegioId && activeCollege && u.colegioId !== activeCollege.id) return false;
      if (st.tutorId && u.id === st.tutorId) return true;
      if (Array.isArray(u.hijosIds) && u.hijosIds.includes(st.id)) return true;
      if (
        cleanCurp &&
        cleanCurp !== 'XXXX000000XXXXXX00' &&
        Array.isArray(u.curpsAsociadas) &&
        u.curpsAsociadas.some((c) => c.trim().toUpperCase() === cleanCurp)
      ) {
        return true;
      }
      return false;
    });

    if (linkedTutorUser) {
      return {
        nombre: linkedTutorUser.nombre,
        telefono: linkedTutorUser.telefono || st.tutorTelefono || '',
        correo: linkedTutorUser.correo || st.tutorCorreo || '',
      };
    }

    if (st.tutorNombre && st.tutorNombre.trim().length > 0) {
      return {
        nombre: st.tutorNombre.trim(),
        telefono: (st.tutorTelefono || '').trim(),
        correo: (st.tutorCorreo || '').trim(),
      };
    }

    return null;
  };

  const handleStartEditStudent = (st: Student) => {
    const resolvedTeacher = getStudentAssignedTeacher(st);
    const resolvedTutor = getStudentLinkedTutor(st);
    setEditingStudent(st);
    setEditFoto(st.foto || '');
    setEditNombre(st.nombre);
    setEditApellidos(st.apellidos);
    setEditNivel(getStudentLevel(st));
    setEditGrado(st.grado);
    setEditGrupo(st.grupo);
    setEditDocenteId(resolvedTeacher?.id || st.docenteId || '');
    setEditMatricula(st.matricula);
    setEditCurp(st.curp);
    setEditPromedio(st.promedio.toString());
    setEditEstatus(st.estatus);
    setEditTutorNombre(resolvedTutor?.nombre || '');
    setEditTutorTel(resolvedTutor?.telefono || '');
    setEditTutorEmail(resolvedTutor?.correo || '');
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const finalFoto = editFoto.trim() || activeCollege?.escudoUrl || '';
    const matchedGroupTeacher = getTeacherByGroup(editNivel, editGrado, editGrupo);
    const chosenTeacher =
      collegeTeachers.find((t) => t.id === editDocenteId) || matchedGroupTeacher;
    updateStudent(editingStudent.id, {
      nombre: editNombre.trim(),
      apellidos: editApellidos.trim(),
      nivel: editNivel,
      grado: editGrado,
      grupo: editGrupo,
      docenteId: chosenTeacher?.id || undefined,
      docenteNombre: chosenTeacher?.nombre || undefined,
      matricula: editMatricula.trim(),
      curp: editCurp.toUpperCase().trim(),
      promedio: parseFloat(editPromedio) || 9.0,
      estatus: editEstatus,
      foto: finalFoto,
    });
    setEditingStudent(null);
  };

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;
  const activeCampusObj = hasMultipleCampuses
    ? collegeCampuses.find((c) => c.id === selectedCampusId) || null
    : null;

  const collegeStudentsAll = React.useMemo(
    () => students.filter((s) => s.colegioId === activeCollege.id),
    [students, activeCollege.id]
  );
  const collegeStudents = React.useMemo(
    () =>
      hasMultipleCampuses && selectedCampusId
        ? collegeStudentsAll.filter((s) => s.campusId === selectedCampusId)
        : collegeStudentsAll,
    [collegeStudentsAll, hasMultipleCampuses, selectedCampusId]
  );

  // Pre-compute student count per level once instead of re-filtering inside each level button
  const levelCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      Preescolar: 0,
      Primaria: 0,
      Secundaria: 0,
      Preparatoria: 0,
    };
    for (const st of collegeStudents) {
      const lvl = getStudentLevel(st);
      counts[lvl] = (counts[lvl] || 0) + 1;
    }
    return counts;
  }, [collegeStudents, allowedLevels]);

  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Helper to resolve or auto-generate student username (1ra letra nombre + apellido + 4 dígitos)
  const getStudentUsername = (st: Student): string => {
    if (st.usuarioLogin) return st.usuarioLogin;
    const matchingUser = users.find(
      (u) =>
        u.estudianteId === st.id ||
        u.correo?.startsWith(st.matricula.toLowerCase())
    );
    if (matchingUser?.usuarioLogin) return matchingUser.usuarioLogin;

    const cleanFirst =
      (st.nombre.trim().split(/\s+/)[0] || 'a')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .charAt(0) || 'a';
    const cleanSurname = (st.apellidos.trim().split(/\s+/)[0] || 'alumno')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    let hash = 0;
    const seed = st.id + st.matricula;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 9000;
    }
    const digits4 = Math.abs(hash) + 1000;
    return `${cleanFirst}${cleanSurname}${digits4}`;
  };

  // Helper to resolve or auto-generate student password (8 caracteres alfanuméricos + especiales)
  const getStudentPassword = (st: Student): string => {
    if (st.password && st.password !== 'admin123') return st.password;
    const matchingUser = users.find(
      (u) =>
        u.estudianteId === st.id ||
        (st.usuarioLogin && u.usuarioLogin === st.usuarioLogin)
    );
    if (matchingUser?.password && matchingUser.password !== 'admin123') {
      return matchingUser.password;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%&*!?';
    let pwd = '';
    const seed = st.matricula + st.curp + st.id;
    for (let i = 0; i < 8; i++) {
      const code = seed.charCodeAt(i % seed.length) + i * 17;
      pwd += chars.charAt(code % chars.length);
    }
    return pwd;
  };

  const filteredStudents = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return collegeStudents.filter((s) => {
      const studentLevel = getStudentLevel(s);
      const matchesLevel = levelFilter === 'todos' || studentLevel === levelFilter;
      if (!matchesLevel) return false;

      const matchesGrade = gradeFilter === 'todos' || s.grado === gradeFilter;
      if (!matchesGrade) return false;

      const matchesStatus = statusFilter === 'todos' || s.estatus === statusFilter;
      if (!matchesStatus) return false;

      const assignedTeachers = getStudentAssignedTeachers(s);
      const matchesTeacher =
        teacherFilter === 'todos' ||
        s.docenteId === teacherFilter ||
        assignedTeachers.some((t) => t.id === teacherFilter);
      if (!matchesTeacher) return false;

      if (!q) return true;

      const teacherNames = [
        s.docenteNombre || '',
        ...assignedTeachers.map((t) => t.nombre),
      ]
        .join(' ')
        .toLowerCase();
      const studentUsername = getStudentUsername(s);
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.apellidos.toLowerCase().includes(q) ||
        s.matricula.toLowerCase().includes(q) ||
        studentUsername.toLowerCase().includes(q) ||
        studentLevel.toLowerCase().includes(q) ||
        (s.tutorNombre || '').toLowerCase().includes(q) ||
        teacherNames.includes(q)
      );
    });
  }, [collegeStudents, searchQuery, levelFilter, gradeFilter, statusFilter, teacherFilter, collegeTeachers, users]);

  // Helper to get registered groups for a given level and grade from Materias y Grupos
  const getRegisteredGroupLettersForGrade = (
    nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria',
    grado: string
  ): string[] => {
    if (!activeCollege) return [];
    const registeredLabels = getGroupsForCollegeLevel(activeCollege.id, nivel);
    const cleanGrade = grado.trim();
    const letters: string[] = [];
    registeredLabels.forEach((lbl) => {
      const norm = lbl.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      if (norm.startsWith(cleanGrade + ' ')) {
        const grpPart = norm.slice(cleanGrade.length).trim().toUpperCase();
        if (grpPart && !letters.includes(grpPart)) {
          letters.push(grpPart);
        }
      }
    });
    return letters.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  };

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedStudents = React.useMemo(
    () => filteredStudents.slice(startIndex, startIndex + itemsPerPage),
    [filteredStudents, startIndex, itemsPerPage]
  );

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formApellidos.trim()) {
      alert('Nombre y apellidos son requeridos.');
      return;
    }

    // 1. Generate usuario: primer letra del primer nombre + apellido + 4 dígitos aleatorios
    const cleanFirst = (formNombre.trim().split(/\s+/)[0] || 'a')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .charAt(0) || 'a';
    const cleanSurname = (formApellidos.trim().split(/\s+/)[0] || 'alumno')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${cleanFirst}${cleanSurname}${random4}`;

    // 2. Generate password: 8 caracteres aleatoriamente números, letras y caracteres especiales comunes
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const specials = '@#$%&*!?';
    const allChars = letters + digits + specials;
    const passChars: string[] = [
      letters.charAt(Math.floor(Math.random() * letters.length)),
      letters.charAt(Math.floor(Math.random() * letters.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      specials.charAt(Math.floor(Math.random() * specials.length)),
    ];
    for (let i = 0; i < 3; i++) {
      passChars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }
    for (let i = passChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passChars[i], passChars[j]] = [passChars[j], passChars[i]];
    }
    const generatedPassword = passChars.join('');

    const studentId = 'std-' + Date.now();
    const matriculaVal =
      formMatricula.trim() ||
      `${activeCollege.codigoCCT.slice(4, 7)}-${new Date().getFullYear()}-${Math.floor(
        100 + Math.random() * 899
      )}`;

    // Final photo: if no image was uploaded, take the college shield as requested
    const finalStudentPhoto = formFoto.trim() || activeCollege.escudoUrl;

    const newStudentData: Student = {
      id: studentId,
      colegioId: activeCollege.id,
      campusId: selectedCampusId || collegeCampuses[0]?.id,
      nombre: formNombre.trim(),
      apellidos: formApellidos.trim(),
      nivel: formNivel,
      grado: formGrado,
      grupo: 'Sin Grupo',
      matricula: matriculaVal,
      curp: formCurp.toUpperCase().trim() || 'HERA080415HDFRRL01',
      tutorNombre: '',
      tutorTelefono: '',
      tutorCorreo: '',
      promedio: 0,
      estatus: 'pendiente',
      foto: finalStudentPhoto,
      fechaNacimiento: '2009-04-12',
      usuarioLogin: generatedUsername,
      password: generatedPassword,
    };

    addStudent(newStudentData);

    // Pre-generate QR for new student immediately (for teacher attendance module)
    const qrPayload = `https://dashboard.mycollege.com.mx/asistencia?alumno=${encodeURIComponent(
      matriculaVal
    )}&sid=${encodeURIComponent(studentId)}&colegio=${encodeURIComponent(
      activeCollege.id
    )}&curp=${encodeURIComponent(newStudentData.curp)}&grado=${encodeURIComponent(
      newStudentData.grado
    )}&grupo=${encodeURIComponent(newStudentData.grupo)}&docente=`;
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: { dark: '#0B2545', light: '#FFFFFF' },
    }).then((url) => {
      setStudentQrMap((prev) => ({ ...prev, [studentId]: url }));
    });

    // 3. Create Alumno user so they can log in and see Mis Tareas, Mis Exámenes, Mis Comunicados, Mi Biblioteca
    addUser({
      nombre: `${formNombre.trim()} ${formApellidos.trim()}`,
      correo: `${generatedUsername}@alumno.${(activeCollege.codigoCCT || activeCollege.id).toLowerCase()}.edu.mx`,
      usuarioLogin: generatedUsername,
      password: generatedPassword,
      rol: 'alumno',
      colegioId: activeCollege.id,
      cargo: `Alumno (${formNivel} · ${formGrado})`,
      avatar: newStudentData.foto,
      activo: true,
      estudianteId: studentId,
    });

    setCreatedStudentCredentials({
      student: newStudentData,
      username: generatedUsername,
      password: generatedPassword,
    });

    // Reset
    setFormNombre('');
    setFormApellidos('');
    setFormMatricula('');
    setFormCurp('');
    setFormTutorNombre('');
    setFormTutorTel('');
    setFormTutorEmail('');
    setFormFoto('');
    setIsAddModalOpen(false);
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Control Escolar · Padrón Estudiantil
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25">
              {isMultinivelCollege
                ? `Multinivel (${allowedLevels.join(', ')})`
                : `Nivel: ${allowedLevels[0]}`}
            </span>
            {activeCampusObj && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-amber-200 border border-white/20">
                Sede: {activeCampusObj.nombre}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6" style={{ color: goldColor }} />
            Población Estudiantil y Control Escolar
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre}
            {activeCampusObj ? ` · Administrando ${activeCampusObj.nombre}` : ' · Vista General del Colegio'} · Directorio de alumnos, promedios y emisión de boletas oficiales
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {hasMultipleCampuses && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="text-left">
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

          <button
            type="button"
            onClick={() => setIsCsvImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all active:scale-98 cursor-pointer"
            title="Importar listado de alumnos en formato .csv y descargar plantilla de ejemplo"
          >
            <Upload className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Importar Alumnos (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Exportar lista de alumnos con usuarios y contraseñas a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Credenciales (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all active:scale-98 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Hojas QR (5x5 cm)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Seleccionados ({selectedStudentIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFormFoto('');
              const defaultLevel = allowedLevels[0] || 'Primaria';
              setFormNivel(defaultLevel);
              setFormGrado('1°');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Inscribir Nuevo Alumno</span>
          </button>
        </div>
      </div>

      {/* Niveles Educativos del Colegio (Muestra todos los niveles que el colegio maneje) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {isMultinivelCollege
              ? 'Niveles del Colegio (Multinivel):'
              : `Nivel Educativo del Colegio (${allowedLevels[0]}):`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMultinivelCollege && (
            <button
              type="button"
              onClick={() => setLevelFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                levelFilter === 'todos'
                  ? 'text-white shadow-xs border-transparent'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              style={
                levelFilter === 'todos'
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              <span>Todos los Niveles</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  levelFilter === 'todos'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {collegeStudents.length}
              </span>
            </button>
          )}

          {allowedLevels.map((lvl) => {
            const countInLevel = levelCounts[lvl] || 0;
            const isSelected =
              levelFilter === lvl || (!isMultinivelCollege && levelFilter === 'todos');
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  if (!isMultinivelCollege) return;
                  setLevelFilter(levelFilter === lvl ? 'todos' : lvl);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'text-white shadow-xs border-transparent'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: primaryColor }
                    : undefined
                }
              >
                <span>{lvl}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {countInLevel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, matrícula, nivel, docente o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            {isMultinivelCollege ? (
              <option value="todos">Todos los Niveles</option>
            ) : (
              <option value="todos">Nivel: {allowedLevels[0]}</option>
            )}
            {allowedLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                Nivel: {lvl}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los Grados</option>
            <option value="1°">1° Grado</option>
            <option value="2°">2° Grado</option>
            <option value="3°">3° Grado</option>
            <option value="4°">4° Grado</option>
            <option value="5°">5° Grado</option>
            <option value="6°">6° Grado</option>
          </select>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[200px]"
          >
            <option value="todos">Todos los Docentes</option>
            {collegeTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                Docente: {t.nombre}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los Estatus</option>
            <option value="activo">Estatus: Activo</option>
            <option value="inscrito">Estatus: Inscrito</option>
            <option value="pendiente">Estatus: Pendiente de Pago</option>
            <option value="condicionado">Estatus: Condicionado</option>
            <option value="baja">Estatus: Baja</option>
          </select>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-600">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              title="Cantidad de alumnos a visualizar por lista"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-9">
                  <input
                    type="checkbox"
                    checked={
                      paginatedStudents.length > 0 &&
                      paginatedStudents.every((st) => selectedStudentIds.includes(st.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pageIds = paginatedStudents.map((st) => st.id);
                        setSelectedStudentIds((prev) =>
                          Array.from(new Set([...prev, ...pageIds]))
                        );
                      } else {
                        const pageSet = new Set(paginatedStudents.map((st) => st.id));
                        setSelectedStudentIds((prev) => prev.filter((id) => !pageSet.has(id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    title="Seleccionar o deseleccionar los alumnos de esta página"
                  />
                </th>
                <th className="py-3.5 px-3 min-w-[200px]">Alumno & Matrícula</th>
                <th className="py-3.5 px-3 min-w-[165px]">Acceso Plataforma</th>
                <th className="py-3.5 px-3 min-w-[175px]">Nivel, Grado y Grupo</th>
                <th className="py-3.5 px-3 min-w-[215px]">Docente Asignado (QR)</th>
                <th className="py-3.5 px-3 min-w-[160px]">Tutor Legal</th>
                <th className="py-3.5 px-3 text-center">Prom.</th>
                <th className="py-3.5 px-3 min-w-[150px]">Estatus</th>
                <th className="py-3.5 pl-3 pr-4 text-right min-w-[175px]">Boleta & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => {
                  const assignedTeachers = getStudentAssignedTeachers(s);
                  const assignedTeacher = assignedTeachers[0];
                  const resolvedUsername = getStudentUsername(s);
                  const resolvedPassword = getStudentPassword(s);
                  const isRowSelected = selectedStudentIds.includes(s.id);
                  const isBaja = s.estatus === 'baja';
                  const studentLevel = getStudentLevel(s);
                  const hasNoGroup =
                    !s.grupo ||
                    s.grupo === 'Sin Grupo' ||
                    s.grupo.includes('Sin Grupo') ||
                    s.grupo.includes('Pendiente');
                  const cleanStudentGroupLabel = `${s.grado} ${s.grupo}`
                    .replace(/["']/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();
                  return (
                  <tr
                    key={s.id}
                    onClick={() => handleStartEditStudent(s)}
                    title="Haz clic sobre el registro para editar datos, foto, grupo y docente"
                    className={`hover:bg-indigo-50/40 transition-colors align-middle cursor-pointer ${
                      isRowSelected ? 'bg-rose-50/40' : isBaja ? 'bg-slate-50/60 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds((prev) => [...prev, s.id]);
                          } else {
                            setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        title={`Seleccionar a ${s.nombre} ${s.apellidos}`}
                      />
                    </td>
                    {/* Student Photo & Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative group cursor-pointer shrink-0"
                          title="Clic para editar datos, grupo, docentes y foto del alumno"
                        >
                          <img
                            src={s.foto || activeCollege.escudoUrl}
                            onError={(e) => {
                              e.currentTarget.src = activeCollege.escudoUrl;
                            }}
                            alt={s.nombre}
                            className={`w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs bg-white ${
                              isBaja ? 'grayscale' : ''
                            }`}
                          />
                          <span className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Upload className="w-3 h-3" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`font-bold text-xs sm:text-sm truncate max-w-[180px] ${
                              isBaja ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                            title={`${s.apellidos}, ${s.nombre}`}
                          >
                            {s.apellidos}, {s.nombre}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {s.matricula}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Usuario & Contraseña */}
                    <td className="py-3.5 px-3">
                      {isBaja ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                          <X className="w-3 h-3 shrink-0" />
                          <span>Acceso suspendido</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 max-w-[175px]">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[9px] font-bold uppercase text-slate-400">
                                Usr:
                              </span>
                              <span className="font-mono font-bold text-[11px] text-amber-950 truncate">
                                {resolvedUsername}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  `Alumno: ${s.nombre} ${s.apellidos}\nUsuario: ${resolvedUsername}\nContraseña: ${resolvedPassword}`
                                );
                                setCopiedStudentId(s.id);
                                setTimeout(() => setCopiedStudentId(null), 2000);
                              }}
                              className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-slate-700 cursor-pointer shrink-0 transition-colors"
                              title="Copiar credenciales del alumno"
                            >
                              {copiedStudentId === s.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold uppercase text-slate-400">
                              Pass:
                            </span>
                            <span className="font-mono font-semibold text-[11px] text-slate-600">
                              {resolvedPassword}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Grade & Group */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {studentLevel}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {s.grado}
                          </span>
                          {!hasNoGroup && (
                            <span className="font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md text-[11px]">
                              Grupo "{s.grupo}"
                            </span>
                          )}
                        </div>

                        {s.estatus === 'pendiente' && hasNoGroup ? (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Sin grupo (Pendiente de pago)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const avail = getRegisteredGroupLettersForGrade(studentLevel, s.grado);
                              setAssignGroupStudent(s);
                              setSelectedGroupToAssign(
                                !hasNoGroup && avail.includes(s.grupo)
                                  ? s.grupo
                                  : avail[0] || ''
                              );
                              setSelectedTeacherToAssign(s.docenteId || assignedTeacher?.id || '');
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                              hasNoGroup
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200'
                            }`}
                          >
                            <Users2 className="w-3 h-3" />
                            <span>
                              {hasNoGroup ? 'Asignar Grupo' : 'Cambiar Grupo'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Docente Asignado (Todos los docentes del grupo pueden tomar asistencia QR) */}
                    <td className="py-3.5 px-3">
                      {hasNoGroup ? (
                        <div className="text-[11px] text-slate-400 italic">
                          Pendiente de asignar grupo
                        </div>
                      ) : assignedTeachers.length > 0 ? (
                        <div className="space-y-1 max-w-[230px]">
                          <div className="flex flex-col gap-1">
                            {assignedTeachers.slice(0, 2).map((tch) => {
                              const isGroupTutor =
                                Boolean(tch.esTutorPrincipal) &&
                                (tch.grupoTutorado || '')
                                  .replace(/["']/g, '')
                                  .replace(/\s+/g, ' ')
                                  .trim()
                                  .toLowerCase() === cleanStudentGroupLabel;
                              return (
                                <div
                                  key={tch.id}
                                  className={`inline-flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    isGroupTutor
                                      ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200'
                                      : 'bg-slate-50 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <UserCheck
                                      className={`w-3 h-3 shrink-0 ${
                                        isGroupTutor ? 'text-emerald-600' : 'text-teal-600'
                                      }`}
                                    />
                                    <span className="truncate">{tch.nombre}</span>
                                  </div>
                                  {isGroupTutor && (
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-950 shrink-0">
                                      Tutor
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {assignedTeachers.length > 2 && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 w-fit">
                                +{assignedTeachers.length - 2} docente(s) más en el grupo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-teal-700 font-medium block">
                            {assignedTeachers.length > 1
                              ? `${assignedTeachers.length} docentes con pase QR en ${s.grado} "${s.grupo}"`
                              : `Pase de lista QR habilitado`}
                          </span>
                        </div>
                      ) : s.docenteNombre ? (
                        <div>
                          <div className="font-semibold text-indigo-950 text-xs flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{s.docenteNombre}</span>
                          </div>
                          <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                            Grupo {s.grado} "{s.grupo}" · Pase QR
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          Sin docente en {s.grado} "{s.grupo}"
                        </div>
                      )}
                    </td>

                    {/* Tutor info (Solo información - enlazado vía Link/QR por CURP) */}
                    <td className="py-3.5 px-3 text-slate-600">
                      {(() => {
                        const linkedTutor = getStudentLinkedTutor(s);
                        if (linkedTutor) {
                          return (
                            <div className="max-w-[165px]">
                              <div className="font-semibold text-slate-900 text-xs truncate" title={linkedTutor.nombre}>
                                {linkedTutor.nombre}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {linkedTutor.telefono || linkedTutor.correo || 'Vinculado por CURP'}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="text-[11px] text-slate-400 italic">
                            Sin tutor enlazado
                            <span className="block text-[10px] not-italic text-slate-400">
                              Vía Link/QR por CURP
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Promedio */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className="font-bold font-mono px-2 py-1 rounded-lg text-xs inline-block"
                        style={{
                          backgroundColor: `${goldColor}20`,
                          color: primaryColor,
                        }}
                      >
                        {s.promedio.toFixed(1)}
                      </span>
                    </td>

                    {/* Estatus (con cambio rápido incluyendo estatus Baja) */}
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <select
                          value={s.estatus}
                          onChange={(e) => {
                            const nextStatus = e.target.value as Student['estatus'];
                            updateStudent(s.id, { estatus: nextStatus });
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-colors ${
                            s.estatus === 'pendiente'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : s.estatus === 'inscrito'
                              ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                              : s.estatus === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.estatus === 'condicionado'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                          title="Cambiar estatus del alumno en Control Escolar"
                        >
                          <option value="activo">ACTIVO</option>
                          <option value="inscrito">INSCRITO</option>
                          <option value="pendiente">PENDIENTE PAGO</option>
                          <option value="condicionado">CONDICIONADO</option>
                          <option value="baja">BAJA</option>
                        </select>
                        {isBaja && (
                          <span className="block text-[10px] text-rose-600 font-semibold leading-tight">
                            Sin bitácoras, cobros ni acceso
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions: Emit Report Card (Sin botón de lápiz editar, ya que al dar clic en el registro abre edición) */}
                    <td className="py-3.5 pl-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Individual Student 5x5 QR and Credentials Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForQr(s)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-98 cursor-pointer"
                          title="Ver y Descargar Código QR (5cm x 5cm) y Credenciales de Acceso"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-600" />
                          <span>QR</span>
                        </button>

                        {/* Boleta Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForReport(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-2xs transition-all active:scale-98 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                          title="Emitir Boleta Oficial con Escudo y Colores Institucionales"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Boleta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentToDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Eliminar alumno registrado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No se encontraron alumnos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Bar (10, 20, 30, 40, 50 por lista) */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Mostrando{' '}
              <strong className="text-slate-900">
                {filteredStudents.length === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-900">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </strong>{' '}
              de <strong className="text-slate-900">{filteredStudents.length}</strong> alumnos
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Alumnos por lista:</span>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {[10, 20, 30, 40, 50].map((size) => (
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
        </div>
      </div>

      {/* Individual Student Deletion Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Confirmar Eliminación de Alumno
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={studentToDelete.foto || activeCollege.escudoUrl}
                  onError={(e) => {
                    e.currentTarget.src = activeCollege.escudoUrl;
                  }}
                  alt={studentToDelete.nombre}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm">
                    {studentToDelete.nombre} {studentToDelete.apellidos}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Matrícula: {studentToDelete.matricula} · {getStudentLevel(studentToDelete)}{' '}
                    {studentToDelete.grado} "{studentToDelete.grupo}"
                  </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente a este alumno del padrón escolar de{' '}
                <strong className="text-slate-900">{activeCollege.nombre}</strong>? También se dará de
                baja su usuario de acceso al portal estudiantil.
              </p>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToRemove = studentToDelete.id;
                    deleteStudent(idToRemove);
                    setSelectedStudentIds((prev) => prev.filter((id) => id !== idToRemove));
                    setStudentToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar Alumno</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Student Deletion Confirmation Modal */}
      {isBulkDeleteModalOpen && selectedStudentIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Eliminar {selectedStudentIds.length} Alumno(s) Seleccionado(s)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <p className="text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar los{' '}
                <strong className="text-rose-700">{selectedStudentIds.length} alumnos seleccionados</strong>{' '}
                del padrón de <strong className="text-slate-900">{activeCollege.nombre}</strong>? Esta
                acción dará de baja sus expedientes y credenciales de acceso de forma permanente.
              </p>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    selectedStudentIds.forEach((id) => deleteStudent(id));
                    setSelectedStudentIds([]);
                    setIsBulkDeleteModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar {selectedStudentIds.length} Alumno(s)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal with College Escudo & Colors */}
      <ReportCardModal
        student={selectedStudentForReport}
        onClose={() => setSelectedStudentForReport(null)}
      />

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-900">
                Inscripción de Alumno: {activeCollege.nombre}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs md:text-sm">
              {/* Foto del Alumno (si no se tiene una imagen, toma la del escudo del colegio) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={formFoto || activeCollege.escudoUrl}
                    onError={(e) => {
                      e.currentTarget.src = activeCollege.escudoUrl;
                    }}
                    alt="Foto Alumno / Escudo"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-white"
                  />
                  {formFoto && (
                    <span className="absolute -top-1.5 -right-1.5 p-1 bg-emerald-500 text-white rounded-full shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs">
                      Foto del Alumno
                    </label>
                    {formFoto ? (
                      <button
                        type="button"
                        onClick={() => setFormFoto('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Quitar foto y usar escudo
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Por defecto: Escudo del colegio
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    {formFoto
                      ? 'Imagen del alumno cargada exitosamente.'
                      : 'Si no cuentas con una foto en este momento, el sistema asignará automáticamente el escudo oficial del colegio.'}
                  </p>

                  <div className="pt-1 flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>{formFoto ? 'Cambiar Imagen' : 'Cargar Foto del Alumno'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImageFile(file, 400, 400);
                              setFormFoto(compressed);
                            } catch (err) {
                              console.error('Error al comprimir foto:', err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Santiago"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hernández Ramírez"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nivel Educativo *
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => {
                      const nextNivel = e.target.value as
                        | 'Preescolar'
                        | 'Primaria'
                        | 'Secundaria'
                        | 'Preparatoria';
                      setFormNivel(nextNivel);
                      const validGrades = getGradesForLevel(nextNivel);
                      if (!validGrades.includes(formGrado)) {
                        setFormGrado('1°');
                      }
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
                  <label className="font-semibold text-slate-700 block mb-1">Grado *</label>
                  <select
                    value={formGrado}
                    onChange={(e) => setFormGrado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {getGradesForLevel(formNivel).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  El <strong>grupo</strong> se asignará posteriormente en Control de Alumnos una vez que los grupos estén dados de alta en el módulo <strong>Materias y Grupos</strong>.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    placeholder="Auto-generada si se deja vacío"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CURP</label>
                  <input
                    type="text"
                    placeholder="18 caracteres"
                    value={formCurp}
                    onChange={(e) => setFormCurp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Group Modal */}
      {assignGroupStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Asignación Oficial de Grupo
                </h3>
              </div>
              <button
                onClick={() => {
                  setAssignGroupStudent(null);
                  setGroupAssignSuccess(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student info summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={assignGroupStudent.foto || activeCollege.escudoUrl}
                onError={(e) => {
                  e.currentTarget.src = activeCollege.escudoUrl;
                }}
                alt={assignGroupStudent.nombre}
                className="w-12 h-12 rounded-xl object-cover border bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm">
                  {assignGroupStudent.nombre} {assignGroupStudent.apellidos}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Matrícula: {assignGroupStudent.matricula}
                </div>
                <div className="text-xs font-bold text-purple-700">
                  Grado: {assignGroupStudent.grado}
                </div>
              </div>
            </div>

            {assignGroupStudent.estatus === 'pendiente' &&
            (!assignGroupStudent.grupo ||
              assignGroupStudent.grupo.includes('Sin Grupo') ||
              assignGroupStudent.grupo.includes('Pendiente')) ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Alumno con Estatus Pendiente</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  Este alumno fue aceptado por preinscripción pero su tutor aún <strong>no ha realizado el pago de la inscripción</strong>. Una vez que el tutor pague la cuota desde su portal, el alumno cambiará automáticamente a <strong>INSCRITO</strong> y estará disponible para asignarle un grupo.
                </p>
                <button
                  type="button"
                  onClick={() => setAssignGroupStudent(null)}
                  className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Entendido
                </button>
              </div>
            ) : (
              (() => {
                const studentLvl = getStudentLevel(assignGroupStudent);
                const availableGroups = getRegisteredGroupLettersForGrade(
                  studentLvl,
                  assignGroupStudent.grado
                );
                return availableGroups.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 text-xs text-amber-950">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Sin Grupos Dados de Alta en Materias y Grupos</span>
                    </div>
                    <p className="leading-relaxed text-amber-800">
                      No se han dado de alta grupos para <strong>{studentLvl} · {assignGroupStudent.grado}</strong> en el módulo <strong>Materias y Grupos</strong>. Para poder asignar un grupo a este alumno, primero debes dar de alta los grupos correspondientes en la pestaña <strong>Grupos por Nivel</strong> dentro de <strong>Materias y Grupos</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAssignGroupStudent(null)}
                      className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Entendido
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedGroupToAssign) return;
                      const groupTch = getTeacherByGroup(
                        studentLvl,
                        assignGroupStudent.grado,
                        selectedGroupToAssign
                      );
                      updateStudent(assignGroupStudent.id, {
                        grupo: selectedGroupToAssign,
                        docenteId: groupTch?.id || undefined,
                        docenteNombre: groupTch?.nombre || undefined,
                        estatus:
                          assignGroupStudent.estatus === 'baja' ? 'baja' : 'activo',
                      });
                      setGroupAssignSuccess(true);
                      setTimeout(() => {
                        setGroupAssignSuccess(false);
                        setAssignGroupStudent(null);
                      }, 1800);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">
                        Selecciona el Grupo dado de alta en Materias y Grupos ({studentLvl} · {assignGroupStudent.grado}):
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableGroups.map((grp) => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setSelectedGroupToAssign(grp)}
                            className={`py-3 rounded-xl border text-center font-black text-sm transition-all cursor-pointer ${
                              selectedGroupToAssign === grp
                                ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-xs ring-2 ring-purple-400'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Grupo "{grp}"
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs">
                          Docente del Grupo (Informativo):
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          Automático por Grupo
                        </span>
                      </div>
                      {(() => {
                        const groupTeachers = getTeachersByGroup(
                          studentLvl,
                          assignGroupStudent.grado,
                          selectedGroupToAssign
                        );
                        return groupTeachers.length > 0 ? (
                          <div className="space-y-1 pt-1">
                            {groupTeachers.map((gt) => (
                              <div key={gt.id} className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                                <span>
                                  {gt.nombre}{' '}
                                  <span className="text-slate-500 font-normal">({gt.especialidad})</span>
                                </span>
                                {gt.esTutorPrincipal &&
                                  (gt.grupoTutorado || '').replace(/["']/g, '').trim() ===
                                    `${assignGroupStudent.grado} ${selectedGroupToAssign}` && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      Tutor Principal
                                    </span>
                                  )}
                              </div>
                            ))}
                            {groupTeachers.length > 1 && (
                              <p className="text-[10px] text-teal-700 font-medium pt-0.5">
                                Todos los docentes asignados a este grupo pueden tomar asistencia.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic pt-0.5">
                            Sin docente asignado aún al grupo {assignGroupStudent.grado} "{selectedGroupToAssign}". Se mostrará automáticamente una vez que se le asigne este grupo a un docente.
                          </div>
                        );
                      })()}
                    </div>

                    {groupAssignSuccess ? (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>¡Grupo "{selectedGroupToAssign}" asignado con éxito!</span>
                      </div>
                    ) : (
                      <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setAssignGroupStudent(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!selectedGroupToAssign}
                          className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Guardar Asignación de Grupo</span>
                        </button>
                      </div>
                    )}
                  </form>
                );
              })()
            )}
          </div>
        </div>
      )}
      {/* Printable 5cm x 5cm Student QR Sheets Modal */}
      <StudentQrSheetsModal
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        students={collegeStudents}
        college={activeCollege}
      />

      {/* Student QR & Credentials Modal for Individual Student */}
      <StudentCredentialsModal
        isOpen={selectedStudentForQr !== null}
        onClose={() => setSelectedStudentForQr(null)}
        student={selectedStudentForQr}
        college={activeCollege}
        username={selectedStudentForQr ? getStudentUsername(selectedStudentForQr) : undefined}
        password={selectedStudentForQr ? getStudentPassword(selectedStudentForQr) : undefined}
        qrDataUrl={selectedStudentForQr ? studentQrMap[selectedStudentForQr.id] : undefined}
      />

      {/* Newly Created Student Credentials Modal */}
      {createdStudentCredentials && (
        <StudentCredentialsModal
          isOpen={createdStudentCredentials !== null}
          onClose={() => setCreatedStudentCredentials(null)}
          student={createdStudentCredentials.student}
          college={activeCollege}
          username={createdStudentCredentials.username}
          password={createdStudentCredentials.password}
          qrDataUrl={studentQrMap[createdStudentCredentials.student.id]}
        />
      )}

      {/* Edit Student Modal (Opens when clicking on a student row) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[95vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight">
                    Expediente, Grupo y Docente: {editingStudent.nombre} {editingStudent.apellidos}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Edita datos del alumno, asigna su grupo oficial y docente, o actualiza su estatus
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-4 sm:p-5 space-y-3 overflow-y-auto text-xs">
              {/* Foto del Alumno con Escudo del Colegio como Fallback (Compact) */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={editFoto || activeCollege.escudoUrl}
                    onError={(e) => {
                      e.currentTarget.src = activeCollege.escudoUrl;
                    }}
                    alt="Foto Alumno / Escudo"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-2xs bg-white"
                  />
                  {editFoto && (
                    <span className="absolute -top-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-slate-800 text-xs">
                        Foto del Alumno
                      </label>
                      {!editFoto && (
                        <span className="text-[9px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Escudo del colegio
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {editFoto
                        ? 'Foto personalizada activa.'
                        : 'Sin foto cargada. Se muestra el escudo oficial del colegio.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {editFoto && (
                      <button
                        type="button"
                        onClick={() => setEditFoto('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Usar escudo
                      </button>
                    )}
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3 h-3 text-slate-600" />
                      <span>{editFoto ? 'Cambiar Foto' : 'Subir Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImageFile(file, 400, 400);
                              setEditFoto(compressed);
                            } catch (err) {
                              console.error('Error al comprimir foto:', err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={editApellidos}
                    onChange={(e) => setEditApellidos(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nivel</label>
                  <select
                    value={editNivel}
                    onChange={(e) => {
                      const nextNivel = e.target.value as
                        | 'Preescolar'
                        | 'Primaria'
                        | 'Secundaria'
                        | 'Preparatoria';
                      setEditNivel(nextNivel);
                      const validGrades = getGradesForLevel(nextNivel);
                      const nextGrado = validGrades.includes(editGrado) ? editGrado : '1°';
                      setEditGrado(nextGrado);
                      const regGroups = getRegisteredGroupLettersForGrade(nextNivel, nextGrado);
                      if (!regGroups.includes(editGrupo)) {
                        setEditGrupo('Sin Grupo');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-semibold text-slate-800"
                  >
                    {allowedLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grado</label>
                  <select
                    value={editGrado}
                    onChange={(e) => {
                      const nextGrado = e.target.value;
                      setEditGrado(nextGrado);
                      const regGroups = getRegisteredGroupLettersForGrade(editNivel, nextGrado);
                      if (!regGroups.includes(editGrupo)) {
                        setEditGrupo('Sin Grupo');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    {getGradesForLevel(editNivel).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grupo</label>
                  {(() => {
                    const registeredGroups = getRegisteredGroupLettersForGrade(
                      editNivel,
                      editGrado
                    );
                    return (
                      <select
                        value={editGrupo}
                        onChange={(e) => {
                          const nextGrp = e.target.value;
                          setEditGrupo(nextGrp);
                          const grpTch = getTeacherByGroup(editNivel, editGrado, nextGrp);
                          if (grpTch) {
                            setEditDocenteId(grpTch.id);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-bold text-purple-900 bg-purple-50/40"
                      >
                        <option value="Sin Grupo">Sin Grupo</option>
                        {registeredGroups.map((grp) => (
                          <option key={grp} value={grp}>
                            Grupo "{grp}"
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estatus</label>
                  <select
                    value={editEstatus}
                    onChange={(e) => setEditEstatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-semibold"
                  >
                    <option value="activo">Activo</option>
                    <option value="inscrito">Inscrito</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="condicionado">Condicionado</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={editMatricula}
                    onChange={(e) => setEditMatricula(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CURP</label>
                  <input
                    type="text"
                    value={editCurp}
                    onChange={(e) => setEditCurp(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Docente Asignado y Tutor en 2 columnas compactas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Docente Asignado */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Docente(s) del Grupo / Asignación</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      Pase QR
                    </span>
                  </div>

                  {(() => {
                    const groupTeachers = getTeachersByGroup(editNivel, editGrado, editGrupo);
                    const levelTeachers = collegeTeachers.filter(
                      (t) => !t.nivel || t.nivel.toLowerCase() === editNivel.toLowerCase()
                    );
                    return (
                      <div className="space-y-1.5">
                        <select
                          value={editDocenteId}
                          onChange={(e) => setEditDocenteId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                        >
                          <option value="">
                            {groupTeachers.length > 0
                              ? `Automático del grupo (${groupTeachers.map((t) => t.nombre).join(', ')})`
                              : 'Seleccionar o asignar docente...'}
                          </option>
                          {(levelTeachers.length > 0 ? levelTeachers : collegeTeachers).map((tch) => (
                            <option key={tch.id} value={tch.id}>
                              {tch.nombre} ({tch.especialidad})
                            </option>
                          ))}
                        </select>

                        {groupTeachers.length > 0 ? (
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {groupTeachers.map((groupTeacher) => (
                              <div
                                key={groupTeacher.id}
                                className="px-2 py-1 rounded bg-white border border-slate-200 text-[11px] text-slate-800 flex items-center justify-between gap-1"
                              >
                                <span className="font-semibold text-slate-900 truncate">
                                  {groupTeacher.nombre}
                                </span>
                                {groupTeacher.esTutorPrincipal &&
                                  (groupTeacher.grupoTutorado || '').replace(/["']/g, '').trim() ===
                                    `${editGrado} ${editGrupo}` && (
                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                                      Tutor
                                    </span>
                                  )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic leading-tight">
                            Selecciona un grupo dado de alta en Materias y Grupos o asigna un docente del nivel.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Información del Tutor */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Información del Tutor</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Enlace CURP
                    </span>
                  </div>
                  {(() => {
                    const linkedTutor = getStudentLinkedTutor({
                      ...editingStudent,
                      curp: editCurp,
                    });
                    return linkedTutor ? (
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5">
                        <div className="font-bold text-slate-900 truncate">{linkedTutor.nombre}</div>
                        <div className="text-slate-600 truncate">
                          {linkedTutor.telefono || 'Sin teléfono'} · {linkedTutor.correo || 'Sin correo'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-white border border-dashed border-slate-300 text-[10px] text-slate-500 italic leading-snug">
                        Sin tutor enlazado. Se vincula automáticamente cuando el tutor se registra mediante Link o QR de Tutores buscando la CURP.
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2.5 border-t flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export to Excel Modal */}
      <StudentExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={collegeStudents}
        college={activeCollege}
        users={users}
      />

      {/* Import from CSV Modal */}
      <StudentCsvImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        college={activeCollege}
        teachers={teachers}
        onImportStudents={(importedList) => {
          addStudentsBulk(
            importedList.map(({ studentData, username, password }) => ({
              ...studentData,
              usuarioLogin: username,
              password: password,
            }))
          );
        }}
      />
    </div>
  );
};
