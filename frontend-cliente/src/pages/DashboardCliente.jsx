import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';
import BentoGrid from '@/components/BentoGrid';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardCliente() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Query para obtener información del contrato
  const { data: contratoData, isLoading } = useQuery({
    queryKey: ['contrato-dashboard', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  const evento = contratoData?.eventos;
  const nombreEvento = evento?.nombre_evento || contratoData?.clientes?.nombre_completo || 'Mi Evento';

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-12 w-96 mb-6" />
        <Skeleton className="h-4 w-2xl mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-sm text-neutral-500 mb-4">Eventos / {nombreEvento}</div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Mi Evento
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl">
          Gestiona los detalles de tu evento
        </p>
      </div>
      <BentoGrid />
    </>
  );
}

export default DashboardCliente;
