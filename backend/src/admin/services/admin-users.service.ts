import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: { alias?: string; email?: string }) {
    const where: any = { role: Role.USER };
    if (filters.alias) where.alias = { contains: filters.alias, mode: 'insensitive' };
    if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        alias: true,
        email: true,
        profilePicture: true,
        musicGenres: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            groupMembers: { where: { status: 'ACCEPTED' } },
            reportsGiven: true,
            reportsReceived: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        alias: true,
        email: true,
        bio: true,
        profilePicture: true,
        currentSong: true,
        musicGenres: true,
        isActive: true,
        createdAt: true,
        preferences: true,
        groupMembers: {
          where: { status: 'ACCEPTED' },
          include: {
            group: {
              include: {
                concert: {
                  include: {
                    venue: {
                      include: { city: { select: { name: true } } },
                    },
                  },
                },
                meetingPoint: { select: { name: true } },
                _count: { select: { members: { where: { status: 'ACCEPTED' } } } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        reportsGiven: {
          include: {
            reported: { select: { alias: true } },
            group: { select: { id: true, concert: { select: { artistName: true, venue: { select: { name: true } } } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reportsReceived: {
          include: {
            reporter: { select: { alias: true } },
            group: { select: { id: true, concert: { select: { artistName: true, venue: { select: { name: true } } } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }
}
