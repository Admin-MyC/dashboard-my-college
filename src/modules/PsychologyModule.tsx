import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartHandshake, Plus, Lock, CheckCircle2, X } from 'lucide-react';

export const PsychologyModule: React.FC = () => {
  const { activeCollege, psychologyRecords, students, addPsychologyRecord } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [estudianteId, setEstudianteId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [resumen, setResumen] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [esConfidencial, setEsConfidencial] = useState(true);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || "#0B2545";

  const collegeStudents = students.filter((s) => s.colegioId === activeCollege.id);
  const collegeRecords = psychologyRecords.filter((r) => r.colegioId === activeCollege.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const st = collegeStudents.find((s) => s.id === estudianteId) || collegeStudents[0];
    if (!st) return;

    addPsychologyRecord({
      colegioId: activeCollege.id,
      estudianteId: st.id,
      estudianteNombre: `${st.nombre} ${st.apellidos}`,
      gradoGrupo: `${st.grado} ${st.grupo}`,
      psicologoNombre: 'Lic. Mariana Garza Beltrán',
      motivoConsulta: motivo,
      resumenSesion: resumen,
      acuerdos: acuerdos || 'Seguimiento pautado en 15 días.',
      esConfidencial,
      fecha: new Date().toISOString().split('T')[0],
      estatus: 'En Proceso',
    });

    setMotivo('');
    setResumen('');
    setAcuerdos('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6" style={{ color: primaryColor }} />
            Departamento de Psicología y Orientación
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Bitácoras de atención psicopedagógica y seguimiento socioemocional
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-sm transition-all active:scale-98 self-start sm:self-auto cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Sesión Psicológica</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {collegeRecords.length > 0 ? (
          collegeRecords.map((rec) => (
            <div key={rec.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-sm">
                    {rec.estudianteNombre} ({rec.gradoGrupo})
                  </span>
                  {rec.esConfidencial && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" /> Confidencial
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{rec.fecha}</span>
              </div>

              <div className="text-xs text-slate-600 font-medium">
                <strong>Motivo de Intervención:</strong> {rec.motivoConsulta}
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
                {rec.resumenSesion}
              </p>

              <div className="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                <strong>Acuerdos y Plan de Acción:</strong> {rec.acuerdos}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 italic text-sm">
            No hay expedientes psicológicos registrados para este colegio.
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Sesión Psicológica</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Estudiante</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecciona alumno...</option>
                  {collegeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Motivo de Consulta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Orientación vocacional / Conducta"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Resumen de la Sesión</label>
                <textarea
                  rows={3}
                  required
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Acuerdos y Compromisos</label>
                <input
                  type="text"
                  value={acuerdos}
                  onChange={(e) => setAcuerdos(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
