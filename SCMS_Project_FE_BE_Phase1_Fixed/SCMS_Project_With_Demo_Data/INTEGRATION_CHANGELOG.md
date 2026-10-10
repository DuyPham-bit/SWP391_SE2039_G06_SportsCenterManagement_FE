# SCMS integration changelog — 10/10/2026

## Bổ sung JWT theo yêu cầu

`API/Authentication/BearerTokenIssuer.cs` cấp JWT ký HS256 với sub, unique_name, jti, role, centerId và hạn 1 giờ; key lấy từ cấu hình môi trường. `ProtectedBearerHandler.cs` giới hạn thuật toán HS256, kiểm tra chữ ký/issuer/audience/expiry và tiếp tục đọc trạng thái user/role/center scope từ DB mỗi request. Giữ nhánh token mã hóa cũ để tương thích phiên hiện hữu. Swagger khai báo BearerFormat JWT. FE gửi JWT trong Authorization Bearer qua client sẵn có, không cần đổi DTO login.

Thực hiện sau audit trong FE-BE-DB-API-MAPPING.md. FE nằm trong `SWP391- SportsCenterManagement- frontend - Copy`; BE trong `SWP391_SE2039_G06_SportsCenterManagement_BE/Backend`.

## Frontend

- `src/services/httpClient.js` mới: base URL môi trường, Bearer thật, timeout, lỗi HTTP/network, response rỗng, sessionStorage không chứa password; 401 hủy phiên.
- `src/services/api.js`: thay adapter mock bằng API thật cho auth/profile/member/subscription/package/staff/class/schedule/coach/booking/payment/report/audit. Giữ phân trang và ID thực; booking 202 có trạng thái waitlist; payment giữ idempotency key khi retry mạng và không tự kích hoạt gói.
- `src/contexts/AuthContext.jsx`, route guard, `src/utils/permissions.js`: khôi phục phiên qua máy chủ; quyền máy chủ, bỏ Manager bypass; register không tự login. App giữ routes và chặn các màn hình chưa có API bằng trạng thái chưa khả dụng.
- `ApiStatus.jsx`: thông báo lỗi và retry theo thao tác người dùng. Các màn login/reset/profile, packages, schedule/bookings, counter checkout, classes/rooms, coach assignment, staff, reports/dashboard/audit được điều chỉnh theo DTO thật, lỗi/empty state và response thật. Giữ bố cục và các component hiện hữu; không tuyên bố đã kiểm tra mọi breakpoint.
- Xóa `src/services/dbStorage.js`, `src/services/mockData.js` sau khi loại bỏ import. Các màn training/progress/attendance/notification/AI chưa được BE hỗ trợ giữ source nhưng không chạy giả lập. Danh mục sân ở landing vẫn là nội dung marketing tĩnh, không cấp ID cho giao dịch.
- Thêm `tests/api-integration.test.mjs`, `tests/live-api-smoke.mjs`; cập nhật regression tests bỏ phụ thuộc mock. `.env.example`, `.env.local` (ignored), `.gitignore`, README mô tả cấu hình/chạy thực tế.

## Backend

- Thêm `API/Controllers/IntegrationCatalogController.cs`, `BLL/Interfaces/IIntegrationCatalogService.cs`, `BLL/Services/IntegrationCatalogService.cs`, `BLL/DTOs/IntegrationCatalog/Responses.cs`: sáu GET catalog/access, đọc EF qua UnitOfWork, scope center và quyền staff; tách CoachProfile.Id khỏi User.Id. Không thêm API ghi hoặc entity/migration mới.
- `API/Program.cs`: đăng ký service, khai báo Bearer OpenAPI, demo seed chỉ bật khi Development và `Database:SeedDemoData=true`.
- Thêm `API/Authorization/SwaggerAnonymousOperationFilter.cs` để endpoint anonymous không bị mô tả là yêu cầu Bearer.
- `BLL/Common/Helpers/PasswordHashing.cs`: đọc hash PBKDF2 legacy từ initializer, giữ kiểm tra độ dài/iterations và so sánh cố định thời gian. Không reset password hoặc cấp thêm role.
- `API/appsettings.json`: bỏ JWT key cố định, seed mặc định false, payment return URL khớp FE. Cập nhật `.env.example`, README.
- Postman: giữ collection gốc, thêm Bearer/idempotency; generator và full collection đồng bộ Swagger 84 operations; thêm integration collection 15 requests; cập nhật README.

## Core và dữ liệu được giữ

Giữ API → BLL → DAL → EF Core, các business service/transaction/payment callback/authorization/middleware và migration hiện hữu. Không reset/drop DB, không xóa localStorage cũ. `DAL/Context/DbInitializer.cs` có thay đổi sẵn trước task, được giữ nguyên; `API/package-lock.json` không phải file do task tạo và không bị xóa.

Test có tạo tài khoản/gói/subscription trong DB development để xác minh persistence. Subscription test vẫn PendingPayment; gói tạo qua UI đã tạm ẩn. Không có thanh toán gateway hoặc production. Các script Python trung gian do task tạo được dọn; giữ test runner và bằng chứng kiểm thử.
