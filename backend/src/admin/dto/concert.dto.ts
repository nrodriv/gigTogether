import { IsString, MinLength, IsOptional, IsUUID, IsDateString, IsUrl, IsBoolean, Matches } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateConcertDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  artistName: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsUUID()
  venueId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  doorsOpenTime: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsBoolean()
  isPublished: boolean;
}

export class UpdateConcertDto extends PartialType(CreateConcertDto) {}
