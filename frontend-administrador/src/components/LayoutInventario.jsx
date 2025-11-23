import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  LogOut,
  Menu,
  X,
  Home,
  Building2,
  History,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '@shared/store/useAuthStore';
import { cn } from '@/lib/utils';

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
    { name: 'Central', href: '/', icon: Home },
    { name: 'Salones', href: '/asignaciones', icon: Building2 },
    { name: 'Historial', href: '/movimientos', icon: History },
    { name: 'Pagos', href: '/pagos', icon: DollarSign },
    { name: 'Comisiones', href: '/comisiones', icon: CreditCard },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card border-r">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <Package className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">Administración</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-2 rounded-lg hover:bg-muted transition"
              >
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
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition",
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition"
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
        <div className="flex flex-col flex-grow bg-card border-r">
          <div className="flex items-center h-16 px-4 border-b">
            <Package className="w-8 h-8 text-primary" />
            <span className="ml-2 text-xl font-bold">Administración</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition",
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="mb-3 px-3 py-2">
              <p className="text-sm font-medium">{user?.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">{user?.codigo_usuario}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition"
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
        <div className="sticky top-0 z-10 flex h-16 bg-card border-b lg:static">
          <button
            type="button"
            className="px-4 text-muted-foreground hover:text-foreground lg:hidden transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 items-center">
            <h1 className="text-lg font-semibold">Sistema de Administración</h1>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-muted-foreground">
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

