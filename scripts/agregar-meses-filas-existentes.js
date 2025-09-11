const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script para agregar meses a las filas existentes en Google Sheets
 * Basado en el Excel original "Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx"
 */

async function agregarMesesAFilasExistentes() {
  try {
    console.log('🚀 Iniciando script para agregar meses a filas existentes...');
    
    // Leer el archivo Excel original
    const excelPath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ No se encontró el archivo Excel:', excelPath);
      return;
    }
    
    console.log('📊 Leyendo archivo Excel:', excelPath);
    const workbook = XLSX.readFile(excelPath);
    
    // Obtener todas las hojas
    const sheetNames = workbook.SheetNames;
    console.log('📋 Hojas encontradas:', sheetNames);
    
    const resultados = {
      hojasProcesadas: 0,
      filasActualizadas: 0,
      errores: []
    };
    
    // Procesar cada hoja
    for (const sheetName of sheetNames) {
      try {
        console.log(`\n📄 Procesando hoja: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length <= 1) {
          console.log(`⚠️ Hoja ${sheetName} está vacía o solo tiene headers`);
          continue;
        }
        
        // Buscar la columna de meses (buscar headers como "Enero", "Febrero", etc.)
        const headers = data[0];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const columnasMeses = [];
        headers.forEach((header, index) => {
          if (meses.includes(header)) {
            columnasMeses.push({ mes: header, columna: index });
          }
        });
        
        console.log(`📅 Columnas de meses encontradas:`, columnasMeses.map(c => c.mes));
        
        if (columnasMeses.length === 0) {
          console.log(`⚠️ No se encontraron columnas de meses en ${sheetName}`);
          continue;
        }
        
        // Procesar cada fila de datos
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          
          // Buscar valores en las columnas de meses
          for (const colMes of columnasMeses) {
            const valor = row[colMes.columna];
            
            if (valor && valor !== '' && !isNaN(valor) && valor > 0) {
              // Esta fila tiene un valor para este mes
              console.log(`✅ Fila ${i+1}: ${colMes.mes} = ${valor}`);
              
              // Aquí podrías agregar lógica para actualizar Google Sheets
              // Por ahora solo registramos la información
              resultados.filasActualizadas++;
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
    console.log(`✅ Filas con datos de meses: ${resultados.filasActualizadas}`);
    
    if (resultados.errores.length > 0) {
      console.log(`❌ Errores encontrados: ${resultados.errores.length}`);
      resultados.errores.forEach(error => {
        console.log(`   - ${error.hoja}: ${error.error}`);
      });
    }
    
    // Guardar resultados en archivo JSON
    fs.writeFileSync('resultados-meses.json', JSON.stringify(resultados, null, 2));
    console.log('\n💾 Resultados guardados en: resultados-meses.json');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Revisar el archivo resultados-meses.json');
    console.log('2. Crear script para actualizar Google Sheets con los meses encontrados');
    console.log('3. Ejecutar sincronización con Google Sheets');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Función para generar script de actualización de Google Sheets
function generarScriptGoogleSheets() {
  const script = `
// Script para actualizar Google Sheets con meses
// Basado en los resultados de resultados-meses.json

const { google } = require('googleapis');
const fs = require('fs');

async function actualizarGoogleSheetsConMeses() {
  try {
    // Leer resultados
    const resultados = JSON.parse(fs.readFileSync('resultados-meses.json', 'utf8'));
    
    // Configurar autenticación (usar las mismas credenciales del proyecto)
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Aquí implementar la lógica para actualizar cada fila
    // con el mes correspondiente basado en los resultados
    
    console.log('✅ Actualización completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  actualizarGoogleSheetsConMeses();
}
`;
  
  fs.writeFileSync('actualizar-google-sheets-meses.js', script);
  console.log('📝 Script de Google Sheets generado: actualizar-google-sheets-meses.js');
}

// Ejecutar el script principal
if (require.main === module) {
  agregarMesesAFilasExistentes()
    .then(() => {
      generarScriptGoogleSheets();
    })
    .catch(console.error);
}

module.exports = { agregarMesesAFilasExistentes, generarScriptGoogleSheets };
