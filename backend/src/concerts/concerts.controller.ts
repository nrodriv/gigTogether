import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConcertsService } from './concerts.service';
import { OptionalJwtGuard } from '../auth/index';

@ApiTags('Concerts')
@Controller()
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Obtener todas las ciudades' })
  findAllCities() {
    return this.concertsService.findAllCities();
  }

  @Get('concerts')
  @ApiOperation({ summary: 'Listar conciertos publicados con filtros' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('cityId') cityId?: string,
    @Query('genre') genre?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.concertsService.findAll(
      cityId,
      genre,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('concerts/:id')
  @UseGuards(OptionalJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de un concierto (token opcional)' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.concertsService.findOne(id, req.user?.userId);
  }
}
