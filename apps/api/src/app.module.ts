import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { RedisCacheModule } from '@core/cache/redis-cache.module';
import { PaginationModule } from '@core/pagination/pagination.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { EmailModule } from '@core/email/email.module';
import { HealthModule } from '@core/health/health.module';

import { UserModule } from '@user/user.module';
import { AuthModule } from '@auth/auth.module';
import { StationsModule } from '@stations/stations.module';
import { ShiftsModule } from '@shifts/shifts.module';
import { InventoryModule } from '@inventory/inventory.module';
import { CashFlowModule } from '@cash-flow/cash-flow.module';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    RedisCacheModule,
    PrismaModule,
    PaginationModule,
    HealthModule,
    UserModule,
    AuthModule,
    EmailModule,
    StationsModule,
    ShiftsModule,
    InventoryModule,
    CashFlowModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
