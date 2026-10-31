import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  CreditCard,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Settings,
  Receipt,
  Plus,
  Download,
  FileText,
  Sparkles,
  RefreshCw,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  Check,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { College, TutorFiscalData } from '../types';

interface PlanCostConfig {
  precioBaseMensual: number;
  incluyeIva: boolean;
  tasaIva: number;
  diaCorteMensual: number;
  diasTolerancia: number;
  descripcionPlan: string;
}

interface CollegeInvoiceRecord {
  id: string;
  colegioId: string;
  colegioNombre: string;
  periodo: string; // e.g. '2026-10'
  subtotal: number;
  iva: number;
  total: number;
  estadoPago: 'pagado' | 'pendiente' | 'vencido';
  estadoFactura: 'pendiente_emitir' | 'emitida' | 'no_requiere';
  folioFactura?: string;
  fechaEmision?: string;
  fechaPago?: string;
  metodoPago: 'PUE' | 'PPD';
  formaPago: string;
  notas?: string;
}

interface PlatformExpenseRecord {
  id: string;
  fecha: string;
  concepto: string;
  categoria: 'Servidores y Nube' | 'Licencias y Software' | 'Marketing' | 'Honorarios / Contabilidad' | 'Otros';
  proveedor: string;
  rfcProveedor?: string;
  folioFactura?: string;
  subtotal: number;
  iva: number;
  total: number;
}

const PLAN_CONFIG_STORAGE_KEY = 'my_college_v1_plan_cost_config';
const INVOICES_STORAGE_KEY = 'my_college_v1_platform_invoices';
const EXPENSES_STORAGE_KEY = 'my_college_v1_platform_expenses';

const DEFAULT_PLAN_CONFIG: PlanCostConfig = {
  precioBaseMensual: 5500,
  incluyeIva: true,
  tasaIva: 16,
  diaCorteMensual: 5,
  diasTolerancia: 5,
  descripcionPlan: 'Plan Institucional Permanente (Acceso total a módulos, usuarios ilimitados, soporte y respaldos)'
};

const REGIMENES_FISCALES = [
  '601 - General de Ley Personas Morales',
  '603 - Personas Morales con Fines no Lucrativos',
  '612 - Personas Físicas con Actividades Empresariales y Profesionales',
  '626 - Régimen Simplificado de Confianza (RESICO)'
];

const USOS_CFDI = [
  'G03 - Gastos en general',
  'I08 - Otra maquinaria y equipo',
  'S01 - Sin efectos fiscales'
];

export const PlansBillingModule: React.FC = () => {
  const { colleges, updateCollege, students, users } = useApp();

  const [activeTab, setActiveTab] = useState<'colegios' | 'costo_plan' | 'contabilidad'>('colegios');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacion, setFilterOperacion] = useState<'todos' | 'plan' | 'demo'>('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configuración del costo del plan
  const [planConfig, setPlanConfig] = useState<PlanCostConfig>(() => {
    try {
      const saved = localStorage.getItem(PLAN_CONFIG_STORAGE_KEY);
      if (saved) return { ...DEFAULT_PLAN_CONFIG, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_PLAN_CONFIG;
  });

  const [applyToExistingColleges, setApplyToExistingColleges] = useState(true);

  // Período contable seleccionado (YYYY-MM)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Facturas de colegios
  const [invoices, setInvoices] = useState<CollegeInvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Gastos operativos de la plataforma
  const [expenses, setExpenses] = useState<PlatformExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'exp-1',
        fecha: new Date().toISOString().split('T')[0],
        concepto: 'Infraestructura Cloud y Base de Datos Mensual',
        categoria: 'Servidores y Nube',
        proveedor: 'Google Cloud Platform',
        rfcProveedor: 'GCP010101AAA',
        folioFactura: 'CFDI-8821',
        subtotal: 1896.55,
        iva: 303.45,
        total: 2200
      }
    ];
  });

  // Modales en Contabilidad y Facturación
  const [editingFiscalCollege, setEditingFiscalCollege] = useState<College | null>(null);
  const [fiscalForm, setFiscalForm] = useState<TutorFiscalData>({
    rfc: '',
    razonSocial: '',
    regimenFiscal: REGIMENES_FISCALES[0],
    usoCfdi: USOS_CFDI[0],
    codigoPostalFiscal: '',
    correoFacturacion: '',
    direccionFiscal: ''
  });

  const [editingInvoice, setEditingInvoice] = useState<CollegeInvoiceRecord | null>(null);
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState<CollegeInvoiceRecord | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    categoria: 'Servidores y Nube' as PlatformExpenseRecord['categoria'],
    proveedor: '',
    rfcProveedor: '',
    folioFactura: '',
    total: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    } catch {
      // ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      // ignore
    }
  }, [expenses]);

  // Calcular desglose de IVA para un monto dado según configuración
  const calculateTaxBreakdown = (amount: number) => {
    const rate = (planConfig.tasaIva || 16) / 100;
    if (planConfig.incluyeIva) {
      const subtotal = amount / (1 + rate);
      const iva = amount - subtotal;
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        total: Math.round(amount * 100) / 100
      };
    } else {
      const subtotal = amount;
      const iva = subtotal * rate;
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        total: Math.round((subtotal + iva) * 100) / 100
      };
    }
  };

  // Sincronizar automáticamente registros de facturación para los colegios en modalidad 'plan' en el período actual
  useEffect(() => {
    const planColleges = colleges.filter(c => (c.operacion || 'plan') === 'plan' && c.activo);
    setInvoices(prev => {
      let updated = false;
      const next = [...prev];

      planColleges.forEach(col => {
        const exists = next.some(inv => inv.colegioId === col.id && inv.periodo === selectedPeriod);
        if (!exists) {
          const baseAmount = col.montoMensual && col.montoMensual > 0 ? col.montoMensual : planConfig.precioBaseMensual;
          const { subtotal, iva, total } = calculateTaxBreakdown(baseAmount);
          next.push({
            id: `inv-${col.id}-${selectedPeriod}`,
            colegioId: col.id,
            colegioNombre: col.nombre,
            periodo: selectedPeriod,
            subtotal,
            iva,
            total,
            estadoPago: col.estadoPago === 'al_corriente' ? 'pagado' : col.estadoPago === 'pendiente' ? 'pendiente' : 'vencido',
            estadoFactura: 'pendiente_emitir',
            fechaPago: col.estadoPago === 'al_corriente' ? `${selectedPeriod}-05` : undefined,
            metodoPago: 'PUE',
            formaPago: '03 - Transferencia electrónica de fondos'
          });
          updated = true;
        }
      });

      return updated ? next : prev;
    });
  }, [colleges, selectedPeriod, planConfig.precioBaseMensual]);

  // Filtrado de colegios para la Pestaña 1
  const filteredColleges = useMemo(() => {
    return colleges.filter(c => {
      const op = c.operacion || 'plan';
      const matchesOp = filterOperacion === 'todos' || op === filterOperacion;
      const matchesSearch =
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.codigo || c.codigoCCT || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.Responsable || c.director || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesOp && matchesSearch;
    });
  }, [colleges, filterOperacion, searchTerm]);

  // Estadísticas generales de colegios
  const statsColegios = useMemo(() => {
    const total = colleges.length;
    const enPlan = colleges.filter(c => (c.operacion || 'plan') === 'plan').length;
    const enDemo = colleges.filter(c => c.operacion === 'demo').length;
    const ingresosMensualesPlan = colleges
      .filter(c => (c.operacion || 'plan') === 'plan' && c.activo)
      .reduce((acc, c) => acc + (c.montoMensual || planConfig.precioBaseMensual), 0);

    return { total, enPlan, enDemo, ingresosMensualesPlan };
  }, [colleges, planConfig.precioBaseMensual]);

  // Guardar configuración de costo del plan
  const handleSavePlanConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(PLAN_CONFIG_STORAGE_KEY, JSON.stringify(planConfig));
    } catch {
      // ignore
    }

    if (applyToExistingColleges) {
      colleges.forEach(col => {
        if ((col.operacion || 'plan') === 'plan') {
          updateCollege(col.id, { montoMensual: Number(planConfig.precioBaseMensual) });
        }
      });

      // Actualizar también facturas pendientes del periodo actual
      const { subtotal, iva, total } = calculateTaxBreakdown(Number(planConfig.precioBaseMensual));
      setInvoices(prev =>
        prev.map(inv =>
          inv.periodo === selectedPeriod && inv.estadoFactura === 'pendiente_emitir'
            ? { ...inv, subtotal, iva, total }
            : inv
        )
      );
    }

    showToast('Configuración del costo del Plan guardada correctamente.');
  };

  // Cambiar tipo de operación de un colegio rápidamente
  const handleToggleOperacion = (college: College, newOperacion: 'demo' | 'plan') => {
    if ((college.operacion || 'plan') === newOperacion) return;

    if (newOperacion === 'plan') {
      updateCollege(college.id, {
        operacion: 'plan',
        plan: 'Plan',
        montoMensual: planConfig.precioBaseMensual,
        estadoPago: 'al_corriente'
      });
      showToast(`"${college.nombre}" cambiado a modalidad Plan ($${planConfig.precioBaseMensual.toLocaleString()}/mes).`);
    } else {
      const baseDate = college.creadoEn ? new Date(college.creadoEn) : new Date();
      const expDate = new Date(baseDate);
      expDate.setMonth(expDate.getMonth() + 1);
      const expStr = expDate.toISOString().split('T')[0];

      updateCollege(college.id, {
        operacion: 'demo',
        plan: 'Demo',
        montoMensual: 0,
        fechaExpiracionDemo: college.fechaExpiracionDemo || expStr
      });
      showToast(`"${college.nombre}" cambiado a modalidad Demo (1 mes).`);
    }
  };

  // Abrir modal de datos fiscales de colegio
  const handleOpenFiscalModal = (college: College) => {
    setEditingFiscalCollege(college);
    setFiscalForm({
      rfc: college.datosFiscales?.rfc || '',
      razonSocial: college.datosFiscales?.razonSocial || college.nombre,
      regimenFiscal: college.datosFiscales?.regimenFiscal || REGIMENES_FISCALES[0],
      usoCfdi: college.datosFiscales?.usoCfdi || USOS_CFDI[0],
      codigoPostalFiscal: college.datosFiscales?.codigoPostalFiscal || '',
      correoFacturacion: college.datosFiscales?.correoFacturacion || college.email || '',
      direccionFiscal: college.datosFiscales?.direccionFiscal || college.direccion || ''
    });
  };

  const handleSaveFiscalData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFiscalCollege) return;
    updateCollege(editingFiscalCollege.id, {
      datosFiscales: {
        ...fiscalForm,
        rfc: fiscalForm.rfc.trim().toUpperCase(),
        actualizadoEn: new Date().toISOString().split('T')[0]
      }
    });
    setEditingFiscalCollege(null);
    showToast(`Datos fiscales de "${editingFiscalCollege.nombre}" actualizados.`);
  };

  // Guardar cambios de factura de un colegio
  const handleSaveInvoiceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setInvoices(prev => prev.map(inv => (inv.id === editingInvoice.id ? editingInvoice : inv)));

    // Sincronizar estado de pago con el colegio
    const estadoColegio =
      editingInvoice.estadoPago === 'pagado'
        ? 'al_corriente'
        : editingInvoice.estadoPago === 'pendiente'
        ? 'pendiente'
        : 'vencido';
    updateCollege(editingInvoice.colegioId, { estadoPago: estadoColegio });

    setEditingInvoice(null);
    showToast('Registro de facturación y cobro actualizado.');
  };

  // Agregar gasto operativo para contabilidad
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const totalNum = Number(newExpense.total) || 0;
    if (!newExpense.concepto.trim() || totalNum <= 0) return;

    const rate = (planConfig.tasaIva || 16) / 100;
    const subtotal = Math.round((totalNum / (1 + rate)) * 100) / 100;
    const iva = Math.round((totalNum - subtotal) * 100) / 100;

    const record: PlatformExpenseRecord = {
      id: `exp-${Date.now()}`,
      fecha: newExpense.fecha,
      concepto: newExpense.concepto.trim(),
      categoria: newExpense.categoria,
      proveedor: newExpense.proveedor.trim() || 'Proveedor General',
      rfcProveedor: newExpense.rfcProveedor.trim().toUpperCase(),
      folioFactura: newExpense.folioFactura.trim(),
      subtotal,
      iva,
      total: totalNum
    };

    setExpenses(prev => [record, ...prev]);
    setIsExpenseModalOpen(false);
    setNewExpense({
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      categoria: 'Servidores y Nube',
      proveedor: '',
      rfcProveedor: '',
      folioFactura: '',
      total: ''
    });
    showToast('Egreso / gasto registrado en contabilidad.');
  };

  // Resumen contable del período seleccionado
  const periodInvoices = useMemo(() => {
    return invoices.filter(inv => inv.periodo === selectedPeriod);
  }, [invoices, selectedPeriod]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(exp => exp.fecha.startsWith(selectedPeriod));
  }, [expenses, selectedPeriod]);

  const accountingSummary = useMemo(() => {
    const cobradas = periodInvoices.filter(i => i.estadoPago === 'pagado');
    const porCobrar = periodInvoices.filter(i => i.estadoPago !== 'pagado');
    const pendientesFacturar = periodInvoices.filter(i => i.estadoFactura === 'pendiente_emitir');

    const ingresosBrutos = cobradas.reduce((acc, i) => acc + i.total, 0);
    const ingresosSubtotal = cobradas.reduce((acc, i) => acc + i.subtotal, 0);
    const ivaTrasladado = cobradas.reduce((acc, i) => acc + i.iva, 0);

    const totalPorCobrar = porCobrar.reduce((acc, i) => acc + i.total, 0);

    const egresosTotales = periodExpenses.reduce((acc, e) => acc + e.total, 0);
    const egresosSubtotal = periodExpenses.reduce((acc, e) => acc + e.subtotal, 0);
    const ivaAcreditable = periodExpenses.reduce((acc, e) => acc + e.iva, 0);

    const ivaPorPagar = Math.max(0, ivaTrasladado - ivaAcreditable);
    const utilidadNeta = ingresosSubtotal - egresosSubtotal;

    return {
      ingresosBrutos,
      ingresosSubtotal,
      ivaTrasladado,
      totalPorCobrar,
      pendientesFacturarCount: pendientesFacturar.length,
      egresosTotales,
      egresosSubtotal,
      ivaAcreditable,
      ivaPorPagar,
      utilidadNeta
    };
  }, [periodInvoices, periodExpenses]);

  // Exportar reporte contable a CSV (Excel)
  const handleExportAccountingCSV = () => {
    const rows: string[][] = [
      ['REPORTE DE CONTABILIDAD Y FACTURACION - MY COLLEGE'],
      ['Periodo', selectedPeriod],
      ['Fecha de Exportacion', new Date().toLocaleDateString('es-MX')],
      [],
      ['RESUMEN DEL PERIODO'],
      ['Concepto', 'Subtotal (MXN)', 'IVA (MXN)', 'Total (MXN)'],
      [
        'Ingresos Cobrados (Colegios en Plan)',
        accountingSummary.ingresosSubtotal.toFixed(2),
        accountingSummary.ivaTrasladado.toFixed(2),
        accountingSummary.ingresosBrutos.toFixed(2)
      ],
      [
        'Gastos y Egresos Operativos',
        accountingSummary.egresosSubtotal.toFixed(2),
        accountingSummary.ivaAcreditable.toFixed(2),
        accountingSummary.egresosTotales.toFixed(2)
      ],
      ['Utilidad Operativa (Antes de Impuestos)', accountingSummary.utilidadNeta.toFixed(2), '', ''],
      ['IVA Estimado por Enterar (Trasladado - Acreditable)', '', accountingSummary.ivaPorPagar.toFixed(2), ''],
      [],
      ['DETALLE DE FACTURACION A COLEGIOS (INGRESOS)'],
      [
        'Colegio',
        'RFC Receptor',
        'Razon Social',
        'Regimen Fiscal',
        'Uso CFDI',
        'Subtotal',
        'IVA',
        'Total',
        'Estado Cobro',
        'Estado CFDI',
        'Folio Factura',
        'Metodo Pago',
        'Forma Pago'
      ]
    ];

    periodInvoices.forEach(inv => {
      const col = colleges.find(c => c.id === inv.colegioId);
      const df = col?.datosFiscales;
      rows.push([
        inv.colegioNombre,
        df?.rfc || 'XAXX010101000',
        df?.razonSocial || inv.colegioNombre,
        df?.regimenFiscal || 'Sin configurar',
        df?.usoCfdi || 'G03 - Gastos en general',
        inv.subtotal.toFixed(2),
        inv.iva.toFixed(2),
        inv.total.toFixed(2),
        inv.estadoPago.toUpperCase(),
        inv.estadoFactura === 'emitida' ? 'EMITIDA' : inv.estadoFactura === 'no_requiere' ? 'PUBLICO EN GRAL' : 'PENDIENTE EMITIR',
        inv.folioFactura || '-',
        inv.metodoPago,
        inv.formaPago
      ]);
    });

    rows.push([]);
    rows.push(['DETALLE DE EGRESOS Y GASTOS OPERATIVOS']);
    rows.push(['Fecha', 'Concepto', 'Categoria', 'Proveedor', 'RFC Proveedor', 'Folio CFDI', 'Subtotal', 'IVA Acreditable', 'Total']);

    periodExpenses.forEach(exp => {
      rows.push([
        exp.fecha,
        exp.concepto,
        exp.categoria,
        exp.proveedor,
        exp.rfcProveedor || '-',
        exp.folioFactura || '-',
        exp.subtotal.toFixed(2),
        exp.iva.toFixed(2),
        exp.total.toFixed(2)
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contabilidad_Facturacion_${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Reporte contable ${selectedPeriod} descargado en formato CSV/Excel.`);
  };

  // Calcular días restantes de Demo
  const getDemoRemainingInfo = (college: College) => {
    if (college.operacion !== 'demo') return null;
    const expStr = college.fechaExpiracionDemo;
    if (!expStr) return { expired: false, text: '30 días restantes', days: 30 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(`${expStr}T23:59:59`);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { expired: true, text: `Finalizó hace ${Math.abs(diffDays)} día(s)`, days: diffDays };
    }
    if (diffDays === 0) {
      return { expired: false, text: 'Vence hoy', days: 0 };
    }
    return { expired: false, text: `${diffDays} día(s) restantes`, days: diffDays };
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Notificación flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes, Operación y Contabilidad</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Supervisa el tipo de operación de cada colegio, configura el costo del Plan y gestiona tu facturación y contabilidad mensual.
          </p>
        </div>

        {/* Navegación de Pestañas */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab('colegios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'colegios'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Colegios y Operación
          </button>
          <button
            onClick={() => setActiveTab('costo_plan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'costo_plan'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurar Costo del Plan
          </button>
          <button
            onClick={() => setActiveTab('contabilidad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'contabilidad'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Contabilidad y Facturación
            {accountingSummary.pendientesFacturarCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full">
                {accountingSummary.pendientesFacturarCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          PESTAÑA 1: COLEGIOS Y TIPO DE OPERACIÓN
      ===================================================================== */}
      {activeTab === 'colegios' && (
        <div className="space-y-6">
          {/* Tarjetas de resumen de operación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Colegios</span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{statsColegios.total}</p>
              <p className="text-xs text-slate-500 mt-1">Registrados en la plataforma</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">En Operación: Plan</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{statsColegios.enPlan}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Suscripción permanente sin expiración</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">En Operación: Demo</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{statsColegios.enDemo}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">Demostración de 1 mes desde alta</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Ingreso Mensual Plan</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${statsColegios.ingresosMensualesPlan.toLocaleString('es-MX')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Costo base actual: ${planConfig.precioBaseMensual.toLocaleString('es-MX')}/mes
              </p>
            </div>
          </div>

          {/* Barra de búsqueda y filtro por tipo de operación */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por colegio, código o administrador..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 uppercase">Filtrar operación:</span>
              <button
                onClick={() => setFilterOperacion('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterOperacion === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({colleges.length})
              </button>
              <button
                onClick={() => setFilterOperacion('plan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterOperacion === 'plan'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Plan Permanente ({statsColegios.enPlan})
              </button>
              <button
                onClick={() => setFilterOperacion('demo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterOperacion === 'demo'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Demo 1 Mes ({statsColegios.enDemo})
              </button>
            </div>
          </div>

          {/* Tabla de Colegios y su Tipo de Operación */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Colegio / Institución</th>
                    <th className="py-3.5 px-4">Tipo de Operación</th>
                    <th className="py-3.5 px-4">Vigencia / Expiración</th>
                    <th className="py-3.5 px-4">Comunidad</th>
                    <th className="py-3.5 px-4">Cuota Mensual</th>
                    <th className="py-3.5 px-4">Estado de Pago</th>
                    <th className="py-3.5 px-5 text-right">Cambiar Operación / Fiscales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-sm">
                  {filteredColleges.map(college => {
                    const op = college.operacion || 'plan';
                    const demoInfo = getDemoRemainingInfo(college);
                    const collegeStudents = students.filter(s => s.colegioId === college.id).length;
                    const collegeStaff = users.filter(
                      u => u.colegioId === college.id && u.rol !== 'tutor' && u.rol !== 'superadmin' && u.rol !== 'soporte'
                    ).length;
                    const cuota =
                      op === 'demo'
                        ? 0
                        : college.montoMensual && college.montoMensual > 0
                        ? college.montoMensual
                        : planConfig.precioBaseMensual;

                    return (
                      <tr key={college.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                              {college.nombre.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                {college.nombre}
                                {!college.activo && (
                                  <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-md font-semibold">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                Código: <span className="font-mono font-semibold">{college.codigo}</span> • Resp:{' '}
                                {college.Responsable || 'Sin asignar'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {op === 'plan' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              2.- Plan (Permanente)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              1.- Demo (1 Mes)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {op === 'plan' ? (
                            <div className="text-xs">
                              <span className="font-semibold text-slate-700">Permanente</span>
                              <p className="text-slate-400">Alta: {college.creadoEn || 'N/A'}</p>
                            </div>
                          ) : (
                            <div className="text-xs">
                              <div
                                className={`font-bold flex items-center gap-1 ${
                                  demoInfo?.expired ? 'text-rose-600' : 'text-amber-700'
                                }`}
                              >
                                {demoInfo?.expired && <AlertTriangle className="w-3.5 h-3.5" />}
                                {demoInfo?.text}
                              </div>
                              <p className="text-slate-400">
                                Vence: {college.fechaExpiracionDemo || '1 mes desde alta'}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-900">{collegeStudents}</span> alumnos
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{collegeStaff}</span> personal
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {op === 'demo' ? (
                            <span className="text-xs font-semibold text-slate-400">Sin costo ($0)</span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900">
                                ${cuota.toLocaleString('es-MX')}
                              </span>
                              <span className="text-xs text-slate-400"> /mes</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {op === 'demo' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              Período de Prueba
                            </span>
                          ) : college.estadoPago === 'al_corriente' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                              Al corriente
                            </span>
                          ) : college.estadoPago === 'pendiente' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                              Pago pendiente
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700">
                              Vencido
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {op === 'demo' ? (
                              <button
                                onClick={() => handleToggleOperacion(college, 'plan')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                                title="Pasar este colegio a operación Plan Permanente"
                              >
                                Pasar a Plan
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleOperacion(college, 'demo')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                title="Cambiar a modalidad Demo de 1 mes"
                              >
                                Cambiar a Demo
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenFiscalModal(college)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                              title="Configurar RFC y datos fiscales del colegio"
                            >
                              {college.datosFiscales?.rfc ? 'RFC Configurado' : 'Datos Fiscales'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredColleges.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">
                        No se encontraron colegios con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 2: CONFIGURAR COSTO DEL PLAN
      ===================================================================== */}
      {activeTab === 'costo_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de configuración del Plan */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Configuración del Costo del Plan</h2>
                <p className="text-xs text-slate-500">
                  Define el precio mensual oficial para los colegios que operan bajo la modalidad <strong>2.- Plan (Permanente)</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePlanConfig} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Costo Mensual del Plan (MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={planConfig.precioBaseMensual}
                      onChange={e =>
                        setPlanConfig(prev => ({ ...prev, precioBaseMensual: Number(e.target.value) }))
                      }
                      className="w-full pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Este monto se asignará automáticamente a los colegios en modalidad Plan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Tasa de IVA (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={planConfig.tasaIva}
                    onChange={e => setPlanConfig(prev => ({ ...prev, tasaIva: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planConfig.incluyeIva}
                      onChange={e => setPlanConfig(prev => ({ ...prev, incluyeIva: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">El costo ya incluye IVA</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Si está activo, el sistema desglosará el IVA dentro de los ${planConfig.precioBaseMensual.toLocaleString('es-MX')}.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Día de corte mensual
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={planConfig.diaCorteMensual}
                    onChange={e =>
                      setPlanConfig(prev => ({ ...prev, diaCorteMensual: Number(e.target.value) }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Día del mes para emisión de factura</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Días de tolerancia de pago
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={planConfig.diasTolerancia}
                    onChange={e =>
                      setPlanConfig(prev => ({ ...prev, diasTolerancia: Number(e.target.value) }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Antes de marcar pago como vencido</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Concepto predeterminado para Facturación (CFDI)
                </label>
                <input
                  type="text"
                  value={planConfig.descripcionPlan}
                  onChange={e => setPlanConfig(prev => ({ ...prev, descripcionPlan: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToExistingColleges}
                    onChange={e => setApplyToExistingColleges(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-indigo-950 block">
                      Actualizar cuota en todos los colegios con operación "Plan" actuales ({statsColegios.enPlan} colegios)
                    </span>
                    <span className="text-xs text-indigo-700">
                      Los colegios en modalidad Demo conservarán costo $0 hasta que pasen a Plan.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Guardar Costo del Plan
                </button>
              </div>
            </form>
          </div>

          {/* Vista previa de Desglose Contable del Plan */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Simulación de Facturación por Colegio
              </span>
              <h3 className="text-lg font-bold mt-3">Desglose Fiscal del Plan</h3>
              <p className="text-xs text-slate-400 mt-1">
                Así se calculará cada factura mensual para tus colegios en modalidad Plan:
              </p>

              {(() => {
                const preview = calculateTaxBreakdown(Number(planConfig.precioBaseMensual) || 0);
                return (
                  <div className="mt-5 space-y-3 border-t border-slate-800 pt-4 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal (Base gravable):</span>
                      <span className="font-mono font-semibold">
                        ${preview.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>IVA Trasladado ({planConfig.tasaIva}%):</span>
                      <span className="font-mono font-semibold">
                        ${preview.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-3">
                      <span>Total a Facturar / Cobrar:</span>
                      <span className="font-mono text-emerald-400">
                        ${preview.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-6 p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Proyección con {statsColegios.enPlan} colegio(s) en Plan:
                </div>
                <p>
                  Ingreso mensual proyectado:{' '}
                  <strong className="text-emerald-400">
                    $
                    {(
                      calculateTaxBreakdown(Number(planConfig.precioBaseMensual) || 0).total *
                      statsColegios.enPlan
                    ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    MXN
                  </strong>
                </p>
              </div>
            </div>

            {/* Ajuste individual por colegio si alguno tiene tarifa especial */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900">Tarifa por Colegio en Plan</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Puedes ajustar individualmente la mensualidad si algún colegio tiene descuento o convenio:
              </p>
              <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {colleges
                  .filter(c => (c.operacion || 'plan') === 'plan')
                  .map(col => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                    >
                      <span className="font-semibold text-slate-800 truncate">{col.nombre}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min={0}
                          value={col.montoMensual ?? planConfig.precioBaseMensual}
                          onChange={e =>
                            updateCollege(col.id, { montoMensual: Number(e.target.value) })
                          }
                          className="w-24 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 3: CONTABILIDAD Y FACTURACIÓN
      ===================================================================== */}
      {activeTab === 'contabilidad' && (
        <div className="space-y-6">
          {/* Barra de control de período y exportación contable */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Período Fiscal / Contable
                </label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="mt-0.5 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar Gasto / Egreso
              </button>
              <button
                onClick={handleExportAccountingCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                Exportar Cédula Contable (CSV / Excel)
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen Contable e Impuestos (IVA e ISR/Utilidad) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ingresos Cobrados ({selectedPeriod})
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${accountingSummary.ingresosBrutos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Subtotal: ${accountingSummary.ingresosSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} • Por cobrar: $
                {accountingSummary.totalPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gastos Deducibles ({selectedPeriod})
                </span>
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${accountingSummary.egresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Subtotal: ${accountingSummary.egresosSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({periodExpenses.length} comprobantes)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Balance de IVA del Mes
                </span>
                <Receipt className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-950 mt-2">
                ${accountingSummary.ivaPorPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Trasladado: ${accountingSummary.ivaTrasladado.toFixed(2)} − Acreditable: ${accountingSummary.ivaAcreditable.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Utilidad Operativa Neta
                </span>
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <p
                className={`text-2xl font-bold mt-2 ${
                  accountingSummary.utilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                ${accountingSummary.utilidadNeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Facturas por emitir: <strong>{accountingSummary.pendientesFacturarCount}</strong>
              </p>
            </div>
          </div>

          {/* Tabla de Facturación por Hacer a Colegios */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Control de Facturación Mensual a Colegios ({selectedPeriod})
                </h3>
                <p className="text-xs text-slate-500">
                  Revisa qué colegios en modalidad Plan requieren factura CFDI, verifica su RFC y marca los folios emitidos.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Mostrando {periodInvoices.length} colegio(s) en operación Plan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Colegio</th>
                    <th className="py-3 px-4">Datos Fiscales (Receptor)</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">IVA ({planConfig.tasaIva}%)</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Estado de Cobro</th>
                    <th className="py-3 px-4">Factura CFDI</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-sm">
                  {periodInvoices.map(inv => {
                    const col = colleges.find(c => c.id === inv.colegioId);
                    const df = col?.datosFiscales;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{inv.colegioNombre}</div>
                          <div className="text-xs text-slate-400">
                            Método: {inv.metodoPago} • {inv.formaPago.split(' - ')[0]}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {df?.rfc ? (
                            <div>
                              <span className="font-mono font-bold text-slate-900">{df.rfc}</span>
                              <p className="text-slate-500 truncate max-w-[200px]">{df.razonSocial}</p>
                              <p className="text-[11px] text-slate-400">
                                CP: {df.codigoPostalFiscal || 'S/N'} • {(df.usoCfdi || df.usoCFDI || 'G03').split(' - ')[0]}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => col && handleOpenFiscalModal(col)}
                              className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold hover:bg-amber-100"
                            >
                              + Capturar RFC y Razón Social
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                          ${inv.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                          ${inv.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ${inv.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.estadoPago === 'pagado' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                              Pagado
                            </span>
                          ) : inv.estadoPago === 'pendiente' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                              Por cobrar
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700">
                              Vencido
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.estadoFactura === 'emitida' ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                                Emitida ({inv.folioFactura || 'CFDI'})
                              </span>
                            </div>
                          ) : inv.estadoFactura === 'no_requiere' ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              Público en Gral.
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                              Pendiente emitir
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingReceiptInvoice(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Ver Recibo Oficial de Pago My College"
                            >
                              <Receipt className="w-3.5 h-3.5 text-amber-700" />
                              Recibo
                            </button>
                            <button
                              onClick={() => setEditingInvoice(inv)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                            >
                              Facturar / Cobro
                            </button>
                            {col && (
                              <button
                                onClick={() => handleOpenFiscalModal(col)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                title="Editar datos fiscales del colegio"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {periodInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                        No hay colegios activos en modalidad Plan para facturar en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Gastos y Egresos Operativos (Para deducciones e IVA acreditable) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bitácora de Gastos y Facturas Recibidas (IVA Acreditable)
                </h3>
                <p className="text-xs text-slate-500">
                  Registra tus gastos de servidores, licencias o contabilidad para calcular automáticamente tu IVA a favor o por pagar.
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                Agregar Gasto
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Fecha</th>
                    <th className="py-3 px-4">Concepto / Categoría</th>
                    <th className="py-3 px-4">Proveedor / RFC</th>
                    <th className="py-3 px-4">Folio CFDI</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">IVA Acreditable</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-5 text-right">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-sm">
                  {periodExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 text-xs font-medium text-slate-600">{exp.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{exp.concepto}</div>
                        <span className="text-[11px] text-slate-500">{exp.categoria}</span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-slate-800">{exp.proveedor}</div>
                        {exp.rfcProveedor && <span className="font-mono text-slate-400">{exp.rfcProveedor}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{exp.folioFactura || '-'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        ${exp.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-emerald-700 font-semibold">
                        ${exp.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${exp.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setExpenses(prev => prev.filter(item => item.id !== exp.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Eliminar registro de gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {periodExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                        No hay gastos operativos registrados en el período {selectedPeriod}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONFIGURAR DATOS FISCALES DE UN COLEGIO
      ===================================================================== */}
      {editingFiscalCollege && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Datos Fiscales del Colegio</h3>
                <p className="text-xs text-slate-500">{editingFiscalCollege.nombre}</p>
              </div>
              <button
                onClick={() => setEditingFiscalCollege(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFiscalData} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">RFC Receptor *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    placeholder="XAXX010101000"
                    value={fiscalForm.rfc}
                    onChange={e => setFiscalForm(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2 text-sm font-mono uppercase border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Código Postal Fiscal *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="06600"
                    value={fiscalForm.codigoPostalFiscal}
                    onChange={e => setFiscalForm(prev => ({ ...prev, codigoPostalFiscal: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Razón Social (Sin régimen societario) *
                </label>
                <input
                  type="text"
                  required
                  value={fiscalForm.razonSocial}
                  onChange={e => setFiscalForm(prev => ({ ...prev, razonSocial: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Régimen Fiscal *</label>
                <select
                  value={fiscalForm.regimenFiscal}
                  onChange={e => setFiscalForm(prev => ({ ...prev, regimenFiscal: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                >
                  {REGIMENES_FISCALES.map(reg => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Uso de CFDI</label>
                  <select
                    value={fiscalForm.usoCfdi}
                    onChange={e => setFiscalForm(prev => ({ ...prev, usoCfdi: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    {USOS_CFDI.map(uso => (
                      <option key={uso} value={uso}>
                        {uso}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Correo para envío CFDI</label>
                  <input
                    type="email"
                    value={fiscalForm.correoFacturacion}
                    onChange={e => setFiscalForm(prev => ({ ...prev, correoFacturacion: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFiscalCollege(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Guardar Datos Fiscales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REGISTRAR / ACTUALIZAR FACTURA Y COBRO DE COLEGIO
      ===================================================================== */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Control de Factura y Cobro</h3>
                <p className="text-xs text-slate-500">
                  {editingInvoice.colegioNombre} • Período {editingInvoice.periodo}
                </p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Estado de la Factura CFDI</label>
                  <select
                    value={editingInvoice.estadoFactura}
                    onChange={e =>
                      setEditingInvoice({
                        ...editingInvoice,
                        estadoFactura: e.target.value as CollegeInvoiceRecord['estadoFactura']
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="pendiente_emitir">Pendiente de emitir</option>
                    <option value="emitida">Factura CFDI Emitida</option>
                    <option value="no_requiere">Público en General (No solicita RFC individual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Folio Fiscal / Serie CFDI</label>
                  <input
                    type="text"
                    placeholder="Ej. A-0042 o UUID"
                    value={editingInvoice.folioFactura || ''}
                    onChange={e => setEditingInvoice({ ...editingInvoice, folioFactura: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Estado de Cobro</label>
                  <select
                    value={editingInvoice.estadoPago}
                    onChange={e =>
                      setEditingInvoice({
                        ...editingInvoice,
                        estadoPago: e.target.value as CollegeInvoiceRecord['estadoPago']
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="pagado">Pagado (Al corriente)</option>
                    <option value="pendiente">Pendiente de pago</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Monto Total (MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice.total}
                    onChange={e => {
                      const val = Number(e.target.value) || 0;
                      const { subtotal, iva, total } = calculateTaxBreakdown(val);
                      setEditingInvoice({ ...editingInvoice, subtotal, iva, total });
                    }}
                    className="w-full px-3.5 py-2 text-sm font-bold border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Método de Pago SAT</label>
                  <select
                    value={editingInvoice.metodoPago}
                    onChange={e =>
                      setEditingInvoice({
                        ...editingInvoice,
                        metodoPago: e.target.value as 'PUE' | 'PPD'
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="PUE">PUE - Pago en una sola exhibición</option>
                    <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Forma de Pago SAT</label>
                  <select
                    value={editingInvoice.formaPago}
                    onChange={e => setEditingInvoice({ ...editingInvoice, formaPago: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="03 - Transferencia electrónica de fondos">03 - Transferencia electrónica</option>
                    <option value="04 - Tarjeta de crédito">04 - Tarjeta de crédito</option>
                    <option value="28 - Tarjeta de débito">28 - Tarjeta de débito</option>
                    <option value="01 - Efectivo">01 - Efectivo</option>
                    <option value="99 - Por definir">99 - Por definir</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REGISTRAR GASTO / EGRESO OPERATIVO
      ===================================================================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrar Gasto Deducible</h3>
                <p className="text-xs text-slate-500">Agrega facturas recibidas para el cálculo de IVA acreditable</p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.fecha}
                    onChange={e => setNewExpense(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría</label>
                  <select
                    value={newExpense.categoria}
                    onChange={e =>
                      setNewExpense(prev => ({
                        ...prev,
                        categoria: e.target.value as PlatformExpenseRecord['categoria']
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Servidores y Nube">Servidores y Nube</option>
                    <option value="Licencias y Software">Licencias y Software</option>
                    <option value="Honorarios / Contabilidad">Honorarios / Contabilidad</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Concepto del Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Hosting y Servidores AWS / Google Cloud"
                  value={newExpense.concepto}
                  onChange={e => setNewExpense(prev => ({ ...prev, concepto: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Proveedor</label>
                  <input
                    type="text"
                    placeholder="Nombre o Razón Social"
                    value={newExpense.proveedor}
                    onChange={e => setNewExpense(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">RFC Proveedor</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="Opcional"
                    value={newExpense.rfcProveedor}
                    onChange={e => setNewExpense(prev => ({ ...prev, rfcProveedor: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Folio Factura (CFDI)</label>
                  <input
                    type="text"
                    placeholder="Ej. F-9012"
                    value={newExpense.folioFactura}
                    onChange={e => setNewExpense(prev => ({ ...prev, folioFactura: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Total con IVA (MXN) *</label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newExpense.total}
                    onChange={e => setNewExpense(prev => ({ ...prev, total: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RECIBO OFICIAL DE PAGO MY COLLEGE
      ===================================================================== */}
      {viewingReceiptInvoice && (() => {
        const receiptCollege = colleges.find(c => c.id === viewingReceiptInvoice.colegioId);
        const df = receiptCollege?.datosFiscales;
        const [yearStr, monthStr] = viewingReceiptInvoice.periodo.split('-');
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const monthLabel = monthNames[Math.max(0, Math.min(11, Number(monthStr) - 1))] || monthStr;
        const periodLabel = `${monthLabel} ${yearStr}`;
        const receiptFolio = viewingReceiptInvoice.folioFactura
          ? viewingReceiptInvoice.folioFactura
          : `REC-MC-${viewingReceiptInvoice.periodo.replace('-', '')}-${viewingReceiptInvoice.colegioId.slice(-4).toUpperCase()}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Barra superior de acciones del modal */}
              <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Comprobante y Recibo Oficial de Suscripción
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0B2545] text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    Imprimir / Descargar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const invToEdit = viewingReceiptInvoice;
                      setViewingReceiptInvoice(null);
                      setEditingInvoice(invToEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Editar Cobro / CFDI
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingReceiptInvoice(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cuerpo del Recibo Oficial */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Encabezado Institucional con Escudo de My College */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#0B2545]">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#0B2545] p-2.5 flex items-center justify-center shadow-md border-2 border-[#C59B27] shrink-0">
                      <img
                        src="/my-college-logo.svg"
                        alt="Escudo Oficial My College"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold uppercase tracking-widest text-amber-900">
                        Comprobante Oficial de Operación
                      </div>
                      <h2 className="text-xl font-extrabold text-[#0B2545] tracking-tight mt-1">
                        MY COLLEGE OFICIAL
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Plataforma Integral de Administración y Gestión Escolar
                      </p>
                      <p className="text-[11px] text-slate-400">
                        RFC Emisor: MCO240101AAA • Régimen General de Ley Personas Morales (601)
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Folio de Recibo / CFDI
                    </span>
                    <span className="text-sm font-mono font-extrabold text-[#0B2545] block mt-0.5">
                      {receiptFolio}
                    </span>
                    <div className="mt-2 flex sm:justify-end">
                      {viewingReceiptInvoice.estadoPago === 'pagado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PAGADO
                        </span>
                      ) : viewingReceiptInvoice.estadoPago === 'pendiente' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          POR COBRAR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          VENCIDO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloque de Datos del Colegio (Cliente) y Datos del Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Datos Institucionales y Fiscales del Colegio */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545]">
                        Datos del Colegio / Receptor
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        Código: {receiptCollege?.codigo || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      {receiptCollege?.escudoUrl && (
                        <img
                          src={receiptCollege.escudoUrl}
                          alt={viewingReceiptInvoice.colegioNombre}
                          className="w-11 h-11 rounded-lg object-contain bg-white p-1 border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="text-xs space-y-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">
                          {viewingReceiptInvoice.colegioNombre}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-700">Razón Social:</strong>{' '}
                          {df?.razonSocial || viewingReceiptInvoice.colegioNombre}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-700">RFC Receptor:</strong>{' '}
                          <span className="font-mono font-bold text-slate-900">
                            {df?.rfc || 'XAXX010101000 (Público en General)'}
                          </span>
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-700">Régimen Fiscal:</strong>{' '}
                          {df?.regimenFiscal || '603 - Personas Morales con Fines no Lucrativos'}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-700">Uso CFDI:</strong>{' '}
                          {df?.usoCfdi || 'G03 - Gastos en general'} •{' '}
                          <strong className="text-slate-700">C.P.:</strong>{' '}
                          {df?.codigoPostalFiscal || 'Sin registrar'}
                        </p>
                        <p className="text-slate-500">
                          <strong className="text-slate-700">Responsable:</strong>{' '}
                          {receiptCollege?.Responsable || 'Administración General'} ({receiptCollege?.email || 'Sin correo'})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detalles de Operación, Fechas y Forma de Pago */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545]">
                        Información de Cobro y Operación
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        2.- Plan Permanente
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Período Facturado:</span>
                        <span className="font-bold text-slate-900">{periodLabel} ({viewingReceiptInvoice.periodo})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Fecha de Corte / Emisión:</span>
                        <span className="font-semibold text-slate-800">
                          {viewingReceiptInvoice.fechaEmision || `${viewingReceiptInvoice.periodo}-${String(planConfig.diaCorteMensual).padStart(2, '0')}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Fecha de Pago Aplicado:</span>
                        <span className="font-semibold text-slate-800">
                          {viewingReceiptInvoice.estadoPago === 'pagado'
                            ? viewingReceiptInvoice.fechaPago || `${viewingReceiptInvoice.periodo}-05`
                            : 'Pendiente de liquidar'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Estado Factura CFDI:</span>
                        <span className="font-semibold text-indigo-700">
                          {viewingReceiptInvoice.estadoFactura === 'emitida'
                            ? `Emitida (${viewingReceiptInvoice.folioFactura || 'Timbrada'})`
                            : viewingReceiptInvoice.estadoFactura === 'no_requiere'
                            ? 'Recibo Global / Sin RFC'
                            : 'Pendiente de timbrar'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Método y Forma de Pago SAT:</span>
                        <span className="font-semibold text-slate-800">
                          {viewingReceiptInvoice.metodoPago} ({viewingReceiptInvoice.metodoPago === 'PUE' ? 'Pago en una sola exhibición' : 'Pago en parcialidades o diferido'}) — {viewingReceiptInvoice.formaPago}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Concepto de Cobro, Subtotal, IVA y Total */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0B2545] text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Cant.</th>
                        <th className="py-3 px-4">Clave SAT</th>
                        <th className="py-3 px-4">Concepto de Cobro / Descripción del Servicio</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right">IVA ({planConfig.tasaIva}%)</th>
                        <th className="py-3 px-4 text-right">Importe Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      <tr className="bg-white">
                        <td className="py-4 px-4 font-bold text-slate-900 align-top">1.00</td>
                        <td className="py-4 px-4 font-mono text-slate-600 align-top">
                          81112100
                          <span className="block text-[10px] text-slate-400">E48 - Servicio</span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900 text-sm">
                            Suscripción Mensual My College — Modalidad Plan Permanente ({periodLabel})
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {planConfig.descripcionPlan}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Institución: {viewingReceiptInvoice.colegioNombre} (CCT: {receiptCollege?.codigoCCT || 'N/A'})
                          </p>
                        </td>
                        <td className="py-4 px-4 font-mono text-right text-slate-800 align-top">
                          ${viewingReceiptInvoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 font-mono text-right text-slate-800 align-top">
                          ${viewingReceiptInvoice.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-right text-slate-900 text-sm align-top">
                          ${viewingReceiptInvoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Desglose de Impuestos y Total Final */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500 space-y-1.5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      Documento Validado por el Panel Central Maestro My College
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Este recibo ampara el cobro de la mensualidad de operación bajo modalidad Plan Permanente en la plataforma My College. Moneda: MXN (Peso Mexicano).
                    </p>
                  </div>

                  <div className="w-full md:w-80 bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-md">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Subtotal (Antes de IVA):</span>
                      <span className="font-mono font-semibold">
                        ${viewingReceiptInvoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>IVA Trasladado ({planConfig.tasaIva}%):</span>
                      <span className="font-mono font-semibold">
                        ${viewingReceiptInvoice.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                    <div className="border-t border-slate-700 pt-2.5 flex justify-between items-baseline">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Total Neto:
                      </span>
                      <span className="text-lg font-mono font-extrabold text-emerald-400">
                        ${viewingReceiptInvoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
