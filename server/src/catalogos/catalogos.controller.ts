import { Controller, Get, Query, Post, Body, Delete, Param } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { Linea } from '../db/entities/linea.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { CreateLineaDto } from './dto/create-linea.dto';
import { CreateIndicadorDto, Periodicidad } from './dto/create-indicador.dto';
import { CreateMinisterioDto } from './dto/create-ministerio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';

@Controller('catalogos')
export class CatalogosController {
  private readonly logger = new Logger(CatalogosController.name);

  constructor(
    private readonly catalogosService: CatalogosService,
    @InjectRepository(Linea) private readonly lineaRepository: Repository<Linea>,
    @InjectRepository(Ministerio) private readonly ministerioRepository: Repository<Ministerio>,
    @InjectRepository(Indicador) private readonly indicadorRepository: Repository<Indicador>,
  ) {}

  @Get('ministerios')
  async getMinisterios() {
    return await this.catalogosService.getMinisterios();
  }

  @Post('ministerios')
  async createMinisterio(@Body() createMinisterioDto: CreateMinisterioDto) {
    try {
      // Generar ID único para el ministerio
      const ministerioId = this.generateShortId(createMinisterioDto.nombre);
      
      // Verificar que el ID no exista
      const existingMinisterio = await this.ministerioRepository.findOne({
        where: { id: ministerioId }
      });

      if (existingMinisterio) {
        // Si existe, generar un ID único
        const uniqueId = `${ministerioId}_${Date.now()}`;
        createMinisterioDto['id'] = uniqueId;
      } else {
        createMinisterioDto['id'] = ministerioId;
      }

      const ministerio = this.ministerioRepository.create({
        ...createMinisterioDto,
        activo: true
      });

      const savedMinisterio = await this.ministerioRepository.save(ministerio);

      this.logger.log(`Nuevo ministerio creado: ${savedMinisterio.nombre}`);

      return {
        success: true,
        data: savedMinisterio,
        message: 'Ministerio creado exitosamente'
      };
    } catch (error) {
      this.logger.error('Error creando ministerio:', error);
      throw new InternalServerErrorException('Error creando ministerio');
    }
  }

  @Get('lineas')
  async getLineas(@Query('ministerioId') ministerioId?: string) {
    this.logger.log(`🔍 Controlador recibió ministerioId: "${ministerioId}"`);
    try {
      const lineas = await this.catalogosService.getLineas(ministerioId);

      return {
        success: true,
        data: lineas,
        message: 'Líneas obtenidas exitosamente'
      };
    } catch (error) {
      this.logger.error('Error obteniendo líneas:', error);
      throw new InternalServerErrorException('Error obteniendo líneas');
    }
  }

  @Post('lineas')
  async createLinea(@Body() createLineaDto: CreateLineaDto) {
    try {
      // Verificar que el ministerio existe
      const ministerio = await this.ministerioRepository.findOne({
        where: { id: createLineaDto.ministerioId, activo: true }
      });

      if (!ministerio) {
        throw new NotFoundException('Ministerio no encontrado');
      }

      // Generar ID único para la línea
      const lineaId = this.generateShortId(createLineaDto.titulo);
      
      // Verificar que el ID no exista
      const existingLinea = await this.lineaRepository.findOne({
        where: { id: lineaId }
      });

      if (existingLinea) {
        // Si existe, generar un ID único
        const uniqueId = `${lineaId}_${Date.now()}`;
        createLineaDto.id = uniqueId;
      } else {
        createLineaDto.id = lineaId;
      }

      const linea = this.lineaRepository.create({
        ...createLineaDto,
        activo: true
      });

      const savedLinea = await this.lineaRepository.save(linea);

      this.logger.log(`Nueva línea creada: ${savedLinea.titulo} para ministerio ${ministerio.nombre}`);

      return {
        success: true,
        data: savedLinea,
        message: 'Línea creada exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error creando línea:', error);
      throw new InternalServerErrorException('Error creando línea');
    }
  }

  @Get('indicadores')
  async getIndicadores(@Query('linea_id') lineaId?: string) {
    return await this.catalogosService.getIndicadores(lineaId);
  }

  @Post('indicadores')
  async createIndicador(@Body() createIndicadorDto: CreateIndicadorDto) {
    try {
      // Verificar que la línea existe
      const linea = await this.lineaRepository.findOne({
        where: { id: createIndicadorDto.lineaId, activo: true }
      });

      if (!linea) {
        throw new NotFoundException('Línea no encontrada');
      }

      // Generar ID único para el indicador
      const indicadorId = this.generateIndicadorId(createIndicadorDto.nombre);
      
      // Verificar que el ID no exista
      const existingIndicador = await this.indicadorRepository.findOne({
        where: { id: indicadorId }
      });

      if (existingIndicador) {
        // Si existe, generar un ID único
        const uniqueId = `${indicadorId}_${Date.now()}`;
        createIndicadorDto['id'] = uniqueId;
      } else {
        createIndicadorDto['id'] = indicadorId;
      }

      const indicador = this.indicadorRepository.create({
        ...createIndicadorDto,
        activo: true,
        periodicidad: createIndicadorDto.periodicidad || Periodicidad.MENSUAL
      });

      const savedIndicador = await this.indicadorRepository.save(indicador);

      this.logger.log(`Nuevo indicador creado: ${savedIndicador.nombre} para línea ${linea.titulo}`);

      return {
        success: true,
        data: savedIndicador,
        message: 'Indicador creado exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error creando indicador:', error);
      throw new InternalServerErrorException('Error creando indicador');
    }
  }

  private generateShortId(titulo: string): string {
    const words = titulo.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'LIN';
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }

  private generateIndicadorId(nombre: string): string {
    const words = nombre.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'IND';
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }

  @Delete('indicadores/:id')
  async deleteIndicador(@Param('id') id: string) {
    try {
      const indicador = await this.indicadorRepository.findOne({
        where: { id, activo: true }
      });

      if (!indicador) {
        throw new NotFoundException('Indicador no encontrado');
      }

      // Soft delete - marcar como inactivo
      await this.indicadorRepository.update(id, { activo: false });

      this.logger.log(`Indicador eliminado: ${indicador.nombre}`);

      return {
        success: true,
        message: 'Indicador eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error eliminando indicador:', error);
      throw new InternalServerErrorException('Error eliminando indicador');
    }
  }

  @Delete('lineas/:id')
  async deleteLinea(@Param('id') id: string) {
    try {
      const linea = await this.lineaRepository.findOne({
        where: { id, activo: true }
      });

      if (!linea) {
        throw new NotFoundException('Línea no encontrada');
      }

      // Soft delete - marcar como inactivo
      await this.lineaRepository.update(id, { activo: false });

      this.logger.log(`Línea eliminada: ${linea.titulo}`);

      return {
        success: true,
        message: 'Línea eliminada exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error eliminando línea:', error);
      throw new InternalServerErrorException('Error eliminando línea');
    }
  }

  @Delete('ministerios/:id')
  async deleteMinisterio(@Param('id') id: string) {
    try {
      const ministerio = await this.ministerioRepository.findOne({
        where: { id, activo: true }
      });

      if (!ministerio) {
        throw new NotFoundException('Ministerio no encontrado');
      }

      // Soft delete - marcar como inactivo
      await this.ministerioRepository.update(id, { activo: false });

      this.logger.log(`Ministerio eliminado: ${ministerio.nombre}`);

      return {
        success: true,
        message: 'Ministerio eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error eliminando ministerio:', error);
      throw new InternalServerErrorException('Error eliminando ministerio');
    }
  }
}





