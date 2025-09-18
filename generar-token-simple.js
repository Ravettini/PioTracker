const { google } = require('googleapis');

// Configuración - Credenciales de Google OAuth para producción
const CLIENT_ID = '152204850788-as9dl0dmnfrr1ptuu12afvkvp93bs3vs.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:8080/api/v1/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generar URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  prompt: 'consent' // Forzar consentimiento para obtener refresh token
});

console.log('🔗 **PASO 1: Autorizar la aplicación**');
console.log('1. Abre este enlace en tu navegador:');
console.log(authUrl);
console.log('\n2. Inicia sesión con tu cuenta de Google');
console.log('3. Acepta los permisos solicitados');
console.log('4. Copia el código de autorización que aparece en la URL');
console.log('\n---');
console.log('📋 Pega aquí el código de autorización: ');

// Leer código de autorización
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', async (authCode) => {
  try {
    console.log('\n🔄 **PASO 2: Obteniendo tokens...**');
    const { tokens } = await oauth2Client.getToken(authCode);
    
    console.log('\n✅ **TOKENS OBTENIDOS EXITOSAMENTE!**');
    console.log('\n📝 **Agrega estas variables a tu archivo .env:**');
    console.log('---');
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('---');
    
    console.log('\n🔍 **Información adicional:**');
    console.log(`Access Token: ${tokens.access_token}`);
    console.log(`Token Type: ${tokens.token_type}`);
    console.log(`Expiry Date: ${tokens.expiry_date}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 400) {
      console.log('\n💡 **Solución:** El código de autorización puede haber expirado.');
      console.log('Genera uno nuevo siguiendo los pasos.');
    }
  } finally {
    rl.close();
  }
});
