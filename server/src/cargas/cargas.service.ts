import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Carga, EstadoCarga } from '../db/entities/carga.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';
import { RevisionDto } from './dto/revision.dto';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class CargasService {
  private readonly logger = new Logger(CargasService.name);

  constructor(
    @InjectRepository(Carga)
    private cargaRepository: Repository<Carga>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Indicador)
    private indicadorRepository: Repository<Indicador>,
    private syncService: SyncService,
    private configService: ConfigService,
  ) {}

  async create(createCargaDto: CreateCargaDto, userId: string): Promise<Carga> {
    // Verificar que el indicador existe y está activo
    const indicador = await this.indicadorRepository.findOne({
      where: { id: createCargaDto.indicadorId, activo: true },
      relations: ['linea', 'linea.ministerio'],
    });

    if (!indicador) {
      throw new NotFoundException('Indicador no encontrado');
    }

    // Verificar que el usuario tiene acceso al ministerio
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['ministerio'],
    });

    if (usuario.rol !== 'ADMIN' && usuario.ministerioId !== createCargaDto.ministerioId) {
      throw new ForbiddenException('No tienes permisos para crear cargas en este ministerio');
    }

    // Validar que el período sea consistente con la periodicidad del indicador
    this.validarPeriodoPeriodicidad(createCargaDto.periodo, indicador.periodicidad);

    // Verificar duplicados (solo para estados pendiente y validado)
    const duplicado = await this.cargaRepository.findOne({
      where: {
        indicadorId: createCargaDto.indicadorId,
        periodo: createCargaDto.periodo,
        ministerioId: createCargaDto.ministerioId,
        estado: EstadoCarga.PENDIENTE,
      },
    });

    if (duplicado) {
      throw new BadRequestException('Ya existe una carga pendiente para este indicador, período y ministerio');
    }



    // Crear la carga - va directo a PENDIENTE para revisión
    const carga = this.cargaRepository.create({
      ...createCargaDto,
      meta: createCargaDto.meta || null, // Asegurar que meta sea null si es undefined
      periodicidad: indicador.periodicidad,
      estado: EstadoCarga.PENDIENTE, // Cambio: va directo a PENDIENTE
      creadoPor: userId,
      actualizadoPor: userId,
    });

    const cargaGuardada = await this.cargaRepository.save(carga);

    return cargaGuardada;
  }

  async findAll(query: any, userId: string, userRol: string, userMinisterioId: string): Promise<{ cargas: Carga[]; total: number }> {
    const { ministerioId, indicadorId, periodo, estado, limit = 20, offset = 0 } = query;

    const whereConditions: FindOptionsWhere<Carga> = {};

    // Filtros de búsqueda
    if (ministerioId) {
      whereConditions.ministerioId = ministerioId;
    }

    if (indicadorId) {
      whereConditions.indicadorId = indicadorId;
    }

    if (periodo) {
      whereConditions.periodo = periodo;
    }

    if (estado) {
      whereConditions.estado = estado;
    }

    // Filtro por ministerio del usuario (si no es admin)
    // Los admins pueden ver todas las cargas
    if (userRol !== 'ADMIN') {
      whereConditions.ministerioId = userMinisterioId;
    }

    this.logger.log(`Buscando cargas con filtros:`, { 
      whereConditions, 
      userRol, 
      userMinisterioId, 
      limit, 
      offset 
    });

    const [cargas, total] = await this.cargaRepository.findAndCount({
      where: whereConditions,
      relations: ['ministerio', 'linea', 'indicador', 'creadoPorUsuario'],
      skip: offset,
      take: limit,
      order: { creadoEn: 'DESC' },
    });

    this.logger.log(`Encontradas ${cargas.length} cargas de ${total} total`);

    return { cargas, total };
  }

  async findOne(id: string, userId: string, userRol: string, userMinisterioId: string): Promise<Carga> {
    const carga = await this.cargaRepository.findOne({
      where: { id },
      relations: ['ministerio', 'linea', 'indicador', 'creadoPorUsuario', 'actualizadoPorUsuario'],
    });

    if (!carga) {
      throw new NotFoundException('Carga no encontrada');
    }

    // Verificar permisos
    if (userRol !== 'ADMIN' && carga.ministerioId !== userMinisterioId) {
      throw new ForbiddenException('No tienes permisos para ver esta carga');
    }

    return carga;
  }

  async update(id: string, updateCargaDto: UpdateCargaDto, userId: string, userRol: string, userMinisterioId: string): Promise<Carga> {
    const carga = await this.findOne(id, userId, userRol, userMinisterioId);

    // Solo se pueden editar borradores, o cargas pendientes si es admin
    if (carga.estado !== EstadoCarga.BORRADOR && 
        !(userRol === 'ADMIN' && carga.estado === EstadoCarga.PENDIENTE)) {
      throw new BadRequestException('Solo se pueden editar cargas en estado borrador, o cargas pendientes si eres administrador');
    }

    // Verificar que el usuario sea el creador o admin
    if (userRol !== 'ADMIN' && carga.creadoPor !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias cargas');
    }

    // Validar período si se está actualizando
    if (updateCargaDto.periodo) {
      const indicador = await this.indicadorRepository.findOne({
        where: { id: carga.indicadorId },
      });
      this.validarPeriodoPeriodicidad(updateCargaDto.periodo, indicador.periodicidad);
    }

    Object.assign(carga, updateCargaDto);
    // Asegurar que meta sea null si es undefined
    if (updateCargaDto.meta !== undefined) {
      carga.meta = updateCargaDto.meta || null;
    }
    carga.actualizadoPor = userId;
    carga.actualizadoEn = new Date();

    return await this.cargaRepository.save(carga);
  }

  async enviar(id: string, userId: string, userRol: string, userMinisterioId: string): Promise<Carga> {
    const carga = await this.findOne(id, userId, userRol, userMinisterioId);

    // Solo se pueden enviar borradores
    if (carga.estado !== EstadoCarga.BORRADOR) {
      throw new BadRequestException('Solo se pueden enviar cargas en estado borrador');
    }

    // Verificar que el usuario sea el creador o admin
    if (userRol !== 'ADMIN' && carga.creadoPor !== userId) {
      throw new ForbiddenException('Solo puedes enviar tus propias cargas');
    }

    // Cambiar estado a pendiente
    carga.estado = EstadoCarga.PENDIENTE;
    carga.actualizadoPor = userId;
    carga.actualizadoEn = new Date();

    // Guardar la carga
    const cargaGuardada = await this.cargaRepository.save(carga);

    return cargaGuardada;
  }

  async revisar(id: string, revisionDto: RevisionDto, userId: string, userRol: string): Promise<Carga> {
    this.logger.log(`🔍 INICIO: Revisión de carga ${id}:`, revisionDto);
    this.logger.log(`🔍 Usuario: ${userId}, Rol: ${userRol}`);
    
    // Solo admins pueden revisar
    if (userRol !== 'ADMIN') {
      this.logger.warn(`❌ Usuario ${userId} intentó revisar sin permisos de ADMIN`);
      throw new ForbiddenException('Solo los administradores pueden revisar cargas');
    }

    const carga = await this.cargaRepository.findOne({
      where: { id },
      relations: ['ministerio', 'linea', 'indicador'],
    });

    if (!carga) {
      this.logger.warn(`❌ Carga ${id} no encontrada`);
      throw new NotFoundException('Carga no encontrada');
    }

    this.logger.log(`📋 Carga encontrada: ${carga.id}, estado actual: ${carga.estado}`);
    this.logger.log(`📋 Ministerio: ${carga.ministerio?.nombre}, Línea: ${carga.linea?.titulo}`);

    // Solo se pueden revisar cargas pendientes
    if (carga.estado !== EstadoCarga.PENDIENTE) {
      this.logger.warn(`❌ Carga ${id} no está en estado PENDIENTE (actual: ${carga.estado})`);
      throw new BadRequestException('Solo se pueden revisar cargas en estado pendiente');
    }

    // Validar observaciones para estados observado y rechazado
    if ((revisionDto.estado === EstadoCarga.OBSERVADO || revisionDto.estado === EstadoCarga.RECHAZADO) && 
        !revisionDto.observaciones) {
      this.logger.warn(`❌ Observaciones requeridas para estado ${revisionDto.estado}`);
      throw new BadRequestException('Las observaciones son obligatorias para observaciones y rechazos');
    }

    this.logger.log(`✅ Validaciones pasadas, actualizando estado a: ${revisionDto.estado}`);

    // Actualizar estado
    carga.estado = revisionDto.estado;
    carga.observaciones = revisionDto.observaciones;
    carga.actualizadoPor = userId;
    carga.actualizadoEn = new Date();
    
    // Marcar como publicado si se valida
    if (revisionDto.estado === EstadoCarga.VALIDADO) {
      carga.publicado = true;
      this.logger.log(`✅ Carga ${id} marcada como publicada para sincronización`);
      
      // Sincronización automática con Google Sheets
      try {
        this.logger.log(`🔄 Iniciando sincronización automática para carga ${id}`);
        await this.syncService.upsertFactRow({
          indicadorId: carga.indicadorId,
          indicador: carga.indicador?.nombre || 'Indicador',
          periodo: carga.periodo,
          mes: carga.mes,
          ministerioId: carga.ministerioId,
          ministerio: carga.ministerio?.nombre || 'Ministerio',
          lineaId: carga.lineaId,
          linea: carga.linea?.titulo || 'Línea',
          valor: carga.valor,
          unidad: carga.unidad,
          meta: carga.meta,
          fuente: carga.fuente,
          responsableNombre: carga.responsableNombre,
          responsableEmail: carga.responsableEmail,
          observaciones: carga.observaciones
        });
        this.logger.log(`✅ Sincronización automática completada para carga ${id}`);
      } catch (syncError) {
        this.logger.error(`❌ Error en sincronización automática para carga ${id}:`, syncError);
        // No lanzar error para no interrumpir el proceso de validación
      }
    }

    const cargaActualizada = await this.cargaRepository.save(carga);
    this.logger.log(`✅ Carga ${id} actualizada a estado: ${cargaActualizada.estado}`);

    // Publicar en Google Sheets solo si se valida
    this.logger.log(`🏁 FIN: Revisión de carga ${id} completada`);
    return cargaActualizada;
  }

  async getDashboardStats(userId: string, userRol: string, userMinisterioId: string): Promise<any> {
    this.logger.log(`📊 Obteniendo estadísticas del dashboard para usuario ${userId} (rol: ${userRol})`);

    try {
      // Construir condiciones de filtro
      const whereConditions: any = {};
      
      // Filtro por ministerio del usuario (si no es admin)
      if (userRol !== 'ADMIN') {
        whereConditions.ministerioId = userMinisterioId;
      }

      // Filtrar solo cargas de 2024 para el dashboard
      whereConditions.periodo = '2024';

      // Obtener total de cargas
      const totalCargas = await this.cargaRepository.count({ where: whereConditions });

      // Obtener cargas por estado
      const cargasPendientes = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: EstadoCarga.PENDIENTE } 
      });

      const cargasValidadas = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: EstadoCarga.VALIDADO } 
      });

      const cargasObservadas = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: EstadoCarga.OBSERVADO } 
      });

      const cargasRechazadas = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: EstadoCarga.RECHAZADO } 
      });

      const cargasPublicadas = await this.cargaRepository.count({ 
        where: { ...whereConditions, publicado: true } 
      });

      const stats = {
        totalCargas,
        cargasPendientes,
        cargasValidadas,
        cargasObservadas,
        cargasRechazadas,
        cargasPublicadas,
      };

      this.logger.log(`📊 Estadísticas obtenidas:`, stats);
      return stats;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas:`, error);
      throw new BadRequestException('Error al obtener estadísticas del dashboard');
    }
  }

  async getDashboardStatsFromGoogleSheets(userId: string, userRol: string, userMinisterioId: string): Promise<any> {
    this.logger.log(`📊 Obteniendo estadísticas del dashboard desde Google Sheets para usuario ${userId} (rol: ${userRol})`);

    try {
      // Verificar configuración de Google Sheets
      const config = this.configService.get('google');
      if (!config.sheetId) {
        this.logger.warn('⚠️ GOOGLE_SHEET_ID no configurado. Usando base de datos local.');
        return this.getDashboardStats(userId, userRol, userMinisterioId);
      }

      // Obtener datos de Google Sheets
      const sheetData = await this.getDataFromGoogleSheets(userId, userRol, userMinisterioId);
      
      // Calcular estadísticas
      const totalCargas = sheetData.length;
      const cargasPendientes = sheetData.filter(row => row.estado === 'pendiente').length;
      const cargasValidadas = sheetData.filter(row => row.estado === 'validado').length;
      const cargasObservadas = sheetData.filter(row => row.estado === 'observado').length;
      const cargasRechazadas = sheetData.filter(row => row.estado === 'rechazado').length;
      const cargasPublicadas = sheetData.filter(row => row.publicado === true).length;

      const stats = {
        totalCargas,
        cargasPendientes,
        cargasValidadas,
        cargasObservadas,
        cargasRechazadas,
        cargasPublicadas,
        source: 'google-sheets'
      };

      this.logger.log(`📊 Estadísticas obtenidas desde Google Sheets:`, stats);
      return stats;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas desde Google Sheets:`, error);
      this.logger.warn('⚠️ Fallback a base de datos local debido a error en Google Sheets');
      return this.getDashboardStats(userId, userRol, userMinisterioId);
    }
  }

  private async getDataFromGoogleSheets(userId: string, userRol: string, userMinisterioId: string): Promise<any[]> {
    try {
      this.logger.log(`📊 Leyendo datos de Google Sheets para estadísticas del dashboard`);
      
      // Usar Service Account si está configurado, sino usar OAuth
      const config = this.configService.get('google');
      let sheets;
      
      if (config.serviceAccount?.clientEmail) {
        this.logger.log('🔑 Usando Service Account para estadísticas');
        const { GoogleServiceAccountService } = await import('../sync/google-service-account.service');
        const serviceAccountService = new GoogleServiceAccountService(this.configService);
        sheets = await serviceAccountService.getSheetsClient();
      } else if (config.refreshToken) {
        this.logger.log('🔑 Usando OAuth para estadísticas');
        const { google } = require('googleapis');
        const oauth2Client = new google.auth.OAuth2(
          config.oauth.clientId,
          config.oauth.clientSecret,
          config.oauth.authUri
        );
        
        oauth2Client.setCredentials({
          refresh_token: config.refreshToken
        });
        
        sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      } else {
        this.logger.warn('⚠️ No hay credenciales de Google configuradas para estadísticas');
        return [];
      }
      
      // Obtener todas las hojas del spreadsheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.sheetId,
      });
      
      const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
      this.logger.log(`📋 Hojas encontradas: ${sheetNames.join(', ')}`);
      
      let allData = [];
      
      // Leer datos de todas las hojas de ministerios
      for (const sheetName of sheetNames) {
        if (sheetName.includes('Ministerio') || sheetName.includes('Educacion') || sheetName.includes('Salud') || sheetName.includes('Justicia')) {
          this.logger.log(`🏛️ Leyendo datos de hoja: ${sheetName}`);
          
          try {
            const range = `${sheetName}!A:S`;
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: config.sheetId,
              range: range,
            });
            
            const rows = response.data.values || [];
            if (rows.length <= 1) continue; // Saltar si no hay datos
            
            const headers = rows[0];
            
            // Procesar filas de datos
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row.length < 10) continue; // Asegurar que la fila tenga suficientes columnas
              
              // Filtrar por ministerio del usuario si no es admin
              if (userRol !== 'ADMIN') {
                const ministerioEnRow = row[4]; // Columna E: Ministerio ID (nueva posición)
                if (ministerioEnRow !== userMinisterioId) continue;
              }
              
              const estado = row[15] || 'pendiente'; // Columna P: Estado (nueva posición)
              const publicado = row[16] === 'Sí'; // Columna Q: Publicado (nueva posición)
              const periodo = row[2]; // Columna C: Período
              
              // Filtrar solo cargas de 2024 para el dashboard
              if (periodo !== '2024') continue;
              
              allData.push({
                estado,
                publicado,
                periodo,
                ministerio: row[4], // Columna E: Ministerio ID (nueva posición)
                indicador: row[1], // Columna B: Indicador Nombre
                valor: row[8], // Columna I: Valor (nueva posición)
                meta: row[10], // Columna K: Meta (nueva posición)
                fuente: row[11] || 'Google Sheets', // Columna L: Fuente (nueva posición)
                responsable: row[12] || 'Sistema', // Columna M: Responsable (nueva posición)
                creadoEn: row[17] ? new Date(row[17]) : new Date(), // Columna R: Creado En (nueva posición)
                actualizadoEn: row[18] ? new Date(row[18]) : new Date(), // Columna S: Actualizado En (nueva posición)
              });
            }
          } catch (sheetError) {
            this.logger.warn(`⚠️ Error leyendo hoja ${sheetName}: ${sheetError.message}`);
            continue;
          }
        }
      }
      
      this.logger.log(`✅ Encontrados ${allData.length} registros en Google Sheets para estadísticas del dashboard`);
      return allData;
      
    } catch (error) {
      this.logger.error(`❌ Error leyendo datos de Google Sheets: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string, userId: string, userRol: string, userMinisterioId: string): Promise<void> {
    const carga = await this.findOne(id, userId, userRol, userMinisterioId);

    // Solo se pueden eliminar cargas en estado borrador o pendiente
    if (carga.estado !== EstadoCarga.BORRADOR && carga.estado !== EstadoCarga.PENDIENTE) {
      throw new BadRequestException('Solo se pueden eliminar cargas en estado borrador o pendiente');
    }

    // Verificar que el usuario sea el creador o admin
    if (userRol !== 'ADMIN' && carga.creadoPor !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propias cargas');
    }

    await this.cargaRepository.remove(carga);
    this.logger.log(`Carga ${id} eliminada por usuario ${userId}`);
  }

  private validarPeriodoPeriodicidad(periodo: string, periodicidad: string): void {
    // Casos especiales: períodos fijos siempre son válidos
    if (periodo === '2025-2027' || periodo === '2024') {
      return;
    }

    let esValido = false;

    switch (periodicidad) {
      case 'mensual':
        esValido = /^\d{4}-\d{2}$/.test(periodo);
        break;
      case 'trimestral':
        esValido = /^\d{4}Q[1-4]$/.test(periodo);
        break;
      case 'semestral':
        esValido = /^\d{4}S[1-2]$/.test(periodo);
        break;
      case 'anual':
        esValido = /^\d{4}$/.test(periodo);
        break;
    }

    if (!esValido) {
      throw new BadRequestException(`El período ${periodo} no es válido para la periodicidad ${periodicidad}`);
    }
  }
}








