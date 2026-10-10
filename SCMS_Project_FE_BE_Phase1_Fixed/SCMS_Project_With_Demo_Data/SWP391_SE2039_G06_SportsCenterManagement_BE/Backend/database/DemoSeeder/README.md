# Dữ liệu demo liên kết

Chạy từ Backend:

```powershell
dotnet run --project database/DemoSeeder/DemoSeeder.csproj
```

Dùng `ConnectionStrings__SportsCenter` nếu được đặt, mặc định LocalDB `SportsCenterManagement`. Yêu cầu DB đã có migrations, center Active và các role Manager/Receptionist/Coach/Member. Công cụ chạy trong một transaction, chỉ thêm dữ liệu có tiền tố demo/DEMO; không chạy tự động khi API khởi động. Chạy lại sau khi thành công sẽ bỏ qua toàn bộ bộ dữ liệu; không dùng để sửa dữ liệu demo bị xóa thủ công. Không chạy đồng thời nhiều bản.

Tài khoản đăng nhập bằng email, mật khẩu chung `Demo@2026Scms!`:

| Vai trò | Email |
|---|---|
| Quản lý | demo_manager@example.com |
| Lễ tân | demo_reception@example.com |
| Huấn luyện viên | demo_coach01@example.com đến demo_coach03@example.com |
| Hội viên | demo_member01@example.com đến demo_member08@example.com |

Bộ mẫu gồm 3 lớp Published (Gym, Yoga, Cầu lông), 3 phòng, 3 coach, 54 buổi (-3 đến +14 ngày theo giờ Việt Nam), 8 hội viên, 1 gói, 8 hóa đơn/subscription. Hội viên 01–06 có gói Active đã trả đủ bằng CASH/Succeeded, ghi danh Confirmed, booking Booked và điểm danh Present trong quá khứ. Hội viên 07–08 có gói PendingPayment và hóa đơn Issued để thử thu tiền. Thời hạn gói là 90 ngày tính cả ngày đầu/cuối. Không có giao dịch qua cổng thanh toán thật.

Frontend: đặt `VITE_CENTER_ID` theo ID được in khi chạy (lần nạp hiện tại: 1), `VITE_API_BASE_URL=http://localhost:54162`. Các trạng thái được giữ đúng dạng backend; `src/services/api.js` chuyển đổi cho giao diện. Ngày mẫu cố định tại lần nạp, không tự gia hạn khi khởi động lại.

DB hiện tại giữ cột legacy bắt buộc `payments.attempted_at`; công cụ phát hiện và điền cùng thời điểm với `created_at`. Backend hiện không ánh xạ cột này, nên thao tác tạo thanh toán mới qua API cần được kiểm tra/sửa riêng trước khi khẳng định toàn bộ luồng thanh toán hoạt động. Bộ nạp không thay đổi schema hoặc quyền hiện hữu.
