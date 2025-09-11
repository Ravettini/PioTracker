const API_BASE_URL = 'http://localhost:3001/api/v1';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTA4NmJmZi01NmMyLTRiMzMtYjRkOC1mODYzZTFjYzljNGQiLCJlbWFpbCI6ImFkbWluQHBpby5sb2NhbCIsInJvbCI6IkFETUlOIiwibWluaXN0ZXJpb0lkIjpudWxsLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIGRlbCBTaXN0ZW1hIiwiaWF0IjoxNzU2OTk3MDgwLCJleHAiOjE3NTcwNDAyODB9.hMWJJ89ZM-aeiIcu2XYcdVVQuyXmD3eFRT9NHeL2vO0';

async function hacerPeticion(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

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

async function verificarDashboardStats() {
  console.log('🔍 Verificando estadísticas del dashboard...\n');
  
  try {
    const stats = await hacerPeticion('/cargas/stats');
    
    console.log('📊 Estadísticas del dashboard:');
    console.log(`   - Total Cargas: ${stats.totalCargas}`);
    console.log(`   - Pendientes: ${stats.cargasPendientes}`);
    console.log(`   - Validadas: ${stats.cargasValidadas}`);
    console.log(`   - Observadas: ${stats.cargasObservadas}`);
    console.log(`   - Rechazadas: ${stats.cargasRechazadas}`);
    console.log(`   - Publicadas: ${stats.cargasPublicadas}`);
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
  }
}

verificarDashboardStats();
