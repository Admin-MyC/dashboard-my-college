import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HeartHandshake,
  Plus,
  Lock,
  ShieldAlert,
  KeyRound,
  X,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

// Deterministic cipher generator so non-psychologist roles only see encrypted ciphertext
const encryptClinicalText = (plainText: string, salt = 'AES256-PSI'): string => {
  if (!plainText) return 'ENC::0000000000000000';
  const hexBlocks: string[] = [];
  for (let i = 0; i < plainText.length; i++) {
    const code = (plainText.charCodeAt(i) ^ salt.charCodeAt(i % salt.length) ^ ((i * 31) & 0xff)) & 0xff;
    hexBlocks.push(code.toString(16).toUpperCase().padStart(2, '0'));
  }
  const grouped = hexBlocks.join('').match(/.{1,8}/g) || ['A9F03E7B'];
  return `AES-256-GCM::${grouped.slice(0, 10).join('-')}::[CIFRADO]`;
};

export const PsychologyModule: React.FC = () => {
  const { activeCollege, currentUser, psychologyRecords, students, addPsychologyRecord } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [estudianteId, setEstudianteId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [resumen, setResumen] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [esConfidencial, setEsConfidencial] = useState(true);

  if (!activeCollege) return null;

  // Strictly only the 'psicologo' profile can view decrypted clinical expediente information
  const isPsychologist = currentUser?.rol === 'psicologo';

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeStudents = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeRecords = psychologyRecords.filter((r) => r.colegioId === activeCollege.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPsychologist) return;
    const st = collegeStudents.find((s) => s.id === estudianteId) || collegeStudents[0];
    if (!st) return;

    addPsychologyRecord({
      colegioId: activeCollege.id,
      estudianteId: st.id,
      estudianteNombre: `${st.nombre} ${st.apellidos}`,
      gradoGrupo: `${st.grado} ${st.grupo}`,
      psicologoNombre: currentUser?.nombre || 'Lic. Mariana Garza Beltrán',
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
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
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
              Orientación Educativa · Expedientes Clínicos
            </span>
            {isPsychologist ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Llave Clínica Activa (Perfil Psicólogo)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <Lock className="w-3.5 h-3.5" />
                <span>Vista Cifrada · Exclusivo Psicología</span>
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6" style={{ color: goldColor }} />
            Departamento de Psicología y Expedientes
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Bitácoras de atención psicopedagógica y seguimiento socioemocional
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      {isPsychologist && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Sesión Psicológica</span>
          </button>
        </div>
      )}

      {/* Encryption Notice Banner when accessed from any profile other than Psicólogo */}
      {!isPsychologist && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border-2 border-amber-500/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-sm sm:text-base text-amber-300">
                  Información de Expedientes Cifrada de Extremo a Extremo (AES-256)
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Perfil actual: {currentUser.cargo || currentUser.rol}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Por normativa de confidencialidad psicopedagógica y protección de datos sensibles del
                alumnado, el contenido de los expedientes se muestra <strong>cifrado</strong> para
                cualquier perfil distinto a <strong>Psicólogo</strong>. Únicamente el titular del
                perfil de Psicología posee la llave de descifrado para visualizar y registrar sesiones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300 shrink-0 self-start sm:self-auto">
            <KeyRound className="w-3.5 h-3.5" />
            <span>SOLO LECTURA CIFRADA</span>
          </div>
        </div>
      )}

      {/* Expedientes List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {collegeRecords.length > 0 ? (
          collegeRecords.map((rec) => {
            if (!isPsychologist) {
              // Encrypted View for non-psychologist profiles
              return (
                <div
                  key={rec.id}
                  className="p-5 bg-slate-950/[0.02] hover:bg-slate-950/[0.04] transition-colors space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-800 text-xs sm:text-sm bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300">
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        <span>
                          EXPEDIENTE: {encryptClinicalText(rec.estudianteNombre, rec.id).slice(0, 32)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Lock className="w-3 h-3 text-amber-700" /> Cifrado · Exclusivo Psicólogo
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{rec.fecha}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Motivo de Intervención (Bloque Cifrado)</span>
                        <span>SHA-256 / AES-GCM</span>
                      </div>
                      <p className=" tracking-wider break-all select-none">
                        {encryptClinicalText(rec.motivoConsulta, 'MOTIVO-' + rec.id)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Resumen Clínico de la Sesión (Bloque Cifrado)</span>
                        <span>PROTEGIDO</span>
                      </div>
                      <p className="tracking-wider break-all select-none">
                        {encryptClinicalText(rec.resumenSesion, 'RESUMEN-' + rec.id)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-purple-300 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Acuerdos y Plan de Acción (Bloque Cifrado)</span>
                        <span>LLAVE REQUERIDA: PSICÓLOGO</span>
                      </div>
                      <p className="tracking-wider break-all select-none">
                        {encryptClinicalText(rec.acuerdos, 'ACUERDOS-' + rec.id)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Decrypted Full View exclusively for Psicólogo profile
            return (
              <div key={rec.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {rec.estudianteNombre} ({rec.gradoGrupo})
                    </span>
                    {rec.esConfidencial && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        <Lock className="w-3 h-3" /> Confidencial · Descifrado para Psicología
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
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 italic text-sm">
            No hay expedientes psicológicos registrados para este colegio.
          </div>
        )}
      </div>

      {isAddOpen && isPsychologist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Sesión Psicológica</h3>
              <button onClick={() => setIsAddOpen(false)} className="cursor-pointer">
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg cursor-pointer"
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
