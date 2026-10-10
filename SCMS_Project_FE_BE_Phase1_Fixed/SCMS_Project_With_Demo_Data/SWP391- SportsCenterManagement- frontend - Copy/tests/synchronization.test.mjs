import assert from 'node:assert/strict';
import { test, beforeEach, after } from 'node:test';
import { getDynamicNavItems, setAccess, canAccessRoute } from '../src/services/permissions.js';
import { authApi, receptionApi } from '../src/services/api.js';
import { setSession } from '../src/services/httpClient.js';

const oldFetch = globalThis.fetch;
let calls;
let reply;
beforeEach(() => {
  calls = [];
  setSession({ token: 'api-test-token', expiresAt: '2099-01-01', user: { id: 42, centerId: 7, role: 'RECEPTIONIST' } });
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return reply(url, options); };
});
after(() => { globalThis.fetch = oldFetch; setSession(null); });
const json = data => new Response(JSON.stringify(data), { status: 200 });

test('role guard rejects a role mismatch even when its permission exists', () => {
  setAccess('MANAGER', ['members.center.read', 'staff.center.read']);
  assert.equal(canAccessRoute('MANAGER', ['RECEPTIONIST'], 'lookup_member'), false);
  assert.equal(canAccessRoute('MANAGER', ['COACH'], 'manage_staff'), false);
  assert.equal(canAccessRoute('MANAGER', ['MANAGER'], 'manage_staff'), true);
});

test('navigation shows check-in once server endpoint is implemented; incomplete modules remain hidden', () => {
  setAccess('RECEPTIONIST', ['members.center.read', 'payments.center.cash']);
  const receptionPaths = getDynamicNavItems('RECEPTIONIST').map(item => item.path);
  assert.ok(receptionPaths.includes('#/receptionist/dashboard'));
  assert.ok(receptionPaths.includes('#/receptionist/lookup'));
  assert.ok(receptionPaths.includes('#/receptionist/check-in'));
  setAccess('MEMBER', []);
  const memberPaths = getDynamicNavItems('MEMBER').map(item => item.path);
  assert.ok(!memberPaths.includes('#/member/progress'));
  assert.ok(!memberPaths.includes('#/member/ai-assistant'));
  setAccess('MANAGER', ['roles.permissions.manage']);
  assert.ok(!getDynamicNavItems('MANAGER').some(item => item.path === '#/manager/roles-permissions'));
});

test('member profile uses backend account code and normalizes active subscription', async () => {
  reply = url => {
    if (url.endsWith('/profile/me')) return json({ userId: 42, centerId: 7, role: 'Member', fullName: 'Lan' });
    if (url.endsWith('/members/me')) return json({ memberId: 56, memberCode: 'MB-0042', accountStatus: 'Active' });
    return json([{ subscriptionId: 8, packageId: 9, packageName: 'VIP', status: 'ACTIVE', endDate: '2099-12-31' }]);
  };
  const profile = await authApi.getProfile();
  assert.equal(profile.memberCode, 'MB-0042');
  assert.equal(profile.packageId, 9);
  assert.equal(profile.packageStatus, 'ACTIVE');
});

test('counter checkout never sends invalid amount or missing POS approval code', async () => {
  reply = () => json({ success: true, invoiceStatus: 'Paid' });
  await assert.rejects(receptionApi.registerCounterPackage({ memberId: 1, packageId: 2, paymentMethod: 'CASH', amountReceived: 'abc' }));
  await assert.rejects(receptionApi.registerCounterPackage({ memberId: 1, packageId: 2, paymentMethod: 'POS', amountReceived: '100000', posApprovalCode: '' }));
  assert.equal(calls.length, 0);
});
