const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script mejorado para analizar la estructura real del Excel
 * y determinar cómo agregar meses a las filas existentes
 */

async function analizarEstructuraExcel() {
  try {
    console.log('🔍 Analizando estructura del Excel original...');
    
    const excelPath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ No se encontró el archivo Excel:', excelPath);
      return;
    }
    
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    
    console.log('📋 Hojas encontradas:', sheetNames);
    
    const analisis = {
      hojas: {},
      estructuraGeneral: {},
      recomendaciones: []
    };
    
    // Analizar cada hoja
    for (const sheetName of sheetNames) {
      console.log(`\n📄 Analizando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length <= 1) {
        console.log(`⚠️ Hoja ${sheetName} está vacía`);
        analisis.hojas[sheetName] = { estado: 'vacia', filas: 0 };
        continue;
      }
      
      const headers = data[0];
      const filasConDatos = data.slice(1).filter(row => row.some(cell => cell && cell.toString().trim() !== ''));
      
      console.log(`📊 Headers (${headers.length}):`, headers.slice(0, 10)); // Primeros 10 headers
      console.log(`📊 Filas con datos: ${filasConDatos.length}`);
      
      // Buscar patrones de meses o períodos
      const patronesMeses = [];
      const patronesPeriodos = [];
      
      headers.forEach((header, index) => {
        if (header) {
          const headerStr = header.toString().toLowerCase();
          
          // Buscar meses
          if (headerStr.includes('enero') || headerStr.includes('febrero') || 
              headerStr.includes('marzo') || headerStr.includes('abril') ||
              headerStr.includes('mayo') || headerStr.includes('junio') ||
              headerStr.includes('julio') || headerStr.includes('agosto') ||
              headerStr.includes('septiembre') || headerStr.includes('octubre') ||
              headerStr.includes('noviembre') || headerStr.includes('diciembre')) {
            patronesMeses.push({ header, columna: index });
          }
          
          // Buscar períodos
          if (headerStr.includes('período') || headerStr.includes('periodo') ||
              headerStr.includes('año') || headerStr.includes('2024') ||
              headerStr.includes('2025')) {
            patronesPeriodos.push({ header, columna: index });
          }
        }
      });
      
      // Analizar algunas filas de ejemplo
      const filasEjemplo = filasConDatos.slice(0, 3);
      const datosEjemplo = filasEjemplo.map(row => 
        row.slice(0, Math.min(15, row.length)) // Primeras 15 columnas
      );
      
      analisis.hojas[sheetName] = {
        estado: 'con_datos',
        totalFilas: data.length - 1,
        filasConDatos: filasConDatos.length,
        headers: headers.slice(0, 15), // Primeros 15 headers
        patronesMeses,
        patronesPeriodos,
        datosEjemplo
      };
      
      console.log(`✅ Patrones de meses encontrados: ${patronesMeses.length}`);
      console.log(`✅ Patrones de períodos encontrados: ${patronesPeriodos.length}`);
      
      if (patronesMeses.length > 0) {
        console.log('📅 Meses:', patronesMeses.map(p => p.header));
      }
      
      if (patronesPeriodos.length > 0) {
        console.log('📅 Períodos:', patronesPeriodos.map(p => p.header));
      }
    }
    
    // Generar recomendaciones
    const hojasConDatos = Object.entries(analisis.hojas)
      .filter(([_, info]) => info.estado === 'con_datos');
    
    if (hojasConDatos.length > 0) {
      analisis.recomendaciones.push('✅ Se encontraron hojas con datos que pueden ser procesadas');
      
      // Verificar si hay patrones de meses
      const hojasConMeses = hojasConDatos.filter(([_, info]) => info.patronesMeses.length > 0);
      if (hojasConMeses.length > 0) {
        analisis.recomendaciones.push('✅ Algunas hojas tienen columnas de meses que pueden ser mapeadas');
      } else {
        analisis.recomendaciones.push('⚠️ No se encontraron columnas de meses explícitas');
        analisis.recomendaciones.push('💡 Recomendación: Asignar mes por defecto basado en el período');
      }
      
      // Verificar si hay patrones de períodos
      const hojasConPeriodos = hojasConDatos.filter(([_, info]) => info.patronesPeriodos.length > 0);
      if (hojasConPeriodos.length > 0) {
        analisis.recomendaciones.push('✅ Se encontraron columnas de períodos que pueden ser usadas para determinar meses');
      }
    }
    
    // Guardar análisis completo
    fs.writeFileSync('analisis-excel-completo.json', JSON.stringify(analisis, null, 2));
    
    console.log('\n📊 ANÁLISIS COMPLETADO:');
    console.log(`✅ Hojas analizadas: ${Object.keys(analisis.hojas).length}`);
    console.log(`✅ Hojas con datos: ${hojasConDatos.length}`);
    
    console.log('\n💡 RECOMENDACIONES:');
    analisis.recomendaciones.forEach(rec => console.log(`   ${rec}`));
    
    console.log('\n💾 Análisis guardado en: analisis-excel-completo.json');
    
    // Generar script de actualización basado en el análisis
    generarScriptActualizacion(analisis);
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  }
}

function generarScriptActualizacion(analisis) {
  const script = `
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
        console.log(\`\\n📄 Procesando hoja: \${sheetName}\`);
        
        // Leer datos de la hoja
        const range = \`\${sheetName}!A:S\`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: range
        });
        
        const rows = response.data.values || [];
        
        if (rows.length <= 1) {
          console.log(\`⚠️ Hoja \${sheetName} está vacía\`);
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
            
            console.log(\`📝 Fila \${i + 1}: Período "\${periodo}" → Mes "\${mes}"\`);
          }
        }
        
        // Actualizar filas
        if (filasParaActualizar.length > 0) {
          console.log(\`🔄 Actualizando \${filasParaActualizar.length} filas...\`);
          
          for (const fila of filasParaActualizar) {
            try {
              await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: \`\${sheetName}!D\${fila.rowIndex}\`,
                valueInputOption: 'RAW',
                requestBody: {
                  values: [[fila.mes]]
                }
              });
              
              resultados.filasActualizadas++;
            } catch (error) {
              console.error(\`❌ Error actualizando fila \${fila.rowIndex}:\`, error.message);
              resultados.errores.push({
                hoja: sheetName,
                fila: fila.rowIndex,
                error: error.message
              });
            }
          }
          
          console.log(\`✅ \${filasParaActualizar.length} filas actualizadas en \${sheetName}\`);
        } else {
          console.log(\`ℹ️ No hay filas para actualizar en \${sheetName}\`);
        }
        
        resultados.hojasProcesadas++;
        
      } catch (error) {
        console.error(\`❌ Error procesando hoja \${sheetName}:\`, error.message);
        resultados.errores.push({
          hoja: sheetName,
          error: error.message
        });
      }
    }
    
    // Mostrar resumen
    console.log('\\n📊 RESUMEN:');
    console.log(\`✅ Hojas procesadas: \${resultados.hojasProcesadas}\`);
    console.log(\`✅ Filas actualizadas: \${resultados.filasActualizadas}\`);
    
    if (resultados.errores.length > 0) {
      console.log(\`❌ Errores: \${resultados.errores.length}\`);
    }
    
    // Guardar resultados
    fs.writeFileSync('resultados-actualizacion-final.json', JSON.stringify(resultados, null, 2));
    console.log('\\n💾 Resultados guardados en: resultados-actualizacion-final.json');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsBasadoEnAnalisis();
}

module.exports = { actualizarGoogleSheetsBasadoEnAnalisis };
`;
  
  fs.writeFileSync('actualizar-sheets-final.js', script);
  console.log('📝 Script final generado: actualizar-sheets-final.js');
}

// Ejecutar análisis
if (require.main === module) {
  analizarEstructuraExcel();
}

module.exports = { analizarEstructuraExcel };
