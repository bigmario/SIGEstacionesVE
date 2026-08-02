import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { ShiftsService } from './shifts.service';
import { ShiftsRepository } from '../repositories/shifts.repository';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let repository: jest.Mocked<ShiftsRepository>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const repositoryMock = {
      findActiveShiftByUser: jest.fn(),
      openShift: jest.fn(),
      findShiftById: jest.fn(),
      findShiftsByStation: jest.fn(),
      updateShiftStatus: jest.fn(),
    };

    const prismaMock = {
      $transaction: jest.fn((cb) => cb(prismaMock)),
      shift_reading: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      pump: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tank: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      shift: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: ShiftsRepository, useValue: repositoryMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    repository = module.get(ShiftsRepository);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openShift', () => {
    it('should throw BadRequestException if active shift exists for user', async () => {
      repository.findActiveShiftByUser.mockResolvedValue({ id: 10 } as any);

      await expect(
        service.openShift({
          stationId: 1,
          userId: 2,
          initialCashBs: '100',
          initialCashUsd: '10',
          exchangeRate: '36.5',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should open shift successfully when no active shift exists', async () => {
      repository.findActiveShiftByUser.mockResolvedValue(null);
      repository.openShift.mockResolvedValue({ id: 1, status: ShiftStatus.ABIERTO } as any);

      const result = await service.openShift({
        stationId: 1,
        userId: 2,
        initialCashBs: '100',
        initialCashUsd: '10',
        exchangeRate: '36.5',
      });

      expect(result.id).toBe(1);
    });
  });

  describe('closeShift', () => {
    it('should throw UnprocessableEntityException if tank stock is insufficient', async () => {
      const mockShift = {
        id: 1,
        status: ShiftStatus.ARQUEO_CAJA,
        finalCashBs: new Decimal('100'),
        finalCashUsd: new Decimal('10'),
        initialCashBs: new Decimal('50'),
        initialCashUsd: new Decimal('5'),
        readings: [
          {
            pumpId: 1,
            soldLiters: new Decimal('500'),
            totalAmountBs: new Decimal('1000'),
            totalAmountUsd: new Decimal('30'),
            pump: { tankId: 10 },
          },
        ],
        cashFlows: [],
      };

      (prismaService.shift.findUnique as jest.Mock).mockResolvedValue(mockShift);
      (prismaService.tank.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        code: 'TQ-01',
        currentStock: new Decimal('200'), // 200 L stock < 500 L sales
      });

      await expect(service.closeShift(1)).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
