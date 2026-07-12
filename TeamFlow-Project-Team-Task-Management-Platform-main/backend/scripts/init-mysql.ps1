param(
  [Parameter(Mandatory = $true)]
  [string]$RootPassword,

  [string]$DbName = "teamflow",
  [string]$DbUser = "teamflow",
  [string]$DbPassword = "teamflow"
)

$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysql)) {
  throw "mysql.exe not found at $mysql"
}

$sql = @"
CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword';
GRANT ALL PRIVILEGES ON ``$DbName``.* TO '$DbUser'@'localhost';
FLUSH PRIVILEGES;
"@

& $mysql -u root "-p$RootPassword" -e $sql
if ($LASTEXITCODE -ne 0) { throw "Failed to create database/user" }

$envPath = Join-Path $PSScriptRoot "..\.env"
@"
DATABASE_URL="mysql://${DbUser}:${DbPassword}@localhost:3306/${DbName}"
JWT_SECRET="teamflow-dev-secret-change-in-production-abc123xyz"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
"@ | Set-Content -Path $envPath -Encoding UTF8

Write-Host "Database ready. Updated backend/.env"
Write-Host "Next: npx prisma migrate deploy && npm run prisma:seed"
