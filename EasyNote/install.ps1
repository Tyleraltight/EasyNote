# Check that we're on a supported Windows version
try {
	$currentWindowsVersion = (Get-CimInstance Win32_OperatingSystem).Version -as [Version]
} catch {
	$currentWindowsVersion = (Get-WmiObject Win32_OperatingSystem).Version -as [Version]
}
$minWindowsVersion = "10.0.19041" -as [Version]
if ($currentWindowsVersion -And $currentWindowsVersion -lt $minWindowsVersion) {
	Write-Error "To install your app, you need to be running Windows version " + $minWindowsVersion + " or greater"
	Read-Host -Prompt "Press enter to exit"
	exit 1
}

# Get script directory (works regardless of how script is launched)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Install the app using pwainstaller.exe
Write-Host "Installing EasyNote..."
Write-Host "Working directory: $scriptDir"

$msixPath = Join-Path $scriptDir "EasyNote.sideload.msix"
$installerPath = Join-Path $scriptDir "utils\pwainstaller.exe"

if (-not (Test-Path $msixPath)) {
	Write-Error "MSIX file not found: $msixPath"
	Read-Host -Prompt "Press enter to exit"
	exit 1
}

if (-not (Test-Path $installerPath)) {
	Write-Error "Installer not found: $installerPath"
	Read-Host -Prompt "Press enter to exit"
	exit 1
}

try {
	$installProc = Start-Process -FilePath $installerPath -ArgumentList "`"$msixPath`"" -NoNewWindow -PassThru -Wait
} catch {
	Write-Error "Failed to start installer: $_"
	Read-Host -Prompt "Press enter to exit"
	exit 1
}

# Launch the app
if ($installProc.ExitCode -eq 0) {
	$app = Get-StartApps "EasyNote"

	# If it's an array, then we found multiple matching apps. Grab the last one.
	if ($app -is [array]) {
		Write-Host "Warning: found multiple apps installed named EasyNote. Launching best guess. If the wrong app launches, find the right one in your start menu."
		$app = $app[-1];
	}

	if ($app) {
		Write-Host "Launching EasyNote..."
		start ("shell:AppsFolder\" + $app.AppId)
	} else {
		Write-Host "Couldn't find installed app. If there are no errors above, you can find the app in your start menu"
	}
} else {
	Write-Error ("Installation failed, exit code " + $installProc.ExitCode)
}

Read-Host -Prompt "Press enter to exit"
