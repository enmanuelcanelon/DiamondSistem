/**
 * Script para corregir emails duplicados de gerentes
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:pbtDlcAbzSAzTCarESrBHuNyLhRcqXVA@gondola.proxy.rlwy.net:28091/railway";

async function corregirEmails() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('\n🔧 CORRIGIENDO EMAILS DE GERENTES\n');
    console.log('='.repeat(60));

    // Actualizar email de Charo gerente
    await client.query(`
      UPDATE usuarios
      SET email = 'charo.gerente@diamondsistem.com'
      WHERE codigo_usuario = 'GER001' OR (rol = 'gerente' AND nombre_completo = 'Charo')
    `);
    console.log('✅ Email de Charo (GER001) actualizado a charo.gerente@');

    // Actualizar email de Mariel gerente
    await client.query(`
      UPDATE usuarios
      SET email = 'mariel.gerente@diamondsistem.com'
      WHERE codigo_usuario = 'GER002' OR (rol = 'gerente' AND nombre_completo = 'Mariel')
    `);
    console.log('✅ Email de Mariel (GER002) actualizado a mariel.gerente@');

    // Actualizar email de Ana gerente
    await client.query(`
      UPDATE usuarios
      SET email = 'ana.gerente@diamondsistem.com'
      WHERE codigo_usuario = 'GER003' OR (rol = 'gerente' AND nombre_completo = 'Ana')
    `);
    console.log('✅ Email de Ana (GER003) actualizado a ana.gerente@');

    // Actualizar codigo de Cecilia a VEN005
    await client.query(`
      UPDATE usuarios
      SET codigo_usuario = 'VEN005'
      WHERE email = 'cecilia@diamondsistem.com' AND rol = 'vendedor'
    `);
    console.log('✅ Código de Cecilia actualizado a VEN005');

    console.log('\n' + '='.repeat(60));
    console.log('✨ EMAILS CORREGIDOS');
    console.log('='.repeat(60));
    console.log('\nAhora puedes ejecutar el script principal de nuevo.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

corregirEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 ERROR FATAL:', error);
    process.exit(1);
  });
