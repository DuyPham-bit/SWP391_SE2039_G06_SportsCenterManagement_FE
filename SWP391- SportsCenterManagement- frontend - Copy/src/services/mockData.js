// SCMS Sports Center Master Data

export const INITIAL_SPORTS = [
  { id: 'boi-loi', name: 'Bơi lội', icon: 'pool', venue: 'Bể bơi 4 mùa 50m Olympic', category: 'Sức bền & Tĩnh tâm' },
  { id: 'bong-da', name: 'Bóng đá', icon: 'sports_soccer', venue: 'Sân cỏ nhân tạo FIFA', category: 'Bóng & Vợt' },
  { id: 'cau-long', name: 'Cầu lông', icon: 'sports_tennis', venue: 'Sàn thảm Taraflex BWF', category: 'Bóng & Vợt' },
  { id: 'nhay-hien-dai', name: 'Nhảy hiện đại', icon: 'music_note', venue: 'Phòng studio âm học', category: 'Sức bền & Tĩnh tâm' },
  { id: 'bong-ro', name: 'Bóng rổ', icon: 'sports_basketball', venue: 'Sàn gỗ phong Bắc Mỹ', category: 'Bóng & Vợt' },
  { id: 'tennis', name: 'Quần vợt (Tennis)', icon: 'sports_baseball', venue: 'Sân cứng sơn Plexicushion', category: 'Bóng & Vợt' },
  { id: 'vo-thuat', name: 'Võ thuật & Boxing', icon: 'sports_mma', venue: 'Sàn đấu lồng & Tatami', category: 'Thể thao đối kháng' },
  { id: 'gym-fitness', name: 'Gym & Fitness', icon: 'fitness_center', venue: 'Hệ máy tập Technogym', category: 'Sức bền & Tĩnh tâm' },
  { id: 'yoga-pilates', name: 'Yoga & Pilates', icon: 'self_improvement', venue: 'Giàn máy Reformer hiện đại', category: 'Sức bền & Tĩnh tâm' },
  { id: 'bong-chuyen', name: 'Bóng chuyền', icon: 'sports_volleyball', venue: 'Tiêu chuẩn thi đấu FIVB', category: 'Bóng & Vợt' },
  { id: 'bong-ban', name: 'Bóng bàn', icon: 'sports_score', venue: 'Bàn thi đấu Double Fish', category: 'Bóng & Vợt' },
  { id: 'dien-kinh', name: 'Điền kinh', icon: 'directions_run', venue: 'Đường chạy cao su tổng hợp', category: 'Sức bền & Tĩnh tâm' },
  { id: 'ban-cung', name: 'Bắn cung', icon: 'crisis_alert', venue: 'Trường bắn cự ly 30m - 70m', category: 'Thể thao đối kháng' },
  { id: 'dap-xe', name: 'Đạp xe trong nhà', icon: 'directions_bike', venue: 'Phòng Spinning cảm ứng lực', category: 'Sức bền & Tĩnh tâm' },
  { id: 'leo-nui', name: 'Leo núi nhân tạo', icon: 'terrain', venue: 'Tường leo Bouldering & Lead', category: 'Thể thao đối kháng' }
];

export const INITIAL_USERS = [
  {
    id: 'usr-mgr-01',
    email: 'manager@scms.vn',
    password: 'password123',
    fullName: 'Trần Văn Quản Lý',
    phone: '0987111222',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'ACTIVE',
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-rec-01',
    email: 'receptionist@scms.vn',
    password: 'password123',
    fullName: 'Lê Thị Thu Thảo',
    phone: '0987333444',
    role: 'RECEPTIONIST',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    status: 'ACTIVE',
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-coa-01',
    email: 'coach@scms.vn',
    password: 'password123',
    fullName: 'Nguyễn Văn Huấn (HLV Trưởng)',
    phone: '0987555666',
    role: 'COACH',
    specialty: 'Bơi lội & Gym thể hình',
    certification: 'AFC Level A & NASM-CPT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'ACTIVE',
    createdAt: '2026-01-20'
  },
  {
    id: 'usr-coa-02',
    email: 'coach.le@scms.vn',
    password: 'password123',
    fullName: 'Hoàng Minh Tuấn',
    phone: '0987777888',
    role: 'COACH',
    specialty: 'Cầu lông & Quần vợt',
    certification: 'BWF Certified & ITF Coach',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    status: 'ACTIVE',
    createdAt: '2026-02-10'
  },
  {
    id: 'usr-mem-01',
    email: 'member@scms.vn',
    password: 'password123',
    fullName: 'Phạm Thanh Hội Viên',
    phone: '0912345678',
    role: 'MEMBER',
    memberCode: 'MEM-8899',
    packageId: 'pkg-all-access',
    packageName: 'Gói All-Access Olympic Pass',
    packageExpiry: '2026-12-31',
    packageStatus: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    status: 'ACTIVE',
    createdAt: '2026-03-01'
  },
  {
    id: 'usr-mem-02',
    email: 'nguyenvana@gmail.com',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    phone: '0909123987',
    role: 'MEMBER',
    memberCode: 'MEM-5521',
    packageId: 'pkg-pro',
    packageName: 'Gói Pro Bứt Phá (3 Tháng)',
    packageExpiry: '2026-10-15',
    packageStatus: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    status: 'ACTIVE',
    createdAt: '2026-03-10'
  },
  {
    id: 'usr-mem-03',
    email: 'tranthib@gmail.com',
    password: 'password123',
    fullName: 'Trần Thị B',
    phone: '0933444555',
    role: 'MEMBER',
    memberCode: 'MEM-3312',
    packageId: 'pkg-basic',
    packageName: 'Gói Basic Thể Thao (1 Tháng)',
    packageExpiry: '2026-08-01',
    packageStatus: 'EXPIRED',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'ACTIVE',
    createdAt: '2026-02-15'
  }
];

export const INITIAL_ROOMS = [
  { id: 'room-01', name: 'Bể bơi Olympic 50m (Trong nhà)', type: 'Bể bơi', capacity: 40, status: 'AVAILABLE', location: 'Khu A - Tầng 1' },
  { id: 'room-02', name: 'Sân bóng đá cỏ nhân tạo FIFA', type: 'Sân bóng đá', capacity: 22, status: 'AVAILABLE', location: 'Khu Ngoài trời A' },
  { id: 'room-03', name: 'Sân cầu lông Taraflex BWF (8 sân)', type: 'Sân cầu lông', capacity: 32, status: 'AVAILABLE', location: 'Khu B - Tầng 2' },
  { id: 'room-04', name: 'Studio Âm học Nhảy & Aerobic', type: 'Studio vũ đạo', capacity: 25, status: 'AVAILABLE', location: 'Khu C - Tầng 2' },
  { id: 'room-05', name: 'Sân bóng rổ sàn gỗ phong Bắc Mỹ', type: 'Sân bóng rổ', capacity: 20, status: 'AVAILABLE', location: 'Khu B - Tầng 1' },
  { id: 'room-06', name: 'Cụm sân Tennis Plexicushion', type: 'Sân Tennis', capacity: 16, status: 'AVAILABLE', location: 'Khu Ngoài trời B' },
  { id: 'room-07', name: 'Võ đài Octagon Tatami chuyên nghiệp', type: 'Phòng võ thuật', capacity: 18, status: 'AVAILABLE', location: 'Khu C - Tầng 1' },
  { id: 'room-08', name: 'Khu tập Gym & Technogym Pro 800m²', type: 'Phòng Gym', capacity: 60, status: 'AVAILABLE', location: 'Khu A - Tầng 2' },
  { id: 'room-09', name: 'Phòng Yoga Zen & Máy Reformer', type: 'Phòng Yoga', capacity: 20, status: 'AVAILABLE', location: 'Khu C - Tầng 3' }
];

export const INITIAL_PACKAGES = [
  {
    id: 'pkg-basic',
    name: 'Gói Basic Thể Thao',
    durationDays: 30,
    price: 650000,
    allowedSports: 1,
    description: 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu hoặc lịch tập cố định.',
    features: ['Sử dụng 1 môn thể thao cố định', 'Tủ đồ thông minh dùng theo ngày', 'Nước uống điện giải miễn phí'],
    badge: 'TIẾT KIỆM',
    status: 'ACTIVE'
  },
  {
    id: 'pkg-pro',
    name: 'Gói Pro Bứt Phá',
    durationDays: 90,
    price: 1800000,
    allowedSports: 3,
    description: 'Lựa chọn 3 bộ môn kết hợp (ví dụ: Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra InBody.',
    features: ['Lựa chọn 3 môn thể thao linh hoạt', '1 buổi đo InBody & tư vấn giáo án', 'Khăn tập & tủ đồ cao cấp', 'Ưu tiên đặt sân trước 48h'],
    badge: 'PHỔ BIẾN NHẤT',
    status: 'ACTIVE'
  },
  {
    id: 'pkg-elite',
    name: 'Gói Elite Chuyên Nghiệp',
    durationDays: 180,
    price: 3200000,
    allowedSports: 6,
    description: 'Trải nghiệm thể thao đa năng toàn diện, hỗ trợ đặt sân ưu tiên và quyền vào phòng xông hơi Sauna.',
    features: ['Tập luyện 6 bộ môn thể thao', 'Phòng xông hơi khô & ướt miễn phí', '3 buổi hướng dẫn 1-1 cùng HLV', 'Bảo lưu gói tập tối đa 30 ngày'],
    badge: 'CHUYÊN SÂU',
    status: 'ACTIVE'
  },
  {
    id: 'pkg-all-access',
    name: 'Gói All-Access Olympic Pass',
    durationDays: 365,
    price: 5800000,
    allowedSports: 15,
    description: 'Toàn quyền sử dụng 15 bộ môn và 9 sân thi đấu đẳng cấp quốc tế 365 ngày.',
    features: ['Toàn quyền sử dụng 15 môn thể thao', 'Tủ locker cá nhân cố định cả năm', 'Đo InBody định kỳ hàng tháng', 'Khách mời miễn phí 1 lần/tháng', 'Giảm 20% các giải đấu nội bộ'],
    badge: 'VIP OLYMPIC',
    status: 'ACTIVE'
  }
];

export const INITIAL_CLASSES = [
  {
    id: 'cls-01',
    name: 'Lớp Bơi Bướm Nâng Cao',
    sportId: 'boi-loi',
    sportName: 'Bơi lội',
    coachId: 'usr-coa-01',
    coachName: 'Nguyễn Văn Huấn (HLV Trưởng)',
    roomId: 'room-01',
    roomName: 'Bể bơi Olympic 50m (Trong nhà)',
    dayOfWeek: 'Thứ 2, 4, 6',
    timeSlot: '06:30 - 08:00',
    capacity: 20,
    enrolledCount: 2,
    status: 'OPEN'
  },
  {
    id: 'cls-02',
    name: 'Lớp Gym & Body Transformation',
    sportId: 'gym-fitness',
    sportName: 'Gym & Fitness',
    coachId: 'usr-coa-01',
    coachName: 'Nguyễn Văn Huấn (HLV Trưởng)',
    roomId: 'room-08',
    roomName: 'Khu tập Gym & Technogym Pro 800m²',
    dayOfWeek: 'Thứ 3, 5, 7',
    timeSlot: '17:30 - 19:00',
    capacity: 25,
    enrolledCount: 1,
    status: 'OPEN'
  },
  {
    id: 'cls-03',
    name: 'Lớp Cầu Lông Đôi Thi Đấu',
    sportId: 'cau-long',
    sportName: 'Cầu lông',
    coachId: 'usr-coa-02',
    coachName: 'Hoàng Minh Tuấn',
    roomId: 'room-03',
    roomName: 'Sân cầu lông Taraflex BWF (8 sân)',
    dayOfWeek: 'Thứ 2, 4, 6',
    timeSlot: '18:00 - 19:30',
    capacity: 16,
    enrolledCount: 1,
    status: 'OPEN'
  },
  {
    id: 'cls-04',
    name: 'Lớp Quần Vợt Kỹ Thuật Cơ Bản',
    sportId: 'tennis',
    sportName: 'Quần vợt (Tennis)',
    coachId: 'usr-coa-02',
    coachName: 'Hoàng Minh Tuấn',
    roomId: 'room-06',
    roomName: 'Cụm sân Tennis Plexicushion',
    dayOfWeek: 'Thứ 7, Chủ Nhật',
    timeSlot: '07:00 - 09:00',
    capacity: 12,
    enrolledCount: 1,
    status: 'OPEN'
  },
  {
    id: 'cls-05',
    name: 'Lớp Bơi Sải Thể Lực',
    sportId: 'boi-loi',
    sportName: 'Bơi lội',
    coachId: 'usr-coa-01',
    coachName: 'Nguyễn Văn Huấn (HLV Trưởng)',
    roomId: 'room-01',
    roomName: 'Bể bơi Olympic 50m (Trong nhà)',
    dayOfWeek: 'Thứ 3, 5, 7',
    timeSlot: '18:00 - 19:30',
    capacity: 20,
    enrolledCount: 0,
    status: 'OPEN'
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'bkg-01',
    memberId: 'usr-mem-02',
    memberName: 'Nguyễn Văn A',
    classId: 'cls-01',
    className: 'Lớp Bơi Bướm Nâng Cao',
    timeSlot: '06:30 - 08:00',
    bookingDate: '2026-09-26',
    roomName: 'Bể bơi Olympic 50m (Trong nhà)',
    status: 'CONFIRMED',
    createdAt: '2026-09-20 09:30:00'
  },
  {
    id: 'bkg-02',
    memberId: 'usr-mem-01',
    memberName: 'Phạm Thanh Hội Viên',
    classId: 'cls-01',
    className: 'Lớp Bơi Bướm Nâng Cao',
    timeSlot: '06:30 - 08:00',
    bookingDate: '2026-09-26',
    roomName: 'Bể bơi Olympic 50m (Trong nhà)',
    status: 'CONFIRMED',
    createdAt: '2026-09-21 14:15:00'
  },
  {
    id: 'bkg-03',
    memberId: 'usr-mem-02',
    memberName: 'Nguyễn Văn A',
    classId: 'cls-02',
    className: 'Lớp Gym & Body Transformation',
    timeSlot: '17:30 - 19:00',
    bookingDate: '2026-09-27',
    roomName: 'Khu tập Gym & Technogym Pro 800m²',
    status: 'CONFIRMED',
    createdAt: '2026-09-22 10:00:00'
  },
  {
    id: 'bkg-04',
    memberId: 'usr-mem-03',
    memberName: 'Trần Thị B',
    classId: 'cls-03',
    className: 'Lớp Cầu Lông Đôi Thi Đấu',
    timeSlot: '18:00 - 19:30',
    bookingDate: '2026-09-28',
    roomName: 'Sân cầu lông Taraflex BWF (8 sân)',
    status: 'CONFIRMED',
    createdAt: '2026-09-22 11:20:00'
  },
  {
    id: 'bkg-05',
    memberId: 'usr-mem-01',
    memberName: 'Phạm Thanh Hội Viên',
    classId: 'cls-04',
    className: 'Lớp Quần Vợt Kỹ Thuật Cơ Bản',
    timeSlot: '07:00 - 09:00',
    bookingDate: '2026-09-27',
    roomName: 'Cụm sân Tennis Plexicushion',
    status: 'CONFIRMED',
    createdAt: '2026-09-23 16:45:00'
  }
];
export const INITIAL_CHECKINS = [];
export const INITIAL_TRAINING_PLANS = [];
export const INITIAL_PROGRESS_RECORDS = [];
export const INITIAL_ATTENDANCES = [];
export const INITIAL_COACH_NOTIFICATIONS = [];
export const INITIAL_AUDIT_LOGS = [];

export const INITIAL_PERMISSIONS = {
  MANAGER: ['manage_staff', 'manage_packages', 'manage_classes', 'assign_coach', 'view_reports', 'manage_roles', 'view_audit_logs', 'override_bookings'],
  RECEPTIONIST: ['lookup_member', 'register_counter_package', 'checkin_member', 'view_schedule'],
  COACH: ['view_teaching_schedule', 'view_class_members', 'create_training_plan', 'record_workout_progress', 'take_attendance', 'send_coach_notifications', 'get_ai_recommendation'],
  MEMBER: ['view_packages', 'subscribe_package', 'view_schedules', 'book_class', 'cancel_booking', 'view_my_progress', 'ask_ai_assistant']
};
