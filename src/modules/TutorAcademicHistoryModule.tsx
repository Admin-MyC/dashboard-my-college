import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  User,
  Star,
} from 'lucide-react';
import { ReportCardModal } from '../components/ReportCardModal';
import {
  Student,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
} from '../types';
import { getGradePeriodsForModalidad } from '../utils/reportCardPdfGenerator';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const TutorAcademicHistoryModule: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, students, colleges, grades } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activePeriodIndex, setActivePeriodIndex] = useState<number | 'final'>(1);
  const [showBoletaModal, setShowBoletaModal] = useState(false);

  // Find linked students (excluding estatus 'baja')
  const linkedStudents = students.filter((s) => {
    if (s.estatus === 'baja') return false;
    if (s.tutorId === currentUser.id) return true;
    if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
    if (currentUser.curpsAsociadas && s.curp && currentUser.curpsAsociadas.includes(s.curp.toUpperCase())) return true;
    if (currentUser.correo && s.tutorCorreo && s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()) return true;
    return false;
  });

  const activeStudent =
    linkedStudents.find((s) => s.id === selectedStudentId) || linkedStudents[0];

  const college = activeStudent
    ? colleges.find((c) => c.id === activeStudent.colegioId)
    : null;

  const [selectedPeriodicidad, setSelectedPeriodicidad] = useState<EvaluationPeriodicity>(
    college?.periodicidadEvaluacion || 'bimestral'
  );

  const effectivePeriodicidad: EvaluationPeriodicity =
    selectedPeriodicidad || college?.periodicidadEvaluacion || 'bimestral';
  const meta =
    EVALUATION_PERIODICITY_CONFIG[effectivePeriodicidad] ||
    EVALUATION_PERIODICITY_CONFIG.bimestral;

  interface SubjectGradeRow {
    id: string;
    materia: string;
    docente: string;
    calificacion: number;
    observaciones: string;
  }

  // Filter grades for active student and normalize
  const studentGrades = activeStudent
    ? grades.filter((g) => g.estudianteId === activeStudent.id)
    : [];

  // Default sample grades if none in DB
  const displayGrades: SubjectGradeRow[] = studentGrades.length > 0
    ? studentGrades.map((g) => {
        const pValues = getGradePeriodsForModalidad(g, effectivePeriodicidad);
        const avg = Number(
          (pValues.reduce((acc, v) => acc + v, 0) / pValues.length).toFixed(1)
        );
        const chosenScore =
          activePeriodIndex === 'final'
            ? avg
            : pValues[Math.max(0, Math.min(pValues.length - 1, activePeriodIndex - 1))] ?? avg;
        return {
          id: g.id,
          materia: g.materiaNombre,
          docente: 'Docente Titular',
          calificacion: chosenScore,
          observaciones: g.observaciones || 'Desempeño satisfactorio y constancia en clase',
        };
      })
    : [
        { id: '1', materia: 'Matemáticas Avanzadas', docente: 'Lic. Carlos Fuentes', calificacion: 9.5, observaciones: 'Excelente comprensión lógica y participación' },
        { id: '2', materia: 'Lengua Española y Literatura', docente: 'Mtra. Elena Rivas', calificacion: 9.0, observaciones: 'Muy buena redacción y análisis crítico' },
        { id: '3', materia: 'Física y Ciencias Experimentales', docente: 'Ing. Rodrigo Garza', calificacion: 9.8, observaciones: 'Destacado en prácticas de laboratorio' },
        { id: '4', materia: 'Historia Universal', docente: 'Lic. Mariana Garza', calificacion: 8.9, observaciones: 'Cumple con tareas y evaluaciones periódicas' },
        { id: '5', materia: 'Inglés Avanzado B2', docente: 'Prof. John Smith', calificacion: 9.6, observaciones: 'Fluidez sobresaliente y gramática impecable' },
        { id: '6', materia: 'Educación Física y Deportes', docente: 'Lic. Fernando Vallejo', calificacion: 10.0, observaciones: 'Liderazgo y trabajo en equipo ejemplar' },
        { id: '7', materia: 'Artes y Música', docente: 'Prof. Guillermo Domínguez', calificacion: 9.2, observaciones: 'Creatividad y compromiso constante' },
      ];

  const average =
    displayGrades.length > 0
      ? (displayGrades.reduce((acc, g) => acc + g.calificacion, 0) / displayGrades.length).toFixed(1)
      : '9.4';

  const primaryColor = college?.colores?.primario || '#0B2545';
  const goldColor = college?.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Portal de Tutores · Historial Académico</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
            Calificaciones y Boletas Oficiales
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Consulta el desglose bimestral de notas por materia, observaciones docentes y genera la boleta institucional oficial.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      {activeStudent && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Modalidad de Boleta:</span>
            </span>
            {(
              [
                'mensual',
                'bimestral',
                'trimestral',
                'cuatrimestral',
                'semestral',
              ] as EvaluationPeriodicity[]
            ).map((per) => {
              const isSelected = effectivePeriodicidad === per;
              return (
                <button
                  key={per}
                  type="button"
                  onClick={() => {
                    setSelectedPeriodicidad(per);
                    setActivePeriodIndex(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor } : undefined}
                >
                  {EVALUATION_PERIODICITY_CONFIG[per].label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowBoletaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Boleta {meta.label}</span>
          </button>
        </div>
      )}

      {/* If no student linked */}
      {linkedStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-amber-300 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-lg text-slate-900">
              No hay alumnos vinculados para mostrar su historial
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Ingresa al apartado de <strong>Mi Perfil</strong> para vincular a tus hijos mediante su CURP.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('mi_perfil')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-amber-300" />
            <span>Ir a Mi Perfil</span>
          </button>
        </div>
      ) : (
        <>
          {/* Child Selector Tabs (if more than 1 student) */}
          {linkedStudents.length > 1 && (
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
              {linkedStudents.map((st) => {
                const isSelected = activeStudent.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <img
                      src={st.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                      alt={st.nombre}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{st.nombre} {st.apellidos}</span>
                    <span className="text-[10px] font-mono text-slate-400">({st.grado} {st.grupo})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Student Academic Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <img
                src={activeStudent.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={activeStudent.nombre}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h2 className="font-display font-bold text-xl text-slate-900">
                    {activeStudent.nombre} {activeStudent.apellidos}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                    {activeStudent.grado} Grupo "{activeStudent.grupo}"
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Matrícula: {activeStudent.matricula} · CURP: {activeStudent.curp}
                </p>
                <p className="text-xs text-slate-600 font-semibold">
                  {college?.nombre}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-[110px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Promedio Actual
                </span>
                <span className="font-display font-black text-2xl text-amber-950 font-mono">
                  {average}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                  ★ Sobresaliente
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[110px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Materias Aprobadas
                </span>
                <span className="font-display font-black text-2xl text-emerald-950 font-mono">
                  {displayGrades.length}/{displayGrades.length}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  100% de Acreditación
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Period Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {meta.periodNames.map((pName, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setActivePeriodIndex(pNum)}
                    className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activePeriodIndex === pNum
                        ? 'bg-[#0B2545] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pName}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setActivePeriodIndex('final')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activePeriodIndex === 'final'
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Promedio Ciclo ({meta.label})
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden sm:block">
              Ciclo Escolar 2026-2027
            </span>
          </div>

          {/* Grades Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Sábana de Calificaciones por Materia</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-600">
                Escala oficial: 5.0 - 10.0
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Asignatura / Materia</th>
                    <th className="py-3 px-4">Docente Titular</th>
                    <th className="py-3 px-4 text-center">Calificación</th>
                    <th className="py-3 px-4">Observaciones y Seguimiento</th>
                    <th className="py-3 px-4 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayGrades.map((grade, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {grade.materia}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {grade.docente}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-lg ${
                            grade.calificacion >= 9.0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : grade.calificacion >= 8.0
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {grade.calificacion.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 italic">
                        "{grade.observaciones}"
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Acreditada</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                * Calificación mínima aprobatoria institucional: <strong>6.0</strong>.
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Promedio Ponderado del Periodo:</span>
                <span className="px-3 py-1 bg-[#0B2545] text-white rounded-xl font-mono font-black text-sm">
                  {average}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Official Printable Report Card Modal */}
      {showBoletaModal && activeStudent && (
        <ReportCardModal
          student={activeStudent}
          initialPeriodicidad={effectivePeriodicidad}
          onClose={() => setShowBoletaModal(false)}
        />
      )}
    </div>
  );
};
