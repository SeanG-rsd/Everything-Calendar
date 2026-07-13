import axios, { AxiosError } from 'axios';
import { authEvents } from './authEvents';
import { tokenStorage } from './tokenStorage';

export interface ApiError {
  status: number;
  detail: string;
}

interface FastApiValidationItem {
  loc?: unknown[];
  msg?: unknown;
}

export function parseApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: 0, detail: 'An unexpected error occurred.' };
  }

  const axiosError = error as AxiosError<{ detail?: unknown }>;
  if (!axiosError.response) {
    return { status: 0, detail: 'Network error — check that the backend is running.' };
  }

  const { status, data } = axiosError.response;
  const rawDetail = data?.detail;

  if (typeof rawDetail === 'string') {
    return { status, detail: rawDetail };
  }

  if (Array.isArray(rawDetail)) {
    const detail = (rawDetail as FastApiValidationItem[])
      .map((item) => {
        const loc = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : '';
        return loc ? `${loc}: ${item.msg}` : String(item.msg);
      })
      .join('; ');
    return { status, detail: detail || 'Validation error.' };
  }

  return { status, detail: 'Something went wrong.' };
}

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const client = axios.create({ baseURL, timeout: 10000 });

client.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = parseApiError(error);
    if (apiError.status === 401) {
      await tokenStorage.clear();
      authEvents.emitUnauthorized();
    }
    return Promise.reject(apiError);
  },
);
