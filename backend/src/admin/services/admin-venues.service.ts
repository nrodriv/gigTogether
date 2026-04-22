import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVenueDto, UpdateVenueDto } from '../dto/venue.dto';

@Injectable()
export class AdminVenuesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venue.findMany({
      include: { city: { select: { id: true, name: true, slug: true } } },
    });
  }

  async create(dto: CreateVenueDto) {
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) throw new NotFoundException('Ciudad no encontrada');
    return this.prisma.venue.create({
      data: dto,
      include: { city: { select: { id: true, name: true, slug: true } } },
    });
  }

  async update(id: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException('Sala no encontrada');
    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
      if (!city) throw new NotFoundException('Ciudad no encontrada');
    }
    return this.prisma.venue.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id }, include: { concerts: true } });
    if (!venue) throw new NotFoundException('Sala no encontrada');
    if (venue.concerts.length > 0) throw new ConflictException('No se puede eliminar una sala que tiene conciertos asociados');
    return this.prisma.venue.delete({ where: { id } });
  }
}
