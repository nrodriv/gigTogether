import { Controller, Get, Patch, Query, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminReportsService } from '../services/admin-reports.service';

@ApiTags('Admin - Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reportes con filtro por alias de reportador o reportado' })
  findAll(
    @Query('reporter') reporter?: string,
    @Query('reported') reported?: string,
  ) {
    return this.service.findAll(reporter, reported);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todos los reportes como leídos' })
  @HttpCode(200)
  markAllAsRead() {
    return this.service.markAllAsRead();
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar un reporte como leído' })
  @HttpCode(200)
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Listar bloqueos con filtro por alias' })
  findAllBlocks(
    @Query('blocker') blocker?: string,
    @Query('blocked') blocked?: string,
  ) {
    return this.service.findAllBlocks(blocker, blocked);
  }
}
