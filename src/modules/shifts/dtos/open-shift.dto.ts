import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ description: 'ID del vendedor/islero', example: 2 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Fondo de caja inicial en Bolívares (Decimal 14,2)',
    example: '1500.00',
  })
  @IsNumberString()
  @IsNotEmpty()
  initialCashBs: string;

  @ApiProperty({
    description: 'Fondo de caja inicial en USD (Decimal 14,2)',
    example: '50.00',
  })
  @IsNumberString()
  @IsNotEmpty()
  initialCashUsd: string;

  @ApiProperty({
    description: 'Tasa oficial de cambio (Decimal 14,4)',
    example: '36.5000',
  })
  @IsNumberString()
  @IsNotEmpty()
  exchangeRate: string;

  @ApiPropertyOptional({ description: 'Observaciones de apertura' })
  @IsOptional()
  @IsString()
  notes?: string;
}
