'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Search, Edit, Trash2, Package, X } from 'lucide-react';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Papelería',
    cantidad: 0,
    precioUnitario: 0,
    minimoStock: 0,
  });

  // Categorías predefinidas para el select
  const categorias = [
    'Papelería',
    'Escritura',
    'Arte y Manualidades',
    'Útiles Escolares',
    'Higiene y Limpieza',
    'Otros',
  ];

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const q = query(collection(db, 'productos'), orderBy('nombre'));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          cantidad: Number(doc.data().cantidad || 0),
          precioUnitario: Number(doc.data().precioUnitario || 0),
          minimoStock: Number(doc.data().minimoStock || 0),
        }));
        setProductos(list);
      } catch (err) {
        console.error(err);
        setMensaje({ text: 'Error al cargar productos', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['cantidad', 'precioUnitario', 'minimoStock'].includes(name) ? Number(value) || 0 : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'Papelería',
      cantidad: 0,
      precioUnitario: 0,
      minimoStock: 0,
    });
    setIsEditMode(false);
    setCurrentProductId(null);
  };

  const openModalForAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openModalForEdit = (prod) => {
    setFormData({
      nombre: prod.nombre,
      categoria: prod.categoria || 'Papelería',
      cantidad: prod.cantidad,
      precioUnitario: prod.precioUnitario,
      minimoStock: prod.minimoStock,
    });
    setCurrentProductId(prod.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ text: '', type: '' });

    try {
      if (isEditMode) {
        // Editar
        const productRef = doc(db, 'productos', currentProductId);
        await updateDoc(productRef, formData);
        setMensaje({ text: 'Producto actualizado correctamente', type: 'success' });
      } else {
        // Crear
        await addDoc(collection(db, 'productos'), {
          ...formData,
          createdAt: new Date(),
        });
        setMensaje({ text: 'Producto agregado correctamente', type: 'success' });
      }

      // Recargar lista
      const q = query(collection(db, 'productos'), orderBy('nombre'));
      const snap = await getDocs(q);
      const updated = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        cantidad: Number(d.data().cantidad || 0),
        precioUnitario: Number(d.data().precioUnitario || 0),
        minimoStock: Number(d.data().minimoStock || 0),
      }));
      setProductos(updated);

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setMensaje({ text: 'Error al guardar el producto', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Realmente quieres eliminar este producto?')) return;

    try {
      await deleteDoc(doc(db, 'productos', id));
      setMensaje({ text: 'Producto eliminado correctamente', type: 'success' });

      // Actualizar lista
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      setMensaje({ text: 'Error al eliminar el producto', type: 'error' });
    }
  };

  const filtered = productos.filter(p =>
    (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5DFDCB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión de productos del colegio</p>
        </div>
        <button
          onClick={openModalForAdd}
          className="flex items-center gap-2 bg-[#5DFDCB] text-[#031D44] px-5 py-3 rounded-lg font-medium hover:bg-[#4be0b8] transition shadow-sm"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {mensaje.text && (
        <div className={`p-4 rounded-lg ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mín. Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(prod => {
                const isLow = prod.cantidad <= prod.minimoStock;
                const total = prod.cantidad * prod.precioUnitario;

                return (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="text-gray-400 mr-3" size={20} />
                        <span className="text-sm font-medium text-gray-900">{prod.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={isLow ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>
                        {prod.cantidad}
                      </span>
                      {isLow && <span className="ml-2 text-xs text-red-600">(bajo)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${prod.precioUnitario.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.minimoStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${total.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openModalForEdit(prod)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB] bg-white"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad inicial *</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario ($) *</label>
                  <input
                    type="number"
                    name="precioUnitario"
                    value={formData.precioUnitario}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo de alerta *</label>
                <input
                  type="number"
                  name="minimoStock"
                  value={formData.minimoStock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5DFDCB] text-[#031D44] rounded-lg font-medium hover:bg-[#4be0b8]"
                >
                  {isEditMode ? 'Actualizar' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;