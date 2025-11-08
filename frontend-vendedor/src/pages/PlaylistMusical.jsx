import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Music,
  Plus,
  Trash2,
  Heart,
  Ban,
  Lightbulb,
  Search,
  Eye,
  ExternalLink,
  Copy,
  Share2,
  Download,
} from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';

function PlaylistMusical() {
  const { id: contratoId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Determinar si el usuario actual puede editar (solo clientes)
  const puedeEditar = user?.tipo === 'cliente';
  const esVendedor = user?.tipo === 'vendedor';
  
  const [nuevaCancion, setNuevaCancion] = useState({
    titulo: '',
    artista: '',
    genero: '',
    categoria: 'favorita',
    notas: '',
  });
  
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [nuevaPlaylistUrl, setNuevaPlaylistUrl] = useState('');
  const [guardandoUrl, setGuardandoUrl] = useState(false);

  // Query para obtener el contrato
  const { data: contrato } = useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
  });

  // Query para obtener canciones
  const { data: playlistData, isLoading } = useQuery({
    queryKey: ['playlist', contratoId, filtroCategoria],
    queryFn: async () => {
      const params = filtroCategoria ? `?categoria=${filtroCategoria}` : '';
      const response = await api.get(`/playlist/contrato/${contratoId}${params}`);
      return response.data;
    },
  });

  // Query para obtener ajustes (para las URLs de playlist)
  const { data: ajustes } = useQuery({
    queryKey: ['ajustes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/ajustes/contrato/${contratoId}`);
      return response.data.ajustes;
    },
    enabled: !!contratoId,
  });

  // Parsear URLs de playlist desde JSON
  const playlistUrls = ajustes?.playlist_urls 
    ? (typeof ajustes.playlist_urls === 'string' 
        ? JSON.parse(ajustes.playlist_urls) 
        : Array.isArray(ajustes.playlist_urls) 
          ? ajustes.playlist_urls 
          : [])
    : [];

  // Mutation para crear canción
  const crearCancionMutation = useMutation({
    mutationFn: async (cancion) => {
      const response = await api.post('/playlist', {
        contrato_id: parseInt(contratoId),
        canciones: cancion,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playlist', contratoId]);
      setNuevaCancion({ titulo: '', artista: '', genero: '', categoria: 'favorita', notas: '' });
      setMostrarForm(false);
      alert('Canción agregada exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al agregar canción');
    },
  });

  // Mutation para eliminar canción
  const eliminarCancionMutation = useMutation({
    mutationFn: async (cancionId) => {
      await api.delete(`/playlist/${cancionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['playlist', contratoId]);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al eliminar canción');
    },
  });

  const handleCrearCancion = (e) => {
    e.preventDefault();
    if (!nuevaCancion.titulo) {
      alert('Por favor, ingrese el título de la canción');
      return;
    }
    crearCancionMutation.mutate(nuevaCancion);
  };

  const handleEliminarCancion = (cancionId, titulo) => {
    if (window.confirm(`¿Eliminar "${titulo}" de la playlist?`)) {
      eliminarCancionMutation.mutate(cancionId);
    }
  };

  // Función para agregar una nueva URL de playlist
  const handleAgregarPlaylistUrl = async () => {
    if (!nuevaPlaylistUrl.trim()) {
      alert('Por favor, ingrese una URL válida');
      return;
    }

    // Validar que sea una URL de YouTube o Spotify
    const esYouTube = nuevaPlaylistUrl.includes('youtube.com') || nuevaPlaylistUrl.includes('youtu.be') || nuevaPlaylistUrl.includes('music.youtube.com');
    const esSpotify = nuevaPlaylistUrl.includes('spotify.com') || nuevaPlaylistUrl.includes('open.spotify.com');

    if (!esYouTube && !esSpotify) {
      alert('Por favor, ingrese una URL válida de YouTube o Spotify');
      return;
    }

    // Verificar que no esté duplicada
    if (playlistUrls.includes(nuevaPlaylistUrl.trim())) {
      alert('Esta URL ya está en la lista');
      return;
    }

    setGuardandoUrl(true);
    try {
      const nuevasUrls = [...playlistUrls, nuevaPlaylistUrl.trim()];
      await api.put(`/ajustes/contrato/${contratoId}`, {
        playlist_urls: nuevasUrls
      });
      queryClient.invalidateQueries(['ajustes', contratoId]);
      setNuevaPlaylistUrl('');
      alert('URL de playlist agregada exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar la URL');
    } finally {
      setGuardandoUrl(false);
    }
  };

  // Función para eliminar una URL de playlist
  const handleEliminarPlaylistUrl = async (urlAEliminar) => {
    if (!window.confirm('¿Eliminar esta URL de playlist?')) {
      return;
    }

    setGuardandoUrl(true);
    try {
      const nuevasUrls = playlistUrls.filter(url => url !== urlAEliminar);
      await api.put(`/ajustes/contrato/${contratoId}`, {
        playlist_urls: nuevasUrls
      });
      queryClient.invalidateQueries(['ajustes', contratoId]);
      alert('URL eliminada exitosamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar la URL');
    } finally {
      setGuardandoUrl(false);
    }
  };

  // Función para copiar URL al portapapeles
  const copiarUrl = async (url) => {
    if (!url) {
      alert('No hay URL para copiar');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copiada al portapapeles');
    } catch (error) {
      alert('Error al copiar la URL');
    }
  };

  // Función para abrir en la plataforma
  const abrirEnPlataforma = (url) => {
    if (!url) {
      alert('No hay URL para abrir');
      return;
    }
    window.open(url, '_blank');
  };

  // Detectar tipo de plataforma
  const detectarPlataforma = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com')) {
      return 'youtube';
    }
    if (url.includes('spotify.com') || url.includes('open.spotify.com')) {
      return 'spotify';
    }
    return null;
  };

  // Extraer ID de playlist de YouTube
  const extraerIdYouTube = (url) => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Extraer ID de playlist/album de Spotify
  const extraerIdSpotify = (url) => {
    const match = url.match(/spotify\.com\/(?:playlist|album)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Generar URL de preview/thumbnail
  const obtenerPreviewUrl = (url) => {
    const plataforma = detectarPlataforma(url);
    if (plataforma === 'youtube') {
      const playlistId = extraerIdYouTube(url);
      if (playlistId) {
        // Usar oEmbed de YouTube para obtener thumbnail
        return `https://img.youtube.com/vi/${playlistId}/maxresdefault.jpg`;
      }
      // Fallback: usar thumbnail genérico de YouTube
      return 'https://www.youtube.com/img/desktop/yt_1200.png';
    }
    if (plataforma === 'spotify') {
      // Spotify no tiene thumbnails públicos directos, usar logo genérico
      return 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';
    }
    return null;
  };

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'favorita':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'prohibida':
        return <Ban className="w-5 h-5 text-red-600" />;
      case 'sugerida':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      default:
        return <Music className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'favorita':
        return 'bg-red-50 border-red-200';
      case 'prohibida':
        return 'bg-gray-50 border-gray-300';
      case 'sugerida':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Filtrar canciones por búsqueda
  const cancionesFiltradas = playlistData?.canciones?.filter(cancion => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      cancion.titulo.toLowerCase().includes(searchLower) ||
      cancion.artista?.toLowerCase().includes(searchLower) ||
      cancion.genero?.toLowerCase().includes(searchLower)
    );
  });

  const generosMusicales = [
    'Rock', 'Pop', 'Reggaeton', 'Salsa', 'Merengue', 'Bachata',
    'Electrónica', 'Hip Hop', 'Jazz', 'Clásica', 'Country', 'Otro'
  ];

  // Componente para cada item de playlist con preview
  const PlaylistItem = ({ url, index, plataforma, previewUrl, onCopiar, onAbrir, onEliminar, puedeEditar, guardandoUrl }) => {
    const [imagenError, setImagenError] = useState(false);
    
    return (
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition">
        {/* Preview/Thumbnail de la playlist */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 bg-white shadow-sm">
            {previewUrl && !imagenError ? (
              <img
                src={previewUrl}
                alt={`Preview ${plataforma}`}
                className="w-full h-full object-cover"
                onError={() => setImagenError(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
                plataforma === 'youtube' 
                  ? 'from-red-500 to-red-600' 
                  : 'from-green-500 to-green-600'
              }`}>
                <span className="text-white text-2xl">
                  {plataforma === 'youtube' ? '▶' : '♪'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {plataforma && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                {plataforma === 'youtube' ? '🎵 YouTube Music' : '🎵 Spotify'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 break-all" title={url}>
            {url}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCopiar(url)}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            title="Copiar URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAbrir(url)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Abrir en plataforma"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {puedeEditar && (
            <button
              onClick={() => onEliminar(url)}
              disabled={guardandoUrl}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              title="Eliminar URL"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/contratos/${contratoId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Music className="w-8 h-8 text-indigo-600" />
            Playlist Musical
            {esVendedor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                <Eye className="w-4 h-4" />
                Solo lectura
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {contrato?.codigo_contrato} - {contrato?.clientes?.nombre_completo}
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const response = await api.get(`/playlist/contrato/${contratoId}/pdf`, {
                responseType: 'blob'
              });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Playlist-${contrato?.codigo_contrato || 'evento'}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              alert('PDF descargado exitosamente');
            } catch (error) {
              alert('Error al descargar el PDF');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Descargar PDF</span>
        </button>
      </div>

      {/* Sección de Playlist Externa */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-600" />
          Playlists Externas (YouTube/Spotify)
        </h3>
        <div className="space-y-4">
          {puedeEditar && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Nueva URL de Playlist
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={nuevaPlaylistUrl}
                  onChange={(e) => setNuevaPlaylistUrl(e.target.value)}
                  placeholder="https://music.youtube.com/playlist?list=... o https://open.spotify.com/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAgregarPlaylistUrl}
                  disabled={guardandoUrl || !nuevaPlaylistUrl.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {guardandoUrl ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Puedes agregar múltiples playlists de YouTube Music o Spotify
              </p>
            </div>
          )}

          {/* Lista de URLs guardadas */}
          {playlistUrls.length > 0 ? (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">
                Playlists Agregadas ({playlistUrls.length})
              </h4>
              {playlistUrls.map((url, index) => {
                const plataforma = detectarPlataforma(url);
                const previewUrl = obtenerPreviewUrl(url);
                
                return (
                  <PlaylistItem
                    key={index}
                    url={url}
                    index={index}
                    plataforma={plataforma}
                    previewUrl={previewUrl}
                    onCopiar={copiarUrl}
                    onAbrir={abrirEnPlataforma}
                    onEliminar={handleEliminarPlaylistUrl}
                    puedeEditar={puedeEditar}
                    guardandoUrl={guardandoUrl}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 border-t border-gray-200">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {puedeEditar 
                  ? 'No hay playlists agregadas. Agrega una URL arriba.' 
                  : 'No hay playlists agregadas por el cliente.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <div>
              <p className="text-sm text-gray-600">Canciones Favoritas</p>
              <p className="text-2xl font-bold text-gray-900">
                {playlistData?.stats?.favoritas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Canciones Prohibidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {playlistData?.stats?.prohibidas || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Canciones Sugeridas</p>
              <p className="text-2xl font-bold text-gray-900">
                {playlistData?.stats?.sugeridas || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título, artista o género..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Todas las categorías</option>
            <option value="favorita">Favoritas</option>
            <option value="prohibida">Prohibidas</option>
            <option value="sugerida">Sugeridas</option>
          </select>
          {puedeEditar && (
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Agregar Canción
            </button>
          )}
        </div>
      </div>

      {/* Formulario para agregar canción */}
      {puedeEditar && mostrarForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Canción</h3>
          <form onSubmit={handleCrearCancion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la canción *
                </label>
                <input
                  type="text"
                  value={nuevaCancion.titulo}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej: Amor Eterno"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Artista
                </label>
                <input
                  type="text"
                  value={nuevaCancion.artista}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, artista: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej: Rocío Dúrcal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género Musical
                </label>
                <select
                  value={nuevaCancion.genero}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, genero: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar género</option>
                  {generosMusicales.map((genero) => (
                    <option key={genero} value={genero}>{genero}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={nuevaCancion.categoria}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, categoria: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="favorita">⭐ Favorita (Debe sonar)</option>
                  <option value="prohibida">🚫 Prohibida (No debe sonar)</option>
                  <option value="sugerida">💡 Sugerida (Opcional)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                value={nuevaCancion.notas}
                onChange={(e) => setNuevaCancion({ ...nuevaCancion, notas: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Ej: Para el primer baile, momento especial, etc."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={crearCancionMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {crearCancionMutation.isPending ? 'Agregando...' : 'Agregar Canción'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de canciones */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Canciones ({cancionesFiltradas?.length || 0})
        </h3>

        {isLoading ? (
          <p className="text-gray-500 text-center py-8">Cargando playlist...</p>
        ) : !cancionesFiltradas || cancionesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {busqueda || filtroCategoria ? 'No se encontraron canciones' : 'La playlist está vacía'}
            </p>
            {puedeEditar && (
              <button
                onClick={() => setMostrarForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Agregar Primera Canción
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {cancionesFiltradas.map((cancion) => (
              <div
                key={cancion.id}
                className={`border rounded-lg p-4 transition group ${getCategoriaColor(cancion.categoria)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getCategoriaIcon(cancion.categoria)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {cancion.titulo}
                    </h4>
                    {cancion.artista && (
                      <p className="text-sm text-gray-600 truncate">
                        {cancion.artista}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cancion.genero && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {cancion.genero}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {cancion.categoria}
                      </span>
                    </div>
                    {cancion.notas && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{cancion.notas}"
                      </p>
                    )}
                  </div>
                  {puedeEditar && (
                    <button
                      onClick={() => handleEliminarCancion(cancion.id, cancion.titulo)}
                      disabled={eliminarCancionMutation.isPending}
                      className="p-2 rounded text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                      title="Eliminar canción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistMusical;
