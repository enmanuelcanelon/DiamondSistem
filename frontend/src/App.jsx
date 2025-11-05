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

// Pages - Manager
import LoginManager from './pages/manager/LoginManager';
import ChecklistManager from './pages/manager/ChecklistManager';
import ResumenManager from './pages/manager/ResumenManager';

// Layout
import Layout from './components/Layout';
import LayoutCliente from './components/LayoutCliente';
import LayoutManager from './components/LayoutManager';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
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

// Protected Route Component (Managers)
const ProtectedRouteManager = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/manager/login" replace />;
  }
  
  if (user?.tipo !== 'manager') {
    return <Navigate to="/manager/login" replace />;
  }
  
  return children;
};

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

          {/* Manager Routes */}
          <Route path="/manager/login" element={<LoginManager />} />
          
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
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
