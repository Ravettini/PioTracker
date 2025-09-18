const fs = require('fs');

/**
 * Script para generar instrucciones específicas de actualización manual
 * Basado en los datos extraídos del Excel
 */

function generarInstruccionesEspecificas() {
  try {
    console.log('📋 Generando instrucciones específicas para actualizar Google Sheets...');
    
    // Leer datos de actualizaciones
    const datos = JSON.parse(fs.readFileSync('actualizaciones-detalladas.json', 'utf8'));
    
    console.log(`📊 Total actualizaciones: ${datos.actualizaciones.length}`);
    
    // Agrupar por hoja
    const porHoja = {};
    datos.actualizaciones.forEach(act => {
      if (!porHoja[act.hoja]) {
        porHoja[act.hoja] = [];
      }
      porHoja[act.hoja].push(act);
    });
    
    console.log('\n📋 INSTRUCCIONES ESPECÍFICAS POR HOJA:');
    console.log('=====================================');
    
    Object.entries(porHoja).forEach(([hoja, actualizaciones]) => {
      console.log(`\n📊 HOJA: ${hoja}`);
      console.log(`📝 Total actualizaciones: ${actualizaciones.length}`);
      console.log('📋 Indicadores a actualizar:');
      
      actualizaciones.forEach((act, index) => {
        console.log(`${index + 1}. ${act.indicador.substring(0, 60)}...`);
        console.log(`   📅 Mes: ${act.mes}`);
        console.log(`   💡 Buscar en columna B, actualizar columna D`);
      });
    });
    
    // Generar archivo de instrucciones detalladas
    const instrucciones = {
      fechaGeneracion: new Date().toISOString(),
      totalActualizaciones: datos.actualizaciones.length,
      urlGoogleSheets: 'https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA',
      instruccionesGenerales: {
        paso1: 'Abrir Google Sheets',
        paso2: 'Para cada hoja, buscar los indicadores en la columna B',
        paso3: 'Actualizar la columna D (mes) con "enero"',
        paso4: 'Verificar que la actualización sea correcta'
      },
      actualizacionesPorHoja: porHoja,
      resumen: {
        hojas: Object.keys(porHoja),
        mesComun: 'enero',
        columnaActualizar: 'D',
        columnaBuscar: 'B'
      }
    };
    
    fs.writeFileSync('instrucciones-especificas.json', JSON.stringify(instrucciones, null, 2));
    
    // Generar archivo de texto plano para fácil lectura
    let textoInstrucciones = 'INSTRUCCIONES ESPECÍFICAS PARA ACTUALIZAR GOOGLE SHEETS\n';
    textoInstrucciones += '============================================================\n\n';
    textoInstrucciones += `URL: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA\n\n`;
    textoInstrucciones += `TOTAL ACTUALIZACIONES: ${datos.actualizaciones.length}\n`;
    textoInstrucciones += `MES A ASIGNAR: enero\n`;
    textoInstrucciones += `COLUMNA A ACTUALIZAR: D (mes)\n`;
    textoInstrucciones += `COLUMNA DONDE BUSCAR: B (indicador)\n\n`;
    
    Object.entries(porHoja).forEach(([hoja, actualizaciones]) => {
      textoInstrucciones += `\nHOJA: ${hoja}\n`;
      textoInstrucciones += `${'='.repeat(hoja.length + 6)}\n`;
      textoInstrucciones += `Total actualizaciones: ${actualizaciones.length}\n\n`;
      
      actualizaciones.forEach((act, index) => {
        textoInstrucciones += `${index + 1}. ${act.indicador}\n`;
        textoInstrucciones += `   📅 Mes: ${act.mes}\n`;
        textoInstrucciones += `   💡 Buscar en columna B, actualizar columna D\n\n`;
      });
    });
    
    fs.writeFileSync('instrucciones-especificas.txt', textoInstrucciones);
    
    console.log('\n💾 Archivos generados:');
    console.log('- instrucciones-especificas.json');
    console.log('- instrucciones-especificas.txt');
    
    console.log('\n🎯 RESUMEN EJECUTIVO:');
    console.log(`✅ Total actualizaciones: ${datos.actualizaciones.length}`);
    console.log(`📊 Hojas a actualizar: ${Object.keys(porHoja).join(', ')}`);
    console.log(`📅 Mes a asignar: enero`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA`);
    
    console.log('\n📋 PASOS RÁPIDOS:');
    console.log('1. Abrir Google Sheets');
    console.log('2. Para cada hoja, buscar indicadores en columna B');
    console.log('3. Actualizar columna D con "enero"');
    console.log('4. Verificar cambios');
    
    return instrucciones;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarInstruccionesEspecificas();
}

module.exports = { generarInstruccionesEspecificas };
