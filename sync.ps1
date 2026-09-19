param (
    [string]$commitMsg = ('docs: auto-sync update [' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ']')
)

$repoDir = $PSScriptRoot
git -C $repoDir add -A
$status = git -C $repoDir status --porcelain
if ($status) {
    git -C $repoDir commit -m $commitMsg
    $remotes = git -C $repoDir remote
    if ($remotes -contains 'origin') {
        git -C $repoDir push origin main
        Write-Host '✅ Successfully pushed to GitHub/Vercel remote.' -ForegroundColor Green
    } else {
        Write-Host 'ℹ️ Local commit created. Run git remote add origin <url> to enable auto-push to GitHub/Vercel.' -ForegroundColor Yellow
    }
} else {
    Write-Host 'ℹ️ No new changes to commit.' -ForegroundColor Cyan
}
