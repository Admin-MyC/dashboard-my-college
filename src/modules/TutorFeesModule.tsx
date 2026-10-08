import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  QrCode,
  Printer,
  X,
  Check,
  Repeat,
  FileText,
  User,
} from 'lucide-react';
import { Student } from '../types';
import { calculatePlatformFee } from '../utils/feeCalculator';

interface FeeItem {
  id: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  fechaVencimiento: string;
  estatus: 'pagado' | 'pendiente' | 'proximo';
  folioComprobante?: string;
  fechaPago?: string;
  metodoPago?: string;
  llevaImagen?: boolean;
  imagenUrl?: string;
  esRecurrenteMensual?: boolean;
  fechaCobroMensual?: string;
  diaCobroMensual?: number;
  solicitaFactura?: boolean;
  folioFactura?: string;
}

interface TutorFeesProps {
  onNavigateTab?: (tab: string) => void;
}

export const TutorFeesModule: React.FC<TutorFeesProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    students,
    colleges,
    activeCollege,
    updateStudent,
    preenrollments,
    confirmPreenrollmentPayment,
    sendEmailNotification,
    platformFeeConfig,
    billingConcepts,
    addActivityLog,
  } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentModalItem, setPaymentModalItem] = useState<FeeItem | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'spei' | 'oxxo'>('tarjeta');
  const [receiptItem, setReceiptItem] = useState<FeeItem | null>(null);
  const [invoiceRequests, setInvoiceRequests] = useState<Record<string, boolean>>({});
  const [fiscalAlertMessage, setFiscalAlertMessage] = useState<string | null>(null);

  const hasValidFiscalData = Boolean(
    currentUser.datosFiscales?.rfc &&
      currentUser.datosFiscales.rfc.trim().length >= 12 &&
      currentUser.datosFiscales.razonSocial?.trim()
  );

  const handleToggleInvoiceCheckbox = (fee: FeeItem, checked: boolean) => {
    setFiscalAlertMessage(null);
    if (checked && !hasValidFiscalData) {
      setFiscalAlertMessage(
        'Para solicitar factura en tus conceptos de colegiatura debes dar de alta primero tus Datos Fiscales (RFC, Razón Social, Régimen Fiscal y Código Postal) en el módulo "Mi Perfil".'
      );
      return;
    }
    setInvoiceRequests((prev) => ({
      ...prev,
      [fee.id]: checked,
    }));
    addActivityLog({
      modulo: 'Control de Colegiaturas (Tutor)',
      accion: checked ? 'Solicitud de Factura CFDI Activada' : 'Solicitud de Factura CFDI Desactivada',
      detalle: `${checked ? 'Activó' : 'Desactivó'} la casilla "Solicitar Factura" para el concepto "${fee.concepto}"${
        currentUser.datosFiscales?.rfc ? ` con RFC ${currentUser.datosFiscales.rfc}` : ''
      }.`,
      colegioId: activeStudent?.colegioId || college?.id,
      colegioNombre: college?.nombre,
    });
  };

  // Find linked students (exclude students in estatus 'baja' so there are no cobros en tutores)
  const linkedStudents = students.filter((s) => {
    if (s.estatus === 'baja') return false;
    if (s.tutorId === currentUser.id) return true;
    if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
    if (currentUser.curpsAsociadas && s.curp && currentUser.curpsAsociadas.includes(s.curp.toUpperCase())) return true;
    if (currentUser.correo && s.tutorCorreo && s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()) return true;
    return false;
  });

  const activeStudent =
    linkedStudents.find((s) => s.id === selectedStudentId) || linkedStudents[0];

  const college = activeStudent
    ? colleges.find((c) => c.id === activeStudent.colegioId) || activeCollege
    : activeCollege;

  // Sample fees per student (newly added or imported students use 'default' where no payment is marked as paid yet)
  const [fees, setFees] = useState<Record<string, FeeItem[]>>({
    'std-1': [
      {
        id: 'f-1',
        concepto: 'Inscripción y Ficha Ciclo Escolar 2026-2027',
        monto: 3500,
        fechaVencimiento: '2026-08-15',
        estatus: 'pagado',
        folioComprobante: 'REC-2026-8812',
        fechaPago: '2026-08-10',
        metodoPago: 'Transferencia SPEI',
      },
      {
        id: 'f-2',
        concepto: 'Colegiatura Mensual - Septiembre 2026',
        monto: 4200,
        fechaVencimiento: '2026-09-10',
        estatus: 'pagado',
        folioComprobante: 'REC-2026-9421',
        fechaPago: '2026-09-05',
        metodoPago: 'Tarjeta de Débito',
      },
      {
        id: 'f-3',
        concepto: 'Colegiatura Mensual - Octubre 2026',
        monto: 4200,
        fechaVencimiento: '2026-10-10',
        estatus: 'proximo',
      },
      {
        id: 'f-4',
        concepto: 'Material Didáctico y Seguro Escolar Semestral',
        monto: 1250,
        fechaVencimiento: '2026-10-20',
        estatus: 'pendiente',
      },
      {
        id: 'f-5',
        concepto: 'Colegiatura Mensual - Noviembre 2026',
        monto: 4200,
        fechaVencimiento: '2026-11-10',
        estatus: 'proximo',
      },
    ],
    default: [
      {
        id: 'f-1',
        concepto: 'Inscripción y Ficha Ciclo Escolar 2026-2027',
        monto: 3500,
        fechaVencimiento: '2026-10-15',
        estatus: 'pendiente',
      },
      {
        id: 'f-2',
        concepto: 'Colegiatura Mensual - Septiembre 2026',
        monto: 4200,
        fechaVencimiento: '2026-09-10',
        estatus: 'pendiente',
      },
      {
        id: 'f-3',
        concepto: 'Colegiatura Mensual - Octubre 2026',
        monto: 4200,
        fechaVencimiento: '2026-10-10',
        estatus: 'pendiente',
      },
      {
        id: 'f-4',
        concepto: 'Material Didáctico y Seguro Escolar Semestral',
        monto: 1250,
        fechaVencimiento: '2026-10-20',
        estatus: 'pendiente',
      },
      {
        id: 'f-5',
        concepto: 'Colegiatura Mensual - Noviembre 2026',
        monto: 4200,
        fechaVencimiento: '2026-11-10',
        estatus: 'proximo',
      },
    ],
  });

  // Find matching preenrollment if any
  const matchingPreenrollment = preenrollments.find(
    (p) =>
      (activeStudent && p.estudianteId === activeStudent.id) ||
      (activeStudent?.curp && p.curp && p.curp.toUpperCase() === activeStudent.curp.toUpperCase())
  );

  // Helper to infer educational level from student grade
  const getStudentLevel = (student?: Student): 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria' => {
    const g = (student?.grado || '').toLowerCase();
    if (g.includes('preescolar') || g.includes('kinder') || g.includes('maternal')) return 'preescolar';
    if (g.includes('primaria')) return 'primaria';
    if (g.includes('secundaria')) return 'secundaria';
    if (g.includes('preparatoria') || g.includes('bachillerato') || g.includes('semestre')) return 'preparatoria';
    return 'primaria';
  };

  // Computed fees list: if active student is 'pendiente', ensure the official Inscription Fee is placed at the top, and include published BillingConcepts for this student's level
  const studentFees = React.useMemo(() => {
    if (!activeStudent || activeStudent.estatus === 'baja') return [];
    const rawList = activeStudent && fees[activeStudent.id] ? fees[activeStudent.id] : fees.default;
    const studentLevel = getStudentLevel(activeStudent);
    const safeConcepts = Array.isArray(billingConcepts) ? billingConcepts : [];
    const publishedConcepts: FeeItem[] = safeConcepts
      .filter(
        (c) =>
          c &&
          c.activo &&
          c.colegioId === (activeStudent?.colegioId || college?.id) &&
          Array.isArray(c.nivelesPublicados) &&
          c.nivelesPublicados.includes(studentLevel)
      )
      .map((c) => {
        const existingPaid = rawList.find((r) => r.id === `concept-${c.id}`);
        if (existingPaid) return existingPaid;
        return {
          id: `concept-${c.id}`,
          concepto: c.concepto,
          descripcion: c.descripcion,
          monto: c.precio,
          fechaVencimiento: c.esRecurrenteMensual
            ? c.fechaCobroMensual || '2026-10-10'
            : c.fechaVencimiento || '2026-10-30',
          estatus: 'pendiente' as const,
          llevaImagen: c.llevaImagen,
          imagenUrl: c.imagenUrl,
          esRecurrenteMensual: c.esRecurrenteMensual,
          fechaCobroMensual: c.fechaCobroMensual,
          diaCobroMensual: c.diaCobroMensual,
        };
      });

    const mergedList = [
      ...publishedConcepts,
      ...rawList.filter((r) => !r.id.startsWith('concept-')),
    ];

    if (activeStudent && (activeStudent.estatus === 'pendiente' || matchingPreenrollment?.estadoPago === 'pendiente_pago')) {
      const hasInscriptionFee = mergedList.some((f) => f.id.startsWith('f-inscripcion-'));
      if (!hasInscriptionFee) {
        const inscripcionItem: FeeItem = {
          id: `f-inscripcion-${activeStudent.id}`,
          concepto: `Cuota de Inscripción Oficial Ciclo Escolar 2026-2027 (${activeStudent.grado})`,
          monto: matchingPreenrollment?.montoTotalInscripcion || 3500,
          fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estatus: 'pendiente',
        };
        return [inscripcionItem, ...mergedList.filter((f) => !f.concepto.toLowerCase().includes('inscripción y ficha'))];
      }
    }
    return mergedList;
  }, [activeStudent, fees, matchingPreenrollment, billingConcepts, college?.id]);

  const getFinalAmount = (baseMonto: number) =>
    calculatePlatformFee(baseMonto, platformFeeConfig, college?.id).montoTotal;

  const totalPaid = studentFees
    .filter((f) => f.estatus === 'pagado')
    .reduce((acc, f) => acc + getFinalAmount(f.monto), 0);

  const totalPending = studentFees
    .filter((f) => f.estatus !== 'pagado')
    .reduce((acc, f) => acc + getFinalAmount(f.monto), 0);

  const handleConfirmPayment = () => {
    if (!paymentModalItem) return;
    const isInscriptionPayment =
      paymentModalItem.id.startsWith('f-inscripcion-') ||
      paymentModalItem.concepto.toLowerCase().includes('inscripción') ||
      activeStudent?.estatus === 'pendiente';

    const wantsInvoice = Boolean(invoiceRequests[paymentModalItem.id] || paymentModalItem.solicitaFactura);
    const updatedFee: FeeItem = {
      ...paymentModalItem,
      estatus: 'pagado',
      folioComprobante: 'REC-2026-' + Math.floor(1000 + Math.random() * 9000),
      fechaPago: new Date().toISOString().split('T')[0],
      metodoPago:
        paymentMethod === 'tarjeta'
          ? 'Tarjeta de Débito/Crédito'
          : paymentMethod === 'spei'
          ? 'Transferencia SPEI'
          : 'Tienda OXXO Pay',
      solicitaFactura: wantsInvoice,
      folioFactura: wantsInvoice ? 'CFDI-40-' + Math.floor(10000 + Math.random() * 90000) : undefined,
    };

    addActivityLog({
      modulo: 'Control de Colegiaturas (Tutor)',
      accion: wantsInvoice ? 'Pago de Concepto con Solicitud de Factura' : 'Pago de Concepto Escolar',
      detalle: `El tutor ${currentUser.nombre} realizó el pago del concepto "${paymentModalItem.concepto}" por $${getFinalAmount(
        paymentModalItem.monto
      ).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${updatedFee.metodoPago})${
        wantsInvoice && currentUser.datosFiscales?.rfc
          ? ` solicitando factura para RFC ${currentUser.datosFiscales.rfc} (${currentUser.datosFiscales.razonSocial})`
          : ''
      }.`,
      colegioId: activeStudent?.colegioId || college?.id,
      colegioNombre: college?.nombre,
    });

    setFees((prev) => {
      const studentKey = activeStudent ? activeStudent.id : 'default';
      const currentList = prev[studentKey] || studentFees;
      const updatedList = currentList.map((f) => (f.id === paymentModalItem.id ? updatedFee : f));
      // If paymentModalItem was the dynamically injected fee and not in state yet, ensure it is added
      if (!currentList.some((f) => f.id === paymentModalItem.id)) {
        return {
          ...prev,
          [studentKey]: [updatedFee, ...currentList],
        };
      }
      return {
        ...prev,
        [studentKey]: updatedList,
        default: prev.default.map((f) => (f.id === paymentModalItem.id ? updatedFee : f)),
      };
    });

    // If it was the inscription fee for a pending student, change status to 'inscrito' and make available for group assignment!
    if (isInscriptionPayment && activeStudent) {
      updateStudent(activeStudent.id, {
        estatus: 'inscrito',
        grupo: 'Sin Grupo (Listo para Asignación Oficial)',
      });

      if (matchingPreenrollment) {
        confirmPreenrollmentPayment(matchingPreenrollment.id, updatedFee.folioComprobante);
      }

      setEnrolledNotice(
        `¡Pago de Inscripción Exitoso! El estatus de ${activeStudent.nombre} ha cambiado a "INSCRITO". Control Escolar ya puede asignarle su grupo oficial.`
      );

      sendEmailNotification({
        colegioId: activeStudent.colegioId,
        colegioNombre: college?.nombre || 'My College',
        destinatarios: [currentUser.correo],
        rolesDestino: ['tutor'],
        usuariosDestino: [
          currentUser.id,
          currentUser.correo,
          activeStudent.id,
          ...(currentUser.usuarioLogin ? [currentUser.usuarioLogin] : []),
        ],
        asunto: `[Confirmación de Pago] Inscripción Confirmada para ${activeStudent.nombre}`,
        cuerpo: `Estimado(a) ${currentUser.nombre}:\n\nHemos recibido y validado con éxito el pago de la cuota de inscripción correspondiente a su hijo(a) ${activeStudent.nombre} ${activeStudent.apellidos} por el monto de $${paymentModalItem.monto.toLocaleString()} MXN.\n\nEl estatus del alumno ha cambiado a: INSCRITO.\nEl departamento de Control Escolar procederá a la asignación de su grupo y salón de clases.\n\nComprobante oficial: REC-2026-${Math.floor(1000 + Math.random() * 9000)}\n\nAtentamente,\nDepartamento de Finanzas y Control Escolar`,
        categoria: 'comunicado',
        prioridad: 'alta',
      });
    }

    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentModalItem(null);
    }, 2000);
  };

  const primaryColor = college?.colores?.primario || '#0B2545';
  const goldColor = college?.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Portal de Tutores · Cuotas Escolares</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
            Control de Colegiaturas y Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Revisa el estado de cuenta de tus hijos, fechas límite de pago, comprobantes fiscales oficiales y realiza pagos en línea.
          </p>
        </div>

        {/* School reference */}
        {college && (
          <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/25 flex items-center gap-3 shrink-0">
            {college.escudoUrl && (
              <img
                src={college.escudoUrl}
                alt="Escudo"
                className="w-10 h-10 object-contain p-1 rounded-xl bg-white"
              />
            )}
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold block" style={{ color: goldColor }}>Caja Institucional</span>
              <span className="text-xs font-bold text-white max-w-[160px] truncate block">{college.nombre}</span>
            </div>
          </div>
        )}
      </div>

      {/* Child selector if multiple */}
      {linkedStudents.length > 1 && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
          {linkedStudents.map((st) => {
            const isSelected = activeStudent?.id === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStudentId(st.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <img
                  src={st.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                  alt={st.nombre}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{st.nombre} {st.apellidos}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Enrolled Notice Notification */}
      {enrolledNotice && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-xs font-bold text-emerald-950 flex items-center justify-between gap-3 shadow-sm animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{enrolledNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setEnrolledNotice(null)}
            className="p-1 rounded-lg text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Student Inscription Required Banner */}
      {activeStudent && activeStudent.estatus === 'pendiente' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-orange-500/15 border-2 border-amber-400 rounded-3xl text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="font-display font-black text-sm uppercase tracking-tight">
              Preinscripción Aceptada · Pago de Inscripción Requerido
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-400 ml-auto">
              Estatus Actual: PENDIENTE
            </span>
          </div>
          <p className="text-xs leading-relaxed text-amber-900">
            La solicitud de preinscripción de <strong>{activeStudent.nombre} {activeStudent.apellidos}</strong> fue aprobada por Control Escolar. Para que su estatus cambie oficialmente a <strong>INSCRITO</strong> y el departamento escolar pueda asignarle su salón y grupo de clases, realice el pago de la cuota de inscripción en la tabla de cuotas a continuación.
          </p>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Pagado Ciclo 2026</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-700 font-mono">
            ${totalPaid.toLocaleString()} MXN
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block font-semibold">
            Comprobantes al día
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cuotas Pendientes / Por Vencer</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display font-black text-2xl text-amber-800 font-mono">
            ${totalPending.toLocaleString()} MXN
          </div>
          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-semibold">
            Próximo corte: 10 de Octubre
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Alumno Activo</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-bold text-sm text-slate-900 truncate">
            {activeStudent ? `${activeStudent.nombre} ${activeStudent.apellidos}` : 'Alumno Oficial'}
          </div>
          <span className="text-[10px] text-slate-600 font-mono block">
            Matrícula: {activeStudent?.matricula || 'CCM-2026-081'}
          </span>
        </div>
      </div>

      {/* Fiscal Data Status & Alert Banner for Invoice Requests */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasValidFiscalData
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Facturación Electrónica de Colegiaturas (CFDI 4.0)</span>
              {hasValidFiscalData ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                  RFC Activo: {currentUser.datosFiscales?.rfc}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  RFC Pendiente en Mi Perfil
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-0.5">
              {hasValidFiscalData
                ? `Razón Social registrada: ${currentUser.datosFiscales?.razonSocial} · Marca la casilla "Solicitar Factura" en cualquier concepto.`
                : 'Para poder marcar la casilla "Solicitar Factura" en los conceptos, primero debes dar de alta tu RFC y datos fiscales en tu módulo Mi Perfil.'}
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('mi_perfil')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            <User className="w-3.5 h-3.5 text-indigo-700" />
            <span>{hasValidFiscalData ? 'Ver / Editar RFC en Mi Perfil' : 'Dar de Alta RFC en Mi Perfil'}</span>
          </button>
        )}
      </div>

      {fiscalAlertMessage && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">Datos Fiscales Requeridos para Facturar</div>
              <p className="text-amber-900 mt-0.5">{fiscalAlertMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('mi_perfil')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs cursor-pointer"
              >
                Ir a Mi Perfil
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiscalAlertMessage(null)}
              className="p-1 text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fees List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0B2545]" />
              <span>Desglose de Cuotas y Colegiaturas</span>
            </h3>
            <span className="text-xs text-slate-500">
              Pagos correspondientes al ciclo escolar en curso · Marca la casilla si requieres factura fiscal
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Concepto Escolar</th>
                <th className="py-3 px-4">Fecha de Cobro / Vencimiento</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Solicitar Factura</th>
                <th className="py-3 px-4 text-center">Estado de Pago</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentFees.map((fee) => {
                const isInvoiceChecked = Boolean(invoiceRequests[fee.id] || fee.solicitaFactura);
                return (
                  <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {fee.llevaImagen && fee.imagenUrl && (
                          <img
                            src={fee.imagenUrl}
                            alt={fee.concepto}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                            <span>{fee.concepto}</span>
                            {fee.esRecurrenteMensual && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                <Repeat className="w-2.5 h-2.5" />
                                <span>Mensual</span>
                              </span>
                            )}
                          </div>
                          {fee.descripcion && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{fee.descripcion}</div>
                          )}
                          {fee.folioComprobante && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Folio: {fee.folioComprobante} · Pagado el {fee.fechaPago} ({fee.metodoPago})
                            </span>
                          )}
                          {fee.folioFactura && (
                            <span className="text-[10px] text-indigo-700 font-mono font-bold block">
                              Factura CFDI: {fee.folioFactura} (RFC: {currentUser.datosFiscales?.rfc})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 font-medium">
                      <div>{fee.fechaVencimiento}</div>
                      {fee.esRecurrenteMensual && (
                        <span className="text-[10px] text-indigo-600 font-sans font-bold">
                          Cobro mensual (Día {fee.diaCobroMensual || 10})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-sm text-slate-900">
                      ${getFinalAmount(fee.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-4 px-4 text-center">
                      <label className="inline-flex items-center justify-center gap-2 cursor-pointer select-none px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={isInvoiceChecked}
                          onChange={(e) => handleToggleInvoiceCheckbox(fee, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            isInvoiceChecked ? 'text-indigo-700' : 'text-slate-600'
                          }`}
                        >
                          {isInvoiceChecked ? 'Facturar (RFC)' : 'Solicitar factura'}
                        </span>
                      </label>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {fee.estatus === 'pagado' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pagado</span>
                        </span>
                      ) : fee.estatus === 'pendiente' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pendiente</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Próximo a Vencer</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {fee.estatus === 'pagado' ? (
                        <button
                          type="button"
                          onClick={() => setReceiptItem(fee)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Recibo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaymentModalItem(fee)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pagar en Línea</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Payment Modal */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Pasarela de Pago Escolar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Concept & Total Amount (commission already integrated, no separate commission concept shown) */}
            {(() => {
              const totalConComision = getFinalAmount(paymentModalItem.monto);
              return (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concepto Escolar:</span>
                    <div className="text-xs font-bold text-slate-800">{paymentModalItem.concepto}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                    <span className="text-xs font-extrabold text-slate-900">Monto Total a Liquidar:</span>
                    <span className="font-display font-black text-xl text-slate-900 font-mono">
                      ${totalConComision.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  {/* Checkbox para solicitar factura dentro del modal de pago */}
                  <div className="pt-2.5 border-t border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(invoiceRequests[paymentModalItem.id] || paymentModalItem.solicitaFactura)}
                        onChange={(e) => handleToggleInvoiceCheckbox(paymentModalItem, e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800 block">
                          Solicitar factura electrónica (CFDI 4.0) para este concepto
                        </span>
                        {hasValidFiscalData ? (
                          <span className="text-indigo-700 font-mono">
                            RFC: {currentUser.datosFiscales?.rfc} · {currentUser.datosFiscales?.razonSocial}
                          </span>
                        ) : (
                          <span className="text-amber-800">
                            Requiere registrar tu RFC y datos fiscales en el módulo <strong>Mi Perfil</strong>.
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Selecciona Método de Pago:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'tarjeta', label: 'Tarjeta Débito/Crédito' },
                  { id: 'spei', label: 'SPEI CoDi' },
                  { id: 'oxxo', label: 'OXXO Pay' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'tarjeta' && (
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Número de Tarjeta</label>
                  <input
                    type="text"
                    defaultValue="•••• •••• •••• 4242"
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Vigencia</label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      disabled
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">CVV</label>
                    <input
                      type="password"
                      defaultValue="•••"
                      disabled
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={paymentSuccess}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {paymentSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Pago Confirmado y Comprobante Generado!</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-emerald-200" />
                  <span>
                    Confirmar y Pagar $
                    {getFinalAmount(paymentModalItem.monto).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    MXN
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Comprobante Oficial de Pago
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-amber-300">
                <div className="font-bold text-slate-900">{college?.nombre || 'COLEGIO INSTITUCIONAL'}</div>
                <div className="text-[10px] text-slate-500">SISTEMA OFICIAL DE COBROS Y COLEGIATURAS</div>
                <div className="text-[11px] font-black text-amber-900 mt-1">FOLIO: {receiptItem.folioComprobante}</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div><strong>Alumno:</strong> {activeStudent ? `${activeStudent.nombre} ${activeStudent.apellidos}` : currentUser.nombre}</div>
                <div><strong>Matrícula:</strong> {activeStudent?.matricula || 'CCM-2026-081'}</div>
                <div><strong>Tutor:</strong> {currentUser.nombre}</div>
                <div><strong>Concepto:</strong> {receiptItem.concepto}</div>
                <div><strong>Fecha de Liquidación:</strong> {receiptItem.fechaPago || '2026-09-05'}</div>
                <div><strong>Método:</strong> {receiptItem.metodoPago || 'En Línea'}</div>
              </div>

              <div className="pt-2 border-t border-dashed border-amber-300 flex items-center justify-between text-sm">
                <span className="font-bold">TOTAL PAGADO:</span>
                <span className="font-black text-emerald-800 font-mono">
                  ${getFinalAmount(receiptItem.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              <div className="text-[9px] text-center text-slate-400 pt-1">
                Comprobante digital válido ante el departamento de administración y control escolar.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert('Imprimiendo comprobante oficial...');
                setReceiptItem(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir / Descargar Comprobante</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
