import React, { useState, useMemo } from 'react';
import {
  Percent,
  Plus,
  Search,
  X,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Trash2,
  Tag,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Filter,
  DollarSign,
  Send,
  Eye,
  FileText,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentDiscount, DiscountType, EducationalLevelId, Student } from '../types';

interface DiscountsManagerProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export const DiscountsManager: React.FC<DiscountsManagerProps> = ({
  primaryColor = '#0B2545',
  secondaryColor = '#C59B27',
}) => {
  const {
    activeCollege,
    selectedCampusId,
    currentUser,
    students,
    billingConcepts,
    studentDiscounts,
    addStudentDiscount,
    updateStudentDiscount,
    deleteStudentDiscount,
    requestDeleteStudentDiscount,
    cancelDeleteStudentDiscountRequest,
    approveStudentDiscount,
    rejectStudentDiscount,
  } = useApp();

  const isControlEscolar = currentUser.rol === 'control_escolar';
  const isCoordinador = currentUser.rol === 'coordinador';
  const isCoordinatorOrControl = isControlEscolar || isCoordinador;
  const isAdminOrSuper =
    currentUser.rol === 'administrador' ||
    currentUser.rol === 'superusuario' ||
    currentUser.rol === 'soporte';

  // Filter discounts for current college
  const safeDiscounts = Array.isArray(studentDiscounts) ? studentDiscounts : [];
  const collegeDiscounts = useMemo(() => {
    return safeDiscounts.filter((d) => {
      if (!d || d.colegioId !== activeCollege?.id) return false;
      if (
        selectedCampusId &&
        selectedCampusId !== 'all' &&
        d.campusId &&
        d.campusId !== selectedCampusId
      ) {
        return false;
      }
      return true;
    });
  }, [safeDiscounts, activeCollege?.id, selectedCampusId]);

  // Separate pending requests and active/resolved discounts
  const pendingDiscounts = useMemo(() => {
    return collegeDiscounts.filter((d) => d.estatus === 'pendiente_aprobacion');
  }, [collegeDiscounts]);

  const approvedDiscounts = useMemo(() => {
    return collegeDiscounts.filter((d) => d.estatus === 'aprobado');
  }, [collegeDiscounts]);

  // Search and filter for discounts list
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'porcentaje' | 'fijo'>('todos');
  const [expandedDiscountId, setExpandedDiscountId] = useState<string | null>(null);

  // Success toast feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [nombreDescuento, setNombreDescuento] = useState('');
  const [selectedConceptoId, setSelectedConceptoId] = useState<string>('');
  const [tipoDescuento, setTipoDescuento] = useState<DiscountType>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<string>('20');
  const [motivo, setMotivo] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('todos');
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // College active billing concepts
  const activeConcepts = useMemo(() => {
    return (billingConcepts || []).filter(
      (c) => c.colegioId === activeCollege?.id && c.activo
    );
  }, [billingConcepts, activeCollege?.id]);

  // College active students
  const collegeStudents = useMemo(() => {
    return (students || []).filter(
      (s) => s.colegioId === activeCollege?.id && s.estatus !== 'baja'
    );
  }, [students, activeCollege?.id]);

  // Selected concept details for calculator
  const selectedConcept = useMemo(() => {
    if (!selectedConceptoId || selectedConceptoId === 'todos') return null;
    return activeConcepts.find((c) => c.id === selectedConceptoId) || null;
  }, [activeConcepts, selectedConceptoId]);

  // Filtered students for adding to discount
  const filteredStudents = useMemo(() => {
    return collegeStudents.filter((st) => {
      // Exclude already added
      if (selectedStudentIds.includes(st.id)) return false;

      // Grade level filter
      if (levelFilter !== 'todos') {
        const gradeLower = (st.grado || '').toLowerCase();
        if (levelFilter === 'preescolar' && !gradeLower.includes('preescolar') && !gradeLower.includes('kinder')) return false;
        if (levelFilter === 'primaria' && !gradeLower.includes('primaria')) return false;
        if (levelFilter === 'secundaria' && !gradeLower.includes('secundaria')) return false;
        if (levelFilter === 'preparatoria' && !gradeLower.includes('prepa') && !gradeLower.includes('bachillerato')) return false;
      }

      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      const fullName = `${st.nombre} ${st.apellidos}`.toLowerCase();
      const matricula = (st.matricula || '').toLowerCase();
      const curp = (st.curp || '').toLowerCase();
      const grado = (st.grado || '').toLowerCase();
      return fullName.includes(q) || matricula.includes(q) || curp.includes(q) || grado.includes(q);
    });
  }, [collegeStudents, selectedStudentIds, levelFilter, studentSearch]);

  // Selected students details
  const selectedStudentsList = useMemo(() => {
    return selectedStudentIds
      .map((id) => collegeStudents.find((s) => s.id === id))
      .filter((s): s is Student => Boolean(s));
  }, [selectedStudentIds, collegeStudents]);

  // Open modal
  const handleOpenCreateModal = () => {
    setNombreDescuento('');
    setSelectedConceptoId(activeConcepts[0]?.id || 'todos');
    setTipoDescuento('porcentaje');
    setValorDescuento('20');
    setMotivo('');
    setSelectedStudentIds([]);
    setStudentSearch('');
    setLevelFilter('todos');
    setFormError('');
    setShowModal(true);
  };

  const handleAddStudent = (stId: string) => {
    if (!selectedStudentIds.includes(stId)) {
      setSelectedStudentIds((prev) => [...prev, stId]);
    }
  };

  const handleRemoveStudent = (stId: string) => {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== stId));
  };

  const handleAddAllFilteredStudents = () => {
    const idsToAdd = filteredStudents.slice(0, 50).map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nombreDescuento.trim()) {
      setFormError('Por favor ingresa un nombre para el descuento o beca.');
      return;
    }

    const val = parseFloat(valorDescuento);
    if (isNaN(val) || val <= 0) {
      setFormError('Ingresa un valor numérico válido mayor a 0 para el descuento.');
      return;
    }

    if (tipoDescuento === 'porcentaje' && val > 100) {
      setFormError('El porcentaje de descuento no puede ser superior al 100%.');
      return;
    }

    if (tipoDescuento === 'fijo' && selectedConcept && val > selectedConcept.precio) {
      setFormError(
        `El descuento fijo ($${val.toFixed(2)}) no puede exceder el precio del concepto ($${selectedConcept.precio.toFixed(2)}).`
      );
      return;
    }

    if (selectedStudentIds.length === 0) {
      setFormError('Debes agregar al menos a un alumno con derecho a este descuento.');
      return;
    }

    const conceptName =
      selectedConceptoId === 'todos'
        ? 'Todos los Conceptos de Cobro'
        : selectedConcept?.concepto || 'Concepto Seleccionado';

    const created = addStudentDiscount({
      colegioId: activeCollege?.id || '',
      campusId: selectedCampusId && selectedCampusId !== 'all' ? selectedCampusId : undefined,
      nombreDescuento: nombreDescuento.trim(),
      conceptoId: selectedConceptoId || 'todos',
      conceptoNombre: conceptName,
      tipoDescuento,
      valor: val,
      alumnosIds: selectedStudentIds,
      motivo: motivo.trim() || undefined,
      activo: true,
    });

    setShowModal(false);

    if (isControlEscolar) {
      setActionNotice(
        `Solicitud de descuento "${created.nombreDescuento}" creada con éxito. Ha quedado pendiente de autorización por el Administrador.`
      );
    } else {
      setActionNotice(
        `Descuento "${created.nombreDescuento}" autorizado y aplicado inmediatamente a ${selectedStudentIds.length} alumno(s).`
      );
    }

    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleApprove = (id: string, name: string) => {
    approveStudentDiscount(id);
    setActionNotice(`Descuento "${name}" autorizado con éxito. Se ha aplicado a los alumnos.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleReject = (id: string, name: string) => {
    rejectStudentDiscount(id);
    setActionNotice(`Solicitud de descuento "${name}" rechazada.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleDelete = (id: string) => {
    if (isCoordinatorOrControl) {
      requestDeleteStudentDiscount(id);
      setActionNotice('Solicitud de eliminación enviada al Administrador para su autorización.');
    } else {
      deleteStudentDiscount(id);
      setActionNotice('Descuento eliminado con éxito.');
    }
    setConfirmDeleteId(null);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Filtered approved list
  const filteredApproved = useMemo(() => {
    return approvedDiscounts.filter((d) => {
      if (filterType !== 'todos' && d.tipoDescuento !== filterType) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchesName = d.nombreDescuento.toLowerCase().includes(q);
      const matchesConcept = d.conceptoNombre.toLowerCase().includes(q);
      const matchesStudent = d.alumnosIds.some((sId) => {
        const st = collegeStudents.find((s) => s.id === sId);
        return (
          st &&
          (`${st.nombre} ${st.apellidos}`.toLowerCase().includes(q) ||
            (st.matricula || '').toLowerCase().includes(q))
        );
      });
      return matchesName || matchesConcept || matchesStudent;
    });
  }, [approvedDiscounts, filterType, searchTerm, collegeStudents]);

  // Live calculator helper for preview in modal
  const previewCalculation = useMemo(() => {
    const val = parseFloat(valorDescuento) || 0;
    const basePrice = selectedConcept ? selectedConcept.precio : 0;
    let discAmount = 0;
    if (tipoDescuento === 'porcentaje') {
      discAmount = (basePrice * Math.min(100, Math.max(0, val))) / 100;
    } else {
      discAmount = Math.min(basePrice, Math.max(0, val));
    }
    const finalPrice = Math.max(0, basePrice - discAmount);
    return {
      basePrice,
      discAmount,
      finalPrice,
    };
  }, [valorDescuento, selectedConcept, tipoDescuento]);

  // Total unique students with approved discount
  const uniqueBeneficiaries = useMemo(() => {
    const set = new Set<string>();
    approvedDiscounts.forEach((d) => {
      if (d.activo) {
        d.alumnosIds.forEach((id) => set.add(id));
      }
    });
    return set.size;
  }, [approvedDiscounts]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 rounded-lg text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action and Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Descuentos Activos
            </span>
            <span className="text-xl font-black text-slate-900">
              {approvedDiscounts.filter((d) => d.activo).length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Alumnos con Descuento
            </span>
            <span className="text-xl font-black text-slate-900">
              {uniqueBeneficiaries}
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 ${
            pendingDiscounts.length > 0
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              pendingDiscounts.length > 0
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
              Por Autorizar
            </span>
            <span className="text-xl font-black">
              {pendingDiscounts.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center">
          <button
            onClick={handleOpenCreateModal}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer"
            style={{ backgroundColor: secondaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Descuento</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN DE SOLICITUDES PENDIENTES DE AUTORIZACIÓN */}
      {pendingDiscounts.length > 0 && (
        <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 text-base sm:text-lg flex items-center gap-2">
                  <span>Solicitudes de Descuentos Pendientes de Autorización</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                    {pendingDiscounts.length}
                  </span>
                </h3>
                <p className="text-xs text-amber-900 mt-0.5">
                  {isAdminOrSuper
                    ? 'El usuario de Control Escolar ha generado las siguientes solicitudes. Como Administrador, revisa los detalles para autorizarlas y aplicar los descuentos a los cobros de los alumnos.'
                    : 'Has enviado estas solicitudes al Administrador. El descuento no se aplicará a los cobros de los alumnos hasta que el Administrador lo autorice.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-1">
            {pendingDiscounts.map((pending) => {
              const conceptMatch = activeConcepts.find((c) => c.id === pending.conceptoId);
              const studentMatches = pending.alumnosIds
                .map((id) => collegeStudents.find((s) => s.id === id))
                .filter(Boolean);

              return (
                <div
                  key={pending.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                        ⏳ En Espera de Autorización
                      </span>
                      <h4 className="font-black text-slate-900 text-base">
                        {pending.nombreDescuento}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {pending.tipoDescuento === 'porcentaje'
                          ? `${pending.valor}% de Descuento`
                          : `$${pending.valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN Fijo`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                      <span>
                        <strong>Concepto:</strong> {pending.conceptoNombre}
                        {conceptMatch && (
                          <span className="text-slate-400 font-mono ml-1">
                            (Precio base: ${conceptMatch.precio.toFixed(2)} MXN)
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>Solicitado por:</strong> {pending.solicitadoPorNombre || 'Control Escolar'} ({pending.solicitadoPorRol || 'control_escolar'}) el {pending.fechaSolicitud}
                      </span>
                    </div>

                    {pending.motivo && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        "{pending.motivo}"
                      </p>
                    )}

                    {/* Alumnos en esta solicitud */}
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Alumnos con derecho a este descuento ({studentMatches.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {studentMatches.map((st) => (
                          <div
                            key={st?.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                          >
                            <img
                              src={st?.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>
                              {st?.nombre} {st?.apellidos}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({st?.grado} {st?.grupo})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                    {isAdminOrSuper ? (
                      <>
                        <button
                          onClick={() => handleApprove(pending.id, pending.nombreDescuento)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aprobar y Aplicar</span>
                        </button>
                        <button
                          onClick={() => handleReject(pending.id, pending.nombreDescuento)}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-800 font-semibold italic">
                          En espera del Administrador
                        </span>
                        <button
                          onClick={() => handleDelete(pending.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Cancelar solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS DE DESCUENTOS ACTIVOS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de beca, concepto o alumno..."
            className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:bg-white focus:border-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({approvedDiscounts.length})
          </button>
          <button
            onClick={() => setFilterType('porcentaje')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'porcentaje'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Porcentajes (%)
          </button>
          <button
            onClick={() => setFilterType('fijo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'fijo'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Monto Fijo ($)
          </button>
        </div>
      </div>

      {/* LISTADO DE DESCUENTOS AUTORIZADOS Y APLICADOS */}
      {filteredApproved.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Percent className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-800">
            No hay descuentos autorizados activos
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Crea un nuevo descuento indicando el concepto de cobro, seleccionando los alumnos con
            derecho al descuento y definiendo el porcentaje o monto fijo.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-md cursor-pointer"
            style={{ backgroundColor: secondaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Descuento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApproved.map((item) => {
            const isExpanded = expandedDiscountId === item.id;
            const conceptMatch = activeConcepts.find((c) => c.id === item.conceptoId);
            const studentMatches = item.alumnosIds
              .map((id) => collegeStudents.find((s) => s.id === id))
              .filter(Boolean);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Autorizado y Activo</span>
                      </span>

                      <h4 className="font-black text-slate-900 text-base sm:text-lg">
                        {item.nombreDescuento}
                      </h4>

                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                        {item.tipoDescuento === 'porcentaje'
                          ? `-${item.valor}% de Descuento`
                          : `-$${item.valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN Fijo`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                      <span>
                        <strong>Concepto:</strong> {item.conceptoNombre}
                      </span>
                      {conceptMatch && (
                        <span className="text-slate-500 font-mono">
                          (Precio base: ${conceptMatch.precio.toFixed(2)} MXN)
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        <strong>Beneficiarios:</strong> {item.alumnosIds.length} alumno(s)
                      </span>
                      {item.autorizadoPorNombre && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-800 font-semibold">
                            Autorizado por {item.autorizadoPorNombre} el {item.fechaResolucion || item.fechaSolicitud}
                          </span>
                        </>
                      )}
                    </div>

                    {item.motivo && (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        Motivo: "{item.motivo}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDiscountId(isExpanded ? null : item.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isExpanded ? 'Ocultar Alumnos' : `Ver ${item.alumnosIds.length} Alumnos`}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStudentDiscount(item.id, { activo: !item.activo })
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        item.activo
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                      title={item.activo ? 'Desactivar temporalmente' : 'Reactivar'}
                    >
                      {item.activo ? 'Activo' : 'En Pausa'}
                    </button>

                    {item.solicitudEliminacion ? (
                      isAdminOrSuper ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-amber-800 font-bold px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-200">
                            Baja solicitada
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteStudentDiscount(item.id);
                              setActionNotice(`Eliminación autorizada para "${item.nombreDescuento}".`);
                              setTimeout(() => setActionNotice(null), 5000);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black cursor-pointer shadow-xs"
                            title="Aprobar eliminación definitiva"
                          >
                            Autorizar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              cancelDeleteStudentDiscountRequest(item.id);
                              setActionNotice(`Solicitud de eliminación rechazada para "${item.nombreDescuento}".`);
                              setTimeout(() => setActionNotice(null), 5000);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer"
                            title="Rechazar solicitud de eliminación"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Por autorizar baja</span>
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isCoordinatorOrControl ? 'Solicitar eliminación al Administrador' : 'Eliminar descuento'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* DESPLIEGUE DETALLADO DE ALUMNOS BENEFICIARIOS */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Alumnos beneficiados con derecho a este descuento:
                      </span>
                      <span className="text-xs text-slate-500">
                        Total: <strong>{studentMatches.length} alumnos</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {studentMatches.map((st) => {
                        if (!st) return null;
                        const base = conceptMatch ? conceptMatch.precio : 0;
                        let disc = 0;
                        if (item.tipoDescuento === 'porcentaje') {
                          disc = (base * item.valor) / 100;
                        } else {
                          disc = Math.min(base, item.valor);
                        }
                        const finalAmt = Math.max(0, base - disc);

                        return (
                          <div
                            key={st.id}
                            className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  st.foto ||
                                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
                                }
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {st.nombre} {st.apellidos}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono truncate">
                                  {st.matricula} · {st.grado} {st.grupo}
                                </div>
                              </div>
                            </div>

                            {conceptMatch && (
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 line-through block font-mono">
                                  ${base.toFixed(2)}
                                </span>
                                <span className="text-xs font-black text-emerald-700 font-mono">
                                  ${finalAmt.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR NUEVO DESCUENTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[94vh] animate-in zoom-in-95">
            {/* Modal Header (Fixed / Shrink-0) */}
            <div
              className="p-4 sm:p-5 text-white shrink-0 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
              }}
            >
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-md shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black truncate">
                      Crear Nuevo Descuento / Beca
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-200 truncate">
                      Asigna descuento porcentual o fijo para alumnos en conceptos de cobro
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Form wrapping body + footer */}
            <form onSubmit={handleSaveDiscount} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Modal Body Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Banner de Rol Compacto */}
                {isControlEscolar ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Perfil Control Escolar:</strong> Esta solicitud requerirá{' '}
                      <strong>autorización del Administrador</strong> antes de que se aplique en los
                      cobros de los alumnos.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Perfil Administrador:</strong> El descuento se autorizará y aplicará de
                      inmediato a las cuentas y cobros de los alumnos seleccionados.
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Grid de 2 Columnas en Desktop (Configuración vs Alumnos) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* COLUMNA IZQUIERDA: Configuración del Descuento (5 cols) */}
                  <div className="lg:col-span-5 space-y-3.5">
                    {/* 1. Nombre del Descuento */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre del Descuento o Beca *
                      </label>
                      <input
                        type="text"
                        value={nombreDescuento}
                        onChange={(e) => setNombreDescuento(e.target.value)}
                        placeholder="ej. Beca Académica 20%, Hijo de Docente..."
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500 font-medium text-slate-900"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Beca Excelencia (20%)', 'Hijo de Docente (50%)', 'Beca Deportiva (25%)', 'Convenio Familiar ($500)'].map(
                          (sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setNombreDescuento(sug)}
                              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                            >
                              {sug}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* 2. Concepto de Cobro */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Concepto de Cobro *
                      </label>
                      <select
                        value={selectedConceptoId}
                        onChange={(e) => setSelectedConceptoId(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500 font-medium text-slate-900 bg-white"
                      >
                        <option value="todos">🌐 Aplica a Todos los Conceptos de Cobro</option>
                        {activeConcepts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.concepto} (${c.precio.toFixed(2)} MXN)
                          </option>
                        ))}
                      </select>
                      {selectedConcept && (
                        <span className="text-[11px] text-indigo-700 font-bold mt-1 block">
                          Precio regular: ${selectedConcept.precio.toFixed(2)} MXN
                        </span>
                      )}
                    </div>

                    {/* 3. Modalidad del Descuento */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Modalidad del Descuento *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoDescuento('porcentaje')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            tipoDescuento === 'porcentaje'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Porcentaje (%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTipoDescuento('fijo')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            tipoDescuento === 'fijo'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Monto Fijo ($)</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. Valor del Descuento */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {tipoDescuento === 'porcentaje'
                          ? 'Porcentaje a descontar (%) *'
                          : 'Monto a descontar ($ MXN) *'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={tipoDescuento === 'porcentaje' ? '1' : '10'}
                          min="1"
                          max={tipoDescuento === 'porcentaje' ? '100' : '99999'}
                          value={valorDescuento}
                          onChange={(e) => setValorDescuento(e.target.value)}
                          placeholder={tipoDescuento === 'porcentaje' ? '20' : '500'}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500 font-mono font-bold text-slate-900 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {tipoDescuento === 'porcentaje' ? '%' : 'MXN'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tipoDescuento === 'porcentaje'
                          ? ['10', '15', '20', '25', '50', '100'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setValorDescuento(val)}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer font-mono"
                              >
                                {val}%
                              </button>
                            ))
                          : ['200', '300', '500', '1000'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setValorDescuento(val)}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer font-mono"
                              >
                                ${val}
                              </button>
                            ))}
                      </div>
                    </div>

                    {/* 5. Simulación de Pago en Vivo */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Simulación de Pago por Alumno:
                      </span>
                      {selectedConcept ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Precio base:</span>
                            <span className="font-mono">${previewCalculation.basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-rose-600 font-bold">
                            <span>Descuento aplicado:</span>
                            <span className="font-mono">-${previewCalculation.discAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-black text-xs sm:text-sm border-t border-slate-200 pt-1">
                            <span>Paga el alumno:</span>
                            <span className="font-mono">
                              ${previewCalculation.finalPrice.toFixed(2)} MXN
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 leading-snug">
                          {tipoDescuento === 'porcentaje'
                            ? `Se descontará el ${valorDescuento || 0}% sobre cada cobro del alumno.`
                            : `Se restará $${valorDescuento || 0} MXN directo sobre cada cobro.`}
                        </p>
                      )}
                    </div>

                    {/* 6. Motivo / Justificación */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Motivo o Justificación (Opcional)
                      </label>
                      <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="ej. Promedio mayor a 9.5, apoyo familiar..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500"
                      />
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: Búsqueda y Selección de Alumnos (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col space-y-3 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/90">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                        <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Alumnos con Derecho a Descuento *
                        </label>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
                        {selectedStudentIds.length} alumno(s)
                      </span>
                    </div>

                    {/* Buscador + Filtro de Nivel en una sola fila */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7 relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Buscar por nombre, matrícula o CURP..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-slate-500"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <select
                          value={levelFilter}
                          onChange={(e) => setLevelFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                        >
                          <option value="todos">Todos los Grados</option>
                          <option value="preescolar">Preescolar</option>
                          <option value="primaria">Primaria</option>
                          <option value="secundaria">Secundaria</option>
                          <option value="preparatoria">Preparatoria</option>
                        </select>
                      </div>
                    </div>

                    {/* Resultados disponibles para agregar con altura fija compacta */}
                    <div className="bg-white rounded-xl p-2 border border-slate-200 max-h-36 sm:max-h-40 overflow-y-auto space-y-1">
                      <div className="flex items-center justify-between px-1.5 pb-1 text-[10px] text-slate-400 font-bold border-b border-slate-100">
                        <span>Disponibles ({filteredStudents.length}):</span>
                        {filteredStudents.length > 0 && (
                          <button
                            type="button"
                            onClick={handleAddAllFilteredStudents}
                            className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold"
                          >
                            + Agregar todos ({filteredStudents.length})
                          </button>
                        )}
                      </div>

                      {filteredStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          {collegeStudents.length === selectedStudentIds.length
                            ? 'Todos los alumnos del colegio ya están en la lista.'
                            : 'No se encontraron alumnos con los filtros actuales.'}
                        </p>
                      ) : (
                        filteredStudents.slice(0, 40).map((st) => (
                          <div
                            key={st.id}
                            className="p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-xs border border-transparent hover:border-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={
                                  st.foto ||
                                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
                                }
                                alt=""
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <span className="font-bold text-slate-800 truncate">
                                {st.nombre} {st.apellidos}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                ({st.grado} {st.grupo})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddStudent(st.id)}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                            >
                              + Agregar
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Alumnos en la lista de beneficiarios */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Alumnos en la lista de beneficiarios ({selectedStudentsList.length}):
                      </span>

                      {selectedStudentsList.length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 bg-white">
                          Aún no has agregado alumnos. Busca arriba y presiona "+ Agregar".
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                          {selectedStudentsList.map((st) => (
                            <div
                              key={st.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs"
                            >
                              <img
                                src={
                                  st.foto ||
                                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'
                                }
                                alt=""
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {st.nombre} {st.apellidos}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({st.grado})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(st.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Pinned / Shrink-0) */}
              <div className="shrink-0 bg-white p-3 sm:p-4 border-t border-slate-200/90 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {isControlEscolar ? (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitud a Administrador</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar y Aplicar Descuento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINAR */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-900 text-base">
                {isCoordinatorOrControl ? '¿Solicitar Eliminación al Administrador?' : '¿Eliminar este Descuento?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isCoordinatorOrControl
                  ? 'Como Coordinador o Control Escolar, la eliminación requiere autorización del Administrador antes de aplicarse.'
                  : 'Esta acción retirará el descuento de los cobros de los alumnos asociados de inmediato.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {isCoordinatorOrControl ? 'Enviar Solicitud' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
