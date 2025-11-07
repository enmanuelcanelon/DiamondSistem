import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

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

// Layout
import Layout from './components/Layout';

// Create a client con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

// Protected Route Component (Vendedores)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'vendedor') {
    return <Navigate to="/login" replace />;
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

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

// Layout
import Layout from './components/Layout';

// Create a client con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

// Protected Route Component (Vendedores)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'vendedor') {
    return <Navigate to="/login" replace />;
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

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

// Layout
import Layout from './components/Layout';

// Create a client con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

// Protected Route Component (Vendedores)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'vendedor') {
    return <Navigate to="/login" replace />;
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;













