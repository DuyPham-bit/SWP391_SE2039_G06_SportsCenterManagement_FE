# SCMS — Kiểm tra đồng bộ FE/BE theo engineering guardrails (2026-10-11)

## Phạm vi

Đầu vào: `SCMS_Project_Dashboard_Fixed.zip`. Giữ nguyên API, DB, JWT, logic nghiệp vụ thật và các hợp đồng public đã có. Chỉ sửa những sai lệch Frontend có bằng chứng từ BE source/DTO và trạng thái thiếu endpoint trong `FE-BE-DB-API-MAPPING.md`. Không thêm dữ liệu giả hoặc tự cấp thêm quyền.

## Lỗi được tái hiện và sửa (confirmed qua regression tests)

| Lỗi gốc | Cách sửa | Kiểm chứng |
|---|---|---|
| `canAccessRoute` chỉ kiểm tra capability khi có `requiredCapability`, bỏ qua `allowedRoles`. Một MANAGER có quyền `members.center.read` có thể qua guard của route RECEPTIONIST. | Luôn kiểm tra `allowedRoles.includes(role)` trước, sau đó mới kiểm capability. Backend vẫn xác thực độc lập. | `synchronization.test.mjs`: role mismatch test FAIL trước, PASS sau |
| Sidebar quảng cáo check-in, training, AI, progress và Manager role matrix dù không có Backend tương ứng hoặc Manager không được phép vào admin roles. | Danh mục route chưa hỗ trợ tập trung trong `featureAvailability.js`; Sidebar ẩn liên kết, direct route vẫn giải thích chưa có API. | Navigation regression FAIL trước, PASS sau |
| `/api/members/me` trả `memberCode` nhưng `authApi.getProfile` không đưa vào session UI. Subscription status được so sánh phân biệt hoa/thường. | Đưa `memberCode` thật vào hồ sơ, chuẩn hóa status và sắp xếp `endDate` an toàn với null. | Member profile regression FAIL trước, PASS sau |
| `counter-checkout` gửi `NaN`/số âm và chấp nhận POS không mã phê duyệt (BE `PaymentService` kiểm tra POS). | Kiểm tra ID, số tiền hữu hạn không âm, mã POS trước HTTP; chỉ gửi `posApprovalCode` khi POS. | Payment validation regression FAIL trước, PASS sau |

## Sửa lỗi màn hình và xử lý thất bại

- `ManagerDashboard.jsx`: load báo cáo và audit độc lập bằng `Promise.allSettled`; nếu audit bị `403`, tổng quan vẫn hiển thị nếu reports thành công. Nếu báo cáo lỗi không giả thành `0`; hiển thị lỗi rõ ràng.
- `ReportsAnalytics.jsx`: nếu API lỗi, không hiển thị doanh thu hoặc số lượng `0` như dữ liệu thật; có cảnh báo và khóa nút xuất CSV khi không có báo cáo.
- `MemberDashboard.jsx`: khi tải booking lỗi thì không hiển thị `0` như dữ liệu thật; bỏ KPI `CHUẨN INBODY` và thao tác AI không có Backend.
- `ReceptionistDashboard.jsx`: bỏ thao tác check-in không được Backend hỗ trợ, đổi lời mô tả thu ngân từ chuyển khoản/kích hoạt ngay sang CASH/POS/chờ máy chủ xác nhận; giữ cảnh báo check-in chưa khả dụng.
- `api.js`: tổng số ghi danh dùng `currentStatusCounts || {}` khi phản hồi report thiếu trường.

## Bằng chứng kiểm tra mới

- Đã chạy trước sửa `node --test tests/synchronization.test.mjs`: **0/4 đạt** (4 lỗi được tái hiện).
- Sau sửa `node --test tests/*.test.mjs`: **19/19 đạt**.
- `node node_modules/eslint/bin/eslint.js src --max-warnings 0`: **đạt**.
- Babel parser (JSX) duyệt **59/59 file nguồn không có syntax error**.
- `node node_modules/vite/bin/vite.js build`: **không chạy được** trong container Linux do archive chứa node_modules Windows, thiếu native `@rolldown/binding-linux-x64-gnu`. Đây là hạn chế môi trường, KHÔNG báo build PASS. Dùng `npm ci` trên máy đích rồi `npm run check`.
- Không có `dotnet` SDK và SQL Server LocalDB trong môi trường này: **chưa chạy** BE build, E2E FE→BE→SQL, migration, payment sandbox.

## Chưa hoàn thiện (cần Backend và môi trường thật)

Không thể biến các thao tác sau thành nghiệp vụ thật bằng sửa frontend: check-in/attendance, coach training/progress/notifications, member progress, Google OAuth, AI, facility inquiry, room CRUD, promotion member-to-staff, Manager quản trị role matrix (API admin-only). Các thao tác này cần quyết định API/permission/DB/workflow và test nghiệp vụ; UI chỉ ẩn/khóa thao tác hoặc báo chưa khả dụng. Giao dịch sandbox và session booking E2E cũng cần DB/sandbox cấu hình trên máy người vận hành.

## Chạy lại trên máy Windows

1. Frontend: vào thư mục `SWP391- SportsCenterManagement- frontend - Copy`, sao chép `.env.example` thành `.env.local`, cấu hình `VITE_API_BASE_URL` và `VITE_CENTER_ID` đúng với API/trung tâm. Chạy `npm ci`, `npm run check`, `npm run dev -- --port 3003`.
2. Backend: đọc `START_HERE.txt`, thiết lập `ConnectionStrings__SportsCenter`, `Jwt__Key` (ít nhất 32 bytes), giữ `Database__SeedDemoData=false` trên DB hiện hữu. Chạy `dotnet restore`, `dotnet build`, chạy API theo hướng dẫn. Không tự migrate/seed vào dữ liệu quan trọng.
3. Kiểm thử thủ công login các vai trò, tra cứu hội viên, cash/POS sandbox, gói tập, quyền đọc staff/reports/audit, và các nhánh 401/403/422. Không thực hiện thanh toán thật.

Bản ZIP mới lược bỏ `node_modules`, `bin`, `obj`, `.env.local`, `dist` để tránh native runtime khác máy và không phát hành cấu hình cá nhân. Không sửa database hoặc đưa token/secrets vào ZIP.
