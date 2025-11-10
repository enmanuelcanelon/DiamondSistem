const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF de lista de compra con formato simple
 * @param {Array} items - Array de items seleccionados para comprar
 * @returns {Buffer} - PDF como buffer
 */
async function generarListaCompraPDF(items) {
  // Crear HTML simple para la lista de compra
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Compra - Inventario</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }

        .header .fecha {
            font-size: 14px;
            color: #666;
        }

        .info-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }

        .info-section p {
            margin: 5px 0;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        thead {
            background-color: #333;
            color: white;
        }

        th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
        }

        td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }

        tbody tr:hover {
            background-color: #f9f9f9;
        }

        .numero {
            text-align: center;
            width: 50px;
        }

        .cantidad {
            text-align: right;
            width: 100px;
        }

        .unidad {
            text-align: center;
            width: 80px;
        }

        .categoria {
            color: #666;
            font-size: 10px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            font-size: 10px;
            color: #666;
        }

        .total-items {
            font-weight: bold;
            font-size: 14px;
            margin-top: 20px;
            text-align: right;
            padding-right: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LISTA DE COMPRA - INVENTARIO</h1>
        <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
    </div>

    <div class="info-section">
        <p><strong>Total de items a comprar:</strong> ${items.length}</p>
        <p><strong>Generado por:</strong> Sistema de Inventario Diamond</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="numero">#</th>
                <th>Item</th>
                <th class="cantidad">Cantidad Actual</th>
                <th class="cantidad">Cantidad Mínima</th>
                <th class="cantidad">Cantidad a Comprar</th>
                <th class="unidad">Unidad</th>
                <th>Categoría</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item, index) => `
                <tr>
                    <td class="numero">${index + 1}</td>
                    <td>
                        <strong>${item.nombre || 'N/A'}</strong>
                    </td>
                    <td class="cantidad">${parseFloat(item.cantidad_actual || 0).toFixed(2)}</td>
                    <td class="cantidad">${parseFloat(item.cantidad_minima || 0).toFixed(2)}</td>
                    <td class="cantidad" style="font-weight: bold; color: #2563eb;">${parseFloat(item.cantidad_a_comprar || 0).toFixed(2)}</td>
                    <td class="unidad">${item.unidad_medida || 'N/A'}</td>
                    <td>
                        <span class="categoria">${item.categoria || 'Sin categoría'}</span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total-items">
        Total: ${items.length} items | Total unidades a comprar: ${items.reduce((sum, item) => sum + (parseFloat(item.cantidad_a_comprar || 0)), 0).toFixed(2)}
    </div>

    <div class="footer">
        <p>Diamond Venue - Sistema de Inventario</p>
        <p>Este documento fue generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
    </div>
</body>
</html>
  `;

  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { generarListaCompraPDF };

