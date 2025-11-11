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
          font-family: 'Arial', sans-serif;
          padding: 40px;
          color: #1f2937;
          background: #fff;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 14px;
          color: #6b7280;
        }
        .resumen-general {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .resumen-general h2 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #1f2937;
        }
        .resumen-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .resumen-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .resumen-item.pendientes {
          border-left-color: #f59e0b;
        }
        .resumen-item.pagadas {
          border-left-color: #10b981;
        }
        .resumen-item-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .resumen-item-value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .vendedor-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .vendedor-header {
          background: #3b82f6;
          color: white;
          padding: 15px;
          border-radius: 6px 6px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .vendedor-header h3 {
          font-size: 16px;
          font-weight: 600;
        }
        .vendedor-info {
          background: #f9fafb;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .vendedor-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        .stat-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        .comisiones-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 11px;
        }
        .comisiones-table th {
          background: #e5e7eb;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .comisiones-table td {
          padding: 8px;
          border: 1px solid #e5e7eb;
        }
        .comisiones-table tr:nth-child(even) {
          background: #f9fafb;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge.primera {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge.segunda {
          background: #ede9fe;
          color: #5b21b6;
        }
        .badge.pendiente {
          background: #fef3c7;
          color: #92400e;
        }
        .badge.pagada {
          background: #d1fae5;
          color: #065f46;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        .no-data {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resumen de Pagos de Comisiones</h1>
        <p>${nombreMes} ${año}</p>
        <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      <div class="resumen-general">
        <h2>Resumen General</h2>
        <div class="resumen-grid">
          <div class="resumen-item">
            <div class="resumen-item-label">Total Desbloqueadas</div>
            <div class="resumen-item-value">$${totalDesbloqueadas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="resumen-item pendientes">
            <div class="resumen-item-label">Pendientes de Pago</div>
            <div class="resumen-item-value">$${totalPendientes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="resumen-item pagadas">
            <div class="resumen-item-label">Pagadas</div>
            <div class="resumen-item-value">$${totalPagadas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
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
              <span style="font-size: 12px;">${vendedor.vendedor.codigo_vendedor}</span>
            </div>
            <div class="vendedor-info">
              <div class="vendedor-stats">
                <div class="stat-item">
                  <div class="stat-label">Total Desbloqueadas</div>
                  <div class="stat-value">$${parseFloat(vendedor.comisiones.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Pendientes</div>
                  <div class="stat-value">$${parseFloat(vendedor.comisiones.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Pagadas</div>
                  <div class="stat-value">$${parseFloat(vendedor.comisiones.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
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
                        ? new Date(comision.fecha_pago).toLocaleDateString('es-ES')
                        : '-';
                      const montoPagado = comision.monto_pagado || 0;
                      const montoPendiente = comision.monto_pendiente || comision.monto_total || 0;
                      
                      return `
                        <tr>
                          <td>${comision.codigo_contrato}</td>
                          <td><span class="badge ${comision.tipo === 'primera_mitad' ? 'primera' : 'segunda'}">${comision.tipo === 'primera_mitad' ? 'Primera Mitad' : 'Segunda Mitad'}</span></td>
                          <td>$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(montoPagado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>$${parseFloat(montoPendiente).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td><span class="badge ${comision.pagada ? 'pagada' : 'pendiente'}">${comision.pagada ? 'Pagada' : 'Pendiente'}</span></td>
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
        `;
      }).join('')}

      <div class="footer">
        <p>DiamondSistem - Sistema de Gestión de Eventos</p>
        <p>Este documento fue generado automáticamente</p>
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

