import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  Loader2,
  Download,
  Table,
  Music,
  MessageCircle,
  Settings,
  X,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import api from '../config/api';
import { formatearHora, calcularDuracion, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';
import ModalConfirmacionPago from '../components/ModalConfirmacionPago';
import ModalAnularPago from '../components/ModalAnularPago';
import toast, { Toaster } from 'react-hot-toast';

function DetalleContrato() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const showPagoForm = searchParams.get('action') === 'pago';

  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    tipo_tarjeta: '',
    numero_referencia: '',
    notas: '',
  });

  // Estados para los modales
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [pagoAAnular, setPagoAAnular] = useState(null);
  const [mostrarCodigoAcceso, setMostrarCodigoAcceso] = useState(false);
  
  // Estado para notas internas
  const [notasInternas, setNotasInternas] = useState('');
  const [editandoNotas, setEditandoNotas] = useState(false);

  // Query para obtener el contrato
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${id}`);
      return response.data.contrato;
    },
    onSuccess: (data) => {
      // Inicializar notas internas cuando se carga el contrato
      setNotasInternas(data?.notas_vendedor || '');
    },
  });

  // Query para obtener los pagos
  const { data: pagos } = useQuery({
    queryKey: ['pagos-contrato', id],
    queryFn: async () => {
      const response = await api.get(`/pagos/contrato/${id}`);
      return response.data.pagos;
    },
  });

  // Query para obtener las versiones del contrato
  const { data: versionesData } = useQuery({
    queryKey: ['versiones-contrato', id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${id}/versiones`);
      return response.data;
    },
  });

  // Mutation para registrar pago
  const mutationPago = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/pagos', {
        ...data,
        contrato_id: parseInt(id),
        monto: parseFloat(data.monto),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['contrato', id]);
      queryClient.invalidateQueries(['pagos-contrato', id]);
      queryClient.invalidateQueries(['contratos']);
      queryClient.invalidateQueries(['versiones-contrato', id]);
      setFormPago({
        monto: '',
        metodo_pago: 'efectivo',
        tipo_tarjeta: '',
        numero_referencia: '',
        notas: '',
      });
      setModalConfirmacionOpen(false);
      
      // Mostrar mensaje con información de la nueva versión
      const mensaje = data?.version_contrato 
        ? `✅ Pago registrado exitosamente\n📄 ${data.version_contrato.mensaje}`
        : '✅ Pago registrado exitosamente';
      
      toast.success(mensaje, {
        duration: 5000,
        icon: '💰',
      });
    },
    onError: (error) => {
      console.error('Error al registrar pago:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Error al registrar pago';
      toast.error(errorMsg, { duration: 4000 });
      setModalConfirmacionOpen(false);
    },
  });

  // Mutation para anular pago
  const mutationAnularPago = useMutation({
    mutationFn: async ({ pagoId, motivo }) => {
      const response = await api.put(`/pagos/${pagoId}/anular`, { motivo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato', id]);
      queryClient.invalidateQueries(['pagos-contrato', id]);
      queryClient.invalidateQueries(['contratos']);
      setModalAnularOpen(false);
      setPagoAAnular(null);
      toast.success('✅ Pago anulado exitosamente', {
        duration: 3000,
        icon: '🔄',
      });
    },
    onError: (error) => {
      console.error('Error al anular pago:', error);
      const errorMsg = error.response?.data?.message || 'Error al anular pago';
      toast.error(errorMsg, { duration: 4000 });
      setModalAnularOpen(false);
    },
  });

  // Mutation para actualizar notas internas
  const mutationNotasInternas = useMutation({
    mutationFn: async (notas) => {
      const response = await api.put(`/contratos/${id}/notas`, { notas_vendedor: notas });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato', id]);
      setEditandoNotas(false);
      toast.success('✅ Notas guardadas exitosamente', {
        duration: 3000,
        icon: '📝',
      });
    },
    onError: (error) => {
      console.error('Error al guardar notas:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar notas';
      toast.error(errorMsg, { duration: 4000 });
    },
  });

  const handlePagoSubmit = (e) => {
    e.preventDefault();
    
    // Validar monto
    if (!formPago.monto || parseFloat(formPago.monto) <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }
    
    // Abrir modal de confirmación en lugar de enviar directamente
    setModalConfirmacionOpen(true);
  };

  const handleConfirmarPago = () => {
    // Capitalizar el método de pago para que coincida con el backend
    const dataToSubmit = {
      ...formPago,
      metodo_pago: formPago.metodo_pago.charAt(0).toUpperCase() + formPago.metodo_pago.slice(1)
    };
    
    mutationPago.mutate(dataToSubmit);
  };

  const handleAbrirModalAnular = (pago) => {
    setPagoAAnular(pago);
    setModalAnularOpen(true);
  };

  const handleConfirmarAnulacion = (pagoId, motivo) => {
    mutationAnularPago.mutate({ pagoId, motivo });
  };

  const handlePagoChange = (e) => {
    setFormPago({
      ...formPago,
      [e.target.name]: e.target.value,
    });
  };

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'otro', label: 'Otro' },
  ];

  const handleDescargarContrato = async () => {
    try {
      const response = await api.get(`/contratos/${id}/pdf-contrato`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${contrato?.codigo_contrato}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el contrato');
      console.error(error);
    }
  };

  const handleDescargarVersion = async (versionNumero) => {
    try {
      const response = await api.get(`/contratos/${id}/versiones/${versionNumero}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${contrato?.codigo_contrato}-v${versionNumero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar la versión del contrato');
      console.error(error);
    }
  };

  const handleEnviarContratoPorEmail = async () => {
    const confirmacion = window.confirm(
      `¿Enviar contrato por email a ${contrato?.clientes?.email}?`
    );
    
    if (!confirmacion) return;

    try {
      await api.post(`/emails/contrato/${id}`);
      alert(`✅ Contrato enviado exitosamente a ${contrato?.clientes?.email}`);
    } catch (error) {
      console.error('Error al enviar contrato:', error);
      alert('❌ Error al enviar el contrato por email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEnviarRecordatorioPago = async () => {
    const confirmacion = window.confirm(
      `¿Enviar recordatorio de pago a ${contrato?.clientes?.email}?\n\nSaldo pendiente: $${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}`
    );
    
    if (!confirmacion) return;

    try {
      await api.post(`/emails/recordatorio-pago/${id}`);
      alert(`✅ Recordatorio enviado exitosamente a ${contrato?.clientes?.email}`);
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      alert('❌ Error al enviar el recordatorio: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGuardarNotas = () => {
    mutationNotasInternas.mutate(notasInternas);
  };

  const handleCancelarNotas = () => {
    setNotasInternas(contrato?.notas_vendedor || '');
    setEditandoNotas(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to={showPagoForm ? `/contratos/${id}` : "/contratos"} 
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-4xl">{getEventoEmoji(contrato)}</span>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {generarNombreEvento(contrato)}
            </h1>
            <p className="text-sm text-gray-500 font-mono mt-1">
              {contrato?.codigo_contrato}
            </p>
            <p className="text-gray-600 mt-1">
              Cliente: {contrato?.clientes?.nombre_completo || 'Sin cliente'}
            </p>
          </div>
        </div>
        {!showPagoForm && (
          <div className="flex gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              contrato?.estado === 'activo' ? 'bg-green-100 text-green-800' :
              contrato?.estado === 'completado' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {contrato?.estado}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              contrato?.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' :
              contrato?.estado_pago === 'parcial' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {contrato?.estado_pago === 'pagado' ? 'Pagado Completo' :
               contrato?.estado_pago === 'parcial' ? 'Pago Parcial' :
               'Pendiente de Pago'}
            </span>
          </div>
        )}
      </div>

      {/* Formulario de Pago (Solo cuando showPagoForm es true) */}
      {showPagoForm && contrato?.estado_pago !== 'pagado' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago</h2>
          <form onSubmit={handlePagoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="monto"
                  value={formPago.monto}
                  onChange={handlePagoChange}
                  step="0.01"
                  min="0.01"
                  max={parseFloat(contrato?.saldo_pendiente || 0)}
                  required
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Saldo pendiente: ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago *
              </label>
              <select
                name="metodo_pago"
                value={formPago.metodo_pago}
                onChange={handlePagoChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="cheque">📝 Cheque</option>
              </select>
            </div>

            {formPago.metodo_pago === 'tarjeta' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Tarjeta *
                </label>
                <select
                  name="tipo_tarjeta"
                  value={formPago.tipo_tarjeta}
                  onChange={handlePagoChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccione tipo de tarjeta</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Referencia
              </label>
              <input
                type="text"
                name="numero_referencia"
                value={formPago.numero_referencia}
                onChange={handlePagoChange}
                placeholder="Ej: TRF-20250103-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                name="notas"
                value={formPago.notas}
                onChange={handlePagoChange}
                rows="3"
                placeholder="Información adicional sobre el pago..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                to={`/contratos/${id}`}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={mutationPago.isLoading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutationPago.isLoading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Todo el resto del contenido (Solo cuando NO estás en modo pago) */}
      {!showPagoForm && (
        <>
          {/* Botones de Descarga de PDFs y Acciones */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/contratos/${id}/mesas`}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Table className="w-5 h-5" />
            Asignación de Mesas
          </Link>
          <Link
            to={`/contratos/${id}/playlist`}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            <Music className="w-5 h-5" />
            Playlist Musical
          </Link>
          <Link
            to={`/chat/${id}`}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            Chat con Cliente
          </Link>
          <Link
            to={`/ajustes/${id}`}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
          >
            <Settings className="w-5 h-5" />
            Ajustes del Evento
          </Link>
          <button
            onClick={handleDescargarContrato}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Descargar PDF
          </button>
          <button
            onClick={handleEnviarContratoPorEmail}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Mail className="w-5 h-5" />
            Enviar por Email
          </button>
          {parseFloat(contrato?.saldo_pendiente || 0) > 0 && (
            <button
              onClick={handleEnviarRecordatorioPago}
              className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
            >
              <Mail className="w-5 h-5" />
              Recordatorio de Pago
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Evento */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fecha del Evento</p>
                  <p className="font-medium">
                    {contrato?.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'Fecha no disponible'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Horario</p>
                  <p className="font-medium">
                    {(() => {
                      const horasAdicionales = obtenerHorasAdicionales(contrato?.contratos_servicios);
                      const horaFinConExtras = calcularHoraFinConExtras(contrato?.hora_fin, horasAdicionales);
                      const duracion = calcularDuracion(contrato?.hora_inicio, horaFinConExtras);
                      
                      return (
                        <>
                          {formatearHora(contrato?.hora_inicio)} / {formatearHora(horaFinConExtras)}
                          {duracion > 0 && (() => {
                            const horasEnteras = Math.floor(duracion);
                            const minutos = Math.round((duracion - horasEnteras) * 60);
                            if (minutos > 0) {
                              return ` • ${horasEnteras}h ${minutos}m`;
                            }
                            return ` • ${horasEnteras} ${horasEnteras === 1 ? 'hora' : 'horas'}`;
                          })()}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Lugar</p>
                  <p className="font-medium">{contrato?.ofertas?.lugar_evento || contrato?.eventos?.nombre_evento || 'No especificado'}</p>
                </div>
              </div>

              {contrato?.homenajeado && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                    🎉
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Homenajeado/a</p>
                    <p className="font-medium">{contrato.homenajeado}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Invitados</p>
                  <p className="font-medium">{contrato?.cantidad_invitados || 0} personas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paquete y Servicios */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paquete y Servicios</h2>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-1">
                  {contrato?.paquetes?.nombre || 'Paquete no especificado'}
                </h3>
                <p className="text-sm text-indigo-700">
                  {contrato?.paquetes?.descripcion || ''}
                </p>
              </div>

              {(() => {
                // Función helper para obtener el nombre del servicio ajustado según el salón
                const obtenerNombreServicio = (nombreServicio) => {
                  if (!nombreServicio) return nombreServicio;
                  
                  const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';
                  
                  // Reemplazar Pantalla LED por Pantalla TV en Doral
                  if (salonNombre === 'Doral' && nombreServicio === 'Pantalla LED') {
                    return 'Pantalla TV';
                  }
                  
                  // Agregar información de millas a Limosina
                  if (nombreServicio === 'Limosina') {
                    return 'Limosina (15 Millas)';
                  }
                  
                  return nombreServicio;
                };

                // Separar servicios incluidos en el paquete de servicios adicionales
                const serviciosIncluidos = [];
                const serviciosAdicionales = [];
                const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';

                // Obtener servicios del paquete
                if (contrato?.paquetes?.paquetes_servicios) {
                  contrato.paquetes.paquetes_servicios.forEach((ps) => {
                    const nombreServicio = ps.servicios?.nombre || '';
                    
                    // Filtrar Máquina de Chispas si el salón es Kendall
                    if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
                      return; // No mostrar este servicio
                    }
                    
                    serviciosIncluidos.push({
                      id: `paquete-${ps.servicio_id}`,
                      nombre: obtenerNombreServicio(nombreServicio),
                      incluido: true
                    });
                  });
                }

                // Obtener servicios adicionales del contrato
                if (contrato?.contratos_servicios) {
                  // Filtrar servicios mutuamente excluyentes (solo mostrar un Photobooth)
                  const serviciosFiltrados = [];
                  let photoboothConPrecio = null;
                  let photoboothSinPrecio = null;
                  
                  for (const cs of contrato.contratos_servicios) {
                    // Solo procesar servicios adicionales (no incluidos en paquete)
                    if (cs.incluido_en_paquete) {
                      continue;
                    }
                    
                    const nombreServicio = cs.servicios?.nombre || '';
                    const subtotal = parseFloat(cs.subtotal || 0);
                    const precioUnitario = parseFloat(cs.precio_unitario || 0);
                    
                    // Filtrar Máquina de Chispas si el salón es Kendall
                    if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
                      continue; // No mostrar este servicio
                    }
                    
                    if (nombreServicio.includes('Photobooth')) {
                      // Priorizar el que tiene precio/subtotal > 0 (el realmente seleccionado)
                      if (subtotal > 0 || precioUnitario > 0) {
                        photoboothConPrecio = cs;
                      } else {
                        // Guardar como respaldo si no hay uno con precio
                        if (!photoboothSinPrecio) {
                          photoboothSinPrecio = cs;
                        }
                      }
                      continue;
                    }
                    
                    // Para otros servicios, agregar normalmente
                    serviciosFiltrados.push(cs);
                  }
                  
                  // Agregar el Photobooth seleccionado (priorizar el que tiene precio)
                  if (photoboothConPrecio) {
                    serviciosFiltrados.push(photoboothConPrecio);
                  } else if (photoboothSinPrecio) {
                    serviciosFiltrados.push(photoboothSinPrecio);
                  }
                  
                  serviciosFiltrados.forEach((cs) => {
                    serviciosAdicionales.push({
                      id: cs.id,
                      nombre: obtenerNombreServicio(cs.servicios?.nombre || ''),
                      subtotal: parseFloat(cs.subtotal || 0),
                      cantidad: cs.cantidad || 1,
                      precio_unitario: parseFloat(cs.precio_unitario || 0)
                    });
                  });
                }

                return (
                  <>
                    {/* Servicios Incluidos en el Paquete */}
                    {serviciosIncluidos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Servicios Incluidos en el Paquete:</h4>
                        <ul className="space-y-2">
                          {serviciosIncluidos.map((servicio) => (
                            <li key={servicio.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                ✓ {servicio.nombre}
                              </span>
                              <span className="text-gray-500 text-xs">Incluido</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Servicios Adicionales */}
                    {serviciosAdicionales.length > 0 && (
                      <div className={serviciosIncluidos.length > 0 ? 'mt-4' : ''}>
                        <h4 className="font-medium text-gray-900 mb-2">Servicios Adicionales:</h4>
                        <ul className="space-y-2">
                          {serviciosAdicionales.map((servicio) => (
                            <li key={servicio.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {servicio.nombre}
                                {servicio.cantidad > 1 && (
                                  <span className="text-gray-500 text-xs ml-1">
                                    (x{servicio.cantidad})
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">
                                ${servicio.subtotal.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {serviciosIncluidos.length === 0 && serviciosAdicionales.length === 0 && (
                      <p className="text-sm text-gray-500">No hay servicios registrados</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
 
            {/* Notas Internas del Vendedor */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Notas Internas
                </h2>
                {!editandoNotas ? (
                  <button
                    onClick={() => setEditandoNotas(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                  >
                    {contrato?.notas_vendedor ? 'Editar Notas' : 'Agregar Notas'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelarNotas}
                      disabled={mutationNotasInternas.isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarNotas}
                      disabled={mutationNotasInternas.isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2"
                    >
                      {mutationNotasInternas.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {editandoNotas ? (
                <div>
                  <textarea
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    rows="6"
                    placeholder="Escribe tus notas internas aquí... (Solo visibles para vendedores)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Estas notas solo son visibles para vendedores y no aparecen en documentos del cliente.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  {contrato?.notas_vendedor ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contrato.notas_vendedor}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay notas registradas aún.</p>
                  )}
                </div>
              )}
            </div>
  
            {/* Historial de Pagos */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h2>
            {pagos?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No se han registrado pagos aún
              </p>
            ) : (
              <div className="space-y-3">
                {pagos?.map((pago) => (
                  <div 
                    key={pago.id} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      pago.estado === 'anulado' 
                        ? 'bg-red-50 border-2 border-red-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        pago.estado === 'anulado' 
                          ? 'bg-red-100' 
                          : 'bg-green-100'
                      }`}>
                        <CreditCard className={`w-5 h-5 ${
                          pago.estado === 'anulado' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${
                            pago.estado === 'anulado' 
                              ? 'text-red-900 line-through' 
                              : 'text-gray-900'
                          }`}>
                            ${parseFloat(pago.monto_total || pago.monto).toLocaleString()}
                          </p>
                          {pago.estado === 'anulado' && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                              ANULADO
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          pago.estado === 'anulado' 
                            ? 'text-red-700' 
                            : 'text-gray-600'
                        }`}>
                          {pago.metodo_pago} - {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                        </p>
                        {pago.numero_referencia && (
                          <p className="text-xs text-gray-500">Ref: {pago.numero_referencia}</p>
                        )}
                        {pago.vendedores && (
                          <p className="text-xs text-gray-500">
                            Por: {pago.vendedores.nombre_completo}
                          </p>
                        )}
                      </div>
                    </div>
                    {pago.estado !== 'anulado' && (
                      <button
                        onClick={() => handleAbrirModalAnular(pago)}
                        className="ml-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition text-sm font-medium flex items-center gap-1"
                        title="Anular pago"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Anular</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Versiones del Contrato */}
          {versionesData && versionesData.versiones && versionesData.versiones.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📄 Versiones del Contrato
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Historial de todas las versiones generadas del contrato
              </p>
              <div className="space-y-3">
                {versionesData.versiones.map((version, index) => {
                  const esUltimaVersion = index === 0;
                  const versionAnterior = versionesData.versiones[index + 1];
                  const diferenciaTotal = versionAnterior 
                    ? parseFloat(version.total_contrato) - parseFloat(versionAnterior.total_contrato)
                    : 0;

                  return (
                    <div 
                      key={version.id}
                      className={`p-4 rounded-lg border-2 ${
                        esUltimaVersion 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              v{version.version_numero}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Versión {version.version_numero}
                                {esUltimaVersion && (
                                  <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                    Actual
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          {version.motivo_cambio && (
                            <p className="text-sm text-gray-700 mb-2">
                              {version.motivo_cambio}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              Total: <strong className="text-gray-900">
                                ${parseFloat(version.total_contrato).toLocaleString()}
                              </strong>
                            </span>
                            {version.cantidad_invitados && (
                              <span className="text-gray-600">
                                Invitados: <strong className="text-gray-900">
                                  {version.cantidad_invitados}
                                </strong>
                              </span>
                            )}
                          </div>

                          {versionAnterior && diferenciaTotal !== 0 && (
                            <p className={`text-xs mt-2 ${
                              diferenciaTotal > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {diferenciaTotal > 0 ? '↗' : '↘'} 
                              {diferenciaTotal > 0 ? '+' : ''}
                              ${Math.abs(diferenciaTotal).toLocaleString()} vs v{version.version_numero - 1}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDescargarVersion(version.version_numero)}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                {versionesData.total} {versionesData.total === 1 ? 'versión' : 'versiones'} disponibles
              </p>
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Total:</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(contrato?.total_contrato || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Pagado:</span>
                <span className="font-semibold text-green-600">
                  ${parseFloat(contrato?.total_pagado || 0).toLocaleString()}
                </span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="text-gray-900 font-medium">Saldo Pendiente:</span>
                <span className="font-bold text-orange-600">
                  ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso de Pago</span>
                <span>
                  {contrato?.total_contrato > 0
                    ? ((parseFloat(contrato?.total_pagado || 0) / parseFloat(contrato?.total_contrato)) * 100).toFixed(0)
                    : 0
                  }%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${contrato?.total_contrato > 0
                      ? (parseFloat(contrato?.total_pagado || 0) / parseFloat(contrato?.total_contrato)) * 100
                      : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Información del Contrato */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 mb-2">Código de Acceso Cliente:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-indigo-600 flex-1">
                    {mostrarCodigoAcceso 
                      ? contrato?.codigo_acceso_cliente 
                      : '••••••••••••••••••••'}
                  </p>
                  <button
                    onClick={() => setMostrarCodigoAcceso(!mostrarCodigoAcceso)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                  >
                    {mostrarCodigoAcceso ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Mostrar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Código privado para acceso del cliente al portal
                </p>
              </div>
              <div>
                <p className="text-gray-600">Fecha de Creación:</p>
                <p className="font-medium">
                  {contrato?.fecha_firma 
                    ? new Date(contrato.fecha_firma).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No especificada'}
                </p>
              </div>
              {contrato?.notas_internas && (
                <div>
                  <p className="text-gray-600">Notas Internas:</p>
                  <p className="font-medium">{contrato?.notas_internas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Modales (siempre disponibles) */}
      <ModalConfirmacionPago
        isOpen={modalConfirmacionOpen}
        onClose={() => setModalConfirmacionOpen(false)}
        datosPago={formPago}
        contrato={contrato}
        onConfirm={handleConfirmarPago}
        loading={mutationPago.isPending}
      />

      <ModalAnularPago
        isOpen={modalAnularOpen}
        onClose={() => {
          setModalAnularOpen(false);
          setPagoAAnular(null);
        }}
        pago={pagoAAnular}
        contrato={contrato}
        onConfirm={handleConfirmarAnulacion}
        loading={mutationAnularPago.isPending}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default DetalleContrato;

