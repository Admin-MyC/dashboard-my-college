import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Lock,
  BookOpen,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite ?url worker import
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { jsPDF } from 'jspdf';
import { LibraryBook } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ProtectedPdfViewerModalProps {
  book: LibraryBook;
  onClose: () => void;
  primaryColor?: string;
  goldColor?: string;
  studentName?: string;
}

const generateDigitalBookReadingPdfBytes = (book: LibraryBook): Uint8Array => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page 1: Cover & Digital Overview
  doc.setFillColor(11, 37, 69);
  doc.rect(0, 0, 210, 48, 'F');
  doc.setFillColor(197, 155, 39);
  doc.rect(0, 48, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BIBLIOTECA ESCOLAR DIGITAL · EDICIÓN DE SOLO LECTURA', 18, 18);

  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(book.titulo || 'Libro Escolar Digital', 174);
  doc.text(titleLines, 18, 30);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Autor: ${book.autor || 'Acervo Institucional'}`, 18, 66);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Categoría: ${book.categoria || 'General'}   |   ISBN / Clave: ${book.isbn || 'EDICIÓN-DIGITAL'}   |   Editorial: ${book.editorial || 'Edición Escolar'}`,
    18,
    74
  );

  if (book.subidoPorDocenteNombre) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Material asignado por el docente: ${book.subidoPorDocenteNombre}`, 18, 82);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(18, 88, 192, 88);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 37, 69);
  doc.text('Contenido de Lectura en Plataforma', 18, 100);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);

  const bodyText = [
    `Bienvenido a la edición digital de lectura en línea de "${book.titulo}", escrita por ${book.autor}. Este ejemplar forma parte del acervo bibliográfico escolar habilitado para consulta directa de los alumnos desde su portal académico.`,
    '',
    'CAPÍTULO I. INTRODUCCIÓN Y PROPÓSITO DE ESTUDIO',
    `El estudio de la asignatura y categoría de ${book.categoria || 'Literatura y Ciencias'} permite desarrollar el pensamiento crítico, la comprensión lectora y el análisis reflexivo en los estudiantes. A través de estas páginas, el alumno encontrará los conceptos esenciales, actividades de reflexión y lecturas guiadas seleccionadas para su grado escolar.`,
    '',
    'IDEAS CLAVE PARA EL ESTUDIANTE:',
    '1. Realiza una lectura comprensiva identificando las ideas principales y secundarias de cada apartado.',
    '2. Relaciona los conceptos expuestos en este libro con las actividades revisadas en clase con tu profesor.',
    '3. Registra en tu cuaderno de trabajo las palabras clave, esquemas o dudas para compartirlas en la sesión grupal.',
    '',
    'NOTA DE PROTECCIÓN EDITORIAL:',
    'Este ejemplar digital es de consulta exclusiva dentro del visor de la plataforma escolar (Modo Solo Lectura, sin descarga externa).',
  ].join('\n');

  const splitBody = doc.splitTextToSize(bodyText, 174);
  doc.text(splitBody, 18, 110);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Página 1 · Visor Digital Escolar Protegido (Solo Lectura)', 18, 284);

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
};

const base64OrDataUrlToUint8Array = async (
  input: string,
  fallbackBook: LibraryBook
): Promise<Uint8Array> => {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return generateDigitalBookReadingPdfBytes(fallbackBook);
  }
  if (trimmed.startsWith('data:')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx !== -1) {
      const base64Part = trimmed.slice(commaIdx + 1).replace(/\s/g, '');
      const binaryString = window.atob(base64Part);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  }
  const response = await fetch(trimmed);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
};

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNumber: number;
  zoom: number;
  totalPages: number;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDoc,
  pageNumber,
  zoom,
  totalPages,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const baseScale = (zoom / 100) * 1.35;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: baseScale * dpr });
        const displayViewport = page.getViewport({ scale: baseScale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${Math.round(displayViewport.width)}px`;
        canvas.style.height = `${Math.round(displayViewport.height)}px`;

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });
        await renderTask.promise;
      } catch {
        // Ignore cancellation
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask && typeof renderTask.cancel === 'function') {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, zoom]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative bg-white rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden mx-auto my-2 select-none"
    >
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <span>
          Página <strong>{pageNumber}</strong> de <strong>{totalPages}</strong>
        </span>
        <span className="text-[10px] text-slate-400">Solo lectura · Descarga deshabilitada</span>
      </div>
      <div className="relative flex justify-center items-center bg-white p-1 sm:p-2 overflow-x-auto">
        {rendering && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          onContextMenu={(e) => e.preventDefault()}
          className="block max-w-full h-auto pointer-events-none select-none"
        />
      </div>
    </div>
  );
};

export const ProtectedPdfViewerModal: React.FC<ProtectedPdfViewerModalProps> = ({
  book,
  onClose,
  primaryColor = '#0B2545',
  goldColor = '#C59B27',
  studentName,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'continuo' | 'pagina'>('continuo');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let loadedDocument: any = null;

    const loadPdfDocument = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const pdfBytes = await base64OrDataUrlToUint8Array(
          book.archivoPdfUrl || '',
          book
        );
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const doc = await loadingTask.promise;
        if (isCancelled) {
          (doc as any).destroy?.();
          return;
        }
        loadedDocument = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages || 1);
        setCurrentPage(1);
      } catch (err) {
        if (!isCancelled) {
          setLoadError(
            'No se pudo procesar el archivo PDF. Verifica que el archivo subido sea un documento .PDF válido.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdfDocument();

    return () => {
      isCancelled = true;
      if (loadedDocument && typeof loadedDocument.destroy === 'function') {
        loadedDocument.destroy();
      }
    };
  }, [book]);

  // Block keyboard shortcuts for saving or printing (Ctrl+S, Ctrl+P) while modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in select-none"
    >
      <div
        onContextMenu={(e) => e.preventDefault()}
        className={`bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 transition-all ${
          isFullscreen ? 'w-screen h-screen rounded-none' : 'max-w-5xl w-full h-[90vh]'
        }`}
      >
        {/* Top Protected Header */}
        <div
          className="px-4 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
            borderBottom: `3px solid ${goldColor}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <Lock className="w-3 h-3" />
                  <span>Visor Digital · Solo Lectura (Descarga Deshabilitada)</span>
                </span>
                {book.gruposAsignados && book.gruposAsignados.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    Grupo: {book.gruposAsignados.join(', ')}
                  </span>
                )}
                {numPages > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {numPages} {numPages === 1 ? 'página' : 'páginas'}
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white truncate mt-0.5">
                {book.titulo}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Autor: {book.autor}
                {book.subidoPorDocenteNombre
                  ? ` · Compartido por Prof. ${book.subidoPorDocenteNombre}`
                  : ''}
              </p>
            </div>
          </div>

          {/* Viewer Controls (Page Navigation, View Mode, Zoom & Fullscreen — NO download button) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {numPages > 1 && (
              <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((m) => (m === 'continuo' ? 'pagina' : 'continuo'))
                  }
                  className="px-2.5 py-1 rounded-lg hover:bg-white/15 text-white font-bold text-[11px] cursor-pointer"
                >
                  {viewMode === 'continuo' ? 'Vista Continua' : `Pág. ${currentPage}/${numPages}`}
                </button>
                {viewMode === 'pagina' && (
                  <>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= numPages}
                      onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                      className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 15))}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
                title="Alejar vista"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-amber-300">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(180, z + 15))}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
                title="Acercar vista"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white cursor-pointer"
                title="Restablecer zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Cerrar Lector</span>
            </button>
          </div>
        </div>

        {/* Security Banner Notice */}
        <div className="bg-slate-800/95 border-b border-slate-700 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Documento protegido para consulta exclusiva en plataforma escolar. La descarga e impresión están restringidas.
            </span>
          </div>
          {studentName && (
            <span className="font-mono text-[10px] text-slate-400">
              Lector autorizado: {studentName}
            </span>
          )}
        </div>

        {/* Main PDF Canvas Viewport */}
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="flex-1 bg-slate-950 overflow-y-auto overflow-x-auto p-3 sm:p-6 flex flex-col items-center"
        >
          {isLoading ? (
            <div className="my-auto flex flex-col items-center justify-center gap-3 p-8 text-slate-300">
              <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
              <span className="text-xs font-bold">
                Abriendo libro digital en el lector protegido...
              </span>
            </div>
          ) : loadError ? (
            <div className="my-auto max-w-md text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-slate-300">
              <FileText className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="font-bold text-sm text-white">No se pudo mostrar el PDF</h4>
              <p className="text-xs text-slate-400">{loadError}</p>
            </div>
          ) : pdfDoc && numPages > 0 ? (
            viewMode === 'continuo' ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <PdfPageCanvas
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    zoom={zoom}
                    totalPages={numPages}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <PdfPageCanvas
                  pdfDoc={pdfDoc}
                  pageNumber={currentPage}
                  zoom={zoom}
                  totalPages={numPages}
                />
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
