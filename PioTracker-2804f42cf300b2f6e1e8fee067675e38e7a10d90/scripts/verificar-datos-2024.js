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

async function verificarDatos2024() {
  console.log('🔍 Verificando datos de 2024 en Google Sheets...\n');
  
  try {
    // Obtener algunos indicadores para probar
    const indicadores = await hacerPeticion('/catalogos/indicadores?limit=5');
    
    if (!indicadores || indicadores.length === 0) {
      console.log('❌ No se encontraron indicadores');
      return;
    }
    
    console.log(`📊 Probando con ${indicadores.length} indicadores...\n`);
    
    for (let i = 0; i < Math.min(3, indicadores.length); i++) {
      const indicador = indicadores[i];
      console.log(`🔍 Probando indicador: ${indicador.nombre} (${indicador.id})`);
      
      try {
        const datos = await hacerPeticion(`/analytics/datos?indicadorId=${indicador.id}&periodoDesde=2024&periodoHasta=2024`);
        
        if (datos && datos.length > 0) {
          console.log(`✅ Datos encontrados: ${datos.length} registros`);
          console.log(`   - Períodos: ${datos.map(d => d.periodo).join(', ')}`);
          console.log(`   - Valores: ${datos.map(d => d.valor).join(', ')}`);
        } else {
          console.log(`⚠️  No hay datos para este indicador en 2024`);
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

verificarDatos2024();
