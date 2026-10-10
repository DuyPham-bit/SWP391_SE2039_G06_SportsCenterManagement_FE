# Rà soát Frontend SCMS — 09/10/2026

## Kết luận

FE đã có nền tảng để bắt đầu tích hợp BE theo từng luồng. Chưa đủ điều kiện chạy thật với người dùng: đăng nhập, Google, OTP, thanh toán, dữ liệu nghiệp vụ và AI hiện còn giả lập; form thuê sân chưa gửi yêu cầu tới server.

Nên chốt cấu trúc màn hình chính rồi nối API ngay, tiếp tục chỉnh UI song song. Làm chatbot sau khi danh mục, giá, giờ hoạt động và API tra cứu của trung tâm đã thống nhất.

## Phạm vi và kết quả kiểm tra

- Rà toàn bộ 58 file JS/JSX trong `src`, cấu hình build, dependencies và cấu trúc gọi dữ liệu.
- `npm run check`: ESLint không lỗi/cảnh báo, 10 kiểm thử hồi quy đạt, build production thành công.
- `npm install --package-lock-only --ignore-scripts --no-fund`: audit 153 packages, không phát hiện lỗ hổng tại thời điểm kiểm tra.
- Trình duyệt Edge: đăng nhập qua form và mở 26 route nghiệp vụ của Manager, Receptionist, Coach, Member; kiểm tra khung nhìn 1440px và 390px trên dev và bản build production.
- Landing, login, register: kiểm tra tràn ngang tại 320, 390, 768, 1440px.
- Kiểm tra luồng auth và giới hạn Unicode ở các ô mật khẩu: nhập, dán, bộ gõ, hiện/ẩn mật khẩu; tên tiếng Việt vẫn nhập được.
- Kiểm tra thu hồi quyền ngay trên trang đang mở, cập nhật sidebar, khôi phục quyền và chặn URL khác vai trò.
- Kiểm tra modal chọn đủ 9 sân, chuyển sang Pickleball, giữ focus bằng Tab và đóng bằng Escape.
- Kiểm tra Table khi đang ở trang 2 rồi dữ liệu giảm còn một trang; kiểm tra ErrorBoundary bằng lỗi render có chủ đích.
- Bản production: 26 route không ghi nhận exception hoặc HTTP lỗi ở asset nội bộ; nút xuất báo cáo tạo Blob CSV gồm header và 8 chỉ số. Header landing sau đăng nhập cũng được kiểm tra tại 320/390px.

Các kiểm tra trình duyệt là smoke test và kiểm tra hành vi chọn lọc. Chưa kiểm thử mọi tổ hợp nghiệp vụ, mọi trình duyệt, hiệu năng tải thực tế hoặc API end-to-end với BE.

## Các vấn đề đã sửa

| Vấn đề | Thay đổi |
|---|---|
| Thu hồi capability nhưng vẫn truy cập được do thuộc đúng role | RoleGuard kiểm tra capability bắt buộc và cập nhật khi quyền thay đổi; redirect đăng nhập trong effect |
| Trang mua gói hội viên dùng quyền quản lý gói | Tách `view_packages`; migration một lần từ quyền mua gói cũ, không tự cấp lại sau khi bị thu hồi |
| HLV nhìn thấy lớp của người khác / lọc theo tên dễ trùng | Lọc theo coach ID trong service và các màn hình HLV; Manager vẫn có phạm vi quản lý |
| Dữ liệu mock còn 15 môn, Tennis và tên sân lệch landing | Dùng chung sportsCatalog/facilityCatalog; seed mới gồm đúng 9 môn, 9 cơ sở, Pickleball và quyền lợi gói tương ứng |
| Bảng rỗng tự sinh dữ liệu mẫu trở lại; đổi version có thể xóa giao dịch | Giữ bảng rỗng và dữ liệu đã nhập; migration chỉ bổ sung bảng thiếu và quyền mới |
| Session lưu cả mật khẩu | Lọc password trước khi lưu/đọc session và cập nhật hồ sơ |
| Table rỗng khi xóa bản ghi ở trang cuối | Giới hạn trang hiện tại theo số trang còn lại |
| Ngày đặt mặc định cố định / lấy ngày UTC | Dùng ngày địa phương hiện tại |
| Modal thiếu thao tác bàn phím | Thêm dialog semantics, focus trap, Escape và trả focus về vị trí cũ |
| Một lỗi render có thể làm trắng toàn ứng dụng | Thêm ErrorBoundary với giao diện phục hồi |
| Xuất báo cáo chỉ hiện toast | Tạo CSV UTF-8 có BOM, escape dấu nháy và chống chuỗi bị hiểu thành công thức |
| Tràn ngang và khó đọc trên điện thoại | Sửa thanh lọc nhân viên, chọn lớp của HLV, banner quản lý, header/ô thống kê landing và vị trí toast |
| React/Tailwind tải thêm qua CDN và build phụ thuộc plugin tự sửa import | Dùng React từ npm, Tailwind biên dịch qua Vite; import JSX tường minh; loại custom resolver/React global |
| Bundle chính lớn; chưa có lint/test | Lazy-load màn hình nghiệp vụ; thêm ESLint/Rules of Hooks và 10 regression tests |

Bộ công cụ sau cập nhật: Vite 8.3.4, plugin React 6.1.2, Tailwind 4.3.3, ESLint 10. Main JS khoảng 303 kB trước gzip (trước khoảng 546 kB); đây là số đo build, chưa phải số đo tốc độ tải.

Các bảng đã lưu trên trình duyệt cũ được giữ nguyên để tránh mất dữ liệu người dùng. Những tên môn/sân cũ đã lưu có thể còn xuất hiện trong dữ liệu lịch sử; seed mới không đồng nghĩa ghi đè toàn bộ dữ liệu cũ.

## Những phần còn phải hoàn thiện trước khi chạy thật

| Ưu tiên | Nơi cần xử lý | Hiện trạng và việc cần làm |
|---|---|---|
| P0 | [api.js](src/services/api.js), [dbStorage.js](src/services/dbStorage.js), [AuthContext.jsx](src/context/AuthContext.jsx) | Services đang thao tác localStorage; token giả, mật khẩu mẫu dạng rõ. Thay bằng HTTP client và xác thực BE; quyền/ownership phải được kiểm tra ở server. Việc bỏ password khỏi session không biến mock auth thành auth thật. |
| P0 | [GoogleLoginModal.jsx](src/features/auth/GoogleLoginModal.jsx), [ForgotPasswordModal.jsx](src/features/auth/ForgotPasswordModal.jsx), authApi | Google đang nhận email do người dùng nhập; OTP cố định 123456/8888. Cần OAuth được BE xác minh, API gửi/xác thực mã có hạn dùng. |
| P0 | [MemberPackages.jsx](src/features/member/MemberPackages.jsx), memberApi.subscribeOnline | Thanh toán giả lập tự kích hoạt gói. Nối API tạo giao dịch và trạng thái BE xác nhận; hoàn tất thanh toán dựa trên callback/IPN đã xác minh. |
| P0 | [FacilitiesSection.jsx](src/features/landing/FacilitiesSection.jsx), handleSubmit | Form chỉ đổi state submitted; chưa lưu/gửi yêu cầu thuê sân. Cần DTO/API tiếp nhận, kiểm tra ngày/giờ/sức chứa và thông báo kết quả thật. |
| P1 | [ReportsAnalytics.jsx](src/features/manager/ReportsAnalytics.jsx), reportApi | Doanh thu/tăng trưởng/biểu đồ còn hardcode; nút tháng/quý chưa truy vấn đúng kỳ. CSV hiện xuất các chỉ số đang hiển thị, chưa phải báo cáo tài chính thật. |
| P1 | Các feature còn gọi db trực tiếp | Chuyển đọc/ghi về service API, thống nhất DTO, lỗi 400/401/403/409/500, loading/empty/error/retry và phân trang. |
| P1 | Đặt lớp, sửa lớp, check-in, mua/gia hạn gói | Xác minh lại rule với BE: lịch buổi học, hết hạn gói, trùng lịch, sức chứa, waitlist, hủy đặt và quyền theo center. Không dựa vào kiểm tra FE để giữ tính đúng khi nhiều người thao tác. |
| P1 | [MemberAIAssistant.jsx](src/features/member/MemberAIAssistant.jsx), [AIRecommendation.jsx](src/features/coach/AIRecommendation.jsx), api.js | AI trả nội dung mẫu; có thông tin tiện ích chưa được đối chiếu. Nút áp dụng giáo án chưa truyền bản nháp thực sự. Cần dữ liệu trung tâm được duyệt và API AI; chưa tích hợp chatbot mới trong đợt này. |
| P2 | Kiến trúc feature và trải nghiệm hoàn thiện | Một số component lớn, lặp form/style và nhiều nhãn “Olympic” chưa đồng nhất với cơ sở phong trào. Tách dần theo luồng đã nối API; kiểm tra nhãn/ảnh/tiện ích với nhóm. Bổ sung E2E, accessibility và kiểm thử đa trình duyệt theo các luồng thật. |

## Điểm cần chốt giữa FE và BE

BE đã có AuthController, Classes/ClassSchedules, SessionBookings, MembershipPackages, Payments và Reports. Vì vậy có thể bắt đầu tích hợp ngay; đây mới là kiểm tra source, chưa chạy hoặc xác nhận toàn bộ API hoạt động.

Hai khác biệt đã thấy trực tiếp:

1. BE `AuthResponse` trả `AccessToken, UserId (long), Role, ExpiresAt`; FE mock đang trả `{token, user}` và dùng ID chuỗi. Cần adapter/session model và gọi API hồ sơ, không chỉ thay base URL.
2. BE đặt chỗ theo `class-sessions/{sessionId:long}/bookings`, có 201 (đặt thành công) / 202 (waitlist). FE mock chủ yếu đặt theo class ID + ngày tự chọn. Cần đổi giao diện chọn buổi/lịch sang dữ liệu session thật và hiển thị waitlist đúng.

Đối chiếu thêm register request/response (FE hiện tự đăng nhập sau đăng ký), centerId, timezone và định dạng trạng thái. Chốt contract qua Swagger/Postman trước khi sửa từng service.

## Thứ tự triển khai đề nghị

1. Auth, profile và permissions: HTTP client, cấu hình base URL theo môi trường, trạng thái hết phiên, mapping DTO/ID/role.
2. Catalog, cơ sở, gói, lớp và buổi học: dùng dữ liệu BE làm nguồn thống nhất cho landing và khu vực đăng nhập.
3. Đặt/hủy chỗ, thuê sân, check-in: loading/error/retry và rule kiểm tra ở BE, thử tình huống tranh chỗ.
4. Subscription, thanh toán, hóa đơn và báo cáo: kiểm tra vòng đời PendingPayment/Active/Failed, callback và dữ liệu thống kê thật.
5. Chatbot: widget React → endpoint .NET → tài liệu công khai/API tra cứu trung tâm → model AI. Giữ API key ở BE, giới hạn phạm vi SCMS, trả lời thiếu dữ liệu rõ ràng, truy vấn lịch trống bằng API thay vì “train” dữ liệu biến động.

Mỗi luồng cần có tình huống thành công, lỗi dữ liệu, mất mạng, hết phiên và thiếu quyền rồi mới chuyển sang luồng tiếp theo. UI được chỉnh song song trong quá trình đó.

