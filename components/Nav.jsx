'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ArrowUpDown, BarChart3, Users, Settings, LogOut } from 'lucide-react';

const Nav = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Inventario', icon: Package, href: '/inventario' },
    { label: 'Entradas y Salidas', icon: ArrowUpDown, href: '/movimientos' },
    { label: 'Reportes', icon: BarChart3, href: '/reportes' },
    { label: 'Usuarios', icon: Users, href: '/usuarios' },
  ];

  const bottomItems = [
    { label: 'Configuración', icon: Settings, href: '/configuracion' },
    { label: 'Cerrar sesión', icon: LogOut, href: '#' },
  ];

  return (
    <aside className="w-64 h-full bg-[#031D44] text-white flex flex-col border-r border-[#04395E]">
      <div className="p-6 border-b border-[#04395E]">
        <h1 className="text-2xl font-bold text-[#5DFDCB]">FS Inventario</h1>
        <p className="text-xs text-gray-400">Colegio Prueba</p>
      </div>

      <nav className="flex-1 px-3 py-6">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center px-4 py-3 rounded-lg mb-1 transition ${
                isActive 
                  ? 'bg-[#5DFDCB] text-[#031D44] font-medium' 
                  : 'hover:bg-[#04395E]'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#04395E]">
        {bottomItems.map(item => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className="flex items-center px-4 py-3 rounded-lg mb-1 hover:bg-[#04395E] transition"
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Nav;