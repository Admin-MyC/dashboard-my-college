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
  Upload,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { ReportCardModal } from '../components/ReportCardModal';
import {
  Student,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  AcademicLevel,
} from '../types';
import { getGradePeriodsForModalidad } from '../utils/reportCardPdfGenerator';
import { compressImageFile } from '../utils/imageCompressor';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const TutorAcademicHistoryModule: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    currentUser,
    students,
    colleges,
    grades,
    evaluationSavedPeriods,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    users,
    sendEmailNotification,
    schoolCycles,
  } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activePeriodIndex, setActivePeriodIndex] = useState<number | 'final'>(1);
  const [showBoletaModal, setShowBoletaModal] = useState(false);
  const [showJustificanteModal, setShowJustificanteModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('nueva_fecha');
  const [customAbsenceDate, setCustomAbsenceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [justificationMotivo, setJustificationMotivo] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofFileDataUrl, setProofFileDataUrl] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

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

  // Cycles for student's college
  const studentCycles = activeStudent
    ? (schoolCycles || []).filter((c) => c.colegioId === activeStudent.colegioId)
    : [];
  const activeStudentCycle =
    studentCycles.find((c) => c.activo) || studentCycles[0] || null;
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => activeStudentCycle?.id || '');

  const selectedCycleObj = studentCycles.find((c) => c.id === selectedCycleId) || activeStudentCycle;

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

  const collegeSavedPeriods = activeStudent
    ? (evaluationSavedPeriods || []).filter(
        (p) =>
          p.colegioId === activeStudent.colegioId &&
          (!p.cicloId || p.cicloId === selectedCycleId || (!selectedCycleId && p.cicloId === activeStudentCycle?.id))
      )
    : [];

  // Filter grades for active student and normalize (filtered by selected school cycle)
  const studentGrades =
    activeStudent && collegeSavedPeriods.length > 0
      ? grades.filter((g) => {
          if (g.estudianteId !== activeStudent.id) return false;
          if (selectedCycleId && g.cicloId && g.cicloId !== selectedCycleId) return false;
          if (!g.cicloId && selectedCycleId !== activeStudentCycle?.id) return false;
          const pVals = getGradePeriodsForModalidad(
            g,
            effectivePeriodicidad,
            collegeSavedPeriods
          );
          return pVals.some((v) => v > 0);
        })
      : [];

  const displayGrades: SubjectGradeRow[] = studentGrades.map((g) => {
    const pValues = getGradePeriodsForModalidad(
      g,
      effectivePeriodicidad,
      collegeSavedPeriods
    );
    const nonZero = pValues.filter((v) => v > 0);
    const avg =
      nonZero.length > 0
        ? Number((nonZero.reduce((acc, v) => acc + v, 0) / nonZero.length).toFixed(1))
        : 0;
    const chosenScore =
      activePeriodIndex === 'final'
        ? avg
        : pValues[Math.max(0, Math.min(pValues.length - 1, activePeriodIndex - 1))] ?? 0;
    return {
      id: g.id,
      materia: g.materiaNombre,
      docente: 'Docente Titular',
      calificacion: chosenScore,
      observaciones: g.observaciones || '',
    };
  });

  const gradedDisplay = displayGrades.filter((g) => g.calificacion > 0);
  const average =
    gradedDisplay.length > 0
      ? (
          gradedDisplay.reduce((acc, g) => acc + g.calificacion, 0) / gradedDisplay.length
        ).toFixed(1)
      : '0.0';

  const primaryColor = college?.colores?.primario || '#0B2545';
  const goldColor = college?.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in max-w-7xl w-full min-w-0 mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-5 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 transition-colors overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-2 min-w-0">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-2xs max-w-full"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Portal de Tutores · Historial Académico</span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-3xl tracking-tight leading-tight">
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
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 w-full sm:w-auto mb-0.5 sm:mb-0">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
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
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {studentCycles.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700">Ciclo:</span>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {studentCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.activo ? '⭐ (Activo)' : '(Histórico)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (!activeStudent) return;
                const studentFaltas = attendanceRecords.filter(
                  (a) =>
                    a.estudianteId === activeStudent.id &&
                    (a.estado === 'falta' || a.estado === 'retardo') &&
                    a.justificanteEstado !== 'aprobado'
                );
                setSelectedRecordId(
                  studentFaltas.length > 0 ? studentFaltas[0].id : 'nueva_fecha'
                );
                setJustificationMotivo('');
                setProofFileName('');
                setProofFileDataUrl('');
                setSubmitSuccessMsg(null);
                setShowJustificanteModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Enviar Justificante</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBoletaModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir Boleta {meta.label}</span>
            </button>
          </div>
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
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 text-center sm:text-left min-w-0 w-full md:w-auto">
              <img
                src={activeStudent.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                alt={activeStudent.nombre}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900">
                    {activeStudent.nombre} {activeStudent.apellidos}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                    {activeStudent.grado} Grupo "{activeStudent.grupo}"
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono break-all sm:break-normal">
                  Matrícula: {activeStudent.matricula} · CURP: {activeStudent.curp}
                </p>
                <p className="text-xs text-slate-600 font-semibold">
                  {college?.nombre}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-[110px]">
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

              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[110px]">
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

          {/* Grades Table & Mobile Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Sábana de Calificaciones por Materia</span>
              </h3>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-600">
                Escala oficial: 5.0 - 10.0
              </span>
            </div>

            {/* VISTA MÓVIL: Tarjetas por materia sin desplazamiento horizontal */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayGrades.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Aún no hay calificaciones publicadas para este periodo.
                </div>
              ) : (
                displayGrades.map((grade, idx) => (
                  <div key={idx} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {grade.materia}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {grade.docente}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-mono font-black text-sm ${
                            grade.calificacion >= 9.0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : grade.calificacion >= 8.0
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {grade.calificacion.toFixed(1)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Acreditada</span>
                        </span>
                      </div>
                    </div>

                    {grade.observaciones && (
                      <div className="text-[11px] text-slate-600 italic bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
                        "{grade.observaciones}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
          schoolCycle={selectedCycleObj}
          cycleGrades={studentGrades}
          onClose={() => setShowBoletaModal(false)}
        />
      )}

      {/* Modal: Enviar Justificante para el alumno seleccionado */}
      {showJustificanteModal && activeStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            {(() => {
              const stLevel: AcademicLevel =
                activeStudent.nivel ||
                (college?.nivel?.toLowerCase() === 'preescolar'
                  ? 'Preescolar'
                  : college?.nivel?.toLowerCase() === 'secundaria'
                  ? 'Secundaria'
                  : college?.nivel?.toLowerCase() === 'preparatoria'
                  ? 'Preparatoria'
                  : 'Primaria');
              const stGrupoClean = (activeStudent.grupo || '')
                .replace(/["']/g, '')
                .trim()
                .toUpperCase();
              const fullGroupKey = `${stLevel} ${activeStudent.grado} ${stGrupoClean}`.toLowerCase();
              const collegeCoords = users.filter(
                (u) =>
                  u.colegioId === activeStudent.colegioId &&
                  u.rol === 'coordinador' &&
                  u.activo !== false
              );
              const coord =
                collegeCoords.find((u) =>
                  (u.gruposAsignados || []).some(
                    (g) =>
                      g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() ===
                      fullGroupKey
                  )
                ) ||
                collegeCoords.find(
                  (u) =>
                    (!u.gruposAsignados || u.gruposAsignados.length === 0) &&
                    ((u.nivelesAsignados && u.nivelesAsignados.includes(stLevel)) ||
                      u.nivelAsignado === stLevel ||
                      (u.cargo || '').toLowerCase().includes(stLevel.toLowerCase()))
                ) ||
                collegeCoords[0];
              const studentAbsenceHistory = attendanceRecords.filter(
                (a) =>
                  a.estudianteId === activeStudent.id &&
                  (a.estado === 'falta' ||
                    a.estado === 'retardo' ||
                    Boolean(a.justificanteEstado))
              );

              return (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                        <Upload className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                          Enviar Justificante · {activeStudent.nombre} {activeStudent.apellidos}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Grupo: {stLevel} {activeStudent.grado} "{activeStudent.grupo}" · Destino:{' '}
                          <strong className="text-indigo-900">
                            {coord?.nombre || `Coordinador de ${stLevel}`}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowJustificanteModal(false)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {submitSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>{submitSuccessMsg}</div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!justificationMotivo.trim()) return;
                      const todayIso = new Date().toISOString().split('T')[0];
                      let targetFecha = customAbsenceDate;
                      if (selectedRecordId !== 'nueva_fecha') {
                        const rec = attendanceRecords.find((r) => r.id === selectedRecordId);
                        if (rec) {
                          targetFecha = rec.fecha;
                          updateAttendanceRecord(rec.id, {
                            nivel: stLevel,
                            justificanteEstado: 'pendiente',
                            justificanteMotivo: justificationMotivo.trim(),
                            justificanteArchivoNombre:
                              proofFileName || 'Comprobante_Justificante.jpg',
                            justificanteArchivoUrl:
                              proofFileDataUrl ||
                              'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
                            justificanteFechaEnvio: todayIso,
                            justificanteEnviadoPor: currentUser.nombre,
                          });
                        }
                      } else {
                        addAttendanceRecord({
                          colegioId: activeStudent.colegioId,
                          estudianteId: activeStudent.id,
                          estudianteNombre: `${activeStudent.nombre} ${activeStudent.apellidos}`,
                          matricula: activeStudent.matricula,
                          nivel: stLevel,
                          grado: activeStudent.grado,
                          grupo: activeStudent.grupo,
                          foto: activeStudent.foto,
                          fecha: customAbsenceDate,
                          hora: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                          tipo: 'clase',
                          materiaNombre: 'Matemáticas III',
                          docenteNombre: activeStudent.docenteNombre || 'Docente Titular',
                          estado: 'falta',
                          metodo: 'manual',
                          registradoPor: `Reporte con Justificante (${currentUser.nombre})`,
                          tutorNotificado: true,
                          justificanteEstado: 'pendiente',
                          justificanteMotivo: justificationMotivo.trim(),
                          justificanteArchivoNombre:
                            proofFileName || 'Comprobante_Justificante.jpg',
                          justificanteArchivoUrl:
                            proofFileDataUrl ||
                            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
                          justificanteFechaEnvio: todayIso,
                          justificanteEnviadoPor: currentUser.nombre,
                        });
                      }

                      sendEmailNotification({
                        colegioId: activeStudent.colegioId,
                        colegioNombre: college?.nombre || 'Colegio',
                        destinatarios: [coord?.correo || 'coordinacion@colegio.edu.mx'],
                        rolesDestino: ['coordinador'],
                        usuariosDestino: coord ? [coord.id, coord.correo] : [],
                        asunto: `[Solicitud de Justificante] ${activeStudent.nombre} ${activeStudent.apellidos} (${stLevel} ${activeStudent.grado} "${activeStudent.grupo}") - ${targetFecha}`,
                        cuerpo: `El tutor ${currentUser.nombre} ha enviado un comprobante/justificante para ${activeStudent.nombre} ${activeStudent.apellidos} del grupo ${stLevel} ${activeStudent.grado} "${activeStudent.grupo}" correspondiente al día ${targetFecha}.\n\nMotivo: ${justificationMotivo.trim()}`,
                        categoria: 'asistencia',
                        prioridad: 'alta',
                      });

                      setSubmitSuccessMsg(
                        `✓ Justificante enviado a ${
                          coord?.nombre || `Coordinación de ${stLevel}`
                        }. El Coordinador asignado decidirá si cambia la falta a [J] Justificado.`
                      );
                      setJustificationMotivo('');
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        1. Selecciona la falta o fecha a justificar:
                      </label>
                      <select
                        value={selectedRecordId}
                        onChange={(e) => setSelectedRecordId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                      >
                        {studentAbsenceHistory
                          .filter((r) => r.estado !== 'justificado')
                          .map((rec) => (
                            <option key={rec.id} value={rec.id}>
                              [{rec.estado.toUpperCase()}] Fecha: {rec.fecha}{' '}
                              {rec.materiaNombre ? `· ${rec.materiaNombre}` : ''}
                            </option>
                          ))}
                        <option value="nueva_fecha">
                          📅 Seleccionar otra fecha específica...
                        </option>
                      </select>
                    </div>

                    {selectedRecordId === 'nueva_fecha' && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 block">
                          Fecha de la falta:
                        </label>
                        <input
                          type="date"
                          value={customAbsenceDate}
                          onChange={(e) => setCustomAbsenceDate(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        2. Motivo de la inasistencia:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={justificationMotivo}
                        onChange={(e) => setJustificationMotivo(e.target.value)}
                        placeholder="Describe el motivo de la falta y el documento que adjuntas..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        3. Comprobante o justificativo (Imagen o PDF):
                      </label>
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl bg-indigo-50/40 cursor-pointer text-center">
                        <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                        <span className="font-bold text-indigo-950">
                          {proofFileName
                            ? `📎 ${proofFileName}`
                            : 'Subir comprobante médico o justificante'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setProofFileName(file.name);
                            try {
                              const dataUrl = await compressImageFile(file, 540, 540, 0.82);
                              setProofFileDataUrl(dataUrl);
                            } catch {
                              // ignore
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowJustificanteModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        Cerrar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar al Coordinador</span>
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
