import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { CashFlowService } from './services/cash-flow.service';
import { CashFlowRepository } from './repositories/cash-flow.repository';
import { CashFlowController } from './controllers/cash-flow.controller';

@Module({
  imports: [PrismaModule],
  providers: [CashFlowService, CashFlowRepository],
  controllers: [CashFlowController],
  exports: [CashFlowService, CashFlowRepository],
})
export class CashFlowModule {}
