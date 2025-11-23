import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, FileText, Download, Clock, CheckCircle, Loader2, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';
import { generarNombreEventoCorto, getEventoEmoji } from '@utils/eventNames';
import api from '@shared/config/api';

function MisContratos() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Obtener contrato principal
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-cliente', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}`);
      return response.data.contrato;
    },
    enabled: !!user?.contrato_id,
  });

  // Obtener pagos del contrato para el cronograma
  const { data: pagosData } = useQuery({
    queryKey: ['pagos-contrato', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}/pagos`);
      return response.data.pagos || [];
    },
    enabled: !!user?.contrato_id,
  });

  // Obtener versiones del contrato
  const { data: versiones } = useQuery({
    queryKey: ['versiones-contrato-cliente', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}/versiones`);
      return response.data.versiones;
    },
    enabled: !!user?.contrato_id,
  });

  const handleDescargarContrato = async () => {
    try {
      const response = await api.get(`/contratos/${user.contrato_id}/pdf-contrato`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${generarNombreEventoCorto(contrato)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar contrato:', error);
      alert('Error al descargar el contrato');
    }
  };

  const handleDescargarVersion = async (versionId, numeroVersion) => {
    try {
      const response = await api.get(`/contratos/${user.contrato_id}/versiones/${numeroVersion}/pdf`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-Version-${numeroVersion}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar versión:', error);
      alert('Error al descargar la versión del contrato');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-white" />
            <p className="mt-4 text-neutral-400">Cargando contratos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular cronograma de pagos basado en el plan_pagos o pagos realizados
  const calcularCronogramaPagos = () => {
    if (!contrato) return [];

    const total = parseFloat(contrato.total_contrato || 0);
    const pagos = pagosData || [];
    const totalPagado = parseFloat(contrato.total_pagado || 0);
    const saldoPendiente = parseFloat(contrato.saldo_pendiente || total);

    // Si hay plan_pagos en el contrato, usarlo
    if (contrato.plan_pagos && typeof contrato.plan_pagos === 'object') {
      const plan = contrato.plan_pagos;
      const cronograma = [];

      // Deposito/Reserva
      if (plan.depositoReserva) {
        const pagado = pagos.find(p => parseFloat(p.monto) === parseFloat(plan.depositoReserva));
        cronograma.push({
          nombre: 'Reserva',
          porcentaje: '10%',
          monto: parseFloat(plan.depositoReserva),
          fechaVencimiento: null,
          fechaPago: pagado?.fecha_pago || null,
          pagado: !!pagado
        });
      }

      // Pagos mensuales
      if (plan.pagos && Array.isArray(plan.pagos)) {
        plan.pagos.forEach((pagoPlan, index) => {
          const pagado = pagos.find(p => 
            parseFloat(p.monto) === parseFloat(pagoPlan.monto) &&
            new Date(p.fecha_pago).getMonth() === new Date(pagoPlan.fechaVencimiento || new Date()).getMonth()
          );
          cronograma.push({
            nombre: pagoPlan.descripcion || `Pago ${index + 1}`,
            porcentaje: `${Math.round((parseFloat(pagoPlan.monto) / total) * 100)}%`,
            monto: parseFloat(pagoPlan.monto),
            fechaVencimiento: pagoPlan.fechaVencimiento ? new Date(pagoPlan.fechaVencimiento) : null,
            fechaPago: pagado?.fecha_pago || null,
            pagado: !!pagado
          });
        });
      }

      return cronograma;
    }

    // Si no hay plan_pagos, calcular basado en pagos realizados y saldo pendiente
    const cronograma = [];
    
    // Reserva (10% - típicamente el primer pago)
    const reserva = total * 0.1;
    const reservaPagada = pagos.find(p => Math.abs(parseFloat(p.monto) - reserva) < 1);
    cronograma.push({
      nombre: 'Reserva (10%)',
      porcentaje: '10%',
      monto: reserva,
      fechaVencimiento: null,
      fechaPago: reservaPagada?.fecha_pago || null,
      pagado: !!reservaPagada
    });

    // Segundo pago (40%)
    const segundoPago = total * 0.4;
    const segundoPagado = pagos.find(p => Math.abs(parseFloat(p.monto) - segundoPago) < 1);
    cronograma.push({
      nombre: 'Segundo Pago (40%)',
      porcentaje: '40%',
      monto: segundoPago,
      fechaVencimiento: contrato.fecha_evento ? new Date(new Date(contrato.fecha_evento).setMonth(new Date(contrato.fecha_evento).getMonth() - 1)) : null,
      fechaPago: segundoPagado?.fecha_pago || null,
      pagado: !!segundoPagado
    });

    // Pago final (50%)
    const pagoFinal = total * 0.5;
    const finalPagado = pagos.find(p => Math.abs(parseFloat(p.monto) - pagoFinal) < 1);
    cronograma.push({
      nombre: 'Pago Final (50%)',
      porcentaje: '50%',
      monto: pagoFinal,
      fechaVencimiento: contrato.fecha_evento ? new Date(contrato.fecha_evento) : null,
      fechaPago: finalPagado?.fecha_pago || null,
      pagado: !!finalPagado
    });

    return cronograma;
  };

  const cronogramaPagos = calcularCronogramaPagos();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Mis Contratos</h1>
          <p className="text-neutral-400 text-sm">Documentación legal de tu evento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Contract Card */}
        {contrato && (
          <div className="md:col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 flex items-center gap-2">
                <CheckCircle size={12} />
                Firmado
              </span>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-20 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-4xl">{getEventoEmoji(contrato)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Contrato de Servicios #{contrato.codigo_contrato}</h2>
                <p className="text-neutral-400 text-sm mb-4 max-w-md">
                  Contrato principal para el evento "{generarNombreEventoCorto(contrato)}". Incluye términos de servicio, políticas de cancelación y detalles del paquete.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDescargarContrato}
                    className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Schedule */}
        {contrato && (
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cronograma de Pagos</h3>
            <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
              {cronogramaPagos.map((pago, index) => (
                <div key={index} className="relative pl-6">
                  <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
                    pago.pagado 
                      ? 'bg-green-500 border-neutral-900' 
                      : 'bg-neutral-800 border-neutral-600'
                  }`} />
                  <div className={`text-sm font-medium ${pago.pagado ? 'text-white' : 'text-neutral-300'}`}>
                    {pago.nombre}
                  </div>
                  {pago.fechaPago ? (
                    <div className="text-xs text-neutral-500 mb-1">
                      Pagado el {new Date(pago.fechaPago).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  ) : pago.fechaVencimiento ? (
                    <div className="text-xs text-neutral-500 mb-1">
                      Vence el {new Date(pago.fechaVencimiento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  ) : null}
                  <div className={`text-sm font-mono ${pago.pagado ? 'text-green-400' : 'text-neutral-400'}`}>
                    ${pago.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historial de Versiones */}
      {versiones && versiones.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Historial de Versiones</h3>
          <div className="space-y-4">
            {versiones.map((version, index) => (
              <div
                key={version.id}
                className={`bg-neutral-900 border rounded-xl p-6 transition-all hover:border-white/30 ${
                  index === 0 ? 'border-white/20' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      V{version.version_numero}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg text-white">
                          Versión {version.version_numero}
                        </h4>
                        {index === 0 && (
                          <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {version.cantidad_invitados} invitados
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          ${parseFloat(version.total_contrato).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDescargarVersion(version.id, version.version_numero)}
                    className="px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors border border-white/5 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MisContratos;
