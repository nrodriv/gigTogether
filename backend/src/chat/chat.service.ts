import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatMessageResponse {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    userId: string;
    alias: string;
    profilePicture: string | null;
    isActive: boolean;
  };
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessagesForMember(
    groupId: string,
    userId: string,
  ): Promise<ChatMessageResponse[]> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'ACCEPTED' },
    });
    if (!member) throw new ForbiddenException('No eres miembro de este grupo');

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (!group.chatUnlocked) throw new ForbiddenException('El chat no está disponible aún');

    const [messages, activeMembers] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { groupId, createdAt: { gte: member.joinedAt } },
        include: { user: { select: { alias: true, profilePicture: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.groupMember.findMany({
        where: { groupId, status: 'ACCEPTED' },
        select: { userId: true },
      }),
    ]);

    const activeIds = new Set(activeMembers.map((m) => m.userId));

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: {
        userId: msg.userId,
        alias: msg.user.alias,
        profilePicture: msg.user.profilePicture,
        isActive: activeIds.has(msg.userId),
      },
    }));
  }

  async saveMessage(
    groupId: string,
    userId: string,
    content: string,
  ): Promise<ChatMessageResponse> {
    const [member, group] = await Promise.all([
      this.prisma.groupMember.findFirst({
        where: { groupId, userId, status: 'ACCEPTED' },
      }),
      this.prisma.group.findUnique({ where: { id: groupId } }),
    ]);

    if (!member) throw new ForbiddenException('No eres miembro de este grupo');
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (!group.chatUnlocked)
      throw new ForbiddenException('El chat no está disponible aún');

    if (content.length > 500)
      throw new ForbiddenException('El mensaje no puede superar los 500 caracteres');

    const msg = await this.prisma.chatMessage.create({
      data: { groupId, userId, content },
      include: { user: { select: { alias: true, profilePicture: true } } },
    });

    return {
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      sender: {
        userId: msg.userId,
        alias: msg.user.alias,
        profilePicture: msg.user.profilePicture,
        isActive: true,
      },
    };
  }

  async getOtherAcceptedMemberIds(
    groupId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, status: 'ACCEPTED', userId: { not: excludeUserId } },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async verifyMembership(groupId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'ACCEPTED' },
    });
    return !!member;
  }

  async getGroupWithConcertName(groupId: string): Promise<{ artistName: string } | null> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { concert: { select: { artistName: true } } },
    });
    return group ? { artistName: group.concert.artistName } : null;
  }
}
