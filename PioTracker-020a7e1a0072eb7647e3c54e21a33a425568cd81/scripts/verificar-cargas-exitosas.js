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

async function verificarCargasExitosas() {
  console.log('🔍 Verificando cargas exitosas de 2024...\n');
  
  try {
    // Obtener cargas validadas de 2024
    const cargas = await hacerPeticion('/cargas?estado=validado&periodo=2024&limit=10');
    
    if (!cargas || cargas.length === 0) {
      console.log('❌ No se encontraron cargas validadas de 2024');
      return;
    }
    
    console.log(`📊 Encontradas ${cargas.length} cargas validadas de 2024\n`);
    
    for (let i = 0; i < Math.min(5, cargas.length); i++) {
      const carga = cargas[i];
      console.log(`🔍 Verificando carga: ${carga.indicador?.nombre || 'Sin nombre'} (${carga.indicadorId})`);
      
      try {
        const datos = await hacerPeticion(`/analytics/datos?indicadorId=${carga.indicadorId}&periodoDesde=2024&periodoHasta=2024`);
        
        if (datos && datos.length > 0) {
          console.log(`✅ Datos encontrados en Google Sheets: ${datos.length} registros`);
          console.log(`   - Período: ${datos[0].periodo}`);
          console.log(`   - Valor: ${datos[0].valor}`);
          console.log(`   - Unidad: ${datos[0].unidad}`);
        } else {
          console.log(`⚠️  No hay datos en Google Sheets para este indicador`);
        }
      } catch (error) {
        console.log(`❌ Error obteniendo datos: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('🎉 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
  }
}

verificarCargasExitosas();
