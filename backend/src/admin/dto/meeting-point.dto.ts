import { IsString, MinLength, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMeetingPointDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMeetingPointDto extends PartialType(CreateMeetingPointDto) {}
