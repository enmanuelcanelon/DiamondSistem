import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Check, 
  Loader2,
  Shield,
  Lock,
  FileText,
  AlertCircle,
  Clock,
  CalendarDays
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

function ModalPlanPago({ isOpen, onClose, onConfirm, totalContrato, ofertaId, clienteId }) {
  const [paso, setPaso] = useState(1); // 1: Reserva, 2: Tipo de pago, 3: Configuración, 4: Resumen
  const [tipoPago, setTipoPago] = useState('unico'); // 'unico' o 'plazos'
  const [numeroPlazos, setNumeroPlazos] = useState(6);
  const [diaMesPago, setDiaMesPago] = useState(1); // Día del mes para pagos en plazos
  const [planGenerado, setPlanGenerado] = useState(null);
  const [pagoReservaRegistrado, setPagoReservaRegistrado] = useState(null);
  const [formPagoReserva, setFormPagoReserva] = useState({
    monto: 500,
    metodo_pago: 'Efectivo',
    tipo_tarjeta: '',
    numero_referencia: '',
    notas: '',
    // Datos seguros de pago
    ultimos_4_digitos: '',
    nombre_titular: '',
    fecha_vencimiento: '',
    cvv: ''
  });

  // Mutation para registrar pago de reserva
  const registrarPagoReservaMutation = useMutation({
    mutationFn: async (datosPago) => {
      const response = await api.post('/pagos/reserva', {
        oferta_id: ofertaId,
        cliente_id: clienteId,
        ...datosPago
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPagoReservaRegistrado(data.pago);
      setPaso(2); // Ir al siguiente paso
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al registrar el pago de reserva');
    }
  });

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setPagoReservaRegistrado(null);
      setTipoPago('unico');
      setNumeroPlazos(6);
      setDiaMesPago(1);
      setPlanGenerado(null);
      setFormPagoReserva({
        monto: 500,
        metodo_pago: 'Efectivo',
        tipo_tarjeta: '',
        numero_referencia: '',
        notas: '',
        ultimos_4_digitos: '',
        nombre_titular: '',
        fecha_vencimiento: '',
        cvv: ''
      });
    }
  }, [isOpen]);

  // Generar plan de pagos cuando cambian los parámetros
  useEffect(() => {
    if (tipoPago === 'plazos' && pagoReservaRegistrado) {
      generarPlanPagos();
    } else {
      setPlanGenerado(null);
    }
  }, [tipoPago, numeroPlazos, diaMesPago, totalContrato, pagoReservaRegistrado]);

  const generarPlanPagos = () => {
    const total = parseFloat(totalContrato);
    const depositoReserva = parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto);
    
    // Total restante después de la reserva
    const totalRestante = total - depositoReserva;

    // Segundo pago de $500 (10 días después de la reserva)
    const segundoPago = Math.min(500, totalRestante);
    
    // Saldo restante después del segundo pago
    const saldoRestante = totalRestante - segundoPago;
    
    if (saldoRestante <= 0) {
      setPlanGenerado({
        depositoReserva,
        segundoPago: segundoPago,
        pagos: [],
        totalContrato: total,
        totalRestante: totalRestante,
        saldoRestante: saldoRestante
      });
      return;
    }
    
    // Calcular pagos mensuales
    const montoMensual = Math.ceil(saldoRestante / numeroPlazos);
    const pagos = [];
    let saldoPendiente = saldoRestante;
    
    for (let i = 0; i < numeroPlazos; i++) {
      const esUltimoPago = i === numeroPlazos - 1;
      const montoPago = esUltimoPago ? saldoPendiente : Math.min(montoMensual, saldoPendiente);
      
      if (montoPago > 0) {
        // Calcular fecha del pago (día del mes seleccionado)
        const fechaPago = new Date();
        fechaPago.setMonth(fechaPago.getMonth() + i + 1);
        fechaPago.setDate(diaMesPago);
        
        pagos.push({
          numero: i + 1,
          monto: montoPago,
          descripcion: `Pago mensual ${i + 1} de ${numeroPlazos}`,
          fecha_estimada: fechaPago.toISOString(),
          dia_mes: diaMesPago
        });
        
        saldoPendiente -= montoPago;
      }
      
      if (saldoPendiente <= 0) break;
    }
    
    setPlanGenerado({
      depositoReserva,
      segundoPago: segundoPago,
      pagos,
      totalContrato: total,
      totalRestante: totalRestante,
      saldoRestante: saldoRestante,
      dia_mes_pago: diaMesPago
    });
  };

  const handleRegistrarPagoReserva = () => {
    if (formPagoReserva.monto < 500) {
      alert('El pago de reserva debe ser de al menos $500');
      return;
    }

    if (formPagoReserva.metodo_pago === 'Tarjeta') {
      if (!formPagoReserva.tipo_tarjeta) {
        alert('Debe seleccionar el tipo de tarjeta');
        return;
      }
      if (!formPagoReserva.ultimos_4_digitos || formPagoReserva.ultimos_4_digitos.length !== 4) {
        alert('Debe ingresar los últimos 4 dígitos de la tarjeta');
        return;
      }
      if (!formPagoReserva.nombre_titular) {
        alert('Debe ingresar el nombre del titular de la tarjeta');
        return;
      }
    }

    // Preparar datos para enviar (sin datos sensibles completos)
    const datosPago = {
      monto: formPagoReserva.monto,
      metodo_pago: formPagoReserva.metodo_pago,
      tipo_tarjeta: formPagoReserva.tipo_tarjeta || null,
      numero_referencia: formPagoReserva.numero_referencia || null,
      notas: formPagoReserva.notas || null,
      // Guardar solo los últimos 4 dígitos y datos seguros
      ultimos_4_digitos: formPagoReserva.metodo_pago === 'Tarjeta' ? formPagoReserva.ultimos_4_digitos : null,
      nombre_titular: formPagoReserva.metodo_pago === 'Tarjeta' ? formPagoReserva.nombre_titular : null,
      // NO guardar CVV ni fecha de vencimiento completa por seguridad
    };

    registrarPagoReservaMutation.mutate(datosPago);
  };

  const handleConfirm = () => {
    if (!pagoReservaRegistrado) {
      alert('Debe registrar el pago de reserva primero');
      return;
    }

    if (tipoPago === 'unico') {
      onConfirm({
        tipo_pago: 'unico',
        plan_pagos: null,
        pago_reserva_id: pagoReservaRegistrado.id
      });
    } else {
      if (!planGenerado) {
        alert('Debe configurar el plan de pagos');
        return;
      }
      onConfirm({
        tipo_pago: 'plazos',
        numero_plazos: numeroPlazos,
        dia_mes_pago: diaMesPago,
        plan_pagos: planGenerado,
        pago_reserva_id: pagoReservaRegistrado.id
      });
    }
  };

  // Generar array de días del mes (1-28 para evitar problemas con meses de 28-31 días)
  const diasDelMes = Array.from({ length: 28 }, (_, i) => i + 1);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Plan de Pagos</DialogTitle>
              <DialogDescription>
                Configure el plan de pagos para este contrato
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                paso >= num 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-muted text-muted-foreground border-muted-foreground'
              }`}>
                {paso > num ? <Check className="w-5 h-5" /> : num}
              </div>
              {num < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  paso > num ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Paso 1: Pago de Reserva */}
        {paso === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pago de Reserva Obligatorio
                </CardTitle>
                <CardDescription>
                  Se requiere un depósito mínimo de $500 para reservar el evento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total del Contrato:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${parseFloat(totalContrato).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monto">Monto de Reserva *</Label>
                    <Input
                      id="monto"
                      type="number"
                      min="500"
                      step="0.01"
                      value={formPagoReserva.monto}
                      onChange={(e) => setFormPagoReserva({ ...formPagoReserva, monto: parseFloat(e.target.value) || 500 })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Mínimo $500</p>
                  </div>

                  <div>
                    <Label htmlFor="metodo_pago">Método de Pago *</Label>
                    <Select
                      value={formPagoReserva.metodo_pago}
                      onValueChange={(value) => setFormPagoReserva({ ...formPagoReserva, metodo_pago: value, tipo_tarjeta: value === 'Tarjeta' ? '' : formPagoReserva.tipo_tarjeta })}
                    >
                      <SelectTrigger id="metodo_pago">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Zelle">Zelle</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formPagoReserva.metodo_pago === 'Tarjeta' && (
                  <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4 text-primary" />
                      Información de Tarjeta (Segura)
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tipo_tarjeta">Tipo de Tarjeta *</Label>
                        <Select
                          value={formPagoReserva.tipo_tarjeta}
                          onValueChange={(value) => setFormPagoReserva({ ...formPagoReserva, tipo_tarjeta: value })}
                        >
                          <SelectTrigger id="tipo_tarjeta">
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visa">Visa</SelectItem>
                            <SelectItem value="MasterCard">MasterCard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="ultimos_4_digitos">Últimos 4 Dígitos *</Label>
                        <Input
                          id="ultimos_4_digitos"
                          type="text"
                          maxLength="4"
                          pattern="[0-9]{4}"
                          value={formPagoReserva.ultimos_4_digitos}
                          onChange={(e) => setFormPagoReserva({ ...formPagoReserva, ultimos_4_digitos: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          placeholder="1234"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nombre_titular">Nombre del Titular *</Label>
                        <Input
                          id="nombre_titular"
                          type="text"
                          value={formPagoReserva.nombre_titular}
                          onChange={(e) => setFormPagoReserva({ ...formPagoReserva, nombre_titular: e.target.value })}
                          placeholder="Nombre completo"
                        />
                      </div>

                      <div>
                        <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                        <Input
                          id="fecha_vencimiento"
                          type="text"
                          maxLength="5"
                          placeholder="MM/AA"
                          value={formPagoReserva.fecha_vencimiento}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setFormPagoReserva({ ...formPagoReserva, fecha_vencimiento: value });
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                      <Lock className="w-3 h-3 mt-0.5" />
                      <span>Los datos de la tarjeta se almacenan de forma segura. Solo se guardan los últimos 4 dígitos y el nombre del titular.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_referencia">Número de Referencia</Label>
                    <Input
                      id="numero_referencia"
                      type="text"
                      value={formPagoReserva.numero_referencia}
                      onChange={(e) => setFormPagoReserva({ ...formPagoReserva, numero_referencia: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Textarea
                    id="notas"
                    value={formPagoReserva.notas}
                    onChange={(e) => setFormPagoReserva({ ...formPagoReserva, notas: e.target.value })}
                    placeholder="Notas adicionales sobre el pago (opcional)"
                    rows="2"
                  />
                </div>

                <Button
                  onClick={handleRegistrarPagoReserva}
                  disabled={registrarPagoReservaMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {registrarPagoReservaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando Pago...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Registrar Pago de Reserva
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 2: Tipo de Pago */}
        {paso === 2 && pagoReservaRegistrado && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleccione el Tipo de Pago</CardTitle>
                <CardDescription>
                  Elija cómo desea estructurar los pagos restantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      tipoPago === 'unico' ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setTipoPago('unico')}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        {tipoPago === 'unico' && (
                          <Badge variant="default">
                            <Check className="w-3 h-3 mr-1" />
                            Seleccionado
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Pago Único</h3>
                      <p className="text-sm text-muted-foreground">
                        Pago total del saldo restante de una sola vez
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      tipoPago === 'plazos' ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setTipoPago('plazos')}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {tipoPago === 'plazos' && (
                          <Badge variant="default">
                            <Check className="w-3 h-3 mr-1" />
                            Seleccionado
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Pago en Plazos</h3>
                      <p className="text-sm text-muted-foreground">
                        Dividir el pago en cuotas mensuales (hasta 12 meses)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setPaso(3)} disabled={!tipoPago}>
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 3: Configuración */}
        {paso === 3 && pagoReservaRegistrado && (
          <div className="space-y-6">
            {tipoPago === 'plazos' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Plan de Pagos</CardTitle>
                  <CardDescription>
                    Configure el número de plazos y el día del mes para los pagos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Número de Plazos (meses)</Label>
                    <div className="mt-2">
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={numeroPlazos}
                        onChange={(e) => setNumeroPlazos(parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>2 meses</span>
                        <span className="font-bold text-primary text-lg">{numeroPlazos} meses</span>
                        <span>12 meses</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dia_mes">Día del Mes para Pagos *</Label>
                    <Select
                      value={diaMesPago.toString()}
                      onValueChange={(value) => setDiaMesPago(parseInt(value))}
                    >
                      <SelectTrigger id="dia_mes">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {diasDelMes.map((dia) => (
                          <SelectItem key={dia} value={dia.toString()}>
                            Día {dia} de cada mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Los pagos mensuales se realizarán el día {diaMesPago} de cada mes
                    </p>
                  </div>

                  {planGenerado && (
                    <div className="space-y-4 mt-6">
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Resumen del Plan de Pagos
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div>
                              <p className="font-semibold">Pago de Reserva</p>
                              <p className="text-xs text-muted-foreground">Ya registrado</p>
                            </div>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              ${planGenerado.depositoReserva.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div>
                              <p className="font-semibold">Segundo Pago</p>
                              <p className="text-xs text-muted-foreground">10 días después de la reserva</p>
                            </div>
                            <span className="font-bold text-blue-700 dark:text-blue-400">
                              ${planGenerado.segundoPago.toLocaleString()}
                            </span>
                          </div>

                          {planGenerado.pagos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Pagos Mensuales:</p>
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {planGenerado.pagos.map((pago) => (
                                  <div
                                    key={pago.numero}
                                    className="flex items-center justify-between p-2 bg-muted/50 border border-border rounded-lg text-sm"
                                  >
                                    <div>
                                      <span className="font-medium">{pago.descripcion}</span>
                                      <p className="text-xs text-muted-foreground">
                                        Día {pago.dia_mes} de cada mes
                                      </p>
                                    </div>
                                    <span className="font-semibold">
                                      ${pago.monto.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator />
                          
                          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <span className="font-semibold">Total Restante:</span>
                            <span className="text-lg font-bold text-primary">
                              ${planGenerado.totalRestante.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setPaso(2)}>
                      Atrás
                    </Button>
                    <Button onClick={() => setPaso(4)} disabled={!planGenerado}>
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pago Único</CardTitle>
                  <CardDescription>
                    El cliente pagará el saldo total restante de una sola vez
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Saldo Restante:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${(parseFloat(totalContrato) - parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setPaso(2)}>
                      Atrás
                    </Button>
                    <Button onClick={() => setPaso(4)}>
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Paso 4: Resumen y Términos */}
        {paso === 4 && pagoReservaRegistrado && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen y Términos de Pago</CardTitle>
                <CardDescription>
                  Revise la información antes de confirmar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Total del Contrato:</span>
                    <span className="text-lg font-bold">${parseFloat(totalContrato).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <span className="font-medium">Pago de Reserva:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      ${parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Saldo Restante:</span>
                    <span className="text-lg font-bold text-primary">
                      ${(parseFloat(totalContrato) - parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileText className="w-4 h-4" />
                    Términos y Condiciones de Pago
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>El depósito de $500 es no reembolsable</li>
                    <li>El segundo pago de $500 debe realizarse 10 días después de la reserva</li>
                    {tipoPago === 'plazos' && (
                      <>
                        <li>Los pagos mensuales se realizarán el día {diaMesPago} de cada mes</li>
                        <li>El pago completo debe estar al menos 10 días antes del evento</li>
                      </>
                    )}
                    <li>Visa y MasterCard aceptadas hasta 30 días antes del evento (cargo 3.8%)</li>
                    <li>American Express no aceptado</li>
                    <li>Todos los pagos son no reembolsables</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>Importante:</strong> El pago completo debe estar al menos 10 días hábiles antes del evento.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setPaso(3)}>
                    Atrás
                  </Button>
                  <Button onClick={handleConfirm} size="lg">
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar y Crear Contrato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModalPlanPago;
