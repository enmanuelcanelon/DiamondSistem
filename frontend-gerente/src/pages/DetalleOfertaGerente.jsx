import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Calendar, DollarSign, User, FileText, AlertCircle, CheckCircle2, XCircle, Package, MapPin, Users, Clock, Tag, Download } from 'lucide-react';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function DetalleOfertaGerente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ofertaData, isLoading, isError } = useQuery({
    queryKey: ['gerente-oferta', id],
    queryFn: async () => {
      const response = await api.get(`/gerentes/ofertas/${id}`);
      return response.data;
    },
  });

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'aceptada':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rechazada':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pendiente':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando oferta...</p>
      </div>
    );
  }

  if (isError || !ofertaData || !ofertaData.oferta) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error al cargar la oferta</p>
        <Link
          to="/ofertas"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Ofertas
        </Link>
      </div>
    );
  }

  const oferta = ofertaData.oferta;
  const ofertasVendedor = ofertaData.ofertasVendedor || [];

  const handleDescargarFacturaProforma = async () => {
    try {
      const response = await api.get(`/gerentes/ofertas/${id}/pdf-factura`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Factura-Proforma-${oferta.codigo_oferta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar factura proforma:', error);
      alert('Error al descargar la factura proforma');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/ofertas"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Volver a ofertas"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{oferta.codigo_oferta}</h1>
              <div className="flex items-center gap-2 mt-2">
                {getEstadoIcon(oferta.estado)}
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(oferta.estado)}`}>
                  {oferta.estado?.toUpperCase() || 'PENDIENTE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Cliente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Información del Cliente
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre Completo</p>
              <p className="text-lg font-semibold text-gray-900">{oferta.clientes?.nombre_completo || 'Sin cliente'}</p>
            </div>
            {oferta.clientes?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-gray-900">{oferta.clientes.email}</p>
              </div>
            )}
            {oferta.clientes?.telefono && (
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-base text-gray-900">{oferta.clientes.telefono}</p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Vendedor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Vendedor
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="text-lg font-semibold text-gray-900">
                {oferta.vendedores?.nombre_completo || 'Sin vendedor'}
              </p>
            </div>
            {oferta.vendedores?.codigo_vendedor && (
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="text-base text-gray-900">{oferta.vendedores.codigo_vendedor}</p>
              </div>
            )}
            {oferta.vendedores?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-gray-900">{oferta.vendedores.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalles del Evento */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Detalles del Evento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha del Evento
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.fecha_evento 
                ? format(new Date(oferta.fecha_evento), 'dd/MM/yyyy', { locale: es })
                : 'Sin fecha'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horario
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.hora_inicio && oferta.hora_fin
                ? `${oferta.hora_inicio} - ${oferta.hora_fin}`
                : 'Sin horario'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invitados
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.cantidad_invitados || 'Sin especificar'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lugar
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.salones?.nombre || oferta.lugar_evento || 'Sin lugar'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Paquete
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.paquetes?.nombre || 'Sin paquete'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Temporada
            </p>
            <p className="text-base font-semibold text-gray-900">
              {oferta.temporadas?.nombre || 'Sin temporada'}
            </p>
          </div>
        </div>
        {oferta.homenajeado && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Homenajeado</p>
            <p className="text-base font-semibold text-gray-900">{oferta.homenajeado}</p>
          </div>
        )}
      </div>

      {/* Servicios Adicionales */}
      {oferta.ofertas_servicios_adicionales && oferta.ofertas_servicios_adicionales.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Servicios Adicionales</h2>
          <div className="space-y-3">
            {oferta.ofertas_servicios_adicionales.map((servicio) => (
              <div key={servicio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{servicio.servicios?.nombre || 'Servicio'}</p>
                  {servicio.cantidad > 1 && (
                    <p className="text-sm text-gray-500">Cantidad: {servicio.cantidad}</p>
                  )}
                  {servicio.opcion_seleccionada && (
                    <p className="text-sm text-gray-500">Opción: {servicio.opcion_seleccionada}</p>
                  )}
                </div>
                <p className="font-semibold text-purple-600">
                  ${parseFloat(servicio.precio_unitario || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información Financiera */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Información Financiera
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Precio Base del Paquete</p>
            <p className="text-lg font-bold text-gray-900">
              ${parseFloat(oferta.precio_paquete_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {oferta.ajuste_temporada && parseFloat(oferta.ajuste_temporada) !== 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Ajuste de Temporada</p>
              <p className={`text-lg font-bold ${parseFloat(oferta.ajuste_temporada) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(oferta.ajuste_temporada) > 0 ? '+' : ''}
                ${parseFloat(oferta.ajuste_temporada).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {oferta.subtotal_servicios && parseFloat(oferta.subtotal_servicios) > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Servicios Adicionales</p>
              <p className="text-lg font-bold text-gray-900">
                ${parseFloat(oferta.subtotal_servicios).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {oferta.descuento && parseFloat(oferta.descuento) > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Descuento</p>
              <p className="text-lg font-bold text-red-600">
                -${parseFloat(oferta.descuento).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900">Total Final</p>
            <p className="text-3xl font-bold text-purple-600">
              ${parseFloat(oferta.total_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Factura Proforma */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Factura Proforma</h2>
        <button
          onClick={handleDescargarFacturaProforma}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Download className="w-4 h-4" />
          Descargar Factura Proforma PDF
        </button>
      </div>

      {/* Ofertas del Vendedor en el Mes/Día */}
      {ofertasVendedor.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Ofertas del Vendedor ({format(new Date(oferta.fecha_creacion), 'dd/MM/yyyy', { locale: es })})
          </h2>
          <div className="space-y-3">
            {ofertasVendedor.map((ofertaVendedor) => (
              <div key={ofertaVendedor.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ofertaVendedor.codigo_oferta}</p>
                    <p className="text-sm text-gray-500">
                      Cliente: {ofertaVendedor.clientes?.nombre_completo || 'Sin cliente'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estado: <span className={`font-semibold ${
                        ofertaVendedor.estado === 'aceptada' ? 'text-green-600' :
                        ofertaVendedor.estado === 'rechazada' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>{ofertaVendedor.estado}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: ${parseFloat(ofertaVendedor.total_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {ofertaVendedor.fecha_creacion 
                        ? format(new Date(ofertaVendedor.fecha_creacion), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
                        : 'Sin fecha'}
                    </p>
                  </div>
                  {ofertaVendedor.id !== oferta.id && (
                    <Link
                      to={`/ofertas/${ofertaVendedor.id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                    >
                      Ver Detalles
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {oferta.notas_vendedor && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notas del Vendedor</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{oferta.notas_vendedor}</p>
        </div>
      )}

      {/* Fecha de Creación */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-500">
          Oferta creada el {oferta.fecha_creacion 
            ? format(new Date(oferta.fecha_creacion), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
            : 'Fecha no disponible'}
        </p>
      </div>
    </div>
  );
}

export default DetalleOfertaGerente;

