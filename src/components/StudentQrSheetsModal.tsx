import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  QrCode,
  Check,
  Filter,
  Layers,
  Info,
  FileDown,
} from 'lucide-react';
import { Student, College } from '../types';
import {
  generateQrSheetsPdf,
  printHtmlInHiddenIframe,
} from '../utils/qrSheetsPdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  college: College;
}

export const StudentQrSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  college,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('todos');
  const [selectedGrade, setSelectedGrade] = useState<string>('todos');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [includePhotoAndDetails, setIncludePhotoAndDetails] = useState<boolean>(false);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const getAllowedLevelsForCollege = (
    collegeNivel?: string
  ): ('Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria')[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };

  const allowedLevels = getAllowedLevelsForCollege(college.nivel);

  // Filter students by level and grade
  const filteredStudents = students.filter((s) => {
    const stLevel = s.nivel || allowedLevels[0] || 'Primaria';
    const matchesLevel = selectedLevel === 'todos' || stLevel === selectedLevel;
    const matchesGrade = selectedGrade === 'todos' || s.grado === selectedGrade;
    return matchesLevel && matchesGrade;
  });

  // Select all filtered students by default when level/grade or modal open changes
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  }, [selectedLevel, selectedGrade, isOpen, students.length]);

  // Generate QR codes for selected students pointing to requested domain: www.dashboard.mycollege.com.mx
  useEffect(() => {
    if (!isOpen || selectedStudentIds.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateQrs = async () => {
      const newMap: Record<string, string> = { ...qrCodeDataUrls };
      const officialDomain = 'https://dashboard.mycollege.com.mx';

      for (const id of selectedStudentIds) {
        if (!newMap[id]) {
          const student = students.find((s) => s.id === id);
          if (student) {
            const payload = `${officialDomain}/asistencia?alumno=${encodeURIComponent(
              student.matricula
            )}&sid=${encodeURIComponent(student.id)}&colegio=${encodeURIComponent(
              college.id
            )}&curp=${encodeURIComponent(student.curp)}&grado=${encodeURIComponent(
              student.grado
            )}&grupo=${encodeURIComponent(student.grupo)}&docente=${encodeURIComponent(
              student.docenteId || ''
            )}`;
            try {
              const url = await QRCode.toDataURL(payload, {
                width: 320,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                  dark: '#0B2545',
                  light: '#FFFFFF',
                },
              });
              newMap[id] = url;
            } catch (err) {
              console.error('Error generating student QR:', student.id, err);
            }
          }
        }
      }

      if (isMounted) {
        setQrCodeDataUrls(newMap);
        setIsGenerating(false);
      }
    };

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [selectedStudentIds, isOpen, college.id]);

  if (!isOpen) return null;

  const targetStudents = students.filter((s) => selectedStudentIds.includes(s.id));

  // Toggle student selection
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  // Chunk students into pages (12 per page for 5x5cm, or 8 per page when including photo and details on the left)
  const CARDS_PER_PAGE = includePhotoAndDetails ? 8 : 12;
  const pages: Student[][] = [];
  for (let i = 0; i < targetStudents.length; i += CARDS_PER_PAGE) {
    pages.push(targetStudents.slice(i, i + CARDS_PER_PAGE));
  }

  // Launch dedicated iframe print dialog AND/OR fallback so it prints cleanly in any browser/iframe
  const handlePrint = async () => {
    if (targetStudents.length === 0) return;

    const pagesHtml = pages
      .map((pageStudents, pageIdx) => {
        const cardsHtml = pageStudents
          .map((st) => {
            const qrUrl = qrCodeDataUrls[st.id] || '';
            const usr = st.usuarioLogin || st.matricula.toLowerCase();
            const lvl = st.nivel ? `${st.nivel} · ` : '';
            const photoSrc = st.foto || college.escudoUrl || '';

            if (includePhotoAndDetails) {
              return `
                <div class="qr-card-wide">
                  <div class="top-banner">${college.nombre}</div>
                  <div class="wide-body">
                    <div class="left-info">
                      <div class="photo-row">
                        <img src="${photoSrc}" alt="${st.nombre}" class="student-photo" onerror="this.style.display='none'" />
                        <div class="name-block">
                          <div class="st-full-name">${st.nombre} ${st.apellidos}</div>
                          <div class="st-level-badge">${st.nivel || 'Primaria'} · ${st.grado} "${st.grupo}"</div>
                        </div>
                      </div>
                      <div class="details-list">
                        <div><strong>Matrícula:</strong> ${st.matricula}</div>
                        <div><strong>CURP:</strong> ${st.curp || 'N/A'}</div>
                        <div><strong>Usuario:</strong> <span class="usr-highlight">${usr}</span></div>
                        ${st.tutorNombre ? `<div><strong>Tutor:</strong> ${st.tutorNombre}</div>` : ''}
                      </div>
                      <div class="domain-line-left">www.dashboard.mycollege.com.mx</div>
                    </div>
                    <div class="right-qr">
                      ${qrUrl ? `<img src="${qrUrl}" alt="QR" class="qr-img-wide" />` : ''}
                      <div class="qr-caption">${st.matricula}</div>
                      <div class="qr-subcaption">ESCANEAR ASISTENCIA</div>
                    </div>
                  </div>
                </div>
              `;
            }

            return `
              <div class="qr-card">
                <div class="top-block">
                  <div class="college-name">${college.nombre}</div>
                  <div class="student-name">${st.nombre} ${st.apellidos}</div>
                </div>
                <div class="qr-wrap">
                  ${qrUrl ? `<img src="${qrUrl}" alt="QR" class="qr-img" />` : ''}
                </div>
                <div class="bottom-block">
                  <div class="grade-line">${lvl}${st.grado} "${st.grupo}" · ${st.matricula}</div>
                  <div class="user-line">User: <strong>${usr}</strong></div>
                  <div class="domain-line">www.dashboard.mycollege.com.mx</div>
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="print-page">
            <div class="sheet-header">
              <div>
                <strong>${college.nombre}</strong> — Hoja de Códigos QR para Asistencia ${
                  includePhotoAndDetails ? '(Con Fotografía y Datos del Alumno)' : '(5cm x 5cm)'
                }
              </div>
              <div>Página ${pageIdx + 1} de ${pages.length}</div>
            </div>
            <div class="${includePhotoAndDetails ? 'cards-grid-wide' : 'cards-grid'}">
              ${cardsHtml}
            </div>
          </div>
        `;
      })
      .join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hojas QR Asistencia - ${college.nombre}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff;
              color: #0f172a;
            }
            .print-page {
              page-break-after: always;
              break-after: page;
              width: 100%;
              padding: 4mm;
            }
            .print-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .sheet-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 2.5mm;
              margin-bottom: 5mm;
              font-size: 9pt;
              color: #0b2545;
            }
            .cards-grid {
              display: grid;
              grid-template-columns: repeat(3, 50mm);
              gap: 6mm 8mm;
              justify-content: center;
            }
            .cards-grid-wide {
              display: grid;
              grid-template-columns: repeat(2, 92mm);
              gap: 6mm 6mm;
              justify-content: center;
            }
            .qr-card {
              width: 50mm;
              height: 50mm;
              border: 1.2px dashed #64748b;
              border-radius: 2.5mm;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .qr-card-wide {
              width: 92mm;
              height: 50mm;
              border: 1.2px dashed #64748b;
              border-radius: 2.5mm;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .top-banner {
              width: 100%;
              background: #0b2545;
              color: #ffffff;
              font-size: 6pt;
              font-weight: 800;
              text-transform: uppercase;
              text-align: center;
              padding: 0.8mm 2mm;
              border-radius: 1mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .wide-body {
              display: flex;
              flex: 1;
              align-items: stretch;
              padding-top: 1.5mm;
              gap: 2mm;
              overflow: hidden;
            }
            .left-info {
              flex: 1;
              min-width: 0;
              border-right: 1px solid #e2e8f0;
              padding-right: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: left;
            }
            .photo-row {
              display: flex;
              align-items: center;
              gap: 2mm;
            }
            .student-photo {
              width: 13mm;
              height: 13mm;
              border-radius: 2mm;
              object-fit: cover;
              border: 1px solid #cbd5e1;
              background: #f8fafc;
              flex-shrink: 0;
            }
            .name-block {
              min-width: 0;
              flex: 1;
            }
            .st-full-name {
              font-size: 6.8pt;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.15;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .st-level-badge {
              font-size: 5.8pt;
              font-weight: 700;
              color: #0b2545;
              margin-top: 0.5mm;
            }
            .details-list {
              font-size: 5.5pt;
              font-family: monospace;
              color: #334155;
              line-height: 1.28;
              margin-top: 1mm;
            }
            .details-list div {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .usr-highlight {
              color: #0b2545;
              font-weight: 800;
            }
            .domain-line-left {
              font-size: 4.8pt;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
            }
            .right-qr {
              width: 38mm;
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .qr-img-wide {
              width: 31mm;
              height: 31mm;
              object-fit: contain;
            }
            .qr-caption {
              font-size: 6pt;
              font-family: monospace;
              font-weight: 800;
              color: #0f172a;
              margin-top: 0.5mm;
            }
            .qr-subcaption {
              font-size: 4.8pt;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.02em;
            }
            .top-block {
              width: 100%;
              overflow: hidden;
            }
            .college-name {
              font-size: 6pt;
              font-weight: 800;
              text-transform: uppercase;
              color: #0b2545;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .student-name {
              font-size: 7pt;
              font-weight: 700;
              color: #0f172a;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-top: 0.5mm;
            }
            .qr-wrap {
              display: flex;
              align-items: center;
              justify-content: center;
              margin: auto 0;
            }
            .qr-img {
              width: 28mm;
              height: 28mm;
              object-fit: contain;
            }
            .bottom-block {
              width: 100%;
              line-height: 1.15;
            }
            .grade-line {
              font-size: 6pt;
              font-family: monospace;
              color: #334155;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .user-line {
              font-size: 6pt;
              font-family: monospace;
              color: #0b2545;
            }
            .domain-line {
              font-size: 5pt;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `;

    // Also download the print-ready PDF automatically if the browser blocks iframe print dialogs,
    // and trigger the hidden iframe print dialog immediately.
    printHtmlInHiddenIframe(fullHtml);
  };

  const handleDownloadPdf = async () => {
    if (targetStudents.length === 0) return;
    setIsDownloadingPdf(true);
    try {
      await generateQrSheetsPdf({
        college,
        students: targetStudents,
        qrCodeDataUrls,
        includePhotoAndDetails,
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Modal Header (Hidden on Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-[#0B2545] via-[#133E6E] to-[#0B2545] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  Control de Alumnos · Emisión Oficial
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Formato 5cm x 5cm
                </span>
              </div>
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Hojas de Códigos QR para Asistencia
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || isDownloadingPdf || targetStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Descargar archivo PDF listo para imprimir en tamaño Carta (5cm x 5cm)"
            >
              <FileDown className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isDownloadingPdf
                  ? 'Generando PDF...'
                  : `Descargar PDF (${targetStudents.length} QRs)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || targetStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFB743] to-[#B68C1C] hover:from-[#E8C252] hover:to-[#A37B14] text-[#0B2545] font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimir Directo ({targetStudents.length} QRs)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {allowedLevels.length > 1 && (
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Nivel:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="todos">Todos los Niveles</option>
                  {allowedLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Grado:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todos los Grados ({students.length})</option>
                <option value="1°">1° Grado</option>
                <option value="2°">2° Grado</option>
                <option value="3°">3° Grado</option>
                <option value="4°">4° Grado</option>
                <option value="5°">5° Grado</option>
                <option value="6°">6° Grado</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                Marcar Todos ({filteredStudents.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
              >
                Desmarcar
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            {/* Checkbox to include student photo and details on the left of the QR code */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-950 font-bold cursor-pointer select-none transition-colors shadow-2xs">
              <input
                type="checkbox"
                checked={includePhotoAndDetails}
                onChange={(e) => setIncludePhotoAndDetails(e.target.checked)}
                className="w-4 h-4 rounded border-amber-400 text-[#0B2545] focus:ring-amber-500 cursor-pointer"
              />
              <span>Incluir fotografía y datos del alumno (a la izquierda del QR)</span>
            </label>
          </div>

          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{pages.length} hoja(s) de impresión</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px]">
              {includePhotoAndDetails
                ? '🪪 Formato Credencial: Foto y Datos (Izq.) + QR (Der.)'
                : '📏 Calibrado: 5.0 cm x 5.0 cm por tarjeta'}
            </span>
          </div>
        </div>

        {/* Informational Callout (Hidden on Print) */}
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900 no-print">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {includePhotoAndDetails ? (
                <>
                  Modo <strong>Fotografía y Datos + QR</strong> activo: La fotografía y los datos del estudiante (nombre, nivel, grado, grupo, matrícula, CURP y usuario) se colocan del <strong>lado izquierdo</strong> del código QR correspondiente.
                </>
              ) : (
                <>
                  Puedes hacer clic en <strong>"Imprimir Directo"</strong> o en <strong>"Descargar PDF"</strong> para obtener el documento oficial tamaño Carta con tarjetas de <strong>5cm x 5cm</strong> listas para recortar.
                </>
              )}
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-700 shrink-0">
            {targetStudents.length} alumnos seleccionados
          </span>
        </div>

        {/* Scrollable Printable Sheets Area */}
        <div
          ref={printContainerRef}
          id="printable-qr-sheets-area"
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 space-y-8"
        >
          {pages.length > 0 ? (
            pages.map((pageStudents, pageIdx) => (
              <div
                key={pageIdx}
                className="qr-print-page bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-300 max-w-[216mm] mx-auto transition-all"
                style={{
                  minHeight: '260mm',
                }}
              >
                {/* Sheet Header */}
                <div className="col-span-full border-b border-slate-200 pb-3 mb-4 flex items-center justify-between no-print">
                  <div className="flex items-center gap-3">
                    {college.escudoUrl && (
                      <img
                        src={college.escudoUrl}
                        alt={college.nombre}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-900">
                        {college.nombre} · Hoja de Códigos QR para Alumnos ({pageIdx + 1} de {pages.length})
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        www.dashboard.mycollege.com.mx ·{' '}
                        {includePhotoAndDetails
                          ? 'Formato con Fotografía y Datos a la Izquierda del QR'
                          : 'Formato Estándar 5cm x 5cm'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Página {pageIdx + 1}
                  </span>
                </div>

                {/* Cards Grid: 3 columns for 5x5cm or 2 columns when photo & details are included on the left */}
                <div
                  className={
                    includePhotoAndDetails
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center w-full'
                      : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center w-full'
                  }
                >
                  {pageStudents.map((st) => {
                    const qrUrl = qrCodeDataUrls[st.id];
                    const isSelected = selectedStudentIds.includes(st.id);
                    const usr = st.usuarioLogin || st.matricula.toLowerCase();

                    if (includePhotoAndDetails) {
                      return (
                        <div
                          key={st.id}
                          className={`relative bg-white border border-dashed border-slate-400 rounded-lg p-2 flex flex-col justify-between transition-all ${
                            !isSelected ? 'opacity-40 no-print' : ''
                          }`}
                          style={{
                            width: '92mm',
                            height: '50mm',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Selector checkbox (Only visible on screen) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(st.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow border border-slate-300 flex items-center justify-center cursor-pointer no-print"
                            title="Alternar selección"
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                          </button>

                          {/* Top College Banner */}
                          <div className="w-full bg-[#0B2545] text-white text-[8px] font-extrabold uppercase tracking-wider text-center py-0.5 px-2 rounded truncate">
                            {college.nombre}
                          </div>

                          {/* Split Body: Left = Photo & Student Data | Right = QR Code */}
                          <div className="flex-1 flex items-stretch gap-2 pt-1.5 min-h-0 overflow-hidden">
                            {/* Left Side: Student Photo & Details */}
                            <div className="flex-1 min-w-0 border-r border-slate-200 pr-2 flex flex-col justify-between text-left">
                              <div className="flex items-center gap-2">
                                <img
                                  src={st.foto || college.escudoUrl}
                                  onError={(e) => {
                                    e.currentTarget.src = college.escudoUrl;
                                  }}
                                  alt={st.nombre}
                                  className="w-[13mm] h-[13mm] rounded-md object-cover border border-slate-300 bg-slate-50 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-[9.5px] font-extrabold text-slate-900 leading-tight line-clamp-2">
                                    {st.nombre} {st.apellidos}
                                  </div>
                                  <div className="text-[8px] font-bold text-[#0B2545] mt-0.5 truncate">
                                    {st.nivel || 'Primaria'} · {st.grado} "{st.grupo}"
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-0.5 text-[7.5px] font-mono text-slate-700 leading-tight mt-1">
                                <div className="truncate">
                                  <span className="font-bold text-slate-900">Matrícula:</span> {st.matricula}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900">CURP:</span> {st.curp || 'N/A'}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900">Usuario:</span>{' '}
                                  <strong className="text-[#0B2545]">{usr}</strong>
                                </div>
                                {st.tutorNombre && (
                                  <div className="truncate text-[7px] font-sans text-slate-600">
                                    <span className="font-bold text-slate-800">Tutor:</span> {st.tutorNombre}
                                  </div>
                                )}
                              </div>

                              <div className="text-[6px] text-slate-400 uppercase font-semibold tracking-tight truncate">
                                www.dashboard.mycollege.com.mx
                              </div>
                            </div>

                            {/* Right Side: Corresponding QR Code */}
                            <div className="w-[38mm] shrink-0 flex flex-col items-center justify-center text-center">
                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt={`QR ${st.nombre}`}
                                  className="w-[30mm] h-[30mm] object-contain"
                                />
                              ) : (
                                <div className="w-[30mm] h-[30mm] bg-slate-100 flex items-center justify-center rounded">
                                  <span className="text-[8px] text-slate-400 font-mono">Generando...</span>
                                </div>
                              )}
                              <span className="text-[7.5px] font-mono font-bold text-slate-800 leading-none mt-0.5">
                                {st.matricula}
                              </span>
                              <span className="text-[6px] font-bold text-slate-400 uppercase tracking-tighter">
                                Escanear Asistencia
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={st.id}
                        className={`qr-print-card-5x5 relative bg-white border border-dashed border-slate-400 rounded-lg p-2 flex flex-col items-center justify-between text-center transition-all ${
                          !isSelected ? 'opacity-40 no-print' : ''
                        }`}
                        style={{
                          width: '50mm',
                          height: '50mm',
                          maxWidth: '50mm',
                          maxHeight: '50mm',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Selector checkbox (Only visible on screen) */}
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(st.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow border border-slate-300 flex items-center justify-center cursor-pointer no-print"
                          title="Alternar selección"
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                          )}
                        </button>

                        {/* Top: School Badge & Student Name */}
                        <div className="w-full text-center leading-tight overflow-hidden px-1">
                          <span className="block text-[8px] font-extrabold uppercase tracking-tight text-[#0B2545] truncate">
                            {college.nombre}
                          </span>
                          <span className="block text-[9px] font-bold text-slate-900 truncate">
                            {st.nombre} {st.apellidos}
                          </span>
                        </div>

                        {/* Middle: Crisp 5cm Calibrated QR Code */}
                        <div className="my-auto flex items-center justify-center">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`QR ${st.nombre}`}
                              className="w-[28mm] h-[28mm] object-contain"
                            />
                          ) : (
                            <div className="w-[28mm] h-[28mm] bg-slate-100 flex items-center justify-center rounded">
                              <span className="text-[8px] text-slate-400 font-mono">Generando...</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Student ID, User & Grade */}
                        <div className="w-full text-center leading-none space-y-0.5 overflow-hidden px-1">
                          <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-slate-600">
                            <span>{st.grado} "{st.grupo}"</span>
                            <span>·</span>
                            <span className="font-bold">{st.matricula}</span>
                          </div>
                          <div className="text-[7.5px] font-mono text-slate-500 truncate">
                            User: <strong className="text-slate-800">{usr}</strong>
                          </div>
                          <div className="text-[6.5px] text-slate-400 tracking-tighter uppercase font-semibold">
                            www.dashboard.mycollege.com.mx
                          </div>
                        </div>

                        {/* Corner 5cm indicator (screen only) */}
                        <span className="absolute bottom-0.5 left-0.5 text-[6px] text-slate-300 font-mono no-print">
                          5x5cm
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <QrCode className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No hay alumnos seleccionados para generar hojas de QR.</p>
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs text-slate-500">
            Mostrando <strong>{targetStudents.length}</strong> de <strong>{students.length}</strong> alumnos listos para impresión o descarga en PDF.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || isDownloadingPdf || targetStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isDownloadingPdf ? 'Generando PDF...' : 'Descargar Hoja QR en PDF'}
              </span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || targetStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB743] to-[#B68C1C] hover:from-[#E8C252] hover:to-[#A37B14] text-[#0B2545] font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimir Hojas de QR (5cm x 5cm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
