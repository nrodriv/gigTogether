import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { message: 'Notificación marcada como leída' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async deleteAll(userId: string) {
    await this.prisma.notification.deleteMany({ where: { userId } });
    return { message: 'Notificaciones eliminadas' };
  }

  async createGroupMessageNotification(
    userId: string,
    senderAlias: string,
    concertName: string,
    messagePreview: string,
    groupId: string,
  ) {
    const preview = messagePreview.length > 60
      ? messagePreview.slice(0, 60) + '…'
      : messagePreview;

    return this.prisma.notification.create({
      data: {
        userId,
        type: 'GROUP_MESSAGE',
        message: `${senderAlias} en ${concertName}: "${preview}"`,
        data: { groupId, concertName, senderAlias },
        isRead: false,
      },
    });
  }
}
