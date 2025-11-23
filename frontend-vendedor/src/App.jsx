import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import RateLimitAlert from './components/RateLimitAlert';

// Pages - Vendedor (Lazy Loading para mejor rendimiento)
import { lazy, Suspense } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Dashboard se carga inmediatamente

// Páginas con lazy loading
const Clientes = lazy(() => import('./pages/Clientes'));
const CrearCliente = lazy(() => import('./pages/CrearCliente'));
const EditarCliente = lazy(() => import('./pages/EditarCliente'));
const Ofertas = lazy(() => import('./pages/Ofertas'));
const CrearOferta = lazy(() => import('./pages/CrearOferta'));
const Contratos = lazy(() => import('./pages/Contratos'));
const DetalleContrato = lazy(() => import('./pages/DetalleContrato'));
const AsignacionMesas = lazy(() => import('./pages/AsignacionMesas'));
const PlaylistMusical = lazy(() => import('./pages/PlaylistMusical'));
const GestionEventos = lazy(() => import('./pages/GestionEventos'));
const DetalleSolicitud = lazy(() => import('./pages/DetalleSolicitud'));
const ChatVendedor = lazy(() => import('./pages/ChatVendedor'));
const AjustesEventoVendedor = lazy(() => import('./pages/AjustesEventoVendedor'));
const CalendarioMensual = lazy(() => import('./pages/CalendarioMensual'));
const ComisionesVendedor = lazy(() => import('./pages/ComisionesVendedor'));
const Leaks = lazy(() => import('./pages/Leaks'));
const LeaksDisponibles = lazy(() => import('./pages/LeaksDisponibles'));
const LeaksMios = lazy(() => import('./pages/LeaksMios'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

// Componente de carga
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

// Pages - Cliente (ELIMINADAS - Ahora están en frontend-cliente)

// Pages - Manager (TEMPORALMENTE DESACTIVADO)
// import LoginManager from './pages/manager/LoginManager';
// import ChecklistManager from './pages/manager/ChecklistManager';
// import ResumenManager from './pages/manager/ResumenManager';

// Pages - Gerente (TEMPORALMENTE DESACTIVADO)
// import LoginGerente from './pages/gerente/LoginGerente';
// import DashboardGerente from './pages/gerente/DashboardGerente';
// import VendedoresGerente from './pages/gerente/VendedoresGerente';
// import ContratosGerente from './pages/gerente/ContratosGerente';
// import OfertasGerente from './pages/gerente/OfertasGerente';
// import PagosGerente from './pages/gerente/PagosGerente';
// import CalendarioGerente from './pages/gerente/CalendarioGerente';

// Layout
import Layout from './components/Layout';
// import LayoutManager from './components/LayoutManager';
// import LayoutGerente from './components/LayoutGerente';

// Create a client con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // staleTime: 5 minutos - los datos se consideran "frescos" durante este tiempo
      // Evita refetch innecesario cuando el usuario navega entre páginas
      staleTime: 5 * 60 * 1000, // 5 minutos en milisegundos
      // cacheTime: 10 minutos - tiempo que los datos permanecen en caché después de ser "viejos"
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    },
  },
});

// Función para pausar todas las queries cuando se detecta rate limiting
const pauseAllQueries = () => {
  queryClient.getQueryCache().getAll().forEach(query => {
    if (query.state.status === 'success' || query.state.status === 'error') {
      // Pausar refetchInterval temporalmente
      query.setOptions({
        refetchInterval: false,
        refetchIntervalInBackground: false,
      });
    }
  });
};

// Función para reanudar todas las queries
const resumeAllQueries = () => {
  // Las queries se reanudarán automáticamente cuando se actualicen sus opciones
  // o cuando se invaliden
};

// Protected Route Component (Vendedores)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si es cliente, no debería estar aquí (debe usar frontend-cliente en puerto 5174)
  if (user?.tipo === 'cliente') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Protected Route Component (Clientes) - ELIMINADO (ahora está en frontend-cliente)

// Protected Route Component (Managers) - TEMPORALMENTE DESACTIVADO
// const ProtectedRouteManager = ({ children }) => {
//   const { isAuthenticated, user } = useAuthStore();
//   
//   if (!isAuthenticated) {
//     return <Navigate to="/manager/login" replace />;
//   }
//   
//   if (user?.tipo !== 'manager') {
//     return <Navigate to="/manager/login" replace />;
//   }
//   
//   return children;
// };

// Protected Route Component (Gerentes) - TEMPORALMENTE DESACTIVADO
// const ProtectedRouteGerente = ({ children }) => {
//   const { isAuthenticated, user } = useAuthStore();
//   
//   if (!isAuthenticated) {
//     return <Navigate to="/gerente/login" replace />;
//   }
//   
//   if (user?.tipo !== 'gerente') {
//     return <Navigate to="/gerente/login" replace />;
//   }
//   
//   return children;
// };

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <RateLimitAlert />
      <Router>
        <Routes>
          {/* Vendedor Routes */}
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Suspense fallback={<PageLoader />}><Clientes /></Suspense>} />
            <Route path="clientes/nuevo" element={<Suspense fallback={<PageLoader />}><CrearCliente /></Suspense>} />
            <Route path="clientes/editar/:id" element={<Suspense fallback={<PageLoader />}><EditarCliente /></Suspense>} />
            <Route path="ofertas" element={<Suspense fallback={<PageLoader />}><Ofertas /></Suspense>} />
            <Route path="ofertas/nueva" element={<Suspense fallback={<PageLoader />}><CrearOferta /></Suspense>} />
            <Route path="contratos" element={<Suspense fallback={<PageLoader />}><Contratos /></Suspense>} />
            <Route path="contratos/:id" element={<Suspense fallback={<PageLoader />}><DetalleContrato /></Suspense>} />
            <Route path="contratos/:id/mesas" element={<Suspense fallback={<PageLoader />}><AsignacionMesas /></Suspense>} />
            <Route path="contratos/:id/playlist" element={<Suspense fallback={<PageLoader />}><PlaylistMusical /></Suspense>} />
            <Route path="eventos" element={<Suspense fallback={<PageLoader />}><GestionEventos /></Suspense>} />
            <Route path="calendario" element={<Suspense fallback={<PageLoader />}><CalendarioMensual /></Suspense>} />
            <Route path="comisiones" element={<Suspense fallback={<PageLoader />}><ComisionesVendedor /></Suspense>} />
            <Route path="leaks" element={<Suspense fallback={<PageLoader />}><Leaks /></Suspense>} />
            <Route path="leaks/disponibles" element={<Suspense fallback={<PageLoader />}><LeaksDisponibles /></Suspense>} />
            <Route path="leaks/misleaks" element={<Suspense fallback={<PageLoader />}><LeaksMios /></Suspense>} />
            <Route path="configuracion" element={<Suspense fallback={<PageLoader />}><Configuracion /></Suspense>} />
            <Route path="solicitudes/:id" element={<Suspense fallback={<PageLoader />}><DetalleSolicitud /></Suspense>} />
            <Route path="chat/:contratoId" element={<Suspense fallback={<PageLoader />}><ChatVendedor /></Suspense>} />
            <Route path="ajustes/:contratoId" element={<Suspense fallback={<PageLoader />}><AjustesEventoVendedor /></Suspense>} />
          </Route>

          {/* Cliente Routes - ELIMINADAS (ahora están en frontend-cliente en puerto 5174) */}

          {/* Manager Routes - TEMPORALMENTE DESACTIVADO */}
          {/* <Route path="/manager/login" element={<LoginManager />} />
          
          <Route
            path="/manager"
            element={
              <ProtectedRouteManager>
                <LayoutManager />
              </ProtectedRouteManager>
            }
          >
            <Route index element={<ChecklistManager />} />
            <Route path="resumen" element={<ResumenManager />} />
          </Route> */}

          {/* Gerente Routes - TEMPORALMENTE DESACTIVADO */}
          {/* <Route path="/gerente/login" element={<LoginGerente />} />
          
          <Route
            path="/gerente"
            element={
              <ProtectedRouteGerente>
                <LayoutGerente />
              </ProtectedRouteGerente>
            }
          >
            <Route index element={<DashboardGerente />} />
            <Route path="vendedores" element={<VendedoresGerente />} />
            <Route path="contratos" element={<ContratosGerente />} />
            <Route path="ofertas" element={<OfertasGerente />} />
            <Route path="pagos" element={<PagosGerente />} />
            <Route path="calendario" element={<CalendarioGerente />} />
          </Route> */}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
