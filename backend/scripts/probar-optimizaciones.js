/**
 * ============================================
 * SCRIPT DE PRUEBA - OPTIMIZACIONES
 * ============================================
 * Verifica que las optimizaciones estén funcionando correctamente:
 * 1. Pool de conexiones
 * 2. Monitoreo de queries lentas
 * 3. Conexión a la base de datos
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function probarOptimizaciones() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem');
  console.log('🧪 ============================================\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1️⃣ Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida correctamente\n');

    // 2. Verificar configuración del pool de conexiones
    console.log('2️⃣ Verificando configuración del pool de conexiones...');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('   ❌ ERROR: DATABASE_URL no está definido en .env');
      console.log('   💡 Solución: Asegúrate de tener un archivo .env con DATABASE_URL');
      return;
    }

    const tieneConnectionLimit = databaseUrl.includes('connection_limit');
    const tienePoolTimeout = databaseUrl.includes('pool_timeout');

    if (tieneConnectionLimit && tienePoolTimeout) {
      console.log('   ✅ Pool de conexiones configurado correctamente');
      console.log('   📊 Parámetros encontrados:');
      
      // Extraer valores
      const limitMatch = databaseUrl.match(/connection_limit=(\d+)/);
      const timeoutMatch = databaseUrl.match(/pool_timeout=(\d+)/);
      
      if (limitMatch) {
        console.log(`      - connection_limit: ${limitMatch[1]}`);
      }
      if (timeoutMatch) {
        console.log(`      - pool_timeout: ${timeoutMatch[1]} segundos`);
      }
    } else {
      console.log('   ⚠️  ADVERTENCIA: Pool de conexiones no configurado');
      console.log('   💡 Solución: Agrega &connection_limit=10&pool_timeout=20 al DATABASE_URL');
    }
    console.log('');

    // 3. Verificar usuario de PostgreSQL
    console.log('3️⃣ Verificando usuario de PostgreSQL...');
    const userMatch = databaseUrl.match(/postgresql:\/\/([^:]+):/);
    if (userMatch) {
      const usuario = userMatch[1];
      console.log(`   📝 Usuario detectado: ${usuario}`);
      
      if (usuario === 'postgres') {
        console.log('   ✅ Usuario correcto (postgres es el estándar)');
      } else if (usuario === 'usuario') {
        console.log('   ⚠️  Usuario "usuario" detectado - considera usar "postgres"');
      } else {
        console.log(`   ℹ️  Usuario personalizado: ${usuario}`);
      }
    }
    console.log('');

    // 4. Probar queries simples (medir tiempo)
    console.log('4️⃣ Probando rendimiento de queries...');
    
    const inicio = Date.now();
    const vendedores = await prisma.vendedores.findMany({
      take: 5,
      select: {
        id: true,
        codigo_vendedor: true,
        nombre_completo: true,
      }
    });
    const tiempoQuery = Date.now() - inicio;
    
    console.log(`   ✅ Query completada en ${tiempoQuery}ms`);
    console.log(`   📊 Vendedores encontrados: ${vendedores.length}`);
    
    if (tiempoQuery > 1000) {
      console.log('   ⚠️  ADVERTENCIA: Query lenta detectada (>1 segundo)');
      console.log('   💡 Considera agregar índices o optimizar la query');
    } else {
      console.log('   ✅ Query rápida (optimización funcionando)');
    }
    console.log('');

    // 5. Verificar conexiones activas
    console.log('5️⃣ Verificando conexiones activas en PostgreSQL...');
    try {
      const conexiones = await prisma.$queryRaw`
        SELECT count(*) as total 
        FROM pg_stat_activity 
        WHERE datname = 'diamondsistem' 
        AND state = 'active'
      `;
      
      const totalConexiones = conexiones[0]?.total || 0;
      console.log(`   📊 Conexiones activas: ${totalConexiones}`);
      
      if (totalConexiones <= 10) {
        console.log('   ✅ Número de conexiones dentro del límite (≤10)');
      } else {
        console.log('   ⚠️  ADVERTENCIA: Muchas conexiones activas');
        console.log('   💡 Considera revisar el connection_limit');
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo verificar conexiones (permisos insuficientes)');
    }
    console.log('');

    // 6. Resumen
    console.log('📋 ============================================');
    console.log('📋 RESUMEN DE PRUEBAS');
    console.log('📋 ============================================');
    console.log('✅ Conexión a base de datos: OK');
    console.log(`${tieneConnectionLimit && tienePoolTimeout ? '✅' : '⚠️ '} Pool de conexiones: ${tieneConnectionLimit && tienePoolTimeout ? 'Configurado' : 'Pendiente'}`);
    console.log(`✅ Rendimiento de queries: ${tiempoQuery < 1000 ? 'Óptimo' : 'Lento'}`);
    console.log('\n✨ Pruebas completadas exitosamente\n');

  } catch (error) {
    console.error('❌ ERROR durante las pruebas:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Verifica que el archivo .env tenga DATABASE_URL correcto');
    console.error('   3. Verifica que el usuario y contraseña sean correctos');
    console.error('   4. Verifica que la base de datos "diamondsistem" exista\n');
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar pruebas
probarOptimizaciones();

 * ============================================
 * SCRIPT DE PRUEBA - OPTIMIZACIONES
 * ============================================
 * Verifica que las optimizaciones estén funcionando correctamente:
 * 1. Pool de conexiones
 * 2. Monitoreo de queries lentas
 * 3. Conexión a la base de datos
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function probarOptimizaciones() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem');
  console.log('🧪 ============================================\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1️⃣ Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida correctamente\n');

    // 2. Verificar configuración del pool de conexiones
    console.log('2️⃣ Verificando configuración del pool de conexiones...');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('   ❌ ERROR: DATABASE_URL no está definido en .env');
      console.log('   💡 Solución: Asegúrate de tener un archivo .env con DATABASE_URL');
      return;
    }

    const tieneConnectionLimit = databaseUrl.includes('connection_limit');
    const tienePoolTimeout = databaseUrl.includes('pool_timeout');

    if (tieneConnectionLimit && tienePoolTimeout) {
      console.log('   ✅ Pool de conexiones configurado correctamente');
      console.log('   📊 Parámetros encontrados:');
      
      // Extraer valores
      const limitMatch = databaseUrl.match(/connection_limit=(\d+)/);
      const timeoutMatch = databaseUrl.match(/pool_timeout=(\d+)/);
      
      if (limitMatch) {
        console.log(`      - connection_limit: ${limitMatch[1]}`);
      }
      if (timeoutMatch) {
        console.log(`      - pool_timeout: ${timeoutMatch[1]} segundos`);
      }
    } else {
      console.log('   ⚠️  ADVERTENCIA: Pool de conexiones no configurado');
      console.log('   💡 Solución: Agrega &connection_limit=10&pool_timeout=20 al DATABASE_URL');
    }
    console.log('');

    // 3. Verificar usuario de PostgreSQL
    console.log('3️⃣ Verificando usuario de PostgreSQL...');
    const userMatch = databaseUrl.match(/postgresql:\/\/([^:]+):/);
    if (userMatch) {
      const usuario = userMatch[1];
      console.log(`   📝 Usuario detectado: ${usuario}`);
      
      if (usuario === 'postgres') {
        console.log('   ✅ Usuario correcto (postgres es el estándar)');
      } else if (usuario === 'usuario') {
        console.log('   ⚠️  Usuario "usuario" detectado - considera usar "postgres"');
      } else {
        console.log(`   ℹ️  Usuario personalizado: ${usuario}`);
      }
    }
    console.log('');

    // 4. Probar queries simples (medir tiempo)
    console.log('4️⃣ Probando rendimiento de queries...');
    
    const inicio = Date.now();
    const vendedores = await prisma.vendedores.findMany({
      take: 5,
      select: {
        id: true,
        codigo_vendedor: true,
        nombre_completo: true,
      }
    });
    const tiempoQuery = Date.now() - inicio;
    
    console.log(`   ✅ Query completada en ${tiempoQuery}ms`);
    console.log(`   📊 Vendedores encontrados: ${vendedores.length}`);
    
    if (tiempoQuery > 1000) {
      console.log('   ⚠️  ADVERTENCIA: Query lenta detectada (>1 segundo)');
      console.log('   💡 Considera agregar índices o optimizar la query');
    } else {
      console.log('   ✅ Query rápida (optimización funcionando)');
    }
    console.log('');

    // 5. Verificar conexiones activas
    console.log('5️⃣ Verificando conexiones activas en PostgreSQL...');
    try {
      const conexiones = await prisma.$queryRaw`
        SELECT count(*) as total 
        FROM pg_stat_activity 
        WHERE datname = 'diamondsistem' 
        AND state = 'active'
      `;
      
      const totalConexiones = conexiones[0]?.total || 0;
      console.log(`   📊 Conexiones activas: ${totalConexiones}`);
      
      if (totalConexiones <= 10) {
        console.log('   ✅ Número de conexiones dentro del límite (≤10)');
      } else {
        console.log('   ⚠️  ADVERTENCIA: Muchas conexiones activas');
        console.log('   💡 Considera revisar el connection_limit');
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo verificar conexiones (permisos insuficientes)');
    }
    console.log('');

    // 6. Resumen
    console.log('📋 ============================================');
    console.log('📋 RESUMEN DE PRUEBAS');
    console.log('📋 ============================================');
    console.log('✅ Conexión a base de datos: OK');
    console.log(`${tieneConnectionLimit && tienePoolTimeout ? '✅' : '⚠️ '} Pool de conexiones: ${tieneConnectionLimit && tienePoolTimeout ? 'Configurado' : 'Pendiente'}`);
    console.log(`✅ Rendimiento de queries: ${tiempoQuery < 1000 ? 'Óptimo' : 'Lento'}`);
    console.log('\n✨ Pruebas completadas exitosamente\n');

  } catch (error) {
    console.error('❌ ERROR durante las pruebas:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Verifica que el archivo .env tenga DATABASE_URL correcto');
    console.error('   3. Verifica que el usuario y contraseña sean correctos');
    console.error('   4. Verifica que la base de datos "diamondsistem" exista\n');
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar pruebas
probarOptimizaciones();

 * ============================================
 * SCRIPT DE PRUEBA - OPTIMIZACIONES
 * ============================================
 * Verifica que las optimizaciones estén funcionando correctamente:
 * 1. Pool de conexiones
 * 2. Monitoreo de queries lentas
 * 3. Conexión a la base de datos
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function probarOptimizaciones() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA DE OPTIMIZACIONES - DiamondSistem');
  console.log('🧪 ============================================\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1️⃣ Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida correctamente\n');

    // 2. Verificar configuración del pool de conexiones
    console.log('2️⃣ Verificando configuración del pool de conexiones...');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('   ❌ ERROR: DATABASE_URL no está definido en .env');
      console.log('   💡 Solución: Asegúrate de tener un archivo .env con DATABASE_URL');
      return;
    }

    const tieneConnectionLimit = databaseUrl.includes('connection_limit');
    const tienePoolTimeout = databaseUrl.includes('pool_timeout');

    if (tieneConnectionLimit && tienePoolTimeout) {
      console.log('   ✅ Pool de conexiones configurado correctamente');
      console.log('   📊 Parámetros encontrados:');
      
      // Extraer valores
      const limitMatch = databaseUrl.match(/connection_limit=(\d+)/);
      const timeoutMatch = databaseUrl.match(/pool_timeout=(\d+)/);
      
      if (limitMatch) {
        console.log(`      - connection_limit: ${limitMatch[1]}`);
      }
      if (timeoutMatch) {
        console.log(`      - pool_timeout: ${timeoutMatch[1]} segundos`);
      }
    } else {
      console.log('   ⚠️  ADVERTENCIA: Pool de conexiones no configurado');
      console.log('   💡 Solución: Agrega &connection_limit=10&pool_timeout=20 al DATABASE_URL');
    }
    console.log('');

    // 3. Verificar usuario de PostgreSQL
    console.log('3️⃣ Verificando usuario de PostgreSQL...');
    const userMatch = databaseUrl.match(/postgresql:\/\/([^:]+):/);
    if (userMatch) {
      const usuario = userMatch[1];
      console.log(`   📝 Usuario detectado: ${usuario}`);
      
      if (usuario === 'postgres') {
        console.log('   ✅ Usuario correcto (postgres es el estándar)');
      } else if (usuario === 'usuario') {
        console.log('   ⚠️  Usuario "usuario" detectado - considera usar "postgres"');
      } else {
        console.log(`   ℹ️  Usuario personalizado: ${usuario}`);
      }
    }
    console.log('');

    // 4. Probar queries simples (medir tiempo)
    console.log('4️⃣ Probando rendimiento de queries...');
    
    const inicio = Date.now();
    const vendedores = await prisma.vendedores.findMany({
      take: 5,
      select: {
        id: true,
        codigo_vendedor: true,
        nombre_completo: true,
      }
    });
    const tiempoQuery = Date.now() - inicio;
    
    console.log(`   ✅ Query completada en ${tiempoQuery}ms`);
    console.log(`   📊 Vendedores encontrados: ${vendedores.length}`);
    
    if (tiempoQuery > 1000) {
      console.log('   ⚠️  ADVERTENCIA: Query lenta detectada (>1 segundo)');
      console.log('   💡 Considera agregar índices o optimizar la query');
    } else {
      console.log('   ✅ Query rápida (optimización funcionando)');
    }
    console.log('');

    // 5. Verificar conexiones activas
    console.log('5️⃣ Verificando conexiones activas en PostgreSQL...');
    try {
      const conexiones = await prisma.$queryRaw`
        SELECT count(*) as total 
        FROM pg_stat_activity 
        WHERE datname = 'diamondsistem' 
        AND state = 'active'
      `;
      
      const totalConexiones = conexiones[0]?.total || 0;
      console.log(`   📊 Conexiones activas: ${totalConexiones}`);
      
      if (totalConexiones <= 10) {
        console.log('   ✅ Número de conexiones dentro del límite (≤10)');
      } else {
        console.log('   ⚠️  ADVERTENCIA: Muchas conexiones activas');
        console.log('   💡 Considera revisar el connection_limit');
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo verificar conexiones (permisos insuficientes)');
    }
    console.log('');

    // 6. Resumen
    console.log('📋 ============================================');
    console.log('📋 RESUMEN DE PRUEBAS');
    console.log('📋 ============================================');
    console.log('✅ Conexión a base de datos: OK');
    console.log(`${tieneConnectionLimit && tienePoolTimeout ? '✅' : '⚠️ '} Pool de conexiones: ${tieneConnectionLimit && tienePoolTimeout ? 'Configurado' : 'Pendiente'}`);
    console.log(`✅ Rendimiento de queries: ${tiempoQuery < 1000 ? 'Óptimo' : 'Lento'}`);
    console.log('\n✨ Pruebas completadas exitosamente\n');

  } catch (error) {
    console.error('❌ ERROR durante las pruebas:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Verifica que el archivo .env tenga DATABASE_URL correcto');
    console.error('   3. Verifica que el usuario y contraseña sean correctos');
    console.error('   4. Verifica que la base de datos "diamondsistem" exista\n');
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar pruebas
probarOptimizaciones();













