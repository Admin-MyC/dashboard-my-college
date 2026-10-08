import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookMarked, Plus, Search, BookOpen, X, Check } from 'lucide-react';

export const LibraryModule: React.FC = () => {
  const { activeCollege, libraryBooks, addBook } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [categoria, setCategoria] = useState('Literatura');
  const [ejemplares, setEjemplares] = useState('10');
  const [ubicacion, setUbicacion] = useState('Pasillo 1, Estante A');

  if (!activeCollege) return null;
  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';
  const collegeBooks = libraryBooks.filter((b) => b.colegioId === activeCollege.id);

  const filtered = collegeBooks.filter(
    (b) =>
      b.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.autor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim()) return;

    const total = parseInt(ejemplares) || 5;
    addBook({
      colegioId: activeCollege.id,
      titulo,
      autor,
      isbn: isbn || '978-0000000000',
      editorial: 'Editorial Universitaria',
      categoria,
      ejemplaresTotales: total,
      disponibles: total,
      ubicacion,
    });

    setTitulo('');
    setAutor('');
    setIsAddOpen(false);
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
              Acervo Bibliográfico
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6" style={{ color: goldColor }} />
            Biblioteca y Acervo Bibliográfico
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Control de catálogo, préstamos a alumnos y ejemplares en sala
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Libro</span>
        </button>
      </div>

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
        {filtered.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {book.categoria}
              </span>
              <span className="text-xs font-mono text-slate-400">{book.isbn}</span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm leading-snug">
              {book.titulo}
            </h3>

            <p className="text-xs text-slate-500">Por {book.autor}</p>

            <div className="p-2.5 bg-slate-50 rounded-lg border text-xs flex justify-between items-center">
              <span>Ubicación:</span>
              <span className="font-semibold text-slate-700">{book.ubicacion}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                Disponibles: <strong className="text-emerald-700">{book.disponibles}</strong> / {book.ejemplaresTotales}
              </span>
              <button
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800"
                onClick={() => alert(`Préstamo registrado para "${book.titulo}".`)}
              >
                Prestar
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Agregar al Acervo</h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs md:text-sm">
              <div>
                <label className="font-semibold block mb-1">Título del Libro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. El Principito"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Autor(es) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Antoine de Saint-Exupéry"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Total Ejemplares</label>
                  <input
                    type="number"
                    value={ejemplares}
                    onChange={(e) => setEjemplares(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Ubicación Física</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
