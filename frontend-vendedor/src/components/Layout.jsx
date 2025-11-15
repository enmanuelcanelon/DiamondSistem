import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Diamond, 
  LayoutDashboard, 
  Users, 
  FileText, 
  FileCheck,
  LogOut,
  Menu,
  X,
  Calendar,
  CalendarCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Button } from './ui/button';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = {
    principal: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Ofertas', href: '/ofertas', icon: FileText },
      { name: 'Contratos', href: '/contratos', icon: FileCheck },
    ],
    eventos: [
      { name: 'Calendario', href: '/calendario', icon: Calendar },
      { name: 'Gestión de Eventos', href: '/eventos', icon: CalendarCheck },
    ],
    finanzas: [
      { name: 'Comisiones', href: '/comisiones', icon: CreditCard },
    ],
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-background border-r">
            <div className="flex h-16 items-center gap-3 px-6 border-b">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Diamond className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Party Venue</span>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="ml-auto p-2 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {/* Sección Principal */}
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Principal
                  </h2>
                </div>
                {navigation.principal.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sección Eventos */}
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Eventos
                  </h2>
                </div>
                {navigation.eventos.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sección Finanzas */}
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Finanzas
                  </h2>
                </div>
                {navigation.finanzas.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.codigo_vendedor}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-1 border-r bg-background relative">
          {/* Logo y nombre */}
          <div className={`flex h-16 items-center gap-3 border-b transition-all duration-300 ${sidebarCollapsed ? 'px-3 justify-center' : 'px-6'}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Diamond className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-foreground whitespace-nowrap">Party Venue</span>
            )}
          </div>
          
          {/* Botón para colapsar/expandir */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent"
            title={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          
          {/* Navegación con secciones */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {/* Sección Principal */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Principal
                  </h2>
                </div>
              )}
              {navigation.principal.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    title={sidebarCollapsed ? item.name : ''}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                      sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>

            {/* Sección Eventos */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Eventos
                  </h2>
                </div>
              )}
              {navigation.eventos.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    title={sidebarCollapsed ? item.name : ''}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                      sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>

            {/* Sección Finanzas */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Finanzas
                  </h2>
                </div>
              )}
              {navigation.finanzas.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    title={sidebarCollapsed ? item.name : ''}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
                      sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </button>
                );
              })}
            </div>
          </nav>
          
          {/* Usuario y logout */}
          <div className={`border-t transition-all duration-300 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {user?.nombre_completo?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.codigo_vendedor}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Header móvil */}
        <div className="sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-lg font-semibold text-gray-900">Party Venue</span>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;


