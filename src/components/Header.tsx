import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MyCollegeLogo } from './MyCollegeLogo';
import {
  ChevronDown,
  UserCheck,
  LogOut,
  KeyRound,
  Shield,
} from 'lucide-react';
import { ROLES_CONFIG } from '../types';

interface HeaderProps {
  onOpenQuickLogin: () => void;
  onOpenSuperuserModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickLogin,
  onOpenSuperuserModal,
  onLogout,
}) => {
  const { currentUser, setSelectedCollegeId, activeCollege } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ZONE 1: BRAND LOGO & ACTIVE CONTEXT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentUser.rol === 'superusuario') {
                setSelectedCollegeId(null);
              }
            }}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer group"
          >
            {activeCollege ? (
              <div className="flex items-center gap-3">
                <img
                  src={activeCollege.escudoUrl}
                  alt={activeCollege.nombre}
                  className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Colegio Activo
                    </span>
                  </div>
                  <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-[320px]">
                    {activeCollege.nombre}
                  </h1>
                </div>
              </div>
            ) : (
              <MyCollegeLogo size="md" />
            )}
          </button>
        </div>

        {/* ZONE 2: ACTIONS & USER PROFILE */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ONLY "Cambiar Rol" for superusuario. Hidden for all other users in colleges! */}
          {currentUser.rol === 'superusuario' && (
            <button
              onClick={onOpenQuickLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Cambiar rápidamente de rol o usuario"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Cambiar Rol</span>
            </button>
          )}

          {/* Active User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.nombre}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.nombre}
                </div>
                <div className="text-[11px] text-slate-500 font-medium capitalize">
                  {ROLES_CONFIG[currentUser.rol]?.label || currentUser.rol}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">
                    {currentUser.nombre}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.correo}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Shield className="w-3 h-3" />
                    <span>Rol: {ROLES_CONFIG[currentUser.rol]?.label}</span>
                  </div>
                </div>

                {currentUser.rol === 'superusuario' && (
                  <div className="py-1">
                    <button
                      onClick={onOpenSuperuserModal}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>Datos de acceso Superusuario</span>
                    </button>
                    <button
                      onClick={onOpenQuickLogin}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Simular otro usuario / rol</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
