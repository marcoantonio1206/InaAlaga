cd $PSScriptRoot
git checkout main
git pull origin main
git commit --allow-empty -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main
git push deploy main
Write-Host "Pushed. Vercel builds in ~1 min: https://inaalaga.vercel.app"
