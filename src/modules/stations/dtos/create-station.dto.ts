import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStationDto {
  @ApiProperty({ description: 'Nombre de la Estación de Servicio', example: 'E/S El Trébol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({ description: 'Código único de la Estación', example: 'ES-TR-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;

  @ApiProperty({ description: 'RIF de la Estación', example: 'J-12345678-9' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  rif: string;

  @ApiPropertyOptional({ description: 'Dirección física de la estación', example: 'Av. Bolívar, Maracay' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  address?: string;
}
