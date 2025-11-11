import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar,
  User,
  Building2,
  AlertCircle,
  Edit,
  Save,
  X,
  ChevronDown,
  Users,
  Package,
  Clock as ClockIcon,
  Cake,
  Sparkles,
  UtensilsCrossed,
  Music2,
  Camera,
  Settings,
  Wine,
  Download
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

const SERVICIOS_LABELS = {
  foto_video: 'Foto y Video',
  dj: 'DJ',
  comida: 'Comida',
  cake: 'Cake',
  mini_postres: 'Mini Postres',
  limosina: 'Limosina',
  hora_loca: 'Hora Loca',
  animador: 'Animador',
  maestro_ceremonia: 'Maestro de Ceremonia'
};

const ESTADOS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completado: 'bg-green-100 text-green-800 border-green-300'
};

const ESTADOS_ICONS = {
  pendiente: Clock,
  completado: CheckCircle2
};

function ChecklistManager() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [contratosExpandidos, setContratosExpandidos] = useState({});
  const [salonSeleccionado, setSalonSeleccionado] = useState(null); // null, 'Diamond', 'Kendall', 'Doral'
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1); // Mes actual (1-12)
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear()); // Año actual
  const [editForm, setEditForm] = useState({
    fecha_contacto: '',
    hora_contacto: '',
    fecha_pago: '',
    fecha_recogida: '',
    hora_recogida: '',
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
      toast.error(error.response?.data?.message || 'Error al actualizar checklist');
    }
  });

  const handleEdit = (item, contratoId) => {
    setEditingItem(`${contratoId}-${item.servicio_tipo}`);
    const fechaContacto = item.fecha_contacto ? new Date(item.fecha_contacto) : null;
    const fechaPago = item.fecha_pago ? new Date(item.fecha_pago) : null;
    const horaRecogida = item.hora_recogida ? new Date(item.hora_recogida) : null;
    
    setEditForm({
      fecha_contacto: fechaContacto ? fechaContacto.toISOString().split('T')[0] : '',
      hora_contacto: fechaContacto ? fechaContacto.toTimeString().slice(0, 5) : '',
      fecha_pago: fechaPago ? fechaPago.toISOString().split('T')[0] : '',
      fecha_recogida: horaRecogida ? horaRecogida.toISOString().split('T')[0] : '',
      hora_recogida: horaRecogida ? horaRecogida.toTimeString().slice(0, 5) : '',
      notas: item.notas || '',
      estado: item.estado || 'pendiente'
    });
  };

  const handleSave = (contratoId, servicioTipo) => {
    // Combinar fecha y hora para fecha_contacto
    let fechaContactoFinal = null;
    if (editForm.fecha_contacto) {
      if (editForm.hora_contacto) {
        fechaContactoFinal = `${editForm.fecha_contacto}T${editForm.hora_contacto}:00`;
      } else {
        fechaContactoFinal = `${editForm.fecha_contacto}T00:00:00`;
      }
    }

    // Solo fecha para fecha_pago (sin hora)
    let fechaPagoFinal = null;
    if (editForm.fecha_pago) {
      fechaPagoFinal = `${editForm.fecha_pago}T00:00:00`;
    }

    // Combinar fecha y hora para hora_recogida (solo limosina)
    let horaRecogidaFinal = null;
    if (editForm.fecha_recogida) {
      if (editForm.hora_recogida) {
        horaRecogidaFinal = `${editForm.fecha_recogida}T${editForm.hora_recogida}:00`;
      } else {
        horaRecogidaFinal = `${editForm.fecha_recogida}T00:00:00`;
      }
    }

    updateChecklistMutation.mutate({
      contratoId,
      servicioTipo,
      data: {
        fecha_contacto: fechaContactoFinal,
        fecha_pago: fechaPagoFinal,
        hora_recogida: horaRecogidaFinal,
        notas: editForm.notas,
        estado: editForm.estado
      }
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({
      fecha_contacto: '',
      hora_contacto: '',
      fecha_pago: '',
      fecha_recogida: '',
      hora_recogida: '',
      notas: '',
      estado: 'pendiente'
    });
  };


  const toggleContratoExpandido = (contratoId) => {
    setContratosExpandidos(prev => ({
      ...prev,
      [contratoId]: !prev[contratoId]
    }));
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

  // Filtrar contratos por salón y mes
  const contratosFiltrados = (contratosData?.contratos || []).filter(contrato => {
    // Filtro por salón
    if (salonSeleccionado) {
      const salonNombre = contrato.salones?.nombre || contrato.lugar_salon || '';
      if (salonNombre.toLowerCase() !== salonSeleccionado.toLowerCase()) {
        return false;
      }
    }

    // Filtro por mes y año
    const fechaEvento = contrato.fecha_evento || contrato.eventos?.fecha_evento;
    if (fechaEvento) {
      const fecha = new Date(fechaEvento);
      const mesEvento = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const anioEvento = fecha.getFullYear();
      
      if (mesEvento !== mesSeleccionado || anioEvento !== anioSeleccionado) {
        return false;
      }
    } else {
      // Si no hay fecha, no mostrar el contrato
      return false;
    }

    return true;
  });

  // Obtener meses disponibles para el año seleccionado
  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // Obtener años disponibles (año actual y siguientes 2 años)
  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    aniosDisponibles.push(anioActual + i);
  }

  const contratos = contratosFiltrados;

  if (!salonSeleccionado) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist de Servicios Externos</h1>
          <p className="text-gray-600">Selecciona un salón para ver los eventos</p>
        </div>

        {/* Botones de Salones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Diamond', 'Kendall', 'Doral'].map((salon) => (
            <button
              key={salon}
              onClick={() => setSalonSeleccionado(salon)}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg shadow-md p-8 transition-all transform hover:scale-105"
            >
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-700" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900">{salon}</h2>
              <p className="text-gray-600 text-sm">Ver eventos de {salon}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist de Servicios Externos</h1>
              <p className="text-gray-600">Salón: <span className="font-semibold">{salonSeleccionado}</span></p>
            </div>
            <button
              onClick={() => setSalonSeleccionado(null)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
              Cambiar Salón
            </button>
          </div>

          {/* Filtros de Mes y Año */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {meses.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>
                    {mes.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay eventos</h3>
          <p className="text-gray-600">
            No se encontraron eventos para {salonSeleccionado} en {meses.find(m => m.valor === mesSeleccionado)?.nombre} {anioSeleccionado}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist de Servicios Externos</h1>
            <p className="text-gray-600">Salón: <span className="font-semibold">{salonSeleccionado}</span></p>
          </div>
          <button
            onClick={() => setSalonSeleccionado(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
            Cambiar Salón
          </button>
        </div>

        {/* Filtros de Mes y Año */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {meses.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{contratos.length}</span> evento{contratos.length !== 1 ? 's' : ''} encontrado{contratos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratos.map((contrato) => (
          <div key={contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header del Contrato */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <button
                onClick={() => toggleContratoExpandido(contrato.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:opacity-80 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                    {contrato.codigo_contrato}
                  </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        contratosExpandidos[contrato.id] ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{contrato.clientes?.nombre_completo}</span>
                    </div>
                    {contrato.eventos?.fecha_evento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(contrato.eventos.fecha_evento).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
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
              </button>

              {/* Botón Descargar PDF de Ajustes - Solo visible cuando está expandido */}
              {contratosExpandidos[contrato.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200 px-6 pb-4">
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/ajustes/contrato/${contrato.id}/pdf`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Ajustes-Evento-${contrato.codigo_contrato || 'evento'}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          toast.success('PDF descargado exitosamente');
                        } catch (error) {
                          toast.error('Error al descargar el PDF');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar PDF</span>
                    </button>
                </div>
              </div>
              )}
            </div>

            {/* Checklist Items - Solo visible cuando está expandido */}
            {contratosExpandidos[contrato.id] && (
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
                          <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Contacto
                            </label>
                            <input
                                type="date"
                              value={editForm.fecha_contacto}
                              onChange={(e) => setEditForm({ ...editForm, fecha_contacto: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hora de Contacto
                              </label>
                              <input
                                type="time"
                                value={editForm.hora_contacto}
                                onChange={(e) => setEditForm({ ...editForm, hora_contacto: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                            </div>
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
                              <option value="completado">Completado</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Pago
                            </label>
                            <input
                              type="date"
                              value={editForm.fecha_pago}
                              onChange={(e) => setEditForm({ ...editForm, fecha_pago: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>

                          {item.servicio_tipo === 'limosina' && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Fecha de Recogida
                                </label>
                                <input
                                  type="date"
                                  value={editForm.fecha_recogida}
                                  onChange={(e) => setEditForm({ ...editForm, fecha_recogida: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Hora de Recogida
                                </label>
                                <input
                                  type="time"
                                  value={editForm.hora_recogida}
                                  onChange={(e) => setEditForm({ ...editForm, hora_recogida: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}

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

                          {item.fecha_contacto && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Fecha de Contacto:</span>{' '}
                              {new Date(item.fecha_contacto).toLocaleString('es-ES')}
                            </div>
                          )}

                          {item.fecha_pago && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Fecha de Pago:</span>{' '}
                              {new Date(item.fecha_pago).toLocaleString('es-ES')}
                            </div>
                          )}

                          {item.servicio_tipo === 'limosina' && item.hora_recogida && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Hora de Recogida:</span>{' '}
                              {new Date(item.hora_recogida).toLocaleString('es-ES')}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChecklistManager;
