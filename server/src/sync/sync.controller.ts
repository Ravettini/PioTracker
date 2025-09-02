import {
  Controller,
  Post,
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
  constructor(private readonly syncService: SyncService) {}

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
}





