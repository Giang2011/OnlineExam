import { getApiBaseUrl } from './apiBaseUrl';

const normalizeSlashes = (value: string): string => value.replace(/\\/g, '/');

const ensureLeadingSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

export const buildUploadUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';

  const normalized = normalizeSlashes(imagePath.trim());
  if (!normalized) return '';

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const cleanedPath = normalized.startsWith('/uploads')
    ? normalized
    : ensureLeadingSlash(`/uploads/${normalized.replace(/^\/+/, '')}`);

  return `${getApiBaseUrl()}${cleanedPath}`;
};
