import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Ministerio)
    private ministerioRepository: Repository<Ministerio>,
    @InjectRepository(Linea)
    private lineaRepository: Repository<Linea>,
    @InjectRepository(Indicador)
    private indicadorRepository: Repository<Indicador>,
  ) {}

  async getMinisterios(): Promise<Ministerio[]> {
    try {
      console.log('🔍 Obteniendo ministerios...');
      const ministerios = await this.ministerioRepository.find({
        where: { activo: true },
        relations: ['lineas'],
        order: { nombre: 'ASC' },
      });
      console.log(`✅ Encontrados ${ministerios.length} ministerios activos:`, ministerios.map(m => `${m.nombre} (${m.activo ? 'activo' : 'inactivo'})`));
      console.log(`✅ ${ministerios.length} ministerios encontrados`);
      return ministerios;
    } catch (error) {
      console.error('❌ Error obteniendo ministerios:', error);
      throw error;
    }
  }

  async getLineas(ministerioId?: string): Promise<Linea[]> {
    const whereConditions: any = { activo: true };
    
    if (ministerioId) {
      whereConditions.ministerioId = ministerioId;
      console.log(`🔍 Filtrando líneas por ministerio: ${ministerioId}`);
      console.log(`🔍 Condiciones WHERE:`, whereConditions);
    } else {
      console.log(`🔍 Sin filtro de ministerio, devolviendo todas las líneas`);
    }

    const result = await this.lineaRepository.find({
      where: whereConditions,
      relations: ['ministerio'],
      order: { titulo: 'ASC' },
    });

    console.log(`✅ Líneas encontradas: ${result.length}`);
    if (ministerioId) {
      console.log(`🔍 Líneas del ministerio ${ministerioId}:`, result.map(l => l.titulo));
    }

    return result;
  }

  async getIndicadores(lineaId?: string): Promise<Indicador[]> {
    const whereConditions: any = { activo: true };
    
    if (lineaId) {
      whereConditions.lineaId = lineaId;
    }

    return await this.indicadorRepository.find({
      where: whereConditions,
      relations: ['linea', 'linea.ministerio'],
      order: { nombre: 'ASC' },
    });
  }

  async getIndicadorById(id: string): Promise<Indicador> {
    return await this.indicadorRepository.findOne({
      where: { id, activo: true },
      relations: ['linea', 'linea.ministerio'],
    });
  }

  async getLineaById(id: string): Promise<Linea> {
    return await this.lineaRepository.findOne({
      where: { id, activo: true },
      relations: ['ministerio'],
    });
  }

  async getMinisterioById(id: string): Promise<Ministerio> {
    return await this.ministerioRepository.findOne({
      where: { id, activo: true },
    });
  }
}








