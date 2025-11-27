import React, { useState } from 'react';
import {
    Calendar,
    FileText,
    Music,
    LayoutGrid,
    Settings,
    MessageSquare,
    FileSignature,
    LogOut,
    X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            icon: Calendar,
            label: 'Mi Evento',
            path: '/dashboard',
            active: location.pathname === '/dashboard'
        },
        {
            icon: FileText,
            label: 'Solicitudes',
            path: '/solicitudes',
            active: location.pathname.startsWith('/solicitudes')
        },
        {
            icon: Music,
            label: 'Playlist',
            path: `/playlist/${user?.contrato_id}`,
            active: location.pathname.startsWith('/playlist')
        },
        {
            icon: LayoutGrid,
            label: 'Mesas',
            path: `/mesas/${user?.contrato_id}`,
            active: location.pathname.startsWith('/mesas')
        },
        {
            icon: Settings,
            label: 'Ajustes',
            divider: true,
            path: '/ajustes',
            active: location.pathname === '/ajustes'
        },
        {
            icon: MessageSquare,
            label: 'Chat',
            path: '/chat',
            active: location.pathname === '/chat'
        },
        {
            icon: FileSignature,
            label: 'Contratos',
            path: '/contratos',
            active: location.pathname === '/contratos'
        },
    ];

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false); // Close sidebar on mobile after navigation
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-[#111] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-50
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 lg:hidden text-white/60 hover:text-white"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm">
                            PV
                        </div>
                        <span className="font-semibold text-white">Party Venue</span>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item, index) => (
                            <React.Fragment key={item.label}>
                                {item.divider && <div className="h-px bg-white/10 my-4 mx-2" />}
                                <button
                                    onClick={() => handleNavigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.active
                                            ? 'bg-white/10 text-white font-medium'
                                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-white border border-white/10">
                            {user?.nombre_completo ? user.nombre_completo.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{user?.nombre_completo || 'Usuario'}</div>
                            <div className="text-xs text-neutral-500 truncate">{user?.email || ''}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors mt-2"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
