import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { request, setSession, getSession, allPages } from '../src/services/httpClient.js';
import { authApi, bookingApi, memberApi, receptionApi, classApi } from '../src/services/api.js';
import { setAccess, canAccessRoute } from '../src/services/permissions.js';
const originalFetch = globalThis.fetch;
const calls = [];
let respond;
beforeEach(() => {
  calls.length = 0;
  setSession({ token: 'server-issued-test-token', expiresAt: '2099-01-01', user: { centerId: 7, role: 'MEMBER' } });
  respond = () => new Response('{}', { status: 200 });
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return respond(url, options); };
});
after(() => { globalThis.fetch = originalFetch; setSession(null); });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
test('HTTP gửi Bearer, JSON và hỗ trợ response 204 rỗng', async () => {
  respond = () => new Response(null, { status: 204 });
  assert.equal(await request('/api/profile/me', { method: 'PATCH', body: { fullName: 'Tên' } }), null);
  assert.equal(calls[0].headers.Authorization, 'Bearer server-issued-test-token');
  assert.equal(JSON.parse(calls[0].body).fullName, 'Tên');
});
test('lỗi validation, conflict, forbidden giữ status và không giả thành công', async () => {
  for (const status of [400, 403, 404, 409, 422, 500]) {
    respond = () => json({ detail: `server-${status}` }, status);
    await assert.rejects(request('/api/test'), error => error.status === status && error.message === `server-${status}`);
  }
});
test('401 được xác thực hủy phiên; login sai không gửi token cũ', async () => {
  respond = () => json({ message: 'Denied' }, 401);
  await assert.rejects(request('/api/profile/me'), { status: 401 });
  assert.equal(getSession(), null);
  await assert.rejects(authApi.login('wrong@example.com', 'WrongPassword1!'), { status: 401 });
  assert.equal(calls[1].headers.Authorization, undefined);
});
test('lỗi mạng và timeout không fallback dữ liệu mẫu', async () => {
  respond = () => { throw new TypeError('network'); };
  await assert.rejects(bookingApi.bookClass(2, 31), { status: 0 });
  respond = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError'))));
  await assert.rejects(request('/api/test', { timeout: 5 }), { status: 0 });
});
test('login dùng API DTO email và lấy profile/member/subscription thật', async () => {
  respond = url => {
    if (url.endsWith('/auth/login')) return json({ accessToken: 'real-response-token', expiresAt: '2099-01-01', userId: 10, role: 'Member' });
    if (url.endsWith('/profile/me')) return json({ userId: 10, role: 'MEMBER', centerId: 7, fullName: 'Tên', status: 'Active' });
    if (url.endsWith('/members/me')) return json({ memberId: 20 });
    return json([{ packageId: 30, packageName: 'Package', status: 'Active', endDate: '2099-12-31' }]);
  };
  const result = await authApi.login('member@example.com', 'SafePassword123!');
  assert.equal(result.user.id, 10);
  assert.equal(result.user.memberId, 20);
  assert.equal(result.user.packageId, 30);
  assert.equal(result.user.password, undefined);
  assert.equal(JSON.parse(calls[0].body).email, 'member@example.com');
  assert.equal(calls[1].headers.Authorization, 'Bearer real-response-token');
});
test('register không tự tạo phiên; password Unicode bị chặn trước HTTP', async () => {
  setSession({ user: { centerId: 7 } });
  respond = () => json({ memberId: 4 }, 201);
  const result = await authApi.register({ fullName: 'Hội viên', email: 'member@example.com', password: 'StrongPassword123!' });
  assert.equal(result.memberId, 4);
  assert.equal(getSession().token, undefined);
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(calls[0].body).centerId, 7);
  await assert.rejects(authApi.login('x', 'mậtkhẩu'));
  assert.equal(calls.length, 1);
});
test('booking dùng session ID, 202 waitlist là thành công có trạng thái riêng', async () => {
  respond = () => json({ booked: false, waitlisted: true, waitlistId: 99 }, 202);
  const result = await bookingApi.bookClass(10, 123, '2026-01-01');
  assert.equal(result.waitlisted, true);
  assert.ok(calls[0].url.endsWith('/class-sessions/123/bookings'));
  assert.equal(calls[0].body, undefined);
  respond = () => json({ booking: { id: 44 }, message: 'Cancelled' });
  await bookingApi.cancelBooking(44);
  assert.equal(calls[1].method, 'DELETE');
});
test('thanh toán chỉ trả URL; retry mạng giữ cùng Idempotency-Key', async () => {
  respond = () => { throw new TypeError('network'); };
  await assert.rejects(memberApi.subscribeOnline({ packageId: 8, paymentMethod: 'VNPAY' }));
  respond = () => json({ paymentUrl: 'https://sandbox.example/checkout' });
  const result = await memberApi.subscribeOnline({ packageId: 8, paymentMethod: 'VNPAY' });
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.equal(result.member, undefined);
  assert.ok(result.paymentUrl);
});
test('tra cứu member dùng paged API và ID member; không fetch với từ khóa ngắn', async () => {
  respond = url => json({ items: [{ memberId: url.includes('page=1&') ? 11 : 12, userId: 90, accountStatus: 'Active' }], totalCount: 2 });
  const rows = await receptionApi.lookupMember('Tên');
  assert.deepEqual(rows.map(r => r.id), [11, 12]);
  assert.equal(calls.length, 2);
  await assert.rejects(receptionApi.lookupMember('a'));
});
test('allPages giữ bảng rỗng, chức năng AI chưa có API báo 501', async () => {
  respond = () => json({ items: [], totalCount: 0 });
  assert.deepEqual(await allPages('/api/class-sessions'), []);
  await assert.rejects(memberApi.askAI('hello'), { status: 501 });
  assert.equal(calls.length, 1);
});
test('lịch coach lấy từ token, không gửi ID của coach khác', async () => {
  respond = () => json([]);
  assert.deepEqual(await classApi.getForCoach(999), []);
  assert.ok(calls[0].url.endsWith('/coaches/me/teaching-schedule'));
});
test('quyền quản trị theo permission máy chủ, Manager không có bypass', () => {
  setAccess('MANAGER', []);
  assert.equal(canAccessRoute('MANAGER', ['MANAGER'], 'manage_staff'), false);
  assert.equal(canAccessRoute('MANAGER', ['MANAGER'], 'manage_roles'), false);
  setAccess('MANAGER', ['staff.center.read']);
  assert.equal(canAccessRoute('MANAGER', ['MANAGER'], 'manage_staff'), true);
  assert.equal(canAccessRoute('MEMBER', ['MANAGER'], 'manage_staff'), false);
  setAccess('MANAGER', []);
  assert.equal(canAccessRoute('MANAGER', ['MANAGER'], 'manage_staff'), false);
});
