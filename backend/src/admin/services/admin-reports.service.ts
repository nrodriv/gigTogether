import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const groupInclude = {
  select: {
    id: true,
    concert: {
      select: {
        artistName: true,
        venue: { select: { name: true } },
      },
    },
  },
};

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(reporter?: string, reported?: string) {
    return this.prisma.report.findMany({
      where: {
        ...(reporter ? { reporter: { alias: { contains: reporter, mode: 'insensitive' } } } : {}),
        ...(reported ? { reported: { alias: { contains: reported, mode: 'insensitive' } } } : {}),
      },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      include: {
        reporter: { select: { id: true, alias: true } },
        reported: { select: { id: true, alias: true } },
        group: groupInclude,
      },
    });
  }

  async markAsRead(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return this.prisma.report.update({ where: { id }, data: { isRead: true } });
  }

  markAllAsRead() {
    return this.prisma.report.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }

  findAllBlocks(blocker?: string, blocked?: string) {
    return this.prisma.block.findMany({
      where: {
        ...(blocker ? { blocker: { alias: { contains: blocker, mode: 'insensitive' } } } : {}),
        ...(blocked ? { blocked: { alias: { contains: blocked, mode: 'insensitive' } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        blocker: { select: { id: true, alias: true } },
        blocked: { select: { id: true, alias: true } },
        group: groupInclude,
      },
    });
  }
}
