import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ArrivalWindow, ActivityType } from '@prisma/client';

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
  report: { create: jest.fn() },
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
});
