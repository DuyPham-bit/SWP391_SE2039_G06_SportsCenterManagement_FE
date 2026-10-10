const config = import.meta.env || {};
export const API_BASE_URL = (config.VITE_API_BASE_URL || 'http://localhost:54162').replace(/\/$/, '');
export const PUBLIC_CENTER_ID = config.VITE_CENTER_ID || '';
const SESSION_KEY = 'SCMS_API_SESSION_V1';
let session = null;
try { session = JSON.parse(globalThis.sessionStorage?.getItem(SESSION_KEY) || 'null'); } catch { /* invalid session */ }
export function getSession() { return session; }
export function setSession(value) {
  session = value;
  try {
    if (value) globalThis.sessionStorage?.setItem(SESSION_KEY, JSON.stringify(value));
    else globalThis.sessionStorage?.removeItem(SESSION_KEY);
  } catch { /* session remains in memory */ }
}
export function centerId() {
  const id = session?.user?.centerId || PUBLIC_CENTER_ID;
  if (!id || !/^\d+$/.test(String(id))) throw new Error('Chưa cấu hình trung tâm. Đặt VITE_CENTER_ID hoặc kiểm tra hồ sơ tài khoản.');
  return id;
}
export class ApiError extends Error {
  constructor(message, status = 0, details = null) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; }
}
export async function request(path, { method = 'GET', body, auth = true, headers = {}, timeout = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const token = auth ? session?.token : null;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method, signal: controller.signal,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* non-JSON errors must not expose server HTML */ }
    if (!response.ok) {
      if (response.status === 401 && auth && token) {
        setSession(null);
        globalThis.window?.dispatchEvent(new Event('SCMS_SESSION_EXPIRED'));
      }
      const fallback = { 400: 'Dữ liệu không hợp lệ.', 401: 'Thông tin đăng nhập hoặc phiên không hợp lệ.', 403: 'Bạn không có quyền thực hiện thao tác này.', 404: 'Không tìm thấy dữ liệu.', 409: 'Dữ liệu xung đột. Vui lòng tải lại.', 422: 'Dữ liệu không đáp ứng yêu cầu.', 500: 'Lỗi máy chủ. Vui lòng thử lại.', 503: 'Dịch vụ chưa sẵn sàng.' };
      const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
      throw new ApiError(data?.detail || data?.message || validation || fallback[response.status] || `Yêu cầu thất bại (${response.status}).`, response.status, data);
    }
    return data;
  } catch (error) {
    const normalized = error instanceof ApiError ? error : new ApiError(error.name === 'AbortError' ? 'Yêu cầu quá thời gian. Kiểm tra trạng thái trước khi thử lại giao dịch.' : 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
    if (globalThis.window && globalThis.CustomEvent) window.dispatchEvent(new CustomEvent('SCMS_API_ERROR', { detail: normalized.message }));
    throw normalized;
  } finally { clearTimeout(timer); }
}
export async function allPages(path, pageSize = 50) {
  const items = [];
  for (let page = 1; ; page++) {
    const result = await request(`${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=${pageSize}`);
    if (Array.isArray(result)) return result;
    items.push(...result.items);
    if (items.length >= result.totalCount || result.items.length === 0) return items;
  }
}
export function unavailable(feature) { throw new ApiError(`${feature}: chưa được triển khai trên máy chủ (NOT IMPLEMENTED IN BACKEND).`, 501); }
