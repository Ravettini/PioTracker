const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script para generar Excel con la MISMA estructura que Google Sheets
 * pero añadiendo la columna "mes" basada en el análisis del Excel original
 */

function generarExcelConEstructuraCompleta() {
  try {
    console.log('📊 Generando Excel con estructura completa + meses...');
    
    // Leer el análisis previo
    const analisisFile = 'scripts/analisis-excel-completo-mejorado.json';
    if (!fs.existsSync(analisisFile)) {
      console.error('❌ Archivo de análisis no encontrado:', analisisFile);
      return;
    }
    
    const analisis = JSON.parse(fs.readFileSync(analisisFile, 'utf8'));
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Procesar cada hoja del análisis
    Object.entries(analisis.datosPorHoja).forEach(([hoja, datos]) => {
      console.log(`\n📄 Procesando hoja: ${hoja}`);
      
      // Crear datos con estructura completa
      const hojaData = [
        // Headers con la MISMA estructura que Google Sheets + mes
        [
          'Indicador ID',
          'Indicador Nombr', 
          'Período',
          'Ministerio ID',
          'Ministerio Nombr',
          'Línea ID',
          'Línea Título',
          'Valor',
          'Unidad',
          'Meta',
          'Fuente',
          'Responsable',
          'No Responsable En',
          'Observaciones',
          'Estado',
          'Publicado',
          'Creado En',
          'Actualizado En',
          'Mes'  // ← NUEVA COLUMNA
        ]
      ];
      
      // Generar datos para cada indicador
      datos.indicadores.forEach((item, index) => {
        // Generar ID único para el indicador
        const indicadorId = generarIdUnico(item.indicador);
        
        // Generar ID de línea
        const lineaId = generarIdLinea(item.indicador);
        
        // Obtener datos del ministerio
        const ministerioData = obtenerDatosMinisterio(hoja);
        
        // Para cada mes extraído, crear una fila
        item.mesesExtraidos.forEach(mes => {
          const fechaActual = new Date().toISOString();
          
          hojaData.push([
            indicadorId,                    // A: Indicador ID
            item.indicador,                // B: Indicador Nombr
            '2024',                        // C: Período
            ministerioData.id,            // D: Ministerio ID
            ministerioData.nombre,        // E: Ministerio Nombr
            lineaId,                      // F: Línea ID
            `Compromiso sin ${mes.valor}`, // G: Línea Título
            mes.valor,                    // H: Valor
            '',                           // I: Unidad
            '',                           // J: Meta
            'Excel Original',             // K: Fuente
            'Sistema Automá',             // L: Responsable
            'sistema@pio.gob.ar',         // M: No Responsable En
            '',                           // N: Observaciones
            'validado',                   // O: Estado
            'No',                         // P: Publicado
            fechaActual,                  // Q: Creado En
            fechaActual,                  // R: Actualizado En
            mes.mes                       // S: Mes ← NUEVA COLUMNA
          ]);
        });
      });
      
      console.log(`✅ ${hoja}: ${hojaData.length - 1} filas generadas`);
      
      // Limitar nombre de hoja a 31 caracteres
      const nombreHoja = hoja.length > 31 ? hoja.substring(0, 31) : hoja;
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(hojaData), nombreHoja);
    });
    
    // Crear hoja consolidada con TODOS los datos
    console.log('\n📊 Creando hoja consolidada...');
    const consolidadaData = [
      [
        'Indicador ID',
        'Indicador Nombr', 
        'Período',
        'Ministerio ID',
        'Ministerio Nombr',
        'Línea ID',
        'Línea Título',
        'Valor',
        'Unidad',
        'Meta',
        'Fuente',
        'Responsable',
        'No Responsable En',
        'Observaciones',
        'Estado',
        'Publicado',
        'Creado En',
        'Actualizado En',
        'Mes'
      ]
    ];
    
    Object.entries(analisis.datosPorHoja).forEach(([hoja, datos]) => {
      const ministerioData = obtenerDatosMinisterio(hoja);
      
      datos.indicadores.forEach(item => {
        const indicadorId = generarIdUnico(item.indicador);
        const lineaId = generarIdLinea(item.indicador);
        const fechaActual = new Date().toISOString();
        
        item.mesesExtraidos.forEach(mes => {
          consolidadaData.push([
            indicadorId,
            item.indicador,
            '2024',
            ministerioData.id,
            ministerioData.nombre,
            lineaId,
            `Compromiso sin ${mes.valor}`,
            mes.valor,
            '',
            '',
            'Excel Original',
            'Sistema Automá',
            'sistema@pio.gob.ar',
            '',
            'validado',
            'No',
            fechaActual,
            fechaActual,
            mes.mes
          ]);
        });
      });
    });
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(consolidadaData), 'CONSOLIDADA');
    
    // Guardar archivo
    const nombreArchivo = 'scripts/estructura-completa-con-meses.xlsx';
    XLSX.writeFile(workbook, nombreArchivo);
    
    console.log(`\n✅ Archivo generado: ${nombreArchivo}`);
    console.log(`📊 Total de filas en consolidada: ${consolidadaData.length - 1}`);
    
    // Generar también un CSV para fácil copia
    generarCSVConsolidado(consolidadaData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function generarIdUnico(indicador) {
  // Generar ID único basado en el indicador
  const palabras = indicador.split(' ').slice(0, 3);
  const siglas = palabras.map(p => p.substring(0, 2).toUpperCase()).join('');
  const numero = Math.floor(Math.random() * 10000);
  return `${siglas}_${numero}`;
}

function generarIdLinea(indicador) {
  // Generar ID de línea
  const hash = indicador.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `CST_${Math.abs(hash)}`;
}

function obtenerDatosMinisterio(hoja) {
  const ministerios = {
    'Jefatura de Gabinete': { id: 'JDG', nombre: 'Jefatura de Gabinete' },
    'Educacion': { id: 'EDU', nombre: 'Educación' },
    'Justicia': { id: 'JUS', nombre: 'Justicia' },
    'Seguridad': { id: 'SEG', nombre: 'Seguridad' },
    'MDHyH': { id: 'MDH', nombre: 'Desarrollo Humano y Habitat' },
    'Vicejefatura': { id: 'VIC', nombre: 'Vicejefatura' },
    'Hacienda y finanzas': { id: 'HAC', nombre: 'Hacienda y Finanzas' },
    'Espacio Publico': { id: 'ESP', nombre: 'Espacio Público e Higiene Urbana' },
    'Ente regulador de servicios púb': { id: 'ENT', nombre: 'Ente Regulador de Servicios Públicos' },
    'Salud': { id: 'SAL', nombre: 'Salud' },
    'compromisos': { id: 'COM', nombre: 'Compromisos' }
  };
  
  return ministerios[hoja] || { id: 'OTR', nombre: hoja };
}

function generarCSVConsolidado(datos) {
  try {
    console.log('\n📄 Generando CSV consolidado...');
    
    const csvContent = datos.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    fs.writeFileSync('scripts/estructura-completa-con-meses.csv', csvContent);
    console.log('✅ CSV generado: scripts/estructura-completa-con-meses.csv');
    
  } catch (error) {
    console.error('❌ Error generando CSV:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarExcelConEstructuraCompleta();
}

module.exports = { generarExcelConEstructuraCompleta };
