import { Test, TestingModule } from '@nestjs/testing';
import { BaseRepository } from './base.repository';
import { PaginationService } from '@core/pagination/services/pagination.service';
import { RedisCacheService } from '@core/cache/redis-cache.service';

class TestRepository extends BaseRepository {
  constructor(
    paginationService: PaginationService,
    cacheService: RedisCacheService,
  ) {
    super(paginationService, cacheService);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let paginationService: any;
  let cacheService: any;

  beforeEach(async () => {
    paginationService = {
      createPaginator: jest
        .fn()
        .mockReturnValue((_model: any, _args: any) =>
          Promise.resolve({ data: [{ id: 1 }], meta: {} }),
        ),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
      getWithPrefix: jest.fn(),
      setWithPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TestRepository,
          useFactory: () => new TestRepository(paginationService, cacheService),
        },
      ],
    }).compile();

    repository = module.get<TestRepository>(TestRepository);
  });

  it('debería estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('buildFilters', () => {
    it('debería construir correctamente filtros OR para Prisma', () => {
      const filters = repository.buildFilters('search', ['name', 'email']);
      expect(filters).toEqual([
        { name: { contains: 'search', mode: 'insensitive' } },
        { email: { contains: 'search', mode: 'insensitive' } },
      ]);
    });
  });

  describe('findOneCached', () => {
    it('debería retornar datos del caché si existen', async () => {
      cacheService.get.mockResolvedValue({ id: 1, name: 'Cached' });
      const model = { findFirstOrThrow: jest.fn() };

      const result = await repository.findOneCached(
        model,
        {},
        { keyPrefix: 'test', keySuffix: '1' },
      );
      expect(result).toEqual({ id: 1, name: 'Cached' });
      expect(model.findFirstOrThrow).not.toHaveBeenCalled();
    });

    it('debería consultar la base de datos e invalidad/guardar en caché si hay cache miss', async () => {
      cacheService.get.mockResolvedValue(null);
      const model = {
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: 1, name: 'DB' }),
      };

      const result = await repository.findOneCached(
        model,
        {},
        { keyPrefix: 'test', keySuffix: '1', ttl: 1000 },
      );
      expect(result).toEqual({ id: 1, name: 'DB' });
      expect(cacheService.setWithPrefix).toHaveBeenCalledWith(
        'test',
        'test:1',
        { id: 1, name: 'DB' },
        1000,
      );
    });
  });
});
