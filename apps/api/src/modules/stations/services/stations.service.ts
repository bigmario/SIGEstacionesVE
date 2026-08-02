import { Injectable } from '@nestjs/common';
import { StationsRepository } from '../repositories/stations.repository';
import { CreateStationDto } from '../dtos/create-station.dto';
import { UpdateStationDto } from '../dtos/update-station.dto';
import { CreateTankDto } from '../dtos/create-tank.dto';
import { UpdateTankDto } from '../dtos/update-tank.dto';
import { CreatePumpDto } from '../dtos/create-pump.dto';
import { UpdatePumpDto } from '../dtos/update-pump.dto';

@Injectable()
export class StationsService {
  constructor(private readonly stationsRepository: StationsRepository) {}

  // Stations
  public async createStation(dto: CreateStationDto) {
    return this.stationsRepository.createStation(dto);
  }

  public async getAllStations() {
    return this.stationsRepository.findAllStations();
  }

  public async getStationById(id: number) {
    return this.stationsRepository.findStationById(id);
  }

  public async updateStation(id: number, dto: UpdateStationDto) {
    return this.stationsRepository.updateStation(id, dto);
  }

  // Tanks
  public async createTank(dto: CreateTankDto) {
    return this.stationsRepository.createTank(dto);
  }

  public async getTanksByStation(stationId: number) {
    return this.stationsRepository.findTanksByStation(stationId);
  }

  public async getTankById(id: number) {
    return this.stationsRepository.findTankById(id);
  }

  public async updateTank(id: number, dto: UpdateTankDto) {
    return this.stationsRepository.updateTank(id, dto);
  }

  // Pumps
  public async createPump(dto: CreatePumpDto) {
    return this.stationsRepository.createPump(dto);
  }

  public async getPumpsByStation(stationId: number) {
    return this.stationsRepository.findPumpsByStation(stationId);
  }

  public async getPumpById(id: number) {
    return this.stationsRepository.findPumpById(id);
  }

  public async updatePump(id: number, dto: UpdatePumpDto) {
    return this.stationsRepository.updatePump(id, dto);
  }
}
