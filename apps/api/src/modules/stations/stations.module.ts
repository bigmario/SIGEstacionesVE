import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { StationsService } from './services/stations.service';
import { StationsRepository } from './repositories/stations.repository';
import { StationsController } from './controllers/stations.controller';

@Module({
  imports: [PrismaModule],
  providers: [StationsService, StationsRepository],
  controllers: [StationsController],
  exports: [StationsService, StationsRepository],
})
export class StationsModule {}
