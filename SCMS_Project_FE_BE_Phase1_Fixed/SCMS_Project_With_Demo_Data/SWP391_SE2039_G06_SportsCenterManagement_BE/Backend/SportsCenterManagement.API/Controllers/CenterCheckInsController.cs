using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.API.Authorization;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Controllers;

/// <summary>Reception desk center admission. This records an admission, not a physical RFID unlock.</summary>
[Authorize(Roles = "RECEPTIONIST,MANAGER")]
public sealed class CenterCheckInsController(SportsCenterDbContext db) : FlowControllerBase
{
    public sealed record CheckInRequest(string? Identifier);

    [HttpGet("centers/{centerId:long}/check-ins")]
    public async Task<IActionResult> Today(long centerId, CancellationToken ct)
    {
        await CenterScope.EnsureCenterAccessAsync(db, User, centerId, ct);
        // Timestamps are stored in UTC; business date is Asia/Ho_Chi_Minh (UTC+7).
        var start = DateTime.UtcNow.AddHours(7).Date.AddHours(-7);
        var end = start.AddDays(1);
        var rows = await (
            from checkin in db.CenterCheckins.AsNoTracking()
            join member in db.MemberProfiles.AsNoTracking() on checkin.MemberId equals member.Id
            join actor in db.StaffProfiles.AsNoTracking() on checkin.CheckedInBy equals (long?)actor.UserId into actors
            from actor in actors.DefaultIfEmpty()
            where checkin.CenterId == centerId && checkin.CheckInTime >= start && checkin.CheckInTime < end
            orderby checkin.CheckInTime descending
            select new
            {
                checkin.Id, checkin.MemberId, memberName = member.FullName, memberCode = member.MemberCode,
                checkin.CheckInTime, receptionistName = actor == null ? null : actor.FullName
            }).Take(100).ToListAsync(ct);
        return Ok(rows);
    }

    [HttpPost("centers/{centerId:long}/check-ins")]
    public async Task<IActionResult> CheckIn(long centerId, [FromBody] CheckInRequest request, CancellationToken ct)
    {
        await CenterScope.EnsureCenterAccessAsync(db, User, centerId, ct);
        var key = request.Identifier?.Trim();
        if (string.IsNullOrWhiteSpace(key) || key.Length < 2 || key.Length > 150)
            return BadRequest(new { message = "Mã hội viên, email hoặc số điện thoại không hợp lệ." });

        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var candidates = await (
            from m in db.MemberProfiles
            join u in db.Users on m.UserId equals u.Id
            where m.CenterId == centerId && u.Status == "Active"
                && (!u.LockedUntil.HasValue || u.LockedUntil <= DateTime.UtcNow)
                && (m.MemberCode == key || u.Email == key || u.Phone == key)
            select m).Take(2).ToListAsync(ct);
        if (candidates.Count == 0) return NotFound(new { message = "Không tìm thấy hội viên đang hoạt động thuộc trung tâm này." });
        if (candidates.Count > 1) return Conflict(new { message = "Thông tin tra cứu khớp nhiều hội viên. Hãy dùng mã hội viên duy nhất." });
        var member = candidates[0];

        var now = DateTime.UtcNow;
        var date = DateOnly.FromDateTime(now.AddHours(7));
        var package = await (
            from subscription in db.MemberSubscriptions.AsNoTracking()
            join plan in db.MembershipPackages.AsNoTracking() on subscription.PackageId equals plan.Id
            where subscription.MemberId == member.Id && subscription.Status == "Active"
                && plan.CenterId == centerId && plan.Status == "Active"
                && subscription.StartDate <= date && subscription.EndDate >= date
            orderby subscription.EndDate descending
            select new { plan.Name }).FirstOrDefaultAsync(ct);
        if (package is null)
            return Conflict(new { message = "Hội viên chưa có gói tập đang hiệu lực tại trung tâm này." });

        var start = now.AddHours(7).Date.AddHours(-7);
        var end = start.AddDays(1);
        if (await db.CenterCheckins.AnyAsync(x => x.CenterId == centerId && x.MemberId == member.Id
                && x.CheckInTime >= start && x.CheckInTime < end, ct))
            return Conflict(new { message = "Hội viên đã được ghi nhận check-in trong ngày hôm nay." });

        var entry = new CenterCheckin
        {
            MemberId = member.Id, CenterId = centerId, CheckedInBy = CurrentUserId,
            CheckInTime = now, CreatedAt = now
        };
        db.CenterCheckins.Add(entry);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return StatusCode(StatusCodes.Status201Created, new
        {
            entry.Id, entry.MemberId, memberName = member.FullName, memberCode = member.MemberCode,
            entry.CheckInTime, packageName = package.Name
        });
    }
}
