import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { authStorage } from '../../../shared/lib/authStorage';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';

const studentApiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

studentApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

studentApiClient.interceptors.response.use(
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

    const message = normalizeApiErrorMessage(error);
    toast.error(message);

    return Promise.reject(error);
  },
);

export default studentApiClient;
