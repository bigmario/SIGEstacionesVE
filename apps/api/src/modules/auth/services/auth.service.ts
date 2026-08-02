import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcryptjs';
import { nanoid } from 'nanoid/async';
import { IRequest } from '@auth/interfaces/express';

import { AuthRepository } from '@auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { RecoveryDto, ResetPassDto } from '@auth/dto/recovery.dto';
import {
  SESSION_PROFILE_SELECT,
  mapSessionToProfile,
} from '@auth/utils/session.utils';
import { isNotFoundError } from '@core/prisma/utils/prisma-error.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepo: AuthRepository,
    public readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  public async validate(email: string, password: string): Promise<any> {
    const findOptions: Prisma.sessionFindFirstArgs = {
      where: { email: email },
      select: {
        id: true,
        email: true,
        password: true,
        user: { select: { id: true } },
        type: { select: { id: true, name: true } },
        rol: { select: { id: true, name: true } },
      },
    };
    const sessionInfo: any = await this.authRepo.getSessionInfo(findOptions);

    if (sessionInfo && compareSync(password, sessionInfo.password)) {
      await this.authRepo.updateMetadata(sessionInfo.id);

      return {
        id: sessionInfo.user.id,
        typeId: sessionInfo.type.id,
        rolId: sessionInfo.rol.id,
      };
    }

    return null;
  }

  public async login(sessionInfo: IRequest['user']): Promise<any> {
    const findOptions: Prisma.sessionFindFirstArgs = {
      where: { user: { id: sessionInfo.id } },
      select: SESSION_PROFILE_SELECT,
    };
    const fullSessionInfo: any =
      await this.authRepo.getSessionInfo(findOptions);

    const profile = mapSessionToProfile(fullSessionInfo);

    return {
      access_token: this.jwtService.sign(sessionInfo, {
        jwtid: await nanoid(),
      }),
      ...profile,
    };
  }

  public async logout(req: IRequest) {
    const token = req.headers.authorization?.split(' ')?.[1];
    if (!token) {
      return { message: 'session closed successfully' };
    }

    const decodeToken: any = this.jwtService.decode(token, { complete: true });
    if (!decodeToken || !decodeToken.payload?.jti) {
      return { message: 'session closed successfully' };
    }

    const jti = decodeToken.payload.jti;
    const now = Date.now();
    const exp = decodeToken.payload.exp * 1000;
    const ttlMs = exp - now;

    await this.cacheManager.set(jti, jti, ttlMs > 0 ? ttlMs : 0);

    return { message: 'session closed successfully' };
  }

  public async getMyInfo(sessionInfo: IRequest['user']) {
    const findOptions: Prisma.sessionFindFirstArgs = {
      where: { user: { id: sessionInfo.id } },
      select: SESSION_PROFILE_SELECT,
    };

    const fullSessionInfo: any =
      await this.authRepo.getSessionInfo(findOptions);

    return mapSessionToProfile(fullSessionInfo);
  }

  public async sendRecoveryMail(recoveryDto: RecoveryDto) {
    try {
      const findOptions: Prisma.sessionFindFirstOrThrowArgs = {
        where: {
          email: recoveryDto.email,
        },
        include: {
          user: true,
        },
      };

      return await this.authRepo.sendRecoveryMail(findOptions);
    } catch (error) {
      if (isNotFoundError(error)) {
        this.logger.warn(
          `Intento de recuperación para email no registrado: ${recoveryDto.email}`,
        );
        // Respuesta genérica para evitar enumeración de usuarios
        return {
          message:
            'Si la cuenta existe, se ha enviado un correo de recuperación',
        };
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Error inesperado al enviar correo de recuperación:',
        error,
      );
      throw new InternalServerErrorException('Ocurrió un error inesperado');
    }
  }

  public async resetPassword(resetPassDto: ResetPassDto) {
    return await this.authRepo.resetPassword(
      resetPassDto.token,
      resetPassDto.newPassword,
    );
  }
}
