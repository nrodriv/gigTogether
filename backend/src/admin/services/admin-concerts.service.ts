import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConcertDto, UpdateConcertDto } from '../dto/concert.dto';

@Injectable()
export class AdminConcertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.concert.findMany({
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: { venue: { select: { id: true, name: true, city: true } } },
      }),
      this.prisma.concert.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const concert = await this.prisma.concert.findUnique({
      where: { id },
      include: {
        venue: { include: { city: true } },
      },
    });
    if (!concert) throw new NotFoundException('Concierto no encontrado');
    return concert;
  }

  async create(dto: CreateConcertDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: dto.venueId } });
    if (!venue) throw new NotFoundException('Sala no encontrada');
    const { date, ...rest } = dto;
    return this.prisma.concert.create({ data: { ...rest, date: new Date(date) } });
  }

  async update(id: string, dto: UpdateConcertDto) {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) throw new NotFoundException('Concierto no encontrado');
    if (dto.venueId) {
      const venue = await this.prisma.venue.findUnique({ where: { id: dto.venueId } });
      if (!venue) throw new NotFoundException('Sala no encontrada');
    }
    const { date, ...rest } = dto;
    return this.prisma.concert.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
  }

  async publish(id: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) throw new NotFoundException('Concierto no encontrado');
    return this.prisma.concert.update({ where: { id }, data: { isPublished: true } });
  }

  async unpublish(id: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) throw new NotFoundException('Concierto no encontrado');
    return this.prisma.concert.update({ where: { id }, data: { isPublished: false } });
  }

  async remove(id: string) {
    const concert = await this.prisma.concert.findUnique({
      where: { id },
      include: { groups: { where: { status: { in: [GroupStatus.OPEN, GroupStatus.FULL] } } } },
    });
    if (!concert) throw new NotFoundException('Concierto no encontrado');
    if (concert.groups.length > 0) throw new ConflictException('No se puede eliminar un concierto que tiene grupos activos');
    return this.prisma.concert.delete({ where: { id } });
  }
}
