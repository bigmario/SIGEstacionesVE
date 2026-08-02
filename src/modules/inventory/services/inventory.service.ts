import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { InventoryRepository } from '../repositories/inventory.repository';
import { CreateFuelReceiptDto } from '../dtos/create-fuel-receipt.dto';
import { CreateVolumetricBalanceDto } from '../dtos/create-volumetric-balance.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Registro de Recepción de Cisterna/Gandola con actualización transaccional del tanque
   */
  public async recordFuelReceipt(dto: CreateFuelReceiptDto) {
    return this.prismaService.$transaction(async (tx) => {
      const tank = await tx.tank.findUnique({ where: { id: dto.tankId } });
      if (!tank) {
        throw new NotFoundException(`Tanque con ID ${dto.tankId} no encontrado.`);
      }

      const volumeLiters = new Decimal(dto.volumeLiters);
      const currentStock = new Decimal(tank.currentStock);
      const maxCapacity = new Decimal(tank.maxCapacity);
      const newStock = currentStock.plus(volumeLiters);

      if (newStock.greaterThan(maxCapacity)) {
        throw new BadRequestException(
          `La recepción de ${volumeLiters} L supera la capacidad disponible del tanque '${tank.code}' (Capacidad máxima: ${maxCapacity} L, Stock actual: ${currentStock} L).`,
        );
      }

      const receipt = await tx.fuel_receipt.create({
        data: {
          stationId: dto.stationId,
          tankId: dto.tankId,
          invoiceNumber: dto.invoiceNumber,
          controlNumber: dto.controlNumber,
          fuelType: dto.fuelType,
          volumeLiters,
          costAmountBs: new Decimal(dto.costAmountBs),
          costAmountUsd: dto.costAmountUsd ? new Decimal(dto.costAmountUsd) : null,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          notes: dto.notes,
        },
      });

      await tx.tank.update({
        where: { id: dto.tankId },
        data: { currentStock: newStock },
      });

      return receipt;
    });
  }

  public async getReceiptsByStation(stationId: number) {
    return this.inventoryRepository.findReceiptsByStation(stationId);
  }

  /**
   * Cálculo del Balance Volumétrico Diario e Identificación de Mermas fuera de tolerancia
   */
  public async generateVolumetricBalance(dto: CreateVolumetricBalanceDto) {
    return this.prismaService.$transaction(async (tx) => {
      const tank = await tx.tank.findUnique({ where: { id: dto.tankId } });
      if (!tank) {
        throw new NotFoundException(`Tanque con ID ${dto.tankId} no encontrado.`);
      }

      const balanceDate = new Date(dto.date);
      balanceDate.setUTCHours(0, 0, 0, 0);

      // 1. Obtener inventario inicial (Balance anterior o stock actual)
      const previousDate = new Date(balanceDate);
      previousDate.setDate(previousDate.getDate() - 1);

      const previousBalance = await tx.volumetric_balance.findFirst({
        where: { tankId: dto.tankId, date: previousDate },
      });

      const initialInventory = previousBalance
        ? new Decimal(previousBalance.physicalMeasurement)
        : new Decimal(tank.currentStock);

      // 2. Sumar recepciones del día
      const startOfDay = new Date(balanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(balanceDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const receipts = await tx.fuel_receipt.aggregate({
        _sum: { volumeLiters: true },
        where: {
          tankId: dto.tankId,
          receivedAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      const totalReceipts = receipts._sum.volumeLiters
        ? new Decimal(receipts._sum.volumeLiters)
        : new Decimal(0);

      // 3. Sumar ventas del día registradas en mangueras de este tanque
      const sales = await tx.shift_reading.aggregate({
        _sum: { soldLiters: true },
        where: {
          pump: { tankId: dto.tankId },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      const totalSales = sales._sum.soldLiters
        ? new Decimal(sales._sum.soldLiters)
        : new Decimal(0);

      // 4. Cálculo de Inventario Teórico: Inventario Inicial + Recepciones - Ventas Totales
      const theoreticalInventory = initialInventory
        .plus(totalReceipts)
        .minus(totalSales);

      // 5. Medición Física (Varillaje) y Merma/Discrepancia
      const physicalMeasurement = new Decimal(dto.physicalMeasurement);
      const difference = theoreticalInventory.minus(physicalMeasurement);

      // 6. Criterio de Tolerancia (0.5% de capacidad máxima o 50 L por defecto)
      const toleranceThreshold = new Decimal(tank.maxCapacity).mul(new Decimal('0.005'));
      const toleranceAlert = difference.abs().greaterThan(toleranceThreshold);

      // 7. Upsert del registro de balance volumétrico
      return tx.volumetric_balance.upsert({
        where: {
          tankId_date: {
            tankId: dto.tankId,
            date: balanceDate,
          },
        },
        create: {
          stationId: dto.stationId,
          tankId: dto.tankId,
          date: balanceDate,
          initialInventory,
          receipts: totalReceipts,
          totalSales,
          theoreticalInventory,
          physicalMeasurement,
          difference,
          toleranceAlert,
          notes: dto.notes,
        },
        update: {
          initialInventory,
          receipts: totalReceipts,
          totalSales,
          theoreticalInventory,
          physicalMeasurement,
          difference,
          toleranceAlert,
          notes: dto.notes,
        },
      });
    });
  }

  public async getVolumetricBalancesByStation(stationId: number) {
    return this.inventoryRepository.findVolumetricBalancesByStation(stationId);
  }
}
