import { IsString, MinLength, IsOptional } from 'class-validator';

export class ReportUserDto {
  @IsString()
  @MinLength(5)
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}
