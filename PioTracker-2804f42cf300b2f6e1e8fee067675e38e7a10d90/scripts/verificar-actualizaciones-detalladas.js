
const fs = require('fs');

/**
 * Script para verificar las actualizaciones en Google Sheets
 */

async function verificarActualizaciones() {
  try {
    console.log('🔍 Verificando actualizaciones en Google Sheets...');
    
    const datos = JSON.parse(fs.readFileSync('actualizaciones-detalladas.json', 'utf8'));
    
    console.log('📊 RESUMEN DE ACTUALIZACIONES:');
    console.log(`✅ Total actualizaciones: ${datos.totalActualizaciones}`);
    console.log(`❌ Total errores: ${datos.totalErrores}`);
    
    console.log('\n📋 INSTRUCCIONES:');
    console.log('1. Abrir Google Sheets:', datos.instrucciones.paso1);
    console.log('2. Para cada actualización:');
    console.log('   - Buscar el indicador en la hoja correspondiente');
    console.log('   - Actualizar la columna D (mes) con el valor especificado');
    console.log('   - Verificar que la actualización sea correcta');
    
    console.log('\n📝 PRIMERAS 10 ACTUALIZACIONES:');
    datos.actualizaciones.slice(0, 10).forEach((act, index) => {
      console.log(`${index + 1}. ${act.indicador.substring(0, 50)}... -> ${act.mes} (${act.hoja})`);
    });
    
    if (datos.actualizaciones.length > 10) {
      console.log(`\n... y ${datos.actualizaciones.length - 10} más`);
    }
    
    console.log('\n💾 Archivos generados:');
    console.log('- actualizaciones-detalladas.json (datos completos)');
    console.log('- actualizaciones-detalladas.csv (para importar)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarActualizaciones();
