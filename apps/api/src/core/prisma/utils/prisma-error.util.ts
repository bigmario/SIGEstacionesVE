import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

const logger = new Logger('PrismaErrorUtil');

export function isNotFoundError(error: any): boolean {
  return (
    error?.code === 'P2025' ||
    error?.name === 'NotFoundError' ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025')
  );
}

export function mapPrismaError(error: any): never {
  if (error instanceof HttpException) {
    throw error;
  }

  if (error?.code === 'P2002') {
    const target = (error.meta?.target as string[])?.join(', ') || 'field';
    throw new ConflictException(`Unique constraint failed on ${target}`);
  }

  if (isNotFoundError(error)) {
    throw new NotFoundException('Resource not found');
  }

  logger.error('Unexpected database error:', error);
  throw new InternalServerErrorException(
    'An unexpected database error occurred',
  );
}

export function throwUnexpectedError(
  error: any,
  context = 'DatabaseOperation',
): never {
  if (error instanceof HttpException) {
    throw error;
  }
  logger.error(`[${context}] Error:`, error);
  throw new InternalServerErrorException('An unexpected error occurred');
}

export async function runPrismaWrite<T>(
  operation: () => Promise<T>,
  code = 'DB001',
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    if (error?.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      throw new ConflictException({
        message: `Unique constraint failed on ${target}`,
        code,
      });
    }
    if (isNotFoundError(error)) {
      throw new NotFoundException({
        message: 'Resource not found',
        code,
      });
    }
    logger.error(`[${code}] Prisma write error:`, error);
    throw new InternalServerErrorException({
      message: 'Ocurrio un error',
      code,
    });
  }
}
