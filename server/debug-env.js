#!/usr/bin/env node

console.log('🔍 Debugging variables de entorno en Render...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_USERNAME:', process.env.DATABASE_USERNAME);
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);

// Mostrar todas las variables que contengan DATABASE
console.log('\n📊 Todas las variables DATABASE:');
Object.keys(process.env)
  .filter(key => key.includes('DATABASE') || key.includes('DB'))
  .forEach(key => {
    const value = key.includes('PASSWORD') ? '***HIDDEN***' : process.env[key];
    console.log(`${key}: ${value}`);
  });

// Mostrar variables de Render específicas
console.log('\n🏗️ Variables de Render:');
Object.keys(process.env)
  .filter(key => key.includes('RENDER') || key.includes('POSTGRES'))
  .forEach(key => {
    const value = key.includes('PASSWORD') ? '***HIDDEN***' : process.env[key];
    console.log(`${key}: ${value}`);
  });
