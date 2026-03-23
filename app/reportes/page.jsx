'use client';
import { useState, useEffect } from 'react';
import { 
  collection, getDocs, query, orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, ArrowUpDown, DollarSign } from 'lucide-react';

const Reportes = () => {
  const [dateRange, setDateRange] = useState('mes-actual');
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const movQuery = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'));
        const snap = await getDocs(movQuery);

        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          cantidad: Number(d.data().cantidad),
          valorTotal: Number(d.data().valorTotal),
          fecha: d.data().fecha?.toDate?.()
        }));

        setMovimientos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  const ahora = new Date();

  const filtrados = movimientos.filter(m => {
    if (!m.fecha) return false;

    if (dateRange === 'mes-actual') {
      return m.fecha.getMonth() === ahora.getMonth() &&
             m.fecha.getFullYear() === ahora.getFullYear();
    }

    if (dateRange === 'ultimos-3-meses') {
      const hace3 = new Date();
      hace3.setMonth(hace3.getMonth() - 3);
      return m.fecha >= hace3;
    }

    if (dateRange === 'ultimo-ano') {
      const hace1 = new Date();
      hace1.setFullYear(hace1.getFullYear() - 1);
      return m.fecha >= hace1;
    }

    return true;
  });

  const entradasTotales = filtrados
    .filter(m => m.tipo === 'entrada')
    .reduce((acc, m) => acc + m.cantidad, 0);

  const salidasTotales = filtrados
    .filter(m => m.tipo === 'salida')
    .reduce((acc, m) => acc + m.cantidad, 0);

  const valorMovido = filtrados
    .reduce((acc, m) => acc + Math.abs(m.valorTotal), 0);

  const productosMap = {};

  filtrados.forEach(m => {
    if (!productosMap[m.productoNombre]) {
      productosMap[m.productoNombre] = {
        producto: m.productoNombre,
        entradas: 0,
        salidas: 0
      };
    }

    if (m.tipo === 'entrada') {
      productosMap[m.productoNombre].entradas += m.cantidad;
    } else {
      productosMap[m.productoNombre].salidas += m.cantidad;
    }
  });

  const topProductos = Object.values(productosMap)
    .map(p => ({
      ...p,
      saldo: p.entradas - p.salidas
    }))
    .sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas))
    .slice(0, 5);

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const movimientosPorMesMap = {};

  filtrados.forEach(m => {
    const mesIndex = m.fecha.getMonth();
    const mes = meses[mesIndex];

    if (!movimientosPorMesMap[mes]) {
      movimientosPorMesMap[mes] = { mes, entradas: 0, salidas: 0 };
    }

    if (m.tipo === 'entrada') {
      movimientosPorMesMap[mes].entradas += m.cantidad;
    } else {
      movimientosPorMesMap[mes].salidas += m.cantidad;
    }
  });

  const movimientosPorMes = Object.values(movimientosPorMesMap);

  if (loading) {
    return <div className="p-10">Cargando...</div>;
  }

  const summaryCards = [
    { title: 'Entradas Totales', value: entradasTotales, icon: ArrowUpDown, color: 'bg-green-500' },
    { title: 'Salidas Totales', value: salidasTotales, icon: ArrowUpDown, color: 'bg-red-500' },
    { title: 'Valor Movido', value: `$${valorMovido.toLocaleString('es-CO')}`, icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Producto Más Movido', value: topProductos[0]?.producto || '—', icon: TrendingUp, color: 'bg-[#5DFDCB]' },
  ];

  return (
    <div className="space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y estadísticas del inventario</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5DFDCB]"
            >
              <option value="mes-actual">Mes actual</option>
              <option value="ultimos-3-meses">Últimos 3 meses</option>
              <option value="ultimo-ano">Último año</option>
              <option value="todo">Todo</option>
            </select>
          </div>

          <button className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-md border p-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow-md border p-6">
          <h2 className="text-xl font-semibold mb-6">Movimientos por Mes</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={movimientosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entradas" fill="#5DFDCB" />
                <Bar dataKey="salidas" fill="#04395E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border p-6">
          <h2 className="text-xl font-semibold mb-6">Tendencia de Movimientos</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={movimientosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entradas" stroke="#5DFDCB" strokeWidth={2} />
                <Line type="monotone" dataKey="salidas" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Top 5 Productos</h2>
        </div>

        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">Producto</th>
              <th className="px-6 py-3 text-left">Entradas</th>
              <th className="px-6 py-3 text-left">Salidas</th>
              <th className="px-6 py-3 text-left">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((p, i) => (
              <tr key={i}>
                <td className="px-6 py-4">{p.producto}</td>
                <td className="px-6 py-4 text-green-600">{p.entradas}</td>
                <td className="px-6 py-4 text-red-600">{p.salidas}</td>
                <td className="px-6 py-4">{p.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Reportes;