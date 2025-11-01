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
} from 'lucide-react';
import api from '../config/api';
import { formatearHora } from '../utils/formatters';
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
    numero_referencia: '',
    notas: '',
  });

  // Estados para los modales
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [pagoAAnular, setPagoAAnular] = useState(null);
  const [mostrarCodigoAcceso, setMostrarCodigoAcceso] = useState(false);

  // Query para obtener el contrato
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${id}`);
      return response.data.contrato;
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
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato', id]);
      queryClient.invalidateQueries(['pagos-contrato', id]);
      queryClient.invalidateQueries(['contratos']);
      setFormPago({
        monto: '',
        metodo_pago: 'efectivo',
        numero_referencia: '',
        notas: '',
      });
      setModalConfirmacionOpen(false);
      toast.success('✅ Pago registrado exitosamente', {
        duration: 3000,
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
        <Link to="/contratos" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
      </div>

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
            Descargar Contrato PDF
          </button>
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
                    {formatearHora(contrato?.hora_inicio)} - {formatearHora(contrato?.hora_fin)}
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

              {contrato?.contratos_servicios?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Servicios Adicionales:</h4>
                  <ul className="space-y-2">
                    {contrato?.contratos_servicios?.map((cs) => (
                      <li key={cs.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {cs.servicios?.nombre || 'Servicio'}
                        </span>
                        <span className="font-medium">
                          ${parseFloat(cs.subtotal || 0).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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

          {/* Formulario de Pago */}
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
                    Máximo: ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
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
                    {metodosPago.map((metodo) => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Referencia
                  </label>
                  <input
                    type="text"
                    name="numero_referencia"
                    value={formPago.numero_referencia}
                    onChange={handlePagoChange}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                {mutationPago.isError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      {mutationPago.error.response?.data?.message || 'Error al registrar pago'}
                    </p>
                  </div>
                )}

                {mutationPago.isSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ¡Pago registrado exitosamente!
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutationPago.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutationPago.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Registrar Pago
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

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

          {/* Acciones */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                <FileText className="w-4 h-4" />
                Enviar por Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <Toaster position="top-right" />
      
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
    </div>
  );
}

export default DetalleContrato;

