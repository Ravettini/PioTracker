const fs = require('fs');
const http = require('http');

console.log('🚀 Iniciando importación del archivo Excel...');

async function importExcel() {
  try {
    const filePath = '../Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    if (!fs.existsSync(filePath)) {
      console.error('❌ No se encontró el archivo Excel');
      return;
    }

    console.log('✅ Archivo Excel encontrado');
    console.log('📁 Ruta:', filePath);
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 Tamaño del archivo:', (fileBuffer.length / 1024).toFixed(2), 'KB');

    console.log('🔄 Enviando archivo a la API...');

    // Crear boundary para multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 8);
    
    // Construir el body multipart
    let body = '';
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="excel-file.xlsx"\r\n';
    body += 'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n';
    
    // Convertir el buffer a string (esto puede no funcionar bien para archivos binarios)
    const fileString = fileBuffer.toString('binary');
    body += fileString;
    body += `\r\n--${boundary}--\r\n`;

    // Opciones para la petición HTTP
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/sync/import-excel',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    // Hacer la petición
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
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
          console.log('Respuesta de la API:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error durante la importación:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Asegúrate de que el backend esté ejecutándose en http://localhost:3001');
      }
    });

    // Enviar el body
    req.write(body);
    req.end();

  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
  }
}

importExcel();


