import { useQuery } from '@tanstack/react-query';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../config/api';

/**
 * Componente para mostrar galería de fotos de servicios
 * @param {string} tipoServicio - Tipo de servicio: 'torta', 'decoracion', 'menu', 'bar'
 * @param {string} titulo - Título descriptivo para la galería
 */
function GaleriaFotos({ tipoServicio, titulo = 'fotos' }) {
  const { data: fotosData, isLoading, isError } = useQuery({
    queryKey: ['fotos-servicios', tipoServicio],
    queryFn: async () => {
      const response = await api.get(`/fotos/${tipoServicio}`);
      return response.data;
    },
    enabled: !!tipoServicio,
  });

  const fotos = fotosData?.fotos || [];

  // Construir URL completa de la imagen
  const getImageUrl = (foto) => {
    if (foto.url && foto.url.startsWith('http')) {
      return foto.url;
    }
    // Si la URL es relativa, construir la URL completa usando la base de la API
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    return `${baseUrl.replace('/api', '')}${foto.url}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <p className="ml-3 text-gray-600">Cargando {titulo}...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-8 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <p className="ml-3 text-red-600">Error al cargar {titulo}</p>
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 text-sm">No hay {titulo} disponibles aún</p>
        <p className="text-gray-500 text-xs mt-1">Las fotos se agregarán próximamente</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fotos.map((foto) => (
        <div
          key={foto.id}
          className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg"
        >
          <div className="aspect-square bg-gray-100 relative">
            <img
              src={getImageUrl(foto)}
              alt={foto.descripcion || `${titulo} - ${foto.nombre_archivo}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Si la imagen falla al cargar, mostrar un placeholder
                e.target.style.display = 'none';
                const placeholder = e.target.nextSibling;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-gray-100">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          {foto.descripcion && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">{foto.descripcion}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default GaleriaFotos;

