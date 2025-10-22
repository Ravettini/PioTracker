import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaMensual } from '../db/entities/meta-mensual.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { CreateMetaMensualDto } from './dto/create-meta-mensual.dto';
import { UpdateMetaMensualDto } from './dto/update-meta-mensual.dto';

@Injectable()
export class MetasMensualesService {
  private readonly logger = new Logger(MetasMensualesService.name);

  constructor(
    @InjectRepository(MetaMensual)
    private metaMensualRepository: Repository<MetaMensual>,
    @InjectRepository(Indicador)
    private indicadorRepository: Repository<Indicador>,
    @InjectRepository(Ministerio)
    private ministerioRepository: Repository<Ministerio>,
    @InjectRepository(Linea)
    private lineaRepository: Repository<Linea>,
  ) {}

  async create(createMetaMensualDto: CreateMetaMensualDto, userOrId: Usuario | string): Promise<MetaMensual> {
    // Determinar si es un objeto Usuario o un ID string
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    const user = typeof userOrId === 'string' ? null : userOrId;
    // Verificar que el indicador existe
    const indicador = await this.indicadorRepository.findOne({
      where: { id: createMetaMensualDto.indicadorId, activo: true },
      relations: ['linea', 'linea.ministerio'],
    });

    if (!indicador) {
      throw new NotFoundException('Indicador no encontrado');
    }

    // Verificar que el ministerio existe
    const ministerio = await this.ministerioRepository.findOne({
      where: { id: createMetaMensualDto.ministerioId, activo: true },
    });

    if (!ministerio) {
      throw new NotFoundException('Ministerio no encontrado');
    }

    // Validar permisos: usuarios no-admin solo pueden crear metas para su ministerio
    // Si user es null (creación automática), se permite (asumimos que es admin)
    if (user && user.rol !== 'ADMIN' && user.ministerioId !== createMetaMensualDto.ministerioId) {
      throw new ForbiddenException('No tienes permisos para crear metas en este ministerio');
    }

    // Verificar que no existe una meta para el mismo indicador, ministerio y mes
    const existingMeta = await this.metaMensualRepository.findOne({
      where: {
        indicadorId: createMetaMensualDto.indicadorId,
        ministerioId: createMetaMensualDto.ministerioId,
        mes: createMetaMensualDto.mes,
      },
    });

    if (existingMeta) {
      throw new BadRequestException('Ya existe una meta para este indicador, ministerio y mes');
    }

    // Crear la meta mensual
    const metaMensual = this.metaMensualRepository.create({
      ...createMetaMensualDto,
      lineaId: indicador.lineaId,
      creadoPor: userId,
      actualizadoPor: userId,
    });

    const metaGuardada = await this.metaMensualRepository.save(metaMensual);

    this.logger.log(`Meta mensual creada: ${metaGuardada.mes} para indicador ${indicador.nombre}`);

    return metaGuardada;
  }

  async findAll(query: any): Promise<{ metas: MetaMensual[]; total: number }> {
    const { ministerioId, indicadorId, mes, limit = 20, offset = 0 } = query;

    const queryBuilder = this.metaMensualRepository
      .createQueryBuilder('meta')
      .leftJoinAndSelect('meta.indicador', 'indicador')
      .leftJoinAndSelect('meta.ministerio', 'ministerio')
      .leftJoinAndSelect('meta.linea', 'linea')
      .orderBy('meta.mes', 'DESC')
      .addOrderBy('meta.creadoEn', 'DESC');

    if (ministerioId) {
      queryBuilder.andWhere('meta.ministerioId = :ministerioId', { ministerioId });
    }

    if (indicadorId) {
      queryBuilder.andWhere('meta.indicadorId = :indicadorId', { indicadorId });
    }

    if (mes) {
      queryBuilder.andWhere('meta.mes = :mes', { mes });
    }

    const [metas, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { metas, total };
  }

  async findOne(id: string): Promise<MetaMensual> {
    const meta = await this.metaMensualRepository.findOne({
      where: { id },
      relations: ['indicador', 'ministerio', 'linea'],
    });

    if (!meta) {
      throw new NotFoundException('Meta mensual no encontrada');
    }

    return meta;
  }

  async update(id: string, updateMetaMensualDto: UpdateMetaMensualDto, userId: string): Promise<MetaMensual> {
    const meta = await this.findOne(id);

    Object.assign(meta, updateMetaMensualDto);
    meta.actualizadoPor = userId;
    meta.actualizadoEn = new Date();

    return await this.metaMensualRepository.save(meta);
  }

  async remove(id: string): Promise<void> {
    const meta = await this.findOne(id);
    await this.metaMensualRepository.remove(meta);
  }

  async getMetasByIndicador(indicadorId: string, ministerioId?: string, mes?: string): Promise<MetaMensual[]> {
    const queryBuilder = this.metaMensualRepository
      .createQueryBuilder('meta')
      .leftJoinAndSelect('meta.indicador', 'indicador')
      .leftJoinAndSelect('meta.ministerio', 'ministerio')
      .leftJoinAndSelect('meta.linea', 'linea')
      .where('meta.indicadorId = :indicadorId', { indicadorId })
      .orderBy('meta.mes', 'ASC');

    if (ministerioId) {
      queryBuilder.andWhere('meta.ministerioId = :ministerioId', { ministerioId });
    }

    if (mes) {
      queryBuilder.andWhere('meta.mes = :mes', { mes });
    }

    return await queryBuilder.getMany();
  }
}
