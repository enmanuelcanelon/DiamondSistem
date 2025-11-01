\# app 1 , creador de ofertas

Usuario = vendedor. debe escribir su nombre + clave de vendedor.

Aplicacion 1: Es la aplicacion que usara el vendedor para

1\. Crear clientes nuevos en el sistema. 2. Cargar clientes creados 3.
Crear ofertas 4. Crear contratos

A\) = Parte 1 del programa se encarga de crear cliente, obtención de los
datos. B= Si ya tiene el cliente creado de antes puede cargar las
ofertas que están en distintos estados como \> pendiente, aceptada,
rechazada, (si es rechazada = escribir el motivo), Si esta aceptada se
sumara a las ventas del vendedor aplicando la comisión de la misma en
base al total de la venta. C= Un contrato solo se crea cuando acepta la
oferta, vinculándolo así a un evento y creando la clave de acceso al
usuario.

En el momento de crear el contrato antes puedo escoger como pagarlo \*12
meses\* o pago unico, luego la factura pdf del contrato es distintaa la
de la factura ofertas, ya que la factura del contrato tiene el detalle
de todos los precios y incluye terminos y servicios mientras que la
factura de la oferta es una factura proforma.

El proceso especificado sería el siguiente \> 1 \> toma de datos del
cliente o en caso de que exista ya cargarlos, 2 \>escogemos fecha y hora
del evento + cantidad de invitados \> seleccionamos el paquete o creamos
uno (el vendedor en todo momento está viendo cuanto suma el total para
ir controlando la venta. 3 \> Seleccionamos servicios adicionales que no
se incluyen en el paquete. 4 \> Resumen Financiero y Negociación donde
se harán los Ajustes Finales (Negociables) Resumen Financiero y
Negociación

se mostrará el IVA + el service fee o incluso aplicar descuento \$ (ojo
el vendedor puede editar en todo momento lo que sería el precio de los
servicios adicionales que no están incluido en los paquetes, así como al
momento de personalizar el paquete, aunque ya existen esos precios, hay
que ser flexibles en la negociación. Cada cambio de precio deja un
registro no permanente en el sistema. Solo sera flexible en la creation
de los contratos, pero las variables globales solo se deberían de
cambiar en la base de datos. 5\> Paso final, se imprime factura y si se
quiere firmar el contrato antes de imprimirlo se pregunta si quiere
hacer pago único o financiado, si es financiado se preguntan los meses y
se saca el pdf en ambos sacos con la información completa generando de
forma segura la clave del usuario para entrar en su area de cliente.
