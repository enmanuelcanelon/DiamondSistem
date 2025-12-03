import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Loader2, Calendar, DollarSign, User, FileText, AlertCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function OfertasGerente() {
  const fechaActual = new Date();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12);
        setAñoSeleccionado(añoSeleccionado - 1);
      } else {
        setMesSeleccionado(mesSeleccionado - 1);
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1);
        setAñoSeleccionado(añoSeleccionado + 1);
      } else {
        setMesSeleccionado(mesSeleccionado + 1);
      }
    }
  };

  const resetearMes = () => {
    setMesSeleccionado(fechaActual.getMonth() + 1);
    setAñoSeleccionado(fechaActual.getFullYear());
  };

  const { data: ofertasData, isLoading } = useQuery({
    queryKey: ['gerente-ofertas', filtroEstado, vendedorSeleccionado?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        año: añoSeleccionado
      };
      if (filtroEstado) params.estado = filtroEstado;
      if (vendedorSeleccionado?.id) params.vendedor_id = vendedorSeleccionado.id;
      
      const response = await api.get('/gerentes/ofertas', { params });
      return response.data;
    },
    enabled: !!vendedorSeleccionado, // Solo cargar cuando hay un vendedor seleccionado
  });

  const { data: vendedoresData } = useQuery({
    queryKey: ['gerente-vendedores'],
    queryFn: async () => {
      const response = await api.get('/gerentes/vendedores');
      return response.data.vendedores;
    },
  });

  const ofertas = ofertasData?.ofertas || [];
  const vendedores = vendedoresData || [];

  const ofertasFiltradas = ofertas.filter(oferta => {
    const searchLower = searchTerm.toLowerCase();
    return (
      oferta.codigo_oferta.toLowerCase().includes(searchLower) ||
      oferta.clientes?.nombre_completo.toLowerCase().includes(searchLower) ||
      oferta.clientes?.email.toLowerCase().includes(searchLower)
    );
  });

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aceptada':
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
      case 'rechazada':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      case 'pendiente':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aceptada':
        return 'bg-muted text-foreground';
      case 'rechazada':
        return 'bg-muted/50 text-muted-foreground';
      case 'pendiente':
        return 'bg-muted/30 text-muted-foreground';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && vendedorSeleccionado) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-gray-600">Cargando ofertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ofertas</CardTitle>
              <CardDescription>
                {vendedorSeleccionado 
                  ? `Ofertas de ${vendedorSeleccionado.nombre_completo} - ${nombresMeses[mesSeleccionado - 1]} ${añoSeleccionado}`
                  : 'Selecciona un vendedor para ver sus ofertas'}
              </CardDescription>
            </div>
            {vendedorSeleccionado && (
              <Button
                variant="outline"
                onClick={() => setVendedorSeleccionado(null)}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Volver a Vendedores
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {!vendedorSeleccionado ? (
        <>
          {/* Botones de Vendedores */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Vendedor</CardTitle>
              <CardDescription>Selecciona un vendedor para ver sus ofertas</CardDescription>
            </CardHeader>
            <CardContent>
              {vendedores.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay vendedores registrados</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendedores.map((vendedor) => (
                    <button
                      key={vendedor.id}
                      onClick={() => setVendedorSeleccionado(vendedor)}
                      className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg shadow-md p-8 transition-all transform hover:scale-105 text-left"
                    >
                      <User className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                      <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
                        {vendedor.nombre_completo}
                      </h2>
                      <p className="text-gray-600 text-sm text-center mb-3">
                        {vendedor.codigo_vendedor}
                      </p>
                      <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Código</p>
                        <p className="text-lg font-bold text-gray-900">
                          {vendedor.codigo_vendedor}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <CardTitle>Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por código, cliente..."
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
              </div>

              {/* Selector de Mes y Año */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 bg-white rounded-lg border-2 border p-2 w-fit">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => cambiarMes('anterior')}
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2 px-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={mesSeleccionado}
                      onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                      className="text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                    >
                      {nombresMeses.map((mes, index) => (
                        <option key={index} value={index + 1}>{mes}</option>
                      ))}
                    </select>
                    <select
                      value={añoSeleccionado}
                      onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                      className="text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
                        <option key={año} value={año}>{año}</option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => cambiarMes('siguiente')}
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>

                  {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetearMes}
                      title="Volver al mes actual"
                    >
                      Hoy
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Ofertas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ofertas de {vendedorSeleccionado.nombre_completo}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {ofertasFiltradas.length} oferta{ofertasFiltradas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ofertasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay ofertas que coincidan con los filtros
                  </div>
                ) : (
                  ofertasFiltradas.map((oferta) => (
                    <Card key={oferta.id} className="hover:shadow-md transition">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getEstadoIcon(oferta.estado)}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {oferta.codigo_oferta}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(oferta.estado)}`}>
                                {oferta.estado}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{oferta.clientes?.nombre_completo || 'Sin cliente'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {oferta.fecha_creacion 
                                    ? format(new Date(oferta.fecha_creacion), 'dd/MM/yyyy', { locale: es })
                                    : 'Sin fecha'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold">
                                  ${parseFloat(oferta.total_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button asChild>
                              <Link
                                to={`/ofertas/${oferta.id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalles
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default OfertasGerente;

