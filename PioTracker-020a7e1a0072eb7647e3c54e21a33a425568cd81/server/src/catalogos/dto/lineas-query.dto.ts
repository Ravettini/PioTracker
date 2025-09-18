import { IsOptional, IsString } from 'class-validator';

export class LineasQueryDto {
  @IsOptional()
  @IsString()
  ministerioId?: string;
}
