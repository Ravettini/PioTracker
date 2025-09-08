import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Carga } from '../db/entities/carga.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

export interface AnalyticsResponse {
  ministerio: string;
  compromiso: string;
  indicador: string;
  tipo: 'porcentaje' | 'cantidad';
  datos: {
    periodos: string[];
    valores: number[];
    metas?: number[];
  };
  configuracion: {
    tipoGrafico: string;
    colores: string[];
    opciones: any;
  };
}

export interface ResumenAnalytics {
  totalMinisterios: number;
  totalCompromisos: number;
  totalIndicadores: number;
  cargasValidadas: number;
  cargasPendientes: number;
  porcentajeCumplimiento: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Ministerio)
    private ministerioRepository: Repository<Ministerio>,
    @InjectRepository(Linea)
    private lineaRepository: Repository<Linea>,
    @InjectRepository(Indicador)
    private indicadorRepository: Repository<Indicador>,
    @InjectRepository(Carga)
    private cargaRepository: Repository<Carga>,
    private configService: ConfigService,
  ) {}

  async getMinisterios(user: Usuario) {
    this.logger.log(`Obteniendo ministerios para usuario: ${user.id}`);

    const whereConditions: any = {};
    
    // Si no es admin, filtrar por ministerio del usuario
    if (user.rol !== 'ADMIN') {
      whereConditions.id = user.ministerioId;
    }

    const ministerios = await this.ministerioRepository.find({
      where: whereConditions,
      order: { nombre: 'ASC' },
    });

    return {
      success: true,
      data: ministerios,
      message: 'Ministerios obtenidos exitosamente',
    };
  }

  async getCompromisos(ministerioId: string, user: Usuario) {
    this.logger.log(`Obteniendo compromisos para ministerio: ${ministerioId}`);

    // Verificar permisos
    if (user.rol !== 'ADMIN' && user.ministerioId !== ministerioId) {
      throw new ForbiddenException('No tienes permisos para ver este ministerio');
    }

    const compromisos = await this.lineaRepository.find({
      where: { ministerioId, activo: true },
      order: { titulo: 'ASC' },
    });

    return {
      success: true,
      data: compromisos,
      message: 'Compromisos obtenidos exitosamente',
    };
  }

  async getIndicadores(compromisoId: string, user: Usuario) {
    this.logger.log(`Obteniendo indicadores para compromiso: ${compromisoId}`);

    // Obtener el compromiso para verificar permisos
    const compromiso = await this.lineaRepository.findOne({
      where: { id: compromisoId },
      relations: ['ministerio'],
    });

    if (!compromiso) {
      throw new ForbiddenException('Compromiso no encontrado');
    }

    // Verificar permisos
    if (user.rol !== 'ADMIN' && user.ministerioId !== compromiso.ministerioId) {
      throw new ForbiddenException('No tienes permisos para ver este compromiso');
    }

    const indicadores = await this.indicadorRepository.find({
      where: { lineaId: compromisoId, activo: true },
      order: { nombre: 'ASC' },
    });

    return {
      success: true,
      data: indicadores,
      message: 'Indicadores obtenidos exitosamente',
    };
  }

  async getDatos(query: AnalyticsQueryDto, user: Usuario): Promise<AnalyticsResponse> {
    this.logger.log(`Obteniendo datos de analytics:`, query);

    const { indicadorId, periodoDesde, periodoHasta } = query;

    // Obtener el indicador con sus relaciones
    const indicador = await this.indicadorRepository.findOne({
      where: { id: indicadorId },
      relations: ['linea', 'linea.ministerio'],
    });

    if (!indicador) {
      throw new ForbiddenException('Indicador no encontrado');
    }

    // Verificar permisos
    if (user.rol !== 'ADMIN' && user.ministerioId !== indicador.linea.ministerioId) {
      throw new ForbiddenException('No tienes permisos para ver este indicador');
    }

    // Obtener datos del Google Sheets
    const sheetData = await this.getDataFromGoogleSheets(indicadorId, periodoDesde, periodoHasta);

    // Determinar tipo de indicador
    const tipo = this.determinarTipoIndicador(indicador.nombre);

    // Procesar datos para el gráfico
    const periodos = sheetData.map(row => row.periodo);
    const valores = sheetData.map(row => row.valor);
    const metas = sheetData.map(row => row.meta).filter(m => m !== null && m !== undefined);

    // Configurar gráfico según tipo
    const configuracion = this.configurarGrafico(tipo, indicador);

    return {
      ministerio: indicador.linea.ministerio.nombre,
      compromiso: indicador.linea.titulo,
      indicador: indicador.nombre,
      tipo,
      datos: {
        periodos,
        valores,
        metas: metas.length > 0 ? metas : undefined,
      },
      configuracion,
    };
  }

  private async getDataFromGoogleSheets(indicadorId: string, periodoDesde?: string, periodoHasta?: string): Promise<any[]> {
    // Simplificado: solo usar base de datos local
    return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
  }

  private async getDataFromLocalDatabase(indicadorId: string, periodoDesde?: string, periodoHasta?: string): Promise<any[]> {
    const whereConditions: any = {
      indicadorId,
      estado: 'validado',
    };

    if (periodoDesde) {
      whereConditions.periodo = { gte: periodoDesde };
    }

    if (periodoHasta) {
      whereConditions.periodo = { ...whereConditions.periodo, lte: periodoHasta };
    }

    const cargas = await this.cargaRepository.find({
      where: whereConditions,
      order: { periodo: 'ASC' },
    });

          return cargas.map(c => ({
        periodo: c.periodo,
        valor: c.valor,
        meta: c.meta,
        unidad: c.unidad,
        fuente: c.fuente,
        responsable: c.responsableNombre,
        estado: c.estado,
        publicado: c.publicado,
        creadoEn: c.creadoEn,
        actualizadoEn: c.actualizadoEn,
      }));
  }

  private parseCSV(csvText: string): any[] {
    // Método eliminado - ya no necesario
    return [];
  }

  private parseCSVLine(line: string): string[] {
    // Método eliminado - ya no necesario
    return [];
  }

  async getResumen(user: Usuario): Promise<ResumenAnalytics> {
    this.logger.log(`Obteniendo resumen de analytics para usuario: ${user.id}`);

    const whereConditions: any = {};
    
    // Si no es admin, filtrar por ministerio del usuario
    if (user.rol !== 'ADMIN') {
      whereConditions.ministerioId = user.ministerioId;
    }

    const [
      totalMinisterios,
      totalCompromisos,
      totalIndicadores,
      cargasValidadas,
      cargasPendientes,
    ] = await Promise.all([
      this.ministerioRepository.count({ where: whereConditions }),
      this.lineaRepository.count({ where: whereConditions }),
      this.indicadorRepository.count({ where: whereConditions }),
      this.cargaRepository.count({ where: { ...whereConditions, estado: 'validado' } }),
      this.cargaRepository.count({ where: { ...whereConditions, estado: 'pendiente' } }),
    ]);

    const porcentajeCumplimiento = cargasValidadas > 0 
      ? Math.round((cargasValidadas / (cargasValidadas + cargasPendientes)) * 100)
      : 0;

    return {
      totalMinisterios,
      totalCompromisos,
      totalIndicadores,
      cargasValidadas,
      cargasPendientes,
      porcentajeCumplimiento,
    };
  }

  private determinarTipoIndicador(nombre: string): 'porcentaje' | 'cantidad' {
    const nombreLower = nombre.toLowerCase();
    
    const keywordsPorcentaje = ['porcentaje', '%', 'tasa', 'cobertura', 'participación', 'efectividad'];
    
    if (keywordsPorcentaje.some(keyword => nombreLower.includes(keyword))) {
      return 'porcentaje';
    }
    
    return 'cantidad';
  }

  private configurarGrafico(tipo: 'porcentaje' | 'cantidad', indicador: Indicador) {
    if (tipo === 'porcentaje') {
      return {
        tipoGrafico: 'line',
        colores: ['#3B82F6', '#EF4444'],
        opciones: {
          yAxis: {
            min: 0,
            max: 100,
            title: { text: 'Porcentaje (%)' }
          }
        }
      };
    } else {
      return {
        tipoGrafico: 'column',
        colores: ['#10B981'],
        opciones: {
          yAxis: {
            title: { text: 'Cantidad' }
          }
        }
      };
    }
  }
}
