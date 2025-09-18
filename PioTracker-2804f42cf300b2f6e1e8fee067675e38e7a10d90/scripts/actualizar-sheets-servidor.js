const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script para actualizar Google Sheets usando las mismas credenciales del servidor
 * Basado en la configuración de producción
 */

async function actualizarGoogleSheetsConCredencialesServidor() {
  try {
    console.log('🚀 Actualizando Google Sheets con credenciales del servidor...');
    
    // Credenciales encontradas en el código del servidor
    const CLIENT_ID = '152204850788-as9dl0dmnfrr1ptuu12afvkvp93bs3vs.apps.googleusercontent.com';
    const CLIENT_SECRET = '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';
    const SHEET_ID = '1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA';
    const AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
    
    console.log('📊 Sheet ID:', SHEET_ID);
    
    // Leer datos de actualizaciones
    const datos = JSON.parse(fs.readFileSync('actualizaciones-detalladas.json', 'utf8'));
    console.log(`📊 Procesando ${datos.actualizaciones.length} actualizaciones`);
    
    // Configurar autenticación OAuth2 (igual que en el servidor)
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      AUTH_URI
    );
    
    // Intentar obtener refresh token desde variables de entorno o archivo
    let refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      // Buscar en archivos de configuración
      try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const match = envFile.match(/GOOGLE_REFRESH_TOKEN=(.+)/);
        if (match) {
          refreshToken = match[1].trim();
        }
      } catch (error) {
        console.log('⚠️ No se encontró archivo .env');
      }
    }
    
    if (!refreshToken) {
      console.log('❌ No se encontró GOOGLE_REFRESH_TOKEN');
      console.log('💡 Necesitas configurar el refresh token en las variables de entorno');
      console.log('💡 O ejecutar: node server/get-google-token.js para obtener uno nuevo');
      return;
    }
    
    console.log('✅ Refresh token encontrado');
    
    // Configurar credenciales (igual que en el servidor)
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
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
    
    // Procesar actualizaciones por hoja
    const actualizacionesPorHoja = {};
    datos.actualizaciones.forEach(act => {
      if (!actualizacionesPorHoja[act.hoja]) {
        actualizacionesPorHoja[act.hoja] = [];
      }
      actualizacionesPorHoja[act.hoja].push(act);
    });
    
    console.log('\n📊 Procesando actualizaciones por hoja...');
    
    for (const [hojaNombre, actualizaciones] of Object.entries(actualizacionesPorHoja)) {
      try {
        console.log(`\n📝 Procesando hoja: ${hojaNombre} (${actualizaciones.length} actualizaciones)`);
        
        // Buscar la hoja en el spreadsheet
        const hoja = spreadsheet.data.sheets.find(sheet => 
          sheet.properties.title.toLowerCase().includes(hojaNombre.toLowerCase()) ||
          hojaNombre.toLowerCase().includes(sheet.properties.title.toLowerCase())
        );
        
        if (!hoja) {
          console.log(`⚠️ Hoja "${hojaNombre}" no encontrada, saltando...`);
          continue;
        }
        
        const range = `${hoja.properties.title}!A:S`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: range
        });
        
        const rows = response.data.values || [];
        console.log(`📊 Filas encontradas en ${hoja.properties.title}: ${rows.length}`);
        
        // Buscar y actualizar filas
        let actualizacionesEnHoja = 0;
        
        for (const actualizacion of actualizaciones) {
          try {
            // Buscar filas que coincidan con el indicador
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              
              if (row[1] && row[1].toString().toLowerCase().includes(actualizacion.indicador.toLowerCase().substring(0, 30))) {
                console.log(`✅ Encontrado en fila ${i + 1}: ${actualizacion.indicador.substring(0, 50)}...`);
                
                // Verificar si ya tiene mes
                if (row[3] && row[3] !== '') {
                  console.log(`ℹ️ Ya tiene mes: ${row[3]}`);
                  continue;
                }
                
                // Actualizar con el mes
                await sheets.spreadsheets.values.update({
                  spreadsheetId: SHEET_ID,
                  range: `${hoja.properties.title}!D${i + 1}`,
                  valueInputOption: 'RAW',
                  requestBody: {
                    values: [[actualizacion.mes]]
                  }
                });
                
                console.log(`✅ Actualizado: ${actualizacion.mes}`);
                actualizacionesEnHoja++;
                resultados.filasActualizadas++;
                break;
              }
            }
            
          } catch (error) {
            console.error(`❌ Error procesando ${actualizacion.indicador}:`, error.message);
            resultados.errores.push({
              indicador: actualizacion.indicador,
              error: error.message
            });
          }
        }
        
        console.log(`✅ Actualizaciones en ${hojaNombre}: ${actualizacionesEnHoja}`);
        resultados.indicadoresProcesados += actualizaciones.length;
        
      } catch (error) {
        console.error(`❌ Error procesando hoja ${hojaNombre}:`, error.message);
        resultados.errores.push({
          hoja: hojaNombre,
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
      console.log('Primeros errores:');
      resultados.errores.slice(0, 5).forEach(error => {
        console.log(`- ${error.indicador || error.hoja}: ${error.error}`);
      });
    }
    
    // Guardar resultados finales
    fs.writeFileSync('resultados-actualizacion-automatica.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Resultados guardados en: resultados-actualizacion-automatica.json');
    
    console.log('\n🎯 ACTUALIZACIÓN AUTOMÁTICA COMPLETADA');
    console.log('🔗 Verificar en: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA');
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Error general:', error);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 El refresh token puede haber expirado.');
      console.log('Ejecuta: node server/get-google-token.js para obtener uno nuevo');
    } else if (error.message.includes('insufficient authentication')) {
      console.log('\n💡 Problema de autenticación. Verifica las credenciales.');
    }
    
    return { success: false, error: error.message };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsConCredencialesServidor();
}

module.exports = { actualizarGoogleSheetsConCredencialesServidor };
