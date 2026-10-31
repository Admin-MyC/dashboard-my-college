import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { College, Student } from '../types';

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#0B2545').replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 11;
    const g = parseInt(clean[1] + clean[1], 16) || 37;
    const b = parseInt(clean[2] + clean[2], 16) || 69;
    return [r, g, b];
  }
  const r = parseInt(clean.substring(0, 2), 16) || 11;
  const g = parseInt(clean.substring(2, 4), 16) || 37;
  const b = parseInt(clean.substring(4, 6), 16) || 69;
  return [r, g, b];
}

export async function generateQrSheetsPdf(params: {
  college: College;
  students: Student[];
  qrCodeDataUrls?: Record<string, string>;
  includePhotoAndDetails?: boolean;
  filename?: string;
}): Promise<void> {
  const {
    college,
    students,
    qrCodeDataUrls = {},
    includePhotoAndDetails = false,
    filename,
  } = params;
  if (!students.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9mm x 279.4mm
  });

  const [pR, pG, pB] = hexToRgb(college.colores?.primario || '#0B2545');
  const [sR, sG, sB] = hexToRgb(college.colores?.secundario || '#C59B27');
  const officialDomain = 'https://dashboard.mycollege.com.mx';

  // Ensure every student has a valid QR code data URL
  const qrMap: Record<string, string> = { ...qrCodeDataUrls };
  for (const st of students) {
    if (!qrMap[st.id]) {
      const payload = `${officialDomain}/asistencia?alumno=${encodeURIComponent(
        st.matricula
      )}&sid=${encodeURIComponent(st.id)}&colegio=${encodeURIComponent(
        college.id
      )}&curp=${encodeURIComponent(st.curp)}&grado=${encodeURIComponent(
        st.grado
      )}&grupo=${encodeURIComponent(st.grupo)}&docente=${encodeURIComponent(
        st.docenteId || ''
      )}`;
      try {
        qrMap[st.id] = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#0B2545',
            light: '#FFFFFF',
          },
        });
      } catch (e) {
        console.error('Error generating QR for PDF:', st.id, e);
      }
    }
  }

  // Layout parameters:
  // Standard mode: 3 columns x 4 rows of 50mm x 50mm cards (12 per page)
  // Photo & Details on left mode: 2 columns x 4 rows of 90mm x 50mm cards (8 per page)
  const CARDS_PER_PAGE = includePhotoAndDetails ? 8 : 12;
  const COLS = includePhotoAndDetails ? 2 : 3;
  const CARD_W = includePhotoAndDetails ? 90 : 50;
  const CARD_H = 50; // 5.0 cm height
  const GAP_X = includePhotoAndDetails ? 8 : 8;
  const GAP_Y = 6;
  const START_X = includePhotoAndDetails ? 14 : 25;
  const START_Y = 32;

  const totalPages = Math.ceil(students.length / CARDS_PER_PAGE);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const pageStudents = students.slice(
      pageIdx * CARDS_PER_PAGE,
      (pageIdx + 1) * CARDS_PER_PAGE
    );

    // Header Bar on sheet
    doc.setFillColor(pR, pG, pB);
    doc.rect(14, 10, 188, 14, 'F');
    doc.setFillColor(sR, sG, sB);
    doc.rect(14, 24, 188, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${college.nombre.toUpperCase()} — HOJA DE CÓDIGOS QR DE ASISTENCIA ${
        includePhotoAndDetails ? '(CON FOTOGRAFÍA Y DATOS + QR)' : '(5cm x 5cm)'
      }`,
      18,
      16.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(
      `Control de Alumnos · Recorte sobre la línea punteada · Página ${pageIdx + 1} de ${totalPages}`,
      18,
      21.5
    );

    // Draw each card
    pageStudents.forEach((st, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = START_X + col * (CARD_W + GAP_X);
      const y = START_Y + row * (CARD_H + GAP_Y);

      // Card background and dashed cut border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.35);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.roundedRect(x, y, CARD_W, CARD_H, 2, 2, 'FD');
      doc.setLineDashPattern([], 0);

      if (includePhotoAndDetails) {
        // Left side: Student Photo & Student Data | Right side: 5cm x 5cm QR block
        // Top header bar across the card
        doc.setFillColor(pR, pG, pB);
        doc.rect(x + 2, y + 1.8, CARD_W - 4, 4.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        const collegeTitle = college.nombre.toUpperCase().substring(0, 52);
        doc.text(collegeTitle, x + CARD_W / 2, y + 4.8, { align: 'center' });

        // Vertical divider between Left (photo + data) and Right (QR)
        const splitX = x + 46;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(splitX, y + 7.5, splitX, y + CARD_H - 2.5);

        // Left section (x+2 to splitX): Photo & Student Details
        const photoImg = st.foto || college.escudoUrl || '';
        const photoAdded = (() => {
          if (!photoImg || !photoImg.startsWith('data:image/')) return false;
          try {
            const fmt = photoImg.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(photoImg, fmt, x + 3, y + 8.5, 14, 14);
            return true;
          } catch {
            return false;
          }
        })();

        if (!photoAdded) {
          // Draw clean avatar placeholder box with initials
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(x + 3, y + 8.5, 14, 14, 1.5, 1.5, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(pR, pG, pB);
          const initials = `${(st.nombre || 'A').charAt(0)}${(st.apellidos || 'A').charAt(0)}`.toUpperCase();
          doc.text(initials, x + 10, y + 16.8, { align: 'center' });
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(x + 3, y + 8.5, 14, 14, 1.5, 1.5, 'D');
        }

        // Student Name next to photo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        const firstLineName = (st.nombre || '').trim().substring(0, 18);
        const secondLineName = (st.apellidos || '').trim().substring(0, 18);
        doc.text(firstLineName, x + 18.5, y + 12);
        doc.text(secondLineName, x + 18.5, y + 15.2);

        // Level & Grade badge text next to photo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(pR, pG, pB);
        const lvlText = `${st.nivel || 'Primaria'} · ${st.grado} "${st.grupo}"`;
        doc.text(lvlText.substring(0, 22), x + 18.5, y + 19.2);

        // Student details list below photo (Left side)
        let detailY = y + 26.5;
        doc.setFont('courier', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(30, 41, 59);
        doc.text(`Matrícula: ${st.matricula}`.substring(0, 28), x + 3, detailY);

        detailY += 3.8;
        doc.setFont('courier', 'normal');
        doc.setFontSize(5.4);
        doc.setTextColor(71, 85, 105);
        doc.text(`CURP: ${st.curp || 'N/A'}`.substring(0, 28), x + 3, detailY);

        detailY += 3.8;
        const usr = st.usuarioLogin || st.matricula.toLowerCase();
        doc.setFont('courier', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(pR, pG, pB);
        doc.text(`Usuario: ${usr}`.substring(0, 28), x + 3, detailY);

        if (st.tutorNombre) {
          detailY += 3.8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.2);
          doc.setTextColor(71, 85, 105);
          doc.text(`Tutor: ${st.tutorNombre}`.substring(0, 30), x + 3, detailY);
        }

        // Footer on left
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.8);
        doc.setTextColor(100, 116, 139);
        doc.text('www.dashboard.mycollege.com.mx', x + 3, y + 47.5);

        // Right section (splitX to x + CARD_W): QR Code
        const qrCenterX = splitX + (CARD_W - 46) / 2;
        const qrData = qrMap[st.id];
        if (qrData) {
          try {
            doc.addImage(qrData, 'PNG', qrCenterX - 16, y + 9, 32, 32);
          } catch (err) {
            console.error('Error adding QR image to PDF:', err);
          }
        }
        doc.setFont('courier', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(15, 23, 42);
        doc.text(st.matricula, qrCenterX, y + 44, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(100, 116, 139);
        doc.text('ESCANEAR ASISTENCIA', qrCenterX, y + 47.2, { align: 'center' });
      } else {
        // Standard 5cm x 5cm card layout
        // Top college accent bar inside card
        doc.setFillColor(pR, pG, pB);
        doc.rect(x + 2, y + 1.8, CARD_W - 4, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        const collegeTitle = college.nombre.toUpperCase().substring(0, 32);
        doc.text(collegeTitle, x + CARD_W / 2, y + 4.5, { align: 'center' });

        // Student full name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(15, 23, 42);
        const fullName = `${st.nombre} ${st.apellidos}`.trim().substring(0, 28);
        doc.text(fullName, x + CARD_W / 2, y + 9, { align: 'center' });

        // QR Code Image (28mm x 28mm centered)
        const qrData = qrMap[st.id];
        if (qrData) {
          try {
            doc.addImage(qrData, 'PNG', x + (CARD_W - 28) / 2, y + 10.5, 28, 28);
          } catch (err) {
            console.error('Error adding QR image to PDF:', err);
          }
        }

        // Level, Grade, Group & Matricula
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.2);
        doc.setTextColor(30, 41, 59);
        const levelPrefix = st.nivel ? `${st.nivel.substring(0, 4)}. ` : '';
        const gradeLine = `${levelPrefix}${st.grado} "${st.grupo}" · ${st.matricula}`.substring(
          0,
          30
        );
        doc.text(gradeLine, x + CARD_W / 2, y + 41.5, { align: 'center' });

        // Username
        const usr = st.usuarioLogin || st.matricula.toLowerCase();
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(pR, pG, pB);
        doc.text(`User: ${usr}`.substring(0, 28), x + CARD_W / 2, y + 45, {
          align: 'center',
        });

        // Domain footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(100, 116, 139);
        doc.text('www.dashboard.mycollege.com.mx', x + CARD_W / 2, y + 48.2, {
          align: 'center',
        });
      }
    });

    // Footer instruction
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      includePhotoAndDetails
        ? 'Imprima esta hoja al 100% de escala (Tamaño Carta). Incluye fotografía y datos del estudiante a la izquierda del código QR.'
        : 'Imprima esta hoja al 100% de escala (Tamaño Carta) para conservar la medida exacta de 5.0 cm x 5.0 cm por tarjeta.',
      108,
      268,
      { align: 'center' }
    );
  }

  const safeCollege = college.nombre.replace(/[^a-zA-Z0-9]/g, '_');
  const finalFilename =
    filename ||
    `Hojas_QR_Asistencia_${safeCollege}_${students.length}_Alumnos${
      includePhotoAndDetails ? '_Con_Foto_y_Datos' : ''
    }.pdf`;
  doc.save(finalFilename);
}

/**
 * Prints HTML content using a hidden iframe inside the current document
 * so it works inside sandboxed iframes without needing popups (window.open)
 * or fighting deep modal overflow containers.
 */
export function printHtmlInHiddenIframe(htmlContent: string): void {
  const existingFrame = document.getElementById('qr-hidden-print-iframe');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'qr-hidden-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  // Wait briefly for base64 QR images to decode in the iframe before triggering print
  setTimeout(triggerPrint, 350);
}
