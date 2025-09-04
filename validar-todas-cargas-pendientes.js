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

// Función para obtener todas las cargas pendientes
async function obtenerTodasCargasPendientes() {
  console.log('📊 Obteniendo todas las cargas pendientes...');
  
  try {
    // Obtener todas las cargas pendientes con un límite alto
    const response = await hacerPeticion('/cargas?estado=pendiente&limit=1000');
    const cargas = response.cargas || [];
    
    console.log(`✅ Se encontraron ${cargas.length} cargas pendientes`);
    return cargas;
  } catch (error) {
    console.error('❌ Error obteniendo cargas pendientes:', error.message);
    return [];
  }
}

// Función para validar una carga
async function validarCarga(cargaId) {
  try {
    const resultado = await hacerPeticion(`/cargas/${cargaId}/revision`, 'POST', {
      estado: 'validado'
    });
    console.log(`✅ Carga validada: ${cargaId}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error validando carga "${cargaId}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function validarTodasCargasPendientes() {
  console.log('🚀 Validando todas las cargas pendientes...\n');
  
  try {
    // Obtener todas las cargas pendientes
    const cargasPendientes = await obtenerTodasCargasPendientes();
    
    if (cargasPendientes.length === 0) {
      console.log('✅ No hay cargas pendientes para validar.');
      return;
    }
    
    console.log(`📝 Procesando ${cargasPendientes.length} cargas pendientes...\n`);
    
    let validadas = 0;
    let fallidas = 0;
    const resultados = [];
    
    // Procesar cada carga
    for (let i = 0; i < cargasPendientes.length; i++) {
      const carga = cargasPendientes[i];
      console.log(`📝 Procesando carga ${i + 1}/${cargasPendientes.length}: ${carga.id}`);
      
      const resultado = await validarCarga(carga.id);
      
      resultados.push({
        id: carga.id,
        ministerio: carga.ministerio?.nombre || 'N/A',
        indicador: carga.indicador?.nombre || 'N/A',
        success: resultado.success,
        error: resultado.error
      });
      
      if (resultado.success) {
        validadas++;
      } else {
        fallidas++;
      }
      
      // Pausa entre validaciones para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      total: cargasPendientes.length,
      validadas,
      fallidas,
      resultados
    };
    
    fs.writeFileSync('reporte-validacion-completa.json', JSON.stringify(reporte, null, 2));
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total cargas pendientes: ${cargasPendientes.length}`);
    console.log(`   - Validadas: ${validadas}`);
    console.log(`   - Fallidas: ${fallidas}`);
    console.log(`🌐 Las cargas validadas se han publicado automáticamente al Google Sheet`);
    console.log(`📄 Reporte guardado en: reporte-validacion-completa.json`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  validarTodasCargasPendientes();
}

module.exports = { validarTodasCargasPendientes };
