import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  ValidateNested,
} from 'class-validator';

export class PumpReadingItemDto {
  @ApiProperty({ description: 'ID de la bomba / manguera', example: 1 })
  @IsInt()
  @IsNotEmpty()
  pumpId: number;

  @ApiProperty({
    description: 'Lectura final del totalizador (Decimal 12,3)',
    example: '124850.250',
  })
  @IsNumberString()
  @IsNotEmpty()
  finalReading: string;

  @ApiProperty({
    description: 'Precio unitario en Bs. (Decimal 14,2)',
    example: '18.25',
  })
  @IsNumberString()
  @IsNotEmpty()
  unitPriceBs: string;

  @ApiProperty({
    description: 'Precio unitario en USD (Decimal 14,2)',
    example: '0.50',
  })
  @IsNumberString()
  @IsNotEmpty()
  unitPriceUsd: string;
}

export class SubmitReadingsDto {
  @ApiProperty({
    description: 'Lista de lecturas finales de bombas',
    type: [PumpReadingItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PumpReadingItemDto)
  readings: PumpReadingItemDto[];
}
