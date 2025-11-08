import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/useAuthStore';

// Pages - Vendedor
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import CrearCliente from './pages/CrearCliente';
import EditarCliente from './pages/EditarCliente';
import Ofertas from './pages/Ofertas';
import CrearOferta from './pages/CrearOferta';
import EditarOferta from './pages/EditarOferta';
import Contratos from './pages/Contratos';
import DetalleContrato from './pages/DetalleContrato';
import AsignacionMesas from './pages/AsignacionMesas';
import PlaylistMusical from './pages/PlaylistMusical';
import GestionEventos from './pages/GestionEventos';
import DetalleSolicitud from './pages/DetalleSolicitud';
import ChatVendedor from './pages/ChatVendedor';
import AjustesEventoVendedor from './pages/AjustesEventoVendedor';
import CalendarioMensual from './pages/CalendarioMensual';

// Pages - Cliente
import LoginCliente from './pages/cliente/LoginCliente';
import DashboardCliente from './pages/cliente/DashboardCliente';
import AjustesEvento from './pages/cliente/AjustesEvento';
import ChatCliente from './pages/cliente/ChatCliente';
import MisSolicitudes from './pages/cliente/MisSolicitudes';
import SolicitarCambios from './pages/cliente/SolicitarCambios';
import MisContratos from './pages/cliente/MisContratos';
import MiPerfil from './pages/cliente/MiPerfil';

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
import LayoutCliente from './components/LayoutCliente';
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

// Protected Route Component (Vendedores)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo === 'cliente') {
    return <Navigate to="/cliente/dashboard" replace />;
  }
  
  return children;
};

// Protected Route Component (Clientes)
const ProtectedRouteCliente = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/cliente/login" replace />;
  }
  
  if (user?.tipo !== 'cliente') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

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
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<CrearCliente />} />
            <Route path="clientes/editar/:id" element={<EditarCliente />} />
            <Route path="ofertas" element={<Ofertas />} />
            <Route path="ofertas/nueva" element={<CrearOferta />} />
            <Route path="ofertas/editar/:id" element={<EditarOferta />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="contratos/:id" element={<DetalleContrato />} />
            <Route path="contratos/:id/mesas" element={<AsignacionMesas />} />
            <Route path="contratos/:id/playlist" element={<PlaylistMusical />} />
            <Route path="eventos" element={<GestionEventos />} />
            <Route path="calendario" element={<CalendarioMensual />} />
            <Route path="solicitudes/:id" element={<DetalleSolicitud />} />
            <Route path="chat/:contratoId" element={<ChatVendedor />} />
            <Route path="ajustes/:contratoId" element={<AjustesEventoVendedor />} />
          </Route>

          {/* Cliente Routes */}
          <Route path="/cliente/login" element={<LoginCliente />} />
          
          <Route
            path="/cliente"
            element={
              <ProtectedRouteCliente>
                <LayoutCliente />
              </ProtectedRouteCliente>
            }
          >
            <Route path="dashboard" element={<DashboardCliente />} />
            <Route path="solicitudes" element={<MisSolicitudes />} />
            <Route path="solicitar-cambios" element={<SolicitarCambios />} />
            <Route path="versiones" element={<Navigate to="/cliente/contratos" replace />} />
            <Route path="playlist/:id" element={<PlaylistMusical />} />
            <Route path="mesas/:id" element={<AsignacionMesas />} />
            <Route path="ajustes" element={<AjustesEvento />} />
            <Route path="chat" element={<ChatCliente />} />
            <Route path="contratos" element={<MisContratos />} />
            <Route path="perfil" element={<MiPerfil />} />
          </Route>

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
