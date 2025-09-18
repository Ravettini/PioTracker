
/**
 * Script para guiar actualizaciones manuales en Google Sheets
 */

function guiarActualizacionesManuales() {
  console.log('📋 GUÍA DE ACTUALIZACIONES MANUALES');
  console.log('=====================================');
  
  const datos = JSON.parse(require('fs').readFileSync('actualizaciones-detalladas.json', 'utf8'));
  
  console.log('\n📊 RESUMEN:');
  console.log(`✅ Total actualizaciones: ${datos.actualizaciones.length}`);
  
  console.log('\n📋 INSTRUCCIONES PASO A PASO:');
  console.log('1. Abrir Google Sheets: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA');
  console.log('2. Para cada actualización:');
  
  datos.actualizaciones.forEach((act, index) => {
    console.log(`\n${index + 1}. ${act.indicador.substring(0, 60)}...`);
    console.log(`   📅 Mes: ${act.mes}`);
    console.log(`   📊 Hoja: ${act.hoja}`);
    console.log(`   💡 Instrucción: ${act.instruccion}`);
  });
  
  console.log('\n✅ ACTUALIZACIÓN MANUAL COMPLETADA');
}

guiarActualizacionesManuales();
