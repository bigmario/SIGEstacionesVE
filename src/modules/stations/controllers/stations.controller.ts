import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { Role } from '@auth/models/roles.model';

import { STATIONS_BASE_ROUTE } from '../constants/routes.const';
import { StationsService } from '../services/stations.service';
import { CreateStationDto } from '../dtos/create-station.dto';
import { UpdateStationDto } from '../dtos/update-station.dto';
import { CreateTankDto } from '../dtos/create-tank.dto';
import { UpdateTankDto } from '../dtos/update-tank.dto';
import { CreatePumpDto } from '../dtos/create-pump.dto';
import { UpdatePumpDto } from '../dtos/update-pump.dto';

@ApiBearerAuth()
@ApiTags('Stations')
@UseGuards(RolesGuard)
@Controller(STATIONS_BASE_ROUTE)
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  // ── Stations ───────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PROGRAMADOR)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva estación de servicio' })
  public async createStation(@Body() body: CreateStationDto) {
    return this.stationsService.createStation(body);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las estaciones de servicio' })
  public async getAllStations() {
    return this.stationsService.getAllStations();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener estación de servicio por ID' })
  public async getStationById(@Param('id', ParseIntPipe) id: number) {
    return this.stationsService.getStationById(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar estación de servicio' })
  public async updateStation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStationDto,
  ) {
    return this.stationsService.updateStation(id, body);
  }

  // ── Tanks ──────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PROGRAMADOR)
  @Post('/tanks')
  @ApiOperation({ summary: 'Crear tanque de combustible' })
  public async createTank(@Body() body: CreateTankDto) {
    return this.stationsService.createTank(body);
  }

  @Get('/:stationId/tanks')
  @ApiOperation({ summary: 'Obtener tanques por estación' })
  public async getTanksByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.stationsService.getTanksByStation(stationId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('/tanks/:id')
  @ApiOperation({ summary: 'Actualizar tanque de combustible' })
  public async updateTank(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTankDto,
  ) {
    return this.stationsService.updateTank(id, body);
  }

  // ── Pumps ──────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PROGRAMADOR)
  @Post('/pumps')
  @ApiOperation({ summary: 'Crear bomba / surtidor / manguera' })
  public async createPump(@Body() body: CreatePumpDto) {
    return this.stationsService.createPump(body);
  }

  @Get('/:stationId/pumps')
  @ApiOperation({ summary: 'Obtener bombas por estación' })
  public async getPumpsByStation(
    @Param('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.stationsService.getPumpsByStation(stationId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('/pumps/:id')
  @ApiOperation({ summary: 'Actualizar bomba / surtidor / manguera' })
  public async updatePump(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePumpDto,
  ) {
    return this.stationsService.updatePump(id, body);
  }
}
