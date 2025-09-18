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

// Indicadores faltantes adicionales identificados del reporte
const indicadoresFaltantesAdicionales = [
  {
    nombre: 'Cantidad de reuniones para realizar los ajustes al manual de diseño en espacios publicos',
    lineaTitulo: 'Ajuste (ya está publicado) de manual de diseño de espacios públicos con perspectiva de género',
    ministerioId: 'JDG',
    unidadDefecto: 'reuniones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de trabajadores inscriptos en la capacitacion',
    lineaTitulo: 'Articular instancias de capacitación y formación en la implementación de Programa Mujeres Líderes en GCBA.',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Tasa de paridad en la asignación de becas',
    lineaTitulo: 'Continuar garantizando la asignación de becas paritarias para las formaciones',
    ministerioId: 'JDG',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de consultas atendidas por genero que necesiten derivacion a traves de boti',
    lineaTitulo: 'Continuar teniendo el apoyo de BOTI como canal de acceso para la atención, derivación y contención  de mujeres en el GCBA.',
    ministerioId: 'JDG',
    unidadDefecto: 'consultas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Cantidad de reuniones para la redaccion de un protocolo unificado',
    lineaTitulo: 'Creación de un protocolo unificado para el abordaje de situaciones de violencia de género y protección a las infancias y adolescencias.',
    ministerioId: 'JDG',
    unidadDefecto: 'reuniones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de convenios/articulciones/acuerdos firmados con clubes para la entrega de materiales y difusion de la linea 144',
    lineaTitulo: 'Difundir la línea 144 en todos los partidos e infraestructura de clubes deportivos.',
    ministerioId: 'JDG',
    unidadDefecto: 'convenios',
    periodicidad: 'anual'
  },
  {
    nombre: 'cantidad de capacitaciones para entrenadores/as sobre deporte inclusivo',
    lineaTitulo: 'Fomentar la creación de espacios de deporte inclusivos para mujeres con discapacidad.',
    ministerioId: 'JDG',
    unidadDefecto: 'capacitaciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de trabajadores inscriptos en la capacitacion',
    lineaTitulo: 'Garantizar el cumplimiento de la capacitación obligatoria en Ley Micaela.',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de ediciones de la especializaciones en perspectiva de género realizadas en 2024',
    lineaTitulo: 'Garantizar la especializaciòn en perspectiva de genero en el marco del programa "Especializaciones"',
    ministerioId: 'JDG',
    unidadDefecto: 'ediciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de reuniones para la redacción de la Ley Micaela',
    lineaTitulo: 'Ley Micaela en los clubes. Participación en la redacción de la ley y garantizar el cumplimiento de la Ley Micaela específica para entidades deportivas en el ámbito de la CABA.',
    ministerioId: 'JDG',
    unidadDefecto: 'reuniones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de encuentros realizados para la elaboracion de diagnostico, planificacion y cronograma de actividades',
    lineaTitulo: 'Promoción de espacios de fútbol mixto.',
    ministerioId: 'JDG',
    unidadDefecto: 'encuentros',
    periodicidad: 'anual'
  },
  {
    nombre: 'contenidos de campaña de genero incorporados en boti',
    lineaTitulo: 'Promover mecanismos de difusión de esta herramienta como vía de acceso a recursos del GCBA',
    ministerioId: 'JDG',
    unidadDefecto: 'contenidos',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de reuniones de organizacion para la maraton',
    lineaTitulo: 'Realización de la "Maratón violeta: hombres y mujeres contra la violencia" para la conmemoración del día internacional para la eliminación de la violencia contra la mujer.',
    ministerioId: 'JDG',
    unidadDefecto: 'reuniones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de reuniones de planificacion y armado de equipo para el relevamiento',
    lineaTitulo: 'Realización de un relevamiento de comisiones de género en todos los clubes deportivos.',
    ministerioId: 'JDG',
    unidadDefecto: 'reuniones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Participacion en actividades de concientizacion',
    lineaTitulo: 'Trabajar junto a la ASI proyectos, programas y acciones de seguridad informática preventiva y concientización.',
    ministerioId: 'JDG',
    unidadDefecto: 'actividades',
    periodicidad: 'anual'
  }
];

// Función para crear indicadores adicionales
async function crearIndicadoresAdicionales() {
  console.log('🚀 Creando indicadores adicionales faltantes...\n');
  
  try {
    let indicadoresCreados = 0;
    let indicadoresFallidos = 0;
    
    for (let i = 0; i < indicadoresFaltantesAdicionales.length; i++) {
      const indicador = indicadoresFaltantesAdicionales[i];
      console.log(`📝 Creando indicador ${i + 1}/${indicadoresFaltantesAdicionales.length}: ${indicador.nombre.substring(0, 50)}...`);
      
      try {
        // Obtener la línea primero
        const linea = await obtenerLinea(indicador.lineaTitulo, indicador.ministerioId);
        
        const resultado = await crearIndicador({
          ...indicador,
          lineaId: linea.id
        });
        
        if (resultado.success) {
          indicadoresCreados++;
        } else {
          indicadoresFallidos++;
        }
      } catch (error) {
        console.log(`❌ Error con indicador "${indicador.nombre}":`, error.message);
        indicadoresFallidos++;
      }
      
      // Pausa entre creaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Indicadores creados: ${indicadoresCreados}`);
    console.log(`❌ Indicadores fallidos: ${indicadoresFallidos}`);
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Indicadores creados: ${indicadoresCreados}`);
    console.log(`   - Total elementos nuevos: ${indicadoresCreados}`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearIndicadoresAdicionales();
}

module.exports = { crearIndicadoresAdicionales };
