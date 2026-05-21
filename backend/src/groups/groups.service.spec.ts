import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArrivalWindow, ActivityType } from '@prisma/client';

const mockChatGateway = {
  emitMemberLeft: jest.fn(),
  emitExpulsionNotification: jest.fn(),
  emitNewReport: jest.fn(),
};

const mockPrisma = {
  concert: { findFirst: jest.fn() },
  meetingPoint: { findFirst: jest.fn() },
  groupMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
  group: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  block: { findMany: jest.fn() },
  concertBan: { findUnique: jest.fn(), upsert: jest.fn() },
  user: { findUnique: jest.fn() },
};

const makeGroup = (overrides: any = {}) => ({
  id: 'group-1',
  concertId: 'concert-1',
  meetingPointId: 'mp-1',
  arrivalWindow: ArrivalWindow.ON_TIME,
  activityType: ActivityType.HAVE_DRINK,
  maxSize: 5,
  status: 'OPEN',
  chatUnlocked: false,
  createdAt: new Date('2024-01-01'),
  members: [{ userId: 'user-other' }],
  ...overrides,
});

const baseDto = {
  meetingPointId: 'mp-1',
  arrivalWindow: ArrivalWindow.ON_TIME,
  activityType: ActivityType.HAVE_DRINK,
};

describe('GroupsService - findCompatibleGroup', () => {
  let service: GroupsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<GroupsService>(GroupsService);
  });

  test('devuelve el grupo con más miembros cuando hay varios compatibles', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    const groupA = makeGroup({ id: 'group-a', members: [{ userId: 'u1' }] });
    const groupB = makeGroup({
      id: 'group-b',
      members: [{ userId: 'u2' }, { userId: 'u3' }],
      createdAt: new Date('2024-01-02'),
    });
    mockPrisma.group.findMany.mockResolvedValue([groupA, groupB]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result?.id).toBe('group-b');
  });

  test('no devuelve grupos con arrivalWindow diferente (EARLY vs LATE)', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', {
      ...baseDto,
      arrivalWindow: ArrivalWindow.EARLY,
    });

    expect(result).toBeNull();
    expect(mockPrisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ arrivalWindow: ArrivalWindow.EARLY }),
      }),
    );
  });

  test('no devuelve grupos con status FULL', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    const fullGroup = makeGroup({
      status: 'FULL',
      members: [
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
        { userId: 'u4' },
        { userId: 'u5' },
      ],
    });
    mockPrisma.group.findMany.mockResolvedValue([fullGroup]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result).toBeNull();
  });

  test('no devuelve grupos donde el solicitante ha bloqueado a un miembro', async () => {
    mockPrisma.block.findMany.mockResolvedValue([
      { blockerId: 'user-me', blockedId: 'user-other' },
    ]);
    const group = makeGroup({ members: [{ userId: 'user-other' }] });
    mockPrisma.group.findMany.mockResolvedValue([group]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result).toBeNull();
  });

  test('no devuelve grupos donde un miembro ha bloqueado al solicitante', async () => {
    mockPrisma.block.findMany.mockResolvedValue([
      { blockerId: 'user-other', blockedId: 'user-me' },
    ]);
    const group = makeGroup({ members: [{ userId: 'user-other' }] });
    mockPrisma.group.findMany.mockResolvedValue([group]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result).toBeNull();
  });

  test('no devuelve grupos de otro concertId', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([]);

    const result = await service.findCompatibleGroup('user-me', 'concert-999', baseDto);

    expect(result).toBeNull();
    expect(mockPrisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ concertId: 'concert-999' }),
      }),
    );
  });

  test('no devuelve grupos con distinto meetingPointId', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', {
      ...baseDto,
      meetingPointId: 'mp-different',
    });

    expect(result).toBeNull();
    expect(mockPrisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ meetingPointId: 'mp-different' }),
      }),
    );
  });

  test('devuelve null cuando no hay ningún grupo compatible', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result).toBeNull();
  });

  test('entre grupos con el mismo número de miembros, devuelve el más antiguo', async () => {
    mockPrisma.block.findMany.mockResolvedValue([]);
    const groupAntiguo = makeGroup({
      id: 'group-antiguo',
      members: [{ userId: 'u1' }],
      createdAt: new Date('2024-01-01'),
    });
    const groupReciente = makeGroup({
      id: 'group-reciente',
      members: [{ userId: 'u2' }],
      createdAt: new Date('2024-06-01'),
    });
    mockPrisma.group.findMany.mockResolvedValue([groupReciente, groupAntiguo]);

    const result = await service.findCompatibleGroup('user-me', 'concert-1', baseDto);

    expect(result?.id).toBe('group-antiguo');
  });
});

describe('GroupsService - joinConcert', () => {
  let service: GroupsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<GroupsService>(GroupsService);
  });

  const mockConcert = { id: 'concert-1', isPublished: true, doorsOpenTime: '22:00' };
  const mockMeetingPoint = { id: 'mp-1', venueId: 'venue-1' };
  const mockGroupResult = makeGroup({
    members: [{ id: 'member-1', userId: 'user-me', user: { id: 'user-me', alias: 'Ana', profilePicture: null } }],
  });

  test('lanza NotFoundException si el concierto no existe o no está publicado', async () => {
    mockPrisma.concert.findFirst.mockResolvedValue(null);

    await expect(
      service.joinConcert('user-me', 'concert-inexistente', baseDto)
    ).rejects.toThrow(NotFoundException);
  });

  test('lanza NotFoundException si el punto de encuentro no pertenece al concierto', async () => {
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(null);

    await expect(
      service.joinConcert('user-me', 'concert-1', { ...baseDto, meetingPointId: 'mp-de-otro-sitio' })
    ).rejects.toThrow(NotFoundException);
  });

  test('lanza ForbiddenException si el usuario ha sido expulsado del concierto', async () => {
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue({ userId: 'user-me', concertId: 'concert-1' });

    await expect(
      service.joinConcert('user-me', 'concert-1', baseDto)
    ).rejects.toThrow(ForbiddenException);
  });

  test('lanza ConflictException si el usuario ya pertenece a un grupo para ese concierto', async () => {
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue(null);
    mockPrisma.groupMember.findFirst.mockResolvedValue({ id: 'member-existente', groupId: 'group-1' });

    await expect(
      service.joinConcert('user-me', 'concert-1', baseDto)
    ).rejects.toThrow(ConflictException);
  });

  test('crea un nuevo grupo si no hay ninguno compatible', async () => {
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue(null);
    mockPrisma.groupMember.findFirst.mockResolvedValue(null);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([]);
    mockPrisma.group.create.mockResolvedValue({ id: 'group-nuevo', status: 'OPEN', chatUnlocked: false, maxSize: 5 });
    mockPrisma.groupMember.create.mockResolvedValue({});
    mockPrisma.group.findUnique.mockResolvedValue(mockGroupResult);

    const result = await service.joinConcert('user-me', 'concert-1', baseDto);

    expect(mockPrisma.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          concertId: 'concert-1',
          meetingPointId: 'mp-1',
          arrivalWindow: ArrivalWindow.ON_TIME,
          activityType: ActivityType.HAVE_DRINK,
          status: 'OPEN',
        }),
      }),
    );
    expect(result).toBeDefined();
  });

  test('se une a un grupo existente compatible en lugar de crear uno nuevo', async () => {
    const grupoExistente = makeGroup({ id: 'group-existente', members: [{ userId: 'u1' }] });
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue(null);
    mockPrisma.groupMember.findFirst.mockResolvedValue(null);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([grupoExistente]);
    mockPrisma.groupMember.create.mockResolvedValue({});
    mockPrisma.groupMember.count.mockResolvedValue(2);
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.group.findUnique.mockResolvedValue(mockGroupResult);

    await service.joinConcert('user-me', 'concert-1', baseDto);

    expect(mockPrisma.group.create).not.toHaveBeenCalled();
    expect(mockPrisma.groupMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ groupId: 'group-existente', userId: 'user-me', isOwner: false }),
      }),
    );
  });

  test('actualiza el estado del grupo a FULL cuando alcanza el máximo de miembros', async () => {
    const grupoExistente = makeGroup({
      id: 'group-casi-lleno',
      maxSize: 5,
      status: 'OPEN',
      chatUnlocked: true,
      members: [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }, { userId: 'u4' }],
    });
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue(null);
    mockPrisma.groupMember.findFirst.mockResolvedValue(null);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([grupoExistente]);
    mockPrisma.groupMember.create.mockResolvedValue({});
    mockPrisma.groupMember.count.mockResolvedValue(5);
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.group.findUnique.mockResolvedValue(mockGroupResult);

    await service.joinConcert('user-me', 'concert-1', baseDto);

    expect(mockPrisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'group-casi-lleno' },
        data: expect.objectContaining({ status: 'FULL' }),
      }),
    );
  });

  test('desbloquea el chat cuando el grupo alcanza 3 miembros aceptados', async () => {
    const grupoSinChat = makeGroup({
      id: 'group-sin-chat',
      maxSize: 5,
      status: 'OPEN',
      chatUnlocked: false,
      members: [{ userId: 'u1' }, { userId: 'u2' }],
    });
    mockPrisma.concert.findFirst.mockResolvedValue(mockConcert);
    mockPrisma.meetingPoint.findFirst.mockResolvedValue(mockMeetingPoint);
    mockPrisma.concertBan.findUnique.mockResolvedValue(null);
    mockPrisma.groupMember.findFirst.mockResolvedValue(null);
    mockPrisma.block.findMany.mockResolvedValue([]);
    mockPrisma.group.findMany.mockResolvedValue([grupoSinChat]);
    mockPrisma.groupMember.create.mockResolvedValue({});
    mockPrisma.groupMember.count.mockResolvedValue(3);
    mockPrisma.group.update.mockResolvedValue({});
    mockPrisma.group.findUnique.mockResolvedValue(mockGroupResult);

    await service.joinConcert('user-me', 'concert-1', baseDto);

    expect(mockPrisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ chatUnlocked: true }),
      }),
    );
  });
});
