const axios = require('axios');

// URL del servidor
const SERVER_URL = 'https://sigepi-backend.onrender.com';

async function crearDatosPruebaMDHyH() {
  try {
    console.log('🚀 Creando datos de prueba para MDHyH...\n');

    // 1. Primero, obtener el token de autenticación
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${SERVER_URL}/api/v1/auth/login`, {
      email: 'admin@pio.local',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente');

    // 2. Crear datos específicos para MDHyH
    console.log('\n📊 Creando cargas de prueba para MDHyH...');
    
    // Datos de prueba para el primer indicador de MDHyH
    const datosPrueba = [
      {
        periodo: '2024-01',
        valor: 15,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Enero 2024'
      },
      {
        periodo: '2024-02',
        valor: 18,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Febrero 2024'
      },
      {
        periodo: '2024-03',
        valor: 22,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Marzo 2024'
      },
      {
        periodo: '2024-04',
        valor: 19,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Abril 2024'
      },
      {
        periodo: '2024-05',
        valor: 25,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Mayo 2024'
      },
      {
        periodo: '2024-06',
        valor: 23,
        meta: 20,
        unidad: 'reuniones',
        fuente: 'Registro interno',
        responsable_nombre: 'Sistema Automático',
        responsable_email: 'sistema@pio.gob.ar',
        observaciones: 'Datos de prueba - Junio 2024'
      }
    ];

    // 3. Primero necesitamos obtener los IDs de MDHyH
    console.log('\n🔍 Obteniendo información de MDHyH...');
    
    // Obtener ministerios
    const ministeriosResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/ministerios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mdhyhMinisterio = ministeriosResponse.data.data.find(m => 
      m.nombre.includes('MDHyH') || m.nombre.includes('Desarrollo Humano')
    );
    
    if (!mdhyhMinisterio) {
      console.log('❌ No se encontró MDHyH en los ministerios');
      return;
    }
    
    console.log(`✅ MDHyH encontrado: ${mdhyhMinisterio.nombre} (ID: ${mdhyhMinisterio.id})`);

    // Obtener compromisos de MDHyH
    const compromisosResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/lineas?ministerioId=${mdhyhMinisterio.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const compromisoA = compromisosResponse.data.data.find(c => 
      c.titulo.includes('A)') || c.titulo.includes('Sistematizar')
    );
    
    if (!compromisoA) {
      console.log('❌ No se encontró el Compromiso A');
      return;
    }
    
    console.log(`✅ Compromiso A encontrado: ${compromisoA.titulo} (ID: ${compromisoA.id})`);

    // Obtener indicadores del Compromiso A
    const indicadoresResponse = await axios.get(`${SERVER_URL}/api/v1/catalogos/indicadores?lineaId=${compromisoA.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!indicadoresResponse.data.data || indicadoresResponse.data.data.length === 0) {
      console.log('❌ No se encontraron indicadores para el Compromiso A');
      return;
    }
    
    const primerIndicador = indicadoresResponse.data.data[0];
    console.log(`✅ Primer indicador encontrado: ${primerIndicador.nombre} (ID: ${primerIndicador.id})`);

    // 4. Crear las cargas de prueba
    console.log('\n📝 Creando cargas de prueba...');
    
    let cargasCreadas = 0;
    for (const dato of datosPrueba) {
      try {
        const cargaData = {
          ministerioId: mdhyhMinisterio.id,
          lineaId: compromisoA.id,
          indicadorId: primerIndicador.id,
          periodicidad: 'mensual',
          periodo: dato.periodo,
          valor: dato.valor,
          unidad: dato.unidad,
          meta: dato.meta,
          fuente: dato.fuente,
          responsableNombre: dato.responsable_nombre,
          responsableEmail: dato.responsable_email,
          observaciones: dato.observaciones,
          estado: 'validado',
          publicado: true
        };

        const response = await axios.post(`${SERVER_URL}/api/v1/cargas`, cargaData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`✅ Carga creada para ${dato.periodo}: ${dato.valor} ${dato.unidad}`);
        cargasCreadas++;
        
      } catch (error) {
        console.log(`❌ Error creando carga para ${dato.periodo}:`, error.response?.data?.message || error.message);
      }
    }

    console.log(`\n🎉 Proceso completado! Se crearon ${cargasCreadas} cargas de prueba`);
    console.log('\n📊 Ahora puedes ir a Analytics y seleccionar:');
    console.log(`   - Ministerio: ${mdhyhMinisterio.nombre}`);
    console.log(`   - Compromiso: ${compromisoA.titulo}`);
    console.log(`   - Indicador: ${primerIndicador.nombre}`);
    console.log('\nEl gráfico debería mostrar los datos de prueba que acabamos de crear.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

crearDatosPruebaMDHyH();
