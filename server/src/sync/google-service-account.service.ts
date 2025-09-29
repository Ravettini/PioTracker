import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleServiceAccountService {
  private readonly logger = new Logger(GoogleServiceAccountService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Crea un cliente autenticado usando Service Account
   */
  async getAuthenticatedClient() {
    try {
      // Leer las credenciales del Service Account desde variables de entorno
      const serviceAccountCredentials = {
        type: 'service_account',
        project_id: this.configService.get('GOOGLE_SERVICE_ACCOUNT_PROJECT_ID'),
        private_key_id: this.configService.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID'),
        private_key: this.configService.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        client_email: this.configService.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL'),
        client_id: this.configService.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_ID'),
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: this.configService.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL'),
        universe_domain: 'googleapis.com'
      };

      // Verificar que todas las credenciales estén presentes
      if (!serviceAccountCredentials.private_key || !serviceAccountCredentials.client_email) {
        throw new Error('Credenciales del Service Account incompletas');
      }

      // Crear cliente autenticado
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountCredentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.readonly'
        ]
      });

      const authClient = await auth.getClient();
      this.logger.log('✅ Cliente Service Account autenticado exitosamente');
      
      return authClient;
    } catch (error) {
      this.logger.error(`❌ Error autenticando Service Account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una instancia de Google Sheets autenticada
   */
  async getSheetsClient() {
    const authClient = await this.getAuthenticatedClient();
    return google.sheets({ version: 'v4', auth: authClient });
  }

  /**
   * Obtiene una instancia de Google Drive autenticada
   */
  async getDriveClient() {
    const authClient = await this.getAuthenticatedClient();
    return google.drive({ version: 'v3', auth: authClient });
  }

  /**
   * Verifica que el Service Account tenga acceso a la hoja
   */
  async verificarAcceso(sheetId: string): Promise<boolean> {
    try {
      const sheets = await this.getSheetsClient();
      await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      this.logger.log('✅ Service Account tiene acceso a la hoja');
      return true;
    } catch (error) {
      this.logger.error(`❌ Service Account no tiene acceso a la hoja: ${error.message}`);
      return false;
    }
  }
}
