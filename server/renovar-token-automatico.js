#!/usr/bin/env node

/**
 * Script para renovar automáticamente el token de Google Sheets
 * Se ejecuta cada 5 meses para renovar el refresh token
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function verificarTokenExpirado() {
  try {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const tokenCreatedMatch = envContent.match(/GOOGLE_TOKEN_CREATED=(\d+)/);
    
    if (!tokenCreatedMatch) {
      log('⚠️ No se encontró fecha de creación del token');
      return true; // Asumir que está expirado
    }

    const tokenCreated = parseInt(tokenCreatedMatch[1]);
    const now = Date.now();
    const daysSinceCreated = Math.floor((now - tokenCreated) / (1000 * 60 * 60 * 24));
    
    log(`📅 Token creado hace ${daysSinceCreated} días`);
    
    // Renovar si tiene más de 150 días (5 meses)
    return daysSinceCreated > 150;
  } catch (error) {
    log(`❌ Error verificando token: ${error.message}`);
    return true;
  }
}

function renovarToken() {
  try {
    log('🔄 Renovando token de Google Sheets...');
    
    // Ejecutar el script de renovación
    const result = execSync('node get-google-token.js', { 
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log('✅ Token renovado exitosamente');
    log(result);
    
    // Actualizar fecha de creación
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const timestamp = Date.now().toString();
    const updatedContent = envContent.replace(
      /GOOGLE_TOKEN_CREATED=\d+/,
      `GOOGLE_TOKEN_CREATED=${timestamp}`
    ) + (envContent.includes('GOOGLE_TOKEN_CREATED') ? '' : `\nGOOGLE_TOKEN_CREATED=${timestamp}`);
    
    fs.writeFileSync(ENV_PATH, updatedContent);
    log('✅ Fecha de creación actualizada');
    
  } catch (error) {
    log(`❌ Error renovando token: ${error.message}`);
    log('💡 Ejecuta manualmente: node get-google-token.js');
  }
}

function main() {
  log('🚀 Verificando estado del token de Google Sheets...');
  
  if (verificarTokenExpirado()) {
    log('⚠️ Token próximo a expirar o expirado. Renovando...');
    renovarToken();
  } else {
    log('✅ Token válido. No se requiere renovación.');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { verificarTokenExpirado, renovarToken };
