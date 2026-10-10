// Optional integration runner. Uses the real API/SQL and leaves uniquely named test records.
// Never run against production. Credentials are read only from environment variables.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { authApi, catalogApi, packageApi, classApi, bookingApi, memberApi, reportApi, systemApi, receptionApi } from '../src/services/api.js';
import { request, setSession } from '../src/services/httpClient.js';
const results = [];
async function check(name, fn) {
  try { const detail = await fn(); results.push({ name, status: 'PASS', detail }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, status: 'FAIL', detail: error.message, httpStatus: error.status }); console.log(`FAIL ${name}: ${error.message}`); }
}
const suffix = Date.now();
const testLogin = `integration-${suffix}@example.invalid`;
const password = `Scms!${crypto.randomUUID()}A1`;
let memberId, center, packageId;
await check('Health', async () => assert.equal((await request('/health', { auth: false })).status, 'ok'));
await check('Swagger JSON', async () => {
  const spec = await request('/swagger/v1/swagger.json', { auth: false });
  assert.ok(spec.paths['/api/auth/login']); assert.ok(spec.paths['/api/catalog/sports']);
  return { paths: Object.keys(spec.paths).length };
});
await check('401 without token', async () => { setSession(null); await assert.rejects(request('/api/profile/me'), { status: 401 }); });
await check('Wrong login rejected', async () => { await assert.rejects(authApi.login(`missing-${suffix}`, password), { status: 401 }); });
await check('Public catalog', async () => {
  const centers = await catalogApi.centers(); assert.ok(centers.length); center = centers[0].id;
  return { centerId: center, sportsCount: (await catalogApi.sports()).length };
});
await check('Register test member (no automatic authentication)', async () => {
  setSession({ user: { centerId: center } });
  const result = await authApi.register({ username: `integration${suffix}`, email: testLogin, fullName: `SCMS Integration ${suffix}`, phone: null, password });
  memberId = result.memberId; assert.ok(memberId); return { memberId };
});
await check('Login and real profile', async () => {
  const { user } = await authApi.login(testLogin, password); assert.equal(user.memberId, memberId); return { userId: user.id, memberId: user.memberId };
});
await check('Update profile persisted by independent GET', async () => {
  const fullName = `SCMS Verified ${suffix}`;
  await authApi.updateProfile(null, { fullName });
  assert.equal((await request('/api/profile/me')).fullName, fullName);
});
await check('Member packages/classes/sessions/bookings', async () => {
  const packages = await packageApi.getAll(); packageId = packages[0]?.id;
  return { packages: packages.length, classes: (await classApi.getAll()).length, sessions: (await classApi.getSessions()).length, bookings: (await bookingApi.getMemberBookings()).length };
});
await check('Create PendingPayment subscription + persisted GET', async () => {
  assert.ok(packageId); const pending = await memberApi.createSubscription(packageId);
  const history = await request(`/api/members/${memberId}/subscriptions`);
  assert.ok(history.some(s => s.subscriptionId === pending.subscriptionId && s.status === 'PendingPayment'));
  return { subscriptionId: pending.subscriptionId, invoiceNumber: pending.invoiceNumber };
});
await check('Member forbidden staff data', async () => { await assert.rejects(request(`/api/centers/${center}/staff`), { status: 403 }); });
await check('Manager login', async () => {
  assert.ok(process.env.SCMS_TEST_MANAGER_LOGIN && process.env.SCMS_TEST_MANAGER_PASSWORD, 'Manager test credentials missing');
  const { user } = await authApi.login(process.env.SCMS_TEST_MANAGER_LOGIN, process.env.SCMS_TEST_MANAGER_PASSWORD);
  assert.equal(user.role, 'MANAGER');
});
await check('Create/update package persisted + center scope', async () => {
  const created = await packageApi.create({ name: `SCMS Integration ${suffix}`, durationDays: 30, price: 10000, allowedSports: 1, features: [] });
  await packageApi.update(created.id, { ...created, description: 'Verified through real adapter' });
  const saved = (await packageApi.getAll()).find(p => p.id === created.id);
  assert.equal(saved.description, 'Verified through real adapter');
  await packageApi.toggleStatus(created.id);
  assert.equal((await packageApi.getAll()).find(p => p.id === created.id).status, 'INACTIVE');
  return { packageId: created.id, finalStatus: 'Inactive' };
});
await check('Manager report/audit/catalog/member search', async () => {
  const overview = await reportApi.getOverview();
  const logs = await systemApi.getAuditLogs();
  const members = await receptionApi.lookupMember(testLogin);
  assert.ok(members.some(m => m.id === memberId));
  return { reportNet: overview.monthlyRevenue, auditCount: logs.length, rooms: (await request(`/api/centers/${center}/rooms`)).length, coaches: (await catalogApi.coaches()).length };
});
await check('Manager cannot edit system permission matrix', async () => { await assert.rejects(request('/api/admin/roles'), { status: 403 }); });
await check('Manager cannot cross center scope', async () => { await assert.rejects(request('/api/centers/999999/rooms'), { status: 403 }); });
await writeFile(new URL('../../LIVE_API_RESULTS.json', import.meta.url), JSON.stringify({ executedAt: new Date().toISOString(), environment: 'LocalDB development; no gateway payment attempted', testSuffix: suffix, results }, null, 2));
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;

