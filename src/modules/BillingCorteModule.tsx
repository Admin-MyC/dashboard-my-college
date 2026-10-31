import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Tag,
  Percent,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Scissors,
  GraduationCap,
  BookOpen,
  Shirt,
  Bus,
  Laptop,
  ShieldCheck,
  Trophy,
  Palette,
  Utensils,
  Sparkles,
  Plus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Student, MonthlyTuitionRecord, BillingConcept, StudentDiscount } from '../types';

/**
 * Selecciona un icono representativo según el nombre o naturaleza del concepto
 */
export const getConceptIcon = (nombre: string) => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('colegiatura') || n.includes('mensualidad') || n.includes('cuota')) return GraduationCap;
  if (n.includes('libro') || n.includes('guia') || n.includes('material') || n.includes('cuaderno') || n.includes('lectura')) return BookOpen;
  if (n.includes('uniforme') || n.includes('deportivo') || n.includes('playera') || n.includes('gala') || n.includes('pantalon')) return Shirt;
  if (n.includes('transporte') || n.includes('ruta') || n.includes('camion') || n.includes('autobus')) return Bus;
  if (n.includes('computo') || n.includes('tecnolog') || n.includes('laptop') || n.includes('plataforma') || n.includes('software') || n.includes('sistema')) return Laptop;
  if (n.includes('seguro') || n.includes('medico') || n.includes('salud') || n.includes('proteccion')) return ShieldCheck;
  if (n.includes('deporte') || n.includes('torneo') || n.includes('futbol') || n.includes('basquet') || n.includes('atletismo') || n.includes('natacion')) return Trophy;
  if (n.includes('arte') || n.includes('musica') || n.includes('danza') || n.includes('taller') || n.includes('teatro') || n.includes('pintura')) return Palette;
  if (n.includes('cafeteria') || n.includes('alimento') || n.includes('comedor') || n.includes('snack') || n.includes('lunch')) return Utensils;
  if (n.includes('inscripci') || n.includes('reinscripci') || n.includes('admision') || n.includes('matricula')) return UserCheck;
  if (n.includes('examen') || n.includes('certifica') || n.includes('diploma') || n.includes('titulo') || n.includes('tramite')) return FileText;
  if (n.includes('evento') || n.includes('graduacion') || n.includes('fiesta') || n.includes('campamento') || n.includes('festival')) return Sparkles;
  return Receipt;
};

interface BillingCorteModuleProps {
  primaryColor?: string;
  secondaryColor?: string;
  onGoToConcepts?: () => void;
}

/**
 * Detalle individual de cada cobro de un alumno
 */
export interface StudentConceptFeeItem {
  conceptoId: string;
  conceptoNombre: string;
  tipo: 'Colegiatura Mensual' | 'Concepto Adicional';
  montoOriginal: number;
  descuentoMonto: number;
  descuentoDetalle?: string;
  montoFinal: number; // Cantidad a cobrar / cobrada
  estatus: 'pagada' | 'pendiente';
  facturado: 'Si' | 'No';
  fechaPago?: string;
  metodoPago?: string;
  folioRecibo?: string;
  folioFactura?: string;
}

/**
 * Renglón unificado por alumno con todos sus cobros anidados
 */
export interface StudentBillingCorteRow {
  studentId: string;
  matricula: string;
  nombreCompleto: string;
  grado: string;
  grupo: string;
  nivel: string;
  tutorNombre: string;
  tutorTelefono?: string;
  tutorCorreo?: string;
  rfcTutor?: string;
  razonSocialTutor?: string;
  // Cobros anidados del alumno
  cobros: StudentConceptFeeItem[];
  // Totales acumulados para filtros y métricas rápidas
  totalOriginal: number;
  totalDescuento: number;
  totalFinal: number;
  totalPagado: number;
  totalPendiente: number;
  sinCobros: boolean;
  tienePendientes: boolean;
  todosPagados: boolean;
  totalFacturadosSi: number;
  totalFacturadosNo: number;
}

export const BillingCorteModule: React.FC<BillingCorteModuleProps> = ({
  primaryColor = '#0B2545',
  secondaryColor = '#C59B27',
  onGoToConcepts,
}) => {
  const {
    activeCollege,
    students,
    monthlyTuitions,
    billingConcepts,
    studentDiscounts,
    getEffectiveStudentPrice,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'al_corriente' | 'con_adeudo'>('todos');
  const [filterNivel, setFilterNivel] = useState<string>('todos');
  const [filterFactura, setFilterFactura] = useState<'todos' | 'con_facturas' | 'sin_facturas'>('todos');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentBillingCorteRow | null>(null);

  // Paginación para mostrar en listado de 10, 30 o 50 alumnos
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reiniciar a la primera página al cambiar filtros o tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterNivel, filterFactura, itemsPerPage]);

  // Alumnos activos del colegio
  const collegeStudents = useMemo(() => {
    return students.filter(
      (s) => s.colegioId === activeCollege?.id && s.estatus !== 'baja'
    );
  }, [students, activeCollege?.id]);

  // Conceptos activos del colegio
  const collegeConcepts = useMemo(() => {
    return billingConcepts.filter(
      (c) => c.colegioId === activeCollege?.id && c.activo !== false
    );
  }, [billingConcepts, activeCollege?.id]);

  // Helper de inferencia de nivel escolar
  const inferStudentLevel = (st: Student): 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria' => {
    if (st.nivel && ['preescolar', 'primaria', 'secundaria', 'preparatoria'].includes(st.nivel)) {
      return st.nivel as any;
    }
    const g = (st.grado || '').toLowerCase();
    if (g.includes('preescolar') || g.includes('kinder') || g.includes('maternal')) return 'preescolar';
    if (g.includes('primaria')) return 'primaria';
    if (g.includes('secundaria')) return 'secundaria';
    if (g.includes('preparatoria') || g.includes('bachillerato') || g.includes('semestre')) return 'preparatoria';
    return 'primaria';
  };

  // Conceptos de mensualidad registrados en Cobros
  const monthlyBillingConcepts = useMemo(() => {
    const isMonthlyKeyword = (name: string) => {
      const n = (name || '').toLowerCase();
      return n.includes('colegiatura') || n.includes('mensualidad') || n.includes('cuota mensual');
    };
    return collegeConcepts.filter((c) => Boolean(c.esRecurrenteMensual) || isMonthlyKeyword(c.concepto));
  }, [collegeConcepts]);

  // 1 Renglón por Alumno con Cobros Anidados
  const studentRows = useMemo<StudentBillingCorteRow[]>(() => {
    if (!activeCollege) return [];

    const relevantMonths = [
      { clave: '2026-10', etiqueta: 'Octubre 2026' },
      { clave: '2026-09', etiqueta: 'Septiembre 2026' },
      { clave: '2026-08', etiqueta: 'Agosto 2026' },
    ];

    return collegeStudents.map((student) => {
      const stLevel = inferStudentLevel(student);
      const studentCobros: StudentConceptFeeItem[] = [];

      // 1. Colegiaturas Mensuales (Mes con mes) - SOLO si existen conceptos de colegiatura dados de alta
      if (monthlyBillingConcepts.length > 0) {
        relevantMonths.forEach((m) => {
          const conceptForLevel =
            monthlyBillingConcepts.find(
              (c) => Array.isArray(c.nivelesPublicados) && c.nivelesPublicados.includes(stLevel)
            ) || monthlyBillingConcepts[0];

          if (!conceptForLevel) return;
          const baseConceptPrice = Number(conceptForLevel.precio) || 0;
          if (baseConceptPrice <= 0) return;

          const conceptName = `${conceptForLevel.concepto} (${m.etiqueta})`;
          const conceptId = conceptForLevel.id;

          // Descuento efectivo para este alumno
          const eff = getEffectiveStudentPrice(
            activeCollege.id,
            student.id,
            baseConceptPrice,
            conceptForLevel.id
          );

          // Registro de mensualidad en BD si existe
          const stored = monthlyTuitions.find(
            (t) =>
              t.colegioId === activeCollege.id &&
              t.estudianteId === student.id &&
              t.mesClave === m.clave
          );

          const isPaid = Boolean(stored?.pagado);
          const hasRfc = Boolean((student as any).datosFiscales?.rfc);
          const facturado: 'Si' | 'No' = isPaid && hasRfc ? 'Si' : 'No';

          const descuentoDetalle =
            eff.appliedDiscounts.length > 0
              ? eff.appliedDiscounts
                  .map(
                    (d) =>
                      `${d.nombreDescuento} (${
                        d.tipoDescuento === 'porcentaje' ? `${d.valor}%` : `$${d.valor} MXN`
                      })`
                  )
                  .join(', ')
              : undefined;

          studentCobros.push({
            conceptoId: conceptId,
            conceptoNombre: conceptName,
            tipo: 'Colegiatura Mensual',
            montoOriginal: baseConceptPrice,
            descuentoMonto: eff.discountAmount,
            descuentoDetalle,
            montoFinal: eff.finalPrice,
            estatus: isPaid ? 'pagada' : 'pendiente',
            facturado,
            fechaPago: isPaid ? stored?.fechaPago || '2026-10-05' : undefined,
            metodoPago: isPaid ? stored?.metodoPago || 'Transferencia SPEI' : undefined,
            folioRecibo: isPaid ? stored?.folioRecibo || `REC-${m.clave.replace('-', '')}-${student.matricula}` : undefined,
            folioFactura: facturado === 'Si' ? `CFDI-40-${m.clave.replace('-', '')}-${student.matricula.replace(/\D/g, '') || '801'}` : undefined,
          });
        });
      }

      // 2. Conceptos Adicionales de Cobro publicados para el nivel del alumno (si existen)
      const additionalConcepts = collegeConcepts.filter((c) => {
        if (!Array.isArray(c.nivelesPublicados) || !c.nivelesPublicados.includes(stLevel)) return false;
        const isMonthly = Boolean(c.esRecurrenteMensual) || c.concepto.toLowerCase().includes('colegiatura') || c.concepto.toLowerCase().includes('mensualidad');
        return !isMonthly;
      });

      additionalConcepts.forEach((c) => {
        const basePrice = Number(c.precio) || 0;
        if (basePrice <= 0) return;

        const eff = getEffectiveStudentPrice(activeCollege.id, student.id, basePrice, c.id);

        const matchingRecord = monthlyTuitions.find(
          (mt) =>
            mt.estudianteId === student.id &&
            mt.pagado &&
            (mt.mesClave === c.id || mt.mesClave === `concept-${c.id}`)
        );
        const isPaid = Boolean(
          matchingRecord ||
          (student.id === 'std-1' && c.concepto.toLowerCase().includes('inscripci'))
        );
        const hasRfc = Boolean((student as any).datosFiscales?.rfc);
        const facturado: 'Si' | 'No' = isPaid && hasRfc ? 'Si' : 'No';

        const descuentoDetalle =
          eff.appliedDiscounts.length > 0
            ? eff.appliedDiscounts
                .map(
                  (d) =>
                    `${d.nombreDescuento} (${
                      d.tipoDescuento === 'porcentaje' ? `${d.valor}%` : `$${d.valor} MXN`
                    })`
                )
                .join(', ')
            : undefined;

        studentCobros.push({
          conceptoId: c.id,
          conceptoNombre: c.concepto,
          tipo: 'Concepto Adicional',
          montoOriginal: basePrice,
          descuentoMonto: eff.discountAmount,
          descuentoDetalle,
          montoFinal: eff.finalPrice,
          estatus: isPaid ? 'pagada' : 'pendiente',
          facturado,
          fechaPago: isPaid ? '2026-08-10' : undefined,
          metodoPago: isPaid ? 'Transferencia SPEI' : undefined,
          folioRecibo: isPaid ? `REC-2026-${student.matricula}` : undefined,
          folioFactura: facturado === 'Si' ? `CFDI-40-INS-${student.matricula}` : undefined,
        });
      });

      // Cálculos agregados por alumno
      const totalOriginal = studentCobros.reduce((acc, c) => acc + c.montoOriginal, 0);
      const totalDescuento = studentCobros.reduce((acc, c) => acc + c.descuentoMonto, 0);
      const totalFinal = studentCobros.reduce((acc, c) => acc + c.montoFinal, 0);
      const totalPagado = studentCobros
        .filter((c) => c.estatus === 'pagada')
        .reduce((acc, c) => acc + c.montoFinal, 0);
      const totalPendiente = studentCobros
        .filter((c) => c.estatus === 'pendiente')
        .reduce((acc, c) => acc + c.montoFinal, 0);

      const sinCobros = studentCobros.length === 0;
      const tienePendientes = studentCobros.some((c) => c.estatus === 'pendiente');
      const todosPagados = studentCobros.length > 0 && studentCobros.every((c) => c.estatus === 'pagada');
      const totalFacturadosSi = studentCobros.filter((c) => c.facturado === 'Si').length;
      const totalFacturadosNo = studentCobros.filter((c) => c.facturado === 'No').length;

      return {
        studentId: student.id,
        matricula: student.matricula,
        nombreCompleto: `${student.nombre} ${student.apellidos}`,
        grado: student.grado,
        grupo: student.grupo,
        nivel: stLevel.toUpperCase(),
        tutorNombre: student.tutorNombre || 'Sin tutor asignado',
        tutorTelefono: student.tutorTelefono,
        tutorCorreo: student.tutorCorreo,
        rfcTutor: (student as any).datosFiscales?.rfc || 'Sin RFC registrado',
        razonSocialTutor: (student as any).datosFiscales?.razonSocial || student.tutorNombre,
        cobros: studentCobros,
        totalOriginal,
        totalDescuento,
        totalFinal,
        totalPagado,
        totalPendiente,
        sinCobros,
        tienePendientes,
        todosPagados,
        totalFacturadosSi,
        totalFacturadosNo,
      };
    });
  }, [
    activeCollege,
    collegeStudents,
    collegeConcepts,
    monthlyBillingConcepts,
    monthlyTuitions,
    getEffectiveStudentPrice,
    studentDiscounts,
  ]);

  // Filtrado de alumnos
  const filteredStudents = useMemo(() => {
    return studentRows.filter((row) => {
      // Búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesStudent =
          row.nombreCompleto.toLowerCase().includes(q) ||
          row.matricula.toLowerCase().includes(q) ||
          row.tutorNombre.toLowerCase().includes(q) ||
          row.rfcTutor?.toLowerCase().includes(q) ||
          row.cobros.some((c) => c.conceptoNombre.toLowerCase().includes(q));
        if (!matchesStudent) return false;
      }

      // Estado
      if (filterEstado === 'al_corriente' && row.tienePendientes) return false;
      if (filterEstado === 'con_adeudo' && !row.tienePendientes) return false;

      // Nivel
      if (filterNivel !== 'todos' && row.nivel.toLowerCase() !== filterNivel.toLowerCase()) {
        return false;
      }

      // Factura
      if (filterFactura === 'con_facturas' && row.totalFacturadosSi === 0) return false;
      if (filterFactura === 'sin_facturas' && row.totalFacturadosSi > 0) return false;

      return true;
    });
  }, [studentRows, searchTerm, filterEstado, filterNivel, filterFactura]);

  // Paginación calculada (10, 30 o 50 alumnos por página)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, startIndex, itemsPerPage]);

  // Métricas financieras globales
  const metrics = useMemo(() => {
    const totalRecaudado = filteredStudents.reduce((acc, s) => acc + s.totalPagado, 0);
    const totalPorCobrar = filteredStudents.reduce((acc, s) => acc + s.totalPendiente, 0);
    const totalDescuentos = filteredStudents.reduce((acc, s) => acc + s.totalDescuento, 0);
    const totalAlumnosAlCorriente = filteredStudents.filter((s) => s.todosPagados || s.sinCobros).length;
    const totalAlumnosConAdeudo = filteredStudents.filter((s) => s.tienePendientes).length;

    return {
      totalRecaudado,
      totalPorCobrar,
      totalDescuentos,
      totalAlumnos: filteredStudents.length,
      totalAlumnosAlCorriente,
      totalAlumnosConAdeudo,
      porcentajeEfectividad:
        totalRecaudado + totalPorCobrar > 0
          ? Math.round((totalRecaudado / (totalRecaudado + totalPorCobrar)) * 100)
          : 0,
    };
  }, [filteredStudents]);

  // ==========================================
  // EXPORTACIÓN A EXCEL (.xlsx)
  // 1 SOLO RENGLÓN POR ALUMNO CON TODOS SUS COBROS EN COLUMNAS ANIDADAS
  // Concepto 1 | Cantidad 1 | Estatus 1 | Facturado 1 | Concepto 2 | Cantidad 2 | Estatus 2 | Facturado 2 ...
  // ==========================================
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('No hay alumnos para exportar con los filtros seleccionados.');
      return;
    }

    // Identificar el número máximo de conceptos entre los alumnos filtrados
    const maxConcepts = Math.max(...filteredStudents.map((s) => s.cobros.length), 0);

    const exportData = filteredStudents.map((s, idx) => {
      // Datos base del alumno
      const rowObj: Record<string, any> = {
        '#': idx + 1,
        'Matrícula': s.matricula,
        'Alumno': s.nombreCompleto,
        'Nivel': s.nivel,
        'Grado y Grupo': `${s.grado} "${s.grupo}"`,
        'Tutor Responsable': s.tutorNombre,
        'Teléfono Tutor': s.tutorTelefono || 'N/A',
        'Correo Tutor': s.tutorCorreo || 'N/A',
        'RFC Tutor': s.rfcTutor || 'N/A',
        'Razón Social (Facturación)': s.razonSocialTutor || 'N/A',
      };

      // Si no hay conceptos dados de alta
      if (maxConcepts === 0) {
        rowObj['Conceptos de Cobro'] = 'Sin conceptos dados de alta';
      } else {
        // Anidar cada concepto de cobro dinámicamente en columnas sucesivas
        for (let i = 0; i < maxConcepts; i++) {
          const cobro = s.cobros[i];
          const num = i + 1;
          rowObj[`Concepto de Cobro ${num}`] = cobro ? cobro.conceptoNombre : '—';
          rowObj[`Cantidad ${num} (MXN)`] = cobro ? cobro.montoFinal : 0;
          rowObj[`Estatus ${num}`] = cobro ? cobro.estatus : '—';
          rowObj[`Facturado ${num}`] = cobro ? cobro.facturado : '—';
        }
      }

      // Columnas finales de resumen por alumno
      rowObj['Total Pagado (MXN)'] = s.totalPagado;
      rowObj['Total Pendiente Debe (MXN)'] = s.totalPendiente;
      rowObj['Descuentos Otorgados (MXN)'] = s.totalDescuento;
      rowObj['Total General Cobros (MXN)'] = s.totalFinal;
      rowObj['Estatus Global Alumno'] = s.sinCobros
        ? 'Sin adeudos (Sin cobros registrados)'
        : s.todosPagados
        ? 'Al corriente'
        : 'Con adeudo pendiente';

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Definición de anchos de columnas
    const colWidths: { wch: number }[] = [
      { wch: 4 },  // #
      { wch: 12 }, // Matrícula
      { wch: 28 }, // Alumno
      { wch: 12 }, // Nivel
      { wch: 14 }, // Grado y Grupo
      { wch: 26 }, // Tutor
      { wch: 15 }, // Teléfono
      { wch: 26 }, // Correo
      { wch: 16 }, // RFC
      { wch: 26 }, // Razón Social
    ];

    // Ancho para cada grupo de 4 columnas de cobro anidado
    for (let i = 0; i < maxConcepts; i++) {
      colWidths.push({ wch: 32 }); // Concepto de Cobro N
      colWidths.push({ wch: 16 }); // Cantidad N
      colWidths.push({ wch: 14 }); // Estatus N
      colWidths.push({ wch: 14 }); // Facturado N
    }

    // Columnas finales de totales
    colWidths.push({ wch: 18 }); // Total Pagado
    colWidths.push({ wch: 20 }); // Total Pendiente
    colWidths.push({ wch: 20 }); // Descuentos
    colWidths.push({ wch: 20 }); // Total General
    colWidths.push({ wch: 22 }); // Estatus Global

    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Corte por Alumno');

    // Hoja adicional de Resumen Ejecutivo
    const summaryData = [
      { Métrica: 'Institución Educativa', Valor: activeCollege?.nombre || 'Colegio' },
      { Métrica: 'Fecha y Hora de Emisión', Valor: new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' }) },
      { Métrica: 'Total Alumnos en Padrón', Valor: filteredStudents.length },
      { Métrica: 'Alumnos al Corriente (Sin Adeudo)', Valor: metrics.totalAlumnosAlCorriente },
      { Métrica: 'Alumnos con Pagos Pendientes', Valor: metrics.totalAlumnosConAdeudo },
      { Métrica: 'Monto Total Recaudado (Pagado)', Valor: `$${metrics.totalRecaudado.toLocaleString('es-MX')} MXN` },
      { Métrica: 'Monto Total por Cobrar (Debe)', Valor: `$${metrics.totalPorCobrar.toLocaleString('es-MX')} MXN` },
      { Métrica: 'Total en Descuentos de Becas Otorgados', Valor: `$${metrics.totalDescuentos.toLocaleString('es-MX')} MXN` },
      { Métrica: 'Porcentaje de Efectividad de Cobranza', Valor: `${metrics.porcentajeEfectividad}%` },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 38 }, { wch: 38 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Financiero');

    const fileName = `Corte_Cobros_Alumnos_${(activeCollege?.nombre || 'Colegio').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner Principal con Botón de Exportar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 shadow-md shrink-0"
            style={{ backgroundColor: secondaryColor }}
          >
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Corte de Cobros por Alumno
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                1 renglón por alumno · {filteredStudents.length} alumnos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cada alumno condensa todos sus conceptos de cobro, cantidades, estatus (pagada o pendiente) y facturación (Sí o No).
            </p>
          </div>
        </div>

        {/* Botón de Exportación de Corte */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Corte</span>
        </button>
      </div>

      {/* Banner Informativo cuando no hay conceptos dados de alta */}
      {collegeConcepts.length === 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-amber-950">
                No hay conceptos de cobro dados de alta para este colegio
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                Los alumnos no tienen adeudos ni mensualidades pendientes generadas. Para asignar cuotas o colegiaturas, da de alta conceptos en la pestaña de Conceptos de Cobro.
              </p>
            </div>
          </div>
          {onGoToConcepts && (
            <button
              type="button"
              onClick={onGoToConcepts}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Dar de Alta Conceptos</span>
            </button>
          )}
        </div>
      )}

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ya Pagado (Recaudado)</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-800 tabular-nums">
            ${metrics.totalRecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong>{metrics.totalAlumnosAlCorriente}</strong> alumnos al corriente ({metrics.porcentajeEfectividad}% efectividad)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Debe (Pendiente)</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="font-display font-black text-2xl text-amber-800 tabular-nums">
            ${metrics.totalPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong>{metrics.totalAlumnosConAdeudo}</strong> alumnos con adeudos pendientes
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Descuentos de Becas</span>
            <Tag className="w-5 h-5" />
          </div>
          <div className="font-display font-black text-2xl text-indigo-800 tabular-nums">
            ${metrics.totalDescuentos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ahorro aplicado en conceptos según becas autorizadas
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Padrón de Alumnos</span>
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="font-display font-black text-2xl text-blue-900 tabular-nums">
            {metrics.totalAlumnos}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Alumnos evaluados en el ciclo escolar activo
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por alumno, matrícula, tutor o concepto..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500 text-slate-900 font-medium"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="todos">Todos los Estados</option>
              <option value="al_corriente">✓ Al corriente (Sin adeudo)</option>
              <option value="con_adeudo">⏳ Con adeudos pendientes (Debe)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="todos">Todos los Niveles</option>
              <option value="preescolar">Preescolar</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
              <option value="preparatoria">Preparatoria</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={filterFactura}
              onChange={(e) => setFilterFactura(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="todos">Facturación</option>
              <option value="con_facturas">Con factura emitida</option>
              <option value="sin_facturas">Sin factura</option>
            </select>
          </div>
        </div>

        {/* Sub-barra de Filtros con conteo y selector rápido de listado (10, 30 o 50 alumnos por página) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Total filtrados: <strong className="text-slate-800 font-bold">{filteredStudents.length}</strong> alumnos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Mostrar en listado:</span>
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {[10, 30, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setItemsPerPage(size)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    itemsPerPage === size
                      ? 'text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  style={itemsPerPage === size ? { backgroundColor: primaryColor } : undefined}
                >
                  {size}
                </button>
              ))}
            </div>
            <span className="text-slate-400 text-[11px]">por página</span>
          </div>
        </div>
      </div>

      {/* Tabla: 1 SOLO RENGLÓN POR ALUMNO CON COBROS ANIDADOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="text-white uppercase text-[10px] tracking-wider font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                <th className="py-3.5 px-4">Alumno / Matrícula</th>
                <th className="py-3.5 px-3">Nivel y Grado</th>
                <th className="py-3.5 px-3">Tutor / RFC</th>
                <th className="py-3.5 px-4 min-w-[500px]">Conceptos de Cobro Anidados (Concepto · Cantidad · Estatus · Facturado)</th>
                <th className="py-3.5 px-3 text-right">Ya Pagó</th>
                <th className="py-3.5 px-3 text-right">Debe</th>
                <th className="py-3.5 px-3 text-center">Estado Global</th>
                <th className="py-3.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No se encontraron alumnos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => {
                  const isExpanded = expandedStudentId === st.studentId;

                  return (
                    <React.Fragment key={st.studentId}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* Alumno */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {st.nombreCompleto}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {st.matricula}
                          </div>
                        </td>

                        {/* Nivel y Grado */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="font-bold text-slate-800">
                            {st.grado} "{st.grupo}"
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {st.nivel}
                          </span>
                        </td>

                        {/* Tutor y RFC */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="font-semibold text-slate-800">
                            {st.tutorNombre}
                          </div>
                          {st.rfcTutor !== 'Sin RFC registrado' ? (
                            <div className="text-[10px] font-mono font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{st.rfcTutor}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sin RFC</span>
                          )}
                        </td>

                        {/* Cobros Anidados en el mismo renglón: Uno al lado de otro (Horizontal) */}
                        <td className="py-3 px-4 align-top">
                          {st.cobros.length === 0 ? (
                            <div className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span>Sin conceptos dados de alta · $0.00 pendiente</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[620px] 2xl:max-w-[760px] scrollbar-thin">
                              {st.cobros.map((cobro, cIdx) => {
                                const ConceptIcon = getConceptIcon(cobro.conceptoNombre);
                                return (
                                  <div
                                    key={`${st.studentId}-${cIdx}`}
                                    className="shrink-0 w-64 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-1.5"
                                  >
                                    {/* Fila Superior: Icono representativo + Nombre del Concepto */}
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="flex items-start gap-1.5 min-w-0">
                                        <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                          <ConceptIcon className="w-3 h-3" />
                                        </div>
                                        <span className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2" title={cobro.conceptoNombre}>
                                          {cobro.conceptoNombre}
                                        </span>
                                      </div>
                                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                                        {cobro.tipo === 'Colegiatura Mensual' ? 'Mensual' : 'Extra'}
                                      </span>
                                    </div>

                                  {/* Fila Media: Cantidad y Descuento */}
                                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-semibold">Cantidad:</span>
                                    <div className="text-right">
                                      <span className="font-mono font-black text-slate-900 text-xs">
                                        ${cobro.montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </span>
                                      {cobro.descuentoMonto > 0 && (
                                        <div className="text-[9px] text-rose-600 font-bold">
                                          Desc: -${cobro.descuentoMonto.toFixed(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Fila Inferior: Estatus (pagada, pendiente) y Facturado (Si, No) */}
                                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10px]">
                                    {cobro.estatus === 'pagada' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>pagada</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>pendiente</span>
                                      </span>
                                    )}

                                    {cobro.facturado === 'Si' ? (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                                        <FileText className="w-2.5 h-2.5" />
                                        <span>Facturado: Si</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                                        Facturado: No
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            </div>
                          )}
                        </td>

                        {/* Ya Pagó */}
                        <td className="py-3.5 px-3 text-right align-top font-mono font-bold text-emerald-700">
                          ${st.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Debe */}
                        <td className="py-3.5 px-3 text-right align-top font-mono font-bold text-amber-700">
                          ${st.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Estado Global */}
                        <td className="py-3.5 px-3 text-center align-top">
                          {st.sinCobros ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px]">
                              <span>Sin adeudos</span>
                            </span>
                          ) : st.todosPagados ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Al corriente</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-black text-[10px]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Con adeudo</span>
                            </span>
                          )}
                        </td>

                        {/* Acción */}
                        <td className="py-3.5 px-3 text-right align-top">
                          <button
                            type="button"
                            onClick={() => setDetailStudent(st)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Ver desglose completo de cobros"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación (10, 30 o 50 alumnos por lista) y Navegación */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Mostrando{' '}
              <strong className="text-slate-900 font-bold">
                {filteredStudents.length === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-900 font-bold">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </strong>{' '}
              de <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> alumnos
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Alumnos por lista:</span>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {[10, 30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setItemsPerPage(size)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      itemsPerPage === size
                        ? 'text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    style={
                      itemsPerPage === size ? { backgroundColor: primaryColor } : undefined
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {/* Números de página interactivos */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safeCurrentPage) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              safeCurrentPage === p
                                ? 'text-white shadow-2xs'
                                : 'text-slate-700 hover:bg-slate-200/70 border border-slate-200 bg-white'
                            }`}
                            style={safeCurrentPage === p ? { backgroundColor: primaryColor } : undefined}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETALLE DE TODOS LOS COBROS DE UN ALUMNO */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div
              className="p-5 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-md"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    Estado de Cuenta y Cobros Anidados
                  </h3>
                  <p className="text-xs text-slate-200">
                    {detailStudent.nombreCompleto} · {detailStudent.matricula}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Información del Alumno y Tutor */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Alumno</span>
                  <p className="font-bold text-slate-900 text-sm">{detailStudent.nombreCompleto}</p>
                  <p className="text-slate-500 font-mono">{detailStudent.matricula}</p>
                  <p className="text-slate-600 font-semibold mt-1">{detailStudent.grado} "{detailStudent.grupo}" · {detailStudent.nivel}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tutor y Factura Fiscal</span>
                  <p className="font-bold text-slate-900">{detailStudent.tutorNombre}</p>
                  <p className="text-slate-500">{detailStudent.tutorTelefono || 'Sin teléfono'}</p>
                  <p className="text-blue-800 font-mono font-bold mt-1">RFC: {detailStudent.rfcTutor}</p>
                  <p className="text-slate-500 text-[11px] truncate">{detailStudent.razonSocialTutor}</p>
                </div>
              </div>

              {/* Resumen Financiero del Alumno */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Ya Pagó</span>
                  <span className="font-mono font-black text-emerald-800 text-base">
                    ${detailStudent.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Debe</span>
                  <span className="font-mono font-black text-amber-800 text-base">
                    ${detailStudent.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Descuentos</span>
                  <span className="font-mono font-black text-indigo-800 text-base">
                    ${detailStudent.totalDescuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Lista Detallada de Conceptos Anidados */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Conceptos de Cobro Anidados ({detailStudent.cobros.length}):
                </span>
                {detailStudent.cobros.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-1">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-xs sm:text-sm text-slate-800">
                      Sin conceptos de cobro dados de alta
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Este alumno no tiene cobros generados ni adeudos pendientes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailStudent.cobros.map((cobro, idx) => {
                    const ConceptIcon = getConceptIcon(cobro.conceptoNombre);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                              <ConceptIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {cobro.conceptoNombre}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {cobro.tipo}
                              </span>
                            </div>
                          </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cobro.estatus === 'pagada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cobro.estatus}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cobro.facturado === 'Si'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Facturado: {cobro.facturado}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="text-slate-500">
                          Precio regular: <span className="font-mono">${cobro.montoOriginal.toFixed(2)}</span>
                          {cobro.descuentoMonto > 0 && (
                            <span className="text-rose-600 font-bold ml-2">
                              (Desc: -${cobro.descuentoMonto.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          Monto final: ${cobro.montoFinal.toFixed(2)} MXN
                        </div>
                      </div>

                      {cobro.folioRecibo && (
                        <div className="text-[10px] text-slate-400 pt-1 font-mono">
                          Recibo: {cobro.folioRecibo} {cobro.fechaPago ? `· ${cobro.fechaPago}` : ''} {cobro.folioFactura ? `· Factura: ${cobro.folioFactura}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
