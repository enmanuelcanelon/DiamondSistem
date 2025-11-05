import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Loader2, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ContratosGerente() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('');

  const { data: contratosData, isLoading } = useQuery({
    queryKey: ['gerente-contratos', filtroEstado, filtroEstadoPago, filtroVendedor],
    queryFn: async () => {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroEstadoPago) params.estado_pago = filtroEstadoPago;
      if (filtroVendedor) params.vendedor_id = filtroVendedor;
      
      const response = await api.get('/gerentes/contratos', { params });
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

  const contratos = contratosData?.contratos || [];
  const vendedores = vendedoresData || [];

  const contratosFiltrados = contratos.filter(contrato => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contrato.codigo_contrato.toLowerCase().includes(searchLower) ||
      contrato.clientes?.nombre_completo.toLowerCase().includes(searchLower) ||
      contrato.clientes?.email.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando contratos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Todos los Contratos</h1>
        <p className="text-gray-600">Gestiona y visualiza todos los contratos del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <option value="activo">Activo</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
            <select
              value={filtroEstadoPago}
              onChange={(e) => setFiltroEstadoPago(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="completado">Completado</option>
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
      </div>

      {/* Lista de Contratos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {contratosFiltrados.length} de {contratos.length} contratos
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {contratosFiltrados.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No hay contratos que coincidan con los filtros
            </div>
          ) : (
            contratosFiltrados.map((contrato) => (
              <div key={contrato.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contrato.codigo_contrato}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        contrato.estado === 'activo' ? 'bg-green-100 text-green-800' :
                        contrato.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contrato.estado}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        contrato.estado_pago === 'completado' ? 'bg-blue-100 text-blue-800' :
                        contrato.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {contrato.estado_pago}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{contrato.clientes?.nombre_completo || 'Sin cliente'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {contrato.fecha_evento 
                            ? format(new Date(contrato.fecha_evento), 'dd/MM/yyyy', { locale: es })
                            : 'Sin fecha'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">
                          ${parseFloat(contrato.total_contrato || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {contrato.vendedores && (
                      <div className="mt-2 text-xs text-gray-500">
                        Vendedor: {contrato.vendedores.nombre_completo} ({contrato.vendedores.codigo_vendedor})
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link
                      to={`/contratos/${contrato.id}`}
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

export default ContratosGerente;

