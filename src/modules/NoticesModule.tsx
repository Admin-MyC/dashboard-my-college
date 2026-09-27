import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Notice } from '../types';

export const NoticesModule: React.FC = () => {
  const { activeCollege, notices, addNotice } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [prioridad, setPrioridad] = useState<Notice['prioridad']>('Normal');
  const [destinatarios, setDestinatarios] = useState<Notice['destinatarios']>('Toda la Comunidad');

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const collegeNotices = notices.filter(
    (n) => n.colegioId === activeCollege.id || n.colegioId === 'todos'
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    addNotice({
      colegioId: activeCollege.id,
      titulo,
      contenido,
      prioridad,
      destinatarios,
      autor: activeCollege.director || 'Dirección General',
      fecha: new Date().toISOString().split('T')[0],
    });

    setTitulo('');
    setContenido('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6" style={{ color: primaryColor }} />
            Comunicados y Circulares Institucionales
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Avisos para padres de familia, docentes y comunidad escolar
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-sm transition-all active:scale-98 self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Emitir Comunicado</span>
        </button>
      </div>

      <div className="space-y-3">
        {collegeNotices.map((n) => (
          <div
            key={n.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    n.prioridad === 'Urgente'
                      ? 'bg-rose-100 text-rose-800'
                      : n.prioridad === 'Importante'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {n.prioridad}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Dirigido a: {n.destinatarios}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{n.fecha}</span>
            </div>

            <h3 className="font-bold text-slate-900 text-base">{n.titulo}</h3>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {n.contenido}
            </p>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Emitido por: <strong className="text-slate-700">{n.autor}</strong>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Redactar Circular</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Título del Comunicado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Suspensión de clases por día festivo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Importante">Importante</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Destinatarios</label>
                  <select
                    value={destinatarios}
                    onChange={(e) => setDestinatarios(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Toda la Comunidad">Toda la Comunidad</option>
                    <option value="Padres de Familia">Padres de Familia</option>
                    <option value="Docentes">Docentes</option>
                    <option value="Estudiantes">Estudiantes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Contenido del Aviso *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el cuerpo del comunicado..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
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
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
