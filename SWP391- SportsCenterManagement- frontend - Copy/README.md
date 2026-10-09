# SCMS Frontend

React frontend cho trung tâm thể thao SCMS. Hiện dùng service giả lập và localStorage; chưa kết nối API BE. Chi tiết hiện trạng, các lỗi đã sửa và thứ tự tích hợp: [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).

## Chạy local

Yêu cầu Node.js nhánh 22 từ 22.13 trở lên hoặc Node.js 24 trở lên. Đã kiểm tra với Node 24.21.0.

```powershell
npm ci
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

Unit/regression tests dùng Node test runner trong `tests/`, bộ nhớ giả lập riêng; không sửa localStorage của trình duyệt đang dùng.

React được tải từ npm, Tailwind được biên dịch vào CSS qua Vite. Không cần CDN React/Tailwind khi chạy bản build. Ảnh minh họa và Google Fonts/Material Symbols vẫn tải từ dịch vụ ngoài.

## Tổ chức source

- `src/features/`: landing, auth và các màn hình theo vai trò.
- `src/components/`: layout, guard, modal, table và thành phần dùng chung.
- `src/context/`: phiên đăng nhập và thông báo.
- `src/services/`: service giả lập, storage, permissions, danh mục và các helper.
- `src/styles/`: Tailwind và CSS của ứng dụng.

`sportsCatalog.js` và `facilityCatalog.js` là nguồn danh mục hiện tại cho 9 môn và 9 cơ sở. Dữ liệu seed mới tham chiếu các danh mục này; dữ liệu đã lưu từ trước được giữ nguyên.

Khi nối BE, thay từng service và loại dần các thao tác `db` trong feature. API key của chatbot và thông tin bí mật cần cấu hình ở BE.
