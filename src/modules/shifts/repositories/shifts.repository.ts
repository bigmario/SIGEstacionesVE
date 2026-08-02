import { Injectable } from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { PaginationService } from '@core/pagination/services/pagination.service';
import { RedisCacheService } from '@core/cache/redis-cache.service';
import { BaseRepository } from '@core/prisma/repositories/base.repository';
import { runPrismaWrite } from '@core/prisma/utils/prisma-error.util';

import { OpenShiftDto } from '../dtos/open-shift.dto';

@Injectable()
export class ShiftsRepository extends BaseRepository {
  constructor(
    public readonly prismaService: PrismaService,
    paginationService: PaginationService,
    cacheService: RedisCacheService,
  ) {
    super(paginationService, cacheService);
  }

  public async openShift(dto: OpenShiftDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.shift.create({
          data: {
            stationId: dto.stationId,
            userId: dto.userId,
            status: ShiftStatus.ABIERTO,
            initialCashBs: new Decimal(dto.initialCashBs),
            initialCashUsd: new Decimal(dto.initialCashUsd),
            exchangeRate: new Decimal(dto.exchangeRate),
            notes: dto.notes,
          },
        }),
      'OS001',
    );
  }

  public async findShiftById(id: number) {
    return this.prismaService.shift.findUniqueOrThrow({
      where: { id },
      include: {
        station: true,
        user: true,
        readings: { include: { pump: true } },
        cashFlows: true,
      },
    });
  }

  public async findActiveShiftByUser(userId: number) {
    return this.prismaService.shift.findFirst({
      where: {
        userId,
        status: {
          in: [
            ShiftStatus.ABIERTO,
            ShiftStatus.LECTURA_BOMBAS,
            ShiftStatus.ARQUEO_CAJA,
          ],
        },
        deletedAt: null,
      },
      include: {
        station: true,
        readings: { include: { pump: true } },
        cashFlows: true,
      },
    });
  }

  public async findShiftsByStation(stationId: number) {
    return this.prismaService.shift.findMany({
      where: { stationId, deletedAt: null },
      orderBy: { startTime: 'desc' },
      include: {
        user: true,
        readings: true,
      },
    });
  }

  public async updateShiftStatus(id: number, status: ShiftStatus) {
    return runPrismaWrite(
      () =>
        this.prismaService.shift.update({
          where: { id },
          data: { status },
        }),
      'US002',
    );
  }
}
