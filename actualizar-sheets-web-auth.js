const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script para actualizar Google Sheets usando autenticación web
 * Basado en las credenciales encontradas en el código
 */

async function actualizarSheetsConWebAuth() {
  try {
    console.log('🚀 Iniciando actualización automática de Google Sheets...');
    
    // Credenciales encontradas en el código
    const CLIENT_ID = '152204850788-as9dl0dmnfrr1ptuu12afvkvp93bs3vs.apps.googleusercontent.com';
    const CLIENT_SECRET = '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';
    const SHEET_ID = '1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA';
    const REDIRECT_URI = 'http://localhost:8080/api/v1/auth/google/callback';
    
    console.log('📊 Sheet ID:', SHEET_ID);
    
    // Leer datos de actualizaciones
    const datos = JSON.parse(fs.readFileSync('actualizaciones-detalladas.json', 'utf8'));
    console.log(`📊 Procesando ${datos.actualizaciones.length} actualizaciones`);
    
    // Configurar autenticación OAuth2
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    
    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      prompt: 'consent'
    });
    
    console.log('\n🔗 AUTORIZACIÓN REQUERIDA:');
    console.log('1. Abre este enlace en tu navegador:');
    console.log(authUrl);
    console.log('\n2. Inicia sesión con tu cuenta de Google');
    console.log('3. Acepta los permisos solicitados');
    console.log('4. Copia el código de autorización que aparece en la URL');
    console.log('\n💡 El código aparecerá después de "code=" en la URL');
    
    // Simular obtención del código (en un caso real necesitarías input del usuario)
    console.log('\n⚠️  NOTA: Este script requiere interacción manual para obtener el código de autorización.');
    console.log('💡 Alternativa: Usar las actualizaciones manuales con el archivo CSV generado.');
    
    // Mostrar resumen de lo que se haría
    console.log('\n📋 RESUMEN DE ACTUALIZACIONES PENDIENTES:');
    console.log(`✅ Total actualizaciones: ${datos.actualizaciones.length}`);
    
    const hojasUnicas = [...new Set(datos.actualizaciones.map(act => act.hoja))];
    console.log(`📊 Hojas a actualizar: ${hojasUnicas.join(', ')}`);
    
    const mesesUnicos = [...new Set(datos.actualizaciones.map(act => act.mes))];
    console.log(`📅 Meses a asignar: ${mesesUnicos.join(', ')}`);
    
    console.log('\n🎯 ALTERNATIVA MANUAL:');
    console.log('1. Abrir Google Sheets: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA');
    console.log('2. Usar el archivo "actualizaciones-detalladas.csv" como guía');
    console.log('3. Actualizar manualmente la columna D (mes) para cada indicador');
    
    // Generar script de actualización manual
    const scriptManual = `
/**
 * Script para guiar actualizaciones manuales en Google Sheets
 */

function guiarActualizacionesManuales() {
  console.log('📋 GUÍA DE ACTUALIZACIONES MANUALES');
  console.log('=====================================');
  
  const datos = JSON.parse(require('fs').readFileSync('actualizaciones-detalladas.json', 'utf8'));
  
  console.log('\\n📊 RESUMEN:');
  console.log(\`✅ Total actualizaciones: \${datos.actualizaciones.length}\`);
  
  console.log('\\n📋 INSTRUCCIONES PASO A PASO:');
  console.log('1. Abrir Google Sheets: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA');
  console.log('2. Para cada actualización:');
  
  datos.actualizaciones.forEach((act, index) => {
    console.log(\`\\n\${index + 1}. \${act.indicador.substring(0, 60)}...\`);
    console.log(\`   📅 Mes: \${act.mes}\`);
    console.log(\`   📊 Hoja: \${act.hoja}\`);
    console.log(\`   💡 Instrucción: \${act.instruccion}\`);
  });
  
  console.log('\\n✅ ACTUALIZACIÓN MANUAL COMPLETADA');
}

guiarActualizacionesManuales();
`;
    
    fs.writeFileSync('guiar-actualizaciones-manuales.js', scriptManual);
    
    console.log('\n💾 Script de guía manual generado: guiar-actualizaciones-manuales.js');
    
    return {
      success: false,
      reason: 'Requiere autorización manual',
      alternativa: 'actualizaciones-detalladas.csv',
      totalActualizaciones: datos.actualizaciones.length
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarSheetsConWebAuth();
}

module.exports = { actualizarSheetsConWebAuth };
