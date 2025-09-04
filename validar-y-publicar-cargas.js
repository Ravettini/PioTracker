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

// Función para publicar una carga
async function publicarCarga(cargaId) {
  try {
    // Para publicar, necesitamos actualizar el campo publicado a true
    const resultado = await hacerPeticion(`/cargas/${cargaId}`, 'PUT', {
      publicado: true
    });
    console.log(`✅ Carga publicada: ${cargaId}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error publicando carga "${cargaId}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function validarYPublicarCargasPendientes() {
  console.log('🚀 Validando y publicando cargas pendientes...\n');
  
  try {
    // Obtener cargas pendientes
    const cargasPendientes = await hacerPeticion('/cargas?estado=pendiente');
    console.log(`📊 Se encontraron ${cargasPendientes.cargas.length} cargas pendientes\n`);
    
    if (cargasPendientes.cargas.length === 0) {
      console.log('✅ No hay cargas pendientes para validar');
      return;
    }
    
    const resultados = [];
    let validadas = 0;
    let publicadas = 0;
    let fallidas = 0;
    
    for (let i = 0; i < cargasPendientes.cargas.length; i++) {
      const carga = cargasPendientes.cargas[i];
      console.log(`📝 Procesando carga ${i + 1}/${cargasPendientes.cargas.length}: ${carga.id}`);
      
      // Validar la carga
      const resultadoValidacion = await validarCarga(carga.id);
      
      if (resultadoValidacion.success) {
        validadas++;
        
        // Publicar la carga
        const resultadoPublicacion = await publicarCarga(carga.id);
        
        if (resultadoPublicacion.success) {
          publicadas++;
        } else {
          fallidas++;
        }
        
        resultados.push({
          carga: carga,
          validacion: resultadoValidacion,
          publicacion: resultadoPublicacion
        });
      } else {
        fallidas++;
        resultados.push({
          carga: carga,
          validacion: resultadoValidacion,
          publicacion: { success: false, error: 'No se pudo validar' }
        });
      }
      
      // Pausa entre operaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total cargas pendientes: ${cargasPendientes.cargas.length}`);
    console.log(`   - Validadas: ${validadas}`);
    console.log(`   - Publicadas: ${publicadas}`);
    console.log(`   - Fallidas: ${fallidas}`);
    console.log(`🌐 Las cargas publicadas se han enviado automáticamente al Google Sheet`);
    
    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      totalCargasPendientes: cargasPendientes.cargas.length,
      validadas,
      publicadas,
      fallidas,
      resultados
    };
    
    fs.writeFileSync('reporte-validacion-publicacion.json', JSON.stringify(reporte, null, 2));
    console.log(`📄 Reporte guardado en: reporte-validacion-publicacion.json`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  validarYPublicarCargasPendientes();
}

module.exports = { validarYPublicarCargasPendientes };
