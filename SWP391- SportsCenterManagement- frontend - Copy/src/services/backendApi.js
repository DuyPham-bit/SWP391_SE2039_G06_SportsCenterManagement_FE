import { apiRequest, clearApiToken, createIdempotencyKey, getApiToken, setApiToken } from './http.js';

const SESSION_KEY = 'SCMS_AUTH_SESSION';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function centerId() {
  const id = readSession()?.centerId || import.meta.env.VITE_SPORTS_CENTER_ID;
  if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw new Error('Chưa xác định trung tâm. Hãy đăng nhập tài khoản được gán centerId hoặc cấu hình VITE_SPORTS_CENTER_ID.');
  }
  return Number(id);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.items) ? value.items : [];
}

async function loadSessionsBetween(from, to) {
  const sessions = [];
  let rangeStart = from;
  while (rangeStart <= to) {
    const startDate = new Date(`${rangeStart}T00:00:00Z`);
    startDate.setUTCDate(startDate.getUTCDate() + 90);
    const rangeEnd = startDate.toISOString().slice(0, 10) < to
      ? startDate.toISOString().slice(0, 10)
      : to;
    const firstPage = await apiRequest(`class-sessions?${new URLSearchParams({ from: rangeStart, to: rangeEnd, page: '1', pageSize: '100' })}`);
    sessions.push(...asArray(firstPage));
    const totalPages = Math.ceil((firstPage.totalCount || 0) / (firstPage.pageSize || 100));
    for (let page = 2; page <= totalPages; page += 1) {
      const result = await apiRequest(`class-sessions?${new URLSearchParams({ from: rangeStart, to: rangeEnd, page: String(page), pageSize: '100' })}`);
      sessions.push(...asArray(result));
    }
    const nextDate = new Date(`${rangeEnd}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    rangeStart = nextDate.toISOString().slice(0, 10);
  }
  return sessions;
}

function mapMember(member) {
  const today = new Date().toISOString().split('T')[0];
  let expiryStr = null;
  if (member.packageExpiry) {
    expiryStr = typeof member.packageExpiry === 'string'
      ? member.packageExpiry.split('T')[0]
      : String(member.packageExpiry);
  }

  let pkgStatus = (member.packageStatus || 'INACTIVE').toUpperCase();
  if (pkgStatus === 'ACTIVE' && expiryStr && expiryStr < today) {
    pkgStatus = 'EXPIRED';
  }

  return {
    id: member.memberId,
    userId: member.userId,
    memberCode: member.memberCode,
    username: member.username,
    email: member.email,
    phone: member.phone || '',
    fullName: member.fullName,
    role: 'MEMBER',
    status: String(member.accountStatus || 'Active').toUpperCase(),
    packageStatus: pkgStatus,
    packageName: member.packageName || 'Chưa đăng ký gói tập',
    packageExpiry: expiryStr || 'Không khả dụng',
    packageId: member.packageId || null,
    subscriptionId: member.subscriptionId || null,
    avatar: null
  };
}

async function loadCurrentUser(token = getApiToken()) {
  if (!token) return null;
  const profile = await apiRequest('profile/me', { token });
  let memberId = null;
  let activeSubscription = null;

  if (String(profile.role).toUpperCase() === 'MEMBER') {
    const member = await apiRequest('members/me', { token });
    memberId = member.memberId;
    const subscriptions = await apiRequest(`members/${memberId}/subscriptions`, { token });
    const activeSubs = asArray(subscriptions).filter(item => String(item.status).toUpperCase() === 'ACTIVE');
    activeSubs.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    activeSubscription = activeSubs[0] || null;
  }

  return {
    id: profile.userId,
    memberId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone || '',
    role: String(profile.role).toUpperCase(),
    status: String(profile.status || 'Active').toUpperCase(),
    memberCode: profile.memberCode,
    centerId: profile.centerId,
    createdAt: profile.createdAt,
    packageId: activeSubscription?.packageId || null,
    packageName: activeSubscription?.packageName || 'Chưa đăng ký gói tập',
    packageExpiry: activeSubscription?.endDate || null,
    packageStatus: activeSubscription ? 'ACTIVE' : 'INACTIVE',
    avatar: null
  };
}

function mapPackage(item) {
  return { ...item, status: String(item.status || '').toUpperCase(), allowedSports: item.allowedSports ?? 1, features: item.features || [] };
}

function mapSession(item) {
  const date = String(item.sessionDate || '');
  const parsedDate = date ? new Date(`${date}T12:00:00`) : null;
  const dayLabels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeek = parsedDate && !Number.isNaN(parsedDate.valueOf()) ? dayLabels[parsedDate.getDay()] : '';
  return {
    id: item.sessionId,
    sessionId: item.sessionId,
    classId: item.classId,
    sportId: item.sportId,
    name: item.className,
    sportName: item.sportName,
    sessionDate: date,
    dayOfWeek,
    timeSlot: `${String(item.startTime || '').slice(0, 5)} - ${String(item.endTime || '').slice(0, 5)}`,
    coachId: item.coachId,
    coachName: item.coachName || 'Chưa phân công',
    roomId: item.roomId,
    roomName: item.roomId ? `Phòng #${item.roomId}` : 'Chưa phân công',
    enrolledCount: item.bookedCount || 0,
    capacity: item.capacity || 0,
    status: String(item.sessionStatus || '').toUpperCase(),
    isBookable: Boolean(item.isBookable)
  };
}

function mapBooking(item) {
  return {
    id: item.id,
    sessionId: item.sessionId,
    classId: item.sessionId,
    sourceClassId: item.classId,
    className: item.className,
    bookingDate: item.sessionDate,
    timeSlot: `${String(item.startTime || '').slice(0, 5)} - ${String(item.endTime || '').slice(0, 5)}`,
    status: String(item.status).toUpperCase() === 'BOOKED' ? 'CONFIRMED' : String(item.status).toUpperCase(),
    createdAt: item.bookedAt
  };
}

export const authApi = {
  async login(email, password) {
    const result = await apiRequest('auth/login', { method: 'POST', body: { email: email.trim(), password } });
    setApiToken(result.accessToken);
    try {
      return { token: result.accessToken, user: await loadCurrentUser(result.accessToken) };
    } catch (error) {
      clearApiToken();
      throw error;
    }
  },

  async register({ fullName, email, phone, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const registeredCenterId = Number(import.meta.env.VITE_SPORTS_CENTER_ID);
    if (!Number.isSafeInteger(registeredCenterId) || registeredCenterId <= 0) {
      throw new Error('Cấu hình VITE_SPORTS_CENTER_ID thành ID trung tâm hợp lệ trước khi đăng ký hội viên.');
    }
    const localPart = cleanEmail.split('@')[0];
    const username = localPart.length >= 3 ? localPart : `user-${localPart}`;
    await apiRequest('auth/register', {
      method: 'POST',
      body: {
        username,
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        centerId: registeredCenterId
      }
    });
    return (await this.login(cleanEmail, password)).user;
  },

  async loginWithGoogle() {
    throw new Error('Backend hiện chưa có endpoint đăng nhập OAuth Google.');
  },

  async requestPasswordReset(email) {
    return apiRequest('auth/request-password-reset', { method: 'POST', body: { email: email.trim() } });
  },

  async resetPassword(email, otp, newPassword) {
    await apiRequest('auth/reset-password', { method: 'POST', body: { email: email.trim(), otp: otp.trim(), newPassword } });
    return true;
  },

  async changePassword(_userId, currentPassword, newPassword) {
    const result = await apiRequest('auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });
    setApiToken(result.accessToken);
    return loadCurrentUser(result.accessToken);
  },

  async updateProfile(_userId, profileData) {
    await apiRequest('profile/me', {
      method: 'PATCH',
      body: { fullName: profileData.fullName, phone: profileData.phone || null }
    });
    return loadCurrentUser();
  },

  getCurrentUser: loadCurrentUser,
  logout: clearApiToken
};

export const packageApi = {
  async getAll() {
    const id = centerId();
    const role = String(readSession()?.role || '').toUpperCase();
    const suffix = role === 'MANAGER' || role === 'ADMIN' ? '/all' : '';
    const packages = await apiRequest(`centers/${id}/membership-packages${suffix}`);
    return asArray(packages).map(mapPackage);
  },

  async create(pkg) {
    const created = await apiRequest(`centers/${centerId()}/membership-packages`, {
      method: 'POST',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(created);
  },

  async update(id, pkg) {
    const updated = await apiRequest(`centers/${centerId()}/membership-packages/${id}`, {
      method: 'PUT',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(updated);
  },

  async toggleStatus(id) {
    const target = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!target) throw new Error('Không tìm thấy gói tập.');
    const status = target.status === 'ACTIVE' ? 'Inactive' : 'Active';
    return mapPackage(await apiRequest(`centers/${centerId()}/membership-packages/${id}/status`, {
      method: 'PATCH', body: { status }
    }));
  }
};

function mapStaff(item) {
  return {
    id: item.userId,
    userId: item.userId,
    centerId: item.centerId,
    staffCode: item.staffCode,
    coachCode: item.coachCode,
    username: item.username,
    email: item.email,
    phone: item.phone || '',
    role: String(item.roleName || '').toUpperCase(),
    fullName: item.fullName,
    status: String(item.status || '').toUpperCase(),
    hireDate: item.hireDate,
    specialty: item.specialization || '',
    certification: item.certification || '',
    experienceYears: item.experienceYears,
    bio: item.bio,
    avatar: null
  };
}

export const staffApi = {
  async getAll() {
    const result = await apiRequest(`centers/${centerId()}/staff?page=1&pageSize=100`);
    return asArray(result).map(mapStaff);
  },

  async getAvailableMembers(query = '') {
    return receptionApi.lookupMember(query);
  },

  previewRoleId() {
    return 'Backend cấp mã nhân viên';
  },

  async create() {
    throw new Error('Màn hình hiện hỗ trợ bổ nhiệm tài khoản hội viên có sẵn, nhưng backend chưa có API chuyển MEMBER sang nhân viên.');
  },

  async update(id, staffData) {
    const current = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!current) throw new Error('Không tìm thấy nhân viên.');
    if (staffData.role && String(staffData.role).toUpperCase() !== current.role) {
      throw new Error('Backend hiện chưa có API đổi vai trò nhân viên.');
    }
    const result = await apiRequest(`centers/${centerId()}/staff/${id}`, {
      method: 'PATCH',
      body: {
        fullName: staffData.fullName ?? current.fullName,
        email: staffData.email ?? current.email,
        phone: staffData.phone ?? current.phone,
        status: String(staffData.status || current.status).toUpperCase() === 'ACTIVE' ? 'Active' : 'Disabled',
        hireDate: staffData.hireDate || current.hireDate || null,
        specialization: staffData.specialty ?? current.specialty ?? null,
        certification: staffData.certification ?? current.certification ?? null,
        experienceYears: staffData.experienceYears ?? current.experienceYears ?? null,
        bio: staffData.bio ?? current.bio ?? null
      }
    });
    return mapStaff(result);
  },

  async toggleStatus(id) {
    const current = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!current) throw new Error('Không tìm thấy nhân viên.');
    return this.update(id, { status: current.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
  }
};

export const classApi = {
  async getAll() {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const query = new URLSearchParams({ from: today, to: end.toISOString().slice(0, 10), page: '1', pageSize: '100' });
    const isCoach = String(readSession()?.role || '').toUpperCase() === 'COACH';
    const path = isCoach ? `coaches/me/teaching-schedule?from=${today}&to=${end.toISOString().slice(0, 10)}` : `class-sessions?${query}`;
    const result = await apiRequest(path);
    return asArray(result).map(mapSession);
  },

  async create(classData) {
    if (!Number.isSafeInteger(Number(classData.sportId)) || Number(classData.sportId) <= 0) {
      throw new Error('Không thể tạo lớp: form hiện chưa cung cấp sportId của backend.');
    }
    const result = await apiRequest('classes', {
      method: 'POST',
      body: {
        centerId: centerId(),
        sportId: Number(classData.sportId),
        roomId: classData.roomId ? Number(classData.roomId) : null,
        name: classData.name,
        description: classData.description || null,
        level: classData.level || null,
        capacity: Number(classData.capacity),
        durationMinutes: Number(classData.durationMinutes || 60),
        allowWaitlist: true
      }
    });
    return result;
  },

  async update(id, classData) {
    const classId = Number(classData.classId || id);
    if (!Number.isSafeInteger(classId) || classId <= 0) throw new Error('Mã lớp không hợp lệ.');
    if (!Number.isSafeInteger(Number(classData.sportId)) || Number(classData.sportId) <= 0) {
      throw new Error('Không thể sửa lớp: form hiện chưa cung cấp sportId của backend.');
    }
    return apiRequest(`classes/${classId}`, {
      method: 'PUT',
      body: {
        sportId: Number(classData.sportId),
        roomId: classData.roomId ? Number(classData.roomId) : null,
        name: classData.name,
        description: classData.description || null,
        level: classData.level || null,
        capacity: Number(classData.capacity),
        durationMinutes: Number(classData.durationMinutes || 60),
        allowWaitlist: true
      }
    });
  },

  async assignCoach(classId, coachId) {
    return apiRequest(`classes/${Number(classId)}/coaches`, {
      method: 'POST', body: { coachId: Number(coachId), isPrimary: true }
    });
  }
};

export const bookingApi = {
  async getMemberBookings() {
    return asArray(await apiRequest('members/me/session-bookings')).map(mapBooking);
  },

  async bookClass(_memberId, sessionId) {
    const result = await apiRequest(`class-sessions/${sessionId}/bookings`, { method: 'POST' });
    return result.booking ? mapBooking(result.booking) : result;
  },

  async cancelBooking(bookingId) {
    return apiRequest(`session-bookings/${bookingId}`, { method: 'DELETE' });
  }
};

export const receptionApi = {
  async lookupMember(query = '') {
    if (query.trim().length < 2) throw new Error('Nhập ít nhất 2 ký tự để tìm hội viên.');
    const params = new URLSearchParams({ query: query.trim(), page: '1', pageSize: '50' });
    const result = await apiRequest(`centers/${centerId()}/members?${params}`);
    return asArray(result).map(mapMember);
  },

  async registerCounterPackage({ memberId, packageId, paymentMethod = 'TIỀN MẶT', amountReceived, posApprovalCode, idempotencyKey, cancelPendingIfAny = false }) {
    const normalizedMethod = paymentMethod === 'TIỀN MẶT' ? 'CASH' : paymentMethod === 'THẺ POS' ? 'POS' : null;
    if (!normalizedMethod) throw new Error('Backend checkout tại quầy chỉ hỗ trợ tiền mặt (CASH) hoặc thẻ POS.');
    if (normalizedMethod === 'POS' && !posApprovalCode?.trim()) {
      throw new Error('Nhập mã chuẩn chi POS trước khi thanh toán.');
    }
    const key = idempotencyKey || createIdempotencyKey();
    const result = await apiRequest('payments/counter-checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: {
        memberId: Number(memberId),
        packageId: Number(packageId),
        paymentMethod: normalizedMethod,
        amountReceived: Number(amountReceived),
        posApprovalCode: posApprovalCode?.trim() || null,
        note: null,
        cancelPendingIfAny: Boolean(cancelPendingIfAny)
      }
    });
    return {
      ...result,
      transactionRef: result.transactionRef || result.invoiceNumber,
      registeredAt: result.paidAt,
      paymentMethod: result.paymentMethod,
      member: result.member,
      package: result.package
    };
  },

  async cancelPendingInvoice({ invoiceNumber, packageId, memberId }) {
    return apiRequest('payments/cancel-pending', {
      method: 'POST',
      body: {
        invoiceNumber: invoiceNumber || null,
        packageId: packageId ? Number(packageId) : null,
        memberId: memberId ? Number(memberId) : null
      }
    });
  },

  async getMemberSubscriptions(memberId) {
    if (!memberId) return [];
    return apiRequest(`members/${memberId}/subscriptions`);
  },

  async checkInMember(identifierOrMemberId) {
    const isNum = typeof identifierOrMemberId === 'number';
    const body = isNum
      ? { memberId: identifierOrMemberId }
      : { identifier: String(identifierOrMemberId) };
    return apiRequest(`centers/${centerId()}/checkins`, {
      method: 'POST',
      body
    });
  },

  async getCheckInHistory() {
    return asArray(await apiRequest(`centers/${centerId()}/checkins/today`));
  }
};

export const memberApi = {
  async subscribeOnline({ packageId, paymentMethod = 'VNPAY', invoiceNumber, cancelPendingIfAny }) {
    const provider = {
      VNPAY: 'create-vnpay-url',
      MOMO: 'create-momo-url',
      VIETQR: 'create-payos-url'
    }[paymentMethod];
    if (!provider) throw new Error('Cổng thanh toán không được hỗ trợ.');
    return apiRequest(`payments/${provider}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: {
        packageId: Number(packageId),
        invoiceNumber: invoiceNumber || null,
        cancelPendingIfAny: !!cancelPendingIfAny
      }
    });
  },

  async getMyPendingInvoices() {
    return apiRequest('payments/my-pending-invoices');
  },

  async cancelPendingInvoice(invoiceNumber) {
    return apiRequest(`payments/pending-invoice/${encodeURIComponent(invoiceNumber)}`, {
      method: 'DELETE'
    });
  },

  async cancelPendingPackage(packageId) {
    return apiRequest(`payments/pending-package/${packageId}`, {
      method: 'DELETE'
    });
  },

  async getMyProgress() {
    throw new Error('Backend hiện chưa có API tiến độ tập luyện của hội viên.');
  },

  async getMyPlans() {
    throw new Error('Backend hiện chưa có API giáo án tập luyện của hội viên.');
  },

  async askAI() {
    throw new Error('Backend hiện chưa có API trợ lý AI.');
  }
};

export const reportApi = {
  async getOverview(period = 'MONTH') {
    const today = new Date().toISOString().slice(0, 10);
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    let from = `${today.slice(0, 7)}-01`;
    if (period === 'YEAR') from = `${year}-01-01`;
    if (period === 'QUARTER') {
      const firstQuarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      from = `${year}-${String(firstQuarterMonth).padStart(2, '0')}-01`;
    }
    const query = new URLSearchParams({ from, to: today, groupBy: 'day' });
    const [revenue, membership, classes, sessionItems] = await Promise.all([
      apiRequest(`reports/revenue?${query}`),
      apiRequest(`reports/membership?${query}`),
      apiRequest(`reports/classes?${query}`),
      loadSessionsBetween(from, today)
    ]);
    const capacity = sessionItems.reduce((sum, item) => sum + (item.capacity || 0), 0);
    const booked = sessionItems.reduce((sum, item) => sum + (item.bookedCount || 0), 0);
    const activeBookingCount = Object.entries(classes.currentStatusCounts || {})
      .filter(([status]) => /book|confirm|wait/i.test(status))
      .reduce((sum, [, count]) => sum + Number(count || 0), 0);
    const utilization = new Map();
    for (const item of sessionItems) {
      const sport = item.sportName || 'Khác';
      const totals = utilization.get(sport) || { name: sport, capacity: 0, booked: 0 };
      totals.capacity += item.capacity || 0;
      totals.booked += item.bookedCount || 0;
      utilization.set(sport, totals);
    }

    return {
      totalMembers: membership.totalMembers,
      activeMembers: membership.activeMembers,
      totalClasses: sessionItems.length,
      totalBookings: activeBookingCount,
      todayCheckins: null,
      occupancyRate: capacity ? Math.round((booked / capacity) * 100) : 0,
      monthlyRevenue: revenue.net,
      revenueGrowth: null,
      revenuePeriods: revenue.periods || [],
      utilizationBySport: [...utilization.values()].map(item => ({
        name: item.name,
        capacity: item.capacity,
        booked: item.booked,
        percentage: item.capacity ? Math.round((item.booked / item.capacity) * 100) : 0
      }))
    };
  }
};

export const systemApi = {
  async getAuditLogs() {
    const session = readSession();
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    const isAdmin = String(session?.role || '').toUpperCase() === 'ADMIN';
    const path = isAdmin
      ? `admin/audit-logs?${params}`
      : `centers/${centerId()}/audit-logs?${params}`;
    const result = await apiRequest(path);
    return asArray(result).map(item => ({
      ...item,
      userId: item.actorUserId,
      userName: item.actorUserId ? `User #${item.actorUserId}` : 'System',
      role: '—',
      details: item.newValues || item.oldValues || item.entityType,
      status: 'SUCCESS',
      timestamp: item.createdAt
    }));
  },

  async getPermissions() {
    throw new Error('Màn hình phân quyền đang dùng capability riêng; cần ánh xạ lại theo permission codes của backend trước khi lưu.');
  },

  async updatePermissions() {
    throw new Error('Chưa nối capability của giao diện với permission codes mà backend yêu cầu.');
  },

  resetAllData() {
    throw new Error('Không có API xóa toàn bộ dữ liệu.');
  }
};
