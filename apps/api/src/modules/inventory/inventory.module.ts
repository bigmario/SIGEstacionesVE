import { Module } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { InventoryService } from './services/inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryController } from './controllers/inventory.controller';

@Module({
  imports: [PrismaModule],
  providers: [InventoryService, InventoryRepository],
  controllers: [InventoryController],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
