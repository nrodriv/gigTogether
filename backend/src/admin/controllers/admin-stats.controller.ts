import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminStatsService } from '../services/admin-stats.service';

@ApiExcludeController(process.env.NODE_ENV === 'production')
@ApiTags('Admin - Estadísticas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly service: AdminStatsService) {}

  @Get()
  @ApiOperation({ summary: 'Estadísticas generales del panel de administración' })
  getStats() {
    return this.service.getStats();
  }
}
