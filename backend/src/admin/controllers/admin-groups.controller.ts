import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroupStatus, Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminGroupsService } from '../services/admin-groups.service';

@ApiTags('Admin - Grupos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly service: AdminGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar grupos con filtros opcionales' })
  findAll(
    @Query('concertId') concertId?: string,
    @Query('venueId') venueId?: string,
    @Query('cityId') cityId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: GroupStatus,
  ) {
    return this.service.findAll({ concertId, venueId, cityId, userId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un grupo' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
