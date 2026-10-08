import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Plus, Search, CheckCircle2, Clock, X, AlertTriangle, FileText } from 'lucide-react';
import { IncidentRecord } from '../types';

export const IncidentsModule: React.FC = () => {
  const { activeCollege, incidents, students, addIncident, updateIncident, sendEmailNotification } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [estudianteId, setEstudianteId] = useState('');
  const [tipo, setTipo] = useState<IncidentRecord['tipo']>('Leve');
  const [descripcion, setDescripcion] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [reportadoPor, setReportadoPor] = useState('Prefectura General');

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';
  const collegeStudents = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeIncidents = incidents.filter((i) => i.colegioId === activeCollege.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const st = collegeStudents.find((s) => s.id === estudianteId) || collegeStudents[0];
    if (!st) return;

    addIncident({
      colegioId: activeCollege.id,
      estudianteId: st.id,
      estudianteNombre: `${st.nombre} ${st.apellidos}`,
      gradoGrupo: `${st.grado} ${st.grupo}`,
      reportadoPor,
      tipo,
      descripcion,
      acuerdos: acuerdos || 'Notificado al tutor y registrado en bitácora.',
      fecha: new Date().toISOString().split('T')[0],
      estatus: tipo === 'Reconocimiento' ? 'Resuelto' : 'En seguimiento',
    });

    // Despachar notificación automática oficial por correo electrónico a los roles involucrados
    const rolesTarget = tipo === 'Citatorio Tutor'
      ? ['directivo', 'prefecto', 'psicologo']
      : tipo === 'Grave'
      ? ['directivo', 'prefecto']
      : ['prefecto', 'docente'];

    sendEmailNotification({
      colegioId: activeCollege.id,
      colegioNombre: activeCollege.nombre,
      destinatarios: [st.tutorCorreo || 'tutor@familia.com', 'prefectura@mycollege.edu.mx', 'direccion@mycollege.edu.mx'],
      rolesDestino: rolesTarget,
      asunto: `[Incidencia ${tipo}] Reporte de conducta: ${st.nombre} ${st.apellidos} (${st.grado} ${st.grupo})`,
      cuerpo: `Se ha registrado una incidencia disciplinaria en ${activeCollege.nombre}:\n\nAlumno: ${st.nombre} ${st.apellidos} (${st.grado} ${st.grupo})\nTipo: ${tipo}\nReportado por: ${reportadoPor}\nDescripción: ${descripcion}\nAcuerdos: ${acuerdos || 'En seguimiento'}`,
      categoria: 'incidencia',
      prioridad: tipo === 'Grave' || tipo === 'Citatorio Tutor' ? 'alta' : 'normal',
    });

    setDescripcion('');
    setAcuerdos('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
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
              Seguimiento Conductual
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" style={{ color: goldColor }} />
            Incidencias Disciplinarias y Prefectura
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Bitácora de conducta, citatorios a tutores y reconocimientos al mérito
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Levantar Incidencia</span>
        </button>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {collegeIncidents.length > 0 ? (
            collegeIncidents.map((inc) => (
              <div key={inc.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        inc.tipo === 'Reconocimiento'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.tipo === 'Citatorio Tutor'
                          ? 'bg-rose-100 text-rose-800'
                          : inc.tipo === 'Grave'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.tipo}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {inc.estudianteNombre} ({inc.gradoGrupo})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{inc.fecha}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">{inc.reportadoPor}</span>
                    <button
                      onClick={() =>
                        updateIncident(inc.id, {
                          estatus: inc.estatus === 'Resuelto' ? 'En seguimiento' : 'Resuelto',
                        })
                      }
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        inc.estatus === 'Resuelto'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {inc.estatus}
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-700">{inc.descripcion}</p>

                {inc.acuerdos && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                    <strong>Resolución / Acuerdos:</strong> {inc.acuerdos}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              No hay incidencias registradas en este plantel.
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Incidencia</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Alumno</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecciona alumno...</option>
                  {collegeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.apellidos} ({s.grado} {s.grupo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tipo de Registro</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Leve">Falta Leve</option>
                    <option value="Grave">Falta Grave</option>
                    <option value="Citatorio Tutor">Citatorio a Tutor</option>
                    <option value="Reconocimiento">Reconocimiento al Mérito</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Reportado Por</label>
                  <input
                    type="text"
                    value={reportadoPor}
                    onChange={(e) => setReportadoPor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Descripción de los Hechos</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalla lo ocurrido..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Acuerdos / Compromisos</label>
                <input
                  type="text"
                  placeholder="Ej. Notificación enviada al tutor legal"
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
                  Guardar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
