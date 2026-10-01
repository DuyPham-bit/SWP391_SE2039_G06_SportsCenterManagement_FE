# SCMS - Sports Center Management System
## Backend RESTful API Specification (Tài liệu đặc tả API chuẩn theo mã nguồn Frontend)

> **Tài liệu được tổng hợp và chuẩn hóa trực tiếp từ tầng Service của Frontend (`src/services/api.js`, `mockData.js`, `dbStorage.js`).**  
> Dùng làm tài liệu đối chiếu (API Contract) giữa **Frontend** và **Backend (Spring Boot / Node.js / .NET / Java)**.

---

### Quy ước chung (General Conventions)
- **Base URL:** `http://localhost:8080/api` (hoặc cấu hình qua biến môi trường `VITE_API_BASE_URL`)
- **Content-Type:** `application/json; charset=utf-8`
- **Authentication:** Bearer Token JWT truyền qua Header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Chuẩn định dạng Response:**
  - Thành công: HTTP 200 / 201 kèm dữ liệu JSON.
  - Thất bại: HTTP 400 / 401 / 403 / 404 / 500 kèm JSON:
    ```json
    {
      "message": "Nội dung lỗi chi tiết hiển thị cho người dùng"
    }
    ```

---

## Danh mục Endpoints

| Nhóm API | Method | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| **1. Auth & Account** | `POST` | `/api/auth/login` | Đăng nhập tài khoản bằng Email + Mật khẩu |
| | `POST` | `/api/auth/register` | Đăng ký tài khoản hội viên mới |
| | `POST` | `/api/auth/google` | Đăng nhập / Tự động đăng ký bằng Google OAuth |
| | `POST` | `/api/auth/reset-password` | Khôi phục mật khẩu qua mã OTP |
| | `PUT` | `/api/users/{id}/change-password` | Đổi mật khẩu cá nhân |
| | `PUT` | `/api/users/{id}/profile` | Cập nhật thông tin cá nhân |
| **2. Staff Management** | `GET` | `/api/staff` | Lấy danh sách toàn bộ nhân sự (Coach, Receptionist, Manager) |
| | `GET` | `/api/staff/available-members` | Tìm kiếm hội viên đủ điều kiện bổ nhiệm làm nhân sự |
| | `POST` | `/api/staff` | Tạo mới nhân sự hoặc thăng cấp hội viên lên nhân sự |
| | `PUT` | `/api/staff/{id}` | Cập nhật thông tin nhân sự |
| | `PATCH` | `/api/staff/{id}/toggle-status` | Kích hoạt / Tạm khóa tài khoản nhân sự |
| **3. Package Management** | `GET` | `/api/packages` | Lấy danh sách gói tập |
| | `POST` | `/api/packages` | Tạo gói tập mới (Manager) |
| | `PUT` | `/api/packages/{id}` | Cập nhật gói tập (Manager) |
| | `PATCH` | `/api/packages/{id}/toggle-status` | Bật/tắt trạng thái gói tập |
| **4. Classes & Sched** | `GET` | `/api/classes` | Lấy danh sách lớp học thể thao |
| | `POST` | `/api/classes` | Mở lớp học mới (Kiểm tra sức chứa phòng) |
| | `PUT` | `/api/classes/{id}` | Cập nhật thông tin lớp học |
| | `PUT` | `/api/classes/{id}/assign-coach` | Phân công HLV (Kiểm tra trùng lịch) |
| **5. Rooms & Facilities** | `GET` | `/api/rooms` | Lấy danh sách sân bãi / phòng tập |
| | `POST` | `/api/rooms` | Tạo phòng tập / sân bãi mới |
| | `PUT` | `/api/rooms/{id}` | Cập nhật phòng tập |
| **6. Bookings (Đặt lớp)** | `GET` | `/api/bookings/member/{memberId}` | Lấy lịch sử đặt chỗ lớp học của hội viên |
| | `POST` | `/api/bookings` | Đặt chỗ lớp học (Kiểm tra gói tập, sức chứa, trùng lặp) |
| | `POST` | `/api/bookings/{id}/cancel` | Hủy đặt chỗ (Giảm số lượng đã đăng ký của lớp) |
| **7. Receptionist** | `GET` | `/api/reception/members/lookup` | Tra cứu hồ sơ hội viên theo tên, email, SĐT, mã thẻ |
| | `POST` | `/api/reception/packages/register` | Đăng ký/Gia hạn gói tập tại quầy (Sinh mã GD) |
| | `POST` | `/api/reception/check-in` | Quét thẻ / Check-in hội viên vào cổng |
| | `GET` | `/api/reception/check-in/history` | Lấy lịch sử check-in trong ngày |
| **8. Coach Operations** | `GET` | `/api/coach/classes/{classId}/members` | Lấy danh sách học viên trong một lớp |
| | `GET` | `/api/coach/classes-with-members` | Lấy các lớp phụ trách kèm danh sách học viên |
| | `POST` | `/api/coach/training-plans` | Tạo giáo án rèn luyện cho hội viên |
| | `POST` | `/api/coach/progress` | Ghi nhận chỉ số thể lực (cân nặng, cơ, mỡ) |
| | `POST` | `/api/coach/attendance` | Điểm danh học viên theo buổi |
| | `POST` | `/api/coach/notifications` | Gửi bài tập / thông báo tới lớp |
| | `POST` | `/api/coach/ai/recommend-plan` | Gợi ý giáo án thông minh từ AI theo thể trạng |
| **9. Member Operations** | `POST` | `/api/members/packages/subscribe` | Đăng ký gói tập trực tuyến (VNPAY / Thẻ) |
| | `GET` | `/api/members/{memberId}/progress` | Xem chỉ số thể lực cá nhân của hội viên |
| | `GET` | `/api/members/{memberId}/training-plans`| Xem giáo án tập luyện của hội viên |
| | `POST` | `/api/members/ai/ask` | Hỏi đáp với Trợ lý Thể thao AI |
| **10. Reports & System** | `GET` | `/api/reports/overview` | Thống kê tổng quan (Hội viên, doanh thu, tỷ lệ lấp đầy) |
| | `GET` | `/api/system/audit-logs` | Xem nhật ký hoạt động hệ thống (Audit Logs) |
| | `GET` | `/api/system/permissions` | Lấy ma trận phân quyền theo vai trò |
| | `PUT` | `/api/system/permissions/{role}` | Cập nhật danh sách quyền cho vai trò |
| **11. Sports Master Data**| `GET` | `/api/sports` | Danh sách 15 môn thể thao trung tâm cung cấp |

---

## Chi tiết đặc tả từng Endpoint

### 1. Phân hệ Xác thực (Auth API)

#### 1.1. Đăng nhập (Login)
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "manager@scms.vn",
    "password": "password123"
  }
  ```
- **Response 200 (Success):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "usr-mgr-01",
      "email": "manager@scms.vn",
      "fullName": "Trần Văn Quản Lý",
      "phone": "0987111222",
      "role": "MANAGER",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      "status": "ACTIVE",
      "createdAt": "2026-01-15"
    }
  }
  ```
- **Response 400/401 (Error):**
  ```json
  { "message": "Email tài khoản không tồn tại trong hệ thống!" }
  ```
  hoặc
  ```json
  { "message": "Mật khẩu không chính xác. Vui lòng kiểm tra lại!" }
  ```

#### 1.2. Đăng ký hội viên (Register)
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn Mới",
    "email": "nguyenvanmoi@gmail.com",
    "phone": "0912999888",
    "password": "password123"
  }
  ```
- **Response 201 (Created):**
  ```json
  {
    "id": "usr-mem-1727689123",
    "email": "nguyenvanmoi@gmail.com",
    "fullName": "Nguyễn Văn Mới",
    "phone": "0912999888",
    "role": "MEMBER",
    "memberCode": "MEM-5621",
    "packageId": null,
    "packageName": "Chưa đăng ký gói tập",
    "packageExpiry": null,
    "packageStatus": "INACTIVE",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "status": "ACTIVE",
    "createdAt": "2026-09-30"
  }
  ```

#### 1.3. Đăng nhập qua Google OAuth
- **Endpoint:** `POST /api/auth/google`
- **Request Body:**
  ```json
  {
    "email": "user@gmail.com",
    "fullName": "Nguyễn Google",
    "avatar": "https://lh3.googleusercontent.com/..."
  }
  ```
- **Response 200:** Trả về `{ token, user }` (tự động tạo user mới role `MEMBER` nếu chưa có).

#### 1.4. Quên / Khôi phục mật khẩu (Reset Password)
- **Endpoint:** `POST /api/auth/reset-password`
- **Request Body:**
  ```json
  {
    "email": "member@scms.vn",
    "otp": "123456",
    "newPassword": "newpassword123"
  }
  ```
- **Response 200:** `{ "success": true, "message": "Khôi phục mật khẩu thành công" }`

#### 1.5. Đổi mật khẩu (Change Password)
- **Endpoint:** `PUT /api/users/{id}/change-password`
- **Request Body:**
  ```json
  {
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }
  ```
- **Response 200:** `{ "success": true }`

---

### 2. Phân hệ Quản lý Nhân sự (Staff API)

#### 2.1. Lấy danh sách nhân viên
- **Endpoint:** `GET /api/staff`
- **Response 200:** Danh sách người dùng có vai trò là `COACH`, `RECEPTIONIST`, `MANAGER`.
  ```json
  [
    {
      "id": "usr-coa-01",
      "fullName": "Nguyễn Văn Huấn (HLV Trưởng)",
      "email": "coach@scms.vn",
      "phone": "0987555666",
      "role": "COACH",
      "specialty": "Bơi lội & Gym thể hình",
      "certification": "AFC Level A & NASM-CPT",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      "status": "ACTIVE",
      "createdAt": "2026-01-20"
    }
  ]
  ```

#### 2.2. Tìm kiếm hội viên để thăng cấp lên nhân viên
- **Endpoint:** `GET /api/staff/available-members?query={keyword}`
- **Response 200:** Danh sách User có role `MEMBER` khớp với từ khóa tìm kiếm (tên, email, SĐT, mã thẻ).

#### 2.3. Tạo nhân viên mới hoặc bổ nhiệm hội viên
- **Endpoint:** `POST /api/staff`
- **Trường hợp 1: Bổ nhiệm từ Member có sẵn:**
  ```json
  {
    "memberId": "usr-mem-01",
    "role": "COACH",
    "specialty": "Cầu lông",
    "certification": "BWF Level 1",
    "phone": "0912345678"
  }
  ```
- **Trường hợp 2: Tạo nhân viên mới hoàn toàn:**
  ```json
  {
    "fullName": "Lê Văn Mới",
    "email": "levanmoi@scms.vn",
    "password": "password123",
    "role": "RECEPTIONIST",
    "phone": "0934567890",
    "avatar": ""
  }
  ```
- **Quy tắc sinh mã ID:**
  - `COACH` -> tiền tố `usr-coa-XX`
  - `RECEPTIONIST` -> tiền tố `usr-rec-XX`
  - `MANAGER` -> tiền tố `usr-mgr-XX`

#### 2.4. Khóa / Mở khóa nhân viên
- **Endpoint:** `PATCH /api/staff/{id}/toggle-status`
- **Response 200:** Trả về đối tượng nhân viên sau khi chuyển trạng thái (`ACTIVE` <-> `INACTIVE`).

---

### 3. Phân hệ Gói tập (Package API)

#### 3.1. Lấy danh sách gói tập
- **Endpoint:** `GET /api/packages`
- **Response 200:**
  ```json
  [
    {
      "id": "pkg-basic",
      "name": "Gói Basic Thể Thao",
      "durationDays": 30,
      "price": 650000,
      "allowedSports": 1,
      "description": "Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu.",
      "features": ["Sử dụng 1 môn thể thao cố định", "Tủ đồ thông minh", "Nước uống miễn phí"],
      "badge": "TIẾT KIỆM",
      "status": "ACTIVE"
    },
    {
      "id": "pkg-all-access",
      "name": "Gói All-Access Olympic Pass",
      "durationDays": 365,
      "price": 5800000,
      "allowedSports": 15,
      "description": "Toàn quyền sử dụng 15 bộ môn và 9 sân thi đấu quốc tế.",
      "features": ["Toàn quyền 15 môn", "Tủ cá nhân 365 ngày", "Đo InBody hàng tháng"],
      "badge": "VIP OLYMPIC",
      "status": "ACTIVE"
    }
  ]
  ```

#### 3.2. Tạo gói tập mới
- **Endpoint:** `POST /api/packages`
- **Request Body:**
  ```json
  {
    "name": "Gói Yoga & Bơi",
    "durationDays": 60,
    "price": 1200000,
    "allowedSports": 2,
    "description": "Kết hợp phục hồi và rèn luyện thể lực",
    "features": ["Phòng Yoga VIP", "Bể bơi 50m"],
    "badge": "MỚI"
  }
  ```

---

### 4. Phân hệ Lớp học & Phòng tập (Classes & Rooms API)

#### 4.1. Lấy danh sách lớp học
- **Endpoint:** `GET /api/classes`
- **Response 200:**
  ```json
  [
    {
      "id": "cls-01",
      "name": "Lớp Bơi Bướm Nâng Cao",
      "sportId": "boi-loi",
      "sportName": "Bơi lội",
      "coachId": "usr-coa-01",
      "coachName": "Nguyễn Văn Huấn (HLV Trưởng)",
      "roomId": "room-01",
      "roomName": "Bể bơi Olympic 50m (Trong nhà)",
      "dayOfWeek": "Thứ 2, 4, 6",
      "timeSlot": "06:30 - 08:00",
      "capacity": 20,
      "enrolledCount": 2,
      "status": "OPEN"
    }
  ]
  ```

#### 4.2. Mở lớp học mới
- **Endpoint:** `POST /api/classes`
- **Request Body:**
  ```json
  {
    "name": "Lớp Yoga Buổi Sáng",
    "sportId": "yoga-pilates",
    "sportName": "Yoga & Pilates",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "roomId": "room-09",
    "roomName": "Phòng Yoga Zen & Máy Reformer",
    "dayOfWeek": "Thứ 2, 4, 6",
    "timeSlot": "05:30 - 06:30",
    "capacity": 15
  }
  ```
- **Ràng buộc nghiệp vụ:** `capacity` của lớp không được vượt quá `capacity` của phòng `roomId`.

#### 4.3. Phân công HLV cho lớp
- **Endpoint:** `PUT /api/classes/{classId}/assign-coach`
- **Request Body:**
  ```json
  {
    "coachId": "usr-coa-02"
  }
  ```
- **Ràng buộc nghiệp vụ:** Kiểm tra trùng lịch: HLV không được có lớp khác cùng `dayOfWeek` và `timeSlot`.

#### 4.4. Lấy danh sách sân bãi / phòng tập
- **Endpoint:** `GET /api/rooms`
- **Response 200:**
  ```json
  [
    {
      "id": "room-01",
      "name": "Bể bơi Olympic 50m (Trong nhà)",
      "type": "Bể bơi",
      "capacity": 40,
      "status": "AVAILABLE",
      "location": "Khu A - Tầng 1"
    }
  ]
  ```

---

### 5. Phân hệ Đặt chỗ & Hội viên (Bookings API)

#### 5.1. Đặt chỗ lớp học
- **Endpoint:** `POST /api/bookings`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-01",
    "classId": "cls-01",
    "bookingDate": "2026-10-01"
  }
  ```
- **Điều kiện kiểm tra:**
  1. Hội viên phải có `packageStatus === 'ACTIVE'`.
  2. Lớp chưa đầy: `enrolledCount < capacity`.
  3. Không được trùng lặp: Chưa có booking `status === 'CONFIRMED'` cho cùng lớp đó.
- **Xử lý kèm theo:** Tự động tăng `enrolledCount` của lớp lên 1.

#### 5.2. Hủy đặt chỗ
- **Endpoint:** `POST /api/bookings/{id}/cancel`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-01"
  }
  ```
- **Xử lý kèm theo:** Đổi status booking sang `CANCELLED`, tự động giảm `enrolledCount` của lớp đi 1.

---

### 6. Phân hệ Lễ tân (Receptionist API)

#### 6.1. Tra cứu hội viên
- **Endpoint:** `GET /api/reception/members/lookup?query={q}`
- **Mô tả:** Tìm kiếm hội viên theo họ tên, email, số điện thoại, mã thẻ (`memberCode`).

#### 6.2. Đăng ký / Gia hạn gói tập tại quầy
- **Endpoint:** `POST /api/reception/packages/register`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-03",
    "packageId": "pkg-pro",
    "paymentMethod": "TIỀN MẶT"
  }
  ```
- **Response 200:**
  ```json
  {
    "transactionRef": "TXN-839201",
    "member": { "...thông tin user sau cập nhật hạn gói..." },
    "package": { "...thông tin gói..." },
    "paymentMethod": "TIỀN MẶT",
    "amount": 1800000,
    "registeredAt": "30/09/2026 15:00:00"
  }
  ```

#### 6.3. Check-in hội viên vào cổng
- **Endpoint:** `POST /api/reception/check-in`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-01",
    "receptionistName": "Lê Thị Thu Thảo"
  }
  ```
- **Điều kiện kiểm tra:**
  1. Tài khoản hội viên phải `status === 'ACTIVE'`.
  2. Gói tập phải `packageStatus === 'ACTIVE'`.

---

### 7. Phân hệ Huấn luyện viên (Coach API)

#### 7.1. Lấy danh sách lớp và học viên của HLV
- **Endpoint:** `GET /api/coach/classes-with-members?coachId={coachId}`
- **Response 200:** Danh sách lớp của HLV đó kèm mảng `members` (các học viên đã đặt chỗ CONFIRMED).

#### 7.2. Tạo giáo án rèn luyện
- **Endpoint:** `POST /api/coach/training-plans`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-01",
    "memberName": "Phạm Thanh Hội Viên",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "title": "Giáo án Tăng cơ Giảm mỡ 8 tuần",
    "goal": "Giảm 3% mỡ cơ thể, tăng sức bền bơi lội",
    "schedule": "Thứ 2, 4, 6",
    "notes": "Tập trung các hiệp tập biến tốc (HIIT)"
  }
  ```

#### 7.3. Ghi nhận chỉ số thể lực
- **Endpoint:** `POST /api/coach/progress`
- **Request Body:**
  ```json
  {
    "memberId": "usr-mem-01",
    "memberName": "Phạm Thanh Hội Viên",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "date": "2026-09-30",
    "weight": 68.5,
    "bodyFat": 16.2,
    "muscleMass": 34.1,
    "notes": "Chỉ số mỡ giảm tốt, cơ bắp phục hồi nhanh"
  }
  ```

#### 7.4. Điểm danh lớp học
- **Endpoint:** `POST /api/coach/attendance`
- **Request Body:**
  ```json
  {
    "classId": "cls-01",
    "className": "Lớp Bơi Bướm Nâng Cao",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "records": [
      { "memberId": "usr-mem-01", "memberName": "Phạm Thanh", "status": "PRESENT" },
      { "memberId": "usr-mem-02", "memberName": "Nguyễn Văn A", "status": "ABSENT" }
    ]
  }
  ```

#### 7.5. Gợi ý giáo án AI (AI Recommendation)
- **Endpoint:** `POST /api/coach/ai/recommend-plan`
- **Request Body:**
  ```json
  {
    "memberName": "Nguyễn Văn A",
    "fitnessGoal": "Tăng cơ bắp & Thể lực sức bền",
    "currentLevel": "Trung cấp",
    "notes": "Khớp gối từng chấn thương nhẹ"
  }
  ```
- **Response 200:** Trả về đối tượng giáo án chi tiết gồm danh sách bài tập, số hiệp (sets), số lần (reps), nhịp tim, dinh dưỡng.

---

### 8. Phân hệ Báo cáo & Quản trị Hệ thống (Reports & System API)

#### 8.1. Thống kê tổng quan Dashboard Manager
- **Endpoint:** `GET /api/reports/overview`
- **Response 200:**
  ```json
  {
    "totalMembers": 380,
    "activeMembers": 310,
    "totalCoaches": 12,
    "totalClasses": 24,
    "totalBookings": 156,
    "todayCheckins": 85,
    "occupancyRate": 78,
    "monthlyRevenue": 148500000,
    "revenueGrowth": "+18.4%",
    "packageDistribution": [
      { "name": "All-Access Olympic", "count": 42, "percentage": 35 },
      { "name": "Pro Bứt Phá", "count": 48, "percentage": 40 },
      { "name": "Elite Chuyên Nghiệp", "count": 18, "percentage": 15 },
      { "name": "Basic Thể Thao", "count": 12, "percentage": 10 }
    ]
  }
  ```

#### 8.2. Nhật ký hệ thống (Audit Logs)
- **Endpoint:** `GET /api/system/audit-logs`
- **Response 200:** Danh sách nhật ký hoạt động gần nhất (thời gian, người thực hiện, vai trò, hành động, chi tiết).

#### 8.3. Phân quyền vai trò (Dynamic Capability Matrix)
- **Endpoint:** `GET /api/system/permissions`
- **Endpoint:** `PUT /api/system/permissions/{role}`
- **Request Body cho PUT:**
  ```json
  {
    "permissions": [
      "view_teaching_schedule",
      "view_class_members",
      "create_training_plan",
      "record_workout_progress",
      "take_attendance",
      "manage_classes"
    ]
  }
  ```
