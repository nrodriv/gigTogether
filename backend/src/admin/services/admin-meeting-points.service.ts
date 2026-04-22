import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingPointDto, UpdateMeetingPointDto } from '../dto/meeting-point.dto';

@Injectable()
export class AdminMeetingPointsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByVenue(venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Sala no encontrada');
    return this.prisma.meetingPoint.findMany({ where: { venueId } });
  }

  async create(venueId: string, dto: CreateMeetingPointDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Sala no encontrada');
    return this.prisma.meetingPoint.create({ data: { ...dto, venueId } });
  }

  async update(id: string, dto: UpdateMeetingPointDto) {
    const mp = await this.prisma.meetingPoint.findUnique({ where: { id } });
    if (!mp) throw new NotFoundException('Punto de encuentro no encontrado');
    return this.prisma.meetingPoint.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const mp = await this.prisma.meetingPoint.findUnique({ where: { id }, include: { groups: true } });
    if (!mp) throw new NotFoundException('Punto de encuentro no encontrado');
    if (mp.groups.length > 0) throw new ConflictException('No se puede eliminar un punto de encuentro referenciado en grupos');
    return this.prisma.meetingPoint.delete({ where: { id } });
  }
}
