# SCMS - Sports Center Management System
## Backend RESTful API Specification (Tài liệu đặc tả API chuẩn theo mã nguồn Frontend)

> **Tài liệu được tổng hợp và chuẩn hóa trực tiếp từ tầng Service của Frontend (`src/services/api.js`, `mockData.js`, `dbStorage.js`).**  
> Dùng làm tài liệu đối chiếu (API Contract) giữa **Frontend (React)** và **Backend (Spring Boot / Node.js / .NET / Java)**.  
> **Cập nhật ngày:** 02/10/2026 - Tích hợp các nghiệp vụ: Bổ nhiệm nhân sự từ tài khoản có sẵn (giới hạn role COACH/RECEPTIONIST), Giáo án chung cho lớp & Giáo án riêng cá nhân hóa cho học viên, Hủy giáo án riêng hoàn trả giáo án chung.

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

## Danh mục Endpoints Hoàn Chỉnh

| Nhóm API | Method | Endpoint | Mô tả & Quy tắc nghiệp vụ |
| :--- | :---: | :--- | :--- |
| **1. Auth & Account** | `POST` | `/api/auth/login` | Đăng nhập tài khoản bằng Email + Mật khẩu (Cấp JWT Token) |
| | `POST` | `/api/auth/register` | Đăng ký tài khoản hội viên mới (MEMBER, tự sinh mã MEM-XXXX) |
| | `POST` | `/api/auth/google` | Đăng nhập / Tự động đăng ký bằng Google OAuth |
| | `POST` | `/api/auth/reset-password` | Khôi phục mật khẩu qua mã OTP |
| | `GET` | `/api/users/{id}/profile` | Lấy thông tin cá nhân của người dùng |
| | `PUT` | `/api/users/{id}/profile` | Cập nhật thông tin cá nhân (Họ tên, SĐT, ảnh đại diện) |
| | `PUT` | `/api/users/{id}/change-password` | Đổi mật khẩu cá nhân |
| **2. Staff Management** | `GET` | `/api/staff` | Lấy danh sách toàn bộ nhân sự (Coach, Receptionist, Manager) |
| | `GET` | `/api/staff/available-members` | Tìm kiếm hội viên đủ điều kiện bổ nhiệm làm nhân sự (`?query=`) |
| | `POST` | `/api/staff` | Bổ nhiệm hội viên hoặc tạo mới nhân sự (**Chỉ cho chọn COACH hoặc RECEPTIONIST, cấm cấp MANAGER**) |
| | `PUT` | `/api/staff/{id}` | Cập nhật thông tin nhân sự (Chuyên môn, Bằng cấp) |
| | `PATCH` | `/api/staff/{id}/toggle-status` | Kích hoạt / Tạm khóa tài khoản nhân sự |
| **3. Package Management** | `GET` | `/api/packages` | Lấy danh sách gói tập của trung tâm |
| | `POST` | `/api/packages` | Tạo gói tập mới (Dành cho Quản lý) |
| | `PUT` | `/api/packages/{id}` | Cập nhật thông tin gói tập |
| | `PATCH` | `/api/packages/{id}/toggle-status` | Bật / tắt trạng thái kích hoạt của gói tập |
| **4. Classes & Schedules** | `GET` | `/api/classes` | Lấy danh sách tất cả lớp học thể thao |
| | `POST` | `/api/classes` | Mở lớp học mới (**Ràng buộc:** Sức chứa lớp ≤ Sức chứa phòng tập) |
| | `PUT` | `/api/classes/{id}` | Cập nhật thông tin lớp học |
| | `PUT` | `/api/classes/{id}/assign-coach` | Phân công HLV (**Ràng buộc:** Kiểm tra trùng lịch ca dạy của HLV) |
| **5. Rooms & Facilities** | `GET` | `/api/rooms` | Lấy danh sách 9 cụm sân bãi & phòng tập Olympic |
| | `POST` | `/api/rooms` | Tạo phòng tập / sân bãi mới |
| | `PUT` | `/api/rooms/{id}` | Cập nhật thông tin phòng tập |
| **6. Bookings (Đặt chỗ)** | `POST` | `/api/bookings` | Hội viên đặt chỗ lớp học (**Kiểm tra:** Hạn gói ACTIVE, lớp chưa đầy, chưa đặt trùng) |
| | `GET` | `/api/bookings/member/{memberId}` | Lấy lịch sử đặt chỗ lớp học của hội viên |
| | `POST` | `/api/bookings/{id}/cancel` | Hủy đặt chỗ (Tự động giảm `enrolledCount` của lớp đi 1) |
| **7. Receptionist Operations** | `GET` | `/api/reception/members/lookup` | Tra cứu hồ sơ hội viên theo tên, email, SĐT, mã thẻ |
| | `POST` | `/api/reception/packages/register` | Đăng ký/Gia hạn gói tập tại quầy (Sinh mã GD `TXN-xxxxxx`) |
| | `POST` | `/api/reception/check-in` | Quét thẻ / Check-in hội viên vào cổng (Kiểm tra gói ACTIVE) |
| | `GET` | `/api/reception/check-in/history` | Lấy lịch sử check-in vào cổng trong ngày |
| **8. Coach Operations** | `GET` | `/api/coach/classes/{classId}/members` | Lấy danh sách học viên trong một lớp thể thao |
| | `GET` | `/api/coach/classes-with-members` | Lấy các lớp phụ trách kèm danh sách học viên |
| | `GET` | `/api/coach/training-plans` | Lấy danh sách giáo án (Hỗ trợ lọc theo lớp học) |
| | `POST` | `/api/coach/training-plans` | **Tạo giáo án chung cho lớp học** (`isCustom = false`) |
| | `POST` | `/api/coach/training-plans/personal` | **Tạo / Cập nhật giáo án riêng cá nhân hóa cho học viên** (`isCustom = true`, gắn sao ⭐) |
| | `DELETE`| `/api/coach/training-plans/personal` | **Hủy giáo án riêng của học viên** (Tự động quay lại áp dụng giáo án chung của lớp) |
| | `DELETE`| `/api/coach/training-plans/{id}` | Xóa giáo án khỏi hệ thống |
| | `GET` | `/api/coach/progress` | Lấy lịch sử chỉ số thể lực InBody |
| | `POST` | `/api/coach/progress` | Ghi nhận chỉ số thể lực InBody (Cân nặng, Cơ, Mỡ) |
| | `POST` | `/api/coach/attendance` | Điểm danh học viên theo ca học |
| | `GET` | `/api/coach/notifications` | Xem các bài tập/thông báo HLV đã gửi |
| | `POST` | `/api/coach/notifications` | Gửi bài tập rèn luyện / thông báo tới lớp |
| | `POST` | `/api/coach/ai/recommend-plan` | Gợi ý giáo án thể thao thông minh từ AI theo thể trạng |
| **9. Member Operations** | `POST` | `/api/members/packages/subscribe` | Đăng ký gói tập trực tuyến (VNPAY / Momo / Thẻ) |
| | `GET` | `/api/members/{memberId}/progress` | Xem lịch sử chỉ số thể lực InBody cá nhân |
| | `GET` | `/api/members/{memberId}/training-plans`| Xem giáo án tập luyện (Ưu tiên giáo án riêng, nếu không có lấy giáo án chung của lớp) |
| | `POST` | `/api/members/ai/ask` | Hỏi đáp dinh dưỡng, bài tập với Trợ lý Thể thao AI |
| **10. Reports & Analytics** | `GET` | `/api/reports/overview` | Thống kê Dashboard (Hội viên, Doanh thu, Tỷ lệ lấp đầy sân) |
| | `GET` | `/api/system/audit-logs` | Xem nhật ký hoạt động hệ thống (Audit Logs) |
| | `GET` | `/api/system/permissions` | Lấy ma trận phân quyền theo vai trò |
| | `PUT` | `/api/system/permissions/{role}` | Cập nhật danh sách quyền cho vai trò |
| **11. Sports Master Data**| `GET` | `/api/sports` | Danh sách 15 môn thể thao Olympic trung tâm cung cấp |

---

## Chi tiết Đặc tả Các Nghiệp Vụ Cập Nhật Gần Đây (02/10/2026)

### 1. Bổ nhiệm Nhân sự từ Tài khoản có sẵn & Giới hạn Cấp Vai trò

#### 1.1. Tìm kiếm hội viên đủ điều kiện bổ nhiệm
- **Endpoint:** `GET /api/staff/available-members?query={keyword}`
- **Parameters:**
  - `query` (string, optional): Từ khóa tìm kiếm họ tên, email, số điện thoại hoặc mã hội viên (`MEM-XXXX`).
- **Response 200:**
  ```json
  [
    {
      "id": "usr-mem-01",
      "fullName": "Phạm Thanh Hội Viên",
      "email": "member@scms.vn",
      "phone": "0912345678",
      "role": "MEMBER",
      "memberCode": "MEM-8899",
      "avatar": "https://images.unsplash.com/..."
    }
  ]
  ```

#### 1.2. Bổ nhiệm nhân sự mới (Quy tắc giới hạn Role)
- **Endpoint:** `POST /api/staff`
- **Request Body (Trường hợp bổ nhiệm từ tài khoản có sẵn):**
  ```json
  {
    "memberId": "usr-mem-01",
    "role": "COACH",
    "phone": "0912345678",
    "specialty": "Cầu lông & Bơi lội",
    "certification": "BWF Level 1 & AFC Trainer"
  }
  ```
- **Ràng buộc nghiệp vụ quan trọng:**
  1. **Giới hạn cấp vai trò:** Giá trị `role` **CHỈ ĐƯỢC PHÉP LÀ `COACH` HOẶC `RECEPTIONIST`**.
  2. **Nghiêm cấm cấp vai trò Quản lý:** Quản lý không thể tự cấp hoặc bổ nhiệm vai trò `MANAGER` cho bất kỳ ai thông qua luồng này. Nếu gửi `role: "MANAGER"`, Backend trả về `HTTP 400 Bad Request: "Không được phép cấp vai trò Quản lý qua luồng bổ nhiệm nhân sự!"`.
  3. **Chuyên môn & Chứng chỉ:** Trường `specialty` và `certification` chỉ áp dụng và bắt buộc cho `COACH`. Đối với `RECEPTIONIST`, hai trường này để trống.
  4. **Quy tắc sinh mã ID dự kiến:**
     - Nếu `role === 'COACH'`: ID đổi sang tiền tố `usr-coa-XX`.
     - Nếu `role === 'RECEPTIONIST'`: ID đổi sang tiền tố `usr-rec-XX`.

---

### 2. Giáo Án Chung và Giáo Án Riêng Cá Nhân Hóa (Training Plans)

Huấn luyện viên phụ trách lớp học có thể quản lý 2 cấp độ giáo án:

#### 2.1. Thiết lập Giáo án Chung cho Cả Lớp
- **Endpoint:** `POST /api/coach/training-plans`
- **Request Body:**
  ```json
  {
    "classId": "cls-01",
    "className": "Lớp Bơi Bướm Nâng Cao",
    "sportName": "Bơi lội",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "title": "Giáo án Tối ưu sải bơi và thể lực 8 tuần",
    "goal": "Tăng sức bền, cải thiện nhịp thở ly tâm",
    "startDate": "2026-10-02",
    "endDate": "2026-10-30",
    "isCustom": false,
    "targetType": "CLASS",
    "exercises": [
      { "name": "Khởi động xoay khớp & bơi thả lỏng", "sets": "2", "reps": "100m", "note": "Làm nóng hệ cơ vai" },
      { "name": "Bơi bướm biến tốc cự ly ngắn", "sets": "4", "reps": "50m", "note": "Nghỉ 45s giữa các hiệp, RPE 8.0" },
      { "name": "Thả lỏng & xả cơ ngâm bồn Jacuzzi", "sets": "1", "reps": "10 phút", "note": "Phục hồi cơ bắp" }
    ]
  }
  ```
- **Xử lý:** Lưu vào hệ thống với `isCustom = false`. Tất cả học viên đăng ký lớp `cls-01` khi chưa có giáo án riêng sẽ tự động học theo giáo án chung này.

#### 2.2. Thiết lập / Cập nhật Giáo án Riêng Cá nhân hóa cho Học viên
- **Endpoint:** `POST /api/coach/training-plans/personal`
- **Request Body:**
  ```json
  {
    "classId": "cls-01",
    "className": "Lớp Bơi Bướm Nâng Cao",
    "sportName": "Bơi lội",
    "memberId": "usr-mem-01",
    "memberName": "Phạm Thanh Hội Viên",
    "coachId": "usr-coa-01",
    "coachName": "Nguyễn Văn Huấn",
    "title": "Giáo án cá nhân: Phạm Thanh (Tải trọng khớp vai nhẹ)",
    "fitnessCondition": "Khớp vai từng mỏi cơ nhẹ sau buổi bơi dài",
    "goal": "Cải thiện kỹ thuật quạt nước không gây áp lực khớp",
    "startDate": "2026-10-02",
    "endDate": "2026-10-30",
    "isCustom": true,
    "targetType": "MEMBER",
    "exercises": [
      { "name": "Khởi động kéo giãn dây kháng lực", "sets": "3", "reps": "15 lần", "note": "Kích hoạt nhóm cơ chóp xoay" },
      { "name": "Bơi sải nhẹ biến tốc", "sets": "3", "reps": "50m", "note": "Tập trung nhịp thở, không gắng sức" }
    ]
  }
  ```
- **Xử lý:**
  - Nếu học viên đã có giáo án riêng trong lớp này: Cập nhật đè lên giáo án cũ (`updatedAt`).
  - Nếu chưa có: Tạo mới với mã `tp-custom-XXXX` và đánh dấu `isCustom = true`.
  - Trên giao diện Frontend (`ClassMembers.jsx`), học viên này sẽ hiển thị **Ngôi sao vàng phát sáng ⭐** kèm nhãn `GIÁO ÁN RIÊNG CÁ NHÂN HÓA`.

#### 2.3. Hủy Giáo án Riêng của Học viên (Hoàn trả Giáo án Chung)
- **Endpoint:** `DELETE /api/coach/training-plans/personal`
- **Parameters / Query:**
  - `classId`: ID lớp học (ví dụ: `cls-01`).
  - `memberId`: ID học viên (ví dụ: `usr-mem-01`).
- **Response 200:**
  ```json
  {
    "success": true,
    "message": "Đã huỷ giáo án riêng của học viên Phạm Thanh. Học viên tự động quay lại áp dụng giáo án chung của lớp!"
  }
  ```
- **Xử lý:** Xóa bản ghi giáo án riêng của học viên này. Ngôi sao trên giao diện trở về trạng thái rỗng ☆. Học viên quay về học giáo án chung của lớp.

#### 2.4. Xóa Giáo án
- **Endpoint:** `DELETE /api/coach/training-plans/{id}`
- **Parameters:** `id` của giáo án cần xóa.
- **Response 200:** `{ "success": true, "message": "Xóa giáo án thành công" }`

#### 2.5. Lấy Danh sách Giáo án của Hội viên
- **Endpoint:** `GET /api/members/{memberId}/training-plans`
- **Logic trả về:**
  1. Nếu hội viên có giáo án riêng (`isCustom = true, memberId = :memberId`), trả về giáo án riêng đó.
  2. Đồng thời lấy tất cả giáo án chung (`isCustom = false`) của các lớp mà hội viên này đã đăng ký và có booking `CONFIRMED`.

---

### 3. Cải tiến Điều hướng Giao diện (Landing Page & Menu Sân Bãi)

- **Landing Page (`LandingPage.jsx`):**
  - Click vào thẻ của 1 trong 15 môn thể thao -> Mở Modal chi tiết cụm sân bãi tương ứng (`FacilitiesSection.jsx`).
  - Bấm nút CTA *"Đặt Thuê Cụm Sân"* -> Cuộn mượt đến neo `#co-so-vat-chat` để xem thông số 9 cụm sân tiêu chuẩn Olympic.
- **Header & Menu Điều hướng:**
  - Đã tích hợp nút **"API REST 8080"** trên thanh Header mở `ApiStatusModal.jsx` với link mở Swagger UI trực tiếp và tải Postman Collection.
