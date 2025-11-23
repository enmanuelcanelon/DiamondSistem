import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';

const Header = ({ onNavigate, currentView }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    const handleNavigation = (view) => {
        if (onNavigate) {
            onNavigate(view);
        } else {
            // Mapear vistas a rutas
            const routeMap = {
                'dashboard': '/dashboard',
                'requests': '/solicitudes',
                'playlist': `/playlist/${user?.contrato_id}`,
                'tables': `/mesas/${user?.contrato_id}`,
                'settings': '/ajustes',
                'chat': '/chat',
                'contracts': '/contratos'
            };
            if (routeMap[view]) {
                navigate(routeMap[view]);
            }
        }
    };

    const getCurrentView = () => {
        if (location.pathname === '/dashboard') return 'dashboard';
        if (location.pathname.startsWith('/solicitudes')) return 'requests';
        if (location.pathname.startsWith('/playlist')) return 'playlist';
        if (location.pathname.startsWith('/mesas')) return 'tables';
        if (location.pathname === '/ajustes') return 'settings';
        if (location.pathname === '/chat') return 'chat';
        if (location.pathname === '/contratos') return 'contracts';
        return 'dashboard';
    };

    const currentViewState = currentView || getCurrentView();

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleNavigation('dashboard')}
                    >
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm">PV</div>
                        <span className="text-xl font-bold tracking-tighter text-white">Party Venue</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => handleNavigation('dashboard')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'dashboard' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Mi Evento
                        </button>
                        <button
                            onClick={() => handleNavigation('requests')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'requests' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Solicitudes
                        </button>
                        <button
                            onClick={() => handleNavigation('playlist')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'playlist' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Playlist
                        </button>
                        <button
                            onClick={() => handleNavigation('tables')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'tables' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Mesas
                        </button>
                        <button
                            onClick={() => handleNavigation('settings')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'settings' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Ajustes
                        </button>
                        <button
                            onClick={() => handleNavigation('chat')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'chat' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => handleNavigation('contracts')}
                            className={`text-sm font-medium transition-colors ${currentViewState === 'contracts' ? 'text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            Contratos
                        </button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right hidden lg:block">
                            <div className="text-sm font-medium text-white">{user?.nombre_completo || 'Usuario'}</div>
                            <div className="text-xs text-neutral-500">{user?.email || ''}</div>
                        </div>
                        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-white border border-white/10">
                            {user?.nombre_completo ? user.nombre_completo.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                    </div>
                    <button className="md:hidden text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

