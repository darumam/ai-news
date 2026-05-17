param(
  [string]$ProjectWslPath = "/mnt/c/Users/darum/Desktop/サイト類/ai-news",
  [switch]$SleepAfter
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logDir = Join-Path (Split-Path -Parent $PSScriptRoot) "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir "codex-nightly-$timestamp.log"

Start-Transcript -Path $logPath -Append | Out-Null

try {
  Write-Host "AI Signal Board nightly update started."

  $wsl = Get-Command wsl.exe -ErrorAction Stop
  $bashCommand = @"
set -e
cd '$ProjectWslPath'
if [ ! -d .git ] || [ ! -f .git/HEAD ]; then
  echo 'Git repository is not initialized. Set up GitHub remote first.'
  exit 20
fi
git pull --ff-only
codex exec --search --ask-for-approval never --sandbox workspace-write -C '$ProjectWslPath' - < scripts/codex_nightly_prompt.md
python3 -m json.tool data/news.json >/tmp/ai-signal-news-check.json
python3 -m json.tool data/features.json >/tmp/ai-signal-features-check.json
if git diff --quiet -- data/news.json data/features.json index.html feature-news.html compare.html README.md; then
  echo 'No content changes to commit.'
  exit 0
fi
git add data/news.json data/features.json index.html feature-news.html compare.html README.md
git commit -m 'Update AI signal board'
git push
"@

  & $wsl.Source bash -lc $bashCommand
  if ($LASTEXITCODE -ne 0) {
    throw "WSL nightly update failed with exit code $LASTEXITCODE"
  }

  Write-Host "AI Signal Board nightly update finished."
} finally {
  Stop-Transcript | Out-Null
}

if ($SleepAfter) {
  Start-Sleep -Seconds 30
  rundll32.exe powrprof.dll,SetSuspendState 0,1,0
}
