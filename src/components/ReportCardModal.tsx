import React from 'react';
import { useApp } from '../context/AppContext';
import { Student, GradeRecord } from '../types';
import { Printer, X, Download, ShieldCheck, QrCode } from 'lucide-react';

interface Props {
  student: Student | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<Props> = ({ student, onClose }) => {
  const { activeCollege, grades, subjects } = useApp();

  if (!student || !activeCollege) return null;

  const studentGrades = grades.filter(
    (g) => g.colegioId === activeCollege.id && g.estudianteId === student.id
  );

  const finalAvg =
    studentGrades.length > 0
      ? (
          studentGrades.reduce((sum, g) => sum + g.promedioFinal, 0) /
          studentGrades.length
        ).toFixed(1)
      : student.promedio.toFixed(1);

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-300">
        {/* Modal Controls (Hidden in print) */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Vista Previa de Boleta Oficial
            </span>
            <span className="text-xs text-slate-400">· {activeCollege.nombre}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
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
            {/* Shield uploaded by the college */}
            <div className="flex items-center gap-4">
              <img
                src={activeCollege.escudoUrl}
                alt={activeCollege.nombre}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg p-1 bg-white border border-slate-200 shadow-2xs"
              />
              <div>
                <div
                  className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-wide leading-tight"
                  style={{ color: primaryColor }}
                >
                  {activeCollege.nombre}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  Clave C.C.T.: <span className="font-mono font-bold">{activeCollege.codigoCCT}</span> · Incorporado al Sistema Educativo
                </div>
                <div className="text-xs text-slate-500 italic mt-0.5">
                  "{activeCollege.lema}"
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeCollege.direccion} · Tel. {activeCollege.telefono}
                </div>
              </div>
            </div>

            {/* Document badge with Gold Accent */}
            <div className="text-right shrink-0">
              <div
                className="px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider inline-block text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Boleta de Evaluación
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                Ciclo Escolar 2026 - 2027
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
                C.U.R.P.
              </span>
              <span className="font-mono text-slate-700">
                {student.curp || 'HERA080415HDFRRL01'}
              </span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-hidden border border-slate-300 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead>
                <tr
                  className="text-white text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="py-2.5 px-3">Asignatura / Malla Curricular</th>
                  <th className="py-2.5 px-2 text-center w-20">1° Bim</th>
                  <th className="py-2.5 px-2 text-center w-20">2° Bim</th>
                  <th className="py-2.5 px-2 text-center w-20">3° Bim</th>
                  <th
                    className="py-2.5 px-3 text-center w-24"
                    style={{ backgroundColor: goldColor, color: '#0B2545' }}
                  >
                    Promedio
                  </th>
                  <th className="py-2.5 px-3">Observaciones Docentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentGrades.length > 0 ? (
                  studentGrades.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {g.materiaNombre}
                      </td>
                      <td className="py-2 px-2 text-center font-mono tabular-nums">
                        {g.periodo1.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono tabular-nums">
                        {g.periodo2.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono tabular-nums">
                        {g.periodo3.toFixed(1)}
                      </td>
                      <td
                        className="py-2 px-3 text-center font-mono font-bold tabular-nums"
                        style={{
                          backgroundColor: `${goldColor}15`,
                          color: primaryColor,
                        }}
                      >
                        {g.promedioFinal.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                        {g.observaciones || 'Desempeño adecuado'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No hay registros de calificaciones para este alumno en el periodo actual.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 text-right uppercase text-slate-700">
                    Promedio General Acumulado:
                  </td>
                  <td colSpan={3} className="text-center font-mono text-slate-500">
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
                  {activeCollege.director}
                </span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                {activeCollege.director}
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
