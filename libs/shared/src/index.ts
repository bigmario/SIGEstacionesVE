/**
 * @file index.ts
 * @description Punto de entrada para los tipos, interfaces y enums compartidos entre Backend (NestJS) y Frontend (Angular).
 */

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  ISLERO = 'ISLERO',
}

export enum ShiftStatus {
  ABIERTO = 'ABIERTO',
  LECTURA_BOMBAS = 'LECTURA_BOMBAS',
  ARQUEO_CAJA = 'ARQUEO_CAJA',
  CERRADO = 'CERRADO',
}

export enum IdentityPrefix {
  V = 'V',
  E = 'E',
  J = 'J',
  G = 'G',
  P = 'P',
}
