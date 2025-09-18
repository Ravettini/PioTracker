#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Google Sheets...');
    
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('📋 Variables encontradas:');
    console.log(`   CLIENT_ID: ${clientId ? '✅' : '❌'}`);
    console.log(`   CLIENT_SECRET: ${clientSecret ? '✅' : '❌'}`);
    console.log(`   REFRESH_TOKEN: ${refreshToken ? '✅' : '❌'}`);
    console.log(`   SHEET_ID: ${sheetId ? '✅' : '❌'}`);
    
    if (!clientId || !clientSecret || !refreshToken || !sheetId) {
      console.error('❌ Faltan credenciales');
      return;
    }
    
    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    console.log('🔄 Obteniendo nuevo access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Access token obtenido');
    
    // Crear cliente de Google Sheets
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    console.log('📊 Obteniendo información del spreadsheet...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    console.log('✅ Conexión exitosa!');
    console.log(`📋 Título: ${spreadsheetInfo.data.properties.title}`);
    console.log(`📄 Hojas disponibles:`);
    
    spreadsheetInfo.data.sheets.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.properties.title}`);
    });
    
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

testConnection();
