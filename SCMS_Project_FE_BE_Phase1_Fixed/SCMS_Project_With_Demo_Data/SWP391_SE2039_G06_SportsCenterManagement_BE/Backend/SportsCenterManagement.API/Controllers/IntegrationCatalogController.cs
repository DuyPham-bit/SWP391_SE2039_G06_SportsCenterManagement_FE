using SportsCenterManagement.BLL.DTOs.IntegrationCatalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsCenterManagement.API.Authorization;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.DAL.Authorization;

namespace SportsCenterManagement.API.Controllers;

[ApiController]
[FlowExceptionFilter]
public sealed class IntegrationCatalogController(IIntegrationCatalogService service) : ControllerBase
{
    [AllowAnonymous, HttpGet("/api/catalog/centers")]
    public async Task<ActionResult<IReadOnlyList<CenterOption>>> Centers(CancellationToken ct) => Ok(await service.GetCentersAsync(ct));

    [AllowAnonymous, HttpGet("/api/catalog/sports")]
    public async Task<ActionResult<IReadOnlyList<SportOption>>> Sports(CancellationToken ct) => Ok(await service.GetSportsAsync(ct));

    [Authorize(Roles = "MANAGER,ADMIN"), HttpGet("/api/centers/{centerId:long}/rooms")]
    public async Task<ActionResult<IReadOnlyList<RoomOption>>> Rooms(long centerId, CancellationToken ct) =>
        Ok(await service.GetRoomsAsync(CenterScope.GetUserId(User), centerId, ct));

    [RequirePermission(PermissionCodes.StaffCenterRead), HttpGet("/api/centers/{centerId:long}/coaches")]
    public async Task<ActionResult<IReadOnlyList<CoachOption>>> Coaches(long centerId, CancellationToken ct) =>
        Ok(await service.GetCoachesAsync(CenterScope.GetUserId(User), centerId, ct));

    [Authorize, HttpGet("/api/access/me")]
    public async Task<ActionResult<AccessResponse>> Access(CancellationToken ct) =>
        Ok(await service.GetAccessAsync(CenterScope.GetUserId(User), ct));

    [Authorize(Roles = "MANAGER,ADMIN"), HttpGet("/api/centers/{centerId:long}/classes/all")]
    public async Task<ActionResult<IReadOnlyList<ManagedClassOption>>> Classes(long centerId, CancellationToken ct) =>
        Ok(await service.GetClassesAsync(CenterScope.GetUserId(User), centerId, ct));
}
