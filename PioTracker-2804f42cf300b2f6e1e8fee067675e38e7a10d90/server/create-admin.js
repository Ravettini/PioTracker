const { DataSource } = require('typeorm');
const path = require('path');
const bcrypt = require('bcrypt');

console.log('🔄 ===== CREANDO USUARIO ADMINISTRADOR =====');

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'dist/db/entities/*.js')],
});

async function createAdmin() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión establecida');

    // Verificar si ya existe el usuario admin
    const existingAdmin = await dataSource.query(`
      SELECT id FROM usuarios WHERE email = 'admin@pio.local'
    `);

    if (existingAdmin.length > 0) {
      console.log('⚠️ Usuario admin ya existe, actualizando contraseña...');
      
      // Actualizar contraseña del admin existente
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dataSource.query(`
        UPDATE usuarios 
        SET hash_clave = $1, clave_temporal = false, intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE email = 'admin@pio.local'
      `, [hashedPassword]);
      
      console.log('✅ Contraseña del admin actualizada');
    } else {
      console.log('🔄 Creando usuario administrador...');
      
      // Crear usuario administrador
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await dataSource.query(`
        INSERT INTO usuarios (
          email, hash_clave, nombre, rol, clave_temporal, 
          intentos_fallidos, bloqueado_hasta, activo, 
          fecha_creacion, ultimo_login
        ) VALUES (
          'admin@pio.local', $1, 'Administrador', 'ADMIN', false,
          0, NULL, true,
          NOW(), NULL
        )
      `, [hashedPassword]);
      
      console.log('✅ Usuario administrador creado');
    }

    await dataSource.destroy();
    console.log('🎉 ===== USUARIO ADMIN CREADO EXITOSAMENTE =====');
    console.log('📧 Email: admin@pio.local');
    console.log('🔑 Contraseña: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

createAdmin();
