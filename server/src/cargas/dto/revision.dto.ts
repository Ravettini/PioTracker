import { IsString, IsEnum, IsOptional } from 'class-validator';
import { EstadoCarga } from '../../db/entities/carga.entity';

export class RevisionDto {
  @IsEnum(EstadoCarga, { 
    message: 'El estado debe ser validado, observado o rechazado' 
  })
  estado: EstadoCarga;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}








