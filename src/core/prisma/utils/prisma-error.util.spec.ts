import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  isNotFoundError,
  mapPrismaError,
  runPrismaWrite,
  throwUnexpectedError,
} from './prisma-error.util';

describe('PrismaErrorUtil', () => {
  describe('isNotFoundError', () => {
    it('debería retornar true si el código de error es P2025', () => {
      expect(isNotFoundError({ code: 'P2025' })).toBe(true);
    });

    it('debería retornar true si name es NotFoundError', () => {
      expect(isNotFoundError({ name: 'NotFoundError' })).toBe(true);
    });

    it('debería retornar false para otros errores', () => {
      expect(isNotFoundError({ code: 'P2002' })).toBe(false);
      expect(isNotFoundError(new Error('Unknown'))).toBe(false);
    });
  });

  describe('mapPrismaError', () => {
    it('debería relanzar una HttpException sin modificarla', () => {
      const httpErr = new NotFoundException('Bad input');
      expect(() => mapPrismaError(httpErr)).toThrow(NotFoundException);
    });

    it('debería transformar el código P2002 en ConflictException 409', () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['email'] },
      });
      expect(() => mapPrismaError(p2002)).toThrow(ConflictException);
    });

    it('debería transformar P2025 en NotFoundException 404', () => {
      const p2025 = { code: 'P2025' };
      expect(() => mapPrismaError(p2025)).toThrow(NotFoundException);
    });

    it('debería transformar errores desconocidos en InternalServerErrorException 500', () => {
      expect(() => mapPrismaError(new Error('DB connection lost'))).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('throwUnexpectedError', () => {
    it('debería relanzar HttpException o lanzar InternalServerErrorException', () => {
      expect(() => throwUnexpectedError(new Error('Boom'))).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('runPrismaWrite', () => {
    it('debería retornar el resultado exitoso de la operación', async () => {
      const result = await runPrismaWrite(async () => ({ id: 1 }));
      expect(result).toEqual({ id: 1 });
    });

    it('debería capturar P2002 y lanzar ConflictException', async () => {
      const error = Object.assign(new Error('P2002'), {
        code: 'P2002',
        meta: { target: ['email'] },
      });
      await expect(
        runPrismaWrite(async () => {
          throw error;
        }, 'TEST_CODE'),
      ).rejects.toThrow(ConflictException);
    });

    it('debería capturar P2025 y lanzar NotFoundException', async () => {
      const error = Object.assign(new Error('P2025'), { code: 'P2025' });
      await expect(
        runPrismaWrite(async () => {
          throw error;
        }, 'TEST_CODE'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
