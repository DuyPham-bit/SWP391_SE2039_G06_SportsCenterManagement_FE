# SCMS FE–BE đồng bộ đợt 1 (11/10/2026)

## Phạm vi và giới hạn

Cơ sở: `SCMS_Project_Synchronization_Fixed.zip`. Chỉ sửa nguồn, không chạy kết nối tới cơ sở dữ liệu đang vận hành, không migrate, không seed, không thực hiện giao dịch tiền hoặc check-in thật. Dữ liệu phải đến từ API và SQL Server, không dùng mock để báo thành công. Chức năng check-in/điểm danh được bổ sung bằng 2 API controllers trên các bảng đã tồn tại; **chưa kiểm chứng runtime C# và SQL Server**.

## Đã thay đổi

| Hạng mục | Bên | Source | Kết quả |
|---|---|---|---|
| Member Bookings | FE | `src/services/api.js`, `src/features/member/MyBookings.jsx` | Ánh xạ `sessionDate` và `bookedAt`, không dùng `roomName` chưa có trong DTO, không giả dữ liệu |
| Lịch dạy | FE | `src/services/api.js`, `src/features/coach/TeachingSchedule.jsx` | ISO date -> Thứ bằng UTC calendar, filter chính xác và lỗi API hiển thị |
| Quản lý lớp | FE | `src/services/api.js`, `src/features/manager/ClassesAndRooms.jsx` | Đọc schedules thật từng lớp; không lấy bookedCount thay cho enrolledCount, hiển thị “Chưa có dữ liệu” |
| System Admin RBAC | FE | `src/features/manager/RolesPermissions.jsx`, `src/App.jsx`, `src/services/permissions.js`, `src/features/auth/LoginPage.jsx`, `src/components/auth/RoleGuard.jsx` | Dùng roleId + permission code thực; chỉ route `#/admin/roles-permissions` cho `SYSTEMADMIN`. Manager không có quyền chỉnh role |
| Check-in | BE | `SportsCenterManagement.API/Controllers/CenterCheckInsController.cs` | `GET/POST api/centers/{centerId}/check-ins`, kiểm center active staff, member, gói còn hạn, chống ghi nhận trùng trong ngày Việt Nam bằng transaction Serializable; kết quả lấy người thao tác từ token |
| Check-in | FE | `src/features/receptionist/MemberCheckIn.jsx`, `ReceptionistDashboard.jsx`, `src/services/api.js` | Thao tác theo mã/sđt/email, lịch sử thật. Không tuyên bố mở khóa RFID |
| Điểm danh | BE | `SportsCenterManagement.API/Controllers/CoachAttendanceController.cs` | `GET api/coaches/me/sessions/{sessionId}/roster` và `PUT api/coaches/me/sessions/{sessionId}/attendance`; xác minh coach, ca dạy, booking Booked, xác thực trạng thái, ghi vào bảng attendance |
| Điểm danh | FE | `src/features/coach/Attendance.jsx`, `src/services/api.js` | Điểm danh cho sessionId; trạng thái `UNMARKED` buộc HLV chọn trước khi lưu, tải ghi chú và trạng thái đã lưu |
| Navigation | FE | `src/services/featureAvailability.js`, `CoachDashboard.jsx` | Hiển thị check-in/attendance; giữ chặn chức năng chưa có API và loại số liệu giả về chứng chỉ HLV |
| Regression | FE | `tests/api-sync-contract.test.mjs`, cập nhật tests cũ | Bao phủ thêm contract booking, lịch, manager schedules, check-in, attendance và role matrix |

## Contract API mới

### Check-in

`GET /api/centers/{centerId}/check-ins`: `RECEPTIONIST` hoặc `MANAGER` được gán tại center, lấy tối đa 100 bản ghi trong **ngày Việt Nam (UTC+7)**. Dữ liệu thời gian lưu UTC. 

`POST /api/centers/{centerId}/check-ins` với JSON `{"identifier":"MB-123"}`: đối chiếu memberCode, email, phone; `201` nếu thành công, `400` dữ liệu không hợp lệ, `404` không tìm thấy, `403` sai center, `409` gói không hợp lệ / nhập trùng / định danh mơ hồ. Không hỗ trợ điều khiển thiết bị RFID hoặc check-out.

### Attendance

`GET /api/coaches/me/sessions/{sessionId}/roster`: chỉ `COACH` có phân công; lấy hội viên có booking `Booked` và điểm danh đã có. `404` nếu không thuộc coach.

`PUT /api/coaches/me/sessions/{sessionId}/attendance`: Body `{"records":[{"memberId":123,"status":"PRESENT","note":"..."}]}`; `200` khi ghi, `400` sai dữ liệu, `404` không được phân công, `409` booking không hợp lệ, buổi đã hủy hoặc buổi chưa diễn ra. Kết quả lưu bằng `attendance_status` = `Present/Absent`. Không thể giả điểm danh bằng client.

## Kiểm chứng thực tế trong môi trường chạy lần này

- `npm test`: **25/25 PASS** (node:test, các HTTP boundary sử dụng stub, không phải BE live).
- `node node_modules/eslint/bin/eslint.js src --max-warnings 0`: **PASS**.
- Parser Babel: **64/64 files JS/JSX/MJS PASS**.
- `vite build`: **UNVERIFIED**, do package node_modules hiện có không mang binary Rolldown dành cho Linux.
- `dotnet build`, EF query, integration tests với SQL Server: **UNVERIFIED** vì máy kiểm tra không có .NET SDK / SQL Server.
- Không cần thêm migration với giả định schema hiện tại có `center_checkins`, `attendance` như trong DAL. Nếu DB thật chưa migrate đến các bảng đó, cần chạy migrations hiện hữu trên DB thử nghiệm.

## Kiểm chứng cần thực hiện trước khi dùng thực tế

1. Trên máy có .NET SDK 10 và SQL Server thử nghiệm: `dotnet restore`, `dotnet build` solution, cập nhật DB migrations đã có, chạy API.
2. FE Windows: `npm ci`, `npm run check`, `npm run dev -- --port 3003`. Cấu hình `VITE_API_BASE_URL` và `VITE_CENTER_ID` đúng `.env.example`.
3. Login Receptionist tại trung tâm tương ứng, test GET lịch sử và POST check-in: member hợp lệ 201; trùng trong ngày 409; hết gói 409; khác center 403; ẩn token 401. Không dùng tài khoản/dữ liệu thật nếu chưa được phép.
4. Login Coach đúng phân công: roster có member đã Booked, điểm danh Present/Absent, chạy lại PUT không tạo trùng; user khác không được xem. Kiểm tra Session Date theo UTC+7.
5. Login SystemAdmin để đối chiếu ma trận quyền, thử sửa quyền trong DB test, xác thực Manager không thể truy cập màn quyền.
6. Test thông báo lỗi mạng, CORS, Unicode, sắp xếp lịch theo giờ và dữ liệu trống.

## Chưa làm trong đợt 1

- Các API giáo án/training plans, tiến độ, coach notifications, AI, Google OAuth, room CRUD, promotion member-to-staff, tư vấn cơ sở vật chất.
- Các FE workflow có API sẵn như enrollments, hóa đơn/hoàn tiền/đối soát, CRUD thành viên/schedules/coaches bổ sung (ưu tiên đợt tiếp).
- `Manager` quản trị vai trò vẫn không được cho phép bởi BE (SystemAdmin-only); link cũ được giữ unavailable có chủ đích.
- Không thay `enrolledCount` bằng số booking hay tạo số hội viên duy nhất giả; cần BE endpoint thống kê đúng metric nếu muốn KPI chính xác.
- Chưa có integration test chạy trên DB thật hoặc test concurrency xuyên nhiều process; cần kiểm chứng khóa giao dịch SQL và chiến lược chống trùng khi scale-out.

Đợt 1 là bản triển khai mã nguồn và hợp đồng API, **không phải xác nhận production-ready** khi thiếu bộ kiểm thử .NET + DB.
