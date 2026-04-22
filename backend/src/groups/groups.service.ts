import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinConcertDto } from './dto/join-concert.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findCompatibleGroup(
    userId: string,
    concertId: string,
    dto: JoinConcertDto,
  ) {
    const blocksInvolvingUser = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const blockedByUser = new Set(
      blocksInvolvingUser
        .filter((b) => b.blockerId === userId)
        .map((b) => b.blockedId),
    );
    const usersWhoBlockedMe = new Set(
      blocksInvolvingUser
        .filter((b) => b.blockedId === userId)
        .map((b) => b.blockerId),
    );

    const openGroups = await this.prisma.group.findMany({
      where: {
        concertId,
        meetingPointId: dto.meetingPointId,
        arrivalWindow: dto.arrivalWindow,
        status: 'OPEN',
      },
      include: {
        members: {
          where: { status: 'ACCEPTED' },
          select: { userId: true },
        },
      },
    });

    const compatible = openGroups.filter((group) => {
      if (group.members.length >= group.maxSize) return false;
      for (const member of group.members) {
        if (blockedByUser.has(member.userId)) return false;
        if (usersWhoBlockedMe.has(member.userId)) return false;
      }
      return true;
    });

    if (compatible.length === 0) return null;

    compatible.sort((a, b) => {
      const diff = b.members.length - a.members.length;
      if (diff !== 0) return diff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return compatible[0];
  }

  async joinConcert(userId: string, concertId: string, dto: JoinConcertDto) {
    const concert = await this.prisma.concert.findFirst({
      where: { id: concertId, isPublished: true },
    });
    if (!concert) {
      throw new NotFoundException('Concierto no encontrado');
    }

    const meetingPoint = await this.prisma.meetingPoint.findFirst({
      where: {
        id: dto.meetingPointId,
        venue: { concerts: { some: { id: concertId } } },
      },
    });
    if (!meetingPoint) {
      throw new NotFoundException(
        'El punto de encuentro no pertenece a este concierto',
      );
    }

    const ban = await this.prisma.concertBan.findUnique({
      where: { userId_concertId: { userId, concertId } },
    });
    if (ban) {
      throw new ForbiddenException('Has sido expulsado de este concierto y no puedes volver a unirte');
    }

    const existing = await this.prisma.groupMember.findFirst({
      where: {
        userId,
        status: { in: ['ACCEPTED', 'PENDING'] },
        group: { concertId },
      },
    });
    if (existing) {
      throw new ConflictException('Ya estás en un grupo para este concierto');
    }

    const compatibleGroup = await this.findCompatibleGroup(
      userId,
      concertId,
      dto,
    );

    if (compatibleGroup) {
      await this.prisma.groupMember.create({
        data: {
          groupId: compatibleGroup.id,
          userId,
          status: 'ACCEPTED',
          isOwner: false,
          activityType: dto.activityType,
        },
      });

      const acceptedCount = await this.prisma.groupMember.count({
        where: { groupId: compatibleGroup.id, status: 'ACCEPTED' },
      });

      const updates: { status?: 'FULL'; chatUnlocked?: true } = {};
      if (acceptedCount >= compatibleGroup.maxSize) updates.status = 'FULL';
      if (!compatibleGroup.chatUnlocked && acceptedCount >= 3) updates.chatUnlocked = true;

      if (Object.keys(updates).length > 0) {
        await this.prisma.group.update({
          where: { id: compatibleGroup.id },
          data: updates,
        });
      }

      return this.prisma.group.findUnique({
        where: { id: compatibleGroup.id },
        include: {
          members: {
            include: { user: { select: { id: true, alias: true, profilePicture: true } } },
          },
        },
      });
    }

    const newGroup = await this.prisma.group.create({
      data: {
        concertId,
        meetingPointId: dto.meetingPointId,
        arrivalWindow: dto.arrivalWindow,
        activityType: dto.activityType,
        maxSize: 5,
        status: 'OPEN',
      },
    });

    await this.prisma.groupMember.create({
      data: {
        groupId: newGroup.id,
        userId,
        status: 'ACCEPTED',
        isOwner: true,
        activityType: dto.activityType,
      },
    });

    return this.prisma.group.findUnique({
      where: { id: newGroup.id },
      include: {
        members: {
          include: { user: { select: { id: true, alias: true, profilePicture: true } } },
        },
      },
    });
  }

  async getMyGroup(userId: string, concertId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        userId,
        status: { in: ['ACCEPTED', 'PENDING'] },
        group: { concertId },
      },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, alias: true, profilePicture: true } } },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('No tienes grupo para este concierto');
    }

    return member.group;
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, alias: true, profilePicture: true } } },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const isMember = group.members.some(
      (m) =>
        m.userId === userId &&
        (m.status === 'ACCEPTED' || m.status === 'PENDING'),
    );

    if (!isMember) {
      throw new ForbiddenException('No eres miembro de este grupo');
    }

    return group;
  }

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        status: { in: ['ACCEPTED', 'PENDING'] },
      },
      include: {
        group: {
          include: {
            members: {
              where: { status: 'ACCEPTED' },
              include: { user: { select: { id: true, alias: true, profilePicture: true } } },
              orderBy: { joinedAt: 'asc' },
            },
            concert: {
              select: {
                id: true,
                title: true,
                artistName: true,
                imageUrl: true,
                date: true,
                doorsOpenTime: true,
                venue: { select: { name: true, address: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const now = new Date();

    return memberships
      .map((m) => {
        const isPast = new Date(m.group.concert.date) < now;
        return {
          ...m.group,
          isPast,
          members: isPast ? [] : m.group.members,
        };
      })
      .sort((a, b) => new Date(a.concert.date).getTime() - new Date(b.concert.date).getTime());
  }

  async leaveGroup(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!member) {
      throw new NotFoundException('No eres miembro de este grupo');
    }

    const acceptedMembers = await this.prisma.groupMember.findMany({
      where: { groupId, status: 'ACCEPTED' },
      orderBy: { joinedAt: 'asc' },
    });

    if (member.isOwner) {
      const otherAccepted = acceptedMembers.filter((m) => m.userId !== userId);

      if (otherAccepted.length === 0) {
        await this.prisma.groupMember.deleteMany({ where: { groupId } });
        await this.prisma.group.delete({ where: { id: groupId } });
        return { message: 'Has abandonado el grupo' };
      }

      await this.prisma.groupMember.update({
        where: { id: otherAccepted[0].id },
        data: { isOwner: true },
      });
    }

    await this.prisma.groupMember.delete({ where: { id: member.id } });

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (group && group.status === 'FULL') {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { status: 'OPEN' },
      });
    }

    // Notificar al chat en tiempo real que el miembro salió
    this.chatGateway.emitMemberLeft(groupId, userId);

    return { message: 'Has abandonado el grupo' };
  }
}
