const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';
const DEFAULT_API_ORIGIN = 'http://localhost:8080';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL);

export const getApiOrigin = (): string =>
  trimTrailingSlash(import.meta.env.VITE_API_ORIGIN ?? import.meta.env.VITE_BACKEND_ORIGIN ?? DEFAULT_API_ORIGIN);
