using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

// Explicit, local development tool. Never invoked by API startup.
var connection = Environment.GetEnvironmentVariable("ConnectionStrings__SportsCenter")
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=SportsCenterManagement;Trusted_Connection=True;TrustServerCertificate=True";
await using var db = new SportsCenterDbContext(new DbContextOptionsBuilder<SportsCenterDbContext>().UseSqlServer(connection).Options);
if (args.Contains("--initialize"))
{
    if (await db.Database.CanConnectAsync())
        throw new InvalidOperationException("--initialize requires a new database name. For an existing database, omit --initialize.");
    await DbInitializer.SeedAsync(db, seedDemoData: true);
}
if ((await db.Database.GetPendingMigrationsAsync()).Any())
    throw new InvalidOperationException("Apply backend migrations before seeding.");
var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "SE Asia Standard Time"));
var now = DateTime.UtcNow;
await using var transaction = await db.Database.BeginTransactionAsync();
var center = await db.Centers.Where(c => c.Status == "Active").OrderBy(c => c.Id).FirstAsync();
if (await db.Users.AnyAsync(u => u.Username == "demo_member01"))
{
    Console.WriteLine("Demo dataset already exists; no data changed. Center ID: " + center.Id);
    return;
}
async Task<User> User(string role, string username)
{
    var roleId = await db.Roles.Where(r => r.Name == role).Select(r => r.Id).SingleAsync();
    var u = new User { RoleId = roleId, Username = username, Email = username + "@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@2026Scms!"), Status = "Active", CreatedAt = now };
    db.Users.Add(u); await db.SaveChangesAsync(); return u;
}
var manager = await User("Manager", "demo_manager");
var receptionist = await User("Receptionist", "demo_reception");
foreach (var (u, position, name) in new[] { (manager, "Manager", "Nguyễn Minh Quản"), (receptionist, "Receptionist", "Trần Thu Hà") })
    db.StaffProfiles.Add(new StaffProfile { UserId = u.Id, CenterId = center.Id, StaffCode = "DEMO-" + u.Id, FullName = name, Position = position, Status = "Active", CreatedAt = now });
var package = new MembershipPackage { CenterId = center.Id, Name = "DEMO - Gói thể thao 90 ngày", Description = "Dữ liệu mẫu cho kiểm thử giao diện và nghiệp vụ", DurationDays = 90, Price = 1800000, MaxClasses = 3, AllowedSports = 3, AccessType = "3 môn tự chọn", Features = "[\"3 bộ môn\",\"90 ngày sử dụng\",\"Lớp có huấn luyện viên\"]", Badge = "Demo", Status = "Active", CreatedAt = now };
db.MembershipPackages.Add(package); await db.SaveChangesAsync();
var classes = new List<ClassEntity>();
var sessions = new List<ClassSession>();
for (var i = 0; i < 3; i++)
{
    var sportName = new[] { "Gym", "Yoga", "Cầu lông" }[i];
    var sport = await db.Sports.FirstOrDefaultAsync(s => s.Name == sportName && s.Status == "Active" && (s.CenterId == center.Id || s.CenterId == null));
    if (sport is null) { sport = new Sport { Name = sportName, CenterId = center.Id, Status = "Active" }; db.Sports.Add(sport); }
    var room = new Room { CenterId = center.Id, Name = "DEMO - " + sportName, RoomType = sportName, Capacity = 20, Status = "Active", CreatedAt = now };
    db.Rooms.Add(room);
    var coachUser = await User("Coach", "demo_coach0" + (i + 1));
    var coach = new CoachProfile { UserId = coachUser.Id, CenterId = center.Id, CoachCode = "DEMO-COACH-" + coachUser.Id, FullName = new[] { "Lê Hoàng Nam", "Phạm Ngọc Anh", "Võ Minh Khang" }[i], Specialization = sportName, ExperienceYears = 5, Status = "Active", CreatedAt = now };
    db.CoachProfiles.Add(coach); await db.SaveChangesAsync();
    var cls = new ClassEntity { CenterId = center.Id, SportId = sport.Id, RoomId = room.Id, Name = "DEMO - " + sportName + " cơ bản", Level = "Beginner", Capacity = 20, DurationMinutes = 60, Status = "Published", CreatedAt = now };
    db.Classes.Add(cls); await db.SaveChangesAsync(); classes.Add(cls);
    db.ClassCoaches.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true, AssignedDate = today.AddDays(-7) });
    for (var day = -3; day <= 14; day++)
    {
        var session = new ClassSession { ClassId = cls.Id, RoomId = room.Id, CoachId = coach.Id, SessionDate = today.AddDays(day), StartTime = new TimeOnly(16 + i, 0), EndTime = new TimeOnly(17 + i, 0), SessionStatus = day < 0 ? "Completed" : "Scheduled", Notes = "DEMO", CreatedAt = now.AddDays(-7) };
        db.ClassSessions.Add(session); sessions.Add(session);
    }
    await db.SaveChangesAsync();
}
for (var i = 1; i <= 8; i++)
{
    var u = await User("Member", $"demo_member{i:00}");
    var member = new MemberProfile { UserId = u.Id, CenterId = center.Id, MemberCode = $"DEMO-M{i:00}", FullName = new[] { "Nguyễn Văn An", "Trần Thị Bình", "Lê Minh Châu", "Phạm Quốc Dũng", "Hoàng Thu Giang", "Võ Minh Huy", "Đặng Ngọc Lan", "Bùi Thanh Mai" }[i - 1], Gender = i % 2 == 0 ? "Nữ" : "Nam", FitnessLevel = "Beginner", FitnessGoal = "Cải thiện sức khỏe", HeightCm = 170, WeightKg = 65, CreatedAt = now.AddDays(-7) };
    db.MemberProfiles.Add(member); await db.SaveChangesAsync();
    var paid = i <= 6;
    var sub = new MemberSubscription { MemberId = member.Id, PackageId = package.Id, DurationDays = 90, Price = package.Price, Status = paid ? "Active" : "PendingPayment", StartDate = paid ? today.AddDays(-7) : null, EndDate = paid ? today.AddDays(82) : null, CreatedAt = now.AddDays(-7) };
    db.MemberSubscriptions.Add(sub); await db.SaveChangesAsync();
    var invoice = new Invoice { InvoiceNumber = $"DEMO-INV-{i:00}", MemberId = member.Id, CenterId = center.Id, CreatedBy = receptionist.Id, Subtotal = package.Price, TotalAmount = package.Price, Status = paid ? "Paid" : "Issued", IssuedAt = now.AddDays(-7), PaidAt = paid ? now.AddDays(-7) : null };
    db.Invoices.Add(invoice); await db.SaveChangesAsync();
    db.InvoiceItems.Add(new InvoiceItem { InvoiceId = invoice.Id, PackageId = package.Id, SubscriptionId = sub.Id, Description = package.Name, Quantity = 1, UnitPrice = package.Price, Amount = package.Price });
    if (!paid) continue;
    // Existing installations may retain the required legacy attempted_at column.
    var hasLegacyAttempt = await db.Database.SqlQuery<int>($"SELECT COUNT(*) AS [Value] FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'attempted_at'").SingleAsync() > 0;
    var columns = hasLegacyAttempt ? ", attempted_at" : "";
    var values = hasLegacyAttempt ? ", {5}" : "";
    await db.Database.ExecuteSqlRawAsync("INSERT INTO dbo.payments (invoice_id, member_id, processed_by, payment_method, amount, amount_received, payment_status, paid_at, created_at, idempotency_key, note" + columns + ") VALUES ({0}, {1}, {2}, N'CASH', {3}, {3}, N'Succeeded', {5}, {5}, {4}, N'DEMO - sample transaction'" + values + ")", invoice.Id, member.Id, receptionist.Id, package.Price, $"demo-seed-payment-{i:00}", now.AddDays(-7));
    var cls = classes[(i - 1) % classes.Count];
    var enrollment = new ClassEnrollment { ClassId = cls.Id, MemberId = member.Id, SubscriptionId = sub.Id, RegisteredBy = u.Id, RegisteredAt = now.AddDays(-7), Status = "Confirmed" };
    db.ClassEnrollments.Add(enrollment); await db.SaveChangesAsync();
    foreach (var session in sessions.Where(s => s.ClassId == cls.Id && s.SessionDate <= today.AddDays(3)))
    {
        db.SessionBookings.Add(new SessionBooking { SessionId = session.Id, MemberId = member.Id, EnrollmentId = enrollment.Id, SubscriptionId = sub.Id, RegisteredBy = u.Id, BookedAt = now.AddDays(-7), Status = "Booked" });
        if (session.SessionDate < today)
            db.Attendances.Add(new Attendance { SessionId = session.Id, MemberId = member.Id, CheckedInBy = receptionist.Id, AttendanceStatus = "Present", CreatedAt = now, Note = "DEMO" });
    }
}
await db.SaveChangesAsync();
await transaction.CommitAsync();
Console.WriteLine($"Seed complete. Center ID: {center.Id}; 13 users, 3 classes, 54 sessions, 8 subscriptions/invoices, 6 payments, 42 bookings, 18 attendances. Password: Demo@2026Scms!");


