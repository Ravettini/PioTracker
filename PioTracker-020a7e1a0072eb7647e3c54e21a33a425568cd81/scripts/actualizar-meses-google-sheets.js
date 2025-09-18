const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script para actualizar filas existentes en Google Sheets agregando el campo MES
 * Basado en la estructura de columnas del Excel original
 */

async function actualizarFilasConMeses() {
  try {
    console.log('🚀 Iniciando actualización de filas con meses en Google Sheets...');
    
    // Configuración de Google Sheets (usar variables de entorno del proyecto)
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
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID no está configurado');
    }
    
    console.log('📊 Conectado a Google Sheets:', spreadsheetId);
    
    // Obtener todas las hojas del spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    console.log('📋 Hojas encontradas:', sheetNames);
    
    const resultados = {
      hojasProcesadas: 0,
      filasActualizadas: 0,
      errores: []
    };
    
    // Procesar cada hoja de ministerio
    for (const sheetName of sheetNames) {
      try {
        console.log(`\n📄 Procesando hoja: ${sheetName}`);
        
        // Leer datos de la hoja
        const range = `${sheetName}!A:S`; // A:S porque agregamos la columna mes
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: range
        });
        
        const rows = response.data.values || [];
        
        if (rows.length <= 1) {
          console.log(`⚠️ Hoja ${sheetName} está vacía o solo tiene headers`);
          continue;
        }
        
        const headers = rows[0];
        console.log('📋 Headers:', headers);
        
        // Buscar la columna de período (columna C, índice 2)
        const periodoColIndex = 2;
        const mesColIndex = 3; // Nueva columna mes (columna D)
        
        // Verificar si ya existe la columna mes
        if (headers[mesColIndex] && headers[mesColIndex].toLowerCase().includes('mes')) {
          console.log(`✅ Columna mes ya existe en ${sheetName}`);
          continue;
        }
        
        // Actualizar filas que no tienen mes
        const filasParaActualizar = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Si la fila tiene período pero no tiene mes
          if (row[periodoColIndex] && (!row[mesColIndex] || row[mesColIndex] === '')) {
            const periodo = row[periodoColIndex];
            let mes = '';
            
            // Determinar mes basado en el período
            if (periodo.includes('2024')) {
              // Para períodos 2024, intentar determinar el mes
              if (periodo.includes('01') || periodo.includes('Enero')) mes = 'enero';
              else if (periodo.includes('02') || periodo.includes('Febrero')) mes = 'febrero';
              else if (periodo.includes('03') || periodo.includes('Marzo')) mes = 'marzo';
              else if (periodo.includes('04') || periodo.includes('Abril')) mes = 'abril';
              else if (periodo.includes('05') || periodo.includes('Mayo')) mes = 'mayo';
              else if (periodo.includes('06') || periodo.includes('Junio')) mes = 'junio';
              else if (periodo.includes('07') || periodo.includes('Julio')) mes = 'julio';
              else if (periodo.includes('08') || periodo.includes('Agosto')) mes = 'agosto';
              else if (periodo.includes('09') || periodo.includes('Septiembre')) mes = 'septiembre';
              else if (periodo.includes('10') || periodo.includes('Octubre')) mes = 'octubre';
              else if (periodo.includes('11') || periodo.includes('Noviembre')) mes = 'noviembre';
              else if (periodo.includes('12') || periodo.includes('Diciembre')) mes = 'diciembre';
              else mes = 'enero'; // Por defecto
            } else if (periodo.includes('2025-2027')) {
              // Para períodos 2025-2027, usar mes por defecto
              mes = 'enero';
            }
            
            if (mes) {
              filasParaActualizar.push({
                rowIndex: i + 1, // +1 porque Google Sheets es 1-indexed
                mes: mes
              });
              
              console.log(`📝 Fila ${i + 1}: Período "${periodo}" → Mes "${mes}"`);
            }
          }
        }
        
        // Actualizar filas en lotes
        if (filasParaActualizar.length > 0) {
          console.log(`🔄 Actualizando ${filasParaActualizar.length} filas en ${sheetName}...`);
          
          // Actualizar cada fila individualmente
          for (const fila of filasParaActualizar) {
            try {
              await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!D${fila.rowIndex}`, // Columna D (mes)
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
      console.log(`❌ Errores encontrados: ${resultados.errores.length}`);
      resultados.errores.forEach(error => {
        console.log(`   - ${error.hoja}: ${error.error}`);
      });
    }
    
    // Guardar resultados
    fs.writeFileSync('resultados-actualizacion-meses.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Resultados guardados en: resultados-actualizacion-meses.json');
    
    console.log('\n🎯 ACTUALIZACIÓN COMPLETADA');
    console.log('Las filas existentes ahora tienen el campo MES correspondiente');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarFilasConMeses();
}

module.exports = { actualizarFilasConMeses };
