import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFuelReceiptDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ description: 'ID del tanque destino', example: 1 })
  @IsInt()
  @IsNotEmpty()
  tankId: number;

  @ApiProperty({ description: 'Número de factura de la cisterna', example: 'FACT-99481' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  invoiceNumber: string;

  @ApiProperty({ description: 'Número de control de la guía de despacho', example: 'CTRL-00384' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  controlNumber: string;

  @ApiProperty({ description: 'Tipo de combustible recibido', enum: FuelType, example: FuelType.GASOLINA_95 })
  @IsEnum(FuelType)
  @IsNotEmpty()
  fuelType: FuelType;

  @ApiProperty({ description: 'Volumen recibido en litros (Decimal 12,3)', example: '38000.000' })
  @IsNumberString()
  @IsNotEmpty()
  volumeLiters: string;

  @ApiProperty({ description: 'Costo total en Bs. (Decimal 14,2)', example: '450000.00' })
  @IsNumberString()
  @IsNotEmpty()
  costAmountBs: string;

  @ApiPropertyOptional({ description: 'Costo total en USD (Decimal 14,2)', example: '12328.76' })
  @IsOptional()
  @IsNumberString()
  costAmountUsd?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de recepción (ISO-8601)', example: '2026-08-02T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @ApiPropertyOptional({ description: 'Notas u observaciones de la cisterna' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;
}
