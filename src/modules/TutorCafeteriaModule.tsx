import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  CreditCard,
  QrCode,
  X,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Receipt,
  Download,
  Flame,
  Check,
  FlaskConical,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  CafeteriaProduct,
  CafeteriaOrderItem,
  CafeteriaOrder,
  Student,
} from '../types';
import {
  PaymentGatewaySimulator,
  SimulatedPaymentSuccessDetails,
} from '../components/PaymentGatewaySimulator';
import { SafeImage } from '../components/SafeImage';

interface CartItem {
  product: CafeteriaProduct;
  quantity: number;
  notas?: string;
}

const CATEGORIES = [
  'Todos',
  'Desayunos',
  'Comidas',
  'Bebidas',
  'Snacks',
  'Saludable',
  'Postres',
  'Combos',
] as const;

interface TutorCafeteriaModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const TutorCafeteriaModule: React.FC<TutorCafeteriaModuleProps> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    colleges,
    cafeteriaProducts,
    cafeteriaOrders,
    createCafeteriaOrder,
    currentUser,
    students,
  } = useApp();

  const primaryColor = activeCollege?.colores.primario || '#0B2545';
  const secondaryColor = activeCollege?.colores.secundario || '#C59B27';

  // Sub-tabs: 'tienda' | 'mis_pedidos'
  const [activeTab, setActiveTab] = useState<'tienda' | 'mis_pedidos'>('tienda');

  // Filter students linked to this tutor
  const linkedStudents = useMemo(() => {
    const list = students.filter((s) => {
      if (s.estatus === 'baja') return false;
      if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
      if (s.tutorId === currentUser.id) return true;
      if (
        currentUser.curpsAsociadas &&
        s.curp &&
        currentUser.curpsAsociadas.includes(s.curp.toUpperCase())
      ) {
        return true;
      }
      if (
        currentUser.correo &&
        s.tutorCorreo &&
        s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    if (list.length > 0) return list;

    // Fallback if not directly matched in mock session
    if (activeCollege) {
      return students.filter((s) => s.colegioId === activeCollege.id && s.estatus !== 'baja').slice(0, 2);
    }
    return students.slice(0, 2);
  }, [students, currentUser, activeCollege]);

  // Selected student for whom the tutor is purchasing products
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return linkedStudents[0]?.id || '';
  });

  useEffect(() => {
    if (linkedStudents.length > 0 && !linkedStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(linkedStudents[0].id);
    }
  }, [linkedStudents, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    return linkedStudents.find((s) => s.id === selectedStudentId) || linkedStudents[0];
  }, [linkedStudents, selectedStudentId]);

  // College-scoped products
  const collegeProducts = useMemo(() => {
    const targetColId = selectedStudent?.colegioId || activeCollege?.id;
    return cafeteriaProducts.filter(
      (p) => (!targetColId || p.colegioId === targetColId) && p.disponible
    );
  }, [cafeteriaProducts, selectedStudent, activeCollege]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [metodoPago, setMetodoPago] = useState<
    'saldo_escolar' | 'tarjeta' | 'efectivo_cafeteria' | 'spei'
  >('saldo_escolar');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal
  const [confirmedOrder, setConfirmedOrder] = useState<CafeteriaOrder | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Viewing QR for any past order
  const [viewingQrOrder, setViewingQrOrder] = useState<CafeteriaOrder | null>(null);
  const [viewingQrDataUrl, setViewingQrDataUrl] = useState<string>('');

  // Generate student QR payload
  const generateStudentQrPayload = (student: Student) => {
    const officialDomain = 'https://dashboard.mycollege.com.mx';
    return `${officialDomain}/asistencia?alumno=${encodeURIComponent(
      student.matricula
    )}&sid=${encodeURIComponent(student.id)}&colegio=${encodeURIComponent(
      student.colegioId
    )}&curp=${encodeURIComponent(student.curp)}&grado=${encodeURIComponent(
      student.grado
    )}&grupo=${encodeURIComponent(student.grupo)}&docente=${encodeURIComponent(
      student.docenteId || ''
    )}`;
  };

  // Generate QR image when confirmedOrder changes
  useEffect(() => {
    if (confirmedOrder) {
      const studentObj = students.find((s) => s.id === confirmedOrder.estudianteId) || selectedStudent;
      if (studentObj) {
        const payload = generateStudentQrPayload(studentObj);
        QRCode.toDataURL(payload, { width: 320, margin: 2 })
          .then(setQrCodeDataUrl)
          .catch(() => setQrCodeDataUrl(''));
      }
    }
  }, [confirmedOrder, students, selectedStudent]);

  // Generate QR image when viewingQrOrder changes
  useEffect(() => {
    if (viewingQrOrder) {
      const studentObj = students.find((s) => s.id === viewingQrOrder.estudianteId);
      if (studentObj) {
        const payload = generateStudentQrPayload(studentObj);
        QRCode.toDataURL(payload, { width: 320, margin: 2 })
          .then(setViewingQrDataUrl)
          .catch(() => setViewingQrDataUrl(''));
      }
    }
  }, [viewingQrOrder, students]);

  // Cart operations
  const addToCart = (product: CafeteriaProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.precio * item.quantity, 0);
  }, [cart]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return collegeProducts.filter((p) => {
      if (selectedCategory !== 'Todos' && p.categoria !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.nombre.toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [collegeProducts, selectedCategory, searchQuery]);

  // Orders placed by this tutor
  const tutorOrders = useMemo(() => {
    return cafeteriaOrders.filter((o) => {
      if (o.tutorId === currentUser.id) return true;
      if (currentUser.hijosIds && currentUser.hijosIds.includes(o.estudianteId)) return true;
      return false;
    });
  }, [cafeteriaOrders, currentUser]);

  // Filtro de alumno en pestaña Mis Compras
  const [purchasesStudentFilter, setPurchasesStudentFilter] = useState<string>('todos');
  const filteredTutorOrders = useMemo(() => {
    if (purchasesStudentFilter === 'todos') return tutorOrders;
    return tutorOrders.filter((o) => o.estudianteId === purchasesStudentFilter);
  }, [tutorOrders, purchasesStudentFilter]);

  // Submit Order
  const handleConfirmOrder = async () => {
    if (!selectedStudent || cart.length === 0) return;

    const orderItems: CafeteriaOrderItem[] = cart.map((item) => ({
      productoId: item.product.id,
      nombre: item.product.nombre,
      precioUnitario: item.product.precio,
      cantidad: item.quantity,
      subtotal: item.product.precio * item.quantity,
      notas: item.notas,
      imagen: item.product.imagen,
    }));

    const targetCollegeId = selectedStudent.colegioId || activeCollege?.id || colleges[0]?.id || 'col-cervantes';

    const newOrder = await createCafeteriaOrder({
      colegioId: targetCollegeId,
      tutorId: currentUser.id,
      tutorNombre: currentUser.nombre,
      tutorTelefono: currentUser.telefono,
      estudianteId: selectedStudent.id,
      estudianteNombre: `${selectedStudent.nombre} ${selectedStudent.apellidos}`,
      estudianteMatricula: selectedStudent.matricula,
      estudianteGrado: selectedStudent.grado,
      estudianteGrupo: selectedStudent.grupo,
      estudianteFoto: selectedStudent.foto,
      items: orderItems,
      totalItems: totalCartItems,
      total: totalCartPrice,
      metodoPago,
      notas: orderNotes.trim() || undefined,
    });

    clearCart();
    setOrderNotes('');
    setIsCartDrawerOpen(false);
    setConfirmedOrder(newOrder);
  };

  // Determine if active context has Modo Prueba enabled for demo sales
  const isModoPrueba = Boolean(
    activeCollege?.modoPrueba ||
    colleges.find((c) => c.id === selectedStudent?.colegioId)?.modoPrueba
  );

  // Simulated Order via Payment Gateway Simulator (Modo Prueba)
  const handleSimulatedOrder = async (details: SimulatedPaymentSuccessDetails) => {
    if (!selectedStudent || cart.length === 0) return;

    const orderItems: CafeteriaOrderItem[] = cart.map((item) => ({
      productoId: item.product.id,
      nombre: item.product.nombre,
      precioUnitario: item.product.precio,
      cantidad: item.quantity,
      subtotal: item.product.precio * item.quantity,
      notas: item.notas,
      imagen: item.product.imagen,
    }));

    const targetCollegeId = selectedStudent.colegioId || activeCollege?.id || colleges[0]?.id || 'col-cervantes';

    const newOrder = await createCafeteriaOrder({
      colegioId: targetCollegeId,
      tutorId: currentUser.id,
      tutorNombre: currentUser.nombre,
      tutorTelefono: currentUser.telefono,
      estudianteId: selectedStudent.id,
      estudianteNombre: `${selectedStudent.nombre} ${selectedStudent.apellidos}`,
      estudianteMatricula: selectedStudent.matricula,
      estudianteGrado: selectedStudent.grado,
      estudianteGrupo: selectedStudent.grupo,
      estudianteFoto: selectedStudent.foto,
      items: orderItems,
      totalItems: totalCartItems,
      total: totalCartPrice,
      metodoPago: 'tarjeta',
      notas: (orderNotes ? `${orderNotes.trim()} | ` : '') + `[SIMULACIÓN DEMO: Aut. ${details.autorizacion} - ${details.metodo}]`,
    });

    clearCart();
    setOrderNotes('');
    setIsCartDrawerOpen(false);
    setConfirmedOrder(newOrder);
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Mi Cafetería */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ backgroundColor: secondaryColor }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold uppercase tracking-wider mb-3">
              <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
              <span>Cafetería Escolar · Portal de Familias</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif">
              Mi Cafetería
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-1.5 leading-relaxed">
              Realiza compras tipo carrito para tus hijos. Los pedidos se validan y entregan en mostrador
              mediante el escaneo de la credencial QR del alumno.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-300">Servicio de Alimentos</span>
              <span className="text-xs font-extrabold text-white">Mostrador & Entrega QR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Navegación Bajados del Encabezado */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tienda')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tienda'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Realizar Compras</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mis_pedidos')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'mis_pedidos'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Mis Compras</span>
            {tutorOrders.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'mis_pedidos'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tutorOrders.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'tienda' && totalCartItems > 0 && (
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-slate-950 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            style={{ backgroundColor: secondaryColor }}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>Ver Carrito ({totalCartItems})</span>
            <span className="bg-slate-950 text-white px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
              ${totalCartPrice.toFixed(2)}
            </span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: TIENDA / CATÁLOGO TIPO CARRITO                                    */}
      {/* ========================================================================= */}
      {activeTab === 'tienda' && (
        <div className="space-y-6">
          {/* SECCIÓN CLAVE REQUERIDA: SELECCIÓN DE ALUMNO DESTINATARIO DEL PEDIDO */}
          {linkedStudents.length > 0 && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span>¿Para quién es este pedido?</span>
                    {linkedStudents.length > 1 && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        {linkedStudents.length} Alumnos Vinculados
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {linkedStudents.length > 1
                      ? 'Tienes varios hijos asignados. Selecciona quién recibirá los productos en la cafetería escolar:'
                      : 'Los productos se registrarán y entregarán a tu hijo(a) asignado:'}
                  </p>
                </div>

                {selectedStudent && (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>
                      Comprando para: <strong>{selectedStudent.nombre}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Tarjetas de Selección de Alumnos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {linkedStudents.map((st) => {
                  const isSelected = st.id === selectedStudentId;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {st.foto ? (
                          <SafeImage
                            src={st.foto}
                            alt={st.nombre}
                            fallbackType="student"
                            fallbackText={st.nombre}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {st.nombre} {st.apellidos}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.2 rounded border border-slate-200 text-[10px]">
                            {st.matricula}
                          </span>
                          {st.grado && (
                            <span className="text-slate-500 text-[11px]">
                              {st.grado} "{st.grupo}"
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping inline-block" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Barra de Búsqueda y Categorías */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar alimentos, bebidas, refrigerios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Botón flotante/desktop de ver carrito */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-slate-950 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: secondaryColor }}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Ver Carrito ({totalCartItems})</span>
              <span className="bg-slate-950 text-white px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                ${totalCartPrice.toFixed(2)}
              </span>
            </button>
          </div>

          {/* Categorías Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Grid de Productos Disponibles */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                No hay productos disponibles en esta categoría
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba seleccionando otra categoría o limpiando los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((prod) => {
                const itemInCart = cart.find((it) => it.product.id === prod.id);
                const currentQty = itemInCart?.quantity || 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Imagen con precio flotante */}
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        {prod.imagen ? (
                          <SafeImage
                            src={prod.imagen}
                            alt={prod.nombre}
                            fallbackType="product"
                            fallbackText={prod.nombre}
                            fallbackExtra={prod.categoria}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                            <UtensilsCrossed className="w-10 h-10" />
                          </div>
                        )}

                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-900/85 backdrop-blur-md text-white shadow-xs">
                            {prod.categoria}
                          </span>
                        </div>

                        <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-slate-200/80">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            ${prod.precio.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 ml-0.5">MXN</span>
                        </div>
                      </div>

                      {/* Detalles */}
                      <div className="p-4 space-y-1.5">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                          {prod.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {prod.descripcion || 'Preparado fresco en la cafetería escolar.'}
                        </p>
                      </div>
                    </div>

                    {/* Botón de Agregar / Control de Cantidad */}
                    <div className="p-4 pt-0">
                      {currentQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Agregar al Carrito</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty - 1)}
                            className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-xs sm:text-sm text-slate-900 font-mono">
                            {currentQty} en carrito
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, currentQty + 1)}
                            className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MIS COMPRAS (PRODUCTOS COMPRADOS AGRUPADOS POR ÓRDENES)           */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* PESTAÑA 2: MIS PEDIDOS / COMPRAS REALIZADAS                               */}
      {/* ========================================================================= */}
      {activeTab === 'mis_pedidos' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Mis Compras Realizadas</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {tutorOrders.length} {tutorOrders.length === 1 ? 'orden registrada' : 'órdenes registradas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta los productos adquiridos agrupados por cada orden de compra. Muestra el código QR del estudiante en el mostrador para recoger.
              </p>
            </div>
          </div>

          {/* Filtro por Alumno en Mis Compras */}
          {linkedStudents.length > 0 && tutorOrders.length > 0 && (
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700">Filtrar compras por alumno:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPurchasesStudentFilter('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    purchasesStudentFilter === 'todos'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({tutorOrders.length})
                </button>
                {linkedStudents.map((st) => {
                  const count = tutorOrders.filter((o) => o.estudianteId === st.id).length;
                  const isSelected = purchasesStudentFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPurchasesStudentFilter(st.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor } : undefined}
                    >
                      <span>{st.nombre.split(' ')[0]} {st.apellidos ? st.apellidos.split(' ')[0] : ''}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tutorOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Aún no has realizado compras</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Dirígete a la pestaña "Realizar Compras" para elegir refrigerios y asignarlos a tus hijos.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('tienda')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-95"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Ir a Realizar Compras</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : filteredTutorOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900">No hay compras para este alumno</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No se encontraron órdenes registradas asignadas al alumno seleccionado.
              </p>
              <button
                type="button"
                onClick={() => setPurchasesStudentFilter('todos')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <span>Ver todas las compras ({tutorOrders.length})</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredTutorOrders.map((ord) => {
                const isDelivered = ord.estado === 'entregada';
                return (
                  <div
                    key={ord.id}
                    className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${
                      isDelivered ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Header de la Orden */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 font-mono font-black text-xs shadow-xs"
                          style={{
                            backgroundColor: isDelivered ? '#10b981' : primaryColor,
                          }}
                        >
                          {ord.folio.replace('#CAF-', '')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {ord.folio}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">
                              {new Date(ord.fechaCreacion).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {isDelivered ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                                  <span>✓ Pedido Entregado</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600 inline" />
                                  <span>⏳ Por Entregar</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 mt-1 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 font-semibold">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 inline" />
                              Asignado a:{' '}
                              <strong className="text-slate-900 font-bold">{ord.estudianteNombre}</strong>
                            </span>
                            {isDelivered && (
                              <>
                                <span className="text-slate-400">|</span>
                                <span className="font-mono text-slate-600">Matrícula: {ord.estudianteMatricula}</span>
                              </>
                            )}
                            {ord.estudianteGrado && (
                              <>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-600">Grupo: {ord.estudianteGrado} {ord.estudianteGrupo || ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingQrOrder(ord)}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'text-white hover:opacity-95'
                          }`}
                          style={!isDelivered ? { backgroundColor: primaryColor } : undefined}
                        >
                          <QrCode className={`w-4 h-4 ${isDelivered ? 'text-emerald-600' : 'text-amber-300'}`} />
                          <span>{isDelivered ? 'Ver Credencial QR' : 'Ver Credencial QR de Entrega'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Banner de estado de entrega */}
                    {isDelivered ? (
                      <div className="p-3.5 bg-emerald-50/90 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-black text-emerald-950">✓ Pedido Entregado en Cafetería</span>
                            {ord.fechaEntrega && (
                              <span className="text-emerald-800 ml-1.5">
                                · Canjeado el {new Date(ord.fechaEntrega).toLocaleDateString('es-MX', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                            {ord.entregadoPor && (
                              <span className="text-emerald-700 text-[11px] block sm:inline sm:ml-1">
                                (Atendido por: {ord.entregadoPor})
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full self-start sm:self-auto shrink-0">
                          QR Escaneado y Validado
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 border-b border-amber-100/80 flex items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Presenta el código QR del estudiante en el mostrador para canjear y retirar los alimentos.</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          Pendiente de canje
                        </span>
                      </div>
                    )}

                    {/* Tabla de Productos Comprados Agrupados */}
                    <div className="p-4 sm:p-5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                        <span>Productos Comprados en esta Orden ({ord.items.length})</span>
                        <span className="font-normal lowercase text-slate-400">({ord.totalItems} piezas totales)</span>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {it.imagen ? (
                                <SafeImage
                                  src={it.imagen}
                                  alt={it.nombre}
                                  fallbackType="product"
                                  fallbackText={it.nombre}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                  <UtensilsCrossed className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {it.nombre}
                                </h5>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-700">Cant: {it.cantidad}</span>
                                  <span>·</span>
                                  <span className="font-mono">${it.precioUnitario.toFixed(2)} c/u</span>
                                  {it.notas && (
                                    <>
                                      <span>·</span>
                                      <span className="italic text-amber-700">Nota: {it.notas}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 font-mono">
                              <span className="text-xs sm:text-sm font-black text-slate-900">
                                ${(it.subtotal || it.precioUnitario * it.cantidad).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">MXN</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resumen Final de la Orden */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-slate-500 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>Método: <strong>{ord.metodoPago === 'tarjeta' ? 'Tarjeta Bancaria' : ord.metodoPago === 'spei' ? 'Transferencia SPEI' : ord.metodoPago === 'saldo_escolar' ? 'Saldo Escolar / Monedero' : 'Pago en Mostrador'}</strong></span>
                          {ord.notas && <span className="text-slate-400 truncate max-w-xs">({ord.notas})</span>}
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                          <span className="text-slate-500 font-sans font-medium">Total de la Orden:</span>
                          <span className="text-base font-black text-slate-900">${ord.total.toFixed(2)} MXN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL DEL CARRITO DE COMPRAS                                      */}
      {/* ========================================================================= */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header del Carrito */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Tu Carrito de Cafetería</h3>
                  <p className="text-xs text-slate-500">{totalCartItems} productos agregados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Destinatario dentro del Carrito */}
            {selectedStudent && (
              <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">
                      Entrega Asignada Para:
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 truncate block">
                      {selectedStudent.nombre} {selectedStudent.apellidos}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Matrícula: {selectedStudent.matricula}
                    </span>
                  </div>
                </div>

                {linkedStudents.length > 1 && (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="text-xs font-bold bg-white text-indigo-950 px-2 py-1 rounded-lg border border-indigo-200 focus:outline-hidden cursor-pointer"
                  >
                    {linkedStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nombre} ({st.grado})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Contenido del Carrito */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">El carrito está vacío</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Selecciona alimentos o bebidas del menú para agregarlos al pedido de tu hijo.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-3 flex items-center gap-3">
                      {item.product.imagen ? (
                        <SafeImage
                          src={item.product.imagen}
                          alt={item.product.nombre}
                          fallbackType="product"
                          fallbackText={item.product.nombre}
                          fallbackExtra={item.product.categoria}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">
                          {item.product.nombre}
                        </h5>
                        <div className="text-[11px] font-mono font-semibold text-slate-500">
                          ${item.product.precio.toFixed(2)} c/u
                        </div>

                        {/* Controles de Cantidad */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs w-6 text-center text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 ml-auto"
                            title="Quitar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-xs text-slate-900 shrink-0">
                        ${(item.product.precio * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notas del Pedido */}
              {cart.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucciones / Notas para Cocina (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Sin jitomate, entregar en primer receso..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}

              {/* Método de Pago */}
              {cart.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Forma de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'saldo_escolar', label: 'Saldo Escolar / Monedero' },
                      { id: 'tarjeta', label: 'Tarjeta Bancaria' },
                      { id: 'efectivo_cafeteria', label: 'Pagar en Mostrador' },
                      { id: 'spei', label: 'Transferencia SPEI' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMetodoPago(m.id as any)}
                        className={`p-2.5 rounded-xl text-left font-bold transition-all border cursor-pointer ${
                          metodoPago === m.id
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Total y Botón de Confirmación */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono">${totalCartPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Servicio de Cafetería</span>
                    <span className="font-mono text-emerald-600 font-bold">$0.00 (Gratis)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total a Pagar</span>
                    <span className="font-mono text-base">${totalCartPrice.toFixed(2)} MXN</span>
                  </div>
                </div>

                {isModoPrueba && (
                  <div className="pt-1">
                    <PaymentGatewaySimulator
                      monto={totalCartPrice}
                      concepto={`Cafetería: ${totalCartItems} producto(s) para ${selectedStudent?.nombre || 'alumno'}`}
                      onSimulateSuccess={handleSimulatedOrder}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="w-full py-3 rounded-2xl font-black text-sm text-slate-950 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar y Enviar Pedido</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRMACIÓN DE PEDIDO Y CREDENCIAL QR DEL ALUMNO                 */}
      {/* ========================================================================= */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                ¡Pedido Confirmado!
              </span>
              <h3 className="font-bold text-lg text-slate-900">
                Orden {confirmedOrder.folio}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                El pedido ya fue enviado a la cafetería escolar para{' '}
                <strong className="text-slate-800">{confirmedOrder.estudianteNombre}</strong>.
              </p>
            </div>

            {/* Código QR del Alumno para Recoger */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-black uppercase text-indigo-950 tracking-wider">
                Código QR de Entrega del Alumno
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Muestra este QR en el mostrador o indícale a tu hijo(a) que presente su credencial
                escolar habitual:
              </p>

              {qrCodeDataUrl ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-xs">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Alumno"
                    className="w-44 h-44 mx-auto object-contain"
                  />
                  <div className="text-[10px] font-mono font-bold text-slate-600 mt-1">
                    {confirmedOrder.estudianteMatricula}
                  </div>
                </div>
              ) : (
                <div className="w-40 h-40 bg-slate-200 rounded-xl mx-auto flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}

              <div className="text-[11px] text-slate-600 font-medium">
                Al escanear este código en la cafetería, el sistema cerrará la orden y validará la entrega.
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  setActiveTab('mis_pedidos');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Entendido · Ver Mis Pedidos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VER QR DE ALUMNO PARA CUALQUIER PEDIDO PASADO                     */}
      {/* ========================================================================= */}
      {viewingQrOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  QR Entrega · {viewingQrOrder.folio}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingQrOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h5 className="font-extrabold text-sm text-slate-900">
                {viewingQrOrder.estudianteNombre}
              </h5>
              <div className="text-xs text-slate-500 font-mono">
                Matrícula: {viewingQrOrder.estudianteMatricula}
              </div>
            </div>

            {viewingQrDataUrl ? (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 inline-block shadow-xs">
                <img
                  src={viewingQrDataUrl}
                  alt="QR Alumno"
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
                <QrCode className="w-8 h-8" />
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-tight">
              Presenta este código frente a la cámara de cafetería para que el personal valide y
              entregue la orden.
            </p>

            <button
              type="button"
              onClick={() => setViewingQrOrder(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
