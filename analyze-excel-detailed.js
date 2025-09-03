const XLSX = require('xlsx');
const fs = require('fs');

console.log('🔍 Analizando Excel para crear taxonomía de indicadores...');

async function analyzeExcel() {
  try {
    const filePath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    if (!fs.existsSync(filePath)) {
      console.error('❌ No se encontró el archivo Excel');
      return;
    }

    console.log('✅ Archivo Excel encontrado');
    
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`📊 Hojas encontradas: ${sheetNames.length}`);
    console.log('📋 Nombres de hojas:', sheetNames);
    
    const analysis = {
      ministerios: [],
      compromisos: [],
      indicadores: [],
      categorias: {
        porcentajes: [],
        cantidades: [],
        ratios: [],
        tendencias: [],
        metas: [],
        geograficos: []
      },
      estadisticas: {
        totalMinisterios: 0,
        totalCompromisos: 0,
        totalIndicadores: 0,
        tiposUnicos: new Set()
      }
    };

    // Procesar cada hoja (ministerio)
    for (const sheetName of sheetNames) {
      console.log(`\n📋 Analizando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        console.log(`⏭️ Saltando hoja ${sheetName}: menos de 2 filas`);
        continue;
      }

      // Analizar estructura de datos
      const headers = data[0];
      console.log('📝 Headers:', headers);

      // Buscar columnas relevantes
      const compromisoIndex = headers.findIndex(h => 
        h && h.toString().toLowerCase().includes('compromiso')
      );
      const indicadorIndex = headers.findIndex(h => 
        h && h.toString().toLowerCase().includes('indicador')
      );
      const metaIndex = headers.findIndex(h => 
        h && h.toString().toLowerCase().includes('meta')
      );
      const avanceIndex = headers.findIndex(h => 
        h && h.toString().toLowerCase().includes('avance')
      );

      console.log('🔍 Índices encontrados:', {
        compromiso: compromisoIndex,
        indicador: indicadorIndex,
        meta: metaIndex,
        avance: avanceIndex
      });

      // Procesar filas de datos
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const compromiso = compromisoIndex >= 0 ? row[compromisoIndex] : null;
        const indicador = indicadorIndex >= 0 ? row[indicadorIndex] : null;
        const meta = metaIndex >= 0 ? row[metaIndex] : null;
        const avance = avanceIndex >= 0 ? row[avanceIndex] : null;

        if (compromiso && indicador) {
          const compromisoObj = {
            ministerio: sheetName,
            titulo: compromiso.toString().trim(),
            indicadores: []
          };

          const indicadorObj = {
            ministerio: sheetName,
            compromiso: compromiso.toString().trim(),
            nombre: indicador.toString().trim(),
            meta: meta,
            avance: avance,
            tipo: categorizarIndicador(indicador.toString().trim(), meta, avance)
          };

          // Agregar a análisis
          if (!analysis.compromisos.find(c => c.titulo === compromisoObj.titulo && c.ministerio === sheetName)) {
            analysis.compromisos.push(compromisoObj);
          }

          analysis.indicadores.push(indicadorObj);
          analysis.estadisticas.tiposUnicos.add(indicadorObj.tipo);
        }
      }

      // Agregar ministerio
      analysis.ministerios.push({
        nombre: sheetName,
        compromisos: analysis.compromisos.filter(c => c.ministerio === sheetName).length
      });
    }

    // Calcular estadísticas
    analysis.estadisticas.totalMinisterios = analysis.ministerios.length;
    analysis.estadisticas.totalCompromisos = analysis.compromisos.length;
    analysis.estadisticas.totalIndicadores = analysis.indicadores.length;

    // Categorizar indicadores
    analysis.indicadores.forEach(ind => {
      switch (ind.tipo) {
        case 'porcentaje':
          analysis.categorias.porcentajes.push(ind);
          break;
        case 'cantidad':
          analysis.categorias.cantidades.push(ind);
          break;
        case 'ratio':
          analysis.categorias.ratios.push(ind);
          break;
        case 'tendencia':
          analysis.categorias.tendencias.push(ind);
          break;
        case 'meta':
          analysis.categorias.metas.push(ind);
          break;
        case 'geografico':
          analysis.categorias.geograficos.push(ind);
          break;
      }
    });

    // Generar reporte
    console.log('\n📊 REPORTE DE ANÁLISIS');
    console.log('========================');
    console.log(`📈 Total Ministerios: ${analysis.estadisticas.totalMinisterios}`);
    console.log(`📋 Total Compromisos: ${analysis.estadisticas.totalCompromisos}`);
    console.log(`📊 Total Indicadores: ${analysis.estadisticas.totalIndicadores}`);
    console.log(`🏷️ Tipos únicos: ${Array.from(analysis.estadisticas.tiposUnicos).join(', ')}`);

    console.log('\n📊 DISTRIBUCIÓN POR CATEGORÍAS:');
    console.log(`📈 Porcentajes: ${analysis.categorias.porcentajes.length}`);
    console.log(`🔢 Cantidades: ${analysis.categorias.cantidades.length}`);
    console.log(`⚖️ Ratios: ${analysis.categorias.ratios.length}`);
    console.log(`📈 Tendencias: ${analysis.categorias.tendencias.length}`);
    console.log(`🎯 Metas: ${analysis.categorias.metas.length}`);
    console.log(`🗺️ Geográficos: ${analysis.categorias.geograficos.length}`);

    console.log('\n📋 MINISTERIOS ANALIZADOS:');
    analysis.ministerios.forEach(min => {
      console.log(`  - ${min.nombre}: ${min.compromisos} compromisos`);
    });

    console.log('\n🔍 EJEMPLOS POR CATEGORÍA:');
    Object.entries(analysis.categorias).forEach(([categoria, indicadores]) => {
      if (indicadores.length > 0) {
        console.log(`\n${categoria.toUpperCase()}:`);
        indicadores.slice(0, 3).forEach(ind => {
          console.log(`  - ${ind.nombre} (${ind.ministerio})`);
        });
        if (indicadores.length > 3) {
          console.log(`  ... y ${indicadores.length - 3} más`);
        }
      }
    });

    // Guardar análisis en archivo
    fs.writeFileSync('analisis-indicadores.json', JSON.stringify(analysis, null, 2));
    console.log('\n💾 Análisis guardado en: analisis-indicadores.json');

    return analysis;

  } catch (error) {
    console.error('❌ Error analizando Excel:', error);
    throw error;
  }
}

function categorizarIndicador(nombre, meta, avance) {
  const nombreLower = nombre.toLowerCase();
  
  // Palabras clave para categorización
  const keywords = {
    porcentaje: ['porcentaje', '%', 'tasa', 'cobertura', 'participación', 'efectividad'],
    cantidad: ['cantidad', 'número', 'total', 'personas', 'beneficiarios', 'usuarios', 'obras'],
    ratio: ['ratio', 'relación', 'proporción', 'índice', 'densidad'],
    tendencia: ['evolución', 'crecimiento', 'reducción', 'tendencia', 'progreso'],
    meta: ['meta', 'objetivo', 'target', 'cumplimiento'],
    geografico: ['barrio', 'comuna', 'zona', 'distrito', 'territorial']
  };

  // Detectar tipo por palabras clave
  for (const [tipo, palabras] of Object.entries(keywords)) {
    if (palabras.some(palabra => nombreLower.includes(palabra))) {
      return tipo;
    }
  }

  // Detectar por valores numéricos
  if (meta && typeof meta === 'number') {
    if (meta <= 100 && meta > 0) {
      return 'porcentaje';
    }
  }

  // Detectar por contexto
  if (nombreLower.includes('meta') || nombreLower.includes('objetivo')) {
    return 'meta';
  }

  // Por defecto
  return 'cantidad';
}

analyzeExcel().catch(console.error);


