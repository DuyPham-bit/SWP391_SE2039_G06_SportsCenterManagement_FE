# Các thay đổi kết nối Frontend – Backend

Tài liệu này ghi lại các thay đổi đã thực hiện để frontend React gọi các API hiện có của backend .NET, đồng thời giữ nguyên các module chưa có endpoint tương ứng.

## Cấu hình

Trong file `.env` của frontend:

- `VITE_API_BASE_URL=http://localhost:54162/api`: URL API backend theo cấu hình chạy local.
- `VITE_CENTER_ID=1`: mã trung tâm mặc định dùng khi tải hoặc tạo gói tập.
- `VITE_USE_MOCK=true`: chạy frontend độc lập không cần backend, dùng mock dữ liệu cục bộ; để bật API thật, đặt thành `false` khi backend đang chạy.

## Các phần đã sửa

### Frontend

- `src/services/api.js`
  - Thêm hàm dùng chung để gửi request JSON, tự gắn JWT Bearer token và hiển thị lỗi từ backend.
  - Nối đăng nhập, đăng ký, lấy hồ sơ, cập nhật hồ sơ, đổi mật khẩu và quy trình yêu cầu/đặt lại mật khẩu.
  - Nối tải, tạo, cập nhật và đổi trạng thái gói tập; chuyển đổi tên trường/định dạng giữa giao diện hiện có và DTO của backend.
  - Nối tạo URL thanh toán VNPay. Khi backend trả URL, frontend chuyển người dùng sang trang thanh toán.
  - Không giả lập thành công với đăng nhập Google khi backend chưa có endpoint Google.
- `src/context/AuthContext.jsx`
  - Lưu token cùng thông tin phiên đăng nhập và gửi yêu cầu tải lại hồ sơ khi khôi phục phiên.
  - Khi chạy chế độ mock, tiếp tục dùng hành vi local storage cũ.
- `src/features/auth/LoginPage.jsx`
  - Áp dụng kiểm tra mật khẩu theo yêu cầu backend khi đăng ký bằng API; giữ quy tắc cũ khi chạy mock.
- `src/features/auth/ForgotPasswordModal.jsx`
  - Gửi yêu cầu OTP và đặt lại mật khẩu qua API.
  - Hiển thị OTP phát triển nếu backend trả về; kiểm tra mật khẩu phù hợp với yêu cầu backend.
- `src/features/member/MemberPackages.jsx`
  - Hiển thị lỗi nếu không tải được gói tập.
  - Chỉ cung cấp phương thức VNPay trong chế độ API thật; mock vẫn giữ các lựa chọn thanh toán cũ.

### Backend

- `SportsCenterManagement.API/Controllers/AuthController.cs`
  - Đánh dấu constructor nhận dependency để ASP.NET Core DI chọn đúng constructor, tránh lỗi kích hoạt controller khi gọi endpoint xác thực.
  - Không thay đổi nghiệp vụ xác thực.

## API được sử dụng

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `GET /api/centers/{centerId}/membership-packages`
- `POST /api/centers/{centerId}/membership-packages`
- `PATCH /api/membership-packages/{packageId}`
- `POST /api/payments/create-vnpay-url`

## Kiểm tra đã thực hiện

- Frontend: `npm run build` thành công.
- Backend: `dotnet build SportsCenterManagement.API.csproj --no-restore` thành công sau khi build sang thư mục output riêng vì backend đang chạy.
- Kiểm tra local: health API trả HTTP `200`, preflight CORS từ `http://localhost:3003` trả `204`, danh sách gói tập trả `200`.
- Các file frontend đã sửa không có lỗi được báo trong Problems.

## Lưu ý khi chạy

1. Khởi động lại backend để tiến trình đang chạy nạp bản sửa `AuthController.cs`.
2. Khởi động lại Vite sau khi thay đổi `.env` để các biến `VITE_*` được nạp lại.
3. Xác nhận SQL Server và cơ sở dữ liệu backend đã sẵn sàng.
4. Các module không có endpoint tương ứng trong backend chưa được chuyển khỏi local storage/mock.
5. Thanh toán API thật hiện chỉ dùng VNPay và cần cấu hình VNPay hợp lệ phía backend.
