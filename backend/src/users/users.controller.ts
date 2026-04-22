import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { JwtAuthGuard } from '../auth/index';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil propio completo' })
  getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.userId);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Ver perfil público de otro usuario (requiere auth)' })
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar alias/bio (legacy)' })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Actualizar perfil público (bio, foto, canción, géneros)' })
  updatePublicProfile(@Request() req: any, @Body() dto: UpdatePublicProfileDto) {
    return this.usersService.updatePublicProfile(req.user.userId, dto);
  }

  @Patch('me/account')
  @ApiOperation({ summary: 'Actualizar email o contraseña' })
  updateAccount(@Request() req: any, @Body() dto: UpdateAccountDto) {
    return this.usersService.updateAccount(req.user.userId, dto);
  }

  @Delete('me')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar cuenta propia' })
  deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.userId);
  }

  @Post(':id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bloquear usuario' })
  blockUser(@Request() req: any, @Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.usersService.blockUser(req.user.userId, id, dto.groupId);
  }

  @Delete(':id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Desbloquear usuario' })
  unblockUser(@Request() req: any, @Param('id') id: string) {
    return this.usersService.unblockUser(req.user.userId, id);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Reportar usuario' })
  reportUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReportUserDto,
  ) {
    return this.usersService.reportUser(req.user.userId, id, dto);
  }
}
