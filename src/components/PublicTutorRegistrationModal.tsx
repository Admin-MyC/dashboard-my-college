import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  QrCode,
  User,
  Users2,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  GraduationCap,
  Sparkles,
  Building2,
  ArrowRight,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Student, TutorSecondParent, User as UserType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCollegeId?: string | null;
  onRegisteredSuccess?: (user: UserType) => void;
}

export const PublicTutorRegistrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultCollegeId,
  onRegisteredSuccess,
}) => {
  const {
    colleges,
    students,
    addUser,
    updateStudent,
    sendEmailNotification,
    activeCollege,
  } = useApp();

  // Selected College
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(
    defaultCollegeId || activeCollege?.id || colleges[0]?.id || 'col-cervantes'
  );

  React.useEffect(() => {
    if (isOpen) {
      const targetId =
        defaultCollegeId || activeCollege?.id || colleges[0]?.id || 'col-cervantes';
      if (targetId) {
        setSelectedCollegeId(targetId);
      }
    }
  }, [isOpen, defaultCollegeId, activeCollege?.id]);

  const college =
    colleges.find((c) => c.id === selectedCollegeId) || activeCollege || colleges[0];
  const primaryColor = college?.colores?.primario || '#0B2545';
  const secondaryColor = college?.colores?.secundario || '#C59B27';
  const escudoUrl = college?.escudoUrl || '';

  // Tutor 1 (Principal) Fields
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [parentesco, setParentesco] = useState('Madre');

  // Second Tutor (Opcional - Máximo 2)
  const [hasSecondTutor, setHasSecondTutor] = useState(false);
  const [secNombre, setSecNombre] = useState('');
  const [secParentesco, setSecParentesco] = useState('Padre');
  const [secTelefono, setSecTelefono] = useState('');
  const [secCorreo, setSecCorreo] = useState('');

  // CURP Search State
  const [curpInput, setCurpInput] = useState('');
  const [searchedStudents, setSearchedStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Registration result
  const [createdUser, setCreatedUser] = useState<UserType | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate suggested username based on rule:
  // "la primer letra de su primer nombre, seguido de su apellido, seguido de 4 dígitos aleatorios"
  const random4Digits = useMemo(() => Math.floor(1000 + Math.random() * 9000), []);
  const generatedUsername = useMemo(() => {
    const initial = primerNombre.trim().charAt(0).toLowerCase();
    const surname = primerApellido.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!initial || !surname) return `tutor${random4Digits}`;
    return `${initial}${surname}${random4Digits}`;
  }, [primerNombre, primerApellido, random4Digits]);

  // Generate 8-character password:
  // "la contraseña se generara de manera automática con un máximo de 8 caracteres"
  const suggestedPassword = useMemo(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }, []);

  if (!isOpen) return null;

  // Search CURP in students database
  const handleSearchCurp = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFeedback(null);

    if (!curpInput.trim()) {
      setSearchFeedback('Ingresa la CURP de tu hijo/a para buscarlo en el registro escolar.');
      return;
    }

    const curps = curpInput
      .split(/[\s,;\n\t]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length >= 6);

    const matches: Student[] = [];
    curps.forEach((curp) => {
      const found = students.filter(
        (s) =>
          s.colegioId === selectedCollegeId &&
          s.curp &&
          s.curp.toUpperCase().includes(curp)
      );
      found.forEach((st) => {
        if (!matches.some((m) => m.id === st.id)) {
          matches.push(st);
        }
      });
    });

    setSearchedStudents(matches);
    if (matches.length > 0) {
      setSelectedStudentIds(matches.map((s) => s.id));
      setSearchFeedback(`¡Se encontraron ${matches.length} alumno(s) coincidente(s)! Marca la casilla de los alumnos que deseas vincular.`);
    } else {
      setSearchFeedback(`No se encontraron alumnos con la CURP "${curpInput}". Verifica que esté correcta o consulta con la dirección del plantel.`);
    }
  };

  // Submit and Create Tutor
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primerNombre.trim() || !primerApellido.trim() || !correo.trim() || !telefono.trim()) {
      alert('Por favor completa todos los datos obligatorios del Tutor Principal.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      const confirmContinue = confirm(
        'No has seleccionado ningún alumno por CURP. ¿Deseas completar tu registro de tutor de todas formas?'
      );
      if (!confirmContinue) return;
    }

    setIsSubmitting(true);

    try {
      const tutorFullName = `${primerNombre.trim()} ${segundoNombre.trim()} ${primerApellido.trim()} ${segundoApellido.trim()}`.replace(/\s+/g, ' ');

      const segundoTutorData: TutorSecondParent | undefined = hasSecondTutor && secNombre.trim()
        ? {
            nombre: secNombre.trim(),
            parentesco: secParentesco,
            telefono: secTelefono.trim(),
            correo: secCorreo.trim(),
          }
        : undefined;

      const matchedStudents = students.filter((s) => selectedStudentIds.includes(s.id));
      const curpsAsociadas = matchedStudents.map((s) => s.curp?.toUpperCase()).filter(Boolean);

      const newTutorUser: UserType = {
        id: 'usr-tutor-qr-' + Date.now(),
        nombre: tutorFullName,
        correo: correo.trim(),
        usuarioLogin: generatedUsername,
        password: suggestedPassword,
        rol: 'tutor',
        colegioId: selectedCollegeId,
        cargo: `Tutor Legal (${parentesco})`,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        telefono: telefono.trim(),
        activo: true,
        creadoEn: new Date().toISOString().split('T')[0],
        metodoAcceso: 'qr',
        curpBusquedaBloqueada: true, // Permanent lock after QR registration
        hijosIds: selectedStudentIds,
        curpsAsociadas,
        segundoTutor: segundoTutorData,
        parentesco,
      };

      // 1. Add user to context and MongoDB
      addUser(newTutorUser);

      // 2. Update students with tutor information
      matchedStudents.forEach((st) => {
        updateStudent(st.id, {
          tutorId: newTutorUser.id,
          tutorNombre: tutorFullName,
          tutorCorreo: correo.trim(),
          tutorTelefono: telefono.trim(),
          segundoTutorNombre: segundoTutorData?.nombre || '',
          segundoTutorTelefono: segundoTutorData?.telefono || '',
        });
      });

      // 3. Send official notification with credentials and access link
      const officialDomain = 'https://dashboard.mycollege.com.mx';
      const emailBody =
        `Estimado(a) ${tutorFullName}:\n\n` +
        `Le damos la más cordial bienvenida a la plataforma oficial de ${college?.nombre || 'My College'}. Su alta de usuario como Tutor ha sido completada exitosamente.\n\n` +
        `=== CREDENCIALES OFICIALES DE ACCESO ===\n` +
        `• Enlace de Acceso: ${officialDomain}\n` +
        `• Usuario Asignado: ${generatedUsername}\n` +
        `• Contraseña Temporal (8 caracteres): ${suggestedPassword}\n` +
        `• Alumnos Vinculados: ${matchedStudents.map((s) => `${s.nombre} ${s.apellidos} (${s.grado} ${s.grupo})`).join(', ') || 'Pendiente de vincular'}\n\n` +
        `=== MÓDULOS DISPONIBLES EN SU PORTAL ===\n` +
        `• Cuotas Escolares (Pagos y colegiaturas)\n` +
        `• Comunicados y Avisos (Circulares y citatorios)\n` +
        `• Historial Académico (Boletas oficiales)\n` +
        `• Alumnos (Expedientes de sus hijos)\n` +
        `• Mi Perfil (Datos y cambio de contraseña)\n\n` +
        `Recordatorio importante de seguridad: Una vez que ingrese a ${officialDomain}, vaya al apartado de "Mi Perfil" y cambie su contraseña por una personalizada.`;

      sendEmailNotification({
        colegioId: selectedCollegeId,
        colegioNombre: college?.nombre || 'My College',
        destinatarios: [correo.trim()],
        rolesDestino: ['tutor'],
        usuariosDestino: [newTutorUser.id, correo.trim(), generatedUsername],
        asunto: `[My College] Credenciales de Acceso Oficial para Tutores (${tutorFullName})`,
        cuerpo: emailBody,
        categoria: 'seguridad',
        prioridad: 'alta',
      });

      setCreatedUser(newTutorUser);
      setGeneratedPassword(suggestedPassword);
      if (onRegisteredSuccess) onRegisteredSuccess(newTutorUser);
    } catch (err) {
      console.error('Error al registrar tutor vía QR:', err);
      alert('Ocurrió un error al procesar el registro. Por favor verifica tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    const officialDomain = 'https://dashboard.mycollege.com.mx';
    const text = `Plataforma: ${officialDomain}/formulario-registro-tutor?form=registro_tutor&colegio=${encodeURIComponent(selectedCollegeId)}\nUsuario: ${createdUser.usuarioLogin}\nContraseña: ${generatedPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col">
        {/* Modal Header with School Shield & Colors */}
        <div
          className="p-4 sm:p-5 border-b border-white/20 text-white flex items-center justify-between shrink-0 transition-colors relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            borderBottom: `3px solid ${secondaryColor}`,
          }}
        >
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            {escudoUrl && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/50 shadow-lg shrink-0 flex items-center justify-center">
                <img
                  src={escudoUrl}
                  alt={`Escudo de ${college?.nombre}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-black text-base sm:text-lg leading-tight truncate">
                  {college?.nombre || 'Alta y Vinculación de Tutores'}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs shrink-0"
                  style={{
                    backgroundColor: secondaryColor,
                    color: primaryColor,
                  }}
                >
                  Alta de Tutores
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium mt-0.5 truncate">
                Registro Oficial de Padres y Tutores · CCT {college?.codigoCCT}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 relative z-10"
            title="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {createdUser ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div className="space-y-6 text-center py-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display font-black text-xl text-slate-900">
                  ¡Registro de Tutor Exitoso!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tus datos han sido registrados en el sistema del colegio y se ha enviado la liga de acceso junto con tus credenciales a <strong>{createdUser.correo}</strong>.
                </p>
              </div>

              {/* Generated Credentials Card */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 text-left max-w-md mx-auto space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2.5 border-b border-amber-200 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {escudoUrl && (
                      <img
                        src={escudoUrl}
                        alt={college?.nombre}
                        className="w-9 h-9 object-contain rounded-lg bg-white p-1 border border-amber-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-amber-900 block">
                        Tus Credenciales Oficiales
                      </span>
                      <span className="text-[11px] font-sans font-bold text-slate-900 truncate block">
                        {college?.nombre}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-200/60 text-amber-950 font-bold px-2 py-0.5 rounded shrink-0">
                    Rol: Tutor
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Usuario de Acceso Asignado:</span>
                    <span className="font-black text-base text-slate-900">{createdUser.usuarioLogin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contraseña Generada (Máx 8 caracteres):</span>
                    <span className="font-black text-base text-emerald-800">{generatedPassword}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Colegio Asignado:</span>
                    <span className="font-bold text-slate-800">{college?.nombre}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCredentials ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Credenciales Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copiar Credenciales</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Sesión en el Portal de Tutores</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              {/* Institutional Header with Shield */}
              <div
                className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs"
                style={{
                  borderColor: `${primaryColor}30`,
                  backgroundColor: `${primaryColor}06`,
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {escudoUrl && (
                    <div className="w-14 h-14 rounded-xl bg-white p-1.5 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                      <img
                        src={escudoUrl}
                        alt={`Escudo de ${college?.nombre}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Escudo y Plantel Escolar Oficial
                    </span>
                    <span
                      className="font-black text-xs sm:text-sm truncate block"
                      style={{ color: primaryColor }}
                    >
                      {college?.nombre}
                    </span>
                    {college?.lema && (
                      <span className="text-[11px] text-slate-600 italic truncate block">
                        &ldquo;{college.lema}&rdquo;
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      CCT: {college?.codigoCCT} · Nivel: {college?.nivel}
                    </span>
                  </div>
                </div>

                {colleges.length > 1 && (
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => {
                      setSelectedCollegeId(e.target.value);
                      setSearchedStudents([]);
                      setSelectedStudentIds([]);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 cursor-pointer"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* SECCIÓN 1: DATOS DEL TUTOR PRINCIPAL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    1. Datos del Tutor Principal (Obligatorio)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Primer Nombre: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={primerNombre}
                      onChange={(e) => setPrimerNombre(e.target.value)}
                      placeholder="Ej. Laura"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Segundo Nombre:
                    </label>
                    <input
                      type="text"
                      value={segundoNombre}
                      onChange={(e) => setSegundoNombre(e.target.value)}
                      placeholder="Ej. Patricia (Opcional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Primer Apellido: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={primerApellido}
                      onChange={(e) => setPrimerApellido(e.target.value)}
                      placeholder="Ej. Morales"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Segundo Apellido:
                    </label>
                    <input
                      type="text"
                      value={segundoApellido}
                      onChange={(e) => setSegundoApellido(e.target.value)}
                      placeholder="Ej. Ríos (Opcional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Correo Electrónico Oficial: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="tutor@ejemplo.com"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    />
                    <span className="text-[10px] text-slate-400">
                      * Aquí recibirá sus credenciales de acceso oficial.
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Teléfono / WhatsApp: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+52 (55) 0000-0000"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Parentesco con el Alumno: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={parentesco}
                      onChange={(e) => setParentesco(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                    >
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Tutor Legal">Tutor Legal / Representante</option>
                      <option value="Abuela / Abuelo">Abuela / Abuelo</option>
                      <option value="Familiar Autorizado">Familiar Autorizado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRO DE SEGUNDO TUTOR (MÁXIMO 2 TUTORES) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-sm text-emerald-950">
                      2. Registro de Segundo Tutor (Opcional)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Máximo 2 Tutores
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkSecondTutor"
                    checked={hasSecondTutor}
                    onChange={(e) => setHasSecondTutor(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="chkSecondTutor" className="font-bold text-slate-800 text-xs cursor-pointer">
                    Deseo dar de alta a un segundo tutor autorizado (ej. Madre/Padre adicional)
                  </label>
                </div>

                {hasSecondTutor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/70 animate-in fade-in">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nombre Completo:</label>
                      <input
                        type="text"
                        value={secNombre}
                        onChange={(e) => setSecNombre(e.target.value)}
                        placeholder="Ej. Ing. Carlos Morales"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Parentesco:</label>
                      <select
                        value={secParentesco}
                        onChange={(e) => setSecParentesco(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="Padre">Padre</option>
                        <option value="Madre">Madre</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                        <option value="Abuelo/a">Abuelo/a</option>
                        <option value="Familiar">Familiar Autorizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Teléfono:</label>
                      <input
                        type="tel"
                        value={secTelefono}
                        onChange={(e) => setSecTelefono(e.target.value)}
                        placeholder="+52 (55)..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Correo Electrónico:</label>
                      <input
                        type="email"
                        value={secCorreo}
                        onChange={(e) => setSecCorreo(e.target.value)}
                        placeholder="segundo.tutor@ejemplo.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: BÚSQUEDA DE SUS HIJOS MEDIANTE LA CURP */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    3. Búsqueda y Vinculación de sus Hijos Mediante la CURP
                  </h3>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed">
                  Ingresa la o las CURP de tus hijos (separadas por comas o espacios). El sistema buscará sus registros en este colegio para agregarlos a tu cuenta:
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={curpInput}
                      onChange={(e) => setCurpInput(e.target.value)}
                      placeholder="Ej. HERA080415HDFRRL01, MOMA091122HDFRRL02..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSearchCurp}
                      className="px-4 py-2.5 bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-300" />
                      <span>Buscar CURP</span>
                    </button>
                  </div>

                  {searchFeedback && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-semibold ${
                        searchedStudents.length > 0
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}
                    >
                      {searchFeedback}
                    </div>
                  )}

                  {/* Matching Students Cards */}
                  {searchedStudents.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        Alumnos encontrados (Marca la casilla para vincular):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchedStudents.map((st) => {
                          const isChecked = selectedStudentIds.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, st.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <img
                                src={st.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                                alt={st.nombre}
                                className="w-10 h-10 rounded-xl object-cover border"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 truncate">
                                  {st.nombre} {st.apellidos}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  CURP: {st.curp}
                                </div>
                                <div className="text-[10px] font-bold text-blue-800">
                                  {st.grado} · Grupo "{st.grupo}"
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 4: ASIGNACIÓN AUTOMÁTICA DE CREDENCIALES (PREVIEW) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Asignación Automática de Credenciales</span>
                </span>
                <p className="text-[11px] text-amber-950 leading-relaxed">
                  El sistema generará tus credenciales conforme a las políticas del colegio:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] text-slate-400 block font-sans font-bold">Usuario asignado:</span>
                    <strong className="text-slate-900">{generatedUsername}</strong>
                    <span className="text-[9px] text-slate-400 block font-sans">
                      (1ª letra nombre + apellido + 4 dígitos)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                    <span className="text-[10px] text-slate-400 block font-sans font-bold">Contraseña automática:</span>
                    <strong className="text-emerald-700">••••••••</strong>
                    <span className="text-[9px] text-slate-400 block font-sans">
                      (Máx. 8 caracteres alfanuméricos)
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  * Al hacer clic en guardar, se te enviará la <strong>liga de acceso</strong> al sistema junto con tus <strong>credenciales de acceso</strong> por correo electrónico.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Procesando y Guardando Registro...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>Guardar y Enviar Credenciales de Acceso</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
