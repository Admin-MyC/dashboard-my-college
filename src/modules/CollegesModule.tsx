import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Palette,
  Sliders,
  ArrowRight,
  Shield,
  Trash2,
  Edit2,
  Upload,
  CreditCard,
  UserCheck,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { AVAILABLE_MODULES, College, CollegeModuleId, PaymentStatus, PlanType } from '../types';
import { createShieldSvg } from '../utils/shieldHelper';
import { compressImageFile } from '../utils/imageCompressor';
import { generateTutorUsername, generateRandomPassword } from '../utils/preenrollmentHelper';

interface Props {
  onNavigateTab: (tab: string) => void;
  openAddModalInitially?: boolean;
}

export const CollegesModule: React.FC<Props> = ({
  onNavigateTab,
  openAddModalInitially = false,
}) => {
  const {
    colleges,
    activeCollege,
    users,
    addCollege,
    updateCollege,
    deleteCollege,
    toggleModule,
    updateCollegeBranding,
    setSelectedCollegeId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('todos');
  const [filterPayment, setFilterPayment] = useState<string>('todos');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(openAddModalInitially);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [modulesModalCollege, setModulesModalCollege] = useState<College | null>(null);
  const [brandingModalCollege, setBrandingModalCollege] = useState<College | null>(null);
  const [createdCollegeCredentials, setCreatedCollegeCredentials] = useState<{
    collegeName: string;
    adminName: string;
    adminEmail: string;
    username: string;
    password: string;
  } | null>(null);

  // Add College Form State
  const [newColName, setNewColName] = useState('');
  const [newColCCT, setNewColCCT] = useState('');
  const [newColLema, setNewColLema] = useState('');
  const [newColNivel, setNewColNivel] = useState<College['nivel']>('Primaria');
  const [newColPlan, setNewColPlan] = useState<PlanType>('Estándar');
  const [newColPayment, setNewColPayment] = useState<PaymentStatus>('al_corriente');
  const [newColMonto, setNewColMonto] = useState<number>(6500);
  const [newColPhone, setNewColPhone] = useState('');
  const [newColEmail, setNewColEmail] = useState('');
  const [newColAddress, setNewColAddress] = useState('');
  const [newColPrimary, setNewColPrimary] = useState('#0B2545');
  const [newColGold, setNewColGold] = useState('#C59B27');
  const [newColShield, setNewColShield] = useState<string>('');

  // Mandatory Administrator Details for New College
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRandom4Digits, setAdminRandom4Digits] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );
  const [adminPass, setAdminPass] = useState(() => generateRandomPassword());
  const [adminPhone, setAdminPhone] = useState('');

  const previewAdminUsername = adminName.trim()
    ? generateTutorUsername(adminName, adminRandom4Digits)
    : '';

  // Branding Editor Temp State
  const [tempPrimary, setTempPrimary] = useState('#0B2545');
  const [tempGold, setTempGold] = useState('#C59B27');
  const [tempShieldUrl, setTempShieldUrl] = useState('');

  const filteredColleges = colleges.filter((col) => {
    const matchesSearch =
      col.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.codigoCCT.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.director.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'todos' || col.plan === filterPlan;
    const matchesPayment = filterPayment === 'todos' || col.estadoPago === filterPayment;
    return matchesSearch && matchesPlan && matchesPayment;
  });

  // Handle Shield File Upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new' | 'branding'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageFile(file, 512, 512, 0.9);
      if (target === 'new') {
        setNewColShield(dataUrl);
      } else {
        setTempShieldUrl(dataUrl);
      }
    } catch (err) {
      console.error('Error al comprimir escudo:', err);
    }
  };

  const handleOpenBranding = (college: College) => {
    setBrandingModalCollege(college);
    setTempPrimary(college.colores.primario);
    setTempGold(college.colores.secundario);
    setTempShieldUrl(college.escudoUrl);
  };

  const handleSaveBranding = async () => {
    if (!brandingModalCollege) return;
    await updateCollege(brandingModalCollege.id, {
      colores: {
        primario: tempPrimary,
        secundario: tempGold,
        textoCabecera: "#FFFFFF",
      },
      escudoUrl: tempShieldUrl,
    });
    await updateCollegeBranding(brandingModalCollege.id, tempShieldUrl, tempPrimary, tempGold);
    setBrandingModalCollege(null);
  };

  const handleCreateCollegeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !adminName.trim() || !adminEmail.trim()) {
      alert('Por favor completa el nombre del colegio y los datos del Administrador obligatorio.');
      return;
    }

    const { college, adminUser } = addCollege(
      {
        nombre: newColName.trim(),
        codigoCCT: newColCCT.trim() || `CCT-09PES${Math.floor(1000 + Math.random() * 9000)}B`,
        lema: newColLema.trim(),
        nivel: newColNivel,
        plan: newColPlan,
        estadoPago: newColPayment,
        montoMensual: newColMonto,
        telefono: newColPhone.trim(),
        correo: newColEmail.trim() || adminEmail.trim(),
        direccion: newColAddress.trim(),
        colores: {
          primario: newColPrimary,
          secundario: newColGold,
          textoCabecera: '#FFFFFF',
        },
        escudoUrl: newColShield ? newColShield.trim() : '',
      },
      {
        nombre: adminName.trim(),
        correo: adminEmail.trim(),
        usuarioLogin: generateTutorUsername(adminName.trim(), adminRandom4Digits),
        password: adminPass || generateRandomPassword(),
        telefono: adminPhone.trim(),
      }
    );

    setCreatedCollegeCredentials({
      collegeName: college.nombre,
      adminName: adminUser.nombre,
      adminEmail: adminUser.correo,
      username: adminUser.usuarioLogin || '',
      password: adminUser.password || adminPass || '',
    });

    // Reset form
    setNewColName('');
    setNewColCCT('');
    setNewColLema('');
    setNewColShield('');
    setAdminName('');
    setAdminEmail('');
    setAdminRandom4Digits(String(Math.floor(1000 + Math.random() * 9000)));
    setAdminPass(generateRandomPassword());
    setAdminPhone('');
    setIsAddModalOpen(false);
  };

  const primaryColor = activeCollege?.colores?.primario || '#0B2545';
  const goldColor = activeCollege?.colores?.secundario || '#DFB743';

  return (
    <div className="space-y-6">
      {/* Top Bar / Header Banner */}
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
              Directorio de Planteles
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" style={{ color: goldColor }} />
            Módulo de Colegios e Instituciones
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            Registra y administra instituciones escolares, habilita o restringe módulos según el pago
            y personaliza el escudo y colores de cada plantel.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Agregar Nuevo Colegio</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, CCT o director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="todos">Todos los Planes</option>
            <option value="Básico">Plan Básico</option>
            <option value="Estándar">Plan Estándar</option>
            <option value="Institucional Pro">Institucional Pro</option>
            <option value="Campus Elite">Campus Elite</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="todos">Todos los Estados de Pago</option>
            <option value="al_corriente">Al Corriente</option>
            <option value="proximo_a_vencer">Próximo a Vencer</option>
            <option value="vencido">Pago Vencido</option>
          </select>
        </div>
      </div>

      {/* College Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredColleges.map((col) => {
          const admin = users.find((u) => u.id === col.adminUserId);
          const enabledModulesCount = col.modulosHabilitados?.length || 0;

          return (
            <div
              key={col.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header with College Branding Strip */}
              <div
                className="p-5 border-b border-slate-200 transition-colors"
                style={{
                  borderTop: `6px solid ${col.colores.primario}`,
                  backgroundColor: `${col.colores.primario}05`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* College Shield (Only shown if uploaded) */}
                    {col.escudoUrl && (
                      <div className="relative group">
                        <img
                          src={col.escudoUrl}
                          alt={col.nombre}
                          className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
                        />
                        <button
                          onClick={() => handleOpenBranding(col)}
                          className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity"
                          title="Personalizar Escudo y Colores"
                        >
                          <Palette className="w-5 h-5 text-amber-300" />
                        </button>
                      </div>
                    )}

                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {col.nombre}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{col.codigoCCT}</span>
                        <span>·</span>
                        <span>{col.nivel}</span>
                      </div>
                      {col.lema && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          "{col.lema}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment status badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                      col.estadoPago === 'al_corriente'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : col.estadoPago === 'proximo_a_vencer'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {col.estadoPago === 'al_corriente'
                      ? 'Al corriente'
                      : col.estadoPago === 'proximo_a_vencer'
                      ? 'Próx. a vencer'
                      : 'Pago vencido'}
                  </span>
                </div>
              </div>

              {/* Card Body: Details & Statistics */}
              <div className="p-5 space-y-4 text-xs md:text-sm flex-1">
                {/* Metrics mini row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Alumnos
                    </span>
                    <span className="font-display font-bold text-slate-900 text-sm">
                      {col.alumnosTotales}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Docentes
                    </span>
                    <span className="font-display font-bold text-slate-900 text-sm">
                      {col.docentesTotales}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Plan / Cuota
                    </span>
                    <span className="font-display font-bold text-slate-900 text-sm">
                      ${col.montoMensual.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Administrator Assigned (Crucial requirement) */}
                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-900 block">
                      Administrador del Colegio:
                    </span>
                    <span className="font-medium text-slate-800 text-xs">
                      {admin ? admin.nombre : col.director}
                    </span>
                    {admin?.usuarioLogin && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                          Usuario: {admin.usuarioLogin}
                        </span>
                        {admin.password && (
                          <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            Pass: {admin.password}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      {admin ? admin.correo : col.correo}
                    </span>
                  </div>
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                </div>

                {/* Modules Summary & Control Button */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Módulos Habilitados ({enabledModulesCount}/13)
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {col.modulosHabilitados?.slice(0, 5).map((mId) => {
                        const m = AVAILABLE_MODULES.find((mod) => mod.id === mId);
                        return (
                          <span
                            key={mId}
                            className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                          >
                            {m?.label || mId}
                          </span>
                        );
                      })}
                      {enabledModulesCount > 5 && (
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                          +{enabledModulesCount - 5} más
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setModulesModalCollege(col)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Gestionar Módulos</span>
                  </button>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenBranding(col)}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition-colors"
                    title="Personalizar Escudo y Colores"
                  >
                    <Palette className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    onClick={() => setEditingCollege(col)}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition-colors"
                    title="Editar Datos del Colegio"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Estás seguro de eliminar el colegio "${col.nombre}"? Esta acción borrará sus usuarios y registros asociados.`
                        )
                      ) {
                        deleteCollege(col.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-rose-50 text-rose-600 transition-colors"
                    title="Eliminar Colegio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary CTA: Enter this college dashboard */}
                <button
                  onClick={() => {
                    setSelectedCollegeId(col.id);
                    onNavigateTab('colegio_resumen');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
                  style={{
                    backgroundColor: col.colores.primario,
                  }}
                >
                  <span>Ingresar a este Colegio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: GESTOR DE MÓDULOS POR COLEGIO (ENABLE / RESTRICT)     */}
      {/* ============================================================ */}
      {modulesModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {modulesModalCollege.escudoUrl && (
                  <img
                    src={modulesModalCollege.escudoUrl}
                    alt={modulesModalCollege.nombre}
                    className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5"
                  />
                )}
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Administrar Módulos: {modulesModalCollege.nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Habilita o restringe módulos según el pago o suscripción del colegio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModulesModalCollege(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets row */}
            <div className="p-3 bg-amber-50/60 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-amber-900">
                Ajustar según Plan de Pago:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const basic = AVAILABLE_MODULES.filter(
                      (m) => m.requierePlanMinimo === 'Básico'
                    ).map((m) => m.id);
                    updateCollege(modulesModalCollege.id, {
                      modulosHabilitados: basic,
                      plan: 'Básico',
                    });
                    setModulesModalCollege((prev) =>
                      prev ? { ...prev, modulosHabilitados: basic, plan: 'Básico' } : null
                    );
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-300 font-medium text-slate-700"
                >
                  Plan Básico
                </button>
                <button
                  onClick={() => {
                    const estandar = AVAILABLE_MODULES.filter(
                      (m) =>
                        m.requierePlanMinimo === 'Básico' ||
                        m.requierePlanMinimo === 'Estándar'
                    ).map((m) => m.id);
                    updateCollege(modulesModalCollege.id, {
                      modulosHabilitados: estandar,
                      plan: 'Estándar',
                    });
                    setModulesModalCollege((prev) =>
                      prev ? { ...prev, modulosHabilitados: estandar, plan: 'Estándar' } : null
                    );
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-300 font-medium text-slate-700"
                >
                  Plan Estándar
                </button>
                <button
                  onClick={() => {
                    const all = AVAILABLE_MODULES.map((m) => m.id);
                    updateCollege(modulesModalCollege.id, {
                      modulosHabilitados: all,
                      plan: 'Campus Elite',
                    });
                    setModulesModalCollege((prev) =>
                      prev ? { ...prev, modulosHabilitados: all, plan: 'Campus Elite' } : null
                    );
                  }}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
                >
                  Activar Todos (Elite)
                </button>
              </div>
            </div>

            {/* Modules List with Toggle Switches */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-2">
              {AVAILABLE_MODULES.map((mod) => {
                const isEnabled = (modulesModalCollege.modulosHabilitados || []).includes(mod.id);

                return (
                  <div
                    key={mod.id}
                    className="pt-2 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs md:text-sm">
                          {mod.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal px-1.5 py-0.2 bg-slate-100 rounded">
                          {mod.categoria}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{mod.descripcion}</p>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => {
                        toggleModule(modulesModalCollege.id, mod.id, !isEnabled);
                        setModulesModalCollege((prev) => {
                          if (!prev) return null;
                          const current = prev.modulosHabilitados;
                          const next = !isEnabled
                            ? [...current, mod.id]
                            : current.filter((id) => id !== mod.id);
                          return { ...prev, modulosHabilitados: next };
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Los cambios se reflejan inmediatamente en el panel y menú del colegio.
              </span>
              <button
                onClick={() => setModulesModalCollege(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] rounded-lg hover:bg-[#123B6B]"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: PERSONALIZAR ESCUDO Y COLORES DEL COLEGIO            */}
      {/* ============================================================ */}
      {brandingModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Personalizar Escudo y Colores: {brandingModalCollege.nombre}
                </h3>
              </div>
              <button
                onClick={() => setBrandingModalCollege(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Escudo Uploader */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Escudo Oficial de la Institución
                </label>
                <div className="flex items-center gap-4">
                  {(tempShieldUrl || brandingModalCollege.escudoUrl) && (
                    <img
                      src={tempShieldUrl || brandingModalCollege.escudoUrl}
                      alt="Escudo"
                      className="w-20 h-20 object-contain rounded-xl border border-slate-300 p-1.5 bg-white shadow-xs"
                    />
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer border border-slate-300 transition-colors">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Subir Imagen o SVG del Escudo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'branding')}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Este escudo aparecerá en la cabecera, sidebar y en todos los reportes y boletas
                      oficiales del colegio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Color Primario del Colegio
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tempPrimary}
                      onChange={(e) => setTempPrimary(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={tempPrimary}
                      onChange={(e) => setTempPrimary(e.target.value)}
                      className="w-28 text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Para barras, encabezados y títulos
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Color Secundario / Dorado
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tempGold}
                      onChange={(e) => setTempGold(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={tempGold}
                      onChange={(e) => setTempGold(e.target.value)}
                      className="w-28 text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Para acentos, botones y sellos
                  </span>
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Vista Previa del Estilo Institucional
                </label>
                <div
                  className="p-4 rounded-xl border border-slate-200 transition-colors flex items-center justify-between"
                  style={{
                    backgroundColor: `${tempPrimary}0d`,
                    borderLeft: `6px solid ${tempPrimary}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {(tempShieldUrl || brandingModalCollege.escudoUrl) && (
                      <img
                        src={tempShieldUrl || brandingModalCollege.escudoUrl}
                        alt="Preview"
                        className="w-10 h-10 object-contain rounded bg-white p-0.5 border"
                      />
                    )}
                    <div>
                      <h4
                        className="font-bold text-sm"
                        style={{ color: tempPrimary }}
                      >
                        {brandingModalCollege.nombre}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Boleta Oficial de Evaluación · Ciclo 2026-2027
                      </p>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs"
                    style={{
                      backgroundColor: tempGold,
                      color: tempPrimary,
                    }}
                  >
                    Botón Institucional
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setBrandingModalCollege(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBranding}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#123B6B] rounded-lg shadow-xs"
              >
                Guardar Personalización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: AGREGAR NUEVO COLEGIO (+ ADMINISTRADOR OBLIGATORIO)   */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Registrar Nueva Institución Educativa
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollegeSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: College Data */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  1. Información de la Institución
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nombre del Colegio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Instituto Pedagógico Oxford"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Clave de Centro de Trabajo (CCT)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CCT-09PES0112A"
                      value={newColCCT}
                      onChange={(e) => setNewColCCT(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nivel Educativo / Multinivel
                    </label>
                    <select
                      value={newColNivel}
                      onChange={(e) => setNewColNivel(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Preescolar">Preescolar</option>
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Preparatoria">Preparatoria</option>
                      <option value="Colegio Integral">Multinivel / Colegio Integral (Preescolar, Primaria, Secundaria y Preparatoria)</option>
                      <option value="Universidad">Universidad</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Plan Contratado
                    </label>
                    <select
                      value={newColPlan}
                      onChange={(e) => setNewColPlan(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Básico">Básico ($3,900 / mes)</option>
                      <option value="Estándar">Estándar ($6,500 / mes)</option>
                      <option value="Institucional Pro">Institucional Pro ($9,800 / mes)</option>
                      <option value="Campus Elite">Campus Elite ($14,500 / mes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Estatus de Pago
                    </label>
                    <select
                      value={newColPayment}
                      onChange={(e) => setNewColPayment(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="al_corriente">Al Corriente (Activo)</option>
                      <option value="proximo_a_vencer">Próximo a Vencer</option>
                      <option value="vencido">Pago Vencido (Módulos restringidos)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Lema Institucional
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Por la Verdad y la Sabiduría"
                      value={newColLema}
                      onChange={(e) => setNewColLema(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Colors and Shield */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                  2. Identidad Visual (Escudo y Colores)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Color Primario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColPrimary}
                        onChange={(e) => setNewColPrimary(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={newColPrimary}
                        onChange={(e) => setNewColPrimary(e.target.value)}
                        className="w-28 text-xs font-mono px-2 py-1.5 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Color Secundario (Dorado)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColGold}
                        onChange={(e) => setNewColGold(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={newColGold}
                        onChange={(e) => setNewColGold(e.target.value)}
                        className="w-28 text-xs font-mono px-2 py-1.5 border rounded"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Escudo / Logotipo
                    </label>
                    <div className="flex items-center gap-3">
                      {newColShield && (
                        <img
                          src={newColShield}
                          alt="Escudo"
                          className="w-12 h-12 object-contain rounded border p-1"
                        />
                      )}
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer border border-slate-300">
                        <Upload className="w-4 h-4 text-slate-600" />
                        <span>Subir Imagen o SVG del Escudo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'new')}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">
                        (Opcional: si no se sube un escudo, no se mostrará imagen)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: MANDATORY ADMINISTRATOR ASSIGNMENT (User Prompt Request) */}
              <div className="space-y-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    3. Administrador del Colegio (Requerido para Acceso)
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Credenciales enviadas por correo
                  </span>
                </div>

                <p className="text-xs text-amber-800/80">
                  Al registrar el colegio se generará automáticamente un <strong>usuario compuesto por la primera inicial del nombre + apellido + 4 dígitos aleatorios</strong> y se enviarán sus credenciales de acceso por correo electrónico.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Nombre Completo del Administrador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mtra. Gabriela Fuentes"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Correo Electrónico Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@colegio.edu.mx"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Usuario Generado (4 dígitos fijos en BD)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={previewAdminUsername}
                      placeholder="Se genera al escribir el nombre"
                      className="w-full px-3 py-2 text-xs md:text-sm bg-slate-100 border border-amber-300 rounded-lg font-mono font-bold text-slate-900 cursor-not-allowed"
                      title="Los 4 dígitos aleatorios se generan una sola vez y quedan guardados en la base de datos"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Contraseña Aleatoria (8 caracteres)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={8}
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setAdminPass(generateRandomPassword())}
                        className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                        title="Generar nueva contraseña de 8 caracteres"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="+52 (55) 1234-5678"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#0B2545] hover:bg-[#123B6B] rounded-xl shadow-md transition-all active:scale-98"
                >
                  Guardar y Registrar Colegio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: EDITAR DATOS DEL COLEGIO                             */}
      {/* ============================================================ */}
      {editingCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-900">
                Editar Datos: {editingCollege.nombre}
              </h3>
              <button
                onClick={() => setEditingCollege(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingCollege.nombre}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Director</label>
                <input
                  type="text"
                  value={editingCollege.director}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, director: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nivel Educativo / Multinivel
                </label>
                <select
                  value={editingCollege.nivel}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, nivel: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Preescolar">Preescolar</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Preparatoria">Preparatoria</option>
                  <option value="Colegio Integral">Multinivel / Colegio Integral (Todos los niveles)</option>
                  <option value="Universidad">Universidad</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plan</label>
                  <select
                    value={editingCollege.plan}
                    onChange={(e) =>
                      setEditingCollege({ ...editingCollege, plan: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Estándar">Estándar</option>
                    <option value="Institucional Pro">Institucional Pro</option>
                    <option value="Campus Elite">Campus Elite</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado de Pago</label>
                  <select
                    value={editingCollege.estadoPago}
                    onChange={(e) =>
                      setEditingCollege({
                        ...editingCollege,
                        estadoPago: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="al_corriente">Al corriente</option>
                    <option value="proximo_a_vencer">Próximo a vencer</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Monto Mensual (MXN)
                </label>
                <input
                  type="number"
                  value={editingCollege.montoMensual}
                  onChange={(e) =>
                    setEditingCollege({
                      ...editingCollege,
                      montoMensual: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setEditingCollege(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateCollege(editingCollege.id, editingCollege);
                  setEditingCollege(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] rounded-lg hover:bg-[#123B6B]"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: CREDENCIALES GENERADAS Y ENVIADAS POR CORREO          */}
      {/* ============================================================ */}
      {createdCollegeCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-[#0B2545] text-white flex items-center justify-between border-b-4 border-[#DFB743]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#DFB743]" />
                <div>
                  <h3 className="font-display font-bold text-base">
                    ¡Colegio Registrado con Éxito!
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Credenciales generadas y enviadas por correo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedCollegeCredentials(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  Se enviaron las credenciales de acceso al correo{' '}
                  <strong className="font-mono">{createdCollegeCredentials.adminEmail}</strong> para la institución{' '}
                  <strong>{createdCollegeCredentials.collegeName}</strong>.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Administrador Asignado
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {createdCollegeCredentials.adminName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Usuario Generado (Inicial Nombre + Apellido + 4 Dígitos)
                  </span>
                  <span className="font-mono font-black text-base text-[#0B2545] bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 inline-block mt-0.5">
                    {createdCollegeCredentials.username}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Correo Electrónico
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {createdCollegeCredentials.adminEmail}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Contraseña de Acceso
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 inline-block mt-0.5">
                    {createdCollegeCredentials.password}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setCreatedCollegeCredentials(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B2545] rounded-xl hover:bg-[#123B6B] cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
