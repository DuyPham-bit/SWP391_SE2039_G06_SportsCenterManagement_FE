import assert from 'node:assert/strict';
import { test, beforeEach, after } from 'node:test';
import { setSession } from '../src/services/httpClient.js';
import { bookingApi, classApi, receptionApi, coachApi, systemApi, sessionView } from '../src/services/api.js';
import { isUnavailableFeatureRoute } from '../src/services/featureAvailability.js';

const originalFetch = globalThis.fetch;
let calls;
let handle;
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  calls = [];
  handle = () => reply({});
  setSession({ token: 'contract-test', user: { centerId: 7, role: 'MANAGER' } });
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return handle(url, options); };
});
after(() => { globalThis.fetch = originalFetch; setSession(null); });

test('member bookings map sessionDate and bookedAt; no invented room', async () => {
  handle = () => reply([{ id: 55, className: 'Bơi', sessionDate: '2026-10-12', bookedAt: '2026-10-10T07:00:00Z', startTime: '06:30:00', endTime: '07:30:00', status: 'Booked' }]);
  const [b] = await bookingApi.getMemberBookings();
  assert.equal(b.bookingDate, '2026-10-12');
  assert.equal(b.createdAt, '2026-10-10T07:00:00Z');
  assert.equal(b.status, 'CONFIRMED');
  assert.equal(b.roomName, undefined);
});

test('coach session Vietnamese weekdays are derived from ISO dates without local TZ', () => {
  const monday = sessionView({ sessionId: 9, className: 'Yoga', sessionDate: '2026-10-12', startTime: '10:00:00', endTime: '11:00:00' });
  const sunday = sessionView({ sessionId: 10, className: 'Yoga', sessionDate: '2026-10-11', startTime: '10:00:00', endTime: '11:00:00' });
  assert.equal(monday.dayOfWeek, 'Thứ 2');
  assert.equal(sunday.dayOfWeek, 'Chủ Nhật');
});

test('manager classes read real schedules; unknown enrollment counts remain null', async () => {
  handle = url => {
    if (url.includes('/classes/all')) return reply([{ id: 3, sportId: 9, roomId: 2, capacity: 15, status: 'Published' }]);
    if (url.includes('/catalog/sports')) return reply([{ id: 9, name: 'Yoga' }]);
    if (url.includes('/rooms')) return reply([{ id: 2, name: 'Phòng A' }]);
    if (url.includes('/coaches')) return reply([{ coachId: 7, coachName: 'Ngọc', isPrimary: true }]);
    if (url.includes('/schedules')) return reply([{ dayOfWeek: 1, startTime: '08:00:00', endTime: '09:00:00' }]);
    throw Error(url);
  };
  const [c] = await classApi.getAll();
  assert.equal(c.dayOfWeek, 'Thứ 2');
  assert.equal(c.timeSlot, '08:00 - 09:00');
  assert.equal(c.enrolledCount, null);
  assert.equal(c.roomName, 'Phòng A');
  assert.equal(c.coachName, 'Ngọc');
});

test('reception requests real check-in endpoint for session-scoped center', async () => {
  setSession({ token: 'contract-test', user: { centerId: 7, role: 'RECEPTIONIST' } });
  handle = url => url.endsWith('/check-ins') ? reply({ id: 88, memberCode: 'MB-1' }, 201) : reply([]);
  const result = await receptionApi.checkInMember(' MB-1 ');
  assert.equal(result.id, 88);
  assert.equal(calls[0].method, 'POST');
  assert.ok(calls[0].url.endsWith('/api/centers/7/check-ins'));
  assert.deepEqual(JSON.parse(calls[0].body), { identifier: 'MB-1' });
  assert.equal(isUnavailableFeatureRoute('#/receptionist/check-in'), false);
});

test('attendance roster and PUT are scoped to current coach, never send coach identity', async () => {
  setSession({ token: 'contract-test', user: { centerId: 7, role: 'COACH' } });
  handle = url => url.endsWith('/roster') ? reply([{ memberId: 11, memberName: 'Bình' }]) : reply({ updated: 1 });
  const roster = await coachApi.getClassMembers(12);
  assert.equal(roster[0].memberId, 11);
  const result = await coachApi.takeAttendance(12, [{ memberId: 11, status: 'PRESENT', note: '' }]);
  assert.equal(result.updated, 1);
  assert.ok(calls[0].url.endsWith('/api/coaches/me/sessions/12/roster'));
  assert.ok(calls[1].url.endsWith('/api/coaches/me/sessions/12/attendance'));
  assert.equal(calls[1].method, 'PUT');
  assert.deepEqual(JSON.parse(calls[1].body), { records: [{ memberId: 11, status: 'PRESENT', note: '' }] });
});

test('role matrix sends numeric role id and actual codes without UI capability aliases', async () => {
  setSession({ token: 'contract-test', user: { role: 'SYSTEMADMIN', centerId: 7 } });
  handle = url => url.endsWith('/permissions') && !url.includes('/roles/')
    ? reply([{ id: 1, code: 'members.center.read', name: 'Tra cứu' }])
    : reply([{ roleId: 4, roleName: 'Manager', permissions: [{ code: 'members.center.read' }] }]);
  const available = await systemApi.getAllPermissionCodes();
  const matrix = await systemApi.getPermissions();
  assert.equal(available[0].code, matrix[0].permissions[0].code);
  await systemApi.updatePermissions(matrix[0].roleId, ['members.center.read']);
  assert.ok(calls[2].url.endsWith('/api/admin/roles/4/permissions'));
  assert.deepEqual(JSON.parse(calls[2].body), { permissionCodes: ['members.center.read'] });
});
