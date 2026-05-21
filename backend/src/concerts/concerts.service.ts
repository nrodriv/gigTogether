import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConcertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCities() {
    return this.prisma.city.findMany({
      select: { id: true, name: true, slug: true },
    });
  }

  async findAll(cityId?: string, genre?: string, page = 1, limit = 20) {
    const where: any = { isPublished: true };
    if (cityId) {
      where.venue = { cityId };
    }
    if (genre) {
      where.genre = { contains: genre, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.concert.findMany({
        where,
        include: {
          venue: { select: { id: true, name: true, city: true } },
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.concert.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, userId?: string) {
    const concert = await this.prisma.concert.findFirst({
      where: { id, isPublished: true },
      include: {
        venue: {
          include: {
            meetingPoints: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });

    if (!concert) {
      throw new NotFoundException('Concierto no encontrado');
    }

    const acceptedMembersCount = await this.prisma.groupMember.count({
      where: {
        group: { concertId: id },
        status: 'ACCEPTED',
      },
    });

    let myGroup: { id: string; status: string } | null = null;
    let isBanned = false;
    if (userId) {
      const [member, ban] = await Promise.all([
        this.prisma.groupMember.findFirst({
          where: {
            userId,
            status: { in: ['ACCEPTED', 'PENDING'] },
            group: { concertId: id },
          },
          include: { group: { select: { id: true, status: true } } },
        }),
        this.prisma.concertBan.findUnique({
          where: { userId_concertId: { userId, concertId: id } },
        }),
      ]);
      if (member) {
        myGroup = { id: member.group.id, status: member.group.status };
      }
      isBanned = !!ban;
    }

    const isPast = new Date(concert.date) < new Date();
    return { ...concert, acceptedMembersCount, myGroup, isBanned, isPast };
  }
}
