import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Plus, Search, X } from 'lucide-react';

export const SubjectsModule: React.FC = () => {
  const { activeCollege, subjects, addSubject } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [grado, setGrado] = useState('3° Secundaria');
  const [creditos, setCreditos] = useState('8');
  const [horas, setHoras] = useState('5');
  const [docente, setDocente] = useState('');

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    addSubject({
      colegioId: activeCollege.id,
      nombre,
      clave: clave || `ASIG-${Math.floor(100 + Math.random() * 899)}`,
      grado,
      creditos: parseInt(creditos) || 6,
      horasSemanales: parseInt(horas) || 4,
      docenteNombre: docente || 'Por asignar',
    });

    setNombre('');
    setClave('');
    setDocente('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
            Malla Curricular y Materias
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Plan de estudios oficial, créditos y asignación de profesores
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-sm transition-all active:scale-98 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Agregar Materia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collegeSubjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {sub.clave}
              </span>
              <span className="text-xs text-slate-500">{sub.grado}</span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm leading-snug">
              {sub.nombre}
            </h3>

            <div className="p-2.5 rounded-lg bg-slate-50 border text-xs text-slate-600 flex justify-between">
              <span>{sub.creditos} Créditos</span>
              <span>·</span>
              <span>{sub.horasSemanales} hrs / semana</span>
            </div>

            <div className="text-xs text-slate-500">
              <span className="text-slate-400">Profesor titular:</span>{' '}
              <span className="font-semibold text-slate-800">{sub.docenteNombre}</span>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Agregar Asignatura</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Nombre de la Materia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Física Clásica"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Clave</label>
                  <input
                    type="text"
                    placeholder="FIS-201"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Grado</label>
                  <input
                    type="text"
                    value={grado}
                    onChange={(e) => setGrado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Créditos</label>
                  <input
                    type="number"
                    value={creditos}
                    onChange={(e) => setCreditos(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Horas Semanales</label>
                  <input
                    type="number"
                    value={horas}
                    onChange={(e) => setHoras(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Docente Asignado</label>
                <input
                  type="text"
                  placeholder="Nombre del profesor"
                  value={docente}
                  onChange={(e) => setDocente(e.target.value)}
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
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
