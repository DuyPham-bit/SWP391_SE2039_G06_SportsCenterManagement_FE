const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const load = file => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(file, 'utf8')).toString('base64'));
const overview = load('src/features/member/memberOverview.js');
const now = new Date('2026-10-11T03:00:00Z'); // 10:00 Vietnam.
const booking = (id, date, time, extra = {}) => ({ id, className: 'Yoga', bookingDate: date, startTime: time, timeSlot: `${time} - 12:00`, status: 'CONFIRMED', sessionStatus: 'SCHEDULED', roomName: 'Studio', ...extra });

test('upcoming classes exclude past, started, cancelled and completed sessions, sorted nearest first', async () => {
  const { getUpcomingBookings } = await overview;
  const source = [booking(1, '2026-10-12', '11:00'), booking(2, '2026-10-11', '11:00'),
    booking(3, '2026-10-10', '11:00'), booking(4, '2026-10-11', '10:00'),
    booking(5, '2026-10-12', '09:00', { status: 'CANCELLED' }),
    booking(6, '2026-10-12', '09:00', { sessionStatus: 'CANCELLED' }),
    booking(7, '2026-10-12', '09:00', { sessionStatus: 'COMPLETED' }),
    booking(8, '', '')];
  assert.deepEqual(getUpcomingBookings(source, now).map(item => item.id), [2, 1]);
  assert.equal(source[0].id, 1);
});

test('membership remains active through the last Vietnam date and expires at local midnight', async () => {
  const { getMembershipSummary, vietnamDate } = await overview;
  const user = { packageStatus: 'ACTIVE', packageExpiry: '2026-10-11' };
  assert.equal(getMembershipSummary(user, new Date('2026-10-11T16:59:59Z')).active, true);
  assert.equal(getMembershipSummary(user, new Date('2026-10-11T17:00:00Z')).active, false);
  assert.equal(vietnamDate(new Date('2026-10-11T17:00:00Z')), '2026-10-12');
  assert.equal(getMembershipSummary({ ...user, packageExpiry: null }, now).active, false);
});

test('reminders cover only classes within 24 hours and memberships within 7 days', async () => {
  const { getMemberReminders } = await overview;
  const user = { packageStatus: 'ACTIVE', packageExpiry: '2026-10-18' };
  const reminders = getMemberReminders(user, [booking(1, '2026-10-12', '10:00'), booking(2, '2026-10-12', '10:01'), booking(3, '2026-10-11', '09:00')], now);
  assert.deepEqual(reminders.map(item => item.id), ['membership', 'session-1']);
  assert.equal(getMemberReminders({ ...user, packageExpiry: '2026-10-19' }, [], now).length, 0);
});

test('cancelled sessions have a separate alert and never an upcoming-class reminder', async () => {
  const { getMemberReminders } = await overview;
  const user = { packageStatus: 'ACTIVE', packageExpiry: '2026-11-01' };
  const reminders = getMemberReminders(user, [booking(4, '2026-10-11', '11:00', { sessionStatus: 'CANCELLED', status: 'CANCELLED' })], now);
  assert.deepEqual(reminders.map(item => item.id), ['cancelled-4']);
  assert.equal(reminders[0].href, '#/member/schedule');
});

test('latest progress is selected by recorded date and missing measurements are not fabricated', async () => {
  const { getLatestProgress, formatMeasurement } = await overview;
  assert.equal(getLatestProgress([{ id: 2, date: '2026-10-01' }, { id: 1, date: '2026-10-11' }]).id, 1);
  assert.equal(getLatestProgress([]), null);
  assert.equal(formatMeasurement(null, 'kg'), 'Chưa đo');
  assert.equal(formatMeasurement(0, '%'), '0 %');
});

test('SQL timestamps with or without UTC offset display the same Vietnam time', async () => {
  const { formatMemberDateTime } = await overview;
  assert.equal(formatMemberDateTime('2026-10-11T02:05:00'), formatMemberDateTime('2026-10-11T02:05:00Z'));
  assert.equal(formatMemberDateTime('2026-10-11T02:05:00Z'), formatMemberDateTime('2026-10-11T09:05:00+07:00'));
  assert.equal(formatMemberDateTime(null), 'Chưa có thông tin');
});

test('member navigation exposes attendance and notifications and respects revoked progress access', async () => {
  const source = fs.readFileSync('src/services/permissions.js', 'utf8')
    .replace(/^import .*?from '\.\/authState.js';/m, 'const getAuthUser = () => ({ role: "MEMBER", capabilities: ["book_class", "ask_ai_assistant"] });');
  const { getDynamicNavItems } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const paths = getDynamicNavItems('MEMBER').map(item => item.path);
  assert.ok(paths.includes('#/member/attendance'));
  assert.ok(paths.includes('#/member/notifications'));
  assert.ok(!paths.includes('#/member/progress'));
});
