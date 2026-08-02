import { ApiProperty } from '@nestjs/swagger';
import { FuelType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsNumberString, IsString, MaxLength } from 'class-validator';

export class CreatePumpDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ description: 'ID del tanque asociado', example: 1 })
  @IsInt()
  @IsNotEmpty()
  tankId: number;

  @ApiProperty({ description: 'Código del surtidor/bomba', example: 'SURT-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @ApiProperty({ description: 'Número de manguera', example: 1 })
  @IsInt()
  @IsNotEmpty()
  hoseNumber: number;

  @ApiProperty({ description: 'Tipo de combustible de la manguera', enum: FuelType, example: FuelType.GASOLINA_95 })
  @IsEnum(FuelType)
  @IsNotEmpty()
  fuelType: FuelType;

  @ApiProperty({ description: 'Lectura inicial/actual del contador totalizador (Decimal 12,3)', example: '124500.500' })
  @IsNumberString()
  @IsNotEmpty()
  currentReading: string;
}
