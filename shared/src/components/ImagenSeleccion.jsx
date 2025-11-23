import { useState, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

/**
 * Componente para mostrar imagen cuando el usuario selecciona una opción
 * @param {string} urlImagen - URL de la imagen a mostrar
 * @param {string} alt - Texto alternativo
 * @param {string} tamaño - 'small' | 'medium' | 'large' (default: 'medium')
 */
function ImagenSeleccion({ urlImagen, alt = 'Imagen', tamaño = 'medium', onClose }) {
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // Construir URL completa si es relativa
  const getImageUrl = () => {
    if (!urlImagen) return null;
    if (urlImagen.startsWith('http')) return urlImagen;
    
    // Si es relativa, construir URL completa
    // Las imágenes estáticas se sirven directamente desde el backend, no desde /api
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5000';
    
    // Asegurar que la URL comience con /
    const path = urlImagen.startsWith('/') ? urlImagen : `/${urlImagen}`;
    return `${baseUrl}${path}`;
  };
  
  const imageUrl = getImageUrl();
  
  // Resetear estado cuando cambia la URL de la imagen
  useEffect(() => {
    setError(false);
    setCargando(true);
  }, [urlImagen]);
  
  const tamaños = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-80 h-80',
    'extra-large': 'w-96 h-96',
    'full-width': 'w-full h-96'
  };
  
  if (!imageUrl) return null;
  
  return (
    <div className="relative inline-block">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 bg-white text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition shadow-lg border border-gray-200"
          aria-label="Cerrar imagen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className={`relative ${tamaños[tamaño]} rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm image-container`}>
        {cargando && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <ImageIcon className="w-6 h-6 text-gray-300 animate-pulse" />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <ImageIcon className="w-6 h-6 text-gray-300" />
            <span className="sr-only">Imagen no disponible</span>
          </div>
        ) : (
          <img
            key={imageUrl} // Key única para forzar recarga cuando cambia la URL
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover ${cargando ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={() => setCargando(false)}
            onError={() => {
              setError(true);
              setCargando(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ImagenSeleccion;

