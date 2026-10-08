import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Upload,
  Eye,
  GraduationCap,
  Percent,
  DollarSign,
  Tag,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Repeat,
} from 'lucide-react';
import { BillingConcept, EducationalLevelId } from '../types';
import { formatPlatformFeeLegend, calculatePlatformFee } from '../utils/feeCalculator';

const EDUCATIONAL_LEVELS: {
  id: EducationalLevelId;
  label: string;
  tutorLabel: string;
  badgeColor: string;
}[] = [
  {
    id: 'preescolar',
    label: 'Preescolar',
    tutorLabel: 'Tutores de Preescolar',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  {
    id: 'primaria',
    label: 'Primaria',
    tutorLabel: 'Tutores de Primaria',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'secundaria',
    label: 'Secundaria',
    tutorLabel: 'Tutores de Secundaria',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'preparatoria',
    label: 'Preparatoria',
    tutorLabel: 'Tutores de Preparatoria',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
];

const PRESET_CONCEPT_IMAGES = [
  {
    label: 'Paquete de Libros',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Uniforme Escolar',
    url: 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Excursión / Evento',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Tecnología / Laboratorio',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
  },
];

export const BillingConceptsModule: React.FC = () => {
  const {
    activeCollege,
    selectedCampusId,
    billingConcepts,
    addBillingConcept,
    updateBillingConcept,
    deleteBillingConcept,
    platformFeeConfig,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingConcept, setEditingConcept] = useState<BillingConcept | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<string>('');
  const [esRecurrenteMensual, setEsRecurrenteMensual] = useState<boolean>(false);
  const [fechaCobroMensual, setFechaCobroMensual] = useState<string>('2026-10-10');
  const [diaCobroMensual, setDiaCobroMensual] = useState<number>(10);
  const [llevaImagen, setLlevaImagen] = useState<boolean>(false);
  const [imagenUrl, setImagenUrl] = useState<string>('');
  const [nivelesPublicados, setNivelesPublicados] = useState<EducationalLevelId[]>([
    'preescolar',
    'primaria',
    'secundaria',
    'preparatoria',
  ]);
  const [activo, setActivo] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const secondaryColor = activeCollege.colores.secundario || '#C59B27';

  const canManage =
    currentUser?.rol === 'superusuario' ||
    currentUser?.rol === 'administrador' ||
    currentUser?.rol === 'directivo' ||
    currentUser?.rol === 'coordinador' ||
    currentUser?.rol === 'supervisor';

  // Current active commission for this college
  const commissionLabel = formatPlatformFeeLegend(platformFeeConfig, activeCollege.id);

  // Filter concepts for this college
  const safeBillingConcepts = Array.isArray(billingConcepts) ? billingConcepts : [];
  const collegeConcepts = safeBillingConcepts.filter((c) => {
    if (!c || c.colegioId !== activeCollege.id) return false;
    if (selectedCampusId && selectedCampusId !== 'all' && c.campusId && c.campusId !== selectedCampusId) return false;
    const nombreStr = (c.concepto || '').toLowerCase();
    const descStr = (c.descripcion || '').toLowerCase();
    const queryStr = (searchTerm || '').toLowerCase().trim();
    if (
      queryStr !== '' &&
      !nombreStr.includes(queryStr) &&
      !descStr.includes(queryStr)
    ) {
      return false;
    }
    const niveles = Array.isArray(c.nivelesPublicados) ? c.nivelesPublicados : [];
    if (
      levelFilter !== 'todos' &&
      !niveles.includes(levelFilter as EducationalLevelId)
    ) {
      return false;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingConcept(null);
    setConcepto('');
    setDescripcion('');
    setPrecio('');
    setEsRecurrenteMensual(false);
    setFechaCobroMensual('2026-10-10');
    setDiaCobroMensual(10);
    setLlevaImagen(false);
    setImagenUrl('');
    setNivelesPublicados(['preescolar', 'primaria', 'secundaria', 'preparatoria']);
    setActivo(true);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: BillingConcept) => {
    setEditingConcept(item);
    setConcepto(item.concepto || '');
    setDescripcion(item.descripcion || '');
    setPrecio(String(item.precio ?? ''));
    setEsRecurrenteMensual(Boolean(item.esRecurrenteMensual));
    setFechaCobroMensual(item.fechaCobroMensual || item.fechaVencimiento || '2026-10-10');
    setDiaCobroMensual(item.diaCobroMensual || 10);
    setLlevaImagen(Boolean(item.llevaImagen));
    setImagenUrl(item.imagenUrl || '');
    setNivelesPublicados(
      Array.isArray(item.nivelesPublicados)
        ? item.nivelesPublicados
        : ['preescolar', 'primaria', 'secundaria', 'preparatoria']
    );
    setActivo(item.activo ?? true);
    setFormError('');
    setShowModal(true);
  };

  const toggleNivel = (nivel: EducationalLevelId) => {
    setNivelesPublicados((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.includes(nivel) ? list.filter((n) => n !== nivel) : [...list, nivel];
    });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImagenUrl(reader.result);
        setLlevaImagen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(precio);
    if (!concepto.trim()) {
      setFormError('Por favor ingresa el nombre del concepto de cobro.');
      return;
    }
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Por favor ingresa un precio válido mayor a $0.00 MXN.');
      return;
    }
    if (nivelesPublicados.length === 0) {
      setFormError(
        'Selecciona al menos un perfil de tutores donde se publicará este cobro (Preescolar, Primaria, Secundaria o Preparatoria).'
      );
      return;
    }

    const parsedDayFromDate = fechaCobroMensual
      ? parseInt(fechaCobroMensual.split('-')[2] || '10', 10) || diaCobroMensual
      : diaCobroMensual;

    if (editingConcept) {
      updateBillingConcept(editingConcept.id, {
        concepto: concepto.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: numericPrice,
        esRecurrenteMensual,
        fechaCobroMensual: esRecurrenteMensual ? fechaCobroMensual : undefined,
        diaCobroMensual: esRecurrenteMensual ? parsedDayFromDate : undefined,
        fechaVencimiento: esRecurrenteMensual ? fechaCobroMensual : editingConcept.fechaVencimiento,
        llevaImagen,
        imagenUrl: llevaImagen && imagenUrl.trim() ? imagenUrl.trim() : undefined,
        nivelesPublicados,
        activo,
      });
    } else {
      addBillingConcept({
        colegioId: activeCollege.id,
        campusId: selectedCampusId && selectedCampusId !== 'all' ? selectedCampusId : undefined,
        concepto: concepto.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: numericPrice,
        esRecurrenteMensual,
        fechaCobroMensual: esRecurrenteMensual ? fechaCobroMensual : undefined,
        diaCobroMensual: esRecurrenteMensual ? parsedDayFromDate : undefined,
        fechaVencimiento: esRecurrenteMensual ? fechaCobroMensual : '2026-10-30',
        llevaImagen,
        imagenUrl: llevaImagen && imagenUrl.trim() ? imagenUrl.trim() : undefined,
        nivelesPublicados,
        activo,
        fechaCreacion: new Date().toISOString().split('T')[0],
      });
    }

    setShowModal(false);
  };

  const previewAmount = parseFloat(precio) > 0 ? parseFloat(precio) : 0;
  const previewFeeBreakdown = calculatePlatformFee(
    previewAmount,
    platformFeeConfig,
    activeCollege.id
  );

  return (
    <div className="space-y-6">
      {/* Cabecera Institucional Limpia */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-56 h-56 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ backgroundColor: secondaryColor }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold uppercase tracking-wider mb-3">
              <CreditCard className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
              <span>Catálogo Institucional de Cobros</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif">
              Módulo de Cobros y Conceptos
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-1.5 leading-relaxed">
              Administra conceptos de pago adicionales o recurrentes, define si llevan imagen
              ilustrativa y elige en qué perfiles de tutores (Preescolar, Primaria, Secundaria o
              Preparatoria) se publican.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Botones de Acción (Debajo de la Cabecera) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Leyenda obligatoria de comisión vigente del colegio */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-700 shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-semibold">
            Todo cobro genera una comisión de{' '}
            <span className="font-black text-amber-900 underline decoration-amber-400 decoration-2 underline-offset-2">
              {commissionLabel}
            </span>
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer"
            style={{ backgroundColor: secondaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Concepto de Cobro</span>
          </button>
        )}
      </div>

      {/* Resumen y Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar concepto por nombre o descripción..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setLevelFilter('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              levelFilter === 'todos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({billingConcepts.filter((c) => c.colegioId === activeCollege.id).length})
          </button>
          {EDUCATIONAL_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevelFilter(lvl.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                levelFilter === lvl.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Conceptos de Cobro */}
      {collegeConcepts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-800">
            No hay conceptos de cobro registrados
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Agrega conceptos como inscripciones, libros, uniformes o eventos y elige en qué perfiles
            de tutores deseas publicarlos.
          </p>
          {canManage && (
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-md cursor-pointer"
              style={{ backgroundColor: secondaryColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primer Concepto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {collegeConcepts.map((item) => {
            const feeBreakdown = calculatePlatformFee(
              item.precio,
              platformFeeConfig,
              activeCollege.id
            );

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                  item.activo ? 'border-slate-200/90' : 'border-slate-200 opacity-65'
                }`}
              >
                <div>
                  {/* Imagen opcional del concepto */}
                  {item.llevaImagen && item.imagenUrl ? (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={item.imagenUrl}
                        alt={item.concepto}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-amber-400" />
                        <span>Con Imagen</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            item.activo
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {item.activo ? 'Publicado' : 'Pausado'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                        <Tag className="w-3 h-3" />
                        <span>Sin imagen ilustrativa</span>
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          item.activo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.activo ? 'Publicado' : 'Pausado'}
                      </span>
                    </div>
                  )}

                  {/* Contenido del concepto */}
                  <div className="p-6 pt-4">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {item.concepto}
                    </h3>
                    {item.descripcion && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.descripcion}
                      </p>
                    )}

                    {/* Precio final con comisión integrada (sin mostrar concepto de comisión por separado) */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-black text-slate-600">Monto Total:</span>
                        <span className="text-lg font-black text-emerald-700 font-mono">
                          ${feeBreakdown.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </span>
                      </div>

                      {item.esRecurrenteMensual ? (
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            <Repeat className="w-3 h-3" />
                            <span>Recurrente cada mes</span>
                          </span>
                          <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            <span>
                              Fecha de cobro: {item.fechaCobroMensual || `Día ${item.diaCobroMensual || 10} de cada mes`}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Periodicidad:</span>
                          <span className="font-semibold text-slate-700">Cobro Único</span>
                        </div>
                      )}
                    </div>

                    {/* Perfiles donde se publica */}
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Publicado en perfiles de tutores:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {EDUCATIONAL_LEVELS.filter((lvl) =>
                          (Array.isArray(item.nivelesPublicados) ? item.nivelesPublicados : []).includes(lvl.id)
                        ).map((lvl) => (
                          <span
                            key={lvl.id}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${lvl.badgeColor}`}
                          >
                            {lvl.tutorLabel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {canManage && (
                  <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => updateBillingConcept(item.id, { activo: !item.activo })}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {item.activo ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span>Inactivo</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Editar concepto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              deleteBillingConcept(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar concepto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear / Editar Concepto de Cobro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div
              className="px-6 py-5 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">
                    {editingConcept ? 'Editar Concepto de Cobro' : 'Nuevo Concepto de Cobro'}
                  </h2>
                  <p className="text-xs text-slate-200">
                    Configura el concepto, precio, imagen opcional y perfiles de tutores destino
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Leyenda de comisión vigente dentro del formulario */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-950">
                <Percent className="w-5 h-5 text-amber-700 shrink-0" />
                <div className="text-xs sm:text-sm font-semibold">
                  Todo cobro genera una comisión de{' '}
                  <span className="font-black text-amber-900 underline">
                    {commissionLabel}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {formError}
                </div>
              )}

              {/* Nombre y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Concepto de Cobro *
                  </label>
                  <input
                    type="text"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej. Reinscripción Anual, Paquete de Libros..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Precio (MXN) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Monto total final con comisión integrada */}
              {previewAmount > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">
                    Monto Total a Publicar:
                  </span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ${previewFeeBreakdown.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              )}

              {/* Descripción opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descripción o Detalles (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe qué incluye este concepto de cobro o indicaciones para el tutor..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Configuración de Periodicidad: ¿Cobro Único o Recurrente Cada Mes? */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-indigo-50/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-indigo-600" />
                      <span>Periodicidad del Concepto de Cobro</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Elige si el concepto es de cobro único o si es recurrente cada mes con fecha de cobro mensual
                    </p>
                  </div>

                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setEsRecurrenteMensual(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !esRecurrenteMensual
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cobro Único
                    </button>
                    <button
                      type="button"
                      onClick={() => setEsRecurrenteMensual(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        esRecurrenteMensual
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Recurrente Cada Mes
                    </button>
                  </div>
                </div>

                {esRecurrenteMensual && (
                  <div className="pt-3 border-t border-indigo-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Fecha de Cobro Mensual *</span>
                      </label>
                      <input
                        type="date"
                        value={fechaCobroMensual}
                        onChange={(e) => {
                          setFechaCobroMensual(e.target.value);
                          const dayPart = parseInt(e.target.value.split('-')[2] || '10', 10);
                          if (!isNaN(dayPart)) setDiaCobroMensual(dayPart);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        required={esRecurrenteMensual}
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs text-indigo-950">
                      <span className="font-bold block text-indigo-800">
                        Cobro Mensual Programado
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Este concepto se cobrará de forma recurrente el día{' '}
                        <strong>{diaCobroMensual} de cada mes</strong> (próxima fecha:{' '}
                        <strong>{fechaCobroMensual}</strong>).
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector: ¿Lleva imagen o no lleva imagen? */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                      <span>Configuración de Imagen del Cobro</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Elige si este concepto de cobro lleva una imagen ilustrativa o solo texto
                    </p>
                  </div>

                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setLlevaImagen(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !llevaImagen
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sin Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlevaImagen(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        llevaImagen
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lleva Imagen
                    </button>
                  </div>
                </div>

                {llevaImagen && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        placeholder="Pega la URL de una imagen o sube un archivo..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen</span>
                      </button>
                    </div>

                    {/* Galería rápida de imágenes sugeridas */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>O selecciona una imagen institucional sugerida:</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PRESET_CONCEPT_IMAGES.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setImagenUrl(preset.url)}
                            className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                              imagenUrl === preset.url
                                ? 'border-slate-900 bg-slate-900/5 ring-2 ring-slate-900/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-14 object-cover rounded-lg mb-1"
                            />
                            <p className="text-[10px] font-bold text-slate-700 truncate">
                              {preset.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {imagenUrl && (
                      <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={imagenUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImagenUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/75 text-white hover:bg-slate-900 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selección de Perfiles de Tutores donde se publica */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-slate-700" />
                      <span>¿En qué perfil de tutores se publica? *</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Selecciona si se publica en Tutores de Preescolar, Primaria, Secundaria o
                      Preparatoria
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNivelesPublicados(
                        nivelesPublicados.length === 4
                          ? []
                          : ['preescolar', 'primaria', 'secundaria', 'preparatoria']
                      )
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {nivelesPublicados.length === 4 ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EDUCATIONAL_LEVELS.map((lvl) => {
                    const selected = nivelesPublicados.includes(lvl.id);
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => toggleNivel(lvl.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-black">{lvl.tutorLabel}</p>
                          <p
                            className={`text-[11px] ${
                              selected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            Visible para padres de {lvl.label}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            selected ? 'bg-emerald-400 text-slate-950' : 'bg-white border border-slate-300'
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingConcept ? 'Guardar Cambios' : 'Publicar Concepto de Cobro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
