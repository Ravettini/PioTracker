#!/usr/bin/env node

/**
 * Script para probar la conexión con Google Sheets
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testGoogleSheetsConnection() {
  try {
    console.log('🔍 Probando conexión con Google Sheets...');
    
    // Verificar variables de entorno
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Faltan credenciales de Google OAuth');
      console.log('💡 Asegúrate de tener configuradas:');
      console.log('   - GOOGLE_OAUTH_CLIENT_ID');
      console.log('   - GOOGLE_OAUTH_CLIENT_SECRET');
      console.log('   - GOOGLE_REFRESH_TOKEN');
      return;
    }
    
    if (!sheetId || sheetId === 'REEMPLAZAR_CON_TU_SHEET_ID') {
      console.error('❌ GOOGLE_SHEET_ID no está configurado');
      console.log('💡 Agrega el ID de tu Google Sheet al archivo .env');
      console.log('   Ejemplo: GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
      return;
    }
    
    console.log('✅ Credenciales encontradas');
    
    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    // Crear cliente de Google Sheets
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    console.log('📊 Obteniendo información del spreadsheet...');
    
    // Obtener información del spreadsheet
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    console.log('✅ Conexión exitosa!');
    console.log(`📋 Título: ${spreadsheetInfo.data.properties.title}`);
    console.log(`📄 Hojas disponibles:`);
    
    spreadsheetInfo.data.sheets.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.properties.title}`);
    });
    
    // Probar lectura de datos
    console.log('\n📖 Probando lectura de datos...');
    const firstSheet = spreadsheetInfo.data.sheets[0];
    const sheetName = firstSheet.properties.title;
    
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z10`,
    });
    
    console.log(`✅ Datos leídos exitosamente de la hoja "${sheetName}"`);
    console.log(`📊 Filas encontradas: ${data.data.values ? data.data.values.length : 0}`);
    
    if (data.data.values && data.data.values.length > 0) {
      console.log('📋 Primeras 3 filas:');
      data.data.values.slice(0, 3).forEach((row, index) => {
        console.log(`   Fila ${index + 1}: ${row.slice(0, 5).join(' | ')}${row.length > 5 ? '...' : ''}`);
      });
    }
    
    console.log('\n🎉 ¡Todo funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('💡 El refresh token ha expirado. Ejecuta: node get-google-token.js');
    } else if (error.message.includes('not found')) {
      console.log('💡 El GOOGLE_SHEET_ID no es válido o no tienes acceso');
    } else if (error.message.includes('permission')) {
      console.log('💡 No tienes permisos para acceder a este spreadsheet');
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testGoogleSheetsConnection();
}

module.exports = { testGoogleSheetsConnection };
