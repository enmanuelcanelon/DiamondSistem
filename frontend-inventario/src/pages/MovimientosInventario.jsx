import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Package, Calendar, User, ArrowRightLeft, Search, Filter } from 'lucide-react';
import api from '@shared/config/api';

function MovimientosInventario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Query para movimientos
  const { data: movimientosData, isLoading } = useQuery({
    queryKey: ['movimientos-inventario', filterTipo, fechaDesde, fechaHasta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTipo) params.append('tipo_movimiento', filterTipo);
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      const response = await api.get(`/inventario/movimientos?${params.toString()}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando movimientos...</div>
      </div>
    );
  }

  const movimientos = movimientosData?.movimientos || [];
  
  // Filtrar por búsqueda
  const movimientosFiltrados = searchTerm
    ? movimientos.filter(m =>
        m.inventario_items?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.contratos?.codigo_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : movimientos;

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-red-100 text-red-800';
      case 'transferencia': return 'bg-blue-100 text-blue-800';
      case 'asignacion': return 'bg-purple-100 text-purple-800';
      case 'devolucion': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Movimientos de Inventario</h1>
        <p className="text-gray-600 mt-1">Historial de todos los movimientos de inventario</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="transferencia">Transferencia</option>
            <option value="asignacion">Asignación</option>
            <option value="devolucion">Devolución</option>
          </select>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            placeholder="Desde"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            placeholder="Hasta"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Movimientos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Movimientos ({movimientosFiltrados.length})
          </h2>
        </div>
        <div className="p-6">
          {movimientosFiltrados.length > 0 ? (
            <div className="space-y-3">
              {movimientosFiltrados.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {movimiento.inventario_items?.nombre}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(movimiento.tipo_movimiento)}`}>
                          {movimiento.tipo_movimiento}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Cantidad: </span>
                          {parseFloat(movimiento.cantidad).toFixed(2)} {movimiento.inventario_items?.unidad_medida}
                        </div>
                        {movimiento.origen && (
                          <div className="text-gray-600">
                            <span className="font-medium">Origen: </span>
                            {movimiento.origen}
                          </div>
                        )}
                        {movimiento.destino && (
                          <div className="text-gray-600">
                            <span className="font-medium">Destino: </span>
                            {movimiento.destino}
                          </div>
                        )}
                      </div>
                      {movimiento.motivo && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Motivo: </span>
                          {movimiento.motivo}
                        </div>
                      )}
                      {movimiento.contratos && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Contrato: </span>
                          {movimiento.contratos.codigo_contrato} - {movimiento.contratos.clientes?.nombre_completo}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(movimiento.fecha_movimiento).toLocaleString('es-ES')}
                        {movimiento.usuarios_inventario && (
                          <span className="ml-2">por {movimiento.usuarios_inventario.nombre_completo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay movimientos que coincidan con los filtros
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovimientosInventario;

