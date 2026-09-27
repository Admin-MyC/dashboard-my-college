import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Palette,
  ExternalLink,
  ChevronDown,
  Layers,
  Settings,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { College } from '../types';

interface Props {
  onNavigateTab: (tab: string) => void;
  onOpenAddCollegeModal: () => void;
}

export const GlobalDashboard: React.FC<Props> = ({
  onNavigateTab,
  onOpenAddCollegeModal,
}) => {
  const { colleges, users, students, setSelectedCollegeId } = useApp();

  // State for the dedicated dropdown selector of registered colleges
  const [selectedDropdownCollegeId, setSelectedDropdownCollegeId] = useState<string>(
    colleges.length > 0 ? colleges[0].id : ''
  );

  const totalColleges = colleges.length;
  const activeColleges = colleges.filter((c) => c.activo).length;
  const totalStudents = colleges.reduce((acc, c) => acc + (c.alumnosTotales || 0), 0);
  const totalStaff = users.filter((u) => u.rol !== 'superusuario').length;
  const totalMonthlyBilling = colleges.reduce((acc, c) => acc + (c.montoMensual || 0), 0);

  const pendingPayments = colleges.filter(
    (c) => c.estadoPago === 'vencido' || c.estadoPago === 'proximo_a_vencer'
  );

  const currentSelectedCollege = colleges.find((c) => c.id === selectedDropdownCollegeId) || colleges[0];
  const assignedAdmin = currentSelectedCollege
    ? users.find((u) => u.id === currentSelectedCollege.adminUserId)
    : null;

  const handleEnterCollege = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
    onNavigateTab('colegio_resumen');
  };

  const handleCustomizeCollege = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
    onNavigateTab('personalizar');
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner with Official Main Dashboard Shield */}
      <div className="bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#133966] rounded-2xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden border border-amber-500/20">
        {/* Subtle Watermark Shield in Background */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block select-none">
          <img src="/my-college-logo.svg" alt="" className="w-72 h-72 object-contain" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold mb-3 shadow-inner">
              <img src="/my-college-logo.svg" alt="Escudo" className="w-4 h-4 object-contain" />
              <span>Escudo & Panel Maestro Multi-Colegio</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-white mb-2">
              Administración Centralizada de Instituciones
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              Gestiona planteles registrados, supervisa el cumplimiento de pagos, activa o restringe
              módulos institucionales y personaliza la identidad de cada colegio con su escudo y colores propios.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAddCollegeModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB743] to-[#C59B27] hover:from-[#E8C252] hover:to-[#B68C1C] text-[#0B2545] font-bold text-xs md:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Registrar Nuevo Colegio</span>
              </button>
              <button
                onClick={() => onNavigateTab("colegios")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
              >
                <span>Ver Módulo Colegios</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Official Crest Showcase Card (Right Side of Banner) */}
          <div className="hidden sm:flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-xl shrink-0 self-center">
            <div className="relative group p-3 rounded-2xl bg-white shadow-2xl border border-amber-300">
              <img src="/my-college-logo.svg" alt="My College" className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 object-contain" />
            </div>
            <div className="mt-3.5 text-center">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Escudo Oficial
              </div>
              <div className="text-xs font-extrabold text-white">
                My College Central
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED DROPDOWN LIST OF REGISTERED COLLEGES (Requested by user) */}
      <div className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-sm p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Acceso Rápido a Instituciones</span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Listado Desplegable de Colegios Dados de Alta
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona cualquier colegio de la lista para ingresar a su panel individual, personalizar sus colores o revisar sus módulos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total dados de alta:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
              {colleges.length} instituciones
            </span>
          </div>
        </div>

        {/* Dropdown Selector Component */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Seleccionar Colegio del Desplegable:
            </label>
            <div className="relative">
              <Building2 className="w-5 h-5 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDropdownCollegeId}
                onChange={(e) => setSelectedDropdownCollegeId(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 hover:border-amber-400 focus:border-amber-500 focus:bg-white rounded-xl text-slate-900 font-semibold transition-all appearance-none cursor-pointer"
              >
                {colleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.nombre} — [{col.codigoCCT}] ({col.nivel}) — Plan {col.plan}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick tags of all colleges */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1 self-center">
                Atajos:
              </span>
              {colleges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedDropdownCollegeId(c.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    selectedDropdownCollegeId === c.id
                      ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c.nombre.split(' ')[0]} {c.nombre.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Action Card for the Selected College */}
          {currentSelectedCollege && (
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-start gap-4">
                <img
                  src={currentSelectedCollege.escudoUrl}
                  alt={currentSelectedCollege.nombre}
                  className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200 p-1 shadow-xs shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                      {currentSelectedCollege.nombre}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentSelectedCollege.estadoPago === 'al_corriente'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : currentSelectedCollege.estadoPago === 'proximo_a_vencer'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {currentSelectedCollege.estadoPago === 'al_corriente'
                        ? 'Al corriente'
                        : currentSelectedCollege.estadoPago === 'proximo_a_vencer'
                        ? 'Próx. vencimiento'
                        : 'Pago pendiente'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 italic mt-0.5 truncate">
                    "{currentSelectedCollege.lema}"
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        CCT / Nivel
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {currentSelectedCollege.codigoCCT}
                      </span>{' '}
                      · {currentSelectedCollege.nivel}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Administrador
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {assignedAdmin ? assignedAdmin.nombre : currentSelectedCollege.director}
                      </span>
                    </div>
                  </div>

                  {/* Colors preview */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Colores:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: currentSelectedCollege.colores.primario }}
                        title={`Primario: ${currentSelectedCollege.colores.primario}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: currentSelectedCollege.colores.secundario }}
                        title={`Secundario: ${currentSelectedCollege.colores.secundario}`}
                      />
                      <span className="text-[10px] font-mono text-slate-500">
                        {currentSelectedCollege.colores.primario} / {currentSelectedCollege.colores.secundario}
                      </span>
                    </div>
                  </div>

                  {/* Direct action buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleEnterCollege(currentSelectedCollege.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: currentSelectedCollege.colores.primario || '#0B2545',
                      }}
                    >
                      <span>Ingresar al Colegio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCustomizeCollege(currentSelectedCollege.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Personalizar Escudo y Colores de este colegio"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-600" />
                      <span>Personalizar</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('colegios')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Administrar módulos de este colegio en el Módulo Colegios"
                    >
                      <span>Ver Módulos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Colegios Afiliados</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {totalColleges}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">{activeColleges} activos</span>
            <span>·</span>
            <span>100% operativos</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Población Estudiantil</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {totalStudents.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Matriculados en los diferentes planteles
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Personal y Docentes</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {totalStaff}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Admins, directivos, docentes y psicólogos
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturación Mensual</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            ${totalMonthlyBilling.toLocaleString()} MXN
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span
              className={
                pendingPayments.length > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'
              }
            >
              {pendingPayments.length} pendientes
            </span>
            <span>·</span>
            <span>Planes activos</span>
          </div>
        </div>
      </div>

      {/* 4. Main Colleges Table & Access shortcuts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Instituciones Registradas en My College
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en "Ingresar al Colegio" para administrarlo directamente desde su propio entorno personalizado
            </p>
          </div>
          <button
            onClick={onOpenAddCollegeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#123B6B] rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Colegio</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Escudo & Nombre</th>
                <th className="py-3 px-4">CCT & Nivel</th>
                <th className="py-3 px-4">Plan & Módulos</th>
                <th className="py-3 px-4">Estado de Pago</th>
                <th className="py-3 px-4">Administrador Asignado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colleges.map((col) => {
                const admin = users.find((u) => u.id === col.adminUserId);
                const enabledCount = col.modulosHabilitados?.length || 0;

                return (
                  <tr
                    key={col.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Escudo & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={col.escudoUrl}
                          alt={col.nombre}
                          className="w-10 h-10 object-contain rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {col.nombre}
                          </div>
                          <div className="text-xs text-slate-400 italic">
                            "{col.lema}"
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CCT & Level */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-mono text-xs font-medium">{col.codigoCCT}</div>
                      <div className="text-xs text-slate-500">{col.nivel}</div>
                    </td>

                    {/* Plan & Modules */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{col.plan}</div>
                      <div className="text-xs text-slate-500">
                        {enabledCount} de 13 módulos activos
                      </div>
                    </td>

                    {/* Payment status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          col.estadoPago === 'al_corriente'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : col.estadoPago === 'proximo_a_vencer'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {col.estadoPago === 'al_corriente' && <CheckCircle2 className="w-3 h-3" />}
                        {col.estadoPago === 'proximo_a_vencer' && <AlertTriangle className="w-3 h-3" />}
                        {col.estadoPago === 'vencido' && <AlertTriangle className="w-3 h-3" />}
                        {col.estadoPago === 'al_corriente'
                          ? 'Al corriente'
                          : col.estadoPago === 'proximo_a_vencer'
                          ? 'Próx. a vencer'
                          : 'Pago vencido'}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ${col.montoMensual.toLocaleString()} / mes
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {admin ? admin.nombre : col.director}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {admin ? admin.correo : col.correo}
                      </div>
                    </td>

                    {/* Action: Enter or Customize */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleCustomizeCollege(col.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors inline-block cursor-pointer"
                        title="Personalizar Escudo y Colores"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleEnterCollege(col.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all active:scale-98 cursor-pointer"
                        style={{
                          backgroundColor: col.colores.primario || '#0B2545',
                        }}
                      >
                        <span>Ingresar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
