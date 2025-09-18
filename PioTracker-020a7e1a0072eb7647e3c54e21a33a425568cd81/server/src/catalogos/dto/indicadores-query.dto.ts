import { IsOptional, IsString } from 'class-validator';

export class IndicadoresQueryDto {
  @IsOptional()
  @IsString()
  linea_id?: string;
}
