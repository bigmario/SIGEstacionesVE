import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@core/prisma/services/prisma.service';
import { ShiftsRepository } from '../repositories/shifts.repository';
import { OpenShiftDto } from '../dtos/open-shift.dto';
import { SubmitReadingsDto } from '../dtos/submit-readings.dto';
import { CashCountDto } from '../dtos/cash-count.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftsRepository: ShiftsRepository,
    private readonly prismaService: PrismaService,
  ) {}

  public async openShift(dto: OpenShiftDto) {
    const activeShift = await this.shiftsRepository.findActiveShiftByUser(
      dto.userId,
    );
    if (activeShift) {
      throw new BadRequestException(
        `El islero ya tiene un turno activo (ID: ${activeShift.id}). Debe cerrarlo antes de abrir uno nuevo.`,
      );
    }
    return this.shiftsRepository.openShift(dto);
  }

  public async getShiftById(id: number) {
    return this.shiftsRepository.findShiftById(id);
  }

  public async getShiftsByStation(stationId: number) {
    return this.shiftsRepository.findShiftsByStation(stationId);
  }

  public async submitReadings(shiftId: number, dto: SubmitReadingsDto) {
    const shift = await this.shiftsRepository.findShiftById(shiftId);
    if (
      shift.status !== ShiftStatus.ABIERTO &&
      shift.status !== ShiftStatus.LECTURA_BOMBAS
    ) {
      throw new BadRequestException(
        `No se pueden registrar lecturas en un turno con estado '${shift.status}'.`,
      );
    }

    return this.prismaService.$transaction(async (tx) => {
      // Eliminar lecturas previas si existiesen para este turno
      await tx.shift_reading.deleteMany({ where: { shiftId } });

      for (const item of dto.readings) {
        const pump = await tx.pump.findUnique({
          where: { id: item.pumpId },
        });
        if (!pump) {
          throw new NotFoundException(
            `No se encontró la bomba con ID ${item.pumpId}.`,
          );
        }

        const initialReading = new Decimal(pump.currentReading);
        const finalReading = new Decimal(item.finalReading);

        if (finalReading.lessThan(initialReading)) {
          throw new BadRequestException(
            `La lectura final (${finalReading.toString()}) no puede ser menor a la lectura inicial (${initialReading.toString()}) de la bomba ${pump.code}.`,
          );
        }

        const soldLiters = finalReading.minus(initialReading);
        const unitPriceBs = new Decimal(item.unitPriceBs);
        const unitPriceUsd = new Decimal(item.unitPriceUsd);
        const totalAmountBs = soldLiters.mul(unitPriceBs);
        const totalAmountUsd = soldLiters.mul(unitPriceUsd);

        await tx.shift_reading.create({
          data: {
            shiftId,
            pumpId: item.pumpId,
            fuelType: pump.fuelType,
            initialReading,
            finalReading,
            soldLiters,
            unitPriceBs,
            unitPriceUsd,
            totalAmountBs,
            totalAmountUsd,
          },
        });
      }

      return tx.shift.update({
        where: { id: shiftId },
        data: { status: ShiftStatus.LECTURA_BOMBAS },
        include: { readings: true },
      });
    });
  }

  public async recordCashCount(shiftId: number, dto: CashCountDto) {
    const shift = await this.shiftsRepository.findShiftById(shiftId);
    if (
      shift.status !== ShiftStatus.LECTURA_BOMBAS &&
      shift.status !== ShiftStatus.ARQUEO_CAJA
    ) {
      throw new BadRequestException(
        `Debe registrar las lecturas de bombas antes del arqueo de caja.`,
      );
    }

    return this.prismaService.shift.update({
      where: { id: shiftId },
      data: {
        finalCashBs: new Decimal(dto.finalCashBs),
        finalCashUsd: new Decimal(dto.finalCashUsd),
        status: ShiftStatus.ARQUEO_CAJA,
      },
    });
  }

  /**
   * Cierre de Turno e Integridad de Inventario en Transacción Interactiva de Prisma.
   */
  public async closeShift(shiftId: number) {
    return this.prismaService.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id: shiftId },
        include: {
          readings: { include: { pump: true } },
          cashFlows: true,
        },
      });

      if (!shift) {
        throw new NotFoundException(`Turno con ID ${shiftId} no encontrado.`);
      }

      if (shift.status === ShiftStatus.CERRADO) {
        throw new BadRequestException(`El turno ya se encuentra CERRADO.`);
      }

      if (!shift.finalCashBs || !shift.finalCashUsd) {
        throw new BadRequestException(
          `Debe realizar el arqueo final de caja antes de cerrar el turno.`,
        );
      }

      // 1. Agrupar ventas por tanque y verificar existencias
      const tankSalesMap = new Map<number, Decimal>();

      for (const reading of shift.readings) {
        const tankId = Number(reading.pump.tankId);
        const currentSales = tankSalesMap.get(tankId) || new Decimal(0);
        tankSalesMap.set(
          tankId,
          currentSales.plus(new Decimal(reading.soldLiters)),
        );
      }

      for (const [tankId, totalSoldLiters] of tankSalesMap.entries()) {
        const tank = await tx.tank.findUnique({ where: { id: tankId } });
        if (!tank) {
          throw new NotFoundException(`Tanque con ID ${tankId} no encontrado.`);
        }

        const currentStock = new Decimal(tank.currentStock);
        if (currentStock.lessThan(totalSoldLiters)) {
          throw new UnprocessableEntityException(
            `El inventario del tanque '${tank.code}' (Stock actual: ${currentStock.toString()} L) resultaría negativo al descontar ${totalSoldLiters.toString()} L vendidos en el turno.`,
          );
        }

        // Actualizar saldo del tanque
        const newStock = currentStock.minus(totalSoldLiters);
        await tx.tank.update({
          where: { id: tankId },
          data: { currentStock: newStock },
        });
      }

      // 2. Actualizar lectura actual de los contadores de las bombas
      for (const reading of shift.readings) {
        await tx.pump.update({
          where: { id: reading.pumpId },
          data: { currentReading: new Decimal(reading.finalReading) },
        });
      }

      // 3. Cálculos de cuadre de caja (Montos teóricos vs Montos reales)
      let totalSalesBs = new Decimal(0);
      let totalSalesUsd = new Decimal(0);

      for (const reading of shift.readings) {
        totalSalesBs = totalSalesBs.plus(new Decimal(reading.totalAmountBs));
        totalSalesUsd = totalSalesUsd.plus(new Decimal(reading.totalAmountUsd));
      }

      let cashFlowIngresosBs = new Decimal(0);
      let cashFlowEgresosBs = new Decimal(0);
      let cashFlowIngresosUsd = new Decimal(0);
      let cashFlowEgresosUsd = new Decimal(0);

      for (const flow of shift.cashFlows) {
        const amountBs = new Decimal(flow.amountBs);
        const amountUsd = flow.amountUsd
          ? new Decimal(flow.amountUsd)
          : new Decimal(0);

        if (flow.type === 'INGRESO') {
          cashFlowIngresosBs = cashFlowIngresosBs.plus(amountBs);
          cashFlowIngresosUsd = cashFlowIngresosUsd.plus(amountUsd);
        } else if (flow.type === 'EGRESO') {
          cashFlowEgresosBs = cashFlowEgresosBs.plus(amountBs);
          cashFlowEgresosUsd = cashFlowEgresosUsd.plus(amountUsd);
        }
      }

      const initialCashBs = new Decimal(shift.initialCashBs);
      const initialCashUsd = new Decimal(shift.initialCashUsd);

      const expectedCashBs = initialCashBs
        .plus(totalSalesBs)
        .plus(cashFlowIngresosBs)
        .minus(cashFlowEgresosBs);

      const expectedCashUsd = initialCashUsd
        .plus(totalSalesUsd)
        .plus(cashFlowIngresosUsd)
        .minus(cashFlowEgresosUsd);

      const finalCashBs = new Decimal(shift.finalCashBs);
      const finalCashUsd = new Decimal(shift.finalCashUsd);

      const cashDifferenceBs = finalCashBs.minus(expectedCashBs);
      const cashDifferenceUsd = finalCashUsd.minus(expectedCashUsd);

      // 4. Marcar turno como CERRADO
      return tx.shift.update({
        where: { id: shiftId },
        data: {
          status: ShiftStatus.CERRADO,
          endTime: new Date(),
          cashDifferenceBs,
          cashDifferenceUsd,
        },
        include: {
          readings: { include: { pump: true } },
          cashFlows: true,
        },
      });
    });
  }
}
