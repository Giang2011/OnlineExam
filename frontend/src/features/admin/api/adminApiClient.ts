import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { authStorage } from '../../../shared/lib/authStorage';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';

const adminApiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      authStorage.clear();

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      return Promise.reject(error);
    }

    const suppressErrorToast = Boolean((error.config as { suppressErrorToast?: boolean } | undefined)?.suppressErrorToast);

    if (!suppressErrorToast) {
      const message = normalizeApiErrorMessage(error);
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default adminApiClient;
