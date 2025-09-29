const fs = require('fs');
const path = require('path');

// Ruta al archivo JSON del Service Account
const jsonPath = path.join(__dirname, '..', 'JSON KEY PIO', 'core-song-467015-v9-77c083fe89a0.json');

try {
  // Leer el archivo JSON
  const serviceAccountData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  console.log('🔑 **VARIABLES DE ENTORNO PARA SERVICE ACCOUNT**');
  console.log('================================================');
  console.log('\n📝 **Agrega estas variables a Render.com:**');
  console.log('---');
  console.log(`GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=${serviceAccountData.project_id}`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=${serviceAccountData.private_key_id}`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="${serviceAccountData.private_key}"`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=${serviceAccountData.client_email}`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=${serviceAccountData.client_id}`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=${serviceAccountData.client_x509_cert_url}`);
  console.log('---');
  
  console.log('\n🚀 **PRÓXIMOS PASOS:**');
  console.log('1. Copia las variables de arriba');
  console.log('2. Ve a tu proyecto en Render.com');
  console.log('3. Environment → Agrega las nuevas variables');
  console.log('4. Reinicia el servicio');
  
  console.log('\n✅ **VENTAJAS DEL SERVICE ACCOUNT:**');
  console.log('- No expira nunca');
  console.log('- No requiere renovación manual');
  console.log('- Más seguro para producción');
  console.log('- Sin intervención humana');
  
  console.log('\n📧 **EMAIL DEL SERVICE ACCOUNT:**');
  console.log(`Comparte tu hoja de Google Sheets con: ${serviceAccountData.client_email}`);
  
} catch (error) {
  console.error('❌ Error leyendo el archivo JSON:', error.message);
  console.log('\n💡 Asegúrate de que el archivo esté en: JSON KEY PIO/core-song-467015-v9-77c083fe89a0.json');
}
