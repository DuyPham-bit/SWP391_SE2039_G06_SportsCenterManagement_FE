# PROMPT CHO AI — TÍCH HỢP FE ↔ BE ↔ DATABASE CHO SCMS

## 0. Vai trò và mục tiêu

Bạn đang làm việc trên source code của **Sports Center Management System (SCMS)** được cung cấp trong ZIP `TestEnviroment(1).zip`.

Nhiệm vụ là **tích hợp Frontend hiện có với Backend hiện có**, để dữ liệu nghiệp vụ được đọc/ghi qua API và lưu trong SQL Server. Không được viết lại project từ đầu hoặc tự ý thay đổi core FE/BE.

Các mục tiêu bắt buộc:

1. Kết nối FE React với BE ASP.NET Core Web API thật.
2. Đồng bộ API contract giữa FE và BE; BE là nguồn chuẩn.
3. Lấy dữ liệu nghiệp vụ từ Database qua API; mọi thao tác ghi/sửa/xóa phải được BE xác nhận và persist vào DB.
4. Giữ nguyên UI/UX, routing, role, permission, business flow và kiến trúc cốt lõi đang có; chỉ sửa phần cần thiết cho integration.
5. Loại bỏ mock/test REST API cũ ở FE khi không còn cần. Không dùng mock/localStorage để giả lập Backend đã có.
6. Duy trì **OpenAPI + Swagger + Postman** làm tài liệu và công cụ kiểm thử API thật của Backend. Không xóa Swagger/Postman phía BE chỉ vì trước đây đã thử API riêng.
7. Chỉ tích hợp OpenAI/AI khi được yêu cầu ở giai đoạn riêng; không nhúng API key vào FE. Trong task này ưu tiên hoàn thành luồng FE–BE–DB trước.

---

## 1. Cấu trúc project trong ZIP

### Frontend

Thư mục:

```text
TestEnviroment/SWP391- SportsCenterManagement- frontend - Copy/
```

Công nghệ: React, JavaScript, Vite.

Các vị trí quan trọng:

```text
src/
├── App.jsx
├── context/
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
├── components/
│   ├── auth/RoleGuard.jsx
│   ├── layout/
│   └── common/
├── features/
│   ├── auth/
│   ├── landing/
│   ├── manager/
│   ├── receptionist/
│   ├── coach/
│   └── member/
└── services/
    ├── api.js
    ├── dbStorage.js
    ├── mockData.js
    ├── permissions.js
    ├── sessionUser.js
    ├── sportsCatalog.js
    └── facilityCatalog.js
```

Các file cần đọc kỹ:

- `FRONTEND_AUDIT.md`
- `README.md`
- `src/services/api.js`
- `src/services/dbStorage.js`
- `src/services/mockData.js`
- `src/context/AuthContext.jsx`
- `src/services/sessionUser.js`
- các màn hình trong từng `src/features/`

`FRONTEND_AUDIT.md` là ghi chú hiện trạng quan trọng, nhưng vẫn phải kiểm chứng lại với source code hiện tại trước khi thay đổi.

Theo audit trong ZIP, FE hiện vẫn dùng service mô phỏng và `localStorage`; login dùng fake token, một số luồng Google Login/OTP/thanh toán là giả lập; báo cáo có số liệu hard-code; form thuê sân chưa gửi yêu cầu lên server. Không giả định những chức năng này đã hoạt động với BE thật.

### Backend

Thư mục:

```text
TestEnviroment/SWP391_SE2039_G06_SportsCenterManagement_BE/Backend/
```

Công nghệ:

- .NET 10 / ASP.NET Core Web API
- EF Core 10
- SQL Server LocalDB theo cấu hình phát triển mặc định
- 3-Layer Architecture: API/Presentation → BLL → DAL
- Repository Pattern + Unit of Work

Các project chính:

```text
SportsCenterManagement.API/
SportsCenterManagement.BLL/
SportsCenterManagement.DAL/
SportsCenterManagement.Models/
```

Các thư mục/tệp cần kiểm tra:

```text
SportsCenterManagement.API/Controllers/
SportsCenterManagement.API/Program.cs
SportsCenterManagement.API/appsettings.json
SportsCenterManagement.BLL/DTOs/
SportsCenterManagement.BLL/Interfaces/
SportsCenterManagement.BLL/Services/
SportsCenterManagement.DAL/Context/
SportsCenterManagement.DAL/Entities/
SportsCenterManagement.DAL/Migrations/
SportsCenterManagement.DAL/Repositories/
database/schema.sql
postman/
README.md
```

Không giả định mọi chức năng FE đã có endpoint BE. Phải xác minh từ Controller, DTO, BLL, DAL, DbContext và schema/migrations.

---

## 2. Quy tắc bảo vệ core

### Không được làm

- Không rewrite toàn bộ FE hoặc BE.
- Không thay đổi UI/UX, CSS, layout, route hay tên component nếu không cần.
- Không xóa tính năng chỉ vì hiện chưa có API.
- Không bỏ BLL, DAL, Repository, Unit of Work hoặc EF Core.
- Không chuyển business logic/SQL vào Controller hoặc FE.
- Không thay DB schema/migrations hoặc xóa dữ liệu/migrations tùy tiện.
- Không thay đổi role, permission, center scope, authentication hoặc authorization để “cho chạy được”.
- Không đổi business rules của booking, membership, payment, capacity, lịch lớp hay phân quyền.
- Không đánh dấu một thao tác thành công khi API/DB chưa xác nhận.
- Không thêm endpoint giả để làm cho Swagger/Postman có vẻ đầy đủ.
- Không commit secret, connection string nhạy cảm, JWT key, OpenAI key hoặc payment secret.

### Nguyên tắc sửa

1. Audit trước, chưa sửa code ngay.
2. Backend hiện có là nguồn chuẩn cho endpoint, DTO, validation và business logic.
3. Sửa FE để khớp BE trước khi cân nhắc sửa BE.
4. Chỉ sửa BE khi thực sự thiếu API cần thiết; giữ kiến trúc và logic hiện tại, bổ sung thay đổi nhỏ nhất.
5. Trước khi xóa file hoặc cơ chế mock, tìm toàn bộ nơi đang import/gọi chúng và chuyển các dependency cần thiết trước.
6. Không xóa dữ liệu người dùng trong `localStorage` tự động. Sau khi chuyển sang API, chỉ ngừng dùng nó làm database nghiệp vụ; giữ lại dữ liệu tương thích cần thiết cho session/UI nếu an toàn.
7. Nếu một tính năng chưa có BE, ghi rõ `NOT IMPLEMENTED IN BACKEND`, không giả lập thành công.

---

## 3. Phase 1 — Audit toàn bộ trước khi sửa

Trước hết, đọc `FRONTEND_AUDIT.md`, README FE/BE, các Controller, DTO, service, DbContext, migrations/schema, Postman collection và source FE.

Tạo file:

```text
FE-BE-DB-API-MAPPING.md
```

File mapping phải có bảng như sau:

| Feature FE | Component/Service FE | Hiện trạng (mock/API) | Endpoint BE thực tế | Method | Request DTO | Response DTO | Bảng/Entity DB | Trạng thái |
|---|---|---|---|---|---|---|---|---|

Lập mapping cho ít nhất các nhóm:

- Login/register/profile/password
- Membership packages
- Member lookup/management
- Staff management
- Classes/coaches/schedules/sessions
- Booking/cancel booking/waitlist
- Membership subscription
- Payment/invoice
- Reports
- Audit logs
- Roles/permissions
- Attendance/check-in
- Training plan/progress
- Landing page/facility inquiry
- Google Login/forgot password/OTP
- AI assistant/recommendation

Không được tự suy ra endpoint từ tên component. Kiểm tra route thật trong Controller.

Sau đó phân loại từng feature:

- `READY`: BE đã có API và FE có thể kết nối.
- `NEEDS_FE_ADAPTER`: BE có API nhưng FE DTO/state/ID khác.
- `NEEDS_BACKEND_API`: FE có feature nhưng BE chưa có endpoint phù hợp.
- `MOCK_ONLY`: chỉ có mock/localStorage.
- `NOT_IN_SCOPE`: chưa làm trong đợt tích hợp hiện tại.

Kết thúc Phase 1, trình bày phát hiện và kế hoạch ngắn gọn. Sau khi hoàn tất audit, có thể tiếp tục triển khai từng phase nếu môi trường cho phép; không được tự ý rewrite.

---

## 4. Các API BE đã được ghi nhận trong README/Controllers — phải xác minh lại

README BE trong ZIP liệt kê một số route hiện có, bao gồm:

| Method | Route | Mục đích |
|---|---|---|
| GET | `/health` hoặc `/api/health` | Health check |
| GET | `/api/centers/{centerId}/membership-packages` | Gói đang Active của center |
| GET | `/api/centers/{centerId}/classes` | Lớp Published của center |
| POST | `/api/auth/register` | Đăng ký Member |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/request-password-reset` | Yêu cầu reset mật khẩu, kiểm tra route/DTO thật |
| POST | `/api/auth/reset-password` | Reset mật khẩu, kiểm tra route/DTO thật |
| POST | `/api/auth/change-password` | Đổi mật khẩu, kiểm tra route/DTO thật |
| GET/PATCH | `/api/members/me` | Xem/cập nhật profile của Member |
| GET/POST | `/api/centers/{centerId}/members` | Tra cứu/tạo Member tại quầy |
| PATCH | `/api/centers/{centerId}/members/{memberId}` | Cập nhật Member |
| PATCH | `/api/centers/{centerId}/members/{memberId}/status` | Đổi trạng thái Member |
| GET/POST/PATCH | `/api/centers/{centerId}/staff` | Tra cứu/tạo/cập nhật staff |
| POST | `/api/members/me/subscriptions` | Tạo subscription PendingPayment |
| POST/GET | `/api/members/{memberId}/subscriptions` | Bán gói tại quầy/xem lịch sử theo quyền |
| POST | `/api/centers/{centerId}/membership-packages` | Tạo package |
| PATCH | `/api/membership-packages/{packageId}` | Cập nhật package qua route riêng |
| GET | `/api/class-sessions` | Tra cứu sessions; kiểm tra tham số/filter |
| GET | `/api/coaches/me/teaching-schedule` | Lịch dạy của coach |
| GET | `/api/members/me/session-bookings` | Booking của Member |
| POST | `/api/class-sessions/{sessionId}/bookings` | Đặt buổi học |
| DELETE | `/api/session-bookings/{bookingId}` | Hủy booking |
| POST | `/api/payments/create-vnpay-url` | Tạo VNPay payment URL |
| POST | `/api/payments/create-momo-url` | Tạo MoMo payment URL |
| POST | `/api/payments/create-payos-url` | Tạo PayOS payment URL |
| GET | `/api/payments/vnpay-callback` | Callback VNPay |
| POST | `/api/payments/payos-ipn` | Webhook PayOS |
| POST | `/api/invoices/{invoiceId}/payments` | Ghi nhận tiền mặt |
| GET | `/api/centers/{centerId}/audit-logs` | Audit log của center |
| GET | `/api/admin/audit-logs` | Audit log toàn hệ thống |
| GET | `/api/admin/roles` | Danh sách role/permission |
| PUT | `/api/admin/roles/{roleId}/permissions` | Cập nhật permission |

Đây là danh sách ban đầu từ tài liệu; **phải kiểm tra route attributes và DTO thực tế**. Nếu README, Controller, Swagger hoặc Postman khác nhau, ghi lại sai khác và dùng Controller/DTO chạy thật làm căn cứ. Không tự tạo route từ bảng này.

---

## 5. Các khác biệt FE–BE đã được nêu trong audit

### Authentication

FE mock hiện có thể trả:

```js
{ token, user }
```

Trong khi audit ghi nhận BE `AuthResponse` trả các trường tương tự:

```text
AccessToken, UserId (long), Role, ExpiresAt
```

Phải xác minh DTO thực tế và tạo adapter ở tầng service/session. Không bắt BE đổi response chỉ để giữ nguyên mock contract nếu có thể chuyển đổi ở FE.

Lưu ý:

- FE đang dùng ID chuỗi ở nhiều nơi; BE dùng ID số `long` cho một số entity. Không ép kiểu hoặc tự tạo ID giả.
- Không lưu password trong session.
- Không dùng fake JWT.
- Không tin role/permission chỉ vì FE lưu trong state; BE phải tiếp tục enforce authorization.
- Xác minh flow đăng ký: không tự đăng nhập sau đăng ký nếu BE không trả token.
- Token phải được gửi trong header `Authorization: Bearer <token>` theo cơ chế thực tế của BE.
- Xử lý 401/403 và hết phiên mà không làm mất dữ liệu form không cần thiết.

### Booking và lịch

Audit ghi nhận FE mock chủ yếu đặt theo class ID/ngày tự chọn, trong khi BE có route:

```text
POST /api/class-sessions/{sessionId}/bookings
```

BE có thể trả `201` khi đặt thành công và `202` khi vào waitlist; phải xác minh response thật.

Do đó:

- FE cần dùng session/lịch thật từ BE.
- Không tự tạo session ID hoặc booking ID.
- Không coi `202 Accepted` là lỗi nếu contract xác định đây là waitlist.
- Hiển thị rõ trạng thái booked/waitlist.
- Việc kiểm tra capacity, lịch trùng và quyền phải được thực hiện ở BE.
- Không giữ mô hình đặt theo ngày tùy chọn nếu BE yêu cầu đặt theo session đã tồn tại, trừ khi audit xác nhận BE có API khác hỗ trợ.

### Membership và payment

- Không tự kích hoạt membership sau khi bấm nút mua.
- FE gọi API tạo subscription/payment thật.
- Trạng thái Active chỉ được hiển thị khi BE xác nhận thanh toán hợp lệ.
- Callback/IPN và xác thực thanh toán phải nằm ở BE.
- Không lưu payment secret ở FE/Postman environment được commit.
- Ghi rõ nếu flow thanh toán chưa thể test do thiếu sandbox credentials.

### Reports

Audit ghi nhận một số biểu đồ/chỉ số ở `ReportsAnalytics.jsx` còn hard-code. Phải kiểm tra endpoint report thật và DTO. Không biến số liệu mẫu thành số liệu thật. Nếu chưa có endpoint phù hợp, đánh dấu `NEEDS_BACKEND_API`.

### Thuê sân / landing form

Audit ghi nhận form ở `FacilitiesSection.jsx` hiện chỉ đổi state giao diện, chưa gửi yêu cầu lên server. Kiểm tra xem BE có API tiếp nhận yêu cầu thuê sân hay chưa. Nếu không có, báo rõ endpoint/DTO/business rule cần bổ sung; không tự tạo API giả.

### Google Login / Forgot Password / OTP

Audit ghi nhận Google Login nhận email do người dùng nhập và OTP có giá trị cố định trong FE mock. Không được đưa cơ chế đó vào bản chạy thật.

- Chỉ kết nối Google OAuth nếu BE xác minh token/credential thật.
- Reset password phải dùng API thật có cơ chế OTP/token an toàn, thời hạn và giới hạn thử.
- Nếu BE chưa hỗ trợ, hiển thị trạng thái chưa khả dụng hoặc đánh dấu chưa triển khai; không giả lập thành công.
- Không tự thêm luồng xác thực yếu để tránh phải sửa BE.

### Attendance / Training / AI

Kiểm tra riêng từng Controller/API. Nếu BE chưa có endpoint check-in, attendance, training progress hoặc AI, không được tuyên bố đã đồng bộ các chức năng đó. Đề xuất API tối thiểu sau khi kiểm tra entity/schema và business requirement.

---

## 6. Phase 2 — Tạo một API client dùng chung ở FE

Dùng/điều chỉnh:

```text
src/services/api.js
```

Nhưng file này hiện đang chứa nhiều service mô phỏng và gọi `dbStorage.js`; không chỉ đổi một base URL là xong.

Yêu cầu:

- Tách lớp HTTP client dùng chung khỏi các service theo feature khi cần, nhưng giữ cấu trúc project tối đa.
- Dùng `VITE_API_BASE_URL` trong `.env.local`/`.env.example`.
- Không commit file chứa secret.
- Kiểm tra base URL/port thực tế từ launch profile của BE; README hiện nêu mặc định `http://localhost:54162`, nhưng phải xác minh khi chạy.
- Cấu hình timeout nếu phù hợp, JSON request/response và xử lý response rỗng.
- Gửi Bearer token theo session thật.
- Chuẩn hóa lỗi 400, 401, 403, 404, 409, 422 và 500 theo response contract thực tế.
- Không log password, token, OTP, payment secret hoặc dữ liệu cá nhân nhạy cảm.
- Không tạo fallback sang mock khi API thật lỗi.
- Không rải URL trực tiếp khắp component.
- Mapping camelCase/PascalCase phải dựa trên JSON thật do ASP.NET Core trả về; không tự viết mapper phức tạp nếu serializer đã xử lý.

---

## 7. Phase 3 — Chuyển từng feature từ mock sang API

Làm theo thứ tự:

### P0 — Authentication

- Login
- Register
- Get/update profile
- Change/reset password nếu BE hỗ trợ
- Token/session/logout
- Role/permission/center scope

### P0 — Dữ liệu chính

- Centers/facilities/sports nếu BE có API
- Membership packages
- Classes
- Class sessions/schedules
- Members
- Staff/coaches

### P0 — Giao dịch

- Subscription/membership
- Booking/cancel booking/waitlist
- Payment/invoice

### P1 — Quản lý

- Audit logs
- Roles/permissions
- Reports
- Check-in/attendance
- Training plan/progress
- Facility inquiry

Chỉ chuyển feature khi đã biết endpoint và contract thật. Nếu thiếu endpoint, ghi vào `FE-BE-DB-API-MAPPING.md` và đề xuất phần BE cần thêm.

Với mỗi feature:

1. Gọi GET thật khi mở màn hình.
2. Có loading, empty, error và retry state phù hợp.
3. POST/PUT/PATCH/DELETE phải gọi BE.
4. Chỉ thông báo thành công sau response thành công.
5. Sau ghi dữ liệu, cập nhật từ response hoặc GET lại dữ liệu từ BE.
6. Không ghi bản sao nghiệp vụ vào `localStorage`.
7. Bảo toàn UX hiện tại tối đa.
8. Xác minh quyền trên BE; ẩn nút ở FE chỉ là UX, không phải security.

---

## 8. Phase 4 — Loại bỏ mock và localStorage đúng cách

Các file hiện có gồm:

```text
src/services/dbStorage.js
src/services/mockData.js
src/services/api.js
```

Không xóa chúng ngay từ đầu.

Quy trình:

1. Tìm tất cả import/reference tới `db`, `DB_KEYS`, `mockData`, `INITIAL_*` và fake token.
2. Chuyển từng service/feature sang API thật.
3. Chạy lint, test và build sau mỗi nhóm thay đổi.
4. Chỉ xóa code mock khi không còn dependency và chức năng đã được kiểm thử.
5. Giữ các dữ liệu UI/session cần thiết nếu an toàn, nhưng không dùng localStorage làm database nghiệp vụ.
6. Không tự động reset/clear localStorage của người dùng.
7. Loại bỏ fake login, fake JWT, fake payment success, OTP cố định và dữ liệu giả trong những feature đã được thay bằng BE.
8. Danh mục tĩnh chỉ được giữ nếu thực sự là dữ liệu cấu hình tĩnh và đã xác nhận không có API phù hợp; ghi rõ ngoại lệ.

Nếu endpoint thật lỗi, FE phải báo lỗi, không fallback sang mock hoặc giả lập success.

---

## 9. OpenAPI, Swagger và Postman

**Phân biệt rõ hai việc:**

- Có thể xóa/clean những công cụ thử nghiệm giả lập cũ phía FE, mock REST API server hoặc tài liệu trùng lặp không còn dùng.
- Phải giữ Swagger/OpenAPI và Postman của Backend để mô tả và kiểm thử API thật.

Backend hiện có `AddSwaggerGen()` và Swagger UI trong môi trường Development. Thư mục Postman hiện có các file tương tự:

```text
Backend/postman/
├── SportsCenterManagement.postman_collection.json
├── SportsCenterManagement.full.postman_collection.json
├── SportsCenterManagement.local.postman_environment.json
├── SportsCenterManagement.full.postman_environment.json
├── Generate-FullApiSmokeCollection.ps1
└── README.md
```

Không xóa các file trên nếu chưa xác minh chúng không còn cần. Ưu tiên cập nhật để phản ánh API thật.

### Quy trình contract

1. Controller + DTO + authorization của BE là nguồn chuẩn.
2. Swagger/OpenAPI phải phản ánh route, method, parameters, request/response, status code và security thật.
3. Postman collection phải gọi BE thật, không gọi mock server.
4. FE service phải dùng đúng route/DTO của BE.
5. Nếu có sai khác, lập danh sách trước rồi đồng bộ theo BE; không sửa business logic chỉ để khớp tài liệu cũ.
6. Không thêm endpoint giả chỉ để đủ collection.
7. Postman smoke collection có thể chấp nhận 4xx ở test negative có chủ đích; phải phân biệt test âm với luồng nghiệp vụ thành công.
8. Dùng environment variables cho `baseUrl`, `centerId`, `token` và ID test; không lưu credential/secret nhạy cảm trong collection.
9. Sau khi chạy BE, kiểm tra Swagger JSON thực tế, ví dụ `/swagger/v1/swagger.json`, rồi cập nhật Postman nếu cần.
10. Chỉ tuyên bố test PASS nếu đã thực sự chạy.

---

## 10. Database và bảo vệ dữ liệu

Backend sử dụng EF Core và SQL Server LocalDB theo cấu hình phát triển mặc định. Hãy xác minh `ConnectionStrings:SportsCenter`, migrations, `DbInitializer` và schema thật trước khi chạy.

- Không tạo database riêng ở FE.
- Không thay EF Core bằng localStorage/IndexedDB.
- Không chạy lệnh drop/reset database.
- Không xóa migration.
- Không đổi schema khi chỉ cần sửa mapping FE.
- Không seed lại hoặc reset dữ liệu hiện hữu tùy tiện.
- Dùng migration chỉ khi thật sự cần thay đổi schema, sau khi giải thích lý do và tác động.
- Không để connection string/secret thật trong file được commit.
- Nếu LocalDB/SQL Server chưa chạy, báo chính xác điều kiện cần thiết; không giả lập kết quả DB.

Đối với thao tác ghi, phải xác minh đường đi:

```text
FE action
  → HTTP request
  → Controller
  → BLL/service
  → DAL/EF Core
  → SQL Server
  → HTTP response
  → FE refresh/update
```

Kiểm tra trực tiếp DB trong môi trường dev khi có thể, hoặc dùng GET API sau ghi để xác nhận persistence. Phân biệt rõ `API returned success` với `DB persistence verified`.

---

## 11. CORS, security và cấu hình chạy

`Program.cs` đã có cấu hình CORS dựa trên `Cors:AllowedOrigins` và fallback có các origin localhost. FE Vite mặc định dùng `http://localhost:3003` theo README. Hãy xác minh đúng origin và port.

- Không tắt CORS/security để né lỗi.
- Không mở CORS rộng hơn mức cần thiết.
- Không bỏ `[Authorize]`, permission policies hoặc center-scope checks.
- Không tin `userId`, `role`, `centerId` do FE tự gửi nếu BE phải xác định từ token/authorization context.
- Không để OpenAI key hay payment secret trong biến `VITE_*`, vì biến này có thể lộ ra trình duyệt.
- Nếu tích hợp AI về sau, FE gọi endpoint BE; BE giữ secret và kiểm soát dữ liệu đầu vào.

---

## 12. OpenAI / AI

Trong FE có `MemberAIAssistant.jsx` và `AIRecommendation.jsx`; audit nói nội dung hiện còn mẫu/giả lập.

Không tự ý tích hợp OpenAI trong cùng một thay đổi nếu API nghiệp vụ chính chưa hoàn tất.

Trước tiên:
- Xác minh yêu cầu AI hiện có và API BE liên quan.
- Không tuyên bố chatbot dùng AI thật nếu chưa gọi model thật.
- Không đặt API key ở FE.
- Nếu chưa có BE endpoint, ghi rõ cần endpoint nào, request/response DTO nào và dữ liệu nghiệp vụ nào được phép truy cập.
- Chỉ triển khai AI khi có yêu cầu/được chấp thuận và vẫn giữ bảo mật, authorization, rate limits và dữ liệu tối thiểu cần thiết.

---

## 13. Test bắt buộc

### Frontend

Trong thư mục FE:

```powershell
npm ci
npm run check
npm run build
```

Nếu script trong `package.json` khác, đọc `package.json` và dùng script có thật; không tự tuyên bố lệnh đã chạy nếu chưa chạy.

### Backend

Trong thư mục Backend:

```powershell
dotnet restore .\SWP391_SE2039_G06_SportsCenterManagement1.slnx
dotnet build .\SWP391_SE2039_G06_SportsCenterManagement1.slnx
```

Chạy migration/database update chỉ khi đã kiểm tra cấu hình và xác định môi trường an toàn. Không tự ý reset database.

Khởi động API theo launch profile/config thực tế, sau đó:
- Gọi health endpoint.
- Mở Swagger UI.
- Kiểm tra `/swagger/v1/swagger.json`.
- Test API bằng Postman với dữ liệu test hợp lệ.
- Kiểm tra token/permission và negative cases.

### End-to-end

Test ít nhất:

1. Login bằng account hợp lệ được seed/cấu hình đúng.
2. Login sai password không được thành công.
3. Đọc profile thật.
4. Đọc package/class/session từ BE.
5. Tạo/cập nhật một record qua FE ở môi trường dev.
6. Xác minh response API và dữ liệu tồn tại qua GET hoặc DB.
7. Booking/cancel/waitlist theo session thật nếu account/test data cho phép.
8. API trả 401/403 thì FE xử lý đúng.
9. API lỗi hoặc mất mạng không tạo thông báo success giả.
10. UI, route, role guard và responsive layout không bị regression.

Không sử dụng production payment hoặc dữ liệu thật cho test.

---

## 14. Acceptance criteria

Task chỉ được coi là hoàn thành khi có bằng chứng cho từng mục phù hợp:

### FE
- [ ] FE build thành công.
- [ ] UI/UX, routing và role hiện tại được giữ nguyên.
- [ ] API client dùng base URL cấu hình theo môi trường.
- [ ] Các feature đã tích hợp dùng API thật, không fallback sang mock.
- [ ] Có loading/error/empty state.
- [ ] Không lưu password hoặc fake JWT.
- [ ] ID và DTO mapping khớp contract.

### BE
- [ ] Backend build thành công.
- [ ] Kiến trúc API → BLL → DAL → EF Core được giữ.
- [ ] Business rules, authentication, authorization và center scope được giữ.
- [ ] API mới (nếu có) chỉ được thêm khi cần và có lý do rõ.
- [ ] Không thay đổi DB/migration không cần thiết.

### Database
- [ ] GET từ FE lấy dữ liệu qua BE.
- [ ] POST/PUT/PATCH/DELETE được hỗ trợ và gọi BE.
- [ ] Dữ liệu thay đổi được xác nhận đã persist, không chỉ cập nhật UI.
- [ ] Không reset/xóa dữ liệu cũ ngoài ý muốn.

### API contract
- [ ] FE route/method/DTO khớp BE.
- [ ] Swagger/OpenAPI phản ánh Controller thật.
- [ ] Postman collection gọi Backend thật.
- [ ] Không còn mock REST API cũ được dùng trong luồng thật.
- [ ] Các endpoint thiếu được ghi rõ, không giả vờ đã hỗ trợ.

### Testing
- [ ] FE checks/build: PASS hoặc ghi FAIL/NOT RUN.
- [ ] BE build: PASS hoặc ghi FAIL/NOT RUN.
- [ ] Swagger: PASS/FAIL/NOT VERIFIED.
- [ ] Postman: PASS/FAIL/NOT VERIFIED.
- [ ] FE → BE: PASS/FAIL/NOT VERIFIED.
- [ ] BE → DB: PASS/FAIL/NOT VERIFIED.

---

## 15. Báo cáo cuối cùng bắt buộc

Tạo/cập nhật các tài liệu:

1. `FE-BE-DB-API-MAPPING.md` — mapping từng feature/endpoint/DTO/entity.
2. `INTEGRATION_CHANGELOG.md` — các file đã sửa/xóa và lý do.
3. `INTEGRATION_TEST_REPORT.md` — lệnh đã chạy, kết quả thật, các phần chưa test.

Báo cáo cuối cùng cần có:

- Files FE đã sửa.
- Files BE đã sửa.
- Files đã xóa hoặc ngừng sử dụng và lý do.
- Những core files/logic đã được giữ nguyên.
- Danh sách endpoint đã kết nối.
- Danh sách endpoint còn thiếu.
- Các feature vẫn còn mock và vì sao.
- Kết quả build/test có bằng chứng.
- Các cấu hình/secret mà người dùng cần tự cung cấp.
- Các mục `NOT VERIFIED` còn lại.

Không ghi PASS nếu chưa chạy kiểm thử. Không tuyên bố toàn hệ thống đã kết nối nếu mới chỉ kết nối một vài feature.

---

## 16. Lệnh bắt đầu

Bắt đầu bằng **Phase 1 — Audit**, đọc source trong ZIP và lập `FE-BE-DB-API-MAPPING.md`. Không sửa code trước khi mapping và gap list hoàn tất.

Sau audit, triển khai từng nhóm nhỏ theo thứ tự P0 → P1, chạy kiểm tra sau mỗi nhóm và báo cáo những gì đã xác minh.

**Mục tiêu cuối cùng: giữ nguyên core SCMS, kết nối FE → API thật → BE → SQL Server, đồng bộ contract bằng OpenAPI/Swagger/Postman, và không còn giả lập thành công cho nghiệp vụ đã có Backend.**
