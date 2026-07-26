import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { PrismaService } from '@core/prisma/services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '@core/email/services/email.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let prismaService: any;
  let jwtService: any;
  let mailService: any;

  beforeEach(async () => {
    prismaService = {
      session: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verify: jest.fn(),
    };

    mailService = {
      sendPassRecoveryMail: jest
        .fn()
        .mockResolvedValue({ accepted: ['test@example.com'] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: mailService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
  });

  it('debería estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('resetPassword', () => {
    it('debería restablecer la contraseña correctamente con un token válido', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 });
      prismaService.session.findFirst.mockResolvedValue({
        id: 10,
        recoveryToken: 'valid-token',
        user: { id: 1 },
      });
      prismaService.session.update.mockResolvedValue({ id: 10 });

      const result = await repository.resetPassword(
        'valid-token',
        'newPassword123',
      );
      expect(result).toEqual({ message: 'Password Changed' });
      expect(prismaService.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
        }),
      );
    });

    it('debería lanzar UnauthorizedException cuando la firma o verificación del JWT falla', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        repository.resetPassword('expired-token', 'newPassword123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar BadRequestException cuando el token no coincide con el almacenado', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 });
      prismaService.session.findFirst.mockResolvedValue({
        id: 10,
        recoveryToken: 'different-token',
      });

      await expect(
        repository.resetPassword('valid-jwt-token', 'newPassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar InternalServerErrorException para errores de base de datos sin filtrar la traza original', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 });
      prismaService.session.findFirst.mockRejectedValue(
        new Error('DB failure'),
      );

      await expect(
        repository.resetPassword('valid-jwt-token', 'newPassword123'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
