import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  EmailNotification,
  SYSTEM_NOTIFICATION_EMAIL,
  UserRole,
  ROLES_CONFIG,
} from '../types';
import { isNotificationForUser, isNotificationReadByUser } from '../services/notificationService';
import {
  X,
  Mail,
  Send,
  CheckCheck,
  Shield,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Filter,
  UserCheck,
  Lock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    emailNotifications,
    sendEmailNotification,
    markNotificationAsRead,
    activeCollege,
    colleges,
    currentUser,
    students,
    allRolesConfig,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);

  if (!isOpen) return null;

  const currentRoleLabel =
    allRolesConfig?.[currentUser.rol]?.label ||
    ROLES_CONFIG[currentUser.rol]?.label ||
    currentUser.rol;

  // STRICT USER & PROFILE SCOPING:
  // En el centro de notificaciones SOLO se muestran las que involucren a ese usuario y a ese perfil,
  // nunca las notificaciones de otros colegios o de otros usuarios.
  const filteredNotifications = emailNotifications.filter((n) => {
    // 1. Validar que el usuario actual y su perfil estén directamente involucrados
    if (!isNotificationForUser(n, currentUser, students, activeCollege?.id || null)) {
      return false;
    }

    // 2. Category Filter
    if (activeCategory !== 'todas') {
      if (n.categoria !== activeCategory) return false;
    }

    return true;
  });

  const unreadCount = filteredNotifications.filter(
    (n) => !isNotificationReadByUser(n, currentUser)
  ).length;

  const handleOpenDetail = (notif: EmailNotification) => {
    setSelectedNotification(notif);
    if (!isNotificationReadByUser(notif, currentUser)) {
      markNotificationAsRead(notif.id);
    }
  };

  const categoryLabels: Record<string, string> = {
    todas: 'Todas',
    comunicado: 'Comunicados',
    asistencia: 'Asistencias',
    incidencia: 'Incidencias',
    calificaciones: 'Calificaciones',
    facturacion: 'Facturación',
    seguridad: 'Seguridad / Cuenta',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Main Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-blue-100 text-blue-900 rounded-2xl">
              <Mail className="w-5 h-5 text-blue-700" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Centro de Notificaciones Oficiales
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                <span>Remitente oficial:</span>
                <span className="font-semibold text-blue-700">{SYSTEM_NOTIFICATION_EMAIL}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User & Profile Exclusive Scope Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/70 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Bandeja personal exclusiva: <strong className="text-slate-900">{currentUser.nombre}</strong>
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
              Perfil: {currentRoleLabel}
            </span>
            {activeCollege && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                {activeCollege.nombre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Solo eventos de {currentUser.nombre} ({currentRoleLabel})</span>
            </span>
          </div>
        </div>

        {/* Actions bar & category tabs */}
        <div className="p-3 sm:px-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2545] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Bandeja de recepción (La emisión se realiza desde el módulo Comunicados y Avisos)
          </span>
        </div>

        {/* Content list or single email view */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {selectedNotification ? (
            /* Detailed Email View */
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Volver a la lista
                </button>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedNotification.fecha} · {selectedNotification.hora}
                </span>
              </div>

              {/* Email Envelope Header */}
              <div className="space-y-1.5 text-xs bg-white p-3.5 rounded-xl border border-slate-200 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">De:</span>
                  <span className="text-blue-700 font-semibold">{selectedNotification.remitente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Colegio:</span>
                  <span className="text-slate-900 font-semibold">
                    {selectedNotification.colegioNombre || 'Sistema General My College'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Para:</span>
                  <span className="text-slate-800">{selectedNotification.destinatarios.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Roles Destino:</span>
                  <span className="text-slate-700 font-semibold">
                    {selectedNotification.rolesDestino.map((r) => ROLES_CONFIG[r as UserRole]?.label || r).join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Asunto:</span>
                  <span className="text-slate-900 font-bold">{selectedNotification.asunto}</span>
                </div>
              </div>

              {/* Email Body - Rich Institutional Template */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Institutional Email Banner */}
                <div className="bg-gradient-to-r from-[#0B2545] to-[#133b6e] text-white p-4 sm:p-5 border-b-4 border-[#DFB743] flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#DFB743] text-[#0B2545]">
                      Notificación Oficial · {selectedNotification.categoria}
                    </span>
                    <h4 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#DFB743] shrink-0" />
                      <span>{selectedNotification.colegioNombre || 'Sistema Oficial My College'}</span>
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-lg shrink-0">
                    ✓ Entregado
                  </span>
                </div>

                {/* Formatted Content */}
                <div className="p-5 sm:p-6 space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {selectedNotification.cuerpo.split('\n').map((rawLine, idx) => {
                    const line = rawLine.trim();
                    if (!line) return <div key={idx} className="h-1.5" />;

                    if (line.startsWith('===') && line.endsWith('===')) {
                      const title = line.replace(/===/g, '').trim();
                      return (
                        <div
                          key={idx}
                          className="mt-4 mb-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border-l-4 border-[#DFB743] font-display font-bold text-xs uppercase tracking-wider text-[#0B2545]"
                        >
                          {title}
                        </div>
                      );
                    }

                    if (line.startsWith('•')) {
                      const cleanItem = line.substring(1).trim();
                      const parts = cleanItem.split(':');
                      if (parts.length >= 2) {
                        const label = parts[0];
                        const value = parts.slice(1).join(':').trim();
                        const isUrl =
                          value.includes('dashboard.mycollege.com.mx') ||
                          value.startsWith('http');
                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200/80"
                          >
                            <span className="text-xs font-semibold text-slate-600">
                              {label}:
                            </span>
                            {isUrl ? (
                              <a
                                href={value.startsWith('http') ? value : `https://${value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono font-bold text-xs text-blue-700 hover:text-blue-900 underline"
                              >
                                {value}
                              </a>
                            ) : (
                              <span className="font-mono font-bold text-xs text-[#0B2545] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {value}
                              </span>
                            )}
                          </div>
                        );
                      }
                    }

                    if (
                      line.toLowerCase().includes('recordatorio') ||
                      line.toLowerCase().includes('cambie su contraseña') ||
                      line.toLowerCase().includes('cambiar su contraseña')
                    ) {
                      return (
                        <div
                          key={idx}
                          className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-start gap-2.5"
                        >
                          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="text-slate-700 leading-relaxed">
                        {line}
                      </p>
                    );
                  })}

                  {/* Direct CTA Button & Security Reminder Footer inside Email */}
                  <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-xl border">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Portal Oficial de Acceso
                      </span>
                      <a
                        href="https://dashboard.mycollege.com.mx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-xs sm:text-sm text-blue-700 hover:underline"
                      >
                        https://dashboard.mycollege.com.mx
                      </a>
                      <p className="text-[11px] text-slate-500">
                        Recuerda: Una vez que ingreses, ve a <strong>Mi Perfil</strong> y cambia tu contraseña.
                      </p>
                    </div>
                    <a
                      href="https://dashboard.mycollege.com.mx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133b6e] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                    >
                      Ir a dashboard.mycollege.com.mx →
                    </a>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Despachado por {SYSTEM_NOTIFICATION_EMAIL}</span>
                  <span>dashboard.mycollege.com.mx</span>
                </div>
              </div>
            </div>
          ) : (
            /* Notification items list */
            filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No hay notificaciones registradas para este colegio o rol.</p>
                {activeCollege && (
                  <p className="text-[11px] text-slate-400">
                    Estás en la bandeja privada de <strong>{activeCollege.nombre}</strong>.
                  </p>
                )}
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !isNotificationReadByUser(notif, currentUser);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenDetail(notif)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isUnread
                        ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {notif.categoria}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {notif.fecha} · {notif.hora}
                        </span>
                        <span className="text-[11px] text-blue-700 font-semibold font-mono">
                          De: {SYSTEM_NOTIFICATION_EMAIL}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug truncate">
                        {notif.asunto}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.cuerpo}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-400">Plantel:</span>
                        <span className="font-bold text-slate-700">
                          {notif.colegioNombre || 'General'}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-slate-400">Dirigido a:</span>
                        <span className="font-semibold text-slate-700">
                          {notif.rolesDestino.map((r) => ROLES_CONFIG[r as UserRole]?.label || r).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-slate-400 text-xs font-semibold self-center">
                      <span className="hidden sm:inline">Ver correo</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px] text-slate-500">
            Canal institucional: <strong className="text-blue-700">{SYSTEM_NOTIFICATION_EMAIL}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
