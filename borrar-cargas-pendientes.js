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

// Función para borrar cargas pendientes
async function borrarCargasPendientes() {
  console.log('🗑️ Borrando todas las cargas pendientes...\n');
  
  try {
    // Obtener cargas pendientes
    const cargasPendientes = await hacerPeticion('/cargas?estado=pendiente');
    console.log(`📊 Se encontraron ${cargasPendientes.cargas.length} cargas pendientes para borrar\n`);
    
    if (cargasPendientes.cargas.length === 0) {
      console.log('✅ No hay cargas pendientes para borrar');
      return;
    }
    
    let borradas = 0;
    let fallidas = 0;
    
    for (let i = 0; i < cargasPendientes.cargas.length; i++) {
      const carga = cargasPendientes.cargas[i];
      console.log(`🗑️ Borrando carga ${i + 1}/${cargasPendientes.cargas.length}: ${carga.id}`);
      
      try {
        await hacerPeticion(`/cargas/${carga.id}`, 'DELETE');
        console.log(`✅ Carga borrada: ${carga.id}`);
        borradas++;
      } catch (error) {
        console.log(`❌ Error borrando carga ${carga.id}:`, error.message);
        fallidas++;
      }
      
      // Pausa entre borrados
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total cargas pendientes: ${cargasPendientes.cargas.length}`);
    console.log(`   - Borradas: ${borradas}`);
    console.log(`   - Fallidas: ${fallidas}`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  borrarCargasPendientes();
}

module.exports = { borrarCargasPendientes };
