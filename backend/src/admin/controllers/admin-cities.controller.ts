import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminCitiesService } from '../services/admin-cities.service';
import { CreateCityDto, UpdateCityDto } from '../dto/city.dto';

@ApiTags('Admin - Ciudades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/cities')
export class AdminCitiesController {
  constructor(private readonly service: AdminCitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las ciudades' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear una ciudad' })
  @HttpCode(201)
  create(@Body() dto: CreateCityDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ciudad' })
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ciudad' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
