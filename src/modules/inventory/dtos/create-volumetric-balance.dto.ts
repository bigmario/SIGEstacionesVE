import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVolumetricBalanceDto {
  @ApiProperty({ description: 'ID de la estación de servicio', example: 1 })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ description: 'ID del tanque de combustible', example: 1 })
  @IsInt()
  @IsNotEmpty()
  tankId: number;

  @ApiProperty({ description: 'Fecha del balance (YYYY-MM-DD)', example: '2026-08-02' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Medición física real del tanque (Varillaje / Sticking) en litros (Decimal 12,3)', example: '14850.000' })
  @IsNumberString()
  @IsNotEmpty()
  physicalMeasurement: string;

  @ApiPropertyOptional({ description: 'Observaciones del varillaje o balance' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;
}
