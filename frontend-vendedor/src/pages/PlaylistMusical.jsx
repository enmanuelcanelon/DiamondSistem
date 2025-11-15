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
  ExternalLink,
  Copy,
  Share2,
  Download,
} from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';

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
      <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 transition">
        {/* Preview/Thumbnail de la playlist */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border bg-background">
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
              <Badge variant="outline" className="text-xs">
                {plataforma === 'youtube' ? 'YouTube Music' : 'Spotify'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground break-all" title={url}>
            {url}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopiar(url)}
            title="Copiar URL"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAbrir(url)}
            title="Abrir en plataforma"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          {puedeEditar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEliminar(url)}
              disabled={guardandoUrl}
              className="text-destructive hover:text-destructive"
              title="Eliminar URL"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const handleDescargarPDF = async () => {
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
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/contratos/${contratoId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Playlist Musical</h1>
          <p className="text-muted-foreground mt-1">
            {contrato?.codigo_contrato} • {contrato?.clientes?.nombre_completo}
          </p>
        </div>
        <Button
          onClick={handleDescargarPDF}
          variant="outline"
          className="whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Sección de Playlist Externa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Playlists Externas (YouTube/Spotify)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {puedeEditar && (
              <div>
                <Label className="mb-2">
                  Agregar Nueva URL de Playlist
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={nuevaPlaylistUrl}
                    onChange={(e) => setNuevaPlaylistUrl(e.target.value)}
                    placeholder="https://music.youtube.com/playlist?list=... o https://open.spotify.com/..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAgregarPlaylistUrl}
                    disabled={guardandoUrl || !nuevaPlaylistUrl.trim()}
                    className="whitespace-nowrap"
                  >
                    {guardandoUrl ? 'Guardando...' : 'Agregar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Puedes agregar múltiples playlists de YouTube Music o Spotify
                </p>
              </div>
            )}

            {/* Lista de URLs guardadas */}
            {playlistUrls.length > 0 ? (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-semibold text-foreground">
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
                <div className="text-center py-8 border-t">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {puedeEditar 
                      ? 'No hay playlists agregadas. Agrega una URL arriba.' 
                      : 'No hay playlists agregadas por el cliente.'}
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Canciones Favoritas</p>
                <p className="text-2xl font-bold text-foreground">
                  {playlistData?.stats?.favoritas || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Canciones Prohibidas</p>
                <p className="text-2xl font-bold text-foreground">
                  {playlistData?.stats?.prohibidas || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Canciones Sugeridas</p>
                <p className="text-2xl font-bold text-foreground">
                  {playlistData?.stats?.sugeridas || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por título, artista o género..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                <SelectItem value="favorita">Favoritas</SelectItem>
                <SelectItem value="prohibida">Prohibidas</SelectItem>
                <SelectItem value="sugerida">Sugeridas</SelectItem>
              </SelectContent>
            </Select>
            {puedeEditar && (
              <Button
                onClick={() => setMostrarForm(!mostrarForm)}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Canción
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulario para agregar canción */}
      {puedeEditar && mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Canción</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCrearCancion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Título de la canción *
                  </Label>
                  <Input
                    type="text"
                    value={nuevaCancion.titulo}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, titulo: e.target.value })}
                    placeholder="Ej: Amor Eterno"
                    required
                  />
                </div>

                <div>
                  <Label>
                    Artista
                  </Label>
                  <Input
                    type="text"
                    value={nuevaCancion.artista}
                    onChange={(e) => setNuevaCancion({ ...nuevaCancion, artista: e.target.value })}
                    placeholder="Ej: Rocío Dúrcal"
                  />
                </div>

                <div>
                  <Label>
                    Género Musical
                  </Label>
                  <Select value={nuevaCancion.genero} onValueChange={(value) => setNuevaCancion({ ...nuevaCancion, genero: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Seleccionar género</SelectItem>
                      {generosMusicales.map((genero) => (
                        <SelectItem key={genero} value={genero}>{genero}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Categoría *
                  </Label>
                  <Select value={nuevaCancion.categoria} onValueChange={(value) => setNuevaCancion({ ...nuevaCancion, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="favorita">Favorita (Debe sonar)</SelectItem>
                      <SelectItem value="prohibida">Prohibida (No debe sonar)</SelectItem>
                      <SelectItem value="sugerida">Sugerida (Opcional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>
                  Notas adicionales
                </Label>
                <Textarea
                  value={nuevaCancion.notas}
                  onChange={(e) => setNuevaCancion({ ...nuevaCancion, notas: e.target.value })}
                  rows="2"
                  placeholder="Ej: Para el primer baile, momento especial, etc."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={crearCancionMutation.isPending}
                  className="flex-1"
                >
                  {crearCancionMutation.isPending ? 'Agregando...' : 'Agregar Canción'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de canciones */}
      <Card>
        <CardHeader>
          <CardTitle>
            Canciones ({cancionesFiltradas?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Cargando playlist...</p>
          ) : !cancionesFiltradas || cancionesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {busqueda || filtroCategoria ? 'No se encontraron canciones' : 'La playlist está vacía'}
              </p>
              {puedeEditar && (
                <Button
                  onClick={() => setMostrarForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primera Canción
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cancionesFiltradas.map((cancion) => (
                <div
                  key={cancion.id}
                  className={`border rounded-lg p-4 transition group ${
                    cancion.categoria === 'favorita' 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : cancion.categoria === 'prohibida'
                      ? 'bg-muted/50 border-border'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getCategoriaIcon(cancion.categoria)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {cancion.titulo}
                      </h4>
                      {cancion.artista && (
                        <p className="text-sm text-muted-foreground truncate">
                          {cancion.artista}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cancion.genero && (
                          <Badge variant="outline" className="text-xs">
                            {cancion.genero}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {cancion.categoria}
                        </Badge>
                      </div>
                      {cancion.notas && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{cancion.notas}"
                        </p>
                      )}
                    </div>
                    {puedeEditar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminarCancion(cancion.id, cancion.titulo)}
                        disabled={eliminarCancionMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition text-destructive hover:text-destructive"
                        title="Eliminar canción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PlaylistMusical;
