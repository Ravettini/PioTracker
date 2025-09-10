const fs = require('fs');
const path = require('path');

// Leer el archivo de análisis de indicadores para entender la estructura
console.log('🔍 Analizando estructura de datos...\n');

try {
  const analisisPath = path.join(__dirname, 'server', 'analisis-indicadores.json');
  
  if (fs.existsSync(analisisPath)) {
    const analisisData = JSON.parse(fs.readFileSync(analisisPath, 'utf8'));
    
    console.log('📊 ESTRUCTURA DE DATOS ENCONTRADA:');
    console.log(`Tipo de datos: ${typeof analisisData}`);
    console.log(`Claves disponibles: ${Object.keys(analisisData).join(', ')}`);
    
    if (analisisData.ministerios) {
      console.log(`\n📋 MINISTERIOS: ${analisisData.ministerios.length}`);
      
      // Buscar MDHyH en ministerios
      const mdhyhMinisterio = analisisData.ministerios.find(m => 
        m.nombre && (
          m.nombre.includes('MDHyH') || 
          m.nombre.includes('Desarrollo Humano') ||
          m.nombre.includes('MDHyH')
        )
      );
      
      if (mdhyhMinisterio) {
        console.log(`\n🔍 MDHyH ENCONTRADO: ${mdhyhMinisterio.nombre}`);
        console.log(`Compromisos: ${mdhyhMinisterio.compromisos}`);
      } else {
        console.log('\n❌ MDHyH no encontrado en ministerios');
        console.log('Ministerios disponibles:');
        analisisData.ministerios.forEach((m, index) => {
          console.log(`  ${index + 1}. ${m.nombre}`);
        });
      }
    }
    
    if (analisisData.indicadores) {
      console.log(`\n📈 INDICADORES: ${analisisData.indicadores.length}`);
      
      // Buscar indicadores de MDHyH
      const mdhyhIndicadores = analisisData.indicadores.filter(item => 
        item.ministerio && (
          item.ministerio.includes('MDHyH') || 
          item.ministerio.includes('Desarrollo Humano') ||
          item.ministerio.includes('MDHyH')
        )
      );
      
      console.log(`\n🔍 INDICADORES DE MDHyH: ${mdhyhIndicadores.length}`);
      
      if (mdhyhIndicadores.length > 0) {
        console.log('\n📋 PRIMEROS 3 INDICADORES DE MDHyH:');
        mdhyhIndicadores.slice(0, 3).forEach((item, index) => {
          console.log(`${index + 1}. Ministerio: ${item.ministerio}`);
          console.log(`   Compromiso: ${item.compromiso || 'N/A'}`);
          console.log(`   Indicador: ${item.indicador || 'N/A'}`);
          console.log(`   Período: ${item.periodo || 'N/A'}`);
          console.log(`   Valor: ${item.valor || 'N/A'}`);
          console.log(`   Meta: ${item.meta || 'N/A'}`);
          console.log('   ---');
        });
        
        // Buscar compromisos únicos
        const compromisosUnicos = [...new Set(mdhyhIndicadores.map(item => item.compromiso).filter(Boolean))];
        console.log(`\n📊 COMPROMISOS ÚNICOS DE MDHyH: ${compromisosUnicos.length}`);
        compromisosUnicos.forEach((compromiso, index) => {
          console.log(`${index + 1}. ${compromiso}`);
        });
        
        // Buscar el primer compromiso (Compromiso A)
        const compromisoA = compromisosUnicos.find(c => 
          c.includes('A)') || 
          c.includes('Sistematizar') ||
          c.includes('información')
        );
        
        if (compromisoA) {
          console.log(`\n🎯 COMPROMISO A ENCONTRADO: ${compromisoA}`);
          
          const indicadoresCompromisoA = mdhyhIndicadores.filter(item => 
            item.compromiso === compromisoA
          );
          
          console.log(`📈 INDICADORES DEL COMPROMISO A: ${indicadoresCompromisoA.length}`);
          
          if (indicadoresCompromisoA.length > 0) {
            const primerIndicador = indicadoresCompromisoA[0];
            console.log(`\n🎯 PRIMER INDICADOR: ${primerIndicador.indicador}`);
            
            // Buscar todos los períodos para este indicador
            const periodosIndicador = [...new Set(
              indicadoresCompromisoA
                .filter(item => item.indicador === primerIndicador.indicador)
                .map(item => item.periodo)
                .filter(Boolean)
            )];
            
            console.log(`📅 PERÍODOS DISPONIBLES: ${periodosIndicador.length}`);
            periodosIndicador.forEach(periodo => {
              console.log(`  - ${periodo}`);
            });
            
            // Mostrar datos específicos del período que mencionaste
            const datosPeriodo = indicadoresCompromisoA.filter(item => 
              item.indicador === primerIndicador.indicador &&
              item.periodo === '2025-09-04T16:28:42.627Z'
            );
            
            console.log(`\n🔍 DATOS PARA EL PERÍODO ESPECÍFICO: ${datosPeriodo.length}`);
            datosPeriodo.forEach(dato => {
              console.log(`  - Período: ${dato.periodo}`);
              console.log(`  - Valor: ${dato.valor}`);
              console.log(`  - Meta: ${dato.meta}`);
              console.log(`  - Fuente: ${dato.fuente || 'N/A'}`);
            });
          }
        }
      } else {
        console.log('\n❌ No se encontraron indicadores de MDHyH');
      }
    }
    
    // Análisis general
    console.log('\n📊 ANÁLISIS GENERAL:');
    if (analisisData.indicadores) {
      const ministeriosUnicos = [...new Set(analisisData.indicadores.map(item => item.ministerio).filter(Boolean))];
      console.log(`Total ministerios únicos: ${ministeriosUnicos.length}`);
      
      const indicadoresUnicos = [...new Set(analisisData.indicadores.map(item => item.indicador).filter(Boolean))];
      console.log(`Total indicadores únicos: ${indicadoresUnicos.length}`);
      
      const periodosUnicos = [...new Set(analisisData.indicadores.map(item => item.periodo).filter(Boolean))];
      console.log(`Total períodos únicos: ${periodosUnicos.length}`);
      
      // Verificar si hay datos con valores
      const datosConValores = analisisData.indicadores.filter(item => 
        item.valor !== null && 
        item.valor !== undefined && 
        item.valor !== ''
      );
      console.log(`Datos con valores: ${datosConValores.length}`);
    }
    
  } else {
    console.log('❌ Archivo analisis-indicadores.json no encontrado');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}