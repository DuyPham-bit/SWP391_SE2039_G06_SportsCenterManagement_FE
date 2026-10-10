# Project SCMS kèm dữ liệu mẫu DB

Gói này chứa source backend, frontend, migrations, schema SQL và bộ nạp dữ liệu mẫu `Backend/database/DemoSeeder`. Dữ liệu mẫu được tạo bằng model backend; không cần sao chép file MDF của máy gốc.

## Tạo DB demo trên máy mới

Yêu cầu Windows, .NET SDK 10, SQL Server LocalDB, Node.js/npm phù hợp package.json. Mở PowerShell tại thư mục giải nén:

```powershell
.\SETUP_DEMO.ps1
```

Script tạo DB mới `SportsCenterManagement_Demo`, áp dụng migrations, tạo dữ liệu nền và bộ demo liên kết. Nếu tên DB đã tồn tại, script dừng để tránh ghi đè. Có thể chọn tên mới bằng `-DatabaseName SCMS_Demo2`. Để nạp demo vào DB đã có schema, đặt `ConnectionStrings__SportsCenter` rồi chạy DemoSeeder không có `--initialize`.

## Chạy backend

Trong cùng cửa sổ PowerShell sau khi setup:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Database__SeedDemoData = 'false'
$env:Jwt__Key = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:Bootstrap__SystemAdmin__Username = 'demo_systemadmin'
$env:Bootstrap__SystemAdmin__Email = 'demo_systemadmin@example.com'
$env:Bootstrap__SystemAdmin__Password = 'Demo@2026Scms!'
dotnet run --project '.\SWP391_SE2039_G06_SportsCenterManagement_BE\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj' --no-launch-profile --urls http://localhost:54162
```

## Chạy frontend

Mở terminal khác, vào thư mục frontend, sao chép `.env.example` thành `.env.local`, đặt `VITE_API_BASE_URL=http://localhost:54162` và `VITE_CENTER_ID=1`, sau đó:

```powershell
npm ci
npm run dev -- --port 3003
```

## Tài khoản và dữ liệu mẫu

Mật khẩu chung cho các tài khoản có tiền tố `demo_`: `Demo@2026Scms!`.

| Vai trò | Email |
|---|---|
| Quản lý | demo_manager@example.com |
| Lễ tân | demo_reception@example.com |
| Coach | demo_coach01@example.com đến demo_coach03@example.com |
| Hội viên | demo_member01@example.com đến demo_member08@example.com |

Có 3 lớp Published, 54 buổi tập, 8 hội viên, 8 subscription/hóa đơn, 6 thanh toán mẫu, 42 booking và 18 điểm danh. Hội viên 01–06 đã trả đủ; 07–08 chờ thanh toán. Ngày được tính theo thời điểm chạy bộ nạp. Chạy lại bộ nạp thông thường không tạo trùng. Dữ liệu nền do initializer tạo thêm center, role, quyền và các tài khoản demo cũ; dùng các tài khoản demo_ trong bảng trên để kiểm thử.

## Phạm vi kiểm chứng

Đã nạp bộ demo vào LocalDB SportsCenterManagement trên máy gốc, xác nhận số lượng và 0 sai lệch liên kết tài chính, xác nhận chạy lại không ghi thêm. Project seeder biên dịch thành công. Luồng khởi tạo DB mới và toàn bộ thao tác giao diện chưa được kiểm thử end-to-end. DB gốc có cột legacy payments.attempted_at; seeder tương thích cột này, nhưng backend tạo payment mới cần kiểm tra riêng nếu dùng lại DB gốc. Gói không chứa DB gốc, thông tin kết nối riêng, node_modules hay build outputs.
