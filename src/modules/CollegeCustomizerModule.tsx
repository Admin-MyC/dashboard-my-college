import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Palette,
  Upload,
  Shield,
  Check,
  RefreshCw,
  Eye,
  FileText,
  Printer,
  Sparkles,
  Award,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Save,
  Clock,
} from 'lucide-react';
import { createShieldSvg } from '../utils/shieldHelper';
import { compressImageFile } from '../utils/imageCompressor';
import { ReportCardModal } from '../components/ReportCardModal';

// School color presets
const COLOR_PRESETS = [
  { name: 'Azul Marino y Oro Real', primario: '#0B2545', secundario: '#DFB743' },
  { name: 'Guinda Universitario y Dorado', primario: '#6B1123', secundario: '#C59B27' },
  { name: 'Verde Bosque y Plata', primario: '#114B32', secundario: '#94A3B8' },
  { name: 'Azul Real y Amarillo Escolar', primario: '#1E40AF', secundario: '#FACC15' },
  { name: 'Vino Tinto y Oro Mate', primario: '#4A0E17', secundario: '#EAB308' },
  { name: 'Púrpura Imperial y Dorado', primario: '#3B0764', secundario: '#F59E0B' },
];

// Shield gallery presets
const SHIELD_PRESETS = [
  { name: 'Libro del Saber', icon: 'book' as const },
  { name: 'Antorcha del Éxito', icon: 'torch' as const },
  { name: 'Búho de la Sabiduría', icon: 'owl' as const },
  { name: 'Brújula y Excelencia', icon: 'compass' as const },
];

export const CollegeCustomizerModule: React.FC = () => {
  const { activeCollege, updateCollegeBranding, updateCollege, students } = useApp();

  if (!activeCollege) return null;

  const [escudoUrl, setEscudoUrl] = useState(activeCollege.escudoUrl);
  const [primario, setPrimario] = useState(activeCollege.colores.primario);
  const [secundario, setSecundario] = useState(activeCollege.colores.secundario);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // College metadata
  const [nombre, setNombre] = useState(activeCollege.nombre);
  const [lema, setLema] = useState(activeCollege.lema);
  const [director, setDirector] = useState(activeCollege.director);
  const [direccion, setDireccion] = useState(activeCollege.direccion);

  // Sample boleta preview modal state
  const [showBoletaModal, setShowBoletaModal] = useState(false);
  const sampleStudent = students.find((s) => s.colegioId === activeCollege.id) || students[0];

  useEffect(() => {
    if (activeCollege) {
      setEscudoUrl(activeCollege.escudoUrl);
      setPrimario(activeCollege.colores.primario);
      setSecundario(activeCollege.colores.secundario);
      setNombre(activeCollege.nombre);
      setLema(activeCollege.lema);
      setDirector(activeCollege.director);
      setDireccion(activeCollege.direccion);
    }
  }, [activeCollege.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageFile(file, 512, 512, 0.9);
      setEscudoUrl(dataUrl);
    } catch (err) {
      console.error('Error al procesar y comprimir escudo:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCollegeBranding(activeCollege.id, escudoUrl, primario, secundario);
      await updateCollege(activeCollege.id, {
        nombre,
        lema,
        director,
        direccion,
        colores: {
          primario,
          secundario,
          textoCabecera: "#FFFFFF",
        },
        escudoUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Error al guardar en base de datos:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateShieldWithStyle = (iconType: 'book' | 'torch' | 'owl' | 'compass') => {
    const initials = nombre
      .split(' ')
      .map((w) => w[0])
      .slice(0, 3)
      .join('')
      .toUpperCase();
    const newShield = createShieldSvg(primario, secundario, initials, iconType);
    setEscudoUrl(newShield);
  };

  // Requirement 4: When a color is chosen in customize module, do NOT update globally until "Guardar" is clicked.
  // Only update local state so the live preview box reflects the chosen colors.
  const handleUpdateColors = (newPrimario: string, newSecundario: string) => {
    setPrimario(newPrimario);
    setSecundario(newSecundario);
  };

  const handleApplyPresetColors = (presetPrimario: string, presetSecundario: string) => {
    setPrimario(presetPrimario);
    setSecundario(presetSecundario);
  };

  const handleResetColors = () => {
    setPrimario(activeCollege.colores.primario);
    setSecundario(activeCollege.colores.secundario);
  };

  const hasUnsavedColorChanges =
    primario.toLowerCase() !== activeCollege.colores.primario.toLowerCase() ||
    secundario.toLowerCase() !== activeCollege.colores.secundario.toLowerCase();

  const savedPrimary = activeCollege.colores.primario || '#0B2545';
  const savedSecondary = activeCollege.colores.secundario || '#C59B27';

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${savedPrimary} 0%, ${savedPrimary}dd 100%)`,
          borderBottom: `4px solid ${savedSecondary}`,
        }}
      >
        <div className="space-y-1.5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: savedSecondary, color: savedPrimary }}
          >
            <Palette className="w-4 h-4" />
            <span>Módulo Personalizar</span>
          </div>

          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white flex items-center gap-2.5">
            Identidad Visual de {activeCollege.nombre}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Configura el <strong>color de tu dashboard</strong> y sube el <strong>escudo oficial</strong> de tu colegio.
            Estas opciones se aplican al encabezado de todos los módulos, boletas de calificaciones, credenciales y reportes oficiales.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setShowBoletaModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs md:text-sm shadow-2xs transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" style={{ color: savedPrimary }} />
          <span>Ver Boleta con este Escudo</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: savedSecondary, color: savedPrimary }}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-700" />
              <span>¡Cambios Guardados con Éxito!</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Personalización</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Callout */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block text-sm">
            Efecto inmediato en todo el sistema escolar:
          </span>
          <p className="mt-0.5 text-slate-600">
            Al guardar, el <strong>color primario</strong> se reflejará en la barra de navegación y botones del dashboard;
            el <strong>color secundario</strong> en bordes y sellos de honor; y el <strong>escudo oficial</strong> se
            imprimirá automáticamente en el encabezado de las boletas oficiales SEP, credenciales de estudiantes y reportes de prefectura.
          </p>
        </div>
      </div>

      {/* The Two Requested Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: THE TWO OPTIONS (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ======================================================== */}
          {/* OPCIÓN 1: CAMBIAR EL COLOR DEL DASHBOARD */}
          {/* ======================================================== */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-2xs"
                  style={{ backgroundColor: primario }}
                >
                  1
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Opción 1: Cambiar el Color del Dashboard
                  </h3>
                  <span className="text-xs text-slate-500">
                    Elige los colores representativos de tu institución
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Personalización
              </span>
            </div>

            {hasUnsavedColorChanges && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Vista previa activa:</strong> Los colores seleccionados sólo se muestran en la vista previa y no se aplicarán al colegio hasta que hagas clic en <strong>Guardar Personalización</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  Deshacer cambios
                </button>
              </div>
            )}

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primario */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Color Primario del Dashboard
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primario}
                    onChange={(e) => handleUpdateColors(e.target.value, secundario)}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300 shadow-2xs shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={primario}
                      onChange={(e) => handleUpdateColors(e.target.value, secundario)}
                      className="w-full text-xs font-mono px-3 py-2 border rounded-lg font-bold bg-white"
                      placeholder="#0B2545"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Aplica al encabezado, sidebar activo, botones de acción y títulos de boletas.
                </p>
              </div>

              {/* Secundario */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Color Secundario / Acento
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secundario}
                    onChange={(e) => handleUpdateColors(primario, e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300 shadow-2xs shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={secundario}
                      onChange={(e) => handleUpdateColors(primario, e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border rounded-lg font-bold bg-white"
                      placeholder="#DFB743"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Aplica a bordes dorados, detalles de honor, sellos y calificaciones destacadas.
                </p>
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                Paletas Escolares Recomendadas (1 Clic):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    primario.toLowerCase() === preset.primario.toLowerCase() &&
                    secundario.toLowerCase() === preset.secundario.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPresetColors(preset.primario, preset.secundario)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <div
                          className="w-5 h-5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: preset.primario }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: preset.secundario }}
                        />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-800 truncate">
                        {preset.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* OPCIÓN 2: AGREGAR ESCUDO DEL COLEGIO */}
          {/* ======================================================== */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-2xs"
                  style={{ backgroundColor: primario }}
                >
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Opción 2: Agregar Escudo del Colegio
                  </h3>
                  <span className="text-xs text-slate-500">
                    Sube el escudo oficial para que aparezca en reportes, boletas y dashboard
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                Aparece en Boletas
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Escudo Preview Container (Only shown if uploaded) */}
              {escudoUrl && (
                <div className="p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 flex flex-col items-center justify-center shrink-0 w-36 h-36">
                  <img
                    src={escudoUrl}
                    alt="Escudo del colegio"
                    className="w-24 h-24 object-contain"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Escudo Activo
                  </span>
                </div>
              )}

              {/* Upload & Generator Buttons */}
              <div className="space-y-3 flex-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sube el archivo de tu escudo institucional (formato <strong>PNG</strong> con transparencia, <strong>SVG</strong> o <strong>JPG</strong>).
                  Este escudo sustituirá al emblema genérico en todos los documentos oficiales generados por el colegio.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#123B6B] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Subir Escudo Propio (Archivo)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Shield Variations */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    O generar blasón con las iniciales del colegio:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SHIELD_PRESETS.map((preset) => (
                      <button
                        key={preset.icon}
                        type="button"
                        onClick={() => handleGenerateShieldWithStyle(preset.icon)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-slate-700 font-medium transition-colors cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* List of where it appears */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800 block">
                Verificación de presencia del escudo y colores:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Encabezado y barra de navegación</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Boletas Oficiales de Evaluación SEP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Credenciales escolares de estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reportes de incidencias y citatorios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Info Fields */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">
              Datos Institucionales en Boletas y Reportes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre Oficial del Colegio</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lema Institucional</label>
                <input
                  type="text"
                  value={lema}
                  onChange={(e) => setLema(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg italic"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Director del Plantel</label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección Oficial</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEWS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                Previsualización en Vivo
              </h3>
              {hasUnsavedColorChanges ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Vista previa (Sin guardar)</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Colores Guardados
                </span>
              )}
            </div>

            {/* 1. Header simulator with chosen shield & colors */}
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider text-[10px]">
                A. Barra Superior del Dashboard:
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div
                  className="p-3.5 flex items-center justify-between text-white transition-colors"
                  style={{ backgroundColor: primario }}
                >
                  <div className="flex items-center gap-2.5">
                    {escudoUrl && (
                      <img
                        src={escudoUrl}
                        alt=""
                        className="w-9 h-9 object-contain rounded bg-white p-0.5 border border-white/20 shadow-2xs"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate max-w-[170px]">{nombre}</div>
                      <div className="text-[10px] text-slate-200 font-mono">{activeCollege.codigoCCT}</div>
                    </div>
                  </div>

                  <div
                    className="px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                    style={{
                      backgroundColor: secundario,
                      color: primario,
                    }}
                  >
                    My College
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Official Report Card (Boleta) Header Simulator */}
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wider text-[10px]">
                B. Encabezado en Boleta Oficial de Calificaciones:
              </span>
              <div
                className="p-4 rounded-xl border-2 bg-slate-50/50 space-y-2.5 shadow-2xs"
                style={{ borderColor: `${secundario}80` }}
              >
                <div className="flex items-center gap-3">
                  {escudoUrl && (
                    <img
                      src={escudoUrl}
                      alt=""
                      className="w-14 h-14 object-contain rounded-md bg-white p-1 border border-slate-200 shadow-xs"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-display font-black text-xs uppercase leading-tight truncate"
                      style={{ color: primario }}
                    >
                      {nombre}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      C.C.T.: {activeCollege.codigoCCT} · Boleta Oficial
                    </div>
                    <div className="text-[10px] text-slate-400 italic truncate">
                      "{lema}"
                    </div>
                  </div>
                </div>

                {/* Sample Grade Row in Boleta */}
                <div className="bg-white rounded-lg p-2 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-700">Matemáticas Avanzadas</span>
                  <span
                    className="font-bold px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${primario}15`,
                      color: primario,
                      border: `1px solid ${secundario}`,
                    }}
                  >
                    10.0 (Sobresaliente)
                  </span>
                </div>

                {/* Seal in Boleta */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Sello Oficial Institucional</span>
                  <span className="font-mono font-semibold" style={{ color: primario }}>
                    Firma de Dirección
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Button to Open Real Report Card */}
            <button
              type="button"
              onClick={() => setShowBoletaModal(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Abrir Boleta Completa con este Escudo</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: primario }}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando con Base de Datos...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado y Sincronizado en MongoDB!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar y Aplicar a Todo el Colegio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal to view actual Report Card */}
      {showBoletaModal && sampleStudent && (
        <ReportCardModal
          student={sampleStudent}
          onClose={() => setShowBoletaModal(false)}
        />
      )}
    </div>
  );
};
