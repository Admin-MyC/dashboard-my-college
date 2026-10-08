import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  KeyRound,
  Check,
  Users,
  Info,
} from 'lucide-react';
import { Student, College, Teacher } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  college: College;
  teachers: Teacher[];
  onImportStudents: (
    importedList: Array<{
      studentData: Omit<Student, 'id'>;
      username: string;
      password: string;
    }>
  ) => void;
}

interface ParsedStudentRow {
  nombre: string;
  apellidos: string;
  nivel: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria';
  grado: string;
  grupo: string;
  matricula: string;
  curp: string;
  generatedUsername: string;
  generatedPassword: string;
}

export const StudentCsvImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  college,
  onImportStudents,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const allowedLevels: Array<'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria'> =
    college.nivel === 'Preescolar'
      ? ['Preescolar']
      : college.nivel === 'Primaria'
        ? ['Primaria']
        : college.nivel === 'Secundaria'
          ? ['Secundaria']
          : college.nivel === 'Preparatoria'
            ? ['Preparatoria']
            : ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];

  const defaultNivel = allowedLevels.includes('Primaria') ? 'Primaria' : allowedLevels[0];

  // Automatic username generator: primer letra del primer nombre + apellido + 4 dígitos aleatorios
  const generateStudentUsername = (nombre: string, apellidos: string): string => {
    const cleanFirst = (nombre.trim().split(/\s+/)[0] || 'a')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .charAt(0) || 'a';

    const cleanSurname = (apellidos.trim().split(/\s+/)[0] || 'alumno')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    const random4 = Math.floor(1000 + Math.random() * 9000);
    return `${cleanFirst}${cleanSurname}${random4}`;
  };

  // Automatic password generator: 8 caracteres aleatoriamente números, letras y caracteres especiales comunes
  const generateStudentPassword = (): string => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const specials = '@#$%&*!?';
    const all = letters + digits + specials;
    const chars: string[] = [
      letters.charAt(Math.floor(Math.random() * letters.length)),
      letters.charAt(Math.floor(Math.random() * letters.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      digits.charAt(Math.floor(Math.random() * digits.length)),
      specials.charAt(Math.floor(Math.random() * specials.length)),
    ];
    for (let i = 0; i < 3; i++) {
      chars.push(all.charAt(Math.floor(Math.random() * all.length)));
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  };

  // Download CSV Template with example rows matching the New Student form (sin Grupo)
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Nombre',
      'Apellidos',
      'Nivel',
      'Grado',
      'Matricula',
      'CURP',
    ];

    const secondNivel = allowedLevels[1] || defaultNivel;
    const thirdNivel = allowedLevels[2] || defaultNivel;

    const exampleRows = [
      [
        'Santiago',
        'Hernández Ramírez',
        defaultNivel,
        '3°',
        'CCM-2026-201',
        'HERA080415HDFRRL01',
      ],
      [
        'Sofía Valentina',
        'López Mendoza',
        secondNivel,
        '2°',
        'CCM-2026-202',
        'LOMS090821MDFRNS05',
      ],
      [
        'Diego Alejandro',
        'Martínez Silva',
        thirdNivel,
        '1°',
        '',
        'MASD100312HDFSLN09',
      ],
    ];

    const csvLines = [
      headers.join(','),
      ...exampleRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ];

    // Add UTF-8 BOM so Excel opens accents and '°' properly
    const csvString = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanCollege = college.nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    link.download = `Formato_Ejemplo_Importar_Alumnos_${cleanCollege}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV line respecting quotes
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const normalizeNivel = (
    raw: string
  ): 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' => {
    const clean = raw
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    let candidate: 'Preescolar' | 'Primaria' | 'Secundaria' | 'Preparatoria' = defaultNivel;
    if (clean.includes('preescolar') || clean.includes('kinder')) candidate = 'Preescolar';
    else if (clean.includes('primaria')) candidate = 'Primaria';
    else if (clean.includes('secundaria')) candidate = 'Secundaria';
    else if (clean.includes('preparatoria') || clean.includes('bachillerato') || clean.includes('prepa'))
      candidate = 'Preparatoria';
    return allowedLevels.includes(candidate) ? candidate : defaultNivel;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Por favor selecciona un archivo válido en formato .CSV');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const lines = text
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setErrorMessage('El archivo CSV está vacío o solo contiene la fila de encabezados.');
          setParsedRows([]);
          return;
        }

        const headerCols = parseCsvLine(lines[0]).map((h) =>
          h
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9_]/g, '')
        );

        const idxNombre = headerCols.findIndex(
          (h) => h.includes('nombre') && !h.includes('tutor') && !h.includes('docente')
        );
        const idxApellidos = headerCols.findIndex((h) => h.includes('apellido'));
        const idxNivel = headerCols.findIndex((h) => h.includes('nivel'));
        const idxGrado = headerCols.findIndex((h) => h.includes('grado'));
        const idxMatricula = headerCols.findIndex((h) => h.includes('matricula'));
        const idxCurp = headerCols.findIndex((h) => h.includes('curp'));

        const extracted: ParsedStudentRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (cols.every((c) => !c)) continue;

          const nombre = (idxNombre >= 0 ? cols[idxNombre] : cols[0])?.trim() || '';
          const apellidos = (idxApellidos >= 0 ? cols[idxApellidos] : cols[1])?.trim() || '';

          if (!nombre && !apellidos) continue;

          const rawNivel = (idxNivel >= 0 ? cols[idxNivel] : cols[2])?.trim() || '';
          const nivel = normalizeNivel(rawNivel);

          let grado = (idxGrado >= 0 ? cols[idxGrado] : cols[3])?.trim() || '1°';
          if (/^[1-6]$/.test(grado)) grado = `${grado}°`;

          // Al cargar masivamente o crear un nuevo alumno no se pide ni asigna grupo hasta que esté dado de alta en Materias y Grupos
          const grupo = 'Sin Grupo';

          const defaultMat = `${college.codigoCCT.slice(4, 7)}-${new Date().getFullYear()}-${Math.floor(
            100 + Math.random() * 899
          )}`;
          const matricula = (idxMatricula >= 0 ? cols[idxMatricula] : cols[4])?.trim() || defaultMat;
          const curp = ((idxCurp >= 0 ? cols[idxCurp] : cols[5])?.trim() || 'XXXX000000XXXXXX00').toUpperCase();

          const generatedUsername = generateStudentUsername(nombre, apellidos || 'Alumno');
          const generatedPassword = generateStudentPassword();

          extracted.push({
            nombre: nombre || 'Alumno',
            apellidos: apellidos || 'Registrado',
            nivel,
            grado,
            grupo,
            matricula,
            curp,
            generatedUsername,
            generatedPassword,
          });
        }

        if (extracted.length === 0) {
          setErrorMessage('No se encontraron filas válidas de alumnos en el archivo CSV.');
        } else {
          setParsedRows(extracted);
        }
      } catch (err) {
        console.error('Error al leer CSV:', err);
        setErrorMessage('Error al procesar el archivo CSV. Verifica que siga el formato descargable.');
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const toImport = parsedRows.map((r) => ({
      studentData: {
        colegioId: college.id,
        nombre: r.nombre,
        apellidos: r.apellidos,
        nivel: r.nivel,
        grado: r.grado,
        grupo: r.grupo,
        matricula: r.matricula,
        curp: r.curp,
        promedio: 0,
        tutorNombre: '',
        tutorTelefono: '',
        tutorCorreo: '',
        estatus: 'pendiente' as const,
        foto: college.escudoUrl, // Default to college shield when imported via CSV
        fechaNacimiento: '2010-05-15',
        usuarioLogin: r.generatedUsername,
        password: r.generatedPassword,
      },
      username: r.generatedUsername,
      password: r.generatedPassword,
    }));

    onImportStudents(toImport);
    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      setParsedRows([]);
      setFileName('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#0B2545] via-[#133E6E] to-[#0B2545] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-400/20 border border-indigo-300/30 flex items-center justify-center text-amber-300 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  Control Escolar · Importación Masiva
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Formato .CSV Oficial
                </span>
              </div>
              <h3 className="font-display font-black text-lg text-white">
                Importar Listado de Alumnos (.CSV)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs">
          {/* Step 1: Download Format Template with Example */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                <span>1. Descarga la Plantilla Oficial con Ejemplo (.CSV)</span>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Descarga el formato con las columnas requeridas respecto al formulario de nuevo alumno y <strong>3 alumnos de ejemplo</strong> (Nombre, Apellidos, Nivel, Grado, Matrícula y CURP). El grupo se asignará posteriormente desde Control Escolar cuando los grupos estén dados de alta en Materias y Grupos.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-amber-900 font-semibold">
                <span className="inline-flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-amber-300">
                  <KeyRound className="w-3 h-3 text-amber-700" />
                  Usuario auto: 1ra letra nombre + apellido + 4 dígitos
                </span>
                <span className="inline-flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  Contraseña auto: 8 caracteres alfanuméricos
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Descargar Formato Ejemplo (.CSV)</span>
            </button>
          </div>

          {/* Example Structure Preview */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Vista previa de lo que debe contener tu archivo .CSV:</span>
              </span>
              <span className="text-[10px] text-slate-500">
                * Si no tienen foto, se asigna el escudo del colegio automáticamente
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-left border border-slate-200 rounded-lg overflow-hidden bg-white">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2">Nombre</th>
                    <th className="py-1.5 px-2">Apellidos</th>
                    <th className="py-1.5 px-2">Nivel</th>
                    <th className="py-1.5 px-2">Grado</th>
                    <th className="py-1.5 px-2">Matricula</th>
                    <th className="py-1.5 px-2">CURP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                  <tr>
                    <td className="py-1 px-2 font-sans font-semibold text-slate-900">Santiago</td>
                    <td className="py-1 px-2 font-sans">Hernández Ramírez</td>
                    <td className="py-1 px-2 font-sans font-semibold text-indigo-700">
                      {defaultNivel}
                    </td>
                    <td className="py-1 px-2">3°</td>
                    <td className="py-1 px-2">CCM-2026-201</td>
                    <td className="py-1 px-2">HERA080415HDFRRL01</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2: Select CSV File */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              2. Selecciona tu archivo .CSV desde tu computadora:
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm">
                  {fileName ? `Archivo cargado: ${fileName}` : 'Haz clic aquí para seleccionar tu archivo .CSV'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  El sistema generará automáticamente el usuario, contraseña de 8 caracteres y código QR para cada alumno.
                </p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {parsedRows.length} alumnos listos para importar con credenciales automáticas:
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Limpiar selección
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Alumno</th>
                      <th className="py-2 px-2">Nivel / Grado</th>
                      <th className="py-2 px-2">CURP</th>
                      <th className="py-2 px-2">Usuario Auto</th>
                      <th className="py-2 px-2">Password Auto (8 car.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.apellidos}, {row.nombre}
                          <span className="block text-[10px] font-mono text-slate-400">
                            {row.matricula}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-700">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mr-1.5">
                            {row.nivel}
                          </span>
                          <span>{row.grado}</span>
                          <span className="ml-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Sin grupo asignado
                          </span>
                        </td>
                        <td className="py-2 px-2 font-mono text-slate-600">
                          {row.curp}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-emerald-800 bg-emerald-50/50">
                          {row.generatedUsername}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-amber-900 bg-amber-50/50">
                          {row.generatedPassword}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importSuccess && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-950 font-bold flex items-center gap-2 animate-in zoom-in-95">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                ¡Se importaron {parsedRows.length} alumnos exitosamente con sus usuarios, contraseñas y códigos QR!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || importSuccess}
            onClick={handleConfirmImport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            <span>Importar {parsedRows.length > 0 ? `${parsedRows.length} Alumnos` : 'Listado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
