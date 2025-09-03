import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private auth: any;
  private sheets: any;

  constructor(private configService: ConfigService) {
    this.initializeGoogleAuth();
  }

  private async initializeGoogleAuth() {
    try {
      const clientId = this.configService.get('google.oauth.clientId');
      const clientSecret = this.configService.get('google.oauth.clientSecret');
      const refreshToken = this.configService.get('google.refreshToken');

      if (!clientId || !clientSecret || !refreshToken) {
        this.logger.warn('Credenciales de Google OAuth no configuradas');
        return;
      }

      this.auth = new google.auth.OAuth2(clientId, clientSecret);
      this.auth.setCredentials({
        refresh_token: refreshToken,
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      this.logger.log('Google Sheets autenticado exitosamente');
    } catch (error) {
      this.logger.error('Error al inicializar Google Auth:', error);
    }
  }

  async upsertFactRow(payload: any, sheetName?: string): Promise<{ success: boolean; message: string; range?: string }> {
    try {
      if (!this.sheets) {
        throw new BadRequestException('Google Sheets no está configurado');
      }

      const sheetId = this.configService.get('google.sheetId');
      const sheetTab = sheetName || this.configService.get('google.sheetTab') || 'fact_indicadores';

      // Buscar si ya existe una fila con la misma combinación
      const searchQuery = `"${payload.indicador_id}" "${payload.periodo}" "${payload.ministerio_id}"`;
      const searchResult = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetTab}!A:F`,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });

      const values = searchResult.data.values || [];
      let rowIndex = -1;

      // Buscar fila existente
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === payload.indicador_id && 
            values[i][2] === payload.periodo && 
            values[i][5] === payload.ministerio_id) {
          rowIndex = i + 1; // +1 porque las filas de Google Sheets empiezan en 1
          break;
        }
      }

      // Calcular campos adicionales para Power BI
      const periodo = payload.periodo;
      const [year, month] = periodo.split('-');
      const porcentajeCumplimiento = payload.meta && payload.valor ? 
        Math.round((payload.valor / payload.meta) * 100 * 100) / 100 : null;

      const rowData = [
        payload.indicador_id,
        payload.indicador_nombre,
        payload.periodo,
        year,
        month,
        payload.ministerio_id,
        payload.ministerio_nombre,
        payload.linea_id,
        payload.linea_titulo,
        payload.valor,
        payload.unidad,
        payload.meta || '',
        porcentajeCumplimiento || '',
        payload.fuente,
        payload.responsable_nombre,
        payload.responsable_email,
        payload.observaciones || '',
        payload.estado,
        payload.publicado ? 'Sí' : 'No',
        payload.creado_en,
        payload.actualizado_en,
        payload.periodicidad,
        new Date().toISOString().split('T')[0], // Fecha de carga
        payload.usuario_creador || '',
      ];

      if (rowIndex > 0) {
        // Actualizar fila existente
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${sheetTab}!A${rowIndex}:X${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowData],
          },
        });

        this.logger.log(`Fila actualizada en ${sheetTab}:${rowIndex}`);
        return {
          success: true,
          message: 'Fila actualizada exitosamente',
          range: `${sheetTab}:${rowIndex}`,
        };
      } else {
        // Insertar nueva fila
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: `${sheetTab}!A:X`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [rowData],
          },
        });

        this.logger.log(`Nueva fila insertada en ${sheetTab}`);
        return {
          success: true,
          message: 'Nueva fila insertada exitosamente',
        };
      }
    } catch (error) {
      this.logger.error('Error en upsertFactRow:', error);
      throw new BadRequestException(`Error al sincronizar con Google Sheets: ${error.message}`);
    }
  }

  async publishCarga(cargaId: string, cargaData: any): Promise<{ success: boolean; message: string }> {
    this.logger.log(`🚀 INICIO: Publicando carga ${cargaId} en Google Sheets`);
    this.logger.log(`📋 Datos de carga:`, {
      ministerio: cargaData.ministerio?.nombre,
      linea: cargaData.linea?.titulo,
      indicador: cargaData.indicador?.nombre,
      estado: cargaData.estado
    });
    
    try {
      // Usar el nombre del ministerio como nombre de la hoja
      const ministerioSheetName = this.sanitizeSheetName(cargaData.ministerio.nombre);
      this.logger.log(`📊 Nombre de hoja sanitizado: "${ministerioSheetName}"`);
      
      // Crear o usar la hoja del ministerio
      this.logger.log(`🔧 Verificando/creando hoja "${ministerioSheetName}"`);
      await this.ensureSheetExists(ministerioSheetName);
      
      // Preparar los datos en el formato correcto para la hoja
      const rowData = [
        cargaData.indicador.id,                    // A: Indicador ID
        cargaData.indicador.nombre,                // B: Indicador Nombre
        cargaData.periodo,                        // C: Período
        cargaData.ministerio.id,                   // D: Ministerio ID
        cargaData.ministerio.nombre,               // E: Ministerio Nombre
        cargaData.linea.id,                        // F: Línea ID
        cargaData.linea.titulo,                    // G: Línea Título
        cargaData.valor,                           // H: Valor
        cargaData.unidad,                          // I: Unidad
        cargaData.meta || '',                      // J: Meta
        cargaData.fuente,                          // K: Fuente
        cargaData.responsableNombre,               // L: Responsable Nombre
        cargaData.responsableEmail,                // M: Responsable Email
        cargaData.observaciones || '',             // N: Observaciones
        cargaData.estado,                          // O: Estado
        cargaData.publicado ? 'Sí' : 'No',        // P: Publicado
        cargaData.creadoEn,                        // Q: Creado En
        cargaData.actualizadoEn,                   // R: Actualizado En
      ];

      this.logger.log(`📋 Datos preparados:`, rowData);

      // Buscar si ya existe una fila con la misma combinación
      const searchResult = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.configService.get('google.sheetId'),
        range: `${ministerioSheetName}!A:R`,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });

      const values = searchResult.data.values || [];
      let rowIndex = -1;

      // Buscar fila existente (Indicador ID, Período, Ministerio ID)
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === cargaData.indicador.id && 
            values[i][2] === cargaData.periodo && 
            values[i][3] === cargaData.ministerio.id) {
          rowIndex = i + 1; // +1 porque las filas de Google Sheets empiezan en 1
          break;
        }
      }

      if (rowIndex > 0) {
        // Actualizar fila existente
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.configService.get('google.sheetId'),
          range: `${ministerioSheetName}!A${rowIndex}:R${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowData],
          },
        });

        this.logger.log(`✅ Fila actualizada en ${ministerioSheetName}:${rowIndex}`);
      } else {
        // Insertar nueva fila
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.configService.get('google.sheetId'),
          range: `${ministerioSheetName}!A:R`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [rowData],
          },
        });

        this.logger.log(`✅ Nueva fila insertada en ${ministerioSheetName}`);
      }
      
      this.logger.log(`✅ Carga ${cargaId} publicada exitosamente en hoja "${ministerioSheetName}"`);
      return {
        success: true,
        message: `Carga publicada exitosamente en hoja "${ministerioSheetName}"`,
      };
    } catch (error) {
      this.logger.error(`❌ Error al publicar carga ${cargaId}:`, error);
      throw new BadRequestException(`Error al publicar carga: ${error.message}`);
    }
  }

  async getSheetStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      if (!this.sheets) {
        return {
          connected: false,
          message: 'Google Sheets no está configurado',
        };
      }

      const sheetId = this.configService.get('google.sheetId');
      const sheetTab = this.configService.get('google.sheetTab') || 'fact_indicadores';

      // Intentar leer una celda para verificar la conexión
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetTab}!A1`,
      });

      return {
        connected: true,
        message: 'Conectado exitosamente a Google Sheets',
      };
    } catch (error) {
      this.logger.error('Error al verificar estado de Google Sheets:', error);
      return {
        connected: false,
        message: `Error de conexión: ${error.message}`,
      };
    }
  }

  private sanitizeSheetName(name: string): string {
    // Limpiar el nombre para que sea válido como nombre de hoja en Google Sheets
    return name
      .replace(/[\[\]{}()*?|\\\/]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
      .substring(0, 31); // Google Sheets limita nombres a 31 caracteres
  }

  private async ensureSheetExists(sheetName: string): Promise<void> {
    try {
      const sheetId = this.configService.get('google.sheetId');
      
      // Obtener información del spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      // Verificar si la hoja ya existe
      const sheetExists = spreadsheet.data.sheets.some(
        (sheet: any) => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        // Crear nueva hoja
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });

        // Agregar encabezados a la nueva hoja
        const headers = [
          'Indicador ID',
          'Indicador Nombre',
          'Período',
          'Ministerio ID',
          'Ministerio Nombre',
          'Línea ID',
          'Línea Título',
          'Valor',
          'Unidad',
          'Meta',
          'Fuente',
          'Responsable Nombre',
          'Responsable Email',
          'Observaciones',
          'Estado',
          'Publicado',
          'Creado En',
          'Actualizado En',
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${sheetName}!A1:R1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });

        this.logger.log(`Hoja "${sheetName}" creada exitosamente`);
      }
    } catch (error) {
      this.logger.error(`Error al crear hoja "${sheetName}":`, error);
      throw new BadRequestException(`Error al crear hoja: ${error.message}`);
    }
  }
}








