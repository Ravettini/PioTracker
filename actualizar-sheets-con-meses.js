
const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script específico para actualizar Google Sheets con datos de meses del Excel
 */

async function actualizarGoogleSheetsConDatosMeses() {
  try {
    console.log('🚀 Actualizando Google Sheets con datos de meses del Excel...');
    
    // Leer datos mapeados
    const datos = JSON.parse(fs.readFileSync('datos-meses-2024.json', 'utf8'));
    
    console.log(`📊 Procesando ${datos.datosMapeados.length} indicadores con datos de meses`);
    
    // Configurar autenticación
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    const resultadosActualizacion = {
      indicadoresProcesados: 0,
      filasActualizadas: 0,
      errores: []
    };
    
    // Procesar cada indicador
    for (const item of datos.datosMapeados) {
      try {
        console.log(`\n📝 Procesando: ${item.indicador}`);
        console.log(`📅 Meses: ${item.mesesParseados.map(m => `${m.mes}:${m.valor}`).join(', ')}`);
        
        // Buscar en Google Sheets por nombre del indicador
        const hojas = ['Jefatura de Gabinete', 'Educacion', 'Ente regulador de servicios púb', 
                      'Seguridad', 'Espacio Publico', 'Hacienda y finanzas', 'Salud', 'MDHyH'];
        
        for (const hoja of hojas) {
          try {
            const range = `${hoja}!A:S`;
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: spreadsheetId,
              range: range
            });
            
            const rows = response.data.values || [];
            
            // Buscar filas que coincidan con el indicador
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              
              if (row[1] && row[1].toString().toLowerCase().includes(item.indicador.toLowerCase())) {
                console.log(`✅ Encontrado en ${hoja}, fila ${i + 1}`);
                
                // Actualizar con el primer mes encontrado
                const primerMes = item.mesesParseados[0];
                if (primerMes) {
                  await sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: `${hoja}!D${i + 1}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                      values: [[primerMes.mes]]
                    }
                  });
                  
                  console.log(`✅ Actualizado: ${primerMes.mes}`);
                  resultadosActualizacion.filasActualizadas++;
                }
                
                resultadosActualizacion.indicadoresProcesados++;
                break;
              }
            }
            
          } catch (error) {
            console.error(`❌ Error en hoja ${hoja}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${item.indicador}:`, error.message);
        resultadosActualizacion.errores.push({
          indicador: item.indicador,
          error: error.message
        });
      }
    }
    
    // Mostrar resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Indicadores procesados: ${resultadosActualizacion.indicadoresProcesados}`);
    console.log(`✅ Filas actualizadas: ${resultadosActualizacion.filasActualizadas}`);
    
    if (resultadosActualizacion.errores.length > 0) {
      console.log(`❌ Errores: ${resultadosActualizacion.errores.length}`);
    }
    
    // Guardar resultados finales
    fs.writeFileSync('resultados-actualizacion-meses-final.json', JSON.stringify(resultadosActualizacion, null, 2));
    console.log('\n💾 Resultados finales guardados en: resultados-actualizacion-meses-final.json');
    
    console.log('\n🎯 ACTUALIZACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsConDatosMeses();
}

module.exports = { actualizarGoogleSheetsConDatosMeses };
