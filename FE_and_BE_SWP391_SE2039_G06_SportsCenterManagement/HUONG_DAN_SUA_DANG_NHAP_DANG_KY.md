# Hướng dẫn xử lý lỗi đăng nhập và đăng ký

## Lỗi đã kiểm tra trong project

Frontend và backend đã kết nối được:

- API health tại `http://localhost:54162/api/health` trả HTTP `200`.
- CORS preflight từ frontend `http://localhost:3003` trả HTTP `204`.
- Nhưng `POST /api/auth/login` và `POST /api/auth/register` trên backend đang chạy trả HTTP `500`.
- Nội dung lỗi cho biết ASP.NET Core không chọn được constructor của `AuthController`.

Trong mã nguồn hiện tại, constructor chính đã được đánh dấu `[ActivatorUtilitiesConstructor]` tại:

`SWP391_SE2039_G06_SportsCenterManagement_BE-DuyV2/Backend/SportsCenterManagement.API/Controllers/AuthController.cs`

Vì vậy, lỗi phát sinh do tiến trình backend đang chạy chưa nạp bản build có thay đổi này.

## Cách khắc phục

### 1. Dừng backend đang chạy

Trong cửa sổ terminal đang chạy backend, nhấn `Ctrl+C`. Không cần dừng các tiến trình khác.

### 2. Build và chạy lại backend

Mở PowerShell tại thư mục:

`C:\SWP391\Test3\SWP391_SE2039_G06_SportsCenterManagement_BE-DuyV2\Backend\SportsCenterManagement.API`

Chạy:

```powershell
dotnet build SportsCenterManagement.API.csproj
dotnet run --no-build --urls "http://localhost:54162"
```

Giữ cửa sổ terminal này mở trong khi sử dụng ứng dụng. Nếu project được khởi động bằng Visual Studio, hãy dừng phiên cũ và chạy lại project `SportsCenterManagement.API` để nạp bản build mới.

### 3. Khởi động lại frontend

Trong terminal khác, mở thư mục:

`C:\SWP391\Test3\SWP391- SportsCenterManagement- frontend - Copy`

Chạy:

```powershell
npm run dev
```

Mở `http://localhost:3003`. Frontend hiện cấu hình gọi API thật qua `VITE_API_BASE_URL=http://localhost:54162/api` và `VITE_USE_MOCK=false`.

### 4. Kiểm tra API

Sau khi backend chạy lại, kiểm tra health:

```powershell
curl.exe -i http://localhost:54162/api/health
```

Health trả `200` chỉ xác nhận API đã chạy. Để kiểm tra đăng nhập/đăng ký, thử từ giao diện; khi thông tin không hợp lệ, API cần trả lỗi xác thực/validation (thường `400` hoặc `401`), không còn trả `500` vì constructor.

## Điều kiện đăng ký theo backend

- Mật khẩu tối thiểu 12 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
- Email cần hợp lệ và chưa được dùng.
- Tên đăng nhập do frontend tạo từ phần trước `@` của email; chỉ gồm chữ/số, dấu chấm, gạch dưới hoặc gạch ngang.
- Số điện thoại là tùy chọn. Nếu nhập, backend chấp nhận từ 8 đến 15 chữ số, có thể có dấu `+` ở đầu; không nhập khoảng trắng hoặc dấu gạch.

## Nếu vẫn gặp lỗi

1. Mở Developer Tools của trình duyệt (`F12`), chọn tab **Network**.
2. Thử đăng nhập hoặc đăng ký và chọn request `/api/auth/login` hoặc `/api/auth/register`.
3. Ghi lại **Status Code** và nội dung **Response**. Không gửi mật khẩu hoặc token.
4. Nếu vẫn là `500` và nhắc đến nhiều constructor, xác nhận backend đã được dừng hẳn và chạy lại đúng project trong đường dẫn ở trên.
5. Nếu trả `400`, đọc nội dung lỗi để kiểm tra điều kiện mật khẩu, email hoặc số điện thoại. Nếu trả `401`, thông tin đăng nhập không khớp tài khoản trong database backend.
