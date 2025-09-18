const { DataSource } = require('typeorm');
const path = require('path');

// Configuración para producción usando DATABASE_URL
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'dist/db/entities/*.js')],
  migrations: [path.join(__dirname, 'dist/db/migrations/*.js')],
});

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migraciones...');
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');
    
    const migrations = await dataSource.runMigrations();
    console.log(`✅ ${migrations.length} migraciones ejecutadas:`, migrations.map(m => m.name));
    
    await dataSource.destroy();
    console.log('🎉 Migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();
