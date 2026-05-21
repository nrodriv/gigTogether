import { Injectable } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: {
    concertId?: string;
    venueId?: string;
    cityId?: string;
    userId?: string;
    status?: GroupStatus;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.concertId) where.concertId = filters.concertId;
    if (filters.userId) {
      where.members = { some: { userId: filters.userId, status: 'ACCEPTED' } };
    }

    const concertWhere: any = {};
    if (filters.venueId) concertWhere.venueId = filters.venueId;
    if (filters.cityId) concertWhere.venue = { cityId: filters.cityId };
    if (Object.keys(concertWhere).length > 0) where.concert = concertWhere;

    return this.prisma.group.findMany({
      where,
      include: {
        concert: {
          select: {
            id: true,
            title: true,
            artistName: true,
            date: true,
            venue: {
              select: {
                id: true,
                name: true,
                city: { select: { id: true, name: true } },
              },
            },
          },
        },
        meetingPoint: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, alias: true, profilePicture: true } },
          },
          orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        concert: {
          include: {
            venue: { include: { city: true } },
          },
        },
        meetingPoint: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                alias: true,
                profilePicture: true,
                musicGenres: true,
              },
            },
          },
          orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });
  }
}
