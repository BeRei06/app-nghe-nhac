import axios from 'axios';
import { clearAuth, getToken, getRefreshToken, saveToken } from '../utils/storage';
import { API_BASE_URL } from '../utils/env';
import { networkLogger } from '../utils/networkLogger';

let authFailureHandler = null;
export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

if (!API_BASE_URL) {
  console.warn('[API] API_BASE_URL is not configured. Requests may fall back to relative paths.');
}
console.log('[API] baseURL:', API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const handleAuthFailure = async () => {
  if (typeof authFailureHandler === 'function') {
    await authFailureHandler();
  } else {
    await clearAuth();
  }
};

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (__DEV__) {
    config._logId = networkLogger.nextId();
    config._startTime = Date.now();
    console.debug('[API REQUEST]', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const body = JSON.stringify(response.data);
      networkLogger.add({
        id: response.config._logId,
        method: (response.config.method || 'GET').toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: Date.now() - (response.config._startTime || Date.now()),
        size: body.length,
        data: response.data,
        ok: true,
      });
    }
    return response.data;
  },
  async (error) => {
    if (__DEV__) {
      networkLogger.add({
        id: error.config?._logId || networkLogger.nextId(),
        method: (error.config?.method || 'GET').toUpperCase(),
        url: error.config?.url || '',
        status: error.response?.status || 0,
        duration: Date.now() - (error.config?._startTime || Date.now()),
        size: 0,
        data: error.response?.data || { message: error.message },
        ok: false,
      });
    }

    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    if (status === 401 && !originalRequest._retry && !url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        const refreshResponse = await refreshClient.post('/auth/refresh-token', { refresh_token: refreshToken });
        const newToken = refreshResponse.data?.data?.access_token;
        if (!newToken) {
          throw new Error('Không thể làm mới phiên. Vui lòng đăng nhập lại.');
        }

        await saveToken(newToken);
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        onRefreshed(null);
        await handleAuthFailure();
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    if (error instanceof Error) {
      error.message = message;
      error.status = status;
      error.serverData = error.response?.data;
      return Promise.reject(error);
    }
    const wrappedError = new Error(message);
    wrappedError.status = status;
    wrappedError.serverData = error.response?.data;
    return Promise.reject(wrappedError);
  }
);

export default client;
