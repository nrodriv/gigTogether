import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  alias?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
