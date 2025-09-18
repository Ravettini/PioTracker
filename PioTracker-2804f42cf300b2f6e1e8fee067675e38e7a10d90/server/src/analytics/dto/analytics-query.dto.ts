import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum TipoIndicador {
  PORCENTAJE = 'porcentaje',
  CANTIDAD = 'cantidad',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  ministerioId?: string;

  @IsOptional()
  @IsString()
  compromisoId?: string;

  @IsOptional()
  @IsString()
  indicadorId?: string;

  @IsOptional()
  @IsString()
  periodoDesde?: string;

  @IsOptional()
  @IsString()
  periodoHasta?: string;

  @IsOptional()
  @IsEnum(TipoIndicador)
  tipoIndicador?: TipoIndicador;

  @IsOptional()
  @IsString()
  vista?: 'total' | 'mensual'; // Nueva opción para tipo de vista
}
