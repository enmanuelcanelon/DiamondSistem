import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Optimización: Remover StrictMode en producción para mejor rendimiento
const root = createRoot(document.getElementById('root'))

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
