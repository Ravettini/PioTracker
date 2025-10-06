import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SyncService } from './sync.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
  ) {}

  @Post('import-excel')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      const result = await this.syncService.importExcelFile(file);
      
      return res.json({
        success: true,
        data: result,
        message: 'Archivo Excel importado correctamente',
      });
    } catch (error) {
      console.error('Error importando Excel:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al importar el archivo Excel',
      });
    }
  }

  @Post('sync-to-sheets')
  @Public()
  @HttpCode(HttpStatus.OK)
  async syncToSheets(@Res() res: Response) {
    try {
      const result = await this.syncService.syncToGoogleSheets();
      
      return res.json({
        success: true,
        data: result,
        message: 'Sincronización con Google Sheets completada',
      });
    } catch (error) {
      console.error('Error en sincronización:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error en la sincronización',
      });
    }
  }

  @Get('test-google-sheets')
  @Public()
  async testGoogleSheets() {
    try {
      const result = await this.syncService.testGoogleSheetsConnection();
      return {
        status: 'OK',
        message: 'Conexión con Google Sheets exitosa',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: 'Error en conexión con Google Sheets',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('fix-headers')
  @Public()
  async fixHeaders() {
    try {
      const result = await this.syncService.actualizarHeadersTodasLasHojas();
      return {
        status: 'OK',
        message: 'Headers actualizados correctamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error actualizando headers:', error);
      return {
        status: 'ERROR',
        message: error.message || 'Error actualizando headers',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health-check')
  @Public()
  async healthCheck() {
    try {
      // Verificar configuración básica
      const config = {
        hasSheetId: !!process.env.GOOGLE_SHEET_ID,
        hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
        hasClientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      };

      const isConfigured = config.hasSheetId && (
        (config.hasRefreshToken && config.hasClientId && config.hasClientSecret) ||
        config.hasServiceAccount
      );

      if (!isConfigured) {
        return {
          status: 'ERROR',
          message: 'Configuración de Google Sheets incompleta',
          config,
          timestamp: new Date().toISOString(),
        };
      }

      // Intentar conexión real
      const connectionResult = await this.syncService.testGoogleSheetsConnection();
      
      return {
        status: 'OK',
        message: 'Google Sheets está funcionando correctamente',
        config,
        connection: connectionResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error en health check de Google Sheets:', error);
      return {
        status: 'ERROR',
        message: error.message || 'Error en health check de Google Sheets',
        timestamp: new Date().toISOString(),
      };
    }
  }
}





