const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script para actualizar Google Sheets con datos de meses
 * Usando las credenciales encontradas en el código
 */

async function actualizarGoogleSheetsConCredenciales() {
  try {
    console.log('🚀 Actualizando Google Sheets con credenciales del código...');
    
    // Credenciales encontradas en el código
    const CLIENT_ID = '152204850788-as9dl0dmnfrr1ptuu12afvkvp93bs3vs.apps.googleusercontent.com';
    const CLIENT_SECRET = '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';
    const SHEET_ID = '1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA';
    
    console.log('📊 Sheet ID:', SHEET_ID);
    
    // Leer datos mapeados
    const datos = JSON.parse(fs.readFileSync('datos-meses-2024.json', 'utf8'));
    console.log(`📊 Procesando ${datos.datosMapeados.length} indicadores con datos de meses`);
    
    // Configurar autenticación
    const auth = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      'http://localhost:8080/api/v1/auth/google/callback'
    );
    
    // Intentar usar refresh token si está disponible
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      console.log('❌ No se encontró GOOGLE_REFRESH_TOKEN en variables de entorno');
      console.log('💡 Necesitas obtener un refresh token ejecutando: node server/get-google-token.js');
      return;
    }
    
    auth.setCredentials({
      refresh_token: refreshToken
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Probar conexión
    console.log('🧪 Probando conexión con Google Sheets...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });
    
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Spreadsheet: ${spreadsheet.data.properties.title}`);
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    console.log('📋 Hojas disponibles:', sheetNames);
    
    const resultados = {
      indicadoresProcesados: 0,
      filasActualizadas: 0,
      errores: []
    };
    
    // Procesar cada indicador
    for (const item of datos.datosMapeados) {
      try {
        console.log(`\n📝 Procesando: ${item.indicador.substring(0, 50)}...`);
        console.log(`📅 Mes: ${item.mesesParseados[0]?.mes || 'enero'}`);
        
        // Buscar en las hojas disponibles
        for (const sheetName of sheetNames) {
          try {
            const range = `${sheetName}!A:S`;
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: SHEET_ID,
              range: range
            });
            
            const rows = response.data.values || [];
            
            // Buscar filas que coincidan con el indicador
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              
              if (row[1] && row[1].toString().toLowerCase().includes(item.indicador.toLowerCase())) {
                console.log(`✅ Encontrado en ${sheetName}, fila ${i + 1}`);
                
                // Verificar si ya tiene mes
                if (row[3] && row[3] !== '') {
                  console.log(`ℹ️ Ya tiene mes: ${row[3]}`);
                  continue;
                }
                
                // Actualizar con el mes
                const mes = item.mesesParseados[0]?.mes || 'enero';
                await sheets.spreadsheets.values.update({
                  spreadsheetId: SHEET_ID,
                  range: `${sheetName}!D${i + 1}`,
                  valueInputOption: 'RAW',
                  requestBody: {
                    values: [[mes]]
                  }
                });
                
                console.log(`✅ Actualizado: ${mes}`);
                resultados.filasActualizadas++;
                break;
              }
            }
            
          } catch (error) {
            console.error(`❌ Error en hoja ${sheetName}:`, error.message);
          }
        }
        
        resultados.indicadoresProcesados++;
        
      } catch (error) {
        console.error(`❌ Error procesando ${item.indicador}:`, error.message);
        resultados.errores.push({
          indicador: item.indicador,
          error: error.message
        });
      }
    }
    
    // Mostrar resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Indicadores procesados: ${resultados.indicadoresProcesados}`);
    console.log(`✅ Filas actualizadas: ${resultados.filasActualizadas}`);
    
    if (resultados.errores.length > 0) {
      console.log(`❌ Errores: ${resultados.errores.length}`);
    }
    
    // Guardar resultados finales
    fs.writeFileSync('resultados-actualizacion-automatica.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Resultados guardados en: resultados-actualizacion-automatica.json');
    
    console.log('\n🎯 ACTUALIZACIÓN AUTOMÁTICA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error general:', error);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 El refresh token puede haber expirado.');
      console.log('Ejecuta: node server/get-google-token.js para obtener uno nuevo');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsConCredenciales();
}

module.exports = { actualizarGoogleSheetsConCredenciales };
