import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { PaginationService } from '@core/pagination/services/pagination.service';
import { RedisCacheService } from '@core/cache/redis-cache.service';
import { BaseRepository } from '@core/prisma/repositories/base.repository';
import { runPrismaWrite } from '@core/prisma/utils/prisma-error.util';

import { CreateStationDto } from '../dtos/create-station.dto';
import { UpdateStationDto } from '../dtos/update-station.dto';
import { CreateTankDto } from '../dtos/create-tank.dto';
import { UpdateTankDto } from '../dtos/update-tank.dto';
import { CreatePumpDto } from '../dtos/create-pump.dto';
import { UpdatePumpDto } from '../dtos/update-pump.dto';

@Injectable()
export class StationsRepository extends BaseRepository {
  constructor(
    public readonly prismaService: PrismaService,
    paginationService: PaginationService,
    cacheService: RedisCacheService,
  ) {
    super(paginationService, cacheService);
  }

  // ── Station CRUD ─────────────────────────────────────────────

  public async createStation(dto: CreateStationDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.station.create({
          data: {
            name: dto.name,
            code: dto.code,
            rif: dto.rif,
            address: dto.address,
          },
        }),
      'CS001',
    );
  }

  public async findStationById(id: number) {
    return this.prismaService.station.findUniqueOrThrow({
      where: { id },
      include: {
        tanks: { where: { deletedAt: null } },
        pumps: { where: { deletedAt: null } },
      },
    });
  }

  public async findAllStations() {
    return this.prismaService.station.findMany({
      where: { deletedAt: null },
      include: {
        tanks: { where: { deletedAt: null } },
        pumps: { where: { deletedAt: null } },
      },
    });
  }

  public async updateStation(id: number, dto: UpdateStationDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.station.update({
          where: { id },
          data: dto,
        }),
      'US001',
    );
  }

  // ── Tank CRUD ───────────────────────────────────────────────

  public async createTank(dto: CreateTankDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.tank.create({
          data: {
            stationId: dto.stationId,
            code: dto.code,
            fuelType: dto.fuelType,
            maxCapacity: new Decimal(dto.maxCapacity),
            currentStock: new Decimal(dto.currentStock),
          },
        }),
      'CT001',
    );
  }

  public async findTankById(id: number) {
    return this.prismaService.tank.findUniqueOrThrow({
      where: { id },
      include: { station: true, pumps: true },
    });
  }

  public async findTanksByStation(stationId: number) {
    return this.prismaService.tank.findMany({
      where: { stationId, deletedAt: null },
    });
  }

  public async updateTank(id: number, dto: UpdateTankDto) {
    const data: Prisma.tankUpdateInput = {};
    if (dto.code) data.code = dto.code;
    if (dto.fuelType) data.fuelType = dto.fuelType;
    if (dto.maxCapacity) data.maxCapacity = new Decimal(dto.maxCapacity);
    if (dto.currentStock) data.currentStock = new Decimal(dto.currentStock);

    return runPrismaWrite(
      () =>
        this.prismaService.tank.update({
          where: { id },
          data,
        }),
      'UT001',
    );
  }

  // ── Pump CRUD ───────────────────────────────────────────────

  public async createPump(dto: CreatePumpDto) {
    return runPrismaWrite(
      () =>
        this.prismaService.pump.create({
          data: {
            stationId: dto.stationId,
            tankId: dto.tankId,
            code: dto.code,
            hoseNumber: dto.hoseNumber,
            fuelType: dto.fuelType,
            currentReading: new Decimal(dto.currentReading),
          },
        }),
      'CP001',
    );
  }

  public async findPumpById(id: number) {
    return this.prismaService.pump.findUniqueOrThrow({
      where: { id },
      include: { station: true, tank: true },
    });
  }

  public async findPumpsByStation(stationId: number) {
    return this.prismaService.pump.findMany({
      where: { stationId, deletedAt: null },
      include: { tank: true },
    });
  }

  public async updatePump(id: number, dto: UpdatePumpDto) {
    const data: Prisma.pumpUpdateInput = {};
    if (dto.code) data.code = dto.code;
    if (dto.hoseNumber) data.hoseNumber = dto.hoseNumber;
    if (dto.fuelType) data.fuelType = dto.fuelType;
    if (dto.currentReading) data.currentReading = new Decimal(dto.currentReading);

    return runPrismaWrite(
      () =>
        this.prismaService.pump.update({
          where: { id },
          data,
        }),
      'UP001',
    );
  }
}
