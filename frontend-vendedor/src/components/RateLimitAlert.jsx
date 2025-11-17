import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { circuitBreaker } from '../config/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

function RateLimitAlert() {
  const queryClient = useQueryClient();
  const [state, setState] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Obtener estado inicial
    setState(circuitBreaker.getState());

    // Suscribirse a cambios
    const unsubscribe = circuitBreaker.addListener((newState) => {
      setState(newState);
      
      // Pausar todas las queries cuando se detecta pausa preventiva o rate limit
      if (newState.isPaused || newState.isOpen) {
        // Cancelar TODAS las queries activas y deshabilitar TODOS los refetch
        queryClient.getQueryCache().getAll().forEach(query => {
          // Cancelar la query si está en proceso
          if (query.state.status === 'loading') {
            try {
              query.cancel();
            } catch (e) {
              // Ignorar errores al cancelar
            }
          }
          
          // Guardar configuración original si no está guardada
          const currentOptions = query.options;
          query.meta = query.meta || {};
          
          if (!query.meta.originalConfig) {
            query.meta.originalConfig = {
              refetchInterval: currentOptions.refetchInterval,
              refetchIntervalInBackground: currentOptions.refetchIntervalInBackground,
              refetchOnWindowFocus: currentOptions.refetchOnWindowFocus,
              refetchOnReconnect: currentOptions.refetchOnReconnect,
            };
          }
          
          // DESHABILITAR TODOS los refetch
          query.setOptions({
            refetchInterval: false,
            refetchIntervalInBackground: false,
            refetchOnWindowFocus: false, // IMPORTANTE: deshabilitar refetch al enfocar ventana
            refetchOnReconnect: false, // IMPORTANTE: deshabilitar refetch al reconectar
          });
        });
      } else {
        // Reanudar queries cuando se desactiva la pausa
        queryClient.getQueryCache().getAll().forEach(query => {
          if (query.meta?.originalConfig) {
            query.setOptions({
              refetchInterval: query.meta.originalConfig.refetchInterval,
              refetchIntervalInBackground: query.meta.originalConfig.refetchIntervalInBackground,
              refetchOnWindowFocus: query.meta.originalConfig.refetchOnWindowFocus,
              refetchOnReconnect: query.meta.originalConfig.refetchOnReconnect,
            });
            delete query.meta.originalConfig;
          }
        });
      }
    });

    // Actualizar contador cada segundo
    const interval = setInterval(() => {
      const currentState = circuitBreaker.getState();
      setState(currentState);
      if (currentState.isOpen && currentState.lastFailureTime) {
        const elapsed = Date.now() - currentState.lastFailureTime;
        setTimeRemaining(Math.max(0, 30000 - elapsed));
      } else if (currentState.isPaused || currentState.isNearLimit) {
        setTimeRemaining(currentState.timeRemaining);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [queryClient]);

  if (!state) return null;

  // Mostrar alerta si está cerca del límite, en pausa preventiva, o si el circuit breaker está abierto
  if (!state.isNearLimit && !state.isPaused && !state.isOpen) return null;

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Card className={`border-2 shadow-lg ${
        state.isOpen 
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
          : state.isPaused
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              state.isOpen 
                ? 'bg-red-100 dark:bg-red-900' 
                : state.isPaused
                ? 'bg-orange-100 dark:bg-orange-900'
                : 'bg-yellow-100 dark:bg-yellow-900'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                state.isOpen 
                  ? 'text-red-600 dark:text-red-400' 
                  : state.isPaused
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm mb-1 ${
                state.isOpen 
                  ? 'text-red-900 dark:text-red-100' 
                  : state.isPaused
                  ? 'text-orange-900 dark:text-orange-100'
                  : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {state.isOpen 
                  ? '🚫 Rate Limit Excedido' 
                  : state.isPaused
                  ? '⏸️ Sistema Pausado Preventivamente'
                  : '⚠️ Cerca del Límite de Solicitudes'}
              </h3>
                     <p className={`text-xs mb-2 ${
                       state.isOpen 
                         ? 'text-red-700 dark:text-red-300' 
                         : state.isPaused
                         ? 'text-orange-700 dark:text-orange-300'
                         : 'text-yellow-700 dark:text-yellow-300'
                     }`}>
                       {state.isOpen 
                         ? `Has excedido el límite de solicitudes. El sistema se pausará automáticamente por ${formatTime(timeRemaining)}. NO hagas más clics hasta que se reanude.`
                         : state.isPaused
                         ? `Has realizado ${state.requestCount} de ${state.maxRequests} solicitudes (${state.blockThreshold} es el límite seguro - 50% del máximo). El sistema se ha pausado automáticamente para evitar exceder el límite. Espera ${formatTime(timeRemaining)} antes de continuar. NO hagas más clics hasta que se reanude.`
                         : `Has realizado ${state.requestCount} de ${state.maxRequests} solicitudes. El sistema se pausará automáticamente cuando alcances ${state.blockThreshold} solicitudes (50% del límite para máxima seguridad).`
                       }
                     </p>
              {!state.isOpen && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        state.percentage >= 90 
                          ? 'bg-red-500' 
                          : state.percentage >= 80 
                          ? 'bg-orange-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(100, state.percentage)}%` }}
                    />
                  </div>
                  {(state.isPaused || state.isNearLimit) && (
                    <div className={`flex items-center gap-2 text-xs ${
                      state.isPaused 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>Tiempo restante: {formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </>
              )}
              {state.isOpen && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <Clock className="w-4 h-4" />
                  <span>Tiempo restante: {formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RateLimitAlert;

