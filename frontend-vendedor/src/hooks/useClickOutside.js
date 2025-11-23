import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar clics fuera de un elemento
 * @param {Function} handler - Función que se ejecuta cuando se hace clic fuera
 * @param {boolean} enabled - Si está habilitado o no (por defecto true)
 * @param {React.RefObject} ref - Referencia opcional al elemento (si no se proporciona, se crea una nueva)
 * @returns {React.RefObject} - Referencia al elemento que se está monitoreando
 */
export function useClickOutside(handler, enabled = true, externalRef = null) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      // Verificar si el clic fue fuera del elemento
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    // Agregar el listener cuando el componente se monta
    // Usar un pequeño delay para evitar que se ejecute inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 0);

    // Limpiar el listener cuando el componente se desmonta o cambia enabled
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, enabled, ref]);

  return ref;
}

