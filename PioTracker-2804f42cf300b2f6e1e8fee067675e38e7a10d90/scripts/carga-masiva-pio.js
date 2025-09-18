const fs = require('fs');

// Configuración
const API_BASE_URL = 'http://localhost:3001/api/v1';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTA4NmJmZi01NmMyLTRiMzMtYjRkOC1mODYzZTFjYzljNGQiLCJlbWFpbCI6ImFkbWluQHBpby5sb2NhbCIsInJvbCI6IkFETUlOIiwibWluaXN0ZXJpb0lkIjpudWxsLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIGRlbCBTaXN0ZW1hIiwiaWF0IjoxNzU2OTk3MDgwLCJleHAiOjE3NTcwNDAyODB9.hMWJJ89ZM-aeiIcu2XYcdVVQuyXmD3eFRT9NHeL2vO0';
const ARCHIVO_ENTRADA = 'cargas.txt';
const ARCHIVO_SALIDA = 'reporte-cargas-pio.json';

// Función para hacer peticiones a la API
async function hacerPeticion(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.message || 'Error desconocido'}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
    throw error;
  }
}

// Función para obtener ministerio por nombre
async function obtenerMinisterio(nombre) {
  try {
    const ministerios = await hacerPeticion('/catalogos/ministerios');
    const ministerio = ministerios.find(m => 
      m.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
      nombre.toLowerCase().includes(m.nombre.toLowerCase())
    );
    
    if (!ministerio) {
      throw new Error(`Ministerio no encontrado: ${nombre}`);
    }
    
    return ministerio;
  } catch (error) {
    console.error(`❌ Error obteniendo ministerio "${nombre}":`, error.message);
    throw error;
  }
}

// Función para obtener compromiso por título (usando líneas)
async function obtenerCompromiso(titulo, ministerioId) {
  try {
    const lineas = await hacerPeticion(`/catalogos/lineas?ministerioId=${ministerioId}`);
    const linea = lineas.data.find(l => 
      l.titulo.toLowerCase().includes(titulo.toLowerCase()) ||
      titulo.toLowerCase().includes(l.titulo.toLowerCase())
    );
    
    if (!linea) {
      throw new Error(`Compromiso/Línea no encontrado: ${titulo}`);
    }
    
    return linea;
  } catch (error) {
    console.error(`❌ Error obteniendo compromiso "${titulo}":`, error.message);
    throw error;
  }
}

// Función para obtener indicador por nombre
async function obtenerIndicador(nombre, lineaId) {
  try {
    const indicadores = await hacerPeticion(`/catalogos/indicadores?lineaId=${lineaId}`);
    const indicador = indicadores.find(i => 
      i.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
      nombre.toLowerCase().includes(i.nombre.toLowerCase())
    );
    
    if (!indicador) {
      throw new Error(`Indicador no encontrado: ${nombre}`);
    }
    
    return indicador;
  } catch (error) {
    console.error(`❌ Error obteniendo indicador "${nombre}":`, error.message);
    throw error;
  }
}

// Función para crear una carga
async function crearCarga(datos) {
  try {
    const cargaData = {
      ministerioId: datos.ministerioId,
      lineaId: datos.lineaId,
      indicadorId: datos.indicadorId,
      periodo: '2024',
      valor: parseFloat(datos.valor) || 0,
      unidad: datos.unidad || '',
      meta: datos.meta ? parseFloat(datos.meta) : null,
      fuente: datos.fuente || 'Excel Original',
      responsableNombre: datos.responsableNombre || 'Sistema Automático',
      responsableEmail: datos.responsableEmail || 'sistema@pio.gob.ar',
      observaciones: datos.observaciones || ''
    };

    const resultado = await hacerPeticion('/cargas', 'POST', cargaData);
    console.log(`✅ Carga creada: ${datos.indicadorNombre}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando carga para "${datos.indicadorNombre}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función para parsear el archivo de texto
function parsearArchivo(contenido) {
  const cargas = [];
  const lineas = contenido.split('\n');
  
  let ministerioActual = null;
  let compromisoActual = null;
  let indicadorActual = null;
  
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    
    // Ministerio
    if (linea.startsWith('### Ministerio:')) {
      ministerioActual = linea.replace('### Ministerio:', '').trim();
      continue;
    }
    
    // Compromiso
    if (linea.startsWith('#### Compromiso:')) {
      compromisoActual = linea.replace('#### Compromiso:', '').trim();
      continue;
    }
    
    // Indicador
    if (linea.startsWith('- Indicador:')) {
      indicadorActual = linea.replace('- Indicador:', '').trim();
      continue;
    }
    
    // Datos del indicador
    if (linea.startsWith('- Valor:') && indicadorActual) {
      const valor = linea.replace('- Valor:', '').trim();
      const unidad = lineas[i + 1]?.replace('- Unidad de medida:', '').trim() || '';
      const meta = lineas[i + 2]?.replace('- Meta:', '').trim() || '';
      const fuente = lineas[i + 3]?.replace('- Fuente de los datos:', '').trim() || 'Excel Original';
      const observaciones = lineas[i + 4]?.replace('- Observaciones:', '').trim() || '';
      
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
      
      // Saltar las líneas ya procesadas
      i += 4;
      continue;
    }
  }
  
  return cargas;
}

// Función principal
async function procesarCargas() {
  console.log('🚀 Iniciando carga masiva de datos PIO...\n');
  
  try {
    // Leer archivo de entrada
    if (!fs.existsSync(ARCHIVO_ENTRADA)) {
      throw new Error(`Archivo no encontrado: ${ARCHIVO_ENTRADA}`);
    }
    
    const contenido = fs.readFileSync(ARCHIVO_ENTRADA, 'utf8');
    console.log(`📖 Leyendo archivo: ${ARCHIVO_ENTRADA}`);
    
    // Parsear contenido
    const cargasParseadas = parsearArchivo(contenido);
    console.log(`📊 Se encontraron ${cargasParseadas.length} cargas para procesar\n`);
    
    if (cargasParseadas.length === 0) {
      throw new Error('No se encontraron cargas válidas en el archivo');
    }
    
    // Procesar cada carga
    const resultados = [];
    let exitosas = 0;
    let fallidas = 0;
    
    for (let i = 0; i < cargasParseadas.length; i++) {
      const carga = cargasParseadas[i];
      console.log(`\n📝 Procesando carga ${i + 1}/${cargasParseadas.length}: ${carga.indicador}`);
      
      try {
            // Obtener ministerio
    const ministerio = await obtenerMinisterio(carga.ministerio);
    console.log(`  ✅ Ministerio encontrado: ${ministerio.nombre}`);

    // Obtener compromiso (línea)
    const compromiso = await obtenerCompromiso(carga.compromiso, ministerio.id);
    console.log(`  ✅ Compromiso/Línea encontrado: ${compromiso.titulo}`);

    // Obtener indicador
    const indicador = await obtenerIndicador(carga.indicador, compromiso.id);
    console.log(`  ✅ Indicador encontrado: ${indicador.nombre}`);

    // Crear carga
    const resultado = await crearCarga({
      ministerioId: ministerio.id,
      lineaId: compromiso.id,
      indicadorId: indicador.id,
      indicadorNombre: indicador.nombre,
      valor: carga.valor,
      unidad: carga.unidad,
      meta: carga.meta,
      fuente: carga.fuente,
      observaciones: carga.observaciones
    });
        
        if (resultado.success) {
          exitosas++;
        } else {
          fallidas++;
        }
        
        resultados.push({
          carga: carga,
          resultado: resultado
        });
        
      } catch (error) {
        console.error(`  ❌ Error procesando carga: ${error.message}`);
        fallidas++;
        resultados.push({
          carga: carga,
          resultado: { success: false, error: error.message }
        });
      }
      
      // Pausa entre cargas para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Generar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      totalCargas: cargasParseadas.length,
      exitosas,
      fallidas,
      resultados
    };
    
    fs.writeFileSync(ARCHIVO_SALIDA, JSON.stringify(reporte, null, 2));
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total: ${cargasParseadas.length}`);
    console.log(`   - Exitosas: ${exitosas}`);
    console.log(`   - Fallidas: ${fallidas}`);
    console.log(`📄 Reporte guardado en: ${ARCHIVO_SALIDA}`);
    console.log(`🌐 Las cargas exitosas se han publicado automáticamente al Google Sheet`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  procesarCargas();
}

module.exports = { procesarCargas, parsearArchivo };
