import { Prisma } from '@prisma/client';

export const SESSION_PROFILE_SELECT: Prisma.sessionFindFirstArgs['select'] = {
  id: true,
  email: true,
  user: {
    select: {
      id: true,
      name: true,
      lastName: true,
      imgUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  type: { select: { id: true, name: true } },
  rol: { select: { id: true, name: true } },
};

export function mapSessionToProfile(fullSessionInfo: any) {
  if (!fullSessionInfo) return null;
  return {
    ...fullSessionInfo.user,
    email: fullSessionInfo.email,
    type: fullSessionInfo.type?.name,
    rol: fullSessionInfo.rol?.name,
  };
}
