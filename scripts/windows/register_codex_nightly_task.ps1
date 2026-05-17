param(
  [string]$TaskName = "AI Signal Board - Codex Nightly Update",
  [string]$Time = "04:00",
  [switch]$SleepAfter
)

$scriptPath = Join-Path $PSScriptRoot "run_codex_nightly_update.ps1"

if (-not (Test-Path $scriptPath)) {
  throw "Nightly update script not found: $scriptPath"
}

$argumentList = "-ExecutionPolicy Bypass -File `"$scriptPath`""
if ($SleepAfter) {
  $argumentList = "$argumentList -SleepAfter"
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argumentList
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Wake the PC, run Codex nightly AI Signal Board update, commit, and push." `
  -Force

Write-Host "Registered task '$TaskName' daily at $Time."
Write-Host "Confirm in Task Scheduler: Conditions > Wake the computer to run this task."
