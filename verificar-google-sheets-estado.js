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
async function verificarGoogleSheetsDirecto() {
  console.log('🔍 Verificando datos del Google Sheets directamente...\n');
  
  try {
    // Obtener datos raw del Google Sheets
    const sheetData = await hacerPeticion('/analytics/datos?indicadorId=CDEDACDPR(P_1756999998319&debug=true');
    
    console.log('✅ Respuesta del analytics service:');
    console.log('📊 Estructura de datos:', JSON.stringify(sheetData, null, 2));
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
  }
}

// Función para verificar el estado de Google Sheets
async function verificarEstadoGoogleSheets() {
  console.log('\n🔍 Verificando estado de Google Sheets...\n');
  
  try {
    // Intentar obtener el estado de Google Sheets
    const status = await hacerPeticion('/sync/estado-general');
    
    console.log('✅ Estado de Google Sheets:');
    console.log('📊 Respuesta:', JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
  }
}

// Función para verificar logs del backend
async function verificarLogsBackend() {
  console.log('\n🔍 Verificando logs del backend...\n');
  
  try {
    // Intentar obtener logs del backend
    const logs = await hacerPeticion('/health');
    
    console.log('✅ Estado del backend:');
    console.log('📊 Respuesta:', JSON.stringify(logs, null, 2));
    
  } catch (error) {
    console.error('❌ Error verificando logs:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación completa de Google Sheets...\n');
  
  await verificarGoogleSheetsDirecto();
  await verificarEstadoGoogleSheets();
  await verificarLogsBackend();
  
  console.log('\n✅ Verificación completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { verificarGoogleSheetsDirecto, verificarEstadoGoogleSheets, verificarLogsBackend };
