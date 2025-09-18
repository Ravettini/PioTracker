const axios = require('axios');

// URL del servidor
const SERVER_URL = 'https://sigepi-backend.onrender.com';

async function crearDatosPruebaSimple() {
  try {
    console.log('🚀 Creando datos de prueba usando el endpoint existente...\n');

    // Usar el endpoint que ya sabemos que funciona
    console.log('📊 Ejecutando /load-complete-pio-data...');
    
    const response = await axios.post(`${SERVER_URL}/load-complete-pio-data`);
    
    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📊 Ahora puedes ir a Analytics y deberías ver datos en los gráficos.');
    console.log('Si aún no ves datos, puede ser que necesitemos crear datos específicos para MDHyH.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

crearDatosPruebaSimple();
