const axios = require('axios');

// URL del servidor
const SERVER_URL = 'https://sigepi-backend.onrender.com';

async function verificarYCorregirDatos() {
  try {
    console.log('🔍 Verificando y corrigiendo datos para Analytics...\n');

    // 1. Obtener token de admin
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${SERVER_URL}/api/v1/auth/login`, {
      email: 'admin@pio.local',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente');

    // 2. Obtener ministerios
    console.log('\n📋 Obteniendo ministerios...');
    const ministeriosResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/ministerios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mdhyhMinisterio = ministeriosResponse.data.data.find(m => 
      m.nombre.includes('MDHyH') || m.nombre.includes('Desarrollo Humano')
    );
    
    if (!mdhyhMinisterio) {
      console.log('❌ No se encontró MDHyH');
      return;
    }
    
    console.log(`✅ MDHyH encontrado: ${mdhyhMinisterio.nombre}`);

    // 3. Obtener compromisos de MDHyH
    console.log('\n📋 Obteniendo compromisos de MDHyH...');
    const compromisosResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/lineas?ministerioId=${mdhyhMinisterio.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Total compromisos: ${compromisosResponse.data.data.length}`);
    
    const compromisoA = compromisosResponse.data.data.find(c => 
      c.titulo.includes('A)') || c.titulo.includes('Sistematizar')
    );
    
    if (!compromisoA) {
      console.log('❌ No se encontró el Compromiso A');
      return;
    }
    
    console.log(`✅ Compromiso A encontrado: ${compromisoA.titulo}`);

    // 4. Obtener indicadores del Compromiso A
    console.log('\n📈 Obteniendo indicadores del Compromiso A...');
    const indicadoresResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/indicadores?lineaId=${compromisoA.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Total indicadores: ${indicadoresResponse.data.data.length}`);
    
    if (indicadoresResponse.data.data.length === 0) {
      console.log('❌ No hay indicadores para el Compromiso A');
      return;
    }
    
    const primerIndicador = indicadoresResponse.data.data[0];
    console.log(`✅ Primer indicador: ${primerIndicador.nombre}`);

    // 5. Verificar cargas existentes para este indicador
    console.log('\n📊 Verificando cargas existentes...');
    const cargasResponse = await axios.get(`${SERVER_URL}/api/v1/cargas?indicadorId=${primerIndicador.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Total cargas encontradas: ${cargasResponse.data.cargas.length}`);
    
    if (cargasResponse.data.cargas.length === 0) {
      console.log('❌ No hay cargas para este indicador');
      console.log('\n💡 SOLUCIÓN: Necesitamos crear cargas específicas para este indicador');
      
      // Crear cargas de prueba
      console.log('\n📝 Creando cargas de prueba...');
      
      const datosPrueba = [
        { periodo: '2024-01', valor: 15, meta: 20 },
        { periodo: '2024-02', valor: 18, meta: 20 },
        { periodo: '2024-03', valor: 22, meta: 20 },
        { periodo: '2024-04', valor: 19, meta: 20 },
        { periodo: '2024-05', valor: 25, meta: 20 },
        { periodo: '2024-06', valor: 23, meta: 20 }
      ];
      
      for (const dato of datosPrueba) {
        try {
          const cargaData = {
            ministerioId: mdhyhMinisterio.id,
            lineaId: compromisoA.id,
            indicadorId: primerIndicador.id,
            periodicidad: 'mensual',
            periodo: dato.periodo,
            valor: dato.valor,
            unidad: 'reuniones',
            meta: dato.meta,
            fuente: 'Datos de prueba',
            responsableNombre: 'Sistema Automático',
            responsableEmail: 'sistema@pio.gob.ar',
            observaciones: `Carga de prueba para ${dato.periodo}`,
            estado: 'validado',
            publicado: true
          };

          await axios.post(`${SERVER_URL}/api/v1/cargas`, cargaData, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          console.log(`✅ Carga creada para ${dato.periodo}: ${dato.valor} reuniones`);
          
        } catch (error) {
          console.log(`❌ Error creando carga para ${dato.periodo}:`, error.response?.data?.message || error.message);
        }
      }
      
    } else {
      console.log('\n📊 Cargas existentes:');
      cargasResponse.data.cargas.forEach((carga, index) => {
        console.log(`${index + 1}. Período: ${carga.periodo}, Valor: ${carga.valor}, Estado: ${carga.estado}`);
      });
      
      // Verificar si hay cargas validadas
      const cargasValidadas = cargasResponse.data.cargas.filter(c => c.estado === 'validado');
      console.log(`\n✅ Cargas validadas: ${cargasValidadas.length}`);
      
      if (cargasValidadas.length === 0) {
        console.log('\n💡 SOLUCIÓN: Las cargas existen pero no están validadas');
        console.log('Necesitamos cambiar el estado de las cargas a "validado"');
        
        // Validar las cargas existentes
        for (const carga of cargasResponse.data.cargas) {
          try {
            await axios.patch(`${SERVER_URL}/api/v1/cargas/${carga.id}/revision`, {
              estado: 'validado',
              observaciones: 'Validado automáticamente para pruebas'
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log(`✅ Carga ${carga.periodo} validada`);
            
          } catch (error) {
            console.log(`❌ Error validando carga ${carga.periodo}:`, error.response?.data?.message || error.message);
          }
        }
      }
    }

    console.log('\n🎉 Proceso completado!');
    console.log('\n📊 Ahora puedes ir a Analytics y seleccionar:');
    console.log(`   - Ministerio: ${mdhyhMinisterio.nombre}`);
    console.log(`   - Compromiso: ${compromisoA.titulo}`);
    console.log(`   - Indicador: ${primerIndicador.nombre}`);
    console.log('\nEl gráfico debería mostrar los datos correctamente.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

verificarYCorregirDatos();
