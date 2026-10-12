import { beginAuthOperation, getAuthVersion, setAuthUser } from './authState.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
// Memory belongs to this document, so another tab cannot replace its JWT.
let accessToken = null;

export function getApiToken() {
  return accessToken;
}

export function setApiToken(token) {
  beginAuthOperation();
  if (!token || token !== accessToken) setAuthUser(null);
  accessToken = token || null;
}

export function clearApiToken() {
  setApiToken(null);
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function apiRequest(path, { method = 'GET', body, token = getApiToken(), headers = {}, signal } = {}) {
  const authVersion = getAuthVersion();
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (cause) {
    const error = new Error(`Không kết nối được API tại ${API_BASE_URL}. Hãy kiểm tra backend và VITE_API_BASE_URL.`);
    error.cause = cause;
    throw error;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const validationErrors = payload?.errors && Object.values(payload.errors).flat().join(' ');
    const diagnosticPath = path.split('?')[0].replace(/^\/+/, '');
    const publicAuthEndpoints = new Set([
      'auth/login',
      'auth/register',
      'auth/google',
      'auth/request-password-reset',
      'auth/reset-password'
    ]);
    const expiredToken = response.status === 401 && token && token === getApiToken() && authVersion === getAuthVersion() &&
      !publicAuthEndpoints.has(diagnosticPath.toLowerCase());
    if (expiredToken) {
      clearApiToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scms:auth-expired'));
      }
    }
    const message = expiredToken
      ? 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
      : payload?.detail || payload?.message || validationErrors || payload?.title ||
        (typeof payload === 'string' && payload) || `Yêu cầu API thất bại (${response.status}).`;
    const traceSuffix = payload?.traceId ? `, traceId ${payload.traceId}` : '';
    const error = new Error(message);
    error.diagnostic = `[${method} /${diagnosticPath}, HTTP ${response.status}${traceSuffix}]`;
    error.status = response.status;
    error.traceId = payload?.traceId;
    error.payload = payload;
    error.retryAfter = response.headers.get('retry-after');
    throw error;
  }

  return payload;
}
