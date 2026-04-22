import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}
