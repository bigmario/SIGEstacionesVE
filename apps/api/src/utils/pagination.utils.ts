import { AllUsersQueryParams } from '@user/dtos/query-params.dto';

export function buildPaginationCacheKeySuffix(
  queryParams: AllUsersQueryParams | any,
  extraFilters?: { search?: string; [key: string]: any },
): string {
  const page = queryParams?.page ?? 1;
  const limit = queryParams?.limit ?? 10;
  let suffix = `page=${page}&limit=${limit}`;

  if (extraFilters) {
    for (const [key, value] of Object.entries(extraFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        suffix += `&${key}=${encodeURIComponent(String(value))}`;
      }
    }
  }

  return suffix;
}
