const fs = require('fs');
const FormData = require('form-data');
const https = require('https');
const http = require('http');

console.log('🚀 Iniciando importación del archivo Excel...');

async function importExcel() {
  try {
    // Verificar que el archivo existe
    const filePath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    if (!fs.existsSync(filePath)) {
      console.error('❌ No se encontró el archivo Excel');
      return;
    }

    console.log('✅ Archivo Excel encontrado');
    console.log('📁 Ruta:', filePath);
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 Tamaño del archivo:', (fileBuffer.length / 1024).toFixed(2), 'KB');

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log('🔄 Enviando archivo a la API...');

    // Función para hacer la petición HTTP
    const makeRequest = () => {
      return new Promise((resolve, reject) => {
        const url = 'http://localhost:3001/api/v1/sync/import-excel';
        const urlObj = new URL(url);
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname,
          method: 'POST',
          headers: formData.getHeaders()
        };

        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve({ status: res.statusCode, data: result });
            } catch (error) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        // Enviar el FormData
        formData.pipe(req);
      });
    };

    const response = await makeRequest();
    
    if (response.status >= 400) {
      console.error('❌ Error en la API:', response.status);
      console.error('Detalles:', response.data);
      return;
    }

    const result = response.data;
    
    if (result.success) {
      console.log('🎉 Importación exitosa!');
      console.log('📊 Resumen:');
      console.log(`   - Ministerios creados: ${result.data.ministeriosCreados}`);
      console.log(`   - Compromisos creados: ${result.data.lineasCreadas}`);
      console.log(`   - Indicadores creados: ${result.data.indicadoresCreados}`);
      console.log(`   - Cargas creadas: ${result.data.cargasCreadas}`);
      
      if (result.data.errores && result.data.errores.length > 0) {
        console.log('⚠️ Errores encontrados:');
        result.data.errores.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.error('❌ La API reportó un error:', result.message);
    }

  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el backend esté ejecutándose en http://localhost:3001');
    }
  }
}

// Ejecutar la importación
importExcel();
