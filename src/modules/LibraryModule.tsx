import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookMarked,
  Plus,
  Search,
  BookOpen,
  X,
  Check,
  Upload,
  FileText,
  Eye,
  Lock,
  Users,
  Trash2,
  GraduationCap,
} from 'lucide-react';
import { LibraryBook } from '../types';
import { ProtectedPdfViewerModal } from '../components/ProtectedPdfViewerModal';

export const LibraryModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    teachers,
    subjects,
    libraryBooks,
    addBook,
    deleteBook,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [categoria, setCategoria] = useState('Literatura');
  const [ejemplares, setEjemplares] = useState('10');
  const [ubicacion, setUbicacion] = useState('Biblioteca Digital del Grupo (Solo Lectura)');

  // Estados para subida de archivo PDF y asignación a los grupos del docente
  const [archivoPdfNombre, setArchivoPdfNombre] = useState('');
  const [archivoPdfUrl, setArchivoPdfUrl] = useState('');
  const [archivoPdfTamano, setArchivoPdfTamano] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loanBanner, setLoanBanner] = useState<string | null>(null);
  const [viewingPdfBook, setViewingPdfBook] = useState<LibraryBook | null>(null);
  const [bookToDelete, setBookToDelete] = useState<LibraryBook | null>(null);

  // Modo de "Visualizar como Alumno" para que el docente compruebe exactamente lo que ven los alumnos de su grupo
  const [isStudentPreviewMode, setIsStudentPreviewMode] = useState(false);
  const [studentPreviewGroup, setStudentPreviewGroup] = useState<string>('TODOS');

  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const isTeacherRole = currentUser?.rol === 'docente';

  const currentTeacherRecord = React.useMemo(() => {
    if (!activeCollege || !currentUser || !isTeacherRole) return null;
    const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
    const expectedTchId = currentUser.id.replace(/^usr-/, '');
    const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
    const usrEmail = (currentUser.correo || '').trim().toLowerCase();
    const usrName = (currentUser.nombre || '').trim().toLowerCase();

    const byId = collegeTeachers.find(
      (t) => t.id === currentUser.id || t.id === expectedTchId
    );
    if (byId) return byId;

    if (usrName) {
      const byName = collegeTeachers.find(
        (t) => (t.nombre || '').trim().toLowerCase() === usrName
      );
      if (byName) return byName;
    }

    if (usrLogin) {
      const byLogin = collegeTeachers.find((t) => {
        const generatedFromTch = (t.nombre || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const parts = generatedFromTch.split(/\s+/).filter(Boolean);
        const candidatePrefix =
          parts.length >= 2 ? `${parts[0][0]}${parts[1]}` : parts[0] || '';
        return Boolean(candidatePrefix && usrLogin.startsWith(candidatePrefix));
      });
      if (byLogin) return byLogin;
    }

    if (usrEmail) {
      const emailMatches = collegeTeachers.filter(
        (t) => (t.correo || '').trim().toLowerCase() === usrEmail
      );
      if (emailMatches.length === 1) return emailMatches[0];
    }

    return null;
  }, [activeCollege, currentUser, teachers]);

  const currentOwnerIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentUser?.id) {
      ids.add(currentUser.id.trim().toLowerCase());
      ids.add(currentUser.id.replace(/^usr-/, '').trim().toLowerCase());
    }
    if (currentUser?.usuarioLogin) {
      ids.add(currentUser.usuarioLogin.trim().toLowerCase());
    }
    if (currentTeacherRecord?.id) {
      ids.add(currentTeacherRecord.id.trim().toLowerCase());
      ids.add(`usr-${currentTeacherRecord.id}`.trim().toLowerCase());
    }
    return ids;
  }, [currentUser, currentTeacherRecord]);

  const currentOwnerNames = React.useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.nombre) names.add(currentUser.nombre.trim().toLowerCase());
    if (currentTeacherRecord?.nombre) {
      names.add(currentTeacherRecord.nombre.trim().toLowerCase());
    }
    return names;
  }, [currentUser?.nombre, currentTeacherRecord]);

  const teacherAssignedGroups = React.useMemo(() => {
    if (!activeCollege) return [];
    if (currentTeacherRecord) {
      const fromTeacher = (currentTeacherRecord.grupos || []).filter(Boolean);
      const fromSubjects = subjects
        .filter(
          (s) =>
            s.colegioId === activeCollege.id &&
            (s.docenteId === currentTeacherRecord.id ||
              (s.docenteNombre &&
                s.docenteNombre.trim().toLowerCase() ===
                  currentTeacherRecord.nombre.trim().toLowerCase())) &&
            s.grado
        )
        .map((s) => `${s.grado}${s.grupo ? ` ${s.grupo}` : ''}`.trim());
      return Array.from(new Set([...fromTeacher, ...fromSubjects]));
    }
    const allSubGroups = subjects
      .filter((s) => s.colegioId === activeCollege.id && s.grado)
      .map((s) => `${s.grado}${s.grupo ? ` ${s.grupo}` : ''}`.trim());
    return Array.from(new Set(allSubGroups.length > 0 ? allSubGroups : ['1° A', '2° A', '3° A']));
  }, [activeCollege, currentTeacherRecord, subjects]);

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Helper para verificar si el libro fue subido por el usuario actual (único autorizado para eliminarlo)
  const isBookUploadedByCurrentUser = (b: LibraryBook): boolean => {
    if (!currentUser) return false;
    const bookDocId = (b.subidoPorDocenteId || '').trim().toLowerCase();
    const bookDocName = (b.subidoPorDocenteNombre || '').trim().toLowerCase();
    return (
      Boolean(bookDocId && currentOwnerIds.has(bookDocId)) ||
      Boolean(bookDocName && currentOwnerNames.has(bookDocName))
    );
  };

  const collegeBooks = libraryBooks.filter((b) => {
    if (b.colegioId !== activeCollege.id) return false;

    const isOwnedByCurrentUser = isBookUploadedByCurrentUser(b);

    // Todo lo que el usuario de docente haga en su perfil de docente (libros subidos) es únicamente para él:
    // ningún otro docente ve los libros privados de otro docente
    if (isTeacherRole) {
      if (!isOwnedByCurrentUser) return false;
      if (isStudentPreviewMode && studentPreviewGroup !== 'TODOS') {
        if (!b.gruposAsignados || b.gruposAsignados.length === 0) return true;
        return b.gruposAsignados.includes(studentPreviewGroup);
      }
      return true;
    }

    // Para los demás usuarios (administrador, coordinador, directivo, supervisor, prefecto, etc. con excepción de docentes y alumnos),
    // ven todos los libros del colegio y quién compartió cada libro
    if (isStudentPreviewMode && studentPreviewGroup !== 'TODOS') {
      if (!b.gruposAsignados || b.gruposAsignados.length === 0) return true;
      return b.gruposAsignados.includes(studentPreviewGroup);
    }
    return true;
  });

  // Mostrar quién compartió el libro únicamente para los demás usuarios (con excepción de docentes y alumnos / vista de alumno)
  const showSharedByInfo =
    !isTeacherRole &&
    !isStudentPreviewMode &&
    currentUser?.rol !== 'alumno' &&
    currentUser?.rol !== 'docente';

  // Helper para obtener el nombre de quién compartió el libro
  const resolveBookSharedBy = (book: LibraryBook): string => {
    if (book.subidoPorDocenteNombre && book.subidoPorDocenteNombre.trim()) {
      return book.subidoPorDocenteNombre.trim();
    }
    if (book.subidoPorDocenteId) {
      const matchedTeacher = teachers.find(
        (t) =>
          t.colegioId === activeCollege.id &&
          (t.id === book.subidoPorDocenteId || `usr-${t.id}` === book.subidoPorDocenteId)
      );
      if (matchedTeacher?.nombre) return matchedTeacher.nombre;
    }
    return 'Acervo Bibliográfico Institucional';
  };

  const filtered = collegeBooks.filter(
    (b) =>
      b.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.autor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (showSharedByInfo &&
        resolveBookSharedBy(b).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setTitulo('');
    setAutor('');
    setIsbn('');
    setCategoria(currentTeacherRecord?.especialidad || 'Lectura del Grupo');
    setEjemplares('30');
    setUbicacion(
      isTeacherRole ? 'Biblioteca Digital del Grupo (Solo Lectura)' : 'Pasillo 1, Estante A'
    );
    setArchivoPdfNombre('');
    setArchivoPdfUrl('');
    setArchivoPdfTamano('');
    setPdfError(null);
    setSelectedGroups(teacherAssignedGroups.length > 0 ? [...teacherAssignedGroups] : ['1° A']);
    setIsAddOpen(true);
  };

  const handleToggleStudentPreviewMode = () => {
    const nextMode = !isStudentPreviewMode;
    setIsStudentPreviewMode(nextMode);
    if (nextMode && filtered.length > 0) {
      const firstPdfBook =
        filtered.find((b) => Boolean(b.esDigitalPdf && b.archivoPdfUrl)) || filtered[0];
      if (firstPdfBook) {
        setViewingPdfBook(firstPdfBook);
      }
    }
  };

  const handleToggleGroup = (grp: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(grp)) {
        if (prev.length === 1) return prev;
        return prev.filter((g) => g !== grp);
      }
      return [...prev, grp];
    });
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf =
      file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setPdfError('Por favor selecciona únicamente un archivo en formato .pdf');
      return;
    }
    setPdfError(null);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setArchivoPdfNombre(file.name);
        setArchivoPdfUrl(reader.result);
        setArchivoPdfTamano(sizeLabel);
        if (!titulo.trim()) {
          const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
          setTitulo(cleanName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (isTeacherRole && !archivoPdfUrl) {
      setPdfError('Debes adjuntar el archivo del libro en formato .pdf para tus alumnos.');
      return;
    }

    const total = parseInt(ejemplares) || 30;
    const targetGroups =
      selectedGroups.length > 0
        ? selectedGroups
        : teacherAssignedGroups.length > 0
          ? [teacherAssignedGroups[0]]
          : [];

    addBook({
      colegioId: activeCollege.id,
      titulo: titulo.trim(),
      autor:
        autor.trim() ||
        currentTeacherRecord?.nombre ||
        currentUser?.nombre ||
        'Autor Institucional',
      isbn: isbn || 'PDF-DIGITAL',
      editorial: isTeacherRole ? 'Material Docente en PDF' : 'Editorial Universitaria',
      categoria,
      ejemplaresTotales: total,
      disponibles: total,
      ubicacion: archivoPdfUrl
        ? `Biblioteca Digital · Grupos: ${targetGroups.join(', ') || 'Todos'}`
        : ubicacion,
      esDigitalPdf: Boolean(archivoPdfUrl),
      archivoPdfNombre: archivoPdfNombre || undefined,
      archivoPdfUrl: archivoPdfUrl || undefined,
      archivoPdfTamano: archivoPdfTamano || undefined,
      gruposAsignados: targetGroups.length > 0 ? targetGroups : undefined,
      subidoPorDocenteId: currentTeacherRecord?.id || currentUser?.id,
      subidoPorDocenteNombre: currentTeacherRecord?.nombre || currentUser?.nombre,
      subidoPorDocenteRol: isTeacherRole ? 'Docente' : currentUser?.rol || 'Administración',
      soloLecturaSinDescarga: true,
      fechaPublicacion: new Date().toISOString().split('T')[0],
    });

    setIsAddOpen(false);
    setLoanBanner(
      archivoPdfUrl
        ? `El libro en PDF "${titulo}" fue publicado en modo Solo Lectura (sin descarga) para los alumnos de: ${targetGroups.join(', ')}.`
        : `El libro "${titulo}" se registró en el acervo bibliográfico.`
    );
    setTimeout(() => setLoanBanner(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              {isStudentPreviewMode
                ? 'Modo Vista Previa de Alumno (Solo Lectura · Sin Descarga)'
                : isTeacherRole
                  ? 'Biblioteca Digital Docente (.PDF · Solo Lectura)'
                  : 'Acervo Bibliográfico'}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6" style={{ color: goldColor }} />
            {isStudentPreviewMode
              ? 'Mi Biblioteca Escolar Digital (Vista como Alumno)'
              : 'Biblioteca y Acervo Bibliográfico'}
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {isStudentPreviewMode
              ? `Visualizando exactamente cómo ven la biblioteca y el lector .PDF los alumnos del grupo seleccionado`
              : isTeacherRole
                ? `${activeCollege.nombre} · Sube libros en formato .PDF para que los alumnos de tus grupos (${teacherAssignedGroups.join(', ') || 'Asignados'}) los lean en plataforma sin descarga`
                : `${activeCollege.nombre} · Control de catálogo, libros digitales en PDF y préstamos a alumnos`}
          </p>
        </div>

        {/* Botón superior rápido de "Visualizar como Alumno" */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleStudentPreviewMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
              isStudentPreviewMode
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>
              {isStudentPreviewMode ? 'Salir de Vista de Alumno' : 'Visualizar como Alumno'}
            </span>
          </button>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {isStudentPreviewMode ? (
          <div className="flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-xl text-xs">
            <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold">
              Vista de Alumno activa · Haz clic en cualquier libro para abrirlo:
            </span>
            {teacherAssignedGroups.length > 0 && (
              <select
                value={studentPreviewGroup}
                onChange={(e) => setStudentPreviewGroup(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 font-bold text-xs text-emerald-950"
              >
                <option value="TODOS">Todos mis grupos ({teacherAssignedGroups.join(', ')})</option>
                {teacherAssignedGroups.map((g) => (
                  <option key={g} value={g}>
                    Alumno del Grupo {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : isTeacherRole ? (
          <div className="text-xs text-slate-600 flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl">
            <Lock className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>
              Los libros <strong>.PDF</strong> que subas aquí se habilitarán en la biblioteca de los alumnos de tus grupos en modo <strong>Solo Visualización (sin descarga)</strong>.
            </span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStudentPreviewMode}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all cursor-pointer ${
              isStudentPreviewMode
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>
              {isStudentPreviewMode ? 'Volver a Vista Docente' : 'Visualizar como Alumno'}
            </span>
          </button>

          {!isStudentPreviewMode && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              {isTeacherRole ? (
                <>
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>Subir Libro en .PDF para mis Grupos</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Registrar / Subir Libro (.PDF)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loanBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{loanBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setLoanBanner(null)}
            className="text-emerald-800 hover:underline text-[11px] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book) => {
          const hasPdf = Boolean(book.esDigitalPdf && book.archivoPdfUrl);
          const canDeleteBook = !isStudentPreviewMode && isBookUploadedByCurrentUser(book);
          return (
            <div
              key={book.id}
              onClick={() => setViewingPdfBook(book)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all space-y-3 flex flex-col justify-between cursor-pointer group"
              title="Haz clic para abrir y leer el libro"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full">
                      {book.categoria}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{hasPdf ? 'PDF · Solo Lectura' : 'Lectura Digital'}</span>
                    </span>
                  </div>

                  {canDeleteBook && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookToDelete(book);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Eliminar libro de la biblioteca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                  {book.titulo}
                </h3>

                <p className="text-xs text-slate-500">Autor: {book.autor}</p>

                {book.gruposAsignados && book.gruposAsignados.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-600" />
                      <span>Grupos asignados: {book.gruposAsignados.join(', ')}</span>
                    </span>
                  </div>
                )}

                {showSharedByInfo && (
                  <div className="text-[11px] text-indigo-900 font-semibold bg-indigo-50/90 px-2.5 py-1.5 rounded-lg border border-indigo-200 flex items-center justify-between gap-2">
                    <span>
                      <strong>Compartido por:</strong> {resolveBookSharedBy(book)}
                    </span>
                    {book.subidoPorDocenteRol && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0">
                        {book.subidoPorDocenteRol}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Clic en la tarjeta para abrir el libro (Descarga deshabilitada)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-xs pt-3 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingPdfBook(book);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Eye className="w-3.5 h-3.5" style={{ color: goldColor }} />
                  <span>
                    {isStudentPreviewMode ? 'Abrir Libro (.PDF)' : 'Visualizar como Alumno (.PDF)'}
                  </span>
                </button>
                {canDeleteBook && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookToDelete(book);
                    }}
                    className="py-2 px-3 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 cursor-pointer"
                    title="Eliminar libro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Libro</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación para Eliminar Libro */}
      {bookToDelete && isBookUploadedByCurrentUser(bookToDelete) && (
        <div
          onClick={() => setBookToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 cursor-default"
          >
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-display font-bold text-sm">Confirmar Eliminación de Libro</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                ¿Estás seguro de que deseas eliminar el libro{' '}
                <strong className="text-slate-900">"{bookToDelete.titulo}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div>
                  <strong>Autor:</strong> {bookToDelete.autor}
                </div>
                {bookToDelete.gruposAsignados && bookToDelete.gruposAsignados.length > 0 && (
                  <div>
                    <strong>Grupos asignados:</strong> {bookToDelete.gruposAsignados.join(', ')}
                  </div>
                )}
                <div className="text-[11px] text-rose-700 pt-1">
                  Al eliminarlo, dejará de mostrarse en la biblioteca de los alumnos.
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isBookUploadedByCurrentUser(bookToDelete)) {
                    setBookToDelete(null);
                    return;
                  }
                  const deletedTitle = bookToDelete.titulo;
                  deleteBook(bookToDelete.id);
                  setBookToDelete(null);
                  setLoanBanner(`El libro "${deletedTitle}" fue eliminado de la biblioteca.`);
                  setTimeout(() => setLoanBanner(null), 4000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Libro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para subir libro en PDF y asignarlo a los grupos del docente */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border">
            <div
              className="p-4 border-b flex items-center justify-between text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
                borderBottom: `3px solid ${goldColor}`,
              }}
            >
              <div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  Solo Visualización para Alumnos (Sin Descarga)
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white mt-0.5">
                  {isTeacherRole
                    ? 'Subir Libro en .PDF para mis Grupos Asignados'
                    : 'Agregar Libro o Subir .PDF al Acervo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="p-5 space-y-3.5 text-xs md:text-sm max-h-[82vh] overflow-y-auto"
            >
              {/* Subida del archivo PDF */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-900 block text-xs">
                      Archivo del Libro en formato .PDF {isTeacherRole ? '*' : '(Opcional)'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Los alumnos solo podrán leerlo en el visor integrado sin poder descargarlo.
                    </span>
                  </div>

                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Elegir .PDF</span>
                  </button>
                </div>

                {pdfError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {pdfError}
                  </div>
                )}

                {archivoPdfNombre ? (
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-xs text-teal-950 block truncate">
                          {archivoPdfNombre}
                        </span>
                        <span className="text-[10px] text-teal-700 font-mono">
                          Tamaño: {archivoPdfTamano} · Modo: Solo lectura en plataforma
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setArchivoPdfNombre('');
                        setArchivoPdfUrl('');
                        setArchivoPdfTamano('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline px-2 py-0.5 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className="p-3.5 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl text-center cursor-pointer bg-white transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      Haz clic aquí para seleccionar el libro en formato <strong>.PDF</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Selección de grupos asignados al docente */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Grupos de Alumnos que verán este libro en su Biblioteca:</span>
                  </label>
                  {teacherAssignedGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGroups(
                          selectedGroups.length === teacherAssignedGroups.length
                            ? [teacherAssignedGroups[0]]
                            : [...teacherAssignedGroups]
                        )
                      }
                      className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                    >
                      {selectedGroups.length === teacherAssignedGroups.length
                        ? 'Seleccionar solo uno'
                        : 'Seleccionar todos mis grupos'}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {teacherAssignedGroups.map((grp) => {
                    const active = selectedGroups.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleToggleGroup(grp)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span>Grupo {grp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-xs">Título del Libro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. El Principito / Antología de Lecturas 3°"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold block mb-1 text-xs">Autor(es) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Antoine de Saint-Exupéry"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-xs">Materia / Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Upload className="w-3.5 h-3.5" style={{ color: goldColor }} />
                  <span>Publicar Libro para mis Alumnos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visor PDF protegido (Modo Alumno · Solo Lectura sin Descarga) */}
      {viewingPdfBook && (
        <ProtectedPdfViewerModal
          book={viewingPdfBook}
          onClose={() => setViewingPdfBook(null)}
          primaryColor={primaryColor}
          goldColor={goldColor}
          studentName={`Vista como Alumno (${viewingPdfBook.gruposAsignados?.join(', ') || teacherAssignedGroups.join(', ') || 'Grupo Escolar'})`}
        />
      )}
    </div>
  );
};
