import api from '../config/api';

export const comunicacionesService = {
  // ================== WHATSAPP ==================
  enviarWhatsApp: (telefono, mensaje, options = {}) => 
    api.post('/comunicaciones/whatsapp/enviar', { 
      telefono, 
      mensaje, 
      leadId: options.leadId || null,
      clienteId: options.clienteId || null,
      contratoId: options.contratoId || null,
      templateName: options.templateName || null,
      templateParams: options.templateParams || null
    }),

  // ================== VOZ / LLAMADAS ==================
  obtenerTokenVoz: () => 
    api.post('/comunicaciones/voz/token'),

  iniciarLlamada: (hacia, options = {}) => 
    api.post('/comunicaciones/voz/llamar', { 
      hacia, 
      leadId: options.leadId || null,
      clienteId: options.clienteId || null,
      contratoId: options.contratoId || null
    }),

  // ================== SMS ==================
  enviarSMS: (telefono, mensaje, options = {}) => 
    api.post('/comunicaciones/sms/enviar', { 
      telefono, 
      mensaje, 
      leadId: options.leadId || null,
      clienteId: options.clienteId || null,
      contratoId: options.contratoId || null
    }),

  // ================== EMAIL ==================
  obtenerBandeja: (maxResults = 20, query = '') => 
    api.get(`/comunicaciones/email/bandeja`, {
      params: { maxResults, q: query }
    }),
  
  obtenerEmail: (emailId) => 
    api.get(`/comunicaciones/email/${emailId}`),

  enviarEmail: (destinatario, asunto, cuerpo, options = {}) => 
    api.post('/comunicaciones/email/enviar', { 
      destinatario, 
      asunto, 
      cuerpo, 
      cc: options.cc || null,
      bcc: options.bcc || null,
      leadId: options.leadId || null,
      clienteId: options.clienteId || null,
      contratoId: options.contratoId || null
    }),

  marcarEmailLeido: (emailId) => 
    api.post(`/comunicaciones/email/${emailId}/marcar-leido`),

  responderEmail: (emailId, cuerpo, options = {}) => 
    api.post(`/comunicaciones/email/${emailId}/responder`, { 
      cuerpo,
      leadId: options.leadId || null,
      clienteId: options.clienteId || null,
      contratoId: options.contratoId || null
    }),

  // ================== HISTORIAL ==================
  obtenerHistorialLead: (leadId) => 
    api.get(`/comunicaciones/historial/${leadId}`),

  obtenerHistorialCliente: (clienteId) => 
    api.get(`/comunicaciones/historial/cliente/${clienteId}`),

  obtenerHistorialContrato: (contratoId) => 
    api.get(`/comunicaciones/historial/contrato/${contratoId}`),

  obtenerMisComunicaciones: (options = {}) => 
    api.get('/comunicaciones/mis-comunicaciones', {
      params: {
        canal: options.canal || null,
        direccion: options.direccion || null,
        desde: options.desde || null,
        hasta: options.hasta || null,
        limit: options.limit || 50
      }
    }),

  // ================== ESTADÍSTICAS ==================
  obtenerEstadisticas: () => 
    api.get('/comunicaciones/stats'),

  // ================== ESTADO DE SERVICIOS ==================
  verificarServicios: () => 
    api.get('/comunicaciones/servicios/estado'),
};

export default comunicacionesService;

