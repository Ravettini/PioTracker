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

// Función para crear un indicador
async function crearIndicador(indicador) {
  try {
    const indicadorData = {
      nombre: indicador.nombre,
      lineaId: indicador.lineaId,
      unidadDefecto: indicador.unidadDefecto || 'unidades',
      periodicidad: indicador.periodicidad || 'mensual'
    };

    const resultado = await hacerPeticion('/catalogos/indicadores', 'POST', indicadorData);
    console.log(`✅ Indicador creado: ${indicador.nombre}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando indicador "${indicador.nombre}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función para obtener línea por título
async function obtenerLinea(titulo, ministerioId) {
  try {
    const lineas = await hacerPeticion(`/catalogos/lineas?ministerioId=${ministerioId}`);
    const linea = lineas.data.find(l => 
      l.titulo.toLowerCase().includes(titulo.toLowerCase()) ||
      titulo.toLowerCase().includes(l.titulo.toLowerCase())
    );
    
    if (!linea) {
      throw new Error(`Línea no encontrada: ${titulo}`);
    }
    
    return linea;
  } catch (error) {
    console.error(`❌ Error obteniendo línea "${titulo}":`, error.message);
    throw error;
  }
}

// Indicador faltante identificado
const indicadorFaltante = {
  nombre: 'a) Cantidad de reuniones entre el Ministerio de Seguridad y la Subsecretaría de la Mujer para la elaboración de la Resolución conjunta que apruebe la Mesa',
  lineaTitulo: 'Crear en conjunto con la Subsecretaría de la Mujer una "Mesa Interministerial de Femicidios" de la Ciudad de Buenos Aires, para el análisis y elaboración de informes estadísticos entorno a los femicidios ocurridos en el ámbito de la Ciudad.',
  ministerioId: 'SEG',
  unidadDefecto: 'reuniones',
  periodicidad: 'anual'
};

// Función para crear el indicador faltante
async function crearIndicadorFaltante() {
  console.log('🚀 Creando indicador faltante...\n');
  
  try {
    console.log(`📝 Creando indicador: ${indicadorFaltante.nombre.substring(0, 50)}...`);
    
    // Obtener la línea primero
    const linea = await obtenerLinea(indicadorFaltante.lineaTitulo, indicadorFaltante.ministerioId);
    
    const resultado = await crearIndicador({
      ...indicadorFaltante,
      lineaId: linea.id
    });
    
    if (resultado.success) {
      console.log(`✅ Indicador creado exitosamente`);
    } else {
      console.log(`❌ Error creando indicador: ${resultado.error}`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearIndicadorFaltante();
}

module.exports = { crearIndicadorFaltante };
