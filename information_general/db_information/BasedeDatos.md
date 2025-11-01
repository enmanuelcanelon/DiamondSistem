Necesito una base de datos que maneje toda la lógica para un sistema completo que interconecte 3 aplicaciones.

Cliente debe de tener información = nombre completo, email, telefono,direccion , como nos conoció y tipo de evento.

El cliente - Se asocia a un contrato

Los contratos tienen estados para monitorear el estado de pago del mismo y se conforman = paquetes y los paquetes son servicios

Hay paquetes que tienen ya un conjunto de servicios incluidos (paquetes = 1, 2, 3 ,4) pero el 5 es un paquete personalizable que deja llenarlos con los servicios que uno quiera.

el precio de los paquetes se verá afectados por la fecha que escoja: (Temporadas)

Es decir, puedo crear contratos con paquetes prestablecidos con sus servicios e incluir a esos paquetes únicamente los servicios que no incluye o puedo crear un paquete personalizado y añadir los servicios que yo quiera.

Si el cliente firma el contrato se crea un Evento con la información del cliente + el contrato y un estado del evento (finalizado, en proceso, cancelado)

Una vez el cliente firme el contrato se le dará un código de acceso para su area de cliente y pueda gestionar mejor su evento como escoger los detalles de la comida y añadir servicios que no tiene incluido asi como su distribución de mesa, musica que desea, etc.

¡Importante a destacar: codigo\_acceso del usuario solo se le daría si tiene un contrato!

vendedor(s) que cobra la comisión variable cuando el contrato esta pagado y no se devuelve el pago, así como sus datos de contacto y código de acceso para gestionar el panel de vendedor.

El contrato puede irse actualizando con los cambios que realize el usuario en su area de cliente.

No puede quitar productos, pero si puede añadir servicios nuevos y gestionar detalles como los servicios, hay servicios como comida> que tienen 3 platos, o refrescos que son varios como coca cola, Pepsi, coca cola zero, etc, tengo que darte esos datos después, como que tiene los servicios de premium alcohol o normal, o que incluye las distintas decoraciones. todo eso te lo dare después, pero inclúyelo en la lógica.

Si el cliente hace una solicitud de añadir más servicios el vendedor tiene que aprobarla desde otra aplicacion que reciba los datos que pidio el cliente actualizar, si el cambio es aprobado se actualiza automaticamente el contrato con la informacion (pdf)
