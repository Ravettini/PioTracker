#!/usr/bin/env node

console.log('🚀 Iniciando deploy en Render...');

const { execSync } = require('child_process');

try {
  console.log('📦 Construyendo aplicación...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('🔄 Ejecutando migraciones...');
  execSync('npm run orm:migrate', { stdio: 'inherit' });
  
  console.log('✅ Deploy completado exitosamente');
} catch (error) {
  console.error('❌ Error durante el deploy:', error.message);
  process.exit(1);
}
