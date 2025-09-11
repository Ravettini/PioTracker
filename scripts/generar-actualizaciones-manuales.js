const fs = require('fs');

/**
 * Script para generar archivo de actualizaciones manuales
 * Basado en los datos mapeados del Excel
 */

async function generarActualizacionesManuales() {
  try {
    console.log('📝 Generando archivo de actualizaciones manuales...');
    
    // Leer datos mapeados
    const datos = JSON.parse(fs.readFileSync('datos-meses-2024.json', 'utf8'));
    
    const actualizaciones = {
      resumen: {
        totalIndicadores: datos.datosMapeados.length,
        hojasAfectadas: [...new Set(datos.datosMapeados.map(d => d.ministerio))],
        fechaGeneracion: new Date().toISOString()
      },
      instrucciones: [
        '1. Abrir Google Sheets del proyecto',
        '2. Para cada indicador listado, buscar la fila correspondiente',
        '3. En la columna D (Mes), agregar el mes correspondiente',
        '4. Verificar que la columna D tenga el header "Mes"',
        '5. Si no existe la columna D, crearla antes de hacer las actualizaciones'
      ],
      actualizaciones: []
    };
    
    // Procesar cada indicador
    datos.datosMapeados.forEach((item, index) => {
      const actualizacion = {
        numero: index + 1,
        ministerio: item.ministerio,
        compromiso: item.compromiso,
        indicador: item.indicador,
        mesAsignado: item.mesesParseados[0]?.mes || 'enero',
        valorOriginal: item.mesesParseados[0]?.valor || 0,
        datosOriginales: item.datosMeses,
        instrucciones: [
          `Buscar en la hoja "${item.ministerio}"`,
          `Encontrar la fila con el indicador: "${item.indicador}"`,
          `En la columna D (Mes), escribir: "${item.mesesParseados[0]?.mes || 'enero'}"`,
          `Verificar que el período en columna C sea "2024"`
        ]
      };
      
      actualizaciones.actualizaciones.push(actualizacion);
    });
    
    // Generar archivo de actualizaciones
    fs.writeFileSync('actualizaciones-manuales-meses.json', JSON.stringify(actualizaciones, null, 2));
    
    // Generar archivo CSV para fácil importación
    const csvContent = [
      'Ministerio,Compromiso,Indicador,Mes Asignado,Valor Original,Datos Originales',
      ...datos.datosMapeados.map(item => 
        `"${item.ministerio}","${item.compromiso}","${item.indicador}","${item.mesesParseados[0]?.mes || 'enero'}","${item.mesesParseados[0]?.valor || 0}","${item.datosMeses}"`
      )
    ].join('\n');
    
    fs.writeFileSync('actualizaciones-manuales-meses.csv', csvContent);
    
    // Generar script de verificación
    const scriptVerificacion = `
// Script para verificar que las actualizaciones se aplicaron correctamente
// Ejecutar después de hacer las actualizaciones manuales

const verificaciones = [
${datos.datosMapeados.map(item => 
  `  {
    ministerio: "${item.ministerio}",
    indicador: "${item.indicador}",
    mesEsperado: "${item.mesesParseados[0]?.mes || 'enero'}",
    verificacion: "Buscar en hoja '${item.ministerio}' el indicador '${item.indicador}' y verificar que columna D tenga '${item.mesesParseados[0]?.mes || 'enero'}'"
  }`
).join(',\n')}
];

console.log('🔍 VERIFICACIONES REQUERIDAS:');
verificaciones.forEach((v, i) => {
  console.log(\`\${i + 1}. \${v.verificacion}\`);
});

console.log('\\n📊 TOTAL DE VERIFICACIONES: \${verificaciones.length}');
`;
    
    fs.writeFileSync('verificar-actualizaciones-meses.js', scriptVerificacion);
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN DE ACTUALIZACIONES:');
    console.log(`✅ Total de indicadores: ${actualizaciones.resumen.totalIndicadores}`);
    console.log(`✅ Hojas afectadas: ${actualizaciones.resumen.hojasAfectadas.length}`);
    console.log(`✅ Hojas: ${actualizaciones.resumen.hojasAfectadas.join(', ')}`);
    
    console.log('\n📁 ARCHIVOS GENERADOS:');
    console.log('📄 actualizaciones-manuales-meses.json - Detalles completos');
    console.log('📄 actualizaciones-manuales-meses.csv - Para importar en Excel');
    console.log('📄 verificar-actualizaciones-meses.js - Script de verificación');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Revisar el archivo actualizaciones-manuales-meses.csv');
    console.log('2. Abrir Google Sheets del proyecto');
    console.log('3. Para cada fila del CSV, buscar el indicador y actualizar la columna D');
    console.log('4. Ejecutar verificar-actualizaciones-meses.js para verificar');
    
    // Mostrar algunas actualizaciones de ejemplo
    console.log('\n📝 EJEMPLOS DE ACTUALIZACIONES:');
    actualizaciones.actualizaciones.slice(0, 5).forEach(act => {
      console.log(`\n${act.numero}. ${act.ministerio}`);
      console.log(`   Indicador: ${act.indicador.substring(0, 50)}...`);
      console.log(`   Mes a asignar: ${act.mesAsignado}`);
    });
    
    if (actualizaciones.actualizaciones.length > 5) {
      console.log(`\n... y ${actualizaciones.actualizaciones.length - 5} más`);
    }
    
  } catch (error) {
    console.error('❌ Error generando actualizaciones:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarActualizacionesManuales();
}

module.exports = { generarActualizacionesManuales };
