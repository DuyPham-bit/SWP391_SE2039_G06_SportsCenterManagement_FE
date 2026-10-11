const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let requests = [];
let respond;
globalThis.__flowRequest = async (path, options) => { requests.push({ path, options }); return respond(path, options); };
globalThis.localStorage = { getItem: () => JSON.stringify({ centerId: 42, role: 'MEMBER' }) };
const source = fs.readFileSync('src/services/backendApi.js', 'utf8')
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
test('manager catalog uses classes endpoint, not sessions', async () => {
  const { classApi } = await modulePromise; setup(() => [{ id: 30, status: 'Draft' }]);
  const [c] = await classApi.getManagementClasses();
  assert.equal(requests[0].path, 'centers/42/classes/all'); assert.equal(c.id, 30);
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
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify({ centerId: 42, role: 'MANAGER' }) };
  try {
    setup(() => [{ roleId: 5, roleName: 'Coach', permissions: [{code:'read'}], capabilityIds:['view_teaching_schedule'] }]);
    const matrix = await systemApi.getPermissions();
    assert.equal(requests[0].path,'centers/42/roles'); assert.equal(matrix[0].permissions[0].code,'read');
    await systemApi.updatePermissions(5,['read'],['view_teaching_schedule']);
    assert.equal(requests[1].path,'centers/42/roles/5/permissions');
    assert.deepEqual(requests[1].options.body, { permissionCodes:['read'], capabilityIds:['view_teaching_schedule'] });
  } finally { globalThis.localStorage = previous; }
});
test('permission loading failures propagate to the screen', async () => {
  const { systemApi } = await modulePromise;
  setup(() => { throw new Error('Forbidden'); });
  await assert.rejects(systemApi.getPermissions(), /Forbidden/);
});
