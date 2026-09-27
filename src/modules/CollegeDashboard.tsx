import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Users,
  Award,
  ShieldAlert,
  Bell,
  ArrowRight,
  Palette,
  FileText,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const CollegeDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    students,
    teachers,
    subjects,
    incidents,
    notices,
    currentUser,
  } = useApp();

  if (!activeCollege) return null;

  const collegeStudents = students.filter((s) => s.colegioId === activeCollege.id);
  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const collegeIncidents = incidents.filter((i) => i.colegioId === activeCollege.id);
  const collegeNotices = notices.filter(
    (n) => n.colegioId === activeCollege.id || n.colegioId === 'todos'
  );

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Overall student GPA
  const avgGpa =
    collegeStudents.length > 0
      ? (
          collegeStudents.reduce((acc, s) => acc + s.promedio, 0) /
          collegeStudents.length
        ).toFixed(1)
      : '9.0';

  return (
    <div className="space-y-6">
      {/* College Branded Hero Banner with uploaded escudo and dynamic colors */}
      <div
        className="rounded-2xl p-6 lg:p-8 text-white shadow-md relative overflow-hidden transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 60%, ${primaryColor}bb 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Custom Shield Uploaded by the College */}
            <div className="bg-white p-2 rounded-2xl shadow-lg border border-white/20 shrink-0">
              <img
                src={activeCollege.escudoUrl}
                alt={activeCollege.nombre}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs"
                  style={{
                    backgroundColor: goldColor,
                    color: primaryColor,
                  }}
                >
                  Plan {activeCollege.plan}
                </span>
                <span className="text-xs text-slate-200 font-mono">
                  {activeCollege.codigoCCT}
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                {activeCollege.nombre}
              </h2>

              <p className="text-sm text-slate-200 italic mt-0.5 max-w-xl">
                "{activeCollege.lema}"
              </p>

              <div className="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-3">
                <span>Director(a): {activeCollege.director}</span>
                <span>·</span>
                <span>{activeCollege.direccion}</span>
              </div>
            </div>
          </div>

          {/* Quick Customizer Shortcut */}
          <button
            onClick={() => onNavigateTab('personalizacion')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition-all self-start sm:self-auto shrink-0"
          >
            <Palette className="w-4 h-4" style={{ color: goldColor }} />
            <span>Editar Escudo y Colores</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Estudiantes Activos
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeStudents.length > 0 ? collegeStudents.length : activeCollege.alumnosTotales}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Matriculados en ciclo escolar
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cuerpo Docente
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeTeachers.length > 0 ? collegeTeachers.length : activeCollege.docentesTotales}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Profesores titulares y adjuntos
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Promedio Institucional
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${goldColor}20`, color: goldColor }}
            >
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {avgGpa} / 10
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Rendimiento Alto</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Incidencias / Prefectura
            </span>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeIncidents.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {collegeIncidents.filter((i) => i.estatus === 'En seguimiento').length} en seguimiento
          </div>
        </div>
      </div>

      {/* Main Grid: Active Modules Shortcuts & Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enabled Modules Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Módulos Habilitados para {activeCollege.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  Accede rápidamente a las funciones académicas y administrativas permitidas según el plan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Estudiantes */}
              {activeCollege.modulosHabilitados.includes('estudiantes') && (
                <button
                  onClick={() => onNavigateTab('estudiantes')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <GraduationCap
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Estudiantes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Alumnos, grupos y boletas
                  </div>
                </button>
              )}

              {/* Calificaciones */}
              {activeCollege.modulosHabilitados.includes('calificaciones') && (
                <button
                  onClick={() => onNavigateTab('calificaciones')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <Award
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: goldColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Calificaciones
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sábana de notas y boletas
                  </div>
                </button>
              )}

              {/* Docentes */}
              {activeCollege.modulosHabilitados.includes('docentes') && (
                <button
                  onClick={() => onNavigateTab('docentes')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <Users
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Docentes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Horarios y asignación
                  </div>
                </button>
              )}

              {/* Control Escolar */}
              {activeCollege.modulosHabilitados.includes('control_escolar') && (
                <button
                  onClick={() => onNavigateTab('control_escolar')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <FileText
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Control Escolar
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Expedientes y matrículas
                  </div>
                </button>
              )}

              {/* Incidencias */}
              {activeCollege.modulosHabilitados.includes('incidencias') && (
                <button
                  onClick={() => onNavigateTab('incidencias')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <ShieldAlert className="w-5 h-5 mb-2 text-orange-600 transition-transform group-hover:scale-110" />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Incidencias
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prefectura y conducta
                  </div>
                </button>
              )}

              {/* Tareas y Exámenes */}
              {activeCollege.modulosHabilitados.includes('tareas') && (
                <button
                  onClick={() => onNavigateTab('tareas_examenes')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
                >
                  <Calendar
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Tareas y Exámenes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Entregas y evaluaciones
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: School Notices / Circulars */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                Comunicados y Avisos
              </h3>
              <button
                onClick={() => onNavigateTab('comunicados')}
                className="text-xs font-semibold hover:underline"
                style={{ color: primaryColor }}
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {collegeNotices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        notice.prioridad === 'Urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : notice.prioridad === 'Importante'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {notice.prioridad}
                    </span>
                    <span className="text-slate-400 font-mono">{notice.fecha}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {notice.titulo}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {notice.contenido}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
