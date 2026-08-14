param(
    [Parameter(Mandatory = $true)]
    [string]$LauncherPath,

    [Parameter(Mandatory = $true)]
    [string]$IconPath
)

$ErrorActionPreference = "Stop"

$launcher = (Resolve-Path -LiteralPath $LauncherPath).Path
$icon = (Resolve-Path -LiteralPath $IconPath).Path
$desktop = [Environment]::GetFolderPath("DesktopDirectory")
$projectDirectory = Split-Path -Parent $launcher
$shortcutName = "Limiar Tar$([char]0x00F4) - In$([char]0x00ED)cio F$([char]0x00E1)cil.lnk"
$shortcutPaths = @(
    (Join-Path $projectDirectory $shortcutName),
    (Join-Path $desktop $shortcutName)
) | Select-Object -Unique

$shell = New-Object -ComObject WScript.Shell
foreach ($shortcutPath in $shortcutPaths) {
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $env:ComSpec
    $shortcut.Arguments = "/d /c `"`"$launcher`"`""
    $shortcut.WorkingDirectory = $projectDirectory
    $shortcut.IconLocation = "$icon,0"
    $shortcut.Description = "Seu portal de Tar$([char]0x00F4) local, pronto em um clique."
    $shortcut.WindowStyle = 1
    $shortcut.Save()
}

Write-Host "Atalho criado na pasta do projeto e na Area de Trabalho: $shortcutName"
