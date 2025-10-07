import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { GoogleAuthService } from '../sync/google-auth.service';
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
  vista: 'mensual' | 'total';
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
    private googleAuthService: GoogleAuthService,
  ) {}

  async getMinisterios(user: Usuario) {
    this.logger.log(`Obteniendo ministerios para usuario: ${user.id}`);

    const whereConditions: any = {
      activo: true, // Solo mostrar ministerios activos
    };
    
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

    const { indicadorId, periodoDesde, periodoHasta, vista = 'total', año } = query;

    // Manejar vista global
    if (indicadorId === 'all') {
      return this.getVistaGlobal(user, periodoDesde, periodoHasta, vista, año);
    }

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
    const sheetData = await this.getDataFromGoogleSheets(indicadorId, periodoDesde, periodoHasta, año);

    // Determinar tipo de indicador
    const tipo = this.determinarTipoIndicador(indicador.nombre);

    // Procesar datos según el tipo de vista
    let processedData;
    if (vista === 'mensual') {
      processedData = this.procesarDatosMensuales(sheetData);
    } else {
      processedData = this.procesarDatosTotales(sheetData);
    }

    // Configurar gráfico según tipo
    const configuracion = this.configurarGrafico(tipo, indicador);

    return {
      ministerio: indicador.linea.ministerio.nombre,
      compromiso: indicador.linea.titulo,
      indicador: indicador.nombre,
      tipo,
      datos: processedData,
      configuracion,
      vista, // Incluir tipo de vista en la respuesta
    };
  }

  private procesarDatosTotales(sheetData: any[]): { periodos: string[]; valores: number[]; metas?: number[] } {
    // Agrupar por período y sumar valores y metas
    const agrupado = sheetData.reduce((acc, row) => {
      const periodo = row.periodo;
      if (!acc[periodo]) {
        acc[periodo] = { valor: 0, meta: 0, count: 0 };
      }
      acc[periodo].valor += row.valor;
      if (row.meta !== null && row.meta !== undefined) {
        acc[periodo].meta += row.meta;
      }
      acc[periodo].count += 1;
      return acc;
    }, {});

    const periodos = Object.keys(agrupado);
    const valores = periodos.map(p => agrupado[p].valor);
    const metas = periodos.map(p => agrupado[p].meta || null);

    return {
      periodos,
      valores,
      metas,
    };
  }

  private procesarDatosMensuales(sheetData: any[]): { periodos: string[]; valores: number[]; metas?: number[] } {
    this.logger.log(`📊 Procesando ${sheetData.length} filas para vista mensual`);
    
    // Agrupar por mes normalizado y sumar valores y metas
    const agrupado = sheetData.reduce((acc, row) => {
      const mesNormalizado = this.normalizarMes(row.mes || 'Sin mes');
      this.logger.log(`📅 Procesando fila: Mes="${row.mes}" -> Normalizado="${mesNormalizado}", Valor=${row.valor}, Meta=${row.meta}`);
      
      if (!acc[mesNormalizado]) {
        acc[mesNormalizado] = { valor: 0, meta: 0, count: 0 };
      }
      acc[mesNormalizado].valor += row.valor;
      if (row.meta !== null && row.meta !== undefined) {
        acc[mesNormalizado].meta += row.meta;
      }
      acc[mesNormalizado].count += 1;
      return acc;
    }, {});

    this.logger.log(`📊 Datos agrupados:`, Object.keys(agrupado));

    // Ordenar meses cronológicamente
    const ordenMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const periodos = Object.keys(agrupado).sort((a, b) => {
      const indexA = ordenMeses.indexOf(a);
      const indexB = ordenMeses.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const valores = periodos.map(p => agrupado[p].valor);
    const metas = periodos.map(p => agrupado[p].meta || null);

    this.logger.log(`📊 Resultado final: Periodos=${periodos.join(', ')}, Valores=${valores.join(', ')}, Metas=${metas.join(', ')}`);

    return {
      periodos,
      valores,
      metas,
    };
  }

  private crearFechaReal(periodo: string, mes: string): Date {
    const año = parseInt(periodo) || 2024;
    
    // Mapeo de nombres de meses a números
    const mesesMap: { [key: string]: number } = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    
    const mesLower = mes.toLowerCase().trim();
    const numeroMes = mesesMap[mesLower] || 0; // Default a enero si no se encuentra
    
    return new Date(año, numeroMes, 1);
  }

  private normalizarMes(mes: string): string {
    if (!mes || mes.trim() === '') return 'Sin mes';
    
    const mesLower = mes.toLowerCase().trim();
    
    // Mapeo de meses abreviados a completos
    const mesesAbreviados: { [key: string]: string } = {
      // Abreviaciones en español
      'ene': 'enero',
      'feb': 'febrero', 
      'mar': 'marzo',
      'abr': 'abril',
      'may': 'mayo',
      'jun': 'junio',
      'jul': 'julio',
      'ago': 'agosto',
      'sep': 'septiembre',
      'oct': 'octubre',
      'nov': 'noviembre',
      'dic': 'diciembre',
      // Abreviaciones en inglés (solo las que son diferentes)
      'jan': 'enero',
      'apr': 'abril',
      'aug': 'agosto',
      'dec': 'diciembre'
    };

    // Si es un mes abreviado, convertir a completo
    if (mesesAbreviados[mesLower]) {
      this.logger.log(`🔄 Mes normalizado: "${mes}" -> "${mesesAbreviados[mesLower]}"`);
      return mesesAbreviados[mesLower];
    }

    // Si ya es un mes completo, verificar que esté en la lista válida
    const mesesCompletos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                           'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    if (mesesCompletos.includes(mesLower)) {
      this.logger.log(`✅ Mes ya normalizado: "${mes}" -> "${mesLower}"`);
      return mesLower;
    }

    // Si no se reconoce, devolver tal como está
    this.logger.warn(`⚠️ Mes no reconocido: "${mes}". Usando tal como está.`);
    return mesLower;
  }

  private async getDataFromGoogleSheets(indicadorId: string, periodoDesde?: string, periodoHasta?: string, año?: string): Promise<any[]> {
    try {
      this.logger.log(`📊 Leyendo datos de Google Sheets para indicador: ${indicadorId}`);
      
      // Verificar y renovar token si es necesario
      await this.googleAuthService.renovarTokenSiEsNecesario();
      
      // Verificar configuración de Google Sheets
      const config = this.configService.get('google');
      if (!config.sheetId) {
        this.logger.warn('⚠️ GOOGLE_SHEET_ID no configurado. Usando base de datos local.');
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
      }

      // Manejar vista global
      if (indicadorId === 'all') {
        return this.getDataFromGoogleSheetsGlobal(periodoDesde, periodoHasta, año);
      }

      // Obtener información del indicador para saber qué ministerio buscar
      const indicador = await this.indicadorRepository.findOne({
        where: { id: indicadorId },
        relations: ['linea', 'linea.ministerio']
      });

      if (!indicador) {
        this.logger.warn(`⚠️ Indicador ${indicadorId} no encontrado. Usando base de datos local.`);
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
      }

      // Usar Service Account si está configurado, sino usar OAuth
      let sheets;
      
      if (config.serviceAccount?.clientEmail) {
        this.logger.log('🔑 Usando Service Account para analytics');
        const { GoogleServiceAccountService } = await import('../sync/google-service-account.service');
        const serviceAccountService = new GoogleServiceAccountService(this.configService);
        sheets = await serviceAccountService.getSheetsClient();
      } else if (config.refreshToken) {
        this.logger.log('🔑 Usando OAuth para analytics');
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
        this.logger.warn('⚠️ No hay credenciales de Google configuradas para analytics');
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
      }
      
      // Generar nombre de hoja del ministerio
      const ministerioTab = this.generateMinisterioTabName(indicador.linea.ministerio.nombre);
      this.logger.log(`🏛️ Leyendo datos de hoja: ${ministerioTab}`);
      
      // Leer datos de la hoja del ministerio (nueva estructura con más columnas)
      const range = `${ministerioTab}!A:S`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: range,
      });
      
      const rows = response.data.values || [];
      if (rows.length <= 1) {
        this.logger.warn(`⚠️ No hay datos en la hoja ${ministerioTab} con filtro de año ${año}. Retornando datos vacíos.`);
        return [];
      }
      
      // Procesar filas y filtrar por indicador
      const datosIndicador = [];
      const headers = rows[0]; // Primera fila son los headers
      
      this.logger.log(`🔍 Buscando indicador por NOMBRE: "${indicador.nombre}" en ${rows.length - 1} filas`);
      
      // Contar cuántas filas tienen este nombre de indicador
      let filasConNombreIndicador = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 10) continue; // Asegurar que la fila tenga suficientes columnas
        
        // Log de cada fila para debug
        if (i <= 10) { // Log de las primeras 10 filas para debug
          this.logger.log(`📋 Fila ${i}: IndicadorID="${row[0]}", Nombre="${row[1]}", Mes="${row[3]}", Valor="${row[8]}"`);
        }
        
        // Contar filas que coinciden con el nombre del indicador
        if (row[1] && row[1].toString().trim() === indicador.nombre.trim()) {
          filasConNombreIndicador++;
        }
      }
      
      this.logger.log(`📊 Estadísticas: ${filasConNombreIndicador} filas con nombre "${indicador.nombre}"`);
      
      // Buscar datos SOLO por nombre del indicador (columna B)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 10) continue; // Asegurar que la fila tenga suficientes columnas
        
        // Filtrar SOLO por nombre del indicador (columna B)
        const coincidePorNombre = row[1] && row[1].toString().trim() === indicador.nombre.trim();
        
        if (coincidePorNombre) {
          const periodo = row[2]; // Columna C: Período
          const mes = row[3] || ''; // Columna D: Mes
          const valor = parseFloat(row[8]) || 0; // Columna I: Valor (nueva posición)
          const meta = row[10] && row[10].toString().trim() !== '' ? parseFloat(row[10].toString()) : null; // Columna K: Meta
          const unidad = row[9] || 'unidades'; // Columna J: Unidad (nueva posición)
          const fuente = row[11] || 'Google Sheets'; // Columna L: Fuente (nueva posición)
          const responsableNombre = row[12] || 'Sistema'; // Columna M: Responsable (nueva posición)
          const estado = row[15] || 'validado'; // Columna P: Estado (nueva posición)
          const publicado = row[16] === 'Sí'; // Columna Q: Publicado (nueva posición)
          const creadoEn = row[17] ? new Date(row[17]) : new Date(); // Columna R: Creado En (nueva posición)
          const actualizadoEn = row[18] ? new Date(row[18]) : new Date(); // Columna S: Actualizado En (nueva posición)
          
          // Aplicar filtro por año si se especifica
          if (año) {
            const añoDelPeriodo = periodo.toString().substring(0, 4);
            if (añoDelPeriodo !== año) {
              continue;
            }
          }
          
          // Aplicar filtros de período si se especifican
          if (periodoDesde && periodo < periodoDesde) continue;
          if (periodoHasta && periodo > periodoHasta) continue;
          
          datosIndicador.push({
            periodo,
            mes,
            valor,
            meta,
            unidad,
            fuente,
            responsable: responsableNombre,
            estado,
            publicado,
            creadoEn,
            actualizadoEn,
          });
          
          // Log para debugging
          this.logger.log(`📊 Datos leídos (por Nombre): Período=${periodo}, Mes="${mes}", Valor=${valor}, Meta=${meta}`);
        }
      }
      
      // Ordenar por período
      datosIndicador.sort((a, b) => a.periodo.localeCompare(b.periodo));
      
      this.logger.log(`✅ Encontrados ${datosIndicador.length} registros en Google Sheets para indicador ${indicadorId}`);
      
      if (datosIndicador.length > 0) {
        this.logger.log(`📊 Primeros registros encontrados:`, datosIndicador.slice(0, 3).map(d => `Mes=${d.mes}, Valor=${d.valor}`));
      }
      
      // Si no hay datos en Sheets, retornar vacío (no usar base de datos local)
      if (datosIndicador.length === 0) {
        this.logger.warn(`⚠️ No se encontraron datos en Google Sheets para indicador ${indicadorId} con filtro de año ${año}. Retornando datos vacíos.`);
        return [];
      }
      
      return datosIndicador;
      
    } catch (error) {
      this.logger.error(`❌ Error leyendo datos de Google Sheets: ${error.message}`);
      this.logger.warn('⚠️ Fallback a base de datos local debido a error en Google Sheets');
      return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
    }
  }

  private async getDataFromLocalDatabase(indicadorId: string, periodoDesde?: string, periodoHasta?: string): Promise<any[]> {
    const whereConditions: any = {
      indicadorId,
      // Incluir cargas en diferentes estados para mostrar datos en analytics
      estado: In(['validado', 'borrador', 'pendiente']),
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

    // Calcular cumplimiento basado en metas cumplidas
    const porcentajeCumplimiento = await this.calcularCumplimientoBasadoEnMetas(user);

    return {
      totalMinisterios,
      totalCompromisos,
      totalIndicadores,
      cargasValidadas,
      cargasPendientes,
      porcentajeCumplimiento,
    };
  }

  private async calcularCumplimientoBasadoEnMetas(user: Usuario): Promise<number> {
    try {
      this.logger.log(`🎯 Calculando cumplimiento basado en metas para usuario: ${user.id}`);

      // Obtener todas las cargas con metas del usuario
      const whereConditions: any = {
        estado: 'validado', // Solo cargas validadas
      };
      
      if (user.rol !== 'ADMIN') {
        whereConditions.ministerioId = user.ministerioId;
      }

      const cargasConMetas = await this.cargaRepository.find({
        where: {
          ...whereConditions,
          meta: Not(IsNull()), // Solo cargas que tienen meta definida
        },
        select: ['valor', 'meta'],
      });

      if (cargasConMetas.length === 0) {
        this.logger.log('⚠️ No hay cargas con metas definidas, usando cálculo tradicional');
        // Fallback al cálculo tradicional si no hay metas
        const cargasValidadas = await this.cargaRepository.count({ 
          where: { ...whereConditions, estado: 'validado' } 
        });
        const cargasPendientes = await this.cargaRepository.count({ 
          where: { ...whereConditions, estado: 'pendiente' } 
        });
        
        return cargasValidadas > 0 
          ? Math.round((cargasValidadas / (cargasValidadas + cargasPendientes)) * 100)
          : 0;
      }

      // Calcular cuántas metas se cumplieron
      let metasCumplidas = 0;
      let totalMetas = cargasConMetas.length;

      for (const carga of cargasConMetas) {
        if (carga.valor >= carga.meta) {
          metasCumplidas++;
        }
      }

      const porcentajeCumplimiento = Math.round((metasCumplidas / totalMetas) * 100);
      
      this.logger.log(`🎯 Cumplimiento calculado: ${metasCumplidas}/${totalMetas} metas cumplidas = ${porcentajeCumplimiento}%`);
      
      return porcentajeCumplimiento;

    } catch (error) {
      this.logger.error(`❌ Error calculando cumplimiento basado en metas:`, error);
      
      // Fallback al cálculo tradicional en caso de error
      const whereConditions: any = {};
      if (user.rol !== 'ADMIN') {
        whereConditions.ministerioId = user.ministerioId;
      }

      const cargasValidadas = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: 'validado' } 
      });
      const cargasPendientes = await this.cargaRepository.count({ 
        where: { ...whereConditions, estado: 'pendiente' } 
      });
      
      return cargasValidadas > 0 
        ? Math.round((cargasValidadas / (cargasValidadas + cargasPendientes)) * 100)
        : 0;
    }
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

  private generateMinisterioTabName(ministerio: string): string {
    // Mapeo de nombres de ministerios a nombres de hojas existentes (solo para ministerios ya creados)
    const ministerioMap: { [key: string]: string } = {
      'Educación': 'Educacion',
      'Ente regulador de servicios públicos': 'Ente regulador de servicios púb',
      'Espacio Público': 'Espacio Publico',
      'Hacienda y finanzas': 'Hacienda y finanzas',
      'Jefatura de Gabinete': 'Jefatura de Gabinete',
      'Justicia': 'Justicia',
      'MDHyH': 'Ministerio de Desarrollo Humano y Hábitat',
      'Salud': 'Salud',
      'Seguridad': 'Seguridad',
      'Vicejefatura': 'Vicejefatura'
    };
    
    // Si existe el mapeo, usar el nombre de la hoja existente
    if (ministerioMap[ministerio]) {
      return ministerioMap[ministerio];
    }
    
    // Para ministerios nuevos: crear nombre limpio sin prefijo "Ministerio_"
    // Esto asegura que el nombre en la hoja sea exactamente el nombre del ministerio normalizado
    const cleanName = ministerio
      .replace(/[^a-zA-Z0-9\sáéíóúñÁÉÍÓÚÑ]/g, '') // Remover caracteres especiales pero mantener tildes y ñ
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .substring(0, 30); // Limitar longitud a 30 caracteres (límite de Google Sheets)
    
    return cleanName;
  }

  private async getVistaGlobal(user: Usuario, periodoDesde?: string, periodoHasta?: string, vista: 'mensual' | 'total' = 'total', año?: string): Promise<AnalyticsResponse> {
    this.logger.log(`Obteniendo vista global para usuario: ${user.email}`);

    try {
      // Obtener todos los indicadores que el usuario puede ver
      let indicadores;
      if (user.rol === 'ADMIN') {
        indicadores = await this.indicadorRepository.find({
          relations: ['linea', 'linea.ministerio'],
        });
      } else {
        indicadores = await this.indicadorRepository.find({
          where: { linea: { ministerioId: user.ministerioId } },
          relations: ['linea', 'linea.ministerio'],
        });
      }

      if (indicadores.length === 0) {
        return {
          ministerio: 'Vista Global',
          compromiso: 'Todos los Compromisos',
          indicador: 'Todos los Indicadores',
          tipo: 'cantidad',
          datos: {
            periodos: [],
            valores: [],
            metas: []
          },
          configuracion: {
            tipoGrafico: 'bar',
            colores: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
            opciones: {}
          },
          vista: vista
        };
      }

      // Obtener datos agregados de todos los indicadores
      const sheetData = await this.getDataFromGoogleSheetsGlobal(periodoDesde, periodoHasta, año);

      // Vista global SIEMPRE muestra por ministerios (barras), nunca por períodos
      // Solo mostrar ministerios activos (no los eliminados con soft delete)
      const ministerios = await this.ministerioRepository.find({
        where: { activo: true }
      });
      const datosPorMinisterio = [];
      
      for (const ministerio of ministerios) {
        const datosMinisterio = sheetData.filter(item => {
          // Filtrar por ministerio usando el campo ministerio agregado
          return item.ministerio === ministerio.nombre;
        });
        
        // MOSTRAR TODOS LOS MINISTERIOS, incluso con valor 0
        // Si un ministerio tiene al menos una fila, ya es válido para mostrarlo
        const totalValor = datosMinisterio.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
        datosPorMinisterio.push({
          ministerio: ministerio.nombre,
          valor: totalValor,
          cantidad: datosMinisterio.length
        });
        this.logger.log(`📊 ${ministerio.nombre}: ${datosMinisterio.length} registros, valor total: ${totalValor}`);
      }
      
      // Mostrar distribución por ministerio (SIEMPRE, sin fallback a períodos)
      const nombresMinisterios = datosPorMinisterio.map(item => item.ministerio);
      const valoresTotales = datosPorMinisterio.map(item => item.valor);

      this.logger.log(`📊 Vista global procesada: ${datosPorMinisterio.length} ministerios, ${sheetData.length} registros totales`);

      return {
        ministerio: 'Vista Global',
        compromiso: 'Todos los Compromisos',
        indicador: 'Distribución por Ministerio',
        tipo: 'cantidad',
        datos: {
          periodos: nombresMinisterios, // Nombres de ministerios como "períodos"
          valores: valoresTotales,      // Valores totales de cada ministerio
          metas: []
        },
        configuracion: {
          tipoGrafico: 'bar',
          colores: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
          opciones: {}
        },
        vista: 'total' // Vista global SIEMPRE es 'total'
      };
    } catch (error) {
      this.logger.error(`Error obteniendo vista global: ${error.message}`);
      throw new ForbiddenException('Error al obtener la vista global');
    }
  }

  private async getDataFromGoogleSheetsGlobal(periodoDesde?: string, periodoHasta?: string, año?: string): Promise<any[]> {
    try {
      this.logger.log(`📊 Leyendo datos globales de Google Sheets`);
      
      const config = this.configService.get('google');
      
      // Usar Service Account si está configurado, sino usar OAuth
      let sheets;
      
      if (config.serviceAccount?.clientEmail) {
        this.logger.log('🔑 Usando Service Account para vista global');
        const { GoogleServiceAccountService } = await import('../sync/google-service-account.service');
        const serviceAccountService = new GoogleServiceAccountService(this.configService);
        sheets = await serviceAccountService.getSheetsClient();
      } else if (config.refreshToken) {
        this.logger.log('🔑 Usando OAuth para vista global');
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
        this.logger.warn('⚠️ No hay credenciales de Google configuradas para vista global');
        return [];
      }

      // Obtener todos los ministerios activos para leer sus hojas
      const ministerios = await this.ministerioRepository.find({
        where: { activo: true }
      });
      const datosGlobales = [];
      
      for (const ministerio of ministerios) {
        try {
          const ministerioTab = this.generateMinisterioTabName(ministerio.nombre);
          this.logger.log(`🏛️ Leyendo datos de hoja: ${ministerioTab}`);
          
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.sheetId,
            range: `${ministerioTab}!A:S`,
          });

          const rows = response.data.values || [];
          if (rows.length <= 1) {
            this.logger.warn(`⚠️ No hay datos en la hoja ${ministerioTab}`);
            continue;
          }
          
          // Procesar todas las filas (saltando el header)
          let registrosMinisterio = 0;
          let totalFilas = rows.length - 1; // Excluir header
          let filasConDatos = 0;
          let filasFiltradasPorPeriodo = 0;
          
          this.logger.log(`🔍 Procesando ${totalFilas} filas para ${ministerio.nombre} (filtros: desde=${periodoDesde}, hasta=${periodoHasta}, año=${año})`);
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 10) continue; // Asegurar que la fila tenga suficientes columnas
            
            const periodo = row[2]; // Columna C: Período
            const mes = row[3] || ''; // Columna D: Mes
            const valor = parseFloat(row[8]) || 0; // Columna I: Valor
            const unidad = row[9] || 'unidades'; // Columna J: Unidad
            const fuente = row[11] || 'Google Sheets'; // Columna L: Fuente
            const responsableNombre = row[12] || 'Sistema'; // Columna M: Responsable
            const estado = row[15] || 'validado'; // Columna P: Estado
            const publicado = row[16] === 'Sí' || row[16] === 'Si' || row[16] === 'sí' || row[16] === 'si' || row[16] === 'TRUE' || row[16] === 'true'; // Columna Q: Publicado
            
            // Debug: Log de primeras 3 filas
            if (i <= 3) {
              this.logger.log(`📋 Fila ${i}: Periodo="${periodo}", Valor=${valor}, Estado="${estado}", Publicado="${publicado}", ColQ_raw="${row[16]}"`);
            }
            
            // Verificar si tiene datos básicos
            if (periodo && valor !== undefined) {
              filasConDatos++;
              
              // Aplicar filtro por año si se especifica
              if (año) {
                const añoDelPeriodo = periodo.toString().substring(0, 4);
                if (añoDelPeriodo !== año) {
                  filasFiltradasPorPeriodo++;
                  continue;
                }
              }
              
              // Aplicar filtros de período si se especifican
              if (periodoDesde && periodo < periodoDesde) {
                filasFiltradasPorPeriodo++;
                continue;
              }
              if (periodoHasta && periodo > periodoHasta) {
                filasFiltradasPorPeriodo++;
                continue;
              }
              
              // INCLUIR TODOS LOS REGISTROS - si un ministerio tiene una fila, ya es válido
              datosGlobales.push({
                periodo,
                mes,
                valor,
                unidad,
                fuente,
                responsable: responsableNombre,
                estado,
                publicado,
                ministerio: ministerio.nombre, // Agregar el ministerio
              });
              registrosMinisterio++;
            }
          }
          
          this.logger.log(`📊 ${ministerio.nombre}: ${totalFilas} filas totales, ${filasConDatos} con datos, ${filasFiltradasPorPeriodo} filtradas por período, ${registrosMinisterio} incluidas`);
          this.logger.log(`📊 ${ministerio.nombre}: ${registrosMinisterio} registros encontrados`);
        } catch (error) {
          this.logger.warn(`⚠️ Error leyendo hoja del ministerio ${ministerio.nombre}: ${error.message}`);
          continue;
        }
      }
      
      this.logger.log(`📊 Vista global: ${datosGlobales.length} registros encontrados`);
      return datosGlobales;
      
    } catch (error) {
      this.logger.error(`❌ Error leyendo datos globales de Google Sheets: ${error.message}`);
      return [];
    }
  }
}
