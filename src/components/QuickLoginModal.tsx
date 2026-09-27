import React from 'react';
import { ROLES_CONFIG, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { X, Check, Building2, Shield, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { users, currentUser, setCurrentUser, colleges, setSelectedCollegeId } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              Simular Rol de Usuario
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona una cuenta preconfigurada para probar cómo ve el dashboard cada rol
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5">
          {users.map((u) => {
            const roleCfg = ROLES_CONFIG[u.rol];
            const isCurrent = currentUser.id === u.id;
            const userCollege = colleges.find((c) => c.id === u.colegioId);

            return (
              <div
                key={u.id}
                onClick={() => {
                  setCurrentUser(u);
                  if (u.rol === 'superusuario') {
                    setSelectedCollegeId(null);
                  } else if (u.colegioId) {
                    setSelectedCollegeId(u.colegioId);
                  }
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.avatar}
                    alt={u.nombre}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {u.nombre}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCfg.badgeBg} ${roleCfg.badgeText}`}
                      >
                        {roleCfg.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {u.cargo} · <span className="font-mono text-[11px]">{u.correo}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {u.rol === 'superusuario' ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Acceso Global a Todos los Colegios
                        </span>
                      ) : userCollege ? (
                        <span className="text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          Colegio Asignado: {userCollege.nombre}
                        </span>
                      ) : (
                        <span>Sin colegio asignado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5" /> Activo
                    </span>
                  ) : (
                    <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors">
                      Cambiar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
