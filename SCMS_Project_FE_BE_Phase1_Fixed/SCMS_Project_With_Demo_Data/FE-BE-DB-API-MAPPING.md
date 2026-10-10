# SCMS — audit FE / BE / DB (10/10/2026)

Audit trước sửa: FE README, FRONTEND_AUDIT, toàn bộ service/import db, AuthContext, các feature; BE Controllers, DTO API/BLL, Program, authentication, services, DbContext, migrations, schema.sql và Postman. Route dưới đây lấy từ Controller, không suy từ tên màn hình. Trạng thái là hiện trạng trước tích hợp; xác minh chạy thật được ghi riêng trong INTEGRATION_TEST_REPORT.md.

| Feature FE | Component/Service FE | Hiện trạng | Endpoint BE thực tế | Method | Request DTO | Response DTO | DB entity | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| Login | LoginPage/authApi | fake JWT, localStorage | /api/auth/login | POST | API LoginRequest: email (nhận cả username), password | API AuthResponse: accessToken,userId,role,expiresAt | User,Role,StaffProfile | NEEDS_FE_ADAPTER |
| Register | LoginPage/authApi | tự đăng nhập | /api/auth/register | POST | BLL RegisterRequest: username,email,password,fullName,phone,dateOfBirth,centerId | MemberProfileResponse (không token) | User,MemberProfile | NEEDS_FE_ADAPTER |
| Profile | AuthContext/Profile | localStorage | /api/profile/me; /api/members/me | GET,PATCH | UpdateProfileRequest / UpdateMemberProfileRequest | ProfileResponse / MemberProfileResponse | User,Member/Staff/CoachProfile | NEEDS_FE_ADAPTER |
| Change password | authApi | local password | /api/auth/change-password | POST | currentPassword,newPassword | AuthResponse (token mới) | User | NEEDS_FE_ADAPTER |
| Forgot/OTP | ForgotPasswordModal | timeout và OTP cố định | /api/auth/request-password-reset; /api/auth/reset-password | POST | email; email,otp,newPassword | PasswordResetRequestResponse; message | PasswordResetToken,User | NEEDS_FE_ADAPTER |
| Google OAuth | GoogleLoginModal | tin email nhập | Không có | — | Cần credential được BE xác minh | — | User | NEEDS_BACKEND_API |
| Packages | PackageManagement/MemberPackages/packageApi | localStorage | /api/centers/{centerId}/membership-packages[/all]; /{packageId}; /{packageId}/status | GET,POST,PUT,PATCH | SaveMembershipPackageRequest; SetMembershipPackageStatusRequest | MembershipPackageResponse | MembershipPackage | NEEDS_FE_ADAPTER |
| Member lookup/update/status | MemberLookup/receptionApi | localStorage | /api/centers/{centerId}/members[/{memberId}][/status] | GET,POST,PATCH | query (2–100 chars),page,pageSize<=50; RegisterRequest; UpdateMemberProfileRequest; SetMemberStatusRequest | PagedResponse<MemberProfileResponse> | MemberProfile,User | NEEDS_FE_ADAPTER |
| Staff | StaffManagement/staffApi | đổi ID giả khi bổ nhiệm | /api/centers/{centerId}/staff[/{staffUserId}] | GET,POST,PATCH | query; CreateCenterStaffRequest; UpdateCenterStaffRequest | CenterStaffResponse[] | User,StaffProfile,CoachProfile | NEEDS_FE_ADAPTER |
| Promote member | StaffManagement | chuyển role/ID local | Không có API chuyển role an toàn | — | Cần nghiệp vụ chuyển role, bảo toàn liên kết | — | User/profiles | NEEDS_BACKEND_API |
| Published classes | classApi | localStorage | /api/centers/{centerId}/classes | GET | centerId | ClassCatalogResponse[] | ClassEntity | NEEDS_FE_ADAPTER |
| Class management | ClassesAndRooms | localStorage | /api/classes[/{classId}]; /{classId}/publish | POST,GET,PUT,DELETE,POST | CreateClassRequest / UpdateClassRequest | ClassDetailResponse,CancelClassResult | ClassEntity | NEEDS_FE_ADAPTER |
| Weekly schedules | ClassesAndRooms | ngày/giờ local | /api/classes/{classId}/schedules[/{scheduleId}] | GET,POST,PUT,DELETE | Create/UpdateClassScheduleRequest | ClassScheduleResponse | ClassSchedule,ClassSession | NEEDS_FE_ADAPTER |
| Sessions | ClassScheduleView | classId + ngày tùy ý | /api/class-sessions | GET | sportId,coachId,from,to,page,pageSize | PagedResult<SessionScheduleItemResponse> | ClassSession,ClassEntity,SessionBooking | NEEDS_FE_ADAPTER |
| Coach teaching | TeachingSchedule | lọc coach user ID local | /api/coaches/me/teaching-schedule | GET | from,to (coach từ token) | TeachingScheduleItemResponse[] | ClassSession,CoachProfile | NEEDS_FE_ADAPTER |
| Assign coaches | CoachAssignment | userId giả | /api/classes/{classId}/coaches[/{coachId}] | GET,POST,DELETE | AssignCoachRequest: coachId = CoachProfile.Id, isPrimary | ClassCoachResponse[] | ClassCoach,CoachProfile | NEEDS_FE_ADAPTER |
| Booking/cancel/waitlist | ClassScheduleView/MyBookings | localStorage | /api/members/me/session-bookings; /api/class-sessions/{sessionId}/bookings; /api/session-bookings/{bookingId} | GET,POST,DELETE | ID thật, POST không body | BookSessionResult (201 booked/202 waitlisted),CancelBookingResult | SessionBooking,ClassWaitlist | NEEDS_FE_ADAPTER |
| Class enrollment | chưa có adapter FE | — | /api/members/me/enrollments; /api/classes/{classId}/enrollments[/{enrollmentId}] | GET,POST,DELETE | subscriptionId; reason | enrollment result | ClassEnrollment | READY |
| Subscription | MemberPackages/CounterMembership | tự Active | /api/members/me/subscriptions; /api/members/{memberId}/subscriptions | POST; POST,GET | CreateSubscriptionRequest: packageId | PendingMembershipResult / MemberSubscriptionResponse[] | MemberSubscription,Invoice,InvoiceItem | NEEDS_FE_ADAPTER |
| Online payment | MemberPackages | fake success | /api/payments/create-vnpay-url; create-momo-url; create-payos-url | POST | CreatePaymentRequest + Idempotency-Key | provider payment URL | Payment,Invoice,MemberSubscription | NEEDS_FE_ADAPTER |
| Counter payment/invoice | CounterMembership | fake receipt | /api/payments/counter-checkout; /api/invoices/{invoiceNumber}; /{invoiceNumber}/payments | POST,GET,POST | CounterPaymentRequest / RecordInvoicePaymentRequest + Idempotency-Key | CounterPaymentResponse / InvoiceDetailsResponse | Payment,Invoice | NEEDS_FE_ADAPTER |
| Reports | ReportsAnalytics/reportApi | số liệu hardcode | /api/reports/revenue; membership; classes | GET | from,to,groupBy,centerId | RevenueReportResponse,MembershipReportResponse,ClassEnrollmentReportResponse | Payment,PaymentRefund,MemberSubscription,ClassEnrollment | NEEDS_FE_ADAPTER |
| Audit | AuditLogs/systemApi | localStorage | /api/centers/{centerId}/audit-logs; /api/admin/audit-logs | GET | page,pageSize,filter | AuditLogPageResponse | AuditLog | NEEDS_FE_ADAPTER |
| Roles/permissions | RolesPermissions/permissions | quyền local, Manager bypass | /api/admin/roles; /api/admin/roles/{roleId}/permissions | GET,PUT | permissionCodes | RolePermissionMatrixResponse[] | Role,Permission,RolePermission | NEEDS_FE_ADAPTER |
| Centers/sports/rooms | static catalog/ClassesAndRooms | seed FE | Không có catalog CRUD Controller | — | Cần catalog GET có ID thật; room writes cần rule riêng | — | Center,Sport,Room | NEEDS_BACKEND_API |
| Attendance/check-in | Attendance/MemberCheckIn | mock | Không có Controller, mặc dù có entity | — | Cần sessionId/memberId, scope, quyền và chống check-in trùng | — | Attendance,CenterCheckin | NEEDS_BACKEND_API |
| Coach roster/training/progress/notifications | ClassMembers/TrainingPlan/WorkoutProgress/CoachNotifications/MyProgress | mock | Không có Controller phù hợp | — | Cần ownership lớp/hội viên, DTO và validation nghiệp vụ | — | TrainingPlan,TrainingResult,MemberProgressReview,Notification | NEEDS_BACKEND_API |
| Facility inquiry | FacilitiesSection | chỉ setSubmitted(true) | Không có | — | Cần fullName,phone,facilityId,date/time,purpose; rule availability và retention | — | SupportRequest chưa đồng nghĩa rental inquiry | NEEDS_BACKEND_API |
| AI | MemberAIAssistant/AIRecommendation | trả chuỗi mẫu | Không có | — | Đề xuất BE request question/context được phân quyền, response answer; secret/rate limit ở BE | AiConversation/AiMessage chưa có API | NOT_IN_SCOPE |

## Gap và kế hoạch đã chốt trước sửa

1. Tạo HTTP client, session mới chỉ nhận token BE, profile thật, không tự login register. Giữ dữ liệu localStorage cũ nguyên trạng nhưng ngừng dùng làm DB.
2. Nối packages, staff, member search, classes, sessions/booking, subscriptions/payment, reports/audit. Giữ nguyên routes/layout; sửa DTO/ID ở service và input cần thiết.
3. Bổ sung GET catalog và GET quyền của chính người dùng bằng API → BLL → UnitOfWork/EF; cần cho ID sport/room/coach và navigation. Không thêm schema hoặc thay rule. Không tự cấp quyền SystemAdmin cho Manager.
4. Feature thiếu BE phải hiển thị chưa khả dụng; giữ source/UI/routes, chặn giả lập thành công. Danh mục 9 sân landing là nội dung giới thiệu tĩnh, không dùng ID đó cho giao dịch.
5. Build/check, Swagger và smoke API nếu SQL sẵn sàng; không chạy API trước khi kiểm tra initializer vì nó tự migrate và đồng bộ demo packages. Không reset DB.

## Sai khác tài liệu đã xác minh

- Login Controller dùng **API LoginRequest.email**, không phải BLL LoginRequest.login. Response đúng AuthResponse, không phải BLL LoginResponse.
- Package quản trị có `/all`, PUT center-scoped và PATCH status; direct PATCH vẫn có riêng.
- Reports đã có Controller thật; số hardcode FE phải bỏ.
- CoachProfile.Id khác User.Id. Staff response hiện không chứa coach profile ID; catalog GET mới cần tách hai ID.
- Auth handler thêm role dạng gốc và uppercase; SystemAdmin không được đổi thành Manager/Admin ở FE để né quyền.
- appsettings có JWT development key cố định trái với README; phải bỏ khỏi source và dùng môi trường.
- LocalDB inventory hiện lỗi registry; chưa xác minh SQL. DbInitializer tự migrate và đồng bộ demo trong Development; không được khởi động mù trên DB hiện hữu.

## Trạng thái sau triển khai — 10/10/2026

Các nhận định trên là audit trước sửa. LocalDB sau đó đã đọc được khi chạy có quyền phù hợp; DB hiện hữu có 11 migration, không reset; demo seed mặc định false. JWT key cố định đã được bỏ. Xem INTEGRATION_TEST_REPORT.md cho bằng chứng và giới hạn kiểm thử.

| Nhóm | Mapping sau tích hợp | Trạng thái |
|---|---|---|
| Auth/profile | auth login/register/reset/change-password; profile/me; members/me; access/me | API thật; login/profile đã test live, delivery reset chưa xác minh |
| Packages/subscriptions | centers/{centerId}/membership-packages, /all, PUT /{packageId}, PATCH status; members/me/subscriptions và members/{memberId}/subscriptions | API thật; CRUD/status và pending persistence đã test |
| Staff/member lookup | centers/{centerId}/staff GET/POST/PATCH; centers/{centerId}/members paged | API thật; lookup test live, staff writes chưa E2E |
| Classes/coach | centers/{centerId}/classes, /classes/all; classes/{id}/schedules,/coaches,/publish; class-sessions; coaches/me/teaching-schedule | ID thật; dữ liệu lịch rỗng, writes chưa E2E |
| Booking | members/me/session-bookings; class-sessions/{sessionId}/bookings; session-bookings/{bookingId} DELETE | DTO/session ID/202 waitlist contract tested; E2E chưa có lịch |
| Payments | create-vnpay-url/create-momo-url/create-payos-url; counter-checkout | URL/status thật, không tự Active; gateway và counter E2E chưa xác minh |
| Reports/audit | reports/revenue,membership,classes; centers/{centerId}/audit-logs | Dữ liệu API thật, đã test live; bỏ chart/metric giả |
| Missing features | check-in/attendance/training/progress/notifications/Google/AI/inquiry/room writes/promotion | Chưa có BE; unavailable rõ ràng, không fallback |
| Role matrix | admin/roles và role permission API giữ nguyên | Manager bị chặn đúng quyền; SystemAdmin UI chưa hỗ trợ đầy đủ |

Sáu GET bổ sung tối thiểu: `/api/catalog/centers`, `/api/catalog/sports` public; `/api/centers/{centerId}/rooms`, `/coaches`, `/classes/all` có scope/quyền staff; `/api/access/me` trả role/permission thật. DTO tương ứng CenterOption, SportOption, RoomOption, CoachOption (id là CoachProfile.Id, userId riêng), ManagedClassOption, AccessResponse; dữ liệu từ Centers/Sports/Rooms/CoachProfiles/Classes/Users/RolePermissions qua BLL và EF UnitOfWork. Không thêm entity/migration. Các endpoint hỗ trợ sẵn khác giữ nguyên trong Swagger/Postman, không đồng nghĩa mọi endpoint có màn hình FE.

Mock storage và mock service đã xóa. Landing catalog còn là nội dung giới thiệu tĩnh; các màn thiếu API giữ source nhưng bị chặn khỏi luồng nghiệp vụ. Chi tiết file thay đổi: INTEGRATION_CHANGELOG.md.
