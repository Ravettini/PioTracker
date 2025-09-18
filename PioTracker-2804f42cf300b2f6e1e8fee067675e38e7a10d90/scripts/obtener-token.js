// Configuración
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Función para obtener token de autenticación
async function obtenerToken() {
  try {
    console.log('🔐 Obteniendo token de autenticación...');
    
    // Primero, intentar obtener un usuario admin existente
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@pio.gob.ar',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token obtenido exitosamente');
      console.log(`🔑 Token: ${data.access_token}`);
      return data.access_token;
    } else {
      console.log('❌ No se pudo obtener token automáticamente');
      console.log('📝 Por favor, sigue estos pasos:');
      console.log('1. Ve a http://localhost:3000/login');
      console.log('2. Inicia sesión con tus credenciales');
      console.log('3. Abre las herramientas de desarrollador (F12)');
      console.log('4. Ve a la pestaña Network');
      console.log('5. Busca una petición a /auth/login');
      console.log('6. Copia el token del campo "access_token"');
      console.log('7. Reemplázalo en el archivo carga-masiva.js');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    return null;
  }
}

// Función para probar la conexión
async function probarConexion(token) {
  try {
    console.log('\n🔍 Probando conexión con la API...');
    
    const response = await fetch(`${API_BASE_URL}/catalogos/ministerios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const ministerios = await response.json();
      console.log('✅ Conexión exitosa');
      console.log(`📊 Se encontraron ${ministerios.length} ministerios`);
      return true;
    } else {
      console.log('❌ Error de conexión:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Configurando carga masiva...\n');
  
  const token = await obtenerToken();
  
  if (token) {
    const conexionOk = await probarConexion(token);
    
    if (conexionOk) {
      console.log('\n✅ ¡Todo listo!');
      console.log('📝 Ahora puedes:');
      console.log('1. Crear tu archivo cargas.txt con el formato correcto');
      console.log('2. Reemplazar el AUTH_TOKEN en carga-masiva.js con el token obtenido');
      console.log('3. Ejecutar: node carga-masiva.js');
    } else {
      console.log('\n❌ No se pudo conectar con la API');
      console.log('🔧 Verifica que el backend esté ejecutándose en http://localhost:3001');
    }
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { obtenerToken, probarConexion };
