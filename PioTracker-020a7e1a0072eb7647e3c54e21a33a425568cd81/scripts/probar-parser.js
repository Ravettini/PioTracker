const fs = require('fs');

// Función para parsear el archivo de texto
function parsearArchivo(contenido) {
  const cargas = [];
  const lineas = contenido.split('\n');
  
  let ministerioActual = null;
  let compromisoActual = null;
  let indicadorActual = null;
  
  console.log(`🔍 Analizando ${lineas.length} líneas...`);
  
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    
    // Ministerio
    if (linea.startsWith('### Ministerio:')) {
      ministerioActual = linea.replace('### Ministerio:', '').trim();
      console.log(`📋 Ministerio encontrado: ${ministerioActual}`);
      continue;
    }
    
    // Compromiso
    if (linea.startsWith('#### Compromiso:')) {
      compromisoActual = linea.replace('#### Compromiso:', '').trim();
      console.log(`📋 Compromiso encontrado: ${compromisoActual}`);
      continue;
    }
    
    // Indicador
    if (linea.startsWith('- Indicador:')) {
      indicadorActual = linea.replace('- Indicador:', '').trim();
      console.log(`📋 Indicador encontrado: ${indicadorActual}`);
      continue;
    }
    
    // Datos del indicador
    if (linea.startsWith('- Valor:') && indicadorActual) {
      console.log(`📋 Procesando datos para: ${indicadorActual}`);
      console.log(`🔍 Línea actual: "${linea}"`);
      
      const valor = linea.replace('- Valor:', '').trim();
      const unidad = lineas[i + 1]?.replace('- Unidad de medida:', '').trim() || '';
      const meta = lineas[i + 2]?.replace('- Meta:', '').trim() || '';
      const fuente = lineas[i + 3]?.replace('- Fuente de los datos:', '').trim() || 'Excel Original';
      const observaciones = lineas[i + 4]?.replace('- Observaciones:', '').trim() || '';
      
      console.log(`🔍 Línea unidad: "${lineas[i + 1]}"`);
      console.log(`🔍 Línea meta: "${lineas[i + 2]}"`);
      console.log(`🔍 Línea fuente: "${lineas[i + 3]}"`);
      console.log(`🔍 Línea observaciones: "${lineas[i + 4]}"`);
      
      cargas.push({
        ministerio: ministerioActual,
        compromiso: compromisoActual,
        indicador: indicadorActual,
        valor,
        unidad,
        meta,
        fuente,
        observaciones
      });
      
      console.log(`✅ Carga agregada: ${valor} ${unidad}`);
      
      // Saltar las líneas ya procesadas
      i += 4;
      continue;
    }
    
    // Debug: mostrar líneas que no coinciden
    if (linea.includes('Valor:') && !linea.startsWith('- Valor:')) {
      console.log(`⚠️ Línea con "Valor:" pero no coincide: "${linea}"`);
    }
  }
  
  return cargas;
}

// Función principal
function main() {
  console.log('🧪 Probando parser de archivo...\n');
  
  try {
    // Leer archivo de ejemplo
    if (!fs.existsSync('cargas.txt')) {
      throw new Error('Archivo cargas.txt no encontrado');
    }
    
    const contenido = fs.readFileSync('cargas.txt', 'utf8');
    console.log('📖 Leyendo archivo cargas.txt...');
    
    // Parsear contenido
    const cargasParseadas = parsearArchivo(contenido);
    console.log(`\n📊 Se encontraron ${cargasParseadas.length} cargas para procesar\n`);
    
    if (cargasParseadas.length === 0) {
      throw new Error('No se encontraron cargas válidas en el archivo');
    }
    
    // Mostrar resultados
    console.log('📋 Cargas encontradas:');
    cargasParseadas.forEach((carga, index) => {
      console.log(`\n${index + 1}. ${carga.indicador}`);
      console.log(`   Ministerio: ${carga.ministerio}`);
      console.log(`   Compromiso: ${carga.compromiso}`);
      console.log(`   Valor: ${carga.valor} ${carga.unidad}`);
      console.log(`   Meta: ${carga.meta || 'No especificada'}`);
      console.log(`   Fuente: ${carga.fuente}`);
      console.log(`   Observaciones: ${carga.observaciones.substring(0, 50)}...`);
    });
    
    console.log('\n✅ Parser funcionando correctamente!');
    console.log('📝 Ahora puedes crear tu archivo cargas.txt con el mismo formato');
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

// Ejecutar
main();
