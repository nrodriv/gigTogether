import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGIN, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private socketUserMap = new Map<string, string>(); // socketId → userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<AuthPayload>(token);
      this.socketUserMap.set(client.id, payload.sub);

      // Sala personal para notificaciones dirigidas
      client.join(`user:${payload.sub}`);

      // Sala compartida para todos los administradores
      if (payload.role === 'ADMIN') {
        client.join('admin:notifications');
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.socketUserMap.delete(client.id);
  }

  private getUserId(client: Socket): string | null {
    return this.socketUserMap.get(client.id) ?? null;
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() groupId: string,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;

    const isMember = await this.chatService.verifyMembership(groupId, userId);
    if (!isMember) return;

    client.join(`group:${groupId}`);
  }

  @SubscribeMessage('leaveGroupRoom')
  handleLeaveGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() groupId: string,
  ) {
    client.leave(`group:${groupId}`);
  }


  emitToGroup(groupId: string, event: string, data: any) {
    this.server.to(`group:${groupId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitMemberLeft(groupId: string, userId: string) {
    this.server.to(`group:${groupId}`).emit('memberLeft', { groupId, userId });
  }

  emitExpulsionNotification(userId: string, notification: {
    id: string; type: string; message: string; data: any; isRead: boolean; createdAt: string;
  }) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  emitNewReport() {
    this.server.to('admin:notifications').emit('newReport', {});
  }
}
