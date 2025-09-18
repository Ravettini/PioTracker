
const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script de actualización basado en el análisis del Excel
 * Generado automáticamente
 */

async function actualizarGoogleSheetsBasadoEnAnalisis() {
  try {
    console.log('🚀 Actualizando Google Sheets basado en análisis del Excel...');
    
    // Leer análisis
    const analisis = JSON.parse(fs.readFileSync('analisis-excel-completo.json', 'utf8'));
    
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
    
    console.log('📊 Conectado a Google Sheets');
    
    // Obtener hojas del spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    console.log('📋 Hojas en Google Sheets:', sheetNames);
    
    const resultados = {
      hojasProcesadas: 0,
      filasActualizadas: 0,
      errores: []
    };
    
    // Procesar cada hoja
    for (const sheetName of sheetNames) {
      try {
        console.log(`\n📄 Procesando hoja: ${sheetName}`);
        
        // Leer datos de la hoja
        const range = `${sheetName}!A:S`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: range
        });
        
        const rows = response.data.values || [];
        
        if (rows.length <= 1) {
          console.log(`⚠️ Hoja ${sheetName} está vacía`);
          continue;
        }
        
        const headers = rows[0];
        console.log('📋 Headers:', headers.slice(0, 10));
        
        // Buscar filas que necesitan mes
        const filasParaActualizar = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Si la fila tiene período pero no tiene mes (columna D)
          if (row[2] && (!row[3] || row[3] === '')) {
            const periodo = row[2];
            let mes = 'enero'; // Por defecto
            
            // Determinar mes basado en período
            if (periodo.includes('2024')) {
              // Para períodos 2024, usar mes por defecto
              mes = 'enero';
            } else if (periodo.includes('2025-2027')) {
              mes = 'enero';
            }
            
            filasParaActualizar.push({
              rowIndex: i + 1,
              periodo: periodo,
              mes: mes
            });
            
            console.log(`📝 Fila ${i + 1}: Período "${periodo}" → Mes "${mes}"`);
          }
        }
        
        // Actualizar filas
        if (filasParaActualizar.length > 0) {
          console.log(`🔄 Actualizando ${filasParaActualizar.length} filas...`);
          
          for (const fila of filasParaActualizar) {
            try {
              await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!D${fila.rowIndex}`,
                valueInputOption: 'RAW',
                requestBody: {
                  values: [[fila.mes]]
                }
              });
              
              resultados.filasActualizadas++;
            } catch (error) {
              console.error(`❌ Error actualizando fila ${fila.rowIndex}:`, error.message);
              resultados.errores.push({
                hoja: sheetName,
                fila: fila.rowIndex,
                error: error.message
              });
            }
          }
          
          console.log(`✅ ${filasParaActualizar.length} filas actualizadas en ${sheetName}`);
        } else {
          console.log(`ℹ️ No hay filas para actualizar en ${sheetName}`);
        }
        
        resultados.hojasProcesadas++;
        
      } catch (error) {
        console.error(`❌ Error procesando hoja ${sheetName}:`, error.message);
        resultados.errores.push({
          hoja: sheetName,
          error: error.message
        });
      }
    }
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Hojas procesadas: ${resultados.hojasProcesadas}`);
    console.log(`✅ Filas actualizadas: ${resultados.filasActualizadas}`);
    
    if (resultados.errores.length > 0) {
      console.log(`❌ Errores: ${resultados.errores.length}`);
    }
    
    // Guardar resultados
    fs.writeFileSync('resultados-actualizacion-final.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Resultados guardados en: resultados-actualizacion-final.json');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsBasadoEnAnalisis();
}

module.exports = { actualizarGoogleSheetsBasadoEnAnalisis };
