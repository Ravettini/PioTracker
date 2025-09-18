import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
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
    this.logger.log(`📊 Obteniendo datos de analytics:`, query);

    const { indicadorId, periodoDesde, periodoHasta, vista = 'total' } = query;
    this.logger.log(`📊 Vista seleccionada: ${vista}`);

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
    this.logger.log(`📊 Datos obtenidos del Google Sheets: ${sheetData.length} registros`);
    this.logger.log(`📊 Primeros 3 registros:`, sheetData.slice(0, 3).map(d => `Período=${d.periodo}, Mes="${d.mes}", Valor=${d.valor}`));

    // Determinar tipo de indicador
    const tipo = this.determinarTipoIndicador(indicador.nombre);

    // Procesar datos según el tipo de vista
    let processedData;
    if (vista === 'mensual') {
      this.logger.log(`📊 Procesando datos para vista MENSUAL`);
      processedData = this.procesarDatosMensuales(sheetData);
    } else {
      this.logger.log(`📊 Procesando datos para vista TOTAL`);
      processedData = this.procesarDatosTotales(sheetData);
    }
    
    this.logger.log(`📊 Datos procesados: Periodos=${processedData.periodos.join(', ')}, Valores=${processedData.valores.join(', ')}`);

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
    // Vista Total: Suma TODOS los valores del indicador (sin agrupar)
    const valorTotal = sheetData.reduce((sum, row) => sum + row.valor, 0);
    
    this.logger.log(`📊 Vista Total: Valor total=${valorTotal}`);

    return {
      periodos: ['Total'],
      valores: [valorTotal],
      metas: undefined, // NO MOSTRAR METAS
    };
  }

  private procesarDatosMensuales(sheetData: any[]): { periodos: string[]; valores: number[]; metas?: number[] } {
    this.logger.log(`📊 Procesando ${sheetData.length} filas para vista mensual`);
    
    // Agrupar por mes de la columna "Mes" del sheets y sumar SOLO valores
    const agrupado = sheetData.reduce((acc, row) => {
      const mes = row.mes || 'Sin mes';
      this.logger.log(`📅 Procesando fila: Mes="${mes}", Valor=${row.valor}`);
      
      if (!acc[mes]) {
        acc[mes] = { valor: 0, count: 0 };
      }
      acc[mes].valor += row.valor;
      acc[mes].count += 1;
      return acc;
    }, {});

    this.logger.log(`📊 Datos agrupados por mes:`, Object.keys(agrupado));

    // Ordenar meses cronológicamente - manejar formato "2024 JUNIO", "2024 JULIO", etc.
    const ordenMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const periodos = Object.keys(agrupado).sort((a, b) => {
      // Extraer el mes del formato "2024 JUNIO" o similar
      const mesA = this.extraerMesDePeriodo(a);
      const mesB = this.extraerMesDePeriodo(b);
      
      const indexA = ordenMeses.indexOf(mesA.toLowerCase());
      const indexB = ordenMeses.indexOf(mesB.toLowerCase());
      
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const valores = periodos.map(p => agrupado[p].valor);

    this.logger.log(`📊 Resultado final mensual: Periodos=${periodos.join(', ')}, Valores=${valores.join(', ')}`);

    return {
      periodos,
      valores,
      metas: undefined, // NO MOSTRAR METAS
    };
  }

  private extraerMesDePeriodo(periodo: string): string {
    if (!periodo || periodo === 'Sin mes') {
      return 'enero'; // Valor por defecto para ordenamiento
    }
    
    // Si el período tiene formato "2024 JUNIO", extraer solo "JUNIO"
    const partes = periodo.split(' ');
    if (partes.length > 1) {
      return partes[partes.length - 1]; // Tomar la última parte (el mes)
    }
    
    return periodo;
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

  private parseDecimalValue(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (!value || value === '') {
      return 0;
    }
    
    // Convertir a string y limpiar
    let cleanValue = String(value).trim();
    
    // Si tiene comas como separador decimal, convertir a punto
    if (cleanValue.includes(',') && !cleanValue.includes('.')) {
      // Caso: "910,161015" -> "910.161015"
      cleanValue = cleanValue.replace(',', '.');
    } else if (cleanValue.includes(',') && cleanValue.includes('.')) {
      // Caso: "1.000,50" -> "1000.50" (formato europeo con miles separados por punto y decimal por coma)
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        // Hay múltiples puntos, el último es decimal
        const lastPart = parts.pop();
        const integerPart = parts.join('');
        cleanValue = `${integerPart}.${lastPart}`;
      } else {
        // Solo un punto, asumir que es separador de miles
        cleanValue = cleanValue.replace('.', '').replace(',', '.');
      }
    }
    
    const parsed = parseFloat(cleanValue);
    
    if (isNaN(parsed)) {
      this.logger.warn(`⚠️ No se pudo parsear el valor: "${value}" -> "${cleanValue}"`);
      return 0;
    }
    
    this.logger.log(`🔢 Valor parseado: "${value}" -> "${cleanValue}" -> ${parsed}`);
    return parsed;
  }

  private async getDataFromGoogleSheets(indicadorId: string, periodoDesde?: string, periodoHasta?: string): Promise<any[]> {
    try {
      this.logger.log(`📊 Leyendo datos de Google Sheets para indicador: ${indicadorId}`);
      
      // Verificar configuración de Google Sheets
      const config = this.configService.get('google');
      if (!config.sheetId || !config.refreshToken) {
        this.logger.warn('⚠️ Configuración de Google Sheets incompleta. Usando base de datos local.');
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
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

      // Crear cliente de Google Sheets
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        config.oauth.clientId,
        config.oauth.clientSecret,
        config.oauth.authUri
      );
      
      oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
      
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      
      // Leer datos de todas las hojas disponibles
      // Primero obtener la lista de hojas disponibles
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: config.sheetId,
      });
      
      const sheetNames = spreadsheetInfo.data.sheets.map(sheet => sheet.properties.title);
      this.logger.log(`📋 Hojas disponibles: ${sheetNames.join(', ')}`);
      
      // Buscar en todas las hojas hasta encontrar datos
      let allRows = [];
      let foundData = false;
      
      for (const sheetName of sheetNames) {
        try {
          const range = `${sheetName}!A:Q`;
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.sheetId,
            range: range,
          });
          
          const rows = response.data.values || [];
          if (rows.length > 1) {
            this.logger.log(`📊 Encontrados ${rows.length - 1} filas en hoja: ${sheetName}`);
            allRows = allRows.concat(rows.map(row => ({ ...row, sheetName })));
            foundData = true;
          }
        } catch (error) {
          this.logger.warn(`⚠️ Error leyendo hoja ${sheetName}: ${error.message}`);
        }
      }
      
      if (!foundData || allRows.length <= 1) {
        this.logger.warn(`⚠️ No se encontraron datos en ninguna hoja. Usando base de datos local.`);
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
      }
      
      const rows = allRows;
      
      // Procesar filas y filtrar por indicador
      const datosIndicador = [];
      const headers = rows[0]; // Primera fila son los headers
      
      this.logger.log(`🔍 Buscando indicador: "${indicadorId}" en ${rows.length - 1} filas`);
      this.logger.log(`📋 Headers encontrados:`, headers);
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 7) continue; // Asegurar que la fila tenga suficientes columnas
        
        // Log de cada fila para debug
        if (i <= 5) { // Solo log de las primeras 5 filas para no saturar
          this.logger.log(`📋 Fila ${i} (${row.sheetName || 'sin hoja'}): IndicadorID="${row[0]}", Mes="${row[3]}", Valor="${row[8]}"`);
        }
        
        // Filtrar por indicador ID (columna A) o por nombre del indicador (columna B)
        const indicadorIdEnRow = row[0];
        const indicadorNombreEnRow = row[1];
        
        // Buscar por ID exacto o por nombre del indicador
        const coincidePorId = indicadorIdEnRow === indicadorId;
        const coincidePorNombre = indicadorNombreEnRow && indicador.nombre && 
                                 indicadorNombreEnRow.toLowerCase().includes(indicador.nombre.toLowerCase());
        
        if (coincidePorId || coincidePorNombre) {
          const tipoCoincidencia = coincidePorId ? 'ID' : 'NOMBRE';
          this.logger.log(`✅ Coincidencia por ${tipoCoincidencia}: "${indicadorIdEnRow}" -> "${indicadorNombreEnRow}"`);
          
          const periodo = row[2] || ''; // Columna C: Período
          const mes = this.normalizarMes(row[3] || ''); // Columna D: Mes
          const valorRaw = row[8] || '0'; // Columna I: Valor
          
          // Convertir valor con comas decimales a número
          const valor = this.parseDecimalValue(valorRaw);
          
          const meta = row[10] && row[10].trim() !== '' ? this.parseDecimalValue(row[10]) : 0; // Columna K: Meta
          const unidad = row[9] || 'unidades'; // Columna J: Unidad
          const fuente = row[11] || 'Google Sheets'; // Columna L: Fuente
          const responsableNombre = row[12] || 'Sistema'; // Columna M: Responsable N
          const responsableEmail = row[13] || 'sistema@pio.gob.ar'; // Columna N: Responsable Er
          const observaciones = row[14] || ''; // Columna O: Observaciones
          const estado = row[15] || 'validado'; // Columna P: Estado
          const publicado = row[16] === 'Sí'; // Columna Q: Publicado
          const creadoEn = row[17] ? new Date(row[17]) : new Date(); // Columna R: Creado En
          const actualizadoEn = row[18] ? new Date(row[18]) : new Date(); // Columna S: Actualizado En
          
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
            responsableEmail,
            observaciones,
            estado,
            publicado,
            creadoEn,
            actualizadoEn,
          });
          
          // Log para debugging
          this.logger.log(`📊 Datos leídos: Período=${periodo}, Mes="${mes}", Valor=${valor}, Meta=${meta}`);
        }
      }
      
      // Ordenar por período
      datosIndicador.sort((a, b) => a.periodo.localeCompare(b.periodo));
      
      this.logger.log(`✅ Encontrados ${datosIndicador.length} registros en Google Sheets para indicador ${indicadorId}`);
      
      if (datosIndicador.length > 0) {
        this.logger.log(`📊 Primeros registros encontrados:`, datosIndicador.slice(0, 3).map(d => `Mes=${d.mes}, Valor=${d.valor}`));
      }
      
      // Si no hay datos en Sheets, usar base de datos local como fallback
      if (datosIndicador.length === 0) {
        this.logger.warn(`⚠️ No se encontraron datos en Google Sheets para indicador ${indicadorId}. Usando base de datos local.`);
        return this.getDataFromLocalDatabase(indicadorId, periodoDesde, periodoHasta);
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
    // Mapeo de nombres de ministerios a nombres de hojas existentes
    const ministerioMap: { [key: string]: string } = {
      'Educación': 'Educacion',
      'Ente regulador de servicios públicos': 'Ente regulador de servicios púb',
      'Espacio Público': 'Espacio Publico',
      'Hacienda y finanzas': 'Hacienda y finanzas',
      'Jefatura de Gabinete': 'Jefatura de Gabinete',
      'Justicia': 'Justicia',
      'MDHyH': 'MDHyH',
      'Salud': 'Salud',
      'Seguridad': 'Seguridad',
      'Vicejefatura': 'Vicejefatura'
    };
    
    // Si existe el mapeo, usar el nombre de la hoja existente
    if (ministerioMap[ministerio]) {
      return ministerioMap[ministerio];
    }
    
    // Si no existe el mapeo, crear nombre limpio
    const cleanName = ministerio
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .substring(0, 30); // Limitar longitud
    
    return `Ministerio_${cleanName}`;
  }
}
