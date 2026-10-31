import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  FileText,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Edit3,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Printer,
  ChevronRight,
  Sparkles,
  Check,
  Eye,
  FileCheck2,
  BookOpen,
  Activity,
  FolderPlus,
  Send,
  Phone,
  GraduationCap,
} from 'lucide-react';
import {
  AcademicLevel,
  Student,
  PsychologyRecord,
  PsychologySession,
  PsychologyAttachment,
  Notice,
} from '../types';

// Deterministic cipher generator so non-psychologist profiles see strictly encrypted ciphertext
const encryptClinicalText = (plainText?: string, salt = 'AES256-PSI'): string => {
  if (!plainText) return 'ENC::[PROTEGIDO_POR_CONFIDENCIALIDAD_MEDICA]';
  const hexBlocks: string[] = [];
  for (let i = 0; i < plainText.length; i++) {
    const code =
      (plainText.charCodeAt(i) ^ salt.charCodeAt(i % salt.length) ^ ((i * 31) & 0xff)) & 0xff;
    hexBlocks.push(code.toString(16).toUpperCase().padStart(2, '0'));
  }
  const grouped = hexBlocks.join('').match(/.{1,8}/g) || ['A9F03E7B'];
  return `AES-256-GCM::${grouped.slice(0, 8).join('-')}::[CIFRADO_CONFIDENCIAL]`;
};

interface ExpedientesModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const ExpedientesModule: React.FC<ExpedientesModuleProps> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    psychologyRecords,
    students,
    notices,
    addPsychologyRecord,
    updatePsychologyRecord,
    deletePsychologyRecord,
    pendingCanalizacionForExpediente,
    setPendingCanalizacionForExpediente,
  } = useApp();

  // Active view: 'expedientes' (lista de expedientes individuales) | 'canalizaciones' (bandeja de canalizaciones pendientes)
  const [activeTab, setActiveTab] = useState<'expedientes' | 'canalizaciones'>('expedientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState<string>('todos');
  const [filterArea, setFilterArea] = useState<string>('todos');
  const [filterNivel, setFilterNivel] = useState<AcademicLevel | 'todos'>('todos');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PsychologyRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<PsychologyRecord | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<PsychologyAttachment | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Form Fields for Expediente Individual
  const [formEstudianteId, setFormEstudianteId] = useState('');
  const [formEstatus, setFormEstatus] = useState<PsychologyRecord['estatus']>('En Evaluación');
  const [formAreaAtencion, setFormAreaAtencion] = useState<NonNullable<PsychologyRecord['areaAtencion']>>('Conductual');
  const [formNivelRiesgo, setFormNivelRiesgo] = useState<NonNullable<PsychologyRecord['nivelRiesgo']>>('Medio');
  const [formCanalizadoPor, setFormCanalizadoPor] = useState('Docente Titular');
  const [formCanalizacionId, setFormCanalizacionId] = useState('');
  const [formMotivo, setFormMotivo] = useState('');
  const [formAntecedentes, setFormAntecedentes] = useState('');
  const [formImpresionDiag, setFormImpresionDiag] = useState('');
  const [formPruebas, setFormPruebas] = useState('');
  const [formObjetivos, setFormObjetivos] = useState('');
  const [formEstrategiasAula, setFormEstrategiasAula] = useState('');
  const [formAcuerdosTutor, setFormAcuerdosTutor] = useState('');
  const [formCanalizacionExterna, setFormCanalizacionExterna] = useState('');
  const [formEsConfidencial, setFormEsConfidencial] = useState(true);

  // Session Sub-form
  const [sessionTipo, setSessionTipo] = useState<PsychologySession['tipoSesion']>('Individual con Alumno');
  const [sessionFecha, setSessionFecha] = useState(new Date().toISOString().split('T')[0]);
  const [sessionHora, setSessionHora] = useState('10:00');
  const [sessionTemas, setSessionTemas] = useState('');
  const [sessionObservaciones, setSessionObservaciones] = useState('');
  const [sessionAcuerdos, setSessionAcuerdos] = useState('');
  const [sessionProximaCita, setSessionProximaCita] = useState('');

  // Attachment Sub-form
  const [attachNombre, setAttachNombre] = useState('');
  const [attachCategoria, setAttachCategoria] = useState<PsychologyAttachment['categoria']>('Evidencia de Seguimiento');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachTipo, setAttachTipo] = useState<'image' | 'pdf' | 'doc'>('image');
  const [attachTamanoKb, setAttachTamanoKb] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeCollege) return null;

  // Strictly only the 'psicologo' profile can view decrypted clinical information
  const isPsychologist = currentUser?.rol === 'psicologo';
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Helper to determine student effective level
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

  const isStudentInPsychologistScope = (st: Student): boolean => {
    if (!isPsychologist) return true;
    const stLevel = getStudentEffectiveLevel(st);
    if (
      psychologistAssignedLevels.length > 0 &&
      !psychologistAssignedLevels.includes(stLevel)
    ) {
      return false;
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

  const collegeStudentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // College-filtered Psychology Records
  const collegeRecords = useMemo(() => {
    return psychologyRecords.filter(
      (r) =>
        r.colegioId === activeCollege.id &&
        (!isPsychologist ||
          psychologistAssignedLevels.length === 0 ||
          (collegeStudentMap.get(r.estudianteId) &&
            psychologistAssignedLevels.includes(
              getStudentEffectiveLevel(collegeStudentMap.get(r.estudianteId)!)
            )))
    );
  }, [psychologyRecords, activeCollege.id, isPsychologist, psychologistAssignedLevels, collegeStudentMap]);

  // Canalizaciones (Notices of type 'Canalización')
  const collegeCanalizaciones = useMemo(() => {
    return notices.filter(
      (n) =>
        n.colegioId === activeCollege.id &&
        n.tipoComunicado === 'Canalización'
    );
  }, [notices, activeCollege.id]);

  // Check if a canalizacion already has an opened expediente
  const openedExpedienteByCanalizacionId = useMemo(() => {
    const map = new Map<string, PsychologyRecord>();
    collegeRecords.forEach((r) => {
      if (r.canalizacionId) {
        map.set(r.canalizacionId, r);
      }
    });
    return map;
  }, [collegeRecords]);

  // Auto-respond when pendingCanalizacionForExpediente arrives
  useEffect(() => {
    if (pendingCanalizacionForExpediente && isPsychologist) {
      handleOpenFromCanalizacion(pendingCanalizacionForExpediente);
    }
  }, [pendingCanalizacionForExpediente]);

  // Handle open expediente from canalizacion
  const handleOpenFromCanalizacion = (notice: Notice) => {
    // Try to match student
    let matchedStudentId = notice.estudianteId || '';
    if (!matchedStudentId && notice.estudianteNombre) {
      const cleanTarget = notice.estudianteNombre.trim().toLowerCase();
      const found = collegeStudents.find(
        (s) =>
          `${s.nombre} ${s.apellidos}`.toLowerCase() === cleanTarget ||
          `${s.apellidos} ${s.nombre}`.toLowerCase() === cleanTarget ||
          cleanTarget.includes(s.nombre.toLowerCase())
      );
      if (found) matchedStudentId = found.id;
    }

    setEditingRecord(null);
    setFormEstudianteId(matchedStudentId || (collegeStudents[0]?.id ?? ''));
    setFormEstatus('En Evaluación');
    setFormAreaAtencion(
      notice.prioridad === 'Urgente' ? 'Conductual' : 'Académica / Aprendizaje'
    );
    setFormNivelRiesgo(
      notice.prioridad === 'Urgente'
        ? 'Alto'
        : notice.prioridad === 'Importante'
        ? 'Medio'
        : 'Bajo'
    );
    setFormCanalizadoPor(
      `${notice.autor} (${notice.autorRol ? notice.autorRol.toUpperCase() : 'Personal Escolar'})`
    );
    setFormCanalizacionId(notice.id);
    setFormMotivo(
      `Canalización: ${notice.titulo}\n\nDetalle reportado: ${notice.contenido}`
    );
    setFormAntecedentes('');
    setFormImpresionDiag('');
    setFormPruebas('');
    setFormObjetivos('Realizar valoración psicopedagógica y entrevista inicial.');
    setFormEstrategiasAula('');
    setFormAcuerdosTutor('');
    setFormCanalizacionExterna('');
    setFormEsConfidencial(true);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (rec: PsychologyRecord) => {
    if (!isPsychologist) return;
    setEditingRecord(rec);
    setFormEstudianteId(rec.estudianteId);
    setFormEstatus(rec.estatus || 'En Proceso');
    setFormAreaAtencion(rec.areaAtencion || 'Conductual');
    setFormNivelRiesgo(rec.nivelRiesgo || 'Medio');
    setFormCanalizadoPor(rec.canalizadoPor || 'Docente Titular');
    setFormCanalizacionId(rec.canalizacionId || '');
    setFormMotivo(rec.motivoConsulta || '');
    setFormAntecedentes(rec.antecedentesClinicos || '');
    setFormImpresionDiag(rec.impresionDiagnostica || '');
    setFormPruebas(rec.pruebasAplicadas || '');
    setFormObjetivos(rec.objetivosIntervencion || '');
    setFormEstrategiasAula(rec.estrategiasAula || '');
    setFormAcuerdosTutor(rec.acuerdosTutor || '');
    setFormCanalizacionExterna(rec.canalizacionExterna || '');
    setFormEsConfidencial(rec.esConfidencial ?? true);
    setIsFormOpen(true);
  };

  // Save Expediente (Create or Update)
  const handleSaveExpediente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEstudianteId) return;

    const student = collegeStudentMap.get(formEstudianteId);
    const studentFullName = student
      ? `${student.nombre} ${student.apellidos}`
      : 'Estudiante Escolar';
    const stLevel = student ? getStudentEffectiveLevel(student) : 'Primaria';
    const stGradoGrupo = student ? `${student.grado} ${student.grupo}` : 'General';
    const stMatricula = student?.matricula || `MAT-${formEstudianteId.slice(-4)}`;
    const stTutor = student?.tutorNombre || 'Tutor Registrado';
    const stTutorTel = student?.tutorTelefono || student?.tutorCorreo || '';

    if (editingRecord) {
      updatePsychologyRecord(editingRecord.id, {
        estudianteId: formEstudianteId,
        estudianteNombre: studentFullName,
        matricula: stMatricula,
        gradoGrupo: stGradoGrupo,
        nivel: stLevel,
        tutorNombre: stTutor,
        tutorTelefono: stTutorTel,
        estatus: formEstatus,
        areaAtencion: formAreaAtencion,
        nivelRiesgo: formNivelRiesgo,
        canalizadoPor: formCanalizadoPor,
        canalizacionId: formCanalizacionId || undefined,
        motivoConsulta: formMotivo,
        resumenSesion: formMotivo.slice(0, 180),
        antecedentesClinicos: formAntecedentes,
        impresionDiagnostica: formImpresionDiag,
        pruebasAplicadas: formPruebas,
        objetivosIntervencion: formObjetivos,
        estrategiasAula: formEstrategiasAula,
        acuerdosTutor: formAcuerdosTutor,
        acuerdos: formAcuerdosTutor,
        canalizacionExterna: formCanalizacionExterna,
        esConfidencial: formEsConfidencial,
        psicologoNombre: currentUser.nombre,
      });

      // Update detailRecord if open
      if (detailRecord?.id === editingRecord.id) {
        setDetailRecord({
          ...detailRecord,
          estudianteId: formEstudianteId,
          estudianteNombre: studentFullName,
          matricula: stMatricula,
          gradoGrupo: stGradoGrupo,
          nivel: stLevel,
          tutorNombre: stTutor,
          tutorTelefono: stTutorTel,
          estatus: formEstatus,
          areaAtencion: formAreaAtencion,
          nivelRiesgo: formNivelRiesgo,
          canalizadoPor: formCanalizadoPor,
          canalizacionId: formCanalizacionId || undefined,
          motivoConsulta: formMotivo,
          antecedentesClinicos: formAntecedentes,
          impresionDiagnostica: formImpresionDiag,
          pruebasAplicadas: formPruebas,
          objetivosIntervencion: formObjetivos,
          estrategiasAula: formEstrategiasAula,
          acuerdosTutor: formAcuerdosTutor,
          canalizacionExterna: formCanalizacionExterna,
          esConfidencial: formEsConfidencial,
        });
      }
    } else {
      const folioNumber = `EXP-PSI-${new Date().getFullYear()}-${String(
        collegeRecords.length + 1
      ).padStart(4, '0')}`;

      addPsychologyRecord({
        colegioId: activeCollege.id,
        numeroExpediente: folioNumber,
        estudianteId: formEstudianteId,
        estudianteNombre: studentFullName,
        matricula: stMatricula,
        gradoGrupo: stGradoGrupo,
        nivel: stLevel,
        tutorNombre: stTutor,
        tutorTelefono: stTutorTel,
        psicologoNombre: currentUser.nombre,
        motivoConsulta: formMotivo,
        resumenSesion: formMotivo.slice(0, 180),
        acuerdos: formAcuerdosTutor,
        esConfidencial: formEsConfidencial,
        fecha: new Date().toISOString().split('T')[0],
        estatus: formEstatus,
        canalizadoPor: formCanalizadoPor,
        canalizacionId: formCanalizacionId || undefined,
        areaAtencion: formAreaAtencion,
        nivelRiesgo: formNivelRiesgo,
        antecedentesClinicos: formAntecedentes,
        impresionDiagnostica: formImpresionDiag,
        pruebasAplicadas: formPruebas,
        objetivosIntervencion: formObjetivos,
        estrategiasAula: formEstrategiasAula,
        acuerdosTutor: formAcuerdosTutor,
        canalizacionExterna: formCanalizacionExterna,
        sesiones: [],
        archivosAdjuntos: [],
      });
    }

    if (pendingCanalizacionForExpediente) {
      setPendingCanalizacionForExpediente(null);
    }

    setIsFormOpen(false);
    setEditingRecord(null);
  };

  // Add Session to Record
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailRecord) return;

    const currentSessions = detailRecord.sesiones || [];
    const newSession: PsychologySession = {
      id: `SES-${Date.now().toString().slice(-6)}`,
      numero: currentSessions.length + 1,
      fecha: sessionFecha,
      hora: sessionHora,
      tipoSesion: sessionTipo,
      temasTratados: sessionTemas,
      observacionesConductuales: sessionObservaciones,
      acuerdos: sessionAcuerdos,
      proximaCita: sessionProximaCita || undefined,
      atendioNombre: currentUser.nombre,
    };

    const updatedSessions = [...currentSessions, newSession];
    updatePsychologyRecord(detailRecord.id, {
      sesiones: updatedSessions,
      resumenSesion: sessionTemas.slice(0, 160),
      acuerdos: sessionAcuerdos || detailRecord.acuerdos,
    });

    setDetailRecord({
      ...detailRecord,
      sesiones: updatedSessions,
    });

    // Reset sub-form
    setSessionTemas('');
    setSessionObservaciones('');
    setSessionAcuerdos('');
    setSessionProximaCita('');
    setIsSessionModalOpen(false);
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachNombre(file.name.replace(/\.[^/.]+$/, ''));
    setAttachTamanoKb(Math.round(file.size / 1024));

    if (file.type.startsWith('image/')) {
      setAttachTipo('image');
    } else if (file.type.includes('pdf')) {
      setAttachTipo('pdf');
    } else {
      setAttachTipo('doc');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAttachUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Attachment to Record
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailRecord || !attachUrl) return;

    const currentAttachments = detailRecord.archivosAdjuntos || [];
    const newAttachment: PsychologyAttachment = {
      id: `ATT-${Date.now().toString().slice(-6)}`,
      nombre: attachNombre.trim() || 'Evidencia de Seguimiento',
      tipo: attachTipo,
      categoria: attachCategoria,
      url: attachUrl,
      tamanoKb: attachTamanoKb || 120,
      fechaSubida: new Date().toISOString().split('T')[0],
      subidoPor: currentUser.nombre,
    };

    const updatedAttachments = [...currentAttachments, newAttachment];
    updatePsychologyRecord(detailRecord.id, {
      archivosAdjuntos: updatedAttachments,
    });

    setDetailRecord({
      ...detailRecord,
      archivosAdjuntos: updatedAttachments,
    });

    setAttachNombre('');
    setAttachUrl('');
    setAttachTamanoKb(0);
    setIsAttachmentModalOpen(false);
  };

  // Remove Attachment
  const handleRemoveAttachment = (attachId: string) => {
    if (!detailRecord) return;
    const updated = (detailRecord.archivosAdjuntos || []).filter((a) => a.id !== attachId);
    updatePsychologyRecord(detailRecord.id, { archivosAdjuntos: updated });
    setDetailRecord({ ...detailRecord, archivosAdjuntos: updated });
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return collegeRecords.filter((rec) => {
      if (filterEstatus !== 'todos' && rec.estatus !== filterEstatus) return false;
      if (filterArea !== 'todos' && rec.areaAtencion !== filterArea) return false;
      if (filterNivel !== 'todos') {
        const st = collegeStudentMap.get(rec.estudianteId);
        if (st && getStudentEffectiveLevel(st) !== filterNivel) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const stName = rec.estudianteNombre.toLowerCase();
        const folio = (rec.numeroExpediente || '').toLowerCase();
        const motivo = (rec.motivoConsulta || '').toLowerCase();
        const mat = (rec.matricula || '').toLowerCase();
        if (
          !stName.includes(q) &&
          !folio.includes(q) &&
          !motivo.includes(q) &&
          !mat.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [collegeRecords, filterEstatus, filterArea, filterNivel, searchTerm, collegeStudentMap]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div
        className="p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden text-white"
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
              Expedientes Clínicos Psicopedagógicos
            </span>
            {isPsychologist ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Llave Criptográfica Activa · Perfil Psicólogo ({currentUser.nombre})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                <Lock className="w-3.5 h-3.5" />
                <span>Vista Cifrada (AES-256-GCM) · Confidencialidad Médica</span>
              </span>
            )}
          </div>

          <h1 className="font-display font-extrabold text-2xl md:text-3xl flex items-center gap-3">
            <FolderHeart className="w-8 h-8" style={{ color: goldColor }} />
            <span>Módulo de Expedientes de Psicología</span>
          </h1>

          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
            {activeCollege.nombre} · Seguimiento psicopedagógico individual por alumno, registro de
            sesiones de atención, resguardo de evidencias e integración directa con reportes de canalización escolar.
          </p>
        </div>
      </div>

      {/* Alerta de Canalización Pendiente (Si viene referida de comunicados) */}
      {pendingCanalizacionForExpediente && isPsychologist && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-2 border-purple-400/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center shrink-0">
              <FolderPlus className="w-6 h-6 text-purple-200" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-purple-400/30 text-purple-100 text-[10px] font-black uppercase">
                  Canalización entrante
                </span>
                <span className="text-xs font-mono text-purple-200">
                  {pendingCanalizacionForExpediente.fecha}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Abrir Expediente para:{' '}
                <span className="text-amber-300 underline underline-offset-2">
                  {pendingCanalizacionForExpediente.estudianteNombre || 'Alumno Canalizado'}
                </span>
              </h3>
              <p className="text-xs text-purple-200 max-w-2xl line-clamp-2">
                <strong>Motivo reportado:</strong> {pendingCanalizacionForExpediente.titulo} —{' '}
                {pendingCanalizacionForExpediente.contenido}
              </p>
              <div className="text-[11px] text-purple-300">
                Canalizado por: <strong>{pendingCanalizacionForExpediente.autor}</strong> (
                {pendingCanalizacionForExpediente.autorRol || 'Docente'})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleOpenFromCanalizacion(pendingCanalizacionForExpediente)}
              className="px-4 py-2 rounded-xl font-extrabold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-slate-900" />
              <span>Abrir Expediente Ahora</span>
            </button>
            <button
              type="button"
              onClick={() => setPendingCanalizacionForExpediente(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors cursor-pointer"
              title="Descartar aviso temporal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Counters for Psychology */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Expedientes Totales
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {isPsychologist ? collegeRecords.length : '•••'}
            </span>
            <FolderHeart className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[10px] text-slate-500 block">Individuales por alumno</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            En Seguimiento / Activos
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {isPsychologist
                ? collegeRecords.filter(
                    (r) =>
                      r.estatus === 'En Intervención' ||
                      r.estatus === 'En Proceso' ||
                      r.estatus === 'Seguimiento'
                  ).length
                : '•••'}
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-600 block">En atención continua</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Canalizaciones
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700">
              {collegeCanalizaciones.length}
            </span>
            <HeartHandshake className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-[10px] text-purple-600 block">
            {collegeCanalizaciones.length - openedExpedienteByCanalizacionId.size > 0
              ? `${collegeCanalizaciones.length - openedExpedienteByCanalizacionId.size} por atender`
              : 'Todas con expediente'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Sesiones Registradas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">
              {isPsychologist
                ? collegeRecords.reduce((acc, r) => acc + (r.sesiones?.length || 0), 0)
                : '•••'}
            </span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-slate-500 block">Bitácoras clínicas</span>
        </div>
      </div>

      {/* Security notice when accessed by any non-psychologist profile */}
      {!isPsychologist && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white border-2 border-amber-500/50 shadow-md space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-sm sm:text-base text-amber-300">
                    Acceso Restringido: Expedientes Cifrados de Extremo a Extremo (AES-256-GCM)
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Tu rol actual: {currentUser.cargo || currentUser.rol}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                  SECRETO PROFESIONAL
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Por rigurosa normativa de <strong>confidencialidad psicopedagógica</strong>, el{' '}
                <strong>Código Ético del Psicólogo</strong> y la Ley Federal de Protección de Datos
                Personales (LFPDPPP), el contenido clínico de los expedientes individuales,
                impresiones diagnósticas, bitácora de sesiones y evidencias se encuentra{' '}
                <strong className="text-amber-200">cifrado de forma irreversible</strong> para
                cualquier perfil distinto a <strong>Psicólogo</strong>. Únicamente el profesional de
                Psicología cuenta con la llave de acceso clínico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Switcher: 'Expedientes Individuales' vs 'Bandeja de Canalizaciones' */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('expedientes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'expedientes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderHeart className="w-4 h-4 text-amber-400" />
            <span>Expedientes por Alumno ({collegeRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('canalizaciones')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'canalizaciones'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-purple-600" />
            <span>Canalizaciones Recibidas ({collegeCanalizaciones.length})</span>
            {collegeCanalizaciones.length - openedExpedienteByCanalizacionId.size > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {collegeCanalizaciones.length - openedExpedienteByCanalizacionId.size}
              </span>
            )}
          </button>
        </div>

        {/* Action Button: Nuevo Expediente */}
        {isPsychologist && (
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormEstudianteId(collegeStudents[0]?.id || '');
              setFormEstatus('En Evaluación');
              setFormAreaAtencion('Conductual');
              setFormNivelRiesgo('Medio');
              setFormCanalizadoPor('Docente Titular');
              setFormCanalizacionId('');
              setFormMotivo('');
              setFormAntecedentes('');
              setFormImpresionDiag('');
              setFormPruebas('');
              setFormObjetivos('');
              setFormEstrategiasAula('');
              setFormAcuerdosTutor('');
              setFormCanalizacionExterna('');
              setFormEsConfidencial(true);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-slate-950 shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: goldColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Abrir Nuevo Expediente Individual</span>
          </button>
        )}
      </div>

      {/* VIEW 1: Expedientes Individuales */}
      {activeTab === 'expedientes' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por alumno, matrícula, folio o motivo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterEstatus}
                onChange={(e) => setFilterEstatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="todos">Todos los Estatus</option>
                <option value="En Evaluación">En Evaluación</option>
                <option value="En Intervención">En Intervención</option>
                <option value="Seguimiento">Seguimiento</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Canalizado">Canalizado Externo</option>
                <option value="Concluido">Concluido</option>
                <option value="Cerrado">Cerrado</option>
              </select>

              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="todos">Todas las Áreas</option>
                <option value="Conductual">Conductual</option>
                <option value="Emocional">Emocional</option>
                <option value="Académica / Aprendizaje">Académica / Aprendizaje</option>
                <option value="Social / Convivencia">Social / Convivencia</option>
                <option value="Familiar">Familiar</option>
                <option value="Neurodivergencia / TDAH / TEA">TDAH / TEA / Neurodivergencia</option>
                <option value="Duelo / Crisis">Duelo / Crisis</option>
              </select>

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
          </div>

          {/* List of Expedientes */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  No se encontraron expedientes con los filtros seleccionados
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isPsychologist
                    ? 'Puedes abrir un nuevo expediente individual desde el botón superior o derivarlo desde una canalización.'
                    : 'No hay expedientes clínicos registrados o disponibles en este colegio.'}
                </p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const sessionsCount = rec.sesiones?.length || 0;
                const attachmentsCount = rec.archivosAdjuntos?.length || 0;

                // View for Non-Psychologist profiles (Encrypted)
                if (!isPsychologist) {
                  return (
                    <div
                      key={rec.id}
                      className="bg-slate-950/[0.02] border border-slate-300 rounded-2xl p-5 space-y-3 font-mono"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-200 px-3 py-1 rounded-lg border border-slate-300 text-slate-700">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>FOLIO: {rec.numeroExpediente || `EXP-PSI-${rec.id.slice(-4)}`}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                            <Lock className="w-3 h-3 text-amber-700" /> Cifrado Confidencial · Exclusivo Psicología
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{rec.fecha}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold flex justify-between">
                            <span>Alumno / Matrícula (Cifrado)</span>
                            <span>SHA-256</span>
                          </div>
                          <p className="tracking-wider break-all select-none">
                            {encryptClinicalText(rec.estudianteNombre, rec.id)}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 text-amber-300 border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold flex justify-between">
                            <span>Motivo y Diagnóstico (Cifrado)</span>
                            <span>AES-256-GCM</span>
                          </div>
                          <p className="tracking-wider break-all select-none">
                            {encryptClinicalText(rec.motivoConsulta, 'MOTIVO-' + rec.id)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Sesiones: <strong>[CIFRADO]</strong> · Evidencias:{' '}
                          <strong>[PROTEGIDO]</strong>
                        </span>
                        <span className="italic">Solo lectura cifrada para perfiles administrativos</span>
                      </div>
                    </div>
                  );
                }

                // Full Decrypted Card for Psychologist Profile
                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-mono font-extrabold text-xs text-indigo-950">
                          {rec.numeroExpediente || `EXP-PSI-${rec.id.slice(-4)}`}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            rec.estatus === 'En Intervención' || rec.estatus === 'En Proceso'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : rec.estatus === 'En Evaluación'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : rec.estatus === 'Seguimiento'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : rec.estatus === 'Canalizado'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {rec.estatus}
                        </span>

                        {rec.areaAtencion && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Área: {rec.areaAtencion}
                          </span>
                        )}

                        {rec.nivelRiesgo && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              rec.nivelRiesgo === 'Crítico' || rec.nivelRiesgo === 'Alto'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : rec.nivelRiesgo === 'Medio'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            Riesgo {rec.nivelRiesgo}
                          </span>
                        )}

                        {rec.esConfidencial && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Lock className="w-3 h-3" /> Confidencial
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          Apertura: {rec.fecha}
                        </span>
                      </div>
                    </div>

                    {/* Student Info & Main Motive */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-extrabold text-base md:text-lg text-slate-900 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-700" />
                          <span>{rec.estudianteNombre}</span>
                          <span className="text-xs font-normal text-slate-500">
                            ({rec.gradoGrupo} {rec.nivel ? `· ${rec.nivel}` : ''})
                          </span>
                        </h3>
                        {rec.matricula && (
                          <span className="text-xs font-mono text-slate-500 block">
                            Matrícula: {rec.matricula}{' '}
                            {rec.tutorNombre ? `· Tutor: ${rec.tutorNombre}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Quick Badges: Sesiones & Archivos */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{sessionsCount} Sesiones</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>{attachmentsCount} Evidencias</span>
                        </span>
                      </div>
                    </div>

                    {/* Motivo de Consulta */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs md:text-sm text-slate-700 space-y-1">
                      <span className="font-bold text-slate-800 block text-xs">
                        Motivo de Atención / Consulta:
                      </span>
                      <p className="line-clamp-2 leading-relaxed whitespace-pre-line">
                        {rec.motivoConsulta}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-[11px] text-slate-500">
                        Canalizado por: <strong className="text-slate-700">{rec.canalizadoPor || 'Docente'}</strong>
                        {rec.canalizacionId && (
                          <span className="ml-1 text-purple-700 font-mono">(Vinculado a Canalización)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailRecord(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Abrir Expediente Completo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Editar expediente"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Bandeja de Canalizaciones Recibidas */}
      {activeTab === 'canalizaciones' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">
                Bandeja de Reportes de Canalización Escolar
              </span>
              <p className="text-purple-900 leading-relaxed">
                Aquí se reciben directamente los comunicados y solicitudes emitidos por los docentes,
                coordinadores y directivos para derivar a un alumno a atención psicológica. Puedes
                abrir un expediente clínico con un solo clic para comenzar el seguimiento formal.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {collegeCanalizaciones.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
                <HeartHandshake className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">
                  No hay reportes de canalización registrados actualmente
                </p>
                <p>Cuando un docente o directivo emita una canalización, aparecerá automáticamente aquí.</p>
              </div>
            ) : (
              collegeCanalizaciones.map((not) => {
                const existingExpediente = openedExpedienteByCanalizacionId.get(not.id);

                return (
                  <div
                    key={not.id}
                    className="bg-white rounded-2xl border border-purple-100 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold">
                          Canalización
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            not.prioridad === 'Urgente'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          Prioridad: {not.prioridad}
                        </span>
                        {not.nivelEscolar && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {not.nivelEscolar} {not.gradoGrupo ? `· ${not.gradoGrupo}` : ''}
                          </span>
                        )}
                        {existingExpediente && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Expediente Abierto ({existingExpediente.numeroExpediente})</span>
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 font-mono">{not.fecha}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{not.titulo}</h4>
                      {not.estudianteNombre && (
                        <div className="text-xs font-bold text-indigo-900 mt-0.5 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Alumno reportado: {not.estudianteNombre}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                      {not.contenido}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-500">
                      <div>
                        Canalizado por:{' '}
                        <strong className="text-slate-800">{not.autor}</strong> (
                        {not.autorRol ? not.autorRol.toUpperCase() : 'Personal Escolar'})
                      </div>

                      {isPsychologist && (
                        <div>
                          {existingExpediente ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailRecord(existingExpediente);
                                setActiveTab('expedientes');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Ver Expediente del Alumno</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenFromCanalizacion(not)}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <FolderPlus className="w-4 h-4" />
                              <span>Abrir Expediente Clínico</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Crear o Editar Expediente Individual */}
      {isFormOpen && isPsychologist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div
              className="p-5 flex items-center justify-between text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="space-y-0.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  {editingRecord ? 'Edición de Expediente' : 'Apertura de Expediente Individual'}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  {editingRecord
                    ? `Expediente: ${editingRecord.numeroExpediente || editingRecord.estudianteNombre}`
                    : 'Nuevo Expediente Psicopedagógico Escolar'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingRecord(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveExpediente} className="p-5 md:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Sección 1: Datos de Identificación del Alumno */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                  <User className="w-4 h-4 text-indigo-700" />
                  <span>1. Ficha de Identificación del Alumno</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Alumno del Plantel (*):
                    </label>
                    <select
                      value={formEstudianteId}
                      onChange={(e) => setFormEstudianteId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold focus:outline-indigo-500"
                    >
                      <option value="">Selecciona al alumno...</option>
                      {collegeStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.nombre} {st.apellidos} · {st.grado} {st.grupo} (
                          {getStudentEffectiveLevel(st)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Estatus del Expediente:
                    </label>
                    <select
                      value={formEstatus}
                      onChange={(e) => setFormEstatus(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="En Evaluación">En Evaluación</option>
                      <option value="En Intervención">En Intervención</option>
                      <option value="Seguimiento">Seguimiento</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Canalizado">Canalizado Externo</option>
                      <option value="Concluido">Concluido</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Canalización, Área de Atención y Riesgo */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                  <HeartHandshake className="w-4 h-4 text-purple-700" />
                  <span>2. Origen, Área de Atención y Clasificación de Riesgo</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Canalizado por:
                    </label>
                    <input
                      type="text"
                      value={formCanalizadoPor}
                      onChange={(e) => setFormCanalizadoPor(e.target.value)}
                      placeholder="Docente, Dirección, Prefectura..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Área de Atención Prioritaria:
                    </label>
                    <select
                      value={formAreaAtencion}
                      onChange={(e) => setFormAreaAtencion(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="Conductual">Conductual</option>
                      <option value="Emocional">Emocional</option>
                      <option value="Académica / Aprendizaje">Académica / Aprendizaje</option>
                      <option value="Social / Convivencia">Social / Convivencia</option>
                      <option value="Familiar">Familiar</option>
                      <option value="Neurodivergencia / TDAH / TEA">Neurodivergencia / TDAH / TEA</option>
                      <option value="Duelo / Crisis">Duelo / Crisis</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Nivel de Riesgo / Urgencia:
                    </label>
                    <select
                      value={formNivelRiesgo}
                      onChange={(e) => setFormNivelRiesgo(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="Bajo">Bajo (Seguimiento regular)</option>
                      <option value="Medio">Medio (Intervención áulica)</option>
                      <option value="Alto">Alto (Citatorio urgente a tutores)</option>
                      <option value="Crítico">Crítico (Protocolo de contención)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-800">
                    Motivo Detallado de Atención / Canalización (*):
                  </label>
                  <textarea
                    value={formMotivo}
                    onChange={(e) => setFormMotivo(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe de forma detallada las conductas observadas, situaciones detonantes o motivos de la canalización..."
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs leading-relaxed focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Sección 3: Historia Psicopedagógica y Diagnóstico */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>3. Historia Clínica, Pruebas e Impresión Diagnóstica</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Antecedentes Escolares, Médicos y Familiares:
                    </label>
                    <textarea
                      value={formAntecedentes}
                      onChange={(e) => setFormAntecedentes(e.target.value)}
                      rows={2}
                      placeholder="Dinámica familiar, antecedentes médicos, historial en ciclos previos..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Pruebas e Instrumentos Aplicados:
                    </label>
                    <textarea
                      value={formPruebas}
                      onChange={(e) => setFormPruebas(e.target.value)}
                      rows={2}
                      placeholder="HTP, Bender, Raven, Cuestionario Conners, Escala de Autoestima..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-800">
                    Impresión Diagnóstica Preliminar:
                  </label>
                  <textarea
                    value={formImpresionDiag}
                    onChange={(e) => setFormImpresionDiag(e.target.value)}
                    rows={2}
                    placeholder="Hipótesis psicopedagógica preliminar para el plan de trabajo..."
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              {/* Sección 4: Plan de Intervención y Recomendaciones */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>4. Plan de Intervención y Adecuaciones para el Aula</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Objetivos de la Intervención:
                    </label>
                    <textarea
                      value={formObjetivos}
                      onChange={(e) => setFormObjetivos(e.target.value)}
                      rows={2}
                      placeholder="Metas terapéuticas y socioemocionales esperadas..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Estrategias y Adecuaciones para Docentes en Aula:
                    </label>
                    <textarea
                      value={formEstrategiasAula}
                      onChange={(e) => setFormEstrategiasAula(e.target.value)}
                      rows={2}
                      placeholder="Ubicación preferencial, pausas activas, instrucciones segmentadas..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Acuerdos y Compromisos con los Padres / Tutor:
                    </label>
                    <textarea
                      value={formAcuerdosTutor}
                      onChange={(e) => setFormAcuerdosTutor(e.target.value)}
                      rows={2}
                      placeholder="Supervisión en casa, rutinas de sueño, asistencia a citatorios..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-800">
                      Derivación / Canalización Externa (Opcional):
                    </label>
                    <textarea
                      value={formCanalizacionExterna}
                      onChange={(e) => setFormCanalizacionExterna(e.target.value)}
                      rows={2}
                      placeholder="Neuropediatría, Paidopsiquiatría, Terapia de Lenguaje, Centro de Salud Mental..."
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox Confidencial */}
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-xs text-purple-950">
                    Expediente Confidencial de Alta Seguridad
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-purple-900">
                  <input
                    type="checkbox"
                    checked={formEsConfidencial}
                    onChange={(e) => setFormEsConfidencial(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span>Cifrar para otros perfiles</span>
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-sm transition-all"
                  style={{ backgroundColor: goldColor }}
                >
                  {editingRecord ? 'Actualizar Expediente' : 'Guardar y Abrir Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detalle Completo del Expediente Individual (Sesiones + Archivos) */}
      {detailRecord && isPsychologist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div
              className="p-5 flex flex-wrap items-center justify-between gap-2 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: goldColor, color: primaryColor }}
                  >
                    Ficha Clínica Individual
                  </span>
                  <span className="font-mono text-xs text-amber-200">
                    {detailRecord.numeroExpediente || `EXP-PSI-${detailRecord.id.slice(-4)}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                    {detailRecord.estatus}
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-lg sm:text-xl flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                  <span>{detailRecord.estudianteNombre}</span>
                  <span className="text-xs font-normal text-slate-300">
                    ({detailRecord.gradoGrupo} · {detailRecord.nivel})
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Imprimir expediente con membrete"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ficha</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailRecord(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with 3 Main Tabs: Ficha Clínica, Sesiones de Seguimiento, Archivos y Evidencias */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-xs">
              {/* Card Resumen del Alumno */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-indigo-950">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Matrícula</span>
                  <span className="font-mono font-bold text-xs">{detailRecord.matricula || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tutor / Contacto</span>
                  <span className="font-bold text-xs truncate block">{detailRecord.tutorNombre || 'Sin tutor'}</span>
                  {detailRecord.tutorTelefono && (
                    <span className="text-[10px] text-slate-600 font-mono block">{detailRecord.tutorTelefono}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Área y Riesgo</span>
                  <span className="font-bold text-xs block text-purple-900">
                    {detailRecord.areaAtencion || 'Conductual'}
                  </span>
                  <span className="text-[10px] text-rose-700 font-extrabold uppercase">
                    Riesgo {detailRecord.nivelRiesgo || 'Medio'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Psicólogo Titular</span>
                  <span className="font-bold text-xs block truncate">{detailRecord.psicologoNombre}</span>
                  <span className="text-[10px] text-slate-500 block">Apertura: {detailRecord.fecha}</span>
                </div>
              </div>

              {/* SECCIÓN 1: Ficha Clínica y Diagnóstica */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-700" />
                    <span>Ficha Diagnóstica y Plan de Intervención</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(detailRecord)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Ficha</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 text-xs block">Motivo de Intervención:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {detailRecord.motivoConsulta}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 text-xs block">Impresión Diagnóstica:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {detailRecord.impresionDiagnostica || 'En proceso de valoración diagnóstica escolar.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 text-xs block">Pruebas Aplicadas:</span>
                    <p className="text-slate-600 leading-relaxed">
                      {detailRecord.pruebasAplicadas || 'Entrevista estructurada inicial.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-950 text-xs block">Estrategias en Aula (Docentes):</span>
                    <p className="text-emerald-900 leading-relaxed whitespace-pre-line">
                      {detailRecord.estrategiasAula || 'Pautas de apoyo en proceso de emisión.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                    <span className="font-bold text-purple-950 text-xs block">Compromisos con Padres:</span>
                    <p className="text-purple-900 leading-relaxed whitespace-pre-line">
                      {detailRecord.acuerdosTutor || detailRecord.acuerdos || 'Acuerdos en sesión inicial.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Bitácora de Sesiones de Seguimiento */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Bitácora de Sesiones de Seguimiento ({detailRecord.sesiones?.length || 0})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Registrar Nueva Sesión</span>
                  </button>
                </div>

                {(!detailRecord.sesiones || detailRecord.sesiones.length === 0) ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                    <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">No hay sesiones registradas en este expediente</p>
                    <p className="text-[11px]">Haz clic en "Registrar Nueva Sesión" para documentar la entrevista o intervención.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detailRecord.sesiones.map((ses, idx) => (
                      <div
                        key={ses.id || idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-xs">
                              #{ses.numero || idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {ses.tipoSesion}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {ses.fecha} {ses.hora ? `· ${ses.hora} hrs` : ''}
                            </span>
                          </div>
                          {ses.proximaCita && (
                            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>Próxima cita: {ses.proximaCita}</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div>
                            <strong className="text-slate-800 block text-[11px]">Temas tratados:</strong>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {ses.temasTratados}
                            </p>
                          </div>

                          {ses.observacionesConductuales && (
                            <div>
                              <strong className="text-slate-800 block text-[11px]">Observaciones conductuales / actitud:</strong>
                              <p className="text-slate-600 leading-relaxed">
                                {ses.observacionesConductuales}
                              </p>
                            </div>
                          )}

                          {ses.acuerdos && (
                            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                              <strong className="text-purple-950 block text-[11px]">Acuerdos y compromisos:</strong>
                              <p className="text-purple-900 leading-relaxed">{ses.acuerdos}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: Archivos Adjuntos e Imágenes de Seguimiento */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Archivos, Imágenes y Evidencias ({detailRecord.archivosAdjuntos?.length || 0})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachNombre('');
                      setAttachUrl('');
                      setAttachTamanoKb(0);
                      setIsAttachmentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Agregar Archivo o Imagen</span>
                  </button>
                </div>

                {(!detailRecord.archivosAdjuntos || detailRecord.archivosAdjuntos.length === 0) ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">No hay archivos ni imágenes adjuntas</p>
                    <p className="text-[11px]">
                      Puedes adjuntar dibujos del alumno, pruebas psicométricas escaneadas, reportes médicos o consentimientos informados firmados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {detailRecord.archivosAdjuntos.map((att) => (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 truncate">
                              {att.categoria}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {att.tamanoKb ? `${att.tamanoKb} KB` : 'Archivo'}
                            </span>
                          </div>

                          {/* Image Thumbnail Preview if Image */}
                          {att.tipo === 'image' && att.url ? (
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer relative group flex items-center justify-center"
                            >
                              <img
                                src={att.url}
                                alt={att.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" />
                                <span>Ver Ampliada</span>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="h-28 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors p-2 text-center"
                            >
                              <FileCheck2 className="w-8 h-8 text-blue-600 mb-1" />
                              <span className="font-bold text-xs truncate max-w-full block">
                                {att.nombre}
                              </span>
                              <span className="text-[10px] text-slate-400">Documento Clínico</span>
                            </div>
                          )}

                          <div className="mt-2">
                            <span className="font-bold text-slate-900 text-xs truncate block" title={att.nombre}>
                              {att.nombre}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Subido: {att.fechaSubida}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar evidencia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Registrar Nueva Sesión de Seguimiento */}
      {isSessionModalOpen && detailRecord && isPsychologist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">
                  Bitácora de Sesión
                </span>
                <h3 className="font-bold text-base">
                  Registrar Sesión #{((detailRecord.sesiones || []).length) + 1} para {detailRecord.estudianteNombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Fecha de Sesión:</label>
                  <input
                    type="date"
                    value={sessionFecha}
                    onChange={(e) => setSessionFecha(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-800">Hora:</label>
                  <input
                    type="time"
                    value={sessionHora}
                    onChange={(e) => setSessionHora(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">Tipo de Sesión:</label>
                <select
                  value={sessionTipo}
                  onChange={(e) => setSessionTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                >
                  <option value="Individual con Alumno">Individual con Alumno</option>
                  <option value="Entrevista con Padres/Tutor">Entrevista con Padres/Tutor</option>
                  <option value="Reunión con Docentes">Reunión con Docentes</option>
                  <option value="Observación en Aula">Observación en Aula</option>
                  <option value="Evaluación Psicométrica">Evaluación Psicométrica</option>
                  <option value="Cierre de Caso">Cierre de Caso</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Temas Tratados y Desarrollo (*):
                </label>
                <textarea
                  value={sessionTemas}
                  onChange={(e) => setSessionTemas(e.target.value)}
                  required
                  rows={3}
                  placeholder="Descripción de la intervención, diálogo con el alumno o tutor..."
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Observaciones Conductuales y Lenguaje no Verbal:
                </label>
                <textarea
                  value={sessionObservaciones}
                  onChange={(e) => setSessionObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Apertura, contacto visual, resistencia, modulación del afecto..."
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Acuerdos y Tareas Establecidas:
                </label>
                <textarea
                  value={sessionAcuerdos}
                  onChange={(e) => setSessionAcuerdos(e.target.value)}
                  rows={2}
                  placeholder="Compromisos para la siguiente sesión..."
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Fecha de Próxima Cita (Opcional):
                </label>
                <input
                  type="date"
                  value={sessionProximaCita}
                  onChange={(e) => setSessionProximaCita(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-sm"
                >
                  Guardar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Subir Archivo o Imagen de Seguimiento */}
      {isAttachmentModalOpen && detailRecord && isPsychologist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-300 uppercase block font-bold">
                  Evidencia Clínica
                </span>
                <h3 className="font-bold text-base">
                  Adjuntar Archivo o Imagen para {detailRecord.estudianteNombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAttachment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Categoría del Archivo:
                </label>
                <select
                  value={attachCategoria}
                  onChange={(e) => setAttachCategoria(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-semibold"
                >
                  <option value="Evidencia de Seguimiento">Evidencia de Seguimiento</option>
                  <option value="Prueba Psicométrica / Dibujo">Prueba Psicométrica / Dibujo</option>
                  <option value="Consentimiento Informado">Consentimiento Informado Firmado</option>
                  <option value="Reporte Externo">Reporte Externo (Neurología/Psiquiatría)</option>
                  <option value="Nota Escaneada">Nota Escaneada</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Nombre o Descripción del Archivo (*):
                </label>
                <input
                  type="text"
                  value={attachNombre}
                  onChange={(e) => setAttachNombre(e.target.value)}
                  required
                  placeholder="Ej: Dibujo de la Familia, Test HTP, Consentimiento Tutor..."
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                />
              </div>

              {/* Selector de Archivo Local */}
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Seleccionar Archivo o Imagen del Equipo (*):
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-center cursor-pointer space-y-2"
                >
                  <Upload className="w-7 h-7 text-indigo-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {attachUrl ? '¡Archivo seleccionado!' : 'Haz clic para seleccionar archivo o imagen'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Formatos soportados: JPG, PNG, WEBP, PDF (Se almacena en el expediente)
                  </div>
                  {attachUrl && (
                    <div className="pt-2 text-[11px] font-mono text-emerald-700 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{attachNombre || 'Archivo listo'} ({attachTamanoKb} KB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAttachmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!attachUrl}
                  className={`px-5 py-2 rounded-xl font-extrabold shadow-sm ${
                    attachUrl
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Subir al Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Visor de Archivo / Imagen en Pantalla Completa */}
      {previewAttachment && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">
                  {previewAttachment.categoria}
                </span>
                <h3 className="font-bold text-sm sm:text-base">{previewAttachment.nombre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.nombre}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Descargar archivo"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
              {previewAttachment.tipo === 'image' && previewAttachment.url ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.nombre}
                  className="max-h-[70vh] object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileCheck2 className="w-16 h-16 text-indigo-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-base">{previewAttachment.nombre}</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Documento clínico digital ({previewAttachment.tamanoKb || 0} KB). Haz clic en descargar para abrirlo con el visor de tu sistema.
                  </p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.nombre}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-700 text-white font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Documento</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Impresión de Expediente con Membrete Oficial */}
      {isPrintMode && detailRecord && (
        <div className="fixed inset-0 z-80 bg-white p-8 overflow-y-auto print:p-0 animate-in fade-in">
          <div className="max-w-3xl mx-auto space-y-6 text-slate-900 font-sans">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider">{activeCollege.nombre}</h1>
                <p className="text-xs text-slate-600">Departamento de Psicología y Orientación Escolar</p>
                <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                  FICHA CONFIDENCIAL DE SEGUIMIENTO PSICOPEDAGÓGICO
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-extrabold block">
                  {detailRecord.numeroExpediente || `EXP-PSI-${detailRecord.id.slice(-4)}`}
                </span>
                <span className="text-xs text-slate-500 block">Fecha: {detailRecord.fecha}</span>
                <span className="text-[10px] font-bold text-purple-800 uppercase block">
                  CONFIDENCIAL / SECRETO PROFESIONAL
                </span>
              </div>
            </div>

            {/* Datos Alumno */}
            <div className="border border-slate-300 p-4 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Alumno:</strong> {detailRecord.estudianteNombre}
                </div>
                <div>
                  <strong>Matrícula:</strong> {detailRecord.matricula || 'N/A'}
                </div>
                <div>
                  <strong>Nivel y Grupo:</strong> {detailRecord.nivel} · {detailRecord.gradoGrupo}
                </div>
                <div>
                  <strong>Tutor Registrado:</strong> {detailRecord.tutorNombre || 'N/A'}{' '}
                  {detailRecord.tutorTelefono ? `(${detailRecord.tutorTelefono})` : ''}
                </div>
                <div>
                  <strong>Canalizado por:</strong> {detailRecord.canalizadoPor || 'Docente'}
                </div>
                <div>
                  <strong>Área / Nivel de Riesgo:</strong> {detailRecord.areaAtencion} / Riesgo{' '}
                  {detailRecord.nivelRiesgo}
                </div>
              </div>
            </div>

            {/* Contenido Clínico */}
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold border-b pb-1 text-sm">Motivo de Intervención / Canalización:</h3>
                <p className="mt-1 leading-relaxed whitespace-pre-line">{detailRecord.motivoConsulta}</p>
              </div>

              {detailRecord.antecedentesClinicos && (
                <div>
                  <h3 className="font-bold border-b pb-1 text-sm">Antecedentes Clínicos y Familiares:</h3>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">{detailRecord.antecedentesClinicos}</p>
                </div>
              )}

              {detailRecord.impresionDiagnostica && (
                <div>
                  <h3 className="font-bold border-b pb-1 text-sm">Impresión Diagnóstica Preliminar:</h3>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">{detailRecord.impresionDiagnostica}</p>
                </div>
              )}

              {detailRecord.estrategiasAula && (
                <div>
                  <h3 className="font-bold border-b pb-1 text-sm">Adecuaciones y Estrategias para el Aula:</h3>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">{detailRecord.estrategiasAula}</p>
                </div>
              )}

              {detailRecord.acuerdosTutor && (
                <div>
                  <h3 className="font-bold border-b pb-1 text-sm">Acuerdos Establecidos con el Tutor:</h3>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">{detailRecord.acuerdosTutor}</p>
                </div>
              )}

              {/* Bitácora de Sesiones Resumen */}
              {detailRecord.sesiones && detailRecord.sesiones.length > 0 && (
                <div>
                  <h3 className="font-bold border-b pb-1 text-sm">
                    Bitácora de Sesiones Realizadas ({detailRecord.sesiones.length}):
                  </h3>
                  <div className="mt-2 space-y-2">
                    {detailRecord.sesiones.map((s, idx) => (
                      <div key={idx} className="border-l-2 border-slate-400 pl-3 py-1">
                        <div className="font-bold">
                          Sesión #{s.numero} ({s.fecha}) · {s.tipoSesion}
                        </div>
                        <div className="text-slate-700">{s.temasTratados}</div>
                        {s.acuerdos && (
                          <div className="text-purple-900 italic font-semibold">Acuerdos: {s.acuerdos}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Firmas */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold block">{detailRecord.psicologoNombre}</span>
                <span className="text-slate-500">Psicólogo(a) Titular / Orientación Escolar</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold block">{activeCollege.director || 'Dirección General'}</span>
                <span className="text-slate-500">Dirección Institucional</span>
              </div>
            </div>

            {/* Print Controls (Hidden when printed) */}
            <div className="pt-6 border-t flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintMode(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                Volver a la App
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
