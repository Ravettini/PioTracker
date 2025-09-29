import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleAuthService } from './google-auth.service';

@Injectable()
export class TokenRenewalCron {
  private readonly logger = new Logger(TokenRenewalCron.name);

  constructor(private readonly googleAuthService: GoogleAuthService) {}

  /**
   * Verifica y renueva el token de Google Sheets cada día a las 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleTokenRenewal() {
    this.logger.log('🔄 Iniciando verificación automática de token de Google Sheets...');
    
    try {
      const renovado = await this.googleAuthService.renovarTokenSiEsNecesario();
      
      if (renovado) {
        this.logger.log('✅ Token de Google Sheets verificado/renovado exitosamente');
      } else {
        this.logger.warn('⚠️ No se pudo renovar el token automáticamente');
      }
    } catch (error) {
      this.logger.error(`❌ Error en verificación automática de token: ${error.message}`);
    }
  }

  /**
   * Verificación adicional cada 6 horas para tokens próximos a expirar
   */
  @Cron('0 */6 * * *') // Cada 6 horas
  async handleTokenCheck() {
    this.logger.log('🔍 Verificación periódica de token de Google Sheets...');
    
    try {
      await this.googleAuthService.renovarTokenSiEsNecesario();
    } catch (error) {
      this.logger.error(`❌ Error en verificación periódica: ${error.message}`);
    }
  }
}
