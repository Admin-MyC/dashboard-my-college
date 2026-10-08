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
} from 'lucide-react';
import { Student } from '../types';

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

  // Tasks and exams filtered for this college / student
  const allTasks = tasksExams.filter(
    (t) => (!college || t.colegioId === college.id) && t.tipo === 'tarea'
  );

  const allExams = tasksExams.filter(
    (t) => (!college || t.colegioId === college.id) && t.tipo === 'examen'
  );

  const allNotices = notices.filter(
    (n) => !college || n.colegioId === college.id
  );

  const allBooks = libraryBooks.filter(
    (b) => !college || b.colegioId === college.id
  );

  // State for interactive features
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [selectedTaskForDelivery, setSelectedTaskForDelivery] = useState<any | null>(null);
  const [deliveryFileText, setDeliveryFileText] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // Library search
  const [bookSearch, setBookSearch] = useState('');
  const [borrowedBookIds, setBorrowedBookIds] = useState<string[]>([]);
  const [bookNotice, setBookNotice] = useState<string | null>(null);

  const handleToggleTaskComplete = (taskId: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleDeliverHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDelivery) return;
    setCompletedTaskIds((prev) => Array.from(new Set([...prev, selectedTaskForDelivery.id])));
    setDeliverySuccess(true);
    setTimeout(() => {
      setDeliverySuccess(false);
      setSelectedTaskForDelivery(null);
      setDeliveryFileText('');
    }, 2000);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTasks.map((task) => {
                const isCompleted = completedTaskIds.includes(task.id);
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
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono">
                          {task.materia}
                        </span>
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

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Entrega: {task.fechaLimite}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Valor: {task.puntosMaximos} pts
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedTaskForDelivery(task)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Entregar Tarea
                        </button>
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
              {allExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl p-5 border border-purple-200 shadow-2xs space-y-3 hover:border-purple-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono">
                        {exam.materia}
                      </span>
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

                  {exam.instrucciones && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <strong>Temario / Indicaciones:</strong>
                      <p className="mt-1">{exam.instrucciones}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100 text-slate-600">
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Fecha del Examen: {exam.fechaLimite}</span>
                    </div>

                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      Presencial en Aula
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIS COMUNICADOS */}
      {activeTab === 'mis_comunicados' && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <span>Mis Comunicados y Avisos Institucionales</span>
            </h2>
            <p className="text-xs text-slate-500">
              Circulares, citatorios, avisos de dirección y novedades escolares
            </p>
          </div>

          {allNotices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
              No hay comunicados publicados en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {allNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          notice.prioridad === 'Urgente'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : notice.prioridad === 'Importante'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {notice.prioridad}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {notice.titulo}
                      </h3>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{notice.fecha}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {notice.contenido}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Publicado por: <strong>{notice.autor}</strong></span>
                    <span className="text-indigo-600 font-semibold">Dirigido a: {notice.destinatarios}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                const isBorrowed = borrowedBookIds.includes(book.id);
                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-teal-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 truncate">
                          {book.categoria}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {book.disponibles} disp.
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {book.titulo}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Autor: {book.autor}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ISBN: {book.isbn || '978-012-34567'}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleBorrowBook(book.id, book.titulo)}
                        disabled={isBorrowed}
                        className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isBorrowed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                        }`}
                      >
                        {isBorrowed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Solicitado</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Solicitar Préstamo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

              <div className="p-4 bg-indigo-50/60 border border-dashed border-indigo-300 rounded-xl text-center space-y-1">
                <FileText className="w-6 h-6 text-indigo-600 mx-auto" />
                <span className="font-bold text-indigo-900 block text-xs">Archivo adjunto listo</span>
                <span className="text-[10px] text-slate-500">evidencia_tarea_firmada.pdf (1.4 MB)</span>
              </div>

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
    </div>
  );
};
