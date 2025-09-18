const { Client } = require('pg');

// Configuración de la base de datos usando la misma configuración que el servidor
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sipio_db'
});

async function verificarDatosReales() {
  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos');

    // 1. Verificar cargas en general
    console.log('\n📊 CARGAS EN LA BASE DE DATOS:');
    const cargas = await client.query(`
      SELECT 
        c.id,
        c.periodo,
        c.valor,
        c.meta,
        c.estado,
        c.publicado,
        m.nombre as ministerio,
        l.titulo as compromiso,
        i.nombre as indicador
      FROM cargas c
      LEFT JOIN ministerios m ON c.ministerio_id = m.id
      LEFT JOIN lineas l ON c.linea_id = l.id
      LEFT JOIN indicadores i ON c.indicador_id = i.id
      ORDER BY c.creado_en DESC
      LIMIT 10
    `);
    
    console.log(`Total cargas encontradas: ${cargas.rows.length}`);
    cargas.rows.forEach((carga, index) => {
      console.log(`${index + 1}. Ministerio: ${carga.ministerio}`);
      console.log(`   Compromiso: ${carga.compromiso}`);
      console.log(`   Indicador: ${carga.indicador}`);
      console.log(`   Período: ${carga.periodo}`);
      console.log(`   Valor: ${carga.valor}`);
      console.log(`   Meta: ${carga.meta}`);
      console.log(`   Estado: ${carga.estado}`);
      console.log(`   Publicado: ${carga.publicado}`);
      console.log('   ---');
    });

    // 2. Verificar indicadores
    console.log('\n📈 INDICADORES EN LA BASE DE DATOS:');
    const indicadores = await client.query(`
      SELECT 
        i.id,
        i.nombre,
        l.titulo as compromiso,
        m.nombre as ministerio
      FROM indicadores i
      LEFT JOIN lineas l ON i.linea_id = l.id
      LEFT JOIN ministerios m ON l.ministerio_id = m.id
      WHERE m.nombre ILIKE '%MDHyH%' OR m.nombre ILIKE '%Desarrollo Humano%'
      ORDER BY i.nombre
    `);
    
    console.log(`Total indicadores de MDHyH: ${indicadores.rows.length}`);
    indicadores.rows.forEach((indicador, index) => {
      console.log(`${index + 1}. ${indicador.nombre}`);
      console.log(`   Compromiso: ${indicador.compromiso}`);
      console.log(`   Ministerio: ${indicador.ministerio}`);
      console.log(`   ID: ${indicador.id}`);
      console.log('   ---');
    });

    // 3. Verificar cargas validadas específicamente
    console.log('\n✅ CARGAS VALIDADAS:');
    const cargasValidadas = await client.query(`
      SELECT COUNT(*) as total
      FROM cargas 
      WHERE estado = 'validado'
    `);
    
    console.log(`Total cargas validadas: ${cargasValidadas.rows[0].total}`);

    // 4. Verificar si hay cargas para indicadores de MDHyH
    if (indicadores.rows.length > 0) {
      const primerIndicadorId = indicadores.rows[0].id;
      console.log(`\n🔍 CARGAS PARA EL PRIMER INDICADOR DE MDHyH (${primerIndicadorId}):`);
      
      const cargasIndicador = await client.query(`
        SELECT 
          periodo,
          valor,
          meta,
          estado,
          publicado
        FROM cargas 
        WHERE indicador_id = $1
        ORDER BY periodo ASC
      `, [primerIndicadorId]);
      
      console.log(`Total cargas para este indicador: ${cargasIndicador.rows.length}`);
      cargasIndicador.rows.forEach(carga => {
        console.log(`  - Período: ${carga.periodo}, Valor: ${carga.valor}, Meta: ${carga.meta}, Estado: ${carga.estado}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado de la base de datos');
  }
}

verificarDatosReales();
