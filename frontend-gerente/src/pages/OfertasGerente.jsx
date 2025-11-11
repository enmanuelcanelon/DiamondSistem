import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Loader2, Calendar, DollarSign, User, FileText, AlertCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function OfertasGerente() {
  const fechaActual = new Date();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('');
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
    queryKey: ['gerente-ofertas', filtroEstado, filtroVendedor, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        año: añoSeleccionado
      };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroVendedor) params.vendedor_id = filtroVendedor;
      
      const response = await api.get('/gerentes/ofertas', { params });
      return response.data;
    },
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
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rechazada':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pendiente':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando ofertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Todas las Ofertas</h1>
        <p className="text-gray-600">Visualiza y gestiona todas las ofertas del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, cliente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
            <select
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Mes y Año */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-purple-200 p-2 w-fit">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-1 hover:bg-purple-50 rounded transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 text-purple-600" />
            </button>
            
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              >
                {nombresMeses.map((mes, index) => (
                  <option key={index} value={index + 1}>{mes}</option>
                ))}
              </select>
              <select
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => cambiarMes('siguiente')}
              className="p-1 hover:bg-purple-50 rounded transition"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 text-purple-600" />
            </button>

            {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
              <button
                onClick={resetearMes}
                className="ml-2 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition"
                title="Volver al mes actual"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Ofertas */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {ofertasFiltradas.length} de {ofertas.length} ofertas
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {ofertasFiltradas.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No hay ofertas que coincidan con los filtros
            </div>
          ) : (
            ofertasFiltradas.map((oferta) => (
              <div key={oferta.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getEstadoIcon(oferta.estado)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {oferta.codigo_oferta}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(oferta.estado)}`}>
                        {oferta.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                          ${parseFloat(oferta.total_final || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {oferta.vendedores && (
                      <div className="mt-2 text-xs text-gray-500">
                        Vendedor: {oferta.vendedores.nombre_completo} ({oferta.vendedores.codigo_vendedor})
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link
                      to={`/ofertas/${oferta.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default OfertasGerente;

