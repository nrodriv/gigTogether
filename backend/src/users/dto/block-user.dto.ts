import { IsOptional, IsString } from 'class-validator';

export class BlockUserDto {
  @IsOptional()
  @IsString()
  groupId?: string;
}
