import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  PreenrollmentRequest,
  PreenrollmentLevel,
  PreenrollmentDocumentRequirement,
  PreenrollmentFeeConcept,
  PreenrollmentCollegeConfig,
  PreenrollmentAttachedFile,
} from '../types';
import {
  UserPlus,
  Link,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  CreditCard,
  Building2,
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  KeyRound,
  FileText,
  DollarSign,
  Users,
  RefreshCw,
  Settings,
  Paperclip,
  Plus,
  Trash2,
  Save,
  Download,
  FileCheck,
  QrCode,
  Printer,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PublicPreenrollmentModal } from './PublicPreenrollmentModal';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const PreenrollmentModule: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    preenrollments,
    activeCollege,
    colleges,
    currentUser,
    acceptPreenrollment,
    rejectPreenrollment,
    confirmPreenrollmentPayment,
    assignStudentGroup,
    getPreenrollmentConfig,
    updatePreenrollmentConfig,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'pendientes' | 'aceptados' | 'rechazados' | 'configuracion'
  >('pendientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('todos');

  // Modal public form simulator
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<PreenrollmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Cupo límite del grado escolar alcanzado.');

  // Accept Success confirmation modal
  const [acceptSuccessData, setAcceptSuccessData] = useState<{
    req: PreenrollmentRequest;
    tutorUser: any;
  } | null>(null);

  // Payment confirmation modal
  const [paymentItem, setPaymentItem] = useState<PreenrollmentRequest | null>(null);
  const [paymentVoucher, setPaymentVoucher] = useState('');

  // Group assignment modal
  const [assignGroupItem, setAssignGroupItem] = useState<PreenrollmentRequest | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('A');

  // Preview attached file modal
  const [inspectingFile, setInspectingFile] = useState<PreenrollmentAttachedFile | null>(null);

  // =========================================================================
  // FORM CUSTOMIZATION STATE (PER COLLEGE)
  // =========================================================================
  const targetCollegeId = activeCollege ? activeCollege.id : 'col-cervantes';
  const targetCollege = activeCollege || colleges[0];

  const collegeConfig = getPreenrollmentConfig(targetCollegeId);

  const [docRequirements, setDocRequirements] = useState<PreenrollmentDocumentRequirement[]>(
    collegeConfig.documentosRequeridos || []
  );
  const [selectedLevels, setSelectedLevels] = useState<PreenrollmentLevel[]>(
    collegeConfig.nivelesDisponibles || ['preescolar', 'primaria', 'secundaria', 'preparatoria']
  );
  const [showEstimatedFees, setShowEstimatedFees] = useState<boolean>(
    collegeConfig.mostrarCuotasEstimadas ?? true
  );
  const [feesByLevel, setFeesByLevel] = useState<
    Record<PreenrollmentLevel, PreenrollmentFeeConcept[]>
  >(collegeConfig.cuotasPorNivel);
  const [activeFeeLevel, setActiveFeeLevel] = useState<PreenrollmentLevel>('primaria');

  const [askPreviousSchool, setAskPreviousSchool] = useState<boolean>(
    collegeConfig.pedirEscuelaProcedencia ?? true
  );
  const [askGPA, setAskGPA] = useState<boolean>(collegeConfig.pedirPromedio ?? true);
  const [askBirthDate, setAskBirthDate] = useState<boolean>(
    collegeConfig.pedirFechaNacimiento ?? true
  );
  const [welcomeNotes, setWelcomeNotes] = useState<string>(
    collegeConfig.instruccionesPersonalizadas || ''
  );

  // New custom document form
  const [newDocName, setNewDocName] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocObligatorio, setNewDocObligatorio] = useState(true);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Sync state if active college changes
  useEffect(() => {
    const currentCfg = getPreenrollmentConfig(targetCollegeId);
    setDocRequirements(currentCfg.documentosRequeridos || []);
    setSelectedLevels(
      currentCfg.nivelesDisponibles || ['preescolar', 'primaria', 'secundaria', 'preparatoria']
    );
    setShowEstimatedFees(currentCfg.mostrarCuotasEstimadas ?? true);
    setFeesByLevel(currentCfg.cuotasPorNivel);
    setAskPreviousSchool(currentCfg.pedirEscuelaProcedencia ?? true);
    setAskGPA(currentCfg.pedirPromedio ?? true);
    setAskBirthDate(currentCfg.pedirFechaNacimiento ?? true);
    setWelcomeNotes(currentCfg.instruccionesPersonalizadas || '');
  }, [targetCollegeId]);

  // Filter requests by active college (or all if superuser global view)
  const scopedRequests = preenrollments.filter((req) => {
    if (activeCollege && req.colegioId !== activeCollege.id) {
      return false;
    }
    if (levelFilter !== 'todos' && req.nivel !== levelFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = req.alumnoNombreCompleto.toLowerCase().includes(q);
      const matchCurp = req.curp.toLowerCase().includes(q);
      const matchFolio = req.folio.toLowerCase().includes(q);
      const matchTutor = req.tutorNombre.toLowerCase().includes(q);
      if (!matchName && !matchCurp && !matchFolio && !matchTutor) {
        return false;
      }
    }
    return true;
  });

  const pendientes = scopedRequests.filter((r) => r.estatus === 'pendiente');
  const aceptados = scopedRequests.filter((r) => r.estatus === 'aceptado');
  const rechazados = scopedRequests.filter((r) => r.estatus === 'rechazado');

  // Public Form URL generator for this college using official requested domain: dashboard.mycollege.com.mx completed with preenrollment form address
  const officialDomain = 'https://dashboard.mycollege.com.mx';
  const collegeIdForLink = activeCollege ? activeCollege.id : targetCollegeId || 'col-cervantes';
  const publicFormLink = `${officialDomain}/formulario-preinscripcion?form=preinscripcion&colegio=${encodeURIComponent(
    collegeIdForLink
  )}`;

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [preenrollmentQrUrl, setPreenrollmentQrUrl] = useState<string>('');

  useEffect(() => {
    if (publicFormLink) {
      QRCode.toDataURL(publicFormLink, {
        width: 400,
        margin: 2,
        color: { dark: '#0B2545', light: '#FFFFFF' },
      })
        .then(setPreenrollmentQrUrl)
        .catch(console.error);
    }
  }, [publicFormLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAccept = (item: PreenrollmentRequest) => {
    const result = acceptPreenrollment(item.id);
    if (result) {
      setAcceptSuccessData({
        req: result.preenrollment,
        tutorUser: result.tutorUser,
      });
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    rejectPreenrollment(rejectingItem.id, rejectionReason.trim());
    setRejectingItem(null);
  };

  const handleConfirmPayment = () => {
    if (!paymentItem) return;
    confirmPreenrollmentPayment(paymentItem.id, paymentVoucher.trim());
    setPaymentItem(null);
    setPaymentVoucher('');
  };

  const handleConfirmAssignGroup = () => {
    if (!assignGroupItem) return;
    assignStudentGroup(assignGroupItem.id, selectedGroup);
    setAssignGroupItem(null);
  };

  // Document requirement handlers
  const handleToggleDocActive = (docId: string) => {
    setDocRequirements((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, activo: !d.activo } : d))
    );
  };

  const handleToggleDocObligatorio = (docId: string) => {
    setDocRequirements((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, obligatorio: !d.obligatorio } : d))
    );
  };

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: PreenrollmentDocumentRequirement = {
      id: `doc-${Date.now()}`,
      nombre: newDocName.trim(),
      descripcion: newDocDesc.trim() || undefined,
      activo: true,
      obligatorio: newDocObligatorio,
    };

    setDocRequirements((prev) => [...prev, newDoc]);
    setNewDocName('');
    setNewDocDesc('');
    setNewDocObligatorio(true);
  };

  const handleDeleteDoc = (docId: string) => {
    setDocRequirements((prev) => prev.filter((d) => d.id !== docId));
  };

  // Level toggles
  const handleToggleLevel = (lvl: PreenrollmentLevel) => {
    setSelectedLevels((prev) => {
      if (prev.includes(lvl)) {
        if (prev.length <= 1) return prev; // At least one level must be active
        return prev.filter((l) => l !== lvl);
      }
      return [...prev, lvl];
    });
  };

  // Fees management
  const handleAddFeeConcept = (lvl: PreenrollmentLevel) => {
    setFeesByLevel((prev) => {
      const currentList = prev[lvl] || [];
      return {
        ...prev,
        [lvl]: [...currentList, { concepto: 'Nueva Cuota o Seguro', monto: 500 }],
      };
    });
  };

  const handleUpdateFeeConcept = (
    lvl: PreenrollmentLevel,
    index: number,
    field: 'concepto' | 'monto',
    val: any
  ) => {
    setFeesByLevel((prev) => {
      const currentList = [...(prev[lvl] || [])];
      if (currentList[index]) {
        currentList[index] = {
          ...currentList[index],
          [field]: field === 'monto' ? Math.max(0, parseInt(val) || 0) : val,
        };
      }
      return {
        ...prev,
        [lvl]: currentList,
      };
    });
  };

  const handleDeleteFeeConcept = (lvl: PreenrollmentLevel, index: number) => {
    setFeesByLevel((prev) => {
      const currentList = (prev[lvl] || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        [lvl]: currentList,
      };
    });
  };

  // Save all custom configuration
  const handleSaveConfiguration = () => {
    updatePreenrollmentConfig(targetCollegeId, {
      documentosRequeridos: docRequirements,
      nivelesDisponibles: selectedLevels,
      mostrarCuotasEstimadas: showEstimatedFees,
      cuotasPorNivel: feesByLevel,
      pedirEscuelaProcedencia: askPreviousSchool,
      pedirPromedio: askGPA,
      pedirFechaNacimiento: askBirthDate,
      instruccionesPersonalizadas: welcomeNotes,
    });

    setConfigSaveSuccess(true);
    setTimeout(() => setConfigSaveSuccess(false), 3000);
  };

  const primaryColor = targetCollege?.colores?.primario || '#0B2545';
  const goldColor = targetCollege?.colores?.secundario || '#C59B27';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Banner & Header */}
      <div
        className="rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex items-center gap-4">
          {targetCollege ? (
            targetCollege.escudoUrl ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/40 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={targetCollege.escudoUrl}
                  alt={`Escudo de ${targetCollege.nombre}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : null
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/40 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/my-college-logo.svg"
                alt="Escudo My College"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
                style={{ backgroundColor: goldColor, color: primaryColor }}
              >
                Ciclo 2026-2027
              </span>
            </div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2.5">
              <UserPlus className="w-6 h-6" style={{ color: goldColor }} />
              Preinscripciones y Admisiones
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              Plantel Escolar: <strong>{targetCollege?.nombre}</strong> ({targetCollege?.codigoCCT})
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Copiar enlace público del formulario de preinscripción de este colegio"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">¡Enlace Copiado!</span>
            </>
          ) : (
            <>
              <Link className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Copiar Enlace del Plantel</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Generar y ver Código QR de Preinscripción para este colegio"
        >
          <QrCode className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Ver QR Preinscripción</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPublicFormOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Abrir Formulario Aspirante</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Solicitudes
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {scopedRequests.length}
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500">Expedientes recibidos</span>
        </div>

        <div
          onClick={() => setActiveTab('pendientes')}
          className={`p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            activeTab === 'pendientes'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Por Revisar
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {pendientes.length}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">Pendientes de dictamen</span>
        </div>

        <div
          onClick={() => setActiveTab('aceptados')}
          className={`p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            activeTab === 'aceptados'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Aceptados
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900 font-mono">
              {aceptados.length}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {aceptados.filter((a) => a.estadoPago === 'pago_confirmado').length} con pago verificado
          </span>
        </div>

        <div
          onClick={() => setActiveTab('configuracion')}
          className={`p-4 rounded-2xl border shadow-2xs space-y-1 cursor-pointer transition-all ${
            activeTab === 'configuracion'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/30'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block flex items-center justify-between">
            <span>Formulario</span>
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-black text-indigo-950">
              Personalizar
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
              Plantel
            </span>
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold">
            Archivos, cuotas y campos
          </span>
        </div>
      </div>

      {/* Main Tab Controls & Search Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-2 sm:px-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pendientes'
                  ? 'bg-[#0B2545] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({pendientes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('aceptados')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'aceptados'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aceptados ({aceptados.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rechazados')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rechazados'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazados ({rechazados.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuracion'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Formulario del Plantel</span>
            </button>
          </div>

          {/* Search & Level Filters (Only for request tabs) */}
          {activeTab !== 'configuracion' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por alumno, CURP, folio..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todos">Todos los niveles</option>
                <option value="preescolar">Preescolar</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
                <option value="preparatoria">Preparatoria</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: PENDIENTES */}
        {activeTab === 'pendientes' && (
          <div className="p-4 sm:p-6 space-y-4">
            {pendientes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  No hay solicitudes pendientes de revisión en {targetCollege?.nombre}.
                </p>
                <p className="text-xs text-slate-400">
                  Comparte el enlace del formulario de preinscripción para recibir aspirantes.
                </p>
              </div>
            ) : (
              pendientes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {item.folio}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {item.nivel}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        Solicitado: {item.fechaSolicitud}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Promedio reportado:</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                        {item.promedio.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>

                  {/* Student & Tutor Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Alumno */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-blue-700" />
                        <span>Alumno Aspirante</span>
                      </div>
                      <div className="font-black text-sm text-slate-900">
                        {item.alumnoNombreCompleto}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        CURP: <strong>{item.curp}</strong>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Grado Solicitado: <strong className="text-blue-800">{item.grado}</strong>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Escuela de Procedencia: <strong className="text-slate-800">{item.escuelaProcedencia || 'Ninguna'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Nacimiento: {item.fechaNacimiento || 'No especificada'}
                      </div>
                    </div>

                    {/* Tutor */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>Padre de Familia / Tutor Legal</span>
                      </div>
                      <div className="font-black text-sm text-slate-900">
                        {item.tutorNombre}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-blue-700 font-semibold">{item.tutorCorreo}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.tutorTelefono}</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                        Se generará acceso al aceptar
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents Section (Review files sent by applicant) */}
                  {item.archivosAdjuntos && item.archivosAdjuntos.length > 0 && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Archivos Adjuntos Entregados ({item.archivosAdjuntos.length}):</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {item.archivosAdjuntos.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setInspectingFile(file)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-semibold text-indigo-900 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/60 transition-all cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-900">{file.nombreDocumento}:</span>
                            <span className="text-[11px] text-indigo-700 truncate max-w-[150px] font-mono">{file.nombreArchivo}</span>
                            <span className="text-[10px] text-slate-400">({file.tamano})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fee Preview & Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Cuota Total de Inscripción al ser admitido:</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        ${item.montoTotalInscripcion.toLocaleString()} MXN
                      </strong>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReason('Cupo límite del grado escolar alcanzado.');
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Negar Inscripción</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(item)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aceptar Inscripción</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: ACEPTADOS */}
        {activeTab === 'aceptados' && (
          <div className="p-4 sm:p-6 space-y-4">
            {aceptados.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  No hay aspirantes aceptados aún en {targetCollege?.nombre}.
                </p>
                <p className="text-xs text-slate-400">
                  Revisa la pestaña de &quot;Pendientes&quot; para autorizar solicitudes.
                </p>
              </div>
            ) : (
              aceptados.map((item) => {
                const isPaid = item.estadoPago === 'pago_confirmado';
                const hasGroup = Boolean(item.grupoAsignado);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {item.folio}
                        </span>
                        {item.matriculaGenerada && (
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Matrícula: {item.matriculaGenerada}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.nivel}
                        </span>
                      </div>

                      {/* Payment Status Badge */}
                      <div>
                        {isPaid ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Pago de Inscripción Confirmado</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pendiente de Pago (${item.montoTotalInscripcion.toLocaleString()} MXN)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Data Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Alumno */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-bold block">Alumno & Grado:</span>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {item.alumnoNombreCompleto}
                        </div>
                        <div className="text-slate-600 font-semibold">{item.grado}</div>
                        <div className="text-[11px] text-slate-500">Procedencia: {item.escuelaProcedencia || 'Ninguna'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">CURP: {item.curp}</div>
                      </div>

                      {/* Tutor Access Credentials */}
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
                        <span className="text-blue-900 font-bold block flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                          <span>Credenciales del Tutor:</span>
                        </span>
                        <div className="text-slate-800 font-semibold">{item.tutorNombre}</div>
                        <div className="text-xs font-mono text-blue-950">
                          Usuario: <strong>{item.tutorUsuarioGenerado || 'Generado'}</strong>
                        </div>
                        <div className="text-xs font-mono text-slate-600">
                          Contraseña inicial: <span className="font-bold text-amber-700">{item.tutorPasswordTemporal || '••••••••'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          * Modificable desde módulo &quot;Mi Perfil&quot;
                        </span>
                      </div>

                      {/* Group Assignment Status */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-bold block flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <span>Grupo Escolar:</span>
                        </span>
                        {hasGroup ? (
                          <div className="space-y-0.5">
                            <div className="text-sm font-black text-emerald-700 font-mono">
                              Grupo &quot;{item.grupoAsignado}&quot;
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Asignado: {item.fechaAsignacionGrupo || 'Registrado'}
                            </span>
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                              ✓ Alumno en Salón de Clases
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-amber-800 font-bold text-xs block">
                              Sin Asignar
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {isPaid
                                ? 'Habilitado para asignar grupo ahora'
                                : 'Requiere confirmar pago de inscripción primero'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attached files summary */}
                    {item.archivosAdjuntos && item.archivosAdjuntos.length > 0 && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>Archivos:</span>
                        </span>
                        {item.archivosAdjuntos.map((f, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setInspectingFile(f)}
                            className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer font-mono"
                          >
                            <span>{f.nombreDocumento}</span>
                            <span className="text-[10px] text-slate-400">({f.tamano})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {isPaid && item.folioComprobante && (
                          <span className="font-mono text-[11px] text-slate-600">
                            Comprobante Pago: <strong>{item.folioComprobante}</strong> ({item.fechaPago})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentItem(item);
                              setPaymentVoucher(`BBVA-${Math.floor(100000 + Math.random() * 900000)}`);
                            }}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Confirmar Pago de Inscripción</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!isPaid}
                          onClick={() => {
                            setAssignGroupItem(item);
                            setSelectedGroup(item.grupoAsignado || 'A');
                          }}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                            isPaid
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{hasGroup ? 'Cambiar Grupo' : 'Asignar a Grupo Correspondiente'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: RECHAZADOS */}
        {activeTab === 'rechazados' && (
          <div className="p-4 sm:p-6 space-y-4">
            {rechazados.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <XCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  No hay solicitudes en la lista de rechazados.
                </p>
              </div>
            ) : (
              rechazados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                        {item.folio}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {item.nivel}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        Resolución: {item.fechaResolucion || item.fechaSolicitud}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                      Inscripción Denegada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Alumno Aspirante:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {item.alumnoNombreCompleto}
                      </span>
                      <div className="text-slate-600">
                        {item.grado} · CURP: {item.curp}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Procedencia: {item.escuelaProcedencia || 'Ninguna'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Tutor Notificado:</span>
                      <span className="font-bold text-slate-800">{item.tutorNombre}</span>
                      <div className="text-slate-500 font-mono">{item.tutorCorreo}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-1">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Motivo del Rechazo:</span>
                    </span>
                    <p className="text-rose-800 text-[11px] leading-relaxed">
                      {item.motivoRechazo || 'Sin motivo detallado'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: CONFIGURACIÓN DEL FORMULARIO (PERSONALIZACIÓN POR COLEGIO) */}
        {activeTab === 'configuracion' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
              <div>
                <h3 className="font-display font-bold text-base text-indigo-950 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-700" />
                  <span>Personalización del Formulario para: {targetCollege?.nombre}</span>
                </h3>
                <p className="text-xs text-indigo-800/80 mt-0.5">
                  Cada colegio adapta a su medida los documentos que solicita, las cuotas de inscripción por nivel y los campos requeridos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublicFormOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white border border-indigo-300 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Previsualizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfiguration}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>

            {configSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Configuración del formulario guardada con éxito para {targetCollege?.nombre}!</span>
              </div>
            )}

            {/* Section A: Documentos y Archivos Adjuntos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>1. Documentos y Archivos a Adjuntar</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Elige qué documentos deben subir los aspirantes (Acta de nacimiento, Boleta, CURP, etc.) y cuáles son obligatorios.
                  </p>
                </div>
              </div>

              {/* Document list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {docRequirements.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      doc.activo
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-slate-50/40 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{doc.nombre}</div>
                        {doc.descripcion && (
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {doc.descripcion}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Eliminar requisito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      {/* Active toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={doc.activo}
                          onChange={() => handleToggleDocActive(doc.id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Solicitar en el formulario</span>
                      </label>

                      {/* Obligatorio toggle */}
                      {doc.activo && (
                        <button
                          type="button"
                          onClick={() => handleToggleDocObligatorio(doc.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            doc.obligatorio
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {doc.obligatorio ? '● Obligatorio' : '○ Opcional'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom document form */}
              <form
                onSubmit={handleAddCustomDoc}
                className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-end gap-2 text-xs"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Agregar Nuevo Requisito de Archivo:
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Ej. Certificado Médico Oficial con Tipo de Sangre"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="w-full sm:w-64">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Instrucción / Descripción breve:
                  </label>
                  <input
                    type="text"
                    value={newDocDesc}
                    onChange={(e) => setNewDocDesc(e.target.value)}
                    placeholder="Ej. Expedido por Centro de Salud"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newDocName.trim()}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Requisito</span>
                </button>
              </form>
            </div>

            {/* Section B: Niveles Educativos Ofertados */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>2. Niveles Académicos que Ofrece el Plantel</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona los niveles disponibles para que los aspirantes solo puedan preinscribirse a los niveles que tu colegio imparte.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'preescolar', label: 'Preescolar (Kinder)' },
                  { id: 'primaria', label: 'Primaria' },
                  { id: 'secundaria', label: 'Secundaria' },
                  { id: 'preparatoria', label: 'Preparatoria / Bachillerato' },
                ].map((lvl) => {
                  const isChecked = selectedLevels.includes(lvl.id as PreenrollmentLevel);
                  return (
                    <label
                      key={lvl.id}
                      onClick={() => handleToggleLevel(lvl.id as PreenrollmentLevel)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{lvl.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section C: Cuotas y Montos de Inscripción (Donde se definen los montos por nivel) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>3. Cuotas y Montos de Inscripción (Configurables por Nivel)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aquí defines los conceptos exactos y montos en MXN que tu colegio cobra por inscripción en cada nivel escolar.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEstimatedFees}
                    onChange={(e) => setShowEstimatedFees(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mostrar desglose en formulario público</span>
                </label>
              </div>

              {/* Level Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                {selectedLevels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setActiveFeeLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer uppercase ${
                      activeFeeLevel === lvl
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Fee items editor for active level */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase">
                    Conceptos para {activeFeeLevel.toUpperCase()}:
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Total: $
                    {(feesByLevel[activeFeeLevel] || [])
                      .reduce((acc, c) => acc + c.monto, 0)
                      .toLocaleString()}{' '}
                    MXN
                  </span>
                </div>

                <div className="space-y-2">
                  {(feesByLevel[activeFeeLevel] || []).map((fee, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <input
                        type="text"
                        value={fee.concepto}
                        onChange={(e) =>
                          handleUpdateFeeConcept(activeFeeLevel, idx, 'concepto', e.target.value)
                        }
                        placeholder="Concepto de pago (ej. Cuota Anual)"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex items-center gap-1 w-36">
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={fee.monto}
                          onChange={(e) =>
                            handleUpdateFeeConcept(activeFeeLevel, idx, 'monto', e.target.value)
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">MXN</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeeConcept(activeFeeLevel, idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar concepto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddFeeConcept(activeFeeLevel)}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Concepto de Cuota ({activeFeeLevel})</span>
                </button>
              </div>
            </div>

            {/* Section D: Campos del Aspirante & Instrucciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>4. Campos de Registro del Aspirante</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">
                      Solicitar Escuela de Procedencia (por default &quot;Ninguna&quot;)
                    </span>
                    <input
                      type="checkbox"
                      checked={askPreviousSchool}
                      onChange={(e) => setAskPreviousSchool(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">
                      Solicitar Promedio Anterior (Escala 0 - 10)
                    </span>
                    <input
                      type="checkbox"
                      checked={askGPA}
                      onChange={(e) => setAskGPA(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">
                      Solicitar Fecha de Nacimiento
                    </span>
                    <input
                      type="checkbox"
                      checked={askBirthDate}
                      onChange={(e) => setAskBirthDate(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>5. Mensaje de Bienvenida e Instrucciones</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Texto informativo que verán los padres de familia al ingresar al formulario de tu colegio:
                </p>
                <textarea
                  value={welcomeNotes}
                  onChange={(e) => setWelcomeNotes(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  placeholder="Instrucciones para los aspirantes..."
                />
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPublicFormOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Previsualizar Formulario</span>
              </button>
              <button
                type="button"
                onClick={handleSaveConfiguration}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración del Plantel</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* 1. Public Preenrollment Form Simulator Modal */}
      <PublicPreenrollmentModal
        isOpen={isPublicFormOpen}
        onClose={() => setIsPublicFormOpen(false)}
        defaultCollegeId={targetCollegeId}
      />

      {/* 2. File Inspect Modal */}
      {inspectingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  {inspectingFile.nombreDocumento}
                </h3>
              </div>
              <button
                onClick={() => setInspectingFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre de Archivo:</span>
                <span className="font-bold text-slate-900 font-mono">{inspectingFile.nombreArchivo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamaño:</span>
                <span className="font-semibold text-slate-800">{inspectingFile.tamano}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Carga:</span>
                <span className="font-semibold text-slate-800">{inspectingFile.fechaSubida}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Validación:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Documento Íntegro y Legible
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setInspectingFile(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Descargando archivo: ${inspectingFile.nombreArchivo}`);
                  setInspectingFile(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Archivo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Rejection Prompt Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-100 text-rose-700 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Denegar Solicitud de Inscripción
                </h3>
                <p className="text-xs text-slate-500">
                  Aspirante: {rejectingItem.alumnoNombreCompleto} ({rejectingItem.folio})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Motivo del Rechazo (se notificará al correo del tutor):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-900"
                placeholder="Indica el motivo..."
                required
              />
              <p className="text-[10px] text-slate-400">
                La solicitud pasará a la pestaña de &quot;Rechazados&quot; para auditoría escolar.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Accept Success Modal */}
      {acceptSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  ¡Aspirante Admitido Satisfactoriamente!
                </h3>
                <p className="text-xs text-slate-500">
                  El alumno fue registrado en la base de datos escolar.
                </p>
              </div>
            </div>

            {/* Generated Tutor Credentials Box */}
            <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-3 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-sans font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Credenciales Generadas para el Tutor</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Notificado por correo
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tutor Legal:</span>
                  <span className="font-bold text-slate-200">{acceptSuccessData.req.tutorNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Usuario Generado:</span>
                  <span className="font-bold text-amber-300 font-mono text-xs">
                    {acceptSuccessData.req.tutorUsuarioGenerado}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contraseña Inicial:</span>
                  <span className="font-bold text-amber-300 font-mono text-xs">
                    {acceptSuccessData.req.tutorPasswordTemporal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Matrícula Asignada:</span>
                  <span className="font-bold text-emerald-300">{acceptSuccessData.req.matriculaGenerada}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-sans">
                * El tutor puede iniciar sesión con este usuario y cambiar su contraseña en el módulo <strong>&quot;Mi Perfil&quot;</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setAcceptSuccessData(null)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Payment Confirmation Modal */}
      {paymentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Confirmación de Pago de Inscripción
                </h3>
                <p className="text-xs text-slate-500">
                  Aspirante: {paymentItem.alumnoNombreCompleto} ({paymentItem.grado})
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Monto de Inscripción:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  ${paymentItem.montoTotalInscripcion.toLocaleString()} MXN
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tutor:</span>
                <span className="font-semibold text-slate-800">{paymentItem.tutorNombre}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Número de Autorización / Comprobante Bancario SPEI:
              </label>
              <input
                type="text"
                value={paymentVoucher}
                onChange={(e) => setPaymentVoucher(e.target.value)}
                placeholder="Ej. BBVA-TRANSF-981240"
                className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                required
              />
              <p className="text-[10px] text-slate-400">
                Al confirmar el pago, el alumno quedará habilitado para ser asignado a su salón de clases oficial.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validar y Confirmar Pago</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Group Assignment Modal */}
      {assignGroupItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Asignar Grupo Escolar
                </h3>
                <p className="text-xs text-slate-500">
                  {assignGroupItem.alumnoNombreCompleto} · {assignGroupItem.grado}
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pago Validado Satisfactoriamente</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                El alumno cumple con todos los requisitos administrativos. Selecciona el salón oficial.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Selecciona el Grupo para {assignGroupItem.grado}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['A', 'B', 'C'].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    className={`py-3 rounded-xl border text-sm font-black transition-all cursor-pointer ${
                      selectedGroup === grp
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Grupo {grp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignGroupItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignGroup}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar Alta en Grupo {selectedGroup}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preenrollment QR Modal (Printable Poster) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Código QR Oficial de Preinscripción
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/30 border-2 border-slate-300 text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                {targetCollege?.escudoUrl && (
                  <img
                    src={targetCollege.escudoUrl}
                    alt="Escudo"
                    className="w-12 h-12 object-contain p-1 rounded-xl bg-white border border-slate-200 shadow-xs"
                  />
                )}
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Plantel Escolar
                  </span>
                  <div className="font-display font-bold text-sm text-slate-900">
                    {targetCollege?.nombre}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    CCT: {targetCollege?.codigoCCT}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-sm text-slate-900 uppercase">
                  Solicitud de Preinscripción en Línea
                </h4>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                  Escanee con la cámara de su celular para abrir la solicitud oficial direccionada a este colegio.
                </p>
              </div>

              {/* Scannable QR Code */}
              <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-purple-300 shadow-xs inline-block mx-auto">
                {preenrollmentQrUrl ? (
                  <img
                    src={preenrollmentQrUrl}
                    alt="Código QR de Preinscripción"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    Generando código QR...
                  </div>
                )}
              </div>

              <div className="text-left bg-white p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1">
                <div>• Dirección oficial: <strong className="font-mono text-blue-900">{publicFormLink}</strong></div>
                <div>• Direcciona directamente al plantel: <strong>{targetCollege?.nombre}</strong></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {preenrollmentQrUrl && (
                <a
                  href={preenrollmentQrUrl}
                  download={`QR_Preinscripcion_${(targetCollege?.nombre || 'Colegio').replace(/[^a-zA-Z0-9]/g, '_')}.png`}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Imagen</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicFormLink);
                  alert('¡Enlace copiado con éxito!');
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Link className="w-3.5 h-3.5" />
                <span>Copiar Enlace</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Cartel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
