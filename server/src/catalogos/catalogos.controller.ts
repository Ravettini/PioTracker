import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { Linea } from '../db/entities/linea.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { CreateLineaDto } from './dto/create-linea.dto';
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
  ) {}

  @Get('ministerios')
  async getMinisterios() {
    return await this.catalogosService.getMinisterios();
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

  private generateShortId(titulo: string): string {
    const words = titulo.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'LIN';
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }
}





