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
  FileEdit,
  FileText,
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';
import { generarNombreEventoCorto, getEventoEmoji } from '../utils/eventNames';
import api from '@shared/config/api';

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
    navigate('/login');
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Mi Evento',
      description: 'Información general'
    },
    { 
      path: '/solicitudes', 
      icon: FileEdit, 
      label: 'Solicitudes',
      description: 'Cambios y ajustes'
    },
    { 
      path: `/playlist/${user?.contrato_id}`, 
      icon: Music, 
      label: 'Playlist',
      description: 'Música del evento'
    },
    { 
      path: `/mesas/${user?.contrato_id}`, 
      icon: Users, 
      label: 'Mesas',
      description: 'Distribución de invitados'
    },
    { 
      path: '/ajustes', 
      icon: Settings, 
      label: 'Ajustes',
      description: 'Personalizar detalles'
    },
    { 
      path: '/chat', 
      icon: MessageCircle, 
      label: 'Chat',
      description: 'Habla con tu asesor'
    },
    { 
      path: '/contratos', 
      icon: FileText, 
      label: 'Mis Contratos',
      description: 'Ver documentos'
    },
  ];

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Título */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-xl">
                {contrato ? getEventoEmoji(contrato) : '🎉'}
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Party Venue
                </h1>
                <p className="text-xs text-gray-500">
                  {contrato ? generarNombreEventoCorto(contrato) : 'Portal del Cliente'}
                </p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.nombre_completo}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
              <Link
                to="/perfil"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Perfil"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Salir"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation Minimalista */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveLink(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${active ? 'text-white' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        <p className={`text-xs truncate ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default LayoutCliente;

