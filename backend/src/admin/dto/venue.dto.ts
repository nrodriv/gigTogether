import { IsString, MinLength, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateVenueDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsUUID()
  cityId: string;
}

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
