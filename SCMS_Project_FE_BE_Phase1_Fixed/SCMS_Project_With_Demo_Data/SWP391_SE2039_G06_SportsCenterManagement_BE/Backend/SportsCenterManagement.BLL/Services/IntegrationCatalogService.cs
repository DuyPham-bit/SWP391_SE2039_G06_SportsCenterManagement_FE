using SportsCenterManagement.BLL.DTOs.IntegrationCatalog;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.DAL.Repositories.Interfaces;

namespace SportsCenterManagement.BLL.Services;

// Read-only adapters for real catalog IDs and the current user's permissions.
public sealed class IntegrationCatalogService(IUnitOfWork work) : IIntegrationCatalogService
{
    public async Task<IReadOnlyList<CenterOption>> GetCentersAsync(CancellationToken ct) => await work.Context.Centers.AsNoTracking()
        .Where(c => c.Status == "Active").OrderBy(c => c.Name)
        .Select(c => new CenterOption(c.Id, c.Name, c.Address)).ToListAsync(ct);

    public async Task<IReadOnlyList<SportOption>> GetSportsAsync(CancellationToken ct) => await work.Context.Sports.AsNoTracking()
        .OrderBy(s => s.Name).Select(s => new SportOption(s.Id, s.Name, s.Description)).ToListAsync(ct);

    private async Task EnsureStaffAsync(long actorId, long centerId, CancellationToken ct)
    {
        var db = work.Context;
        var isAdmin = await (from u in db.Users join r in db.Roles on u.RoleId equals r.Id
            where u.Id == actorId && u.Status == "Active" && r.Name == "Admin" select u.Id).AnyAsync(ct);
        if (!isAdmin && !await db.StaffProfiles.AnyAsync(s => s.UserId == actorId && s.CenterId == centerId && s.Status == "Active", ct))
            throw FlowException.Forbidden("Bạn không có quyền xem danh mục quản trị tại cơ sở này.");
    }

    public async Task<IReadOnlyList<RoomOption>> GetRoomsAsync(long actorId, long centerId, CancellationToken ct)
    {
        await EnsureStaffAsync(actorId, centerId, ct);
        return await work.Context.Rooms.AsNoTracking().Where(r => r.CenterId == centerId)
            .OrderBy(r => r.Name).Select(r => new RoomOption(r.Id, r.Name, r.RoomType, r.Capacity, r.LocationDescription, r.Status)).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CoachOption>> GetCoachesAsync(long actorId, long centerId, CancellationToken ct)
    {
        await EnsureStaffAsync(actorId, centerId, ct);
        var db = work.Context;
        return await (from p in db.CoachProfiles.AsNoTracking() join u in db.Users on p.UserId equals u.Id
            where p.CenterId == centerId && p.Status == "Active" && u.Status == "Active"
            select new CoachOption(p.Id, p.UserId, p.FullName, p.CoachCode, p.Specialization, p.Certification, p.Status)).ToListAsync(ct);
    }

    public async Task<AccessResponse> GetAccessAsync(long actorId, CancellationToken ct)
    {
        var db = work.Context;
        var role = await (from u in db.Users.AsNoTracking() join r in db.Roles on u.RoleId equals r.Id
            where u.Id == actorId && u.Status == "Active" select new { r.Id, r.Name }).SingleAsync(ct);
        var codes = await (from rp in db.RolePermissions.AsNoTracking() join p in db.Permissions on rp.PermissionId equals p.Id
            where rp.RoleId == role.Id select p.Code).ToListAsync(ct);
        return new AccessResponse(role.Name, codes);
    }

    public async Task<IReadOnlyList<ManagedClassOption>> GetClassesAsync(long actorId, long centerId, CancellationToken ct)
    {
        await EnsureStaffAsync(actorId, centerId, ct);
        return await work.Context.Classes.AsNoTracking().Where(c => c.CenterId == centerId)
            .OrderBy(c => c.Name).Select(c => new ManagedClassOption(c.Id, c.CenterId, c.SportId, c.RoomId, c.Name, c.Description, c.Level, c.Capacity, c.DurationMinutes, c.Status, c.AllowWaitlist)).ToListAsync(ct);
    }
}
