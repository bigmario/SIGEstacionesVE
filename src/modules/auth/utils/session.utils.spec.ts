import { mapSessionToProfile, SESSION_PROFILE_SELECT } from './session.utils';

describe('SessionUtils', () => {
  it('debería tener la estructura correcta en SESSION_PROFILE_SELECT', () => {
    expect(SESSION_PROFILE_SELECT.id).toBe(true);
    expect(SESSION_PROFILE_SELECT.email).toBe(true);
    expect(SESSION_PROFILE_SELECT.user).toBeDefined();
  });

  it('debería aplanar correctamente la información de sesión a perfil', () => {
    const rawSession = {
      email: 'user@example.com',
      user: { id: 1, name: 'John', lastName: 'Doe' },
      type: { name: 'Admin' },
      rol: { name: 'SuperUser' },
    };

    const profile = mapSessionToProfile(rawSession);
    expect(profile).toEqual({
      id: 1,
      name: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      type: 'Admin',
      rol: 'SuperUser',
    });
  });

  it('debería retornar null si no hay sesión', () => {
    expect(mapSessionToProfile(null)).toBeNull();
  });
});
