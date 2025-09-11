const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script mejorado para analizar el Excel y extraer TODOS los meses correctamente
 * Genera un archivo XLSX para copiar y pegar directamente
 */

function analizarExcelCompleto() {
  try {
    console.log('📊 Analizando Excel completo para extraer TODOS los meses...');
    
    const excelFile = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    
    if (!fs.existsSync(excelFile)) {
      console.error('❌ Archivo Excel no encontrado:', excelFile);
      return;
    }
    
    const workbook = XLSX.readFile(excelFile);
    const sheetNames = workbook.SheetNames;
    
    console.log('📋 Hojas encontradas:', sheetNames);
    
    const resultados = {
      fechaAnalisis: new Date().toISOString(),
      totalHojas: sheetNames.length,
      datosPorHoja: {}
    };
    
    // Procesar cada hoja
    sheetNames.forEach(sheetName => {
      console.log(`\n📄 Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        console.log('⚠️ Hoja vacía, saltando...');
        return;
      }
      
      // Buscar la fila de headers
      let headerRow = -1;
      let mesesColumn = -1;
      
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (row && row.length > 0) {
          // Buscar columna de meses
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell && typeof cell === 'string') {
              if (cell.toLowerCase().includes('meses') || 
                  cell.toLowerCase().includes('2024') ||
                  cell.toLowerCase().includes('enero') ||
                  cell.toLowerCase().includes('febrero')) {
                mesesColumn = j;
                headerRow = i;
                console.log(`✅ Columna de meses encontrada en índice ${j}: "${cell}"`);
                break;
              }
            }
          }
          if (mesesColumn !== -1) break;
        }
      }
      
      if (mesesColumn === -1) {
        console.log('⚠️ No se encontró columna de meses en esta hoja');
        return;
      }
      
      console.log(`📊 Procesando datos desde fila ${headerRow + 1}, columna ${mesesColumn + 1}`);
      
      const indicadoresConMeses = [];
      
      // Procesar filas de datos
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        
        if (!row || row.length === 0) continue;
        
        // Buscar indicador (generalmente en columna 3 o 4)
        let indicador = '';
        for (let j = 0; j < Math.min(5, row.length); j++) {
          if (row[j] && typeof row[j] === 'string' && row[j].trim().length > 10) {
            indicador = row[j].trim();
            break;
          }
        }
        
        if (!indicador) continue;
        
        // Extraer datos de meses
        const datosMeses = row[mesesColumn];
        if (!datosMeses) continue;
        
        console.log(`📝 Indicador: ${indicador.substring(0, 50)}...`);
        console.log(`📅 Datos meses: ${datosMeses}`);
        
        // Analizar los datos de meses más inteligentemente
        const mesesExtraidos = extraerMesesInteligentemente(datosMeses);
        
        if (mesesExtraidos.length > 0) {
          indicadoresConMeses.push({
            indicador: indicador,
            datosOriginales: datosMeses,
            mesesExtraidos: mesesExtraidos
          });
          
          console.log(`✅ Meses extraídos:`, mesesExtraidos.map(m => `${m.mes}: ${m.valor}`).join(', '));
        }
      }
      
      resultados.datosPorHoja[sheetName] = {
        totalIndicadores: indicadoresConMeses.length,
        indicadores: indicadoresConMeses
      };
      
      console.log(`✅ Hoja ${sheetName}: ${indicadoresConMeses.length} indicadores con datos de meses`);
    });
    
    // Guardar resultados
    fs.writeFileSync('scripts/analisis-excel-completo-mejorado.json', JSON.stringify(resultados, null, 2));
    
    // Generar archivo XLSX para copiar y pegar
    generarArchivoXLSX(resultados);
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Hojas procesadas: ${resultados.totalHojas}`);
    
    Object.entries(resultados.datosPorHoja).forEach(([hoja, datos]) => {
      console.log(`📄 ${hoja}: ${datos.totalIndicadores} indicadores`);
    });
    
    console.log('\n💾 Archivos generados:');
    console.log('- scripts/analisis-excel-completo-mejorado.json');
    console.log('- scripts/actualizaciones-completas.xlsx');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function extraerMesesInteligentemente(datos) {
  const meses = [];
  const texto = datos.toString().toLowerCase();
  
  // Patrones para detectar meses
  const patronesMeses = [
    { mes: 'enero', patrones: ['enero', 'ene', '1'] },
    { mes: 'febrero', patrones: ['febrero', 'feb', '2'] },
    { mes: 'marzo', patrones: ['marzo', 'mar', '3'] },
    { mes: 'abril', patrones: ['abril', 'abr', '4'] },
    { mes: 'mayo', patrones: ['mayo', 'may', '5'] },
    { mes: 'junio', patrones: ['junio', 'jun', '6'] },
    { mes: 'julio', patrones: ['julio', 'jul', '7'] },
    { mes: 'agosto', patrones: ['agosto', 'ago', '8'] },
    { mes: 'septiembre', patrones: ['septiembre', 'sep', '9'] },
    { mes: 'octubre', patrones: ['octubre', 'oct', '10'] },
    { mes: 'noviembre', patrones: ['noviembre', 'nov', '11'] },
    { mes: 'diciembre', patrones: ['diciembre', 'dic', '12'] }
  ];
  
  // Si es un número simple, asignarlo a enero
  if (/^\d+$/.test(texto.trim())) {
    meses.push({ mes: 'enero', valor: parseInt(texto.trim()) });
    return meses;
  }
  
  // Buscar patrones de meses
  patronesMeses.forEach(({ mes, patrones }) => {
    patrones.forEach(patron => {
      const regex = new RegExp(`\\b${patron}\\b`, 'gi');
      if (regex.test(texto)) {
        // Extraer número asociado
        const numeroMatch = texto.match(new RegExp(`\\b${patron}\\b[^\\d]*(\\d+)`, 'i'));
        if (numeroMatch) {
          meses.push({ mes: mes, valor: parseInt(numeroMatch[1]) });
        } else {
          // Si no hay número específico, buscar cualquier número cerca
          const numeroCerca = texto.match(/(\d+)/);
          if (numeroCerca) {
            meses.push({ mes: mes, valor: parseInt(numeroCerca[1]) });
          }
        }
      }
    });
  });
  
  // Si no se encontraron meses específicos pero hay números, asignar a enero
  if (meses.length === 0) {
    const numeros = texto.match(/(\d+)/g);
    if (numeros && numeros.length > 0) {
      meses.push({ mes: 'enero', valor: parseInt(numeros[0]) });
    }
  }
  
  return meses;
}

function generarArchivoXLSX(resultados) {
  try {
    console.log('\n📊 Generando archivo XLSX para copiar y pegar...');
    
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de resumen
    const resumenData = [
      ['RESUMEN DE ACTUALIZACIONES PARA GOOGLE SHEETS'],
      [''],
      ['URL:', 'https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA'],
      ['Columna a actualizar:', 'D (mes)'],
      ['Columna donde buscar:', 'B (indicador)'],
      [''],
      ['HOJA', 'TOTAL INDICADORES']
    ];
    
    Object.entries(resultados.datosPorHoja).forEach(([hoja, datos]) => {
      resumenData.push([hoja, datos.totalIndicadores]);
    });
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), 'Resumen');
    
    // Crear hoja para cada ministerio
    Object.entries(resultados.datosPorHoja).forEach(([hoja, datos]) => {
      const hojaData = [
        [`ACTUALIZACIONES PARA HOJA: ${hoja}`],
        [''],
        ['INDICADOR', 'MES', 'VALOR', 'INSTRUCCIÓN']
      ];
      
      datos.indicadores.forEach(item => {
        item.mesesExtraidos.forEach(mes => {
          hojaData.push([
            item.indicador,
            mes.mes,
            mes.valor,
            `Actualizar columna D con "${mes.mes}" para indicadores que contengan "${item.indicador.substring(0, 30)}..."`
          ]);
        });
      });
      
      // Limitar nombre de hoja a 31 caracteres
      const nombreHoja = hoja.length > 31 ? hoja.substring(0, 31) : hoja;
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(hojaData), nombreHoja);
    });
    
    // Crear hoja consolidada
    const consolidadaData = [
      ['ACTUALIZACIONES CONSOLIDADAS'],
      [''],
      ['HOJA', 'INDICADOR', 'MES', 'VALOR', 'INSTRUCCIÓN']
    ];
    
    Object.entries(resultados.datosPorHoja).forEach(([hoja, datos]) => {
      datos.indicadores.forEach(item => {
        item.mesesExtraidos.forEach(mes => {
          consolidadaData.push([
            hoja,
            item.indicador,
            mes.mes,
            mes.valor,
            `Actualizar columna D con "${mes.mes}"`
          ]);
        });
      });
    });
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(consolidadaData), 'Consolidada');
    
    // Guardar archivo
    XLSX.writeFile(workbook, 'scripts/actualizaciones-completas.xlsx');
    
    console.log('✅ Archivo XLSX generado: scripts/actualizaciones-completas.xlsx');
    
  } catch (error) {
    console.error('❌ Error generando XLSX:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  analizarExcelCompleto();
}

module.exports = { analizarExcelCompleto };
