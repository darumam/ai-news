param(
  [string]$TaskName = "AI Signal Board - Startup Crawl",
  [string]$Time = "09:00",
  [ValidateSet("LogOn", "Daily")]
  [string]$TriggerType = "LogOn"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchPath = Join-Path $scriptDir "run_ai_news_startup.bat"

if (-not (Test-Path $batchPath)) {
  throw "Startup batch file not found: $batchPath"
}

$action = New-ScheduledTaskAction -Execute $batchPath

if ($TriggerType -eq "Daily") {
  $trigger = New-ScheduledTaskTrigger -Daily -At $Time
} else {
  $trigger = New-ScheduledTaskTrigger -AtLogOn
}

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Run AI Signal Board official-source crawler on a schedule." `
  -Force

if ($TriggerType -eq "Daily") {
  Write-Host "Registered task '$TaskName' daily at $Time."
  Write-Host "Open Task Scheduler to confirm 'Wake the computer to run this task' is enabled."
} else {
  Write-Host "Registered task '$TaskName' at user logon."
}
