import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        alias: true,
        bio: true,
        profilePicture: true,
        currentSong: true,
        musicGenres: true,
      },
    });
    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        alias: true,
        bio: true,
        profilePicture: true,
        currentSong: true,
        musicGenres: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.alias !== undefined && { alias: dto.alias }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: { id: true, alias: true, bio: true },
    });
    return user;
  }

  async updatePublicProfile(userId: string, dto: UpdatePublicProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.profilePicture !== undefined && { profilePicture: dto.profilePicture }),
        ...(dto.currentSong !== undefined && { currentSong: dto.currentSong }),
        ...(dto.musicGenres !== undefined && { musicGenres: dto.musicGenres }),
      },
      select: {
        id: true,
        alias: true,
        bio: true,
        profilePicture: true,
        currentSong: true,
        musicGenres: true,
      },
    });
    return user;
  }

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('La contraseña actual es obligatoria');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new BadRequestException('Este email ya está en uso');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.newPassword !== undefined && {
          passwordHash: await bcrypt.hash(dto.newPassword, 10),
        }),
      },
      select: { id: true, email: true, alias: true },
    });
    return updated;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Cuenta eliminada correctamente' };
  }

  async blockUser(blockerId: string, blockedId: string, groupId?: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('No puedes bloquearte a ti mismo');
    }

    const blocked = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!blocked) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId, ...(groupId ? { groupId } : {}) },
    });

    // Expulsar al bloqueado de todos los grupos que comparte con el bloqueador
    await this.expelFromSharedGroups(blockerId, blockedId);

    return { message: 'Usuario bloqueado' };
  }

  private async expelFromSharedGroups(blockerId: string, blockedId: string) {
    // Todos los grupos donde ambos usuarios son miembros aceptados
    const sharedGroups = await this.prisma.group.findMany({
      where: {
        AND: [
          { members: { some: { userId: blockerId, status: 'ACCEPTED' } } },
          { members: { some: { userId: blockedId, status: 'ACCEPTED' } } },
        ],
      },
      include: {
        concert: { include: { venue: { select: { name: true } } } },
        members: { where: { status: 'ACCEPTED' }, orderBy: { joinedAt: 'asc' } },
      },
    });

    for (const group of sharedGroups) {
      const blockedMember = group.members.find((m) => m.userId === blockedId);
      if (!blockedMember) continue;

      if (blockedMember.isOwner) {
        const nextOwner = group.members.find((m) => m.userId !== blockedId);
        if (nextOwner) {
          await this.prisma.groupMember.update({
            where: { id: nextOwner.id },
            data: { isOwner: true },
          });
        }
      }

      await this.prisma.groupMember.delete({ where: { id: blockedMember.id } });

      if (group.status === 'FULL') {
        await this.prisma.group.update({
          where: { id: group.id },
          data: { status: 'OPEN' },
        });
      }

      await this.prisma.concertBan.upsert({
        where: { userId_concertId: { userId: blockedId, concertId: group.concertId } },
        update: {},
        create: { userId: blockedId, concertId: group.concertId },
      });

      const artistName = group.concert.artistName;
      const venueName = group.concert.venue.name;

      const notification = await this.prisma.notification.create({
        data: {
          userId: blockedId,
          type: 'EXPULSION',
          message: `Has sido expulsado del concierto de ${artistName} en ${venueName} por comportamiento inapropiado.`,
          data: { concertId: group.concertId, artistName, venueName },
        },
      });

      // Emitir eventos en tiempo real
      this.chatGateway.emitMemberLeft(group.id, blockedId);
      this.chatGateway.emitExpulsionNotification(blockedId, {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      });
    }
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block
      .delete({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      })
      .catch(() => null);

    return { message: 'Usuario desbloqueado' };
  }

  async reportUser(reporterId: string, reportedId: string, dto: ReportUserDto) {
    if (reporterId === reportedId) {
      throw new BadRequestException('No puedes reportarte a ti mismo');
    }

    const reported = await this.prisma.user.findUnique({
      where: { id: reportedId },
    });
    if (!reported) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason: dto.reason,
        details: dto.details,
        ...(dto.groupId ? { groupId: dto.groupId } : {}),
      },
    });

    this.chatGateway.emitNewReport();

    return { message: 'Usuario reportado' };
  }
}
