import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminVenuesService } from '../services/admin-venues.service';
import { CreateVenueDto, UpdateVenueDto } from '../dto/venue.dto';

@ApiTags('Admin - Salas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/venues')
export class AdminVenuesController {
  constructor(private readonly service: AdminVenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las salas' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear una sala' })
  @HttpCode(201)
  create(@Body() dto: CreateVenueDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una sala' })
  update(@Param('id') id: string, @Body() dto: UpdateVenueDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una sala' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
