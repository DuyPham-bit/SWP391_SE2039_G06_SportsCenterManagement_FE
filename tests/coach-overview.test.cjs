const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const overview = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('src/features/coach/coachOverview.js', 'utf8')).toString('base64'));

test('coach dates use Vietnam midnight and offset ranges', async () => {
  const { coachDate } = await overview;
  const now = new Date('2026-10-11T17:00:00Z');
  assert.equal(coachDate(0, now), '2026-10-12');
  assert.equal(coachDate(-30, now), '2026-09-12');
});

test('attendance opens at start, progress opens at end, cancelled and invalid sessions stay closed', async () => {
  const { canAttendSession, canRecordSession } = await overview;
  const session = { sessionDate: '2026-10-11', startTime: '10:00:00', endTime: '11:00:00', status: 'SCHEDULED' };
  const during = new Date('2026-10-11T03:30:00Z');
  assert.equal(canAttendSession(session, during), true);
  assert.equal(canRecordSession(session, during), false);
  assert.equal(canRecordSession(session, new Date('2026-10-11T04:00:00Z')), true);
  assert.equal(canAttendSession(session, new Date('2026-10-11T02:59:59Z')), false);
  assert.equal(canRecordSession({ ...session, status: 'CANCELLED' }, new Date('2026-10-12')), false);
  assert.equal(canAttendSession({ ...session, sessionDate: '' }, during), false);
  assert.equal(canRecordSession(null, during), false);
});

test('metric comparison skips missing measurements, preserves zero fat and resolves same-day order by ID', async () => {
  const { metricChanges } = await overview;
  const records = [{ id: 2, date: '2026-10-11', weight: null, bodyFat: 0, muscleMass: '' },
    { id: 1, date: '2026-10-10', weight: 70, bodyFat: 10, muscleMass: 30 },
    { id: 3, date: '2026-10-11', weight: 69.5, bodyFat: null, muscleMass: null }];
  const changes = metricChanges(records);
  assert.deepEqual(changes[0], { key: 'weight', current: 69.5, previousDate: '2026-10-10', change: -0.5 });
  assert.equal(changes[1].current, 0); assert.equal(changes[1].change, -10);
  assert.equal(changes[2].change, null);
  assert.equal(records[0].id, 2);
  assert.equal(metricChanges([])[0].current, null);
});
