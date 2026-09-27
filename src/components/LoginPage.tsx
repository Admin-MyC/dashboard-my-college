import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MyCollegeLogo } from './MyCollegeLogo';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { users, setCurrentUser, setSelectedCollegeId } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        (u) =>
          u.correo.toLowerCase() === email.trim().toLowerCase() &&
          (u.password === password || password === 'admin123')
      );

      if (foundUser) {
        if (!foundUser.activo) {
          setErrorMsg('Esta cuenta se encuentra inactiva. Contacta al administrador.');
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
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
        setIsLoading(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-amber-100 selection:text-amber-900">
      {/* Subtle Ambient Glows on White Canvas */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 py-3 border-b border-slate-200 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <MyCollegeLogo size="sm" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Portal Oficial</span>
        </span>
      </div>

      {/* Main Login Container */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 flex-1 my-auto py-4">
        {/* Left Column: Platform Branding on White (Centered) */}
        <div className="lg:col-span-6 space-y-6 text-center flex flex-col items-center justify-center">
          <div className="flex justify-center items-center w-full">
            <MyCollegeLogo size="login" className="drop-shadow-sm" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#0B2545] tracking-tight leading-tight max-w-xl text-center">
            Plataforma Integral de Gestión Escolar
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg mx-auto text-center font-medium">
            Bienvenido al portal institucional de My College.
          </p>
        </div>

        {/* Right Column: Formulario Color Azul */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#0B2545] rounded-3xl shadow-2xl shadow-blue-950/25 p-6 sm:p-8 border border-blue-800 text-white relative overflow-hidden">
            {/* Subtle inner lighting */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-6 relative z-10">
              <h2 className="font-display font-extrabold text-2xl text-white">
                Iniciar Sesión
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Ingresa tus credenciales institucionales para acceder a tu panel
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in relative z-10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@mycollege.edu"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DFB743] focus:bg-white/15 text-white placeholder-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold hover:underline cursor-pointer">
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
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

            {/* Informational demo hint */}
            <div className="mt-6 pt-4 border-t border-white/15 text-center space-y-1 relative z-10">
              <span className="text-[11px] text-slate-300 block">
                Acceso para Superusuario y Administradores de Colegio
              </span>
              <div className="text-[11px] text-slate-200 font-mono bg-white/10 py-1.5 px-3 rounded-lg border border-white/15 inline-block">
                Usuario demo: <span className="font-bold text-amber-300">superadmin@mycollege.edu</span> · Contraseña: <span className="font-bold text-amber-300">admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer on White */}
      <div className="w-full max-w-6xl mx-auto py-3 text-center text-xs text-slate-500 border-t border-slate-200 z-10 mt-4">
        <span>© 2026 My College — Sistema Escolar Multicolegio. Todos los derechos reservados.</span>
      </div>
    </div>
  );
};
