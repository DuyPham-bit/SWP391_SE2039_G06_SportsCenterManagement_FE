import { db, DB_KEYS } from './dbStorage.js';
// Simulated delay helper
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

export const roomApi = {
  async getAll() {
    return [];
  },

  async create() {
    throw new Error('Backend hiện chưa có API quản lý phòng.');
  },

  async update() {
    throw new Error('Backend hiện chưa có API quản lý phòng.');
  }
};

export const coachApi = {
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
      isCustom: planData.isCustom || false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.insert(DB_KEYS.TRAINING_PLANS, newPlan);
    const targetLabel = planData.isCustom ? `học viên ${planData.memberName}` : `lớp ${planData.className || 'đảm nhiệm'}`;
    db.logAudit(planData.coachName, 'COACH', 'CREATE_TRAINING_PLAN', `Tạo giáo án cho ${targetLabel}: ${planData.title}`);
    return newPlan;
  },

  async savePersonalTrainingPlan(planData) {
    await delay();
    const plans = db.get(DB_KEYS.TRAINING_PLANS);
    const existingIndex = plans.findIndex(
      p => p.classId === planData.classId && p.memberId === planData.memberId && p.isCustom
    );

    let savedPlan;
    if (existingIndex !== -1) {
      plans[existingIndex] = {
        ...plans[existingIndex],
        ...planData,
        isCustom: true,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      db.set(DB_KEYS.TRAINING_PLANS, plans);
      savedPlan = plans[existingIndex];
      db.logAudit(planData.coachName, 'COACH', 'UPDATE_PERSONAL_PLAN', `Cập nhật giáo án riêng cho học viên ${planData.memberName} (Lớp ${planData.className})`);
    } else {
      savedPlan = {
        ...planData,
        id: `tp-custom-${Date.now()}`,
        isCustom: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0]
      };
      db.insert(DB_KEYS.TRAINING_PLANS, savedPlan);
      db.logAudit(planData.coachName, 'COACH', 'CREATE_PERSONAL_PLAN', `Tạo giáo án riêng đặc biệt cho học viên ${planData.memberName} (Lớp ${planData.className})`);
    }
    return savedPlan;
  },

  async deletePersonalTrainingPlan(classId, memberId, coachName = 'Huấn luyện viên') {
    await delay();
    const plans = db.get(DB_KEYS.TRAINING_PLANS);
    const target = plans.find(p => p.classId === classId && p.memberId === memberId && p.isCustom);
    if (target) {
      db.remove(DB_KEYS.TRAINING_PLANS, target.id);
      db.logAudit(coachName, 'COACH', 'DELETE_PERSONAL_PLAN', `Huỷ giáo án riêng của học viên ${target.memberName || memberId} (Lớp ${target.className})`);
      return true;
    }
    return false;
  },

  async deleteTrainingPlan(planId, coachName = 'Huấn luyện viên') {
    await delay();
    const plans = db.get(DB_KEYS.TRAINING_PLANS);
    const target = plans.find(p => p.id === planId);
    if (target) {
      db.remove(DB_KEYS.TRAINING_PLANS, planId);
      db.logAudit(coachName, 'COACH', 'DELETE_TRAINING_PLAN', `Xoá giáo án: ${target.title}`);
      return true;
    }
    return false;
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

  async getAIRecommendation({ memberName, fitnessGoal, currentLevel, notes }) {
    await delay(300);
    // Intelligent rule-based AI recommendation logic
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

export { authApi, packageApi, classApi, bookingApi, receptionApi, memberApi, staffApi, reportApi, systemApi } from './backendApi.js';
