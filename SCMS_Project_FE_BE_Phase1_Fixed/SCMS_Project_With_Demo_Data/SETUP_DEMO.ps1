param([string]$DatabaseName = 'SportsCenterManagement_Demo')
$ErrorActionPreference = 'Stop'
if ($DatabaseName -notmatch '^[A-Za-z][A-Za-z0-9_]{0,100}$') { throw 'Invalid database name.' }
$env:ConnectionStrings__SportsCenter = "Server=(localdb)\MSSQLLocalDB;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True"
$backend = Join-Path $PSScriptRoot 'SWP391_SE2039_G06_SportsCenterManagement_BE\Backend'
dotnet run --project (Join-Path $backend 'database\DemoSeeder\DemoSeeder.csproj') -- --initialize
if ($LASTEXITCODE -ne 0) { throw 'Database setup failed. An existing database is never overwritten by this script.' }
Write-Host "Demo database ready: $DatabaseName"
Write-Host 'Use this ConnectionStrings__SportsCenter for the backend in the same terminal.'
Write-Host 'Frontend: VITE_API_BASE_URL=http://localhost:54162 and VITE_CENTER_ID=1'
