import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FuelType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from '../repositories/inventory.repository';

describe('InventoryService', () => {
  let service: InventoryService;
  let _repository: jest.Mocked<InventoryRepository>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const repositoryMock = {
      findReceiptsByStation: jest.fn(),
      findVolumetricBalancesByStation: jest.fn(),
    };

    const prismaMock = {
      $transaction: jest.fn((cb) => cb(prismaMock)),
      tank: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      fuel_receipt: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      shift_reading: {
        aggregate: jest.fn(),
      },
      volumetric_balance: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryRepository, useValue: repositoryMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    _repository = module.get(InventoryRepository);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordFuelReceipt', () => {
    it('should throw BadRequestException if receipt exceeds tank max capacity', async () => {
      (prismaService.tank.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        code: 'TQ-95',
        currentStock: new Decimal('30000'),
        maxCapacity: new Decimal('35000'),
      });

      await expect(
        service.recordFuelReceipt({
          stationId: 1,
          tankId: 1,
          invoiceNumber: 'F-100',
          controlNumber: 'C-100',
          fuelType: FuelType.GASOLINA_95,
          volumeLiters: '10000', // 30,000 + 10,000 = 40,000 > 35,000
          costAmountBs: '100000',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
