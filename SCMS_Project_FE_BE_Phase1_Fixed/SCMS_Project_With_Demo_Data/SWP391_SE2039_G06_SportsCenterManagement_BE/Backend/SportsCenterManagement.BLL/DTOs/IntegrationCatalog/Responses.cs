namespace SportsCenterManagement.BLL.DTOs.IntegrationCatalog;

public sealed record CenterOption(long Id, string Name, string? Address);
public sealed record SportOption(long Id, string Name, string? Description);
public sealed record RoomOption(long Id, string Name, string? Type, int Capacity, string? Location, string Status);
public sealed record CoachOption(long Id, long UserId, string FullName, string CoachCode, string? Specialty, string? Certification, string Status);
public sealed record AccessResponse(string Role, IReadOnlyList<string> PermissionCodes);
public sealed record ManagedClassOption(long Id, long CenterId, long SportId, long? RoomId, string Name, string? Description, string? Level, int Capacity, int DurationMinutes, string Status, bool AllowWaitlist);
