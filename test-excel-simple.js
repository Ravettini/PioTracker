const XLSX = require('xlsx');

console.log('🔍 Verificación simple del Excel...');

try {
  const workbook = XLSX.readFile('Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx');
  
  console.log('\n📊 Hojas disponibles:');
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`   ${index + 1}. ${sheetName}`);
  });

  // Probar procesar cada hoja
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n🔍 === HOJA: "${sheetName}" ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📏 Filas: ${data.length}`);
    
    if (data.length >= 2) {
      console.log(`✅ Fila 0 (headers):`, data[0]);
      console.log(`✅ Fila 1 (meses):`, data[1]);
      
      // Verificar si tiene estructura de ministerio
      const headerRow = data[0];
      const monthRow = data[1];
      
      let hasCompromisos = false;
      let hasIndicadores = false;
      let hasMeses = false;
      
      if (Array.isArray(headerRow)) {
        headerRow.forEach((cell, index) => {
          if (cell && typeof cell === 'string') {
            if (cell.includes('Compromisos')) hasCompromisos = true;
            if (cell.includes('Indicadores')) hasIndicadores = true;
          }
        });
      }
      
      if (Array.isArray(monthRow)) {
        monthRow.forEach((cell, index) => {
          if (cell && typeof cell === 'string') {
            if (cell.includes('ENE') || cell.includes('FEB') || cell.includes('MAR')) {
              hasMeses = true;
            }
          }
        });
      }
      
      console.log(`📋 Estructura: Compromisos=${hasCompromisos}, Indicadores=${hasIndicadores}, Meses=${hasMeses}`);
      
      if (hasCompromisos && hasIndicadores) {
        console.log(`✅ Esta hoja parece ser un ministerio válido`);
      } else {
        console.log(`❌ Esta hoja no parece ser un ministerio válido`);
      }
    } else {
      console.log(`❌ Hoja con menos de 2 filas`);
    }
  });

} catch (error) {
  console.error('❌ Error:', error.message);
}


