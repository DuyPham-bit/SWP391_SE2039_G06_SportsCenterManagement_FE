import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toSessionUser } from '../src/services/sessionUser.js';
import { toLocalDateInput } from '../src/services/dateUtils.js';
import { createCsv } from '../src/services/csvExport.js';

test('phiên đăng nhập không chứa mật khẩu và bỏ dữ liệu sai định dạng', () => {
  assert.deepEqual(toSessionUser({ id: 'member-1', role: 'MEMBER', password: 'secret', fullName: 'Nguyễn Văn A' }), {
    id: 'member-1', role: 'MEMBER', fullName: 'Nguyễn Văn A'
  });
  assert.equal(toSessionUser({ role: 'MEMBER' }), null);
  assert.equal(toSessionUser(null), null);
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
