import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PreenrollmentLevel,
  College,
  PreenrollmentAttachedFile,
} from '../types';
import {
  PREENROLLMENT_GRADES_BY_LEVEL,
  getDefaultEnrollmentFees,
} from '../utils/preenrollmentHelper';
import {
  X,
  Send,
  CheckCircle2,
  Building2,
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  CreditCard,
  Printer,
  Info,
  Paperclip,
  Upload,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCollegeId?: string | null;
}

export const PublicPreenrollmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultCollegeId,
}) => {
  const { colleges, activeCollege, addPreenrollment, getPreenrollmentConfig } = useApp();

  const initialCollegeId =
    defaultCollegeId || (activeCollege ? activeCollege.id : colleges[0]?.id || '');

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(initialCollegeId);

  React.useEffect(() => {
    if (isOpen) {
      const targetId =
        defaultCollegeId || (activeCollege ? activeCollege.id : colleges[0]?.id || '');
      if (targetId) {
        setSelectedCollegeId(targetId);
      }
    }
  }, [isOpen, defaultCollegeId, activeCollege?.id]);

  const currentCollege: College | undefined =
    colleges.find((c) => c.id === selectedCollegeId) || activeCollege || colleges[0];

  // College-specific branding
  const primaryColor = currentCollege?.colores?.primario || '#0B2545';
  const secondaryColor = currentCollege?.colores?.secundario || '#C59B27';
  const headerTextColor = currentCollege?.colores?.textoCabecera || '#FFFFFF';
  const escudoUrl = currentCollege?.escudoUrl || '';

  // College-specific customized form configuration
  const config = getPreenrollmentConfig(currentCollege?.id || 'col-cervantes');

  const availableLevels = config.nivelesDisponibles?.length
    ? config.nivelesDisponibles
    : (['preescolar', 'primaria', 'secundaria', 'preparatoria'] as PreenrollmentLevel[]);

  const [alumnoNombre, setAlumnoNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [promedio, setPromedio] = useState('9.0');
  const [nivel, setNivel] = useState<PreenrollmentLevel>(availableLevels[0] || 'primaria');
  const [grado, setGrado] = useState<string>(
    PREENROLLMENT_GRADES_BY_LEVEL[availableLevels[0] || 'primaria']?.[0] || '1°'
  );
  const [escuelaProcedencia, setEscuelaProcedencia] = useState('Ninguna');

  // Tutor
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorCorreo, setTutorCorreo] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');

  // Uploaded documents state: mapping from document requirement ID to file metadata
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { name: string; size: string; rawFile?: File }>
  >({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submission state
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNivelChange = (newNivel: PreenrollmentLevel) => {
    setNivel(newNivel);
    const availableGrades = PREENROLLMENT_GRADES_BY_LEVEL[newNivel] || [];
    setGrado(availableGrades[0] || '');
  };

  const handleFileSelect = (
    docId: string,
    docName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Format human-readable size
    let sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    if (file.size > 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: {
        name: file.name,
        size: sizeStr,
        rawFile: file,
      },
    }));
    setValidationError(null);
  };

  const handleRemoveFile = (docId: string) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!alumnoNombre.trim() || !curp.trim() || !tutorNombre.trim() || !tutorCorreo.trim()) {
      setValidationError('Por favor completa todos los campos requeridos con asterisco (*).');
      return;
    }

    // Validate mandatory documents defined by this college
    const activeDocRequirements = (config.documentosRequeridos || []).filter((d) => d.activo);
    for (const doc of activeDocRequirements) {
      if (doc.obligatorio && !uploadedFiles[doc.id]) {
        setValidationError(`El documento obligatorio "${doc.nombre}" es requerido por el colegio.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const parsedPromedio = Math.min(10, Math.max(0, parseFloat(promedio) || 8.5));

      // Build attached files array
      const archivosAdjuntos: PreenrollmentAttachedFile[] = Object.entries(uploadedFiles).map(
        ([docId, f]) => {
          const docDef = activeDocRequirements.find((d) => d.id === docId);
          return {
            documentoId: docId,
            nombreDocumento: docDef?.nombre || 'Documento Adjunto',
            nombreArchivo: f.name,
            tamano: f.size,
            fechaSubida: new Date().toISOString().split('T')[0],
          };
        }
      );

      const newReq = addPreenrollment({
        colegioId: currentCollege?.id || 'col-cervantes',
        colegioNombre: currentCollege?.nombre || 'Colegio Cervantes Moderno',
        alumnoNombreCompleto: alumnoNombre.trim(),
        curp: curp.trim().toUpperCase(),
        fechaNacimiento: fechaNacimiento || '2016-05-10',
        promedio: parsedPromedio,
        nivel,
        grado,
        escuelaProcedencia: escuelaProcedencia.trim() || 'Ninguna',
        tutorNombre: tutorNombre.trim(),
        tutorCorreo: tutorCorreo.trim().toLowerCase(),
        tutorTelefono: tutorTelefono.trim() || '+52 55 0000-0000',
        archivosAdjuntos,
      });

      setSubmittedResult(newReq);
    } catch (err) {
      console.error('Error al registrar preinscripción:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedResult(null);
    setAlumnoNombre('');
    setCurp('');
    setFechaNacimiento('');
    setPromedio('9.0');
    setEscuelaProcedencia('Ninguna');
    setTutorNombre('');
    setTutorCorreo('');
    setTutorTelefono('');
    setUploadedFiles({});
    setValidationError(null);
  };

  // Fees configured by the college for the selected level
  const currentFees =
    config.cuotasPorNivel?.[nivel] || getDefaultEnrollmentFees(nivel);
  const totalFees = currentFees.reduce((acc, c) => acc + c.monto, 0);

  const activeDocuments = (config.documentosRequeridos || []).filter((d) => d.activo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-auto">
        {/* Modal Header Branded with College Color and Official Shield */}
        <div
          className="p-4 sm:p-5 border-b border-white/20 text-white flex items-center justify-between transition-colors shadow-sm relative overflow-hidden"
          style={{
            backgroundColor: primaryColor,
            color: headerTextColor,
          }}
        >
          {/* Subtle background glow with secondary color */}
          <div
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ backgroundColor: secondaryColor }}
          />

          <div className="flex items-center gap-3.5 relative z-10">
            {/* Official College Shield */}
            {escudoUrl && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/50 shadow-lg shrink-0 flex items-center justify-center">
                <img
                  src={escudoUrl}
                  alt={`Escudo de ${currentCollege?.nombre}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-base sm:text-lg tracking-tight leading-tight">
                  {currentCollege?.nombre || 'Formulario Oficial de Preinscripción'}
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs shrink-0"
                  style={{
                    backgroundColor: secondaryColor,
                    color: '#0B2545',
                  }}
                >
                  Ciclo 2026-2027
                </span>
              </div>
              <p className="text-xs opacity-90 font-medium mt-0.5">
                Admisiones y Solicitud de Ingreso · CCT {currentCollege?.codigoCCT}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="opacity-80 hover:opacity-100 p-2 rounded-xl hover:bg-black/15 transition-all cursor-pointer relative z-10 shrink-0"
            style={{ color: headerTextColor }}
            title="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {submittedResult ? (
            /* Success confirmation screen */
            <div className="space-y-6 text-center animate-in fade-in py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-bold text-xl text-slate-900">
                  ¡Solicitud Enviada con Éxito!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  La solicitud de preinscripción ha ingresado a la oficina de Control Escolar de{' '}
                  <strong>{submittedResult.colegioNombre}</strong>.
                </p>
              </div>

              {/* Folio Voucher with College Shield */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3 font-mono text-xs shadow-2xs">
                {/* College Branding Strip in Voucher */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    {escudoUrl && (
                      <img
                        src={escudoUrl}
                        alt={submittedResult.colegioNombre}
                        className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-2xs shrink-0"
                      />
                    )}
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 font-sans">
                        {submittedResult.colegioNombre}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        Comprobante Oficial de Solicitud de Admisión
                      </div>
                    </div>
                  </div>

                  <span
                    className="font-bold text-xs px-2.5 py-1 rounded-lg border font-mono shrink-0"
                    style={{
                      backgroundColor: `${primaryColor}12`,
                      color: primaryColor,
                      borderColor: `${primaryColor}40`,
                    }}
                  >
                    {submittedResult.folio}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans">Aspirante:</span>
                    <span className="font-bold text-slate-800">{submittedResult.alumnoNombreCompleto}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">CURP:</span>
                    <span className="font-bold text-slate-800">{submittedResult.curp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Nivel y Grado:</span>
                    <span className="font-bold text-slate-800">{submittedResult.grado}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Promedio:</span>
                    <span className="font-bold text-emerald-700">{submittedResult.promedio}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Procedencia:</span>
                    <span className="font-bold text-slate-800">{submittedResult.escuelaProcedencia || 'Ninguna'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Tutor Legal:</span>
                    <span className="font-bold text-slate-800">{submittedResult.tutorNombre}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-sans">Correo Notificaciones:</span>
                    <span className="font-bold text-blue-700">{submittedResult.tutorCorreo}</span>
                  </div>
                </div>

                {/* Show attached files in voucher */}
                {submittedResult.archivosAdjuntos && submittedResult.archivosAdjuntos.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-slate-500 font-sans font-bold block text-[10px]">
                      Documentos Adjuntos Recibidos ({submittedResult.archivosAdjuntos.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {submittedResult.archivosAdjuntos.map((arch: PreenrollmentAttachedFile, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-sans flex items-center gap-1"
                        >
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                          <span>{arch.nombreDocumento} ({arch.tamano})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-sans">
                  * Hemos despachado un acuse oficial al correo del tutor con los pasos del proceso de admisión.
                </div>
              </div>

              {/* Next Steps Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 text-left max-w-lg mx-auto space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <Info className="w-4 h-4 text-blue-700" />
                  <span>¿Qué sigue en el proceso de inscripción?</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. El comité directivo evaluará la solicitud y los documentos adjuntos.<br />
                  2. Al ser aceptada, se generará el <strong>Usuario y Contraseña del Tutor</strong> para acceder a la plataforma.<br />
                  3. En el portal y por correo se enviará el <strong>monto oficial a pagar</strong>. Al confirmarse el pago, se asignará el salón de clases correspondiente.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
                  style={{
                    backgroundColor: primaryColor,
                    color: headerTextColor,
                  }}
                >
                  Registrar Otra Solicitud
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* College Selector (if multiple exist) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>Plantel Educativo Seleccionado *</span>
                </label>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white text-slate-900 shadow-2xs"
                  style={{
                    outlineColor: primaryColor,
                  }}
                  required
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.nombre} ({col.codigoCCT}) — {col.direccion}
                    </option>
                  ))}
                </select>
              </div>

              {/* College Brand Presentation Card with Shield & Motto */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 transition-colors shadow-2xs"
                style={{
                  borderColor: `${primaryColor}30`,
                  backgroundColor: `${primaryColor}06`,
                }}
              >
                {escudoUrl && (
                  <div className="w-14 h-14 rounded-xl bg-white p-1.5 border border-slate-200 shrink-0 shadow-xs flex items-center justify-center">
                    <img
                      src={escudoUrl}
                      alt={currentCollege?.nombre}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-black truncate text-slate-900" style={{ color: primaryColor }}>
                    {currentCollege?.nombre}
                  </div>
                  {currentCollege?.lema && (
                    <div className="text-[11px] text-slate-600 italic truncate">
                      &ldquo;{currentCollege.lema}&rdquo;
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    CCT: {currentCollege?.codigoCCT} · Nivel: {currentCollege?.nivel}
                  </div>
                </div>
              </div>

              {/* College's Customized Welcome Instructions */}
              {config.instruccionesPersonalizadas && (
                <div
                  className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5"
                  style={{
                    borderColor: `${primaryColor}30`,
                    backgroundColor: `${primaryColor}08`,
                  }}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {config.instruccionesPersonalizadas}
                  </p>
                </div>
              )}

              {/* Validation error banner */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Section 1: Alumno */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>1. Datos del Alumno Aspirante</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">* Campos Obligatorios</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nombre Completo del Alumno *
                    </label>
                    <input
                      type="text"
                      value={alumnoNombre}
                      onChange={(e) => setAlumnoNombre(e.target.value)}
                      placeholder="Ej. Mateo Sebastián Morales Lozano"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400"
                      style={{
                        outlineColor: primaryColor,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CURP del Alumno * (18 caracteres)
                    </label>
                    <input
                      type="text"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      placeholder="MOLM180415HDFRZR02"
                      maxLength={18}
                      className="w-full text-xs font-mono uppercase px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400"
                      style={{
                        outlineColor: primaryColor,
                      }}
                      required
                    />
                  </div>

                  {config.pedirFechaNacimiento !== false && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Fecha de Nacimiento</span>
                      </label>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900"
                      />
                    </div>
                  )}

                  {/* Nivel Selector (Filters by college's configured levels) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nivel al que va a Inscribir *
                    </label>
                    <select
                      value={nivel}
                      onChange={(e) => handleNivelChange(e.target.value as PreenrollmentLevel)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900"
                      required
                    >
                      {availableLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl === 'preescolar' && 'Preescolar (Kinder)'}
                          {lvl === 'primaria' && 'Primaria'}
                          {lvl === 'secundaria' && 'Secundaria'}
                          {lvl === 'preparatoria' && 'Preparatoria / Bachillerato'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Grados Selector based on selected level */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Grado Correspondiente * ({nivel.toUpperCase()})
                    </label>
                    <select
                      value={grado}
                      onChange={(e) => setGrado(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-slate-900"
                      style={{
                        borderColor: `${primaryColor}50`,
                      }}
                      required
                    >
                      {(PREENROLLMENT_GRADES_BY_LEVEL[nivel] || []).map((gr) => (
                        <option key={gr} value={gr}>
                          {gr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.pedirPromedio !== false && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3 text-slate-500" />
                        <span>Promedio Anterior o Actual (Escala 0 - 10)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={promedio}
                        onChange={(e) => setPromedio(e.target.value)}
                        placeholder="9.0"
                        className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900"
                      />
                    </div>
                  )}

                  {config.pedirEscuelaProcedencia !== false && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>Escuela de Procedencia *</span>
                      </label>
                      <input
                        type="text"
                        value={escuelaProcedencia}
                        onChange={(e) => setEscuelaProcedencia(e.target.value)}
                        placeholder="Ninguna"
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        * Por defecto &quot;Ninguna&quot; si ingresa por primera vez.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Documentos y Archivos Adjuntos (Configurados por el colegio) */}
              {activeDocuments.length > 0 && (
                <div
                  className="p-4 rounded-2xl border space-y-3.5"
                  style={{
                    backgroundColor: `${primaryColor}04`,
                    borderColor: `${primaryColor}25`,
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>2. Documentación y Archivos Adjuntos</span>
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {currentCollege?.nombre}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Adjunta los documentos solicitados por el colegio (formatos PDF, JPG, PNG, máx 10 MB):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDocuments.map((doc) => {
                      const uploaded = uploadedFiles[doc.id];
                      return (
                        <div
                          key={doc.id}
                          className={`p-3 rounded-xl border transition-all ${
                            uploaded
                              ? 'bg-emerald-50/80 border-emerald-300'
                              : 'bg-white border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-900">
                              {doc.nombre}
                            </span>
                            {doc.obligatorio ? (
                              <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                                * Requerido
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                Opcional
                              </span>
                            )}
                          </div>

                          {doc.descripcion && (
                            <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                              {doc.descripcion}
                            </p>
                          )}

                          {uploaded ? (
                            <div className="flex items-center justify-between bg-emerald-100/70 p-2 rounded-lg text-[11px] font-mono text-emerald-900">
                              <div className="truncate flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate font-semibold">{uploaded.name}</span>
                                <span className="text-[10px] text-emerald-700 shrink-0">({uploaded.size})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(doc.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                title="Quitar archivo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label
                              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-slate-50"
                              style={{
                                borderColor: `${primaryColor}40`,
                                color: primaryColor,
                              }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Seleccionar Archivo</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => handleFileSelect(doc.id, doc.nombre, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Tutor */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>3. Datos del Padre, Madre o Tutor Legal</span>
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${secondaryColor}15`,
                      color: '#0B2545',
                      borderColor: `${secondaryColor}40`,
                    }}
                  >
                    Se generará acceso al portal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nombre Completo del Tutor *
                    </label>
                    <input
                      type="text"
                      value={tutorNombre}
                      onChange={(e) => setTutorNombre(e.target.value)}
                      placeholder="Ej. Carlos Mendoza Orozco"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      * Al ser aprobada la solicitud, el sistema generará automáticamente su usuario institucional con base en su inicial y apellido.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>Correo Electrónico *</span>
                    </label>
                    <input
                      type="email"
                      value={tutorCorreo}
                      onChange={(e) => setTutorCorreo(e.target.value)}
                      placeholder="tutor@ejemplo.com"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Teléfono de Contacto (WhatsApp) *</span>
                    </label>
                    <input
                      type="tel"
                      value={tutorTelefono}
                      onChange={(e) => setTutorTelefono(e.target.value)}
                      placeholder="+52 55 1234-5678"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Desglose de cuotas estimadas (Only if enabled by college config) */}
              {config.mostrarCuotasEstimadas !== false && (
                <div
                  className="p-4 rounded-2xl border space-y-2"
                  style={{
                    backgroundColor: `${secondaryColor}10`,
                    borderColor: `${secondaryColor}60`,
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: primaryColor }}>
                      <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>Cuota Estimada de Inscripción ({nivel.toUpperCase()}):</span>
                    </span>
                    <span className="font-mono font-extrabold text-sm" style={{ color: primaryColor }}>
                      ${totalFees.toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-1">
                    {currentFees.map((fee, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {fee.concepto}</span>
                        <span className="font-mono font-semibold">${fee.monto.toLocaleString()} MXN</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    * El monto oficial se habilitará en su portal tras ser aceptada la preinscripción.
                  </p>
                </div>
              )}

              {/* Submit Buttons Branded with College Colors */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
                  style={{
                    backgroundColor: primaryColor,
                    color: headerTextColor,
                    borderBottom: `3px solid ${secondaryColor}`,
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Preinscripción'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
