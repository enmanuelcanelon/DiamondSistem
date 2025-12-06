import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const SERVICIOS_LABELS = {
  limosina: 'Limosina',
  hora_loca: 'Hora Loca',
  animador: 'Animador',
  chef: 'Chef'
};

const ESTADOS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  en_proceso: 'bg-blue-100 text-blue-800 border-blue-300',
  completado: 'bg-green-100 text-green-800 border-green-300'
};

const ESTADOS_ICONS = {
  pendiente: Clock,
  en_proceso: AlertCircle,
  completado: CheckCircle2
};

function ChecklistManager() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    contacto_realizado: false,
    fecha_contacto: '',
    notas: '',
    estado: 'pendiente'
  });

  // Obtener contratos con checklist
  const { data: contratosData, isLoading, isError } = useQuery({
    queryKey: ['manager-contratos'],
    queryFn: async () => {
      const response = await api.get('/managers/contratos');
      return response.data;
    },
  });

  // Mutación para actualizar checklist
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ contratoId, servicioTipo, data }) => {
      const response = await api.post('/managers/checklist', {
        contrato_id: contratoId,
        servicio_tipo: servicioTipo,
        ...data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manager-contratos']);
      toast.success('Checklist actualizado exitosamente');
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al completar la operación');
    }
  });

  const handleEdit = (item, contratoId) => {
    setEditingItem(`${contratoId}-${item.servicio_tipo}`);
    setEditForm({
      contacto_realizado: item.contacto_realizado || false,
      fecha_contacto: item.fecha_contacto ? new Date(item.fecha_contacto).toISOString().slice(0, 16) : '',
      notas: item.notas || '',
      estado: item.estado || 'pendiente'
    });
  };

  const handleSave = (contratoId, servicioTipo) => {
    updateChecklistMutation.mutate({
      contratoId,
      servicioTipo,
      data: {
        contacto_realizado: editForm.contacto_realizado,
        fecha_contacto: editForm.fecha_contacto || null,
        notas: editForm.notas,
        estado: editForm.estado
      }
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({
      contacto_realizado: false,
      fecha_contacto: '',
      notas: '',
      estado: 'pendiente'
    });
  };

  const handleQuickToggle = (contratoId, servicioTipo, contactoRealizado) => {
    updateChecklistMutation.mutate({
      contratoId,
      servicioTipo,
      data: {
        contacto_realizado: !contactoRealizado
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="ml-3 text-gray-600">Cargando contratos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error al cargar los contratos</p>
      </div>
    );
  }

  const contratos = contratosData?.contratos || [];

  if (contratos.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay contratos activos</h3>
        <p className="text-gray-600">No hay contratos con servicios externos en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Checklist de Servicios Externos</h2>
        <p className="text-gray-600">
          Gestiona la confirmación de servicios externos para cada evento
        </p>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratos.map((contrato) => (
          <div key={contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header del Contrato */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {contrato.codigo_contrato}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{contrato.clientes?.nombre_completo}</span>
                    </div>
                    {contrato.eventos?.fecha_evento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {(() => {
                            const fechaStr = contrato.eventos.fecha_evento;
                            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                            if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
                              const [datePart] = fechaStr.split('T');
                              const [year, month, day] = datePart.split('-').map(Number);
                              const fecha = new Date(year, month - 1, day);
                              return `${dias[fecha.getDay()]}, ${day} de ${meses[month - 1]} de ${year}`;
                            }
                            return new Date(fechaStr).toLocaleDateString('es-ES', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York'
                            });
                          })()}
                        </span>
                      </div>
                    )}
                    {contrato.salones?.nombre && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{contrato.salones.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contrato.checklist?.map((item) => {
                  const itemKey = `${contrato.id}-${item.servicio_tipo}`;
                  const isEditing = editingItem === itemKey;
                  const EstadoIcon = ESTADOS_ICONS[item.estado] || Clock;

                  return (
                    <div
                      key={item.servicio_tipo}
                      className={`border-2 rounded-lg p-4 transition ${
                        item.estado === 'completado'
                          ? 'bg-green-50 border-green-200'
                          : item.estado === 'en_proceso'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {SERVICIOS_LABELS[item.servicio_tipo] || item.servicio_tipo}
                        </h4>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${ESTADOS_COLORS[item.estado] || ESTADOS_COLORS.pendiente}`}>
                          <EstadoIcon className="w-3 h-3" />
                          <span className="capitalize">{item.estado?.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`contacto-${itemKey}`}
                              checked={editForm.contacto_realizado}
                              onChange={(e) => setEditForm({ ...editForm, contacto_realizado: e.target.checked })}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor={`contacto-${itemKey}`} className="text-sm font-medium text-gray-700">
                              Contacto realizado
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de contacto
                            </label>
                            <input
                              type="datetime-local"
                              value={editForm.fecha_contacto}
                              onChange={(e) => setEditForm({ ...editForm, fecha_contacto: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estado
                            </label>
                            <select
                              value={editForm.estado}
                              onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="en_proceso">En Proceso</option>
                              <option value="completado">Completado</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notas
                            </label>
                            <textarea
                              value={editForm.notas}
                              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                              rows={3}
                              placeholder="Agregar notas sobre el contacto..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(contrato.id, item.servicio_tipo)}
                              disabled={updateChecklistMutation.isLoading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                              <Save className="w-4 h-4 inline mr-1" />
                              Guardar
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                              <X className="w-4 h-4 inline mr-1" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Contacto realizado:</span>
                            <button
                              onClick={() => handleQuickToggle(contrato.id, item.servicio_tipo, item.contacto_realizado)}
                              className={`w-12 h-6 rounded-full transition ${
                                item.contacto_realizado
                                  ? 'bg-emerald-600'
                                  : 'bg-gray-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition ${
                                  item.contacto_realizado ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>

                          {item.fecha_contacto && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Fecha:</span>{' '}
                              {new Date(item.fecha_contacto).toLocaleString('es-ES')}
                            </div>
                          )}

                          {item.notas && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Notas:</span> {item.notas}
                            </div>
                          )}

                          {item.managers && (
                            <div className="text-xs text-gray-500">
                              Gestionado por: {item.managers.nombre_completo}
                            </div>
                          )}

                          <button
                            onClick={() => handleEdit(item, contrato.id)}
                            className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChecklistManager;
