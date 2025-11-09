import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '@shared/store/useAuthStore';

// Pages - Inventario
import LoginInventario from './pages/LoginInventario';
import DashboardInventario from './pages/DashboardInventario';
import AsignacionesInventario from './pages/AsignacionesInventario';
import SalonInventario from './pages/SalonInventario';

// Layout
import LayoutInventario from './components/LayoutInventario';

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

// Protected Route Component (Inventario)
const ProtectedRouteInventario = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'inventario') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Inventario Routes */}
          <Route path="/login" element={<LoginInventario />} />
          
          <Route
            path="/"
            element={
              <ProtectedRouteInventario>
                <LayoutInventario />
              </ProtectedRouteInventario>
            }
          >
            <Route index element={<DashboardInventario />} />
            <Route path="asignaciones" element={<AsignacionesInventario />} />
            <Route path=":salonNombre" element={<SalonInventario />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;

