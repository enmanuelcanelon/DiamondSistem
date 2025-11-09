/**
 * Script para poblar inventario usando Prisma
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateInventario() {
  try {
    console.log('🔄 Poblando catálogo de inventario...');

    // BEBIDAS ALCOHÓLICAS
    const bebidasAlcoholicas = [
      { nombre: 'Champaña', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Champaña para brindis' },
      { nombre: 'Sidra', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Sidra para brindis' },
      { nombre: 'Whisky Premium', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Whisky premium importado' },
      { nombre: 'Whisky House', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Whisky de la casa' },
      { nombre: 'Vodka', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Vodka' },
      { nombre: 'Tequila', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Tequila' },
      { nombre: 'Ron Spice', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Ron con especias' },
      { nombre: 'Ron Blanco', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Ron blanco' },
      { nombre: 'Vino Blanco', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Vino blanco' },
      { nombre: 'Vino Tinto', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Vino tinto' },
      { nombre: 'Vino Chardonnay', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Vino chardonnay' },
      { nombre: 'Chamberry', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Chamberry' },
      { nombre: 'Blue Curacao', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Blue Curacao' },
      { nombre: 'Piña Colada', unidad_medida: 'botella', categoria: 'bebidas_alcoholicas', descripcion: 'Piña colada' },
    ];

    // BEBIDAS NO ALCOHÓLICAS
    const bebidasNoAlcoholicas = [
      { nombre: 'Jugo de Naranja', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Jugo de naranja' },
      { nombre: 'Agua Tónica', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Agua tónica' },
      { nombre: 'Club Soda', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Club soda' },
      { nombre: 'Coca Cola', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Coca Cola regular' },
      { nombre: 'Coca Cola Zero', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Coca Cola Zero' },
      { nombre: 'Coca Cola Light', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Coca Cola Light' },
      { nombre: 'Sprite', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Sprite regular' },
      { nombre: 'Sprite Zero', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Sprite Zero' },
      { nombre: 'Fanta Naranja', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Fanta sabor naranja' },
      { nombre: 'Granadina', unidad_medida: 'botella', categoria: 'bebidas_no_alcoholicas', descripcion: 'Granadina (1/4 botella)' },
    ];

    // VAJILLA Y UTENSILIOS
    const vajilla = [
      { nombre: 'Vasos de Vidrio', unidad_medida: 'unidad', categoria: 'vajilla', descripcion: 'Vasos de vidrio para bebidas' },
      { nombre: 'Vasos de Plástico', unidad_medida: 'unidad', categoria: 'vajilla', descripcion: 'Vasos de plástico desechables' },
      { nombre: 'Platos para Cake', unidad_medida: 'unidad', categoria: 'vajilla', descripcion: 'Platos individuales para pastel' },
      { nombre: 'Platos de Vidrio Pequeños', unidad_medida: 'unidad', categoria: 'vajilla', descripcion: 'Platos pequeños de vidrio' },
      { nombre: 'Servilletas Blancas', unidad_medida: 'paquete', categoria: 'vajilla', descripcion: 'Paquete de servilletas blancas' },
      { nombre: 'Servilletas Negras', unidad_medida: 'paquete', categoria: 'vajilla', descripcion: 'Paquete de servilletas negras' },
      { nombre: 'Pinchos para Dientes', unidad_medida: 'unidad', categoria: 'vajilla', descripcion: 'Pinchos para dientes (montoncito)' },
    ];

    // DECORACIÓN Y ACCESORIOS
    const decoracion = [
      { nombre: 'Velas para Cake', unidad_medida: 'unidad', categoria: 'decoracion', descripcion: 'Velas para pastel de cumpleaños' },
    ];

    // COMIDA - MESA DE QUESO
    const comida = [
      { nombre: 'Queso Brie', unidad_medida: 'bola', categoria: 'comida', descripcion: 'Queso Brie (1 bola)' },
      { nombre: 'Queso Amarillo', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso amarillo (bolsas)' },
      { nombre: 'Queso Blanco', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso blanco (bolsas)' },
      { nombre: 'Queso Azul', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso azul (bolsas)' },
      { nombre: 'Queso Parmesano', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso parmesano (bolsas)' },
      { nombre: 'Queso Cuadrado Amarillo', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso cuadrado amarillo (bolsas)' },
      { nombre: 'Queso Cuadrado Blanco', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso cuadrado blanco (bolsas)' },
      { nombre: 'Queso Cuadrado Azul', unidad_medida: 'bolsa', categoria: 'comida', descripcion: 'Queso cuadrado azul (bolsas)' },
      { nombre: 'Prochuto', unidad_medida: 'libra', categoria: 'comida', descripcion: 'Prochuto (1/4 libra)' },
      { nombre: 'Salami', unidad_medida: 'libra', categoria: 'comida', descripcion: 'Salami (1/4 libra)' },
      { nombre: 'Salchichón', unidad_medida: 'libra', categoria: 'comida', descripcion: 'Salchichón (1/4 libra)' },
      { nombre: 'Galletas Mixtas', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Caja de galletas mixtas (1 paquete)' },
      { nombre: 'Humos', unidad_medida: 'unidad', categoria: 'comida', descripcion: 'Humos (1 unidad)' },
      { nombre: 'Cherry', unidad_medida: 'libra', categoria: 'comida', descripcion: 'Cherry (1/4 libra)' },
      { nombre: 'Aceituna Negra', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Aceituna negra (1 paquete)' },
      { nombre: 'Aceituna Verde', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Aceituna verde (1 paquete)' },
      { nombre: 'Piña', unidad_medida: 'unidad', categoria: 'comida', descripcion: 'Media piña' },
      { nombre: 'Ensalada de Pollo', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Ensalada de pollo (1 paquete)' },
      { nombre: 'Fresa', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Fresas (1 paquete)' },
      { nombre: 'Uva', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Uvas (1 paquete)' },
      { nombre: 'Maní', unidad_medida: 'libra', categoria: 'comida', descripcion: 'Maní (1/4 libra)' },
      { nombre: 'Limón', unidad_medida: 'paquete', categoria: 'comida', descripcion: 'Limones (2 paquetes)' },
    ];

    const allItems = [
      ...bebidasAlcoholicas,
      ...bebidasNoAlcoholicas,
      ...vajilla,
      ...decoracion,
      ...comida
    ];

    // Crear items (usar createMany con skipDuplicates)
    await prisma.inventario_items.createMany({
      data: allItems.map(item => ({
        ...item,
        activo: true,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ ${allItems.length} items creados en el catálogo`);

    // Inicializar inventario central con 100 unidades de cada item
    console.log('🔄 Inicializando inventario central...');
    const items = await prisma.inventario_items.findMany({ where: { activo: true } });
    
    for (const item of items) {
      await prisma.inventario_central.upsert({
        where: { item_id: item.id },
        update: {},
        create: {
          item_id: item.id,
          cantidad_actual: 100.00,
          cantidad_minima: 20.00,
        },
      });
    }

    console.log(`✅ Inventario central inicializado con ${items.length} items (100 unidades cada uno)`);

    // Crear usuario de inventario
    console.log('🔄 Creando usuario de inventario...');
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Inventario123!', 10);

    await prisma.usuarios_inventario.upsert({
      where: { codigo_usuario: 'INV001' },
      update: {},
      create: {
        nombre_completo: 'Usuario Inventario Prueba',
        codigo_usuario: 'INV001',
        email: 'inventario@diamondsistem.com',
        telefono: '555-0001',
        password_hash: passwordHash,
        activo: true,
      },
    });

    console.log('✅ Usuario de inventario creado:');
    console.log('   Código: INV001');
    console.log('   Password: Inventario123!');

    console.log('\n✅ Setup completado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateInventario();

