import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { JoinConcertDto } from './dto/join-concert.dto';
import { JwtAuthGuard } from '../auth/index';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('concerts/:concertId/solo')
  @ApiOperation({ summary: 'Unirse o crear un grupo para un concierto' })
  joinConcert(
    @Param('concertId') concertId: string,
    @Body() dto: JoinConcertDto,
    @Request() req: any,
  ) {
    return this.groupsService.joinConcert(req.user.userId, concertId, dto);
  }

  @Get('concerts/:concertId/my-group')
  @ApiOperation({ summary: 'Obtener mi grupo para un concierto' })
  getMyGroup(@Param('concertId') concertId: string, @Request() req: any) {
    return this.groupsService.getMyGroup(req.user.userId, concertId);
  }

  @Get('groups/mine')
  @ApiOperation({ summary: 'Todos mis grupos activos' })
  getMyGroups(@Request() req: any) {
    return this.groupsService.getMyGroups(req.user.userId);
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Detalle de un grupo (solo miembros)' })
  getGroupById(@Param('groupId') groupId: string, @Request() req: any) {
    return this.groupsService.getGroupById(groupId, req.user.userId);
  }

  @Delete('groups/:groupId/leave')
  @ApiOperation({ summary: 'Abandonar un grupo' })
  leaveGroup(@Param('groupId') groupId: string, @Request() req: any) {
    return this.groupsService.leaveGroup(groupId, req.user.userId);
  }

  @Get('groups/:groupId/messages')
  @ApiOperation({ summary: 'Mensajes del chat del grupo (desde la fecha de unión)' })
  getGroupMessages(@Param('groupId') groupId: string, @Request() req: any) {
    return this.chatService.getMessagesForMember(groupId, req.user.userId);
  }

  @Post('groups/:groupId/messages')
  @ApiOperation({ summary: 'Enviar mensaje al chat del grupo' })
  async sendMessage(
    @Param('groupId') groupId: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    const content = (body.content ?? '').trim();
    if (!content || content.length > 500) {
      throw new BadRequestException('El mensaje debe tener entre 1 y 500 caracteres');
    }

    const message = await this.chatService.saveMessage(groupId, req.user.userId, content);

    // Emitir en tiempo real a los demás miembros del grupo
    this.chatGateway.emitToGroup(groupId, 'newMessage', message);

    // Notificación de chat a miembros que no están en la sala
    const otherIds = await this.chatService.getOtherAcceptedMemberIds(groupId, req.user.userId);
    const groupInfo = await this.chatService.getGroupWithConcertName(groupId);
    const concertName = groupInfo?.artistName ?? '';

    for (const memberId of otherIds) {
      // Socket en tiempo real: badge del botón de chat en mis-grupos
      this.chatGateway.emitToUser(memberId, 'chatNotification', {
        groupId,
        senderAlias: message.sender.alias,
        concertName,
        message: message.content,
        createdAt: message.createdAt,
      });

      // Notificación persistente en DB + socket al panel de la campana
      const notif = await this.notificationsService.createGroupMessageNotification(
        memberId,
        message.sender.alias,
        concertName,
        message.content,
        groupId,
      );
      this.chatGateway.emitToUser(memberId, 'notification', {
        id: notif.id,
        type: notif.type,
        message: notif.message,
        data: notif.data,
        isRead: notif.isRead,
        createdAt: notif.createdAt.toISOString(),
      });
    }

    return message;
  }
}
