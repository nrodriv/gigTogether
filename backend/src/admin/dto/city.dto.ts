import { IsString, MinLength, Matches } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCityDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}
