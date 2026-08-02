import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class CashCountDto {
  @ApiProperty({ description: 'Conteo final de caja en Bs. (Decimal 14,2)', example: '12400.50' })
  @IsNumberString()
  @IsNotEmpty()
  finalCashBs: string;

  @ApiProperty({ description: 'Conteo final de caja en USD (Decimal 14,2)', example: '340.00' })
  @IsNumberString()
  @IsNotEmpty()
  finalCashUsd: string;
}
