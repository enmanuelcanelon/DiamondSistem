/**
 * Traducciones para PDFs de ofertas y contratos
 */

const translations = {
  es: {
    // Títulos y encabezados
    package: 'PAQUETE',
    extras: 'Extras del Evento',
    investment: 'INVERSIÓN Y TÉRMINOS',
    breakdown: 'DESGLOSE DE INVERSIÓN',
    packagePrice: 'Precio del Paquete',
    tax: 'Impuesto',
    serviceFee: 'Tarifa de Servicio',
    totalToPay: 'TOTAL A PAGAR',
    discount: 'Descuento',
    additionalGuests: 'Invitados Adicionales',
    additionalServices: 'Servicios Adicionales',
    
    // Información del evento
    eventInfo: 'INFORMACIÓN DEL EVENTO',
    eventType: 'Tipo de Evento',
    date: 'Fecha',
    time: 'Hora',
    venue: 'Lugar',
    guests: 'Invitados',
    honoree: 'Homenajeado/a',
    
    // Información del cliente
    clientInfo: 'INFORMACIÓN DEL CLIENTE',
    clientName: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    
    // Información del vendedor
    salespersonInfo: 'INFORMACIÓN DEL VENDEDOR',
    salesperson: 'Vendedor',
    contact: 'Contacto',
    
    // Categorías de servicios
    beverages: 'BEBIDAS',
    food: 'COMIDA',
    decoration: 'DECORACIÓN',
    entertainment: 'ENTRETENIMIENTO',
    equipment: 'EQUIPOS',
    extras: 'EXTRAS',
    photography: 'FOTOGRAFÍA',
    staff: 'PERSONAL',
    transportation: 'TRANSPORTE',
    
    // Términos y condiciones
    terms: 'TÉRMINOS Y CONDICIONES',
    paymentTerms: 'Términos de Pago',
    cancellation: 'Política de Cancelación',
    signatures: 'FIRMAS',
    clientSignature: 'Firma del Cliente',
    vendorSignature: 'Firma del Vendedor',
    date: 'Fecha',
    
    // Otros
    contract: 'CONTRATO DE SERVICIOS PARA EVENTOS',
    legalDocument: 'Documento Legal Vinculante',
    proforma: 'FACTURA PROFORMA',
    offer: 'OFERTA',
    notes: 'NOTAS',
    thankYou: 'Gracias por su preferencia',
    generatedOn: 'Generado el'
  },
  en: {
    // Titles and headers
    package: 'PACKAGE',
    extras: 'Event Extras',
    investment: 'INVESTMENT AND TERMS',
    breakdown: 'INVESTMENT BREAKDOWN',
    packagePrice: 'Package Price',
    tax: 'Tax',
    serviceFee: 'Service Fee',
    totalToPay: 'TOTAL TO PAY',
    discount: 'Discount',
    additionalGuests: 'Additional Guests',
    additionalServices: 'Additional Services',
    
    // Event information
    eventInfo: 'EVENT INFORMATION',
    eventType: 'Event Type',
    date: 'Date',
    time: 'Time',
    venue: 'Venue',
    guests: 'Guests',
    honoree: 'Honoree',
    
    // Client information
    clientInfo: 'CLIENT INFORMATION',
    clientName: 'Name',
    email: 'Email',
    phone: 'Phone',
    
    // Salesperson information
    salespersonInfo: 'SALES PERSONNEL INFORMATION',
    salesperson: 'Salesperson',
    contact: 'Contact',
    
    // Service categories
    beverages: 'BEVERAGES',
    food: 'FOOD',
    decoration: 'DECORATION',
    entertainment: 'ENTERTAINMENT',
    equipment: 'EQUIPMENT',
    extras: 'EXTRAS',
    photography: 'PHOTOGRAPHY',
    staff: 'STAFF',
    transportation: 'TRANSPORTATION',
    
    // Terms and conditions
    terms: 'TERMS AND CONDITIONS',
    paymentTerms: 'Payment Terms',
    cancellation: 'Cancellation Policy',
    signatures: 'SIGNATURES',
    clientSignature: 'Client Signature',
    vendorSignature: 'Vendor Signature',
    date: 'Date',
    
    // Others
    contract: 'EVENT SERVICES CONTRACT',
    legalDocument: 'Legally Binding Document',
    proforma: 'PROFORMA INVOICE',
    offer: 'OFFER',
    notes: 'NOTES',
    thankYou: 'Thank you for your preference',
    generatedOn: 'Generated on'
  }
};

/**
 * Obtener traducción según el idioma
 * @param {string} lang - Idioma ('es' o 'en')
 * @param {string} key - Clave de traducción
 * @returns {string} Texto traducido
 */
function t(lang, key) {
  const langTranslations = translations[lang] || translations.es;
  return langTranslations[key] || key;
}

module.exports = {
  translations,
  t
};






















