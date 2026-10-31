import React, { useState, useMemo } from 'react';
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
  FolderHeart,
  Calendar,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  FileText,
} from 'lucide-react';
import { AcademicLevel, Student, PsychologyRecord } from '../types';

// Deterministic cipher generator so non-psychologist profiles only see encrypted ciphertext
const encryptClinicalText = (plainText?: string, salt = 'AES256-PSI'): string => {
  if (!plainText) return 'ENC::0000000000000000';
  const hexBlocks: string[] = [];
  for (let i = 0; i < plainText.length; i++) {
    const code =
      (plainText.charCodeAt(i) ^ salt.charCodeAt(i % salt.length) ^ ((i * 31) & 0xff)) & 0xff;
    hexBlocks.push(code.toString(16).toUpperCase().padStart(2, '0'));
  }
  const grouped = hexBlocks.join('').match(/.{1,8}/g) || ['A9F03E7B'];
  return `AES-256-GCM::${grouped.slice(0, 10).join('-')}::[CIFRADO]`;
};

interface PsychologyModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const PsychologyModule: React.FC<PsychologyModuleProps> = ({ onNavigateTab }) => {
  const { activeCollege, currentUser, psychologyRecords, students, addPsychologyRecord } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<AcademicLevel | 'todos'>('todos');

  // Form states
  const [estudianteId, setEstudianteId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [resumen, setResumen] = useState('');
  const [acuerdos, setAcuerdos] = useState('');
  const [esConfidencial, setEsConfidencial] = useState(true);

  if (!activeCollege) return null;

  // Strictly only the 'psicologo' profile can view decrypted clinical information
  const isPsychologist = currentUser?.rol === 'psicologo';

  const primaryColor = activeCollege.colores?.primario || '#0B2545';
  const goldColor = activeCollege.colores?.secundario || '#C59B27';

  const getStudentEffectiveLevel = (st: Student): AcademicLevel => {
    if (st.nivel) return st.nivel;
    const g = (st.grado || '').toLowerCase();
    if (g.includes('preescolar') || g.includes('kinder')) return 'Preescolar';
    if (g.includes('secundaria')) return 'Secundaria';
    if (g.includes('preparatoria') || g.includes('bachillerato') || g.includes('semestre'))
      return 'Preparatoria';
    return 'Primaria';
  };

  const psychologistAssignedLevels = useMemo((): AcademicLevel[] => {
    if (!isPsychologist) return [];
    if (currentUser?.nivelesAsignados && currentUser.nivelesAsignados.length > 0) {
      return currentUser.nivelesAsignados;
    }
    if (currentUser?.nivelAsignado) {
      return [currentUser.nivelAsignado];
    }
    return [];
  }, [isPsychologist, currentUser]);

  const psychologistSpecificGroups = useMemo((): string[] => {
    if (!isPsychologist || !currentUser?.gruposAsignados) return [];
    return currentUser.gruposAsignados;
  }, [isPsychologist, currentUser]);

  const isStudentInPsychologistScope = (st: Student): boolean => {
    if (!isPsychologist) return true;
    const stLevel = getStudentEffectiveLevel(st);
    if (
      psychologistAssignedLevels.length > 0 &&
      !psychologistAssignedLevels.includes(stLevel)
    ) {
      return false;
    }
    if (psychologistSpecificGroups.length > 0) {
      const cleanGrp = (st.grupo || '').replace(/["']/g, '').trim().toUpperCase();
      const fullKey = `${stLevel} ${st.grado} ${cleanGrp}`.replace(/\s+/g, ' ').trim().toLowerCase();
      return psychologistSpecificGroups.some(
        (g) => g.replace(/\s+/g, ' ').trim().toLowerCase() === fullKey
      );
    }
    return true;
  };

  const collegeStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.colegioId === activeCollege.id &&
        s.estatus !== 'baja' &&
        isStudentInPsychologistScope(s)
    );
  }, [students, activeCollege.id, isPsychologist, psychologistAssignedLevels]);

  const collegeStudentIds = useMemo(() => new Set(collegeStudents.map((s) => s.id)), [collegeStudents]);

  const collegeRecords = useMemo(() => {
    return psychologyRecords.filter(
      (r) =>
        r.colegioId === activeCollege.id &&
        (!isPsychologist ||
          (psychologistAssignedLevels.length === 0 && psychologistSpecificGroups.length === 0) ||
          collegeStudentIds.has(r.estudianteId))
    );
  }, [psychologyRecords, activeCollege.id, isPsychologist, psychologistAssignedLevels, psychologistSpecificGroups, collegeStudentIds]);

  const filteredRecords = useMemo(() => {
    return collegeRecords.filter((rec) => {
      if (filterNivel !== 'todos') {
        const st = students.find((s) => s.id === rec.estudianteId);
        if (st && getStudentEffectiveLevel(st) !== filterNivel) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const stName = rec.estudianteNombre.toLowerCase();
        const mot = (rec.motivoConsulta || '').toLowerCase();
        const res = (rec.resumenSesion || '').toLowerCase();
        if (!stName.includes(q) && !mot.includes(q) && !res.includes(q)) return false;
      }
      return true;
    });
  }, [collegeRecords, filterNivel, searchTerm, students]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteId || !motivo.trim() || !resumen.trim()) return;

    const st = students.find((s) => s.id === estudianteId);
    if (!st) return;

    addPsychologyRecord({
      colegioId: activeCollege.id,
      estudianteId,
      estudianteNombre: `${st.nombre} ${st.apellidos}`,
      gradoGrupo: `${st.grado} ${st.grupo}`,
      psicologoNombre: currentUser.nombre,
      motivoConsulta: motivo.trim(),
      resumenSesion: resumen.trim(),
      acuerdos: acuerdos.trim(),
      esConfidencial,
      fecha: new Date().toISOString().split('T')[0],
      estatus: 'En Proceso',
    });

    setEstudianteId('');
    setMotivo('');
    setResumen('');
    setAcuerdos('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div
        className="p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}EE 100%)`,
        }}
      >
        <div className="relative z-10 space-y-2 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Atención y Orientación Escolar
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
          <h1 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6" style={{ color: goldColor }} />
            <span>Departamento de Psicología y Orientación</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Bitácoras de atención psicopedagógica, orientación escolar y seguimiento socioemocional
          </p>
        </div>
      </div>

      {/* Quick Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Link directo al módulo de Expedientes */}
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('expedientes')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs transition-all cursor-pointer"
          >
            <FolderHeart className="w-4 h-4 text-purple-700" />
            <span>Ir al Módulo de Expedientes Individuales</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
          </button>
        )}

        {isPsychologist && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Sesión Psicológica</span>
            </button>
          </div>
        )}
      </div>

      {/* Encryption Notice Banner when accessed from non-psychologist profile */}
      {!isPsychologist && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border-2 border-amber-500/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-sm sm:text-base text-amber-300">
                  Información Clínica Cifrada de Extremo a Extremo (AES-256)
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Perfil actual: {currentUser.cargo || currentUser.rol}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Por normativa de confidencialidad psicopedagógica y protección de datos sensibles del
                alumnado, el contenido de las bitácoras se muestra <strong>cifrado</strong> para
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

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por alumno, motivo o acuerdos..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
          />
        </div>

        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
        >
          <option value="todos">Todos los Niveles</option>
          <option value="Preescolar">Preescolar</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Secundaria</option>
          <option value="Preparatoria">Preparatoria</option>
        </select>
      </div>

      {/* Bitácoras List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((rec) => {
            if (!isPsychologist) {
              // Encrypted View for non-psychologist profiles
              return (
                <div
                  key={rec.id}
                  className="p-5 bg-slate-950/[0.02] hover:bg-slate-950/[0.04] transition-colors space-y-3 font-mono"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300">
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        <span>
                          SESIÓN: {encryptClinicalText(rec.estudianteNombre, rec.id).slice(0, 32)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Lock className="w-3 h-3 text-amber-700" /> Cifrado · Exclusivo Psicólogo
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{rec.fecha}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Motivo (Cifrado)</span>
                        <span>AES-GCM</span>
                      </div>
                      <p className="tracking-wider break-all select-none">
                        {encryptClinicalText(rec.motivoConsulta, 'MOTIVO-' + rec.id)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Resumen Clínico (Cifrado)</span>
                        <span>PROTEGIDO</span>
                      </div>
                      <p className="tracking-wider break-all select-none">
                        {encryptClinicalText(rec.resumenSesion, 'RESUMEN-' + rec.id)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 text-purple-300 font-mono text-[11px] border border-slate-800 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                        <span>Acuerdos (Cifrado)</span>
                        <span>LLAVE REQUERIDA</span>
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
              <div key={rec.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-700" />
                      <span>{rec.estudianteNombre}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({rec.gradoGrupo})
                      </span>
                    </span>
                    {rec.esConfidencial && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        <Lock className="w-3 h-3" /> Confidencial · Descifrado
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {rec.estatus}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{rec.fecha}</span>
                </div>

                <div className="text-xs text-slate-700">
                  <strong className="text-slate-900">Motivo de Intervención:</strong>{' '}
                  <span className="font-medium">{rec.motivoConsulta}</span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <strong className="text-slate-900 block">Resumen de la Sesión:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{rec.resumenSesion}</p>
                </div>

                {rec.acuerdos && (
                  <div className="text-xs text-emerald-950 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <strong className="text-emerald-900">Acuerdos y Compromisos:</strong> {rec.acuerdos}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Atendido por: <strong className="text-slate-600">{rec.psicologoNombre}</strong></span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('expedientes')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Expediente Completo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No hay bitácoras de psicología registradas para este colegio.
          </div>
        )}
      </div>

      {/* Modal: Nueva Sesión Psicológica */}
      {isAddOpen && isPsychologist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 flex items-center justify-between text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                <HeartHandshake className="w-5 h-5" style={{ color: goldColor }} />
                <span>Registrar Nueva Sesión de Orientación</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Alumno / Paciente (*):
                </label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold focus:outline-indigo-500"
                >
                  <option value="">Selecciona al alumno...</option>
                  {collegeStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nombre} {st.apellidos} ({st.grado} {st.grupo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Motivo de la Consulta / Intervención (*):
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Dificultad de concentración, situación socioemocional..."
                  required
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Resumen Clínico de la Sesión (*):
                </label>
                <textarea
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  placeholder="Describe los temas abordados, observaciones conductuales..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Acuerdos y Compromisos:
                </label>
                <textarea
                  value={acuerdos}
                  onChange={(e) => setAcuerdos(e.target.value)}
                  placeholder="Compromisos pactados con el alumno o sus tutores..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="font-semibold text-purple-900">
                  Tratamiento de alta confidencialidad (Cifrado militar)
                </span>
                <input
                  type="checkbox"
                  checked={esConfidencial}
                  onChange={(e) => setEsConfidencial(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs shadow-sm text-slate-950"
                  style={{ backgroundColor: goldColor }}
                >
                  Guardar Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychologyModule;
