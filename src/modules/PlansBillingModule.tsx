import React from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Check, Lock, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import { AVAILABLE_MODULES } from '../types';

export const PlansBillingModule: React.FC = () => {
  const { colleges, updateCollege, activeCollege } = useApp();
  const primaryColor = activeCollege?.colores?.primario || '#0B2545';
  const goldColor = activeCollege?.colores?.secundario || '#DFB743';

  const plans = [
    {
      nombre: 'Básico',
      precio: 3900,
      descripcion: 'Para planteles pequeños que inician su digitalización escolar.',
      modulosIncluidos: [
        'Control Escolar',
        'Estudiantes',
        'Docentes',
        'Materias',
        'Calificaciones',
        'Usuarios del Plantel',
        'Comunicados',
      ],
      color: 'border-slate-300',
      badge: 'bg-slate-100 text-slate-800',
    },
    {
      nombre: 'Estándar',
      precio: 6500,
      descripcion: 'Incluye gestión de tareas, planeaciones didácticas y exámenes.',
      modulosIncluidos: [
        'Control Escolar',
        'Estudiantes',
        'Docentes',
        'Materias',
        'Calificaciones',
        'Usuarios del Plantel',
        'Comunicados',
        'Tareas',
        'Exámenes',
        'Actividades Docentes',
      ],
      color: 'border-blue-400',
      badge: 'bg-blue-100 text-blue-800',
    },
    {
      nombre: 'Institucional Pro',
      precio: 9800,
      descripcion: 'Para colegios medianos con control de prefectura e incidencias y biblioteca.',
      modulosIncluidos: [
        'Control Escolar',
        'Estudiantes',
        'Docentes',
        'Materias',
        'Calificaciones',
        'Usuarios del Plantel',
        'Comunicados',
        'Tareas',
        'Exámenes',
        'Actividades Docentes',
        'Incidencias',
        'Biblioteca',
      ],
      color: 'border-amber-400',
      badge: 'bg-amber-100 text-amber-900',
    },
    {
      nombre: 'Campus Elite',
      precio: 14500,
      descripcion: 'Acceso total sin restricciones, módulos analíticos avanzados y soporte prioritario.',
      modulosIncluidos: AVAILABLE_MODULES.map((m) => m.label),
      color: 'border-emerald-500',
      badge: 'bg-emerald-100 text-emerald-900 font-bold',
      popular: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Suscripciones y Facturación
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6" style={{ color: goldColor }} />
            Planes de Suscripción y Control de Módulos por Pago
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            Supervisa las tarifas contratadas por cada colegio y cómo sus módulos se habilitan o bloquean
            de acuerdo al plan y vigencia de su pago.
          </p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => (
          <div
            key={p.nombre}
            className={`bg-white rounded-2xl p-5 border-2 ${p.color} shadow-xs flex flex-col justify-between relative`}
          >
            {p.popular && (
              <span className="absolute -top-3 right-4 bg-[#0B2545] text-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Más Completo
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${p.badge}`}>
                  {p.nombre}
                </span>
              </div>

              <div className="font-display font-extrabold text-2xl text-slate-900 mb-1">
                ${p.precio.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">MXN / mes</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{p.descripcion}</p>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Módulos Incluidos ({p.modulosIncluidos.length})
                </span>
                {AVAILABLE_MODULES.map((mod) => {
                  const isIncluded = p.modulosIncluidos.includes(mod.label);
                  return (
                    <div
                      key={mod.id}
                      className={`text-xs flex items-center gap-1.5 ${
                        isIncluded ? 'text-slate-800' : 'text-slate-400 line-through opacity-60'
                      }`}
                    >
                      {isIncluded ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>{mod.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* College Billing Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-display font-bold text-sm text-slate-900">
            Estatus de Cobranza y Vigencia por Colegio
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Institución</th>
                <th className="py-3 px-4">Plan Actual</th>
                <th className="py-3 px-4">Monto Mensual</th>
                <th className="py-3 px-4">Próximo Vencimiento</th>
                <th className="py-3 px-4">Estatus de Pago</th>
                <th className="py-3 px-4 text-right">Acción de Cobranza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colleges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    {c.escudoUrl && (
                      <img src={c.escudoUrl} alt="" className="w-7 h-7 object-contain rounded" />
                    )}
                    <span>{c.nombre}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{c.plan}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                    ${c.montoMensual.toLocaleString()} MXN
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{c.fechaProximoPago}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.estadoPago === 'al_corriente'
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.estadoPago === 'proximo_a_vencer'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {c.estadoPago === 'al_corriente'
                        ? 'Al Corriente'
                        : c.estadoPago === 'proximo_a_vencer'
                        ? 'Próximo a Vencer'
                        : 'Pago Vencido'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        const nextStatus =
                          c.estadoPago === 'al_corriente'
                            ? 'vencido'
                            : 'al_corriente';
                        updateCollege(c.id, { estadoPago: nextStatus });
                      }}
                      className="text-xs px-2.5 py-1 rounded border hover:bg-slate-100 font-semibold"
                    >
                      {c.estadoPago === 'al_corriente'
                        ? 'Simular Vencimiento'
                        : 'Registrar Pago (Activar)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
