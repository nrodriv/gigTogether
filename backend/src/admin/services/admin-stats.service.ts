import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalConcerts, publishedConcerts, totalUsers, totalReports] = await Promise.all([
      this.prisma.concert.count(),
      this.prisma.concert.count({ where: { isPublished: true } }),
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.report.count({ where: { isRead: false } }),
    ]);
    return { totalConcerts, publishedConcerts, totalUsers, totalReports };
  }
}
