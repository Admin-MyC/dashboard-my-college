import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Car,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  BookOpen,
  GraduationCap,
  Send,
  Trash2,
} from 'lucide-react';
import { TriggerEnFilaResult } from '../types';

interface TutorEnFilaModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TriggerEnFilaResult | null;
  onRetrigger?: (studentIds?: string[]) => void;
}

export const TutorEnFilaModal: React.FC<TutorEnFilaModalProps> = ({
  isOpen,
  onClose,
  result: initialResult,
}) => {
  const {
    currentUser,
    triggerTutorEnFila,
    drivePickupQueue,
    removeDriveQueueEntry,
  } = useApp();

  const [result, setResult] = useState<TriggerEnFilaResult | null>(initialResult);
  const [selectedPickupPerson, setSelectedPickupPerson] = useState<'principal' | 'segundo'>('principal');

  useEffect(() => {
    setResult(initialResult);
    setSelectedPickupPerson('principal');
  }, [initialResult, isOpen]);

  if (!isOpen || !result) return null;

  const isDriveClosed = result.driveAbierto === false;
  const hasSecondTutor = Boolean(
    currentUser.segundoTutor && currentUser.segundoTutor.nombre?.trim()
  );

  const handleResendWithTutor = (person: 'principal' | 'segundo') => {
    setSelectedPickupPerson(person);
    if (person === 'segundo' && currentUser.segundoTutor) {
      const updated = triggerTutorEnFila({
        pickupTutorName: currentUser.segundoTutor.nombre,
        pickupTutorParentesco: currentUser.segundoTutor.parentesco || 'Segundo Tutor',
        pickupTutorTelefono: currentUser.segundoTutor.telefono || currentUser.telefono,
      });
      setResult(updated);
    } else {
      const updated = triggerTutorEnFila({
        pickupTutorName: currentUser.nombre,
        pickupTutorParentesco: currentUser.parentesco || 'Padre / Tutor Legal',
        pickupTutorTelefono: currentUser.telefono,
      });
      setResult(updated);
    }
  };

  const inClassCount = result.resultadosAlumnos.filter((r) => r.enClase).length;
  const sentToDriveCount = result.resultadosAlumnos.filter((r) => r.enviadoADrive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`p-5 sm:p-6 text-white flex items-center justify-between ${
            isDriveClosed
              ? 'bg-gradient-to-r from-rose-700 to-red-800'
              : inClassCount > 0 && sentToDriveCount === 0
              ? 'bg-gradient-to-r from-amber-600 to-orange-600'
              : 'bg-gradient-to-r from-[#0B2545] to-emerald-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              {isDriveClosed ? (
                <AlertTriangle className="w-6 h-6 text-amber-200" />
              ) : inClassCount > 0 && sentToDriveCount === 0 ? (
                <AlertTriangle className="w-6 h-6 text-amber-200" />
              ) : (
                <Car className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block">
                {result.colegioNombre} ·{' '}
                {isDriveClosed
                  ? 'Sistema Drive Cerrado'
                  : result.horarioHabilitado
                  ? 'Horario Escolar Activo'
                  : 'Horario Deshabilitado (Envío Directo)'}
              </span>
              <h3 className="font-display font-black text-lg sm:text-xl leading-tight">
                {isDriveClosed
                  ? 'No hay Drive abierto'
                  : inClassCount > 0 && sentToDriveCount === 0
                  ? 'Alumno en Clase · Favor de Estacionarse'
                  : '¡En Fila! Ya Puedes Recoger a tu Alumno(a)'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Selector if Second Tutor exists and Drive is open */}
          {!isDriveClosed && hasSecondTutor && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ¿Quién recoge hoy al alumno en la fila?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleResendWithTutor('principal')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPickupPerson === 'principal'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold truncate">{currentUser.nombre}</div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.parentesco || 'Tutor Principal'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleResendWithTutor('segundo')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPickupPerson === 'segundo'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold truncate">
                    {currentUser.segundoTutor?.nombre}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.segundoTutor?.parentesco || 'Segundo Tutor'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Student Check Results or No Drive Open Message */}
          {isDriveClosed ? (
            <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="font-display font-black text-base sm:text-lg text-rose-950">
                No hay ningún Drive abierto en este momento
              </h4>
              <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-md mx-auto">
                {result.mensajeGeneral}
              </p>
              <div className="p-3 rounded-xl bg-white border border-rose-200 text-[11px] text-slate-600">
                En cuanto el personal del colegio (Administrador, Coordinador, Directivo, Prefecto o Docente) presione <strong>"Iniciar Drive"</strong>, podrás registrarte en la fila para recoger a tu hijo(a).
              </div>
            </div>
          ) : result.resultadosAlumnos.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="font-bold">{result.mensajeGeneral}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.resultadosAlumnos.map((st) => {
                const queueEntryId = `drive-${result.colegioId}-${st.estudianteId}`;
                const isCurrentlyInQueue = drivePickupQueue.some(
                  (q) => q.id === queueEntryId && q.estado === 'en_fila'
                );

                if (st.enClase) {
                  // Student is in a class -> Notification to park!
                  return (
                    <div
                      key={st.estudianteId}
                      className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 space-y-4 shadow-xs"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={st.estudianteFoto}
                          alt={st.estudianteNombre}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xs shrink-0"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            <span>En Clase según Horario Escolar</span>
                          </span>
                          <h4 className="font-display font-black text-base sm:text-lg text-slate-900">
                            {st.estudianteNombre}
                          </h4>
                          <p className="text-xs font-bold text-slate-600">
                            Grupo: {st.grado} "{st.grupo}" · Matrícula: {st.matricula}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-amber-300 space-y-2">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Clase actual: {st.materiaNombre}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          El alumno(a) <strong>{st.estudianteNombre}</strong> del grupo{' '}
                          <strong>
                            {st.grado} "{st.grupo}"
                          </strong>{' '}
                          se encuentra en la clase de{' '}
                          <strong className="text-amber-950">{st.materiaNombre}</strong> (
                          {st.dia} · {st.bloqueHora}
                          {st.aula ? ` · ${st.aula}` : ''}).
                        </p>
                        <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-2">
                          <Car className="w-5 h-5 text-amber-700 shrink-0" />
                          <span>
                            Notificación oficial enviada: El alumno se encuentra en la clase de{' '}
                            {st.materiaNombre}, favor de estacionarse.
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Student is NOT in class (or Horario is disabled) -> Sent to Drive!
                return (
                  <div
                    key={st.estudianteId}
                    className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 overflow-hidden shadow-xs"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enviado a Pantalla Drive</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800">
                          {result.horarioHabilitado
                            ? 'Sin clase en este horario'
                            : 'Envío directo (Horario deshabilitado)'}
                        </span>
                      </div>

                      {/* Preview of what appears on Drive screen: Student Name + Photo, and below Tutor data */}
                      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4 border border-slate-800">
                        <div className="flex items-center gap-4">
                          <img
                            src={st.estudianteFoto}
                            alt={st.estudianteNombre}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                              Alumno a recoger en escuela:
                            </span>
                            <h4 className="font-display font-black text-lg sm:text-xl text-white truncate">
                              {st.estudianteNombre}
                            </h4>
                            <p className="text-xs text-slate-300 font-semibold">
                              Grado y Grupo: {st.grado} "{st.grupo}" · Matrícula:{' '}
                              {st.matricula}
                            </p>
                          </div>
                        </div>

                        {/* Below: Tutor/Parent picking up */}
                        <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                              Tutor / Padre que recoge al alumno:
                            </span>
                            <div className="font-bold text-sm sm:text-base text-white">
                              {result.tutorNombre}{' '}
                              <span className="text-xs font-normal text-amber-300">
                                ({result.tutorParentesco})
                              </span>
                            </div>
                            {result.tutorTelefono && (
                              <div className="text-xs text-slate-300 font-mono">
                                Tel: {result.tutorTelefono}
                              </div>
                            )}
                          </div>

                          {isCurrentlyInQueue && (
                            <button
                              type="button"
                              onClick={() => removeDriveQueueEntry(queueEntryId)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Salir de Fila</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
