import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { PaginationService } from '@core/pagination/services/pagination.service';
import { RedisCacheService } from '@core/cache/redis-cache.service';
import { BaseRepository } from '@core/prisma/repositories/base.repository';
import { runPrismaWrite } from '@core/prisma/utils/prisma-error.util';

import { CreateCashFlowDto } from '../dtos/create-cash-flow.dto';

@Injectable()
export class CashFlowRepository extends BaseRepository {
  constructor(
    public readonly prismaService: PrismaService,
    paginationService: PaginationService,
    cacheService: RedisCacheService,
  ) {
    super(paginationService, cacheService);
  }

  public async createCashFlow(dto: CreateCashFlowDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.cash_flow.create({
          data: {
            stationId: dto.stationId,
            shiftId: dto.shiftId ?? null,
            type: dto.type,
            category: dto.category,
            amountBs: new Decimal(dto.amountBs),
            amountUsd: dto.amountUsd ? new Decimal(dto.amountUsd) : null,
            exchangeRate: new Decimal(dto.exchangeRate),
            description: dto.description,
          },
        }),
      'CCF001',
    );
  }

  public async findCashFlowsByStation(stationId: number) {
    return this.prismaService.cash_flow.findMany({
      where: { stationId },
      orderBy: { createdAt: 'desc' },
      include: { shift: true },
    });
  }

  public async findCashFlowsByShift(shiftId: number) {
    return this.prismaService.cash_flow.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
