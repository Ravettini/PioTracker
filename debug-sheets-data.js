const axios = require('axios');

async function debugSheetsData() {
  try {
    console.log('🔍 Debugging Google Sheets data...');
    
    // Primero hacer login
    const loginResponse = await axios.post('http://localhost:8080/api/v1/auth/login', {
      email: 'admin@pio.local',
      password: 'Cambiar.123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login exitoso');
    
    // Buscar el indicador específico de MDHyH
    const ministeriosResponse = await axios.get('http://localhost:8080/api/v1/analytics/ministerios', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const mdhyh = ministeriosResponse.data.data.find(m => m.nombre === 'MDHyH');
    console.log('🏛️ MDHyH encontrado:', mdhyh?.id);
    
    if (!mdhyh) {
      console.log('❌ MDHyH no encontrado');
      return;
    }
    
    // Obtener compromisos de MDHyH
    const compromisosResponse = await axios.get(`http://localhost:8080/api/v1/analytics/compromisos/${mdhyh.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Compromisos encontrados:', compromisosResponse.data.data.length);
    
    // Buscar el compromiso A
    const compromisoA = compromisosResponse.data.data.find(c => c.titulo.includes('A)'));
    console.log('🎯 Compromiso A encontrado:', compromisoA?.id, compromisoA?.titulo);
    
    if (!compromisoA) {
      console.log('❌ Compromiso A no encontrado');
      return;
    }
    
    // Obtener indicadores del compromiso A
    const indicadoresResponse = await axios.get(`http://localhost:8080/api/v1/analytics/indicadores/${compromisoA.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 Indicadores encontrados:', indicadoresResponse.data.data.length);
    
    // Buscar el indicador de llamadas al 144
    const indicadorLlamadas = indicadoresResponse.data.data.find(i => 
      i.nombre.toLowerCase().includes('llamadas') && 
      i.nombre.toLowerCase().includes('144')
    );
    
    console.log('📞 Indicador de llamadas encontrado:', indicadorLlamadas?.id, indicadorLlamadas?.nombre);
    
    if (!indicadorLlamadas) {
      console.log('❌ Indicador de llamadas no encontrado');
      return;
    }
    
    // Obtener datos del indicador
    const datosResponse = await axios.get(`http://localhost:8080/api/v1/analytics/datos`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        indicadorId: indicadorLlamadas.id
      }
    });
    
    console.log('📈 Datos obtenidos:');
    console.log('Ministerio:', datosResponse.data.ministerio);
    console.log('Compromiso:', datosResponse.data.compromiso);
    console.log('Indicador:', datosResponse.data.indicador);
    console.log('Tipo:', datosResponse.data.tipo);
    console.log('Períodos:', datosResponse.data.datos.periodos);
    console.log('Valores:', datosResponse.data.datos.valores);
    console.log('Metas:', datosResponse.data.datos.metas);
    
    // Verificar datos específicos
    const periodos = datosResponse.data.datos.periodos;
    const valores = datosResponse.data.datos.valores;
    const metas = datosResponse.data.datos.metas;
    
    console.log('\n🔍 Análisis detallado:');
    for (let i = 0; i < periodos.length; i++) {
      console.log(`Período: ${periodos[i]}, Valor: ${valores[i]}, Meta: ${metas ? metas[i] : 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugSheetsData();
