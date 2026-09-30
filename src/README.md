# Mergington High School Activities

An ASP.NET Core minimal API on .NET 10 that serves the activities page and lets students view and sign up for extracurricular activities.

## Run

Install the .NET 10 SDK, then run from the repository root:

```powershell
dotnet run
```

Open the URL printed by the command. The existing page, JavaScript, and CSS are served by the .NET app.

## API

| Method | Endpoint                                                          | Description                                        |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------- |
| GET    | `/activities`                                                     | Return activities, details, and participant emails |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up with an allowed school email               |

Signup accepts `@mergington.edu` and `@merginton.edu` addresses, normalizes email casing and whitespace, and rejects invalid domains, unknown activities, and duplicate signups. Errors use a JSON `detail` field to match the existing frontend.

Activity data is held in memory and resets when the process restarts.
