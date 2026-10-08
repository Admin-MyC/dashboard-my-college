import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Student,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
} from '../types';
import { Printer, X, Download, ShieldCheck, Calendar } from 'lucide-react';
import {
  generateReportCardsPdf,
  getGradePeriodsForModalidad,
} from '../utils/reportCardPdfGenerator';

interface Props {
  student: Student | null;
  onClose: () => void;
  initialPeriodicidad?: EvaluationPeriodicity;
}

export const ReportCardModal: React.FC<Props> = ({
  student,
  onClose,
  initialPeriodicidad,
}) => {
  const { activeCollege, colleges, grades, setCollegeEvaluationPeriodicity, currentUser } = useApp();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const effectiveCollege =
    activeCollege ||
    (student ? colleges.find((c) => c.id === student.colegioId) || null : null);

  const [selectedPeriodicidad, setSelectedPeriodicidad] = useState<EvaluationPeriodicity>(
    initialPeriodicidad || effectiveCollege?.periodicidadEvaluacion || 'bimestral'
  );

  useEffect(() => {
    if (initialPeriodicidad) {
      setSelectedPeriodicidad(initialPeriodicidad);
    } else if (effectiveCollege?.periodicidadEvaluacion) {
      setSelectedPeriodicidad(effectiveCollege.periodicidadEvaluacion);
    }
  }, [initialPeriodicidad, effectiveCollege?.periodicidadEvaluacion]);

  if (!student || !effectiveCollege) return null;

  const meta =
    EVALUATION_PERIODICITY_CONFIG[selectedPeriodicidad] ||
    EVALUATION_PERIODICITY_CONFIG.bimestral;

  const studentGrades = grades.filter(
    (g) => g.colegioId === effectiveCollege.id && g.estudianteId === student.id
  );

  const rowsWithPeriods = studentGrades.map((g) => {
    const pValues = getGradePeriodsForModalidad(g, selectedPeriodicidad);
    const rowAvg = Number(
      (pValues.reduce((acc, v) => acc + v, 0) / pValues.length).toFixed(1)
    );
    return {
      ...g,
      pValues,
      rowAvg,
    };
  });

  const finalAvg =
    rowsWithPeriods.length > 0
      ? (
          rowsWithPeriods.reduce((sum, g) => sum + g.rowAvg, 0) /
          rowsWithPeriods.length
        ).toFixed(1)
      : student.promedio.toFixed(1);

  const primaryColor = effectiveCollege.colores.primario || '#0B2545';
  const goldColor = effectiveCollege.colores.secundario || '#C59B27';

  const handleChangePeriodicidad = (newPer: EvaluationPeriodicity) => {
    setSelectedPeriodicidad(newPer);
    if (currentUser.rol !== 'tutor' && currentUser.rol !== 'alumno') {
      setCollegeEvaluationPeriodicity(effectiveCollege.id, newPer);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateReportCardsPdf({
        college: effectiveCollege,
        students: [student],
        grades,
        periodicidad: selectedPeriodicidad,
        filename: `Boleta_${meta.label}_${student.apellidos}_${student.nombre}_${student.matricula}.pdf`.replace(
          /\s+/g,
          '_'
        ),
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-300 cursor-default"
      >
        {/* Modal Controls (Hidden in print) */}
        <div className="p-4 bg-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              {meta.boletaLabel}
            </span>
            <span className="text-xs text-slate-400">· {effectiveCollege.nombre}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Modalidad de Boleta (Mensual, Bimestral, Trimestral, Cuatrimestral, Semestral) */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                Obtener Boleta:
              </span>
              <select
                value={selectedPeriodicidad}
                onChange={(e) =>
                  handleChangePeriodicidad(e.target.value as EvaluationPeriodicity)
                }
                className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {(
                  [
                    'mensual',
                    'bimestral',
                    'trimestral',
                    'cuatrimestral',
                    'semestral',
                  ] as EvaluationPeriodicity[]
                ).map((per) => (
                  <option key={per} value={per} className="bg-slate-900 text-white">
                    {EVALUATION_PERIODICITY_CONFIG[per].label} (
                    {EVALUATION_PERIODICITY_CONFIG[per].periodCount} periodos)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isDownloadingPdf
                  ? 'Generando PDF...'
                  : `Descargar Boleta ${meta.label} (.PDF)`}
              </span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* OFFICIAL PRINTABLE REPORT CARD (Boleta Oficial de Evaluación) */}
        {/* ============================================================== */}
        <div
          id="printable-report-card"
          className="p-8 sm:p-10 bg-white text-slate-900 space-y-6 print:p-6"
        >
          {/* Header with College Shield & Official Name */}
          <div
            className="flex items-center justify-between pb-6 border-b-2 gap-4"
            style={{ borderColor: primaryColor }}
          >
            {/* Shield uploaded by the college (Only shown if uploaded) */}
            <div className="flex items-center gap-4">
              {effectiveCollege.escudoUrl && (
                <img
                  src={effectiveCollege.escudoUrl}
                  alt={effectiveCollege.nombre}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg p-1 bg-white border border-slate-200 shadow-2xs"
                />
              )}
              <div>
                <div
                  className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-wide leading-tight"
                  style={{ color: primaryColor }}
                >
                  {effectiveCollege.nombre}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  Clave C.C.T.: <span className="font-mono font-bold">{effectiveCollege.codigoCCT}</span> · Incorporado al Sistema Educativo
                </div>
                <div className="text-xs text-slate-500 italic mt-0.5">
                  "{effectiveCollege.lema}"
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {effectiveCollege.direccion} · Tel. {effectiveCollege.telefono}
                </div>
              </div>
            </div>

            {/* Document badge with Gold Accent */}
            <div className="text-right shrink-0">
              <div
                className="px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider inline-block text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {meta.boletaLabel}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                Modalidad {meta.label} · Ciclo 2026 - 2027
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Folio: BE-{student.matricula}
              </div>
            </div>
          </div>

          {/* Student Info Box */}
          <div
            className="p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            style={{
              borderColor: `${primaryColor}30`,
              backgroundColor: `${primaryColor}06`,
            }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Alumno(a)
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {student.apellidos}, {student.nombre}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Matrícula Escolar
              </span>
              <span className="font-mono font-bold text-slate-800">
                {student.matricula}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Grado y Grupo
              </span>
              <span className="font-semibold text-slate-800">
                {student.grado} Grupo "{student.grupo}"
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Modalidad de Evaluación
              </span>
              <span className="font-bold text-slate-800 uppercase">
                {meta.label} ({meta.periodCount} periodos)
              </span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr
                  className="text-white text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="py-2.5 px-3">Asignatura / Malla Curricular</th>
                  {meta.shortLabels.map((lbl, idx) => (
                    <th key={idx} className="py-2.5 px-1.5 text-center">
                      {lbl}
                    </th>
                  ))}
                  <th
                    className="py-2.5 px-3 text-center"
                    style={{ backgroundColor: goldColor, color: '#0B2545' }}
                  >
                    Promedio
                  </th>
                  <th className="py-2.5 px-3">Observaciones Docentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rowsWithPeriods.length > 0 ? (
                  rowsWithPeriods.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {g.materiaNombre}
                      </td>
                      {g.pValues.map((val, pIdx) => (
                        <td
                          key={pIdx}
                          className="py-2 px-1.5 text-center font-mono tabular-nums"
                        >
                          {val.toFixed(1)}
                        </td>
                      ))}
                      <td
                        className="py-2 px-3 text-center font-mono font-bold tabular-nums"
                        style={{
                          backgroundColor: `${goldColor}15`,
                          color: primaryColor,
                        }}
                      >
                        {g.rowAvg.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                        {g.observaciones || 'Desempeño adecuado'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={meta.periodCount + 3}
                      className="py-6 text-center text-slate-400 italic"
                    >
                      No hay registros de calificaciones para este alumno en el periodo actual.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 text-right uppercase text-slate-700">
                    Promedio General ({meta.label}):
                  </td>
                  <td
                    colSpan={meta.periodCount}
                    className="text-center font-mono text-slate-500"
                  >
                    Aprobatorio
                  </td>
                  <td
                    className="py-2.5 px-3 text-center font-mono text-sm tabular-nums"
                    style={{
                      backgroundColor: goldColor,
                      color: primaryColor,
                    }}
                  >
                    {finalAvg}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-emerald-800 font-semibold">
                    Acreditado con Excelencia
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Institutional Signatures & Verification Stamp */}
          <div className="pt-8 grid grid-cols-3 gap-6 items-end text-center text-xs text-slate-600 print-break-inside-avoid">
            {/* Signature 1 */}
            <div>
              <div className="h-14 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-400 text-sm">
                  {effectiveCollege.director}
                </span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                {effectiveCollege.director}
              </div>
              <div className="text-[10px] text-slate-400">Director(a) del Plantel</div>
            </div>

            {/* QR & Security Seal */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-xl border-2 flex items-center justify-center p-2 mb-1"
                style={{ borderColor: goldColor }}
              >
                <div className="text-[9px] font-mono leading-none text-slate-600 text-center">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-0.5 text-amber-600" />
                  SELLO DIGITAL
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                VALIDACIÓN OFICIAL MY COLLEGE
              </span>
            </div>

            {/* Signature 2 */}
            <div>
              <div className="h-14 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-400 text-sm">
                  {student.tutorNombre}
                </span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                {student.tutorNombre}
              </div>
              <div className="text-[10px] text-slate-400">Firma de Padre / Tutor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
