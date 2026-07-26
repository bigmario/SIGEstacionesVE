import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import { PrismaService } from '@core/prisma/services/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@core/email/services/email.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    private readonly prismaService: PrismaService,
    public readonly jwtService: JwtService,
    public readonly mailService: EmailService,
    private configService: ConfigService,
  ) {}

  public async getSessionInfo(findOptions: Prisma.sessionFindFirstArgs) {
    return await this.prismaService.session.findFirst(findOptions);
  }

  public async updateMetadata(sessionId: any) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { timesLoggedIn: { increment: 1 }, lastAccess: new Date() },
    });
  }

  public async sendRecoveryMail(
    findOptions: Prisma.sessionFindFirstOrThrowArgs,
  ) {
    const session =
      await this.prismaService.session.findFirstOrThrow(findOptions);

    const payload = { sub: session['user'].id };

    const token = this.jwtService.sign(payload, { expiresIn: '15min' });
    const link = `http://myfrontend.com/recovery?token=${token}`;
    await this.prismaService.session.update({
      where: {
        id: session.id,
      },
      data: {
        recoveryToken: token,
      },
    });

    const mailSent = await this.mailService.sendPassRecoveryMail(
      session.email,
      link,
    );

    if (mailSent['accepted']?.length === 0) {
      throw new InternalServerErrorException('Recovery Mail Not Sent');
    }

    return {
      message: 'Recovery Mail Successfully Sent',
    };
  }

  public async resetPassword(token: string, newPassword: string) {
    try {
      let payload: any;
      try {
        payload = this.jwtService.verify(token);
      } catch {
        throw new UnauthorizedException(
          'Token de recuperación inválido o expirado',
        );
      }

      const session = await this.prismaService.session.findFirst({
        where: {
          user: {
            id: payload.sub,
          },
        },
        include: {
          user: true,
        },
      });

      if (!session || session.recoveryToken !== token) {
        throw new BadRequestException('Token de recuperación no válido');
      }

      const hash = hashSync(newPassword, 10);
      await this.prismaService.session.update({
        where: {
          id: session.id,
        },
        data: {
          recoveryToken: null,
          password: hash,
        },
      });
      return { message: 'Password Changed' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error al reiniciar contraseña:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error al restablecer la contraseña',
      );
    }
  }
}
