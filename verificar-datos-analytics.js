const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sipio_db'
});

async function verificarDatosAnalytics() {
  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos');

    // 1. Verificar ministerios
    console.log('\n📊 MINISTERIOS:');
    const ministerios = await client.query(`
      SELECT id, nombre, sigla 
      FROM ministerios 
      ORDER BY nombre
    `);
    console.log(`Total ministerios: ${ministerios.rows.length}`);
    ministerios.rows.forEach(m => {
      console.log(`  - ${m.nombre} (${m.sigla}) - ID: ${m.id}`);
    });

    // 2. Buscar MDHyH específicamente
    console.log('\n🔍 BUSCANDO MDHyH:');
    const mdhyh = await client.query(`
      SELECT id, nombre, sigla 
      FROM ministerios 
      WHERE sigla ILIKE '%MDHyH%' OR nombre ILIKE '%MDHyH%'
    `);
    
    if (mdhyh.rows.length > 0) {
      console.log('✅ MDHyH encontrado:');
      mdhyh.rows.forEach(m => {
        console.log(`  - ${m.nombre} (${m.sigla}) - ID: ${m.id}`);
      });

      const ministerioId = mdhyh.rows[0].id;
      
      // 3. Buscar compromisos de MDHyH
      console.log('\n📋 COMPROMISOS DE MDHyH:');
      const compromisos = await client.query(`
        SELECT id, titulo, ministerio_id
        FROM lineas 
        WHERE ministerio_id = $1 AND activo = true
        ORDER BY titulo
      `, [ministerioId]);
      
      console.log(`Total compromisos: ${compromisos.rows.length}`);
      compromisos.rows.forEach((c, index) => {
        console.log(`  ${index + 1}. ${c.titulo} - ID: ${c.id}`);
      });

      if (compromisos.rows.length > 0) {
        const primerCompromiso = compromisos.rows[0];
        console.log(`\n🎯 PRIMER COMPROMISO: ${primerCompromiso.titulo}`);
        
        // 4. Buscar indicadores del primer compromiso
        console.log('\n📈 INDICADORES DEL PRIMER COMPROMISO:');
        const indicadores = await client.query(`
          SELECT id, nombre, linea_id
          FROM indicadores 
          WHERE linea_id = $1 AND activo = true
          ORDER BY nombre
        `, [primerCompromiso.id]);
        
        console.log(`Total indicadores: ${indicadores.rows.length}`);
        indicadores.rows.forEach((i, index) => {
          console.log(`  ${index + 1}. ${i.nombre} - ID: ${i.id}`);
        });

        if (indicadores.rows.length > 0) {
          const primerIndicador = indicadores.rows[0];
          console.log(`\n🎯 PRIMER INDICADOR: ${primerIndicador.nombre}`);
          
          // 5. Buscar cargas para el primer indicador
          console.log('\n📊 CARGAS PARA EL PRIMER INDICADOR:');
          const cargas = await client.query(`
            SELECT id, periodo, valor, meta, estado, publicado, creado_en
            FROM cargas 
            WHERE indicador_id = $1
            ORDER BY periodo DESC
          `, [primerIndicador.id]);
          
          console.log(`Total cargas: ${cargas.rows.length}`);
          if (cargas.rows.length > 0) {
            cargas.rows.forEach(c => {
              console.log(`  - Período: ${c.periodo}, Valor: ${c.valor}, Meta: ${c.meta}, Estado: ${c.estado}, Publicado: ${c.publicado}`);
            });
          } else {
            console.log('❌ NO HAY CARGAS PARA ESTE INDICADOR');
          }

          // 6. Buscar cargas validadas específicamente
          console.log('\n✅ CARGAS VALIDADAS PARA EL PRIMER INDICADOR:');
          const cargasValidadas = await client.query(`
            SELECT id, periodo, valor, meta, estado, publicado, creado_en
            FROM cargas 
            WHERE indicador_id = $1 AND estado = 'validado'
            ORDER BY periodo ASC
          `, [primerIndicador.id]);
          
          console.log(`Total cargas validadas: ${cargasValidadas.rows.length}`);
          if (cargasValidadas.rows.length > 0) {
            cargasValidadas.rows.forEach(c => {
              console.log(`  - Período: ${c.periodo}, Valor: ${c.valor}, Meta: ${c.meta}`);
            });
          } else {
            console.log('❌ NO HAY CARGAS VALIDADAS PARA ESTE INDICADOR');
          }
        }
      }
    } else {
      console.log('❌ MDHyH no encontrado');
    }

    // 7. Verificar todas las cargas en general
    console.log('\n📊 RESUMEN GENERAL DE CARGAS:');
    const resumenCargas = await client.query(`
      SELECT 
        estado,
        COUNT(*) as total,
        COUNT(CASE WHEN publicado = true THEN 1 END) as publicadas
      FROM cargas 
      GROUP BY estado
      ORDER BY total DESC
    `);
    
    resumenCargas.rows.forEach(r => {
      console.log(`  - ${r.estado}: ${r.total} cargas (${r.publicadas} publicadas)`);
    });

    // 8. Verificar cargas por ministerio
    console.log('\n📊 CARGAS POR MINISTERIO:');
    const cargasPorMinisterio = await client.query(`
      SELECT 
        m.nombre as ministerio,
        m.sigla,
        COUNT(c.id) as total_cargas,
        COUNT(CASE WHEN c.estado = 'validado' THEN 1 END) as cargas_validadas
      FROM ministerios m
      LEFT JOIN cargas c ON m.id = c.ministerio_id
      GROUP BY m.id, m.nombre, m.sigla
      ORDER BY total_cargas DESC
    `);
    
    cargasPorMinisterio.rows.forEach(r => {
      console.log(`  - ${r.ministerio} (${r.sigla}): ${r.total_cargas} cargas (${r.cargas_validadas} validadas)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado de la base de datos');
  }
}

verificarDatosAnalytics();
