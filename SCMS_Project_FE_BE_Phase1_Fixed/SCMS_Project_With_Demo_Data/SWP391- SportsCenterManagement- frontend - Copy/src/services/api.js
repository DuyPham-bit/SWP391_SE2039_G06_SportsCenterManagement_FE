import { request, allPages, centerId, getSession, setSession, unavailable } from './httpClient.js';
import { assertAsciiPassword } from './passwordPolicy.js';
import { toLocalDateInput } from './dateUtils.js';

const upper = value => (value || '').toUpperCase();
const userView = p => ({ ...p, id: p.userId, role: upper(p.role), status: upper(p.status) });
const memberView = p => ({ ...p, id: p.memberId, status: upper(p.accountStatus) });
const packageView = p => ({ ...p, status: upper(p.status), features: p.features || [] });
const staffView = p => ({ ...p, id: p.userId, role: upper(p.roleName), status: upper(p.status), specialty: p.specialization });
const bookingView = b => ({ ...b, date: b.sessionDate, bookingDate: b.sessionDate, createdAt: b.bookedAt, timeSlot: `${b.startTime.slice(0, 5)} - ${b.endTime.slice(0, 5)}`, status: upper(b.status) === 'BOOKED' ? 'CONFIRMED' : upper(b.status) });
const weekDay = isoDate => {
  const [year, month, day] = String(isoDate || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const dayNumber = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayNumber === 0 ? 'Chủ Nhật' : `Thứ ${dayNumber + 1}`;
};
export const sessionView = s => ({ ...s, id: s.sessionId, name: s.className, date: s.sessionDate, dayOfWeek: weekDay(s.sessionDate), timeSlot: `${s.startTime.slice(0, 5)} - ${s.endTime.slice(0, 5)}`, enrolledCount: s.bookedCount, status: upper(s.classStatus), roomName: s.roomId ? `Phòng #${s.roomId}` : 'Chưa có phòng' });

async function acceptAuth(result) {
  setSession({ token: result.accessToken, expiresAt: result.expiresAt, user: null });
  try {
    const user = await authApi.getProfile();
    setSession({ token: result.accessToken, expiresAt: result.expiresAt, user });
    return { token: result.accessToken, user };
  } catch (error) { setSession(null); throw error; }
}
export const authApi = {
  async login(email, password) {
    assertAsciiPassword(password);
    return acceptAuth(await request('/api/auth/login', { method: 'POST', body: { email: email.trim(), password }, auth: false }));
  },
  async register(data) {
    assertAsciiPassword(data.password);
    // The existing registration form has no username field; email is a valid unique username.
    return request('/api/auth/register', { method: 'POST', auth: false, body: { ...data, username: data.username || data.email.trim(), phone: data.phone || null, dateOfBirth: data.dateOfBirth || null, centerId: centerId() } });
  },
  async getProfile() {
    const profile = userView(await request('/api/profile/me'));
    if (profile.role === 'MEMBER') {
      const member = await request('/api/members/me');
      const subscriptions = await request(`/api/members/${member.memberId}/subscriptions`);
      const active = subscriptions
        .filter(s => upper(s.status) === 'ACTIVE')
        .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))[0];
      return { ...profile, memberId: member.memberId, memberCode: member.memberCode,
        packageId: active?.packageId ?? null, packageName: active?.packageName ?? 'Chưa có gói đang hoạt động',
        packageExpiry: active?.endDate ?? null, packageStatus: active ? 'ACTIVE' : 'INACTIVE' };
    }
    return profile;
  },
  async updateProfile(_id, data) {
    await request('/api/profile/me', { method: 'PATCH', body: { fullName: data.fullName, phone: data.phone || null } });
    return authApi.getProfile();
  },
  async changePassword(_id, currentPassword, newPassword) {
    assertAsciiPassword(currentPassword); assertAsciiPassword(newPassword);
    return acceptAuth(await request('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }));
  },
  requestPasswordReset: email => request('/api/auth/request-password-reset', { method: 'POST', auth: false, body: { email: email.trim() } }),
  async resetPassword(email, otp, newPassword) {
    assertAsciiPassword(newPassword);
    return request('/api/auth/reset-password', { method: 'POST', auth: false, body: { email: email.trim(), otp, newPassword } });
  },
  async loginWithGoogle() { return unavailable('Đăng nhập Google'); }
};
export const catalogApi = {
  centers: () => request('/api/catalog/centers', { auth: false }),
  sports: () => request('/api/catalog/sports', { auth: false }),
  coaches: () => request(`/api/centers/${centerId()}/coaches`),
  permissions: () => request('/api/access/me')
};
export const packageApi = {
  async getAll() {
    const admin = ['MANAGER', 'ADMIN'].includes(getSession()?.user?.role);
    return (await request(`/api/centers/${centerId()}/membership-packages${admin ? '/all' : ''}`)).map(packageView);
  },
  async create(data) { return packageView(await request(`/api/centers/${centerId()}/membership-packages`, { method: 'POST', body: packageBody(data) })); },
  async update(id, data) { return packageView(await request(`/api/centers/${centerId()}/membership-packages/${id}`, { method: 'PUT', body: packageBody(data) })); },
  async toggleStatus(id) {
    const target = (await packageApi.getAll()).find(p => p.id === id);
    if (!target) throw new Error('Không tìm thấy gói tập.');
    return request(`/api/centers/${centerId()}/membership-packages/${id}/status`, { method: 'PATCH', body: { status: target.status === 'ACTIVE' ? 'Inactive' : 'Active' } });
  }
};
function packageBody(p) { return { name: p.name, description: p.description || null, durationDays: Number(p.durationDays), price: Number(p.price), maxClasses: p.maxClasses ? Number(p.maxClasses) : null, accessType: p.accessType || null, allowedSports: Number(p.allowedSports || 1), badge: p.badge || null, features: p.features || [] }; }
export const staffApi = {
  async getAll() { return (await request(`/api/centers/${centerId()}/staff`)).map(staffView); },
  async getAvailableMembers(query = '') { return query.trim().length < 2 ? [] : receptionApi.lookupMember(query); },
  previewRoleId() { return 'Máy chủ cấp ID'; },
  async create(data) {
    if (data.memberId || data.selectedAccountId) return unavailable('Bổ nhiệm hội viên thành nhân viên');
    return staffView(await request(`/api/centers/${centerId()}/staff`, { method: 'POST', body: { username: data.username || data.email, email: data.email, password: data.password, fullName: data.fullName, roleName: { COACH: 'Coach', RECEPTIONIST: 'Receptionist', MANAGER: 'Manager' }[data.role], phone: data.phone || null, hireDate: data.hireDate || null, specialization: data.specialty || null, certification: data.certification || null, experienceYears: data.experienceYears || null, bio: data.bio || null } }));
  },
  async update(id, data) {
    const current = (await staffApi.getAll()).find(s => s.id === id);
    if (!current) throw new Error('Không tìm thấy nhân viên.');
    return staffView(await request(`/api/centers/${centerId()}/staff/${id}`, { method: 'PATCH', body: { fullName: data.fullName ?? current.fullName, email: data.email ?? current.email, phone: data.phone ?? current.phone, status: (data.status || current.status) === 'ACTIVE' ? 'Active' : 'Disabled', hireDate: current.hireDate, specialization: data.specialty ?? current.specialization, certification: data.certification ?? current.certification, experienceYears: current.experienceYears, bio: current.bio } }));
  },
  async toggleStatus(id) {
    const target = (await staffApi.getAll()).find(s => s.id === id);
    if (!target) throw new Error('Không tìm thấy nhân viên.');
    return staffApi.update(id, { status: target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
  }
};
export const classApi = {
  async getAll() {
    const manager = ['MANAGER', 'ADMIN'].includes(getSession()?.user?.role);
    const [rows, sports, rooms] = await Promise.all([
      request(`/api/centers/${centerId()}/classes${manager ? '/all' : ''}`), catalogApi.sports(), manager ? roomApi.getAll() : []
    ]);
    return Promise.all(rows.map(async c => {
      const [coaches, schedules] = manager
        ? await Promise.all([request(`/api/classes/${c.id}/coaches`), request(`/api/classes/${c.id}/schedules`)])
        : [[], []];
      const coach = coaches.find(p => p.isPrimary);
      const dayLabels = [...new Set(schedules.map(row => row.dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${row.dayOfWeek + 1}`))];
      const timeSlots = [...new Set(schedules.map(row => `${String(row.startTime).slice(0, 5)} - ${String(row.endTime).slice(0, 5)}`))];
      return {
        ...c, sportName: sports.find(s => s.id === c.sportId)?.name || '',
        roomName: rooms.find(r => r.id === c.roomId)?.name || '',
        coachId: coach?.coachId, coachName: coach?.coachName,
        status: upper(c.status || 'Published'),
        dayOfWeek: dayLabels.join(', ') || 'Chưa có lịch',
        timeSlot: timeSlots.join('; ') || 'Chưa có lịch',
        // Class enrollment count is NOT exposed by the current manager classes API.
        // Session bookedCount is a different metric and must not be substituted.
        enrolledCount: null
      };
    }));
  },
  async getSessions() { return (await allPages('/api/class-sessions', 50)).map(sessionView); },
  async getForCoach(_id, { isManager = false } = {}) {
    return isManager ? classApi.getSessions() : (await request('/api/coaches/me/teaching-schedule')).map(sessionView);
  },
  create: data => request('/api/classes', { method: 'POST', body: classBody(data, true) }),
  update: (id, data) => request(`/api/classes/${id}`, { method: 'PUT', body: classBody(data) }),
  publish: id => request(`/api/classes/${id}/publish`, { method: 'POST' }),
  cancel: id => request(`/api/classes/${id}`, { method: 'DELETE' }),
  schedules: id => request(`/api/classes/${id}/schedules`),
  createSchedule: (id, data) => request(`/api/classes/${id}/schedules`, { method: 'POST', body: data }),
  assignCoach: (id, coachId) => request(`/api/classes/${id}/coaches`, { method: 'POST', body: { coachId, isPrimary: true } })
};
function classBody(p, create = false) {
  if (!p.sportId || !p.durationMinutes) throw new Error('Cần chọn môn thể thao và thời lượng thật của lớp.');
  return { ...(create ? { centerId: centerId() } : {}), sportId: Number(p.sportId), roomId: p.roomId ? Number(p.roomId) : null, name: p.name, description: p.description || null, level: p.level || null, capacity: Number(p.capacity), durationMinutes: Number(p.durationMinutes), allowWaitlist: p.allowWaitlist ?? true };
}
export const roomApi = {
  getAll: () => request(`/api/centers/${centerId()}/rooms`),
  async create() { return unavailable('Tạo phòng/sân'); },
  async update() { return unavailable('Cập nhật phòng/sân'); }
};
export const bookingApi = {
  async getMemberBookings() { return (await request('/api/members/me/session-bookings')).map(bookingView); },
  bookClass: (_memberId, sessionId) => request(`/api/class-sessions/${sessionId}/bookings`, { method: 'POST' }),
  cancelBooking: id => request(`/api/session-bookings/${id}`, { method: 'DELETE' })
};
// Keys live in memory for the same logical request and survive a network-error retry.
const paymentKeys = new Map();
async function paymentRequest(path, body) {
  const fingerprint = `${getSession()?.user?.id}:${path}:${JSON.stringify(body)}`;
  if (!paymentKeys.has(fingerprint)) paymentKeys.set(fingerprint, crypto.randomUUID());
  const result = await request(path, { method: 'POST', body, headers: { 'Idempotency-Key': paymentKeys.get(fingerprint) } });
  paymentKeys.delete(fingerprint);
  return result;
}
export const receptionApi = {
  async lookupMember(query) {
    if (query.trim().length < 2) throw new Error('Nhập ít nhất 2 ký tự để tra cứu hội viên.');
    return (await allPages(`/api/centers/${centerId()}/members?query=${encodeURIComponent(query.trim())}`)).map(memberView);
  },
  async registerCounterPackage({ memberId, packageId, paymentMethod, amountReceived, posApprovalCode }) {
    const method = { 'TIỀN MẶT': 'CASH', CASH: 'CASH', POS: 'POS' }[paymentMethod];
    if (!method) throw new Error('Tại quầy chỉ hỗ trợ CASH/POS theo hợp đồng máy chủ.');
    if (!Number.isSafeInteger(Number(memberId)) || Number(memberId) <= 0 || !Number.isSafeInteger(Number(packageId)) || Number(packageId) <= 0)
      throw new Error('Phải chọn hội viên và gói tập hợp lệ.');
    const amount = Number(amountReceived);
    if (amountReceived === '' || amountReceived == null || !Number.isFinite(amount) || amount < 0)
      throw new Error('Số tiền thực nhận phải là số không âm hợp lệ.');
    if (method === 'POS' && !posApprovalCode?.trim())
      throw new Error('Thanh toán POS yêu cầu mã phê duyệt hợp lệ.');
    const result = await paymentRequest('/api/payments/counter-checkout', { memberId, packageId, paymentMethod: method, amountReceived: amount, posApprovalCode: method === 'POS' ? posApprovalCode.trim() : null });
    return { ...result, transactionRef: result.transactionRef };
  },
  getCheckInHistory: () => request(`/api/centers/${centerId()}/check-ins`),
  checkInMember: identifier => request(`/api/centers/${centerId()}/check-ins`, { method: 'POST', body: { identifier: String(identifier).trim() } })
};
export const memberApi = {
  createSubscription: packageId => request('/api/members/me/subscriptions', { method: 'POST', body: { packageId } }),
  async subscribeOnline({ packageId, paymentMethod }) {
    const provider = { VNPAY: 'vnpay', MOMO: 'momo', PAYOS: 'payos', VIETQR: 'payos' }[paymentMethod];
    if (!provider) throw new Error('Phương thức thanh toán chưa được hỗ trợ.');
    return paymentRequest(`/api/payments/create-${provider}-url`, { packageId });
  },
  async getMyProgress() { return unavailable('Tiến độ tập luyện'); },
  async getMyPlans() { return unavailable('Giáo án'); },
  async askAI() { return unavailable('Trợ lý AI'); }
};
export const coachApi = {
  getClassMembers: sessionId => request(`/api/coaches/me/sessions/${sessionId}/roster`),
  takeAttendance: (sessionId, records) => request(`/api/coaches/me/sessions/${sessionId}/attendance`, { method: 'PUT', body: { records } }),
  ...Object.fromEntries(['getCoachClassesAndMembers', 'createTrainingPlan', 'savePersonalTrainingPlan', 'deletePersonalTrainingPlan', 'deleteTrainingPlan', 'recordWorkoutProgress', 'sendNotification', 'getAIRecommendation'].map(name => [name, async () => unavailable('Chức năng huấn luyện') ]))
};
export const reportApi = {
  async getOverview(period = 'MONTH') {
    const now = new Date();
    const from = toLocalDateInput(new Date(now.getFullYear(), period === 'YEAR' ? 0 : period === 'QUARTER' ? Math.floor(now.getMonth() / 3) * 3 : now.getMonth(), 1));
    const query = `from=${from}&to=${toLocalDateInput(now)}&groupBy=${period === 'MONTH' ? 'day' : 'month'}&centerId=${centerId()}`;
    const [revenue, membership, classes] = await Promise.all(['revenue', 'membership', 'classes'].map(type => request(`/api/reports/${type}?${query}`)));
    return { revenue, membership, classes, totalMembers: membership.totalMembers, activeMembers: membership.activeMembers, monthlyRevenue: revenue.net, revenueGrowth: null, totalBookings: Object.values(classes.currentStatusCounts || {}).reduce((sum, count) => sum + count, 0), todayCheckins: null, totalClasses: null, totalCoaches: null, occupancyRate: null, packageDistribution: [] };
  }
};
export const systemApi = {
  async getAuditLogs() { return (await allPages(`/api/centers/${centerId()}/audit-logs`)).map(log => ({ ...log, timestamp: log.createdAt, userName: log.actorUserId ? `#${log.actorUserId}` : 'Hệ thống', details: `${log.entityType} #${log.entityId ?? ''}` })); },
  getPermissions: () => request('/api/admin/roles'),
  getAllPermissionCodes: () => request('/api/permissions'),
  updatePermissions: (roleId, permissionCodes) => request(`/api/admin/roles/${roleId}/permissions`, { method: 'PUT', body: { permissionCodes } }),
  resetAllData() { return unavailable('Reset dữ liệu'); }
};
