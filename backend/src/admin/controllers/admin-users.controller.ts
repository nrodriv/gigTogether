import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminUsersService } from '../services/admin-users.service';

@ApiTags('Admin - Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtros opcionales' })
  findAll(
    @Query('alias') alias?: string,
    @Query('email') email?: string,
  ) {
    return this.service.findAll({ alias, email });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil completo de un usuario' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
