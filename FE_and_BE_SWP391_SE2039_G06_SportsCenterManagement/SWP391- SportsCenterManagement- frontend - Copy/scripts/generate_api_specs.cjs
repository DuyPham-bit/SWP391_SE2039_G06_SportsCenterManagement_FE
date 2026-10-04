const fs = require('fs');
const path = require('path');

// Ensure output directories exist
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');
const postmanDir = path.join(__dirname, '..', 'postman');

[publicDir, distDir, postmanDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================================
// 1. OPENAPI SPECIFICATION (v3.0.3)
// ============================================================================
const openapiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "Sports Center Management System (SCMS) - RESTful API Specification",
    "description": "Tài liệu đặc tả chuẩn RESTful API cho Hệ thống Quản lý Trung tâm Thể thao SCMS (Sports Center Management System).\n\nĐồng bộ 100% với mã nguồn Frontend và các cập nhật nghiệp vụ mới nhất (02/10/2026):\n- Bổ nhiệm nhân sự từ tài khoản có sẵn (Giới hạn vai trò COACH / RECEPTIONIST, cấm cấp MANAGER)\n- Giáo án chung cho lớp học & Giáo án riêng cá nhân hóa cho học viên (Cập nhật, hủy giáo án riêng quay về giáo án chung)\n- Tích hợp 15 môn thể thao Olympic, 9 cụm cơ sở vật chất, 4 nhóm vai trò (Manager, Receptionist, Coach, Member).",
    "version": "1.1.0",
    "contact": {
      "name": "SCMS Development Team (SE2039_G06)",
      "email": "support@scms.vn"
    }
  },
  "servers": [
    {
      "url": "http://localhost:8080/api",
      "description": "Spring Boot Backend Server (Default REST API)"
    },
    {
      "url": "http://localhost:3003/api",
      "description": "Vite Dev Server (Frontend Reverse Proxy)"
    }
  ],
  "tags": [
    { "name": "1. Authentication", "description": "Xác thực tài khoản, Đăng nhập, Đăng ký, Google OAuth, Đổi mật khẩu" },
    { "name": "2. User & Account", "description": "Hồ sơ người dùng cá nhân và cập nhật thông tin" },
    { "name": "3. Staff Management", "description": "Quản lý nhân sự, bổ nhiệm hội viên (Giới hạn role COACH/RECEPTIONIST, cấm cấp MANAGER)" },
    { "name": "4. Member Operations", "description": "Tra cứu hội viên, lịch sử tiến độ, giáo án rèn luyện và Trợ lý AI" },
    { "name": "5. Membership Packages", "description": "Quản lý và tra cứu các gói tập thể thao của trung tâm" },
    { "name": "6. Payment & Subscription", "description": "Đăng ký gói tập trực tuyến qua VNPAY hoặc thanh toán trực tiếp tại quầy" },
    { "name": "7. Classes & Schedules", "description": "Quản lý lớp học thể thao, lịch dạy và phân công huấn luyện viên" },
    { "name": "8. Training Rooms & Facilities", "description": "Quản lý 9 cụm sân bãi & phòng tập tiêu chuẩn Olympic" },
    { "name": "9. Coach Operations", "description": "Lịch dạy HLV, danh sách học viên, bài tập thông báo và AI gợi ý giáo án" },
    { "name": "10. Booking Operations", "description": "Hội viên đặt chỗ tham gia lớp học thể thao và hủy chỗ" },
    { "name": "11. Attendance & Gate Check-in", "description": "Check-in quét thẻ vào cổng quầy lễ tân và điểm danh lớp học của HLV" },
    { "name": "12. Training Progress & Plans", "description": "Giáo án chung cho lớp, Giáo án riêng cá nhân hóa cho học viên, và Chỉ số InBody" },
    { "name": "13. Reports, System & Master Data", "description": "Thống kê Dashboard, Nhật ký Audit Logs, Phân quyền ma trận và Master Data 15 môn thể thao" }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Nhập chuỗi JWT Token xác thực nhận được từ endpoint `/auth/login`. Header định dạng: `Authorization: Bearer <token>`"
      }
    },
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "usr-mgr-01" },
          "email": { "type": "string", "example": "manager@scms.vn" },
          "fullName": { "type": "string", "example": "Trần Văn Quản Lý" },
          "phone": { "type": "string", "example": "0987111222" },
          "role": { "type": "string", "enum": ["MANAGER", "RECEPTIONIST", "COACH", "MEMBER"], "example": "MANAGER" },
          "memberCode": { "type": "string", "example": "MEM-5621" },
          "specialty": { "type": "string", "example": "Bơi lội & Gym thể hình" },
          "certification": { "type": "string", "example": "AFC Level A & NASM-CPT" },
          "packageId": { "type": "string", "example": "pkg-all-access" },
          "packageName": { "type": "string", "example": "Gói All-Access Olympic Pass" },
          "packageStatus": { "type": "string", "enum": ["ACTIVE", "INACTIVE", "EXPIRED"], "example": "ACTIVE" },
          "packageExpiry": { "type": "string", "example": "2026-12-31" },
          "avatar": { "type": "string", "example": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
          "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE"], "example": "ACTIVE" },
          "createdAt": { "type": "string", "example": "2026-01-15" }
        }
      },
      "LoginRequest": {
        "type": "object",
        "required": ["email", "password"],
        "properties": {
          "email": { "type": "string", "example": "manager@scms.vn" },
          "password": { "type": "string", "example": "password123" }
        }
      },
      "LoginResponse": {
        "type": "object",
        "properties": {
          "token": { "type": "string", "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          "user": { "$ref": "#/components/schemas/User" }
        }
      },
      "RegisterRequest": {
        "type": "object",
        "required": ["fullName", "email", "phone", "password"],
        "properties": {
          "fullName": { "type": "string", "example": "Nguyễn Văn Mới" },
          "email": { "type": "string", "example": "nguyenvanmoi@gmail.com" },
          "phone": { "type": "string", "example": "0912999888" },
          "password": { "type": "string", "example": "password123" }
        }
      },
      "GoogleAuthRequest": {
        "type": "object",
        "required": ["email", "fullName"],
        "properties": {
          "email": { "type": "string", "example": "member.google@gmail.com" },
          "fullName": { "type": "string", "example": "Nguyễn Google" },
          "avatar": { "type": "string", "example": "https://lh3.googleusercontent.com/a/sample-avatar" }
        }
      },
      "ResetPasswordRequest": {
        "type": "object",
        "required": ["email", "otp", "newPassword"],
        "properties": {
          "email": { "type": "string", "example": "member@scms.vn" },
          "otp": { "type": "string", "example": "123456" },
          "newPassword": { "type": "string", "example": "newpassword123" }
        }
      },
      "ChangePasswordRequest": {
        "type": "object",
        "required": ["currentPassword", "newPassword"],
        "properties": {
          "currentPassword": { "type": "string", "example": "password123" },
          "newPassword": { "type": "string", "example": "newpassword456" }
        }
      },
      "UpdateProfileRequest": {
        "type": "object",
        "properties": {
          "fullName": { "type": "string", "example": "Trần Văn Quản Lý Cập Nhật" },
          "phone": { "type": "string", "example": "0987111222" },
          "avatar": { "type": "string", "example": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
        }
      },
      "StaffCreateRequest": {
        "type": "object",
        "required": ["role"],
        "properties": {
          "memberId": { "type": "string", "description": "ID hội viên nếu bổ nhiệm từ hội viên có sẵn. Khi chọn, hệ thống giữ nguyên thông tin tài khoản và đổi role.", "example": "usr-mem-01" },
          "fullName": { "type": "string", "example": "Lê Văn Huấn Luyện Mới" },
          "email": { "type": "string", "example": "coach.new@scms.vn" },
          "password": { "type": "string", "example": "password123" },
          "role": {
            "type": "string",
            "enum": ["COACH", "RECEPTIONIST"],
            "description": "CHỈ CHO PHÉP COACH HOẶC RECEPTIONIST. Quản lý không thể tự cấp hoặc bổ nhiệm vai trò MANAGER!",
            "example": "COACH"
          },
          "phone": { "type": "string", "example": "0912345678" },
          "specialty": { "type": "string", "description": "Chuyên môn bộ môn (Chỉ áp dụng và bắt buộc với COACH)", "example": "Cầu lông & Bơi lội" },
          "certification": { "type": "string", "description": "Chứng chỉ quốc tế (Chỉ áp dụng với COACH)", "example": "BWF Level 1 & FINA Coach" },
          "avatar": { "type": "string", "example": "" }
        }
      },
      "StaffUpdateRequest": {
        "type": "object",
        "properties": {
          "fullName": { "type": "string", "example": "Nguyễn Văn Huấn (Trưởng Bộ Môn)" },
          "phone": { "type": "string", "example": "0987555666" },
          "specialty": { "type": "string", "example": "Bơi lội Olympic 50m & Gym Technogym" },
          "certification": { "type": "string", "example": "AFC Level A & NASM Master Trainer" }
        }
      },
      "Package": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "pkg-basic" },
          "name": { "type": "string", "example": "Gói Basic Thể Thao" },
          "durationDays": { "type": "integer", "example": 30 },
          "price": { "type": "number", "example": 650000 },
          "allowedSports": { "type": "integer", "example": 1 },
          "description": { "type": "string", "example": "Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu." },
          "features": { "type": "array", "items": { "type": "string" }, "example": ["Sử dụng 1 môn thể thao", "Tủ đồ thông minh"] },
          "badge": { "type": "string", "example": "TIẾT KIỆM" },
          "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE"], "example": "ACTIVE" }
        }
      },
      "PackageCreateRequest": {
        "type": "object",
        "required": ["name", "durationDays", "price", "allowedSports"],
        "properties": {
          "name": { "type": "string", "example": "Gói Yoga & Bơi Combo" },
          "durationDays": { "type": "integer", "example": 60 },
          "price": { "type": "number", "example": 1200000 },
          "allowedSports": { "type": "integer", "example": 2 },
          "description": { "type": "string", "example": "Gói tập kết hợp phục hồi và rèn luyện thể lực toàn diện" },
          "features": { "type": "array", "items": { "type": "string" }, "example": ["Phòng Yoga VIP", "Bể bơi Olympic 50m"] },
          "badge": { "type": "string", "example": "MỚI" }
        }
      },
      "Class": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "cls-01" },
          "name": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "sportId": { "type": "string", "example": "boi-loi" },
          "sportName": { "type": "string", "example": "Bơi lội" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn (HLV Trưởng)" },
          "roomId": { "type": "string", "example": "room-01" },
          "roomName": { "type": "string", "example": "Bể bơi Olympic 50m (Trong nhà)" },
          "dayOfWeek": { "type": "string", "example": "Thứ 2, 4, 6" },
          "timeSlot": { "type": "string", "example": "06:30 - 08:00" },
          "capacity": { "type": "integer", "example": 20 },
          "enrolledCount": { "type": "integer", "example": 2 },
          "status": { "type": "string", "enum": ["OPEN", "CLOSED"], "example": "OPEN" }
        }
      },
      "ClassCreateRequest": {
        "type": "object",
        "required": ["name", "sportId", "roomId", "dayOfWeek", "timeSlot", "capacity"],
        "properties": {
          "name": { "type": "string", "example": "Lớp Pilates Cốt Lõi Buổi Sáng" },
          "sportId": { "type": "string", "example": "yoga-pilates" },
          "sportName": { "type": "string", "example": "Yoga & Pilates" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "roomId": { "type": "string", "example": "room-09" },
          "roomName": { "type": "string", "example": "Phòng Yoga Zen & Máy Reformer" },
          "dayOfWeek": { "type": "string", "example": "Thứ 2, 4, 6" },
          "timeSlot": { "type": "string", "example": "05:30 - 06:30" },
          "capacity": { "type": "integer", "example": 15 }
        }
      },
      "AssignCoachRequest": {
        "type": "object",
        "required": ["coachId"],
        "properties": {
          "coachId": { "type": "string", "example": "usr-coa-02" }
        }
      },
      "Room": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "room-01" },
          "name": { "type": "string", "example": "Bể bơi Olympic 50m (Trong nhà)" },
          "type": { "type": "string", "example": "Bể bơi" },
          "capacity": { "type": "integer", "example": 40 },
          "status": { "type": "string", "enum": ["AVAILABLE", "MAINTENANCE"], "example": "AVAILABLE" },
          "location": { "type": "string", "example": "Khu A - Tầng 1" }
        }
      },
      "RoomCreateRequest": {
        "type": "object",
        "required": ["name", "type", "capacity", "location"],
        "properties": {
          "name": { "type": "string", "example": "Phòng Tập Gym Functional Training" },
          "type": { "type": "string", "example": "Phòng Gym" },
          "capacity": { "type": "integer", "example": 30 },
          "status": { "type": "string", "example": "AVAILABLE" },
          "location": { "type": "string", "example": "Khu A - Tầng 3" }
        }
      },
      "Booking": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "bkg-1727680001" },
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "timeSlot": { "type": "string", "example": "06:30 - 08:00" },
          "bookingDate": { "type": "string", "example": "2026-10-02" },
          "roomName": { "type": "string", "example": "Bể bơi Olympic 50m (Trong nhà)" },
          "status": { "type": "string", "enum": ["CONFIRMED", "CANCELLED"], "example": "CONFIRMED" },
          "createdAt": { "type": "string", "example": "2026-10-02 08:00:00" }
        }
      },
      "BookingCreateRequest": {
        "type": "object",
        "required": ["memberId", "classId"],
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "classId": { "type": "string", "example": "cls-01" },
          "bookingDate": { "type": "string", "example": "2026-10-02" }
        }
      },
      "BookingCancelRequest": {
        "type": "object",
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-01" }
        }
      },
      "CounterPackageRegisterRequest": {
        "type": "object",
        "required": ["memberId", "packageId"],
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-03" },
          "packageId": { "type": "string", "example": "pkg-pro" },
          "paymentMethod": { "type": "string", "enum": ["TIỀN MẶT", "CHUYỂN KHOẢN", "THẺ VISA/MASTER"], "example": "TIỀN MẶT" }
        }
      },
      "OnlineSubscribeRequest": {
        "type": "object",
        "required": ["memberId", "packageId"],
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "packageId": { "type": "string", "example": "pkg-all-access" },
          "paymentMethod": { "type": "string", "enum": ["VNPAY", "MOMO", "THẺ QUỐC TẾ"], "example": "VNPAY" }
        }
      },
      "CheckInRequest": {
        "type": "object",
        "required": ["memberId"],
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "receptionistName": { "type": "string", "example": "Lê Thị Thu Thảo" }
        }
      },
      "CheckInRecord": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "chk-1727681122" },
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
          "memberCode": { "type": "string", "example": "MEM-8899" },
          "packageName": { "type": "string", "example": "Gói All-Access Olympic Pass" },
          "checkInTime": { "type": "string", "example": "02/10/2026 08:15:20" },
          "status": { "type": "string", "example": "SUCCESS" },
          "receptionistName": { "type": "string", "example": "Lê Thị Thu Thảo" }
        }
      },
      "TrainingPlan": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "tp-172768001" },
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "sportName": { "type": "string", "example": "Bơi lội" },
          "isCustom": { "type": "boolean", "description": "false: Giáo án chung của lớp | true: Giáo án riêng cá nhân hóa cho học viên", "example": false },
          "targetType": { "type": "string", "enum": ["CLASS", "MEMBER"], "example": "CLASS" },
          "memberId": { "type": "string", "nullable": true, "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Tất cả học viên trong lớp" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "title": { "type": "string", "example": "Giáo án Tối ưu sải bơi 50m & Thể lực 8 tuần" },
          "fitnessCondition": { "type": "string", "example": "Thể trạng chuẩn theo lớp" },
          "goal": { "type": "string", "example": "Cải thiện nhịp thở ly tâm, tăng sức bền bơi lội" },
          "startDate": { "type": "string", "example": "2026-10-02" },
          "endDate": { "type": "string", "example": "2026-10-30" },
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "example": "Khởi động xoay khớp & bơi thả lỏng" },
                "sets": { "type": "string", "example": "2" },
                "reps": { "type": "string", "example": "100m" },
                "note": { "type": "string", "example": "Làm nóng toàn thân" }
              }
            }
          },
          "status": { "type": "string", "example": "ACTIVE" },
          "createdAt": { "type": "string", "example": "2026-10-02" }
        }
      },
      "TrainingPlanClassCreateRequest": {
        "type": "object",
        "required": ["classId", "title", "goal"],
        "properties": {
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "sportName": { "type": "string", "example": "Bơi lội" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "title": { "type": "string", "example": "Giáo án Tối ưu sải bơi 50m & Thể lực" },
          "goal": { "type": "string", "example": "Tăng sức bền, cải thiện nhịp thở ly tâm" },
          "startDate": { "type": "string", "example": "2026-10-02" },
          "endDate": { "type": "string", "example": "2026-10-30" },
          "isCustom": { "type": "boolean", "default": false, "example": false },
          "targetType": { "type": "string", "default": "CLASS", "example": "CLASS" },
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "example": "Khởi động xoay khớp & bơi nhẹ" },
                "sets": { "type": "string", "example": "2" },
                "reps": { "type": "string", "example": "5 phút" },
                "note": { "type": "string", "example": "Làm nóng hệ cơ vai" }
              }
            }
          }
        }
      },
      "PersonalTrainingPlanRequest": {
        "type": "object",
        "required": ["classId", "memberId", "title", "goal"],
        "properties": {
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "sportName": { "type": "string", "example": "Bơi lội" },
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "title": { "type": "string", "example": "Giáo án riêng biệt: Phạm Thanh (Tải trọng khớp vai nhẹ)" },
          "fitnessCondition": { "type": "string", "example": "Khớp vai từng mỏi cơ nhẹ sau các cự ly bơi dài" },
          "goal": { "type": "string", "example": "Tối ưu hóa thể lực riêng, tránh quá tải khớp vai" },
          "startDate": { "type": "string", "example": "2026-10-02" },
          "endDate": { "type": "string", "example": "2026-10-30" },
          "exercises": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "example": "Khởi động xoay khớp có kiểm soát" },
                "sets": { "type": "string", "example": "2" },
                "reps": { "type": "string", "example": "5 phút" },
                "note": { "type": "string", "example": "Kéo giãn nhẹ nhàng" }
              }
            }
          }
        }
      },
      "DeletePersonalPlanRequest": {
        "type": "object",
        "required": ["classId", "memberId"],
        "properties": {
          "classId": { "type": "string", "example": "cls-01" },
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" }
        }
      },
      "ProgressRecord": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "prog-172768001" },
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "date": { "type": "string", "example": "2026-10-02" },
          "weight": { "type": "number", "example": 68.5 },
          "bodyFat": { "type": "number", "example": 16.2 },
          "muscleMass": { "type": "number", "example": 34.1 },
          "notes": { "type": "string", "example": "Chỉ số mỡ giảm tốt, cơ bắp phục hồi nhanh" }
        }
      },
      "ProgressCreateRequest": {
        "type": "object",
        "required": ["memberId", "weight", "bodyFat", "muscleMass"],
        "properties": {
          "memberId": { "type": "string", "example": "usr-mem-01" },
          "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "date": { "type": "string", "example": "2026-10-02" },
          "weight": { "type": "number", "example": 68.5 },
          "bodyFat": { "type": "number", "example": 16.2 },
          "muscleMass": { "type": "number", "example": 34.1 },
          "notes": { "type": "string", "example": "Tiến độ giảm mỡ và tăng cơ phục hồi rất tích cực" }
        }
      },
      "AttendanceRequest": {
        "type": "object",
        "required": ["classId", "records"],
        "properties": {
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "memberId": { "type": "string", "example": "usr-mem-01" },
                "memberName": { "type": "string", "example": "Phạm Thanh Hội Viên" },
                "status": { "type": "string", "enum": ["PRESENT", "ABSENT"], "example": "PRESENT" }
              }
            }
          }
        }
      },
      "NotificationCreateRequest": {
        "type": "object",
        "required": ["classId", "title", "content"],
        "properties": {
          "classId": { "type": "string", "example": "cls-01" },
          "className": { "type": "string", "example": "Lớp Bơi Bướm Nâng Cao" },
          "coachId": { "type": "string", "example": "usr-coa-01" },
          "coachName": { "type": "string", "example": "Nguyễn Văn Huấn" },
          "title": { "type": "string", "example": "Bài tập tự rèn luyện kỹ thuật tay quạt nước" },
          "content": { "type": "string", "example": "Học viên xem video đính kèm và thực hiện 3 hiệp 50m biến tốc trước buổi thứ 6 nhé." }
        }
      },
      "AIRecommendPlanRequest": {
        "type": "object",
        "required": ["memberName", "fitnessGoal", "currentLevel"],
        "properties": {
          "memberName": { "type": "string", "example": "Phạm Thanh" },
          "fitnessGoal": { "type": "string", "example": "Tăng sức bền bơi lội & Săn chắc cơ bắp" },
          "currentLevel": { "type": "string", "example": "Trung cấp" },
          "notes": { "type": "string", "example": "Khớp vai từng mỏi sau các cự ly bơi dài" }
        }
      },
      "AIMemberAskRequest": {
        "type": "object",
        "required": ["question"],
        "properties": {
          "question": { "type": "string", "example": "Trước buổi tập bơi 45 phút tôi nên ăn gì để không bị chuột rút?" },
          "memberName": { "type": "string", "example": "Phạm Thanh" }
        }
      },
      "ReportOverview": {
        "type": "object",
        "properties": {
          "totalMembers": { "type": "integer", "example": 380 },
          "activeMembers": { "type": "integer", "example": 310 },
          "totalCoaches": { "type": "integer", "example": 12 },
          "totalClasses": { "type": "integer", "example": 24 },
          "totalBookings": { "type": "integer", "example": 156 },
          "todayCheckins": { "type": "integer", "example": 85 },
          "occupancyRate": { "type": "integer", "example": 78 },
          "monthlyRevenue": { "type": "number", "example": 148500000 },
          "revenueGrowth": { "type": "string", "example": "+18.4%" },
          "packageDistribution": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "example": "All-Access Olympic" },
                "count": { "type": "integer", "example": 42 },
                "percentage": { "type": "integer", "example": 35 }
              }
            }
          }
        }
      },
      "AuditLog": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "aud-1727689999" },
          "timestamp": { "type": "string", "example": "02/10/2026 14:30:15" },
          "userName": { "type": "string", "example": "Trần Văn Quản Lý" },
          "role": { "type": "string", "example": "MANAGER" },
          "action": { "type": "string", "example": "CREATE_CLASS" },
          "details": { "type": "string", "example": "Mở lớp học thể thao mới: Lớp Bơi Bướm Nâng Cao" }
        }
      },
      "Sport": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "example": "boi-loi" },
          "name": { "type": "string", "example": "Bơi lội" },
          "icon": { "type": "string", "example": "pool" },
          "venue": { "type": "string", "example": "Bể bơi 4 mùa 50m Olympic" },
          "category": { "type": "string", "example": "Sức bền & Tĩnh tâm" }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "message": { "type": "string", "example": "Nội dung thông báo lỗi chi tiết từ máy chủ" }
        }
      }
    }
  },
  "paths": {
    "/auth/login": {
      "post": {
        "tags": ["1. Authentication"],
        "summary": "Đăng nhập tài khoản bằng Email + Mật khẩu",
        "description": "Xác thực tài khoản và trả về JWT Bearer Token kèm thông tin người dùng (Role: MANAGER, RECEPTIONIST, COACH, MEMBER).",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LoginRequest" } } }
        },
        "responses": {
          "200": {
            "description": "Đăng nhập thành công, trả về JWT Token và User Profile",
            "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LoginResponse" } } }
          },
          "400": { "description": "Email không tồn tại hoặc sai mật khẩu", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } },
          "403": { "description": "Tài khoản bị tạm khóa", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/register": {
      "post": {
        "tags": ["1. Authentication"],
        "summary": "Đăng ký tài khoản hội viên mới",
        "description": "Tạo tài khoản hội viên (Role: MEMBER) với mã thẻ sinh tự động (MEM-XXXX).",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/RegisterRequest" } } }
        },
        "responses": {
          "201": { "description": "Đăng ký tài khoản thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } },
          "400": { "description": "Email đã được sử dụng", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/google": {
      "post": {
        "tags": ["1. Authentication"],
        "summary": "Đăng nhập hoặc tự động tạo tài khoản qua Google OAuth",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/GoogleAuthRequest" } } }
        },
        "responses": {
          "200": { "description": "Đăng nhập Google thành công, trả về JWT Token và User profile", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LoginResponse" } } } }
        }
      }
    },
    "/auth/reset-password": {
      "post": {
        "tags": ["1. Authentication"],
        "summary": "Khôi phục mật khẩu thông qua mã OTP",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ResetPasswordRequest" } } }
        },
        "responses": {
          "200": { "description": "Khôi phục mật khẩu thành công" },
          "400": { "description": "Mã OTP không hợp lệ hoặc email không tồn tại", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/users/{id}/profile": {
      "get": {
        "tags": ["2. User & Account"],
        "summary": "Lấy thông tin cá nhân của người dùng",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mgr-01" }
        ],
        "responses": {
          "200": { "description": "Thông tin cá nhân người dùng", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } },
          "404": { "description": "Không tìm thấy người dùng" }
        }
      },
      "put": {
        "tags": ["2. User & Account"],
        "summary": "Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mgr-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/UpdateProfileRequest" } } }
        },
        "responses": {
          "200": { "description": "Cập nhật thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } }
        }
      }
    },
    "/users/{id}/change-password": {
      "put": {
        "tags": ["2. User & Account"],
        "summary": "Đổi mật khẩu người dùng",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mgr-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ChangePasswordRequest" } } }
        },
        "responses": {
          "200": { "description": "Đổi mật khẩu thành công" },
          "400": { "description": "Mật khẩu hiện tại không chính xác", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/staff": {
      "get": {
        "tags": ["3. Staff Management"],
        "summary": "Lấy danh sách toàn bộ nhân sự (Coach, Receptionist, Manager)",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Danh sách nhân viên", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/User" } } } } }
        }
      },
      "post": {
        "tags": ["3. Staff Management"],
        "summary": "Tạo nhân viên mới hoặc bổ nhiệm hội viên lên nhân sự",
        "description": "RÀNG BUỘC NGHIỆP VỤ: Quản lý chỉ được phép cấp vai trò COACH hoặc RECEPTIONIST. Nghiêm cấm cấp vai trò MANAGER qua luồng này!",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/StaffCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Tạo hoặc bổ nhiệm nhân sự thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } },
          "400": { "description": "Cố tình cấp role MANAGER hoặc thiếu chuyên môn HLV", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/staff/available-members": {
      "get": {
        "tags": ["3. Staff Management"],
        "summary": "Tìm kiếm hội viên đủ điều kiện để bổ nhiệm làm nhân sự",
        "description": "Tìm kiếm theo từ khóa họ tên, SĐT, email hoặc mã hội viên (MEM-XXXX).",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "query", "in": "query", "required": false, "schema": { "type": "string" }, "description": "Từ khóa tìm kiếm tên, SĐT, email, mã thẻ", "example": "Phạm" }
        ],
        "responses": {
          "200": { "description": "Danh sách hội viên thỏa điều kiện", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/User" } } } } }
        }
      }
    },
    "/staff/{id}": {
      "put": {
        "tags": ["3. Staff Management"],
        "summary": "Cập nhật thông tin nhân viên (Chuyên môn, Bằng cấp)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-coa-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/StaffUpdateRequest" } } }
        },
        "responses": {
          "200": { "description": "Cập nhật thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } }
        }
      }
    },
    "/staff/{id}/toggle-status": {
      "patch": {
        "tags": ["3. Staff Management"],
        "summary": "Kích hoạt / Tạm khóa tài khoản nhân viên",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-coa-01" }
        ],
        "responses": {
          "200": { "description": "Chuyển trạng thái thành công (ACTIVE <-> INACTIVE)", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/User" } } } }
        }
      }
    },
    "/reception/members/lookup": {
      "get": {
        "tags": ["4. Member Operations"],
        "summary": "Tra cứu hồ sơ hội viên theo tên, SĐT, Email hoặc Mã thẻ",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "query", "in": "query", "required": false, "schema": { "type": "string" }, "example": "MEM-8899" }
        ],
        "responses": {
          "200": { "description": "Danh sách hội viên phù hợp", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/User" } } } } }
        }
      }
    },
    "/members/{memberId}/progress": {
      "get": {
        "tags": ["4. Member Operations"],
        "summary": "Hội viên xem lịch sử chỉ số thể lực cá nhân (InBody)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "memberId", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mem-01" }
        ],
        "responses": {
          "200": { "description": "Danh sách chỉ số thể lực cá nhân", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/ProgressRecord" } } } } }
        }
      }
    },
    "/members/{memberId}/training-plans": {
      "get": {
        "tags": ["4. Member Operations"],
        "summary": "Hội viên xem giáo án tập luyện của mình",
        "description": "Ưu tiên trả về giáo án riêng cá nhân hóa nếu HLV đã thiết lập; đồng thời trả về giáo án chung của các lớp hội viên đã đăng ký.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "memberId", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mem-01" }
        ],
        "responses": {
          "200": { "description": "Danh sách giáo án cá nhân và lớp", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/TrainingPlan" } } } } }
        }
      }
    },
    "/members/ai/ask": {
      "post": {
        "tags": ["4. Member Operations"],
        "summary": "Hỏi đáp dinh dưỡng & tập luyện với Trợ lý Thể thao AI SCMS",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/AIMemberAskRequest" } } }
        },
        "responses": {
          "200": { "description": "Câu trả lời chuyên môn từ Trợ lý AI", "content": { "application/json": { "schema": { "type": "string", "example": "Chào bạn! Trước buổi tập bơi..." } } } }
        }
      }
    },
    "/packages": {
      "get": {
        "tags": ["5. Membership Packages"],
        "summary": "Lấy danh sách các gói tập của trung tâm",
        "responses": {
          "200": { "description": "Danh sách gói tập", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Package" } } } } }
        }
      },
      "post": {
        "tags": ["5. Membership Packages"],
        "summary": "Tạo gói tập thể thao mới (Dành cho Quản lý)",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PackageCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Tạo gói tập thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Package" } } } }
        }
      }
    },
    "/packages/{id}": {
      "put": {
        "tags": ["5. Membership Packages"],
        "summary": "Cập nhật thông tin gói tập",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "pkg-basic" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PackageCreateRequest" } } }
        },
        "responses": {
          "200": { "description": "Cập nhật gói tập thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Package" } } } }
        }
      }
    },
    "/packages/{id}/toggle-status": {
      "patch": {
        "tags": ["5. Membership Packages"],
        "summary": "Bật / Tắt trạng thái gói tập",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "pkg-basic" }
        ],
        "responses": {
          "200": { "description": "Chuyển trạng thái gói tập thành công" }
        }
      }
    },
    "/members/packages/subscribe": {
      "post": {
        "tags": ["6. Payment & Subscription"],
        "summary": "Hội viên đăng ký mua gói tập trực tuyến (VNPAY / Momo / Thẻ)",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/OnlineSubscribeRequest" } } }
        },
        "responses": {
          "200": {
            "description": "Thanh toán & kích hoạt gói thành công",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "transactionRef": { "type": "string", "example": "ONL-729182" },
                    "member": { "$ref": "#/components/schemas/User" },
                    "package": { "$ref": "#/components/schemas/Package" },
                    "paymentMethod": { "type": "string", "example": "VNPAY" },
                    "amount": { "type": "number", "example": 5800000 }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/reception/packages/register": {
      "post": {
        "tags": ["6. Payment & Subscription"],
        "summary": "Đăng ký hoặc gia hạn gói tập tại quầy lễ tân (Tiền mặt / Thẻ)",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CounterPackageRegisterRequest" } } }
        },
        "responses": {
          "200": {
            "description": "Đăng ký và in biên lai giao dịch thành công",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "transactionRef": { "type": "string", "example": "TXN-839201" },
                    "member": { "$ref": "#/components/schemas/User" },
                    "package": { "$ref": "#/components/schemas/Package" },
                    "paymentMethod": { "type": "string", "example": "TIỀN MẶT" },
                    "amount": { "type": "number", "example": 1800000 },
                    "registeredAt": { "type": "string", "example": "02/10/2026 15:00:00" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/classes": {
      "get": {
        "tags": ["7. Classes & Schedules"],
        "summary": "Lấy danh sách tất cả lớp học thể thao",
        "responses": {
          "200": { "description": "Danh sách lớp học", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Class" } } } } }
        }
      },
      "post": {
        "tags": ["7. Classes & Schedules"],
        "summary": "Mở lớp học thể thao mới (Ràng buộc: sức chứa không vượt quá phòng)",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ClassCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Mở lớp thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Class" } } } },
          "400": { "description": "Sức chứa lớp vượt quá sức chứa phòng tập", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/classes/{id}": {
      "put": {
        "tags": ["7. Classes & Schedules"],
        "summary": "Cập nhật thông tin lớp học",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "cls-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ClassCreateRequest" } } }
        },
        "responses": {
          "200": { "description": "Cập nhật lớp học thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Class" } } } }
        }
      }
    },
    "/classes/{id}/assign-coach": {
      "put": {
        "tags": ["7. Classes & Schedules"],
        "summary": "Phân công HLV cho lớp (Kiểm tra xung đột lịch dạy)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "cls-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/AssignCoachRequest" } } }
        },
        "responses": {
          "200": { "description": "Phân công HLV thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Class" } } } },
          "400": { "description": "HLV bị trùng lịch với lớp khác", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/rooms": {
      "get": {
        "tags": ["8. Training Rooms & Facilities"],
        "summary": "Lấy danh sách 9 cụm sân bãi & phòng tập tiêu chuẩn Olympic",
        "responses": {
          "200": { "description": "Danh sách phòng tập & sân bãi", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Room" } } } } }
        }
      },
      "post": {
        "tags": ["8. Training Rooms & Facilities"],
        "summary": "Tạo cụm sân / phòng tập mới",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/RoomCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Tạo sân bãi thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Room" } } } }
        }
      }
    },
    "/rooms/{id}": {
      "put": {
        "tags": ["8. Training Rooms & Facilities"],
        "summary": "Cập nhật thông tin phòng tập / sân bãi",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "room-01" }
        ],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/RoomCreateRequest" } } }
        },
        "responses": {
          "200": { "description": "Cập nhật thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Room" } } } }
        }
      }
    },
    "/coach/classes/{classId}/members": {
      "get": {
        "tags": ["9. Coach Operations"],
        "summary": "Lấy danh sách học viên trong một lớp cụ thể",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "classId", "in": "path", "required": true, "schema": { "type": "string" }, "example": "cls-01" }
        ],
        "responses": {
          "200": { "description": "Danh sách học viên", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/User" } } } } }
        }
      }
    },
    "/coach/classes-with-members": {
      "get": {
        "tags": ["9. Coach Operations"],
        "summary": "Lấy các lớp phụ trách kèm danh sách học viên đăng ký",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "coachId", "in": "query", "required": false, "schema": { "type": "string" }, "example": "usr-coa-01" },
          { "name": "coachName", "in": "query", "required": false, "schema": { "type": "string" }, "example": "Nguyễn Văn Huấn" },
          { "name": "isManager", "in": "query", "required": false, "schema": { "type": "boolean" }, "example": false }
        ],
        "responses": {
          "200": { "description": "Danh sách lớp học kèm mảng members" }
        }
      }
    },
    "/coach/notifications": {
      "get": {
        "tags": ["9. Coach Operations"],
        "summary": "Xem danh sách thông báo và bài tập HLV đã gửi",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Danh sách bài tập và thông báo" }
        }
      },
      "post": {
        "tags": ["9. Coach Operations"],
        "summary": "Gửi bài tập / thông báo tới lớp học viên",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/NotificationCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Gửi thông báo thành công" }
        }
      }
    },
    "/coach/ai/recommend-plan": {
      "post": {
        "tags": ["9. Coach Operations"],
        "summary": "Gợi ý giáo án thể thao thông minh từ AI theo thể trạng học viên",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/AIRecommendPlanRequest" } } }
        },
        "responses": {
          "200": { "description": "Giáo án AI cá nhân hóa với bài tập, sets, reps và dinh dưỡng" }
        }
      }
    },
    "/bookings": {
      "post": {
        "tags": ["10. Booking Operations"],
        "summary": "Hội viên đặt chỗ tham gia lớp học thể thao",
        "description": "Điều kiện kiểm tra: (1) Hội viên có gói tập ACTIVE; (2) Lớp còn chỗ trống; (3) Chưa đặt lớp này trước đó. Tự động tăng enrolledCount của lớp.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/BookingCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Đặt chỗ thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Booking" } } } },
          "400": { "description": "Lớp đã đầy, gói tập hết hạn hoặc đã đặt lớp này", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/bookings/member/{memberId}": {
      "get": {
        "tags": ["10. Booking Operations"],
        "summary": "Lấy lịch sử và danh sách đặt chỗ của một hội viên",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "memberId", "in": "path", "required": true, "schema": { "type": "string" }, "example": "usr-mem-01" }
        ],
        "responses": {
          "200": { "description": "Danh sách các lượt đặt chỗ của hội viên", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Booking" } } } } }
        }
      }
    },
    "/bookings/{id}/cancel": {
      "post": {
        "tags": ["10. Booking Operations"],
        "summary": "Hủy đặt chỗ lớp học (Tự động hoàn trả slot cho lớp)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "bkg-01" }
        ],
        "requestBody": {
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/BookingCancelRequest" } } }
        },
        "responses": {
          "200": { "description": "Hủy đặt chỗ thành công, số lượng đăng ký lớp giảm 1", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Booking" } } } }
        }
      }
    },
    "/reception/check-in": {
      "post": {
        "tags": ["11. Attendance & Gate Check-in"],
        "summary": "Quét thẻ / Check-in hội viên vào cổng tập luyện tại quầy lễ tân",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CheckInRequest" } } }
        },
        "responses": {
          "200": { "description": "Check-in hợp lệ qua cổng", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CheckInRecord" } } } },
          "400": { "description": "Gói tập hội viên đã hết hạn hoặc tài khoản bị khóa", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/reception/check-in/history": {
      "get": {
        "tags": ["11. Attendance & Gate Check-in"],
        "summary": "Lấy lịch sử check-in trong ngày tại cổng trung tâm",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Danh sách check-in trong ngày", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/CheckInRecord" } } } } }
        }
      }
    },
    "/coach/attendance": {
      "post": {
        "tags": ["11. Attendance & Gate Check-in"],
        "summary": "Điểm danh học viên theo buổi học của HLV",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/AttendanceRequest" } } }
        },
        "responses": {
          "200": { "description": "Lưu điểm danh buổi học thành công" }
        }
      }
    },
    "/coach/training-plans": {
      "get": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Lấy danh sách tất cả các giáo án tập luyện (Hỗ trợ lọc theo lớp)",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "classId", "in": "query", "required": false, "schema": { "type": "string" }, "description": "Lọc giáo án theo ID lớp học", "example": "cls-01" }
        ],
        "responses": {
          "200": { "description": "Danh sách giáo án chung và riêng", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/TrainingPlan" } } } } }
        }
      },
      "post": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Thiết lập giáo án chung cho toàn bộ học viên trong lớp",
        "description": "Tạo giáo án rèn luyện chung cho cả lớp (isCustom = false). Tất cả học viên đăng ký lớp sẽ học theo giáo án này nếu chưa có giáo án riêng.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/TrainingPlanClassCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Tạo giáo án chung cho lớp thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/TrainingPlan" } } } }
        }
      }
    },
    "/coach/training-plans/personal": {
      "post": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Thiết lập hoặc cập nhật giáo án riêng cá nhân hóa cho học viên đặc biệt",
        "description": "Tạo hoặc cập nhật giáo án riêng cho 1 học viên cụ thể (isCustom = true). Học viên có giáo án riêng sẽ được đánh dấu ngôi sao vàng phát sáng ⭐ trên giao diện.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PersonalTrainingPlanRequest" } } }
        },
        "responses": {
          "200": { "description": "Lưu giáo án riêng thành công (Gắn sao ⭐)", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/TrainingPlan" } } } }
        }
      },
      "delete": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Hủy giáo án riêng của học viên (Học viên tự động quay lại áp dụng giáo án chung của lớp)",
        "description": "Xóa giáo án riêng của học viên trong lớp. Học viên quay về học theo giáo án chung của lớp, ngôi sao trở về trạng thái rỗng.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "classId", "in": "query", "required": true, "schema": { "type": "string" }, "example": "cls-01" },
          { "name": "memberId", "in": "query", "required": true, "schema": { "type": "string" }, "example": "usr-mem-01" }
        ],
        "responses": {
          "200": {
            "description": "Hủy giáo án riêng thành công, quay về giáo án chung",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "message": { "type": "string", "example": "Đã huỷ giáo án riêng của học viên. Học viên sẽ quay về áp dụng giáo án chung của lớp." }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/coach/training-plans/{id}": {
      "delete": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Xóa giáo án khỏi hệ thống",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "example": "tp-172768001" }
        ],
        "responses": {
          "200": { "description": "Xóa giáo án thành công" },
          "404": { "description": "Không tìm thấy giáo án" }
        }
      }
    },
    "/coach/progress": {
      "get": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Lấy toàn bộ lịch sử chỉ số thể lực InBody của tất cả học viên",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Lịch sử thể lực", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/ProgressRecord" } } } } }
        }
      },
      "post": {
        "tags": ["12. Training Progress & Plans"],
        "summary": "Ghi nhận chỉ số thể lực InBody (Cân nặng, Cơ, Mỡ) cho hội viên",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ProgressCreateRequest" } } }
        },
        "responses": {
          "201": { "description": "Lưu chỉ số thể lực thành công", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ProgressRecord" } } } }
        }
      }
    },
    "/reports/overview": {
      "get": {
        "tags": ["13. Reports, System & Master Data"],
        "summary": "Thống kê tổng quan Dashboard Quản lý (Hội viên, Doanh thu, Tỷ lệ lấp đầy)",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Dữ liệu báo cáo Dashboard", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ReportOverview" } } } }
        }
      }
    },
    "/system/audit-logs": {
      "get": {
        "tags": ["13. Reports, System & Master Data"],
        "summary": "Xem nhật ký hoạt động hệ thống (Audit Logs)",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Danh sách Audit Logs", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/AuditLog" } } } } }
        }
      }
    },
    "/system/permissions": {
      "get": {
        "tags": ["13. Reports, System & Master Data"],
        "summary": "Lấy ma trận phân quyền theo vai trò (Dynamic Capability Matrix)",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": { "description": "Ma trận phân quyền" }
        }
      }
    },
    "/system/permissions/{role}": {
      "put": {
        "tags": ["13. Reports, System & Master Data"],
        "summary": "Cập nhật danh sách quyền hạn cho một nhóm vai trò",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "role", "in": "path", "required": true, "schema": { "type": "string" }, "example": "COACH" }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "permissions": { "type": "array", "items": { "type": "string" }, "example": ["view_teaching_schedule", "view_class_members", "create_training_plan"] }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Cập nhật quyền thành công" }
        }
      }
    },
    "/sports": {
      "get": {
        "tags": ["13. Reports, System & Master Data"],
        "summary": "Lấy danh sách 15 môn thể thao trung tâm SCMS cung cấp",
        "responses": {
          "200": { "description": "Danh sách 15 môn thể thao", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Sport" } } } } }
        }
      }
    }
  }
};

// ============================================================================
// 2. POSTMAN COLLECTION GENERATION (v2.1.0)
// ============================================================================

function makeTestScript(name, checks = []) {
  const lines = [
    `pm.test("${name}", function () {`,
    `    pm.response.to.be.success;`,
    `});`,
    `pm.test("Response time is acceptable", function () {`,
    `    pm.expect(pm.response.responseTime).to.be.below(3000);`,
    `});`,
    `pm.test("Response body is valid JSON", function () {`,
    `    pm.response.to.be.json;`,
    `});`
  ];
  checks.forEach(c => lines.push(c));
  return {
    listen: "test",
    script: {
      exec: lines,
      type: "text/javascript"
    }
  };
}

const loginTestEvent = {
  listen: "test",
  script: {
    exec: [
      "pm.test(\"Status code is 200 OK\", function () {",
      "    pm.response.to.have.status(200);",
      "});",
      "",
      "var jsonData = pm.response.json();",
      "pm.test(\"Has token and user data\", function () {",
      "    pm.expect(jsonData).to.have.property(\"token\");",
      "    pm.expect(jsonData).to.have.property(\"user\");",
      "});",
      "",
      "// Tự động lưu JWT Token vào Postman Environment",
      "if (jsonData.token) {",
      "    pm.environment.set(\"token\", jsonData.token);",
      "    console.log(\"[SCMS Auth] Đã tự động cập nhật {{token}} thành công!\");",
      "}",
      "if (jsonData.user && jsonData.user.id) {",
      "    pm.environment.set(\"userId\", jsonData.user.id);",
      "    pm.environment.set(\"role\", jsonData.user.role);",
      "}"
    ],
    type: "text/javascript"
  }
};

const postmanCollection = {
  info: {
    name: "SCMS - Sports Center Management System API Collection",
    _postman_id: "scms-collection-v1",
    description: "Bộ Postman Collection hoàn chỉnh cho SCMS (Sports Center Management System).\nĐã đồng bộ các cập nhật 02/10/2026: Bổ nhiệm nhân sự (Role restriction), Giáo án chung & Giáo án riêng cá nhân hóa (gắn sao ⭐), Hủy giáo án riêng hoàn trả giáo án chung.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{token}}",
        type: "string"
      }
    ]
  },
  item: [
    {
      name: "1. Authentication",
      description: "Các API xác thực, đăng nhập và đăng ký người dùng",
      item: [
        {
          name: "1.1 Đăng nhập Quản lý (Login - Manager)",
          event: [loginTestEvent],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "manager@scms.vn", password: "password123" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] },
            description: "Đăng nhập vai trò Manager. Test script sẽ tự động trích xuất token vào biến {{token}}."
          }
        },
        {
          name: "1.2 Đăng nhập Huấn luyện viên (Login - Coach)",
          event: [loginTestEvent],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "coach@scms.vn", password: "password123" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "1.3 Đăng nhập Lễ tân (Login - Receptionist)",
          event: [loginTestEvent],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "receptionist@scms.vn", password: "password123" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "1.4 Đăng nhập Hội viên (Login - Member)",
          event: [loginTestEvent],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "member@scms.vn", password: "password123" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
          }
        },
        {
          name: "1.5 Đăng ký Hội viên mới (Register Member)",
          event: [makeTestScript("Đăng ký thành công")],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                fullName: "Nguyễn Văn Mới Test",
                email: "member.test." + Date.now() + "@gmail.com",
                phone: "0912888999",
                password: "password123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/register", host: ["{{baseUrl}}"], path: ["auth", "register"] }
          }
        },
        {
          name: "1.6 Đăng nhập bằng Google OAuth (Google Auth)",
          event: [loginTestEvent],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "member.google@gmail.com",
                fullName: "Nguyễn Google OAuth",
                avatar: "https://lh3.googleusercontent.com/a/default-user"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/google", host: ["{{baseUrl}}"], path: ["auth", "google"] }
          }
        },
        {
          name: "1.7 Khôi phục mật khẩu qua OTP (Reset Password)",
          event: [makeTestScript("Khôi phục mật khẩu thành công")],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "member@scms.vn",
                otp: "123456",
                newPassword: "newpassword123"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/auth/reset-password", host: ["{{baseUrl}}"], path: ["auth", "reset-password"] }
          }
        }
      ]
    },
    {
      name: "2. User & Account",
      description: "Xem và cập nhật thông tin cá nhân, đổi mật khẩu",
      item: [
        {
          name: "2.1 Lấy thông tin cá nhân (Get User Profile)",
          event: [makeTestScript("Lấy Profile thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/users/{{userId}}/profile", host: ["{{baseUrl}}"], path: ["users", "{{userId}}", "profile"] }
          }
        },
        {
          name: "2.2 Cập nhật thông tin cá nhân (Update Profile)",
          event: [makeTestScript("Cập nhật Profile thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                fullName: "Trần Văn Quản Lý (Đã cập nhật)",
                phone: "0987111222",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/users/{{userId}}/profile", host: ["{{baseUrl}}"], path: ["users", "{{userId}}", "profile"] }
          }
        },
        {
          name: "2.3 Đổi mật khẩu (Change Password)",
          event: [makeTestScript("Đổi mật khẩu thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                currentPassword: "password123",
                newPassword: "newpassword456"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/users/{{userId}}/change-password", host: ["{{baseUrl}}"], path: ["users", "{{userId}}", "change-password"] }
          }
        }
      ]
    },
    {
      name: "3. Staff Management",
      description: "Phân hệ quản lý nhân sự: Bổ nhiệm hội viên (Role restriction: COACH/RECEPTIONIST), Tạo mới nhân sự, Cập nhật thông tin",
      item: [
        {
          name: "3.1 Lấy danh sách nhân viên (Get All Staff)",
          event: [makeTestScript("Lấy danh sách nhân viên thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/staff", host: ["{{baseUrl}}"], path: ["staff"] }
          }
        },
        {
          name: "3.2 Tìm hội viên để bổ nhiệm nhân sự (Get Available Members)",
          event: [makeTestScript("Tìm kiếm thành công")],
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/staff/available-members?query=Phạm",
              host: ["{{baseUrl}}"],
              path: ["staff", "available-members"],
              query: [{ key: "query", value: "Phạm" }]
            },
            description: "Tìm kiếm hội viên có sẵn trong hệ thống theo Tên, Email, SĐT, Mã thẻ MEM-xxxx để bổ nhiệm làm nhân sự."
          }
        },
        {
          name: "3.3 Bổ nhiệm hội viên làm Huấn luyện viên (Promote Member to COACH)",
          event: [makeTestScript("Bổ nhiệm HLV thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-01",
                role: "COACH",
                phone: "0912345678",
                specialty: "Cầu lông & Bơi lội",
                certification: "BWF Level 1 & FINA Coach"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/staff", host: ["{{baseUrl}}"], path: ["staff"] },
            description: "Bổ nhiệm hội viên lên COACH. Mã dự kiến sinh dạng usr-coa-XX. Specialty & Certification là bắt buộc."
          }
        },
        {
          name: "3.4 Bổ nhiệm hội viên làm Lễ tân (Promote Member to RECEPTIONIST)",
          event: [makeTestScript("Bổ nhiệm Lễ tân thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-02",
                role: "RECEPTIONIST",
                phone: "0909123987"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/staff", host: ["{{baseUrl}}"], path: ["staff"] },
            description: "Bổ nhiệm hội viên lên RECEPTIONIST. Mã dự kiến sinh dạng usr-rec-XX."
          }
        },
        {
          name: "3.5 Tạo nhân viên mới hoàn toàn (Create New Staff)",
          event: [makeTestScript("Tạo nhân sự thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                fullName: "Vũ Đình Trọng",
                email: "coach.trong@scms.vn",
                password: "password123",
                role: "COACH",
                phone: "0988776655",
                specialty: "Cầu lông BWF & Tennis",
                certification: "BWF Level 2 Trainer"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/staff", host: ["{{baseUrl}}"], path: ["staff"] }
          }
        },
        {
          name: "3.6 Cập nhật thông tin nhân viên (Update Staff)",
          event: [makeTestScript("Cập nhật nhân viên thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                fullName: "Nguyễn Văn Huấn (Trưởng ban HLV)",
                phone: "0987555666",
                specialty: "Bơi lội Olympic 50m & Gym Thể Hình",
                certification: "AFC Level A, NASM-CPT"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/staff/{{coachId}}", host: ["{{baseUrl}}"], path: ["staff", "{{coachId}}"] }
          }
        },
        {
          name: "3.7 Khóa / Mở khóa nhân viên (Toggle Staff Status)",
          event: [makeTestScript("Đổi trạng thái nhân viên thành công")],
          request: {
            method: "PATCH",
            url: { raw: "{{baseUrl}}/staff/{{coachId}}/toggle-status", host: ["{{baseUrl}}"], path: ["staff", "{{coachId}}", "toggle-status"] }
          }
        }
      ]
    },
    {
      name: "4. Member Operations",
      description: "Tra cứu hội viên, theo dõi tiến độ và Trợ lý AI",
      item: [
        {
          name: "4.1 Tra cứu hồ sơ hội viên (Lookup Member)",
          event: [makeTestScript("Tra cứu hội viên thành công")],
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/reception/members/lookup?query=MEM-8899",
              host: ["{{baseUrl}}"],
              path: ["reception", "members", "lookup"],
              query: [{ key: "query", value: "MEM-8899" }]
            }
          }
        },
        {
          name: "4.2 Xem chỉ số thể lực cá nhân (Get Member Progress)",
          event: [makeTestScript("Lấy chỉ số InBody thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/members/{{memberId}}/progress", host: ["{{baseUrl}}"], path: ["members", "{{memberId}}", "progress"] }
          }
        },
        {
          name: "4.3 Xem giáo án rèn luyện cá nhân (Get Member Plans)",
          event: [makeTestScript("Lấy giáo án thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/members/{{memberId}}/training-plans", host: ["{{baseUrl}}"], path: ["members", "{{memberId}}", "training-plans"] },
            description: "Lấy danh sách giáo án của hội viên: tự động ưu tiên giáo án riêng cá nhân hóa nếu có; đồng thời lấy tất cả giáo án chung của các lớp hội viên đã đăng ký."
          }
        },
        {
          name: "4.4 Hỏi đáp cùng Trợ lý Thể thao AI (Ask AI Assistant)",
          event: [makeTestScript("Nhận phản hồi từ AI thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                question: "Trước buổi bơi 45 phút tôi nên nạp dinh dưỡng thế nào để duy trì thể lực tốt nhất?",
                memberName: "Phạm Thanh"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/members/ai/ask", host: ["{{baseUrl}}"], path: ["members", "ai", "ask"] }
          }
        }
      ]
    },
    {
      name: "5. Membership Packages",
      description: "Danh sách và quản trị các gói tập thể thao SCMS",
      item: [
        {
          name: "5.1 Lấy danh sách gói tập (Get All Packages)",
          event: [makeTestScript("Lấy gói tập thành công")],
          request: {
            auth: { type: "noauth" },
            method: "GET",
            url: { raw: "{{baseUrl}}/packages", host: ["{{baseUrl}}"], path: ["packages"] }
          }
        },
        {
          name: "5.2 Tạo gói tập mới (Create Package - Manager)",
          event: [makeTestScript("Tạo gói tập thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Gói Bơi & Cầu Lông Nâng Cao",
                durationDays: 60,
                price: 1350000,
                allowedSports: 2,
                description: "Rèn luyện thể lực phối hợp bể bơi Olympic và sân Taraflex",
                features: ["Sân cầu lông BWF", "Bể bơi 50m", "Tủ đồ cá nhân"],
                badge: "HOT"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/packages", host: ["{{baseUrl}}"], path: ["packages"] }
          }
        },
        {
          name: "5.3 Cập nhật gói tập (Update Package)",
          event: [makeTestScript("Cập nhật gói thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Gói Basic Thể Thao (Cập nhật)",
                durationDays: 30,
                price: 690000,
                allowedSports: 1,
                description: "Rèn luyện 1 bộ môn tự chọn, hỗ trợ người mới bắt đầu.",
                features: ["1 môn tự chọn", "Tủ đồ thông minh"]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/packages/{{packageId}}", host: ["{{baseUrl}}"], path: ["packages", "{{packageId}}"] }
          }
        },
        {
          name: "5.4 Bật / Tắt trạng thái gói (Toggle Package Status)",
          event: [makeTestScript("Đổi trạng thái gói thành công")],
          request: {
            method: "PATCH",
            url: { raw: "{{baseUrl}}/packages/{{packageId}}/toggle-status", host: ["{{baseUrl}}"], path: ["packages", "{{packageId}}", "toggle-status"] }
          }
        }
      ]
    },
    {
      name: "6. Payment & Subscription",
      description: "Thanh toán gói tập trực tuyến VNPAY và đăng ký tại quầy lễ tân",
      item: [
        {
          name: "6.1 Hội viên mua gói tập trực tuyến (Subscribe Online - VNPAY)",
          event: [makeTestScript("Thanh toán trực tuyến thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-01",
                packageId: "pkg-all-access",
                paymentMethod: "VNPAY"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/members/packages/subscribe", host: ["{{baseUrl}}"], path: ["members", "packages", "subscribe"] }
          }
        },
        {
          name: "6.2 Lễ tân đăng ký gói tập tại quầy (Counter Register Package)",
          event: [makeTestScript("Đăng ký quầy thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-03",
                packageId: "pkg-pro",
                paymentMethod: "TIỀN MẶT"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/reception/packages/register", host: ["{{baseUrl}}"], path: ["reception", "packages", "register"] }
          }
        }
      ]
    },
    {
      name: "7. Classes & Schedules",
      description: "Quản lý danh sách lớp học thể thao, lịch dạy và phân công HLV",
      item: [
        {
          name: "7.1 Lấy danh sách lớp học thể thao (Get All Classes)",
          event: [makeTestScript("Lấy danh sách lớp thành công")],
          request: {
            auth: { type: "noauth" },
            method: "GET",
            url: { raw: "{{baseUrl}}/classes", host: ["{{baseUrl}}"], path: ["classes"] }
          }
        },
        {
          name: "7.2 Mở lớp học thể thao mới (Create Class)",
          event: [makeTestScript("Mở lớp thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Lớp Yoga Bình Minh Tươi Trẻ",
                sportId: "yoga-pilates",
                sportName: "Yoga & Pilates",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                roomId: "room-09",
                roomName: "Phòng Yoga Zen & Máy Reformer",
                dayOfWeek: "Thứ 2, 4, 6",
                timeSlot: "05:30 - 06:30",
                capacity: 15
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/classes", host: ["{{baseUrl}}"], path: ["classes"] }
          }
        },
        {
          name: "7.3 Cập nhật thông tin lớp học (Update Class)",
          event: [makeTestScript("Cập nhật lớp thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Lớp Bơi Bướm Nâng Cao (Olympic)",
                sportId: "boi-loi",
                sportName: "Bơi lội",
                capacity: 20
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/classes/{{classId}}", host: ["{{baseUrl}}"], path: ["classes", "{{classId}}"] }
          }
        },
        {
          name: "7.4 Phân công HLV cho lớp (Assign Coach)",
          event: [makeTestScript("Phân công HLV thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ coachId: "usr-coa-02" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/classes/{{classId}}/assign-coach", host: ["{{baseUrl}}"], path: ["classes", "{{classId}}", "assign-coach"] }
          }
        }
      ]
    },
    {
      name: "8. Training Rooms & Facilities",
      description: "Quản lý 9 cụm sân bãi & phòng tập đạt tiêu chuẩn Olympic",
      item: [
        {
          name: "8.1 Lấy danh sách sân bãi & phòng tập (Get All Rooms)",
          event: [makeTestScript("Lấy danh sách phòng thành công")],
          request: {
            auth: { type: "noauth" },
            method: "GET",
            url: { raw: "{{baseUrl}}/rooms", host: ["{{baseUrl}}"], path: ["rooms"] }
          }
        },
        {
          name: "8.2 Tạo phòng tập / sân bãi mới (Create Room)",
          event: [makeTestScript("Tạo phòng tập thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Phòng Trượt Băng & Khúc Côn Cầu",
                type: "Sân băng",
                capacity: 30,
                status: "AVAILABLE",
                location: "Khu D - Tầng B1"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/rooms", host: ["{{baseUrl}}"], path: ["rooms"] }
          }
        },
        {
          name: "8.3 Cập nhật thông tin phòng tập (Update Room)",
          event: [makeTestScript("Cập nhật phòng thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Bể bơi Olympic 50m (Bảo trì nâng cấp)",
                type: "Bể bơi",
                capacity: 45,
                status: "AVAILABLE",
                location: "Khu A - Tầng 1"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/rooms/{{roomId}}", host: ["{{baseUrl}}"], path: ["rooms", "{{roomId}}"] }
          }
        }
      ]
    },
    {
      name: "9. Coach Operations",
      description: "Nghiệp vụ huấn luyện viên: Xem học viên, gửi bài tập và AI gợi ý giáo án",
      item: [
        {
          name: "9.1 Lấy danh sách học viên trong lớp (Get Class Members)",
          event: [makeTestScript("Lấy học viên lớp thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/coach/classes/{{classId}}/members", host: ["{{baseUrl}}"], path: ["coach", "classes", "{{classId}}", "members"] }
          }
        },
        {
          name: "9.2 Lấy các lớp phụ trách kèm học viên (Get Coach Classes & Members)",
          event: [makeTestScript("Lấy lớp và học viên thành công")],
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/coach/classes-with-members?coachId={{coachId}}",
              host: ["{{baseUrl}}"],
              path: ["coach", "classes-with-members"],
              query: [{ key: "coachId", value: "{{coachId}}" }]
            }
          }
        },
        {
          name: "9.3 Xem danh sách thông báo bài tập (Get Notifications)",
          event: [makeTestScript("Lấy thông báo thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/coach/notifications", host: ["{{baseUrl}}"], path: ["coach", "notifications"] }
          }
        },
        {
          name: "9.4 Gửi bài tập & thông báo tới lớp (Send Notification)",
          event: [makeTestScript("Gửi thông báo thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                classId: "cls-01",
                className: "Lớp Bơi Bướm Nâng Cao",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                title: "Bài tập rèn luyện nhịp thở ly tâm",
                content: "Các bạn học viên xem kỹ video hướng dẫn kỹ thuật gập người và hoàn thành bài tập khởi động trước 15 phút."
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/notifications", host: ["{{baseUrl}}"], path: ["coach", "notifications"] }
          }
        },
        {
          name: "9.5 Gợi ý giáo án thông minh từ AI (AI Recommend Plan)",
          event: [makeTestScript("AI tạo giáo án thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberName: "Phạm Thanh",
                fitnessGoal: "Tăng cơ bắp & Sức bền bơi lội",
                currentLevel: "Trung cấp",
                notes: "Khớp vai từng mỏi cơ nhẹ"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/ai/recommend-plan", host: ["{{baseUrl}}"], path: ["coach", "ai", "recommend-plan"] }
          }
        }
      ]
    },
    {
      name: "10. Booking Operations",
      description: "Hội viên đặt chỗ lớp học và hủy chỗ tự động hoàn trả slot",
      item: [
        {
          name: "10.1 Hội viên đặt chỗ lớp học (Book Class)",
          event: [makeTestScript("Đặt chỗ thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-01",
                classId: "cls-02",
                bookingDate: "2026-10-05"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/bookings", host: ["{{baseUrl}}"], path: ["bookings"] }
          }
        },
        {
          name: "10.2 Xem lịch sử đặt chỗ của hội viên (Get Member Bookings)",
          event: [makeTestScript("Lấy lịch sử đặt chỗ thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/bookings/member/{{memberId}}", host: ["{{baseUrl}}"], path: ["bookings", "member", "{{memberId}}"] }
          }
        },
        {
          name: "10.3 Hủy đặt chỗ lớp học (Cancel Booking)",
          event: [makeTestScript("Hủy đặt chỗ thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({ memberId: "usr-mem-01" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/bookings/{{bookingId}}/cancel", host: ["{{baseUrl}}"], path: ["bookings", "{{bookingId}}", "cancel"] }
          }
        }
      ]
    },
    {
      name: "11. Attendance & Gate Check-in",
      description: "Check-in quét thẻ tại quầy lễ tân và điểm danh buổi học của HLV",
      item: [
        {
          name: "11.1 Check-in hội viên vào cổng (Gate Check-In)",
          event: [makeTestScript("Check-in cổng thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-01",
                receptionistName: "Lê Thị Thu Thảo"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/reception/check-in", host: ["{{baseUrl}}"], path: ["reception", "check-in"] }
          }
        },
        {
          name: "11.2 Xem lịch sử check-in trong ngày (Get Check-In History)",
          event: [makeTestScript("Lấy lịch sử check-in thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/reception/check-in/history", host: ["{{baseUrl}}"], path: ["reception", "check-in", "history"] }
          }
        },
        {
          name: "11.3 Huấn luyện viên điểm danh lớp (Coach Take Attendance)",
          event: [makeTestScript("Điểm danh lớp thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                classId: "cls-01",
                className: "Lớp Bơi Bướm Nâng Cao",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                records: [
                  { memberId: "usr-mem-01", memberName: "Phạm Thanh Hội Viên", status: "PRESENT" },
                  { memberId: "usr-mem-02", memberName: "Nguyễn Văn A", status: "ABSENT" }
                ]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/attendance", host: ["{{baseUrl}}"], path: ["coach", "attendance"] }
          }
        }
      ]
    },
    {
      name: "12. Training Progress & Plans",
      description: "Quản lý giáo án: Giáo án chung cả lớp, Giáo án riêng cá nhân hóa (gắn sao ⭐), Hủy giáo án riêng, và Ghi nhận InBody",
      item: [
        {
          name: "12.1 Lấy danh sách giáo án (Get All Training Plans)",
          event: [makeTestScript("Lấy danh sách giáo án thành công")],
          request: {
            method: "GET",
            url: {
              raw: "{{baseUrl}}/coach/training-plans?classId=cls-01",
              host: ["{{baseUrl}}"],
              path: ["coach", "training-plans"],
              query: [{ key: "classId", value: "cls-01" }]
            },
            description: "Lấy danh sách giáo án, hỗ trợ lọc theo lớp học để phân biệt giáo án chung và giáo án riêng."
          }
        },
        {
          name: "12.2 Tạo giáo án chung cho lớp (Create Class Training Plan)",
          event: [makeTestScript("Tạo giáo án chung thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                classId: "cls-01",
                className: "Lớp Bơi Bướm Nâng Cao",
                sportName: "Bơi lội",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                title: "Giáo án Tối ưu sải bơi 50m & Thể lực",
                goal: "Tăng sức bền, cải thiện nhịp thở ly tâm",
                startDate: "2026-10-02",
                endDate: "2026-10-30",
                isCustom: false,
                targetType: "CLASS",
                exercises: [
                  { name: "Khởi động xoay khớp & bơi nhẹ", sets: "2", reps: "5 phút", note: "Làm nóng hệ cơ vai" },
                  { name: "Bơi bướm biến tốc cự ly ngắn", sets: "4", reps: "50m", note: "Nghỉ 45s, RPE 8.0" }
                ]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/training-plans", host: ["{{baseUrl}}"], path: ["coach", "training-plans"] },
            description: "Tạo giáo án chung áp dụng đồng loạt cho toàn bộ học viên trong lớp."
          }
        },
        {
          name: "12.3 Thiết lập giáo án riêng cá nhân hóa cho học viên (Save Personal Training Plan - Star ⭐)",
          event: [makeTestScript("Lưu giáo án riêng thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                classId: "cls-01",
                className: "Lớp Bơi Bướm Nâng Cao",
                sportName: "Bơi lội",
                memberId: "usr-mem-01",
                memberName: "Phạm Thanh Hội Viên",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                title: "Giáo án riêng: Phạm Thanh (Tải trọng khớp vai nhẹ)",
                fitnessCondition: "Khớp vai từng mỏi cơ nhẹ sau cự ly bơi dài",
                goal: "Tối ưu hóa thể lực riêng, tránh quá tải khớp vai",
                startDate: "2026-10-02",
                endDate: "2026-10-30",
                isCustom: true,
                targetType: "MEMBER",
                exercises: [
                  { name: "Khởi động xoay khớp có kiểm soát", sets: "2", reps: "5 phút", note: "Kéo giãn nhẹ nhàng" },
                  { name: "Bơi sải nhẹ biến tốc", sets: "3", reps: "50m", note: "Tập trung nhịp thở" }
                ]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/training-plans/personal", host: ["{{baseUrl}}"], path: ["coach", "training-plans", "personal"] },
            description: "Tạo hoặc cập nhật giáo án riêng cho học viên. Học viên này sẽ hiển thị ngôi sao vàng phát sáng ⭐ trên giao diện."
          }
        },
        {
          name: "12.4 Hủy giáo án riêng của học viên (Delete Personal Training Plan - Revert to Class Plan)",
          event: [makeTestScript("Hủy giáo án riêng thành công")],
          request: {
            method: "DELETE",
            url: {
              raw: "{{baseUrl}}/coach/training-plans/personal?classId=cls-01&memberId=usr-mem-01",
              host: ["{{baseUrl}}"],
              path: ["coach", "training-plans", "personal"],
              query: [
                { key: "classId", value: "cls-01" },
                { key: "memberId", value: "usr-mem-01" }
              ]
            },
            description: "Hủy giáo án riêng của học viên. Học viên tự động quay lại áp dụng giáo án chung của lớp; ngôi sao trở về rỗng."
          }
        },
        {
          name: "12.5 Xóa giáo án (Delete Training Plan by ID)",
          event: [makeTestScript("Xóa giáo án thành công")],
          request: {
            method: "DELETE",
            url: { raw: "{{baseUrl}}/coach/training-plans/tp-172768001", host: ["{{baseUrl}}"], path: ["coach", "training-plans", "tp-172768001"] }
          }
        },
        {
          name: "12.6 Xem toàn bộ lịch sử chỉ số InBody (Get All Progress)",
          event: [makeTestScript("Lấy lịch sử InBody thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/coach/progress", host: ["{{baseUrl}}"], path: ["coach", "progress"] }
          }
        },
        {
          name: "12.7 Ghi nhận chỉ số thể lực InBody (Record Progress)",
          event: [makeTestScript("Lưu chỉ số InBody thành công")],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                memberId: "usr-mem-01",
                memberName: "Phạm Thanh Hội Viên",
                coachId: "usr-coa-01",
                coachName: "Nguyễn Văn Huấn",
                date: "2026-10-02",
                weight: 68.5,
                bodyFat: 16.2,
                muscleMass: 34.1,
                notes: "Chỉ số mỡ giảm tốt, cơ bắp săn chắc hơn"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/coach/progress", host: ["{{baseUrl}}"], path: ["coach", "progress"] }
          }
        }
      ]
    },
    {
      name: "13. Reports, System & Master Data",
      description: "Thống kê Dashboard, Audit Logs, Phân quyền ma trận và Master Data",
      item: [
        {
          name: "13.1 Thống kê tổng quan Dashboard Quản lý (Get Overview Report)",
          event: [makeTestScript("Lấy báo cáo tổng quan thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/reports/overview", host: ["{{baseUrl}}"], path: ["reports", "overview"] }
          }
        },
        {
          name: "13.2 Xem nhật ký hoạt động hệ thống (Get Audit Logs)",
          event: [makeTestScript("Lấy Audit Logs thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/system/audit-logs", host: ["{{baseUrl}}"], path: ["system", "audit-logs"] }
          }
        },
        {
          name: "13.3 Lấy ma trận phân quyền theo vai trò (Get Permissions Matrix)",
          event: [makeTestScript("Lấy ma trận quyền thành công")],
          request: {
            method: "GET",
            url: { raw: "{{baseUrl}}/system/permissions", host: ["{{baseUrl}}"], path: ["system", "permissions"] }
          }
        },
        {
          name: "13.4 Cập nhật danh sách quyền cho vai trò (Update Permissions)",
          event: [makeTestScript("Cập nhật quyền thành công")],
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                permissions: [
                  "view_teaching_schedule",
                  "view_class_members",
                  "create_training_plan",
                  "record_workout_progress",
                  "take_attendance",
                  "manage_classes"
                ]
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/system/permissions/COACH", host: ["{{baseUrl}}"], path: ["system", "permissions", "COACH"] }
          }
        },
        {
          name: "13.5 Lấy danh sách 15 môn thể thao Olympic (Get Sports Master Data)",
          event: [makeTestScript("Lấy danh sách môn thể thao thành công")],
          request: {
            auth: { type: "noauth" },
            method: "GET",
            url: { raw: "{{baseUrl}}/sports", host: ["{{baseUrl}}"], path: ["sports"] }
          }
        }
      ]
    }
  ]
};

// ============================================================================
// 3. POSTMAN ENVIRONMENT GENERATION
// ============================================================================
const postmanEnvironment = {
  id: "scms-env-dev",
  name: "SCMS - Sports Center Management Environment",
  values: [
    { key: "baseUrl", value: "http://localhost:8080/api", type: "default", enabled: true },
    { key: "viteProxyUrl", value: "http://localhost:3003/api", type: "default", enabled: true },
    { key: "token", value: "", type: "secret", enabled: true },
    { key: "userId", value: "usr-mgr-01", type: "default", enabled: true },
    { key: "memberId", value: "usr-mem-01", type: "default", enabled: true },
    { key: "coachId", value: "usr-coa-01", type: "default", enabled: true },
    { key: "packageId", value: "pkg-basic", type: "default", enabled: true },
    { key: "classId", value: "cls-01", type: "default", enabled: true },
    { key: "roomId", value: "room-01", type: "default", enabled: true },
    { key: "bookingId", value: "bkg-01", type: "default", enabled: true },
    { key: "role", value: "MANAGER", type: "default", enabled: true }
  ],
  _postman_variable_scope: "environment"
};

// ============================================================================
// 4. BEAUTIFUL SWAGGER UI HTML GENERATION
// ============================================================================
const swaggerHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SCMS API Documentation - Interactive Swagger UI</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo:wght@700;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" />
  <style>
    :root {
      --primary: #dc2626;
      --primary-dark: #b91c1c;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: 'Inter', -apple-system, sans-serif;
      color: #0f172a;
    }
    .custom-topbar {
      background: var(--slate-900);
      color: #ffffff;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--primary);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-badge {
      background: var(--primary);
      color: #fff;
      font-family: 'Chivo', sans-serif;
      font-weight: 900;
      font-size: 15px;
      padding: 6px 12px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
    }
    .brand-title {
      font-family: 'Chivo', sans-serif;
      font-weight: 900;
      font-size: 17px;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-action {
      background: var(--slate-800);
      color: #ffffff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid var(--slate-700);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .btn-action:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      transform: translateY(-1px);
    }
    .mode-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 25px 0 15px 0; }
    .swagger-ui .info .title {
      font-family: 'Chivo', sans-serif;
      font-weight: 900;
      color: var(--slate-900);
    }
    .swagger-ui .btn.authorize {
      background-color: var(--primary) !important;
      border-color: var(--primary) !important;
      color: #fff !important;
      font-weight: 700;
      border-radius: 8px;
    }
    .swagger-ui .btn.authorize svg { fill: #fff !important; }
    .swagger-ui .opblock.opblock-post { border-color: #2563eb; background: rgba(37, 99, 235, .04); }
    .swagger-ui .opblock.opblock-get { border-color: #059669; background: rgba(5, 150, 105, .04); }
    .swagger-ui .opblock.opblock-put { border-color: #d97706; background: rgba(217, 119, 6, .04); }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, .04); }
    .swagger-ui .opblock.opblock-patch { border-color: #7c3aed; background: rgba(124, 58, 237, .04); }
  </style>
</head>
<body>
  <header class="custom-topbar">
    <div class="topbar-left">
      <span class="brand-badge">SCMS</span>
      <div>
        <div class="brand-title">
          Sports Center Management System
          <span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 500;">OpenAPI 3.0</span>
        </div>
        <div class="brand-subtitle">Interactive Swagger UI & Live Tester (Updated 02/10/2026)</div>
      </div>
    </div>
    <div class="topbar-right">
      <div class="mode-indicator">
        <span class="pulse-dot"></span>
        <span>Interactive API Spec</span>
      </div>
      <a href="/openapi.json" target="_blank" class="btn-action" title="Xem mã nguồn JSON của OpenAPI Specification">
        <span>{ } OpenAPI JSON</span>
      </a>
      <a href="/SCMS_Sports_Center_API.postman_collection.json" download="SCMS_Sports_Center_API.postman_collection.json" class="btn-action" title="Tải file Postman Collection v2.1.0">
        <span>📥 Postman Collection</span>
      </a>
      <a href="/SCMS_Environment.postman_environment.json" download="SCMS_Environment.postman_environment.json" class="btn-action" title="Tải file Postman Environment">
        <span>⚙️ Postman Env</span>
      </a>
      <a href="/" class="btn-action" style="background: var(--primary); border-color: var(--primary);">
        <span>← Về Ứng Dụng SCMS</span>
      </a>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
        persistAuthorization: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>
`;

// ============================================================================
// 5. WRITE OUT FILES
// ============================================================================

const openapiContent = JSON.stringify(openapiSpec, null, 2);
const postmanColContent = JSON.stringify(postmanCollection, null, 2);
const postmanEnvContent = JSON.stringify(postmanEnvironment, null, 2);

// Write to public/
fs.writeFileSync(path.join(publicDir, 'openapi.json'), openapiContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'swagger.html'), swaggerHtml, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'SCMS_Sports_Center_API.postman_collection.json'), postmanColContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'SCMS_Environment.postman_environment.json'), postmanEnvContent, 'utf-8');

// Write to dist/
fs.writeFileSync(path.join(distDir, 'openapi.json'), openapiContent, 'utf-8');
fs.writeFileSync(path.join(distDir, 'swagger.html'), swaggerHtml, 'utf-8');

// Write to postman/
fs.writeFileSync(path.join(postmanDir, 'SCMS_Sports_Center_API.postman_collection.json'), postmanColContent, 'utf-8');
fs.writeFileSync(path.join(postmanDir, 'SCMS_Environment.postman_environment.json'), postmanEnvContent, 'utf-8');

// Also write openapi.json to workspace root for convenient reference
const rootDir = path.join(__dirname, '..');
fs.writeFileSync(path.join(rootDir, 'openapi.json'), openapiContent, 'utf-8');

console.log('✅ Generated files successfully:');
console.log(' - public/openapi.json & root openapi.json');
console.log(' - public/swagger.html & dist/swagger.html');
console.log(' - postman/SCMS_Sports_Center_API.postman_collection.json');
console.log(' - postman/SCMS_Environment.postman_environment.json');
console.log(' - public/SCMS_Sports_Center_API.postman_collection.json');
console.log(' - public/SCMS_Environment.postman_environment.json');
