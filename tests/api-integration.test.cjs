const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let requests = [];
let reply = () => ({});
globalThis.__integrationRequest = async (path, options = {}) => { requests.push({ path, options }); return reply(path, options); };
globalThis.localStorage = { getItem: () => JSON.stringify({ centerId: 42, role: 'MEMBER' }) };
const load = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const api = load(fs.readFileSync('src/services/api.js', 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/^import .*?from '\.\/http.js';/m, 'const apiRequest = globalThis.__integrationRequest;')
  .replace(/^export \{.*?\} from '\.\/backendApi.js';/m, ''));
const backend = load(fs.readFileSync('src/services/backendApi.js', 'utf8')
  .replace(/^import .*?from '\.\/http.js';/m, 'const apiRequest = globalThis.__integrationRequest; const clearApiToken=()=>{}; const createIdempotencyKey=()=>"test"; const getApiToken=()=>"jwt"; const setApiToken=()=>{};')
  .replaceAll('import.meta.env.VITE_SPORTS_CENTER_ID', '42'));
function setup(fn = () => ({})) { requests = []; reply = fn; }

test('training plan sends class ID and exercises without trusting actor from UI', async () => {
  const { coachApi } = await api; setup();
  await coachApi.createTrainingPlan({ classId: 31, coachId: 999, title: 'Plan', goal: 'Goal', startDate: '2026-10-11', exercises: [{ name: 'Warmup', sets: 2, reps: '5 min' }] });
  assert.equal(requests[0].path, 'coaches/me/training-plans');
  assert.equal(requests[0].options.body.classId, 31);
  assert.equal(requests[0].options.body.memberId, null);
  assert.equal(requests[0].options.body.endDate, null);
  assert.equal(requests[0].options.body.coachId, undefined);
  assert.deepEqual(requests[0].options.body.exercises[0], { name: 'Warmup', sets: '2', reps: '5 min', note: null });
});
test('class roster and session attendance use different endpoints', async () => {
  const { coachApi } = await api; setup();
  await coachApi.getMembersForClass(31); await coachApi.getClassMembers(700);
  assert.equal(requests[0].path, 'coaches/me/classes/31/members');
  assert.equal(requests[1].path, 'coaches/me/sessions/700/members');
});
test('personal plan updates use member profile ID and PUT', async () => {
  const { coachApi } = await api; setup();
  await coachApi.savePersonalTrainingPlan({ classId: 31, memberId: 15, title: 'Personal', startDate: '2026-10-11', exercises: [{ name: 'Exercise' }] });
  assert.equal(requests[0].path, 'coaches/me/personal-training-plans');
  assert.equal(requests[0].options.method, 'PUT'); assert.equal(requests[0].options.body.memberId, 15);
});
test('progress and member plans are loaded from server', async () => {
  const { memberApi } = await backend; setup(() => []);
  await memberApi.getMyProgress(); await memberApi.getMyPlans();
  assert.deepEqual(requests.map(r => r.path), ['members/me/progress', 'members/me/training-plans']);
});
test('notifications send an explicit class ID rather than display label', async () => {
  const { coachApi } = await api; setup();
  await coachApi.sendNotification({ classId: '31', title: 'Homework', content: 'Practice', coachId: 999, target: 'Class name' });
  assert.deepEqual(requests[0], { path: 'coaches/me/notifications', options: { method: 'POST', body: { classId: 31, title: 'Homework', content: 'Practice' } } });
});
test('AI chat continues the server owned conversation', async () => {
  const { aiApi } = await api; setup(() => ({ reply: 'Answer', conversationId: 7 }));
  await aiApi.chat('Question', 7);
  assert.equal(requests[0].path, 'ai/chat'); assert.deepEqual(requests[0].options.body, { message: 'Question', conversationId: 7 });
});
test('Google login sends signed credential rather than trusting email/name', async () => {
  const { authApi } = await backend;
  setup(path => path === 'auth/google' ? { accessToken: 'jwt' } : path === 'profile/me' ? { userId: 1, role: 'COACH' } : []);
  await authApi.loginWithGoogle({ credential: 'google-signed-token', email: 'forged@test.invalid', fullName: 'Forged' });
  assert.deepEqual(requests[0], { path: 'auth/google', options: { method: 'POST', token: null, body: { idToken: 'google-signed-token', centerId: 42 } } });
});
test('API failures propagate instead of returning simulated success', async () => {
  const { coachApi } = await api; setup(() => { throw new Error('Forbidden'); });
  await assert.rejects(coachApi.getTrainingPlans(), /Forbidden/);
});

test('staff appointment references existing member without replacing credentials', async () => {
  const { staffApi } = await backend; setup(() => ({ userId: 91, roleName: 'Coach' }));
  const staff = await staffApi.create({ memberId: 15, role: 'COACH', fullName: 'Forged name', email: 'forged@test.invalid', specialty: 'Swimming' });
  assert.equal(requests[0].path, 'centers/42/staff/appointments');
  assert.equal(requests[0].options.body.memberId, 15);
  assert.equal(requests[0].options.body.roleName, 'Coach');
  assert.equal(requests[0].options.body.email, undefined);
  assert.equal(requests[0].options.body.password, undefined);
  assert.equal(staff.id, 91);
});

test('staff role update sends requested role with existing staff user ID', async () => {
  const { staffApi } = await backend;
  setup(path => path.endsWith('/staff?page=1&pageSize=100') ? [{ userId: 91, roleName: 'Coach', fullName: 'Coach', status: 'Active', email: 'staff@test.invalid' }] : { userId: 91, roleName: 'Receptionist' });
  await staffApi.update(91, { role: 'RECEPTIONIST' });
  assert.equal(requests[1].path, 'centers/42/staff/91');
  assert.equal(requests[1].options.body.roleName, 'Receptionist');
});

test('report obtains the full server count instead of counting a limited check-in list', async () => {
  const { reportApi } = await backend;
  setup(path => path.startsWith('reports/checkins?') ? { count: 101 } : path.startsWith('class-sessions?') ? { items: [] } : {});
  const report = await reportApi.getOverview();
  assert.equal(report.todayCheckins, 101);
  assert.equal(requests.filter(r => r.path.startsWith('reports/checkins?')).length, 1);
});

test('CSV export keeps Unicode/quotes and neutralizes spreadsheet formulas', async () => {
  const { createReportCsv } = await load(fs.readFileSync('src/services/reportExport.js', 'utf8'));
  const csv = createReportCsv({ monthlyRevenue: 125000, revenuePeriods: [{ periodStart: '2026-10-11', net: 125000 }], utilizationBySport: [{ name: '=SUM(1,2)"', booked: 2, capacity: 10, percentage: 20 }] }, 'MONTH');
  assert.ok(csv.startsWith('\uFEFF"Chỉ tiêu"'));
  assert.ok(csv.includes('"Doanh thu thuần","125000","MONTH"'));
  assert.ok(csv.includes('"\'=SUM(1,2)"""'));
});

test('HTTP sends JWT and expires only the current protected session', async () => {
  let token = 'current-jwt'; let events = 0; let lastFetch;
  globalThis.localStorage = { getItem: () => token, setItem: (_, value) => { token = value; }, removeItem: () => { token = null; } };
  globalThis.window = { dispatchEvent: () => { events += 1; } };
  let status = 200;
  globalThis.fetch = async (url, options) => {
    lastFetch = { url, options };
    return new Response(status === 200 ? '{"ok":true}' : '{"message":"Invalid"}', { status, headers: { 'content-type': 'application/json' } });
  };
  const http = await load(fs.readFileSync('src/services/http.js', 'utf8').replace('import.meta.env.VITE_API_BASE_URL', "'/api'"));
  await http.apiRequest('profile/me');
  assert.equal(lastFetch.options.headers.get('Authorization'), 'Bearer current-jwt');
  status = 401;
  await assert.rejects(http.apiRequest('auth/google', { token: null }), /Invalid/);
  assert.equal(token, 'current-jwt'); assert.equal(events, 0);
  await assert.rejects(http.apiRequest('profile/me', { token: 'old-jwt' }), /Invalid/);
  assert.equal(token, 'current-jwt');
  await assert.rejects(http.apiRequest('profile/me'), /Phiên đăng nhập/);
  assert.equal(token, null); assert.equal(events, 1);
});
