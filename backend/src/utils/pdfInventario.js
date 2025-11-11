const puppeteer = require('puppeteer');

/**
 * Genera un PDF del inventario actual (central o por salón)
 * @param {Array} items - Array de items del inventario
 * @param {String} tipo - 'central' o nombre del salón
 * @returns {Buffer} - PDF como buffer
 */
async function generarInventarioPDF(items, tipo = 'central') {
  // Agrupar items por categoría
  const itemsPorCategoria = {};
  items.forEach(item => {
    const categoria = item.inventario_items?.categoria || item.categoria || 'Sin categoría';
    if (!itemsPorCategoria[categoria]) {
      itemsPorCategoria[categoria] = [];
    }
    itemsPorCategoria[categoria].push(item);
  });

  const categorias = Object.keys(itemsPorCategoria).sort();
  const totalItems = items.length;
  const itemsBajoStock = items.filter(item => {
    const cantidadActual = parseFloat(item.cantidad_actual || 0);
    const cantidadMinima = parseFloat(item.cantidad_minima || (tipo === 'central' ? 20 : 10));
    return cantidadActual < cantidadMinima;
  }).length;

  // Crear HTML para el PDF
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario ${tipo === 'central' ? 'Central' : tipo}</title>
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

        .categoria-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .categoria-header {
            background-color: #333;
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        thead {
            background-color: #333;
            color: white;
        }

        th {
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
        }

        td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
        }

        tbody tr:hover {
            background-color: #f9f9f9;
        }

        .numero {
            text-align: center;
            width: 40px;
        }

        .cantidad {
            text-align: right;
            width: 90px;
        }

        .unidad {
            text-align: center;
            width: 70px;
        }

        .bajo-stock {
            color: #dc2626;
            font-weight: bold;
        }

        .ok-stock {
            color: #16a34a;
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
            font-size: 13px;
            margin-top: 20px;
            text-align: right;
            padding-right: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVENTARIO ${tipo === 'central' ? 'CENTRAL' : tipo.toUpperCase()}</h1>
        <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
    </div>

    <div class="info-section">
        <p><strong>Total de items:</strong> ${totalItems}</p>
        <p><strong>Items bajo stock:</strong> ${itemsBajoStock}</p>
        <p><strong>Generado por:</strong> Sistema de Administración Diamond</p>
    </div>

    ${categorias.map(categoria => {
      const itemsCategoria = itemsPorCategoria[categoria];
      return `
        <div class="categoria-section">
            <div class="categoria-header">${categoria} (${itemsCategoria.length} items)</div>
            <table>
                <thead>
                    <tr>
                        <th class="numero">#</th>
                        <th>Item</th>
                        <th class="cantidad">Cantidad Actual</th>
                        <th class="cantidad">Cantidad Mínima</th>
                        <th class="unidad">Unidad</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsCategoria.map((item, index) => {
                      const cantidadActual = parseFloat(item.cantidad_actual || 0);
                      const cantidadMinima = parseFloat(item.cantidad_minima || (tipo === 'central' ? 20 : 10));
                      const bajoStock = cantidadActual < cantidadMinima;
                      return `
                        <tr>
                            <td class="numero">${index + 1}</td>
                            <td><strong>${item.inventario_items?.nombre || item.nombre || 'N/A'}</strong></td>
                            <td class="cantidad ${bajoStock ? 'bajo-stock' : 'ok-stock'}">${cantidadActual.toFixed(2)}</td>
                            <td class="cantidad">${cantidadMinima.toFixed(2)}</td>
                            <td class="unidad">${item.inventario_items?.unidad_medida || item.unidad_medida || 'N/A'}</td>
                            <td>${bajoStock ? '<span style="color: #dc2626; font-weight: bold;">Bajo Stock</span>' : '<span style="color: #16a34a;">OK</span>'}</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>
      `;
    }).join('')}

    <div class="total-items">
        Total: ${totalItems} items | Items bajo stock: ${itemsBajoStock}
    </div>

    <div class="footer">
        <p>Diamond Venue - Sistema de Administración</p>
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

module.exports = { generarInventarioPDF };

