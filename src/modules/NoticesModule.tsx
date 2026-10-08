import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Notice, UserRole } from '../types';

export const NoticesModule: React.FC = () => {
  const { activeCollege, colleges, currentUser, notices, addNotice, sendEmailNotification } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const isTeacher = currentUser?.rol === 'docente';
  const canCreateNotice = !['tutor', 'alumno'].includes(currentUser?.rol || '');

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [prioridad, setPrioridad] = useState<Notice['prioridad']>('Normal');
  const [destinatarios, setDestinatarios] = useState<Notice['destinatarios']>(
    isTeacher ? 'Padres de Familia' : 'Toda la Comunidad'
  );

  React.useEffect(() => {
    if (isTeacher && destinatarios !== 'Padres de Familia' && destinatarios !== 'Estudiantes') {
      setDestinatarios('Padres de Familia');
    }
  }, [isTeacher, destinatarios]);

  const effectiveCollege =
    activeCollege ||
    (currentUser?.colegioId ? colleges.find((c) => c.id === currentUser.colegioId) || null : null);

  if (!effectiveCollege) return null;
  const primaryColor = effectiveCollege.colores.primario || '#0B2545';
  const goldColor = effectiveCollege.colores.secundario || '#C59B27';
  const collegeNotices = notices.filter(
    (n) => n.colegioId === effectiveCollege.id
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    const finalDestinatarios: Notice['destinatarios'] =
      isTeacher && destinatarios !== 'Padres de Familia' && destinatarios !== 'Estudiantes'
        ? 'Padres de Familia'
        : destinatarios;

    addNotice({
      colegioId: effectiveCollege.id,
      titulo,
      contenido,
      prioridad,
      destinatarios: finalDestinatarios,
      autor: isTeacher
        ? currentUser?.nombre || 'Docente del Plantel'
        : effectiveCollege.director || 'Dirección General',
      fecha: new Date().toISOString().split('T')[0],
    });

    const rolesMap: Record<string, UserRole[]> = {
      'Toda la Comunidad': ['directivo', 'docente', 'prefecto', 'coordinador', 'tutor', 'alumno'],
      'Docentes': ['docente', 'coordinador', 'directivo'],
      'Padres de Familia': ['tutor'],
      'Estudiantes': ['alumno'],
    };

    sendEmailNotification({
      colegioId: effectiveCollege.id,
      colegioNombre: effectiveCollege.nombre,
      destinatarios: [`comunicados@${effectiveCollege.id}.edu.mx`],
      rolesDestino: rolesMap[finalDestinatarios] || ['tutor', 'alumno'],
      asunto: `[Comunicado Oficial] ${titulo}`,
      cuerpo: contenido,
      categoria: 'comunicado',
      prioridad: prioridad === 'Urgente' ? 'urgente' : prioridad === 'Importante' ? 'alta' : 'normal',
    });

    setTitulo('');
    setContenido('');
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
              Comunicación Oficial
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Bell className="w-6 h-6" style={{ color: goldColor }} />
            Comunicados y Circulares Institucionales
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {effectiveCollege.nombre} ·{' '}
            {isTeacher
              ? 'Envío de avisos y comunicados exclusivamente a tutores/padres y alumnos'
              : 'Avisos para padres de familia, docentes y comunidad escolar'}
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      {canCreateNotice && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Emitir Comunicado</span>
          </button>
        </div>
      )}

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
                    {isTeacher ? (
                      <>
                        <option value="Padres de Familia">Tutores / Padres de Familia</option>
                        <option value="Estudiantes">Alumnos</option>
                      </>
                    ) : (
                      <>
                        <option value="Toda la Comunidad">Toda la Comunidad</option>
                        <option value="Padres de Familia">Tutores / Padres de Familia</option>
                        <option value="Docentes">Docentes</option>
                        <option value="Estudiantes">Alumnos</option>
                      </>
                    )}
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
