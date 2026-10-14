param(
    [string]$Message = ""
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "sync: update inventory system ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
}

Write-Host "🚀 Checking TypeScript..." -ForegroundColor Cyan
bun run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript check failed! Please fix errors before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Staging all files..." -ForegroundColor Cyan
git add -A

Write-Host "📝 Committing: $Message" -ForegroundColor Cyan
git commit -m "$Message"

Write-Host "⬆️ Pushing to GitHub (origin main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
}
