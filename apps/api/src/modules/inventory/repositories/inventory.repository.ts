import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/services/prisma.service';
import { PaginationService } from '@core/pagination/services/pagination.service';
import { RedisCacheService } from '@core/cache/redis-cache.service';
import { BaseRepository } from '@core/prisma/repositories/base.repository';

@Injectable()
export class InventoryRepository extends BaseRepository {
  constructor(
    public readonly prismaService: PrismaService,
    paginationService: PaginationService,
    cacheService: RedisCacheService,
  ) {
    super(paginationService, cacheService);
  }

  public async findReceiptsByStation(stationId: number) {
    return this.prismaService.fuel_receipt.findMany({
      where: { stationId },
      orderBy: { receivedAt: 'desc' },
      include: { tank: true },
    });
  }

  public async findReceiptsByTankAndDate(tankId: number, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prismaService.fuel_receipt.findMany({
      where: {
        tankId,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  public async findVolumetricBalancesByStation(stationId: number) {
    return this.prismaService.volumetric_balance.findMany({
      where: { stationId },
      orderBy: { date: 'desc' },
      include: { tank: true },
    });
  }

  public async findVolumetricBalanceByTankAndDate(tankId: number, date: Date) {
    return this.prismaService.volumetric_balance.findFirst({
      where: { tankId, date },
      include: { tank: true },
    });
  }
}
