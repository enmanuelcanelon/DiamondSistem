import axios from 'axios';

// URL base del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sistema de Circuit Breaker para Rate Limiting con tracking de requests
class RateLimitCircuitBreaker {
  constructor() {
    this.isOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.resetTimeout = null;
    this.pendingRequests = [];
    this.requestQueue = [];
    this.processingQueue = false;
    
    // Tracking de requests para detectar cuando se está cerca del límite
    this.requestCount = 0;
    this.requestWindowStart = Date.now();
    this.requestWindowMs = 60 * 1000; // 1 minuto (ventana del rate limit)
    this.maxRequests = 500; // Límite real del backend
    this.warningThreshold = 200; // Umbral de advertencia (40% de 500) - MUY temprano
    this.blockThreshold = 250; // Umbral de bloqueo preventivo (50% de 500) - MUY temprano para seguridad máxima
    this.isPaused = false; // Estado de pausa preventiva
    this.pauseTimeout = null;
    this.listeners = []; // Listeners para cambios de estado
    this.activeRequests = new Map(); // Mapa de requests activas para poder cancelarlas
    this.abortController = null; // AbortController para cancelar requests
  }

  // Agregar listener para cambios de estado
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notificar a los listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getState()));
  }

  // Obtener estado actual
  getState() {
    const now = Date.now();
    const timeSinceWindowStart = now - this.requestWindowStart;
    
    // Resetear ventana si ha pasado más de 1 minuto
    if (timeSinceWindowStart > this.requestWindowMs) {
      this.resetWindow();
    }

    const timeRemaining = Math.max(0, this.requestWindowMs - timeSinceWindowStart);
    const isNearLimit = this.requestCount >= this.warningThreshold;
    const shouldBlock = this.requestCount >= this.blockThreshold;
    const percentage = Math.min(100, (this.requestCount / this.maxRequests) * 100);

    return {
      isOpen: this.isOpen,
      isPaused: this.isPaused,
      isNearLimit,
      shouldBlock,
      requestCount: this.requestCount,
      maxRequests: this.maxRequests,
      warningThreshold: this.warningThreshold,
      blockThreshold: this.blockThreshold,
      timeRemaining,
      percentage,
      lastFailureTime: this.lastFailureTime,
      failureCount: this.failureCount
    };
  }

  // Registrar una request (llamado ANTES de enviar la request)
  recordRequest() {
    const now = Date.now();
    const timeSinceWindowStart = now - this.requestWindowStart;
    
    // Resetear ventana si ha pasado más de 1 minuto
    if (timeSinceWindowStart > this.requestWindowMs) {
      this.resetWindow();
    }

    // Verificar ANTES de incrementar si debemos bloquear
    // Si ya estamos en el umbral de bloqueo, NO incrementar y bloquear
    if (this.requestCount >= this.blockThreshold && !this.isPaused && !this.isOpen) {
      this.pausePreventively();
      return false; // Indicar que se debe bloquear
    }

    this.requestCount++;
    
    // Si se alcanza el umbral de bloqueo después de incrementar, pausar preventivamente
    if (this.requestCount >= this.blockThreshold && !this.isPaused && !this.isOpen) {
      this.pausePreventively();
    }
    
    this.notifyListeners();
    return true; // Request permitida
  }

  // Pausar preventivamente cuando se está cerca del límite
  pausePreventively() {
    if (this.isPaused || this.isOpen) return;
    
    this.isPaused = true;
    console.warn(`⏸️ Pausa preventiva activada: ${this.requestCount}/${this.maxRequests} requests en la última ventana`);
    
    // Cancelar TODAS las requests activas
    this.cancelAllActiveRequests();
    
    this.notifyListeners();
    
    // Calcular tiempo restante hasta que se resetee la ventana
    const timeSinceWindowStart = Date.now() - this.requestWindowStart;
    const timeRemaining = Math.max(0, this.requestWindowMs - timeSinceWindowStart);
    
    // Reanudar cuando se resetee la ventana
    this.pauseTimeout = setTimeout(() => {
      this.isPaused = false;
      this.pauseTimeout = null;
      console.info('▶️ Pausa preventiva desactivada: ventana reseteada');
      this.notifyListeners();
    }, timeRemaining);
  }

  // Cancelar todas las requests activas
  cancelAllActiveRequests() {
    // Crear nuevo AbortController para cancelar requests
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    
    // Cancelar todas las requests en el mapa
    this.activeRequests.forEach((requestId, config) => {
      if (config.signal) {
        config.signal.abort();
      }
    });
    
    this.activeRequests.clear();
    console.warn('🚫 Todas las requests activas han sido canceladas');
  }

  // Abrir el circuit breaker (pausar todas las requests)
  open() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.lastFailureTime = Date.now();
      console.warn('🚦 Circuit Breaker: Rate limit detectado, pausando requests...');
      
      // Cancelar TODAS las requests activas
      this.cancelAllActiveRequests();
      
      this.notifyListeners();
      
      // Resetear después de 30 segundos
      this.resetTimeout = setTimeout(() => {
        this.close();
      }, 30000);
    }
  }

  // Cerrar el circuit breaker (reanudar requests)
  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.failureCount = 0;
      this.lastFailureTime = null;
      // NO resetear requestCount aquí - dejar que se resetee naturalmente con la ventana
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
        this.resetTimeout = null;
      }
      console.info('✅ Circuit Breaker: Rate limit resuelto, reanudando requests...');
      this.notifyListeners();
      
      // Procesar cola de requests pendientes
      this.processQueue();
    }
  }

  // Resetear ventana y pausa (llamado cuando la ventana se resetea naturalmente)
  resetWindow() {
    const wasPaused = this.isPaused;
    this.requestCount = 0;
    this.requestWindowStart = Date.now();
    this.isPaused = false;
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    if (wasPaused) {
      console.info('✅ Ventana reseteada: pausa preventiva desactivada');
      this.notifyListeners();
    }
  }

  // Verificar si el circuit breaker está abierto o si se está cerca del límite
  shouldBlock() {
    // Si está abierto, bloquear SIEMPRE
    if (this.isOpen) {
      // Si han pasado más de 30 segundos desde el último error, intentar cerrar
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > 30000) {
        this.close();
        return false;
      }
      return true; // BLOQUEAR TODO
    }
    
    // Si está en pausa preventiva, bloquear SIEMPRE
    if (this.isPaused) {
      return true; // BLOQUEAR TODO
    }
    
    // Verificar estado actual (sin resetear ventana aquí para evitar loops)
    const now = Date.now();
    const timeSinceWindowStart = now - this.requestWindowStart;
    
    // Si la ventana se reseteó, no bloquear
    if (timeSinceWindowStart > this.requestWindowMs) {
      this.resetWindow();
      return false;
    }
    
    const shouldBlock = this.requestCount >= this.blockThreshold;
    
    // Si se está cerca del límite (50% o más), bloquear preventivamente
    if (shouldBlock && !this.isPaused && !this.isOpen) {
      this.pausePreventively();
      return true; // BLOQUEAR TODO
    }
    
    return false;
  }

  // Agregar request a la cola
  enqueue(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, resolve, reject });
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  // Procesar cola de requests
  async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.requestQueue.length > 0 && !this.shouldBlock()) {
      const { request, resolve, reject } = this.requestQueue.shift();
      
      try {
        const response = await request();
        resolve(response);
        // Pequeño delay entre requests para evitar saturar
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        reject(error);
      }
    }
    
    this.processingQueue = false;
  }

  // Registrar un error 429
  record429Error() {
    this.failureCount++;
    if (this.failureCount >= 2) {
      this.open();
    }
  }

  // Registrar un éxito (resetear contador)
  recordSuccess() {
    if (this.failureCount > 0) {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }
}

// Instancia global del circuit breaker
const circuitBreaker = new RateLimitCircuitBreaker();

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    // PRIMERO: Verificar si debemos bloquear (ANTES de hacer cualquier cosa)
    if (circuitBreaker.shouldBlock()) {
      const rateLimitError = new Error('Rate limit activo. El sistema se pausará automáticamente.');
      rateLimitError.isRateLimit = true;
      rateLimitError.config = config;
      return Promise.reject(rateLimitError);
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Crear AbortController para esta request si no existe
    if (!config.signal && circuitBreaker.abortController) {
      config.signal = circuitBreaker.abortController.signal;
    }

    // Registrar la request para tracking (esto puede activar la pausa preventiva)
    const requestAllowed = circuitBreaker.recordRequest();
    
    // Verificar NUEVAMENTE después de registrar (por si se activó la pausa)
    if (!requestAllowed || circuitBreaker.shouldBlock()) {
      const rateLimitError = new Error('Rate limit activo. El sistema se pausará automáticamente.');
      rateLimitError.isRateLimit = true;
      rateLimitError.config = config;
      return Promise.reject(rateLimitError);
    }

    // Registrar esta request como activa
    const requestId = Date.now() + Math.random();
    circuitBreaker.activeRequests.set(config, requestId);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    // Remover request del mapa de activas
    if (response.config) {
      circuitBreaker.activeRequests.delete(response.config);
    }
    
    // Registrar éxito en el circuit breaker
    circuitBreaker.recordSuccess();
    return response;
  },
  async (error) => {
    // Remover request del mapa de activas (si existe)
    if (error.config) {
      circuitBreaker.activeRequests.delete(error.config);
    }

    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 429 || error.name === 'AbortError') {
      // Rate limit detectado o request cancelada - abrir circuit breaker
      if (error.response?.status === 429) {
        circuitBreaker.record429Error();
        circuitBreaker.open();
      }
      
      // Si hay un retry-after header, usarlo
      const retryAfter = error.response?.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      // Retornar un error especial que React Query puede manejar
      const rateLimitError = new Error('Rate limit excedido. Por favor espera un momento.');
      rateLimitError.isRateLimit = true;
      rateLimitError.retryAfter = delay;
      
      return Promise.reject(rateLimitError);
    }
    return Promise.reject(error);
  }
);

// Exportar circuit breaker para uso externo si es necesario
export { circuitBreaker };

export default api;



