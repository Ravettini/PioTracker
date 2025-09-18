import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly envPath = path.join(process.cwd(), '.env');

  constructor(private configService: ConfigService) {}

  /**
   * Renueva automáticamente el refresh token cuando está próximo a expirar
   */
  async renovarTokenSiEsNecesario(): Promise<boolean> {
    try {
      const refreshToken = this.configService.get('google.refreshToken');
      
      if (!refreshToken) {
        this.logger.warn('⚠️ No hay refresh token configurado');
        return false;
      }

      // Verificar si el token está próximo a expirar (menos de 30 días)
      const tokenInfo = await this.verificarTokenInfo(refreshToken);
      
      if (tokenInfo && tokenInfo.expiresIn < 30) {
        this.logger.warn(`🔄 Token expira en ${tokenInfo.expiresIn} días. Renovando automáticamente...`);
        return await this.renovarToken();
      }

      this.logger.log(`✅ Token válido por ${tokenInfo?.expiresIn || 'desconocido'} días`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error verificando token: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifica información del token sin hacer llamadas a Google
   */
  private async verificarTokenInfo(refreshToken: string): Promise<{ expiresIn: number } | null> {
    try {
      // Leer el archivo .env para obtener la fecha de creación del token
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const tokenCreatedMatch = envContent.match(/GOOGLE_TOKEN_CREATED=(\d+)/);
      
      if (!tokenCreatedMatch) {
        this.logger.warn('⚠️ No se encontró fecha de creación del token');
        return null;
      }

      const tokenCreated = parseInt(tokenCreatedMatch[1]);
      const now = Date.now();
      const daysSinceCreated = Math.floor((now - tokenCreated) / (1000 * 60 * 60 * 24));
      const daysRemaining = 180 - daysSinceCreated; // Refresh tokens duran ~6 meses

      return { expiresIn: Math.max(0, daysRemaining) };
    } catch (error) {
      this.logger.error(`❌ Error verificando token info: ${error.message}`);
      return null;
    }
  }

  /**
   * Renueva el refresh token usando el flujo OAuth2
   */
  private async renovarToken(): Promise<boolean> {
    try {
      this.logger.log('🔄 Iniciando renovación automática del token...');
      
      // Aquí implementarías la lógica de renovación
      // Por ahora, solo logueamos que necesitamos renovación manual
      this.logger.warn('⚠️ Renovación automática no implementada. Se requiere renovación manual.');
      this.logger.warn('💡 Ejecuta: node get-google-token.js');
      
      return false;
    } catch (error) {
      this.logger.error(`❌ Error renovando token: ${error.message}`);
      return false;
    }
  }

  /**
   * Guarda la fecha de creación del token en el .env
   */
  async guardarFechaCreacionToken(): Promise<void> {
    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const timestamp = Date.now().toString();
      
      // Agregar o actualizar la línea GOOGLE_TOKEN_CREATED
      const updatedContent = envContent.replace(
        /GOOGLE_TOKEN_CREATED=\d+/,
        `GOOGLE_TOKEN_CREATED=${timestamp}`
      ) + (envContent.includes('GOOGLE_TOKEN_CREATED') ? '' : `\nGOOGLE_TOKEN_CREATED=${timestamp}`);
      
      fs.writeFileSync(this.envPath, updatedContent);
      this.logger.log('✅ Fecha de creación del token guardada');
    } catch (error) {
      this.logger.error(`❌ Error guardando fecha de creación: ${error.message}`);
    }
  }
}
