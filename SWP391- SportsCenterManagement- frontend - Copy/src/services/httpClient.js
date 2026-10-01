import axios from 'axios';

// Base URL configuration (from environment variable or fallback to /api proxy)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create Axios Instance
export const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if available
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('SCMS_AUTH_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize data response and error handling
httpClient.interceptors.response.use(
  (response) => {
    // Return response body directly
    return response.data;
  },
  (error) => {
    // Check if network error (backend down / connection refused)
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
      const netError = new Error(`Không thể kết nối đến máy chủ Backend (${BASE_URL}). Vui lòng kiểm tra lại dịch vụ Backend!`);
      netError.isNetworkError = true;
      netError.originalError = error;
      return Promise.reject(netError);
    }

    // Handle 401 Unauthorized (Token expired or invalid)
    if (error.response?.status === 401) {
      console.warn('[SCMS Auth] Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
      // Optional: dispatch event so AuthContext or app can react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SCMS_UNAUTHORIZED'));
      }
    }

    // Extract business error message from server
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.title ||
      error.message ||
      'Đã xảy ra lỗi khi kết nối với máy chủ';

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

// Helper to check if mock mode is forced
export function isMockModeForced() {
  const envMock = import.meta.env.VITE_USE_MOCK;
  if (envMock === 'true' || envMock === true) return true;
  const localSetting = localStorage.getItem('SCMS_USE_MOCK');
  if (localSetting === 'true') return true;
  return false;
}

// Toggle mock mode manually in browser
export function setMockMode(enabled) {
  if (enabled) {
    localStorage.setItem('SCMS_USE_MOCK', 'true');
  } else {
    localStorage.removeItem('SCMS_USE_MOCK');
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('SCMS_API_MODE_CHANGED', { detail: { useMock: enabled } }));
  }
}

// Check backend health
export async function checkBackendConnection() {
  try {
    const res = await axios.get(`${BASE_URL}/sports`, { timeout: 3000 });
    return { online: true, data: res.data };
  } catch (err) {
    // If /sports is not implemented, try /packages or /health
    try {
      const res2 = await axios.get(`${BASE_URL}/packages`, { timeout: 3000 });
      return { online: true, data: res2.data };
    } catch (e2) {
      return { online: false, error: err.message };
    }
  }
}

export default httpClient;
