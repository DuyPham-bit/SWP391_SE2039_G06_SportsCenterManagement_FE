using SportsCenterManagement.BLL.DTOs.IntegrationCatalog;
namespace SportsCenterManagement.BLL.Interfaces;

public interface IIntegrationCatalogService
{
    Task<IReadOnlyList<CenterOption>> GetCentersAsync(CancellationToken ct);
    Task<IReadOnlyList<SportOption>> GetSportsAsync(CancellationToken ct);
    Task<IReadOnlyList<RoomOption>> GetRoomsAsync(long actorId, long centerId, CancellationToken ct);
    Task<IReadOnlyList<CoachOption>> GetCoachesAsync(long actorId, long centerId, CancellationToken ct);
    Task<AccessResponse> GetAccessAsync(long actorId, CancellationToken ct);
    Task<IReadOnlyList<ManagedClassOption>> GetClassesAsync(long actorId, long centerId, CancellationToken ct);
}
