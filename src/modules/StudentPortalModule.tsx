import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Award,
  Bell,
  Library,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
  FileText,
  User,
  Check,
  Send,
  ArrowRight,
  Eye,
  Lock,
} from 'lucide-react';
import { Student, LibraryBook } from '../types';
import { ProtectedPdfViewerModal } from '../components/ProtectedPdfViewerModal';
import { compressImageFile } from '../utils/imageCompressor';
import { MyNoticesModule } from './MyNoticesModule';
import { MatchingQuestionStudentView } from '../components/MatchingQuestionStudentView';

interface Props {
  initialTab?: 'mis_tareas' | 'mis_examenes' | 'mis_comunicados' | 'mi_biblioteca';
  onNavigateTab?: (tab: string) => void;
}

export const StudentPortalModule: React.FC<Props> = ({
  initialTab = 'mis_tareas',
  onNavigateTab,
}) => {
  const {
    currentUser,
    activeCollege,
    students,
    tasksExams,
    submitTaskEvidence,
    submitStudentExam,
    notices,
    libraryBooks,
    colleges,
    hasRolePermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'mis_tareas' | 'mis_examenes' | 'mis_comunicados' | 'mi_biblioteca'>(
    initialTab
  );

  // Sync with prop when it changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Find linked student record
  const studentRecord: Student | undefined =
    students.find(
      (s) =>
        s.id === currentUser.estudianteId ||
        s.matricula === currentUser.usuarioLogin ||
        (currentUser.usuarioLogin && s.usuarioLogin === currentUser.usuarioLogin) ||
        (s.nombre && currentUser.nombre && `${s.nombre} ${s.apellidos}`.toLowerCase().includes(currentUser.nombre.toLowerCase()))
    ) || students[0];

  const college = activeCollege || (studentRecord ? colleges.find((c) => c.id === studentRecord.colegioId) : colleges[0]);

  if (studentRecord && studentRecord.estatus === 'baja') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-black text-xl">
          !
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900">
          Acceso a la Plataforma Deshabilitado (Estatus: Baja)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          El expediente del alumno <strong>{studentRecord.nombre} {studentRecord.apellidos}</strong> se encuentra con estatus de <strong>BAJA</strong> en Control Escolar. No cuenta con acceso activo a la plataforma.
        </p>
      </div>
    );
  }

  // Helper to check if a task/exam matches the student's group
  const studentGroupNormalized = React.useMemo(() => {
    if (!studentRecord) return '';
    const g = (studentRecord.grado || '').trim();
    const grp = (studentRecord.grupo || '').trim();
    return `${g} ${grp}`.replace(/\s+/g, ' ').trim().toLowerCase();
  }, [studentRecord]);

  const matchesStudentGroup = (itemGroup?: string, itemAssignedGroups?: string[]) => {
    if (!studentRecord || !studentGroupNormalized) return true;
    const candidates = [
      ...(itemGroup ? [itemGroup] : []),
      ...(Array.isArray(itemAssignedGroups) ? itemAssignedGroups : []),
    ]
      .map((c) => c.replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(Boolean);
    if (candidates.length === 0) return true;
    const studentShortGroup = `${(studentRecord.grado || '').split(' ')[0]} ${(studentRecord.grupo || '').trim()}`
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return candidates.some(
      (c) =>
        c === studentGroupNormalized ||
        c === studentShortGroup ||
        c.includes(studentShortGroup) ||
        studentGroupNormalized.includes(c)
    );
  };

  // Real-time clock tick so scheduled exams automatically unlock when the scheduled minute arrives
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const isExamEnabledNow = (exam: any): boolean => {
    if (!exam.programado || !exam.fechaHabilitacion) return true;
    const timeStr = exam.horaHabilitacion && exam.horaHabilitacion.trim() ? exam.horaHabilitacion.trim() : '00:00';
    const scheduledDate = new Date(`${exam.fechaHabilitacion}T${timeStr}:00`);
    if (Number.isNaN(scheduledDate.getTime())) return true;
    return nowTimestamp >= scheduledDate.getTime();
  };

  // Tasks and exams filtered for this college / student group (excluyendo borradores no publicados)
  const allTasks = tasksExams.filter(
    (t) =>
      (!college || t.colegioId === college.id) &&
      (t.tipo === 'tarea' || t.tipo === 'proyecto') &&
      t.estado !== 'Borrador' &&
      matchesStudentGroup(t.gradoGrupo, t.gruposAsignados)
  );

  const allExams = tasksExams.filter(
    (t) =>
      (!college || t.colegioId === college.id) &&
      t.tipo === 'examen' &&
      t.estado !== 'Borrador' &&
      matchesStudentGroup(t.gradoGrupo, t.gruposAsignados)
  );

  const allNotices = notices.filter(
    (n) => !college || n.colegioId === college.id
  );

  const allBooks = libraryBooks.filter(
    (b) =>
      (!college || b.colegioId === college.id) &&
      (!b.gruposAsignados ||
        b.gruposAsignados.length === 0 ||
        matchesStudentGroup(undefined, b.gruposAsignados))
  );

  // State for interactive features
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [selectedTaskForDelivery, setSelectedTaskForDelivery] = useState<any | null>(null);
  const [deliveryFileText, setDeliveryFileText] = useState('');
  const [deliveryFileName, setDeliveryFileName] = useState('');
  const [deliveryFileDataUrl, setDeliveryFileDataUrl] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // Interactive Exam Taking state for Student
  const [activeExamModal, setActiveExamModal] = useState<any | null>(null);
  const [studentExamAnswers, setStudentExamAnswers] = useState<Record<string, any>>({});
  const [submittedExamIds, setSubmittedExamIds] = useState<string[]>([]);
  const [examShowHints, setExamShowHints] = useState<Record<string, boolean>>({});

  // Library search & Read-only PDF viewer
  const [bookSearch, setBookSearch] = useState('');
  const [borrowedBookIds, setBorrowedBookIds] = useState<string[]>([]);
  const [bookNotice, setBookNotice] = useState<string | null>(null);
  const [viewingPdfBook, setViewingPdfBook] = useState<LibraryBook | null>(null);

  const handleToggleTaskComplete = (taskId: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleDeliverHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDelivery) return;
    const studentGradeNum = (studentRecord?.grado || '6°').split(' ')[0];
    const studentGroupLetter = (studentRecord?.grupo || 'A').trim();
    const formattedStudentGroup = `${studentGradeNum} ${studentGroupLetter}`.replace(/\s+/g, ' ').trim();

    submitTaskEvidence(selectedTaskForDelivery.id, {
      estudianteId: studentRecord?.id || currentUser.id,
      estudianteNombre: studentRecord
        ? `${studentRecord.nombre} ${studentRecord.apellidos}`
        : currentUser.nombre,
      matricula: studentRecord?.matricula || currentUser.usuarioLogin,
      gradoGrupo: formattedStudentGroup,
      comentario: deliveryFileText.trim(),
      archivoNombre: deliveryFileName || 'evidencia_tarea_alumno.pdf',
      archivoUrl: deliveryFileDataUrl || '#',
    });

    setCompletedTaskIds((prev) => Array.from(new Set([...prev, selectedTaskForDelivery.id])));
    setDeliverySuccess(true);
    setTimeout(() => {
      setDeliverySuccess(false);
      setSelectedTaskForDelivery(null);
      setDeliveryFileText('');
      setDeliveryFileName('');
      setDeliveryFileDataUrl('');
    }, 1500);
  };

  const handleBorrowBook = (bookId: string, bookTitle: string) => {
    setBorrowedBookIds((prev) => [...prev, bookId]);
    setBookNotice(`¡Has solicitado en préstamo el libro "${bookTitle}"! Puedes leer la versión digital o pasar al mostrador escolar.`);
    setTimeout(() => setBookNotice(null), 4000);
  };

  const filteredBooks = allBooks.filter(
    (b) =>
      !bookSearch ||
      b.titulo.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.autor.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.categoria.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const primaryColor = college?.colores?.primario || '#0B2545';
  const goldColor = college?.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Student Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex items-center gap-4">
          <img
            src={
              studentRecord?.foto ||
              currentUser.avatar ||
              college?.escudoUrl ||
              '/my-college-logo.svg'
            }
            onError={(e) => {
              if (college?.escudoUrl) e.currentTarget.src = college.escudoUrl;
            }}
            alt={currentUser.nombre}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white"
          />
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Portal Oficial del Alumno</span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-white">
              {studentRecord ? `${studentRecord.nombre} ${studentRecord.apellidos}` : currentUser.nombre}
            </h1>
            <div className="text-xs text-slate-200 flex flex-wrap items-center gap-2 font-mono">
              <span>Matrícula: <strong>{studentRecord?.matricula || currentUser.usuarioLogin || 'EST-2026-091'}</strong></span>
              <span>·</span>
              <span>Grado: <strong>{studentRecord?.grado || '3° Primaria'}</strong></span>
              <span>·</span>
              <span>Grupo: <strong>"{studentRecord?.grupo || 'A'}"</strong></span>
            </div>
          </div>
        </div>

        {/* School Shield badge */}
        {college && (
          <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/25 flex items-center gap-3 self-stretch sm:self-auto shrink-0">
            {college.escudoUrl && (
              <img
                src={college.escudoUrl}
                alt={college.nombre}
                className="w-10 h-10 object-contain p-1 rounded-xl bg-white"
              />
            )}
            <div className="text-left min-w-0">
              <span className="text-[10px] uppercase font-bold block" style={{ color: goldColor }}>Plantel Escolar</span>
              <span className="text-xs font-bold text-white truncate block max-w-[150px]">{college.nombre}</span>
              <span className="text-[10px] text-slate-200 font-mono">CCT: {college.codigoCCT}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher for Student View */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        {[
          { id: 'mis_tareas', label: 'Mis Tareas', icon: BookOpen, count: allTasks.length },
          { id: 'mis_examenes', label: 'Mis Exámenes', icon: Award, count: allExams.length },
          { id: 'mis_comunicados', label: 'Mis Comunicados', icon: Bell, count: allNotices.length },
          { id: 'mi_biblioteca', label: 'Mi Biblioteca', icon: Library, count: allBooks.length },
        ]
          .filter((tab) => hasRolePermission(currentUser.rol, tab.id))
          .map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                if (onNavigateTab) onNavigateTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-indigo-100 text-indigo-900 font-bold' : 'bg-slate-300/60 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MIS TAREAS */}
      {activeTab === 'mis_tareas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Mis Tareas y Actividades Escolares</span>
              </h2>
              <p className="text-xs text-slate-500">
                Consulta los trabajos asignados por tus profesores y sube tus evidencias de entrega
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Completadas: {completedTaskIds.length} de {allTasks.length}
            </span>
          </div>

          {allTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
              No tienes tareas pendientes asignadas en este momento.
            </div>
          ) : (
            <div className="space-y-3.5">
              {allTasks.map((task) => {
                const existingSubmission = Array.isArray(task.entregasEvidencias)
                  ? task.entregasEvidencias.find(
                      (ev) =>
                        ev.estudianteId === (studentRecord?.id || currentUser.id) ||
                        (studentRecord &&
                          ev.estudianteNombre.toLowerCase() ===
                            `${studentRecord.nombre} ${studentRecord.apellidos}`.toLowerCase())
                    )
                  : undefined;
                const isCompleted = completedTaskIds.includes(task.id) || Boolean(existingSubmission);
                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-3xl p-5 border transition-all space-y-3 ${
                      isCompleted
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono">
                            {task.materia}
                          </span>
                          {task.solicitarEvidencia && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                              Envío de Evidencia Habilitado
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {task.titulo}
                        </h3>
                        <div className="text-[11px] text-slate-500">
                          Docente: {task.docenteNombre}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTaskComplete(task.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como entregada'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {task.instrucciones && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {task.instrucciones}
                      </p>
                    )}

                    {existingSubmission && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Evidencia enviada: {existingSubmission.archivoNombre}</span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700">
                          Grupo {existingSubmission.gradoGrupo}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Entrega: {task.fechaLimite}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Valor: {task.puntosMaximos} pts
                        </span>

                        {task.solicitarEvidencia !== false && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskForDelivery(task);
                              setDeliveryFileText(existingSubmission?.comentario || '');
                              setDeliveryFileName(existingSubmission?.archivoNombre || '');
                              setDeliveryFileDataUrl(existingSubmission?.archivoUrl || '');
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            {existingSubmission ? 'Actualizar Evidencia' : 'Enviar Evidencia'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MIS EXÁMENES */}
      {activeTab === 'mis_examenes' && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Mis Exámenes y Evaluaciones Programadas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Fechas oficiales, temarios de estudio y puntajes de tus próximos exámenes
            </p>
          </div>

          {allExams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
              No tienes exámenes programados próximamente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allExams.map((exam) => {
                const hasInteractiveQuestions =
                  Array.isArray(exam.preguntasExamen) && exam.preguntasExamen.length > 0;
                const existingExamSubmission = Array.isArray(exam.entregasExamenes)
                  ? exam.entregasExamenes.find(
                      (sub) =>
                        sub.estudianteId === (studentRecord?.id || currentUser.id) ||
                        (studentRecord &&
                          sub.estudianteNombre.toLowerCase() ===
                            `${studentRecord.nombre} ${studentRecord.apellidos}`.toLowerCase())
                    )
                  : undefined;
                const isSubmitted =
                  submittedExamIds.includes(exam.id) || Boolean(existingExamSubmission);
                const enabledBySchedule = isExamEnabledNow(exam);

                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-3xl p-5 border shadow-2xs space-y-3 transition-all flex flex-col justify-between ${
                      enabledBySchedule
                        ? 'border-purple-200 hover:border-purple-400'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono">
                              {exam.materia}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                              Grupo {exam.gradoGrupo}
                            </span>
                            {hasInteractiveQuestions && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                {exam.preguntasExamen!.length} preguntas interactivas
                              </span>
                            )}
                            {exam.programado && exam.fechaHabilitacion && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  enabledBySchedule
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}
                              >
                                {enabledBySchedule
                                  ? 'Habilitado para responder'
                                  : `Se habilita: ${exam.fechaHabilitacion} · ${exam.horaHabilitacion || '08:00'} hrs`}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-slate-900">
                            {exam.titulo}
                          </h3>
                          <div className="text-[11px] text-slate-500">
                            Profesor: {exam.docenteNombre}
                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black font-mono shrink-0">
                          {exam.puntosMaximos} Pts
                        </div>
                      </div>

                      {!enabledBySchedule && exam.programado && exam.fechaHabilitacion && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2 font-semibold">
                          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>
                            Este examen fue programado por tu profesor y se habilitará automáticamente el día{' '}
                            <strong>{exam.fechaHabilitacion}</strong> a las{' '}
                            <strong>{exam.horaHabilitacion || '08:00'} hrs</strong>.
                          </span>
                        </div>
                      )}

                      {exam.instrucciones && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                          <strong>Temario / Indicaciones:</strong>
                          <p className="mt-1">{exam.instrucciones}</p>
                        </div>
                      )}

                      {existingExamSubmission && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>
                              Aciertos registrados: {existingExamSubmission.aciertosObtenidos} /{' '}
                              {existingExamSubmission.totalReactivos}
                            </span>
                          </span>
                          <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            Calif: {existingExamSubmission.calificacionEscala10.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-3 border-t border-slate-100 text-slate-600">
                      <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                        <Clock className="w-4 h-4" />
                        <span>Cierre: {exam.fechaLimite}</span>
                      </div>

                      {hasInteractiveQuestions ? (
                        <button
                          type="button"
                          disabled={!enabledBySchedule}
                          onClick={() => {
                            if (!enabledBySchedule) return;
                            setActiveExamModal(exam);
                            setStudentExamAnswers({});
                            setExamShowHints({});
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 transition-all ${
                            !enabledBySchedule
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                              : isSubmitted
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-pointer'
                                : 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm cursor-pointer'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {!enabledBySchedule
                              ? `Disponible ${exam.fechaHabilitacion} ${exam.horaHabilitacion || '08:00'}`
                              : isSubmitted
                                ? 'Examen Respondido'
                                : 'Responder Examen'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                          Presencial en Aula
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIS COMUNICADOS */}
      {activeTab === 'mis_comunicados' && (
        <MyNoticesModule isEmbedded={true} onNavigateTab={onNavigateTab} />
      )}

      {/* TAB 4: MI BIBLIOTECA */}
      {activeTab === 'mi_biblioteca' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Library className="w-5 h-5 text-teal-600" />
                <span>Mi Biblioteca Escolar Digital</span>
              </h2>
              <p className="text-xs text-slate-500">
                Acervo de libros de texto, lecturas recomendadas, enciclopedias y recursos bibliográficos
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, autor o tema..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {bookNotice && (
            <div className="p-3 bg-teal-100 border border-teal-300 rounded-xl text-xs font-bold text-teal-950 flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{bookNotice}</span>
            </div>
          )}

          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
              No se encontraron libros que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredBooks.map((book) => {
                const hasDigitalPdf = Boolean(book.esDigitalPdf && book.archivoPdfUrl);
                return (
                  <div
                    key={book.id}
                    onClick={() => setViewingPdfBook(book)}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
                    title="Haz clic para abrir y leer este libro"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 truncate">
                            {book.categoria}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{hasDigitalPdf ? 'PDF · Solo Lectura' : 'Lectura en Línea'}</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Solo lectura
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                        {book.titulo}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Autor: {book.autor}
                      </div>
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Haz clic para abrir el libro (Descarga deshabilitada)</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPdfBook(book);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: goldColor }} />
                        <span>Abrir Libro (.PDF)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visor de Libros en formato .PDF para el Alumno (Solo Visualización, Sin Descarga) */}
      {viewingPdfBook && (
        <ProtectedPdfViewerModal
          book={viewingPdfBook}
          onClose={() => setViewingPdfBook(null)}
          primaryColor={primaryColor}
          goldColor={goldColor}
          studentName={
            studentRecord
              ? `${studentRecord.nombre} ${studentRecord.apellidos} (${studentRecord.grado} ${studentRecord.grupo})`
              : currentUser.nombre
          }
        />
      )}

      {/* Delivery Homework Modal */}
      {selectedTaskForDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Entrega de Evidencia de Tarea
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForDelivery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900">{selectedTaskForDelivery.titulo}</div>
              <div className="text-slate-500 font-mono">{selectedTaskForDelivery.materia} · {selectedTaskForDelivery.docenteNombre}</div>
            </div>

            <form onSubmit={handleDeliverHomework} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Resumen o Notas de tu entrega:
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliveryFileText}
                  onChange={(e) => setDeliveryFileText(e.target.value)}
                  placeholder="Escribe aquí tus comentarios, respuestas o enlace a tu trabajo..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <label className="p-4 bg-indigo-50/60 border border-dashed border-indigo-300 rounded-xl text-center space-y-1 block cursor-pointer hover:bg-indigo-50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setDeliveryFileName(file.name);
                    try {
                      const dataUrl = await compressImageFile(file, 540, 540, 0.82);
                      setDeliveryFileDataUrl(dataUrl);
                    } catch {
                      // ignore
                    }
                  }}
                />
                <FileText className="w-6 h-6 text-indigo-600 mx-auto" />
                <span className="font-bold text-indigo-900 block text-xs">
                  {deliveryFileName ? `Archivo cargado: ${deliveryFileName}` : 'Haz clic para adjuntar foto o PDF de tu evidencia'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {deliveryFileName
                    ? 'Se registrará en el grupo de tu expediente escolar'
                    : 'Formatos soportados: PDF, Imagen o Documento'}
                </span>
              </label>

              {deliverySuccess ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>¡Tarea entregada exitosamente al profesor!</span>
                </div>
              ) : (
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForDelivery(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Interactive Exam Modal for Student (Correct answers strictly hidden from student) */}
      {activeExamModal && Array.isArray(activeExamModal.preguntasExamen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
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
                  Evaluación Interactiva · {activeExamModal.materia}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-white mt-1">
                  {activeExamModal.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveExamModal(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50 text-xs sm:text-sm">
              {activeExamModal.preguntasExamen.map((q: any, idx: number) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-white font-mono font-bold text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Pregunta {idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Valor: {q.puntos} pts
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 text-sm">{q.enunciado}</p>

                  {q.imagenUrl && (
                    <img
                      src={q.imagenUrl}
                      alt=""
                      className="max-h-48 rounded-xl border border-slate-200 object-contain bg-slate-50 p-2"
                    />
                  )}

                  {q.pistaOpcional && activeExamModal.configuracionExamen?.permitirPistas && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExamShowHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        {examShowHints[q.id] ? 'Ocultar pista' : '💡 Ver pista de apoyo'}
                      </button>
                      {examShowHints[q.id] && (
                        <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          {q.pistaOpcional}
                        </div>
                      )}
                    </div>
                  )}

                  {Array.isArray(q.opciones) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.opciones.map((opt: any, oIdx: number) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isSelected =
                          q.tipo === 'opcion_multiple_varias'
                            ? (studentExamAnswers[q.id] || []).includes(opt.id)
                            : studentExamAnswers[q.id] === opt.id;

                        return (
                          <div
                            key={opt.id}
                            onClick={() => {
                              if (q.tipo === 'opcion_multiple_varias') {
                                const curr: string[] = studentExamAnswers[q.id] || [];
                                const next = curr.includes(opt.id)
                                  ? curr.filter((id) => id !== opt.id)
                                  : [...curr, opt.id];
                                setStudentExamAnswers((prev) => ({ ...prev, [q.id]: next }));
                              } else {
                                setStudentExamAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs flex flex-col gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md border border-slate-300 bg-slate-50 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <span className="flex-1">{opt.texto}</span>
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

                  {q.tipo === 'relacionar_columnas' && Array.isArray(q.paresRelacion) && (
                    <MatchingQuestionStudentView
                      question={q}
                      isBuilderPreview={false}
                      selectedAnswers={
                        (q.paresRelacion || []).reduce((acc: Record<string, string>, pair: any) => {
                          acc[pair.id] = studentExamAnswers[`${q.id}_${pair.id}`] || '';
                          return acc;
                        }, {})
                      }
                      onSelectAnswer={(pairId, ansId) => {
                        setStudentExamAnswers((prev) => ({
                          ...prev,
                          [`${q.id}_${pairId}`]: ansId,
                        }));
                      }}
                    />
                  )}

                  {q.tipo === 'respuesta_corta' && (
                    <input
                      type="text"
                      value={studentExamAnswers[q.id] || ''}
                      onChange={(e) =>
                        setStudentExamAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Verifica todas tus respuestas antes de enviar tu examen al profesor.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveExamModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const questions: any[] = Array.isArray(activeExamModal.preguntasExamen)
                      ? activeExamModal.preguntasExamen
                      : [];
                    const totalReactivos = Math.max(1, questions.length);
                    let aciertosObtenidos = 0;

                    questions.forEach((q: any) => {
                      const ans = studentExamAnswers[q.id];
                      if (
                        q.tipo === 'opcion_multiple_unica' ||
                        q.tipo === 'verdadero_falso'
                      ) {
                        const correctOpt = (q.opciones || []).find((o: any) => o.esCorrecta);
                        if (correctOpt && ans === correctOpt.id) {
                          aciertosObtenidos += 1;
                        }
                      } else if (q.tipo === 'opcion_multiple_varias') {
                        const correctIds = (q.opciones || [])
                          .filter((o: any) => o.esCorrecta)
                          .map((o: any) => o.id);
                        const selectedIds: string[] = Array.isArray(ans) ? ans : [];
                        if (correctIds.length > 0) {
                          const hits = selectedIds.filter((id) => correctIds.includes(id)).length;
                          const misses = selectedIds.filter((id) => !correctIds.includes(id)).length;
                          const ratio = Math.max(0, (hits - misses) / correctIds.length);
                          aciertosObtenidos += Number(ratio.toFixed(2));
                        }
                      } else if (
                        q.tipo === 'relacionar_columnas' &&
                        Array.isArray(q.paresRelacion) &&
                        q.paresRelacion.length > 0
                      ) {
                        let matchedPairs = 0;
                        q.paresRelacion.forEach((pair: any) => {
                          if (studentExamAnswers[`${q.id}_${pair.id}`] === pair.id) {
                            matchedPairs += 1;
                          }
                        });
                        aciertosObtenidos += Number(
                          (matchedPairs / q.paresRelacion.length).toFixed(2)
                        );
                      } else if (q.tipo === 'respuesta_corta') {
                        const expected = (q.respuestaCortaCorrecta || '').trim().toLowerCase();
                        const given = String(ans || '').trim().toLowerCase();
                        if (expected && given === expected) {
                          aciertosObtenidos += 1;
                        }
                      }
                    });

                    const safeAciertos = Number(
                      Math.min(totalReactivos, Math.max(0, aciertosObtenidos)).toFixed(1)
                    );
                    const pctAciertos = Number(
                      ((safeAciertos / totalReactivos) * 100).toFixed(1)
                    );
                    const calif10 = Number(((safeAciertos / totalReactivos) * 10).toFixed(1));
                    const studentGradeNum = (studentRecord?.grado || '6°').split(' ')[0];
                    const studentGroupLetter = (studentRecord?.grupo || 'A').trim();
                    const formattedStudentGroup = `${studentGradeNum} ${studentGroupLetter}`
                      .replace(/\s+/g, ' ')
                      .trim();

                    submitStudentExam(activeExamModal.id, {
                      estudianteId: studentRecord?.id || currentUser.id,
                      estudianteNombre: studentRecord
                        ? `${studentRecord.nombre} ${studentRecord.apellidos}`
                        : currentUser.nombre,
                      matricula: studentRecord?.matricula || currentUser.usuarioLogin,
                      gradoGrupo: formattedStudentGroup,
                      respuestas: studentExamAnswers,
                      aciertosObtenidos: safeAciertos,
                      totalReactivos,
                      porcentajeAciertos: pctAciertos,
                      calificacionEscala10: calif10,
                    });

                    setSubmittedExamIds((prev) =>
                      Array.from(new Set([...prev, activeExamModal.id]))
                    );
                    setActiveExamModal(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Entregar Examen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
