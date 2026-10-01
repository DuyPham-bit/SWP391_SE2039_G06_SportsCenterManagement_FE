import { db, DB_KEYS } from './dbStorage.js';
import { httpClient, isMockModeForced } from './httpClient.js';
import { INITIAL_SPORTS } from './mockData.js';

// Simulated delay helper for mock mode
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Universal executor that attempts real HTTP Backend API first,
 * and gracefully falls back to local Mock DB if the Backend is offline or unreachable.
 */
async function callWithFallback(realApiFn, mockApiFn, endpointName = 'API') {
  // If user or environment explicitly forces Mock Mode
  if (isMockModeForced()) {
    return await mockApiFn();
  }

  try {
    const result = await realApiFn();
    return result;
  } catch (error) {
    // Check if error is a network connection issue (Backend not started, ERR_NETWORK, timeout)
    const isNetworkDown = error.isNetworkError || !error.status || error.message?.includes('Network Error');
    
    if (isNetworkDown) {
      console.warn(`[SCMS API - Fallback] Không thể kết nối tới Backend (${endpointName}): ${error.message}. Đang sử dụng dữ liệu cục bộ (Mock DB).`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('SCMS_API_FALLBACK_TRIGGERED', {
            detail: { endpoint: endpointName, message: error.message }
          })
        );
      }
      return await mockApiFn();
    }

    // Real business error from Backend (e.g., 400 Bad Request, 401 Unauthorized, 403, 404, 500)
    // Must rethrow so UI displays the exact error message from the backend
    throw error;
  }
}

// Helper functions for ID and role generation
export const getRolePrefix = (role) => {
  switch (role) {
    case 'COACH':
      return 'usr-coa';
    case 'RECEPTIONIST':
      return 'usr-rec';
    case 'MANAGER':
      return 'usr-mgr';
    default:
      return `usr-${(role || 'stf').toLowerCase().slice(0, 3)}`;
  }
};

export const generateRoleId = (role, oldId = '', allUsers = []) => {
  const prefix = getRolePrefix(role);

  const numMatch = oldId ? oldId.match(/(\d+)$/) : null;
  if (numMatch) {
    let num = parseInt(numMatch[1], 10);
    const padLength = Math.max(2, numMatch[1].length);
    let candidate = `${prefix}-${String(num).padStart(padLength, '0')}`;
    while (allUsers.some(u => u.id === candidate && u.id !== oldId)) {
      num++;
      candidate = `${prefix}-${String(num).padStart(padLength, '0')}`;
    }
    return candidate;
  }

  const existingForRole = allUsers.filter(u => u.role === role || (u.id && u.id.startsWith(prefix)));
  let candidateNum = existingForRole.length + 1;
  let candidate = `${prefix}-${String(candidateNum).padStart(2, '0')}`;
  while (allUsers.some(u => u.id === candidate && u.id !== oldId)) {
    candidateNum++;
    candidate = `${prefix}-${String(candidateNum).padStart(2, '0')}`;
  }
  return candidate;
};

/* ==========================================================================
   1. MOCK IMPLEMENTATIONS (Local DB Fallback)
   ========================================================================== */

const mockAuthApi = {
  async login(email, password) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      throw new Error('Email tài khoản không tồn tại trong hệ thống!');
    }
    if (user.password !== password) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản lý!');
    }

    db.logAudit(user.fullName, user.role, 'LOGIN', `Đăng nhập hệ thống thành công`);
    return {
      token: `fake-jwt-${user.id}-${Date.now()}`,
      user
    };
  },

  async register({ fullName, email, phone, password }) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('Email này đã được đăng ký trên hệ thống!');
    }

    const newUser = {
      id: `usr-mem-${Date.now()}`,
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: 'MEMBER',
      memberCode: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      packageId: null,
      packageName: 'Chưa đăng ký gói tập',
      packageExpiry: null,
      packageStatus: 'INACTIVE',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.insert(DB_KEYS.USERS, newUser);
    db.logAudit(newUser.fullName, 'MEMBER', 'REGISTER', `Đăng ký tài khoản hội viên mới`);
    return newUser;
  },

  async loginWithGoogle({ email, fullName, avatar }) {
    await delay(250);
    const users = db.get(DB_KEYS.USERS);
    const cleanEmail = email.trim().toLowerCase();
    
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      if (user.status !== 'ACTIVE') {
        throw new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản lý!');
      }
      db.logAudit(user.fullName, user.role, 'GOOGLE_LOGIN', `Đăng nhập thành công bằng tài khoản Google (${cleanEmail})`);
      return {
        token: `fake-jwt-google-${user.id}-${Date.now()}`,
        user
      };
    }

    const newUser = {
      id: `usr-mem-${Date.now()}`,
      email: cleanEmail,
      password: 'oauth_google_authenticated',
      fullName: (fullName && fullName.trim()) || cleanEmail.split('@')[0],
      phone: '',
      role: 'MEMBER',
      memberCode: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      packageId: null,
      packageName: 'Chưa đăng ký gói tập',
      packageExpiry: null,
      packageStatus: 'INACTIVE',
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || cleanEmail)}&background=ea4335&color=fff`,
      status: 'ACTIVE',
      authProvider: 'GOOGLE',
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.insert(DB_KEYS.USERS, newUser);
    db.logAudit(newUser.fullName, 'MEMBER', 'GOOGLE_REGISTER', `Đăng ký & Đăng nhập thành công qua Google (${cleanEmail})`);

    return {
      token: `fake-jwt-google-${newUser.id}-${Date.now()}`,
      user: newUser
    };
  },

  async resetPassword(email, otp, newPassword) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('Không tìm thấy tài khoản với email này!');
    }
    if (otp !== '123456' && otp !== '8888') {
      throw new Error('Mã xác thực OTP không chính xác hoặc đã hết hạn!');
    }
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự!');
    }

    db.update(DB_KEYS.USERS, user.id, { password: newPassword });
    db.logAudit(user.fullName, user.role, 'RESET_PASSWORD', `Khôi phục mật khẩu thành công`);
    return { success: true, message: 'Khôi phục mật khẩu thành công' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng!');
    if (user.password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không đúng!');
    }
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự!');
    }
    db.update(DB_KEYS.USERS, userId, { password: newPassword });
    db.logAudit(user.fullName, user.role, 'CHANGE_PASSWORD', `Đổi mật khẩu tài khoản thành công`);
    return { success: true };
  },

  async updateProfile(userId, profileData) {
    await delay();
    const updated = db.update(DB_KEYS.USERS, userId, profileData);
    if (!updated) throw new Error('Cập nhật thất bại!');
    return updated;
  },

  async getProfile(userId) {
    await delay(50);
    const users = db.get(DB_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng!');
    return user;
  }
};

const mockStaffApi = {
  async getAll() {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    return users.filter(u => u.role === 'COACH' || u.role === 'RECEPTIONIST' || u.role === 'MANAGER');
  },

  async getAvailableMembers(query = '') {
    await delay(50);
    const users = db.get(DB_KEYS.USERS);
    const members = users.filter(u => u.role === 'MEMBER');
    if (!query || !query.trim()) {
      return members;
    }
    const q = query.trim().toLowerCase();
    return members.filter(u =>
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.memberCode && u.memberCode.toLowerCase().includes(q))
    );
  },

  previewRoleId(role, oldId) {
    const users = db.get(DB_KEYS.USERS);
    return generateRoleId(role, oldId, users);
  },

  async create(staffData) {
    await delay();
    const users = db.get(DB_KEYS.USERS);

    const isExistingAccount = Boolean(staffData.memberId || staffData.selectedAccountId);

    if (isExistingAccount) {
      const targetId = staffData.memberId || staffData.selectedAccountId;
      const targetUserIndex = users.findIndex(u => u.id === targetId);
      if (targetUserIndex === -1) {
        throw new Error('Không tìm thấy tài khoản thành viên đã chọn!');
      }

      const oldUser = users[targetUserIndex];
      const oldId = oldUser.id;
      const newRole = staffData.role || 'COACH';
      const newId = generateRoleId(newRole, oldId, users);

      if (staffData.email && staffData.email.trim().toLowerCase() !== oldUser.email.toLowerCase()) {
        const cleanEmail = staffData.email.trim().toLowerCase();
        if (users.some(u => u.id !== oldId && u.email.toLowerCase() === cleanEmail)) {
          throw new Error('Email này đã được sử dụng bởi một tài khoản khác!');
        }
      }

      const updatedUser = {
        ...oldUser,
        id: newId,
        role: newRole,
        fullName: staffData.fullName ? staffData.fullName.trim() : oldUser.fullName,
        email: staffData.email ? staffData.email.trim() : oldUser.email,
        phone: staffData.phone !== undefined ? staffData.phone.trim() : (oldUser.phone || ''),
        specialty: staffData.specialty ? staffData.specialty.trim() : (oldUser.specialty || ''),
        certification: staffData.certification ? staffData.certification.trim() : (oldUser.certification || ''),
        avatar: staffData.avatar || oldUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        status: 'ACTIVE',
        promotedAt: new Date().toISOString().split('T')[0]
      };

      users[targetUserIndex] = updatedUser;
      db.set(DB_KEYS.USERS, users);

      if (oldId !== newId) {
        // Cascade update in bookings, checkins, classes, plans, progress
        const bookings = db.get(DB_KEYS.BOOKINGS);
        let bookingsChanged = false;
        bookings.forEach(b => {
          if (b.memberId === oldId) {
            b.memberId = newId;
            bookingsChanged = true;
          }
        });
        if (bookingsChanged) db.set(DB_KEYS.BOOKINGS, bookings);

        const checkins = db.get(DB_KEYS.CHECKINS);
        let checkinsChanged = false;
        checkins.forEach(c => {
          if (c.memberId === oldId) {
            c.memberId = newId;
            checkinsChanged = true;
          }
        });
        if (checkinsChanged) db.set(DB_KEYS.CHECKINS, checkins);

        const classes = db.get(DB_KEYS.CLASSES);
        let classesChanged = false;
        classes.forEach(c => {
          if (c.coachId === oldId) {
            c.coachId = newId;
            classesChanged = true;
          }
        });
        if (classesChanged) db.set(DB_KEYS.CLASSES, classes);

        const plans = db.get(DB_KEYS.TRAINING_PLANS);
        let plansChanged = false;
        plans.forEach(p => {
          if (p.memberId === oldId) {
            p.memberId = newId;
            plansChanged = true;
          }
          if (p.coachId === oldId) {
            p.coachId = newId;
            plansChanged = true;
          }
        });
        if (plansChanged) db.set(DB_KEYS.TRAINING_PLANS, plans);

        const progress = db.get(DB_KEYS.PROGRESS);
        let progressChanged = false;
        progress.forEach(p => {
          if (p.memberId === oldId) {
            p.memberId = newId;
            progressChanged = true;
          }
        });
        if (progressChanged) db.set(DB_KEYS.PROGRESS, progress);
      }

      db.logAudit(
        'Manager',
        'MANAGER',
        'PROMOTE_STAFF',
        `Bổ nhiệm thành viên ${updatedUser.fullName} thành ${newRole} (ID chuyển đổi: ${oldId} ➜ ${newId})`
      );

      return {
        ...updatedUser,
        oldId,
        newId
      };
    }

    if (users.some(u => u.email.toLowerCase() === staffData.email.trim().toLowerCase())) {
      throw new Error('Email nhân viên đã tồn tại!');
    }
    const newId = generateRoleId(staffData.role, '', users);
    const newStaff = {
      ...staffData,
      id: newId,
      password: staffData.password || 'password123',
      status: 'ACTIVE',
      avatar: staffData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.insert(DB_KEYS.USERS, newStaff);
    db.logAudit('Manager', 'MANAGER', 'CREATE_STAFF', `Thêm nhân viên mới ${newStaff.fullName} (${newStaff.role}) với ID: ${newStaff.id}`);
    return newStaff;
  },

  async update(id, staffData) {
    await delay();
    const updated = db.update(DB_KEYS.USERS, id, staffData);
    db.logAudit('Manager', 'MANAGER', 'UPDATE_STAFF', `Cập nhật thông tin nhân viên ${updated.fullName}`);
    return updated;
  },

  async toggleStatus(id) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const target = users.find(u => u.id === id);
    if (!target) throw new Error('Không tìm thấy nhân viên');
    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = db.update(DB_KEYS.USERS, id, { status: newStatus });
    db.logAudit('Manager', 'MANAGER', 'TOGGLE_STAFF_STATUS', `Chuyển trạng thái ${target.fullName} sang ${newStatus}`);
    return updated;
  }
};

const mockPackageApi = {
  async getAll() {
    await delay();
    return db.get(DB_KEYS.PACKAGES);
  },

  async create(pkg) {
    await delay();
    const newPkg = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      status: 'ACTIVE'
    };
    db.insert(DB_KEYS.PACKAGES, newPkg);
    db.logAudit('Manager', 'MANAGER', 'CREATE_PACKAGE', `Tạo gói tập mới: ${newPkg.name}`);
    return newPkg;
  },

  async update(id, pkg) {
    await delay();
    const updated = db.update(DB_KEYS.PACKAGES, id, pkg);
    db.logAudit('Manager', 'MANAGER', 'UPDATE_PACKAGE', `Cập nhật gói tập: ${updated.name}`);
    return updated;
  },

  async toggleStatus(id) {
    await delay();
    const pkgs = db.get(DB_KEYS.PACKAGES);
    const target = pkgs.find(p => p.id === id);
    if (!target) throw new Error('Không tìm thấy gói tập');
    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = db.update(DB_KEYS.PACKAGES, id, { status: newStatus });
    return updated;
  }
};

const mockClassApi = {
  async getAll() {
    await delay();
    return db.get(DB_KEYS.CLASSES);
  },

  async create(classData) {
    await delay();
    const rooms = db.get(DB_KEYS.ROOMS);
    const room = rooms.find(r => r.id === classData.roomId);
    if (room && Number(classData.capacity) > room.capacity) {
      throw new Error(`Sức chứa lớp (${classData.capacity}) vượt quá sức chứa tối đa của phòng ${room.name} (${room.capacity} người)!`);
    }

    const newClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      enrolledCount: 0,
      status: 'OPEN'
    };
    db.insert(DB_KEYS.CLASSES, newClass);
    db.logAudit('Manager', 'MANAGER', 'CREATE_CLASS', `Mở lớp học mới: ${newClass.name}`);
    return newClass;
  },

  async update(id, classData) {
    await delay();
    const updated = db.update(DB_KEYS.CLASSES, id, classData);
    db.logAudit('Manager', 'MANAGER', 'UPDATE_CLASS', `Cập nhật lớp học: ${updated.name}`);
    return updated;
  },

  async assignCoach(classId, coachId) {
    await delay();
    const coaches = db.get(DB_KEYS.USERS).filter(u => u.role === 'COACH');
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) throw new Error('Huấn luyện viên không tồn tại!');

    const cls = db.get(DB_KEYS.CLASSES).find(c => c.id === classId);
    if (!cls) throw new Error('Không tìm thấy lớp học!');

    const otherClasses = db.get(DB_KEYS.CLASSES).filter(c => c.id !== classId && c.coachId === coachId);
    const conflict = otherClasses.find(c => c.dayOfWeek === cls.dayOfWeek && c.timeSlot === cls.timeSlot);
    if (conflict) {
      throw new Error(`Xung đột lịch! HLV ${coach.fullName} đã có lịch dạy lớp "${conflict.name}" vào khung giờ ${cls.timeSlot} (${cls.dayOfWeek})!`);
    }

    const updated = db.update(DB_KEYS.CLASSES, classId, {
      coachId: coach.id,
      coachName: coach.fullName
    });
    db.logAudit('Manager', 'MANAGER', 'ASSIGN_COACH', `Phân công HLV ${coach.fullName} cho lớp ${cls.name}`);
    return updated;
  }
};

const mockRoomApi = {
  async getAll() {
    await delay();
    return db.get(DB_KEYS.ROOMS);
  },

  async create(roomData) {
    await delay();
    const newRoom = {
      ...roomData,
      id: `room-${Date.now()}`,
      status: 'AVAILABLE'
    };
    db.insert(DB_KEYS.ROOMS, newRoom);
    return newRoom;
  },

  async update(id, roomData) {
    await delay();
    return db.update(DB_KEYS.ROOMS, id, roomData);
  }
};

const mockBookingApi = {
  async getMemberBookings(memberId) {
    await delay();
    const bookings = db.get(DB_KEYS.BOOKINGS);
    return bookings.filter(b => b.memberId === memberId);
  },

  async bookClass(memberId, classId, bookingDate) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const member = users.find(u => u.id === memberId);
    if (!member) throw new Error('Hội viên không tồn tại!');

    if (member.packageStatus !== 'ACTIVE') {
      throw new Error('Gói tập của bạn chưa được kích hoạt hoặc đã hết hạn! Vui lòng đăng ký/gia hạn gói tập để đặt lớp.');
    }

    const classes = db.get(DB_KEYS.CLASSES);
    const cls = classes.find(c => c.id === classId);
    if (!cls) throw new Error('Lớp học không tồn tại!');

    if (cls.enrolledCount >= cls.capacity) {
      throw new Error('Lớp học đã đủ số lượng học viên tối đa (FULL)!');
    }

    const bookings = db.get(DB_KEYS.BOOKINGS);
    const existing = bookings.find(b => b.memberId === memberId && b.classId === classId && b.status === 'CONFIRMED');
    if (existing) {
      throw new Error('Bạn đã đặt chỗ cho lớp học này rồi!');
    }

    const newBooking = {
      id: `bkg-${Date.now()}`,
      memberId: member.id,
      memberName: member.fullName,
      classId: cls.id,
      className: cls.name,
      timeSlot: cls.timeSlot,
      bookingDate: bookingDate || '2026-09-25',
      roomName: cls.roomName,
      status: 'CONFIRMED',
      createdAt: new Date().toLocaleString('vi-VN')
    };

    db.insert(DB_KEYS.BOOKINGS, newBooking);
    db.update(DB_KEYS.CLASSES, cls.id, { enrolledCount: cls.enrolledCount + 1 });
    db.logAudit(member.fullName, 'MEMBER', 'BOOK_CLASS', `Đặt chỗ thành công lớp ${cls.name}`);
    return newBooking;
  },

  async cancelBooking(bookingId, memberId) {
    await delay();
    const bookings = db.get(DB_KEYS.BOOKINGS);
    const target = bookings.find(b => b.id === bookingId && b.memberId === memberId);
    if (!target) throw new Error('Không tìm thấy lịch đặt chỗ!');
    if (target.status === 'CANCELLED') throw new Error('Lịch đặt này đã bị hủy trước đó!');

    db.update(DB_KEYS.BOOKINGS, bookingId, { status: 'CANCELLED' });

    const classes = db.get(DB_KEYS.CLASSES);
    const cls = classes.find(c => c.id === target.classId);
    if (cls && cls.enrolledCount > 0) {
      db.update(DB_KEYS.CLASSES, cls.id, { enrolledCount: cls.enrolledCount - 1 });
    }

    db.logAudit(target.memberName, 'MEMBER', 'CANCEL_BOOKING', `Hủy đặt chỗ lớp ${target.className}`);
    return true;
  }
};

const mockReceptionApi = {
  async lookupMember(query) {
    await delay();
    if (!query) {
      const users = db.get(DB_KEYS.USERS);
      return users.filter(u => u.role === 'MEMBER');
    }
    const q = query.trim().toLowerCase();
    const users = db.get(DB_KEYS.USERS);
    return users.filter(u =>
      u.role === 'MEMBER' && (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.memberCode && u.memberCode.toLowerCase().includes(q))
      )
    );
  },

  async registerCounterPackage({ memberId, packageId, paymentMethod = 'TIỀN MẶT' }) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const member = users.find(u => u.id === memberId);
    if (!member) throw new Error('Không tìm thấy hội viên!');

    const pkgs = db.get(DB_KEYS.PACKAGES);
    const pkg = pkgs.find(p => p.id === packageId);
    if (!pkg) throw new Error('Gói tập không tồn tại!');

    const now = new Date();
    const expiryDate = new Date(now.setDate(now.getDate() + pkg.durationDays)).toISOString().split('T')[0];
    const txnRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedUser = db.update(DB_KEYS.USERS, member.id, {
      packageId: pkg.id,
      packageName: pkg.name,
      packageExpiry: expiryDate,
      packageStatus: 'ACTIVE'
    });

    db.logAudit('Lễ tân', 'RECEPTIONIST', 'COUNTER_PACKAGE_REGISTRATION', `Đăng ký gói ${pkg.name} cho ${member.fullName}. Mã GD: ${txnRef} (${paymentMethod})`);

    return {
      transactionRef: txnRef,
      member: updatedUser,
      package: pkg,
      paymentMethod,
      amount: pkg.price,
      registeredAt: new Date().toLocaleString('vi-VN')
    };
  },

  async checkInMember(memberId, receptionistName = 'Lê Thị Thu Thảo') {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const member = users.find(u => u.id === memberId);
    if (!member) throw new Error('Hội viên không tồn tại trong hệ thống!');

    if (member.status !== 'ACTIVE') {
      throw new Error(`Check-in thất bại: Tài khoản của hội viên ${member.fullName} đang bị KHÓA!`);
    }

    if (member.packageStatus !== 'ACTIVE') {
      throw new Error(`Check-in thất bại: Gói tập của hội viên ${member.fullName} (${member.packageName}) đã hết hạn hoặc chưa kích hoạt!`);
    }

    const checkIn = {
      id: `chk-${Date.now()}`,
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode || 'MEM-0000',
      packageName: member.packageName,
      checkInTime: new Date().toLocaleString('vi-VN'),
      receptionistName,
      status: 'SUCCESS',
      note: 'Xác thực cổng hợp lệ - Vào khu vực thể thao SCMS'
    };

    db.insert(DB_KEYS.CHECKINS, checkIn);
    db.logAudit(receptionistName, 'RECEPTIONIST', 'CHECK_IN_MEMBER', `Check-in thành công cho ${member.fullName} (${member.memberCode})`);
    return checkIn;
  },

  async getCheckInHistory() {
    await delay();
    return db.get(DB_KEYS.CHECKINS);
  }
};

const mockCoachApi = {
  async getClassMembers(classId) {
    await delay();
    const bookings = db.get(DB_KEYS.BOOKINGS).filter(b => b.classId === classId && b.status === 'CONFIRMED');
    const users = db.get(DB_KEYS.USERS);
    return bookings.map(b => {
      const user = users.find(u => u.id === b.memberId) || {};
      return {
        bookingId: b.id,
        memberId: b.memberId,
        memberName: b.memberName,
        email: user.email,
        phone: user.phone,
        memberCode: user.memberCode,
        avatar: user.avatar
      };
    });
  },

  async getCoachClassesAndMembers(coachId, coachName, isManager = false) {
    await delay();
    const allClasses = db.get(DB_KEYS.CLASSES);
    const allBookings = db.get(DB_KEYS.BOOKINGS).filter(b => b.status === 'CONFIRMED');
    const allUsers = db.get(DB_KEYS.USERS);

    const assignedClasses = allClasses.filter(c => {
      if (isManager) return true;
      if (!coachId && !coachName) return true;
      return (coachId && c.coachId === coachId) || (coachName && c.coachName === coachName);
    });

    return assignedClasses.map(cls => {
      const classBookings = allBookings.filter(b => b.classId === cls.id);
      const members = classBookings.map(b => {
        const u = allUsers.find(user => user.id === b.memberId) || {};
        return {
          id: b.memberId,
          fullName: b.memberName || u.fullName,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          memberCode: u.memberCode || 'MEM-0000',
          bookingId: b.id,
          bookingDate: b.bookingDate,
          classId: cls.id,
          className: cls.name,
          sportName: cls.sportName,
          timeSlot: cls.timeSlot,
          dayOfWeek: cls.dayOfWeek,
          roomName: cls.roomName
        };
      });

      return {
        ...cls,
        members
      };
    });
  },

  async createTrainingPlan(planData) {
    await delay();
    const newPlan = {
      ...planData,
      id: `tp-${Date.now()}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.insert(DB_KEYS.TRAINING_PLANS, newPlan);
    db.logAudit(planData.coachName, 'COACH', 'CREATE_TRAINING_PLAN', `Tạo giáo án cho ${planData.memberName}: ${planData.title}`);
    return newPlan;
  },

  async getAllTrainingPlans() {
    await delay();
    return db.get(DB_KEYS.TRAINING_PLANS);
  },

  async recordWorkoutProgress(progressData) {
    await delay();
    const newRec = {
      ...progressData,
      id: `prg-${Date.now()}`,
      date: progressData.date || new Date().toISOString().split('T')[0]
    };
    db.insert(DB_KEYS.PROGRESS, newRec);
    db.logAudit(progressData.coachName, 'COACH', 'RECORD_PROGRESS', `Ghi nhận chỉ số thể lực cho hội viên`);
    return newRec;
  },

  async getAllProgress() {
    await delay();
    return db.get(DB_KEYS.PROGRESS);
  },

  async takeAttendance(classId, className, coachId, coachName, records) {
    await delay();
    const attendanceDoc = {
      id: `att-${Date.now()}`,
      classId,
      className,
      coachId,
      date: new Date().toISOString().split('T')[0],
      recordedAt: new Date().toLocaleString('vi-VN'),
      members: records
    };
    db.insert(DB_KEYS.ATTENDANCES, attendanceDoc);
    db.logAudit(coachName, 'COACH', 'TAKE_ATTENDANCE', `Điểm danh lớp ${className} (${records.length} học viên)`);
    return attendanceDoc;
  },

  async sendNotification(notifData) {
    await delay();
    const newNotif = {
      ...notifData,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toLocaleString('vi-VN')
    };
    db.insert(DB_KEYS.NOTIFICATIONS, newNotif);
    db.logAudit(notifData.coachName, 'COACH', 'SEND_NOTIFICATION', `Gửi bài tập/thông báo: ${notifData.title}`);
    return newNotif;
  },

  async getNotifications() {
    await delay();
    return db.get(DB_KEYS.NOTIFICATIONS);
  },

  async getAIRecommendation({ memberName, fitnessGoal, currentLevel, notes }) {
    await delay(300);
    return {
      title: `Giáo án cá nhân hóa AI: Phát triển ${fitnessGoal}`,
      targetAudience: `${memberName} (Trình độ: ${currentLevel})`,
      weeklyVolume: '4 buổi / tuần (2 buổi sức mạnh, 1 buổi sức bền, 1 buổi phục hồi tích cực)',
      heartRateZone: 'Vùng 3 - 4 (135 - 165 BPM)',
      nutritionGuidance: 'Bổ sung 2.0g Protein/kg thể trọng, nạp đủ 2.5 lít nước khoáng điện giải mỗi ngày tập luyện.',
      exercises: [
        { name: 'Khởi động động lực học & Kích hoạt khớp', sets: '2', reps: '10 phút', note: 'Xoay khớp vai, giãn háng, ép dẻo cơ gân kheo' },
        { name: 'Tổ hợp phức hợp đa khớp (Compound Lifting)', sets: '4', reps: '8 - 10', note: 'RPE 7.5 - 8.0, nghỉ 90 giây giữa các hiệp' },
        { name: 'Bài tập bổ trợ chức năng chuyên sâu bộ môn', sets: '3', reps: '12 - 15', note: 'Tập trung nhịp ly tâm (Eccentric) 3 giây' },
        { name: 'Xả cơ bằng con lăn bọt Foam Roller & Tắm nhiệt lạnh', sets: '1', reps: '15 phút', note: 'Thư giãn hoàn toàn hệ thần kinh giao cảm' }
      ],
      coachReviewNote: 'Đề xuất: HLV trưởng hãy kiểm tra trực tiếp khả năng chịu tải của học viên trong tuần đầu trước khi tăng tạ.'
    };
  }
};

const mockMemberApi = {
  async subscribeOnline({ memberId, packageId, paymentMethod = 'VNPAY' }) {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const member = users.find(u => u.id === memberId);
    if (!member) throw new Error('Hội viên không tồn tại!');

    const pkgs = db.get(DB_KEYS.PACKAGES);
    const pkg = pkgs.find(p => p.id === packageId);
    if (!pkg) throw new Error('Gói tập không hợp lệ!');

    const now = new Date();
    const expiryDate = new Date(now.setDate(now.getDate() + pkg.durationDays)).toISOString().split('T')[0];
    const txnRef = `ONL-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedUser = db.update(DB_KEYS.USERS, member.id, {
      packageId: pkg.id,
      packageName: pkg.name,
      packageExpiry: expiryDate,
      packageStatus: 'ACTIVE'
    });

    db.logAudit(member.fullName, 'MEMBER', 'SUBSCRIBE_PACKAGE', `Đăng ký trực tuyến gói ${pkg.name}. Giao dịch: ${txnRef} (${paymentMethod})`);

    return {
      transactionRef: txnRef,
      member: updatedUser,
      package: pkg,
      paymentMethod,
      amount: pkg.price
    };
  },

  async getMyProgress(memberId) {
    await delay();
    const records = db.get(DB_KEYS.PROGRESS);
    return records.filter(r => r.memberId === memberId);
  },

  async getMyPlans(memberId) {
    await delay();
    const plans = db.get(DB_KEYS.TRAINING_PLANS);
    return plans.filter(p => p.memberId === memberId);
  },

  async askAI(question, memberName = 'Hội viên') {
    await delay(250);
    const q = question.toLowerCase();

    if (q.includes('ăn') || q.includes('dinh dưỡng') || q.includes('protein') || q.includes('giảm cân')) {
      return `Chào bạn ${memberName}! Để tối ưu hóa quá trình rèn luyện tại SCMS:
1. **Trước buổi tập (30-45 phút)**: Nên nạp carbohydrate hấp thu vừa (như chuối, yến mạch hoặc bánh mì nguyên cám) để duy trì đường huyết ổn định.
2. **Sau buổi tập**: Nạp từ 25-35g protein chất lượng cao kết hợp carbs nhanh trong vòng 45 phút để tái tổng hợp glycogen và phục hồi sợi cơ.
3. Luôn giữ thói quen bổ sung 500ml nước có khoáng điện giải cho mỗi 60 phút vận động cường độ cao nhé!`;
    }

    if (q.includes('đau') || q.includes('chấn thương') || q.includes('mỏi')) {
      return `SCMS xin chia sẻ cùng bạn ${memberName}: Tình trạng đau mỏi cơ sau tập (DOMS) thường xuất hiện sau 24-48 giờ tập bài mới.
- Bạn nên thực hiện bài giãn cơ tĩnh (Static Stretching) nhẹ nhàng và ngâm bồn xông hơi Jacuzzi tại tầng 2 của SCMS để kích thích lưu thông máu.
- Nếu có hiện tượng đau nhói tại khớp xương hoặc dây chằng, hãy thông báo ngay cho HLV hoặc đến phòng Y tế SCMS (tầng 1) để được sơ cứu kịp thời!`;
    }

    if (q.includes('lịch') || q.includes('giờ mở cửa') || q.includes('sân')) {
      return `Trung tâm Thể thao SCMS mở cửa phục vụ hội viên từ:
- **Thứ Hai đến Thứ Sáu**: 05:30 - 22:30
- **Thứ Bảy & Chủ Nhật**: 06:00 - 22:00
Tất cả 9 cụm sân (Bể bơi Olympic, Cầu lông BWF, Sân FIFA, Gym Technogym...) đều có hệ thống điều hòa & lọc không khí hoạt động liên tục 24/7!`;
    }

    return `Cảm ơn câu hỏi của bạn! Là Trợ lý Thể thao AI tại SCMS, tôi khuyên bạn hãy luôn duy trì tần suất tập luyện đều đặn từ 3-4 buổi mỗi tuần, tuân thủ hướng dẫn kỹ thuật từ HLV chuyên môn và lắng nghe phản hồi của cơ thể để bứt phá giới hạn an toàn!`;
  }
};

const mockReportApi = {
  async getOverview() {
    await delay();
    const users = db.get(DB_KEYS.USERS);
    const members = users.filter(u => u.role === 'MEMBER');
    const activeMembers = members.filter(m => m.packageStatus === 'ACTIVE');
    const classes = db.get(DB_KEYS.CLASSES);
    const bookings = db.get(DB_KEYS.BOOKINGS);
    const checkins = db.get(DB_KEYS.CHECKINS);

    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalEnrolled = classes.reduce((sum, c) => sum + c.enrolledCount, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      totalCoaches: users.filter(u => u.role === 'COACH').length,
      totalClasses: classes.length,
      totalBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      todayCheckins: checkins.length,
      occupancyRate,
      monthlyRevenue: 148500000,
      revenueGrowth: '+18.4%',
      packageDistribution: [
        { name: 'All-Access Olympic', count: 42, percentage: 35 },
        { name: 'Pro Bứt Phá', count: 48, percentage: 40 },
        { name: 'Elite Chuyên Nghiệp', count: 18, percentage: 15 },
        { name: 'Basic Thể Thao', count: 12, percentage: 10 }
      ]
    };
  }
};

const mockSystemApi = {
  async getAuditLogs() {
    await delay();
    return db.get(DB_KEYS.AUDIT_LOGS);
  },

  async getPermissions() {
    await delay();
    return db.get(DB_KEYS.PERMISSIONS);
  },

  async updatePermissions(role, permissions) {
    await delay();
    const all = db.get(DB_KEYS.PERMISSIONS);
    all[role] = permissions;
    db.set(DB_KEYS.PERMISSIONS, all);
    db.logAudit('Manager', 'MANAGER', 'UPDATE_PERMISSIONS', `Cập nhật quyền hạn cho nhóm vai trò ${role}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('SCMS_PERMISSIONS_CHANGED', { detail: { role, permissions, all } }));
    }
    return all;
  },

  resetAllData() {
    db.resetAll();
  }
};

const mockSportsApi = {
  async getAll() {
    await delay(50);
    return INITIAL_SPORTS;
  }
};


/* ==========================================================================
   2. EXPORTED REAL API SERVICES WITH FALLBACK (Matching SCMS_API_Specification.md)
   ========================================================================== */

/**
 * 1. Auth & Account APIs
 */
export const authApi = {
  async login(email, password) {
    return callWithFallback(
      async () => {
        const res = await httpClient.post('/auth/login', { email, password });
        if (res?.token) {
          localStorage.setItem('SCMS_AUTH_TOKEN', res.token);
        }
        return res;
      },
      () => mockAuthApi.login(email, password),
      'POST /auth/login'
    );
  },

  async register(userData) {
    return callWithFallback(
      async () => {
        const res = await httpClient.post('/auth/register', userData);
        return res;
      },
      () => mockAuthApi.register(userData),
      'POST /auth/register'
    );
  },

  async loginWithGoogle(googleData) {
    return callWithFallback(
      async () => {
        const res = await httpClient.post('/auth/google', googleData);
        if (res?.token) {
          localStorage.setItem('SCMS_AUTH_TOKEN', res.token);
        }
        return res;
      },
      () => mockAuthApi.loginWithGoogle(googleData),
      'POST /auth/google'
    );
  },

  async resetPassword(email, otp, newPassword) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/auth/reset-password', { email, otp, newPassword });
      },
      () => mockAuthApi.resetPassword(email, otp, newPassword),
      'POST /auth/reset-password'
    );
  },

  async changePassword(userId, currentPassword, newPassword) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/users/${userId}/change-password`, { currentPassword, newPassword });
      },
      () => mockAuthApi.changePassword(userId, currentPassword, newPassword),
      `PUT /users/${userId}/change-password`
    );
  },

  async updateProfile(userId, profileData) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/users/${userId}/profile`, profileData);
      },
      () => mockAuthApi.updateProfile(userId, profileData),
      `PUT /users/${userId}/profile`
    );
  },

  async getProfile(userId) {
    return callWithFallback(
      async () => {
        return await httpClient.get(`/users/${userId}/profile`);
      },
      () => mockAuthApi.getProfile(userId),
      `GET /users/${userId}/profile`
    );
  }
};

/**
 * 2. Staff Management APIs
 */
export const staffApi = {
  async getAll() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/staff');
      },
      () => mockStaffApi.getAll(),
      'GET /staff'
    );
  },

  async getAvailableMembers(query = '') {
    return callWithFallback(
      async () => {
        return await httpClient.get('/staff/available-members', { params: { query } });
      },
      () => mockStaffApi.getAvailableMembers(query),
      'GET /staff/available-members'
    );
  },

  previewRoleId(role, oldId) {
    return mockStaffApi.previewRoleId(role, oldId);
  },

  async create(staffData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/staff', staffData);
      },
      () => mockStaffApi.create(staffData),
      'POST /staff'
    );
  },

  async update(id, staffData) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/staff/${id}`, staffData);
      },
      () => mockStaffApi.update(id, staffData),
      `PUT /staff/${id}`
    );
  },

  async toggleStatus(id) {
    return callWithFallback(
      async () => {
        return await httpClient.patch(`/staff/${id}/toggle-status`);
      },
      () => mockStaffApi.toggleStatus(id),
      `PATCH /staff/${id}/toggle-status`
    );
  }
};

/**
 * 3. Package Management APIs
 */
export const packageApi = {
  async getAll() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/packages');
      },
      () => mockPackageApi.getAll(),
      'GET /packages'
    );
  },

  async create(pkg) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/packages', pkg);
      },
      () => mockPackageApi.create(pkg),
      'POST /packages'
    );
  },

  async update(id, pkg) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/packages/${id}`, pkg);
      },
      () => mockPackageApi.update(id, pkg),
      `PUT /packages/${id}`
    );
  },

  async toggleStatus(id) {
    return callWithFallback(
      async () => {
        return await httpClient.patch(`/packages/${id}/toggle-status`);
      },
      () => mockPackageApi.toggleStatus(id),
      `PATCH /packages/${id}/toggle-status`
    );
  }
};

/**
 * 4. Classes & Schedules APIs
 */
export const classApi = {
  async getAll() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/classes');
      },
      () => mockClassApi.getAll(),
      'GET /classes'
    );
  },

  async create(classData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/classes', classData);
      },
      () => mockClassApi.create(classData),
      'POST /classes'
    );
  },

  async update(id, classData) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/classes/${id}`, classData);
      },
      () => mockClassApi.update(id, classData),
      `PUT /classes/${id}`
    );
  },

  async assignCoach(classId, coachId) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/classes/${classId}/assign-coach`, { coachId });
      },
      () => mockClassApi.assignCoach(classId, coachId),
      `PUT /classes/${classId}/assign-coach`
    );
  }
};

/**
 * 5. Rooms & Facilities APIs
 */
export const roomApi = {
  async getAll() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/rooms');
      },
      () => mockRoomApi.getAll(),
      'GET /rooms'
    );
  },

  async create(roomData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/rooms', roomData);
      },
      () => mockRoomApi.create(roomData),
      'POST /rooms'
    );
  },

  async update(id, roomData) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/rooms/${id}`, roomData);
      },
      () => mockRoomApi.update(id, roomData),
      `PUT /rooms/${id}`
    );
  }
};

/**
 * 6. Bookings APIs
 */
export const bookingApi = {
  async getMemberBookings(memberId) {
    return callWithFallback(
      async () => {
        return await httpClient.get(`/bookings/member/${memberId}`);
      },
      () => mockBookingApi.getMemberBookings(memberId),
      `GET /bookings/member/${memberId}`
    );
  },

  async bookClass(memberId, classId, bookingDate) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/bookings', { memberId, classId, bookingDate });
      },
      () => mockBookingApi.bookClass(memberId, classId, bookingDate),
      'POST /bookings'
    );
  },

  async cancelBooking(bookingId, memberId) {
    return callWithFallback(
      async () => {
        return await httpClient.post(`/bookings/${bookingId}/cancel`, { memberId });
      },
      () => mockBookingApi.cancelBooking(bookingId, memberId),
      `POST /bookings/${bookingId}/cancel`
    );
  }
};

/**
 * 7. Receptionist Operations APIs
 */
export const receptionApi = {
  async lookupMember(query) {
    return callWithFallback(
      async () => {
        return await httpClient.get('/reception/members/lookup', { params: { query } });
      },
      () => mockReceptionApi.lookupMember(query),
      'GET /reception/members/lookup'
    );
  },

  async getAllMembers() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/reception/members/lookup', { params: { query: '' } });
      },
      () => mockReceptionApi.lookupMember(''),
      'GET /reception/members'
    );
  },

  async registerCounterPackage({ memberId, packageId, paymentMethod = 'TIỀN MẶT' }) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/reception/packages/register', { memberId, packageId, paymentMethod });
      },
      () => mockReceptionApi.registerCounterPackage({ memberId, packageId, paymentMethod }),
      'POST /reception/packages/register'
    );
  },

  async checkInMember(memberId, receptionistName = 'Lê Thị Thu Thảo') {
    return callWithFallback(
      async () => {
        return await httpClient.post('/reception/check-in', { memberId, receptionistName });
      },
      () => mockReceptionApi.checkInMember(memberId, receptionistName),
      'POST /reception/check-in'
    );
  },

  async getCheckInHistory() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/reception/check-in/history');
      },
      () => mockReceptionApi.getCheckInHistory(),
      'GET /reception/check-in/history'
    );
  }
};

/**
 * 8. Coach Operations APIs
 */
export const coachApi = {
  async getClassMembers(classId) {
    return callWithFallback(
      async () => {
        return await httpClient.get(`/coach/classes/${classId}/members`);
      },
      () => mockCoachApi.getClassMembers(classId),
      `GET /coach/classes/${classId}/members`
    );
  },

  async getCoachClassesAndMembers(coachId, coachName, isManager = false) {
    return callWithFallback(
      async () => {
        return await httpClient.get('/coach/classes-with-members', {
          params: { coachId, coachName, isManager }
        });
      },
      () => mockCoachApi.getCoachClassesAndMembers(coachId, coachName, isManager),
      'GET /coach/classes-with-members'
    );
  },

  async createTrainingPlan(planData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/coach/training-plans', planData);
      },
      () => mockCoachApi.createTrainingPlan(planData),
      'POST /coach/training-plans'
    );
  },

  async getAllTrainingPlans() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/coach/training-plans');
      },
      () => mockCoachApi.getAllTrainingPlans(),
      'GET /coach/training-plans'
    );
  },

  async recordWorkoutProgress(progressData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/coach/progress', progressData);
      },
      () => mockCoachApi.recordWorkoutProgress(progressData),
      'POST /coach/progress'
    );
  },

  async getAllProgress() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/coach/progress');
      },
      () => mockCoachApi.getAllProgress(),
      'GET /coach/progress'
    );
  },

  async takeAttendance(classId, className, coachId, coachName, records) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/coach/attendance', {
          classId,
          className,
          coachId,
          coachName,
          records
        });
      },
      () => mockCoachApi.takeAttendance(classId, className, coachId, coachName, records),
      'POST /coach/attendance'
    );
  },

  async sendNotification(notifData) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/coach/notifications', notifData);
      },
      () => mockCoachApi.sendNotification(notifData),
      'POST /coach/notifications'
    );
  },

  async getNotifications() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/coach/notifications');
      },
      () => mockCoachApi.getNotifications(),
      'GET /coach/notifications'
    );
  },

  async getAIRecommendation({ memberName, fitnessGoal, currentLevel, notes }) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/coach/ai/recommend-plan', {
          memberName,
          fitnessGoal,
          currentLevel,
          notes
        });
      },
      () => mockCoachApi.getAIRecommendation({ memberName, fitnessGoal, currentLevel, notes }),
      'POST /coach/ai/recommend-plan'
    );
  }
};

/**
 * 9. Member Operations APIs
 */
export const memberApi = {
  async subscribeOnline({ memberId, packageId, paymentMethod = 'VNPAY' }) {
    return callWithFallback(
      async () => {
        return await httpClient.post('/members/packages/subscribe', {
          memberId,
          packageId,
          paymentMethod
        });
      },
      () => mockMemberApi.subscribeOnline({ memberId, packageId, paymentMethod }),
      'POST /members/packages/subscribe'
    );
  },

  async getMyProgress(memberId) {
    return callWithFallback(
      async () => {
        return await httpClient.get(`/members/${memberId}/progress`);
      },
      () => mockMemberApi.getMyProgress(memberId),
      `GET /members/${memberId}/progress`
    );
  },

  async getMyPlans(memberId) {
    return callWithFallback(
      async () => {
        return await httpClient.get(`/members/${memberId}/training-plans`);
      },
      () => mockMemberApi.getMyPlans(memberId),
      `GET /members/${memberId}/training-plans`
    );
  },

  async askAI(question, memberName = 'Hội viên') {
    return callWithFallback(
      async () => {
        return await httpClient.post('/members/ai/ask', { question, memberName });
      },
      () => mockMemberApi.askAI(question, memberName),
      'POST /members/ai/ask'
    );
  }
};

/**
 * 10. Reports & System APIs
 */
export const reportApi = {
  async getOverview() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/reports/overview');
      },
      () => mockReportApi.getOverview(),
      'GET /reports/overview'
    );
  }
};

export const systemApi = {
  async getAuditLogs() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/system/audit-logs');
      },
      () => mockSystemApi.getAuditLogs(),
      'GET /system/audit-logs'
    );
  },

  async getPermissions() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/system/permissions');
      },
      () => mockSystemApi.getPermissions(),
      'GET /system/permissions'
    );
  },

  async updatePermissions(role, permissions) {
    return callWithFallback(
      async () => {
        return await httpClient.put(`/system/permissions/${role}`, { permissions });
      },
      () => mockSystemApi.updatePermissions(role, permissions),
      `PUT /system/permissions/${role}`
    );
  },

  async resetAllData() {
    try {
      await httpClient.post('/system/reset');
    } catch (e) {
      // Backend may not have reset endpoint
    }
    mockSystemApi.resetAllData();
  }
};

/**
 * 11. Sports Master Data APIs
 */
export const sportsApi = {
  async getAll() {
    return callWithFallback(
      async () => {
        return await httpClient.get('/sports');
      },
      () => mockSportsApi.getAll(),
      'GET /sports'
    );
  }
};
