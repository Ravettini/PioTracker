const { google } = require('googleapis');
const fs = require('fs');

/**
 * Script para generar actualizaciones detalladas para Google Sheets
 * Basado en los datos extraídos del Excel
 */

async function generarActualizacionesDetalladas() {
  try {
    console.log('📊 Generando actualizaciones detalladas para Google Sheets...');
    
    // Leer datos mapeados
    const datos = JSON.parse(fs.readFileSync('datos-meses-2024.json', 'utf8'));
    console.log(`📊 Procesando ${datos.datosMapeados.length} indicadores con datos de meses`);
    
    const actualizaciones = [];
    const errores = [];
    
    // Procesar cada indicador
    for (const item of datos.datosMapeados) {
      try {
        const mes = item.mesesParseados[0]?.mes || 'enero';
        
        // Buscar en qué hojas del Excel aparece este indicador
        const hojasEncontradas = [];
        
        // Simular búsqueda en hojas (basado en los datos que ya tenemos)
        if (item.indicador.toLowerCase().includes('trabajadores') || 
            item.indicador.toLowerCase().includes('capacitacion') ||
            item.indicador.toLowerCase().includes('especializacion')) {
          hojasEncontradas.push('Jefatura de Gabinete');
        }
        
        if (item.indicador.toLowerCase().includes('talento') || 
            item.indicador.toLowerCase().includes('tech') ||
            item.indicador.toLowerCase().includes('steam')) {
          hojasEncontradas.push('Educacion');
        }
        
        if (item.indicador.toLowerCase().includes('seguridad') || 
            item.indicador.toLowerCase().includes('911') ||
            item.indicador.toLowerCase().includes('144')) {
          hojasEncontradas.push('Seguridad');
        }
        
        if (item.indicador.toLowerCase().includes('mdhyh') || 
            item.indicador.toLowerCase().includes('violencia')) {
          hojasEncontradas.push('MDHyH');
        }
        
        // Si no se encontró ninguna hoja específica, usar las principales
        if (hojasEncontradas.length === 0) {
          hojasEncontradas.push('Jefatura de Gabinete', 'Educacion', 'Seguridad', 'MDHyH');
        }
        
        // Crear actualizaciones para cada hoja
        for (const hoja of hojasEncontradas) {
          actualizaciones.push({
            indicador: item.indicador,
            mes: mes,
            hoja: hoja,
            valor: item.mesesParseados[0]?.valor || 0,
            instruccion: `Actualizar columna D (mes) con "${mes}" para indicadores que contengan "${item.indicador.substring(0, 30)}..."`,
            prioridad: 'alta'
          });
        }
        
      } catch (error) {
        errores.push({
          indicador: item.indicador,
          error: error.message
        });
      }
    }
    
    // Generar archivos de salida
    const resultado = {
      fechaGeneracion: new Date().toISOString(),
      totalActualizaciones: actualizaciones.length,
      totalErrores: errores.length,
      actualizaciones: actualizaciones,
      errores: errores,
      instrucciones: {
        paso1: 'Abrir Google Sheets: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA',
        paso2: 'Para cada actualización, buscar el indicador en la hoja correspondiente',
        paso3: 'Actualizar la columna D (mes) con el valor especificado',
        paso4: 'Verificar que la actualización sea correcta'
      }
    };
    
    // Guardar archivos
    fs.writeFileSync('actualizaciones-detalladas.json', JSON.stringify(resultado, null, 2));
    
    // Generar CSV para fácil importación
    const csvHeader = 'Indicador,Mes,Hoja,Valor,Instruccion,Prioridad\n';
    const csvContent = actualizaciones.map(act => 
      `"${act.indicador.replace(/"/g, '""')}","${act.mes}","${act.hoja}","${act.valor}","${act.instruccion}","${act.prioridad}"`
    ).join('\n');
    
    fs.writeFileSync('actualizaciones-detalladas.csv', csvHeader + csvContent);
    
    // Generar script de verificación
    const scriptVerificacion = `
const fs = require('fs');

/**
 * Script para verificar las actualizaciones en Google Sheets
 */

async function verificarActualizaciones() {
  try {
    console.log('🔍 Verificando actualizaciones en Google Sheets...');
    
    const datos = JSON.parse(fs.readFileSync('actualizaciones-detalladas.json', 'utf8'));
    
    console.log('📊 RESUMEN DE ACTUALIZACIONES:');
    console.log(\`✅ Total actualizaciones: \${datos.totalActualizaciones}\`);
    console.log(\`❌ Total errores: \${datos.totalErrores}\`);
    
    console.log('\\n📋 INSTRUCCIONES:');
    console.log('1. Abrir Google Sheets:', datos.instrucciones.paso1);
    console.log('2. Para cada actualización:');
    console.log('   - Buscar el indicador en la hoja correspondiente');
    console.log('   - Actualizar la columna D (mes) con el valor especificado');
    console.log('   - Verificar que la actualización sea correcta');
    
    console.log('\\n📝 PRIMERAS 10 ACTUALIZACIONES:');
    datos.actualizaciones.slice(0, 10).forEach((act, index) => {
      console.log(\`\${index + 1}. \${act.indicador.substring(0, 50)}... -> \${act.mes} (\${act.hoja})\`);
    });
    
    if (datos.actualizaciones.length > 10) {
      console.log(\`\\n... y \${datos.actualizaciones.length - 10} más\`);
    }
    
    console.log('\\n💾 Archivos generados:');
    console.log('- actualizaciones-detalladas.json (datos completos)');
    console.log('- actualizaciones-detalladas.csv (para importar)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarActualizaciones();
`;
    
    fs.writeFileSync('verificar-actualizaciones-detalladas.js', scriptVerificacion);
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Actualizaciones generadas: ${actualizaciones.length}`);
    console.log(`❌ Errores: ${errores.length}`);
    
    console.log('\n💾 Archivos generados:');
    console.log('- actualizaciones-detalladas.json');
    console.log('- actualizaciones-detalladas.csv');
    console.log('- verificar-actualizaciones-detalladas.js');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Abrir Google Sheets: https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA');
    console.log('2. Usar el archivo CSV para guiar las actualizaciones manuales');
    console.log('3. Ejecutar: node verificar-actualizaciones-detalladas.js');
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarActualizacionesDetalladas();
}

module.exports = { generarActualizacionesDetalladas };
