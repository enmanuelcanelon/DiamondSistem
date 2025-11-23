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
import api from '@shared/config/api';
import useAuthStore from '@shared/store/useAuthStore';

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
        return 'bg-red-500/10 border-red-500/20';
      case 'prohibida':
        return 'bg-neutral-800 border-neutral-700';
      case 'sugerida':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-black/20 border-white/10';
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
      <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-white/10 hover:border-white/20 transition">
        {/* Preview/Thumbnail de la playlist */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-white/10 bg-black/50">
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
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white rounded text-xs font-medium">
                {plataforma === 'youtube' ? '🎵 YouTube Music' : '🎵 Spotify'}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 break-all" title={url}>
            {url}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCopiar(url)}
            className="p-2 text-neutral-400 hover:bg-white/10 hover:text-white rounded-lg transition"
            title="Copiar URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAbrir(url)}
            className="p-2 text-neutral-400 hover:bg-white/10 hover:text-white rounded-lg transition"
            title="Abrir en plataforma"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {puedeEditar && (
            <button
              onClick={() => onEliminar(url)}
              disabled={guardandoUrl}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">Playlist</h1>
            <p className="text-neutral-400 text-sm">Gestiona la música de tu evento</p>
          </div>
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
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Download size={16} />
          Descargar PDF
        </button>
      </div>

      {/* Bento Grid Layout for Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Main Feature Card - External Playlists */}
        <div className="md:col-span-2 relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 group min-h-[240px]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2000&auto=format&fit=crop"
              alt="Music Background"
              className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </div>

          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Music className="text-white" size={20} />
                <h2 className="text-lg font-semibold text-white">Playlists Externas</h2>
              </div>
              <p className="text-neutral-400 text-sm max-w-md">
                Importa tus playlists favoritas de Spotify o YouTube Music para que el DJ conozca tu estilo.
              </p>
            </div>

            {puedeEditar && (
              <div className="mt-6">
                <div className="flex gap-2 max-w-lg">
                  <input
                    type="url"
                    value={nuevaPlaylistUrl}
                    onChange={(e) => setNuevaPlaylistUrl(e.target.value)}
                    placeholder="Pega el enlace de Spotify o YouTube..."
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 backdrop-blur-sm transition-colors"
                  />
                  <button
                    onClick={handleAgregarPlaylistUrl}
                    disabled={guardandoUrl || !nuevaPlaylistUrl.trim()}
                    className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {guardandoUrl ? 'Guardando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-4">
          {/* Favoritas */}
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 flex items-center justify-between group hover:border-white/20 transition-colors">
            <div>
              <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Favoritas</div>
              <div className="text-2xl font-bold text-white">{playlistData?.stats?.favoritas || 0}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <Heart size={18} fill="currentColor" className="opacity-50" />
            </div>
          </div>

          {/* Prohibidas */}
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 flex items-center justify-between group hover:border-white/20 transition-colors">
            <div>
              <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Prohibidas</div>
              <div className="text-2xl font-bold text-white">{playlistData?.stats?.prohibidas || 0}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:scale-110 transition-transform">
              <Ban size={18} />
            </div>
          </div>

          {/* Sugeridas */}
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 flex items-center justify-between group hover:border-white/20 transition-colors">
            <div>
              <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Sugeridas</div>
              <div className="text-2xl font-bold text-white">{playlistData?.stats?.sugeridas || 0}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Lightbulb size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Playlist Externa - Lista */}
      {playlistUrls.length > 0 && (
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Playlists Agregadas ({playlistUrls.length})
          </h3>
          <div className="space-y-3">
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
        </div>
      )}

      {/* Song List Section */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                placeholder="Buscar canciones..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/10">
              {['Todas', 'Favoritas', 'Prohibidas'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat === 'Todas' ? '' : cat.toLowerCase())}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    (cat === 'Todas' && !filtroCategoria) || filtroCategoria === cat.toLowerCase()
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {puedeEditar && (
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus size={16} />
              Agregar Canción
            </button>
          )}
        </div>

        {/* Formulario para agregar canción */}
        {puedeEditar && mostrarForm && (
          <div className="p-6 border-b border-white/10 bg-black/20">
            <h3 className="text-lg font-semibold text-white mb-4">Nueva Canción</h3>
            <form onSubmit={handleCrearCancion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Título de la canción *
                  </label>
                  <input
                    type="text"
                    value={nuevaCancion.titulo}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, titulo: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                    placeholder="Ej: Amor Eterno"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Artista
                  </label>
                  <input
                    type="text"
                    value={nuevaCancion.artista}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, artista: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                    placeholder="Ej: Rocío Dúrcal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Género Musical
                  </label>
                  <select
                    value={nuevaCancion.genero}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, genero: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="">Seleccionar género</option>
                    {generosMusicales.map((genero) => (
                      <option key={genero} value={genero} className="bg-neutral-900">{genero}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={nuevaCancion.categoria}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, categoria: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    <option value="favorita" className="bg-neutral-900">⭐ Favorita (Debe sonar)</option>
                    <option value="prohibida" className="bg-neutral-900">🚫 Prohibida (No debe sonar)</option>
                    <option value="sugerida" className="bg-neutral-900">💡 Sugerida (Opcional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={nuevaCancion.notas}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, notas: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                  placeholder="Ej: Para el primer baile, momento especial, etc."
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={crearCancionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 font-medium"
                >
                  {crearCancionMutation.isPending ? 'Agregando...' : 'Agregar Canción'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition border border-white/5"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center p-8">
            <p className="text-neutral-400">Cargando playlist...</p>
          </div>
        ) : !cancionesFiltradas || cancionesFiltradas.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Music size={32} className="text-neutral-600" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Tu playlist está vacía</h3>
            <p className="text-neutral-500 text-sm max-w-sm mb-6">
              {busqueda || filtroCategoria 
                ? 'No se encontraron canciones con los filtros aplicados'
                : 'Comienza a construir el ambiente de tu evento agregando las canciones que no pueden faltar.'}
            </p>
            {puedeEditar && (
              <button
                onClick={() => setMostrarForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                <Plus size={16} />
                Agregar Primera Canción
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {cancionesFiltradas.map((cancion) => (
              <div
                key={cancion.id}
                className="border border-white/10 rounded-lg p-4 transition group hover:border-white/20 bg-black/20"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getCategoriaIcon(cancion.categoria)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {cancion.titulo}
                    </h4>
                    {cancion.artista && (
                      <p className="text-sm text-neutral-400 truncate">
                        {cancion.artista}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cancion.genero && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-neutral-300">
                          {cancion.genero}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-neutral-300 capitalize">
                        {cancion.categoria}
                      </span>
                    </div>
                    {cancion.notas && (
                      <p className="text-sm text-neutral-400 mt-2 italic">
                        "{cancion.notas}"
                      </p>
                    )}
                  </div>
                  {puedeEditar && (
                    <button
                      onClick={() => handleEliminarCancion(cancion.id, cancion.titulo)}
                      disabled={eliminarCancionMutation.isPending}
                      className="p-2 rounded text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
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

