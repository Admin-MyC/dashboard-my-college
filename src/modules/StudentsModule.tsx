import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Printer,
  Award,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { Student } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';

export const StudentsModule: React.FC = () => {
  const { activeCollege, students, addStudent, updateStudent, deleteStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('todos');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formGrado, setFormGrado] = useState('3°');
  const [formGrupo, setFormGrupo] = useState('A');
  const [formMatricula, setFormMatricula] = useState('');
  const [formCurp, setFormCurp] = useState('');
  const [formTutorNombre, setFormTutorNombre] = useState('');
  const [formTutorTel, setFormTutorTel] = useState('');
  const [formTutorEmail, setFormTutorEmail] = useState('');
  const [formPromedio, setFormPromedio] = useState('9.0');

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const collegeStudents = students.filter((s) => s.colegioId === activeCollege.id);

  const filteredStudents = collegeStudents.filter((s) => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tutorNombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'todos' || s.grado === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formApellidos.trim()) {
      alert('Nombre y apellidos son requeridos.');
      return;
    }

    addStudent({
      colegioId: activeCollege.id,
      nombre: formNombre,
      apellidos: formApellidos,
      grado: formGrado,
      grupo: formGrupo,
      matricula:
        formMatricula ||
        `${activeCollege.codigoCCT.slice(4, 7)}-${new Date().getFullYear()}-${Math.floor(
          100 + Math.random() * 899
        )}`,
      curp: formCurp || 'HERA080415HDFRRL01',
      tutorNombre: formTutorNombre || 'Tutor Registrado',
      tutorTelefono: formTutorTel || '+52 (55) 0000-0000',
      tutorCorreo: formTutorEmail || 'tutor@correo.com',
      promedio: parseFloat(formPromedio) || 9.0,
      estatus: 'activo',
      foto: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
      fechaNacimiento: '2009-04-12',
    });

    // Reset
    setFormNombre('');
    setFormApellidos('');
    setFormMatricula('');
    setFormCurp('');
    setFormTutorNombre('');
    setFormTutorTel('');
    setFormTutorEmail('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6" style={{ color: primaryColor }} />
            Población Estudiantil y Control Escolar
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            {activeCollege.nombre} · Directorio de alumnos, promedios y emisión de boletas oficiales
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 text-white self-start sm:self-auto"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Inscribir Nuevo Alumno</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, matrícula o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="todos">Todos los Grados</option>
            <option value="1°">1° Grado</option>
            <option value="2°">2° Grado</option>
            <option value="3°">3° Grado</option>
            <option value="4°">4° Grado</option>
            <option value="5°">5° Grado</option>
            <option value="6°">6° Grado</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Alumno & Matrícula</th>
                <th className="py-3 px-4">Grado y Grupo</th>
                <th className="py-3 px-4">Tutor Legal</th>
                <th className="py-3 px-4">Promedio</th>
                <th className="py-3 px-4">Estatus</th>
                <th className="py-3 px-4 text-right">Boleta Oficial & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Photo & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.foto}
                          alt={s.nombre}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {s.apellidos}, {s.nombre}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {s.matricula}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Grade & Group */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.grado} "{s.grupo}"
                    </td>

                    {/* Tutor info */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-900">{s.tutorNombre}</div>
                      <div className="text-xs text-slate-400">{s.tutorTelefono}</div>
                    </td>

                    {/* Promedio */}
                    <td className="py-3 px-4">
                      <span
                        className="font-bold font-mono px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${goldColor}20`,
                          color: primaryColor,
                        }}
                      >
                        {s.promedio.toFixed(1)}
                      </span>
                    </td>

                    {/* Estatus */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          s.estatus === 'activo'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.estatus === 'condicionado'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {s.estatus.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions: Emit Report Card */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Boleta Button (Crucial requested feature with college escudo and colors) */}
                        <button
                          onClick={() => setSelectedStudentForReport(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all active:scale-98"
                          style={{ backgroundColor: primaryColor }}
                          title="Emitir Boleta Oficial con Escudo y Colores Institucionales"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Boleta</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar al alumno ${s.nombre} ${s.apellidos}?`)) {
                              deleteStudent(s.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No se encontraron alumnos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Card Modal with College Escudo & Colors */}
      <ReportCardModal
        student={selectedStudentForReport}
        onClose={() => setSelectedStudentForReport(null)}
      />

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-900">
                Inscripción de Alumno: {activeCollege.nombre}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Santiago"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hernández Ramírez"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grado</label>
                  <select
                    value={formGrado}
                    onChange={(e) => setFormGrado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1°">1°</option>
                    <option value="2°">2°</option>
                    <option value="3°">3°</option>
                    <option value="4°">4°</option>
                    <option value="5°">5°</option>
                    <option value="6°">6°</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grupo</label>
                  <select
                    value={formGrupo}
                    onChange={(e) => setFormGrupo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Promedio</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="10"
                    value={formPromedio}
                    onChange={(e) => setFormPromedio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    placeholder="Auto-generada si se deja vacío"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CURP</label>
                  <input
                    type="text"
                    placeholder="18 caracteres"
                    value={formCurp}
                    onChange={(e) => setFormCurp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Información del Tutor / Padre de Familia
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo del tutor"
                    value={formTutorNombre}
                    onChange={(e) => setFormTutorNombre(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Teléfono del tutor"
                    value={formTutorTel}
                    onChange={(e) => setFormTutorTel(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded bg-white text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Correo del tutor"
                    value={formTutorEmail}
                    onChange={(e) => setFormTutorEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded bg-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
