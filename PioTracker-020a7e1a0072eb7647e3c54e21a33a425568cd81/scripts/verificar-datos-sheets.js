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

// Función para verificar datos del Google Sheets
async function verificarDatosSheets() {
  console.log('🔍 Verificando datos del Google Sheets...\n');
  
  try {
    // Usar un indicador real que existe en la base de datos
    const sheetData = await hacerPeticion('/analytics/datos?indicadorId=DE_1757000001582&periodoDesde=2025-01&periodoHasta=2025-12');
    
    console.log('✅ Datos obtenidos del Google Sheets:');
    console.log('📊 Estructura de datos:', JSON.stringify(sheetData, null, 2));
    
    // Verificar si hay datos
    if (sheetData.datos && sheetData.datos.periodos) {
      console.log(`📈 Períodos encontrados: ${sheetData.datos.periodos.length}`);
      console.log(`📊 Valores encontrados: ${sheetData.datos.valores.length}`);
      console.log(`🎯 Metas encontradas: ${sheetData.datos.metas ? sheetData.datos.metas.length : 0}`);
      
      if (sheetData.datos.periodos.length > 0) {
        console.log('\n📋 Primeros 5 períodos:', sheetData.datos.periodos.slice(0, 5));
        console.log('📊 Primeros 5 valores:', sheetData.datos.valores.slice(0, 5));
        if (sheetData.datos.metas) {
          console.log('🎯 Primeras 5 metas:', sheetData.datos.metas.slice(0, 5));
        }
      }
    } else {
      console.log('❌ No se encontraron datos estructurados');
    }
    
    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      datos: sheetData,
      estructura: {
        tienePeriodos: !!sheetData.datos?.periodos,
        tieneValores: !!sheetData.datos?.valores,
        tieneMetas: !!sheetData.datos?.metas,
        totalPeriodos: sheetData.datos?.periodos?.length || 0,
        totalValores: sheetData.datos?.valores?.length || 0,
        totalMetas: sheetData.datos?.metas?.length || 0
      }
    };
    
    fs.writeFileSync('reporte-verificacion-sheets.json', JSON.stringify(reporte, null, 2));
    console.log('\n📄 Reporte guardado en: reporte-verificacion-sheets.json');
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
    
    // Intentar obtener datos de la base de datos local como fallback
    console.log('\n🔄 Intentando obtener datos de la base de datos local...');
    try {
      const cargas = await hacerPeticion('/cargas?limit=10');
      console.log('📊 Datos de cargas en BD:', JSON.stringify(cargas, null, 2));
    } catch (dbError) {
      console.error('❌ Error obteniendo datos de BD:', dbError.message);
    }
  }
}

// Función para verificar estructura de columnas
async function verificarEstructuraColumnas() {
  console.log('\n🔍 Verificando estructura de columnas...\n');
  
  try {
    // Obtener datos raw del Google Sheets usando un indicador real
    const sheetData = await hacerPeticion('/analytics/datos?indicadorId=DE_1757000001582');
    
    console.log('📋 Estructura completa de respuesta:');
    console.log(JSON.stringify(sheetData, null, 2));
    
    // Analizar la estructura
    if (sheetData.datos && sheetData.datos.periodos) {
      console.log('\n✅ Estructura de datos válida encontrada');
      console.log(`📊 Tipo de indicador: ${sheetData.tipo}`);
      console.log(`🏛️ Ministerio: ${sheetData.ministerio}`);
      console.log(`📋 Compromiso: ${sheetData.compromiso}`);
      console.log(`📈 Indicador: ${sheetData.indicador}`);
    } else {
      console.log('\n❌ Estructura de datos inválida');
      console.log('🔍 Analizando respuesta completa...');
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de datos del Google Sheets...\n');
  
  await verificarDatosSheets();
  await verificarEstructuraColumnas();
  
  console.log('\n✅ Verificación completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { verificarDatosSheets, verificarEstructuraColumnas };
