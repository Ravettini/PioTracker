const fs = require('fs');

// Configuración
const API_BASE_URL = 'http://localhost:3001/api/v1';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTA4NmJmZi01NmMyLTRiMzMtYjRkOC1mODYzZTFjYzljNGQiLCJlbWFpbCI6ImFkbWluQHBpby5sb2NhbCIsInJvbCI6IkFETUlOIiwibWluaXN0ZXJpb0lkIjpudWxsLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIGRlbCBTaXN0ZW1hIiwiaWF0IjoxNzU2OTk3MDgwLCJleHAiOjE3NTcwNDAyODB9.hMWJJ89ZM-aeiIcu2XYcdVVQuyXmD3eFRT9NHeL2vO0';

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

// Función para obtener todos los ministerios
async function obtenerMinisterios() {
  try {
    const ministerios = await hacerPeticion('/catalogos/ministerios');
    return ministerios.data || ministerios;
  } catch (error) {
    console.error('❌ Error obteniendo ministerios:', error.message);
    throw error;
  }
}

// Función para crear un compromiso
async function crearCompromiso(compromiso) {
  try {
    const compromisoData = {
      titulo: compromiso.titulo,
      ministerioId: compromiso.ministerioId
    };

    const resultado = await hacerPeticion('/catalogos/lineas', 'POST', compromisoData);
    console.log(`✅ Compromiso creado: ${compromiso.titulo} para ${compromiso.ministerioId}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando compromiso "${compromiso.titulo}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function crearCompromisosSinTitulo() {
  console.log('🚀 Creando compromisos "sin título" para todos los ministerios...\n');
  
  try {
    // Obtener todos los ministerios
    const ministerios = await obtenerMinisterios();
    console.log(`📊 Se encontraron ${ministerios.length} ministerios\n`);
    
    const resultados = [];
    let exitosos = 0;
    let fallidos = 0;
    
    for (let i = 0; i < ministerios.length; i++) {
      const ministerio = ministerios[i];
      console.log(`📝 Procesando ministerio ${i + 1}/${ministerios.length}: ${ministerio.nombre} (${ministerio.id})`);
      
      const compromiso = {
        titulo: 'Compromiso sin título',
        ministerioId: ministerio.id
      };
      
      const resultado = await crearCompromiso(compromiso);
      
      if (resultado.success) {
        exitosos++;
      } else {
        fallidos++;
      }
      
      resultados.push({
        ministerio: ministerio,
        resultado: resultado
      });
      
      // Pausa entre creaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total ministerios: ${ministerios.length}`);
    console.log(`   - Compromisos creados: ${exitosos}`);
    console.log(`   - Fallidos: ${fallidos}`);
    
    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      totalMinisterios: ministerios.length,
      exitosos,
      fallidos,
      resultados
    };
    
    fs.writeFileSync('reporte-compromisos-sin-titulo.json', JSON.stringify(reporte, null, 2));
    console.log(`📄 Reporte guardado en: reporte-compromisos-sin-titulo.json`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearCompromisosSinTitulo();
}

module.exports = { crearCompromisosSinTitulo };
