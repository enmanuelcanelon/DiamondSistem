import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  LogOut,
  Menu,
  X,
  Home,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '@shared/store/useAuthStore';

function LayoutInventario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventario por Salones', href: '/asignaciones', icon: Building2 },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Inventario</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <Package className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Inventario</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{user?.nombre_completo}</p>
              <p className="text-xs text-gray-500">{user?.codigo_usuario}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200 lg:static">
          <button
            type="button"
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 items-center">
            <h1 className="text-lg font-semibold text-gray-900">Sistema de Inventario</h1>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-600">
                {user?.nombre_completo}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutInventario;

