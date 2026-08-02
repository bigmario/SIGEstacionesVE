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

import { SHIFTS_BASE_ROUTE } from '../constants/routes.const';
import { ShiftsService } from '../services/shifts.service';
import { OpenShiftDto } from '../dtos/open-shift.dto';
import { SubmitReadingsDto } from '../dtos/submit-readings.dto';
import { CashCountDto } from '../dtos/cash-count.dto';

@ApiBearerAuth()
@ApiTags('Shifts')
@UseGuards(RolesGuard)
@Controller(SHIFTS_BASE_ROUTE)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Roles(Role.VENDEDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('/open')
  @ApiOperation({ summary: 'Apertura de turno de trabajo' })
  public async openShift(@Body() body: OpenShiftDto) {
    return this.shiftsService.openShift(body);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener información del turno por ID' })
  public async getShiftById(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.getShiftById(id);
  }

  @Get('/station/:stationId')
  @ApiOperation({ summary: 'Obtener turnos de una estación de servicio' })
  public async getShiftsByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.shiftsService.getShiftsByStation(stationId);
  }

  @Roles(Role.VENDEDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('/:id/readings')
  @ApiOperation({ summary: 'Registrar lecturas de contadores de bombas' })
  public async submitReadings(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubmitReadingsDto,
  ) {
    return this.shiftsService.submitReadings(id, body);
  }

  @Roles(Role.VENDEDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('/:id/cash-count')
  @ApiOperation({ summary: 'Registrar arqueo final de caja' })
  public async recordCashCount(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CashCountDto,
  ) {
    return this.shiftsService.recordCashCount(id, body);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.VENDEDOR)
  @Post('/:id/close')
  @ApiOperation({
    summary:
      'Cierre definitivo de turno, validación de inventario y cuadre financiero transaccional',
  })
  public async closeShift(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.closeShift(id);
  }
}
