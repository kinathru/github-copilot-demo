using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var staticDirectory = Path.Combine(app.Environment.ContentRootPath, "src", "static");
if (!Directory.Exists(staticDirectory))
{
    staticDirectory = Path.Combine(AppContext.BaseDirectory, "src", "static");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(staticDirectory)
});

app.MapGet("/", () => Results.Redirect("/index.html"));

app.MapGet("/activities", () =>
{
    lock (ActivityStore.Sync)
    {
        var snapshot = ActivityStore.Activities.ToDictionary(
            entry => entry.Key,
            entry => new ActivityResponse(
                entry.Value.Description,
                entry.Value.Schedule,
                entry.Value.MaxParticipants,
                entry.Value.Participants.ToArray()));

        return Results.Ok(snapshot);
    }
});

app.MapPost("/activities/{activityName}/signup", (string activityName, string? email) =>
{
    var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
    var emailDomain = normalizedEmail.Split('@').Last();
    if (!normalizedEmail.Contains('@') ||
        emailDomain is not ("mergington.edu" or "merginton.edu"))
    {
        return Results.Json(
            new ErrorResponse("Only @mergington.edu email addresses are allowed to sign up."),
            statusCode: StatusCodes.Status400BadRequest);
    }

    lock (ActivityStore.Sync)
    {
        if (!ActivityStore.Activities.TryGetValue(activityName, out var activity))
        {
            return Results.Json(
                new ErrorResponse("Activity not found"),
                statusCode: StatusCodes.Status404NotFound);
        }

        if (activity.Participants.Contains(normalizedEmail))
        {
            return Results.Json(
                new ErrorResponse("Already signed up for this activity"),
                statusCode: StatusCodes.Status409Conflict);
        }

        activity.Participants.Add(normalizedEmail);
        return Results.Ok(new SignupResponse($"Signed up {normalizedEmail} for {activityName}"));
    }
});

app.Run();

internal sealed record ActivityResponse(
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("schedule")] string Schedule,
    [property: JsonPropertyName("max_participants")] int MaxParticipants,
    [property: JsonPropertyName("participants")] IReadOnlyList<string> Participants);

internal sealed record ErrorResponse(
    [property: JsonPropertyName("detail")] string Detail);

internal sealed record SignupResponse(
    [property: JsonPropertyName("message")] string Message);

internal sealed record ActivityState(
    string Description,
    string Schedule,
    int MaxParticipants,
    List<string> Participants);

internal static class ActivityStore
{
    public static readonly object Sync = new();

    public static readonly Dictionary<string, ActivityState> Activities = new(StringComparer.Ordinal)
    {
        ["Chess Club"] = new(
            "Learn strategies and compete in chess tournaments",
            "Fridays, 3:30 PM - 5:00 PM",
            12,
            ["michael@mergington.edu", "daniel@mergington.edu"]),
        ["Programming Class"] = new(
            "Learn programming fundamentals and build software projects",
            "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            20,
            ["emma@mergington.edu", "sophia@mergington.edu"]),
        ["Gym Class"] = new(
            "Physical education and sports activities",
            "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
            30,
            ["john@mergington.edu", "olivia@mergington.edu"]),
        ["Basketball Team"] = new(
            "Practice teamwork, shooting, and game strategies",
            "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
            15,
            ["liam@mergington.edu", "noah@mergington.edu"]),
        ["Art Club"] = new(
            "Explore drawing, painting, and creative projects",
            "Wednesdays, 3:30 PM - 5:00 PM",
            18,
            ["ava@mergington.edu", "mia@mergington.edu"])
    };
}