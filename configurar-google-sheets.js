const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 CONFIGURACIÓN DE GOOGLE SHEETS PARA SIPIO');
console.log('==============================================');
console.log('');
console.log('Necesitas configurar las siguientes variables:');
console.log('');

const config = {};

function preguntar(pregunta, clave) {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      config[clave] = respuesta;
      resolve();
    });
  });
}

async function main() {
  console.log('📋 PASO 1: Obtener credenciales de Google Sheets');
  console.log('');
  
  await preguntar('🔑 GOOGLE_OAUTH_CLIENT_ID: ', 'GOOGLE_OAUTH_CLIENT_ID');
  await preguntar('🔑 GOOGLE_OAUTH_CLIENT_SECRET: ', 'GOOGLE_OAUTH_CLIENT_SECRET');
  await preguntar('🔑 GOOGLE_REFRESH_TOKEN: ', 'GOOGLE_REFRESH_TOKEN');
  await preguntar('📊 GOOGLE_SHEET_ID (ID de tu planilla): ', 'GOOGLE_SHEET_ID');
  
  console.log('');
  console.log('📝 Generando archivo .env...');
  
  const envContent = `# Configuración de la Aplicación
NODE_ENV=production
PORT=8080
WEB_ORIGIN=https://pio-tracker-frontend.vercel.app
JWT_SECRET=tu-secreto-jwt-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=24h

# Base de Datos PostgreSQL
DATABASE_URL=postgresql://pio_user:pio_password@localhost:5432/pio_tracker

# Google OAuth2 para Google Sheets
GOOGLE_OAUTH_CLIENT_ID=${config.GOOGLE_OAUTH_CLIENT_ID}
GOOGLE_OAUTH_CLIENT_SECRET=${config.GOOGLE_OAUTH_CLIENT_SECRET}
GOOGLE_REFRESH_TOKEN=${config.GOOGLE_REFRESH_TOKEN}
GOOGLE_SHEET_ID=${config.GOOGLE_SHEET_ID}
GOOGLE_SHEET_TAB=Justicia

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json`;

  const fs = require('fs');
  fs.writeFileSync('.env', envContent);
  
  console.log('✅ Archivo .env creado exitosamente!');
  console.log('');
  console.log('🚀 PRÓXIMOS PASOS:');
  console.log('1. Reinicia el backend: docker-compose restart backend');
  console.log('2. Verifica los logs del backend para ver si conecta con Google Sheets');
  console.log('3. Prueba los gráficos en la aplicación');
  console.log('');
  console.log('📋 INFORMACIÓN IMPORTANTE:');
  console.log('- El GOOGLE_SHEET_ID es la parte larga de la URL de tu Google Sheets');
  console.log('- Ejemplo: https://docs.google.com/spreadsheets/d/1ABC123.../edit');
  console.log('- El ID sería: 1ABC123...');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
