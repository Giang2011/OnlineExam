import { AxiosError } from 'axios';
import { normalizeApiErrorMessage } from './apiError';

const DEFAULT_BLOB_ERROR_MESSAGE = 'Không thể xử lý tệp từ máy chủ. Vui lòng thử lại.';

const tryParseJson = (text: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const getMessageFromObject = (obj: Record<string, unknown>): string | null => {
  const candidates = [obj.message, obj.error, obj.detail];

  for (const item of candidates) {
    if (typeof item === 'string' && item.trim().length > 0) {
      return item;
    }
  }

  return null;
};

export const extractBlobErrorMessage = async (
  error: unknown,
  fallback = DEFAULT_BLOB_ERROR_MESSAGE,
): Promise<string> => {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  const blobData = error.response?.data;

  if (blobData instanceof Blob) {
    try {
      const text = await blobData.text();
      const parsed = tryParseJson(text);

      if (parsed) {
        return getMessageFromObject(parsed) ?? normalizeApiErrorMessage(error);
      }

      if (text.trim().length > 0) {
        return text;
      }
    } catch {
      return normalizeApiErrorMessage(error);
    }
  }

  return normalizeApiErrorMessage(error);
};
