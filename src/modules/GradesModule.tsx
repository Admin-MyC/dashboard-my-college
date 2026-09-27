import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Printer, Search, Plus, Check, Edit2, ShieldAlert } from 'lucide-react';
import { Student } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';

export const GradesModule: React.FC = () => {
  const { activeCollege, students, grades, subjects, updateGrade } = useApp();
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [tempP1, setTempP1] = useState<number>(10);
  const [tempP2, setTempP2] = useState<number>(10);
  const [tempP3, setTempP3] = useState<number>(10);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeStudents = students.filter((s) => s.colegioId === activeCollege.id);
  const collegeGrades = grades.filter((g) => g.colegioId === activeCollege.id);

  const filteredStudents = collegeStudents.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (g: any) => {
    setEditingGradeId(g.id);
    setTempP1(g.periodo1);
    setTempP2(g.periodo2);
    setTempP3(g.periodo3);
  };

  const saveEdit = (g: any) => {
    const finalAvg = Number(((tempP1 + tempP2 + tempP3) / 3).toFixed(1));
    updateGrade(g.id, {
      periodo1: tempP1,
      periodo2: tempP2,
      periodo3: tempP3,
      promedioFinal: finalAvg,
    });
    setEditingGradeId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: goldColor }} />
            Calificaciones y Boletas de Evaluación
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Registro bimestral, sábana de notas y generación de boletas oficiales
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por estudiante o matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
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
                        <th className="py-2 px-3 text-center">Bimestre 1</th>
                        <th className="py-2 px-3 text-center">Bimestre 2</th>
                        <th className="py-2 px-3 text-center">Bimestre 3</th>
                        <th className="py-2 px-3 text-center">Promedio</th>
                        <th className="py-2 px-3 text-right">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentGrades.map((g) => {
                        const isEditing = editingGradeId === g.id;

                        return (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {g.materiaNombre}
                            </td>

                            {isEditing ? (
                              <>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={tempP1}
                                    onChange={(e) => setTempP1(Number(e.target.value))}
                                    className="w-14 text-center border rounded px-1 py-0.5 font-mono text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={tempP2}
                                    onChange={(e) => setTempP2(Number(e.target.value))}
                                    className="w-14 text-center border rounded px-1 py-0.5 font-mono text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={tempP3}
                                    onChange={(e) => setTempP3(Number(e.target.value))}
                                    className="w-14 text-center border rounded px-1 py-0.5 font-mono text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-amber-700 font-mono">
                                  {((tempP1 + tempP2 + tempP3) / 3).toFixed(1)}
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
                                <td className="py-2 px-3 text-center font-mono tabular-nums">
                                  {g.periodo1.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono tabular-nums">
                                  {g.periodo2.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono tabular-nums">
                                  {g.periodo3.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold tabular-nums text-slate-900">
                                  {g.promedioFinal.toFixed(1)}
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
