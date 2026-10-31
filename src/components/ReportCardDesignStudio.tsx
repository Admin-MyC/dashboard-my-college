import React, { useState, useEffect, useRef } from 'react';
import {
  College,
  Student,
  Subject,
  Teacher,
  GradeRecord,
  EvaluationPeriodicity,
  ReportCardCanvasElement,
  ReportCardDesignConfig,
} from '../types';
import {
  getDefaultReportCardDesign,
  getPresetElements,
  SEP_OFFICIAL_COLORS,
} from '../utils/reportCardDesignHelper';
import { compressImageFile } from '../utils/imageCompressor';
import { ReportCardCustomCanvas } from './ReportCardCustomCanvas';
import {
  Palette,
  Layers,
  Sliders,
  Sparkles,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  RotateCcw,
  Save,
  Grid,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  Frame,
  Move,
  Maximize2,
  UserCheck,
} from 'lucide-react';

interface ReportCardDesignStudioProps {
  college: College;
  students: Student[];
  grades: GradeRecord[];
  subjects: Subject[];
  teachers: Teacher[];
  periodicidad: EvaluationPeriodicity;
  onSaveDesign: (design: ReportCardDesignConfig) => void;
}

const DEMO_FALLBACK_STUDENT: Student = {
  id: 'demo-st-preview',
  colegioId: 'demo',
  matricula: '2026-0148',
  curp: 'HERA140512HDFRRL01',
  nombre: 'Valentina Sofía',
  apellidos: 'Hernández Ramírez',
  nivel: 'Primaria',
  grado: '6°',
  grupo: 'A',
  tutorNombre: 'Lic. Roberto Hernández',
  tutorTelefono: '55-1234-5678',
  tutorCorreo: 'tutor@ejemplo.edu.mx',
  promedio: 9.4,
  estatus: 'inscrito',
  foto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
  fechaNacimiento: '2014-05-12',
};

export const ReportCardDesignStudio: React.FC<ReportCardDesignStudioProps> = ({
  college,
  students,
  grades,
  subjects,
  teachers,
  periodicidad,
  onSaveDesign,
}) => {
  const [design, setDesign] = useState<ReportCardDesignConfig>(() =>
    getDefaultReportCardDesign(college)
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-escudo');
  const [activePanel, setActivePanel] = useState<'bloques' | 'fondo' | 'plantillas'>('bloques');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [previewStudentId, setPreviewStudentId] = useState<string>(
    students[0]?.id || DEMO_FALLBACK_STUDENT.id
  );
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDesign(getDefaultReportCardDesign(college));
  }, [college.id, college.disenoBoleta?.actualizadoEn]);

  const previewStudent =
    students.find((s) => s.id === previewStudentId) ||
    students[0] || {
      ...DEMO_FALLBACK_STUDENT,
      colegioId: college.id,
    };

  const selectedElement =
    design.elementos.find((el) => el.id === selectedElementId) || null;

  const handleUpdateElement = (
    id: string,
    updates: Partial<ReportCardCanvasElement>
  ) => {
    setDesign((prev) => ({
      ...prev,
      plantillaId: 'personalizada',
      elementos: prev.elementos.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  };

  const handleSelectSignatureMode = (mode: 'docente' | 'tutor' | 'ambos') => {
    setDesign((prev) => {
      const nextElementos = prev.elementos.map((el) => {
        if (el.type === 'firma_director') {
          return mode === 'ambos' ? { ...el, x: 5, w: 22 } : { ...el, x: 6, w: 27 };
        }
        if (el.type === 'sello_digital') {
          return mode === 'ambos' ? { ...el, x: 29, w: 18 } : { ...el, x: 38, w: 24 };
        }
        if (el.type === 'firma_docente') {
          if (mode === 'docente') return { ...el, visible: true, x: 67, w: 27 };
          if (mode === 'tutor') return { ...el, visible: false };
          return { ...el, visible: true, x: 49, w: 22 };
        }
        if (el.type === 'firma_tutor') {
          if (mode === 'tutor') return { ...el, visible: true, x: 67, w: 27 };
          if (mode === 'docente') return { ...el, visible: false };
          return { ...el, visible: true, x: 73, w: 22 };
        }
        return el;
      });
      return {
        ...prev,
        firmaSecundariaTipo: mode,
        elementos: nextElementos,
      };
    });
  };

  const handleToggleElementVisibility = (id: string) => {
    setDesign((prev) => ({
      ...prev,
      elementos: prev.elementos.map((el) =>
        el.id === id ? { ...el, visible: !el.visible } : el
      ),
    }));
  };

  const handleCenterHorizontally = (el: ReportCardCanvasElement) => {
    const centeredX = Number(Math.max(0, (100 - el.w) / 2).toFixed(1));
    handleUpdateElement(el.id, { x: centeredX });
  };

  const handleAddCustomTextBlock = () => {
    const newId = `el-texto-${Date.now()}`;
    const newBlock: ReportCardCanvasElement = {
      id: newId,
      type: 'texto_libre',
      label: 'Texto / Leyenda Personalizada',
      visible: true,
      x: 20,
      y: 76,
      w: 60,
      h: 4.5,
      textAlign: 'center',
      textColor: college.colores?.primario || '#0B2545',
      backgroundColor: '',
      showBorder: false,
      fontSizeScale: 1,
      customText: 'Escribe aquí tu leyenda, lema o indicación para la boleta...',
      zIndex: 15,
    };
    setDesign((prev) => ({
      ...prev,
      elementos: [...prev.elementos, newBlock],
    }));
    setSelectedElementId(newId);
  };

  const handleRemoveCustomTextBlock = (id: string) => {
    setDesign((prev) => ({
      ...prev,
      elementos: prev.elementos.filter((el) => el.id !== id),
    }));
    setSelectedElementId(null);
  };

  const handleApplyPreset = (preset: 'clasica' | 'moderna' | 'minimalista') => {
    const nextElements = getPresetElements(preset, college);
    const isSepPreset = preset === 'clasica';
    const nextPrimary = isSepPreset
      ? SEP_OFFICIAL_COLORS.guinda
      : college.colores?.primario || '#0B2545';
    const nextAccent = isSepPreset
      ? SEP_OFFICIAL_COLORS.dorado
      : college.colores?.secundario || '#C59B27';

    setDesign((prev) => ({
      ...prev,
      usarDisenoPersonalizado: true,
      plantillaId: preset,
      colorFondoHoja: '#FFFFFF',
      mostrarMarcoDecorativo: true,
      estiloMarco:
        preset === 'moderna'
          ? 'esquinas_doradas'
          : preset === 'minimalista'
          ? 'simple'
          : 'doble_institucional',
      colorMarco: nextPrimary,
      colorEncabezadoTabla: nextPrimary,
      colorAcento: nextAccent,
      colorTextoTabla: isSepPreset ? '#1E1E1E' : '#1E293B',
      elementos: nextElements,
    }));
    setSelectedElementId(nextElements[0]?.id || null);
  };

  const handleUploadBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 600, 600, 0.82);
      setDesign((prev) => ({
        ...prev,
        imagenFondoUrl: compressed,
      }));
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleSave = () => {
    const finalDesign: ReportCardDesignConfig = {
      ...design,
      usarDisenoPersonalizado: true,
      actualizadoEn: new Date().toISOString(),
    };
    onSaveDesign(finalDesign);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3200);
  };

  const primaryColor = college.colores?.primario || '#0B2545';
  const goldColor = college.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-4">
      {/* Top Studio Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <Palette className="w-5 h-5" style={{ color: goldColor }} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                Estudio de Diseño Visual de Boletas (Lienzo Interactivo)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Exclusivo Administrador
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastra con el mouse cada elemento sobre la hoja (escudo, escuela, alumno, materias, firmas) y estira su esquina inferior derecha para acomodarlo como una imagen.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Student preview selector */}
          {students.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-600">Vista con:</span>
              <select
                value={previewStudent.id}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[170px] truncate"
              >
                {students.slice(0, 40).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.apellidos}, {s.nombre} ({s.grado} {s.grupo})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showGrid
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Activar/Desactivar cuadrícula guía para alinear elementos"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Cuadrícula Guía</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('clasica')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
            title="Restablecer al acomodo institucional clásico"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer active:scale-98"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" style={{ color: goldColor }} />
            <span>Guardar Diseño de Boleta</span>
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ¡Diseño de boleta guardado correctamente! Todas las boletas impresas y descargadas en PDF de {college.nombre} usarán este diseño.
            </span>
          </div>
        </div>
      )}

      {/* Main Studio Grid: Left Tools + Center Canvas + Right Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Elements Layer List, Background & Templates (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActivePanel('bloques')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activePanel === 'bloques'
                  ? 'border-amber-500 bg-white text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Elementos</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('fondo')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activePanel === 'fondo'
                  ? 'border-amber-500 bg-white text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Fondo y Marco</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('plantillas')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activePanel === 'plantillas'
                  ? 'border-amber-500 bg-white text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Plantillas</span>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* PANEL 1: ELEMENTOS / BLOQUES */}
            {activePanel === 'bloques' && (
              <div className="space-y-3">
                {/* Quick Signature Selector */}
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-800">
                    Firma Elegible en la Boleta (junto a Dirección):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'docente', label: 'Firma Docente' },
                        { id: 'tutor', label: 'Firma Padre/Tutor' },
                        { id: 'ambos', label: 'Ambas Firmas' },
                      ] as const
                    ).map((opt) => {
                      const docVisible = design.elementos.find(
                        (e) => e.type === 'firma_docente'
                      )?.visible;
                      const tutVisible = design.elementos.find(
                        (e) => e.type === 'firma_tutor'
                      )?.visible;
                      const currentMode =
                        docVisible && tutVisible
                          ? 'ambos'
                          : tutVisible
                          ? 'tutor'
                          : 'docente';
                      const isActive = currentMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectSignatureMode(opt.id)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Bloques en la Boleta (Clic para seleccionar o mostrar/ocultar)
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCustomTextBlock}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 border border-amber-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Texto</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {design.elementos.map((el) => {
                    const isSelected = selectedElementId === el.id;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-400 font-bold text-slate-900 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Move
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{el.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.round(el.x)}%,{Math.round(el.y)}%
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleElementVisibility(el.id);
                            }}
                            className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                              el.visible
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300'
                            }`}
                            title={el.visible ? 'Visible en la boleta (clic para ocultar)' : 'Oculto (clic para mostrar)'}
                          >
                            {el.visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {el.id.startsWith('el-texto-') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomTextBlock(el.id);
                              }}
                              className="p-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title="Eliminar este bloque de texto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Element Inspector */}
                {selectedElement ? (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                        <Sliders className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ajustes de: {selectedElement.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCenterHorizontally(selectedElement)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Centrar este bloque horizontalmente en la hoja"
                      >
                        <AlignHorizontalJustifyCenter className="w-3 h-3" />
                        <span>Centrar en Hoja</span>
                      </button>
                    </div>

                    {/* Position X, Y & Size W, H Sliders */}
                    <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
                      <div>
                        <div className="flex justify-between font-semibold text-slate-600 mb-0.5">
                          <span>Posición X (Izq-Der)</span>
                          <span className="font-mono">{Math.round(selectedElement.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(5, 100 - selectedElement.w)}
                          step={0.5}
                          value={selectedElement.x}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              x: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-slate-600 mb-0.5">
                          <span>Posición Y (Arr-Aba)</span>
                          <span className="font-mono">{Math.round(selectedElement.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(5, 100 - selectedElement.h)}
                          step={0.5}
                          value={selectedElement.y}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              y: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-slate-600 mb-0.5">
                          <span>Ancho del Bloque</span>
                          <span className="font-mono">{Math.round(selectedElement.w)}%</span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={100}
                          step={0.5}
                          value={selectedElement.w}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              w: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold text-slate-600 mb-0.5">
                          <span>Alto del Bloque</span>
                          <span className="font-mono">{Math.round(selectedElement.h)}%</span>
                        </div>
                        <input
                          type="range"
                          min={3.5}
                          max={80}
                          step={0.5}
                          value={selectedElement.h}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              h: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Text Alignment, Font Scale & Colors */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Alineación del Contenido
                        </label>
                        <div className="flex rounded-lg border border-slate-300 overflow-hidden bg-white">
                          {(
                            [
                              { id: 'left', icon: AlignLeft, label: 'Izquierda' },
                              { id: 'center', icon: AlignCenter, label: 'Centro' },
                              { id: 'right', icon: AlignRight, label: 'Derecha' },
                            ] as const
                          ).map((item) => {
                            const IconComp = item.icon;
                            const active =
                              (selectedElement.textAlign || 'left') === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateElement(selectedElement.id, {
                                    textAlign: item.id,
                                  })
                                }
                                className={`flex-1 py-1.5 flex items-center justify-center cursor-pointer ${
                                  active
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title={item.label}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Tamaño de Letra ({Math.round((selectedElement.fontSizeScale || 1) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min={0.75}
                          max={1.35}
                          step={0.05}
                          value={selectedElement.fontSizeScale || 1}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              fontSizeScale: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-600 mt-1.5 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Colors & Border Toggle */}
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Color Texto
                        </label>
                        <input
                          type="color"
                          value={selectedElement.textColor || '#0F172A'}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              textColor: e.target.value,
                            })
                          }
                          className="w-full h-7 rounded cursor-pointer border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Fondo Bloque
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={selectedElement.backgroundColor || '#FFFFFF'}
                            onChange={(e) =>
                              handleUpdateElement(selectedElement.id, {
                                backgroundColor: e.target.value,
                              })
                            }
                            className="w-full h-7 rounded cursor-pointer border border-slate-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Mostrar Borde
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateElement(selectedElement.id, {
                              showBorder: !selectedElement.showBorder,
                            })
                          }
                          className={`w-full h-7 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            selectedElement.showBorder
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-slate-100 border-slate-300 text-slate-600'
                          }`}
                        >
                          {selectedElement.showBorder ? 'Con Borde' : 'Sin Borde'}
                        </button>
                      </div>
                    </div>

                    {/* Custom Text Input if type === 'texto_libre' */}
                    {selectedElement.type === 'texto_libre' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                          Texto de la Leyenda / Nota
                        </label>
                        <input
                          type="text"
                          value={selectedElement.customText || ''}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              customText: e.target.value,
                            })
                          }
                          placeholder="Escribe el texto que aparecerá en la boleta..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    Haz clic en cualquier elemento sobre la boleta para moverlo, estirarlo o personalizar sus colores.
                  </div>
                )}
              </div>
            )}

            {/* PANEL 2: FONDO, MARCA DE AGUA Y MARCO */}
            {activePanel === 'fondo' && (
              <div className="space-y-4 text-xs">
                {/* Page Background Color */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Color del Papel / Fondo de la Hoja
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.colorFondoHoja || '#FFFFFF'}
                      onChange={(e) =>
                        setDesign((prev) => ({
                          ...prev,
                          colorFondoHoja: e.target.value,
                        }))
                      }
                      className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer shrink-0"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Blanco Puro', hex: '#FFFFFF' },
                        { label: 'Pergamino Suave', hex: '#FFFDF7' },
                        { label: 'Marfil Académico', hex: '#FAF8F5' },
                        { label: 'Azul Hielo', hex: '#F8FAFC' },
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() =>
                            setDesign((prev) => ({ ...prev, colorFondoHoja: c.hex }))
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold hover:bg-slate-100 cursor-pointer"
                          style={{ backgroundColor: c.hex }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Background Image / Membrete */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Imagen de Fondo / Hoja Membretada
                    </span>
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBackgroundImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Fondo</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Puedes subir una imagen o plantilla membretada y colocar encima el escudo, los datos del alumno y las materias.
                  </p>

                  {design.imagenFondoUrl && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Opacidad de la Imagen ({Math.round((design.opacidadImagenFondo ?? 0.2) * 100)}%)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDesign((prev) => ({ ...prev, imagenFondoUrl: '' }))
                          }
                          className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar imagen
                        </button>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={design.opacidadImagenFondo ?? 0.2}
                        onChange={(e) =>
                          setDesign((prev) => ({
                            ...prev,
                            opacidadImagenFondo: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Shield Watermark */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Marca de Agua con el Escudo al Centro
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDesign((prev) => ({
                          ...prev,
                          marcaAguaEscudo: !prev.marcaAguaEscudo,
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        design.marcaAguaEscudo
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-200 border-slate-300 text-slate-600'
                      }`}
                    >
                      {design.marcaAguaEscudo ? 'Activada' : 'Desactivada'}
                    </button>
                  </div>
                  {design.marcaAguaEscudo && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Intensidad de Marca de Agua</span>
                        <span className="font-mono">
                          {Math.round((design.opacidadMarcaAgua ?? 0.06) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.03}
                        max={0.28}
                        step={0.01}
                        value={design.opacidadMarcaAgua ?? 0.06}
                        onChange={(e) =>
                          setDesign((prev) => ({
                            ...prev,
                            opacidadMarcaAgua: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Decorative Frame & Table Colors */}
                <div className="space-y-2.5">
                  <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                    <Frame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Marco Decorativo de la Hoja</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'ninguno', label: 'Sin Marco' },
                        { id: 'simple', label: 'Línea Sencilla' },
                        { id: 'doble_institucional', label: 'Doble Institucional' },
                        { id: 'esquinas_doradas', label: 'Esquinas de Gala' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            mostrarMarcoDecorativo: st.id !== 'ninguno',
                            estiloMarco: st.id,
                          }))
                        }
                        className={`p-2 rounded-xl border text-[11px] font-bold text-left cursor-pointer ${
                          design.estiloMarco === st.id
                            ? 'bg-amber-50 border-amber-400 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Global Institutional Table Colors */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Color Primario / Tabla
                    </label>
                    <input
                      type="color"
                      value={design.colorEncabezadoTabla || primaryColor}
                      onChange={(e) =>
                        setDesign((prev) => ({
                          ...prev,
                          colorEncabezadoTabla: e.target.value,
                        }))
                      }
                      className="w-full h-8 rounded cursor-pointer border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Color Acento / Promedio
                    </label>
                    <input
                      type="color"
                      value={design.colorAcento || goldColor}
                      onChange={(e) =>
                        setDesign((prev) => ({
                          ...prev,
                          colorAcento: e.target.value,
                        }))
                      }
                      className="w-full h-8 rounded cursor-pointer border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Color del Marco
                    </label>
                    <input
                      type="color"
                      value={design.colorMarco || primaryColor}
                      onChange={(e) =>
                        setDesign((prev) => ({
                          ...prev,
                          colorMarco: e.target.value,
                        }))
                      }
                      className="w-full h-8 rounded cursor-pointer border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 3: PLANTILLAS RÁPIDAS */}
            {activePanel === 'plantillas' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Elige una distribución base para comenzar y después mueve libremente cualquier bloque en el lienzo:
                </p>

                {(
                  [
                    {
                      id: 'clasica',
                      title: '1. Oficial SEP (Sistema Educativo Nacional)',
                      desc: 'Formato oficial de Boleta de Evaluación de la SEP con paleta institucional Guinda (#691C32), Dorado (#BC955C) y Gris (#54565A), cintas de sección DATOS DEL ALUMNO(A), DATOS DE LA ESCUELA, tabla de Periodos de Evaluación y recuadro de Promedio Final de Grado.',
                      swatches: ['#691C32', '#BC955C', '#54565A'],
                    },
                    {
                      id: 'moderna',
                      title: '2. Gala Centrada con Fotografía e Insignia',
                      desc: 'Escudo centrado arriba, fotografía del alumno, tarjeta destacada de promedio general a la derecha de los datos del alumno y marco con esquinas doradas con los colores de tu colegio.',
                      swatches: [primaryColor, goldColor, '#0F172A'],
                    },
                    {
                      id: 'minimalista',
                      title: '3. Ejecutiva Minimalista (Escudo a la Derecha)',
                      desc: 'Datos de la escuela a la izquierda, escudo en la esquina superior derecha, tabla amplia y limpia sin recuadros pesados con los colores de tu colegio.',
                      swatches: [primaryColor, '#64748B', '#F1F5F9'],
                    },
                  ] as const
                ).map((tpl) => {
                  const isActive = design.plantillaId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleApplyPreset(tpl.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 border-amber-400 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-bold text-slate-900">{tpl.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center -space-x-1">
                            {tpl.swatches.map((hex, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                              Activa
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / CENTER COLUMN: Interactive Sheet Canvas (8 cols) */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <div className="w-full bg-slate-800 text-white px-4 py-2.5 rounded-t-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">
                Lienzo Hoja Tamaño Carta (Arrastra los bloques con el mouse para acomodarlos)
              </span>
            </div>
            <span className="text-[11px] text-slate-300">
              {selectedElement
                ? `Seleccionado: ${selectedElement.label}`
                : 'Haz clic en un elemento para editarlo'}
            </span>
          </div>

          <div className="w-full bg-slate-200/80 p-4 sm:p-6 rounded-b-2xl border border-t-0 border-slate-300 flex justify-center">
            <div className="w-full max-w-[720px]">
              <ReportCardCustomCanvas
                college={college}
                student={previewStudent}
                design={design}
                periodicidad={periodicidad}
                grades={grades}
                subjects={subjects}
                teachers={teachers}
                editable={true}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                showGrid={showGrid}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
