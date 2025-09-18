# SCRIPT PARA PROCESAR EXCEL Y GENERAR CSV PARA PLANILLA PIO

const XLSX = require('xlsx');
const fs = require('fs');

// Función para procesar el Excel y generar el CSV
function procesarExcelParaPlanillaPIO() {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile('Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx');
    
    const ministerios = [
      'Justicia',
      'Jefatura de Gabinete', 
      'Educacion',
      'Ente regulador de servicios púb',
      'Seguridad',
      'Vicejefatura',
      'Espacio Publico',
      'Hacienda y finanzas',
      'Salud',
      'MDHyH'
    ];

    const csvRows = [];
    let indicadorCounter = 1;
    let ministerioCounter = 1;
    let compromisoCounter = 1;
    
    const ministerioIds = {};
    const compromisoIds = {};

    // Procesar cada ministerio
    ministerios.forEach((ministerioNombre, index) => {
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes(ministerioNombre.toLowerCase())
      );
      
      if (!sheetName) {
        console.log(`⚠️ No se encontró hoja para: ${ministerioNombre}`);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`📊 Procesando ${ministerioNombre}: ${data.length} filas`);
      
      // Generar ID único para el ministerio
      const ministerioId = `MIN-${String(ministerioCounter).padStart(3, '0')}`;
      ministerioIds[ministerioNombre] = ministerioId;
      ministerioCounter++;

      // Procesar filas del ministerio
      data.forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // Saltar encabezados
        
        // Extraer datos según la estructura del Excel
        const compromiso = row[0] || '';
        const indicador = row[1] || '';
        const meta = row[2] || '';
        const unidad = row[3] || '';
        
        if (!indicador || indicador.trim() === '') return;
        
        // Generar ID único para el compromiso
        const compromisoKey = `${ministerioNombre}-${compromiso}`;
        if (!compromisoIds[compromisoKey]) {
          compromisoIds[compromisoKey] = `LIN-${String(compromisoCounter).padStart(3, '0')}`;
          compromisoCounter++;
        }
        
        // Generar ID único para el indicador
        const indicadorId = `IND-${String(indicadorCounter).padStart(3, '0')}`;
        indicadorCounter++;
        
        // Fecha actual
        const fechaActual = new Date().toISOString().split('T')[0];
        
        // Crear fila CSV según formato de planilla PIO
        const csvRow = [
          indicadorId,                    // A: Indicador ID
          indicador.trim(),               // B: Indicador Nombre
          '2025-2027',                    // C: Período
          ministerioId,                   // D: Ministerio ID
          ministerioNombre,               // E: Ministerio Nombre
          compromisoIds[compromisoKey],   // F: Línea ID
          compromiso.trim(),              // G: Línea Título
          '',                             // H: Valor (vacío)
          unidad.trim(),                  // I: Unidad
          meta.trim(),                    // J: Meta
          'Excel Original',               // K: Fuente
          '',                             // L: Responsable Nombre
          '',                             // M: Responsable Email
          '',                             // N: Observaciones
          'PENDIENTE',                    // O: Estado
          'No',                           // P: Publicado
          fechaActual,                    // Q: Creado En
          fechaActual                     // R: Actualizado En
        ];
        
        csvRows.push(csvRow.join(','));
      });
    });

    // Escribir archivo CSV
    const csvContent = csvRows.join('\n');
    fs.writeFileSync('datos-planilla-pio.csv', csvContent);
    
    console.log(`✅ Archivo generado: datos-planilla-pio.csv`);
    console.log(`📊 Total de filas generadas: ${csvRows.length}`);
    console.log(`🏛️ Ministerios procesados: ${ministerios.length}`);
    console.log(`📋 Compromisos únicos: ${Object.keys(compromisoIds).length}`);
    console.log(`📈 Indicadores únicos: ${indicadorCounter - 1}`);
    
    // Mostrar resumen por ministerio
    console.log('\n📊 Resumen por ministerio:');
    ministerios.forEach(ministerio => {
      const count = csvRows.filter(row => row.includes(ministerio)).length;
      console.log(`  ${ministerio}: ${count} indicadores`);
    });

  } catch (error) {
    console.error('❌ Error procesando Excel:', error);
  }
}

// Ejecutar el script
if (require.main === module) {
  procesarExcelParaPlanillaPIO();
}

module.exports = { procesarExcelParaPlanillaPIO };
