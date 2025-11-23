import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, DollarSign, Users, Clock, Loader2 } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import { generarNombreEventoCorto, getEventoEmoji } from '@utils/eventNames';
import api from '@shared/config/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function MisContratos() {
  const { user } = useAuthStore();

  // Obtener contrato principal
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-cliente', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}`);
      return response.data.contrato;
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Mis Contratos</CardTitle>
              <CardDescription>Descarga y revisa tus documentos</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contrato Principal */}
      {contrato && (
        <Card>
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getEventoEmoji(contrato)}</span>
                <div>
                  <CardTitle className="text-primary-foreground">{generarNombreEventoCorto(contrato)}</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Contrato Actual</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleDescargarContrato}
                variant="secondary"
                size="lg"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha del Evento</p>
                      <p className="font-semibold text-foreground">
                        {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50/50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Invitados</p>
                      <p className="font-semibold text-foreground">{contrato.cantidad_invitados} personas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold text-foreground">
                        ${parseFloat(contrato.total_contrato).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Versiones del Contrato */}
      {versiones && versiones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historial de Versiones del Contrato
            </CardTitle>
            <CardDescription>
              Todas las versiones generadas de tu contrato, ordenadas de más reciente a más antigua
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versiones.map((version, index) => (
                <Card
                  key={version.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    index === 0 && "border-primary border-2"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          V{version.version_numero}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              Versión {version.version_numero}
                            </h4>
                            {index === 0 && (
                              <Badge variant="success">Actual</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {version.cantidad_invitados} invitados
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${parseFloat(version.total_contrato).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDescargarVersion(version.id, version.version_numero)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export default MisContratos;

