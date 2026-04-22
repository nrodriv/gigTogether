import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth/index';
import { AdminConcertsService } from '../services/admin-concerts.service';
import { CreateConcertDto, UpdateConcertDto } from '../dto/concert.dto';

@ApiTags('Admin - Conciertos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/concerts')
export class AdminConcertsController {
  constructor(private readonly service: AdminConcertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar conciertos paginados' })
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.service.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un concierto por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un concierto' })
  @HttpCode(201)
  create(@Body() dto: CreateConcertDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un concierto' })
  update(@Param('id') id: string, @Body() dto: UpdateConcertDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publicar un concierto' })
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Despublicar un concierto' })
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un concierto' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
