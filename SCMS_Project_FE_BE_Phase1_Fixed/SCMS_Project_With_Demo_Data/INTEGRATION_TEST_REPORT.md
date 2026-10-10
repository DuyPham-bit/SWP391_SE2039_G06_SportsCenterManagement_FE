# SCMS integration test report — 10/10/2026 (Asia/Saigon)

## Kiểm thử bổ sung JWT

Sau chuyển issuer sang JWT HS256: login tài khoản member có trong SQL thành công, accessToken có 3 phần; GET profile/me và members/me với JWT thành công; JWT bị sửa chữ ký nhận HTTP 401. Bằng chứng không chứa token/password: JWT_DATABASE_VERIFICATION.json; đối chiếu SQL: JWT_SQL_VERIFICATION.txt. DB thực tế là SQL Server LocalDB `SportsCenterManagement`, không phải mock/in-memory; trình duyệt truy cập qua API để giữ connection string và quyền DB ở Backend.

## Kết quả đã chạy

| Kiểm tra | Kết quả | Phạm vi/bằng chứng |
|---|---|---|
| `npm ci` | PASS | Cài dependencies FE; lần sandbox lỗi DNS, chạy lại có quyền mạng thành công |
| `npm run check` | PASS | ESLint 0 warning, 15/15 tests, Vite production build; đã chạy lại sau chỉnh sửa cuối |
| `dotnet restore` | PASS | .NET SDK 10.0.401 |
| `dotnet build SWP391_SE2039_G06_SportsCenterManagement1.slnx --no-restore` | PASS | 0 warnings/errors, BACKEND_BUILD.log |
| Health/OpenAPI | PASS | API thật localhost:54162, 70 paths, 84 operations, 70 schemas; integration-openapi.json |
| Swagger UI | PASS | Mở `/swagger/index.html` bằng trình duyệt, thấy operations, schemas và Authorize |
| Live API smoke | PASS 16/16 | LIVE_API_RESULTS.json; auth/profile/pending subscription/package CRUD status/reports/audit/member lookup và negative scope/permission |
| Postman nghiệp vụ | PASS | 15 requests, 19 assertions; POSTMAN_INTEGRATION_RESULTS.json |
| Postman full smoke/negative | PASS | 84 requests, 84 assertions; POSTMAN_ROUTE_RESULTS.json |
| FE → BE → DB | PASS trong phạm vi dưới đây | Browser login/member profile/manager/package create/status, SQL đọc lại record |

Full Postman smoke dùng token rỗng, ID 0 và payload tối thiểu để kiểm tra route/validation/auth; 4xx là kết quả mong đợi. Đây không phải 84 luồng nghiệp vụ thành công. Callback nhận input không có chữ ký hợp lệ chỉ kiểm tra từ chối, không kiểm chứng thanh toán. Báo cáo Newman đã loại token/password/body nhạy cảm, chỉ giữ thống kê và assertion.

## Luồng và dữ liệu thật

- Login member seed và manager thật; profile lấy DB. Token hết hiệu lực sau restart API khiến FE trở về login. Login sai và 401/403 được kiểm tra qua smoke/contract tests.
- Browser tạo gói `SCMS UI Integration 20261010`, giá 50.000 VND. GET trả lại gói; SQL xác nhận Id 10005, sau đó thao tác tạm ẩn qua FE thành công. DATABASE_VERIFICATION.txt lưu bằng chứng SQL.
- Live test tạo/cập nhật profile, tạo PendingPayment subscription và GET kiểm tra lại; manager tạo/sửa/tạm ẩn package, đọc report/audit và lookup member. Bản chạy cuối đạt 16/16; lần đầu phát hiện hash manager legacy và lookup username không thuộc contract, đã sửa và chạy lại.
- SQL LocalDB hiện hữu có 11 migration đã áp dụng; API startup không áp dụng migration mới. Bằng chứng SQL ghi 4 member test, 4 subscription PendingPayment ở thời điểm truy vấn. Không reset DB hoặc tự seed lại demo.
- Tests FE dùng fixtures để kiểm tra DTO, session ID, 202 waitlist, idempotency retry, lỗi mạng/timeout, 204, pagination và quyền. Những test này không thay thế E2E nghiệp vụ có DB.

## NOT VERIFIED / chưa hỗ trợ

- Booking/cancel/waitlist E2E chưa chạy vì DB không có sport/room/coach/class/session phù hợp; contract tests đã kiểm tra 202 và session ID. Không seed lịch giả để báo PASS.
- Staff create/update, class create/schedule/publish/assign và counter CASH/POS chưa chạy E2E đầy đủ; adapter đã tích hợp nhưng cần dữ liệu/quyền hợp lệ.
- Gateway VNPay/MoMo/PayOS, webhook, reconcile/refund, kích hoạt gói sau trả tiền: NOT VERIFIED; chưa có đầy đủ sandbox secret/callback public. Không thanh toán thật.
- Reset password qua email/OTP delivery, change-password đầy đủ: NOT VERIFIED; đã nối endpoint, bỏ OTP/success giả.
- Chưa kiểm tra toàn bộ routes/roles/responsive breakpoint và trình duyệt khác. Browser kiểm tra giới hạn ở login/profile/dashboard/package; layout/component cũ giữ lại.
- BE chưa có API check-in/attendance, training/progress, notifications, Google login, AI, facility inquiry, room writes hoặc member-to-staff promotion. FE hiển thị chưa khả dụng, không giả thành công.
- Role matrix `/api/admin/roles` dành SystemAdmin, Manager bị 403 đúng contract; không mở rộng quyền để khớp màn mock. UI quản trị SystemAdmin đầy đủ chưa được bổ sung/test.

## Chạy lại và cấu hình

1. FE: copy `.env.example` sang `.env.local`, đặt `VITE_API_BASE_URL=http://localhost:54162`, center public phù hợp; `npm ci`, `npm run check`, `npm run dev -- --port 3003`.
2. BE: cấu hình connection string SQL, `Jwt__Key` bằng secret mạnh riêng (không commit); `ASPNETCORE_ENVIRONMENT=Development`, `Database__SeedDemoData=false`. `dotnet restore`; `dotnet build SWP391_SE2039_G06_SportsCenterManagement1.slnx`; `dotnet run --project SportsCenterManagement.API --no-launch-profile --urls http://localhost:54162`.
3. Từ FE, live smoke: đặt `SCMS_TEST_MANAGER_LOGIN`, `SCMS_TEST_MANAGER_PASSWORD` của manager dev hợp lệ rồi `node tests/live-api-smoke.mjs`. Runner tạo dữ liệu test, không dùng production.
4. Postman/Newman 6.2.1: chạy integration collection với local environment; chạy full collection theo `Backend/postman/README.md`. Regenerate bằng `Generate-FullApiSmokeCollection.ps1` khi contract đổi. Không commit export chứa token/password.

Người vận hành cần tự cung cấp JWT key, SQL connection phù hợp, SMTP/reset delivery và sandbox payment credentials/callback public theo cấu hình BE. API/FE dev đã chạy trong phiên kiểm thử; JWT runtime ngẫu nhiên không lưu vào source, restart cần cấp lại secret. Đọc README của từng project để cấu hình chi tiết.

Kết luận: các luồng BE hiện có đã được nối thay mock và kiểm chứng trong phạm vi nêu trên. Các mục NOT VERIFIED và endpoint chưa có vẫn là công việc còn lại, không được coi là toàn hệ thống đã nghiệm thu.

