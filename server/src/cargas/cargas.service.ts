import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { Carga, EstadoCarga } from '../db/entities/carga.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';
import { RevisionDto } from './dto/revision.dto';
import { GoogleSheetsService } from '../sync/google-sheets.service';

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
    private googleSheetsService: GoogleSheetsService,
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
      periodicidad: indicador.periodicidad,
      estado: EstadoCarga.PENDIENTE, // Cambio: va directo a PENDIENTE
      creadoPor: userId,
      actualizadoPor: userId,
    });

    const cargaGuardada = await this.cargaRepository.save(carga);

    // Intentar publicar en Google Sheets inmediatamente
    try {
      await this.googleSheetsService.publishCarga(cargaGuardada.id, cargaGuardada);
      cargaGuardada.publicado = true;
      await this.cargaRepository.save(cargaGuardada);
      this.logger.log(`Carga ${cargaGuardada.id} publicada exitosamente en Google Sheets`);
    } catch (error) {
      this.logger.error(`Error al publicar carga ${cargaGuardada.id} en Google Sheets:`, error);
      // No fallar la operación si Google Sheets falla
    }

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

    // Publicar en Google Sheets
    try {
      await this.googleSheetsService.publishCarga(cargaGuardada.id, cargaGuardada);
      
      // Marcar como publicado en la base de datos
      cargaGuardada.publicado = true;
      await this.cargaRepository.save(cargaGuardada);
      
      this.logger.log(`Carga ${cargaGuardada.id} publicada exitosamente en Google Sheets`);
    } catch (error) {
      this.logger.error(`Error al publicar carga ${cargaGuardada.id} en Google Sheets:`, error);
      // No fallar la operación si Google Sheets falla
    }

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

    const cargaActualizada = await this.cargaRepository.save(carga);
    this.logger.log(`✅ Carga ${id} actualizada a estado: ${cargaActualizada.estado}`);

    // Publicar en Google Sheets solo si se valida
    if (revisionDto.estado === EstadoCarga.VALIDADO) {
      this.logger.log(`📊 Iniciando publicación en Google Sheets para carga ${cargaActualizada.id}`);
      try {
        await this.googleSheetsService.publishCarga(cargaActualizada.id, cargaActualizada);
        cargaActualizada.publicado = true;
        await this.cargaRepository.save(cargaActualizada);
        this.logger.log(`📊 Carga ${cargaActualizada.id} publicada exitosamente en Google Sheets`);
      } catch (error) {
        this.logger.error(`❌ Error al publicar carga ${cargaActualizada.id} en Google Sheets:`, error);
        // No fallar la operación si Google Sheets falla
      }
    } else {
      this.logger.log(`⏭️ No se publica en Google Sheets (estado: ${revisionDto.estado})`);
    }

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








