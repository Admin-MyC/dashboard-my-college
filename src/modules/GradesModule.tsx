import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Printer, Search, Edit2, Download, Users, Building2, Calendar } from 'lucide-react';
import {
  Student,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
} from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import {
  generateReportCardsPdf,
  getGradePeriodsForModalidad,
} from '../utils/reportCardPdfGenerator';

export const GradesModule: React.FC = () => {
  const {
    activeCollege,
    students,
    grades,
    updateGrade,
    setCollegeEvaluationPeriodicity,
  } = useApp();
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('todos');
  const [isDownloadingGroupPdf, setIsDownloadingGroupPdf] = useState(false);
  const [isDownloadingCollegePdf, setIsDownloadingCollegePdf] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [tempPeriods, setTempPeriods] = useState<number[]>([]);

  if (!activeCollege) return null;

  const activePeriodicity: EvaluationPeriodicity =
    activeCollege.periodicidadEvaluacion || 'bimestral';
  const meta =
    EVALUATION_PERIODICITY_CONFIG[activePeriodicity] ||
    EVALUATION_PERIODICITY_CONFIG.bimestral;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeStudents = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeGrades = grades.filter((g) => g.colegioId === activeCollege.id);

  // Extract distinct Grado + Grupo options available in this college
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    collegeStudents.forEach((s) => {
      const label = `${s.grado}:::${s.grupo}`;
      set.add(label);
    });
    return Array.from(set).sort();
  }, [collegeStudents]);

  const filteredStudents = collegeStudents.filter((s) => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedGroupFilter !== 'todos') {
      const [grado, grupo] = selectedGroupFilter.split(':::');
      return s.grado === grado && s.grupo === grupo;
    }
    return true;
  });

  const handleDownloadByGroupPdf = async () => {
    const targetGroupKey =
      selectedGroupFilter !== 'todos'
        ? selectedGroupFilter
        : availableGroups[0] || '';
    const targetStudents = targetGroupKey
      ? collegeStudents.filter((s) => {
          const [gr, gp] = targetGroupKey.split(':::');
          return s.grado === gr && s.grupo === gp;
        })
      : collegeStudents;

    if (!targetStudents.length) return;

    setIsDownloadingGroupPdf(true);
    try {
      const [gr, gp] = targetGroupKey ? targetGroupKey.split(':::') : ['Grupo', 'General'];
      const cleanGroup = `${gr}_Grupo_${gp}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      await generateReportCardsPdf({
        college: activeCollege,
        students: targetStudents,
        grades: collegeGrades,
        periodicidad: activePeriodicity,
        filename: `Boletas_${meta.label}_${cleanGroup}_${activeCollege.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      });
    } finally {
      setIsDownloadingGroupPdf(false);
    }
  };

  const handleDownloadAllCollegePdf = async () => {
    if (!collegeStudents.length) return;
    setIsDownloadingCollegePdf(true);
    try {
      await generateReportCardsPdf({
        college: activeCollege,
        students: collegeStudents,
        grades: collegeGrades,
        periodicidad: activePeriodicity,
        filename: `Boletas_${meta.label}_Colegio_Completo_${activeCollege.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf`,
      });
    } finally {
      setIsDownloadingCollegePdf(false);
    }
  };

  const startEdit = (g: any) => {
    setEditingGradeId(g.id);
    setTempPeriods(getGradePeriodsForModalidad(g, activePeriodicity));
  };

  const saveEdit = (g: any) => {
    const cleanArr = tempPeriods.map((v) =>
      Number(Math.max(0, Math.min(10, Number(v) || 0)).toFixed(1))
    );
    const finalAvg = Number(
      (cleanArr.reduce((acc, v) => acc + v, 0) / cleanArr.length).toFixed(1)
    );
    updateGrade(g.id, {
      periodo1: cleanArr[0] ?? g.periodo1,
      periodo2: cleanArr[1] ?? g.periodo2,
      periodo3: cleanArr[2] ?? g.periodo3,
      promedioFinal: finalAvg,
      periodosPorModalidad: {
        ...(g.periodosPorModalidad || {}),
        [activePeriodicity]: cleanArr,
      },
    });
    setEditingGradeId(null);
  };

  return (
    <div className="space-y-6">
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
              Evaluación y Control Escolar
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: goldColor }} />
            Calificaciones y Boletas de Evaluación
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Registro bimestral, sábana de notas y descarga de boletas oficiales en PDF
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Obtener Boletas y Sábana:</span>
          </div>
          {(
            [
              'mensual',
              'bimestral',
              'trimestral',
              'cuatrimestral',
              'semestral',
            ] as EvaluationPeriodicity[]
          ).map((per) => {
            const isSelected = activePeriodicity === per;
            return (
              <button
                key={per}
                type="button"
                onClick={() => setCollegeEvaluationPeriodicity(activeCollege.id, per)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
          onClick={handleDownloadAllCollegePdf}
          disabled={isDownloadingCollegePdf || collegeStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: goldColor, color: primaryColor }}
          title="Descargar en un archivo .PDF todas las boletas de todo el colegio"
        >
          <Download className="w-4 h-4" />
          <span>
            {isDownloadingCollegePdf
              ? 'Generando PDF del Colegio...'
              : `Descargar Boletas ${meta.label} del Colegio (${collegeStudents.length}) .PDF`}
          </span>
        </button>
      </div>

      {/* Search & Group Filter Bar + PDF Download Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por estudiante o matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Filtrar / Elegir Grupo:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos los Grupos ({collegeStudents.length} alumnos)</option>
              {availableGroups.map((grpKey) => {
                const [gr, gp] = grpKey.split(':::');
                const count = collegeStudents.filter((s) => s.grado === gr && s.grupo === gp).length;
                return (
                  <option key={grpKey} value={grpKey}>
                    {gr} — Grupo "{gp}" ({count} alumnos)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadByGroupPdf}
            disabled={isDownloadingGroupPdf || collegeStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: goldColor }} />
            <span>
              {selectedGroupFilter !== 'todos'
                ? `Descargar PDF de ${selectedGroupFilter.replace(':::', ' Grupo ')}`
                : `Descargar PDF (${availableGroups[0] ? availableGroups[0].replace(':::', ' Grupo ') : 'Grupo'})`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAllCollegePdf}
            disabled={isDownloadingCollegePdf || collegeStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Descargar Todo el Colegio (.PDF)</span>
          </button>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-slate-900">
            Sábana de Calificaciones por Alumno
          </h3>
          <span className="text-xs text-slate-500">
            Ciclo Escolar Vigente 2026-2027
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredStudents.map((student) => {
            const studentGrades = collegeGrades.filter(
              (g) => g.estudianteId === student.id
            );

            return (
              <div key={student.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.foto}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border shrink-0"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {student.apellidos}, {student.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.grado} Grupo "{student.grupo}" · Matrícula:{' '}
                        <span className="font-mono">{student.matricula}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentForReport(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs self-start sm:self-auto transition-all active:scale-98"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Boleta Oficial</span>
                  </button>
                </div>

                {/* Subjects mini table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Materia</th>
                        {meta.shortLabels.map((lbl, idx) => (
                          <th key={idx} className="py-2 px-2 text-center">
                            {lbl}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-center">Promedio</th>
                        <th className="py-2 px-3 text-right">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentGrades.map((g) => {
                        const isEditing = editingGradeId === g.id;
                        const pValues = getGradePeriodsForModalidad(g, activePeriodicity);
                        const rowAvg = Number(
                          (pValues.reduce((acc, v) => acc + v, 0) / pValues.length).toFixed(1)
                        );
                        const tempAvg =
                          tempPeriods.length > 0
                            ? (
                                tempPeriods.reduce((acc, v) => acc + (Number(v) || 0), 0) /
                                tempPeriods.length
                              ).toFixed(1)
                            : rowAvg.toFixed(1);

                        return (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {g.materiaNombre}
                            </td>

                            {isEditing ? (
                              <>
                                {tempPeriods.map((val, pIdx) => (
                                  <td key={pIdx} className="py-2 px-1.5 text-center">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="10"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...tempPeriods];
                                        next[pIdx] = Number(e.target.value);
                                        setTempPeriods(next);
                                      }}
                                      className="w-12 text-center border rounded px-1 py-0.5 font-mono text-xs"
                                    />
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-center font-bold text-amber-700 font-mono">
                                  {tempAvg}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    onClick={() => saveEdit(g)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                                  >
                                    Guardar
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                {pValues.map((val, pIdx) => (
                                  <td
                                    key={pIdx}
                                    className="py-2 px-2 text-center font-mono tabular-nums"
                                  >
                                    {val.toFixed(1)}
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-center font-mono font-bold tabular-nums text-slate-900">
                                  {rowAvg.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    onClick={() => startEdit(g)}
                                    className="p-1 text-slate-400 hover:text-slate-800"
                                    title="Modificar Nota"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReportCardModal
        student={selectedStudentForReport}
        onClose={() => setSelectedStudentForReport(null)}
      />
    </div>
  );
};
