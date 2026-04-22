import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminMeetingPointsService } from '../services/admin-meeting-points.service';
import { CreateMeetingPointDto, UpdateMeetingPointDto } from '../dto/meeting-point.dto';

@ApiTags('Admin - Puntos de encuentro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminMeetingPointsController {
  constructor(private readonly service: AdminMeetingPointsService) {}

  @Get('venues/:venueId/meeting-points')
  @ApiOperation({ summary: 'Listar puntos de encuentro de una sala' })
  findByVenue(@Param('venueId') venueId: string) {
    return this.service.findByVenue(venueId);
  }

  @Post('venues/:venueId/meeting-points')
  @ApiOperation({ summary: 'Crear un punto de encuentro en una sala' })
  @HttpCode(201)
  create(@Param('venueId') venueId: string, @Body() dto: CreateMeetingPointDto) {
    return this.service.create(venueId, dto);
  }

  @Patch('meeting-points/:id')
  @ApiOperation({ summary: 'Actualizar un punto de encuentro' })
  update(@Param('id') id: string, @Body() dto: UpdateMeetingPointDto) {
    return this.service.update(id, dto);
  }

  @Delete('meeting-points/:id')
  @ApiOperation({ summary: 'Eliminar un punto de encuentro' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
