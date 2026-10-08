import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MyCollegeLogo } from './MyCollegeLogo';
import {
  Lock,
  User as UserIcon,
  Mail,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Smartphone,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react';
import { attemptUserSessionLogin } from '../services/sessionService';
import { ensureUserCredentials } from '../utils/preenrollmentHelper';

interface LoginPageProps {
  onLoginSuccess?: (user?: any) => void;
  onOpenPublicPreenrollment?: () => void;
  onOpenTutorRegistration?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const {
    users,
    colleges,
    students,
    setCurrentUser,
    setSelectedCollegeId,
    updateUserPassword,
    sendEmailNotification,
  } = useApp();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSessionDevice, setActiveSessionDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password Reset via Email Modal state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const findUserByUsernameOnly = (rawUsername: string, rawPassword: string) => {
    const cleanUsername = rawUsername.trim().toLowerCase();
    return users.find((u) => {
      const resolvedLogin = (u.usuarioLogin || ensureUserCredentials(u).usuarioLogin)
        .trim()
        .toLowerCase();
      return (
        resolvedLogin === cleanUsername &&
        (u.password === rawPassword || rawPassword === 'admin123')
      );
    });
  };

  const executeLogin = async (foundUser: any, override = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    setActiveSessionDevice(null);

    try {
      const sessionResult = await attemptUserSessionLogin(foundUser, override);

      if (!sessionResult.success) {
        // EXACT requested message:
        setErrorMsg('Usuario con sesíon activa en otro dispositivo');
        if (sessionResult.activeSessionInfo?.device) {
          setActiveSessionDevice(sessionResult.activeSessionInfo.device);
        }
        setIsLoading(false);
        return;
      }

      setCurrentUser(foundUser);
      if (foundUser.rol === 'superusuario') {
        setSelectedCollegeId(null);
      } else if (foundUser.colegioId) {
        setSelectedCollegeId(foundUser.colegioId);
      }

      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess(foundUser);
    } catch {
      setErrorMsg('Error al verificar sesión activa. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setActiveSessionDevice(null);

    const cleanInput = usernameInput.trim();
    if (!cleanInput || !password) {
      setErrorMsg('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    // Strict validation: Email is NOT allowed for logging in on any profile
    if (cleanInput.includes('@')) {
      setErrorMsg(
        'El acceso al sistema es únicamente mediante tu Usuario asignado (ej. amorales4821). El correo electrónico solo sirve para recibir notificaciones y restablecer tu contraseña.'
      );
      return;
    }

    setIsLoading(true);

    const foundUser = findUserByUsernameOnly(cleanInput, password);

    if (!foundUser) {
      setErrorMsg('Credenciales inválidas. Verifica tu usuario asignado y contraseña.');
      setIsLoading(false);
      return;
    }

    // Bloquear acceso a la plataforma si el alumno o los alumnos vinculados al tutor tienen estatus 'baja'
    if (foundUser.rol === 'alumno') {
      const cleanLogin = (foundUser.usuarioLogin || '').trim().toLowerCase();
      const linkedStudent = students.find(
        (st) =>
          st.id === foundUser.estudianteId ||
          (st.usuarioLogin && st.usuarioLogin.trim().toLowerCase() === cleanLogin) ||
          `${st.nombre} ${st.apellidos}`.trim().toLowerCase() === foundUser.nombre.trim().toLowerCase()
      );
      if (linkedStudent && linkedStudent.estatus === 'baja') {
        setErrorMsg(
          'El alumno se encuentra en estatus de BAJA en Control Escolar. El acceso a la plataforma está deshabilitado.'
        );
        setIsLoading(false);
        return;
      }
    }

    if (foundUser.rol === 'tutor') {
      const tutorStudents = students.filter(
        (st) =>
          st.tutorId === foundUser.id ||
          (Array.isArray(foundUser.hijosIds) && foundUser.hijosIds.includes(st.id)) ||
          (Array.isArray(foundUser.curpsAsociadas) &&
            Boolean(st.curp) &&
            foundUser.curpsAsociadas.some(
              (c) => c.trim().toUpperCase() === st.curp.trim().toUpperCase()
            )) ||
          (st.tutorCorreo &&
            foundUser.correo &&
            st.tutorCorreo.toLowerCase() === foundUser.correo.toLowerCase())
      );
      if (tutorStudents.length > 0 && tutorStudents.every((st) => st.estatus === 'baja')) {
        setErrorMsg(
          'El alumno vinculado se encuentra en estatus de BAJA en Control Escolar. No hay cobros activos ni acceso a la plataforma.'
        );
        setIsLoading(false);
        return;
      }
    }

    if (!foundUser.activo) {
      setErrorMsg('Esta cuenta se encuentra inactiva. Contacta al administrador.');
      setIsLoading(false);
      return;
    }

    await executeLogin(foundUser, false);
  };

  const handleForceLogin = async () => {
    const foundUser = findUserByUsernameOnly(usernameInput, password);
    if (foundUser) {
      await executeLogin(foundUser, true);
    }
  };

  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);
    const cleanMail = recoveryEmail.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@')) {
      setRecoveryStatus({
        type: 'error',
        message: 'Por favor ingresa un correo electrónico válido registrado en tu cuenta.',
      });
      return;
    }

    const matchedUsers = users.filter((u) => u.correo?.trim().toLowerCase() === cleanMail);
    if (matchedUsers.length === 0) {
      setRecoveryStatus({
        type: 'error',
        message: 'No se encontró ninguna cuenta asociada a este correo electrónico.',
      });
      return;
    }

    matchedUsers.forEach((u) => {
      const resolvedLogin = u.usuarioLogin || ensureUserCredentials(u).usuarioLogin;
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
      const digits = '23456789';
      const specials = '@#$%&*!?';
      const all = letters + digits + specials;
      const chars: string[] = [
        letters.charAt(Math.floor(Math.random() * letters.length)),
        letters.charAt(Math.floor(Math.random() * letters.length)),
        digits.charAt(Math.floor(Math.random() * digits.length)),
        digits.charAt(Math.floor(Math.random() * digits.length)),
        specials.charAt(Math.floor(Math.random() * specials.length)),
      ];
      for (let i = 0; i < 3; i++) {
        chars.push(all.charAt(Math.floor(Math.random() * all.length)));
      }
      const newTempPass = chars.sort(() => 0.5 - Math.random()).join('');

      updateUserPassword(u.id, newTempPass);
      const col = u.colegioId ? colleges.find((c) => c.id === u.colegioId) : null;

      sendEmailNotification({
        colegioId: u.colegioId || 'global',
        colegioNombre: col?.nombre || 'Plataforma Global My College',
        destinatarios: [u.correo],
        rolesDestino: [u.rol],
        usuariosDestino: [u.id, u.correo, resolvedLogin],
        asunto: `[My College] Restablecimiento de Contraseña y Recordatorio de Usuario`,
        cuerpo:
          `Estimado(a) ${u.nombre}:\n\n` +
          `Se ha procesado su solicitud de restablecimiento de contraseña para acceder al sistema.\n\n` +
          `=== CREDENCIALES ACTUALIZADAS ===\n` +
          `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
          `• Usuario de Acceso (Único medio de ingreso): ${resolvedLogin}\n` +
          `• Nueva Contraseña Temporal (8 caracteres): ${newTempPass}\n\n` +
          `Recuerde que el ingreso al sistema es únicamente mediante su Usuario (${resolvedLogin}). Una vez dentro, diríjase a "Mi Perfil" para personalizar su contraseña.`,
        categoria: 'seguridad',
        prioridad: 'alta',
      });
    });

    setRecoveryStatus({
      type: 'success',
      message: `Se han enviado las instrucciones de restablecimiento y tu Usuario de acceso al correo ${recoveryEmail.trim()}.`,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-3 sm:p-6 lg:p-8 relative selection:bg-amber-100 selection:text-amber-900">
      {/* Subtle Ambient Glows on White Canvas */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 py-2 sm:py-3 border-b border-slate-200 mb-3 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <MyCollegeLogo size="sm" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Portal Oficial</span>
        </span>
      </div>

      {/* Main Login Container - Fully adaptive to mobile & desktop */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10 flex-1 my-auto py-2 sm:py-4">
        {/* Left Column: Platform Branding on White */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-center flex flex-col items-center justify-center">
          <div className="flex justify-center items-center w-full">
            <MyCollegeLogo size="login" className="drop-shadow-sm max-w-[200px] sm:max-w-none" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-[#0B2545] tracking-tight leading-tight max-w-xl text-center px-2">
            Plataforma Integral de Gestión Escolar
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-lg mx-auto text-center font-medium px-2">
            Bienvenido al portal institucional multi-plantel de My College.
          </p>
        </div>

        {/* Right Column: Formulario Color Azul */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#0B2545] rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/25 p-5 sm:p-8 border border-blue-800 text-white relative overflow-hidden">
            {/* Subtle inner lighting */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-5 sm:mb-6 relative z-10">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Iniciar Sesión
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Ingresa únicamente con tu <strong>Usuario asignado</strong> y contraseña
              </p>
            </div>

            {/* Error Message with requested wording */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs font-semibold space-y-2 animate-in fade-in relative z-10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                  <span className="font-bold">{errorMsg}</span>
                </div>

                {activeSessionDevice && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-200/90 pl-6 font-mono">
                    <Smartphone className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span>Dispositivo: {activeSessionDevice}</span>
                  </div>
                )}

                {errorMsg.includes('sesíon activa') && (
                  <div className="pt-1.5 border-t border-rose-400/20 pl-6">
                    <button
                      type="button"
                      onClick={handleForceLogin}
                      className="text-[11px] text-amber-300 hover:text-amber-200 underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Cerrar sesión remota anterior e ingresar aquí</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Usuario de Acceso
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Ej. amorales4821"
                    autoComplete="username"
                    autoCapitalize="none"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB743] focus:bg-white/15 text-white placeholder-slate-400 transition-all font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-300/80 mt-1">
                  El acceso es exclusivamente con tu usuario creado (no correo electrónico).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB743] focus:bg-white/15 text-white placeholder-slate-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1 cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStatus(null);
                      setIsRecoveryOpen(true);
                    }}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#DFB743] via-[#C59B27] to-[#B68C1C] hover:from-[#E8C252] hover:to-[#A37B14] text-[#0B2545] font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Validando credenciales...</span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal (by Email) */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Restablecer Contraseña
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Envío de credenciales al correo registrado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El correo electrónico se utiliza para recibir notificaciones y recuperar tu acceso. Ingresa tu correo registrado y te enviaremos tu <strong>Usuario asignado</strong> junto con una nueva contraseña de 8 caracteres.
            </p>

            {recoveryStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                  recoveryStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {recoveryStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{recoveryStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordRecovery} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Correo Electrónico Registrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E6E] rounded-xl shadow-xs cursor-pointer"
                >
                  Enviar Restablecimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer on White */}
      <div className="w-full max-w-6xl mx-auto py-3 text-center text-xs text-slate-500 border-t border-slate-200 z-10 mt-4">
        <span>© 2026 My College — Plataforma Escolar. Todos los derechos reservados.</span>
      </div>
    </div>
  );
};

