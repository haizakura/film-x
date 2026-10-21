# Film X MCP server installer for Windows (Windows PowerShell 5.1 or PowerShell 7):
#
#   irm https://filmx.nya.run/mcp/install.ps1 | iex
#
# Downloads the local MCP server that this Film X site publishes under /mcp/, installs its
# runtime dependencies with npm, and prints the configuration for Claude Desktop and ChatGPT
# Desktop. It changes no agent configuration and uploads nothing. Run it again to update; an
# install also keeps a copy of this script, which updates that folder from the same site:
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\film-x-mcp\install.ps1"
#
#   $env:FILM_X_SITE_URL  Film X site to install from and render with (default: the site the
#                         installed copy recorded, else https://filmx.nya.run/)
#   $env:FILM_X_MCP_HOME  Install folder (default: the installed copy's folder, else
#                         %LOCALAPPDATA%\film-x-mcp)
#
# It runs inside `iex`, so failures throw instead of calling exit, which would close the window,
# and everything lives in one script block to keep the caller's session clean.
& {
  $ErrorActionPreference = 'Stop'
  # Windows PowerShell 5.1 renders download progress very slowly.
  $ProgressPreference = 'SilentlyContinue'
  [Net.ServicePointManager]::SecurityProtocol =
    [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

  $DefaultSiteUrl = 'https://filmx.nya.run/'
  $MinNodeMajor = 22
  $Marker = '.film-x-mcp-install'
  $SiteFile = 'site-url'

  function Fail([string]$Message) { throw "film-x-mcp install: $Message" }

  # Run from an install folder (-File <folder>\install.ps1): update that folder from its recorded
  # site. $PSCommandPath is empty under `irm | iex`.
  $SelfDir = $null
  if ($PSCommandPath -and (Split-Path -Leaf $PSCommandPath) -eq 'install.ps1') {
    $Candidate = Split-Path -Parent $PSCommandPath
    if (Test-Path -LiteralPath (Join-Path $Candidate $Marker)) { $SelfDir = $Candidate }
  }

  $SiteUrl = $DefaultSiteUrl
  if ($SelfDir -and (Test-Path -LiteralPath (Join-Path $SelfDir $SiteFile))) {
    $SiteUrl = "$(Get-Content -LiteralPath (Join-Path $SelfDir $SiteFile) -TotalCount 1)".Trim()
  }
  if ($env:FILM_X_SITE_URL) { $SiteUrl = $env:FILM_X_SITE_URL.Trim() }
  if (-not $SiteUrl.EndsWith('/')) { $SiteUrl += '/' }
  $Parsed = $null
  if (-not [Uri]::TryCreate($SiteUrl, [UriKind]::Absolute, [ref]$Parsed)) {
    Fail "FILM_X_SITE_URL is not a valid URL: $SiteUrl"
  }
  # Same rule as the server: plain http only for a site on this computer.
  $Loopback = @('localhost', '127.0.0.1', '[::1]') -contains $Parsed.Host
  if (-not ($Parsed.Scheme -eq 'https' -or ($Parsed.Scheme -eq 'http' -and $Loopback))) {
    Fail "FILM_X_SITE_URL must use https (http is only allowed for localhost): $SiteUrl"
  }

  if ($env:FILM_X_MCP_HOME) {
    $InstallDir = $env:FILM_X_MCP_HOME
  } elseif ($SelfDir) {
    $InstallDir = $SelfDir
  } elseif ($env:LOCALAPPDATA) {
    $InstallDir = Join-Path $env:LOCALAPPDATA 'film-x-mcp'
  } else {
    Fail 'LOCALAPPDATA is not set; set FILM_X_MCP_HOME to the install folder.'
  }
  if (-not [IO.Path]::IsPathRooted($InstallDir)) {
    Fail "FILM_X_MCP_HOME must be an absolute path: $InstallDir"
  }
  $InstallDir = [IO.Path]::GetFullPath($InstallDir).TrimEnd('\', '/')
  # $HOME is read-only in PowerShell, hence the different name.
  $UserHome = [Environment]::GetFolderPath('UserProfile').TrimEnd('\', '/')
  if ($InstallDir -eq [IO.Path]::GetPathRoot($InstallDir).TrimEnd('\', '/') -or
      $InstallDir -eq $UserHome) {
    Fail "Refusing to install into $InstallDir; choose a dedicated folder."
  }
  # An existing folder is only replaced when an earlier run of this script created it.
  if ((Test-Path -LiteralPath $InstallDir) -and
      -not (Test-Path -LiteralPath (Join-Path $InstallDir $Marker))) {
    Fail "$InstallDir already exists and was not created by this installer."
  }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js $MinNodeMajor or later is required; install it from https://nodejs.org/."
  }
  # Arguments without quotes: Windows PowerShell 5.1 mangles embedded double quotes.
  $NodeMajor = [int](& node -p 'parseInt(process.versions.node)')
  if ($NodeMajor -lt $MinNodeMajor) {
    Fail "Node.js $MinNodeMajor or later is required (found $(& node -v))."
  }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail 'npm is required; it ships with Node.js.'
  }
  # Desktop apps do not inherit the shell's PATH, so the config points at the real binary.
  $NodeBin = (& node -p 'process.execPath').Trim()

  # Staged next to the target so the final move stays on one volume.
  $Parent = Split-Path -Parent $InstallDir
  New-Item -ItemType Directory -Force -Path $Parent | Out-Null
  $Stage = "$InstallDir.tmp.$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
  New-Item -ItemType Directory -Path $Stage | Out-Null
  $Current = $null
  $Version = $null
  try {
    function Get-SiteFile([string]$File) {
      try {
        Invoke-WebRequest -UseBasicParsing -Uri "${SiteUrl}mcp/$File" `
          -OutFile (Join-Path $Stage $File)
      } catch {
        Fail "Could not download ${SiteUrl}mcp/$File. The site must run Film X 0.6.0 or later."
      }
    }

    # The checksums identify a release, so an install that matches them and still starts is current.
    Get-SiteFile 'SHA256SUMS'
    $InstalledServer = Join-Path $InstallDir 'server.mjs'
    $InstalledSums = Join-Path $InstallDir 'SHA256SUMS'
    if ((Test-Path -LiteralPath (Join-Path $InstallDir $Marker)) -and
        (Test-Path -LiteralPath $InstalledServer)) {
      $Output = & $NodeBin $InstalledServer --version
      if ($LASTEXITCODE -eq 0 -and $Output) { $Current = "$Output".Trim() }
    }
    $UpToDate = [bool]($Current -and (Test-Path -LiteralPath $InstalledSums) -and
      ((Get-FileHash -LiteralPath $InstalledSums).Hash -eq
        (Get-FileHash -LiteralPath (Join-Path $Stage 'SHA256SUMS')).Hash))

    if ($UpToDate) {
      [IO.File]::WriteAllText((Join-Path $InstallDir $SiteFile), $SiteUrl)
    } else {
      if ($Current) {
        Write-Host "Updating Film X MCP $Current from ${SiteUrl}mcp/"
      } else {
        Write-Host "Downloading the Film X MCP server from ${SiteUrl}mcp/"
      }
      # The installers stay in the install folder so it can update itself later.
      foreach ($File in 'server.mjs', 'package.json', 'install.sh', 'install.ps1') {
        Get-SiteFile $File
      }

      foreach ($Line in Get-Content -LiteralPath (Join-Path $Stage 'SHA256SUMS')) {
        if (-not $Line.Trim()) { continue }
        $Expected, $Name = $Line -split '\s+', 2
        $Actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $Stage $Name.Trim())).Hash
        if ($Actual -ne $Expected) { Fail 'The download is corrupted.' }
      }

      Write-Host 'Installing dependencies with npm'
      Push-Location -LiteralPath $Stage
      try {
        & npm install --omit=dev --no-audit --no-fund --loglevel=error | Out-Null
        $NpmExit = $LASTEXITCODE
      } finally {
        Pop-Location
      }
      if ($NpmExit -ne 0) {
        Fail 'npm install failed; check the network connection and run this again.'
      }

      $Version = "$(& $NodeBin (Join-Path $Stage 'server.mjs') --version)".Trim()
      if ($LASTEXITCODE -ne 0) { Fail 'The downloaded server does not start with this Node.js.' }
      New-Item -ItemType File -Path (Join-Path $Stage $Marker) | Out-Null
      [IO.File]::WriteAllText((Join-Path $Stage $SiteFile), $SiteUrl)

      if (Test-Path -LiteralPath $InstallDir) {
        $Old = "$InstallDir.old.$PID"
        Move-Item -LiteralPath $InstallDir -Destination $Old
        Move-Item -LiteralPath $Stage -Destination $InstallDir
        Remove-Item -LiteralPath $Old -Recurse -Force
      } else {
        Move-Item -LiteralPath $Stage -Destination $InstallDir
      }
    }
  } finally {
    if (Test-Path -LiteralPath $Stage) { Remove-Item -LiteralPath $Stage -Recurse -Force }
  }

  Write-Host ''
  if ($UpToDate) {
    Write-Host "Film X MCP $Current in $InstallDir is already up to date."
  } elseif ($Current) {
    Write-Host "Film X MCP is updated from $Current to $Version in $InstallDir"
  } else {
    Write-Host "Film X MCP $Version is installed in $InstallDir"
  }

  # ProgramFiles(x86) is missing on 32-bit Windows, so only existing roots are joined.
  $Roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA) | Where-Object { $_ }
  $Candidates = @($env:FILM_X_BROWSER_PATH)
  foreach ($Root in $Roots) {
    $Candidates += Join-Path $Root 'Google\Chrome\Application\chrome.exe'
    $Candidates += Join-Path $Root 'Microsoft\Edge\Application\msedge.exe'
  }
  $Browsers = $Candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
  if (-not $Browsers) {
    Write-Host ''
    Write-Host 'Warning: Google Chrome or Microsoft Edge was not found. Install one of them, or set'
    Write-Host 'FILM_X_BROWSER_PATH in the agent configuration to another Chromium-based browser.'
  }

  Write-Host ''
  # The server prints the configuration, so paths are escaped right for JSON and TOML.
  $PreviousSite = $env:FILM_X_SITE_URL
  $env:FILM_X_SITE_URL = $SiteUrl
  try {
    & $NodeBin (Join-Path $InstallDir 'server.mjs') --print-config
  } finally {
    $env:FILM_X_SITE_URL = $PreviousSite
  }
}
