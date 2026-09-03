param (
    [string] = 'docs: auto-sync update [' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ']'
)

git add -A
 = git status --porcelain
if () {
    git commit -m 
     = git remote
    if ( -contains 'origin') {
        git push origin main
        Write-Host '✅ Successfully pushed to GitHub/Vercel remote.' -ForegroundColor Green
    } else {
        Write-Host 'ℹ️ Local commit created. Run git remote add origin <url> to enable auto-push to GitHub/Vercel.' -ForegroundColor Yellow
    }
} else {
    Write-Host 'ℹ️ No new changes to commit.' -ForegroundColor Cyan
}
