import { ApiProperty } from '@nestjs/swagger';
import { FuelType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTankDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ description: 'Código del tanque', example: 'TQ-G95-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @ApiProperty({
    description: 'Tipo de combustible',
    enum: FuelType,
    example: FuelType.GASOLINA_95,
  })
  @IsEnum(FuelType)
  @IsNotEmpty()
  fuelType: FuelType;

  @ApiProperty({
    description: 'Capacidad máxima en litros (Decimal 12,3)',
    example: '35000.000',
  })
  @IsNumberString()
  @IsNotEmpty()
  maxCapacity: string;

  @ApiProperty({
    description: 'Inventario/Stock inicial en litros (Decimal 12,3)',
    example: '15000.000',
  })
  @IsNumberString()
  @IsNotEmpty()
  currentStock: string;
}
