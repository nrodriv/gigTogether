import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from '../dto/city.dto';

@Injectable()
export class AdminCitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.city.findMany({
      include: { _count: { select: { venues: true } } },
    });
  }

  async create(dto: CreateCityDto) {
    const existing = await this.prisma.city.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('La ciudad ya existe');
    return this.prisma.city.create({ data: dto });
  }

  async update(id: string, dto: UpdateCityDto) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException('Ciudad no encontrada');
    if (dto.slug && dto.slug !== city.slug) {
      const existing = await this.prisma.city.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('El slug ya está en uso');
    }
    return this.prisma.city.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id }, include: { venues: true } });
    if (!city) throw new NotFoundException('Ciudad no encontrada');
    if (city.venues.length > 0) throw new ConflictException('No se puede eliminar una ciudad que tiene salas asociadas');
    return this.prisma.city.delete({ where: { id } });
  }
}
