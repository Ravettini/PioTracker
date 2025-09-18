import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMetaMensualDto {
  @IsOptional()
  @IsNumber({}, { message: 'La meta debe ser numérica' })
  meta?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
