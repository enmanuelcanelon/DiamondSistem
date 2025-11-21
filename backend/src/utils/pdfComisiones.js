/**
 * Utilidad para generar PDFs de resúmenes de pagos de comisiones
 */

const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Generar PDF de resumen de pagos de comisiones por mes y vendedor
 * @param {Array} vendedores - Array de vendedores con sus comisiones
 * @param {Number} mes - Mes (1-12)
 * @param {Number} año - Año
 * @returns {Buffer} Buffer del PDF generado
 */
async function generarResumenComisionesPDF(vendedores, mes, año) {
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const nombreMes = nombresMeses[mes - 1];

  // Calcular totales
  let totalPendientes = 0;
  let totalPagadas = 0;
  let totalDesbloqueadas = 0;

  vendedores.forEach(vendedor => {
    totalPendientes += parseFloat(vendedor.comisiones.pendientes || 0);
    totalPagadas += parseFloat(vendedor.comisiones.pagadas || 0);
    totalDesbloqueadas += parseFloat(vendedor.comisiones.total_desbloqueadas || 0);
  });

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resumen de Pagos de Comisiones - ${nombreMes} ${año}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', serif;
          padding: 40px;
          color: #000000;
          background: #ffffff;
          font-size: 11pt;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000000;
          padding-bottom: 15px;
        }
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          color: #000000;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .header p {
          font-size: 10pt;
          color: #000000;
          margin: 3px 0;
        }
        .resumen-general {
          margin-bottom: 30px;
          border: 1px solid #000000;
          padding: 15px;
        }
        .resumen-general h2 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid #000000;
          padding-bottom: 5px;
        }
        .resumen-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .resumen-table td {
          padding: 8px 12px;
          border: 1px solid #000000;
          font-size: 10pt;
        }
        .resumen-table td:first-child {
          font-weight: bold;
          width: 40%;
          background: #f5f5f5;
        }
        .resumen-table td:last-child {
          text-align: right;
          font-weight: bold;
        }
        .vendedor-section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }
        .vendedor-header {
          border: 1px solid #000000;
          border-bottom: none;
          padding: 12px 15px;
          background: #f5f5f5;
        }
        .vendedor-header h3 {
          font-size: 12pt;
          font-weight: bold;
          color: #000000;
          margin-bottom: 3px;
        }
        .vendedor-header .codigo {
          font-size: 9pt;
          color: #000000;
        }
        .vendedor-info {
          border: 1px solid #000000;
          padding: 15px;
        }
        .vendedor-stats {
          margin-bottom: 15px;
        }
        .stats-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .stats-table td {
          padding: 8px 12px;
          border: 1px solid #000000;
          font-size: 10pt;
        }
        .stats-table td:first-child {
          font-weight: bold;
          background: #f5f5f5;
          width: 40%;
        }
        .stats-table td:last-child {
          text-align: right;
          font-weight: bold;
        }
        .comisiones-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 9pt;
        }
        .comisiones-table th {
          background: #f5f5f5;
          padding: 8px 6px;
          text-align: left;
          font-weight: bold;
          color: #000000;
          border: 1px solid #000000;
          font-size: 9pt;
        }
        .comisiones-table td {
          padding: 6px;
          border: 1px solid #000000;
          font-size: 9pt;
        }
        .comisiones-table td:nth-child(4),
        .comisiones-table td:nth-child(5),
        .comisiones-table td:nth-child(6) {
          text-align: right;
        }
        .tipo-comision {
          font-weight: normal;
          text-transform: capitalize;
        }
        .estado-comision {
          font-weight: normal;
        }
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #000000;
          text-align: center;
          font-size: 9pt;
          color: #000000;
        }
        .no-data {
          text-align: center;
          padding: 30px;
          color: #000000;
          font-style: italic;
          border: 1px solid #000000;
        }
        .separator {
          height: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resumen de Pagos de Comisiones</h1>
        <p><strong>Período:</strong> ${nombreMes} ${año}</p>
        <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      <div class="resumen-general">
        <h2>Resumen General</h2>
        <table class="resumen-table">
          <tr>
            <td>Total Comisiones Desbloqueadas</td>
            <td>$${totalDesbloqueadas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Total Pendientes de Pago</td>
            <td>$${totalPendientes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Total Pagadas</td>
            <td>$${totalPagadas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>

      ${vendedores.length === 0 ? `
        <div class="no-data">
          <p>No hay vendedores con comisiones en este período</p>
        </div>
      ` : vendedores.map(vendedor => {
        const comisionesPendientes = vendedor.comisiones_pendientes || [];
        const comisionesPagadas = vendedor.comisiones_pagadas || [];
        const totalComisiones = comisionesPendientes.length + comisionesPagadas.length;

        return `
          <div class="vendedor-section">
            <div class="vendedor-header">
              <h3>${vendedor.vendedor.nombre_completo}</h3>
              <span class="codigo">Código: ${vendedor.vendedor.codigo_vendedor}</span>
            </div>
            <div class="vendedor-info">
              <div class="vendedor-stats">
                <table class="stats-table">
                  <tr>
                    <td>Total Comisiones Desbloqueadas</td>
                    <td>$${parseFloat(vendedor.comisiones.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Total Pendientes de Pago</td>
                    <td>$${parseFloat(vendedor.comisiones.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Total Pagadas</td>
                    <td>$${parseFloat(vendedor.comisiones.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              ${totalComisiones > 0 ? `
                <table class="comisiones-table">
                  <thead>
                    <tr>
                      <th>Contrato</th>
                      <th>Tipo</th>
                      <th>Total Contrato</th>
                      <th>Monto Comisión</th>
                      <th>Monto Pagado</th>
                      <th>Pendiente</th>
                      <th>Estado</th>
                      <th>Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[...comisionesPendientes, ...comisionesPagadas].map(comision => {
                      const fechaPago = comision.fecha_pago 
                        ? new Date(comision.fecha_pago).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '-';
                      const montoPagado = comision.monto_pagado || 0;
                      const montoPendiente = comision.monto_pendiente || comision.monto_total || 0;
                      const tipoTexto = comision.tipo === 'primera_mitad' ? 'Primera Mitad' : 'Segunda Mitad';
                      const estadoTexto = comision.pagada ? 'Pagada' : 'Pendiente';
                      
                      return `
                        <tr>
                          <td>${comision.codigo_contrato}</td>
                          <td class="tipo-comision">${tipoTexto}</td>
                          <td>$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(montoPagado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(montoPendiente).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td class="estado-comision">${estadoTexto}</td>
                          <td>${fechaPago}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="no-data">
                  <p>No hay comisiones registradas para este vendedor</p>
                </div>
              `}
            </div>
          </div>
          <div class="separator"></div>
        `;
      }).join('')}

      <div class="footer">
        <p><strong>DiamondSistem - Sistema de Gestión de Eventos</strong></p>
        <p>Este documento fue generado automáticamente el ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generarResumenComisionesPDF
};
