import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calculator, Package, Calendar, User, Search, RefreshCw, CheckCircle, AlertTriangle, Building2, Filter } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function ContratosInventario() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [calculadoData, setCalculadoData] = useState(null);
  const [filterSalon, setFilterSalon] = useState('');
  const [showAlertas30, setShowAlertas30] = useState(true);

  // Query para salones
  const { data: salonesData } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const response = await api.get('/salones');
      return response.data;
    }
  });

  // Query para contratos con alertas de 30 días
  const { data: alertasData } = useQuery({
    queryKey: ['contratos-alertas', filterSalon],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSalon) params.append('salon_id', filterSalon);
      const response = await api.get(`/inventario/contratos-alertas?${params.toString()}`);
      return response.data;
    }
  });

  // Query para contratos
  const { data: contratosData, isLoading } = useQuery({
    queryKey: ['contratos-inventario', filterSalon, showAlertas30],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filterSalon) params.append('salon_id', filterSalon);
      if (showAlertas30) params.append('alerta_30_dias', 'true');
      const response = await api.get(`/contratos?${params.toString()}`);
      return response.data;
    }
  });

  // Query para asignaciones del contrato seleccionado
  const { data: asignacionesData } = useQuery({
    queryKey: ['asignaciones-contrato', selectedContrato],
    queryFn: async () => {
      if (!selectedContrato) return null;
      const response = await api.get(`/inventario/asignaciones?contrato_id=${selectedContrato}`);
      return response.data;
    },
    enabled: !!selectedContrato
  });

  // Mutation para calcular inventario
  const calcularMutation = useMutation({
    mutationFn: async (contratoId) => {
      const response = await api.post(`/inventario/calcular/${contratoId}`);
      return response.data;
    },
    onSuccess: (data) => {
      setCalculadoData(data);
      toast.success(`Cálculo completado: ${data.items_calculados?.length || 0} items necesarios`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al calcular inventario');
    }
  });

  // Mutation para asignar inventario
  const asignarMutation = useMutation({
    mutationFn: async ({ contratoId, forzar }) => {
      const response = await api.post(`/inventario/asignar/${contratoId}`, { forzar_asignacion: forzar });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['asignaciones-contrato', selectedContrato]);
      queryClient.invalidateQueries(['asignaciones-inventario']);
      toast.success(data.message || 'Inventario asignado correctamente');
      setCalculadoData(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar inventario');
    }
  });

  // Mutation para ejecutar asignación automática
  const ejecutarAutoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/inventario/ejecutar-asignacion-automatica');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['asignaciones-inventario']);
      toast.success(`Asignación automática completada: ${data.resultado?.asignados || 0} contratos asignados`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al ejecutar asignación automática');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando contratos...</div>
      </div>
    );
  }

  const contratos = contratosData?.contratos || [];
  const contratosFiltrados = searchTerm
    ? contratos.filter(c =>
      c.codigo_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientes?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : contratos;

  const contratoSeleccionado = contratos.find(c => c.id === selectedContrato);
  const asignaciones = asignacionesData?.asignaciones || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos y Asignación de Inventario</h1>
          <p className="text-gray-600 mt-1">Calcular y asignar inventario a contratos</p>
        </div>
        <button
          onClick={() => ejecutarAutoMutation.mutate()}
          disabled={ejecutarAutoMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${ejecutarAutoMutation.isPending ? 'animate-spin' : ''}`} />
          Ejecutar Asignación Automática
        </button>
      </div>

      {/* Alertas de 30 días */}
      {alertasData?.sin_asignacion > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  {alertasData.sin_asignacion} contrato(s) requieren asignación de inventario
                </h3>
                <p className="text-sm text-orange-700">
                  Eventos en los próximos 30 días sin inventario asignado
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterSalon}
            onChange={(e) => setFilterSalon(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los salones</option>
            {salonesData?.salones?.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.nombre}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showAlertas30}
              onChange={(e) => setShowAlertas30(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Solo alertas 30 días</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Contratos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Contratos ({contratosFiltrados.length})
            </h2>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {contratosFiltrados.length > 0 ? (
              <div className="space-y-3">
                {contratosFiltrados.map((contrato) => (
                  <div
                    key={contrato.id}
                    onClick={() => {
                      setSelectedContrato(contrato.id);
                      setCalculadoData(null);
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition ${selectedContrato === contrato.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{contrato.codigo_contrato}</div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const fechaEvento = new Date(contrato.fecha_evento);
                          const fechaHoy = new Date();
                          fechaHoy.setHours(0, 0, 0, 0);
                          const diasRestantes = Math.ceil((fechaEvento - fechaHoy) / (1000 * 60 * 60 * 24));
                          const necesitaAsignacion = !contrato.asignaciones_inventario || contrato.asignaciones_inventario.length === 0;

                          if (diasRestantes <= 30 && diasRestantes >= 0 && necesitaAsignacion) {
                            return (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
                                ⚠️ {diasRestantes} días
                              </span>
                            );
                          } else if (diasRestantes <= 30 && diasRestantes >= 0) {
                            return (
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                {diasRestantes} días
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <span className={`px-2 py-1 text-xs rounded-full ${contrato.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {contrato.estado}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {contrato.clientes?.nombre_completo}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(contrato.fecha_evento).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="w-4 h-4" />
                        {contrato.salones?.nombre} - {contrato.cantidad_invitados} invitados
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay contratos
              </div>
            )}
          </div>
        </div>

        {/* Detalles del Contrato Seleccionado */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {contratoSeleccionado ? 'Detalles del Contrato' : 'Selecciona un Contrato'}
            </h2>
          </div>
          <div className="p-6">
            {contratoSeleccionado ? (
              <div className="space-y-6">
                {/* Información del Contrato */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{contratoSeleccionado.codigo_contrato}</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Cliente:</span> {contratoSeleccionado.clientes?.nombre_completo}</div>
                    <div><span className="font-medium">Salón:</span> {contratoSeleccionado.salones?.nombre}</div>
                    <div><span className="font-medium">Fecha Evento:</span> {new Date(contratoSeleccionado.fecha_evento).toLocaleDateString('es-ES')}</div>
                    <div><span className="font-medium">Invitados:</span> {contratoSeleccionado.cantidad_invitados}</div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3">
                  <button
                    onClick={() => calcularMutation.mutate(selectedContrato)}
                    disabled={calcularMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Calculator className="w-4 h-4" />
                    {calcularMutation.isPending ? 'Calculando...' : 'Calcular Inventario'}
                  </button>
                  {calculadoData && (
                    <button
                      onClick={() => asignarMutation.mutate({ contratoId: selectedContrato, forzar: false })}
                      disabled={asignarMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {asignarMutation.isPending ? 'Asignando...' : 'Asignar Inventario'}
                    </button>
                  )}
                </div>

                {/* Resultado del Cálculo */}
                {calculadoData && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Items Calculados ({calculadoData.items_calculados?.length || 0})
                    </h4>
                    <div className="max-h-64 overflow-y-auto">
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">Item</th>
                              <th className="px-3 py-2 text-left">Cantidad</th>
                              <th className="px-3 py-2 text-left">Unidad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {calculadoData.items_calculados?.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2">{item.item_nombre}</td>
                                <td className="px-3 py-2">{item.cantidad_necesaria.toFixed(2)}</td>
                                <td className="px-3 py-2">{item.unidad_medida}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-2">
                        {calculadoData.items_calculados?.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                            <div className="font-medium text-gray-900 mb-1">{item.item_nombre}</div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span className="font-medium text-blue-600">
                                {item.cantidad_necesaria.toFixed(2)} {item.unidad_medida}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Asignaciones Existentes */}
                {asignaciones.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Asignaciones Existentes ({asignaciones.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {asignaciones.map((asignacion) => (
                        <div key={asignacion.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium">{asignacion.inventario_items?.nombre}</div>
                          <div className="text-gray-600">
                            {parseFloat(asignacion.cantidad_asignada).toFixed(2)} {asignacion.inventario_items?.unidad_medida}
                            {' - '}
                            <span className={`${asignacion.estado === 'asignado' ? 'text-blue-600' :
                                asignacion.estado === 'utilizado' ? 'text-green-600' :
                                  'text-gray-600'
                              }`}>
                              {asignacion.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Selecciona un contrato de la lista para ver detalles y asignar inventario</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContratosInventario;

