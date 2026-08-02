import { buildPaginationCacheKeySuffix } from './pagination.utils';

describe('PaginationUtils', () => {
  it('debería construir valores por defecto cuando no se envían parámetros', () => {
    const result = buildPaginationCacheKeySuffix({});
    expect(result).toBe('page=1&limit=10');
  });

  it('debería incluir la página y límite enviados', () => {
    const result = buildPaginationCacheKeySuffix({ page: 2, limit: 20 });
    expect(result).toBe('page=2&limit=20');
  });

  it('debería incluir filtros adicionales como búsqueda codificada', () => {
    const result = buildPaginationCacheKeySuffix(
      { page: 1, limit: 10 },
      { search: 'mario dev' },
    );
    expect(result).toBe('page=1&limit=10&search=mario%20dev');
  });
});
