import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@shared/store/useAuthStore';

// Pages - Manager
import LoginManager from './pages/LoginManager';
import ChecklistManager from './pages/ChecklistManager';

// Layout
import LayoutManager from './components/LayoutManager';

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

// Protected Route Component (Managers)
const ProtectedRouteManager = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.tipo !== 'manager') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Manager Routes */}
          <Route path="/login" element={<LoginManager />} />
          
          <Route
            path="/"
            element={
              <ProtectedRouteManager>
                <LayoutManager />
              </ProtectedRouteManager>
            }
          >
            <Route index element={<ChecklistManager />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
