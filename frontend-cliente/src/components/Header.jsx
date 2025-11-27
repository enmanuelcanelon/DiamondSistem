import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';

const Header = ({ onNavigate, currentView }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                setMobileMenuOpen(false);
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

    const navItems = [
        { view: 'dashboard', label: 'Mi Evento' },
        { view: 'requests', label: 'Solicitudes' },
        { view: 'playlist', label: 'Playlist' },
        { view: 'tables', label: 'Mesas' },
        { view: 'settings', label: 'Ajustes' },
        { view: 'chat', label: 'Chat' },
        { view: 'contracts', label: 'Contratos' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 lg:left-64 z-40 bg-black/50 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-2 cursor-pointer lg:hidden"
                        onClick={() => handleNavigation('dashboard')}
                    >
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm">PV</div>
                        <span className="text-xl font-bold tracking-tighter text-white">Party Venue</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {navItems.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => handleNavigation(item.view)}
                                className={`text-sm font-medium transition-colors ${currentViewState === item.view ? 'text-white' : 'text-neutral-400 hover:text-white'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Desktop User Info */}
                    <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right hidden xl:block">
                            <div className="text-sm font-medium text-white">{user?.nombre_completo || 'Usuario'}</div>
                            <div className="text-xs text-neutral-500">{user?.email || ''}</div>
                        </div>
                        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-white border border-white/10">
                            {user?.nombre_completo ? user.nombre_completo.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
                    <nav className="px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => handleNavigation(item.view)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentViewState === item.view
                                        ? 'bg-white/10 text-white'
                                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Mobile User Info */}
                    <div className="px-4 py-3 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium text-white border border-white/10">
                                {user?.nombre_completo ? user.nombre_completo.substring(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{user?.nombre_completo || 'Usuario'}</div>
                                <div className="text-xs text-neutral-500 truncate">{user?.email || ''}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
