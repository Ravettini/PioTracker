const fs = require('fs');
const FormData = require('form-data');

console.log('🚀 Iniciando importación del archivo Excel...');

async function importExcel() {
  try {
    const filePath = 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx';
    if (!fs.existsSync(filePath)) {
      console.error('❌ No se encontró el archivo Excel');
      return;
    }

    console.log('✅ Archivo Excel encontrado');
    console.log('📁 Ruta:', filePath);
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 Tamaño del archivo:', (fileBuffer.length / 1024).toFixed(2), 'KB');

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log('🔄 Enviando archivo a la API...');

    // Usar fetch nativo (disponible en Node.js 18+)
    const response = await fetch('http://localhost:3001/api/v1/sync/import-excel', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('❌ Error en la API:', response.status);
      const errorText = await response.text();
      console.error('Detalles:', errorText);
      return;
    }

    const result = await response.json();
    
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

importExcel();


