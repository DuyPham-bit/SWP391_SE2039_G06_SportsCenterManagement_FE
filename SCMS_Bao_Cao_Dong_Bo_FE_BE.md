# BÁO CÁO KIỂM TRA ĐỒNG BỘ FRONTEND – BACKEND DỰ ÁN SCMS

**File được rà soát trong báo cáo trước:** `SCMS_Project_FE_BE_Phase1_Fixed(1).zip`  
**Phạm vi:** Frontend React, service API, các controller/DTO Backend C#, các vấn đề đồng bộ dữ liệu và các kiểm thử đã được báo cáo.  
**Lưu ý:** Tài liệu này tổng hợp nguyên nội dung và kết luận từ lần báo cáo trước, không phải kết quả của một vòng kiểm thử mới. Các hạng mục *đã sửa mã nguồn* không có nghĩa đã xác nhận chạy end-to-end với SQL Server.

## 1. Tổng quan kết quả

| Nhóm | Số lượng | Diễn giải |
|---|---:|---|
| Nhóm đã chỉnh sửa trong mã nguồn | **14** | Đã tìm thấy các thay đổi FE/BE theo báo cáo kiểm tra trước |
| Hạng mục còn phải phát triển Backend | **11** | API hoặc nghiệp vụ Backend chưa hoàn thiện |
| Hạng mục còn phải phát triển Frontend | **10** | Backend có API nhưng FE chưa kết nối/hoàn thiện |
| Vấn đề đồng bộ/hiển thị/tài liệu còn sót | **7** | Cần khắc phục hoặc xác minh thêm |
| Kiểm thử Frontend | **25/25 đạt** | Theo lần chạy đã báo cáo, chủ yếu dùng phản hồi API mô phỏng |
| Build Backend, kết nối SQL, E2E | **Chưa xác minh** | Không suy ra đã hoạt động chỉ từ việc có mã nguồn |

> Các nhóm có thể giao nhau về nghiệp vụ, không cộng dồn thành tỷ lệ phần trăm hoàn thành toàn dự án.

## 2. Những vấn đề đã sửa trong mã nguồn

| STT | Chức năng | Nội dung thay đổi đã được ghi nhận | Phía sửa |
|---:|---|---|---|
| 1 | Receptionist Dashboard | Bỏ chặn route Dashboard, hiển thị dữ liệu từ API | FE |
| 2 | Check-in hội viên | Có giao diện, POST ghi check-in và GET lịch sử trong ngày | FE + BE |
| 3 | Điểm danh lớp học | Có API lấy danh sách học viên và lưu trạng thái điểm danh | FE + BE |
| 4 | Lịch dạy HLV | Chuyển ngày ISO sang thứ trong tuần, sửa bộ lọc lịch | FE |
| 5 | Lớp đã đặt | Ánh xạ đúng `sessionDate`, `bookedAt`, trạng thái booking | FE |
| 6 | Quản lý lớp | Lấy lịch học từ API thật, bỏ số liệu ghi danh không xác thực | FE |
| 7 | Vai trò và phân quyền | Dùng `roleId`, mã quyền Backend; thêm route SystemAdmin | FE |
| 8 | Thu ngân | Kiểm tra số tiền, ID hội viên/gói tập và mã phê duyệt POS | FE |
| 9 | Manager Dashboard | Tách xử lý lỗi API, không hiển thị số liệu giả khi thiếu dữ liệu | FE |
| 10 | Coach Dashboard | Phân biệt tổng lượt booking với số học viên duy nhất | FE |
| 11 | Hồ sơ hội viên | Lấy mã hội viên và gói đang hoạt động từ Backend | FE |
| 12 | Menu điều hướng | Ẩn các chức năng chưa có API khỏi menu chính | FE |
| 13 | Gọi HTTP | Xử lý Bearer Token, lỗi `401/403`, timeout và lỗi mạng | FE |
| 14 | Thanh toán online | Gọi API tạo URL thanh toán, sử dụng `Idempotency-Key` | FE |

### 2.1. Endpoint Backend mới đã có trong mã nguồn

| Phương thức | Đường dẫn | Controller | Trạng thái |
|---|---|---|---|
| GET | `/api/centers/{centerId}/check-ins` | `CenterCheckInsController.cs` | Đã viết code |
| POST | `/api/centers/{centerId}/check-ins` | `CenterCheckInsController.cs` | Đã viết code |
| GET | `/api/coaches/me/sessions/{sessionId}/roster` | `CoachAttendanceController.cs` | Đã viết code |
| PUT | `/api/coaches/me/sessions/{sessionId}/attendance` | `CoachAttendanceController.cs` | Đã viết code |

**Chưa xác minh:** Biên dịch C#, vận hành các endpoint và ghi/đọc dữ liệu bằng SQL Server thật. Các controller có kiểm tra điều kiện và vai trò trong mã nguồn nhưng vẫn phải thử các nhánh quyền truy cập và lỗi nghiệp vụ.

## 3. Những chức năng Backend vẫn còn thiếu

| STT | Chức năng | Tình trạng FE | Phía cần làm | Ưu tiên |
|---:|---|---|---|---|
| 1 | Tạo, sửa, xóa giáo án tập luyện | Có giao diện nhưng bị khóa | BE | P1 |
| 2 | Giao giáo án cá nhân cho hội viên | Có giao diện dự kiến | BE | P1 |
| 3 | Ghi nhận kết quả buổi tập | Có giao diện nhưng chưa lưu thật | BE | P1 |
| 4 | Xem tiến độ tập luyện của hội viên | Có giao diện nhưng bị khóa | BE | P1 |
| 5 | Tạo và cập nhật phòng/sân | Có giao diện; API đọc đã có | BE | P1 |
| 6 | Thông báo giữa HLV và hội viên | Có giao diện nhưng bị khóa | BE | P2 |
| 7 | Chuyển tài khoản hội viên thành nhân viên | FE có luồng dự kiến | BE | P2 |
| 8 | Tiếp nhận yêu cầu tư vấn/thuê sân | FE có form nhưng chưa gửi được | BE | P2 |
| 9 | Đăng nhập Google OAuth | Có modal nhưng chưa đăng nhập được | BE + FE | P3 |
| 10 | AI đề xuất giáo án cho HLV | Có giao diện nhưng bị khóa | BE | P3 |
| 11 | AI trợ lý cho hội viên | Có giao diện nhưng bị khóa | BE | P3 |

**Căn cứ nêu trong lần rà soát trước:** Các phương thức như `getMyProgress`, `getMyPlans`, `askAI`, `createTrainingPlan`, `recordWorkoutProgress`, `sendNotification` và thao tác ghi phòng/sân trong `src/services/api.js` vẫn trả lỗi `501` ở phía FE.

## 4. Những chức năng Frontend còn thiếu dù Backend đã có API

| STT | Chức năng | Tình trạng Backend | Phía cần làm | Ưu tiên |
|---:|---|---|---|---|
| 12 | Ghi danh hội viên vào lớp (Enrollment) | Có API enrollment | FE | P1 |
| 13 | Xem chi tiết hóa đơn | Có API hóa đơn | FE | P2 |
| 14 | Thu tiền bổ sung theo hóa đơn | Có API ghi nhận thanh toán | FE | P2 |
| 15 | Hoàn tiền và hủy giao dịch tại quầy | Có API refund/counter-void | FE | P2 |
| 16 | Đối soát giao dịch thanh toán | Có API reconcile | FE | P2 |
| 17 | Đăng ký, sửa, khóa hồ sơ hội viên tại quầy | Có API quản lý hội viên | FE | P2 |
| 18 | Sửa/xóa lịch học định kỳ | Có API PUT/DELETE schedule | FE | P2 |
| 19 | Hủy phân công HLV khỏi lớp | Có API DELETE class-coach | FE | P2 |
| 20 | Xem chi tiết và hủy lớp quản lý | Có API GET/DELETE class | FE | P2 |
| 21 | Tạo, sửa, xóa vai trò hệ thống | Có API CRUD role | FE | P2 |

**Ghi chú:** Mục 21 là hạng mục bổ sung ở lần rà soát gần nhất. Màn SystemAdmin đã có chỉnh sửa ma trận quyền nhưng chưa khai thác hết API CRUD vai trò.

## 5. Những vấn đề đồng bộ còn sót

| Mức độ | Vấn đề | Vị trí/bằng chứng được báo cáo | Phía cần sửa |
|---|---|---|---|
| **Cao** | Phân quyền FE chưa hoàn toàn dựa trên quyền Backend | `permissions.js:202` dùng `cap.defaultRole === role` khi capability chưa có mapping | FE |
| **Trung bình** | KPI lượt check-in của Manager chưa hoạt động | `api.js:209` còn `todayCheckins: null` | FE; BE nếu cần API tổng hợp chính xác |
| **Trung bình** | Booking được diễn giải thành đã tham gia lớp | `ClassScheduleView.jsx:144` hiển thị “ĐÃ THAM GIA” dựa trên booking xác nhận, không phải attendance | FE |
| **Trung bình** | Dashboard HLV gọi số ca dạy là số lớp | `CoachDashboard.jsx:76–79` đếm `classes.length` từ danh sách session | FE |
| **Trung bình** | Sĩ số/ghi danh và booking bị nhập nhằng | `api.js:17` gán `enrolledCount = bookedCount` theo buổi | FE; BE nếu cần thống kê enrollment riêng |
| **Thấp** | Chứng chỉ HLV hiện giá trị thay thế gây hiểu nhầm | `CoachAssignment.jsx:170` dùng “Chứng chỉ Quốc tế” khi thiếu dữ liệu | FE |
| **Thấp** | Tài liệu tích hợp cũ chưa được cập nhật | `FE-BE-DB-API-MAPPING.md` còn ghi check-in/attendance chưa có controller | Tài liệu |

> Các số dòng là tham chiếu của báo cáo kiểm tra trước; có thể thay đổi khi tiếp tục sửa mã nguồn.

## 6. Những việc chưa kiểm chứng thực tế

| Kiểm tra | Trạng thái báo cáo | Lý do / Điều cần xác minh |
|---|---|---|
| Kiểm thử Frontend | **Đạt 25/25** | Chủ yếu là kiểm tra bằng phản hồi API mô phỏng |
| Đối chiếu FE API với controller/DTO | **Đã rà soát mã nguồn** | Chưa thay thế cho chạy ứng dụng thực tế |
| `dotnet build` | **Chưa xác minh** | Cần .NET SDK tương thích và chạy build |
| Check-in + SQL Server | **Chưa xác minh** | Quyền, ngày giờ, trùng lượt, dữ liệu tồn tại |
| Điểm danh + SQL Server | **Chưa xác minh** | Phân công HLV, roster, ghi nhận và cập nhật |
| Booking, waitlist và enrollment E2E | **Chưa xác minh** | Sức chứa, trùng đăng ký, các chuyển trạng thái |
| Thanh toán, hoàn tiền, callback | **Chưa xác minh** | Tính nhất quán hóa đơn/giao dịch, đối soát |
| Đồng thời và chống ghi trùng | **Chưa xác minh** | Gọi lặp, race condition, idempotency |

## 7. Thứ tự xử lý đề xuất

### Bước 1 — Kiểm thử nền tảng, xử lý phân quyền (ưu tiên cao nhất)

- Build Backend .NET và khởi động SQL Server thử nghiệm.
- Xác minh API check-in, roster và điểm danh hoạt động end-to-end với dữ liệu thực.
- Sửa `defaultRole` fallback không phản ánh đúng quyền Backend.
- Kiểm thử cả trường hợp được phép và bị từ chối (`401/403`).

### Bước 2 — Hoàn thiện nghiệp vụ cốt lõi

- Thêm Backend giáo án, giao giáo án, tiến độ luyện tập.
- Thêm Backend tạo/cập nhật phòng/sân.
- Hoàn thiện FE enrollment kết nối API hiện có.

### Bước 3 — Thu ngân và quản trị

- Hoàn thiện giao diện hóa đơn, thanh toán bổ sung, hoàn tiền và đối soát.
- Nối chức năng quản lý hội viên tại quầy; sửa/xóa lịch định kỳ.
- Bổ sung hủy phân công HLV, chi tiết/hủy lớp, CRUD role.
- Chỉnh các nhãn và chỉ số Dashboard để không đánh đồng booking với attendance/enrollment.

### Bước 4 — Tính năng mở rộng

- Google OAuth.
- Thông báo HLV–hội viên.
- AI cho HLV và hội viên.
- Form tư vấn/thuê sân.

## 8. Kết luận

Theo lần kiểm tra mã nguồn của bản SCMS trên:

- **14 nhóm** đã có thay đổi code để sửa lỗi hoặc đồng bộ FE–BE.
- **11 hạng mục** cần phát triển thêm Backend.
- **10 hạng mục** cần hoàn thiện Frontend khi Backend đã có API.
- **7 vấn đề** đồng bộ, cách hiển thị hoặc tài liệu cần xử lý.
- **25/25 bài kiểm thử FE đạt** trong lần chạy đã báo cáo, **chưa xác minh** build Backend và vận hành với SQL Server thật.

**Khuyến nghị:** Ưu tiên kiểm thử check-in/attendance với cơ sở dữ liệu thật và sửa phân quyền trước; sau đó thực hiện các hạng mục P1 (giáo án, tiến độ, phòng/sân, enrollment), tiếp đến P2 và P3.
