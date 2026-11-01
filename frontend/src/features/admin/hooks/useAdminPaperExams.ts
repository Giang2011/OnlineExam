import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createPaperExam,
  deletePaperExam,
  getPaperExamAnswers,
  getPaperExamById,
  getPaperExams,
  scanPaperExam,
  getPaperExamScanResults,
  getPaperExamScanResultById,
} from '../api/paperExamApi';
import type {
  PaperExamAnswerView,
  PaperExamCreatePayload,
  PaperExamDetail,
  PaperExamListItem,
  PaperExamScanListItem,
  PaperExamScanRequest,
  PaperExamScanResponse,
} from '../types';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    return normalizeApiErrorMessage(error);
  }

  return fallback;
};

export interface UseAdminPaperExamsResult {
  paperExams: PaperExamListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminPaperExams = (): UseAdminPaperExamsResult => {
  const [paperExams, setPaperExams] = useState<PaperExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaperExams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPaperExams();
      setPaperExams(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải danh sách đề giấy.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaperExams();
  }, [loadPaperExams]);

  return {
    paperExams,
    loading,
    error,
    refetch: loadPaperExams,
  };
};

export interface UseAdminPaperExamDetailResult {
  paperExam: PaperExamDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminPaperExamDetail = (id: number | string | null): UseAdminPaperExamDetailResult => {
  const [paperExam, setPaperExam] = useState<PaperExamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaperExamDetail = useCallback(async () => {
    if (id === null || id === '') {
      setPaperExam(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPaperExamById(id);
      setPaperExam(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải chi tiết đề giấy.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadPaperExamDetail();
  }, [loadPaperExamDetail]);

  return {
    paperExam,
    loading,
    error,
    refetch: loadPaperExamDetail,
  };
};

export interface UseAdminPaperExamAnswersResult {
  answers: PaperExamAnswerView | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminPaperExamAnswers = (id: number | string | null): UseAdminPaperExamAnswersResult => {
  const [answers, setAnswers] = useState<PaperExamAnswerView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaperExamAnswers = useCallback(async () => {
    if (id === null || id === '') {
      setAnswers(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPaperExamAnswers(id);
      setAnswers(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải đáp án đề giấy.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadPaperExamAnswers();
  }, [loadPaperExamAnswers]);

  return {
    answers,
    loading,
    error,
    refetch: loadPaperExamAnswers,
  };
};

export interface UseCreatePaperExamResult {
  loading: boolean;
  error: string | null;
  create: (payload: PaperExamCreatePayload) => Promise<PaperExamDetail>;
}

export const useCreatePaperExam = (onSuccess?: (created: PaperExamDetail) => Promise<void> | void): UseCreatePaperExamResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: PaperExamCreatePayload) => {
      setLoading(true);
      setError(null);

      try {
        const created = await createPaperExam(payload);
        await onSuccess?.(created);
        return created;
      } catch (err) {
        const message = toErrorMessage(err, 'Không thể tạo đề giấy.');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return {
    loading,
    error,
    create,
  };
};

export interface UseDeletePaperExamResult {
  loading: boolean;
  error: string | null;
  remove: (id: number | string) => Promise<boolean>;
}

export const useDeletePaperExam = (onSuccess?: () => Promise<void> | void): UseDeletePaperExamResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: number | string) => {
      setLoading(true);
      setError(null);

      try {
        await deletePaperExam(id);
        await onSuccess?.();
        return true;
      } catch (err) {
        setError(toErrorMessage(err, 'Không thể xóa đề giấy.'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return {
    loading,
    error,
    remove,
  };
};

export interface UsePaperExamScanResult {
  loading: boolean;
  error: string | null;
  scan: (paperExamId: number | string, payload: PaperExamScanRequest) => Promise<PaperExamScanResponse>;
}

export const usePaperExamScan = (onSuccess?: (result: PaperExamScanResponse) => Promise<void> | void): UsePaperExamScanResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(
    async (paperExamId: number | string, payload: PaperExamScanRequest) => {
      setLoading(true);
      setError(null);

      try {
        const result = await scanPaperExam(paperExamId, payload);
        await onSuccess?.(result);
        return result;
      } catch (err) {
        const message = toErrorMessage(err, 'Không thể chấm bài giấy bằng ảnh.');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return {
    loading,
    error,
    scan,
  };
};

export interface UseAdminPaperExamScanResultsResult {
  scanResults: PaperExamScanListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const scanResultsCache = new Map<string, PaperExamScanListItem[]>();

export const useAdminPaperExamScanResults = (paperExamId: number | string | null): UseAdminPaperExamScanResultsResult => {
  const [scanResults, setScanResults] = useState<PaperExamScanListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheKey = paperExamId === null || paperExamId === '' ? null : String(paperExamId);

  const loadScanResults = useCallback(async () => {
    if (cacheKey === null) {
      setScanResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cachedResults = scanResultsCache.get(cacheKey);
    if (cachedResults) {
      setScanResults(cachedResults);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPaperExamScanResults(cacheKey);
      scanResultsCache.set(cacheKey, data);
      setScanResults(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải lịch sử scan đề giấy.'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    void loadScanResults();
  }, [loadScanResults]);

  return {
    scanResults,
    loading,
    error,
    refetch: loadScanResults,
  };
};

export interface UseAdminPaperExamScanResultDetailResult {
  scanResult: PaperExamScanResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminPaperExamScanResultDetail = (
  scanResultId: number | string | null,
): UseAdminPaperExamScanResultDetailResult => {
  const [scanResult, setScanResult] = useState<PaperExamScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScanResult = useCallback(async () => {
    if (scanResultId === null || scanResultId === '') {
      setScanResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPaperExamScanResultById(scanResultId);
      setScanResult(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Không thể tải chi tiết scan đề giấy.'));
    } finally {
      setLoading(false);
    }
  }, [scanResultId]);

  useEffect(() => {
    void loadScanResult();
  }, [loadScanResult]);

  return {
    scanResult,
    loading,
    error,
    refetch: loadScanResult,
  };
};

export default useAdminPaperExams;
