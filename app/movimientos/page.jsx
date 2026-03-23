'use client';
import { useState, useEffect } from 'react';
import { 
  collection, getDocs, addDoc, doc, updateDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Plus, Search, ArrowUpCircle, ArrowDownCircle, Package, X   // ← agrega X aquí
} from 'lucide-react';

const Movimientos = () => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('entrada');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: '',
    motivo: '',
    responsable: '',
  });

  // Cargar productos y movimientos
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Productos
        const prodQuery = query(collection(db, 'productos'), orderBy('nombre'));
        const prodSnap = await getDocs(prodQuery);
        const prodList = prodSnap.docs.map(d => ({
          id: d.id,
          nombre: d.data().nombre,
          cantidad: Number(d.data().cantidad || 0),
          precioUnitario: Number(d.data().precioUnitario || 0),
        }));
        setProductos(prodList);

        // Movimientos (últimos 50 por ahora)
        const movQuery = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'));
        const movSnap = await getDocs(movQuery);
        const movList = movSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          cantidad: Number(d.data().cantidad),
          valorTotal: Number(d.data().valorTotal),
        }));
        setMovimientos(movList);
      } catch (err) {
        console.error(err);
        setMensaje({ text: 'Error al cargar datos', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? Number(value) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ text: '', type: '' });

    if (!formData.productoId) {
      setMensaje({ text: 'Selecciona un producto', type: 'error' });
      return;
    }
    if (!formData.cantidad || formData.cantidad <= 0) {
      setMensaje({ text: 'Ingresa una cantidad válida', type: 'error' });
      return;
    }

    const selectedProd = productos.find(p => p.id === formData.productoId);
    if (!selectedProd) return;

    // Validar stock para salida
    if (tipo === 'salida' && selectedProd.cantidad < formData.cantidad) {
      setMensaje({ text: 'No hay suficiente stock disponible', type: 'error' });
      return;
    }

    try {
      const valorUnit = selectedProd.precioUnitario || 0;
      const valorTot = formData.cantidad * valorUnit;
      const signo = tipo === 'entrada' ? 1 : -1;
      const nuevaCantidad = selectedProd.cantidad + (signo * formData.cantidad);

      // 1. Actualizar stock del producto
      const prodRef = doc(db, 'productos', formData.productoId);
      await updateDoc(prodRef, { cantidad: nuevaCantidad });

      // 2. Guardar movimiento
      await addDoc(collection(db, 'movimientos'), {
        productoId: formData.productoId,
        productoNombre: selectedProd.nombre,
        tipo,
        cantidad: formData.cantidad,
        motivo: formData.motivo.trim(),
        responsable: formData.responsable.trim(),
        valorUnitario: valorUnit,
        valorTotal: valorTot * signo, 
        fecha: serverTimestamp(),
      });

      setMensaje({ text: `Movimiento registrado correctamente (${tipo})`, type: 'success' });

      // Recargar datos
      const prodSnap = await getDocs(query(collection(db, 'productos'), orderBy('nombre')));
      const updatedProds = prodSnap.docs.map(d => ({
        id: d.id,
        nombre: d.data().nombre,
        cantidad: Number(d.data().cantidad || 0),
        precioUnitario: Number(d.data().precioUnitario || 0),
      }));
      setProductos(updatedProds);

      const movSnap = await getDocs(query(collection(db, 'movimientos'), orderBy('fecha', 'desc')));
      const updatedMovs = movSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        cantidad: Number(d.data().cantidad),
        valorTotal: Number(d.data().valorTotal),
      }));
      setMovimientos(updatedMovs);

      // Limpiar
      setFormData({ productoId: '', cantidad: '', motivo: '', responsable: '' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setMensaje({ text: 'Error al registrar el movimiento', type: 'error' });
    }
  };

  const filteredMov = movimientos.filter(m =>
    (m.productoNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.motivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.responsable || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const movHoy = movimientos.filter(m => {
  if (!m.fecha?.toDate) return false;
  const fecha = m.fecha.toDate();
  return fecha >= hoy;
});

const entradasHoy = movHoy
  .filter(m => m.tipo === 'entrada')
  .reduce((acc, m) => acc + m.valorTotal, 0);

const salidasHoy = movHoy
  .filter(m => m.tipo === 'salida')
  .reduce((acc, m) => acc + Math.abs(m.valorTotal), 0);

const saldoHoy = entradasHoy - salidasHoy;

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
          <h1 className="text-3xl font-bold text-gray-900">Entradas y Salidas</h1>
          <p className="text-gray-600 mt-1">Registro y seguimiento de movimientos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#5DFDCB] text-[#031D44] px-6 py-3 rounded-lg font-medium hover:bg-[#4be0b8] transition shadow-sm"
        >
          <Plus size={20} />
          Registrar Movimiento
        </button>
      </div>

      {mensaje.text && (
        <div className={`p-4 rounded-lg ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Cajas*/}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Entradas Hoy</h3>
            <ArrowUpCircle className="text-green-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${entradasHoy.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Salidas Hoy</h3>
            <ArrowDownCircle className="text-red-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-red-600">
            ${salidasHoy.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Saldo Neto Hoy</h3>
            <Package className="text-[#5DFDCB]" size={28} />
          </div>
          <p className="text-3xl font-bold text-[#031D44]">
            ${saldoHoy.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por producto, motivo o responsable..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha / Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMov.map(mov => (
                <tr key={mov.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mov.fecha?.toDate ? mov.fecha.toDate().toLocaleString('es-CO') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mov.productoNombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.motivo || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.responsable || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={mov.valorTotal > 0 ? 'text-green-600' : 'text-red-600'}>
                      {mov.valorTotal > 0 ? '+' : ''}${Math.abs(mov.valorTotal).toLocaleString('es-CO')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMov.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No hay movimientos registrados aún
          </div>
        )}
      </div>

      {/* Modal de registro */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Registrar Movimiento</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200 flex gap-4">
              <button
                onClick={() => setTipo('entrada')}
                className={`flex-1 py-3 rounded-lg font-medium ${tipo === 'entrada' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Entrada
              </button>
              <button
                onClick={() => setTipo('salida')}
                className={`flex-1 py-3 rounded-lg font-medium ${tipo === 'salida' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Salida
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <select
                  name="productoId"
                  value={formData.productoId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB] bg-white"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (stock actual: {p.cantidad})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observación *</label>
                <input
                  type="text"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Entrega a 6° grado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable *</label>
                <input
                  type="text"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del profesor o persona"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg font-medium text-white ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Registrar {tipo === 'entrada' ? 'Entrada' : 'Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;