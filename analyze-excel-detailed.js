const XLSX = require('xlsx');

console.log('🔍 Análisis detallado del archivo Excel...');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx');
  
  console.log('\n📊 Hojas disponibles:');
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`   ${index + 1}. ${sheetName}`);
  });

  // Analizar cada hoja en detalle
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n🔍 === ANÁLISIS DE HOJA: "${sheetName}" ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📏 Total de filas: ${data.length}`);
    
    if (data.length === 0) {
      console.log('   ❌ Hoja vacía');
      return;
    }

    // Mostrar las primeras 5 filas
    console.log('\n📋 Primeras 5 filas:');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(`   Fila ${i}:`, data[i]);
    }

    // Buscar headers que contengan meses
    console.log('\n🔍 Buscando headers de meses...');
    const headers = data[0] || [];
    const monthHeaders = [];
    
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('enero') || lowerHeader.includes('febrero') || 
            lowerHeader.includes('marzo') || lowerHeader.includes('abril') ||
            lowerHeader.includes('mayo') || lowerHeader.includes('junio') ||
            lowerHeader.includes('julio') || lowerHeader.includes('agosto') ||
            lowerHeader.includes('septiembre') || lowerHeader.includes('octubre') ||
            lowerHeader.includes('noviembre') || lowerHeader.includes('diciembre') ||
            lowerHeader.includes('ene') || lowerHeader.includes('feb') ||
            lowerHeader.includes('mar') || lowerHeader.includes('abr') ||
            lowerHeader.includes('may') || lowerHeader.includes('jun') ||
            lowerHeader.includes('jul') || lowerHeader.includes('ago') ||
            lowerHeader.includes('sep') || lowerHeader.includes('oct') ||
            lowerHeader.includes('nov') || lowerHeader.includes('dic')) {
          monthHeaders.push({ index, header });
          console.log(`   ✅ Mes encontrado en columna ${index}: "${header}"`);
        }
      }
    });

    if (monthHeaders.length === 0) {
      console.log('   ❌ No se encontraron headers de meses');
    } else {
      console.log(`   📅 Total de meses encontrados: ${monthHeaders.length}`);
      
      // Analizar datos de meses en las primeras filas
      console.log('\n📊 Análisis de datos mensuales:');
      for (let rowIndex = 1; rowIndex < Math.min(10, data.length); rowIndex++) {
        const row = data[rowIndex];
        if (row && row.length > 0) {
          console.log(`   Fila ${rowIndex}:`);
          monthHeaders.forEach(({ index, header }) => {
            const value = row[index];
            if (value !== undefined && value !== null && value !== '') {
              console.log(`     ${header}: ${value} (tipo: ${typeof value})`);
            }
          });
        }
      }
    }

    // Buscar columnas de compromisos e indicadores
    console.log('\n🔍 Buscando columnas de compromisos e indicadores...');
    const compromisoHeaders = [];
    const indicadorHeaders = [];
    
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('compromiso') || lowerHeader.includes('línea') || 
            lowerHeader.includes('linea') || lowerHeader.includes('acción') ||
            lowerHeader.includes('accion')) {
          compromisoHeaders.push({ index, header });
          console.log(`   ✅ Compromiso encontrado en columna ${index}: "${header}"`);
        }
        
        if (lowerHeader.includes('indicador') || lowerHeader.includes('meta') ||
            lowerHeader.includes('objetivo')) {
          indicadorHeaders.push({ index, header });
          console.log(`   ✅ Indicador encontrado en columna ${index}: "${header}"`);
        }
      }
    });

    console.log(`   📝 Compromisos: ${compromisoHeaders.length}, Indicadores: ${indicadorHeaders.length}`);
  });

} catch (error) {
  console.error('❌ Error analizando el Excel:', error.message);
}


