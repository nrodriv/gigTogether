import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Test1234!' })
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({ example: 'TestUser' })
  @IsString()
  @MinLength(2)
  alias: string;
}
