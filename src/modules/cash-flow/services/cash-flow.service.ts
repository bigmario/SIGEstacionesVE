import { Injectable } from '@nestjs/common';

import { CashFlowRepository } from '../repositories/cash-flow.repository';
import { CreateCashFlowDto } from '../dtos/create-cash-flow.dto';

@Injectable()
export class CashFlowService {
  constructor(private readonly cashFlowRepository: CashFlowRepository) {}

  public async createCashFlow(dto: CreateCashFlowDto) {
    return this.cashFlowRepository.createCashFlow(dto);
  }

  public async getCashFlowsByStation(stationId: number) {
    return this.cashFlowRepository.findCashFlowsByStation(stationId);
  }

  public async getCashFlowsByShift(shiftId: number) {
    return this.cashFlowRepository.findCashFlowsByShift(shiftId);
  }
}
