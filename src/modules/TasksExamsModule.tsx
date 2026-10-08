import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, Plus, Calendar, Clock, CheckSquare, X } from 'lucide-react';
import { TaskOrExam } from '../types';

export const TasksExamsModule: React.FC = () => {
  const { activeCollege, tasksExams, addTaskOrExam } = useApp();
  const [filterType, setFilterType] = useState<'todos' | 'tarea' | 'examen'>('todos');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [tipo, setTipo] = useState<'tarea' | 'examen'>('tarea');
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState('Matemáticas III');
  const [gradoGrupo, setGradoGrupo] = useState('3° A');
  const [docenteNombre, setDocenteNombre] = useState('Lic. Carlos Fuentes');
  const [fechaLimite, setFechaLimite] = useState('2026-10-15 23:59');
  const [puntos, setPuntos] = useState('10');
  const [instrucciones, setInstrucciones] = useState('');

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';
  const collegeItems = tasksExams.filter((t) => t.colegioId === activeCollege.id);

  const filtered = collegeItems.filter(
    (t) => filterType === 'todos' || t.tipo === filterType
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    addTaskOrExam({
      colegioId: activeCollege.id,
      tipo,
      titulo,
      materia,
      gradoGrupo,
      docenteNombre,
      fechaLimite,
      puntosMaximos: parseInt(puntos) || 10,
      estado: 'Activa',
      instrucciones,
    });

    setTitulo('');
    setInstrucciones('');
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
              Actividades y Evaluaciones
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: goldColor }} />
            Tareas, Evaluaciones y Exámenes
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Programación de entregas, rúbricas de evaluación y calendario de exámenes
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
          <span>Crear Tarea o Examen</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setFilterType('todos')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
            filterType === 'todos' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
          }`}
        >
          Todos ({collegeItems.length})
        </button>
        <button
          onClick={() => setFilterType('tarea')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
            filterType === 'tarea' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
          }`}
        >
          Tareas
        </button>
        <button
          onClick={() => setFilterType('examen')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
            filterType === 'examen' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
          }`}
        >
          Exámenes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                    item.tipo === 'examen'
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {item.tipo}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Vence: {item.fechaLimite}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {item.titulo}
              </h3>

              <div className="text-xs text-slate-500">
                {item.materia} · {item.gradoGrupo}
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border">
                {item.instrucciones}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{item.docenteNombre}</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {item.puntosMaximos} pts
              </span>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Asignar Tarea o Examen</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="tarea">Tarea / Deber</option>
                    <option value="examen">Examen / Evaluación</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Puntos Máximos</label>
                  <input
                    type="number"
                    value={puntos}
                    onChange={(e) => setPuntos(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Título de la Actividad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Taller de Razonamiento Cuantitativo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Materia</label>
                  <input
                    type="text"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Grado y Grupo</label>
                  <input
                    type="text"
                    value={gradoGrupo}
                    onChange={(e) => setGradoGrupo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Instrucciones y Rúbrica</label>
                <textarea
                  rows={3}
                  required
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
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
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
