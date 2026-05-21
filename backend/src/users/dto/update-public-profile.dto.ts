import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentSong?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  musicGenres?: string[];
}
