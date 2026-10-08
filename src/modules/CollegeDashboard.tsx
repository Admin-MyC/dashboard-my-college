import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Users,
  Award,
  ShieldAlert,
  Bell,
  Palette,
  FileText,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  AlertCircle,
  Building2,
  ChevronDown,
  TrendingUp,
  CreditCard,
  Check,
  X,
} from 'lucide-react';

interface Props {
  onNavigateTab: (tab: string) => void;
}

const AVAILABLE_MONTHS = [
  { clave: '2026-10', etiqueta: 'Octubre 2026 (Mes Actual)', corto: 'Octubre 2026', cuotaBase: 4500 },
  { clave: '2026-09', etiqueta: 'Septiembre 2026 (Mes Anterior)', corto: 'Septiembre 2026', cuotaBase: 4500 },
  { clave: '2026-08', etiqueta: 'Agosto 2026 (Inicio de Ciclo)', corto: 'Agosto 2026', cuotaBase: 4500 },
  { clave: '2026-07', etiqueta: 'Julio 2026', corto: 'Julio 2026', cuotaBase: 4200 },
  { clave: '2026-06', etiqueta: 'Junio 2026', corto: 'Junio 2026', cuotaBase: 4200 },
  { clave: '2026-05', etiqueta: 'Mayo 2026', corto: 'Mayo 2026', cuotaBase: 4200 },
];

export const CollegeDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    hasRolePermission,
    students,
    teachers,
    subjects,
    incidents,
    notices,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    schoolCycles,
    calendarDays,
    monthlyTuitions,
    toggleMonthlyTuitionPayment,
    billingConcepts,
  } = useApp();

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [showTuitionDetailModal, setShowTuitionDetailModal] = useState<'todos' | 'pagados' | 'pendientes' | null>(null);

  if (!activeCollege) return null;

  // Active campuses for this college
  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;
  const activeCampusObj = hasMultipleCampuses
    ? collegeCampuses.find((c) => c.id === selectedCampusId) || null
    : collegeCampuses[0] || null;

  // Filter college records (scoped by campus if multiple campuses are active and one is selected)
  const collegeStudentsAll = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeStudents =
    hasMultipleCampuses && selectedCampusId
      ? collegeStudentsAll.filter((s) => s.campusId === selectedCampusId)
      : collegeStudentsAll;

  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;

  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const collegeIncidents = incidents.filter((i) => i.colegioId === activeCollege.id);
  const collegeNotices = notices.filter((n) => n.colegioId === activeCollege.id);

  const activeCycle = schoolCycles.find((c) => c.colegioId === activeCollege.id && c.activo);
  const upcomingNonSchoolDays = calendarDays
    .filter((d) => d.colegioId === activeCollege.id)
    .slice(0, 4);

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Overall student GPA
  const avgGpa =
    collegeStudents.length > 0
      ? (
          collegeStudents.reduce((acc, s) => acc + s.promedio, 0) /
          collegeStudents.length
        ).toFixed(1)
      : '0.0';

  // ==========================================
  // CÁLCULO DE COLEGIATURAS MENSUALES (MES POR MES) TOMADO DEL MÓDULO COBROS SIN PORCENTAJE INCREMENTADO
  // ==========================================
  const selectedMonthMeta =
    AVAILABLE_MONTHS.find((m) => m.clave === selectedMonthKey) || AVAILABLE_MONTHS[0];

  // Obtener los conceptos de cobro de mensualidad / colegiatura mensual del colegio desde el módulo Cobros (precio base sin comisión)
  const collegeMonthlyBillingConcepts = React.useMemo(() => {
    const safeList = Array.isArray(billingConcepts) ? billingConcepts : [];
    const forCollege = safeList.filter(
      (c) =>
        c &&
        c.colegioId === activeCollege.id &&
        c.activo !== false &&
        (!selectedCampusId || !c.campusId || c.campusId === selectedCampusId)
    );

    const isMonthlyKeyword = (name: string) => {
      const n = (name || '').toLowerCase();
      return (
        n.includes('colegiatura') ||
        n.includes('mensualidad') ||
        n.includes('cuota mensual') ||
        n.includes('mensual')
      );
    };

    // Priorizar conceptos marcados como recurrentes mensuales o cuyo nombre refiera a colegiatura/mensualidad/cuota mensual
    const monthlyMatches = forCollege.filter(
      (c) => Boolean(c.esRecurrenteMensual) || isMonthlyKeyword(c.concepto)
    );

    if (monthlyMatches.length > 0) return monthlyMatches;
    return forCollege;
  }, [billingConcepts, activeCollege.id, selectedCampusId]);

  const inferStudentLevel = (st: (typeof collegeStudents)[number]): 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria' => {
    if (st.nivel === 'preescolar' || st.nivel === 'primaria' || st.nivel === 'secundaria' || st.nivel === 'preparatoria') {
      return st.nivel;
    }
    const g = (st.grado || '').toLowerCase();
    if (g.includes('preescolar') || g.includes('kinder') || g.includes('maternal')) return 'preescolar';
    if (g.includes('primaria')) return 'primaria';
    if (g.includes('secundaria')) return 'secundaria';
    if (g.includes('preparatoria') || g.includes('bachillerato') || g.includes('semestre')) return 'preparatoria';
    return 'primaria';
  };

  // Resuelve la cuota mensual base (sin comisión) dada de alta en el módulo Cobros para el nivel del alumno o general del colegio
  const getStudentBaseMonthlyFee = (st?: (typeof collegeStudents)[number]): { montoBase: number; conceptoNombre: string } => {
    if (collegeMonthlyBillingConcepts.length > 0) {
      if (st) {
        const lvl = inferStudentLevel(st);
        const byLevel = collegeMonthlyBillingConcepts.find(
          (c) => Array.isArray(c.nivelesPublicados) && c.nivelesPublicados.includes(lvl)
        );
        if (byLevel) {
          return { montoBase: Number(byLevel.precio) || 0, conceptoNombre: byLevel.concepto };
        }
      }
      const primaryConcept = collegeMonthlyBillingConcepts[0];
      return {
        montoBase: Number(primaryConcept.precio) || 0,
        conceptoNombre: primaryConcept.concepto,
      };
    }
    return {
      montoBase: 0,
      conceptoNombre: 'Sin mensualidad registrada en Cobros',
    };
  };

  const defaultCollegeMonthlyFeeInfo = getStudentBaseMonthlyFee();
  const cuotaMensualCobrosBase = defaultCollegeMonthlyFeeInfo.montoBase;
  const conceptoMensualCobrosNombre = defaultCollegeMonthlyFeeInfo.conceptoNombre;

  // Deterministic/stored monthly status for each student in collegeStudents (siempre mostrando el monto base de Cobros sin porcentaje incrementado)
  const studentTuitionRows = collegeStudents.map((st) => {
    const { montoBase, conceptoNombre } = getStudentBaseMonthlyFee(st);
    const stored = monthlyTuitions.find(
      (m) =>
        m.colegioId === activeCollege.id &&
        m.estudianteId === st.id &&
        m.mesClave === selectedMonthKey
    );
    const effectiveBaseAmount = montoBase > 0 ? montoBase : stored?.montoColegiatura || 0;

    if (stored) {
      return {
        student: st,
        pagado: Boolean(stored.pagado),
        monto: effectiveBaseAmount,
        conceptoNombre,
        fechaPago: stored.pagado ? stored.fechaPago : undefined,
        metodoPago: stored.pagado ? stored.metodoPago : undefined,
        folioRecibo: stored.pagado ? stored.folioRecibo : undefined,
      };
    }

    // Al cargar o agregar un nuevo alumno aún no tiene pago registrado, por lo que siempre inicia como pendiente de pago (pagado: false)
    return {
      student: st,
      pagado: false,
      monto: effectiveBaseAmount,
      conceptoNombre,
      fechaPago: undefined,
      metodoPago: undefined,
      folioRecibo: undefined,
    };
  });

  // Scale realistically if the college has a high nominal student count (e.g., 640 students) vs demo list
  const paidStudentsList = studentTuitionRows.filter((r) => r.pagado);
  const pendingStudentsList = studentTuitionRows.filter((r) => !r.pagado);

  const alumnosPagadosCount = paidStudentsList.length;
  const alumnosPendientesCount = pendingStudentsList.length;
  const montoRecolectadoMes = paidStudentsList.reduce((acc, r) => acc + r.monto, 0);
  const montoPorCobrarMes = pendingStudentsList.reduce((acc, r) => acc + r.monto, 0);
  const porcentajeCobranza =
    collegeStudents.length > 0
      ? Math.round((alumnosPagadosCount / collegeStudents.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* College Branded Hero Banner with uploaded escudo and dynamic colors */}
      <div
        className="rounded-2xl p-6 lg:p-8 text-white shadow-md relative overflow-hidden transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 60%, ${primaryColor}bb 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Custom Shield Uploaded by the College (Only rendered if uploaded) */}
            {activeCollege.escudoUrl && (
              <div className="bg-white p-2 rounded-2xl shadow-lg border border-white/20 shrink-0">
                <img
                  src={activeCollege.escudoUrl}
                  alt={activeCollege.nombre}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs"
                  style={{
                    backgroundColor: goldColor,
                    color: primaryColor,
                  }}
                >
                  Plan {activeCollege.plan}
                </span>
                {activeCollege.codigoCCT && (
                  <span className="text-xs text-slate-200 font-mono">
                    {activeCollege.codigoCCT}
                  </span>
                )}
                {activeCycle && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{activeCycle.nombre} ({activeCycle.fechaInicioClases} a {activeCycle.fechaFinClases})</span>
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                {activeCollege.nombre}
              </h2>

              {activeCollege.lema && (
                <p className="text-sm text-slate-200 italic mt-0.5 max-w-xl">
                  "{activeCollege.lema}"
                </p>
              )}

              <div className="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-3">
                <span>Director(a): {activeCollege.director}</span>
                {(activeCampusObj || activeCollege.direccion) && (
                  <>
                    <span>·</span>
                    <span>
                      {activeCampusObj ? `${activeCampusObj.nombre} (${activeCampusObj.direccion})` : activeCollege.direccion}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {hasMultipleCampuses && (
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
            <Building2 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                Campus Activo
              </span>
              <select
                value={selectedCampusId || ''}
                onChange={(e) => setSelectedCampusId(e.target.value || null)}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer pr-2"
              >
                <option value="">
                  Todos los Campus ({collegeCampuses.length})
                </option>
                {collegeCampuses.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={() => onNavigateTab('evaluaciones')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <Award className="w-4 h-4" style={{ color: goldColor }} />
          <span>Evaluaciones y Libreta Docente (100%)</span>
        </button>

        <button
          onClick={() => onNavigateTab('personalizacion')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Palette className="w-4 h-4" />
          <span>Editar Escudo y Colores</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* PANEL FINANCIERO DE COLEGIATURAS POR MES (SOLICITADO EN RESUMEN)      */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Control Mensual de Colegiaturas e Ingresos
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {porcentajeCobranza}% Cobrado
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visualiza mes por mes el número de alumnos al corriente, pendientes de pago y el monto recolectado. Cambia el mes en la lista desplegable para consultar meses anteriores.
              </p>
            </div>
          </div>

          {/* Month Dropdown Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Seleccionar Mes a Consultar:
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-amber-600 absolute left-3 pointer-events-none" />
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="pl-9 pr-9 py-2 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-colors cursor-pointer appearance-none shadow-2xs"
                >
                  {AVAILABLE_MONTHS.map((m) => (
                    <option key={m.clave} value={m.clave}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Financial KPI Cards for the Selected Month */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
          {/* Card 1: Alumnos que han pagado sus colegiaturas */}
          <div className="bg-white p-5 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Alumnos con Colegiatura Pagada
                </span>
                <span className="text-[11px] text-slate-500">
                  Mes: <strong>{selectedMonthMeta.corto}</strong>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-emerald-700 tabular-nums">
                {alumnosPagadosCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                de {collegeStudents.length} alumnos ({porcentajeCobranza}%)
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Al corriente en {selectedMonthMeta.corto}
              </span>
              <button
                type="button"
                onClick={() => setShowTuitionDetailModal('pagados')}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Ver listado →
              </button>
            </div>
          </div>

          {/* Card 2: Alumnos que faltan por pagar */}
          <div className="bg-white p-5 rounded-xl border border-amber-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                  Alumnos que Faltan por Pagar
                </span>
                <span className="text-[11px] text-slate-500">
                  Mes: <strong>{selectedMonthMeta.corto}</strong>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-amber-700 tabular-nums">
                {alumnosPendientesCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                pendientes (${montoPorCobrarMes.toLocaleString('es-MX')} MXN por cobrar)
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span className="text-amber-800 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Adeudo del mes seleccionado
              </span>
              <button
                type="button"
                onClick={() => setShowTuitionDetailModal('pendientes')}
                className="font-bold text-amber-900 hover:underline cursor-pointer"
              >
                Gestionar cobros →
              </button>
            </div>
          </div>

          {/* Card 3: Cantidad de dinero recolectado en el mes */}
          <div className="bg-white p-5 rounded-xl border border-blue-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                  Dinero Recolectado en el Mes
                </span>
                <span className="text-[11px] text-slate-500">
                  Ingresos de <strong>{selectedMonthMeta.corto}</strong>
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor,
                  borderColor: `${primaryColor}25`,
                }}
              >
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span
                className="font-display font-black text-3xl tabular-nums"
                style={{ color: primaryColor }}
              >
                ${montoRecolectadoMes.toLocaleString('es-MX')}
              </span>
              <span className="text-xs font-bold text-slate-500">MXN</span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span
                className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[65%]"
                title={`${conceptoMensualCobrosNombre} (Monto base sin comisión)`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Cuota mensual:{' '}
                  <strong>${cuotaMensualCobrosBase.toLocaleString('es-MX')} MXN</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowTuitionDetailModal('todos')}
                className="font-bold hover:underline cursor-pointer shrink-0"
                style={{ color: primaryColor }}
              >
                Detalle de pagos →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Estudiantes Activos
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeStudents.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeCampusObj ? `En ${activeCampusObj.nombre}` : 'Matriculados en ciclo escolar'}
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cuerpo Docente
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
            >
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeTeachers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeCampusObj ? `Asignados a ${activeCampusObj.nombre}` : 'Profesores titulares y adjuntos'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Promedio Institucional
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${goldColor}20`, color: goldColor }}
            >
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {avgGpa} / 10
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Rendimiento Alto</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Incidencias / Prefectura
            </span>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-slate-900 tabular-nums">
            {collegeIncidents.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {collegeIncidents.filter((i) => i.estatus === 'En seguimiento').length} en seguimiento
          </div>
        </div>
      </div>

      {/* Main Grid: Active Modules Shortcuts & Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enabled Modules Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Módulos Habilitados para {activeCollege.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  Accede rápidamente a las funciones académicas, ciclos escolares, horarios, calendario y campus
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Ciclo Escolar y Asignaciones */}
              {hasRolePermission(currentUser.rol, 'ciclo_escolar') && (
                <button
                  onClick={() => onNavigateTab('ciclo_escolar')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Calendar
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110 text-indigo-600"
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm flex items-center justify-between">
                    <span>Ciclo Escolar</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                      Control
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Inicio/fin de clases y asignaciones
                  </div>
                </button>
              )}

              {/* Horarios de Grupos */}
              {hasRolePermission(currentUser.rol, 'horarios') && (
                <button
                  onClick={() => onNavigateTab('horarios')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Clock
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110 text-blue-600"
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm flex items-center justify-between">
                    <span>Horarios</span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                      Roles
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Roles por grupo y copia semanal/quincenal
                  </div>
                </button>
              )}

              {/* Calendario Escolar (Días sin clases) */}
              {hasRolePermission(currentUser.rol, 'calendario') && (
                <button
                  onClick={() => onNavigateTab('calendario')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Calendar
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110 text-rose-600"
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm flex items-center justify-between">
                    <span>Calendario</span>
                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                      Inhábiles
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Días sin clases para tutores y docentes
                  </div>
                </button>
              )}

              {/* Campus */}
              {hasRolePermission(currentUser.rol, 'campus') && (
                <button
                  onClick={() => onNavigateTab('campus')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Building2
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110 text-amber-600"
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm flex items-center justify-between">
                    <span>Campus</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                      {collegeCampuses.length} Sede{collegeCampuses.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sedes, docentes y alumnos por campus
                  </div>
                </button>
              )}

              {/* Estudiantes */}
              {hasRolePermission(currentUser.rol, 'estudiantes') && (
                <button
                  onClick={() => onNavigateTab('estudiantes')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <GraduationCap
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Control de Alumnos
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Alumnos, grupos, QR y credenciales
                  </div>
                </button>
              )}

              {/* Asistencias con QR */}
              {hasRolePermission(currentUser.rol, 'asistencias') && (
                <button
                  onClick={() => onNavigateTab('asistencias')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <QrCode
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110 text-teal-600"
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm flex items-center justify-between">
                    <span>Asistencia</span>
                    <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                      QR Docente
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pase de lista por docente asignado
                  </div>
                </button>
              )}

              {/* Calificaciones */}
              {hasRolePermission(currentUser.rol, 'calificaciones') && (
                <button
                  onClick={() => onNavigateTab('calificaciones')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Award
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: goldColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Calificaciones
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sábana de notas y boletas
                  </div>
                </button>
              )}

              {/* Docentes */}
              {hasRolePermission(currentUser.rol, 'docentes') && (
                <button
                  onClick={() => onNavigateTab('docentes')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <Users
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Docentes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Plantilla y asignación
                  </div>
                </button>
              )}

              {/* Materias */}
              {hasRolePermission(currentUser.rol, 'materias') && (
                <button
                  onClick={() => onNavigateTab('materias')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <BookOpen
                    className="w-5 h-5 mb-2 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
                  <div className="font-semibold text-slate-900 text-xs md:text-sm">
                    Materias
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Malla curricular ({collegeSubjects.length})
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Non-School Days & School Notices */}
        <div className="space-y-4">
          {/* Calendar Non-School Days preview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600" />
                Días Sin Clases (Calendario)
              </h3>
              <button
                onClick={() => onNavigateTab('calendario')}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: primaryColor }}
              >
                Administrar
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingNonSchoolDays.length > 0 ? (
                upcomingNonSchoolDays.map((day) => (
                  <div
                    key={day.id}
                    className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/40 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{day.motivo}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {day.fecha}
                        {day.fechaFin ? ` al ${day.fechaFin}` : ''}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                      Sin Clases
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay días inhábiles registrados.</p>
              )}
            </div>
          </div>

          {/* Comunicados */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                Comunicados y Avisos
              </h3>
              <button
                onClick={() => onNavigateTab('comunicados')}
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: primaryColor }}
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {collegeNotices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        notice.prioridad === 'Urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : notice.prioridad === 'Importante'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {notice.prioridad}
                    </span>
                    <span className="text-slate-400 font-mono">{notice.fecha}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {notice.titulo}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {notice.contenido}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal to View and Toggle Monthly Tuition Payments per Student */}
      {showTuitionDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            <div
              className="p-4 sm:p-5 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300 block">
                  Estado de Colegiaturas · {selectedMonthMeta.corto}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  {showTuitionDetailModal === 'pagados'
                    ? `Alumnos con Colegiatura Pagada (${alumnosPagadosCount})`
                    : showTuitionDetailModal === 'pendientes'
                    ? `Alumnos que Faltan por Pagar (${alumnosPendientesCount})`
                    : `Padrón Completo de Colegiaturas del Mes (${studentTuitionRows.length})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTuitionDetailModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTuitionDetailModal('todos')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    showTuitionDetailModal === 'todos'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  Todos ({studentTuitionRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowTuitionDetailModal('pagados')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    showTuitionDetailModal === 'pagados'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-slate-200 text-emerald-800'
                  }`}
                >
                  Pagados ({alumnosPagadosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setShowTuitionDetailModal('pendientes')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    showTuitionDetailModal === 'pendientes'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-amber-800'
                  }`}
                >
                  Pendientes de Pago ({alumnosPendientesCount})
                </button>
              </div>

              <div className="font-bold text-slate-700">
                Total Recolectado en {selectedMonthMeta.corto}:{' '}
                <span className="text-emerald-700 text-sm">
                  ${montoRecolectadoMes.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Alumno</th>
                    <th className="py-2.5 px-3">Grado y Grupo</th>
                    <th className="py-2.5 px-3">Monto Mensual</th>
                    <th className="py-2.5 px-3">Estado en {selectedMonthMeta.corto}</th>
                    <th className="py-2.5 px-3 text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentTuitionRows
                    .filter((r) =>
                      showTuitionDetailModal === 'pagados'
                        ? r.pagado
                        : showTuitionDetailModal === 'pendientes'
                        ? !r.pagado
                        : true
                    )
                    .map((row) => (
                      <tr key={row.student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {row.student.nombre} {row.student.apellidos}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {row.student.matricula} · Tutor: {row.student.tutorNombre}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {row.student.grado} "{row.student.grupo}"
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          <div>${row.monto.toLocaleString('es-MX')} MXN</div>
                          <div className="text-[10px] font-sans font-normal text-slate-400 truncate max-w-[180px]">
                            {row.conceptoNombre}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {row.pagado ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> Pagado
                              </span>
                              {row.fechaPago && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {row.fechaPago} · {row.folioRecibo}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              <Clock className="w-3 h-3" /> Pendiente de Pago
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMonthlyTuitionPayment(
                                activeCollege.id,
                                row.student.id,
                                selectedMonthKey,
                                selectedMonthMeta.corto,
                                row.monto,
                                !row.pagado
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                              row.pagado
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            }`}
                          >
                            {row.pagado ? 'Marcar Pendiente' : 'Registrar Pago'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
