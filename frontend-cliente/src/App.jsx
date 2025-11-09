import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

// Pages - Cliente
import LoginCliente from './pages/LoginCliente';
import DashboardCliente from './pages/DashboardCliente';
import AjustesEvento from './pages/AjustesEvento';
import ChatCliente from './pages/ChatCliente';
import MisSolicitudes from './pages/MisSolicitudes';
import SolicitarCambios from './pages/SolicitarCambios';
import MisContratos from './pages/MisContratos';
import MiPerfil from './pages/MiPerfil';
import PlaylistMusical from './pages/PlaylistMusical';
import AsignacionMesas from './pages/AsignacionMesas';

// Layout
import LayoutCliente from './components/LayoutCliente';

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

// Protected Route Component (Clientes)
const ProtectedRouteCliente = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'cliente') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Cliente Routes */}
          <Route path="/login" element={<LoginCliente />} />
          
          <Route
            path="/"
            element={
              <ProtectedRouteCliente>
                <LayoutCliente />
              </ProtectedRouteCliente>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardCliente />} />
            <Route path="solicitudes" element={<MisSolicitudes />} />
            <Route path="solicitar-cambios" element={<SolicitarCambios />} />
            <Route path="playlist/:id" element={<PlaylistMusical />} />
            <Route path="mesas/:id" element={<AsignacionMesas />} />
            <Route path="ajustes" element={<AjustesEvento />} />
            <Route path="chat" element={<ChatCliente />} />
            <Route path="contratos" element={<MisContratos />} />
            <Route path="perfil" element={<MiPerfil />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;






