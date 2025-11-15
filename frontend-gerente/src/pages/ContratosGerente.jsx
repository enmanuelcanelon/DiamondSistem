import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Loader2, 
  Calendar, 
  DollarSign, 
  User, 
  FileText,
  Building2,
  Package,
  Clock,
  Users,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  Download
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ContratosGerente() {
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [contratosExpandidos, setContratosExpandidos] = useState({});

  const { data: contratosData, isLoading, isError } = useQuery({
    queryKey: ['gerente-contratos', salonSeleccionado, mesSeleccionado, anioSeleccionado, filtroEstado, filtroEstadoPago],
    queryFn: async () => {
      const params = {};
      if (salonSeleccionado) params.salon_nombre = salonSeleccionado;
      if (mesSeleccionado) params.mes = mesSeleccionado;
      if (anioSeleccionado) params.anio = anioSeleccionado;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroEstadoPago) params.estado_pago = filtroEstadoPago;
      
      const response = await api.get('/gerentes/contratos', { params });
      return response.data;
    },
    enabled: !!salonSeleccionado && !!mesSeleccionado && !!anioSeleccionado
  });

  const toggleContratoExpandido = (contratoId) => {
    setContratosExpandidos(prev => ({
      ...prev,
      [contratoId]: !prev[contratoId]
    }));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contratos</h1>
          <p className="text-gray-600">Selecciona un salón para ver los contratos y sus detalles</p>
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
              <p className="text-gray-600 text-sm">Ver contratos de {salon}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const contratos = contratosData?.contratos || [];

  const contratosFiltrados = contratos.filter(contrato => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contrato.codigo_contrato.toLowerCase().includes(searchLower) ||
      contrato.clientes?.nombre_completo.toLowerCase().includes(searchLower) ||
      contrato.clientes?.email.toLowerCase().includes(searchLower)
    );
  });

  if (contratosFiltrados.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contratos</h1>
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

          {/* Filtros */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contratos</h1>
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

      {/* Filtros */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado de Pago</label>
            <select
              value={filtroEstadoPago}
              onChange={(e) => setFiltroEstadoPago(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
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
          <div className="ml-auto">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{contratosFiltrados.length}</span> contrato{contratosFiltrados.length !== 1 ? 's' : ''} encontrado{contratosFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratosFiltrados.map((contrato) => {
          const fechaEvento = contrato.fecha_evento || contrato.eventos?.fecha_evento;
          const totalPagado = parseFloat(contrato.total_pagado || 0);
          const saldoPendiente = parseFloat(contrato.saldo_pendiente || 0);
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
          const estadoPago = contrato.estado_pago || 'pendiente';
          const horaInicio = contrato.eventos?.hora_inicio;
          const horaFin = contrato.eventos?.hora_fin;
          const invitados = contrato.eventos?.cantidad_invitados_confirmados;

          return (
            <div key={contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del Contrato */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => toggleContratoExpandido(contrato.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:opacity-80 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contrato.codigo_contrato}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        contrato.estado === 'activo' ? 'bg-green-100 text-green-800 border border-green-300' :
                        contrato.estado === 'cancelado' ? 'bg-red-100 text-red-800 border border-red-300' :
                        'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                        {contrato.estado}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        estadoPago === 'completado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        estadoPago === 'parcial' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}>
                        {estadoPago}
                      </span>
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
                          <span className="font-medium">{contrato.clientes.nombre_completo}</span>
                      </div>
                      )}
                      {fechaEvento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                            {format(new Date(fechaEvento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>
                      )}
                      {contrato.salones?.nombre && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{contrato.salones.nombre}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">
                          ${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Detalles del Contrato - Solo visible cuando está expandido */}
              {contratosExpandidos[contrato.id] && (
                <div className="p-6 space-y-6">
                  {/* Información Principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información del Cliente y Evento */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">Información del Evento</h4>
                      <div className="space-y-3">
                        {contrato.clientes && (
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Cliente</p>
                              <p className="font-semibold text-gray-900">{contrato.clientes.nombre_completo}</p>
                              {contrato.clientes.email && (
                                <p className="text-sm text-gray-600">{contrato.clientes.email}</p>
                              )}
                              {contrato.clientes.telefono && (
                                <p className="text-sm text-gray-600">{contrato.clientes.telefono}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {fechaEvento && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Fecha del Evento</p>
                              <p className="font-semibold text-gray-900">
                                {format(new Date(fechaEvento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                        )}
                        {horaInicio && horaFin && (
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Horario</p>
                              <p className="font-semibold text-gray-900">
                                {(() => {
                                  try {
                                    const horaInicioFormatted = horaInicio.includes(':') 
                                      ? horaInicio.substring(0, 5) 
                                      : horaInicio;
                                    const horaFinFormatted = horaFin.includes(':') 
                                      ? horaFin.substring(0, 5) 
                                      : horaFin;
                                    return `${horaInicioFormatted} - ${horaFinFormatted}`;
                                  } catch (e) {
                                    return `${horaInicio} - ${horaFin}`;
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                        {invitados && (
                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Invitados Confirmados</p>
                              <p className="font-semibold text-gray-900">{invitados} personas</p>
                            </div>
                          </div>
                        )}
                        {contrato.paquetes && (
                          <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Paquete</p>
                              <p className="font-semibold text-gray-900">{contrato.paquetes.nombre}</p>
                              {contrato.paquetes.precio_base && (
                                <p className="text-sm text-gray-600">
                                  Precio base: ${parseFloat(contrato.paquetes.precio_base).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                    {contrato.vendedores && (
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Vendedor</p>
                              <p className="font-semibold text-gray-900">{contrato.vendedores.nombre_completo}</p>
                              {contrato.vendedores.codigo_vendedor && (
                                <p className="text-sm text-gray-600">Código: {contrato.vendedores.codigo_vendedor}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información Financiera */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">Información Financiera</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Total del Contrato</span>
                            <span className="text-lg font-bold text-gray-900">
                              ${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Total Pagado</span>
                            <span className="text-lg font-bold text-green-600">
                              ${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Saldo Pendiente</span>
                            <span className="text-lg font-bold text-red-600">
                              ${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">Progreso de Pago</span>
                              <span className="text-xs font-medium text-gray-700">{porcentajePagado.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Servicios Incluidos */}
                  {contrato.contratos_servicios && contrato.contratos_servicios.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg mb-3 border-b border-gray-200 pb-2">Servicios Incluidos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {contrato.contratos_servicios.map((cs) => (
                          <div key={cs.id} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="font-medium text-gray-900">{cs.servicios.nombre}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial de Pagos */}
                  {contrato.pagos && contrato.pagos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg mb-3 border-b border-gray-200 pb-2">Historial de Pagos</h4>
                      <div className="space-y-2">
                        {contrato.pagos.map((pago) => (
                          <div key={pago.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              {pago.metodo_pago === 'Tarjeta' ? (
                                <CreditCard className="w-5 h-5 text-blue-600" />
                              ) : pago.metodo_pago === 'Transferencia' ? (
                                <Wallet className="w-5 h-5 text-green-600" />
                              ) : (
                                <DollarSign className="w-5 h-5 text-green-600" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  ${parseFloat(pago.monto_total || pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {pago.metodo_pago} {pago.fecha_pago && `- ${format(new Date(pago.fecha_pago), 'dd/MM/yyyy', { locale: es })}`}
                                </p>
                              </div>
                            </div>
                            {pago.estado === 'completado' && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón de Descarga PDF */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/contratos/${contrato.id}/pdf-contrato`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Contrato-${contrato.codigo_contrato}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                          toast.success('PDF descargado exitosamente');
                        } catch (error) {
                          toast.error('Error al descargar el PDF');
                          console.error(error);
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Contrato PDF
                    </button>
                  </div>
                </div>
          )}
        </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContratosGerente;
