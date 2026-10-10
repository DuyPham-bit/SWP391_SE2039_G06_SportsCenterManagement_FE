using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SportsCenterManagement.API.Authorization;

public sealed class SwaggerAnonymousOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var attributes = context.MethodInfo.GetCustomAttributes(true)
            .Concat(context.MethodInfo.DeclaringType?.GetCustomAttributes(true) ?? []);
        if (attributes.OfType<AllowAnonymousAttribute>().Any() || !attributes.OfType<AuthorizeAttribute>().Any())
            operation.Security = [];
    }
}
