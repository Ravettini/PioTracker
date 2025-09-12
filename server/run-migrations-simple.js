#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Ejecutando migraciones en Render...');

try {
  // Ejecutar migraciones usando TypeORM CLI
  console.log('📊 Ejecutando: npm run orm:migrate');
  execSync('npm run orm:migrate', { stdio: 'inherit' });
  console.log('✅ Migraciones ejecutadas correctamente');
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  process.exit(1);
}
