const { DataSource } = require('typeorm');
const path = require('path');

console.log('🔄 ===== EJECUTANDO MIGRACIONES MANUALMENTE =====');
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NO CONFIGURADO');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'dist/db/entities/*.js')],
  migrations: [path.join(__dirname, 'dist/db/migrations/*.js')],
  migrationsTableName: 'migrations',
});

async function runMigrations() {
  try {
    console.log('🔄 Inicializando conexión...');
    await dataSource.initialize();
    console.log('✅ Conexión establecida');

    console.log('🔄 Verificando migraciones pendientes...');
    const pendingMigrations = await dataSource.showMigrations();
    console.log('🔍 Migraciones pendientes:', pendingMigrations);

    console.log('🔄 Ejecutando migraciones...');
    const migrations = await dataSource.runMigrations();
    console.log(`✅ ${migrations.length} migraciones ejecutadas:`);
    migrations.forEach((migration, index) => {
      console.log(`   ${index + 1}. ${migration.name}`);
    });

    await dataSource.destroy();
    console.log('🎉 ===== MIGRACIONES COMPLETADAS =====');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

runMigrations();
