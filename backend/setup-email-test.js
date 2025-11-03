/**
 * Script para configurar una cuenta de email de prueba con Ethereal
 * Ejecutar: node setup-email-test.js
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupTestEmail() {
  console.log('🔧 Configurando cuenta de email de prueba...\n');

  try {
    // Crear cuenta de prueba en Ethereal
    const testAccount = await nodemailer.createTestAccount();

    console.log('✅ Cuenta de prueba creada exitosamente!\n');
    console.log('📧 Credenciales de Email de Prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Host:     ${testAccount.smtp.host}`);
    console.log(`Puerto:   ${testAccount.smtp.port}`);
    console.log(`Usuario:  ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Crear configuración para .env
    const envConfig = `
# ========================================
# Configuración de Email de Prueba (Ethereal)
# ========================================
EMAIL_HOST=${testAccount.smtp.host}
EMAIL_PORT=${testAccount.smtp.port}
EMAIL_USER=${testAccount.user}
EMAIL_PASS=${testAccount.pass}
FRONTEND_URL=http://localhost:5173
`;

    // Leer .env actual si existe
    const envPath = path.join(__dirname, '.env');
    let existingEnv = '';
    
    if (fs.existsSync(envPath)) {
      existingEnv = fs.readFileSync(envPath, 'utf8');
      
      // Remover configuración de email anterior
      existingEnv = existingEnv.replace(/# ========================================\n# Configuración de Email.*?\n# ========================================\n[\s\S]*?(?=\n\n|\n#|$)/g, '');
    }

    // Agregar nueva configuración
    const newEnv = existingEnv.trim() + envConfig;
    fs.writeFileSync(envPath, newEnv);

    console.log('✅ Archivo .env actualizado con las credenciales\n');
    console.log('📝 IMPORTANTE:');
    console.log('   1. Reinicia el servidor backend (npm run dev)');
    console.log('   2. Los emails NO se enviarán realmente');
    console.log('   3. Para ver los emails, visita: https://ethereal.email/messages');
    console.log('   4. Login con las credenciales de arriba\n');
    
    console.log('🔗 URL de visualización: https://ethereal.email/login');
    console.log(`   Usuario: ${testAccount.user}`);
    console.log(`   Password: ${testAccount.pass}\n`);

    // Probar envío
    console.log('📤 Enviando email de prueba...');
    
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"DiamondSistem Test" <test@diamondsistem.com>',
      to: 'cliente@ejemplo.com',
      subject: '✅ Prueba de Email - DiamondSistem',
      html: '<h1>¡Funciona!</h1><p>El sistema de emails está configurado correctamente.</p>',
    });

    console.log('✅ Email de prueba enviado!');
    console.log(`📧 Ver email: ${nodemailer.getTestMessageUrl(info)}\n`);

    console.log('🎉 ¡Todo listo! Puedes usar el sistema de emails.\n');

  } catch (error) {
    console.error('❌ Error al configurar email de prueba:', error.message);
    console.log('\n💡 Solución alternativa:');
    console.log('   Copia y pega esto en tu archivo .env:\n');
    console.log('EMAIL_HOST=smtp.gmail.com');
    console.log('EMAIL_PORT=587');
    console.log('EMAIL_USER=tu-email@gmail.com');
    console.log('EMAIL_PASS=tu-contraseña-de-aplicación\n');
  }
}

setupTestEmail();

