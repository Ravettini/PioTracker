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

// Función para verificar datos del Google Sheets directamente
async function verificarDatosSheetsDirecto() {
  console.log('🔍 Verificando datos del Google Sheets directamente...\n');
  
  try {
    // Obtener datos del Google Sheets usando el endpoint de analytics
    const sheetData = await hacerPeticion('/analytics/datos?indicadorId=CDEDACDPR(P_1756999998319');
    
    console.log('✅ Datos obtenidos del Google Sheets:');
    console.log('📊 Estructura de datos:', JSON.stringify(sheetData, null, 2));
    
    // Verificar si hay datos
    if (sheetData.datos && sheetData.datos.periodos) {
      console.log(`📈 Períodos encontrados: ${sheetData.datos.periodos.length}`);
      console.log(`📊 Valores encontrados: ${sheetData.datos.valores.length}`);
      console.log(`🎯 Metas encontradas: ${sheetData.datos.metas ? sheetData.datos.metas.length : 0}`);
      
      if (sheetData.datos.periodos.length > 0) {
        console.log('\n📋 Períodos:', sheetData.datos.periodos);
        console.log('📊 Valores:', sheetData.datos.valores);
        if (sheetData.datos.metas) {
          console.log('🎯 Metas:', sheetData.datos.metas);
        }
      }
    } else {
      console.log('❌ No se encontraron datos estructurados');
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
  }
}

// Función para verificar múltiples indicadores
async function verificarMultiplesIndicadores() {
  console.log('\n🔍 Verificando múltiples indicadores...\n');
  
  const indicadores = [
    'CDEDACDPR(P_1756999998319', // MDH - Cantidad de entrevistas
    'CDCAPGQNDATDB_1757000007303', // JDG - Cantidad de consultas
    'ADGA_1756999997221', // JDG - Aplicaciones analizadas
    'TPDRIDS_1756999996682', // JDG - Tiempo promedio
    'CDCDGIEB_1757000011669', // JDG - Contenidos de campaña
    'TDPELADB_1757000006756' // JDG - Tasa de paridad
  ];
  
  for (const indicadorId of indicadores) {
    console.log(`\n📊 Verificando indicador: ${indicadorId}`);
    try {
      const sheetData = await hacerPeticion(`/analytics/datos?indicadorId=${indicadorId}`);
      
      if (sheetData.datos && sheetData.datos.periodos && sheetData.datos.periodos.length > 0) {
        console.log(`✅ Datos encontrados: ${sheetData.datos.periodos.length} períodos`);
        console.log(`📋 Períodos: ${sheetData.datos.periodos.join(', ')}`);
        console.log(`📊 Valores: ${sheetData.datos.valores.join(', ')}`);
      } else {
        console.log(`❌ Sin datos`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación completa de datos del Google Sheets...\n');
  
  await verificarDatosSheetsDirecto();
  await verificarMultiplesIndicadores();
  
  console.log('\n✅ Verificación completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { verificarDatosSheetsDirecto, verificarMultiplesIndicadores };
