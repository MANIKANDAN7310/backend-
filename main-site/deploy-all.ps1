# Script to build and deploy both the main site and the dashboard together
Write-Host "🚀 Building Main Site (vite-project)..." -ForegroundColor Cyan
npm run build

Write-Host "`n🚀 Building Dashboard (d:\dashboard)..." -ForegroundColor Cyan
Push-Location "d:\dashboard"
npm run build
Pop-Location

Write-Host "`n📁 Merging Dashboard into Main Site's dist folder..." -ForegroundColor Cyan
# Create the dashboard directory inside the main site's dist folder
if (Test-Path "dist\dashboard") {
    Remove-Item -Recurse -Force "dist\dashboard"
}
# Copy dashboard build folder
Copy-Item -Path "d:\dashboard\dist\dashboard" -Destination "dist\dashboard" -Recurse
Write-Host "✅ Merge complete!" -ForegroundColor Green

Write-Host "`n☁️ Deploying to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting

Write-Host "`n🎉 Deployment Successful! Your main site and dashboard are now live together." -ForegroundColor Green
