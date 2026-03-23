'use client';
import { useState, useEffect } from 'react';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserPlus, Search, Edit, Trash2, X } from 'lucide-react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'profesor',
    activo: true
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      const q = query(collection(db, 'usuarios'), orderBy('nombre'));
      const snap = await getDocs(q);

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setUsuarios(list);
      setLoading(false);
    };

    fetchUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'activo' ? value === 'true' : value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'profesor',
      activo: true
    });
    setIsEditMode(false);
    setCurrentId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user) => {
    setFormData({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol,
      activo: user.activo
    });
    setCurrentId(user.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      const ref = doc(db, 'usuarios', currentId);
      await updateDoc(ref, formData);
    } else {
      await addDoc(collection(db, 'usuarios'), {
        ...formData,
        ultimaActividad: new Date()
      });
    }

    const q = query(collection(db, 'usuarios'), orderBy('nombre'));
    const snap = await getDocs(q);

    const updated = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setUsuarios(updated);
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar usuario?')) return;

    await deleteDoc(doc(db, 'usuarios', id));
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  const filtered = usuarios.filter(u =>
    (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.rol || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-10">Cargando...</div>;
  }

  return (
    <div className="space-y-8">

      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#5DFDCB] px-6 py-3 rounded-lg"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">{user.nombre}</td>
                <td>{user.email}</td>
                <td>{user.telefono}</td>
                <td>{user.rol}</td>

                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.activo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td className="space-x-3">
                  <button onClick={() => openEdit(user)}>
                    <Edit size={18} />
                  </button>

                  <button onClick={() => handleDelete(user.id)}>
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No hay usuarios
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="w-full border p-2 rounded"
                required
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border p-2 rounded"
                required
              />

              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="w-full border p-2 rounded"
              />

              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="profesor">Profesor</option>
                <option value="coordinador">Coordinador</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="administrador">Administrador</option>
              </select>

              <select
                name="activo"
                value={formData.activo.toString()}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>

                <button type="submit" className="bg-[#5DFDCB] px-4 py-2 rounded">
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;