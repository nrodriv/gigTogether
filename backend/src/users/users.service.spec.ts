import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockChatGateway = {
  emitMemberLeft: jest.fn(),
  emitExpulsionNotification: jest.fn(),
  emitNewReport: jest.fn(),
};

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(), findUniqueOrThrow: jest.fn() },
  block: { upsert: jest.fn(), delete: jest.fn() },
  group: { findMany: jest.fn(), update: jest.fn() },
  groupMember: { findMany: jest.fn(), delete: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  concertBan: { upsert: jest.fn(), findUnique: jest.fn() },
  notification: { create: jest.fn() },
  report: { create: jest.fn() },
};

const makeSharedGroup = (overrides: any = {}) => ({
  id: 'group-compartido',
  concertId: 'concert-1',
  status: 'OPEN',
  concert: { artistName: 'Interpol', venue: { name: 'Sala Apolo' } },
  members: [
    { id: 'member-bloqueador', userId: 'bloqueador-id', isOwner: true, status: 'ACCEPTED', joinedAt: new Date('2024-01-01') },
    { id: 'member-bloqueado', userId: 'bloqueado-id', isOwner: false, status: 'ACCEPTED', joinedAt: new Date('2024-01-02') },
  ],
  ...overrides,
});

describe('UsersService - blockUser', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  test('lanza BadRequestException si un usuario intenta bloquearse a sí mismo', async () => {
    await expect(
      service.blockUser('mismo-id', 'mismo-id')
    ).rejects.toThrow(BadRequestException);
  });

  test('lanza NotFoundException si el usuario a bloquear no existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.blockUser('bloqueador-id', 'usuario-inexistente')
    ).rejects.toThrow(NotFoundException);
  });

  test('crea el registro de bloqueo en la base de datos', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id', alias: 'Carlos' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([]);

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockPrisma.block.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { blockerId_blockedId: { blockerId: 'bloqueador-id', blockedId: 'bloqueado-id' } },
        create: expect.objectContaining({ blockerId: 'bloqueador-id', blockedId: 'bloqueado-id' }),
      }),
    );
  });

  test('no expulsa de grupos si no hay grupos compartidos', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([]);

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockPrisma.groupMember.delete).not.toHaveBeenCalled();
    expect(mockChatGateway.emitMemberLeft).not.toHaveBeenCalled();
  });

  test('elimina al usuario bloqueado de los grupos compartidos', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([makeSharedGroup()]);
    mockPrisma.groupMember.delete.mockResolvedValue({});
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.concertBan.upsert.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1', type: 'EXPULSION', message: 'Mensaje', data: {}, isRead: false,
      createdAt: new Date(),
    });

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockPrisma.groupMember.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'member-bloqueado' } })
    );
  });

  test('crea una prohibición de concierto para el usuario expulsado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([makeSharedGroup()]);
    mockPrisma.groupMember.delete.mockResolvedValue({});
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.concertBan.upsert.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1', type: 'EXPULSION', message: 'Expulsado', data: {}, isRead: false,
      createdAt: new Date(),
    });

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockPrisma.concertBan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_concertId: { userId: 'bloqueado-id', concertId: 'concert-1' } },
      }),
    );
  });

  test('crea una notificación de expulsión para el usuario expulsado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([makeSharedGroup()]);
    mockPrisma.groupMember.delete.mockResolvedValue({});
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.concertBan.upsert.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1', type: 'EXPULSION', message: 'Expulsado del grupo', data: {}, isRead: false,
      createdAt: new Date(),
    });

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'bloqueado-id',
          type: 'EXPULSION',
        }),
      }),
    );
  });

  test('emite el evento de socket memberLeft con motivo expelled', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([makeSharedGroup()]);
    mockPrisma.groupMember.delete.mockResolvedValue({});
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.concertBan.upsert.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1', type: 'EXPULSION', message: 'Expulsado', data: {}, isRead: false,
      createdAt: new Date(),
    });

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockChatGateway.emitMemberLeft).toHaveBeenCalledWith(
      'group-compartido', 'bloqueado-id', 'expelled'
    );
  });

  test('emite la notificación de expulsión en tiempo real al usuario afectado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'bloqueado-id' });
    mockPrisma.block.upsert.mockResolvedValue({});
    mockPrisma.group.findMany.mockResolvedValue([makeSharedGroup()]);
    mockPrisma.groupMember.delete.mockResolvedValue({});
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.concertBan.upsert.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-expulsion', type: 'EXPULSION', message: 'Expulsado', data: {}, isRead: false,
      createdAt: new Date('2024-06-01'),
    });

    await service.blockUser('bloqueador-id', 'bloqueado-id');

    expect(mockChatGateway.emitExpulsionNotification).toHaveBeenCalledWith(
      'bloqueado-id',
      expect.objectContaining({ id: 'notif-expulsion', type: 'EXPULSION' }),
    );
  });
});

describe('UsersService - reportUser', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  test('lanza BadRequestException si un usuario intenta reportarse a sí mismo', async () => {
    await expect(
      service.reportUser('mismo-id', 'mismo-id', { reason: 'spam', details: '' })
    ).rejects.toThrow(BadRequestException);
  });

  test('lanza NotFoundException si el usuario reportado no existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.reportUser('reporter-id', 'reportado-inexistente', { reason: 'spam', details: '' })
    ).rejects.toThrow(NotFoundException);
  });

  test('crea el reporte en la base de datos con los datos correctos', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'reportado-id' });
    mockPrisma.report.create.mockResolvedValue({ id: 'reporte-1' });

    await service.reportUser('reporter-id', 'reportado-id', {
      reason: 'Comportamiento inapropiado',
      details: 'Insultos durante la previa',
      groupId: 'group-1',
    });

    expect(mockPrisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: 'reporter-id',
          reportedId: 'reportado-id',
          reason: 'Comportamiento inapropiado',
          groupId: 'group-1',
        }),
      }),
    );
  });

  test('notifica al panel de administración en tiempo real cuando llega un reporte', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'reportado-id' });
    mockPrisma.report.create.mockResolvedValue({ id: 'reporte-1' });

    await service.reportUser('reporter-id', 'reportado-id', { reason: 'spam', details: '' });

    expect(mockChatGateway.emitNewReport).toHaveBeenCalledTimes(1);
  });

  test('devuelve mensaje de confirmación al reportador', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'reportado-id' });
    mockPrisma.report.create.mockResolvedValue({ id: 'reporte-1' });

    const resultado = await service.reportUser('reporter-id', 'reportado-id', { reason: 'spam', details: '' });

    expect(resultado).toEqual({ message: 'Usuario reportado' });
  });
});
