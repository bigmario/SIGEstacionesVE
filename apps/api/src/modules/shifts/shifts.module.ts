import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { ShiftsService } from './services/shifts.service';
import { ShiftsRepository } from './repositories/shifts.repository';
import { ShiftsController } from './controllers/shifts.controller';

@Module({
  imports: [PrismaModule],
  providers: [ShiftsService, ShiftsRepository],
  controllers: [ShiftsController],
  exports: [ShiftsService, ShiftsRepository],
})
export class ShiftsModule {}
