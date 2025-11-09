import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Package, 
  AlertTriangle, 
  Calendar, 
  User, 
  Calculator, 
  CheckCircle, 
  Edit2, 
  Save, 
  X,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function SalonInventario() {
  const { salonNombre } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [calculadoData, setCalculadoData] = useState(null);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const [editData, setEditData] = useState({ cantidad_asignada: '', cantidad_utilizada: '', estado: '', notas: '' });

  // Normalizar nombre del salón
  const salonNombreNormalizado = salonNombre?.toLowerCase();
  
  // Query para obtener todos los salones y encontrar el ID correcto
  const { data: salonesData } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const response = await api.get('/salones');
      return response.data;
    }
  });

  // Buscar el salón por nombre (case insensitive)
  const salon = salonesData?.salones?.find(s => 
    s.nombre?.toLowerCase() === salonNombreNormalizado
  );
  
  const salonId = salon?.id;


  // Query para inventario del salón
  const { data: inventarioSalon, isLoading: loadingInventario } = useQuery({
    queryKey: ['inventario-salon', salonId],
    queryFn: async () => {
      const response = await api.get(`/inventario/salones/${salonId}`);
      return response.data;
    },
    enabled: !!salonId
  });

  // Query para contratos del salón
  const { data: contratosData, isLoading: loadingContratos } = useQuery({
    queryKey: ['contratos-salon', salonId],
    queryFn: async () => {
      const response = await api.get(`/contratos?salon_id=${salonId}&limit=100`);
      return response.data;
    },
    enabled: !!salonId
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
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      queryClient.invalidateQueries(['contratos-salon', salonId]);
      toast.success(data.message || 'Inventario asignado correctamente');
      setCalculadoData(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar inventario');
    }
  });

  // Mutation para actualizar asignación
  const updateAsignacionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/inventario/asignaciones/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaciones-contrato', selectedContrato]);
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      toast.success('Asignación actualizada correctamente');
      setEditingAsignacion(null);
      setEditData({ cantidad_asignada: '', cantidad_utilizada: '', estado: '', notas: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar asignación');
    }
  });

  if (loadingInventario || loadingContratos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando información del salón...</div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Salón no encontrado</p>
          <button
            onClick={() => navigate('/asignaciones')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver a Inventario por Salones
          </button>
        </div>
      </div>
    );
  }

  const inventario = inventarioSalon?.inventario || [];
  const contratos = contratosData?.contratos || [];
  const itemsBajoStock = inventario.filter(item => item.necesita_reposicion);
  const asignaciones = asignacionesData?.asignaciones || [];
  const contratoSeleccionado = contratos.find(c => c.id === selectedContrato);

  const handleEdit = (asignacion) => {
    setEditingAsignacion(asignacion.id);
    setEditData({
      cantidad_asignada: asignacion.cantidad_asignada.toString(),
      cantidad_utilizada: asignacion.cantidad_utilizada?.toString() || '',
      estado: asignacion.estado || 'asignado',
      notas: asignacion.notas || ''
    });
  };

  const handleSave = (id) => {
    const data = {
      cantidad_asignada: parseFloat(editData.cantidad_asignada),
      cantidad_utilizada: editData.cantidad_utilizada ? parseFloat(editData.cantidad_utilizada) : null,
      estado: editData.estado,
      notas: editData.notas
    };
    updateAsignacionMutation.mutate({ id, data });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/asignaciones')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salón {salon.nombre}</h1>
            <p className="text-gray-600 mt-1">Inventario y eventos de este salón</p>
          </div>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries(['inventario-salon', salonId]);
            queryClient.invalidateQueries(['contratos-salon', salonId]);
            toast.success('Datos actualizados');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items en Inventario</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inventario.length}
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Bajo Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {itemsBajoStock.length}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eventos Programados</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {contratos.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {itemsBajoStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Alertas de Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsBajoStock.slice(0, 6).map((item) => (
              <div key={item.item_id} className="bg-white rounded p-3 border border-red-200">
                <div className="font-medium text-gray-900">{item.inventario_items?.nombre}</div>
                <div className="text-sm text-gray-600">
                  Actual: {parseFloat(item.cantidad_actual).toFixed(2)} {item.inventario_items?.unidad_medida}
                </div>
                <div className="text-sm text-red-600">
                  Mínimo: {parseFloat(item.cantidad_minima || 10).toFixed(2)} {item.inventario_items?.unidad_medida}
                </div>
              </div>
            ))}
          </div>
          {itemsBajoStock.length > 6 && (
            <p className="text-sm text-red-700 mt-3">
              +{itemsBajoStock.length - 6} items más con stock bajo
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventario del Salón */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Inventario del Salón</h2>
            <p className="text-sm text-gray-600 mt-1">{inventario.length} items disponibles</p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {inventario.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {inventario.map((item) => (
                  <div
                    key={item.item_id}
                    className={`p-4 rounded-lg border ${
                      item.necesita_reposicion
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {item.inventario_items?.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.inventario_items?.categoria || 'Sin categoría'}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Actual:</span>
                            <span className={`font-medium ${
                              item.necesita_reposicion ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {parseFloat(item.cantidad_actual).toFixed(2)} {item.inventario_items?.unidad_medida}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Mínimo:</span>
                            <span className="text-gray-900">
                              {parseFloat(item.cantidad_minima || 10).toFixed(2)} {item.inventario_items?.unidad_medida}
                            </span>
                          </div>
                        </div>
                      </div>
                      {item.necesita_reposicion && (
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay items en el inventario de este salón
              </div>
            )}
          </div>
        </div>

        {/* Eventos/Contratos del Salón */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Eventos Programados</h2>
            <p className="text-sm text-gray-600 mt-1">{contratos.length} eventos</p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {contratos.length > 0 ? (
              <div className="space-y-3">
                {contratos.map((contrato) => {
                  const fechaEvento = new Date(contrato.fecha_evento);
                  const fechaHoy = new Date();
                  fechaHoy.setHours(0, 0, 0, 0);
                  const diasRestantes = Math.ceil((fechaEvento - fechaHoy) / (1000 * 60 * 60 * 24));
                  const necesitaAsignacion = !contrato.asignaciones_inventario || contrato.asignaciones_inventario.length === 0;

                  return (
                    <div
                      key={contrato.id}
                      onClick={() => {
                        setSelectedContrato(contrato.id);
                        setCalculadoData(null);
                      }}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedContrato === contrato.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{contrato.codigo_contrato}</div>
                        <div className="flex items-center gap-2">
                          {diasRestantes <= 30 && diasRestantes >= 0 && necesitaAsignacion && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
                              ⚠️ {diasRestantes} días
                            </span>
                          )}
                          {diasRestantes <= 30 && diasRestantes >= 0 && !necesitaAsignacion && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                              {diasRestantes} días
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            contrato.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {contrato.estado}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {contrato.clientes?.nombre_completo}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {fechaEvento.toLocaleDateString('es-ES')} - {contrato.cantidad_invitados} invitados
                        </div>
                        {contrato.asignaciones_inventario && contrato.asignaciones_inventario.length > 0 && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Inventario asignado ({contrato.asignaciones_inventario.length} items)
                          </div>
                        )}
                        {necesitaAsignacion && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            Sin asignación de inventario
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay eventos programados para este salón
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Detalles del Contrato Seleccionado */}
      {contratoSeleccionado && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles del Contrato: {contratoSeleccionado.codigo_contrato}
              </h2>
              <button
                onClick={() => {
                  setSelectedContrato(null);
                  setCalculadoData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Contrato */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Evento</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Cliente:</span> {contratoSeleccionado.clientes?.nombre_completo}</div>
                    <div><span className="font-medium">Fecha Evento:</span> {new Date(contratoSeleccionado.fecha_evento).toLocaleDateString('es-ES')}</div>
                    <div><span className="font-medium">Invitados:</span> {contratoSeleccionado.cantidad_invitados}</div>
                    <div><span className="font-medium">Paquete:</span> {contratoSeleccionado.paquetes?.nombre}</div>
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
                      {asignarMutation.isPending ? 'Asignando...' : 'Asignar Automáticamente'}
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
                  </div>
                )}
              </div>

              {/* Asignaciones Existentes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Asignaciones de Inventario ({asignaciones.length})
                </h3>
                {asignaciones.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {asignaciones.map((asignacion) => (
                      <div
                        key={asignacion.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {asignacion.inventario_items?.nombre}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full mt-1 inline-block ${
                              asignacion.estado === 'asignado' ? 'bg-blue-100 text-blue-800' :
                              asignacion.estado === 'utilizado' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {asignacion.estado}
                            </span>
                          </div>
                          {editingAsignacion === asignacion.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(asignacion.id)}
                                className="text-green-600 hover:text-green-700"
                                disabled={updateAsignacionMutation.isPending}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAsignacion(null);
                                  setEditData({ cantidad_asignada: '', cantidad_utilizada: '', estado: '', notas: '' });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(asignacion)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cantidad Asignada:</span>
                            {editingAsignacion === asignacion.id ? (
                              <input
                                type="number"
                                value={editData.cantidad_asignada}
                                onChange={(e) => setEditData({ ...editData, cantidad_asignada: e.target.value })}
                                min="0"
                                step="0.01"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">
                                {parseFloat(asignacion.cantidad_asignada).toFixed(2)} {asignacion.inventario_items?.unidad_medida}
                              </span>
                            )}
                          </div>
                          {asignacion.cantidad_utilizada && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cantidad Utilizada:</span>
                              {editingAsignacion === asignacion.id ? (
                                <input
                                  type="number"
                                  value={editData.cantidad_utilizada}
                                  onChange={(e) => setEditData({ ...editData, cantidad_utilizada: e.target.value })}
                                  min="0"
                                  step="0.01"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="font-medium text-gray-900">
                                  {parseFloat(asignacion.cantidad_utilizada).toFixed(2)} {asignacion.inventario_items?.unidad_medida}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Fuente: {asignacion.fuente}
                          </div>
                        </div>
                        {editingAsignacion === asignacion.id && (
                          <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                            <div>
                              <label className="text-xs text-gray-600">Estado:</label>
                              <select
                                value={editData.estado}
                                onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                                className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="asignado">Asignado</option>
                                <option value="utilizado">Utilizado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Notas:</label>
                              <input
                                type="text"
                                value={editData.notas}
                                onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
                                placeholder="Notas adicionales"
                                className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No hay asignaciones de inventario para este contrato</p>
                    <p className="text-sm mt-1">Calcula y asigna el inventario necesario</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalonInventario;

