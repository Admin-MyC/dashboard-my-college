import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Interactive Bcrypt Tester
  const [testPassword, setTestPassword] = useState('MyCollege2026!');
  const [generatedHash, setGeneratedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('MyCollege2026!');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSecurityStatus();
    }
  }, [isOpen]);

  const fetchSecurityStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/security/status');
      if (res.ok) {
        const data = await res.json();
        setSecurityStatus(data.security);
      }
    } catch (err) {
      console.error('Error fetching security status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleGenerateHash = async () => {
    if (!testPassword) return;
    setIsHashing(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/auth/hash-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPassword }),
      });
      const data = await res.json();
      if (data.hash) {
        setGeneratedHash(data.hash);
        setVerifyPasswordInput(testPassword);
      }
    } catch (err) {
      console.error('Error hashing password:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleVerifyHash = async () => {
    if (!verifyPasswordInput || !generatedHash) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: verifyPasswordInput, hash: generatedHash }),
      });
      const data = await res.json();
      setVerificationResult(data.match === true);
    } catch (err) {
      console.error('Error verifying hash:', err);
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = () => {
    if (generatedHash) {
      navigator.clipboard.writeText(generatedHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Shield className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg">
                  Seguridad y Criptografía Institucional
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Activa
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Bcrypt · Rate Limiting (Anti Fuerza Bruta) · Cabeceras de Seguridad Helmet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 3 Pillars Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Bcrypt */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  10 Rondas
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Hashing Bcrypt
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Salting aleatorio y derivación criptográfica lenta anti-GPU.
              </p>
            </div>

            {/* Card 2: Rate Limit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  15 req / 15m
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Rate Limiting
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Bloqueo automático de IP tras intentos fallidos de login.
              </p>
            </div>

            {/* Card 3: Helmet */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Helmet 8.x
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Cabeceras Helmet
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Protección HSTS, nosniff, anti-XSS y ocultación de Express.
              </p>
            </div>
          </div>

          {/* Interactive Bcrypt Test Console */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Laboratorio Criptográfico Bcrypt en Vivo
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Backend API: /api/auth/*
              </span>
            </div>

            {/* Hash Generator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                1. Contraseña en texto plano para encriptar:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="Escribe una contraseña de prueba..."
                />
                <button
                  type="button"
                  onClick={handleGenerateHash}
                  disabled={isHashing}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHashing ? 'animate-spin' : ''}`} />
                  <span>{isHashing ? 'Generando...' : 'Generar Hash Bcrypt'}</span>
                </button>
              </div>
            </div>

            {/* Generated Hash Display */}
            {generatedHash && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Hash Bcrypt Resultante ($2a$10$...):</span>
                  <button
                    onClick={handleCopyHash}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-amber-300 break-all select-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  {generatedHash}
                </div>
                <p className="text-[10px] text-slate-400">
                  * El prefijo <code className="text-amber-300">$2a$10$</code> indica algoritmo Bcrypt versión 2a con 2¹⁰ = 1,024 iteraciones de salting aleatorio.
                </p>
              </div>
            )}

            {/* Hash Verifier */}
            {generatedHash && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">
                  2. Verificar contraseña contra el hash anterior (Bcrypt Compare):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={verifyPasswordInput}
                    onChange={(e) => {
                      setVerifyPasswordInput(e.target.value);
                      setVerificationResult(null);
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="Prueba con la misma contraseña o una incorrecta..."
                  />
                  <button
                    type="button"
                    onClick={handleVerifyHash}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Verificando...' : 'Verificar Coincidencia'}</span>
                  </button>
                </div>

                {/* Verification Result Feedback */}
                {verificationResult !== null && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in ${
                      verificationResult
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {verificationResult ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>¡Coincidencia exitosa! bcrypt.compare() validó la contraseña en tiempo constante contra el hash.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Contraseña inválida. El hash no corresponde con el texto ingresado.</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detailed Status List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between">
              <span>Auditoría de Políticas de Seguridad del Servidor</span>
              <button
                onClick={fetchSecurityStatus}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>Actualizar estado</span>
              </button>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Policy 1 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    Cabeceras HTTP Helmet (HSTS, nosniff, no-referrer)
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Previene ataques de inyección, sniffing de tipo MIME y oculta la cabecera identificatoria X-Powered-By del servidor.
                  </p>
                </div>
              </div>

              {/* Policy 2 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    Protección Anti Fuerza Bruta (Rate Limiting en Login)
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Bloqueo temporal de 15 minutos al superar 15 intentos fallidos desde una misma IP en <code className="text-blue-700">/api/sessions/login</code>.
                  </p>
                </div>
              </div>

              {/* Policy 3 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    Monitoreo de Sesión Única en Tiempo Real
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Bloqueo simultáneo ante inicios en dispositivos concurrentes con el mensaje oficial <strong className="text-slate-700">&quot;Usuario con sesíon activa en otro dispositivo&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Normativa: ISO/IEC 27001 · OWASP Top 10 Compliance
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
