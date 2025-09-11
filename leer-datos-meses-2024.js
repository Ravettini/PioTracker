const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script específico para leer datos de "Meses 2024" del Excel
 * y crear un mapeo para actualizar Google Sheets
 */

async function leerDatosMeses2024() {
  try {
    console.log('📊 Leyendo datos de "Meses 2024" del Excel...');
    
    const excelPath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    const workbook = XLSX.readFile(excelPath);
    
    const resultados = {
      hojasProcesadas: 0,
      indicadoresConMeses: 0,
      datosMapeados: [],
      errores: []
    };
    
    // Procesar hojas que tienen "Meses 2024"
    const hojasConMeses = ['Jefatura de Gabinete', 'Educacion', 'Ente regulador de servicios púb', 
                          'Seguridad', 'Espacio Publico', 'Hacienda y finanzas', 'Salud', 'MDHyH'];
    
    for (const sheetName of hojasConMeses) {
      try {
        console.log(`\n📄 Procesando hoja: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length <= 1) {
          console.log(`⚠️ Hoja ${sheetName} está vacía`);
          continue;
        }
        
        const headers = data[0];
        console.log('📋 Headers:', headers);
        
        // Buscar la columna "Meses 2024"
        const mesesColIndex = headers.findIndex(h => h && h.toString().includes('Meses 2024'));
        
        if (mesesColIndex === -1) {
          console.log(`⚠️ No se encontró columna "Meses 2024" en ${sheetName}`);
          continue;
        }
        
        console.log(`✅ Columna "Meses 2024" encontrada en índice ${mesesColIndex}`);
        
        // Procesar filas de datos
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          
          // Verificar que la fila tenga datos
          if (!row || row.length === 0) continue;
          
          const ministerio = row[0] || sheetName;
          const compromiso = row[2] || '';
          const indicador = row[3] || '';
          const datosMeses = row[mesesColIndex] || '';
          
          if (indicador && datosMeses) {
            console.log(`📝 Indicador: "${indicador}"`);
            console.log(`📅 Datos meses: "${datosMeses}"`);
            
            // Parsear datos de meses (pueden estar en diferentes formatos)
            const mesesParseados = parsearDatosMeses(datosMeses);
            
            if (mesesParseados.length > 0) {
              resultados.datosMapeados.push({
                ministerio: ministerio,
                compromiso: compromiso,
                indicador: indicador,
                datosMeses: datosMeses,
                mesesParseados: mesesParseados
              });
              
              resultados.indicadoresConMeses++;
              console.log(`✅ Meses parseados:`, mesesParseados);
            }
          }
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
    console.log(`✅ Indicadores con datos de meses: ${resultados.indicadoresConMeses}`);
    
    if (resultados.errores.length > 0) {
      console.log(`❌ Errores: ${resultados.errores.length}`);
    }
    
    // Guardar resultados
    fs.writeFileSync('datos-meses-2024.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Datos guardados en: datos-meses-2024.json');
    
    // Generar script de actualización específico
    generarScriptActualizacionEspecifico(resultados);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

function parsearDatosMeses(datosMeses) {
  const meses = [];
  const datosStr = datosMeses.toString();
  
  // Buscar patrones de meses con valores
  const patrones = [
    { regex: /enero[:\s]*(\d+)/i, mes: 'enero' },
    { regex: /febrero[:\s]*(\d+)/i, mes: 'febrero' },
    { regex: /marzo[:\s]*(\d+)/i, mes: 'marzo' },
    { regex: /abril[:\s]*(\d+)/i, mes: 'abril' },
    { regex: /mayo[:\s]*(\d+)/i, mes: 'mayo' },
    { regex: /junio[:\s]*(\d+)/i, mes: 'junio' },
    { regex: /julio[:\s]*(\d+)/i, mes: 'julio' },
    { regex: /agosto[:\s]*(\d+)/i, mes: 'agosto' },
    { regex: /septiembre[:\s]*(\d+)/i, mes: 'septiembre' },
    { regex: /octubre[:\s]*(\d+)/i, mes: 'octubre' },
    { regex: /noviembre[:\s]*(\d+)/i, mes: 'noviembre' },
    { regex: /diciembre[:\s]*(\d+)/i, mes: 'diciembre' }
  ];
  
  patrones.forEach(patron => {
    const match = datosStr.match(patron.regex);
    if (match) {
      const valor = parseInt(match[1]);
      if (valor > 0) {
        meses.push({
          mes: patron.mes,
          valor: valor
        });
      }
    }
  });
  
  // Si no se encontraron patrones específicos, buscar números sueltos
  if (meses.length === 0) {
    const numeros = datosStr.match(/\d+/g);
    if (numeros && numeros.length > 0) {
      // Asumir que es un valor anual o trimestral
      meses.push({
        mes: 'enero',
        valor: parseInt(numeros[0])
      });
    }
  }
  
  return meses;
}

function generarScriptActualizacionEspecifico(resultados) {
  const script = `
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
    
    console.log(\`📊 Procesando \${datos.datosMapeados.length} indicadores con datos de meses\`);
    
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
        console.log(\`\\n📝 Procesando: \${item.indicador}\`);
        console.log(\`📅 Meses: \${item.mesesParseados.map(m => \`\${m.mes}:\${m.valor}\`).join(', ')}\`);
        
        // Buscar en Google Sheets por nombre del indicador
        const hojas = ['Jefatura de Gabinete', 'Educacion', 'Ente regulador de servicios púb', 
                      'Seguridad', 'Espacio Publico', 'Hacienda y finanzas', 'Salud', 'MDHyH'];
        
        for (const hoja of hojas) {
          try {
            const range = \`\${hoja}!A:S\`;
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: spreadsheetId,
              range: range
            });
            
            const rows = response.data.values || [];
            
            // Buscar filas que coincidan con el indicador
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              
              if (row[1] && row[1].toString().toLowerCase().includes(item.indicador.toLowerCase())) {
                console.log(\`✅ Encontrado en \${hoja}, fila \${i + 1}\`);
                
                // Actualizar con el primer mes encontrado
                const primerMes = item.mesesParseados[0];
                if (primerMes) {
                  await sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: \`\${hoja}!D\${i + 1}\`,
                    valueInputOption: 'RAW',
                    requestBody: {
                      values: [[primerMes.mes]]
                    }
                  });
                  
                  console.log(\`✅ Actualizado: \${primerMes.mes}\`);
                  resultadosActualizacion.filasActualizadas++;
                }
                
                resultadosActualizacion.indicadoresProcesados++;
                break;
              }
            }
            
          } catch (error) {
            console.error(\`❌ Error en hoja \${hoja}:\`, error.message);
          }
        }
        
      } catch (error) {
        console.error(\`❌ Error procesando \${item.indicador}:\`, error.message);
        resultadosActualizacion.errores.push({
          indicador: item.indicador,
          error: error.message
        });
      }
    }
    
    // Mostrar resumen final
    console.log('\\n📊 RESUMEN FINAL:');
    console.log(\`✅ Indicadores procesados: \${resultadosActualizacion.indicadoresProcesados}\`);
    console.log(\`✅ Filas actualizadas: \${resultadosActualizacion.filasActualizadas}\`);
    
    if (resultadosActualizacion.errores.length > 0) {
      console.log(\`❌ Errores: \${resultadosActualizacion.errores.length}\`);
    }
    
    // Guardar resultados finales
    fs.writeFileSync('resultados-actualizacion-meses-final.json', JSON.stringify(resultadosActualizacion, null, 2));
    console.log('\\n💾 Resultados finales guardados en: resultados-actualizacion-meses-final.json');
    
    console.log('\\n🎯 ACTUALIZACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsConDatosMeses();
}

module.exports = { actualizarGoogleSheetsConDatosMeses };
`;
  
  fs.writeFileSync('actualizar-sheets-con-meses.js', script);
  console.log('📝 Script específico generado: actualizar-sheets-con-meses.js');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  leerDatosMeses2024();
}

module.exports = { leerDatosMeses2024 };
