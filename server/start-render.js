#!/usr/bin/env node

console.log('🚀 Iniciando aplicación en Render...');

const { execSync, spawn } = require('child_process');

async function startApp() {
  try {
    console.log('🔄 Ejecutando migraciones...');
    execSync('npm run orm:migrate', { stdio: 'inherit' });
    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error) {
    console.log('⚠️ Error en migraciones (continuando):', error.message);
    // Continuar aunque falle la migración
  }

  console.log('🚀 Iniciando aplicación...');
  
  // Iniciar la aplicación
  const app = spawn('node', ['dist/main'], {
    stdio: 'inherit',
    env: process.env
  });

  app.on('error', (error) => {
    console.error('❌ Error iniciando aplicación:', error);
    process.exit(1);
  });

  app.on('exit', (code) => {
    console.log(`📊 Aplicación terminó con código: ${code}`);
    process.exit(code);
  });
}

startApp();
