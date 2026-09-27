import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, Search, Calendar, CheckCircle2, Clock, BookOpen, X, Phone, Mail } from 'lucide-react';

export const TeachersModule: React.FC = () => {
  const { activeCollege, teachers, activities, addTeacher } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'plantilla' | 'planeaciones'>('plantilla');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  // New teacher form state
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [horasSemanales, setHorasSemanales] = useState('25');

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeActivities = activities.filter((a) => a.colegioId === activeCollege.id);

  const filteredTeachers = collegeTeachers.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.especialidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;

    addTeacher({
      colegioId: activeCollege.id,
      nombre,
      correo,
      telefono: telefono || '+52 (55) 0000-0000',
      especialidad: especialidad || 'Docencia General',
      materias: ['Materia Asignada'],
      grupos: ['1° A', '2° A'],
      horasSemanales: parseInt(horasSemanales) || 20,
      estatus: 'activo',
      foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    });

    setNombre('');
    setCorreo('');
    setTelefono('');
    setEspecialidad('');
    setIsAddTeacherOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: primaryColor }} />
            Docentes y Actividades Académicas
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Plantilla de profesores y seguimiento a planeaciones didácticas
          </p>
        </div>

        <button
          onClick={() => setIsAddTeacherOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-sm transition-all active:scale-98 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Profesor</span>
        </button>
      </div>

      {/* Segmented Controls (Tabs) */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('plantilla')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'plantilla'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Plantilla Docente ({collegeTeachers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('planeaciones')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'planeaciones'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Actividades y Planeaciones ({collegeActivities.length})
        </button>
      </div>

      {activeSubTab === 'plantilla' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((tch) => (
            <div
              key={tch.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={tch.foto}
                  alt={tch.nombre}
                  className="w-12 h-12 rounded-full object-cover border shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {tch.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{tch.especialidad}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{tch.correo}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Horas Semanales:</span>
                  <span className="font-bold text-slate-900">{tch.horasSemanales} hrs</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Grupos a Cargo:</span>
                  <span className="font-semibold text-slate-800">
                    {tch.grupos.join(', ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Materias Impartidas
                </span>
                <div className="flex flex-wrap gap-1">
                  {tch.materias.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Actividades Docentes / Planeaciones */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-900">
              Planeaciones Didácticas Semanales
            </h3>
            <span className="text-xs text-slate-500">Supervisadas por Coordinación</span>
          </div>

          <div className="divide-y divide-slate-100">
            {collegeActivities.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        act.estado === 'Aprobada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.estado}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{act.titulo}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{act.semana}</span>
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Docente:</strong> {act.docenteNombre} · <strong>Materia:</strong>{' '}
                  {act.materia} ({act.gradoGrupo})
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                  <strong>Objetivo de Aprendizaje:</strong> {act.objetivo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Profesor</h3>
              <button onClick={() => setIsAddTeacherOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lic. Fernando Treviño"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="profesor@colegio.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Matemáticas"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Horas Semanales</label>
                  <input
                    type="number"
                    value={horasSemanales}
                    onChange={(e) => setHorasSemanales(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
