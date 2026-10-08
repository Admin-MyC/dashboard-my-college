import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ROLES_CONFIG, UserRole, Student, TutorSecondParent, TutorFiscalData } from '../types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Calendar,
  Save,
  Check,
  Search,
  Plus,
  QrCode,
  Link as LinkIcon,
  ShieldAlert,
  UserPlus,
  Users2,
  Trash2,
  Sparkles,
  FileText,
  Receipt,
  Camera,
  Upload,
} from 'lucide-react';

export const UserProfileModule: React.FC = () => {
  const {
    currentUser,
    updateUser,
    activeCollege,
    students,
    updateStudent,
    updateUserPassword,
    sendEmailNotification,
    colleges,
  } = useApp();

  const isTutor = currentUser.rol === 'tutor';
  const isAlumno = currentUser.rol === 'alumno';

  // Avatar Photo Upload State (Available for ALL roles EXCEPT 'alumno' - file upload only)
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarSavedMessage, setAvatarSavedMessage] = useState<string | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAlumno) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        updateUser(currentUser.id, { avatar: reader.result });
        setAvatarSavedMessage('¡Tu fotografía de perfil ha sido actualizada con éxito!');
        setShowAvatarModal(false);
        setTimeout(() => setAvatarSavedMessage(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fiscal Data form state for Tutor (RFC, Razón Social, Régimen Fiscal, Uso CFDI, CP, Correo Facturación)
  const [fiscalRfc, setFiscalRfc] = useState(currentUser.datosFiscales?.rfc || '');
  const [fiscalRazonSocial, setFiscalRazonSocial] = useState(currentUser.datosFiscales?.razonSocial || '');
  const [fiscalRegimen, setFiscalRegimen] = useState(
    currentUser.datosFiscales?.regimenFiscal || '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios'
  );
  const [fiscalUsoCfdi, setFiscalUsoCfdi] = useState(
    currentUser.datosFiscales?.usoCFDI || 'D10 - Pagos por servicios educativos (colegiaturas)'
  );
  const [fiscalCp, setFiscalCp] = useState(currentUser.datosFiscales?.codigoPostalFiscal || '');
  const [fiscalCorreo, setFiscalCorreo] = useState(
    currentUser.datosFiscales?.correoFacturacion || currentUser.correo || ''
  );
  const [fiscalDomicilio, setFiscalDomicilio] = useState(currentUser.datosFiscales?.domicilioFiscal || '');
  const [fiscalSaved, setFiscalSaved] = useState(false);
  const [fiscalError, setFiscalError] = useState<string | null>(null);
  const [isEditingFiscal, setIsEditingFiscal] = useState(!currentUser.datosFiscales?.rfc);

  // Password change form state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // CURP Multi-Search State for Tutor
  const [curpInput, setCurpInput] = useState('');
  const [searchedStudents, setSearchedStudents] = useState<Student[]>([]);
  const [selectedStudentIdsToLink, setSelectedStudentIdsToLink] = useState<string[]>([]);
  const [curpSearchMessage, setCurpSearchMessage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Second Tutor form state
  const [secondTutorName, setSecondTutorName] = useState(currentUser.segundoTutor?.nombre || '');
  const [secondTutorPhone, setSecondTutorPhone] = useState(currentUser.segundoTutor?.telefono || '');
  const [secondTutorEmail, setSecondTutorEmail] = useState(currentUser.segundoTutor?.correo || '');
  const [secondTutorRelation, setSecondTutorRelation] = useState(currentUser.segundoTutor?.parentesco || 'Madre');
  const [secondTutorSaved, setSecondTutorSaved] = useState(false);
  const [isEditingSecondTutor, setIsEditingSecondTutor] = useState(!currentUser.segundoTutor?.nombre);

  // Find students linked to this tutor
  const linkedStudents = students.filter((s) => {
    if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
    if (currentUser.curpsAsociadas && s.curp && currentUser.curpsAsociadas.includes(s.curp.toUpperCase())) return true;
    if (currentUser.correo && s.tutorCorreo && s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()) return true;
    return false;
  });

  const roleInfo = ROLES_CONFIG[currentUser.rol as UserRole] || {
    label: currentUser.rol,
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900 border-blue-300',
  };

  // MULTI-CURP SEARCH HANDLER
  const handleSearchCurps = (e: React.FormEvent) => {
    e.preventDefault();
    setCurpSearchMessage(null);
    setSelectedStudentIdsToLink([]);

    if (!curpInput.trim()) {
      setCurpSearchMessage('Ingresa al menos una CURP para buscar.');
      return;
    }

    // Split by commas, semicolons, spaces, newlines
    const rawCurps = curpInput
      .split(/[\s,;\n\t]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length >= 6);

    if (rawCurps.length === 0) {
      setCurpSearchMessage('Por favor ingresa una clave CURP válida (ej. HERA080415HDFRRL01).');
      return;
    }

    // Search in students database
    const found: Student[] = [];
    rawCurps.forEach((curp) => {
      const match = students.filter((s) => s.curp && s.curp.toUpperCase().includes(curp));
      match.forEach((st) => {
        if (!found.some((f) => f.id === st.id)) {
          found.push(st);
        }
      });
    });

    setSearchedStudents(found);
    if (found.length === 0) {
      setCurpSearchMessage(`No se encontraron alumnos con las CURPs ingresadas: [${rawCurps.join(', ')}]. Verifica que la CURP esté registrada en el colegio.`);
    } else {
      // Auto select found students
      setSelectedStudentIdsToLink(found.map((s) => s.id));
      setCurpSearchMessage(`¡Se encontraron ${found.length} alumno(s) coincidente(s)! Revisa los datos y haz clic en "Aceptar y Vincular".`);
    }
  };

  // CONFIRM AND LINK STUDENTS
  const handleConfirmLinkStudents = async () => {
    if (selectedStudentIdsToLink.length === 0) return;
    setIsLinking(true);

    try {
      const existingIds = currentUser.hijosIds || [];
      const newIds = Array.from(new Set([...existingIds, ...selectedStudentIdsToLink]));

      const newlyLinkedStudents = students.filter((s) => selectedStudentIdsToLink.includes(s.id));
      const newCurps = Array.from(
        new Set([
          ...(currentUser.curpsAsociadas || []),
          ...newlyLinkedStudents.map((s) => s.curp?.toUpperCase()).filter(Boolean),
        ])
      );

      // Check if accessed via QR: if QR, lock search permanently!
      const isQrAccess = currentUser.metodoAcceso === 'qr';
      const curpBusquedaBloqueada = isQrAccess ? true : !!currentUser.curpBusquedaBloqueada;

      // Update student records with this tutor's ID & info
      newlyLinkedStudents.forEach((st) => {
        updateStudent(st.id, {
          tutorId: currentUser.id,
          tutorNombre: currentUser.nombre,
          tutorCorreo: currentUser.correo,
          tutorTelefono: currentUser.telefono,
        });
      });

      // Update tutor user profile
      updateUser(currentUser.id, {
        hijosIds: newIds,
        curpsAsociadas: newCurps,
        curpBusquedaBloqueada,
      });

      setLinkSuccess(true);
      setSearchedStudents([]);
      setCurpInput('');
      setTimeout(() => setLinkSuccess(false), 4000);
    } catch (err) {
      console.error('Error al vincular alumnos por CURP:', err);
    } finally {
      setIsLinking(false);
    }
  };

  // SAVE SECOND TUTOR
  const handleSaveSecondTutor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondTutorName.trim()) return;

    const segundoTutorData: TutorSecondParent = {
      nombre: secondTutorName.trim(),
      telefono: secondTutorPhone.trim(),
      correo: secondTutorEmail.trim(),
      parentesco: secondTutorRelation,
    };

    updateUser(currentUser.id, {
      segundoTutor: segundoTutorData,
    });

    setSecondTutorSaved(true);
    setIsEditingSecondTutor(false);
    setTimeout(() => setSecondTutorSaved(false), 3000);
  };

  // SAVE FISCAL DATA FOR TUTOR
  const handleSaveFiscalData = (e: React.FormEvent) => {
    e.preventDefault();
    setFiscalError(null);

    const cleanRfc = fiscalRfc.trim().toUpperCase();
    if (cleanRfc.length < 12 || cleanRfc.length > 13) {
      setFiscalError('Por favor ingresa un RFC válido de 12 o 13 caracteres.');
      return;
    }
    if (!fiscalRazonSocial.trim()) {
      setFiscalError('Por favor ingresa el Nombre o Razón Social para facturación.');
      return;
    }
    if (!fiscalCp.trim() || fiscalCp.trim().length < 5) {
      setFiscalError('Por favor ingresa un Código Postal Fiscal válido de 5 dígitos.');
      return;
    }

    const datosFiscales: TutorFiscalData = {
      rfc: cleanRfc,
      razonSocial: fiscalRazonSocial.trim().toUpperCase(),
      regimenFiscal: fiscalRegimen,
      usoCFDI: fiscalUsoCfdi,
      codigoPostalFiscal: fiscalCp.trim(),
      correoFacturacion: fiscalCorreo.trim() || currentUser.correo,
      domicilioFiscal: fiscalDomicilio.trim() || undefined,
    };

    updateUser(currentUser.id, {
      datosFiscales,
    });

    setFiscalSaved(true);
    setIsEditingFiscal(false);
    setTimeout(() => setFiscalSaved(false), 3500);
  };

  // PASSWORD CHANGE
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlumno) return;
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'Las contraseñas no coinciden. Por favor verifícalas.',
      });
      return;
    }

    setIsUpdating(true);

    try {
      updateUserPassword(currentUser.id, newPassword);

      setStatusMessage({
        type: 'success',
        text: '¡Tu contraseña ha sido actualizada con éxito! Utilízala en tu próximo inicio de sesión.',
      });

      sendEmailNotification({
        colegioId: currentUser.colegioId,
        colegioNombre: activeCollege?.nombre || 'Plataforma My College',
        destinatarios: [currentUser.correo],
        rolesDestino: [currentUser.rol],
        usuariosDestino: [
          currentUser.id,
          currentUser.correo,
          ...(currentUser.usuarioLogin ? [currentUser.usuarioLogin] : []),
        ],
        asunto: '[Seguridad] Cambio de Contraseña Confirmado',
        cuerpo: `Hola ${currentUser.nombre},\n\nLe confirmamos que su contraseña de acceso a la plataforma My College ha sido actualizada correctamente el día de hoy.\n\nSi usted no realizó este cambio, comuníquese de inmediato con el Administrador de su colegio.`,
        categoria: 'seguridad',
        prioridad: 'alta',
      });

      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Ocurrió un error al actualizar la contraseña.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const userCollege =
    activeCollege ||
    colleges.find((c) => c.id === currentUser.colegioId) ||
    (linkedStudents[0] ? colleges.find((c) => c.id === linkedStudents[0].colegioId) : null);
  const primaryColor = userCollege?.colores?.primario || '#0B2545';
  const goldColor = userCollege?.colores?.secundario || '#C59B27';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in">
      {/* Header Profile Banner */}
      <div
        className="rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-5 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="relative group shrink-0">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser.nombre}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white"
          />
          {!isAlumno && (
            <>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer border border-white/40"
                style={{ backgroundColor: goldColor, color: primaryColor }}
                title="Agregar o cambiar imagen de perfil"
              >
                <Camera className="w-3 h-3" />
                <span>Cambiar Foto</span>
              </button>
            </>
          )}
        </div>

        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white">
              {currentUser.nombre}
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              {roleInfo.label}
            </span>

            {isTutor && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/25">
                {currentUser.metodoAcceso === 'qr' ? (
                  <>
                    <QrCode className="w-3 h-3" style={{ color: goldColor }} />
                    <span>Acceso mediante Código QR</span>
                  </>
                ) : currentUser.metodoAcceso === 'preinscripcion' ? (
                  <>
                    <LinkIcon className="w-3 h-3" style={{ color: goldColor }} />
                    <span>Acceso por Link de Preinscripción</span>
                  </>
                ) : (
                  <span>Acceso Institucional Directo</span>
                )}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-200 font-semibold">{currentUser.cargo || 'Usuario del Sistema'}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-100 font-mono">
            {currentUser.usuarioLogin && (
              <span
                className="px-2.5 py-1 rounded-lg font-bold shadow-2xs"
                style={{ backgroundColor: goldColor, color: primaryColor }}
              >
                Usuario Login: {currentUser.usuarioLogin}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" style={{ color: goldColor }} />
              <span>{currentUser.correo}</span>
            </span>
            {currentUser.telefono && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" style={{ color: goldColor }} />
                <span>{currentUser.telefono}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Saved Feedback Banner */}
      {avatarSavedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-900 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{avatarSavedMessage}</span>
        </div>
      )}

      {/* Modal to Upload Profile Image from File (Only for non-alumno roles) */}
      {!isAlumno && showAvatarModal && (
        <div
          onClick={() => setShowAvatarModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Camera className="w-4 h-4" style={{ color: goldColor }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Imagen de Perfil del Usuario
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perfil: {roleInfo.label} · {currentUser.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.nombre}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-white shrink-0"
              />
              <div className="space-y-2 flex-1">
                <p className="text-xs font-bold text-slate-800">
                  Subir fotografía desde archivo
                </p>
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Upload className="w-3.5 h-3.5" style={{ color: goldColor }} />
                  <span>Seleccionar Archivo (JPG / PNG)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EXCLUSIVE TUTOR SECTION: ALUMNOS VINCULADOS & BÚSQUEDA POR CURP --- */}
      {isTutor && (
        <div className="space-y-6">
          {/* Card: Alumnos a mi Cargo */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Hijos / Alumnos Vinculados a mi Cuenta
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Aparecen automáticamente en el módulo <strong>Alumnos</strong>
              </span>
            </div>

            {/* List of currently linked students */}
            {linkedStudents.length === 0 ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Aún no tienes alumnos vinculados</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Utiliza la herramienta inferior de búsqueda por CURP para agregar a tus hijos a esta cuenta.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {linkedStudents.map((st) => {
                  const col = colleges.find((c) => c.id === st.colegioId);
                  return (
                    <div
                      key={st.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs"
                    >
                      <img
                        src={st.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                        alt={st.nombre}
                        className="w-12 h-12 rounded-xl object-cover border"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-bold text-slate-900 leading-tight">
                          {st.nombre} {st.apellidos}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Matrícula: {st.matricula}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          CURP: <strong>{st.curp}</strong>
                        </div>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.2 rounded">
                            {st.grado} Grupo "{st.grupo}"
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {col?.nombre || 'Colegio'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CURP Search Section */}
            {currentUser.curpBusquedaBloqueada ? (
              /* Blocked after QR linking */
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
                <QrCode className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm">
                    Vinculación por Código QR Completada
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Accediste a la plataforma mediante código QR y tus alumnos ya quedaron vinculados a tu cuenta. Por políticas de seguridad institucional, <strong>la búsqueda por CURP ya no está disponible</strong> para evitar duplicidad de registros.
                  </p>
                </div>
              </div>
            ) : currentUser.metodoAcceso === 'preinscripcion' && linkedStudents.length > 0 ? (
              /* Preenrollment notice */
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    Alumnos Asociados Automáticamente por Preinscripción
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Al haberte registrado mediante el enlace de preinscripción enviado a tu correo, tus hijos se asociaron automáticamente a tu cuenta.
                  </p>
                </div>
              </div>
            ) : (
              /* Active CURP Multi-Search Tool */
              <div className="p-5 bg-gradient-to-r from-amber-50/60 to-slate-50 rounded-2xl border border-amber-200 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-600" />
                    <span>Agregar Hijos Mediante Búsqueda de CURP (Búsqueda Múltiple Permitida)</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Puedes ingresar una o varias CURP a la vez (separadas por coma, espacio o renglón). El sistema buscará a los alumnos y los vinculará a tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleSearchCurps} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ingresa las CURP de tus hijos (Permite varias a la vez):
                    </label>
                    <textarea
                      rows={2}
                      value={curpInput}
                      onChange={(e) => setCurpInput(e.target.value)}
                      placeholder="Ej. HERA080415HDFRRL01, MOMA091122HDFRRL02..."
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">
                      * Separa varias CURP con comas o saltos de línea.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-300" />
                    <span>Buscar Alumnos por CURP</span>
                  </button>
                </form>

                {/* Search result feedback */}
                {curpSearchMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      searchedStudents.length > 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    {curpSearchMessage}
                  </div>
                )}

                {/* Matching Students Preview & Confirmation */}
                {searchedStudents.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-amber-200">
                    <span className="text-xs font-bold text-slate-800 block">
                      Alumnos encontrados con las CURP buscadas:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchedStudents.map((st) => (
                        <div
                          key={st.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3 text-xs"
                        >
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
                            <div className="text-[10px] font-bold text-blue-700">
                              {st.grado} · Grupo "{st.grupo}"
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-600">
                        {currentUser.metodoAcceso === 'qr' && (
                          <strong className="text-purple-800">
                            * Al hacer clic en Aceptar, los alumnos se vincularán y ya no podrás volver a buscar por CURP al ser acceso QR.
                          </strong>
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={handleConfirmLinkStudents}
                        disabled={isLinking}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isLinking ? 'Vinculando...' : 'Aceptar y Vincular Alumnos'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {linkSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>¡Alumnos agregados con éxito a tu apartado "Alumnos"!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Registro de Segundo Tutor (Máximo 2 Tutores) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Tutores Autorizados de la Familia
                  </h3>
                  <span className="text-xs text-slate-500">
                    La plataforma permite registrar un <strong>máximo de 2 tutores</strong> por familia para recepción de avisos y trámites.
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                Máximo 2 Tutores
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Tutor 1: Current User */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Tutor 1 (Principal)</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                    Usuario Activo
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900">{currentUser.nombre}</div>
                <div className="text-slate-600">{currentUser.parentesco || 'Tutor Legal'}</div>
                <div className="pt-1 text-[11px] text-slate-500 space-y-0.5 font-mono">
                  <div>Correo: {currentUser.correo}</div>
                  <div>Teléfono: {currentUser.telefono || 'Sin registrar'}</div>
                </div>
              </div>

              {/* Tutor 2: Secondary Tutor */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Tutor 2 (Adicional)</span>
                  {currentUser.segundoTutor?.nombre && !isEditingSecondTutor && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSecondTutor(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {currentUser.segundoTutor?.nombre && !isEditingSecondTutor ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900">{currentUser.segundoTutor.nombre}</div>
                    <div className="text-slate-600">{currentUser.segundoTutor.parentesco || 'Madre'}</div>
                    <div className="pt-1 text-[11px] text-slate-500 space-y-0.5 font-mono">
                      <div>Teléfono: {currentUser.segundoTutor.telefono || 'Sin teléfono'}</div>
                      <div>Correo: {currentUser.segundoTutor.correo || 'Sin correo'}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSecondTutor} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nombre Completo:</label>
                      <input
                        type="text"
                        value={secondTutorName}
                        onChange={(e) => setSecondTutorName(e.target.value)}
                        placeholder="Ej. Sra. Patricia Ramírez Flores"
                        className="w-full px-3 py-1.5 bg-white border rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Parentesco:</label>
                        <select
                          value={secondTutorRelation}
                          onChange={(e) => setSecondTutorRelation(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border rounded-lg text-xs"
                        >
                          <option value="Madre">Madre</option>
                          <option value="Padre">Padre</option>
                          <option value="Tutor Legal">Tutor Legal</option>
                          <option value="Abuela / Abuelo">Abuela / Abuelo</option>
                          <option value="Familiar Autorizado">Familiar Autorizado</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Teléfono / Celular:</label>
                        <input
                          type="text"
                          value={secondTutorPhone}
                          onChange={(e) => setSecondTutorPhone(e.target.value)}
                          placeholder="+52 (55)..."
                          className="w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Correo Electrónico:</label>
                      <input
                        type="email"
                        value={secondTutorEmail}
                        onChange={(e) => setSecondTutorEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-1.5 bg-white border rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Guardar Segundo Tutor
                      </button>
                      {currentUser.segundoTutor?.nombre && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSecondTutor(false)}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {secondTutorSaved && (
                  <div className="p-2 bg-emerald-100 text-emerald-950 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>¡Segundo tutor registrado correctamente!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Datos Fiscales para Facturación de Colegiaturas y Cobros (RFC, Razón Social, Uso CFDI) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Datos Fiscales para Facturación (CFDI 4.0)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Registra tu <strong>RFC, Razón Social y Régimen Fiscal</strong> para poder habilitar la casilla <strong>"Solicitar Factura"</strong> en el Control de Colegiaturas.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentUser.datosFiscales?.rfc ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>RFC Registrado: {currentUser.datosFiscales.rfc}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sin Datos Fiscales</span>
                  </span>
                )}
              </div>
            </div>

            {currentUser.datosFiscales?.rfc && !isEditingFiscal ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                    Constancia de Datos Fiscales Activa
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingFiscal(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Editar Datos Fiscales
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">RFC:</span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {currentUser.datosFiscales.rfc}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Nombre o Razón Social:
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {currentUser.datosFiscales.razonSocial}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Código Postal Fiscal:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {currentUser.datosFiscales.codigoPostalFiscal}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Régimen Fiscal:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.datosFiscales.regimenFiscal}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Uso de CFDI:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.datosFiscales.usoCFDI}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Correo para Envío de XML/PDF:
                    </span>
                    <span className="font-mono text-slate-700">
                      {currentUser.datosFiscales.correoFacturacion}
                    </span>
                  </div>
                  {currentUser.datosFiscales.domicilioFiscal && (
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Domicilio Fiscal:
                      </span>
                      <span className="text-slate-700">
                        {currentUser.datosFiscales.domicilioFiscal}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveFiscalData} className="space-y-3.5 text-xs">
                {fiscalError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{fiscalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      RFC (Con Homoclave) *
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={fiscalRfc}
                      onChange={(e) => setFiscalRfc(e.target.value.toUpperCase())}
                      placeholder="Ej. HEAL800415ABC"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre Completo o Razón Social (Sin régimen societario) *
                    </label>
                    <input
                      type="text"
                      value={fiscalRazonSocial}
                      onChange={(e) => setFiscalRazonSocial(e.target.value.toUpperCase())}
                      placeholder="Ej. ROBERTO HERNANDEZ ALVAREZ"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Código Postal Fiscal (C.P.) *
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={fiscalCp}
                      onChange={(e) => setFiscalCp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 03100"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Régimen Fiscal SAT *
                    </label>
                    <select
                      value={fiscalRegimen}
                      onChange={(e) => setFiscalRegimen(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    >
                      <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">
                        605 - Sueldos y Salarios
                      </option>
                      <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">
                        612 - Actividades Empresariales y Profesionales
                      </option>
                      <option value="626 - Régimen Simplificado de Confianza (RESICO)">
                        626 - RESICO
                      </option>
                      <option value="601 - General de Ley Personas Morales">
                        601 - General de Ley Personas Morales
                      </option>
                      <option value="616 - Sin obligaciones fiscales">
                        616 - Sin obligaciones fiscales
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Uso de CFDI *
                    </label>
                    <select
                      value={fiscalUsoCfdi}
                      onChange={(e) => setFiscalUsoCfdi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    >
                      <option value="D10 - Pagos por servicios educativos (colegiaturas)">
                        D10 - Pagos por servicios educativos (colegiaturas)
                      </option>
                      <option value="G03 - Gastos en general">
                        G03 - Gastos en general
                      </option>
                      <option value="S01 - Sin efectos fiscales">
                        S01 - Sin efectos fiscales
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Correo Electrónico para Facturación *
                    </label>
                    <input
                      type="email"
                      value={fiscalCorreo}
                      onChange={(e) => setFiscalCorreo(e.target.value)}
                      placeholder="facturacion@correo.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Domicilio Fiscal (Opcional)
                    </label>
                    <input
                      type="text"
                      value={fiscalDomicilio}
                      onChange={(e) => setFiscalDomicilio(e.target.value)}
                      placeholder="Calle, Número, Colonia, Alcaldía / Municipio"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Datos Fiscales (RFC)</span>
                  </button>
                  {currentUser.datosFiscales?.rfc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingFiscal(false)}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}

            {fiscalSaved && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  ¡Tus datos fiscales (RFC: {currentUser.datosFiscales?.rfc}) se guardaron correctamente! Ya puedes solicitar factura en tus pagos de colegiaturas y conceptos.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STANDARD ACCOUNT INFO & PASSWORD CHANGE FOR ALL ROLES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Account Information */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Información de la Cuenta
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Fotografía de Perfil Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.nombre}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-300 bg-white shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Imagen del Usuario ({roleInfo.label})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isAlumno
                      ? 'La fotografía del alumno es administrada por Control Escolar.'
                      : 'Puedes subir o actualizar tu fotografía de perfil en cualquier momento.'}
                  </span>
                </div>
              </div>
              {!isAlumno && (
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-2xs transition-all cursor-pointer shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Camera className="w-3.5 h-3.5" style={{ color: goldColor }} />
                  <span>Agregar / Cambiar Imagen</span>
                </button>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Institución / Colegio:</span>
              <span className="font-bold text-slate-800 text-sm">
                {activeCollege ? activeCollege.nombre : 'Plataforma My College Oficial'}
              </span>
            </div>

            {currentUser.usuarioLogin && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="text-amber-900 font-bold block flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Usuario de Acceso Asignado:</span>
                </span>
                <span className="font-mono text-sm font-black text-amber-950">
                  {currentUser.usuarioLogin}
                </span>
                <p className="text-[10px] text-amber-800">
                  * Puedes ingresar con este usuario o con tu correo electrónico.
                </p>
              </div>
            )}

            <div>
              <span className="text-slate-400 block font-semibold">Rol Asignado:</span>
              <span className="font-semibold text-slate-700">{roleInfo.label}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Estado de la Cuenta:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                ● Cuenta Activa y Verificada
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Password / Credentials Section (Disabled for Alumno role) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {isAlumno ? 'Contraseña Institucional del Alumno' : 'Cambio de Contraseña'}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Seguridad</span>
          </div>

          {isAlumno ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Shield className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>Contraseña Permanente Generada por el Sistema</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Por disposición institucional, en el perfil <strong>Alumnos</strong> no está permitido actualizar ni modificar la contraseña. Tu cuenta conserva de manera fija la contraseña generada automáticamente por el sistema escolar.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Contraseña Asignada por el Sistema:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {showPassword ? currentUser.password || 'Asignada por Control Escolar' : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nueva Contraseña:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña..."
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  required
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Recuerda utilizar una combinación segura de letras mayúsculas, minúsculas y números.
              </p>

              <button
                type="submit"
                disabled={isUpdating || !newPassword}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Guardando...' : 'Actualizar Mi Contraseña'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
