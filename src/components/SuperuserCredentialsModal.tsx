import React, { useState } from 'react';
import { Shield, KeyRound, Copy, Check, UserCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperuserCredentialsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { users, setCurrentUser, setSelectedCollegeId, dbStatus, refreshDbStatus } = useApp();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const superuser = users.find((u) => u.rol === 'superusuario') || users[0];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLoginAsSuper = () => {
    setCurrentUser(superuser);
    setSelectedCollegeId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header with My College Gold and Navy Theme */}
        <div className="bg-[#0B2545] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Acceso Superusuario Maestro
              </h3>
              <p className="text-xs text-amber-200/80">
                Privilegios totales sobre la plataforma My College
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Este usuario cuenta con <strong className="text-slate-900">todos los privilegios</strong>:
            puede dar de alta instituciones educativas, asignar y administrar administradores de
            plantel, habilitar o restringir módulos de acuerdo al estatus de pago y acceder a
            cualquier colegio registrado.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Usuario de Acceso (Superusuario)
              </label>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-800">
                <span>{superuser.usuarioLogin || 'amorales4821'}</span>
                <button
                  onClick={() => handleCopy(superuser.usuarioLogin || 'amorales4821', 'usuario')}
                  className="text-slate-500 hover:text-amber-600 p-1 rounded transition-colors"
                  title="Copiar usuario"
                >
                  {copiedField === 'usuario' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Correo de notificaciones y recuperación: {superuser.correo}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-800">
                <span>{superuser.password || 'admin123'}</span>
                <button
                  onClick={() => handleCopy(superuser.password || 'admin123', 'pass')}
                  className="text-slate-500 hover:text-amber-600 p-1 rounded transition-colors"
                  title="Copiar contraseña"
                >
                  {copiedField === 'pass' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Titular:</span>
                <span className="font-semibold text-slate-800">{superuser.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nivel de Seguridad:</span>
                <span className="font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                   Nivel 0 · Super Administrador Global
                </span>
              </div>
            </div>
          </div>

          {/* MongoDB Atlas Status */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                Base de Datos (MongoDB Atlas)
              </span>
              <button
                type="button"
                onClick={() => refreshDbStatus()}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Verificar estado
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {dbStatus?.connected ? (
                <span className="text-emerald-700 font-medium">
                  Conectado exitosamente a la base: <strong>{dbStatus.dbName}</strong>
                </span>
              ) : (
                <span className="text-slate-600">
                  Modo local activo. Para persistir en la nube, asigna tu variable{' '}
                  <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">
                    MONGODB_URI
                  </code>
                </span>
              )}
            </p>
          </div>

          {/* Quick 1-click login action */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleLoginAsSuper}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#123B6B] text-amber-400 font-semibold text-sm transition-all shadow-md active:scale-98"
            >
              <KeyRound className="w-4 h-4" />
              <span>Entrar Ahora como Superusuario</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
