import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/**
 * Paso 1: Selección de Cliente
 * Componente extraído de CrearOferta.jsx para mejorar la mantenibilidad
 */
export default function Paso1ClienteEvento({ 
  formData, 
  setFormData, 
  clientes,
  isLoadingClientes 
}) {
  return (
    <Card>
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-2">
          <Label htmlFor="cliente_id">
            Cliente <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.cliente_id || ""}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, cliente_id: value }));
            }}
            disabled={isLoadingClientes}
          >
            <SelectTrigger id="cliente_id" className="w-full [&>span]:truncate">
              <SelectValue placeholder="Seleccionar...">
                {formData.cliente_id && clientes?.find(c => c.id.toString() === formData.cliente_id.toString())
                  ? `${clientes.find(c => c.id.toString() === formData.cliente_id.toString()).nombre_completo} - ${clientes.find(c => c.id.toString() === formData.cliente_id.toString()).email}`
                  : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[400px]">
              {clientes?.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{cliente.nombre_completo}</span>
                    <span className="text-xs text-muted-foreground">{cliente.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

