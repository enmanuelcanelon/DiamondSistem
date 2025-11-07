import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

// Pages - Gerente
import LoginGerente from './pages/LoginGerente';
import DashboardGerente from './pages/DashboardGerente';
import VendedoresGerente from './pages/VendedoresGerente';
import ContratosGerente from './pages/ContratosGerente';
import OfertasGerente from './pages/OfertasGerente';
import PagosGerente from './pages/PagosGerente';
import CalendarioGerente from './pages/CalendarioGerente';

// Layout
import LayoutGerente from './components/LayoutGerente';

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

// Protected Route Component (Gerentes)
const ProtectedRouteGerente = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'gerente') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Gerente Routes */}
          <Route path="/login" element={<LoginGerente />} />
          
          <Route
            path="/"
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
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
