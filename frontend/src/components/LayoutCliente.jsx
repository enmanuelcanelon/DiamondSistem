import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Music, 
  Users, 
  LogOut, 
  Calendar,
  DollarSign,
  Settings,
  MessageCircle,
  FileEdit
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/useAuthStore';
import { generarNombreEventoCorto, getEventoEmoji } from '../utils/eventNames';
import api from '../config/api';

function LayoutCliente() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Query para obtener información del contrato
  const { data: contrato } = useQuery({
    queryKey: ['contrato-layout', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}`);
      return response.data.contrato;
    },
    enabled: !!user?.contrato_id,
  });

  const handleLogout = () => {
    logout();
    navigate('/cliente/login');
  };

  const menuItems = [
    { 
      path: '/cliente/dashboard', 
      icon: Home, 
      label: 'Mi Evento',
      description: 'Información general'
    },
    { 
      path: '/cliente/solicitudes', 
      icon: FileEdit, 
      label: 'Solicitudes',
      description: 'Cambios y ajustes'
    },
    { 
      path: `/cliente/playlist/${user?.contrato_id}`, 
      icon: Music, 
      label: 'Playlist',
      description: 'Música del evento'
    },
    { 
      path: `/cliente/mesas/${user?.contrato_id}`, 
      icon: Users, 
      label: 'Mesas',
      description: 'Distribución de invitados'
    },
    { 
      path: '/cliente/ajustes', 
      icon: Settings, 
      label: 'Ajustes',
      description: 'Personalizar detalles'
    },
    { 
      path: '/cliente/chat', 
      icon: MessageCircle, 
      label: 'Chat',
      description: 'Habla con tu asesor'
    },
  ];

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-2xl">
                {contrato ? getEventoEmoji(contrato) : '🎉'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {contrato ? generarNombreEventoCorto(contrato) : 'Mi Evento'}
                </h1>
                <p className="text-xs text-gray-500 font-mono">
                  {user?.codigo_contrato || 'Portal del Cliente'}
                </p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.nombre_completo}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveLink(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                        active
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${active ? 'text-white' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        <p className={`text-xs ${active ? 'text-purple-100' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Info Card */}
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{contrato ? getEventoEmoji(contrato) : '🎉'}</span>
                  <p className="text-xs font-medium text-purple-900">
                    Tu Evento
                  </p>
                </div>
                <p className="text-sm font-bold text-purple-900">
                  {contrato ? generarNombreEventoCorto(contrato) : 'Mi Evento'}
                </p>
                <p className="text-xs text-purple-700 font-mono mt-1">
                  {user?.codigo_contrato}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2024 DiamondSistem. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LayoutCliente;

