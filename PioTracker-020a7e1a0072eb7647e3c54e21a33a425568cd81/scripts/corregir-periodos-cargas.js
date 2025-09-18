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

// Función para obtener todas las cargas con período 2025-2027
async function obtenerCargasConPeriodoIncorrecto() {
  console.log('🔍 Obteniendo cargas con período 2025-2027...\n');
  
  try {
    const cargas = await hacerPeticion('/cargas?periodo=2025-2027&limit=1000');
    
    console.log(`✅ Se encontraron ${cargas.cargas.length} cargas con período 2025-2027`);
    
    // Mostrar distribución por estado
    const estados = {};
    cargas.cargas.forEach(c => {
      estados[c.estado] = (estados[c.estado] || 0) + 1;
    });
    
    console.log('📊 Distribución por estado:');
    Object.entries(estados).forEach(([estado, count]) => {
      console.log(`   - ${estado}: ${count}`);
    });
    
    return cargas.cargas;
  } catch (error) {
    console.error('❌ Error obteniendo cargas:', error.message);
    return [];
  }
}

// Función para verificar si una carga se puede editar
function puedeEditarCarga(carga, userRol) {
  // Solo se pueden editar borradores, o cargas pendientes si es admin
  if (carga.estado === 'borrador') {
    return true;
  }
  
  if (userRol === 'ADMIN' && carga.estado === 'pendiente') {
    return true;
  }
  
  return false;
}

// Función para actualizar el período de una carga
async function actualizarPeriodoCarga(cargaId, nuevoPeriodo) {
  try {
    const resultado = await hacerPeticion(`/cargas/${cargaId}`, 'PUT', {
      periodo: nuevoPeriodo
    });
    
    console.log(`✅ Carga ${cargaId} actualizada: ${nuevoPeriodo}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error actualizando carga ${cargaId}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal para corregir períodos
async function corregirPeriodos() {
  console.log('🚀 Iniciando corrección de períodos de 2025-2027 a 2024...\n');
  
  try {
    // Obtener cargas con período incorrecto
    const cargasIncorrectas = await obtenerCargasConPeriodoIncorrecto();
    
    if (cargasIncorrectas.length === 0) {
      console.log('✅ No hay cargas con período incorrecto');
      return;
    }
    
    // Filtrar cargas que se pueden editar (borrador o pendiente si es admin)
    const cargasEditables = cargasIncorrectas.filter(c => puedeEditarCarga(c, 'ADMIN'));
    
    console.log(`\n📝 Cargas que se pueden editar: ${cargasEditables.length} de ${cargasIncorrectas.length}`);
    
    if (cargasEditables.length === 0) {
      console.log('❌ No hay cargas editables. Las cargas están en estado "validado" y no se pueden editar.');
      console.log('💡 Solución: Necesitamos cambiar el estado a "pendiente" primero.');
      return;
    }
    
    console.log(`📝 Procesando ${cargasEditables.length} cargas editables...\n`);
    
    let actualizadas = 0;
    let fallidas = 0;
    const resultados = [];
    
    // Procesar cada carga editable
    for (let i = 0; i < cargasEditables.length; i++) {
      const carga = cargasEditables[i];
      console.log(`📝 Procesando carga ${i + 1}/${cargasEditables.length}: ${carga.id} (${carga.estado})`);
      
      const resultado = await actualizarPeriodoCarga(carga.id, '2024');
      
      resultados.push({
        id: carga.id,
        ministerio: carga.ministerio?.nombre || 'N/A',
        indicador: carga.indicador?.nombre || 'N/A',
        estado: carga.estado,
        periodoAnterior: carga.periodo,
        periodoNuevo: '2024',
        success: resultado.success,
        error: resultado.error
      });
      
      if (resultado.success) {
        actualizadas++;
      } else {
        fallidas++;
      }
      
      // Pausa entre actualizaciones para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Guardar reporte
    const reporte = {
      fecha: new Date().toISOString(),
      total: cargasIncorrectas.length,
      editables: cargasEditables.length,
      actualizadas,
      fallidas,
      resultados
    };
    
    fs.writeFileSync('reporte-correccion-periodos.json', JSON.stringify(reporte, null, 2));
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Total cargas con período incorrecto: ${cargasIncorrectas.length}`);
    console.log(`   - Cargas editables: ${cargasEditables.length}`);
    console.log(`   - Actualizadas: ${actualizadas}`);
    console.log(`   - Fallidas: ${fallidas}`);
    console.log(`📄 Reporte guardado en: reporte-correccion-periodos.json`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  corregirPeriodos();
}

module.exports = { corregirPeriodos, obtenerCargasConPeriodoIncorrecto, actualizarPeriodoCarga };
