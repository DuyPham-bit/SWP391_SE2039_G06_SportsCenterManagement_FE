const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function storage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) };
}

const tokenKey = 'SCMS_API_ACCESS_TOKEN';
const userKey = 'SCMS_AUTH_SESSION';
const httpSource = fs.readFileSync('src/services/http.js', 'utf8')
  .replace(/^import (.*?) from '\.\/authState.js';/m, 'const $1 = authState;')
  .replace('import.meta.env.VITE_API_BASE_URL', "'/api'").replace(/^export /gm, '');
const authStateSource = fs.readFileSync('src/services/authState.js', 'utf8').replace(/^export /gm, '');
const permissionsSource = fs.readFileSync('src/services/permissions.js', 'utf8')
  .replace(/^import .*?from '\.\/authState.js';/m, 'const { getAuthUser } = authState;').replace(/^export /gm, '');
const backendSource = fs.readFileSync('src/services/backendApi.js', 'utf8')
  .replace(/^import (.*?) from '\.\/http.js';/m, 'const $1 = http;')
  .replace(/^import (.*?) from '\.\/authState.js';/m, 'const $1 = authState;')
  .replaceAll('import.meta.env.VITE_SPORTS_CENTER_ID', 'configuredCenter').replace(/^export /gm, '');

function tab(shared, session = storage(), configuredCenter) {
  const requests = [];
  const window = new EventTarget();
  let status = 200;
  let reply = () => [];
  const fetch = async (url, options) => {
    requests.push({ url, token: options.headers.get('Authorization') });
    const payload = await reply(url, options);
    if (payload instanceof Response) return payload;
    return new Response(status === 200 ? JSON.stringify(payload) : '{"message":"Invalid"}', { status, headers: { 'content-type': 'application/json' } });
  };
  const authState = new Function(authStateSource + '\nreturn { assertAuthVersion, assertAuthUser, beginAuthOperation, getAuthVersion, getAuthUser, setAuthUser };')();
  const http = new Function('localStorage', 'sessionStorage', 'window', 'fetch', 'authState', httpSource +
    '\nreturn { getApiToken, setApiToken, clearApiToken, apiRequest, createIdempotencyKey };')(shared, session, window, fetch, authState);
  const permissions = new Function('localStorage', 'sessionStorage', 'authState', permissionsSource +
    '\nreturn { getPermissionsForRole };')(shared, session, authState);
  const backend = new Function('localStorage', 'sessionStorage', 'http', 'authState', 'configuredCenter', backendSource +
    '\nreturn { packageApi, authApi };')(shared, session, http, authState, configuredCenter);
  return { http, permissions, backend, authState, session, requests, window, respond: fn => { reply = fn; }, failAuthentication: () => { status = 401; } };
}

test('verified JWT profile determines center and permissions despite obsolete stored authentication', async () => {
  const current = tab(storage());
  current.session.setItem(userKey, JSON.stringify({ role: 'MEMBER', centerId: 77, capabilities: ['book_class'] }));
  current.respond(url => url.endsWith('/auth/login') ? { accessToken: 'verified-jwt' }
    : url.endsWith('/profile/me') ? { userId: 1, role: 'MANAGER', centerId: 42 }
      : url.endsWith('/access/me/capabilities') ? ['manage_classes'] : []);
  await current.backend.authApi.login('manager@example.invalid', 'test');
  await current.backend.packageApi.getAll();
  assert.deepEqual(current.requests.at(-1), { url: '/api/centers/42/membership-packages/all', token: 'Bearer verified-jwt' });
  assert.deepEqual(current.permissions.getPermissionsForRole('MANAGER'), ['manage_classes']);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('a completed profile cannot be applied after a newer authentication operation starts', async () => {
  const current = tab(storage());
  current.http.setApiToken('current-jwt');
  current.respond(url => url.endsWith('/profile/me') ? { userId: 1, role: 'MANAGER', centerId: 42 } : []);
  const user = await current.backend.authApi.getCurrentUser();
  assert.doesNotThrow(() => current.authState.assertAuthUser(user));
  current.authState.beginAuthOperation();
  assert.throws(() => current.authState.assertAuthUser(user), { code: 'AUTH_SUPERSEDED' });
});

test('an old protected 401 cannot cancel a newer pending login using the same current token', async () => {
  const current = tab(storage()); const oldResponse = deferred(); const loginResponse = deferred();
  let expiredEvents = 0;
  current.window.addEventListener('scms:auth-expired', () => { expiredEvents++; });
  current.http.setApiToken('old-jwt');
  current.respond(url => url.endsWith('/notifications/me') ? oldResponse.promise
    : url.endsWith('/auth/login') ? loginResponse.promise
      : url.endsWith('/profile/me') ? { userId: 2, role: 'MANAGER', centerId: 42 } : []);
  const notification = assert.rejects(current.http.apiRequest('notifications/me'), { status: 401 });
  const login = current.backend.authApi.login('new@example.invalid', 'test');
  oldResponse.resolve(new Response('{"message":"Invalid"}', { status: 401, headers: { 'content-type': 'application/json' } }));
  await notification;
  assert.equal(current.http.getApiToken(), 'old-jwt');
  assert.equal(expiredEvents, 0);
  loginResponse.resolve({ accessToken: 'new-jwt' });
  const signedIn = await login;
  assert.equal(current.http.getApiToken(), 'new-jwt');
  assert.equal(current.authState.getAuthUser(), signedIn.user);
});

test('password change installs the replacement JWT and reloads the authenticated profile', async () => {
  const current = tab(storage());
  current.http.setApiToken('old-jwt');
  current.respond(url => url.endsWith('/auth/change-password') ? { accessToken: 'replacement-jwt' }
    : url.endsWith('/profile/me') ? { userId: 1, role: 'MANAGER', centerId: 42 } : []);
  const user = await current.backend.authApi.changePassword(1, 'old', 'new');
  assert.equal(current.http.getApiToken(), 'replacement-jwt');
  assert.deepEqual(current.requests.map(request => request.token), ['Bearer old-jwt', 'Bearer replacement-jwt', 'Bearer replacement-jwt']);
  assert.doesNotThrow(() => current.authState.assertAuthUser(user));
});

test('a profile response after logout cannot return a user or restore authentication', async () => {
  const current = tab(storage());
  current.http.setApiToken('old-jwt');
  const profile = deferred();
  current.respond(url => url.endsWith('/profile/me') ? profile.promise : []);
  const pending = current.backend.authApi.getCurrentUser();
  current.backend.authApi.logout();
  profile.resolve({ userId: 1, role: 'MANAGER', centerId: 42 });
  await assert.rejects(pending, { code: 'AUTH_SUPERSEDED' });
  assert.equal(current.http.getApiToken(), null);
  assert.equal(current.authState.getAuthUser(), null);
});

for (const provider of ['password', 'google']) {
  test(`failed old ${provider} login cannot clear a newer login`, async () => {
    const current = tab(storage());
    const oldProfile = deferred(); const started = deferred();
    let logins = 0, profiles = 0;
    current.respond(url => {
      if (url.endsWith('/auth/login') || url.endsWith('/auth/google')) return { accessToken: ++logins === 1 ? 'old-jwt' : 'new-jwt' };
      if (url.endsWith('/profile/me')) {
        if (++profiles === 1) { started.resolve(); return oldProfile.promise; }
        return { userId: 2, role: 'MANAGER', centerId: 42 };
      }
      return [];
    });
    const first = provider === 'password' ? current.backend.authApi.login('old@example.invalid', 'test')
      : current.backend.authApi.loginWithGoogle({ credential: 'test-credential' });
    const failedFirst = assert.rejects(first);
    await started.promise;
    const newer = await current.backend.authApi.login('new@example.invalid', 'test');
    oldProfile.reject(new Error('Delayed network failure'));
    await failedFirst;
    assert.equal(current.http.getApiToken(), 'new-jwt');
    assert.equal(current.authState.getAuthUser(), newer.user);
  });
}

test('a login token arriving after logout cannot sign the tab back in', async () => {
  const current = tab(storage()); const login = deferred();
  current.respond(url => url.endsWith('/auth/login') ? login.promise : { userId: 1, role: 'MANAGER', centerId: 42 });
  const pending = current.backend.authApi.login('old@example.invalid', 'test');
  current.backend.authApi.logout();
  login.resolve({ accessToken: 'obsolete-jwt' });
  await assert.rejects(pending, { code: 'AUTH_SUPERSEDED' });
  assert.equal(current.http.getApiToken(), null);
  assert.equal(current.requests.length, 1);
});

test('out-of-order login responses preserve the most recently started login', async () => {
  const current = tab(storage()); const older = deferred(); let logins = 0;
  current.respond(url => url.endsWith('/auth/login') ? (++logins === 1 ? older.promise : { accessToken: 'new-jwt' })
    : url.endsWith('/profile/me') ? { userId: 2, role: 'MANAGER', centerId: 42 } : []);
  const first = current.backend.authApi.login('old@example.invalid', 'test');
  const rejectedFirst = assert.rejects(first, { code: 'AUTH_SUPERSEDED' });
  const newer = await current.backend.authApi.login('new@example.invalid', 'test');
  older.resolve({ accessToken: 'old-jwt' });
  await rejectedFirst;
  assert.equal(current.http.getApiToken(), 'new-jwt');
  assert.equal(current.authState.getAuthUser(), newer.user);
});

test('delayed password change cannot replace JWT after logout', async () => {
  const current = tab(storage()); const password = deferred();
  current.http.setApiToken('old-jwt');
  current.respond(url => url.endsWith('/auth/change-password') ? password.promise : { userId: 1, role: 'MANAGER', centerId: 42 });
  const pending = current.backend.authApi.changePassword(1, 'old', 'new');
  current.backend.authApi.logout();
  password.resolve({ accessToken: 'replacement-jwt' });
  await assert.rejects(pending, { code: 'AUTH_SUPERSEDED' });
  assert.equal(current.http.getApiToken(), null);
});

test('delayed profile update cannot reload or overwrite another logged in account', async () => {
  const current = tab(storage()); const update = deferred();
  current.http.setApiToken('old-jwt');
  current.respond((url, options) => options.method === 'PATCH' ? update.promise : []);
  const pending = current.backend.authApi.updateProfile(1, { fullName: 'Old account' });
  current.backend.authApi.logout();
  current.http.setApiToken('new-jwt');
  const newer = { id: 2, role: 'MANAGER', centerId: 42 };
  current.authState.setAuthUser(newer);
  update.resolve({});
  await assert.rejects(pending, { code: 'AUTH_SUPERSEDED' });
  assert.equal(current.requests.length, 1);
  assert.equal(current.http.getApiToken(), 'new-jwt');
  assert.equal(current.authState.getAuthUser(), newer);
});

test('registration completed after logout does not automatically log in', async () => {
  const current = tab(storage(), storage(), 42); const registration = deferred();
  current.respond(url => url.endsWith('/auth/register') ? registration.promise : []);
  const pending = current.backend.authApi.register({ fullName: 'New account', email: 'new@example.invalid', password: 'test' });
  current.backend.authApi.logout();
  registration.resolve({});
  await assert.rejects(pending, { code: 'AUTH_SUPERSEDED' });
  assert.equal(current.http.getApiToken(), null);
  assert.equal(current.requests.length, 1);
});

test('new tabs ignore legacy authentication stored in shared localStorage', () => {
  const shared = storage(); shared.setItem(tokenKey, 'legacy-shared-token');
  assert.equal(tab(shared).http.getApiToken(), null);
});

test('different tabs send their own JWT, center and role despite another login', async () => {
  const shared = storage();
  const manager = tab(shared); const member = tab(shared);
  manager.http.setApiToken('manager-jwt'); member.http.setApiToken('member-jwt');
  manager.authState.setAuthUser({ role: 'MANAGER', centerId: 42, capabilities: ['manage_classes'] });
  member.authState.setAuthUser({ role: 'MEMBER', centerId: 77, capabilities: ['book_class'] });
  await manager.backend.packageApi.getAll(); await member.backend.packageApi.getAll();
  assert.deepEqual(manager.requests, [{ url: '/api/centers/42/membership-packages/all', token: 'Bearer manager-jwt' }]);
  assert.deepEqual(member.requests, [{ url: '/api/centers/77/membership-packages', token: 'Bearer member-jwt' }]);
  assert.deepEqual(manager.permissions.getPermissionsForRole('MANAGER'), ['manage_classes']);
  assert.deepEqual(member.permissions.getPermissionsForRole('MEMBER'), ['book_class']);
  assert.deepEqual(member.permissions.getPermissionsForRole('MANAGER'), []);
  assert.equal(shared.getItem(tokenKey), null);
  assert.equal(shared.getItem(userKey), null);
});

test('logout and expired JWT only affect their own tab', async () => {
  const shared = storage(); const manager = tab(shared); const member = tab(shared);
  manager.http.setApiToken('manager-jwt'); member.http.setApiToken('member-jwt');
  manager.backend.authApi.logout();
  assert.equal(manager.http.getApiToken(), null);
  assert.equal(member.http.getApiToken(), 'member-jwt');
  manager.http.setApiToken('new-manager-jwt');
  let managerEvents = 0; let memberEvents = 0;
  manager.window.addEventListener('scms:auth-expired', () => { managerEvents++; });
  member.window.addEventListener('scms:auth-expired', () => { memberEvents++; });
  member.failAuthentication();
  await assert.rejects(member.http.apiRequest('profile/me'), /Phiên đăng nhập/);
  assert.equal(member.http.getApiToken(), null);
  assert.equal(manager.http.getApiToken(), 'new-manager-jwt');
  assert.equal(managerEvents, 0); assert.equal(memberEvents, 1);
});

test('refresh and duplicated storage start signed out because JWT stays in document memory', () => {
  const shared = storage(); const current = tab(shared);
  current.http.setApiToken('current-jwt');
  current.session.setItem(tokenKey, 'obsolete-storage-token');
  current.session.setItem(userKey, JSON.stringify({ role: 'MANAGER', centerId: 42 }));
  assert.equal(tab(shared, current.session).http.getApiToken(), null);
  assert.equal(tab(shared).http.getApiToken(), null);
  assert.equal(current.http.getApiToken(), 'current-jwt');
});

test('JWT authentication and permissions work without accessing browser storage', async () => {
  const unavailableStorage = new Proxy({}, { get() { throw new Error('Browser storage must not be used'); } });
  const current = tab(unavailableStorage, unavailableStorage);
  current.respond(url => url.endsWith('/auth/login') ? { accessToken: 'verified-jwt' }
    : url.endsWith('/profile/me') ? { userId: 1, role: 'MANAGER', centerId: 42 }
      : url.endsWith('/access/me/capabilities') ? ['manage_classes'] : []);
  await current.backend.authApi.login('manager@example.invalid', 'test');
  await current.backend.packageApi.getAll();
  assert.deepEqual(current.permissions.getPermissionsForRole('MANAGER'), ['manage_classes']);
  current.backend.authApi.logout();
  assert.equal(current.http.getApiToken(), null);
  assert.equal(current.authState.getAuthUser(), null);
  assert.deepEqual(current.permissions.getPermissionsForRole('MANAGER'), []);
});
