# SCMS Frontend

React frontend cho trung tâm thể thao SCMS. Đã chuyển service nghiệp vụ sang API ASP.NET Core thật. Dữ liệu lưu ở SQL Server qua BE; không có fallback sang mock. Kết quả hiện tại: [mapping](../FE-BE-DB-API-MAPPING.md), [thay đổi](../INTEGRATION_CHANGELOG.md), [kiểm thử](../INTEGRATION_TEST_REPORT.md). FRONTEND_AUDIT.md là audit lịch sử trước tích hợp.

## Chạy local

Yêu cầu Node.js nhánh 22 từ 22.13 trở lên hoặc Node.js 24 trở lên. Đã kiểm tra với Node 24.21.0.

```powershell
npm ci
Copy-Item .env.example .env.local
# Đặt VITE_CENTER_ID theo ID trung tâm thật, VITE_API_BASE_URL theo BE.
npm run dev
```

Vite mặc định dùng http://localhost:3003. Nếu có dev server chạy từ trước khi cập nhật dependency/config, dừng và chạy lại.

## Kiểm tra và build

```powershell
npm run lint
npm test
npm run build
# Hoặc chạy cả ba:
npm run check
npm run preview
```

Unit/contract tests dùng Node test runner trong `tests/`, HTTP fixtures riêng; đây không phải test SQL. `node tests/live-api-smoke.mjs` dùng API/SQL thật, chỉ chạy trên dev và cần SCMS_TEST_MANAGER_LOGIN / SCMS_TEST_MANAGER_PASSWORD. Không ghi credential vào source; runner tạo dữ liệu test có tên riêng.

React được tải từ npm, Tailwind được biên dịch vào CSS qua Vite. Không cần CDN React/Tailwind khi chạy bản build. Ảnh minh họa và Google Fonts/Material Symbols vẫn tải từ dịch vụ ngoài.

## Tổ chức source

- `src/features/`: landing, auth và các màn hình theo vai trò.
- `src/components/`: layout, guard, modal, table và thành phần dùng chung.
- `src/context/`: phiên đăng nhập và thông báo.
- `src/services/`: HTTP client, adapter DTO, session thật, permissions và nội dung danh mục tĩnh.
- `src/styles/`: Tailwind và CSS của ứng dụng.

`sportsCatalog.js` và `facilityCatalog.js` là nguồn danh mục hiện tại cho 9 môn và 9 cơ sở. Đây là nội dung giới thiệu trên landing, không dùng ID tĩnh làm ID giao dịch. Môn, phòng, HLV và buổi học cho nghiệp vụ lấy từ API. Dữ liệu localStorage cũ được giữ nguyên nhưng không còn được đọc như DB.

Các màn hình thiếu API (check-in, attendance, training, progress, notifications, AI) giữ route/source và hiển thị chưa khả dụng. Google OAuth chưa có BE; thuê sân không giả gửi thành công. Ma trận quyền SystemAdmin không được cấp cho Manager. API key/payment secret chỉ đặt ở BE.
