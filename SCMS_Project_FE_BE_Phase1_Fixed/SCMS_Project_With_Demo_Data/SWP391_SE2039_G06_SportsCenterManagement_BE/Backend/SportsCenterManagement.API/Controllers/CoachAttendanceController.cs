using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Controllers;

/// <summary>Roster and attendance for sessions assigned to the authenticated coach.</summary>
[Authorize(Roles = "COACH")]
public sealed class CoachAttendanceController(SportsCenterDbContext db) : FlowControllerBase
{
    public sealed record AttendanceItem(long MemberId, string? Status, string? Note);
    public sealed record AttendanceRequest(IReadOnlyList<AttendanceItem>? Records);

    private async Task<ClassSession?> AssignedSession(long sessionId, CancellationToken ct)
    {
        var coachId = await db.CoachProfiles.AsNoTracking()
            .Where(x => x.UserId == CurrentUserId && x.Status == "Active")
            .Select(x => (long?)x.Id).SingleOrDefaultAsync(ct);
        if (coachId is null) return null;
        return await (
            from session in db.ClassSessions
            join cls in db.Classes on session.ClassId equals cls.Id
            join coach in db.CoachProfiles on coachId.Value equals coach.Id
            join user in db.Users on coach.UserId equals user.Id
            where session.Id == sessionId && cls.CenterId == coach.CenterId
                && user.Status == "Active" && (!user.LockedUntil.HasValue || user.LockedUntil <= DateTime.UtcNow)
                && db.Centers.Any(center => center.Id == cls.CenterId && center.Status == "Active")
                && cls.Status != "Cancelled" && cls.Status != "Completed"
                && db.ClassCoaches.Any(link => link.ClassId == cls.Id && link.CoachId == coachId.Value)
            select session).SingleOrDefaultAsync(ct);
    }

    [HttpGet("coaches/me/sessions/{sessionId:long}/roster")]
    public async Task<IActionResult> Roster(long sessionId, CancellationToken ct)
    {
        if (await AssignedSession(sessionId, ct) is null) return NotFound(new { message = "Không tìm thấy ca dạy được phân công." });
        var rows = await (
            from booking in db.SessionBookings.AsNoTracking()
            join member in db.MemberProfiles.AsNoTracking() on booking.MemberId equals member.Id
            where booking.SessionId == sessionId && booking.Status == "Booked"
            orderby member.FullName
            select new { memberId = member.Id, memberName = member.FullName, memberCode = member.MemberCode })
            .ToListAsync(ct);
        var ids = rows.Select(x => x.memberId).ToArray();
        var records = await db.Attendances.AsNoTracking()
            .Where(x => x.SessionId == sessionId && ids.Contains(x.MemberId))
            .Select(x => new { x.MemberId, x.AttendanceStatus, x.Note })
            .ToListAsync(ct);
        var mapped = records.GroupBy(x => x.MemberId).ToDictionary(x => x.Key, x => x.First());
        return Ok(rows.Select(row => new
        {
            row.memberId, row.memberName, row.memberCode,
            attendanceStatus = mapped.TryGetValue(row.memberId, out var r) ? r.AttendanceStatus : null,
            note = mapped.TryGetValue(row.memberId, out var n) ? n.Note : null
        }));
    }

    [HttpPut("coaches/me/sessions/{sessionId:long}/attendance")]
    public async Task<IActionResult> Save(long sessionId, [FromBody] AttendanceRequest request, CancellationToken ct)
    {
        if (request.Records is null || request.Records.Count == 0 || request.Records.Count > 200
            || request.Records.Any(x => x.MemberId <= 0 || x.Note?.Length > 500
                || (x.Status?.ToUpperInvariant() != "PRESENT" && x.Status?.ToUpperInvariant() != "ABSENT"))
            || request.Records.Select(x => x.MemberId).Distinct().Count() != request.Records.Count)
            return BadRequest(new { message = "Danh sách điểm danh không hợp lệ hoặc có mã hội viên bị lặp." });

        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var session = await AssignedSession(sessionId, ct);
        if (session is null) return NotFound(new { message = "Không tìm thấy ca dạy được phân công." });
        if (session.SessionStatus == "Cancelled")
            return Conflict(new { message = "Không thể điểm danh ca dạy đã hủy." });
        if (session.SessionDate > DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)))
            return Conflict(new { message = "Không được điểm danh trước ngày diễn ra buổi học." });

        var ids = request.Records.Select(x => x.MemberId).ToArray();
        var validIds = await db.SessionBookings.AsNoTracking()
            .Where(x => x.SessionId == sessionId && x.Status == "Booked" && ids.Contains(x.MemberId))
            .Select(x => x.MemberId).Distinct().ToListAsync(ct);
        if (validIds.Count != ids.Length)
            return Conflict(new { message = "Có hội viên không có booking hợp lệ tại ca dạy này." });

        var existing = await db.Attendances.Where(x => x.SessionId == sessionId && ids.Contains(x.MemberId))
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var item in request.Records)
        {
            var record = existing.SingleOrDefault(x => x.MemberId == item.MemberId);
            if (record is null)
            {
                record = new Attendance { SessionId = sessionId, MemberId = item.MemberId, CreatedAt = now };
                db.Attendances.Add(record);
            }
            record.AttendanceStatus = item.Status!.Equals("PRESENT", StringComparison.OrdinalIgnoreCase) ? "Present" : "Absent";
            record.Note = item.Note?.Trim();
            record.CheckedInBy = CurrentUserId;
            record.CheckInTime = record.AttendanceStatus == "Present" ? now : null;
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Ok(new { sessionId, updated = request.Records.Count, message = "Đã lưu điểm danh." });
    }
}
