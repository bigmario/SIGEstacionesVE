import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { Role } from '@auth/models/roles.model';

import { CASH_FLOW_BASE_ROUTE } from '../constants/routes.const';
import { CashFlowService } from '../services/cash-flow.service';
import { CreateCashFlowDto } from '../dtos/create-cash-flow.dto';

@ApiBearerAuth()
@ApiTags('Cash Flow')
@UseGuards(RolesGuard)
@Controller(CASH_FLOW_BASE_ROUTE)
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Roles(Role.VENDEDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({
    summary:
      'Registrar movimiento de caja chica (ingreso o egreso por flete, gastos operacionales, tarifas)',
  })
  public async createCashFlow(@Body() body: CreateCashFlowDto) {
    return this.cashFlowService.createCashFlow(body);
  }

  @Get('/station/:stationId')
  @ApiOperation({ summary: 'Obtener movimientos de caja chica por estación' })
  public async getCashFlowsByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.cashFlowService.getCashFlowsByStation(stationId);
  }

  @Get('/shift/:shiftId')
  @ApiOperation({ summary: 'Obtener movimientos de caja chica por turno' })
  public async getCashFlowsByShift(
    @Param('shiftId', ParseIntPipe) shiftId: number,
  ) {
    return this.cashFlowService.getCashFlowsByShift(shiftId);
  }
}
