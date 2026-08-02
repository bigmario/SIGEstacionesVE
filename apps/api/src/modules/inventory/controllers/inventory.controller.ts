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

import { INVENTORY_BASE_ROUTE } from '../constants/routes.const';
import { InventoryService } from '../services/inventory.service';
import { CreateFuelReceiptDto } from '../dtos/create-fuel-receipt.dto';
import { CreateVolumetricBalanceDto } from '../dtos/create-volumetric-balance.dto';

@ApiBearerAuth()
@ApiTags('Inventory')
@UseGuards(RolesGuard)
@Controller(INVENTORY_BASE_ROUTE)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Post('/receipts')
  @ApiOperation({
    summary:
      'Registrar recepción de combustible (gandola/cisterna) por tanque con factura y control',
  })
  public async recordFuelReceipt(@Body() body: CreateFuelReceiptDto) {
    return this.inventoryService.recordFuelReceipt(body);
  }

  @Get('/receipts/station/:stationId')
  @ApiOperation({ summary: 'Obtener recepciones de combustible por estación' })
  public async getReceiptsByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.inventoryService.getReceiptsByStation(stationId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Post('/volumetric-balance')
  @ApiOperation({
    summary:
      'Generar balance volumétrico diario y registro de varillaje/medición física por tanque',
  })
  public async generateVolumetricBalance(
    @Body() body: CreateVolumetricBalanceDto,
  ) {
    return this.inventoryService.generateVolumetricBalance(body);
  }

  @Get('/volumetric-balance/station/:stationId')
  @ApiOperation({ summary: 'Obtener balances volumétricos por estación' })
  public async getVolumetricBalancesByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.inventoryService.getVolumetricBalancesByStation(stationId);
  }
}
