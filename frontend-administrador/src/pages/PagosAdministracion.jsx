 import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building2,
  ChevronDown,
  X,
  CreditCard,
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function PagosAdministracion() {
  const queryClient = useQueryClient();
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [contratosExpandidos, setContratosExpandidos] = useState({});
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo_pago: 'Efectivo',
    tipo_tarjeta: '',
    numero_referencia: '',
    notas: ''
  });

  // Obtener todos los contratos del mes para el calendario (sin filtrar por salón)
  const { data: calendarioData, isLoading: loadingCalendario } = useQuery({
    queryKey: ['admin-calendario-contratos', mesSeleccionado, anioSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        anio: anioSeleccionado
      };
      const response = await api.get('/inventario/contratos', { params });
      return response.data;
    },
    enabled: !!mesSeleccionado && !!anioSeleccionado
  });

  // Obtener contratos filtrados
  const { data: contratosData, isLoading, isError } = useQuery({
    queryKey: ['admin-contratos', salonSeleccionado, mesSeleccionado, anioSeleccionado],
    queryFn: async () => {
      const params = {};
      if (salonSeleccionado) params.salon_nombre = salonSeleccionado;
      if (mesSeleccionado) params.mes = mesSeleccionado;
      if (anioSeleccionado) params.anio = anioSeleccionado;
      
      const response = await api.get('/inventario/contratos', { params });
      return response.data;
    },
    enabled: !!salonSeleccionado && !!mesSeleccionado && !!anioSeleccionado
  });

  // Mutation para registrar pago
  const mutationPago = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/pagos', {
        ...data,
        contrato_id: contratoSeleccionado.id,
        monto: parseFloat(data.monto),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-contratos']);
      setFormPago({
        monto: '',
        metodo_pago: 'Efectivo',
        tipo_tarjeta: '',
        numero_referencia: '',
        notas: ''
      });
      setMostrarModalPago(false);
      setContratoSeleccionado(null);
      
      const mensaje = data?.version_contrato 
        ? `✅ Pago registrado exitosamente\n📄 ${data.version_contrato.mensaje}`
        : '✅ Pago registrado exitosamente';
      
      toast.success(mensaje, {
        duration: 5000,
      });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Error al registrar pago';
      toast.error(errorMsg, { duration: 4000 });
    },
  });

  const toggleContratoExpandido = (contratoId) => {
    setContratosExpandidos(prev => ({
      ...prev,
      [contratoId]: !prev[contratoId]
    }));
  };

  const handleAbrirModalPago = (contrato) => {
    setContratoSeleccionado(contrato);
    setFormPago({
      monto: contrato.saldo_pendiente ? parseFloat(contrato.saldo_pendiente).toFixed(2) : '',
      metodo_pago: 'Efectivo',
      tipo_tarjeta: '',
      numero_referencia: '',
      notas: ''
    });
    setMostrarModalPago(true);
  };

  const handleRegistrarPago = (e) => {
    e.preventDefault();
    
    if (!formPago.monto || parseFloat(formPago.monto) <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    if (parseFloat(formPago.monto) > parseFloat(contratoSeleccionado.saldo_pendiente)) {
      toast.error(`El monto excede el saldo pendiente de $${parseFloat(contratoSeleccionado.saldo_pendiente).toFixed(2)}`);
      return;
    }

    if (formPago.metodo_pago === 'Tarjeta' && !formPago.tipo_tarjeta) {
      toast.error('Debe especificar el tipo de tarjeta');
      return;
    }

    mutationPago.mutate(formPago);
  };

  // Mutation para enviar contrato por email
  const mutationEnviarEmail = useMutation({
    mutationFn: async (contratoId) => {
      const response = await api.post(`/emails/contrato/${contratoId}`);
      return response.data;
    },
    onSuccess: (data, contratoId) => {
      const contrato = contratosData?.contratos?.find(c => c.id === contratoId);
      toast.success(`✅ Contrato enviado exitosamente a ${contrato?.clientes?.email || 'el cliente'}`, {
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Error al enviar el contrato por email';
      toast.error(errorMsg, { duration: 4000 });
    },
  });

  // Mutation para enviar recordatorio de pago
  const mutationRecordatorio = useMutation({
    mutationFn: async (contratoId) => {
      const response = await api.post(`/emails/recordatorio-pago/${contratoId}`);
      return response.data;
    },
    onSuccess: (data, contratoId) => {
      const contrato = contratosData?.contratos?.find(c => c.id === contratoId);
      toast.success(`✅ Recordatorio enviado exitosamente a ${contrato?.clientes?.email || 'el cliente'}`, {
        duration: 4000,
      });
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Error al enviar el recordatorio de pago';
      toast.error(errorMsg, { duration: 4000 });
    },
  });

  const handleEnviarContratoPorEmail = async (contrato) => {
    const confirmacion = window.confirm(
      `¿Enviar contrato por email a ${contrato.clientes?.email}?`
    );
    
    if (!confirmacion) return;
    mutationEnviarEmail.mutate(contrato.id);
  };

  const handleEnviarRecordatorioPago = async (contrato) => {
    const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);
    const confirmacion = window.confirm(
      `¿Enviar recordatorio de pago a ${contrato.clientes?.email}?\n\nSaldo pendiente: $${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
    
    if (!confirmacion) return;
    mutationRecordatorio.mutate(contrato.id);
  };

  // Obtener meses disponibles
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

  // Obtener años disponibles
  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = -1; i < 3; i++) {
    aniosDisponibles.push(anioActual + i);
  }

  // Funciones para el calendario
  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12);
        setAnioSeleccionado(anioSeleccionado - 1);
      } else {
        setMesSeleccionado(mesSeleccionado - 1);
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1);
        setAnioSeleccionado(anioSeleccionado + 1);
      } else {
        setMesSeleccionado(mesSeleccionado + 1);
      }
    }
  };

  const obtenerDiasDelMes = () => {
    const primerDia = new Date(anioSeleccionado, mesSeleccionado - 1, 1);
    const ultimoDia = new Date(anioSeleccionado, mesSeleccionado, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    return { diasEnMes, diaInicioSemana };
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const fechaActual = new Date();
  
  // Procesar eventos del calendario
  const contratosCalendario = calendarioData?.contratos || [];
  const eventosPorDia = {};
  
  contratosCalendario.forEach(contrato => {
    const fechaEvento = new Date(contrato.fecha_evento || contrato.eventos?.fecha_evento);
    if (fechaEvento.getMonth() + 1 === mesSeleccionado && 
        fechaEvento.getFullYear() === anioSeleccionado) {
      const dia = fechaEvento.getDate();
      if (!eventosPorDia[dia]) {
        eventosPorDia[dia] = [];
      }
      eventosPorDia[dia].push(contrato);
    }
  });

  // Función para determinar si un contrato está pagado
  const estaPagado = (contrato) => {
    const totalPagado = parseFloat(contrato.total_pagado || 0);
    const totalContrato = parseFloat(contrato.total_contrato || 0);
    return totalPagado >= totalContrato;
  };

  const estaParcialmentePagado = (contrato) => {
    const totalPagado = parseFloat(contrato.total_pagado || 0);
    const totalContrato = parseFloat(contrato.total_contrato || 0);
    return totalPagado > 0 && totalPagado < totalContrato;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

  if (!salonSeleccionado) {
    const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();
    const nombreMes = meses.find(m => m.valor === mesSeleccionado)?.nombre || '';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
          <p className="text-gray-600">Selecciona un salón para gestionar pagos y visualiza los eventos del mes</p>
        </div>

        {/* Botones de Salones */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Salón</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Diamond', 'Kendall', 'Doral'].map((salon) => (
              <button
                key={salon}
                onClick={() => setSalonSeleccionado(salon)}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg shadow-md p-8 transition-all transform hover:scale-105"
              >
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                <h2 className="text-2xl font-bold mb-2 text-gray-900">{salon}</h2>
                <p className="text-gray-600 text-sm">Ver contratos de {salon}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Controles del calendario */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => cambiarMes('anterior')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <h2 className="text-2xl font-bold text-gray-900">
                  {nombreMes} {anioSeleccionado}
                </h2>
              </div>
              <button
                onClick={() => cambiarMes('siguiente')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">Pagado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Parcial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">Pendiente</span>
              </div>
            </div>
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map((dia) => (
              <div key={dia} className="text-center font-semibold text-gray-700 py-2">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Días vacíos al inicio */}
            {Array.from({ length: diaInicioSemana }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200 rounded-lg"></div>
            ))}
            
            {/* Días del mes */}
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const dia = i + 1;
              const eventosDelDia = eventosPorDia[dia] || [];
              const esHoy = dia === fechaActual.getDate() && 
                           mesSeleccionado === fechaActual.getMonth() + 1 && 
                           anioSeleccionado === fechaActual.getFullYear();

              return (
                <div
                  key={dia}
                  className={`h-24 border rounded-lg p-1 overflow-y-auto ${
                    esHoy 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-blue-600' : 'text-gray-700'}`}>
                    {dia}
                  </div>
                  <div className="space-y-1">
                    {eventosDelDia.slice(0, 3).map((evento, idx) => {
                      const pagado = estaPagado(evento);
                      const parcial = estaParcialmentePagado(evento);
                      const color = pagado ? 'bg-green-500' : parcial ? 'bg-yellow-500' : 'bg-red-500';
                      
                      return (
                        <div
                          key={idx}
                          className={`${color} text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80`}
                          title={`${evento.codigo_contrato} - ${evento.clientes?.nombre_completo || 'Sin cliente'}`}
                          onClick={() => {
                            // Determinar el salón del evento
                            const salonEvento = evento.salones?.nombre || evento.lugar_salon || 'Diamond';
                            setSalonSeleccionado(salonEvento);
                            setMesSeleccionado(mesSeleccionado);
                            setAnioSeleccionado(anioSeleccionado);
                          }}
                        >
                          {evento.codigo_contrato}
                        </div>
                      );
                    })}
                    {eventosDelDia.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{eventosDelDia.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const contratos = contratosData?.contratos || [];

  if (contratos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay contratos</h3>
          <p className="text-gray-600">
            No se encontraron contratos para {salonSeleccionado} en {meses.find(m => m.valor === mesSeleccionado)?.nombre} {anioSeleccionado}.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <span className="font-semibold">{contratos.length}</span> contrato{contratos.length !== 1 ? 's' : ''} encontrado{contratos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratos.map((contrato) => {
          const fechaEvento = contrato.fecha_evento || contrato.eventos?.fecha_evento;
          const totalPagado = parseFloat(contrato.total_pagado || 0);
          const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
          const estadoPago = contrato.estado_pago || 'pendiente';

          return (
            <div key={contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del Contrato */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
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
                      {contrato.clientes?.nombre_completo && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{contrato.clientes.nombre_completo}</span>
                        </div>
                      )}
                      {fechaEvento && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(fechaEvento).toLocaleDateString('es-ES', {
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
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      estadoPago === 'completado' 
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : estadoPago === 'parcial'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}>
                      {estadoPago === 'completado' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span className="capitalize">{estadoPago}</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Detalles del Contrato - Solo visible cuando está expandido */}
              {contratosExpandidos[contrato.id] && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Información del Contrato */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">Información del Contrato</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total del Contrato:</span>
                          <span className="font-semibold text-gray-900">
                            ${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Pagado:</span>
                          <span className="font-semibold text-green-600">
                            ${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saldo Pendiente:</span>
                          <span className="font-semibold text-red-600">
                            ${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Progreso de Pago:</span>
                            <span className="text-xs font-medium text-gray-700">{porcentajePagado.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">Detalles Adicionales</h4>
                      <div className="space-y-2 text-sm">
                        {contrato.paquetes?.nombre && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paquete:</span>
                            <span className="font-medium text-gray-900">{contrato.paquetes.nombre}</span>
                          </div>
                        )}
                        {contrato.vendedores?.nombre_completo && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendedor:</span>
                            <span className="font-medium text-gray-900">{contrato.vendedores.nombre_completo}</span>
                          </div>
                        )}
                        {contrato.eventos?.cantidad_invitados_confirmados && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Invitados:</span>
                            <span className="font-medium text-gray-900">{contrato.eventos.cantidad_invitados_confirmados}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Historial de Pagos */}
                  {contrato.pagos && contrato.pagos.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Historial de Pagos</h4>
                      <div className="space-y-2">
                        {contrato.pagos.map((pago) => (
                          <div key={pago.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  ${parseFloat(pago.monto_total || pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {pago.metodo_pago} {pago.tipo_tarjeta ? `(${pago.tipo_tarjeta})` : ''}
                                  {pago.fecha_pago && ` - ${new Date(pago.fecha_pago).toLocaleDateString('es-ES')}`}
                                </p>
                              </div>
                            </div>
                            {pago.numero_referencia && (
                              <span className="text-xs text-gray-500">Ref: {pago.numero_referencia}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
                    {saldoPendiente > 0 && (
                      <button
                        onClick={() => handleAbrirModalPago(contrato)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                      >
                        <DollarSign className="w-5 h-5" />
                        Registrar Pago
                      </button>
                    )}
                    <button
                      onClick={() => handleEnviarContratoPorEmail(contrato)}
                      disabled={mutationEnviarEmail.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mutationEnviarEmail.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Enviar por Email
                        </>
                      )}
                    </button>
                    {saldoPendiente > 0 && (
                      <button
                        onClick={() => handleEnviarRecordatorioPago(contrato)}
                        disabled={mutationRecordatorio.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {mutationRecordatorio.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            Recordatorio de Pago
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Registro de Pago */}
      {mostrarModalPago && contratoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Registrar Pago</h2>
              <button
                onClick={() => {
                  setMostrarModalPago(false);
                  setContratoSeleccionado(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contrato
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {contratoSeleccionado.codigo_contrato} - {contratoSeleccionado.clientes?.nombre_completo}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Pendiente
                </label>
                <p className="text-sm font-semibold text-red-600 bg-red-50 p-2 rounded">
                  ${parseFloat(contratoSeleccionado.saldo_pendiente).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto a Pagar *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={parseFloat(contratoSeleccionado.saldo_pendiente)}
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value, tipo_tarjeta: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {formPago.metodo_pago === 'Tarjeta' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Tarjeta *
                  </label>
                  <select
                    value={formPago.tipo_tarjeta}
                    onChange={(e) => setFormPago({ ...formPago, tipo_tarjeta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona...</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Referencia
                </label>
                <input
                  type="text"
                  value={formPago.numero_referencia}
                  onChange={(e) => setFormPago({ ...formPago, numero_referencia: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formPago.notas}
                  onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalPago(false);
                    setContratoSeleccionado(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutationPago.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutationPago.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Registrar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagosAdministracion;

