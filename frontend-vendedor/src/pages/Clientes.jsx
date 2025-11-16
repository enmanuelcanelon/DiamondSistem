import { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Mail, Phone, Calendar, Users, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import toast from 'react-hot-toast';

function Clientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Scroll infinito con useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['clientes', searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: 50,
        // Enviar búsqueda al backend
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await api.get('/clientes', { params });
      return response.data; // Retorna { data: [...], total, page, hasNextPage, ... }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Aplanar todos los clientes de todas las páginas
  const clientes = data?.pages.flatMap(page => page.data) || [];
  const totalClientes = data?.pages[0]?.total || 0;

  // Detección de scroll para cargar más
  const observerTarget = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0.1 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Estado para el diálogo de confirmación
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);

  // Mutation para eliminar cliente
  const eliminarMutation = useMutation({
    mutationFn: async (clienteId) => {
      await api.delete(`/clientes/${clienteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado exitosamente');
      setDialogOpen(false);
      setClienteAEliminar(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  const handleEliminar = (clienteId, nombreCliente) => {
    setClienteAEliminar({ id: clienteId, nombre: nombreCliente });
    setDialogOpen(true);
  };

  const confirmarEliminar = () => {
    if (clienteAEliminar) {
      eliminarMutation.mutate(clienteAEliminar.id);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Dialog de confirmación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar a {clienteAEliminar?.nombre}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarEliminar}
              disabled={eliminarMutation.isPending}
            >
              {eliminarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Link
          to="/clientes/nuevo"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 whitespace-nowrap gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Cliente</span>
        </Link>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer cliente'}
            </p>
            {!searchTerm && (
              <Link
                to="/clientes/nuevo"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Cliente
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-md transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {cliente.nombre_completo.charAt(0)}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {cliente.tipo_evento || 'General'}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{cliente.nombre_completo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(cliente.fecha_registro).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      to={`/contratos?cliente_id=${cliente.id}`}
                      className="text-xs text-muted-foreground hover:text-primary hover:underline transition cursor-pointer"
                      title={`Ver contratos de ${cliente.nombre_completo}`}
                    >
                      {cliente._count?.contratos || 0} contrato{(cliente._count?.contratos || 0) !== 1 ? 's' : ''}
                    </Link>
                    <Link
                      to={`/ofertas/nueva?cliente_id=${cliente.id}`}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Crear Oferta →
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/clientes/editar/${cliente.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Link>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleEliminar(cliente.id, cliente.nombre_completo)}
                      disabled={eliminarMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Observador para scroll infinito */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center col-span-full">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando más clientes...</span>
              </div>
            )}
          </div>
          
          {/* Indicador de fin */}
          {!hasNextPage && clientes.length > 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm col-span-full">
              Mostrando todos los {totalClientes} cliente{totalClientes !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Clientes;

