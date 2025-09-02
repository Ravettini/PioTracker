const { google } = require('googleapis');
const readline = require('readline');

// ⚠️ IMPORTANTE: Este archivo usa variables de entorno para las credenciales
// Configura las siguientes variables en tu .env:
// GOOGLE_OAUTH_CLIENT_ID=tu-client-id.apps.googleusercontent.com
// GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret

// Configuración - Usar variables de entorno para mayor seguridad
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '152204850788-as9dl0dmnfrr1ptuu12afvkvp93bs3vs.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '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';
const REDIRECT_URI = 'http://localhost:8080/api/v1/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getRefreshToken() {
  try {
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

    // Solicitar código de autorización
    const authCode = await new Promise((resolve) => {
      rl.question('📋 Pega aquí el código de autorización: ', resolve);
    });

    // Intercambiar código por tokens
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
    
    // Probar la conexión
    console.log('\n🧪 **Probando conexión con Google Sheets...**');
    oauth2Client.setCredentials(tokens);
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Intentar listar spreadsheets del usuario
    const response = await sheets.spreadsheets.list({
      pageSize: 5
    });
    
    console.log('\n📊 **Conexión exitosa!**');
    console.log('Spreadsheets disponibles:');
    response.data.files?.forEach(file => {
      console.log(`- ${file.name} (ID: ${file.id})`);
    });
    
    console.log('\n💡 **Consejo:** Copia el ID del spreadsheet que quieras usar');
    console.log('y agrégalo a tu .env como GOOGLE_SHEET_ID');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 400) {
      console.log('\n💡 **Solución:** El código de autorización puede haber expirado.');
      console.log('Genera uno nuevo siguiendo los pasos.');
    }
  } finally {
    rl.close();
  }
}

// Verificar que las credenciales estén configuradas
if (!CLIENT_ID || CLIENT_ID.includes('TU_CLIENT_ID') || CLIENT_ID.includes('152204850788')) {
  console.log('❌ **ERROR: Configura primero tus credenciales**');
  console.log('\n📝 **PASO 0: Configurar credenciales**');
  console.log('1. Ve a https://console.cloud.google.com/');
  console.log('2. Crea un proyecto o selecciona uno existente');
  console.log('3. Habilita la Google Sheets API');
  console.log('4. Crea credenciales OAuth 2.0 (Aplicación de escritorio)');
  console.log('5. Copia el Client ID y Client Secret');
  console.log('6. Reemplaza TU_CLIENT_ID y TU_CLIENT_SECRET en este archivo');
  console.log('\n---');
} else {
  getRefreshToken();
}

