'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package, DollarSign, ArrowUpDown } from 'lucide-react';

const Dashboard = () => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodSnap = await getDocs(query(collection(db, 'productos'), orderBy('nombre')));
        const prodList = prodSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          cantidad: Number(d.data().cantidad || 0),
          precioUnitario: Number(d.data().precioUnitario || 0),
        }));

        const movSnap = await getDocs(query(collection(db, 'movimientos'), orderBy('fecha', 'desc')));
        const movList = movSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          cantidad: Number(d.data().cantidad),
          valorTotal: Number(d.data().valorTotal),
          fecha: d.data().fecha?.toDate?.()
        }));

        setProductos(prodList);
        setMovimientos(movList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const movimientosHoy = movimientos.filter(m => {
    if (!m.fecha) return false;
    return m.fecha >= hoy;
  });

  const totalProductos = productos.length;

  const valorTotalInventario = productos.reduce((acc, p) => {
    return acc + (p.cantidad * p.precioUnitario);
  }, 0);

  const movimientosHoyCount = movimientosHoy.length;

  const stats = [
    {
      title: 'Total Productos',
      value: totalProductos,
      icon: Package,
      color: 'bg-cyan-500',
    },
    {
      title: 'Valor Total Inventario',
      value: `$${valorTotalInventario.toLocaleString('es-CO')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: 'Movimientos Hoy',
      value: movimientosHoyCount,
      icon: ArrowUpDown,
      color: 'bg-purple-500',
    },
  ];

  const recentMovements = movimientos.slice(0, 5);

  if (loading) {
    return <div className="p-10">Cargando...</div>;
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del inventario - {new Date().toLocaleDateString('es-CO')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Movimientos Recientes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {recentMovements.map(mov => (
                <tr key={mov.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {mov.productoNombre}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mov.tipo === 'entrada'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {mov.fecha ? mov.fecha.toLocaleDateString('es-CO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentMovements.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No hay movimientos aún
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;