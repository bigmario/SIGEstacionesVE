import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashFlowCategory, FlowType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCashFlowDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiPropertyOptional({ description: 'ID del turno (si aplica)', example: 1 })
  @IsOptional()
  @IsInt()
  shiftId?: number;

  @ApiProperty({
    description: 'Tipo de flujo',
    enum: FlowType,
    example: FlowType.EGRESO,
  })
  @IsEnum(FlowType)
  @IsNotEmpty()
  type: FlowType;

  @ApiProperty({
    description: 'Categoría de caja chica',
    enum: CashFlowCategory,
    example: CashFlowCategory.FLETE,
  })
  @IsEnum(CashFlowCategory)
  @IsNotEmpty()
  category: CashFlowCategory;

  @ApiProperty({
    description: 'Monto en Bolívares (Decimal 14,2)',
    example: '1500.00',
  })
  @IsNumberString()
  @IsNotEmpty()
  amountBs: string;

  @ApiPropertyOptional({
    description: 'Monto equivalente en USD (Decimal 14,2)',
    example: '41.09',
  })
  @IsOptional()
  @IsNumberString()
  amountUsd?: string;

  @ApiProperty({
    description: 'Tasa oficial de cambio utilizada (Decimal 14,4)',
    example: '36.5000',
  })
  @IsNumberString()
  @IsNotEmpty()
  exchangeRate: string;

  @ApiProperty({
    description: 'Descripción o concepto del movimiento',
    example: 'Pago de flete de transporte cisterna',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;
}
