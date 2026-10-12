const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let requests = [];
let respond;
globalThis.__flowRequest = async (path, options) => { requests.push({ path, options }); return respond(path, options); };
globalThis.__flowUser = { centerId: 42, role: 'MEMBER' };
const source = fs.readFileSync('src/services/backendApi.js', 'utf8')
  .replace(/^import .*?from '\.\/authState.js';/m, 'const getAuthUser=()=>globalThis.__flowUser; const setAuthUser=user=>{globalThis.__flowUser=user;}; const beginAuthOperation=()=>0; const getAuthVersion=()=>0; const assertAuthVersion=()=>{};')
  .replace(/^import .*?from '\.\/http.js';/m, 'const apiRequest = globalThis.__flowRequest; const clearApiToken=()=>{}; const createIdempotencyKey=()=>"test"; const getApiToken=()=>"token"; const setApiToken=()=>{};')
  .replaceAll('import.meta.env.VITE_SPORTS_CENTER_ID', '42');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function setup(fn) { requests = []; respond = fn; }

test('booking keeps class ID distinct from session ID', async () => {
  const { bookingApi } = await modulePromise;
  setup(() => [{ id: 8, sessionId: 700, classId: 30, status: 'Booked' }]);
  const [b] = await bookingApi.getMemberBookings();
  assert.equal(b.sessionId, 700); assert.equal(b.classId, 30); assert.equal(b.status, 'CONFIRMED');
});
test('waitlisted response is preserved rather than treated as confirmed', async () => {
  const { bookingApi } = await modulePromise;
  setup(() => ({ booked: false, waitlisted: true, waitlistId: 9, booking: null, message: 'Waiting' }));
  const result = await bookingApi.bookClass(999, 700);
  assert.equal(requests[0].path, 'class-sessions/700/bookings');
  assert.equal(result.waitlisted, true); assert.equal(result.booking, null); assert.equal(result.message, 'Waiting');
});

test('member bookings retain server attendance, room, coach and cancellation state', async () => {
  const { bookingApi } = await modulePromise;
  setup(() => [{ id: 8, sessionId: 700, classId: 30, sessionDate: '2026-10-10', startTime: '09:00:00', endTime: '10:00:00',
    status: 'Booked', sessionStatus: 'Scheduled', roomName: 'Studio', coachName: 'Coach', coachSpecialization: 'Yoga',
    attendanceStatus: 'LATE', attendanceNote: 'Arrived 5 minutes late', checkInTime: '2026-10-10T02:05:00Z' }]);
  const [record] = await bookingApi.getMemberBookings();
  assert.equal(record.startTime, '09:00'); assert.equal(record.endTime, '10:00');
  assert.equal(record.roomName, 'Studio'); assert.equal(record.coachName, 'Coach'); assert.equal(record.coachSpecialization, 'Yoga');
  assert.equal(record.attendanceStatus, 'LATE'); assert.equal(record.attendanceNote, 'Arrived 5 minutes late');
  assert.equal(record.checkInTime, '2026-10-10T02:05:00Z'); assert.equal(record.sessionStatus, 'SCHEDULED');
});

test('a confirmed booking without attendance does not imply presence', async () => {
  const { bookingApi } = await modulePromise;
  setup(() => [{ id: 8, sessionId: 700, classId: 30, status: 'Booked' }]);
  const [record] = await bookingApi.getMemberBookings();
  assert.equal(record.attendanceStatus, null); assert.equal(record.checkInTime, null);
  assert.equal(record.coachName, 'Chưa phân công HLV');
});
test('manager catalog uses classes endpoint, not sessions', async () => {
  const { classApi } = await modulePromise; setup(() => [{ id: 30, status: 'Draft' }]);
  const [c] = await classApi.getManagementClasses();
  assert.equal(requests[0].path, 'centers/42/classes/all'); assert.equal(c.id, 30);
});
test('coach schedule requests the chosen historical range and maps real room and timing', async () => {
  const { classApi } = await modulePromise;
  setup(() => [{ sessionId: 700, classId: 30, sessionDate: '2026-10-10', startTime: '09:00:00', endTime: '10:00:00', roomId: 11, roomName: 'Studio', sessionStatus: 'Completed' }]);
  const [session] = await classApi.getTeachingSchedule('2026-10-01', '2026-10-11');
  assert.equal(requests[0].path, 'coaches/me/teaching-schedule?from=2026-10-01&to=2026-10-11&includeHistory=true');
  assert.equal(session.id, 700); assert.equal(session.classId, 30); assert.equal(session.roomName, 'Studio');
  assert.equal(session.endTime, '10:00:00'); assert.equal(session.status, 'COMPLETED');
});
test('session listing loads subsequent pages and preserves waitlist availability', async () => {
  const { classApi } = await modulePromise;
  setup(path => { const page = new URL('http://test/'+path).searchParams.get('page'); return { items: [{ sessionId: Number(page), classId: 30, isBookable: true, allowWaitlist: true }], pageSize: 100, totalCount: 101 }; });
  const sessions = await classApi.getAll();
  assert.equal(sessions.length, 2); assert.equal(sessions[1].id, 2); assert.equal(sessions[0].allowWaitlist, true);
});
test('counter booking sends member profile ID and session ID in scoped endpoint', async () => {
  const { bookingApi } = await modulePromise; setup(() => ({ booked: true }));
  await bookingApi.bookForMember(15,700);
  assert.equal(requests[0].path, 'members/15/class-sessions/700/bookings'); assert.equal(requests[0].options.method, 'POST');
});
test('room updates use center and room ID', async () => {
  const { roomApi } = await modulePromise; setup(() => ({}));
  await roomApi.update(11,{ name: 'Studio', capacity: 20 });
  assert.equal(requests[0].path,'centers/42/rooms/11'); assert.equal(requests[0].options.body.capacity,20);
});
test('cancel response retains late cancellation policy message', async () => {
  const { bookingApi } = await modulePromise; setup(() => ({ isLateCancellation: true, message: 'Late', booking: { status: 'CancelledLate' } }));
  const result = await bookingApi.cancelBooking(8);
  assert.equal(result.isLateCancellation,true); assert.equal(result.message,'Late');
});
test('coach assignment sends coach profile ID', async () => {
  const { classApi } = await modulePromise; setup(() => ({}));
  await classApi.assignCoach(30,'18');
  assert.equal(requests[0].path,'classes/30/coaches'); assert.deepEqual(requests[0].options.body,{coachId:18,isPrimary:true});
});

test('manager permissions are read and written through center scope', async () => {
  const { systemApi } = await modulePromise;
  const previous = globalThis.__flowUser;
  globalThis.__flowUser = { centerId: 42, role: 'MANAGER' };
  try {
    setup(() => [{ roleId: 5, roleName: 'Coach', permissions: [{code:'read'}], capabilityIds:['view_teaching_schedule'] }]);
    const matrix = await systemApi.getPermissions();
    assert.equal(requests[0].path,'centers/42/roles'); assert.equal(matrix[0].permissions[0].code,'read');
    await systemApi.updatePermissions(5,['read'],['view_teaching_schedule']);
    assert.equal(requests[1].path,'centers/42/roles/5/permissions');
    assert.deepEqual(requests[1].options.body, { permissionCodes:['read'], capabilityIds:['view_teaching_schedule'] });
  } finally { globalThis.__flowUser = previous; }
});
test('permission loading failures propagate to the screen', async () => {
  const { systemApi } = await modulePromise;
  setup(() => { throw new Error('Forbidden'); });
  await assert.rejects(systemApi.getPermissions(), /Forbidden/);
});

test('manager member pagination and mutations use member profile IDs and center scope', async () => {
  const { memberApi } = await modulePromise; setup(() => ({ items: [], totalCount: 25 }));
  await memberApi.getCenterMembers(' Nguyễn ', 2);
  const url = new URL('http://test/' + requests[0].path);
  assert.equal(url.pathname, '/centers/42/members'); assert.equal(url.searchParams.get('query'), 'Nguyễn');
  assert.equal(url.searchParams.get('page'), '2');
  await memberApi.updateAtCenter(15, { fullName: 'Updated' });
  await memberApi.setAccountStatus(15, 'Disabled');
  assert.equal(requests[1].path, 'centers/42/members/15');
  assert.equal(requests[2].path, 'centers/42/members/15/status');
  assert.deepEqual(requests[2].options.body, { status: 'Disabled' });
});

test('staff list retrieves additional raw-array pages rather than losing staff after 100', async () => {
  const { staffApi } = await modulePromise;
  setup(path => path.includes('page=1&') ? Array.from({length:100}, (_, i) => ({ userId: i + 1 })) : [{ userId:101 }]);
  const staff = await staffApi.getAll(); assert.equal(staff.length,101); assert.equal(staff[100].id,101); assert.equal(requests.length,2);
});

test('audit server pagination preserves total and does not guess actor role from action', async () => {
  const { systemApi } = await modulePromise;
  setup(() => ({ items: [{ id: 1, actorUserId: 99, action:'MEMBER.CREATED' }], page: 2, pageSize:50, totalCount:75 }));
  const result = await systemApi.getAuditPage(2);
  assert.ok(requests[0].path.includes('page=2&')); assert.equal(result.totalCount,75); assert.equal(result.items[0].role,null);
});

test('custom reports send the same range/grouping to all reports and preserve registration breakdown', async () => {
  const { reportApi } = await modulePromise;
  setup(path => path.startsWith('reports/classes') ? { currentStatusCounts:{Confirmed:3,Cancelled:1}, periods:[{periodStart:'2026-01-01',statusCounts:{Confirmed:2}}] }
    : path.startsWith('reports/membership') ? {totalMembers:9,activeMembers:4,newMembers:2,periods:[{periodStart:'2026-01-01',newMembers:2}]} : {});
  const result = await reportApi.getOverview({ from:'2026-01-01', to:'2026-03-31', groupBy:'month' });
  for (const request of requests.filter(r => /reports\/(classes|membership|revenue)/.test(r.path))) {
    const params = new URL('http://test/' + request.path).searchParams;
    assert.equal(params.get('from'),'2026-01-01'); assert.equal(params.get('to'),'2026-03-31'); assert.equal(params.get('groupBy'),'month'); assert.equal(params.get('centerId'),'42');
  }
  assert.equal(result.newMembers,2); assert.equal(result.classStatusCounts.Cancelled,1); assert.equal(result.classPeriods.length,1);
});

test('invalid report ranges fail before sending a request', async () => {
  const { reportApi } = await modulePromise; setup(() => ({}));
  for (const range of [{ from:'2026-02-30',to:'2026-03-01' }, {from:'2026-03-01',to:'2026-02-01'}, {from:'2024-01-01',to:'2026-01-01'}]) {
    await assert.rejects(reportApi.getOverview(range), /khoảng ngày hợp lệ/);
  }
  assert.equal(requests.length,0);
});
