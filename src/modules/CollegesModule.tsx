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
  Power,
  KeyRound,
  Clock,
  AlertCircle,
  FlaskConical,
  Zap,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { AVAILABLE_MODULES, College, CollegeModuleId, CollegeOperationType, PaymentStatus, PlanType } from '../types';
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
    updateUser,
    currentUser,
    isSuperuserSession,
    addCollege,
    updateCollege,
    deleteCollege,
    verifyCollegeDeletionKey,
    toggleCollegeActiveStatus,
    toggleModule,
    updateCollegeBranding,
    setSelectedCollegeId,
    sendEmailNotification,
    deactivateCollegeSupportMode,
  } = useApp();

  const isSuperUser = currentUser.rol === 'superusuario' || isSuperuserSession;
  const [emailedAdminId, setEmailedAdminId] = useState<string | null>(null);

  const handleSendAdminCredentialsEmail = (
    targetAdmin: { id?: string; nombre: string; correo: string; usuarioLogin?: string; password?: string },
    collegeName: string,
    collegeId: string
  ) => {
    const resolvedUsername =
      targetAdmin.usuarioLogin || generateTutorUsername(targetAdmin.nombre, '4821');
    const resolvedPassword = targetAdmin.password || 'a4Km9xP2';

    sendEmailNotification({
      colegioId: collegeId,
      colegioNombre: collegeName,
      destinatarios: [targetAdmin.correo],
      rolesDestino: ['administrador'],
      usuariosDestino: [targetAdmin.id || targetAdmin.correo, targetAdmin.correo, resolvedUsername],
      asunto: `[My College] Envío de Credenciales de Administrador (${collegeName})`,
      cuerpo:
        `Estimado(a) ${targetAdmin.nombre}:\n\n` +
        `En atención a su solicitud, le enviamos sus credenciales oficiales de Administrador para el plantel "${collegeName}" en la plataforma My College.\n\n` +
        `=== CREDENCIALES DE ACCESO ===\n` +
        `• Portal de Acceso: https://dashboard.mycollege.com.mx\n` +
        `• Institución: ${collegeName}\n` +
        `• Perfil: Administrador de Colegio\n` +
        `• Usuario de Acceso: ${resolvedUsername}\n` +
        `• Contraseña: ${resolvedPassword}\n\n` +
        `Por seguridad, sus credenciales permanecen ocultas en la plataforma y se envían únicamente a su correo electrónico registrado.`,
      categoria: 'seguridad',
      prioridad: 'alta',
    });

    const keyId = targetAdmin.id || collegeId;
    setEmailedAdminId(keyId);
    setFeedbackNotice({
      type: 'success',
      text: `Se enviaron las credenciales del Administrador (${targetAdmin.nombre}) al correo ${targetAdmin.correo}.`,
    });
    setTimeout(() => setEmailedAdminId(null), 2500);
    setTimeout(() => setFeedbackNotice(null), 4500);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('todos');
  const [filterPayment, setFilterPayment] = useState<string>('todos');
  const [filterModoPrueba, setFilterModoPrueba] = useState<string>('todos');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(openAddModalInitially);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [modulesModalCollege, setModulesModalCollege] = useState<College | null>(null);
  const [brandingModalCollege, setBrandingModalCollege] = useState<College | null>(null);
  const [deleteTargetCollege, setDeleteTargetCollege] = useState<College | null>(null);
  const [deleteKeyInput, setDeleteKeyInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [statusModalCollege, setStatusModalCollege] = useState<College | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (!deleteTargetCollege) return;
    const interval = setInterval(() => {
      setNowTs(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [deleteTargetCollege]);

  const handleOpenDeleteModal = (col: College) => {
    if (!isSuperUser) return;
    setDeleteTargetCollege(col);
    setDeleteKeyInput('');
    setDeleteError(null);
    setNowTs(Date.now());
  };

  const handleConfirmDeleteCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetCollege || !isSuperUser) return;
    setDeleteError(null);
    setIsVerifyingDelete(true);

    try {
      const result = await verifyCollegeDeletionKey(deleteTargetCollege.id, deleteKeyInput);
      if (!result.valid) {
        setDeleteError(
          result.message ||
            'Clave inválida o expirada. Solicita una nueva clave de 1 minuto al administrador del colegio.'
        );
        setIsVerifyingDelete(false);
        return;
      }

      const deletedName = deleteTargetCollege.nombre;
      deleteCollege(deleteTargetCollege.id);
      setDeleteTargetCollege(null);
      setDeleteKeyInput('');
      setFeedbackNotice({
        type: 'success',
        text: `El colegio "${deletedName}" y toda su información han sido dados de baja y eliminados permanentemente de la base de datos.`,
      });
      setTimeout(() => setFeedbackNotice(null), 6000);
    } finally {
      setIsVerifyingDelete(false);
    }
  };

  const handleConfirmToggleStatus = () => {
    if (!statusModalCollege || !isSuperUser) return;
    const nextActive = statusModalCollege.activo === false ? true : false;
    toggleCollegeActiveStatus(statusModalCollege.id, nextActive);
    setFeedbackNotice({
      type: nextActive ? 'success' : 'warning',
      text: nextActive
        ? `El colegio "${statusModalCollege.nombre}" ha sido ACTIVADO. Todos sus perfiles y usuarios tienen acceso restablecido.`
        : `El colegio "${statusModalCollege.nombre}" ha sido DESACTIVADO temporalmente. No se eliminó ninguna información; únicamente se restringió el acceso a todos sus perfiles y usuarios hasta cambiar su estatus a activo.`,
    });
    setStatusModalCollege(null);
    setTimeout(() => setFeedbackNotice(null), 6000);
  };
  const [createdCollegeCredentials, setCreatedCollegeCredentials] = useState<{
    collegeName: string;
    adminName: string;
    adminEmail: string;
    username: string;
    password: string;
  } | null>(null);

  // Available Educational Levels for Colleges
  const AVAILABLE_COLLEGE_LEVELS = [
    { id: 'Preescolar', label: 'Preescolar', desc: 'Kinder y educación inicial' },
    { id: 'Primaria', label: 'Primaria', desc: 'Educación primaria básica' },
    { id: 'Secundaria', label: 'Secundaria', desc: 'Educación media básica' },
    { id: 'Preparatoria', label: 'Preparatoria', desc: 'Bachillerato y educación media superior' },
    { id: 'Universidad', label: 'Universidad', desc: 'Educación superior y licenciaturas' },
  ];

  // Add College Form State
  const [newColName, setNewColName] = useState('');
  const [newColCCT, setNewColCCT] = useState('');
  const [newColLema, setNewColLema] = useState('');
  const [newColNiveles, setNewColNiveles] = useState<string[]>(['Primaria']);
  const [editingColNiveles, setEditingColNiveles] = useState<string[]>(['Primaria']);

  const openEditCollegeModal = (college: College) => {
    setEditingCollege(college);
    const initialNiveles =
      college.niveles && college.niveles.length > 0
        ? college.niveles
        : college.nivel === 'Colegio Integral'
        ? ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria']
        : [college.nivel || 'Primaria'];
    setEditingColNiveles(initialNiveles);
  };

  const toggleNewColNivel = (lvl: string) => {
    setNewColNiveles((prev) => {
      if (prev.includes(lvl)) {
        if (prev.length <= 1) return prev; // At least one level must be selected
        return prev.filter((l) => l !== lvl);
      }
      return [...prev, lvl];
    });
  };

  const toggleEditingColNivel = (lvl: string) => {
    setEditingColNiveles((prev) => {
      let next: string[];
      if (prev.includes(lvl)) {
        if (prev.length <= 1) return prev; // At least one level must be selected
        next = prev.filter((l) => l !== lvl);
      } else {
        next = [...prev, lvl];
      }
      const nextNivel: College['nivel'] =
        next.length > 1 ? 'Colegio Integral' : (next[0] as College['nivel']) || 'Primaria';
      if (editingCollege) {
        setEditingCollege({
          ...editingCollege,
          nivel: nextNivel,
          niveles: next,
        });
      }
      return next;
    });
  };

  const [newColOperacion, setNewColOperacion] = useState<CollegeOperationType>('demo');
  const [newColModoSoporte, setNewColModoSoporte] = useState<boolean>(true);
  const [newColModoPrueba, setNewColModoPrueba] = useState<boolean>(false);
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
    const matchesModoPrueba =
      filterModoPrueba === 'todos' ||
      (filterModoPrueba === 'prueba' ? Boolean(col.modoPrueba) : !col.modoPrueba);
    return matchesSearch && matchesPlan && matchesPayment && matchesModoPrueba;
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

    const computedNivel: College['nivel'] =
      newColNiveles.length > 1 ? 'Colegio Integral' : (newColNiveles[0] as College['nivel']) || 'Primaria';

    const { college, adminUser } = addCollege(
      {
        nombre: newColName.trim(),
        codigoCCT: newColCCT.trim() || `CCT-09PES${Math.floor(1000 + Math.random() * 9000)}B`,
        lema: newColLema.trim(),
        nivel: computedNivel,
        niveles: newColNiveles,
        operacion: newColOperacion,
        modoSoporteActivo: newColModoSoporte,
        modoSoporteDesactivadoPermanentemente: !newColModoSoporte,
        plan: newColPlan,
        estadoPago: newColPayment,
        montoMensual: newColOperacion === 'demo' ? 0 : newColMonto,
        telefono: newColPhone.trim(),
        correo: newColEmail.trim() || adminEmail.trim(),
        direccion: newColAddress.trim(),
        modoPrueba: newColModoPrueba,
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
    setNewColNiveles(['Primaria']);
    setNewColOperacion('demo');
    setNewColModoSoporte(true);
    setNewColModoPrueba(false);
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

      {/* Feedback Banner for Delete or Deactivate/Activate actions */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

          {/* Modo Prueba Filter */}
          <select
            value={filterModoPrueba}
            onChange={(e) => setFilterModoPrueba(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-purple-300 bg-purple-50 text-purple-900 font-semibold focus:outline-none"
          >
            <option value="todos">Todos los Modos</option>
            <option value="prueba">Modo Prueba (Simulación)</option>
            <option value="produccion">Modo Regular / Producción</option>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-base text-slate-900">
                          {col.nombre}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            col.activo !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {col.activo !== false ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>Desactivado</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{col.codigoCCT}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700">{col.nivel}</span>
                        {col.niveles && col.niveles.length > 1 && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-bold">
                            {col.niveles.length} niveles: {col.niveles.join(', ')}
                          </span>
                        )}
                      </div>
                      {col.lema && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          "{col.lema}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Operación & Modo Soporte badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {col.operacion === 'demo' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>
                          Operación: Demo (Vence: {col.fechaExpiracionDemo || '1 mes'})
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Operación: Plan (Permanente)</span>
                      </span>
                    )}

                    {col.modoPrueba && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs"
                        title="Colegio en Modo Prueba con botones automáticos de simulación de pagos de pasarela"
                      >
                        <FlaskConical className="w-3 h-3 text-purple-700" />
                        <span>Modo Prueba · Pasarela Demo</span>
                      </span>
                    )}

                    {col.modoSoporteActivo && !col.modoSoporteDesactivadoPermanentemente ? (
                      <button
                        type="button"
                        onClick={() => {
                          deactivateCollegeSupportMode(col.id);
                          setFeedbackNotice({
                            type: 'warning',
                            text: `Modo Soporte desactivado permanentemente en "${col.nombre}". A partir de ahora se requiere autorización del Administrador para ingresar.`,
                          });
                          setTimeout(() => setFeedbackNotice(null), 6000);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 hover:bg-rose-100 text-sky-900 hover:text-rose-800 border border-sky-300 hover:border-rose-300 transition-colors cursor-pointer"
                        title="Haz clic para desactivar el Modo Soporte (una vez desactivado ya no se puede volver a activar)"
                      >
                        <Shield className="w-3 h-3 text-sky-700" />
                        <span>Modo Soporte Activo · Desactivar</span>
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                        title="El Modo Soporte está desactivado y requiere autorización del Administrador para ingresar"
                      >
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        <span>Modo Soporte Inactivo (Requiere autorización)</span>
                      </span>
                    )}
                  </div>
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
                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-blue-900 block">
                      Administrador del Colegio:
                    </span>
                    <span className="font-medium text-slate-800 text-xs block truncate">
                      {admin ? admin.nombre : col.director}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">
                      {admin ? admin.correo : col.correo}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {admin && (
                        <button
                          type="button"
                          onClick={() => updateUser(admin.id, { activo: !admin.activo })}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            admin.activo !== false
                              ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-800 border-emerald-200 hover:border-rose-300'
                              : 'bg-rose-100 hover:bg-emerald-50 text-rose-800 hover:text-emerald-800 border-rose-300 hover:border-emerald-200'
                          }`}
                          title={
                            admin.activo !== false
                              ? 'Clic para poner al usuario Administrador como Inactivo (negar acceso)'
                              : 'Clic para reactivar al usuario Administrador (permitir acceso)'
                          }
                        >
                          <Power className="w-2.5 h-2.5" />
                          <span>
                            {admin.activo !== false
                              ? 'Admin Activo'
                              : 'Admin Inactivo (Sin acceso)'}
                          </span>
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        <span>Credenciales ocultas</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendAdminCredentialsEmail(
                            admin || {
                              nombre: col.director,
                              correo: col.correo,
                            },
                            col.nombre,
                            col.id
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          emailedAdminId === (admin?.id || col.id)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                        }`}
                        title="Enviar credenciales de acceso al correo del administrador"
                      >
                        {emailedAdminId === (admin?.id || col.id) ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>¡Enviadas al correo!</span>
                          </>
                        ) : (
                          <span>Enviar por correo</span>
                        )}
                      </button>
                    </div>
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
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleOpenBranding(col)}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition-colors cursor-pointer"
                    title="Personalizar Escudo y Colores"
                  >
                    <Palette className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    onClick={() => openEditCollegeModal(col)}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition-colors cursor-pointer"
                    title="Editar Datos del Colegio"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>

                  {isSuperUser && (
                    <>
                      <button
                        onClick={() => setStatusModalCollege(col)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                          col.activo !== false
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                        title={
                          col.activo !== false
                            ? 'Desactivar colegio: restringe todos los accesos sin eliminar información'
                            : 'Activar colegio: restablece el acceso a todos los perfiles y usuarios'
                        }
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>
                          {col.activo !== false ? 'Desactivar Colegio' : 'Activar Colegio'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(col)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors cursor-pointer shadow-2xs"
                        title="Eliminar colegio definitivamente (solicita clave de 1 minuto generada por el administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Colegio</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Primary CTA: Enter this college dashboard */}
                <button
                  onClick={() => {
                    if (col.activo === false) {
                      if (isSuperUser) setStatusModalCollege(col);
                      return;
                    }
                    setSelectedCollegeId(col.id);
                    onNavigateTab('colegio_resumen');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all cursor-pointer ${
                    col.activo === false ? 'bg-slate-400 opacity-85' : 'active:scale-98'
                  }`}
                  style={
                    col.activo !== false
                      ? {
                          backgroundColor: col.colores.primario,
                        }
                      : undefined
                  }
                >
                  {col.activo === false ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Colegio Desactivado</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar a este Colegio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Registrar Nueva Institución Educativa
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="create-college-form"
              onSubmit={handleCreateCollegeSubmit}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
            >
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

                  {/* Educational Levels Selection via Checkboxes */}
                  <div className="md:col-span-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-600" />
                        <span>Nivel Educativo / Niveles que Maneja *</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        (Selecciona uno o más niveles)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_COLLEGE_LEVELS.map((lvl) => {
                        const isChecked = newColNiveles.includes(lvl.id);
                        return (
                          <label
                            key={lvl.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                              isChecked
                                ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-2xs font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleNewColNivel(lvl.id)}
                              className="w-4 h-4 mt-0.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="block leading-tight font-bold">{lvl.label}</span>
                              <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                                {lvl.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Automatic Multinivel Calculation Feedback */}
                    {newColNiveles.length > 1 ? (
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2 text-xs text-purple-900 animate-in fade-in">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>
                          <strong>Colegio Multinivel / Integral activado automáticamente:</strong> Maneja {newColNiveles.length} niveles educativos ({newColNiveles.join(', ')}).
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-900 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>Nivel Único:</strong> Operará exclusivamente con el nivel de <strong>{newColNiveles[0] || 'Primaria'}</strong>.
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Operación *
                    </label>
                    <select
                      value={newColOperacion}
                      onChange={(e) => setNewColOperacion(e.target.value as CollegeOperationType)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="demo">1.- Demo (Duración de 1 mes a partir del alta)</option>
                      <option value="plan">2.- Plan (Permanente, sin tiempo de expiración)</option>
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {newColOperacion === 'demo'
                        ? 'Duración de 1 mes a partir de la fecha en que se cree el colegio en la plataforma.'
                        : 'Operación permanente sin tiempo de expiración.'}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Modo Soporte (Única vez al dar de alta)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewColModoSoporte((prev) => !prev)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs md:text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        newColModoSoporte
                          ? 'bg-sky-50 border-sky-400 text-sky-900'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Shield
                          className={`w-4 h-4 ${
                            newColModoSoporte ? 'text-sky-600' : 'text-slate-400'
                          }`}
                        />
                        <span>
                          {newColModoSoporte
                            ? 'Modo Soporte: ACTIVO (Acceso sin autorización)'
                            : 'Modo Soporte: INACTIVO (Requiere autorización)'}
                        </span>
                      </span>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                          newColModoSoporte ? 'bg-sky-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                            newColModoSoporte ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </span>
                    </button>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Si está activo, el usuario de soporte puede ingresar sin autorización del administrador para ayudarlo a dar de alta grupos, docentes, etc. Solo se puede activar al dar de alta el colegio y una vez desactivado ya no se puede volver a activar.
                    </span>
                  </div>

                  {/* Campo Colegio en modo prueba para simulación automática de pagos */}
                  <div className="md:col-span-2 p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/80 to-indigo-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FlaskConical className="w-4 h-4 text-purple-700" />
                          <span className="text-xs font-extrabold text-purple-950">
                            Colegio en modo prueba (Demostración de Pasarela de Pagos)
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                            Demostración a Clientes
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-900/80 leading-relaxed">
                          Al activar esta opción, este colegio incluirá <strong>botones añadidos de forma automática</strong> en los módulos de cobro (colegiaturas de tutores, cuotas y cafetería escolar) para simular pagos exitosos de pasarela (Stripe, SPEI instantáneo, 3D Secure y declinaciones bancarias) sin realizar cargos reales, especialmente diseñado para demostraciones en vivo a clientes.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNewColModoPrueba((prev) => !prev)}
                        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl border text-xs md:text-sm font-bold flex items-center justify-between gap-3 transition-all cursor-pointer shrink-0 shadow-xs ${
                          newColModoPrueba
                            ? 'bg-purple-600 border-purple-700 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className={`w-3.5 h-3.5 ${newColModoPrueba ? 'text-amber-300' : 'text-slate-400'}`} />
                          <span>{newColModoPrueba ? 'Modo Prueba: ACTIVO' : 'Modo Prueba: INACTIVO'}</span>
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                            newColModoPrueba ? 'bg-purple-800' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ${
                              newColModoPrueba ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    </div>
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

                  <div className="md:col-span-2 p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Las credenciales de acceso (usuario y contraseña de 8 caracteres) permanecerán ocultas y se enviarán directamente al correo del Administrador.
                      </span>
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
            </form>

            {/* Pinned Sticky Footer for Add College */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="create-college-form"
                className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#0B2545] hover:bg-[#123B6B] rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
              >
                Guardar y Registrar Colegio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: EDITAR DATOS DEL COLEGIO                             */}
      {/* ============================================================ */}
      {editingCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Edit2 className="w-4 h-4 text-slate-600 shrink-0" />
                <h3 className="font-display font-bold text-base text-slate-900 truncate">
                  Editar Datos: {editingCollege.nombre}
                </h3>
              </div>
              <button
                onClick={() => setEditingCollege(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={editingCollege.nombre}
                    onChange={(e) =>
                      setEditingCollege({ ...editingCollege, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Director *</label>
                  <input
                    type="text"
                    value={editingCollege.director}
                    onChange={(e) =>
                      setEditingCollege({ ...editingCollege, director: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Educational Levels Selection via Checkboxes (Edit College) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <span>Nivel Educativo / Niveles que Maneja *</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    (Selecciona mediante checkbox)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_COLLEGE_LEVELS.map((lvl) => {
                    const isChecked = editingColNiveles.includes(lvl.id);
                    return (
                      <label
                        key={lvl.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-2xs font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditingColNivel(lvl.id)}
                          className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="block leading-tight font-bold">{lvl.label}</span>
                          <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                            {lvl.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Automatic Multinivel Calculation Feedback */}
                {editingColNiveles.length > 1 ? (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2 text-xs text-purple-900 animate-in fade-in">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      <strong>Colegio Multinivel / Integral activado:</strong> Se clasificará como multinivel con {editingColNiveles.length} niveles ({editingColNiveles.join(', ')}).
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs text-blue-900 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Nivel Único:</strong> Operará exclusivamente con el nivel de <strong>{editingColNiveles[0] || 'Primaria'}</strong>.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Operación
                </label>
                <select
                  value={editingCollege.operacion || 'plan'}
                  onChange={(e) => {
                    const nextOp = e.target.value as CollegeOperationType;
                    let nextExp = editingCollege.fechaExpiracionDemo || '';
                    if (nextOp === 'demo' && !nextExp) {
                      const base = editingCollege.creadoEn
                        ? new Date(editingCollege.creadoEn + 'T00:00:00')
                        : new Date();
                      const d = new Date(isNaN(base.getTime()) ? Date.now() : base.getTime());
                      d.setMonth(d.getMonth() + 1);
                      nextExp = d.toISOString().split('T')[0];
                    }
                    setEditingCollege({
                      ...editingCollege,
                      operacion: nextOp,
                      fechaExpiracionDemo: nextOp === 'demo' ? nextExp : '',
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="demo">1.- Demo (1 mes a partir de la fecha de alta)</option>
                  <option value="plan">2.- Plan (Permanente, sin tiempo de expiración)</option>
                </select>
                {editingCollege.operacion === 'demo' && (
                  <div className="mt-2 flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900">
                    <div>
                      <span className="font-bold">Vencimiento de Demo (1 mes): </span>
                      <span className="font-mono">{editingCollege.fechaExpiracionDemo || 'N/A'}</span>
                    </div>
                    <input
                      type="date"
                      value={editingCollege.fechaExpiracionDemo || ''}
                      onChange={(e) =>
                        setEditingCollege({
                          ...editingCollege,
                          fechaExpiracionDemo: e.target.value,
                        })
                      }
                      className="px-2 py-1 border border-amber-300 rounded bg-white text-xs font-mono"
                      title="Fecha de finalización del mes de demostración"
                    />
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Modo Soporte
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {editingCollege.modoSoporteActivo &&
                      !editingCollege.modoSoporteDesactivadoPermanentemente
                        ? 'Activo: El usuario de Soporte ingresa sin autorización. Si lo desactivas ya no se podrá volver a activar.'
                        : 'Desactivado permanentemente: Solo se puede activar una vez al dar de alta el colegio. Se requiere autorización del Administrador.'}
                    </span>
                  </div>

                  {editingCollege.modoSoporteActivo &&
                  !editingCollege.modoSoporteDesactivadoPermanentemente ? (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingCollege({
                          ...editingCollege,
                          modoSoporteActivo: false,
                          modoSoporteDesactivadoPermanentemente: true,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Desactivar Modo Soporte
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 font-bold text-[11px] shrink-0 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado / Inactivo</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-700" />
                      <span className="font-bold text-purple-950 text-xs">
                        Colegio en Modo Prueba (Demostración de Pasarela)
                      </span>
                    </div>
                    <span className="text-[11px] text-purple-900/80 block mt-0.5">
                      {editingCollege.modoPrueba
                        ? 'Activo: Añade botones automáticos de pago simulado en colegiaturas y cafetería para demostraciones comerciales.'
                        : 'Inactivo: Opera en modo regular con pasarela bancaria normal.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingCollege({
                        ...editingCollege,
                        modoPrueba: !editingCollege.modoPrueba,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${
                      editingCollege.modoPrueba ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                        editingCollege.modoPrueba ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setEditingCollege(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalNivel: College['nivel'] =
                    editingColNiveles.length > 1
                      ? 'Colegio Integral'
                      : (editingColNiveles[0] as College['nivel']) || 'Primaria';
                  updateCollege(editingCollege.id, {
                    ...editingCollege,
                    nivel: finalNivel,
                    niveles: editingColNiveles,
                  });
                  setEditingCollege(null);
                }}
                className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#0B2545] hover:bg-[#123B6B] rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
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
                    Correo Electrónico
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {createdCollegeCredentials.adminEmail}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Credenciales de Acceso
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded border border-slate-300 mt-0.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ocultas por seguridad · Enviadas por correo</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleSendAdminCredentialsEmail(
                    {
                      nombre: createdCollegeCredentials.adminName,
                      correo: createdCollegeCredentials.adminEmail,
                      usuarioLogin: createdCollegeCredentials.username,
                      password: createdCollegeCredentials.password,
                    },
                    createdCollegeCredentials.collegeName,
                    'global'
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Reenviar Credenciales por Correo</span>
              </button>
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

      {/* ========================================================================= */}
      {/* MODAL: DESACTIVAR / ACTIVAR COLEGIO (SIN BORRAR INFORMACIÓN)               */}
      {/* ========================================================================= */}
      {statusModalCollege && isSuperUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div
              className={`p-5 border-b flex items-center justify-between ${
                statusModalCollege.activo !== false
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    statusModalCollege.activo !== false
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {statusModalCollege.activo !== false ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Unlock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {statusModalCollege.activo !== false
                      ? 'Desactivar Colegio Temporalmente'
                      : 'Activar Colegio y Restablecer Accesos'}
                  </h3>
                  <p className="text-xs text-slate-600">{statusModalCollege.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setStatusModalCollege(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              {statusModalCollege.activo !== false ? (
                <>
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>No se eliminará ninguna información</span>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-900">
                      Al desactivar <strong>{statusModalCollege.nombre}</strong>, todos sus registros en la
                      base de datos (alumnos, calificaciones, docentes, cobros y configuraciones) se
                      conservan intactos.
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Únicamente se <strong>restringirá el acceso a todos los perfiles y usuarios</strong>{' '}
                    vinculados a este colegio (administrador, directivos, docentes, tutores y alumnos) hasta
                    que vuelvas a cambiar su estatus a <strong>Activo</strong>.
                  </p>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Restablecimiento inmediato de accesos</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-900">
                    Al cambiar el estatus de <strong>{statusModalCollege.nombre}</strong> a{' '}
                    <strong>Activo</strong>, todos sus perfiles y usuarios podrán volver a iniciar sesión y
                    operar con normalidad en la plataforma.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusModalCollege(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToggleStatus}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    statusModalCollege.activo !== false
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {statusModalCollege.activo !== false
                      ? 'Confirmar y Desactivar Colegio'
                      : 'Confirmar y Activar Colegio'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR COLEGIO CON CLAVE DE 1 MINUTO DEL ADMINISTRADOR            */}
      {/* ========================================================================= */}
      {deleteTargetCollege && isSuperUser && (() => {
        const liveCol = colleges.find((c) => c.id === deleteTargetCollege.id) || deleteTargetCollege;
        const targetAdmin = users.find((u) => u.id === liveCol.adminUserId);
        const keyExpiraEn = liveCol.claveBajaExpiraEn || 0;
        const hasKeyGenerated = Boolean(liveCol.claveBajaCodigo && keyExpiraEn > 0);
        const remainingMs = Math.max(0, keyExpiraEn - nowTs);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const isKeyCurrentlyValid = hasKeyGenerated && remainingMs > 0;
        const isKeyExpired = hasKeyGenerated && remainingMs <= 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-rose-200">
              <div className="p-5 bg-gradient-to-r from-rose-700 to-rose-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/25 shrink-0">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      Exclusivo Superusuario
                    </span>
                    <h3 className="font-display font-bold text-base sm:text-lg text-white mt-0.5">
                      Dar de Baja y Eliminar Colegio
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTargetCollege(null)}
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmDeleteCollege} className="p-6 space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                  <div className="font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Baja Definitiva: {liveCol.nombre} ({liveCol.codigoCCT})</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Esta acción dará de baja al colegio de la plataforma y{' '}
                    <strong>borrará permanentemente toda su información de la base de datos</strong>{' '}
                    (usuarios, alumnos, docentes, calificaciones, asistencias, finanzas y configuraciones).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Clave Generada en el Módulo "Mi Perfil" del Administrador del Colegio:
                  </span>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-slate-900">
                        {targetAdmin ? targetAdmin.nombre : liveCol.director}
                      </span>
                      {targetAdmin?.usuarioLogin && (
                        <span className="ml-2 font-mono text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          Usuario: {targetAdmin.usuarioLogin}
                        </span>
                      )}
                    </div>
                    {isKeyCurrentlyValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span>Clave activa ({remainingSec}s restantes)</span>
                      </span>
                    ) : isKeyExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clave expirada (solicita una nueva)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Vigencia de clave: 1 minuto</span>
                      </span>
                    )}
                  </div>
                </div>

                {deleteError && (
                  <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Ingresa la Clave de Autorización de Baja (6 dígitos):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deleteKeyInput}
                      onChange={(e) => {
                        setDeleteKeyInput(e.target.value);
                        setDeleteError(null);
                      }}
                      placeholder="Ej. 482915 (Expira en 1 minuto)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-rose-600 focus:outline-none font-mono font-black text-base tracking-widest text-slate-900 bg-slate-50 focus:bg-white"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    * Solicita esta clave al administrador del colegio (se genera en su módulo{' '}
                    <strong>Mi Perfil</strong> y expira en <strong>1 minuto</strong> si no se utiliza).
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetCollege(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingDelete || !deleteKeyInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {isVerifyingDelete ? 'Verificando Clave...' : 'Confirmar Baja y Eliminar Todo'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
