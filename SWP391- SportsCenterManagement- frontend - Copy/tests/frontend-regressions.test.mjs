import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { SUPPORTED_SPORTS } from '../src/services/sportsCatalog.js';
import { SCMS_FACILITIES } from '../src/services/facilityCatalog.js';
import { INITIAL_CLASSES, INITIAL_PACKAGES } from '../src/services/mockData.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../src/services/passwordPolicy.js';
import { toSessionUser } from '../src/services/sessionUser.js';
import { toLocalDateInput } from '../src/services/dateUtils.js';
import { createCsv } from '../src/services/csvExport.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
const { db, DB_KEYS } = await import('../src/services/dbStorage.js');
const { authApi, classApi, coachApi } = await import('../src/services/api.js');
const { canAccessRoute } = await import('../src/services/permissions.js');

beforeEach(() => db.resetAll());

test('9 môn có cơ sở tương ứng và dữ liệu mẫu dùng cùng danh mục', () => {
  assert.equal(SUPPORTED_SPORTS.length, 9);
  assert.equal(SCMS_FACILITIES.length, 9);
  assert.equal(new Set(SUPPORTED_SPORTS.map(sport => sport.id)).size, 9);
  for (const sport of SUPPORTED_SPORTS) assert.ok(SCMS_FACILITIES.some(facility => facility.id === sport.facilityId));
  for (const cls of INITIAL_CLASSES) {
    assert.ok(SUPPORTED_SPORTS.some(sport => sport.id === cls.sportId));
    assert.equal(cls.roomName, SCMS_FACILITIES.find(facility => facility.id === cls.roomId).name);
  }
  assert.ok(INITIAL_PACKAGES.every(pkg => pkg.allowedSports <= SUPPORTED_SPORTS.length));
});

test('thu hồi quyền chặn URL trực tiếp; quyền được cấp thêm vẫn hoạt động', () => {
  assert.equal(canAccessRoute('COACH', ['COACH'], 'take_attendance'), true);
  const permissions = db.get(DB_KEYS.PERMISSIONS);
  permissions.COACH = permissions.COACH.filter(capability => capability !== 'take_attendance');
  db.set(DB_KEYS.PERMISSIONS, permissions);
  assert.equal(canAccessRoute('COACH', ['COACH'], 'take_attendance'), false);
  assert.equal(canAccessRoute('MEMBER', ['MANAGER'], 'manage_packages'), false);
  assert.equal(canAccessRoute('MEMBER', ['MEMBER'], 'view_packages'), true);
  permissions.RECEPTIONIST.push('take_attendance');
  db.set(DB_KEYS.PERMISSIONS, permissions);
  assert.equal(canAccessRoute('RECEPTIONIST', ['COACH'], 'take_attendance'), true);
  assert.equal(canAccessRoute('MANAGER', ['COACH'], 'take_attendance'), true);
  assert.equal(canAccessRoute(null, ['COACH']), false);
});

test('HLV chỉ nhận lớp được giao, kể cả khi trùng tên với HLV khác', async () => {
  const classes = await classApi.getForCoach('usr-coa-01');
  assert.ok(classes.length > 0);
  assert.ok(classes.every(cls => cls.coachId === 'usr-coa-01'));
  assert.deepEqual(await classApi.getForCoach('unassigned-coach'), []);
  const scoped = await coachApi.getCoachClassesAndMembers('unassigned-coach', classes[0].coachName);
  assert.deepEqual(scoped, []);
});

test('bảng rỗng không tự khôi phục lớp và booking mẫu', () => {
  db.set(DB_KEYS.CLASSES, []);
  db.set(DB_KEYS.BOOKINGS, []);
  assert.deepEqual(db.get(DB_KEYS.CLASSES), []);
  assert.deepEqual(db.get(DB_KEYS.BOOKINGS), []);
});

test('nâng version mock giữ dữ liệu đã nhập', () => {
  const classes = [{ id: 'custom-class', name: 'Lớp do người dùng tạo' }];
  const bookings = [{ id: 'custom-booking', classId: 'custom-class' }];
  db.set(DB_KEYS.CLASSES, classes);
  db.set(DB_KEYS.BOOKINGS, bookings);
  localStorage.setItem('SCMS_DB_DATA_VERSION', 'legacy');
  db.initDatabase();
  assert.deepEqual(db.get(DB_KEYS.CLASSES), classes);
  assert.deepEqual(db.get(DB_KEYS.BOOKINGS), bookings);
});

test('quyền xem gói chuyển từ version cũ một lần, không khôi phục quyền đã thu hồi', () => {
  const permissions = db.get(DB_KEYS.PERMISSIONS);
  permissions.MEMBER = permissions.MEMBER.filter(capability => capability !== 'view_packages');
  permissions.COACH = [];
  db.set(DB_KEYS.PERMISSIONS, permissions);
  localStorage.setItem('SCMS_DB_DATA_VERSION', 'v2_clean_tx_classes');
  db.initDatabase();
  assert.ok(db.get(DB_KEYS.PERMISSIONS).MEMBER.includes('view_packages'));
  assert.deepEqual(db.get(DB_KEYS.PERMISSIONS).COACH, []);
  const migrated = db.get(DB_KEYS.PERMISSIONS);
  migrated.MEMBER = migrated.MEMBER.filter(capability => capability !== 'view_packages');
  db.set(DB_KEYS.PERMISSIONS, migrated);
  db.initDatabase();
  assert.equal(db.get(DB_KEYS.PERMISSIONS).MEMBER.includes('view_packages'), false);
});

test('phiên đăng nhập không chứa mật khẩu và bỏ dữ liệu sai định dạng', () => {
  assert.deepEqual(toSessionUser({ id: 'member-1', role: 'MEMBER', password: 'secret', fullName: 'Nguyễn Văn A' }), {
    id: 'member-1', role: 'MEMBER', fullName: 'Nguyễn Văn A'
  });
  assert.equal(toSessionUser({ role: 'MEMBER' }), null);
  assert.equal(toSessionUser(null), null);
});

test('mật khẩu Unicode bị từ chối trước khi thay đổi dữ liệu', async () => {
  const snapshot = JSON.stringify([...storage]);
  for (const password of ['mậtkhẩu', 'a\u0301', '🔒', 'Ａ', 'abc\n', 'abc\t']) {
    assert.equal(isAsciiPassword(password), false);
    for (const operation of [
      () => authApi.login('member@scms.vn', password),
      () => authApi.register({ fullName: 'Test', email: 'test@example.com', phone: '', password }),
      () => authApi.resetPassword('member@scms.vn', '123456', password),
      () => authApi.changePassword('usr-mem-01', 'password123', password)
    ]) {
      await assert.rejects(operation, { message: PASSWORD_CHARACTER_ERROR });
      assert.equal(JSON.stringify([...storage]), snapshot);
    }
  }
  assert.equal(isAsciiPassword(' Pass!#123 '), true);
});

test('ngày mặc định dùng lịch địa phương, không phụ thuộc UTC', () => {
  assert.equal(toLocalDateInput(new Date(2026, 0, 2, 0, 5)), '2026-01-02');
});

test('CSV giữ Unicode, escape dấu ngoặc kép và chặn công thức từ chuỗi đầu vào', () => {
  const csv = createCsv([['Tên', 'Ghi chú'], ['Nguyễn Văn A', 'Có "dấu", phẩy'], ['=1+1', 42]]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Nguyễn Văn A'));
  assert.ok(csv.includes('"Có ""dấu"", phẩy"'));
  assert.ok(csv.includes('"\'=1+1","42"'));
});
