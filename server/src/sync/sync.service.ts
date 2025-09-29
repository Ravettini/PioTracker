import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Carga } from '../db/entities/carga.entity';

interface PioSheetData {
  ministerio: string;
  compromisosConIndicadores: Array<{
    compromiso: string;
    indicadores: string[];
    avances: any;
  }>;
  compromisos: string[];
  indicadores: string[];
  avances: {
    enero?: number;
    febrero?: number;
    marzo?: number;
    abril?: number;
    mayo?: number;
    junio?: number;
    julio?: number;
    agosto?: number;
    septiembre?: number;
    octubre?: number;
    noviembre?: number;
    diciembre?: number;
    total?: number;
  };
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

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

  async importExcelFile(file: any): Promise<any> {
    try {
      this.logger.log(`Procesando archivo: ${file.originalname}`);
      
      // Leer el archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      
      const results = {
        ministeriosCreados: 0,
        lineasCreadas: 0,
        indicadoresCreados: 0,
        cargasCreadas: 0,
        errores: [],
      };

      // Procesar cada hoja (cada ministerio/área)
      this.logger.log(`🚀 Iniciando procesamiento de ${sheetNames.length} hojas:`, sheetNames);
      
      for (const sheetName of sheetNames) {
        try {
          this.logger.log(`📋 Procesando hoja: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          this.logger.log(`📊 Hoja ${sheetName}: ${data.length} filas`);
          
          if (data.length < 2) {
            this.logger.log(`⏭️ Saltando hoja ${sheetName}: menos de 2 filas`);
            continue; // Necesitamos al menos headers y una fila de datos
          }
          
          const processedData = await this.processPioSheet(sheetName, data);
          if (processedData) {
            this.logger.log(`✅ Datos procesados exitosamente para hoja ${sheetName}`);
            await this.processMinisterioData(processedData, results);
          } else {
            this.logger.log(`❌ No se pudieron procesar datos para hoja ${sheetName}`);
          }
        } catch (error) {
          this.logger.error(`Error procesando hoja ${sheetName}:`, error);
          results.errores.push(`Error en hoja ${sheetName}: ${error.message}`);
        }
      }

      this.logger.log('Importación completada', results);
      return results;
      
    } catch (error) {
      this.logger.error('Error procesando archivo Excel:', error);
      throw new Error(`Error procesando archivo: ${error.message}`);
    }
  }

  private async processPioSheet(sheetName: string, data: any[]): Promise<PioSheetData | null> {
    try {
      this.logger.log(`🔍 Procesando hoja: ${sheetName}`);
      this.logger.log(`📊 Total de filas: ${data.length}`);

      if (data.length < 2) {
        this.logger.warn(`❌ Hoja ${sheetName} tiene menos de 2 filas`);
        return null;
      }

      // Buscar la fila de headers (fila 0) y la fila de meses (fila 1)
      const headerRow = data[0];
      const monthRow = data[1];
      
      if (!Array.isArray(headerRow) || !Array.isArray(monthRow)) {
        this.logger.warn(`❌ Estructura de datos inválida en hoja ${sheetName}`);
        return null;
      }

      this.logger.log(`✅ Headers encontrados en fila 0:`, headerRow);
      this.logger.log(`✅ Meses encontrados en fila 1:`, monthRow);
      this.logger.log(`🔍 Buscando headers en hoja ${sheetName}:`);
      headerRow.forEach((header, index) => {
        if (typeof header === 'string') {
          this.logger.log(`   [${index}]: "${header}"`);
        }
      });

      // Determinar las columnas correctas basándose en los headers REALES del Excel
      let compromisosColIndex = -1;
      let indicadoresColIndex = -1;
      let mesesStartColIndex = -1;

      // Buscar columna de compromisos en la fila 0
      for (let i = 0; i < headerRow.length; i++) {
        const header = headerRow[i];
        if (typeof header === 'string') {
          if (header.includes('Compromisos')) {
            compromisosColIndex = i;
            this.logger.log(`📍 Columna de Compromisos encontrada en índice ${i}`);
          } else if (header.includes('Indicadores') || header.includes('Indicador')) {
            indicadoresColIndex = i;
            this.logger.log(`📍 Columna de Indicadores encontrada en índice ${i}`);
          }
        }
      }

      // Buscar columna de inicio de meses en la fila 1
      for (let i = 0; i < monthRow.length; i++) {
        const month = monthRow[i];
        if (typeof month === 'string') {
          if (month.includes('ENE') || month.includes('Enero') || month.includes('Ene') || 
              month.includes('FEB') || month.includes('MAR') || month.includes('ABR') ||
              month.includes('MAY') || month.includes('JUN') || month.includes('JUL') ||
              month.includes('AGO') || month.includes('SEPT') || month.includes('OCT') ||
              month.includes('NOV') || month.includes('DIC')) {
            mesesStartColIndex = i;
            this.logger.log(`📍 Columna de inicio de meses encontrada en índice ${i} (${month})`);
            break;
          }
        }
      }

      // Si no encontramos las columnas, usar valores por defecto basándose en la estructura REAL del Excel
      if (compromisosColIndex === -1) {
        compromisosColIndex = 2; // Columna C por defecto (según el análisis del Excel)
        this.logger.log(`⚠️ Usando columna por defecto para Compromisos: ${compromisosColIndex}`);
      }
      if (indicadoresColIndex === -1) {
        indicadoresColIndex = 3; // Columna D por defecto (según el análisis del Excel)
        this.logger.log(`⚠️ Usando columna por defecto para Indicadores: ${indicadoresColIndex}`);
      }
      if (mesesStartColIndex === -1) {
        mesesStartColIndex = 4; // Columna E por defecto (según el análisis del Excel)
        this.logger.log(`⚠️ Usando columna por defecto para inicio de meses: ${mesesStartColIndex}`);
      }

      // Validar que tenemos al menos las columnas básicas para procesar
      if (compromisosColIndex === -1 || indicadoresColIndex === -1) {
        this.logger.warn(`⚠️ No se pudieron identificar las columnas necesarias en hoja ${sheetName}, usando valores por defecto`);
        // Usar valores por defecto para todas las hojas
        compromisosColIndex = 2;
        indicadoresColIndex = 3;
        mesesStartColIndex = 4;
      }

      // Ajustar columnas según la estructura específica de cada hoja
      if (sheetName === 'Justicia') {
        // Justicia tiene estructura diferente
        compromisosColIndex = 1; // Columna B
        indicadoresColIndex = 2; // Columna C
        mesesStartColIndex = 3; // Columna D
        this.logger.log(`🔧 Ajustando columnas para hoja Justicia: Compromisos=${compromisosColIndex}, Indicadores=${indicadoresColIndex}, Meses=${mesesStartColIndex}`);
      } else if (sheetName === 'Salud') {
        // Salud tiene estructura diferente
        compromisosColIndex = 1; // Columna B
        indicadoresColIndex = 2; // Columna C
        mesesStartColIndex = 3; // Columna D
        this.logger.log(`🔧 Ajustando columnas para hoja Salud: Compromisos=${compromisosColIndex}, Indicadores=${indicadoresColIndex}, Meses=${mesesStartColIndex}`);
      } else if (sheetName === 'Jefatura de Gabinete' || sheetName === 'Educacion' || sheetName === 'Seguridad') {
        // Estos ministerios tienen compromisos en columna C (índice 2)
        compromisosColIndex = 2; // Columna C
        indicadoresColIndex = 3; // Columna D
        mesesStartColIndex = 4; // Columna E
        this.logger.log(`🔧 Ajustando columnas para hoja ${sheetName}: Compromisos=${compromisosColIndex}, Indicadores=${indicadoresColIndex}, Meses=${mesesStartColIndex}`);
      }

      // Estructura para mantener la relación compromiso-indicador
      const compromisosConIndicadores: Array<{
        compromiso: string;
        indicadores: string[];
        avances: any;
      }> = [];

      // Procesar filas de datos - empezar desde la fila 2 (después de headers y meses)
      const dataStartRow = 2;
      this.logger.log(`🚀 Procesando datos desde la fila ${dataStartRow}`);
      this.logger.log(`📍 Columnas: Compromisos=${compromisosColIndex}, Indicadores=${indicadoresColIndex}, Meses=${mesesStartColIndex}`);

      // Lógica mejorada para procesar compromisos e indicadores
      let currentCompromiso: string | null = null;
      let currentIndicadores: string[] = [];
      let currentAvances: any = {};

      for (let i = dataStartRow; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row) || row.length === 0) continue;

        const compromisoCell = row[compromisosColIndex];
        const indicadorCell = row[indicadoresColIndex];

        // Si encontramos un nuevo compromiso
        if (compromisoCell && typeof compromisoCell === 'string' && compromisoCell.trim()) {
          const compromiso = compromisoCell.trim();
          
          this.logger.log(`🔍 Evaluando compromiso: "${compromiso}"`);
          
          // Solo procesar si no es un encabezado y tiene contenido válido
          if (compromiso && 
              !compromiso.includes('Compromisos') && 
              !compromiso.includes('Ministerio') &&
              !compromiso.includes('Area') &&
              !compromiso.includes('A través de') &&
              compromiso.length > 3 &&
              (compromiso.match(/^[A-Z]\)/) || compromiso.match(/^\d+\./) || compromiso.match(/^\d+ /) || compromiso.match(/^\d+\)/) || compromiso.match(/^\d+/))) {
            
            this.logger.log(`✅ Compromiso válido encontrado: "${compromiso}"`);
            
            // Si teníamos un compromiso anterior, guardarlo
            if (currentCompromiso && currentIndicadores.length > 0) {
              compromisosConIndicadores.push({
                compromiso: currentCompromiso,
                indicadores: currentIndicadores,
                avances: currentAvances
              });
              this.logger.log(`✅ Compromiso guardado: "${currentCompromiso}" con ${currentIndicadores.length} indicadores`);
            }

            // Iniciar nuevo compromiso
            currentCompromiso = compromiso;
            currentIndicadores = [];
            currentAvances = {};
            this.logger.log(`🔍 Nuevo compromiso encontrado: "${compromiso}"`);
          } else {
            this.logger.log(`❌ Compromiso rechazado: "${compromiso}" - No cumple criterios de validación`);
          }
        }

        // Si encontramos un indicador
        if (indicadorCell && typeof indicadorCell === 'string' && indicadorCell.trim()) {
          const indicador = indicadorCell.trim();
          
          if (indicador && 
              !indicador.includes('Indicadores') && 
              !indicador.includes('Indicador') &&
              indicador.length > 3 &&
              currentCompromiso &&
              !indicador.match(/^[A-Z]\)/) && // No es un compromiso
              !indicador.match(/^\d+\./) && // No es un compromiso numerado
              !indicador.match(/^\d+ /)) { // No es un compromiso numerado
            
            currentIndicadores.push(indicador);
            this.logger.log(`🔍 Indicador encontrado para compromiso "${currentCompromiso}": "${indicador}"`);
            
            // Procesar avances mensuales para esta fila
            for (let k = mesesStartColIndex; k < Math.min(monthRow.length, row.length); k++) {
              const monthHeader = monthRow[k];
              const value = row[k];
              
              if (monthHeader && typeof monthHeader === 'string') {
                const month = this.extractMonth(monthHeader);
                if (month) {
                  // Ser más flexible: aceptar números, porcentajes, y texto que contenga números
                  let numericValue = null;
                  
                  if (typeof value === 'number') {
                    numericValue = value;
                  } else if (typeof value === 'string') {
                    // Extraer números de texto como "39%", "4 casos", "300 participantes"
                    const numberMatch = value.match(/(\d+(?:\.\d+)?)/);
                    if (numberMatch) {
                      numericValue = parseFloat(numberMatch[1]);
                      // Si es un porcentaje, convertirlo a decimal
                      if (value.includes('%')) {
                        numericValue = numericValue / 100;
                      }
                    }
                  }
                  
                  if (numericValue !== null && numericValue > 0) {
                    currentAvances[month] = numericValue;
                    this.logger.log(`📊 Avance para ${month}: ${numericValue} (extraído de: ${value})`);
                  }
                }
              }
            }
          }
        }
      }

      // Guardar el último compromiso si tiene indicadores
      if (currentCompromiso && currentIndicadores.length > 0) {
        compromisosConIndicadores.push({
          compromiso: currentCompromiso,
          indicadores: currentIndicadores,
          avances: currentAvances
        });
        this.logger.log(`✅ Último compromiso guardado: "${currentCompromiso}" con ${currentIndicadores.length} indicadores`);
      }

      this.logger.log(`📊 Resumen de datos encontrados en hoja "${sheetName}":`);
      this.logger.log(`   - Compromisos con indicadores: ${compromisosConIndicadores.length}`);
      
      // Mostrar los compromisos encontrados
      compromisosConIndicadores.forEach((c, index) => {
        this.logger.log(`   📋 Compromiso ${index + 1}: "${c.compromiso}"`);
        this.logger.log(`      - Indicadores: ${c.indicadores.length}`);
        this.logger.log(`      - Avances: ${Object.keys(c.avances).length}`);
      });
      
      let totalIndicadores = 0;
      let totalAvances = 0;
      compromisosConIndicadores.forEach(c => {
        totalIndicadores += c.indicadores.length;
        totalAvances += Object.keys(c.avances).length;
      });
      
      this.logger.log(`   - Total de indicadores: ${totalIndicadores}`);
      this.logger.log(`   - Total de avances: ${totalAvances}`);

      return {
        ministerio: sheetName,
        compromisosConIndicadores,
        compromisos: compromisosConIndicadores.map(c => c.compromiso),
        indicadores: compromisosConIndicadores.flatMap(c => c.indicadores),
        avances: compromisosConIndicadores.reduce((acc, c) => ({ ...acc, ...c.avances }), {}),
      };
    } catch (error) {
      this.logger.error(`❌ Error procesando hoja ${sheetName}:`, error);
      return null;
    }
  }

  /**
   * Normaliza y limpia los datos del Excel para manejar celdas fusionadas y estructura irregular
   */
  private normalizeExcelData(data: any[]): any[] {
    const normalizedData: any[] = [];
    let currentMinisterio = '';
    let currentCompromiso = '';
    
    this.logger.log(`🧹 Iniciando normalización de datos...`);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      const normalizedRow = [...row]; // Copiar la fila
      
      // Manejar celdas fusionadas del ministerio (columna A)
      if (row[0] && typeof row[0] === 'string' && row[0].trim()) {
        const ministerioCell = row[0].trim();
        if (ministerioCell && !ministerioCell.includes('Ministerio')) {
          currentMinisterio = ministerioCell;
          this.logger.log(`🏛️ Ministerio detectado: "${currentMinisterio}"`);
        }
      }
      
      // Si no hay ministerio en esta fila, usar el anterior
      if (!normalizedRow[0] || (typeof normalizedRow[0] === 'string' && !normalizedRow[0].trim())) {
        normalizedRow[0] = currentMinisterio;
      }
      
      // Manejar celdas fusionadas de compromisos (columna B)
      if (row[1] && typeof row[1] === 'string' && row[1].trim()) {
        const compromisoCell = row[1].trim();
        if (compromisoCell && 
            !compromisoCell.includes('Compromisos') && 
            !compromisoCell.includes('Ministerio') &&
            compromisoCell.length > 3) {
          currentCompromiso = compromisoCell;
          this.logger.log(`📋 Compromiso detectado: "${currentCompromiso}"`);
        }
      }
      
      // Si no hay compromiso en esta fila, usar el anterior
      if (!normalizedRow[1] || (typeof normalizedRow[1] === 'string' && !normalizedRow[1].trim())) {
        normalizedRow[1] = currentCompromiso;
      }
      
      // Solo agregar filas que tengan contenido útil
      if (this.hasUsefulContent(normalizedRow)) {
        normalizedData.push(normalizedRow);
        this.logger.log(`✅ Fila normalizada ${i}: [${normalizedRow.slice(0, 4).map(cell => 
          typeof cell === 'string' ? `"${cell.substring(0, 30)}${cell.length > 30 ? '...' : ''}"` : cell
        ).join(', ')}]`);
      }
    }
    
    this.logger.log(`🧹 Normalización completada: ${normalizedData.length} filas útiles de ${data.length} totales`);
    return normalizedData;
  }
  
  /**
   * Verifica si una fila tiene contenido útil para procesar
   */
  private hasUsefulContent(row: any[]): boolean {
    // Una fila es útil si tiene al menos 2 celdas con contenido
    let contentCount = 0;
    for (let i = 0; i < Math.min(row.length, 5); i++) {
      if (row[i] && typeof row[i] === 'string' && row[i].trim().length > 0) {
        contentCount++;
      }
    }
    return contentCount >= 2;
  }

  private extractMonth(header: string): string | null {
    const monthMap: { [key: string]: string } = {
      // Nombres completos
      'enero': 'enero',
      'febrero': 'febrero',
      'marzo': 'marzo',
      'abril': 'abril',
      'mayo': 'mayo',
      'junio': 'junio',
      'julio': 'julio',
      'agosto': 'agosto',
      'septiembre': 'septiembre',
      'octubre': 'octubre',
      'noviembre': 'noviembre',
      'diciembre': 'diciembre',
      // Abreviaciones
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
    };

    const lowerHeader = header.toLowerCase();
    for (const [spanish, english] of Object.entries(monthMap)) {
      if (lowerHeader.includes(spanish)) {
        return english;
      }
    }
    return null;
  }

  private async processMinisterioData(data: PioSheetData, results: any): Promise<void> {
    try {
      // Crear o actualizar ministerio
      let ministerio = await this.ministerioRepository.findOne({
        where: { nombre: data.ministerio }
      });

      if (!ministerio) {
        ministerio = this.ministerioRepository.create({
          id: this.generateShortId(data.ministerio),
          nombre: data.ministerio,
          sigla: this.generateShortId(data.ministerio), // Campo requerido
          activo: true,
        });
        await this.ministerioRepository.save(ministerio);
        results.ministeriosCreados++;
        this.logger.log(`✅ Ministerio creado: ${data.ministerio}`);
      } else {
        this.logger.log(`✅ Ministerio existente: ${data.ministerio}`);
      }

      // Limpiar líneas existentes de este ministerio para evitar duplicados
      const lineasExistentes = await this.lineaRepository.find({
        where: { ministerioId: ministerio.id }
      });
      
      if (lineasExistentes.length > 0) {
        this.logger.log(`🗑️ Eliminando ${lineasExistentes.length} líneas existentes del ministerio ${data.ministerio}`);
        
        // Eliminar indicadores asociados primero
        for (const linea of lineasExistentes) {
          const indicadores = await this.indicadorRepository.find({
            where: { lineaId: linea.id }
          });
          
          for (const indicador of indicadores) {
            // Eliminar cargas asociadas
            await this.cargaRepository.delete({ indicadorId: indicador.id });
            this.logger.log(`🗑️ Carga eliminada para indicador: ${indicador.nombre}`);
          }
          
          // Eliminar indicadores
          await this.indicadorRepository.delete({ lineaId: linea.id });
          this.logger.log(`🗑️ Indicadores eliminados de la línea: ${linea.id}`);
        }
        
        // Eliminar líneas
        await this.lineaRepository.delete({ ministerioId: ministerio.id });
        this.logger.log(`🗑️ Líneas eliminadas del ministerio: ${data.ministerio}`);
      }

      // Crear líneas basadas en los compromisos de ESTA hoja específica
      this.logger.log(`🔍 Procesando ${data.compromisosConIndicadores.length} compromisos para ministerio ${data.ministerio}`);
      
      for (const compromisoData of data.compromisosConIndicadores) {
        const compromiso = compromisoData.compromiso;
        const indicadores = compromisoData.indicadores;
        const avances = compromisoData.avances;

        if (compromiso.trim()) {
          this.logger.log(`📋 Procesando compromiso para ${data.ministerio}: "${compromiso}"`);
          
          // Generar ID único para la línea
          const lineaId = this.generateShortId(compromiso);
          
          // Crear nueva línea
          const linea = this.lineaRepository.create({
            id: lineaId,
            titulo: compromiso.substring(0, 100), // Campo requerido
            ministerioId: ministerio.id,
            activo: true,
          });
          await this.lineaRepository.save(linea);
          results.lineasCreadas++;
          this.logger.log(`✅ Línea creada para ministerio ${data.ministerio}: "${compromiso}"`);

          // Crear indicadores basados en los indicadores del Excel
          for (const indicadorText of indicadores) {
            if (indicadorText.trim()) {
              const indicadorId = this.generateShortId(indicadorText);
              
              // Crear nuevo indicador
              const indicador = this.indicadorRepository.create({
                id: indicadorId,
                nombre: indicadorText.substring(0, 100), // Limitar longitud
                lineaId: linea.id,
                unidadDefecto: 'unidad',
                periodicidad: 'mensual' as any,
                activo: true,
              });
              await this.indicadorRepository.save(indicador);
              results.indicadoresCreados++;
              this.logger.log(`✅ Indicador creado para línea "${compromiso}": "${indicadorText}"`);

              // Crear cargas para cada mes con avances
              for (const [month, value] of Object.entries(avances)) {
                if (typeof value === 'number' && value > 0) {
                  const carga = this.cargaRepository.create({
                    indicadorId: indicador.id,
                    ministerioId: ministerio.id,
                    lineaId: linea.id,
                    periodicidad: 'mensual' as any,
                    periodo: `2024-${this.getMonthNumber(month)}`,
                    valor: value,
                    unidad: 'unidad',
                    fuente: 'Importación Excel',
                    responsableNombre: 'Sistema',
                    responsableEmail: 'sistema@pio.local',
                    creadoPor: null, // No requerido para importación
                    actualizadoPor: null, // No requerido para importación
                    estado: 'validado' as any,
                    publicado: true,
                  });
                  await this.cargaRepository.save(carga);
                  results.cargasCreadas++;
                  this.logger.log(`✅ Carga creada para ${month}: ${value}`);
                }
              }
            }
          }
        }
      }



    } catch (error) {
      this.logger.error(`Error procesando ministerio ${data.ministerio}:`, error);
      results.errores.push(`Error en ministerio ${data.ministerio}: ${error.message}`);
    }
  }

  private generateShortId(nombre: string): string {
    // Generar ID corto basado en el nombre
    const words = nombre.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'MIN';
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }

  private getMonthNumber(month: string): string {
    const monthMap: { [key: string]: string } = {
      'enero': '01',
      'febrero': '02',
      'marzo': '03',
      'abril': '04',
      'mayo': '05',
      'junio': '06',
      'julio': '07',
      'agosto': '08',
      'septiembre': '09',
      'octubre': '10',
      'noviembre': '11',
      'diciembre': '12',
    };
    return monthMap[month] || '01';
  }

  async syncToGoogleSheets(): Promise<any> {
    try {
      this.logger.log('🔄 Sincronización con Google Sheets iniciada');
      
      // Obtener todos los datos de la base de datos
      const ministerios = await this.ministerioRepository.find({ 
        where: { activo: true },
        relations: ['lineas', 'lineas.indicadores', 'lineas.indicadores.cargas']
      });
      
      this.logger.log(`📊 Sincronizando ${ministerios.length} ministerios`);
      
      let totalRegistros = 0;
      let registrosSincronizados = 0;
      
      for (const ministerio of ministerios) {
        this.logger.log(`🏛️ Procesando ministerio: ${ministerio.nombre}`);
        
        for (const linea of ministerio.lineas) {
          if (!linea.activo) continue;
          
          for (const indicador of linea.indicadores) {
            if (!indicador.activo) continue;
            
            totalRegistros++;
            
            // Buscar la carga más reciente para este indicador
            const cargas = await this.cargaRepository.find({
              where: { 
                indicadorId: indicador.id,
                estado: 'validado' as any,
                publicado: true
              },
              order: { periodo: 'DESC' }
            });
            
            if (cargas.length > 0) {
              const cargaMasReciente = cargas[0];
              this.logger.log(`📊 Sincronizando indicador: ${indicador.nombre} - Valor: ${cargaMasReciente.valor} - Período: ${cargaMasReciente.periodo}`);
              
              // Llamada real a Google Sheets API
              await this.upsertFactRow({
                indicadorId: indicador.id,
                indicador: indicador.nombre,
                periodo: cargaMasReciente.periodo,
                mes: cargaMasReciente.mes,
                ministerioId: ministerio.id,
                ministerio: ministerio.nombre,
                lineaId: linea.id,
                linea: linea.titulo,
                valor: cargaMasReciente.valor,
                unidad: cargaMasReciente.unidad,
                meta: cargaMasReciente.meta,
                fuente: cargaMasReciente.fuente,
                responsableNombre: cargaMasReciente.responsableNombre,
                responsableEmail: cargaMasReciente.responsableEmail,
                observaciones: cargaMasReciente.observaciones
              });
              
              registrosSincronizados++;
            }
          }
        }
      }
      
      this.logger.log(`✅ Sincronización completada: ${registrosSincronizados}/${totalRegistros} registros sincronizados`);
      
      return {
        message: 'Sincronización completada',
        timestamp: new Date().toISOString(),
        totalRegistros,
        registrosSincronizados,
        detalles: {
          ministerios: ministerios.length,
          lineas: ministerios.reduce((acc, m) => acc + m.lineas.length, 0),
          indicadores: ministerios.reduce((acc, m) => acc + m.lineas.reduce((acc2, l) => acc2 + l.indicadores.length, 0), 0),
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Error en sincronización con Google Sheets:', error);
      throw new Error(`Error en sincronización: ${error.message}`);
    }
  }

  // Función auxiliar para insertar/actualizar filas en Google Sheets con lógica dinámica por ministerio
  async upsertFactRow(data: {
    indicadorId: string;
    indicador: string;
    periodo: string;
    mes: string;
    ministerioId: string;
    ministerio: string;
    lineaId: string;
    linea: string;
    valor: number;
    unidad: string;
    meta?: number;
    fuente: string;
    responsableNombre: string;
    responsableEmail: string;
    observaciones?: string;
  }): Promise<void> {
    try {
      this.logger.log(`📝 Upsert en Google Sheets: ${data.ministerio} - ${data.linea} - ${data.indicador} = ${data.valor} ${data.unidad}`);
      
      // Verificar configuración de Google Sheets
      const config = this.configService.get('google');
      if (!config.sheetId) {
        this.logger.warn('⚠️ GOOGLE_SHEET_ID no configurado. Saltando sincronización.');
        return;
      }
      
      // Usar Service Account si está configurado, sino usar OAuth
      let sheets;
      if (config.serviceAccount?.clientEmail) {
        this.logger.log('🔑 Usando Service Account para autenticación');
        const { GoogleServiceAccountService } = await import('./google-service-account.service');
        const serviceAccountService = new GoogleServiceAccountService(this.configService);
        sheets = await serviceAccountService.getSheetsClient();
      } else if (config.refreshToken) {
        this.logger.log('🔑 Usando OAuth para autenticación');
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
        this.logger.warn('⚠️ No hay credenciales de Google configuradas. Saltando sincronización.');
        return;
      }
      
      // Generar nombre de hoja dinámico basado en el ministerio
      const ministerioTab = this.generateMinisterioTabName(data.ministerio);
      this.logger.log(`🏛️ Usando hoja: ${ministerioTab} para ministerio: ${data.ministerio}`);
      
      // Verificar si la hoja existe, si no, crearla
      await this.ensureMinisterioSheetExists(sheets, config.sheetId, ministerioTab);
      
      // Preparar datos para la fila con estructura correcta
      const rowData = [
        data.indicadorId || '',           // A - Indicador ID
        data.indicador,                   // B - Indicador Nombre
        data.periodo,                     // C - Período
        data.mes,                         // D - Mes
        data.ministerioId || '',          // E - Ministerio ID
        data.ministerio,                  // F - Ministerio Nombre
        data.lineaId || '',               // G - Línea ID
        data.linea,                       // H - Línea Título
        data.valor,                       // I - Valor
        data.unidad,                      // J - Unidad
        data.meta || '',                  // K - Meta
        data.fuente,                      // L - Fuente
        data.responsableNombre || '',     // M - Responsable Nombre
        data.responsableEmail || '',      // N - Responsable Email
        data.observaciones || '',         // O - Observaciones
        'validado',                       // P - Estado
        'Sí',                             // Q - Publicado
        new Date().toISOString(),         // R - Creado En
        new Date().toISOString()          // S - Actualizado En
      ];
      
      // Buscar si ya existe una fila con el mismo indicador/periodo en la hoja del ministerio
      const range = `${ministerioTab}!A:S`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: range,
      });
      
      const rows = response.data.values || [];
      let rowIndex = -1;
      
      // Buscar fila existente por Indicador ID y Período
      for (let i = 1; i < rows.length; i++) { // Saltar header
        const row = rows[i];
        if (row[0] === (data.indicadorId || '') && 
            row[2] === data.periodo) {
          rowIndex = i + 1; // +1 porque Google Sheets es 1-indexed
          break;
        }
      }
      
      if (rowIndex > 0) {
        // Actualizar fila existente
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheetId,
          range: `${ministerioTab}!A${rowIndex}:S${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowData]
          }
        });
        this.logger.log(`✅ Fila actualizada en Google Sheets (hoja: ${ministerioTab}, fila ${rowIndex})`);
      } else {
        // Insertar nueva fila al final
        await sheets.spreadsheets.values.append({
          spreadsheetId: config.sheetId,
          range: `${ministerioTab}!A:S`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [rowData]
          }
        });
        this.logger.log(`✅ Nueva fila insertada en Google Sheets (hoja: ${ministerioTab})`);
      }
      
    } catch (error) {
      this.logger.error(`❌ Error en upsertFactRow: ${error.message}`);
      // No lanzar error para no interrumpir la sincronización completa
    }
  }

  // Generar nombre de hoja basado en el ministerio
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

  // Asegurar que la hoja del ministerio existe
  private async ensureMinisterioSheetExists(sheets: any, sheetId: string, tabName: string): Promise<void> {
    try {
      // Obtener información del spreadsheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId
      });
      
      const existingSheets = spreadsheet.data.sheets.map((sheet: any) => sheet.properties.title);
      
      if (!existingSheets.includes(tabName)) {
        this.logger.log(`📋 Creando nueva hoja: ${tabName}`);
        
        // Crear nueva hoja
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: tabName
                }
              }
            }]
          }
        });
        
        // Agregar headers a la nueva hoja
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tabName}!A1:H1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Línea de Acción',
              'Indicador',
              'Valor',
              'Unidad',
              'Período',
              'Fuente',
              'Fecha de Sincronización',
              'Estado'
            ]]
          }
        });
        
        this.logger.log(`✅ Hoja ${tabName} creada exitosamente con headers`);
      } else {
        this.logger.log(`✅ Hoja ${tabName} ya existe`);
      }
      
    } catch (error) {
      this.logger.error(`❌ Error creando hoja ${tabName}: ${error.message}`);
      throw error;
    }
  }

  async testGoogleSheetsConnection(): Promise<any> {
    try {
      this.logger.log('🧪 Probando conexión con Google Sheets...');
      
      // Verificar configuración
      const config = this.configService.get('google');
      if (!config.sheetId || !config.refreshToken) {
        throw new Error('Configuración de Google Sheets incompleta');
      }
      
      this.logger.log(`📊 Sheet ID: ${config.sheetId}`);
      this.logger.log(`🔑 Refresh Token: ${config.refreshToken ? 'Configurado' : 'No configurado'}`);
      
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
      
      // Probar acceso al spreadsheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.sheetId
      });
      
      this.logger.log(`✅ Conexión exitosa con Google Sheets: ${spreadsheet.data.properties.title}`);
      
      // Listar hojas existentes
      const existingSheets = spreadsheet.data.sheets.map((sheet: any) => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId
      }));
      
      this.logger.log(`📋 Hojas existentes: ${existingSheets.map(s => s.title).join(', ')}`);
      
      // Probar escritura en una hoja de prueba
      const testTabName = 'Test_Conexion';
      const testData = [
        ['Test', 'Conexión', 'Exitosa', new Date().toISOString()]
      ];
      
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: config.sheetId,
          range: `${testTabName}!A:D`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: testData
          }
        });
        this.logger.log(`✅ Escritura de prueba exitosa en hoja: ${testTabName}`);
      } catch (writeError) {
        this.logger.warn(`⚠️ No se pudo escribir en hoja de prueba: ${writeError.message}`);
      }
      
      return {
        spreadsheetTitle: spreadsheet.data.properties.title,
        spreadsheetId: config.sheetId,
        existingSheets: existingSheets,
        testWriteSuccess: true,
        config: {
          clientId: config.oauth.clientId ? 'Configurado' : 'No configurado',
          clientSecret: config.oauth.clientSecret ? 'Configurado' : 'No configurado',
          refreshToken: config.refreshToken ? 'Configurado' : 'No configurado',
          sheetId: config.sheetId ? 'Configurado' : 'No configurado'
        }
      };
      
    } catch (error) {
      this.logger.error(`❌ Error en test de Google Sheets: ${error.message}`);
      throw error;
    }
  }
}





