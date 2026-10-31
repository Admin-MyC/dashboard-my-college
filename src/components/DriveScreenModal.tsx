import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Car,
  X,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  GraduationCap,
  Maximize2,
  Minimize2,
  Trash2,
  ShieldCheck,
  Volume2,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';

interface DriveScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriveScreenModal: React.FC<DriveScreenModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeCollege,
    colleges,
    currentUser,
    drivePickupQueue,
    markDriveStudentDelivered,
    removeDriveQueueEntry,
    clearDeliveredDriveEntries,
    getCollegeScheduleDriveConfig,
    setCollegeDriveOpenStatus,
    isCollegeDriveUsageEnabled,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [selectedFilterCollegeId, setSelectedFilterCollegeId] = useState<string>(
    activeCollege?.id || currentUser.colegioId || 'todos'
  );
  const [showDeliveredHistory, setShowDeliveredHistory] = useState<boolean>(false);

  useEffect(() => {
    if (activeCollege?.id) {
      setSelectedFilterCollegeId(activeCollege.id);
    } else if (currentUser.colegioId) {
      setSelectedFilterCollegeId(currentUser.colegioId);
    }
  }, [activeCollege?.id, currentUser.colegioId]);

  // Mark Drive as open for the active college when DriveScreenModal is open
  useEffect(() => {
    if (
      !isOpen ||
      currentUser.rol === 'tutor' ||
      currentUser.rol === 'alumno' ||
      currentUser.rol === 'superusuario' ||
      currentUser.rol === 'soporte'
    ) {
      return;
    }
    const targetColId =
      activeCollege?.id ||
      (selectedFilterCollegeId && selectedFilterCollegeId !== 'todos'
        ? selectedFilterCollegeId
        : currentUser.colegioId || 'todos');
    setCollegeDriveOpenStatus(targetColId, true);
  }, [isOpen, activeCollege?.id, selectedFilterCollegeId, currentUser.colegioId, currentUser.rol]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen) return null;

  // Never allow tutor, alumno, superusuario, or soporte to view the staff Drive monitor
  if (
    currentUser.rol === 'tutor' ||
    currentUser.rol === 'alumno' ||
    currentUser.rol === 'superusuario' ||
    currentUser.rol === 'soporte'
  ) {
    return null;
  }

  const effectiveCollege =
    activeCollege ||
    colleges.find((c) => c.id === selectedFilterCollegeId) ||
    colleges.find((c) => c.id === currentUser.colegioId) ||
    colleges[0];

  if (effectiveCollege && !isCollegeDriveUsageEnabled(effectiveCollege.id)) {
    return null;
  }

  const primaryColor = effectiveCollege?.colores?.primario || '#0B2545';
  const goldColor = effectiveCollege?.colores?.secundario || '#C59B27';

  const scheduleCfg = effectiveCollege
    ? getCollegeScheduleDriveConfig(effectiveCollege.id)
    : null;

  const filteredQueue = drivePickupQueue.filter((item) => {
    if (
      selectedFilterCollegeId &&
      selectedFilterCollegeId !== 'todos' &&
      item.colegioId !== selectedFilterCollegeId
    ) {
      return false;
    }
    return true;
  });

  const activeInLine = filteredQueue
    .filter((item) => item.estado === 'en_fila')
    .sort((a, b) => a.timestamp - b.timestamp);

  const deliveredToday = filteredQueue
    .filter((item) => item.estado === 'entregado')
    .sort((a, b) => b.timestamp - a.timestamp);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore if blocked by iframe policy
    }
  };

  const handleCloseDrive = async () => {
    const targetColId =
      activeCollege?.id ||
      (selectedFilterCollegeId && selectedFilterCollegeId !== 'todos'
        ? selectedFilterCollegeId
        : currentUser.colegioId || 'todos');
    setCollegeDriveOpenStatus(targetColId, false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
    onClose();
  };

  const handleMinimizeKeepOpen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Full-Screen Header Bar */}
      <header
        className="px-4 sm:px-8 py-4 border-b border-white/15 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #091526 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {effectiveCollege?.escudoUrl ? (
            <img
              src={effectiveCollege.escudoUrl}
              alt={effectiveCollege.nombre}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-2xl bg-white p-1.5 border-2 border-amber-300 shadow-md shrink-0"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Car className="w-7 h-7" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                <span>PANTALLA DRIVE EN VIVO</span>
              </span>

              {scheduleCfg && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    scheduleCfg.horarioHabilitado
                      ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                      : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    Horario:{' '}
                    {scheduleCfg.horarioHabilitado
                      ? `Habilitado (${scheduleCfg.diaConsulta || 'Hoy'} · ${
                          scheduleCfg.modoHoraConsulta === 'reloj_actual'
                            ? 'Reloj en vivo'
                            : scheduleCfg.bloqueHoraConsulta || '08:00 - 08:50'
                        })`
                      : 'Deshabilitado (Recepción Directa)'}
                  </span>
                </span>
              )}
            </div>

            <h1 className="font-display font-black text-lg sm:text-2xl md:text-3xl text-white tracking-tight truncate mt-0.5">
              {effectiveCollege?.nombre || 'Monitor Escolar de Entrega (Drive)'}
            </h1>
          </div>
        </div>

        {/* Right Controls: College Filter (for Global users), Clock, Queue Count, Exit */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          {(currentUser.rol === 'superusuario' || currentUser.rol === 'soporte') &&
            !activeCollege && (
              <select
                value={selectedFilterCollegeId}
                onChange={(e) => setSelectedFilterCollegeId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/90 border border-white/20 text-xs font-bold text-white"
              >
                <option value="todos">Todos los Colegios</option>
                {colleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.nombre}
                  </option>
                ))}
              </select>
            )}

          {/* Queue Counter Pill */}
          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                En Fila Ahora
              </span>
              <span className="font-mono font-black text-xl sm:text-2xl text-white leading-none">
                {activeInLine.length}
              </span>
            </div>
            <div className="h-7 w-px bg-white/15" />
            <button
              type="button"
              onClick={() => setShowDeliveredHistory(!showDeliveredHistory)}
              className="text-center hover:opacity-80 transition-opacity cursor-pointer"
              title="Ver historial de alumnos entregados"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Entregados
              </span>
              <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400 leading-none">
                {deliveredToday.length}
              </span>
            </button>
          </div>

          {/* Live Clock */}
          <div className="hidden md:flex flex-col items-end px-4 py-1.5 rounded-2xl bg-slate-900/80 border border-white/10">
            <span className="font-mono font-black text-lg text-amber-300 leading-tight">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
              {currentTime.toLocaleDateString('es-MX', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
            title={
              isNativeFullscreen
                ? 'Salir de pantalla completa del navegador'
                : 'Expandir a pantalla completa total (F11)'
            }
          >
            {isNativeFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleMinimizeKeepOpen}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-400/40 font-extrabold text-xs transition-all cursor-pointer"
            title="Minimizar la pantalla mantendo el Drive Abierto para que los tutores puedan registrarse en fila"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Minimizar (Dejar Abierto)</span>
          </button>

          <button
            type="button"
            onClick={handleCloseDrive}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
            title="Cerrar el sistema Drive (Los tutores verán que no hay Drive abierto)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Cerrar Drive</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Body */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {activeInLine.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-6 p-8 sm:p-12 rounded-3xl bg-white/[0.03] border-2 border-dashed border-white/15 backdrop-blur-md">
              <div
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border-2"
                style={{
                  backgroundColor: `${goldColor}20`,
                  borderColor: goldColor,
                  color: goldColor,
                }}
              >
                <Car className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold uppercase tracking-widest">
                  Circuito Drive Activo · En Espera de Tutores
                </span>
                <h2 className="font-display font-black text-2xl sm:text-4xl text-white">
                  Sin alumnos en fila por recoger en este momento
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Cuando un Padre de Familia o Tutor presione el botón{' '}
                  <strong className="text-amber-300">"En Fila"</strong> desde su perfil, aquí aparecerá de inmediato en pantalla completa el{' '}
                  <strong className="text-white">nombre del alumno</strong>, su{' '}
                  <strong className="text-white">fotografía</strong> y abajo el{' '}
                  <strong className="text-white">dato del tutor/padre que lo va a recoger</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  Sincronización automática en tiempo real
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  Validación de Horario:{' '}
                  <strong className="text-white">
                    {scheduleCfg?.horarioHabilitado ? 'Activa' : 'Deshabilitada (Directo)'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Grid of Students to Pick Up */}
            <div
              className={`grid gap-6 flex-1 items-stretch ${
                activeInLine.length === 1
                  ? 'grid-cols-1 max-w-4xl w-full mx-auto my-auto'
                  : activeInLine.length === 2
                  ? 'grid-cols-1 lg:grid-cols-2 max-w-7xl w-full mx-auto my-auto'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {activeInLine.map((entry, idx) => {
                const isSingleSpotlight = activeInLine.length === 1;

                return (
                  <div
                    key={entry.id}
                    className="rounded-3xl bg-slate-900/95 border-2 border-amber-400/70 shadow-2xl overflow-hidden flex flex-col justify-between transition-all animate-in zoom-in-95 duration-200"
                  >
                    {/* Card Top Banner: Turn Number & Arrival Time */}
                    <div
                      className="px-6 py-3.5 flex items-center justify-between border-b border-white/15"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor} 0%, #1e293b 100%)`,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-3 py-1 rounded-xl font-mono font-black text-sm sm:text-base shadow-sm"
                          style={{
                            backgroundColor: goldColor,
                            color: '#091526',
                          }}
                        >
                          TURNO #{idx + 1} EN FILA
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wider">
                          Alumno por Recoger
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-200 bg-black/30 px-3 py-1 rounded-xl border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Llegada: {entry.horaSolicitud}</span>
                      </div>
                    </div>

                    {/* STUDENT SECTION: Name + Large Photograph */}
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-extrabold uppercase tracking-widest">
                        Alumno(a) a Recoger en Escuela
                      </span>

                      {/* Student Photograph */}
                      <div className="relative">
                        <img
                          src={
                            entry.estudianteFoto ||
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={entry.estudianteNombre}
                          className={`${
                            isSingleSpotlight
                              ? 'w-36 h-36 sm:w-48 sm:h-48'
                              : 'w-28 h-28 sm:w-36 sm:h-36'
                          } rounded-3xl object-cover border-4 shadow-2xl mx-auto`}
                          style={{ borderColor: goldColor }}
                        />
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md whitespace-nowrap">
                          Listo para Entrega
                        </span>
                      </div>

                      {/* Student Name & Group */}
                      <div className="space-y-2 pt-2">
                        <h2
                          className={`font-display font-black text-white tracking-tight leading-tight ${
                            isSingleSpotlight
                              ? 'text-2xl sm:text-4xl md:text-5xl'
                              : 'text-xl sm:text-3xl'
                          }`}
                        >
                          {entry.estudianteNombre}
                        </h2>

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          {entry.estudianteNivel && (
                            <span className="px-3 py-1 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-extrabold text-xs sm:text-sm">
                              {entry.estudianteNivel}
                            </span>
                          )}
                          <span
                            className="px-3.5 py-1 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs"
                            style={{
                              backgroundColor: `${goldColor}25`,
                              color: '#FDE68A',
                              border: `1px solid ${goldColor}60`,
                            }}
                          >
                            Grado y Grupo: {entry.estudianteGrado} "{entry.estudianteGrupo}"
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 font-mono font-bold text-xs sm:text-sm">
                            Matrícula: {entry.estudianteMatricula}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM SECTION: Datos del Tutor / Padre que lo va a recoger */}
                    <div className="p-5 sm:p-6 bg-slate-800/90 border-t-2 border-amber-400/40 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-white/15">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {entry.tutorAvatar ? (
                            <img
                              src={entry.tutorAvatar}
                              alt={entry.tutorNombre}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shrink-0">
                              <User className="w-6 h-6" />
                            </div>
                          )}

                          <div className="min-w-0 text-left">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                              Tutor / Padre que lo recoge en la escuela:
                            </span>
                            <h3
                              className={`font-display font-black text-white truncate ${
                                isSingleSpotlight
                                  ? 'text-lg sm:text-2xl'
                                  : 'text-base sm:text-xl'
                              }`}
                            >
                              {entry.tutorNombre}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                                {entry.tutorParentesco || 'Padre / Tutor Legal'}
                              </span>
                              {entry.tutorTelefono && (
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-amber-400" />
                                  {entry.tutorTelefono}
                                </span>
                              )}
                              {entry.tutorCorreo && (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 text-sky-400" />
                                  {entry.tutorCorreo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Staff Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => markDriveStudentDelivered(entry.id)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>Entregar Alumno</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDriveQueueEntry(entry.id)}
                            className="p-3 rounded-2xl bg-white/10 hover:bg-rose-600/80 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            title="Retirar de la fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Delivered Students History Bar */}
        {showDeliveredHistory && deliveredToday.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Alumnos Entregados Recientemente ({deliveredToday.length})</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  clearDeliveredDriveEntries(
                    selectedFilterCollegeId === 'todos' ? null : selectedFilterCollegeId
                  )
                }
                className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Limpiar historial de entregados
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {deliveredToday.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs"
                >
                  <img
                    src={item.estudianteFoto}
                    alt={item.estudianteNombre}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">
                      {item.estudianteNombre}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Recogió: {item.tutorNombre} · {item.horaEntrega}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
