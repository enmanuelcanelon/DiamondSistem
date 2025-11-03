/**
 * Servicio de Emails
 * Gestiona el envío de correos electrónicos usando Nodemailer
 */

const nodemailer = require('nodemailer');

// Configuración del transporter para Proton Mail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || '127.0.0.1',
  port: process.env.EMAIL_PORT || 1025,
  secure: false,
  auth: process.env.EMAIL_USER ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  } : undefined,
  tls: {
    rejectUnauthorized: false
  },
  // Configuración de timeouts
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

// Modo de desarrollo: usar Ethereal (servidor SMTP de prueba)
// Para producción, configurar variables de entorno con credenciales reales

/**
 * Verificar configuración del servicio de email
 */
async function verificarConfiguracion() {
  try {
    await transporter.verify();
    console.log('✅ Servidor de email configurado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error.message);
    return false;
  }
}

/**
 * Enviar email de confirmación de contrato
 */
async function enviarConfirmacionContrato(destinatario, contrato, cliente) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💎 DiamondSistem</h1>
            <p style="margin: 0;">¡Tu contrato ha sido confirmado!</p>
          </div>
          <div class="content">
            <h2>¡Hola ${cliente.nombre_completo}!</h2>
            <p>Nos complace confirmar que tu contrato ha sido creado exitosamente.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Detalles del Contrato</h3>
              <p><strong>Código:</strong> ${contrato.codigo_contrato}</p>
              <p><strong>Fecha del Evento:</strong> ${new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Lugar:</strong> ${contrato.lugar_evento}</p>
              <p><strong>Invitados:</strong> ${contrato.cantidad_invitados}</p>
              <p><strong>Total del Contrato:</strong> $${parseFloat(contrato.total_contrato).toLocaleString()}</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">🔑 Acceso a tu Portal</h3>
              <p>Puedes acceder a tu portal de cliente usando el siguiente código:</p>
              <p style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; border-radius: 5px;">
                ${contrato.codigo_acceso_cliente}
              </p>
              <p style="font-size: 14px; color: #6b7280;">Guarda este código en un lugar seguro. Lo necesitarás para acceder a tu portal.</p>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cliente/login" class="button">
                Acceder a mi Portal
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              En tu portal podrás:
              <ul>
                <li>Ver los detalles de tu evento</li>
                <li>Gestionar la lista de invitados y mesas</li>
                <li>Crear tu playlist musical</li>
                <li>Comunicarte con tu asesor</li>
                <li>Realizar cambios y ajustes</li>
              </ul>
            </p>
          </div>
          <div class="footer">
            <p>DiamondSistem © ${new Date().getFullYear()}</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"DiamondSistem" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `✅ Confirmación de Contrato - ${contrato.codigo_contrato}`,
      html,
    });

    console.log('✅ Email de confirmación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error.message);
    throw error;
  }
}

/**
 * Enviar email de recordatorio de pago
 */
async function enviarRecordatorioPago(destinatario, contrato, cliente, montoPendiente) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          .amount { background: #fef3c7; border: 2px solid #fbbf24; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .amount-value { font-size: 32px; font-weight: bold; color: #d97706; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💎 DiamondSistem</h1>
            <p style="margin: 0;">Recordatorio de Pago</p>
          </div>
          <div class="content">
            <h2>¡Hola ${cliente.nombre_completo}!</h2>
            <p>Te recordamos que tienes un pago pendiente para tu evento.</p>
            
            <div class="amount">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #78350f;">Monto Pendiente:</p>
              <p class="amount-value">$${parseFloat(montoPendiente).toLocaleString()}</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Detalles del Contrato</h3>
              <p><strong>Código:</strong> ${contrato.codigo_contrato}</p>
              <p><strong>Fecha del Evento:</strong> ${new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Total del Contrato:</strong> $${parseFloat(contrato.total_contrato).toLocaleString()}</p>
              <p><strong>Total Pagado:</strong> $${parseFloat(contrato.total_pagado).toLocaleString()}</p>
              <p><strong>Saldo Pendiente:</strong> $${parseFloat(montoPendiente).toLocaleString()}</p>
            </div>

            <p>Por favor, coordina el pago con tu asesor de eventos para asegurar que todo esté listo para tu día especial.</p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Si ya realizaste el pago, por favor ignora este mensaje.
            </p>
          </div>
          <div class="footer">
            <p>DiamondSistem © ${new Date().getFullYear()}</p>
            <p>Gracias por confiar en nosotros.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"DiamondSistem" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `💰 Recordatorio de Pago - ${contrato.codigo_contrato}`,
      html,
    });

    console.log('✅ Email de recordatorio enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar recordatorio de pago:', error.message);
    throw error;
  }
}

/**
 * Enviar notificación de nuevo mensaje
 */
async function enviarNotificacionMensaje(destinatario, remitente, contrato, extractoMensaje) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Nuevo Mensaje</h1>
          </div>
          <div class="content">
            <p>Has recibido un nuevo mensaje de <strong>${remitente}</strong> sobre el contrato <strong>${contrato.codigo_contrato}</strong>.</p>
            
            <div class="message-box">
              <p style="margin: 0; font-style: italic; color: #6b7280;">
                "${extractoMensaje.length > 150 ? extractoMensaje.substring(0, 150) + '...' : extractoMensaje}"
              </p>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cliente/login" class="button">
                Ver Mensaje Completo
              </a>
            </p>
          </div>
          <div class="footer">
            <p>DiamondSistem © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"DiamondSistem" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `💬 Nuevo Mensaje - ${contrato.codigo_contrato}`,
      html,
    });

    console.log('✅ Notificación de mensaje enviada:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar notificación de mensaje:', error.message);
    throw error;
  }
}

/**
 * Enviar contrato por email (con PDF adjunto)
 */
async function enviarContratoPDF(destinatario, contrato, cliente, pdfBuffer) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💎 DiamondSistem</h1>
            <p style="margin: 0;">Tu Contrato Adjunto</p>
          </div>
          <div class="content">
            <h2>¡Hola ${cliente.nombre_completo}!</h2>
            <p>Adjunto encontrarás el PDF de tu contrato <strong>${contrato.codigo_contrato}</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Información del Evento</h3>
              <p><strong>Fecha:</strong> ${new Date(contrato.fecha_evento).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Lugar:</strong> ${contrato.lugar_evento}</p>
              <p><strong>Total:</strong> $${parseFloat(contrato.total_contrato).toLocaleString()}</p>
            </div>

            <p>Guarda este documento para tus registros.</p>
          </div>
          <div class="footer">
            <p>DiamondSistem © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"DiamondSistem" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `📄 Contrato - ${contrato.codigo_contrato}`,
      html,
      attachments: [
        {
          filename: `Contrato-${contrato.codigo_contrato}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('✅ Contrato PDF enviado por email:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar contrato por email:', error.message);
    throw error;
  }
}

module.exports = {
  verificarConfiguracion,
  enviarConfirmacionContrato,
  enviarRecordatorioPago,
  enviarNotificacionMensaje,
  enviarContratoPDF,
};

